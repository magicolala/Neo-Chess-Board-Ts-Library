import { THEMES, registerTheme, resolveTheme } from '../../src/core/themes';
import type { Theme } from '../../src/core/types';
import type { ThemeName } from '../../src/core/themes';
import { NeoChessBoard } from '../../src/core/NeoChessBoard';

describe('Themes', () => {
  const requiredThemeProperties: (keyof Theme)[] = [
    'light',
    'dark',
    'boardBorder',
    'whitePiece',
    'blackPiece',
    'pieceShadow',
    'moveFrom',
    'moveTo',
    'lastMove',
    'premove',
    'dot',
    'arrow',
  ];

  describe('Theme structure', () => {
    it('should have classic and midnight themes', () => {
      expect(THEMES).toHaveProperty('classic');
      expect(THEMES).toHaveProperty('midnight');
    });

    it('should have all required properties in classic theme', () => {
      const classic = THEMES.classic;

      requiredThemeProperties.forEach((prop) => {
        expect(classic).toHaveProperty(prop);
        expect(typeof classic[prop]).toBe('string');
        expect(classic[prop]).toBeTruthy();
      });
    });

    it('should have all required properties in midnight theme', () => {
      const midnight = THEMES.midnight;

      requiredThemeProperties.forEach((prop) => {
        expect(midnight).toHaveProperty(prop);
        expect(typeof midnight[prop]).toBe('string');
        expect(midnight[prop]).toBeTruthy();
      });
    });
  });

  describe('Color values', () => {
    it('should have valid CSS color values in classic theme', () => {
      const classic = THEMES.classic;

      // Test hex colors
      expect(classic.light).toMatch(/^#[0-9A-F]{6}$/i);
      expect(classic.dark).toMatch(/^#[0-9A-F]{6}$/i);
      expect(classic.whitePiece).toMatch(/^#[0-9a-f]{6}$/i);
      expect(classic.blackPiece).toMatch(/^#[0-9a-f]{6}$/i);

      // Test rgba colors
      expect(classic.moveFrom).toMatch(/^rgba\(\d+,\d+,\d+,[\d.]+\)$/);
      expect(classic.moveTo).toMatch(/^rgba\(\d+,\d+,\d+,[\d.]+\)$/);
      expect(classic.lastMove).toMatch(/^rgba\(\d+,\d+,\d+,[\d.]+\)$/);
    });

    it('should have valid CSS color values in midnight theme', () => {
      const midnight = THEMES.midnight;

      // Test hex colors
      expect(midnight.light).toMatch(/^#[0-9A-F]{6}$/i);
      expect(midnight.dark).toMatch(/^#[0-9A-F]{6}$/i);
      expect(midnight.whitePiece).toMatch(/^#[0-9A-F]{6}$/i);
      expect(midnight.blackPiece).toMatch(/^#[0-9a-f]{6}$/i);

      // Test rgba colors
      expect(midnight.moveFrom).toMatch(/^rgba\(\d+,\d+,\d+,[\d.]+\)$/);
      expect(midnight.moveTo).toMatch(/^rgba\(\d+,\d+,\d+,[\d.]+\)$/);
      expect(midnight.lastMove).toMatch(/^rgba\(\d+,\d+,\d+,[\d.]+\)$/);
    });
  });

  describe('Theme differences', () => {
    it('should have different color schemes between themes', () => {
      const classic = THEMES.classic;
      const midnight = THEMES.midnight;

      // Themes should be distinct
      expect(classic.light).not.toBe(midnight.light);
      expect(classic.dark).not.toBe(midnight.dark);
      expect(classic.whitePiece).not.toBe(midnight.whitePiece);
      expect(classic.blackPiece).not.toBe(midnight.blackPiece);
    });

    it('should have appropriate contrast between light and dark squares', () => {
      // This is a basic test to ensure themes have some visual distinction
      Object.values(THEMES).forEach((theme) => {
        expect(theme.light).not.toBe(theme.dark);
      });
    });
  });

  describe('ThemeName type', () => {
    it('should correctly type theme names', () => {
      const classicName: ThemeName = 'classic';
      const midnightName: ThemeName = 'midnight';

      expect(THEMES[classicName]).toBeDefined();
      expect(THEMES[midnightName]).toBeDefined();
    });
  });

  describe('Theme accessibility', () => {
    it('should have sufficient opacity for move highlights', () => {
      Object.values(THEMES).forEach((theme) => {
        // Extract opacity from rgba values
        const moveFromOpacity = parseFloat(
          theme.moveFrom.match(/rgba\(\d+,\d+,\d+,([\d.]+)\)/)?.[1] || '0',
        );
        const moveToOpacity = parseFloat(
          theme.moveTo.match(/rgba\(\d+,\d+,\d+,([\d.]+)\)/)?.[1] || '0',
        );

        expect(moveFromOpacity).toBeGreaterThan(0);
        expect(moveFromOpacity).toBeLessThan(1);
        expect(moveToOpacity).toBeGreaterThan(0);
        expect(moveToOpacity).toBeLessThan(1);
      });
    });
  });

  describe('Custom theme registration', () => {
    const customTheme: Theme = {
      light: '#FEF3C7',
      dark: '#92400E',
      boardBorder: '#B45309',
      whitePiece: '#FFFFFF',
      blackPiece: '#1F2937',
      pieceShadow: 'rgba(0,0,0,0.2)',
      moveFrom: 'rgba(248, 113, 113, 0.45)',
      moveTo: 'rgba(74, 222, 128, 0.45)',
      lastMove: 'rgba(59, 130, 246, 0.45)',
      premove: 'rgba(236, 72, 153, 0.35)',
      dot: 'rgba(15, 23, 42, 0.35)',
      arrow: 'rgba(59, 130, 246, 0.9)',
      squareNameColor: '#1F2937',
    };

    const CUSTOM_THEME_KEY = 'sunsetGlow';

    afterEach(() => {
      delete (THEMES as Record<string, Theme>)[CUSTOM_THEME_KEY];
    });

    it('should register and normalize a custom theme', () => {
      const normalized = registerTheme(CUSTOM_THEME_KEY, customTheme);

      expect(THEMES[CUSTOM_THEME_KEY]).toBeDefined();
      expect(THEMES[CUSTOM_THEME_KEY]).toEqual(normalized);
      expect(normalized).not.toBe(customTheme);
      expect(normalized.light).toBe(customTheme.light);
      expect(normalized.pieceStroke).toBe(THEMES.classic.pieceStroke);
      expect(normalized.pieceHighlight).toBe(THEMES.classic.pieceHighlight);
      expect(resolveTheme(CUSTOM_THEME_KEY as any)).toBe(THEMES[CUSTOM_THEME_KEY]);

      const serialized = JSON.parse(JSON.stringify(THEMES[CUSTOM_THEME_KEY]));
      expect(serialized.light).toBe(customTheme.light);
      expect(serialized.dark).toBe(customTheme.dark);
      expect(serialized.pieceHighlight).toBe(THEMES.classic.pieceHighlight);
    });

    it('should resolve theme objects without registration', () => {
      const resolved = resolveTheme(customTheme);

      expect(resolved.light).toBe(customTheme.light);
      expect(resolved.pieceHighlight).toBe(THEMES.classic.pieceHighlight);
    });

    it('should allow applying theme objects via setTheme', () => {
      const container = document.createElement('div');
      const board = new NeoChessBoard(container);

      board.setTheme(customTheme);
      const appliedTheme = (board as unknown as { theme: Theme }).theme;

      expect(appliedTheme.light).toBe(customTheme.light);
      expect(appliedTheme.dark).toBe(customTheme.dark);
      expect(appliedTheme.pieceHighlight).toBe(THEMES.classic.pieceHighlight);
      expect(() => JSON.stringify(appliedTheme)).not.toThrow();

      board.destroy();
    });
  });
});
