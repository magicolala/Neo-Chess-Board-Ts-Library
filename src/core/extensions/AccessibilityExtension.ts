import type { ExtensionConfig, Square } from '../types';
import { FILES, RANKS, isWhitePiece, parseFEN, sqToFR } from '../utils';

export interface AccessibilityExtensionOptions {
  /**
   * Optional external container to mount the accessibility UI into.
   */
  container?: HTMLElement;
  /**
   * Enables keyboard navigation and move selection from the generated board.
   */
  enableKeyboard?: boolean;
  /**
   * ARIA label for the wrapping region.
   */
  regionLabel?: string;
  /**
   * ARIA label for the board grid.
   */
  boardLabel?: string;
  /**
   * Label describing the move submission input.
   */
  moveInputLabel?: string;
  /**
   * Politeness setting for announcements.
   */
  livePoliteness?: 'polite' | 'assertive';
}

export interface AccessibilityExtensionConfig extends AccessibilityExtensionOptions {
  id?: string;
}

const PIECE_SYMBOLS: Record<string, string> = {
  p: '♟',
  r: '♜',
  n: '♞',
  b: '♝',
  q: '♛',
  k: '♚',
  P: '♙',
  R: '♖',
  N: '♘',
  B: '♗',
  Q: '♕',
  K: '♔',
};

const PIECE_NAMES: Record<string, string> = {
  p: 'pawn',
  r: 'rook',
  n: 'knight',
  b: 'bishop',
  q: 'queen',
  k: 'king',
};

const BRAILLE_BASE: Record<string, string> = {
  p: '⠏',
  r: '⠗',
  n: '⠝',
  b: '⠃',
  q: '⠟',
  k: '⠅',
};

const BRAILLE_EMPTY = '⠄';

const DEFAULT_OPTIONS: Required<
  Pick<
    AccessibilityExtensionOptions,
    'enableKeyboard' | 'regionLabel' | 'boardLabel' | 'moveInputLabel' | 'livePoliteness'
  >
> = {
  enableKeyboard: true,
  regionLabel: 'Accessible chess controls',
  boardLabel: 'Accessible chessboard',
  moveInputLabel: 'Enter a move in coordinate notation',
  livePoliteness: 'polite',
};

type CleanupFn = () => void;

function describeSquare(square: Square, piece: string | null): string {
  if (!piece) {
    return `Square ${square} is empty.`;
  }
  const color = isWhitePiece(piece) ? 'white' : 'black';
  const name = PIECE_NAMES[piece.toLowerCase()] ?? 'piece';
  return `${color} ${name} on ${square}.`;
}

function brailleForPiece(piece: string | null): string {
  if (!piece) {
    return BRAILLE_EMPTY;
  }
  const base = BRAILLE_BASE[piece.toLowerCase()];
  if (!base) {
    return BRAILLE_EMPTY;
  }
  return isWhitePiece(piece) ? `⠠${base}` : base;
}

function clampIndex(value: number) {
  return Math.max(0, Math.min(7, value));
}

