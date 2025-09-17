import { NeoChessBoard } from '../../src/core/NeoChessBoard';

let originalCreateElement: typeof document.createElement;

const createMockElement = (tag: string) => {
  const baseCreate = originalCreateElement ?? Document.prototype.createElement;
  const element = baseCreate.call(document, tag) as HTMLElement;

  if (tag === 'canvas') {
    const canvas = element as HTMLCanvasElement;
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

    canvas.getContext = jest.fn(() => ({
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
      drawImage: jest.fn(),
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
    })) as any;

    return canvas as any;
  }

  return element as any;
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
      (document as any).head = {
        appendChild: jest.fn(),
      };
    }

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
      expect((autoBoard as any).orientation).toBe('white');

      const blackTurnFen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR b KQkq - 0 1';
      autoBoard.setFEN(blackTurnFen, true);

      expect((autoBoard as any).orientation).toBe('black');
      autoBoard.destroy();
    });

    it('should update orientation immediately when enabling autoFlip later', () => {
      const manualBoard = new NeoChessBoard(container, { orientation: 'white' });
      const blackTurnFen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR b KQkq - 0 1';

      manualBoard.setFEN(blackTurnFen, true);
      expect((manualBoard as any).orientation).toBe('white');

      manualBoard.setAutoFlip(true);
      expect((manualBoard as any).orientation).toBe('black');
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
      const ctx = (board as any).ctxP;
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
      const ctx = (board as any).ctxP;
      const drawImageMock = ctx.drawImage as jest.Mock;
      const customCanvas = document.createElement('canvas');

      await board.setPieceSet({
        pieces: {
          P: { image: customCanvas },
        },
      });

      drawImageMock.mockClear();

      await board.setPieceSet(undefined);

      const spriteSheet = (board as any).sprites.getSheet();
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
});
