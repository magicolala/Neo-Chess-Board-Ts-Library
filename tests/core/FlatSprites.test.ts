import { FlatSprites } from '../../src/core/FlatSprites';
import { THEMES } from '../../src/core/themes';

describe('FlatSprites', () => {
  let sprites: FlatSprites;

  beforeEach(() => {
    sprites = new FlatSprites(128, THEMES.classic);
  });

  describe('Initialization', () => {
    it('should create sprite sheet with correct dimensions', () => {
      const sheet = sprites.getSheet();

      expect(sheet).toBeDefined();
      expect(sheet.width).toBe(128 * 6); // 6 piece types
      expect(sheet.height).toBe(128 * 2); // 2 colors
    });

    it('should work with different sizes', () => {
      const smallSprites = new FlatSprites(64, THEMES.midnight);
      const sheet = smallSprites.getSheet();

      expect(sheet.width).toBe(64 * 6);
      expect(sheet.height).toBe(64 * 2);
    });

    it('should work with different themes', () => {
      const midnightSprites = new FlatSprites(128, THEMES.midnight);

      expect(() => {
        midnightSprites.getSheet();
      }).not.toThrow();
    });
  });

  describe('Canvas creation', () => {
    it('should use OffscreenCanvas when available', () => {
      // OffscreenCanvas should be mocked in setup
      expect(sprites.getSheet()).toBeDefined();
    });

    it('should fallback to regular canvas when OffscreenCanvas not available', () => {
      const originalOffscreenCanvas = globalThis.OffscreenCanvas;
      Reflect.deleteProperty(
        globalThis as typeof globalThis & { OffscreenCanvas?: unknown },
        'OffscreenCanvas',
      );

      const fallbackSprites = new FlatSprites(64, THEMES.classic);
      const sheet = fallbackSprites.getSheet();

      expect(sheet).toBeDefined();
      expect(sheet.width).toBe(64 * 6);

      globalThis.OffscreenCanvas = originalOffscreenCanvas;
    });
  });

  describe('Rendering', () => {
    it('should call drawing operations on context', () => {
      // Mock to capture calls
      const mockFill = jest.fn();
      const mockTranslate = jest.fn();

      const originalGetContext = HTMLCanvasElement.prototype.getContext;
      const baseContext = originalGetContext?.call(document.createElement('canvas'), '2d');
      const contextSource = (baseContext ?? {}) as Record<string, unknown>;
      const getContextMock = jest.fn(() => {
        const context = {
          ...contextSource,
          fill: mockFill,
          translate: mockTranslate,
        } as Record<string, unknown>;
        return context as unknown as CanvasRenderingContext2D;
      }) as unknown as jest.MockedFunction<typeof HTMLCanvasElement.prototype.getContext>;
      HTMLCanvasElement.prototype.getContext = getContextMock;
      const instance = new FlatSprites(128, THEMES.classic);

      // Should have called drawing operations for each piece
      expect(mockFill).toHaveBeenCalled();
      expect(mockTranslate).toHaveBeenCalled();
      expect(instance).toBeInstanceOf(FlatSprites);

      HTMLCanvasElement.prototype.getContext = originalGetContext;
    });
  });

  describe('Theme integration', () => {
    it('should use theme colors for rendering', () => {
      const customTheme = {
        ...THEMES.classic,
        whitePiece: '#FFFFFF',
        blackPiece: '#000000',
        pieceShadow: 'rgba(255,0,0,0.5)',
      };

      const instance = new FlatSprites(128, customTheme);

      expect(() => instance.getSheet()).not.toThrow();
    });
  });

  describe('Sheet access', () => {
    it('should return the same sheet instance', () => {
      const sheet1 = sprites.getSheet();
      const sheet2 = sprites.getSheet();

      expect(sheet1).toBe(sheet2);
    });

    it('should return valid canvas or OffscreenCanvas', () => {
      const sheet = sprites.getSheet();

      // Should be either HTMLCanvasElement or OffscreenCanvas
      expect(
        sheet instanceof HTMLCanvasElement ||
          (typeof OffscreenCanvas !== 'undefined' && sheet instanceof OffscreenCanvas),
      ).toBe(true);
    });
  });
});
