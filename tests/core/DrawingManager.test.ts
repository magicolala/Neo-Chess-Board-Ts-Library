import { DrawingManager } from '../../src/core/DrawingManager';
import type { Arrow, SquareHighlight, Premove } from '../../src/core/types';

// Mock HTMLCanvasElement
type MockCanvasElement = HTMLCanvasElement & {
  getContext: jest.MockedFunction<typeof HTMLCanvasElement.prototype.getContext>;
  getBoundingClientRect: jest.Mock<ReturnType<HTMLCanvasElement['getBoundingClientRect']>>;
};

const mockCanvas = {
  width: 400,
  height: 400,
  getContext: jest.fn(),
  getBoundingClientRect: jest.fn(() => ({
    width: 400,
    height: 400,
    left: 0,
    top: 0,
    right: 400,
    bottom: 400,
    x: 0,
    y: 0,
    toJSON: () => ({}),
  })),
} as unknown as MockCanvasElement;

// Mock CanvasRenderingContext2D
const mockContext = {
  save: jest.fn(),
  restore: jest.fn(),
  clearRect: jest.fn(),
  fillRect: jest.fn(),
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
  canvas: mockCanvas,
  setLineDash: jest.fn(),
  fillText: jest.fn(),
  measureText: jest.fn(() => ({ width: 10 })),
} as unknown as jest.Mocked<CanvasRenderingContext2D>;

