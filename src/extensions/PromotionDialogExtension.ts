import type {
  ExtensionConfig,
  ExtensionContext,
  PromotionPiece,
  PromotionRequest,
} from '../core/types';

export interface PromotionDialogExtensionOptions {
  pieces?: PromotionPiece[];
  labels?: Partial<Record<PromotionPiece, string>>;
  title?: string;
  description?: string;
  className?: string;
  buttonClassName?: string;
}

export interface PromotionDialogExtensionConfig extends PromotionDialogExtensionOptions {
  id?: string;
}

const DEFAULT_LABELS: Record<PromotionPiece, string> = {
  q: 'Queen',
  r: 'Rook',
  b: 'Bishop',
  n: 'Knight',
};

const DEFAULT_PIECES: PromotionPiece[] = ['q', 'r', 'b', 'n'];

export function createPromotionDialogExtension(
  config: PromotionDialogExtensionConfig = {},
): ExtensionConfig<PromotionDialogExtensionOptions> {
  const { id, ...options } = config;

  return {
    id: id ?? 'promotion-dialog',
    options,
    create(context) {
      const pieces = options.pieces && options.pieces.length > 0 ? options.pieces : DEFAULT_PIECES;
      const root = context.board.getRootElement();
      const doc = root.ownerDocument ?? document;

      let overlay: HTMLDivElement | null = null;
      let dialog: HTMLDivElement | null = null;
      let buttons: HTMLButtonElement[] = [];
      let activeRequest: PromotionRequest | null = null;
      let detachBus: (() => void) | null = null;
      let keydownHandler: ((event: KeyboardEvent) => void) | null = null;

      const labels: Record<PromotionPiece, string> = {
        ...DEFAULT_LABELS,
        ...options.labels,
      };

      const ensureOverlay = () => {
        if (overlay) {
          return;
        }

        overlay = doc.createElement('div');
        overlay.className = options.className ? options.className : 'ncb-promotion-overlay';
        Object.assign(overlay.style, {
          position: 'absolute',
          inset: '0',
          display: 'none',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'rgba(15, 23, 42, 0.55)',
          zIndex: '30',
        });
        overlay.setAttribute('role', 'presentation');

        dialog = doc.createElement('div');
        dialog.className = 'ncb-promotion-dialog';
        Object.assign(dialog.style, {
          minWidth: '220px',
          padding: '16px',
          borderRadius: '12px',
          background: 'rgba(15, 23, 42, 0.92)',
          color: '#f9fafb',
          boxShadow: '0 20px 45px rgba(15, 23, 42, 0.45)',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
        });
        dialog.setAttribute('role', 'dialog');
        dialog.setAttribute('aria-modal', 'true');

        const titleText = options.title ?? 'Choose a promotion piece';
        const heading = doc.createElement('h2');
        heading.textContent = titleText;
        heading.style.margin = '0';
        heading.style.fontSize = '1.1rem';
        heading.style.fontWeight = '600';
        dialog.append(heading);

        const descriptionText =
          options.description ?? 'Select the piece to complete your pawn promotion.';
        const description = doc.createElement('p');
        description.textContent = descriptionText;
        description.style.margin = '0';
        description.style.fontSize = '0.9rem';
        description.style.opacity = '0.85';
        dialog.append(description);

        const buttonsRow = doc.createElement('div');
        Object.assign(buttonsRow.style, {
          display: 'grid',
          gridTemplateColumns: `repeat(${pieces.length}, minmax(0, 1fr))`,
          gap: '8px',
        });

        buttons = pieces.map((piece) => {
          const button = doc.createElement('button');
          button.type = 'button';
          button.className = options.buttonClassName ?? 'ncb-promotion-button';
          button.textContent = labels[piece];
          Object.assign(button.style, {
            padding: '10px 12px',
            borderRadius: '8px',
            border: '1px solid rgba(148, 163, 184, 0.4)',
            background: 'rgba(30, 41, 59, 0.8)',
            color: '#f8fafc',
            cursor: 'pointer',
            fontSize: '0.95rem',
            fontWeight: '600',
            transition: 'transform 0.12s ease, background 0.12s ease',
          });

          button.addEventListener('mouseenter', () => {
            context.board.previewPromotionPiece(piece);
          });
          button.addEventListener('mouseleave', () => {
            context.board.previewPromotionPiece(null);
          });
          button.addEventListener('focus', () => {
            context.board.previewPromotionPiece(piece);
          });
          button.addEventListener('blur', () => {
            context.board.previewPromotionPiece(null);
          });
          button.addEventListener('click', () => {
            const request = activeRequest;
            if (!request) {
              return;
            }
            request.resolve(piece);
          });

          button.addEventListener('keydown', (event) => {
            if (event.key === 'Enter' || event.key === ' ') {
              event.preventDefault();
              const request = activeRequest;
              if (!request) {
                return;
              }
              request.resolve(piece);
            }
          });

          button.addEventListener('pointerdown', () => {
            button.style.transform = 'scale(0.97)';
          });
          button.addEventListener('pointerup', () => {
            button.style.transform = 'scale(1)';
          });
          button.addEventListener('pointerleave', () => {
            button.style.transform = 'scale(1)';
          });

          buttonsRow.append(button);
          return button;
        });

        overlay.addEventListener('click', (event) => {
          if (event.target === overlay && activeRequest) {
            activeRequest.cancel();
          }
        });

        dialog.append(buttonsRow);
        overlay.append(dialog);
        root.append(overlay);
      };

      const detachKeyListener = () => {
        if (!keydownHandler) {
          return;
        }
        const documentRef = dialog?.ownerDocument ?? doc;
        documentRef.removeEventListener('keydown', keydownHandler);
        keydownHandler = null;
      };

      const closeOverlay = () => {
        if (!overlay) {
          return;
        }
        overlay.style.display = 'none';
        overlay.setAttribute('aria-hidden', 'true');
        detachKeyListener();
        activeRequest = null;
        context.board.previewPromotionPiece(null);
      };

      const attachKeyListener = () => {
        const documentRef = dialog?.ownerDocument ?? doc;
        detachKeyListener();
        keydownHandler = (event: KeyboardEvent) => {
          if (event.key === 'Escape' && activeRequest) {
            event.stopPropagation();
            activeRequest.cancel();
          }
        };
        documentRef.addEventListener('keydown', keydownHandler);
      };

      const handlePromotionRequest = (request: PromotionRequest) => {
        ensureOverlay();
        if (!overlay || !dialog) {
          return;
        }

        const originalResolve = request.resolve.bind(request);
        const originalCancel = request.cancel.bind(request);

        request.resolve = ((choice: PromotionPiece) => {
          request.resolve = originalResolve;
          request.cancel = originalCancel;
          closeOverlay();
          originalResolve(choice);
        }) as PromotionRequest['resolve'];

        request.cancel = (() => {
          request.resolve = originalResolve;
          request.cancel = originalCancel;
          closeOverlay();
          originalCancel();
        }) as PromotionRequest['cancel'];

        activeRequest = request;
        overlay.style.display = 'flex';
        overlay.setAttribute('aria-hidden', 'false');
        attachKeyListener();

        // Focus the first button for accessibility
        if (buttons[0]) {
          buttons[0].focus();
        }
      };

      return {
        onInit(ctx: ExtensionContext<PromotionDialogExtensionOptions>) {
          ensureOverlay();
          detachBus = ctx.registerExtensionPoint('promotion', handlePromotionRequest);
        },
        onDestroy() {
          detachKeyListener();
          if (detachBus) {
            detachBus();
            detachBus = null;
          }
          if (overlay && overlay.parentElement) {
            overlay.remove();
          }
          overlay = null;
          dialog = null;
          buttons = [];
          activeRequest = null;
        },
      };
    },
  };
}
