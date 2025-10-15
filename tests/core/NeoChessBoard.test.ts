import { NeoChessBoard } from '../../src/core/NeoChessBoard';
import { createArrowHighlightExtension } from '../../src/extensions/ArrowHighlightExtension';
import type {
  Arrow,
  SquareHighlight,
  PromotionRequest,
  Square,
  RulesAdapter,
  RulesMoveResponse,
  Move,
} from '../../src/core/types';
import { generateFileLabels, generateRankLabels, parseFEN, sqToFR } from '../../src/core/utils';

type MockCanvasElement = HTMLCanvasElement & {
  getContext: jest.MockedFunction<typeof HTMLCanvasElement.prototype.getContext>;
  getBoundingClientRect: jest.Mock<ReturnType<HTMLCanvasElement['getBoundingClientRect']>>;
};

const getPrivate = <T>(instance: NeoChessBoard, key: string): T =>
  Reflect.get(instance as unknown as Record<string, unknown>, key) as T;

const getOrientation = (instance: NeoChessBoard): 'white' | 'black' =>
  getPrivate<'white' | 'black'>(instance, 'orientation');

const getSoundEnabled = (instance: NeoChessBoard): boolean =>
  getPrivate<boolean>(instance, 'soundEnabled');

const getBoardState = (instance: NeoChessBoard): { turn: 'w' | 'b' } =>
  getPrivate<{ turn: 'w' | 'b' }>(instance, 'state');

const getMethodHost = (instance: NeoChessBoard): Record<string, (...args: unknown[]) => unknown> =>
  instance as unknown as Record<string, (...args: unknown[]) => unknown>;

type AudioMock = {
  play: jest.Mock<Promise<void>, []>;
  addEventListener: jest.Mock<void, [string, () => void]>;
  preload: string;
  volume: number;
  currentTime: number;
};

type AudioConstructor = new (src?: string) => HTMLAudioElement;

class FlexibleGeometryRulesAdapter implements RulesAdapter {
  private fen: string;
  private board: (string | null)[][];
  private turnColor: 'w' | 'b' = 'w';
  private readonly fileLabels: readonly string[];
  private readonly rankLabels: readonly string[];

  constructor(
    private readonly files: number,
    private readonly ranks: number,
  ) {
    this.fileLabels = generateFileLabels(files);
    this.rankLabels = generateRankLabels(ranks);
    this.board = Array.from({ length: ranks }, () => Array(files).fill(null));
    this.fen = this._buildFen();
  }

  setFEN(fen: string): void {
    const parsed = parseFEN(fen, { files: this.files, ranks: this.ranks });
    this.board = parsed.board.map((row) => [...row]);
    this.turnColor = parsed.turn;
    this.fen = this._buildFen();
  }

  getFEN(): string {
    return this.fen;
  }

  turn(): 'w' | 'b' {
    return this.turnColor;
  }

  movesFrom(_square: Square): Move[] {
    return [];
  }

  move({
    from,
    to,
    promotion,
  }: {
    from: Square;
    to: Square;
    promotion?: Move['promotion'];
  }): RulesMoveResponse {
    const fromIndices = sqToFR(from, this.fileLabels, this.rankLabels);
    const toIndices = sqToFR(to, this.fileLabels, this.rankLabels);

    const piece = this.board[fromIndices.r]?.[fromIndices.f];
    if (!piece) {
      return { ok: false, reason: 'no-piece' };
    }

    const isWhite = piece === piece.toUpperCase();
    const promotedPiece = promotion
      ? isWhite
        ? promotion.toUpperCase()
        : promotion.toLowerCase()
      : piece;

    this.board[fromIndices.r][fromIndices.f] = null;
    this.board[toIndices.r][toIndices.f] = promotedPiece;

    this.turnColor = this.turnColor === 'w' ? 'b' : 'w';
    this.fen = this._buildFen();

    return { ok: true, fen: this.fen };
  }

  private _buildFen(): string {
    const rows: string[] = [];
    for (let r = this.ranks - 1; r >= 0; r--) {
      let empty = 0;
      let row = '';
      for (let f = 0; f < this.files; f++) {
        const piece = this.board[r][f];
        if (!piece) {
          empty++;
          continue;
        }
        if (empty > 0) {
          row += empty.toString();
          empty = 0;
        }
        row += piece;
      }
      if (empty > 0) {
        row += empty.toString();
      }
      rows.push(row || '0');
    }
    return `${rows.join('/') || '0'} ${this.turnColor} - - 0 1`;
  }
}

let originalCreateElement: typeof document.createElement;
let headAppendChildSpy: jest.SpyInstance<Node, [node: Node]> | undefined;

const createMockElement = (tag: string): HTMLElement => {
  const baseCreate = originalCreateElement ?? Document.prototype.createElement;
  const element = baseCreate.call(document, tag) as HTMLElement;

  if (tag === 'canvas') {
    const canvas = element as MockCanvasElement;
    canvas.getBoundingClientRect = jest.fn(() => ({
      width: 400,
      height: 400,
      left: 0,
      top: 0,
      right: 400,
      bottom: 400,
      x: 0,
      y: 0,
      toJSON: () => {},
    }));

    const contextMock = {
      fillRect: jest.fn(),
      clearRect: jest.fn(),
      beginPath: jest.fn(),
      moveTo: jest.fn(),
      lineTo: jest.fn(),
      quadraticCurveTo: jest.fn(),
      rect: jest.fn(),
      arc: jest.fn(),
      ellipse: jest.fn(),
      closePath: jest.fn(),
      fill: jest.fn(),
      stroke: jest.fn(),
      strokeRect: jest.fn(),
      drawImage: jest.fn(),
      fillText: jest.fn(),
      measureText: jest.fn(() => ({ width: 0 })),
      createLinearGradient: jest.fn(() => ({ addColorStop: jest.fn() })),
      save: jest.fn(),
      restore: jest.fn(),
      translate: jest.fn(),
      scale: jest.fn(),
      fillStyle: '#000000',
      strokeStyle: '#000000',
      lineWidth: 1,
      lineCap: 'butt',
      lineJoin: 'miter',
      textBaseline: 'alphabetic',
      textAlign: 'start',
      globalAlpha: 1,
      globalCompositeOperation: 'source-over',
      font: '10px sans-serif',
      canvas,
    } as unknown as jest.Mocked<CanvasRenderingContext2D>;

    canvas.getContext = jest.fn(() => contextMock) as unknown as MockCanvasElement['getContext'];

    return canvas;
  }

  return element;
};

