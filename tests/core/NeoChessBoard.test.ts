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

  describe('Feature toggles and drawing manager integration', () => {
    it('should initialize sound when enabling sound after construction', () => {
      const localContainer = document.createElement('div') as HTMLDivElement;
      const silentBoard = new NeoChessBoard(localContainer, {
        soundEnabled: false,
        soundUrl: 'mock-sound.mp3',
      });

      const initSpy = jest
        .spyOn(silentBoard as any, '_initializeSound')
        .mockImplementation(() => {});

      silentBoard.setSoundEnabled(true);

      expect((silentBoard as any).soundEnabled).toBe(true);
      expect(initSpy).toHaveBeenCalledTimes(1);

      initSpy.mockRestore();
      silentBoard.destroy();
    });

    describe('per-color move sounds', () => {
      let originalAudio: typeof Audio | undefined;
      let audioInstances: Record<string, any>;

      beforeEach(() => {
        audioInstances = {};
        originalAudio = (global as any).Audio;
        (global as any).Audio = jest.fn().mockImplementation((src: string) => {
          const audio = {
            play: jest.fn().mockResolvedValue(undefined),
            addEventListener: jest.fn(),
            preload: 'auto',
            volume: 0.3,
            currentTime: 0,
          };
          audioInstances[src] = audio;
          return audio;
        });
      });

      afterEach(() => {
        (global as any).Audio = originalAudio;
      });

      it('should play color-specific sounds when provided', () => {
        const localContainer = document.createElement('div') as HTMLDivElement;
        const soundBoard = new NeoChessBoard(localContainer, {
          soundUrls: {
            white: 'white-sound.mp3',
            black: 'black-sound.mp3',
          },
        });

        const whiteSound = audioInstances['white-sound.mp3'];
        const blackSound = audioInstances['black-sound.mp3'];

        expect(whiteSound).toBeDefined();
        expect(blackSound).toBeDefined();

        whiteSound.currentTime = 2;
        (soundBoard as any).state.turn = 'b';
        (soundBoard as any)._playMoveSound();

        expect(whiteSound.play).toHaveBeenCalledTimes(1);
        expect(whiteSound.currentTime).toBe(0);
        expect(blackSound.play).not.toHaveBeenCalled();

        blackSound.currentTime = 3;
        (soundBoard as any).state.turn = 'w';
        (soundBoard as any)._playMoveSound();

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

        const defaultSound = audioInstances['default-sound.mp3'];
        const blackSound = audioInstances['black-only.mp3'];

        expect(defaultSound).toBeDefined();
        expect(blackSound).toBeDefined();

        defaultSound.currentTime = 5;
        (soundBoard as any).state.turn = 'b';
        (soundBoard as any)._playMoveSound();

        expect(defaultSound.play).toHaveBeenCalledTimes(1);
        expect(defaultSound.currentTime).toBe(0);

        blackSound.currentTime = 4;
        (soundBoard as any).state.turn = 'w';
        (soundBoard as any)._playMoveSound();

        expect(blackSound.play).toHaveBeenCalledTimes(1);
        expect(blackSound.currentTime).toBe(0);

        soundBoard.destroy();
      });
    });

    it('should toggle arrow visibility and trigger rerender', () => {
      const renderSpy = jest.spyOn(board, 'renderAll');
      renderSpy.mockClear();

      board.setShowArrows(false);

      expect((board as any).showArrows).toBe(false);
      expect(renderSpy).toHaveBeenCalled();

      renderSpy.mockClear();
      board.setShowArrows(true);

      expect((board as any).showArrows).toBe(true);
      expect(renderSpy).toHaveBeenCalled();

      renderSpy.mockRestore();
    });

    it('should toggle highlight visibility', () => {
      const renderSpy = jest.spyOn(board, 'renderAll');
      renderSpy.mockClear();

      board.setShowHighlights(false);

      expect((board as any).showHighlights).toBe(false);
      expect(renderSpy).toHaveBeenCalled();

      renderSpy.mockRestore();
    });

    it('should toggle legal highlight flag', () => {
      const renderSpy = jest.spyOn(board, 'renderAll');
      renderSpy.mockClear();

      board.setHighlightLegal(false);

      expect((board as any).highlightLegal).toBe(false);
      expect(renderSpy).toHaveBeenCalled();

      renderSpy.mockRestore();
    });

    it('should update drawing manager when showing square names', () => {
      const renderSpy = jest.spyOn(board, 'renderAll');
      const showSquareNamesSpy = jest.spyOn(board.drawingManager, 'setShowSquareNames');

      renderSpy.mockClear();

      board.setShowSquareNames(true);

      expect((board as any).showSquareNames).toBe(true);
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

      expect((board as any).allowPremoves).toBe(false);
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
      } as any);

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
    it('cancels an active drag on right-click and skips drawing actions', () => {
      const overlay = (board as any).cOverlay as HTMLCanvasElement;
      const onPointerDown = (board as any)._onPointerDown as (event: PointerEvent) => void;
      const onPointerMove = (board as any)._onPointerMove as (event: PointerEvent) => void;
      const onPointerUp = (board as any)._onPointerUp as (event: PointerEvent) => void;

      const rightDownSpy = jest.spyOn(board.drawingManager, 'handleRightMouseDown');
      const rightUpSpy = jest.spyOn(board.drawingManager, 'handleRightMouseUp');
      const highlightSpy = jest.spyOn(board.drawingManager, 'handleHighlightClick');

      const overlayRect = overlay.getBoundingClientRect();
      const createPointerEventForSquare = (button: number, squareName: string) => {
        const { x, y } = (board as any)._sqToXY(squareName);
        const squareSize = (board as any).square as number;
        const canvasX = x + squareSize / 2;
        const canvasY = y + squareSize / 2;

        const baseEvent = {
          button,
          clientX: overlayRect.left + (canvasX * overlayRect.width) / overlay.width,
          clientY: overlayRect.top + (canvasY * overlayRect.height) / overlay.height,
          preventDefault: jest.fn(),
          shiftKey: false,
          ctrlKey: false,
          altKey: false,
        };

        return {
          event: baseEvent as unknown as PointerEvent,
          preventDefault: baseEvent.preventDefault,
        };
      };

      const initialFen = board.getPosition();

      const leftDown = createPointerEventForSquare(0, 'e2');
      onPointerDown(leftDown.event);
      expect((board as any)._dragging).not.toBeNull();

      onPointerMove(createPointerEventForSquare(0, 'e4').event);

      const rightDown = createPointerEventForSquare(2, 'e4');
      onPointerDown(rightDown.event);

      expect(rightDown.preventDefault).toHaveBeenCalled();
      expect((board as any)._dragging).toBeNull();
      expect((board as any)._selected).toBeNull();
      expect((board as any)._legalCached).toBeNull();
      expect((board as any)._hoverSq).toBeNull();

      onPointerUp(createPointerEventForSquare(2, 'e4').event);

      expect(board.getPosition()).toBe(initialFen);
      expect(rightDownSpy).not.toHaveBeenCalled();
      expect(rightUpSpy).not.toHaveBeenCalled();
      expect(highlightSpy).not.toHaveBeenCalled();

      rightDownSpy.mockRestore();
      rightUpSpy.mockRestore();
      highlightSpy.mockRestore();
    });
  });
});