export function createAccessibilityExtension(
  config: AccessibilityExtensionConfig = {},
): ExtensionConfig<AccessibilityExtensionOptions> {
  const { id = 'accessibility', ...configOptions } = config;

  return {
    id,
    options: configOptions,
    create(context) {
      const board = context.board;
      const root = board.getRootElement();
      const doc = root?.ownerDocument ?? (typeof document !== 'undefined' ? document : undefined);

      if (!doc) {
        return {};
      }

      const options = {
        ...DEFAULT_OPTIONS,
        ...context.options,
      } as Required<typeof DEFAULT_OPTIONS> & AccessibilityExtensionOptions;

      const cleanup: CleanupFn[] = [];
      const squareCleanup: CleanupFn[] = [];
      const squareButtons = new Map<Square, HTMLButtonElement>();

      const container = options.container ?? doc.createElement('section');
      if (!options.container) {
        cleanup.push(() => {
          container.remove();
        });
      }

      container.classList.add('ncb-accessibility-container');
      container.dataset.accessibilityExtension = 'true';
      container.setAttribute('role', 'region');
      container.setAttribute('aria-label', options.regionLabel ?? DEFAULT_OPTIONS.regionLabel);

      const statusId = `${id}-status`; // stable id for aria relationships
      const statusEl = doc.createElement('div');
      statusEl.classList.add('ncb-a11y-status');
      statusEl.dataset.status = 'true';
      statusEl.id = statusId;
      statusEl.setAttribute('role', 'status');
      statusEl.setAttribute('aria-live', options.livePoliteness ?? DEFAULT_OPTIONS.livePoliteness);
      statusEl.textContent = 'Accessibility controls ready.';

      const grid = doc.createElement('table');
      grid.classList.add('ncb-a11y-grid');
      grid.setAttribute('role', 'grid');
      grid.setAttribute('aria-label', options.boardLabel ?? DEFAULT_OPTIONS.boardLabel);
      grid.dataset.boardGrid = 'true';
      const gridBody = doc.createElement('tbody');
      grid.appendChild(gridBody);

      const outputsWrapper = doc.createElement('div');
      outputsWrapper.classList.add('ncb-a11y-outputs');

      const fenLabel = doc.createElement('h3');
      fenLabel.textContent = 'FEN';
      const fenOutput = doc.createElement('pre');
      fenOutput.dataset.fenOutput = 'true';
      fenOutput.setAttribute('aria-live', options.livePoliteness ?? DEFAULT_OPTIONS.livePoliteness);
      fenOutput.classList.add('ncb-a11y-fen');

      const brailleLabel = doc.createElement('h3');
      brailleLabel.textContent = 'Braille';
      const brailleOutput = doc.createElement('pre');
      brailleOutput.dataset.brailleOutput = 'true';
      brailleOutput.setAttribute(
        'aria-live',
        options.livePoliteness ?? DEFAULT_OPTIONS.livePoliteness,
      );
      brailleOutput.classList.add('ncb-a11y-braille');

      const moveListLabel = doc.createElement('h3');
      moveListLabel.textContent = 'Moves';
      const moveList = doc.createElement('ol');
      moveList.dataset.moveList = 'true';
      moveList.classList.add('ncb-a11y-moves');

      outputsWrapper.append(
        fenLabel,
        fenOutput,
        brailleLabel,
        brailleOutput,
        moveListLabel,
        moveList,
      );

      const moveForm = doc.createElement('form');
      moveForm.dataset.moveForm = 'true';
      moveForm.classList.add('ncb-a11y-move-form');
      const moveLabel = doc.createElement('label');
      moveLabel.textContent = options.moveInputLabel ?? DEFAULT_OPTIONS.moveInputLabel;
      moveLabel.setAttribute('for', `${id}-move-input`);
      const moveInput = doc.createElement('input');
      moveInput.type = 'text';
      moveInput.id = `${id}-move-input`;
      moveInput.name = 'move';
      moveInput.autocomplete = 'off';
      moveInput.setAttribute('aria-describedby', statusId);
      moveInput.placeholder = 'e2e4';
      const moveButton = doc.createElement('button');
      moveButton.type = 'submit';
      moveButton.textContent = 'Play move';
      moveForm.append(moveLabel, moveInput, moveButton);

      const enableKeyboard = options.enableKeyboard ?? DEFAULT_OPTIONS.enableKeyboard;
      let keyboardEnabled = enableKeyboard;
      let orientation = board.getOrientation();
      let selectedSquare: Square | null = null;
      let focusedSquare: Square | null = null;

      const setStatus = (message: string) => {
        statusEl.textContent = message;
      };

      const clearSquareHandlers = () => {
        while (squareCleanup.length) {
          const disposer = squareCleanup.pop();
          if (disposer) disposer();
        }
        squareButtons.clear();
      };

      const setActiveSquare = (square: Square, focusDom: boolean) => {
        if (!keyboardEnabled) {
          return;
        }
        const btn = squareButtons.get(square);
        if (!btn) {
          return;
        }
        for (const [sq, button] of squareButtons.entries()) {
          button.tabIndex = sq === square ? 0 : -1;
        }
        focusedSquare = square;
        if (focusDom) {
          btn.focus();
        }
      };

      const updateSelectionState = () => {
        for (const [sq, button] of squareButtons.entries()) {
          const isSelected = selectedSquare === sq;
          button.setAttribute('aria-pressed', isSelected ? 'true' : 'false');
          if (isSelected) {
            button.dataset.selected = 'true';
          } else {
            delete button.dataset.selected;
          }
        }
      };

      const rebuildGrid = () => {
        clearSquareHandlers();
        gridBody.innerHTML = '';
        let firstSquare: Square | null = null;

        for (let row = 0; row < 8; row++) {
          const tr = doc.createElement('tr');
          tr.setAttribute('role', 'row');
          for (let col = 0; col < 8; col++) {
            const td = doc.createElement('td');
            td.setAttribute('role', 'gridcell');
            const fileIndex = orientation === 'white' ? col : 7 - col;
            const rankIndex = orientation === 'white' ? 7 - row : row;
            const square = `${FILES[fileIndex]}${RANKS[rankIndex]}` as Square;
            const button = doc.createElement('button');
            button.type = 'button';
            button.classList.add('ncb-a11y-square');
            button.dataset.square = square;
            button.setAttribute('aria-pressed', 'false');
            if (keyboardEnabled) {
              button.tabIndex = -1;
            } else {
              button.tabIndex = -1;
              button.setAttribute('aria-disabled', 'true');
            }

            const clickHandler = () => {
              if (!keyboardEnabled) {
                return;
              }
              if (!focusedSquare) {
                setActiveSquare(square, false);
              }
              handleSquareActivation(square);
            };
            button.addEventListener('click', clickHandler);
            squareCleanup.push(() => button.removeEventListener('click', clickHandler));

            if (keyboardEnabled) {
              const keyHandler = (event: KeyboardEvent) => handleKeydown(event, square);
              const focusHandler = () => setActiveSquare(square, false);
              button.addEventListener('keydown', keyHandler);
              button.addEventListener('focus', focusHandler);
              squareCleanup.push(() => button.removeEventListener('keydown', keyHandler));
              squareCleanup.push(() => button.removeEventListener('focus', focusHandler));
            }

            td.appendChild(button);
            tr.appendChild(td);
            squareButtons.set(square, button);
            if (!firstSquare) {
              firstSquare = square;
            }
          }
          gridBody.appendChild(tr);
        }

        if (keyboardEnabled && (focusedSquare || selectedSquare || firstSquare)) {
          setActiveSquare((focusedSquare ?? selectedSquare ?? firstSquare) as Square, false);
        }

        updateSelectionState();
      };

      const updateMovesList = (history: string[]) => {
        moveList.innerHTML = '';
        for (let i = 0; i < history.length; i += 2) {
          const item = doc.createElement('li');
          const moveNumber = i / 2 + 1;
          const whiteMove = history[i] ?? '';
          const blackMove = history[i + 1];
          item.textContent = blackMove
            ? `${moveNumber}. ${whiteMove} ${blackMove}`
            : `${moveNumber}. ${whiteMove}`;
          moveList.appendChild(item);
        }
      };

      const updateBrailleOutput = (boardMatrix: (string | null)[][]) => {
        const lines: string[] = [];
        for (let row = 0; row < 8; row++) {
          const rankIndex = orientation === 'white' ? 7 - row : row;
          let line = '';
          for (let col = 0; col < 8; col++) {
            const fileIndex = orientation === 'white' ? col : 7 - col;
            const piece = boardMatrix[rankIndex]?.[fileIndex] ?? null;
            line += brailleForPiece(piece);
          }
          lines.push(line);
        }
        brailleOutput.textContent = lines.join('\n');
      };

      const refreshOutputs = () => {
        const nextOrientation = board.getOrientation();
        if (nextOrientation !== orientation) {
          orientation = nextOrientation;
          rebuildGrid();
        }
        const fen = board.getCurrentFEN();
        const parsed = parseFEN(fen);
        fenOutput.textContent = fen;
        fenOutput.setAttribute('aria-label', `FEN ${fen}`);
        fenOutput.dataset.turn = parsed.turn;

        for (const [square, button] of squareButtons.entries()) {
          const { f, r } = sqToFR(square);
          const piece = parsed.board[r]?.[f] ?? null;
          const symbol = piece ? (PIECE_SYMBOLS[piece] ?? PIECE_SYMBOLS[piece.toUpperCase()]) : '';
          button.textContent = symbol ?? '';
          if (piece) {
            button.setAttribute('data-piece', piece);
          } else {
            button.removeAttribute('data-piece');
          }
          button.setAttribute('aria-label', describeSquare(square, piece));
        }

        updateSelectionState();
        updateBrailleOutput(parsed.board);
        updateMovesList(board.getMoveHistory());
      };

      const moveFocusBy = (deltaFile: number, deltaRank: number, fallbackSquare: Square) => {
        if (!keyboardEnabled) {
          return;
        }
        const current = focusedSquare ?? fallbackSquare;
        const coords = sqToFR(current);
        const nextFile = clampIndex(coords.f + deltaFile);
        const nextRank = clampIndex(coords.r + deltaRank);
        const nextSquare = `${FILES[nextFile]}${RANKS[nextRank]}` as Square;
        setActiveSquare(nextSquare, true);
      };

      const handleKeydown = (event: KeyboardEvent, square: Square) => {
        if (!keyboardEnabled) {
          return;
        }
        const orientationNow = board.getOrientation();
        switch (event.key) {
          case 'ArrowUp':
            event.preventDefault();
            moveFocusBy(0, orientationNow === 'white' ? 1 : -1, square);
            break;
          case 'ArrowDown':
            event.preventDefault();
            moveFocusBy(0, orientationNow === 'white' ? -1 : 1, square);
            break;
          case 'ArrowLeft':
            event.preventDefault();
            moveFocusBy(orientationNow === 'white' ? -1 : 1, 0, square);
            break;
          case 'ArrowRight':
            event.preventDefault();
            moveFocusBy(orientationNow === 'white' ? 1 : -1, 0, square);
            break;
          case 'Enter':
          case ' ': // Space key
          case 'Spacebar':
            event.preventDefault();
            handleSquareActivation(square);
            break;
          default:
            break;
        }
      };

      const handleSquareActivation = (square: Square) => {
        if (!keyboardEnabled) {
          return;
        }

        if (!selectedSquare) {
          const piece = board.getPieceAt(square);
          if (!piece) {
            setStatus(`Square ${square} is empty.`);
            selectedSquare = null;
            updateSelectionState();
            return;
          }
          selectedSquare = square;
          updateSelectionState();
          setStatus(`Selected ${describeSquare(square, piece)}`);
          return;
        }

        if (selectedSquare === square) {
          selectedSquare = null;
          updateSelectionState();
          setStatus('Selection cleared.');
          return;
        }

        const attemptResult = board.attemptMove(selectedSquare, square);
        if (!attemptResult) {
          setStatus(`Illegal move from ${selectedSquare} to ${square}.`);
        }
        selectedSquare = null;
        updateSelectionState();
        setActiveSquare(square, true);
      };

      const submitHandler = (event: Event) => {
        event.preventDefault();
        const value = moveInput.value;
        if (!value.trim()) {
          return;
        }
        const ok = board.submitMove(value);
        if (ok) {
          moveInput.value = '';
          moveInput.removeAttribute('aria-invalid');
        } else {
          moveInput.setAttribute('aria-invalid', 'true');
          setStatus(`Unable to play move "${value.trim()}".`);
        }
      };

      moveForm.addEventListener('submit', submitHandler);
      cleanup.push(() => moveForm.removeEventListener('submit', submitHandler));

      const mount = () => {
        if (!container.contains(statusEl)) {
          container.append(statusEl, grid, outputsWrapper, moveForm);
        }
        if (!options.container) {
          root.appendChild(container);
        }
      };

      const resetSelection = () => {
        selectedSquare = null;
        updateSelectionState();
      };

      return {
        onInit() {
          mount();
          rebuildGrid();
          refreshOutputs();
        },
        onMove(_, payload) {
          resetSelection();
          refreshOutputs();
          const piece = board.getPieceAt(payload.to);
          const description = describeSquare(payload.to, piece);
          setStatus(`Move played: ${payload.from} to ${payload.to}. ${description}`);
          if (keyboardEnabled) {
            setActiveSquare(payload.to, true);
          }
        },
        onUpdate() {
          refreshOutputs();
        },
        onIllegalMove(_, payload) {
          setStatus(`Illegal move from ${payload.from} to ${payload.to}: ${payload.reason}`);
        },
        onDestroy() {
          clearSquareHandlers();
          while (cleanup.length) {
            const disposer = cleanup.pop();
            if (disposer) disposer();
          }
        },
      };
    },
  };
}
