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

class PromotionDialogController {
  private overlay: HTMLDivElement | null = null;
  private dialog: HTMLDivElement | null = null;
  private buttons: HTMLButtonElement[] = [];
  private activeRequest: PromotionRequest | null = null;
  private detachBus: (() => void) | null = null;
  private keydownHandler: ((event: KeyboardEvent) => void) | null = null;
  private readonly root: HTMLElement;
  private readonly doc: Document;

  constructor(
    private readonly context: ExtensionContext<PromotionDialogExtensionOptions>,
    private readonly options: PromotionDialogExtensionOptions,
    private readonly pieces: PromotionPiece[],
    private readonly labels: Record<PromotionPiece, string>,
  ) {
    this.root = this.context.board.getRootElement();
    this.doc = this.root.ownerDocument ?? document;
  }

  initialize(ctx: ExtensionContext<PromotionDialogExtensionOptions>) {
    this.ensureOverlay();
    this.detachBus = ctx.registerExtensionPoint('promotion', this.handlePromotionRequest);
  }

  destroy() {
    this.detachKeyListener();
    if (this.detachBus) {
      this.detachBus();
      this.detachBus = null;
    }
    if (this.overlay && this.overlay.parentElement) {
      this.overlay.remove();
    }
    this.overlay = null;
    this.dialog = null;
    this.buttons = [];
    this.activeRequest = null;
  }

  private readonly handleOverlayClick = (event: MouseEvent) => {
    if (event.target === this.overlay && this.activeRequest) {
      this.activeRequest.cancel();
    }
  };

  private previewPiece(piece: PromotionPiece | null) {
    this.context.board.previewPromotionPiece(piece);
  }

  private resolveActiveRequest(piece: PromotionPiece) {
    const request = this.activeRequest;
    if (!request) {
      return;
    }
    request.resolve(piece);
  }

  private setScale(button: HTMLButtonElement, scale: string) {
    button.style.transform = scale;
  }

  private handleButtonPointerDown = (button: HTMLButtonElement) => {
    this.setScale(button, 'scale(0.97)');
  };

  private handleButtonPointerReset = (button: HTMLButtonElement) => {
    this.setScale(button, 'scale(1)');
  };