describe('NeoChessBoard Core', () => {
  let container: HTMLDivElement;
  let board: NeoChessBoard;

  beforeEach(() => {
    // Store original createElement
    originalCreateElement = document.createElement;

    // Mock document.createElement first
    document.createElement = jest.fn((tag) => createMockElement(tag));

    // Now create container using the mocked method
    container = document.createElement('div') as HTMLDivElement;

    // Mock document.head for style injection
    if (!document.head) {
      Object.defineProperty(document, 'head', {
        value: document.createElement('head'),
        configurable: true,
      });
    }
    headAppendChildSpy = jest
      .spyOn(document.head!, 'appendChild')
      .mockImplementation((node) => node);

    // Initialize board with container and options
    board = new NeoChessBoard(container, {
      theme: 'classic',
      size: 400,
      interactive: true,
    });
  });

  afterEach(() => {
    // Restore original createElement
    if (originalCreateElement) {
      document.createElement = originalCreateElement;
    }

    headAppendChildSpy?.mockRestore();

    if (board && typeof board.destroy === 'function') {
      board.destroy();
    }
  });

  describe('Initialization', () => {
    it('should create board instance', () => {
      expect(board).toBeDefined();
      expect(board).toBeInstanceOf(NeoChessBoard);
    });

    it('should setup DOM structure', () => {
      // Should have added canvas elements to container
      expect(container.children.length).toBeGreaterThan(0);
    });

    it('should initialize with starting position', () => {
      const fen = board.getPosition();
      expect(fen).toBeDefined();
      expect(typeof fen).toBe('string');
    });

    it('applies animationDurationInMs when provided', () => {
      board.destroy();
      board = new NeoChessBoard(container, { animationDurationInMs: 150 });

      expect(getPrivate<number>(board, 'animationMs')).toBe(150);
    });

    it('configures pointer bindings based on allowDragging option', () => {
      board.destroy();
      board = new NeoChessBoard(container, { allowDragging: false });

      expect(getPrivate<boolean>(board, '_globalPointerEventsAttached')).toBe(false);
      expect(getPrivate<boolean>(board, '_localPointerEventsAttached')).toBe(true);

      board.setDraggingEnabled(true);

      expect(getPrivate<boolean>(board, '_globalPointerEventsAttached')).toBe(true);
      expect(getPrivate<boolean>(board, '_localPointerEventsAttached')).toBe(false);
    });
  });

  describe('Board geometry configuration', () => {
    it('applies custom column and row counts', () => {
      const customContainer = document.createElement('div') as HTMLDivElement;
      const customBoard = new NeoChessBoard(customContainer, {
        chessboardColumns: 10,
        chessboardRows: 6,
      });

      const filesCount = getPrivate<number>(customBoard, 'filesCount');
      const ranksCount = getPrivate<number>(customBoard, 'ranksCount');

      expect(filesCount).toBe(10);
      expect(ranksCount).toBe(6);
      expect(customBoard.getRootElement().style.aspectRatio).toBe('10 / 6');

      customBoard.destroy();
    });
  });

  describe('FEN handling', () => {
    it('should set and get FEN position', () => {
      const testFEN = 'r1bqkb1r/pppp1ppp/2n2n2/4p3/2B1P3/5N2/PPPP1PPP/RNBQK2R b KQkq - 4 4';

      board.setFEN(testFEN);
      expect(board.getPosition()).toBe(testFEN);
    });

    it('should handle immediate position changes', () => {
      const testFEN = 'r1bqk2r/pppp1ppp/2n2n2/2b1p3/2B1P3/3P1N2/PPP2PPP/RNBQK2R b KQkq - 0 5';

      expect(() => {
        board.setFEN(testFEN, true);
      }).not.toThrow();
    });
  });

  describe('Event system', () => {
    it('should support event subscription', () => {
      const handler = jest.fn();

      const unsubscribe = board.on('update', handler);

      expect(typeof unsubscribe).toBe('function');
    });

    it('should emit update events on position change', () => {
      const handler = jest.fn();
      board.on('update', handler);

      const testFEN = 'r1bqk2r/pppp1ppp/2n2n2/2b1p3/2B1P3/3P1N2/PPP2PPP/RNBQK2R b KQkq - 0 5';
      board.setFEN(testFEN);

      expect(handler).toHaveBeenCalledWith(expect.objectContaining({ fen: expect.any(String) }));
    });
  });

  describe('Customization', () => {
    it('applies custom square styles during rendering', () => {
      board.setLightSquareStyle({ fill: '#ffcc00' });
      board.setDarkSquareStyle({ fill: '#0033ff', stroke: '#111111', strokeWidth: 2 });

      const ctx = getPrivate<CanvasRenderingContext2D>(board, 'ctxB');
      const appliedFills: Array<string | CanvasGradient | CanvasPattern> = [];
      const originalFillRect = ctx.fillRect;
      ctx.fillRect = jest.fn((...args: Parameters<typeof originalFillRect>) => {
        appliedFills.push(ctx.fillStyle);
        return originalFillRect.apply(ctx, args);
      });

      board.renderAll();

      expect(appliedFills).toContain('#0033ff');
      expect(appliedFills).toContain('#ffcc00');
      expect(ctx.strokeRect).toHaveBeenCalled();
    });

    it('applies boardStyle to the root element', () => {
      board.setBoardStyle({ borderRadius: '4px' });
      expect(container.style.borderRadius).toBe('4px');
      board.setBoardStyle(undefined);
      expect(container.style.borderRadius).toBe('');
    });

    it('respects the showNotation alias', () => {
      const notationBoard = new NeoChessBoard(container, { showNotation: true });
      expect(getPrivate<boolean>(notationBoard, 'showSquareNames')).toBe(true);
      notationBoard.setShowNotation(false);
      expect(getPrivate<boolean>(notationBoard, 'showSquareNames')).toBe(false);
      notationBoard.destroy();
    });

    it('renders custom square overlays when a squareRenderer is provided', () => {
      board.destroy();
      const overlayBoard = new NeoChessBoard(container, {
        squareRenderer: ({ element }) => {
          element.textContent = 'X';
        },
      });
      overlayBoard.renderAll();

      const overlays = Array.from(container.querySelectorAll('.ncb-square-overlay'));
      const overlay = overlays[overlays.length - 1];
      expect(overlay).toBeTruthy();
      expect(overlay!.children.length).toBe(64);
      expect((overlay!.children[0] as HTMLElement).textContent).toBe('X');
      overlayBoard.destroy();
    });

    it('renders custom piece overlays when pieces renderers are provided', () => {
      board.destroy();
      const piecesBoard = new NeoChessBoard(container, {
        pieces: {
          P: ({ element }) => {
            element.textContent = 'W';
          },
          p: ({ element }) => {
            element.textContent = 'B';
          },
        },
      });
      piecesBoard.renderAll();

      const overlays = Array.from(container.querySelectorAll('.ncb-piece-overlay'));
      const overlay = overlays[overlays.length - 1];
      expect(overlay).toBeTruthy();
      expect(overlay!.children.length).toBeGreaterThan(0);

      piecesBoard.setPieceRenderers(undefined);
      piecesBoard.renderAll();
      expect(overlay!.children.length).toBe(0);
      piecesBoard.destroy();
    });
  });

  describe('Rendering', () => {
    it('should have render methods', () => {
      expect(typeof board.renderAll).toBe('function');
    });

    it('should handle resize operations', () => {
      expect(() => {
        board.resize();
      }).not.toThrow();
    });
  });

  describe('Configuration', () => {
    it('should accept theme configuration', () => {
      expect(() => {
        new NeoChessBoard(container, { theme: 'midnight' });
      }).not.toThrow();
    });

    it('should accept orientation configuration', () => {
      expect(() => {
        new NeoChessBoard(container, { orientation: 'black' });
      }).not.toThrow();
    });

    it('should follow side to move when autoFlip is enabled', () => {
      const autoBoard = new NeoChessBoard(container, { autoFlip: true });
      expect(getOrientation(autoBoard)).toBe('white');

      const blackTurnFen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR b KQkq - 0 1';
      autoBoard.setFEN(blackTurnFen, true);

      expect(getOrientation(autoBoard)).toBe('black');
      autoBoard.destroy();
    });

    it('should update orientation immediately when enabling autoFlip later', () => {
      const manualBoard = new NeoChessBoard(container, { orientation: 'white' });
      const blackTurnFen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR b KQkq - 0 1';

      manualBoard.setFEN(blackTurnFen, true);
      expect(getOrientation(manualBoard)).toBe('white');

      manualBoard.setAutoFlip(true);
      expect(getOrientation(manualBoard)).toBe('black');
      manualBoard.destroy();
    });

    it('should accept interactive configuration', () => {
      expect(() => {
        new NeoChessBoard(container, { interactive: false });
      }).not.toThrow();
    });
  });

  describe('Custom piece sets', () => {
    it('should draw custom sprites when a piece set is provided', async () => {
      const ctx = getPrivate<CanvasRenderingContext2D>(board, 'ctxP');
      const drawImageMock = ctx.drawImage as jest.Mock;
      drawImageMock.mockClear();

      const customCanvas = document.createElement('canvas');

      await board.setPieceSet({
        pieces: {
          P: { image: customCanvas },
        },
      });

      const usedCustomSprite = drawImageMock.mock.calls.some((call) => call[0] === customCanvas);
      expect(usedCustomSprite).toBe(true);
    });

    it('should revert to default sprites when the piece set is cleared', async () => {
      const ctx = getPrivate<CanvasRenderingContext2D>(board, 'ctxP');
      const drawImageMock = ctx.drawImage as jest.Mock;
      const customCanvas = document.createElement('canvas');

      await board.setPieceSet({
        pieces: {
          P: { image: customCanvas },
        },
      });

      drawImageMock.mockClear();

      await board.setPieceSet(undefined);

      const spriteSheet = getPrivate<{ getSheet(): HTMLCanvasElement | OffscreenCanvas }>(
        board,
        'sprites',
      ).getSheet();
      const usedDefaultSprite = drawImageMock.mock.calls.some((call) => call[0] === spriteSheet);
      expect(usedDefaultSprite).toBe(true);
    });
  });

  describe('Cleanup', () => {
    it('should have destroy method for cleanup', () => {
      expect(typeof board.destroy).toBe('function');
    });

    it('should not throw during destruction', () => {
      expect(() => {
        board.destroy();
      }).not.toThrow();
    });
  });

  describe('Feature toggles and drawing manager integration', () => {
    it('should initialize sound when enabling sound after construction', () => {
      const localContainer = document.createElement('div') as HTMLDivElement;
      const silentBoard = new NeoChessBoard(localContainer, {
        soundEnabled: false,
        soundUrl: 'mock-sound.mp3',
      });

      const initSpy = jest
        .spyOn(getMethodHost(silentBoard), '_initializeSound')
        .mockImplementation(() => {});

      silentBoard.setSoundEnabled(true);

      expect(getSoundEnabled(silentBoard)).toBe(true);
      expect(initSpy).toHaveBeenCalledTimes(1);

      initSpy.mockRestore();
      silentBoard.destroy();
    });

    describe('per-color move sounds', () => {
      let originalAudio: AudioConstructor | undefined;
      let audioInstances: Record<string, AudioMock>;

      beforeEach(() => {
        audioInstances = {};
        originalAudio = globalThis.Audio as AudioConstructor | undefined;
        const audioFactory = jest.fn((src: string) => {
          const audio: AudioMock = {
            play: jest.fn().mockResolvedValue(undefined),
            addEventListener: jest.fn(),
            preload: 'auto',
            volume: 0.3,
            currentTime: 0,
          };
          audioInstances[src] = audio;
          return audio as unknown as HTMLAudioElement;
        });
        globalThis.Audio = audioFactory as unknown as AudioConstructor;
      });

      afterEach(() => {
        if (originalAudio) {
          globalThis.Audio = originalAudio;
        } else {
          Reflect.deleteProperty(
            globalThis as typeof globalThis & { Audio?: AudioConstructor },
            'Audio',
          );
        }
      });

      it('should play color-specific sounds when provided', () => {
        const localContainer = document.createElement('div') as HTMLDivElement;
        const soundBoard = new NeoChessBoard(localContainer, {
          soundUrls: {
            white: 'white-sound.mp3',
            black: 'black-sound.mp3',
          },
        });
        const soundMethods = getMethodHost(soundBoard);

        const whiteSound = audioInstances['white-sound.mp3'];
        const blackSound = audioInstances['black-sound.mp3'];

        expect(whiteSound).toBeDefined();
        expect(blackSound).toBeDefined();

        whiteSound.currentTime = 2;
        getBoardState(soundBoard).turn = 'b';
        soundMethods._playMoveSound();

        expect(whiteSound.play).toHaveBeenCalledTimes(1);
        expect(whiteSound.currentTime).toBe(0);
        expect(blackSound.play).not.toHaveBeenCalled();

        blackSound.currentTime = 3;
        getBoardState(soundBoard).turn = 'w';
        soundMethods._playMoveSound();

        expect(blackSound.play).toHaveBeenCalledTimes(1);
        expect(blackSound.currentTime).toBe(0);

        soundBoard.destroy();
      });

      it('should fall back to the default move sound when a color-specific sound is missing', () => {
        const localContainer = document.createElement('div') as HTMLDivElement;
        const soundBoard = new NeoChessBoard(localContainer, {
          soundUrl: 'default-sound.mp3',
          soundUrls: {
            black: 'black-only.mp3',
          },
        });
        const soundMethods = getMethodHost(soundBoard);

        const defaultSound = audioInstances['default-sound.mp3'];
        const blackSound = audioInstances['black-only.mp3'];

        expect(defaultSound).toBeDefined();
        expect(blackSound).toBeDefined();

        defaultSound.currentTime = 5;
        getBoardState(soundBoard).turn = 'b';
        soundMethods._playMoveSound();

        expect(defaultSound.play).toHaveBeenCalledTimes(1);
        expect(defaultSound.currentTime).toBe(0);

        blackSound.currentTime = 4;
        getBoardState(soundBoard).turn = 'w';
        soundMethods._playMoveSound();

        expect(blackSound.play).toHaveBeenCalledTimes(1);
        expect(blackSound.currentTime).toBe(0);

        soundBoard.destroy();
      });
    });

    it('should toggle arrow visibility and trigger rerender', () => {
      const renderSpy = jest.spyOn(board, 'renderAll');
      renderSpy.mockClear();

      board.setShowArrows(false);

      expect(getPrivate<boolean>(board, 'showArrows')).toBe(false);
      expect(renderSpy).toHaveBeenCalled();

      renderSpy.mockClear();
      board.setShowArrows(true);

      expect(getPrivate<boolean>(board, 'showArrows')).toBe(true);
      expect(renderSpy).toHaveBeenCalled();

      renderSpy.mockRestore();
    });

    it('should toggle highlight visibility', () => {
      const renderSpy = jest.spyOn(board, 'renderAll');
      renderSpy.mockClear();

      board.setShowHighlights(false);

      expect(getPrivate<boolean>(board, 'showHighlights')).toBe(false);
      expect(renderSpy).toHaveBeenCalled();

      renderSpy.mockRestore();
    });

    it('should toggle legal highlight flag', () => {
      const renderSpy = jest.spyOn(board, 'renderAll');
      renderSpy.mockClear();

      board.setHighlightLegal(false);

      expect(getPrivate<boolean>(board, 'highlightLegal')).toBe(false);
      expect(renderSpy).toHaveBeenCalled();

      renderSpy.mockRestore();
    });

    it('should update drawing manager when showing square names', () => {
      const renderSpy = jest.spyOn(board, 'renderAll');
      const showSquareNamesSpy = jest.spyOn(board.drawingManager, 'setShowSquareNames');

      renderSpy.mockClear();

      board.setShowSquareNames(true);

      expect(getPrivate<boolean>(board, 'showSquareNames')).toBe(true);
      expect(showSquareNamesSpy).toHaveBeenCalledWith(true);
      expect(renderSpy).toHaveBeenCalled();

      showSquareNamesSpy.mockRestore();
      renderSpy.mockRestore();
    });

    it('should clear premoves when disabling them', () => {
      const renderSpy = jest.spyOn(board, 'renderAll');
      const clearSpy = jest.spyOn(board.drawingManager, 'clearPremove');

      renderSpy.mockClear();

      board.setAllowPremoves(false);

      expect(getPrivate<boolean>(board, 'allowPremoves')).toBe(false);
      expect(clearSpy).toHaveBeenCalled();
      expect(renderSpy).toHaveBeenCalled();

      clearSpy.mockRestore();
      renderSpy.mockRestore();
    });

    it('should not set premove when premoves are disabled', () => {
      const setSpy = jest.spyOn(board.drawingManager, 'setPremoveFromObject');

      board.setAllowPremoves(false);
      setSpy.mockClear();

      board.setPremove({ from: 'e2', to: 'e4' });

      expect(setSpy).not.toHaveBeenCalled();

      setSpy.mockRestore();
    });

    it('should forward premove operations to drawing manager when enabled', () => {
      const renderSpy = jest.spyOn(board, 'renderAll');
      const setSpy = jest.spyOn(board.drawingManager, 'setPremoveFromObject');
      const clearSpy = jest.spyOn(board.drawingManager, 'clearPremove');

      renderSpy.mockClear();

      board.setAllowPremoves(true);
      board.setPremove({ from: 'e2', to: 'e4' });

      expect(setSpy).toHaveBeenCalledWith({ from: 'e2', to: 'e4' });
      expect(renderSpy).toHaveBeenCalled();

      board.drawingManager.setPremove('e7', 'e5');
      expect(board.getPremove()).toMatchObject({ from: 'e7', to: 'e5' });

      renderSpy.mockClear();
      board.clearPremove();

      expect(clearSpy).toHaveBeenCalled();
      expect(renderSpy).toHaveBeenCalled();

      clearSpy.mockRestore();
      setSpy.mockRestore();
      renderSpy.mockRestore();
    });
  });

  describe('Drawing helpers', () => {
    it('should add arrows using both signature styles', () => {
      const renderSpy = jest.spyOn(board, 'renderAll');
      const simpleArrowSpy = jest.spyOn(board.drawingManager, 'addArrow');
      const fullArrowSpy = jest.spyOn(board.drawingManager, 'addArrowFromObject');

      renderSpy.mockClear();

      board.addArrow({ from: 'a2', to: 'a4' });

      expect(simpleArrowSpy).toHaveBeenCalledWith({ from: 'a2', to: 'a4' });
      expect(renderSpy).toHaveBeenCalled();

      renderSpy.mockClear();
      board.addArrow({
        from: 'b1',
        to: 'c3',
        color: '#123456',
        knightMove: true,
      });

      expect(fullArrowSpy).toHaveBeenCalledWith({
        from: 'b1',
        to: 'c3',
        color: '#123456',
        knightMove: true,
      });
      expect(renderSpy).toHaveBeenCalled();

      fullArrowSpy.mockRestore();
      simpleArrowSpy.mockRestore();
      renderSpy.mockRestore();
    });

    it('should remove and clear arrows', () => {
      const renderSpy = jest.spyOn(board, 'renderAll');
      const removeSpy = jest.spyOn(board.drawingManager, 'removeArrow');
      const clearSpy = jest.spyOn(board.drawingManager, 'clearArrows');

      renderSpy.mockClear();

      board.removeArrow('a2', 'a4');
      expect(removeSpy).toHaveBeenCalledWith('a2', 'a4');
      expect(renderSpy).toHaveBeenCalled();

      renderSpy.mockClear();
      board.clearArrows();
      expect(clearSpy).toHaveBeenCalled();
      expect(renderSpy).toHaveBeenCalled();

      clearSpy.mockRestore();
      removeSpy.mockRestore();
      renderSpy.mockRestore();
    });

    it('should forward arrow options and control flags to the drawing manager', () => {
      const arrowOptions = { width: 6, opacity: 0.5 };
      const setArrowOptionsSpy = jest.spyOn(board.drawingManager, 'setArrowOptions');
      const setAllowDrawingSpy = jest.spyOn(board.drawingManager, 'setAllowDrawingArrows');
      const setClearOnClickSpy = jest.spyOn(board.drawingManager, 'setClearArrowsOnClick');
      const renderSpy = jest.spyOn(board, 'renderAll');

      renderSpy.mockClear();
      board.setArrowOptions(arrowOptions);
      expect(setArrowOptionsSpy).toHaveBeenCalledWith(arrowOptions);
      expect(renderSpy).toHaveBeenCalled();

      board.setAllowDrawingArrows(false);
      expect(setAllowDrawingSpy).toHaveBeenCalledWith(false);

      board.setClearArrowsOnClick(true);
      expect(setClearOnClickSpy).toHaveBeenCalledWith(true);

      setClearOnClickSpy.mockRestore();
      setAllowDrawingSpy.mockRestore();
      setArrowOptionsSpy.mockRestore();
      renderSpy.mockRestore();
    });

    it('should synchronise controlled arrows', () => {
      const renderSpy = jest.spyOn(board, 'renderAll');
      const setArrowsSpy = jest.spyOn(board.drawingManager, 'setArrows');
      const arrows: Arrow[] = [{ from: 'a2', to: 'a4', color: '#fff' }];

      renderSpy.mockClear();
      board.setArrows(arrows);

      expect(setArrowsSpy).toHaveBeenCalledWith(arrows);
      expect(renderSpy).toHaveBeenCalled();

      renderSpy.mockClear();
      board.setArrows(undefined);
      expect(setArrowsSpy).toHaveBeenCalledTimes(1);
      expect(renderSpy).not.toHaveBeenCalled();

      setArrowsSpy.mockRestore();
      renderSpy.mockRestore();
    });

    it('should invoke onArrowsChange callbacks when drawings change', () => {
      const callback = jest.fn();
      board.setOnArrowsChange(callback);

      board.addArrow({ from: 'a2', to: 'a4' });
      expect(callback).toHaveBeenCalledWith(
        expect.arrayContaining([expect.objectContaining({ from: 'a2', to: 'a4' })]),
      );

      callback.mockClear();
      board.clearArrows();
      expect(callback).toHaveBeenCalledWith([]);
    });

    it('should add highlights using both signature styles', () => {
      const renderSpy = jest.spyOn(board, 'renderAll');
      const simpleHighlightSpy = jest.spyOn(board.drawingManager, 'addHighlight');
      const fullHighlightSpy = jest.spyOn(board.drawingManager, 'addHighlightFromObject');

      renderSpy.mockClear();

      board.addHighlight('e4', 'green');
      expect(simpleHighlightSpy).toHaveBeenCalledWith('e4', 'green');
      expect(renderSpy).toHaveBeenCalled();

      renderSpy.mockClear();
      board.addHighlight({ square: 'e5', type: 'blue', opacity: 0.4 });
      expect(fullHighlightSpy).toHaveBeenCalledWith({ square: 'e5', type: 'blue', opacity: 0.4 });
      expect(renderSpy).toHaveBeenCalled();

      fullHighlightSpy.mockRestore();
      simpleHighlightSpy.mockRestore();
      renderSpy.mockRestore();
    });

    it('should remove and clear highlights', () => {
      const renderSpy = jest.spyOn(board, 'renderAll');
      const removeSpy = jest.spyOn(board.drawingManager, 'removeHighlight');
      const clearSpy = jest.spyOn(board.drawingManager, 'clearHighlights');

      renderSpy.mockClear();

      board.removeHighlight('e4');
      expect(removeSpy).toHaveBeenCalledWith('e4');
      expect(renderSpy).toHaveBeenCalled();

      renderSpy.mockClear();
      board.clearHighlights();
      expect(clearSpy).toHaveBeenCalled();
      expect(renderSpy).toHaveBeenCalled();

      clearSpy.mockRestore();
      removeSpy.mockRestore();
      renderSpy.mockRestore();
    });

    it('should export, import and clear drawing state', () => {
      const renderSpy = jest.spyOn(board, 'renderAll');
      const importSpy = jest.spyOn(board.drawingManager, 'importState');
      const clearAllSpy = jest.spyOn(board.drawingManager, 'clearAll');

      renderSpy.mockClear();

      board.addArrow({ from: 'a2', to: 'a4' });
      const exported = board.exportDrawings();

      expect(typeof exported).toBe('string');

      renderSpy.mockClear();
      board.importDrawings(exported!);
      expect(importSpy).toHaveBeenCalledWith(exported);
      expect(renderSpy).toHaveBeenCalled();

      renderSpy.mockClear();
      board.clearAllDrawings();
      expect(clearAllSpy).toHaveBeenCalled();
      expect(renderSpy).toHaveBeenCalled();

      clearAllSpy.mockRestore();
      importSpy.mockRestore();
      renderSpy.mockRestore();
    });
  });

  describe('Interaction behaviour', () => {
    let overlay: HTMLCanvasElement;
    let onPointerDown: (event: PointerEvent) => void;
    let onPointerMove: (event: PointerEvent) => void;
    let onPointerUp: (event: PointerEvent) => void;
    let overlayRect: DOMRect;

    const createPointerEventForSquare = (
      button: number,
      squareName: string,
      offset: { dx?: number; dy?: number } = {},
    ) => {
      const toCoordinates = getPrivate<(square: Square) => { x: number; y: number }>(
        board,
        '_sqToXY',
      ).bind(board);
      const { x, y } = toCoordinates(squareName as Square);
      const squareSize = getPrivate<number>(board, 'square');
      const canvasX = x + squareSize / 2;
      const canvasY = y + squareSize / 2;

      const baseEvent = {
        button,
        clientX:
          overlayRect.left + (canvasX * overlayRect.width) / overlay.width + (offset.dx ?? 0),
        clientY:
          overlayRect.top + (canvasY * overlayRect.height) / overlay.height + (offset.dy ?? 0),
        preventDefault: jest.fn(),
        shiftKey: false,
        ctrlKey: false,
        altKey: false,
      } as Partial<PointerEvent>;

      return {
        event: baseEvent as PointerEvent,
        preventDefault: baseEvent.preventDefault as jest.Mock,
      };
    };

    beforeEach(() => {
      overlay = getPrivate<HTMLCanvasElement>(board, 'cOverlay');
      const pointerDown = getPrivate<(event: PointerEvent) => void>(board, '_onPointerDown');
      const pointerMove = getPrivate<(event: PointerEvent) => void>(board, '_onPointerMove');
      const pointerUp = getPrivate<(event: PointerEvent) => void>(board, '_onPointerUp');
      onPointerDown = pointerDown.bind(board);
      onPointerMove = pointerMove.bind(board);
      onPointerUp = pointerUp.bind(board);
      overlayRect = overlay.getBoundingClientRect();
    });

    it('cancels an active drag on right-click and skips drawing actions', () => {
      const rightDownSpy = jest.spyOn(board.drawingManager, 'handleRightMouseDown');
      const rightUpSpy = jest.spyOn(board.drawingManager, 'handleRightMouseUp');
      const highlightSpy = jest.spyOn(board.drawingManager, 'handleHighlightClick');

      const initialFen = board.getPosition();

      const leftDown = createPointerEventForSquare(0, 'e2');
      onPointerDown(leftDown.event);
      expect(getPrivate<unknown>(board, '_dragging')).not.toBeNull();

      onPointerMove(createPointerEventForSquare(0, 'e4').event);

      const rightDown = createPointerEventForSquare(2, 'e4');
      onPointerDown(rightDown.event);

      expect(rightDown.preventDefault).toHaveBeenCalled();
      expect(getPrivate<unknown>(board, '_dragging')).toBeNull();
      expect(getPrivate<unknown>(board, '_selected')).toBeNull();
      expect(getPrivate<unknown>(board, '_legalCached')).toBeNull();
      expect(getPrivate<unknown>(board, '_hoverSq')).toBeNull();

      onPointerUp(createPointerEventForSquare(2, 'e4').event);

      expect(board.getPosition()).toBe(initialFen);
      expect(rightDownSpy).not.toHaveBeenCalled();
      expect(rightUpSpy).not.toHaveBeenCalled();
      expect(highlightSpy).not.toHaveBeenCalled();

      rightDownSpy.mockRestore();
      rightUpSpy.mockRestore();
      highlightSpy.mockRestore();
    });

    it('allows moving a piece by selecting it and clicking the destination square', () => {
      const moveSpy = jest.fn();
      board.on('move', moveSpy);

      const sourceClick = createPointerEventForSquare(0, 'e2');
      onPointerDown(sourceClick.event);
      onPointerUp(sourceClick.event);

      expect(getPrivate<unknown>(board, '_selected')).toBe('e2');
      expect(getPrivate<unknown>(board, '_dragging')).toBeNull();

      const destinationClick = createPointerEventForSquare(0, 'e4');
      onPointerDown(destinationClick.event);
      onPointerUp(destinationClick.event);

      expect(board.getPosition()).toBe(
        'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1',
      );
      expect(moveSpy).toHaveBeenCalledWith(expect.objectContaining({ from: 'e2', to: 'e4' }));
      expect(getPrivate<unknown>(board, '_selected')).toBeNull();
      expect(getPrivate<unknown>(board, '_legalCached')).toBeNull();
    });

    it('keeps the current selection when clicking an opposing piece for a capture with premoves enabled', () => {
      board.setFEN('8/8/8/5p2/4P3/8/8/4K2k w - - 0 1');
      const moveSpy = jest.fn();
      board.on('move', moveSpy);

      const selectSource = createPointerEventForSquare(0, 'e4');
      onPointerDown(selectSource.event);
      onPointerUp(selectSource.event);

      expect(getPrivate<unknown>(board, '_selected')).toBe('e4');
      expect(getPrivate<unknown>(board, '_dragging')).toBeNull();

      const targetClick = createPointerEventForSquare(0, 'f5');
      onPointerDown(targetClick.event);

      expect(getPrivate<unknown>(board, '_selected')).toBe('e4');
      expect(getPrivate<unknown>(board, '_dragging')).toBeNull();

      onPointerUp(targetClick.event);

      expect(moveSpy).toHaveBeenCalledWith(expect.objectContaining({ from: 'e4', to: 'f5' }));
      const pieceAt = getPrivate<(square: Square) => string | null>(board, '_pieceAt').bind(board);
      expect(pieceAt('f5')).toBe('P');
      expect(pieceAt('e4')).toBeNull();
      expect(getPrivate<unknown>(board, '_selected')).toBeNull();
    });

    it('still allows selecting a friendly piece after selecting an opposing one first', () => {
      board.setFEN('8/8/8/8/4P3/8/5p2/4K2k w - - 0 1');

      const enemyClick = createPointerEventForSquare(0, 'f2');
      onPointerDown(enemyClick.event);
      onPointerUp(enemyClick.event);

      expect(getPrivate<unknown>(board, '_selected')).toBe('f2');

      const friendlyClick = createPointerEventForSquare(0, 'e4');
      onPointerDown(friendlyClick.event);
      onPointerUp(friendlyClick.event);

      expect(getPrivate<unknown>(board, '_selected')).toBe('e4');
    });

    it('defers dragging until movement passes dragActivationDistance', () => {
      board.setDragActivationDistance(50);

      const down = createPointerEventForSquare(0, 'e2');
      onPointerDown(down.event);

      expect(getPrivate<unknown>(board, '_dragging')).toBeNull();
      expect(getPrivate<unknown>(board, '_pendingDrag')).not.toBeNull();

      const smallMove = createPointerEventForSquare(0, 'e2', { dx: 10 });
      onPointerMove(smallMove.event);

      expect(getPrivate<unknown>(board, '_dragging')).toBeNull();

      const largeMove = createPointerEventForSquare(0, 'e2', { dx: 80 });
      onPointerMove(largeMove.event);

      expect(getPrivate<unknown>(board, '_dragging')).not.toBeNull();

      onPointerUp(largeMove.event);
      board.setDragActivationDistance(0);
    });

    it('respects the canDragPiece evaluator when starting a drag', () => {
      board.setCanDragPiece(({ square }) => square !== 'e2');

      const disallowed = createPointerEventForSquare(0, 'e2');
      onPointerDown(disallowed.event);

      expect(getPrivate<unknown>(board, '_selected')).toBeNull();
      expect(getPrivate<unknown>(board, '_dragging')).toBeNull();

      const allowed = createPointerEventForSquare(0, 'd2');
      onPointerDown(allowed.event);

      expect(getPrivate<unknown>(board, '_dragging')).not.toBeNull();

      onPointerUp(allowed.event);
      board.setCanDragPiece(undefined);
    });

    it('drops on the last in-bounds square when allowDragOffBoard is false', () => {
      board.setAllowDragOffBoard(false);
      const startFen = board.getPosition();

      const start = createPointerEventForSquare(0, 'e2');
      onPointerDown(start.event);

      const mid = createPointerEventForSquare(0, 'e4');
      onPointerMove(mid.event);

      const outsideEvent = {
        button: 0,
        clientX: overlayRect.left - 20,
        clientY: overlayRect.top - 20,
        preventDefault: jest.fn(),
        shiftKey: false,
        ctrlKey: false,
        altKey: false,
      } as unknown as PointerEvent;

      onPointerUp(outsideEvent);

      expect(board.getPosition()).toBe(
        'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1',
      );

      board.setFEN(startFen, true);
      board.setAllowDragOffBoard(true);
    });

    it('cancels the move when dropping outside with allowDragOffBoard enabled', () => {
      const startFen = board.getPosition();

      const start = createPointerEventForSquare(0, 'e2');
      onPointerDown(start.event);

      const mid = createPointerEventForSquare(0, 'e4');
      onPointerMove(mid.event);

      const outsideEvent = {
        button: 0,
        clientX: overlayRect.left - 20,
        clientY: overlayRect.top - 20,
        preventDefault: jest.fn(),
        shiftKey: false,
        ctrlKey: false,
        altKey: false,
      } as unknown as PointerEvent;

      onPointerUp(outsideEvent);

      expect(board.getPosition()).toBe(startFen);
    });

    it('auto-scrolls the parent container when allowAutoScroll is enabled', () => {
      const scrollContainer = document.createElement('div');
      scrollContainer.style.overflow = 'auto';
      scrollContainer.style.width = '200px';
      scrollContainer.style.height = '200px';
      Object.defineProperty(scrollContainer, 'scrollWidth', { value: 1000, configurable: true });
      Object.defineProperty(scrollContainer, 'scrollHeight', { value: 1000, configurable: true });
      Object.defineProperty(scrollContainer, 'clientWidth', { value: 200, configurable: true });
      Object.defineProperty(scrollContainer, 'clientHeight', { value: 200, configurable: true });
      scrollContainer.getBoundingClientRect = jest.fn(() => ({
        width: 200,
        height: 200,
        left: 0,
        top: 0,
        right: 200,
        bottom: 200,
        x: 0,
        y: 0,
        toJSON: () => {},
      }));

      const scrollBy = jest.fn();
      scrollContainer.scrollBy = scrollBy as unknown as typeof scrollContainer.scrollBy;

      scrollContainer.appendChild(container);
      document.body.appendChild(scrollContainer);

      board.destroy();
      board = new NeoChessBoard(container, { allowAutoScroll: true });

      overlay = getPrivate<HTMLCanvasElement>(board, 'cOverlay');
      const pointerDown = getPrivate<(event: PointerEvent) => void>(board, '_onPointerDown');
      const pointerMove = getPrivate<(event: PointerEvent) => void>(board, '_onPointerMove');
      const pointerUp = getPrivate<(event: PointerEvent) => void>(board, '_onPointerUp');
      onPointerDown = pointerDown.bind(board);
      onPointerMove = pointerMove.bind(board);
      onPointerUp = pointerUp.bind(board);
      overlayRect = overlay.getBoundingClientRect();

      const down = createPointerEventForSquare(0, 'e2');
      onPointerDown(down.event);

      const nearEdge = createPointerEventForSquare(0, 'a2');
      onPointerMove(nearEdge.event);

      expect(scrollBy).toHaveBeenCalled();

      onPointerUp(nearEdge.event);
      scrollContainer.removeChild(container);
      document.body.removeChild(scrollContainer);
    });
  });

  describe('Animation behaviour', () => {
    it('skips requestAnimationFrame when showAnimations is disabled', () => {
      const rafSpy = jest.spyOn(globalThis, 'requestAnimationFrame');
      const renderSpy = jest.spyOn(board, 'renderAll');

      board.setShowAnimations(false);
      board.setFEN('rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1');

      expect(rafSpy).not.toHaveBeenCalled();
      expect(renderSpy).toHaveBeenCalled();

      board.setShowAnimations(true);
      board.setFEN('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1', true);

      rafSpy.mockRestore();
      renderSpy.mockRestore();
    });
  });

  describe('Extensions integration', () => {
    it('applies arrow/highlight extension hooks and cleans up on destroy', () => {
      const arrow: Arrow = { from: 'a2', to: 'a4', color: '#ff0000' };
      const highlight: SquareHighlight = { square: 'h7', type: 'circle', color: '#00ff00' };

      board.destroy();
      board = new NeoChessBoard(container, {
        theme: 'classic',
        extensions: [
          createArrowHighlightExtension({
            arrows: [arrow],
            highlights: [highlight],
            lastMoveColor: '#0000ff',
            persistOnUpdate: true,
          }),
        ],
      });

      expect(board.drawingManager.getArrows()).toEqual(
        expect.arrayContaining([expect.objectContaining({ from: 'a2', to: 'a4' })]),
      );
      expect(board.drawingManager.getHighlights()).toEqual(
        expect.arrayContaining([expect.objectContaining({ square: 'h7', type: 'circle' })]),
      );

      board.clearArrows();
      board.clearHighlights();
      const currentFen = board.getPosition();
      board.setFEN(currentFen);

      expect(board.drawingManager.getArrows()).toEqual(
        expect.arrayContaining([expect.objectContaining({ from: 'a2', to: 'a4' })]),
      );
      expect(board.drawingManager.getHighlights()).toEqual(
        expect.arrayContaining([expect.objectContaining({ square: 'h7' })]),
      );

      board.attemptMove('e2', 'e4');

      expect(
        board.drawingManager.getArrows().some((entry) => entry.from === 'e2' && entry.to === 'e4'),
      ).toBe(true);

      board.destroy();

      expect(board.drawingManager.getArrows()).toHaveLength(0);
      expect(board.drawingManager.getHighlights()).toHaveLength(0);
    });
  });

  describe('Promotion handling', () => {
    it('waits for a promotion choice before executing pawn promotions', () => {
      board.destroy();

      let captured: PromotionRequest | null = null;
      const promotionBoard = new NeoChessBoard(container, {
        onPromotionRequired: (request) => {
          captured = request;
        },
      });

      board = promotionBoard;
      promotionBoard.setFEN('3k4/4P3/8/8/8/8/8/4K3 w - - 0 1', true);

      const moveListener = jest.fn();
      promotionBoard.on('move', moveListener);

      const result = promotionBoard.attemptMove('e7', 'e8');

      expect(result).toBe(true);
      expect(captured).not.toBeNull();
      if (!captured) {
        throw new Error('Promotion request was not captured');
      }
      const request = captured as PromotionRequest;
      expect(request.mode).toBe('move');
      expect(request.choices).toEqual(['q', 'r', 'b', 'n']);
      expect(promotionBoard.isPromotionPending()).toBe(true);
      expect(promotionBoard.getPieceAt('e7')).toBe('P');
      expect(promotionBoard.getPieceAt('e8')).toBeNull();

      const pendingPreview = promotionBoard.drawingManager.getDrawingState().promotionPreview;
      expect(pendingPreview).toEqual(expect.objectContaining({ square: 'e8', piece: undefined }));

      promotionBoard.previewPromotionPiece('b');
      expect(promotionBoard.drawingManager.getDrawingState().promotionPreview).toEqual(
        expect.objectContaining({ piece: 'b' }),
      );

      request.resolve('n');

      expect(promotionBoard.isPromotionPending()).toBe(false);
      expect(promotionBoard.drawingManager.getDrawingState().promotionPreview).toBeUndefined();
      expect(promotionBoard.getPieceAt('e8')).toBe('N');
      expect(moveListener).toHaveBeenCalledWith(
        expect.objectContaining({ from: 'e7', to: 'e8', fen: expect.any(String) }),
      );
    });

    it('detects promotions on larger boards with multi-digit ranks', () => {
      board.destroy();

      let captured: PromotionRequest | null = null;
      const customRules = new FlexibleGeometryRulesAdapter(10, 10);
      const setupFen = '10/10/10/10/10/10/10/10/10/10 w - - 0 1';
      const promotionBoard = new NeoChessBoard(container, {
        chessboardRows: 10,
        chessboardColumns: 10,
        rulesAdapter: customRules,
        fen: setupFen,
        onPromotionRequired: (request) => {
          captured = request;
        },
      });

      board = promotionBoard;
      promotionBoard.setFEN('10/P9/10/10/10/10/10/10/10/10 w - - 0 1', true);

      const result = promotionBoard.attemptMove('a9', 'a10');

      expect(result).toBe(true);
      expect(captured).not.toBeNull();
      if (!captured) {
        throw new Error('Promotion request was not captured');
      }

      const request = captured as PromotionRequest;
      expect(request.mode).toBe('move');
      expect(promotionBoard.isPromotionPending()).toBe(true);
      expect(promotionBoard.getPieceAt('a9')).toBe('P');
      expect(promotionBoard.getPieceAt('a10')).toBeNull();

      request.resolve('q');

      expect(promotionBoard.isPromotionPending()).toBe(false);
      expect(promotionBoard.getPieceAt('a10')).toBe('Q');
    });

    it('stores the promotion choice for premoves', () => {
      board.destroy();

      let captured: PromotionRequest | null = null;
      const promotionBoard = new NeoChessBoard(container, {
        allowPremoves: true,
        onPromotionRequired: (request) => {
          captured = request;
        },
      });

      board = promotionBoard;
      promotionBoard.setFEN('3k4/4P3/8/8/8/8/8/4K3 b - - 0 1', true);

      const result = promotionBoard.attemptMove('e7', 'e8');

      expect(result).toBe(true);
      expect(captured).not.toBeNull();
      if (!captured) {
        throw new Error('Promotion request was not captured');
      }
      const premoveRequest = captured as PromotionRequest;
      expect(premoveRequest.mode).toBe('premove');
      expect(promotionBoard.getPremove()).toBeNull();

      premoveRequest.resolve('q');

      const premove = promotionBoard.getPremove();
      expect(premove).toEqual({ from: 'e7', to: 'e8', promotion: 'q' });
      expect(promotionBoard.isPromotionPending()).toBe(false);
      expect(promotionBoard.drawingManager.getDrawingState().promotionPreview).toBeUndefined();
    });
  });
});