describe('DrawingManager', () => {
  let drawingManager: DrawingManager;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();

    // Setup canvas mock
    mockCanvas.getContext.mockReturnValue(mockContext);
    mockCanvas.width = 400;
    mockCanvas.height = 400;

    // Create new instance for each test
    drawingManager = new DrawingManager(mockCanvas);
  });

  describe('Initialization', () => {
    it('should create instance with canvas', () => {
      expect(drawingManager).toBeDefined();
      expect(drawingManager).toBeInstanceOf(DrawingManager);
    });

    it('should initialize with default state', () => {
      const state = drawingManager.getDrawingState();
      expect(state.arrows).toEqual([]);
      expect(state.highlights).toEqual([]);
      expect(state.premove).toBeUndefined();
    });

    it('should update dimensions', () => {
      mockCanvas.width = 800;
      mockCanvas.height = 800;
      drawingManager.updateDimensions();

      // updateDimensions calls getContext internally but doesn't use the result
      // The method updates internal squareSize based on canvas dimensions
      expect(drawingManager).toBeDefined();
    });
  });

  describe('Arrow Management', () => {
    it('should add arrow with from/to format', () => {
      drawingManager.addArrow('e2', 'e4');

      const arrows = drawingManager.getArrows();
      expect(arrows).toHaveLength(1);
      expect(arrows[0]).toEqual({
        from: 'e2',
        to: 'e4',
        color: 'rgba(34, 197, 94, 0.6)',
        width: 2,
        opacity: 0.8,
        knightMove: false,
      });
    });

    it('should add arrow with object format', () => {
      const arrow: Arrow = {
        from: 'g1',
        to: 'f3',
        color: 'red',
        width: 3,
        opacity: 0.9,
        knightMove: true,
      };

      drawingManager.addArrow(arrow);

      const arrows = drawingManager.getArrows();
      expect(arrows).toHaveLength(1);
      expect(arrows[0]).toEqual(arrow);
    });

    it('should update existing arrow when adding duplicate', () => {
      drawingManager.addArrow('e2', 'e4', 'blue');
      drawingManager.addArrow('e2', 'e4', 'red');

      const arrows = drawingManager.getArrows();
      expect(arrows).toHaveLength(1);
      expect(arrows[0].color).toBe('red');
    });

    it('should remove specific arrow', () => {
      drawingManager.addArrow('e2', 'e4');
      drawingManager.addArrow('g1', 'f3');

      drawingManager.removeArrow('e2', 'e4');

      const arrows = drawingManager.getArrows();
      expect(arrows).toHaveLength(1);
      expect(arrows[0].from).toBe('g1');
    });

    it('should clear all arrows', () => {
      drawingManager.addArrow('e2', 'e4');
      drawingManager.addArrow('g1', 'f3');

      drawingManager.clearArrows();

      expect(drawingManager.getArrows()).toEqual([]);
    });

    it('should detect knight moves', () => {
      // Knight move: g1 to f3
      drawingManager.addArrow('g1', 'f3');
      const arrows = drawingManager.getArrows();
      expect(arrows[0].knightMove).toBe(true);

      // Non-knight move: e2 to e4
      drawingManager.clearArrows();
      drawingManager.addArrow('e2', 'e4');
      const arrows2 = drawingManager.getArrows();
      expect(arrows2[0].knightMove).toBe(false);
    });
  });

  describe('Highlight Management', () => {
    it('should add highlight with square and type', () => {
      drawingManager.addHighlight('e4', 'green');

      const highlights = drawingManager.getHighlights();
      expect(highlights).toHaveLength(1);
      expect(highlights[0]).toEqual({
        square: 'e4',
        type: 'green',
        opacity: 0.3,
      });
    });

    it('should add highlight with custom opacity', () => {
      drawingManager.addHighlight('e4', 'red', 0.8);

      const highlights = drawingManager.getHighlights();
      expect(highlights[0].opacity).toBe(0.8);
    });

    it('should update existing highlight', () => {
      drawingManager.addHighlight('e4', 'green');
      drawingManager.addHighlight('e4', 'red');

      const highlights = drawingManager.getHighlights();
      expect(highlights).toHaveLength(1);
      expect(highlights[0].type).toBe('red');
    });

    it('should remove specific highlight', () => {
      drawingManager.addHighlight('e4', 'green');
      drawingManager.addHighlight('d4', 'red');

      drawingManager.removeHighlight('e4');

      const highlights = drawingManager.getHighlights();
      expect(highlights).toHaveLength(1);
      expect(highlights[0].square).toBe('d4');
    });

    it('should clear all highlights', () => {
      drawingManager.addHighlight('e4', 'green');
      drawingManager.addHighlight('d4', 'red');

      drawingManager.clearHighlights();

      expect(drawingManager.getHighlights()).toEqual([]);
    });

    it('should cycle highlight colors', () => {
      drawingManager.addHighlight('e4', 'green');
      drawingManager.cycleHighlight('e4');

      let highlights = drawingManager.getHighlights();
      expect(highlights[0].type).toBe('red');

      drawingManager.cycleHighlight('e4');
      highlights = drawingManager.getHighlights();
      expect(highlights[0].type).toBe('blue');

      // Cycle through all colors and back to removing
      for (let i = 0; i < 4; i++) {
        drawingManager.cycleHighlight('e4');
      }
      highlights = drawingManager.getHighlights();
      expect(highlights).toHaveLength(0);
    });

    it('should add new highlight when cycling empty square', () => {
      drawingManager.cycleHighlight('e4');

      const highlights = drawingManager.getHighlights();
      expect(highlights).toHaveLength(1);
      expect(highlights[0].type).toBe('green');
    });
  });

  describe('Premove Management', () => {
    it('should set premove', () => {
      const premove: Premove = { from: 'e2', to: 'e4', promotion: 'q' };
      drawingManager.setPremove('e2', 'e4', 'q');

      expect(drawingManager.getPremove()).toEqual(premove);
    });

    it('should clear premove', () => {
      drawingManager.setPremove('e2', 'e4');
      drawingManager.clearPremove();

      expect(drawingManager.getPremove()).toBeUndefined();
    });
  });

  describe('Coordinate Conversions', () => {
    it('should convert square to coordinates', () => {
      drawingManager.setOrientation('white');
      const coords = drawingManager.squareToCoords('e4');

      // e4 should be at (200, 200) in 400x400 canvas (square size 50)
      // file 'e' = 4, rank '4' = 3, y = (7-3) * 50 = 200
      expect(coords).toEqual([200, 200]);
    });

    it('should convert coordinates to square', () => {
      drawingManager.setOrientation('white');
      const square = drawingManager.coordsToSquare(200, 200);

      expect(square).toBe('e4');
    });

    it('should handle black orientation', () => {
      drawingManager.setOrientation('black');
      const coords = drawingManager.squareToCoords('e4');

      // With black orientation, coordinates are flipped
      // file 'e' = 4, becomes (7-4) = 3, rank '4' = 3, y = 3 * 50 = 150
      expect(coords).toEqual([150, 150]);
    });
  });

  describe('State Management', () => {
    it('should export state', () => {
      drawingManager.addArrow('e2', 'e4');
      drawingManager.addHighlight('f3', 'green');
      drawingManager.setPremove('g1', 'f3');

      const exported = drawingManager.exportState();
      expect(typeof exported).toBe('string');

      const parsed = JSON.parse(exported);
      expect(parsed.arrows).toHaveLength(1);
      expect(parsed.highlights).toHaveLength(1);
      expect(parsed.premove).toBeDefined();
    });

    it('should import state', () => {
      const state = {
        arrows: [{ from: 'e2', to: 'e4', color: 'red', width: 3, opacity: 0.9, knightMove: false }],
        highlights: [{ square: 'f3', type: 'green', opacity: 0.5 }],
        premove: { from: 'g1', to: 'f3' },
      };

      drawingManager.importState(JSON.stringify(state));

      expect(drawingManager.getArrows()).toHaveLength(1);
      expect(drawingManager.getHighlights()).toHaveLength(1);
      expect(drawingManager.getPremove()).toEqual(state.premove);
    });

    it('should handle invalid import gracefully', () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

      drawingManager.importState('invalid json');

      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });

  describe('Mouse Interactions', () => {
    it('should get square from mouse position', () => {
      const square = drawingManager.getSquareFromMousePosition(200, 150);

      // With 400x400 canvas and square size 50:
      // x=200 -> file = floor(200/50) = 4 -> 'e'
      // y=150 -> rank = floor(150/50) = 3, actualRank = 7-3 = 4 -> '5'
      expect(square).toBe('e5');
    });

    it('should return null for out of bounds position', () => {
      const square = drawingManager.getSquareFromMousePosition(500, 500);

      expect(square).toBeNull();
    });

    it('should handle right mouse down for arrow drawing', () => {
      const handled = drawingManager.handleRightMouseDown(200, 150);

      expect(handled).toBe(true);
    });

    it('should handle right mouse up to complete arrow', () => {
      drawingManager.handleRightMouseDown(200, 150); // e4
      const handled = drawingManager.handleRightMouseUp(250, 150); // f4

      expect(handled).toBe(true);
      expect(drawingManager.getArrows()).toHaveLength(1);
    });

    it('should cancel arrow drawing on same square', () => {
      drawingManager.handleRightMouseDown(200, 150);
      const handled = drawingManager.handleRightMouseUp(200, 150);

      expect(handled).toBe(false);
      expect(drawingManager.getArrows()).toHaveLength(0);
    });

    it('should handle highlight click with modifiers', () => {
      drawingManager.handleHighlightClick('e4', true, false, false); // Shift
      let highlights = drawingManager.getHighlights();
      expect(highlights[0].type).toBe('green');

      drawingManager.handleHighlightClick('e4', false, true, false); // Ctrl
      highlights = drawingManager.getHighlights();
      expect(highlights[0].type).toBe('red');
    });
  });

  describe('Configuration', () => {
    it('should set orientation', () => {
      drawingManager.setOrientation('black');
      // Orientation is used in coordinate conversions, tested above
      expect(drawingManager).toBeDefined();
    });

    it('should set show square names', () => {
      drawingManager.setShowSquareNames(true);
      // This affects rendering, tested in rendering tests
      expect(drawingManager).toBeDefined();
    });
  });

  describe('Rendering (Mock Tests)', () => {
    beforeEach(() => {
      mockContext.clearRect.mockClear();
      mockContext.save.mockClear();
      mockContext.restore.mockClear();
    });

    it('should render arrows', () => {
      drawingManager.addArrow('e2', 'e4');
      drawingManager.renderArrows();

      expect(mockCanvas.getContext).toHaveBeenCalledWith('2d');
      expect(mockContext.save).toHaveBeenCalled();
      expect(mockContext.restore).toHaveBeenCalled();
    });

    it('should render highlights', () => {
      drawingManager.addHighlight('e4', 'green');
      drawingManager.renderHighlights();

      expect(mockContext.save).toHaveBeenCalled();
      expect(mockContext.restore).toHaveBeenCalled();
    });

    it('should render highlights with undefined opacity', () => {
      drawingManager.addHighlight('e4', 'green');
      // Manually set opacity to undefined to test the fallback
      const highlights = drawingManager.getHighlights();
      highlights[0].opacity = undefined;

      drawingManager.renderHighlights();

      expect(mockContext.save).toHaveBeenCalled();
      expect(mockContext.restore).toHaveBeenCalled();
    });

    it('should render premove', () => {
      drawingManager.setPremove('e2', 'e4');
      drawingManager.renderPremove();

      expect(mockContext.save).toHaveBeenCalled();
      expect(mockContext.restore).toHaveBeenCalled();
    });

    it('should render square names when enabled', () => {
      drawingManager.setShowSquareNames(true);
      drawingManager.draw(mockContext);

      expect(mockContext.save).toHaveBeenCalled();
      expect(mockContext.restore).toHaveBeenCalled();
    });

    it('should handle renderSquareNames with null context', () => {
      mockCanvas.getContext.mockReturnValueOnce(null);
      expect(() => drawingManager.renderSquareNames('white', 0, 1)).not.toThrow();
    });

    it('should place coordinate labels along the bottom and left for white orientation', () => {
      drawingManager.setShowSquareNames(true);
      mockContext.fillText.mockClear();

      drawingManager.renderSquareNames('white', 0, 1);

      expect(mockContext.fillText).toHaveBeenCalledTimes(16);
      const [fileChar, fileX, fileY] = mockContext.fillText.mock.calls[0];
      expect(fileChar).toBe('a');
      expect(fileX).toBeCloseTo(6, 5);
      expect(fileY).toBeCloseTo(394, 5);

      const [rankChar, rankX, rankY] = mockContext.fillText.mock.calls[8];
      expect(rankChar).toBe('1');
      expect(rankX).toBeCloseTo(6, 5);
      expect(rankY).toBeCloseTo(375, 5);
    });

    it('should keep coordinate labels on the bottom and left when black is at the bottom', () => {
      drawingManager.setShowSquareNames(true);
      mockContext.fillText.mockClear();

      drawingManager.renderSquareNames('black', 0, 1);

      expect(mockContext.fillText).toHaveBeenCalledTimes(16);
      const [fileChar, fileX, fileY] = mockContext.fillText.mock.calls[0];
      expect(fileChar).toBe('h');
      expect(fileX).toBeCloseTo(6, 5);
      expect(fileY).toBeCloseTo(394, 5);

      const [rankChar, rankX, rankY] = mockContext.fillText.mock.calls[8];
      expect(rankChar).toBe('8');
      expect(rankX).toBeCloseTo(6, 5);
      expect(rankY).toBeCloseTo(375, 5);
    });

    it('should complete draw cycle', () => {
      drawingManager.draw(mockContext);

      // The draw method calls the individual drawing methods
      expect(mockContext.save).toHaveBeenCalled();
      expect(mockContext.restore).toHaveBeenCalled();
    });

    it('should render knight arrows with horizontal movement', () => {
      drawingManager.addArrow('g1', 'f3'); // Knight move
      drawingManager.renderArrows();

      expect(mockContext.save).toHaveBeenCalled();
      expect(mockContext.restore).toHaveBeenCalled();
    });

    it('should render knight arrows with vertical movement', () => {
      drawingManager.addArrow('g1', 'h3'); // Knight move
      drawingManager.renderArrows();

      expect(mockContext.save).toHaveBeenCalled();
      expect(mockContext.restore).toHaveBeenCalled();
    });
  });

  describe('Integration Methods', () => {
    it('should add arrow from object', () => {
      const arrow: Arrow = {
        from: 'e2',
        to: 'e4',
        color: 'blue',
        width: 4,
        opacity: 0.7,
        knightMove: false,
      };

      drawingManager.addArrowFromObject(arrow);

      const arrows = drawingManager.getArrows();
      expect(arrows[0]).toEqual(arrow);
    });

    it('should add highlight from object', () => {
      const highlight: SquareHighlight = {
        square: 'e4',
        type: 'red',
        opacity: 0.8,
      };

      drawingManager.addHighlightFromObject(highlight);

      const highlights = drawingManager.getHighlights();
      expect(highlights[0]).toEqual(highlight);
    });

    it('should set premove from object', () => {
      const premove: Premove = { from: 'e2', to: 'e4', promotion: 'q' };

      drawingManager.setPremoveFromObject(premove);

      expect(drawingManager.getPremove()).toEqual(premove);
    });

    it('should clear all drawings', () => {
      drawingManager.addArrow('e2', 'e4');
      drawingManager.addHighlight('f3', 'green');
      drawingManager.setPremove('g1', 'f3');

      drawingManager.clearAllDrawings();

      expect(drawingManager.getArrows()).toEqual([]);
      expect(drawingManager.getHighlights()).toEqual([]);
      expect(drawingManager.getPremove()).toBeUndefined();
    });
  });
});
