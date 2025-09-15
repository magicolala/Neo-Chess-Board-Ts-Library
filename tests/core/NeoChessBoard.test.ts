import { NeoChessBoard } from '../../src/core/NeoChessBoard';

// Mock DOM environment
let originalCreateElement: typeof document.createElement;

const createMockElement = (tag: string) => {
  const element = originalCreateElement.call(document, tag);

  // Mock getBoundingClientRect for canvas elements
  if (tag === 'canvas') {
    element.getBoundingClientRect = jest.fn(() => ({
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
  }

  return element;
};

describe('NeoChessBoard Core', () => {
  let container: HTMLDivElement;
  let board: NeoChessBoard;

  beforeEach(() => {
    // Store original createElement
    originalCreateElement = document.createElement;

    container = createMockElement('div') as HTMLDivElement;

    // Mock document.createElement
    document.createElement = jest.fn((tag) => createMockElement(tag));

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

    document.createElement = originalCreateElement;
  });

  afterEach(() => {
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

    it('should accept interactive configuration', () => {
      expect(() => {
        new NeoChessBoard(container, { interactive: false });
      }).not.toThrow();
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