  private createPromotionButton(piece: PromotionPiece) {
    const button = this.doc.createElement('button');
    button.type = 'button';
    button.className = this.options.buttonClassName ?? 'ncb-promotion-button';
    button.textContent = this.labels[piece];
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

    const handleResolve = () => this.resolveActiveRequest(piece);

    button.addEventListener('mouseenter', () => this.previewPiece(piece));
    button.addEventListener('mouseleave', () => this.previewPiece(null));
    button.addEventListener('focus', () => this.previewPiece(piece));
    button.addEventListener('blur', () => this.previewPiece(null));
    button.addEventListener('click', handleResolve);

    button.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        handleResolve();
      }
    });

    button.addEventListener('pointerdown', () => this.handleButtonPointerDown(button));
    button.addEventListener('pointerup', () => this.handleButtonPointerReset(button));
    button.addEventListener('pointerleave', () => this.handleButtonPointerReset(button));

    return button;
  }

  private ensureOverlay() {
    if (this.overlay) {
      return;
    }

    this.overlay = this.doc.createElement('div');
    this.overlay.className = this.options.className || 'ncb-promotion-overlay';
    Object.assign(this.overlay.style, {
      position: 'absolute',
      inset: '0',
      display: 'none',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'rgba(15, 23, 42, 0.55)',
      zIndex: '30',
    });
    this.overlay.setAttribute('role', 'presentation');

    this.dialog = this.doc.createElement('div');
    this.dialog.className = 'ncb-promotion-dialog';
    Object.assign(this.dialog.style, {
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
    this.dialog.setAttribute('role', 'dialog');
    this.dialog.setAttribute('aria-modal', 'true');

    const titleText = this.options.title ?? 'Choose a promotion piece';
    const heading = this.doc.createElement('h2');
    heading.textContent = titleText;
    heading.style.margin = '0';
    heading.style.fontSize = '1.1rem';
    heading.style.fontWeight = '600';
    this.dialog.append(heading);

    const descriptionText =
      this.options.description ?? 'Select the piece to complete your pawn promotion.';
    const description = this.doc.createElement('p');
    description.textContent = descriptionText;
    description.style.margin = '0';
    description.style.fontSize = '0.9rem';
    description.style.opacity = '0.85';
    this.dialog.append(description);

    const buttonsRow = this.doc.createElement('div');
    Object.assign(buttonsRow.style, {
      display: 'grid',
      gridTemplateColumns: `repeat(${this.pieces.length}, minmax(0, 1fr))`,
      gap: '8px',
    });

    this.buttons = [];
    for (const piece of this.pieces) {
      const button = this.createPromotionButton(piece);
      buttonsRow.append(button);
      this.buttons.push(button);
    }

    this.overlay.addEventListener('click', this.handleOverlayClick);

    this.dialog.append(buttonsRow);
    this.overlay.append(this.dialog);
    this.root.append(this.overlay);
  }

  private detachKeyListener() {
    if (!this.keydownHandler) {
      return;
    }
    const documentRef = this.dialog?.ownerDocument ?? this.doc;
    documentRef.removeEventListener('keydown', this.keydownHandler);
    this.keydownHandler = null;
  }

  private closeOverlay() {
    if (!this.overlay) {
      return;
    }
    this.overlay.style.display = 'none';
    this.overlay.setAttribute('aria-hidden', 'true');
    this.detachKeyListener();
    this.activeRequest = null;
    this.context.board.previewPromotionPiece(null);
  }

  private attachKeyListener() {
    const documentRef = this.dialog?.ownerDocument ?? this.doc;
    this.detachKeyListener();
    this.keydownHandler = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && this.activeRequest) {
        event.stopPropagation();
        this.activeRequest.cancel();
      }
    };
    documentRef.addEventListener('keydown', this.keydownHandler);
  }

  private readonly handlePromotionRequest = (request: PromotionRequest) => {
    this.ensureOverlay();
    if (!this.overlay || !this.dialog) {
      return;
    }

    const originalResolve = request.resolve.bind(request);
    const originalCancel = request.cancel.bind(request);

    request.resolve = ((choice: PromotionPiece) => {
      request.resolve = originalResolve;
      request.cancel = originalCancel;
      this.closeOverlay();
      originalResolve(choice);
    }) as PromotionRequest['resolve'];

    request.cancel = (() => {
      request.resolve = originalResolve;
      request.cancel = originalCancel;
      this.closeOverlay();
      originalCancel();
    }) as PromotionRequest['cancel'];

    this.activeRequest = request;
    this.overlay.style.display = 'flex';
    this.overlay.setAttribute('aria-hidden', 'false');
    this.attachKeyListener();

    if (this.buttons[0]) {
      this.buttons[0].focus();
    }
  };
}

export function createPromotionDialogExtension(
  config: PromotionDialogExtensionConfig = {},
): ExtensionConfig<PromotionDialogExtensionOptions> {
  const { id, ...options } = config;

  return {
    id: id ?? 'promotion-dialog',
    options,
    create(context) {
      const pieces = options.pieces && options.pieces.length > 0 ? options.pieces : DEFAULT_PIECES;
      const labels: Record<PromotionPiece, string> = {
        ...DEFAULT_LABELS,
        ...options.labels,
      };
      const controller = new PromotionDialogController(context, options, pieces, labels);

      return {
        onInit(ctx: ExtensionContext<PromotionDialogExtensionOptions>) {
          controller.initialize(ctx);
        },
        onDestroy() {
          controller.destroy();
        },
      };
    },
  };
}
