import { PgnAnnotationParser } from '../../src/core/PgnAnnotationParser';

describe('PgnAnnotationParser', () => {
  let parser: PgnAnnotationParser;

  beforeEach(() => {
    parser = new PgnAnnotationParser();
  });

  describe('hasVisualAnnotations', () => {
    it('should detect %cal annotations', () => {
      expect(parser.hasVisualAnnotations('Some text %cal Rc8f5,Ra8d8')).toBe(true);
    });

    it('should detect %csl annotations', () => {
      expect(parser.hasVisualAnnotations('Some text %csl Rd4,Gd5')).toBe(true);
    });

    it('should detect both annotations', () => {
      expect(parser.hasVisualAnnotations('%cal Rc8f5 %csl Gd4')).toBe(true);
    });

    it('should return false for text without annotations', () => {
      expect(parser.hasVisualAnnotations('Just a regular comment')).toBe(false);
    });

    it('should return false for empty string', () => {
      expect(parser.hasVisualAnnotations('')).toBe(false);
    });
  });

  describe('parseAnnotations', () => {
    describe('Arrow annotations (%cal)', () => {
      it('should parse single arrow', () => {
        const result = parser.parseAnnotations('%cal Rc8f5');
        expect(result.arrows).toHaveLength(1);
        expect(result.arrows[0]).toEqual({
          from: 'c8',
          to: 'f5',
          color: '#ff0000'
        });
      });

      it('should parse multiple arrows', () => {
        const result = parser.parseAnnotations('%cal Rc8f5,Ga8d8,Ye1c1');
        expect(result.arrows).toHaveLength(3);
        expect(result.arrows[0]).toEqual({
          from: 'c8',
          to: 'f5',
          color: '#ff0000'
        });
        expect(result.arrows[1]).toEqual({
          from: 'a8',
          to: 'd8',
          color: '#00ff00'
        });
        expect(result.arrows[2]).toEqual({
          from: 'e1',
          to: 'c1',
          color: '#ffff00'
        });
      });

      it('should handle different color codes', () => {
        const result = parser.parseAnnotations('%cal Ra1a2,Gb1b2,Yc1c2,Bd1d2');
        expect(result.arrows).toHaveLength(4);
        expect(result.arrows[0].color).toBe('#ff0000'); // Red
        expect(result.arrows[1].color).toBe('#00ff00'); // Green
        expect(result.arrows[2].color).toBe('#ffff00'); // Yellow
        expect(result.arrows[3].color).toBe('#0000ff'); // Blue
      });
    });

    describe('Circle annotations (%csl)', () => {
      it('should parse single circle', () => {
        const result = parser.parseAnnotations('%csl Rd4');
        expect(result.circles).toHaveLength(1);
        expect(result.circles[0]).toEqual({
          square: 'd4',
          type: 'circle',
          color: '#ff0000'
        });
      });

      it('should parse multiple circles', () => {
        const result = parser.parseAnnotations('%csl Rd4,Gd5,Ya4');
        expect(result.circles).toHaveLength(3);
        expect(result.circles[0]).toEqual({
          square: 'd4',
          type: 'circle',
          color: '#ff0000'
        });
        expect(result.circles[1]).toEqual({
          square: 'd5',
          type: 'circle',
          color: '#00ff00'
        });
        expect(result.circles[2]).toEqual({
          square: 'a4',
          type: 'circle',
          color: '#ffff00'
        });
      });
    });

    describe('Combined annotations', () => {
      it('should parse both arrows and circles', () => {
        const result = parser.parseAnnotations('%cal Rc8f5,Ga8d8 %csl Rd4,Gd5');
        expect(result.arrows).toHaveLength(2);
        expect(result.circles).toHaveLength(2);
        
        expect(result.arrows[0]).toEqual({
          from: 'c8',
          to: 'f5',
          color: '#ff0000'
        });
        expect(result.circles[0]).toEqual({
          square: 'd4',
          type: 'circle',
          color: '#ff0000'
        });
      });

      it('should preserve text comments', () => {
        const result = parser.parseAnnotations('Good move! %cal Rc8f5 This is strategic %csl Gd4');
        expect(result.textComment).toBe('Good move!  This is strategic');
        expect(result.arrows).toHaveLength(1);
        expect(result.circles).toHaveLength(1);
      });
    });

    describe('Edge cases', () => {
      it('should handle invalid square notation gracefully', () => {
        const result = parser.parseAnnotations('%cal Rz9z9,Ra1a2');
        expect(result.arrows).toHaveLength(1); // Only the valid one
        expect(result.arrows[0].from).toBe('a1');
      });

      it('should handle invalid color codes', () => {
        const result = parser.parseAnnotations('%cal Xa1a2,Ra2a3');
        expect(result.arrows).toHaveLength(1); // Only the valid one
        expect(result.arrows[0].from).toBe('a2');
      });

      it('should handle malformed annotations', () => {
        const result = parser.parseAnnotations('%cal R,abc,Ra1a2');
        expect(result.arrows).toHaveLength(1); // Only the valid one
        expect(result.arrows[0].from).toBe('a1');
      });

      it('should return empty arrays for no annotations', () => {
        const result = parser.parseAnnotations('Just a comment');
        expect(result.arrows).toHaveLength(0);
        expect(result.circles).toHaveLength(0);
        expect(result.textComment).toBe('Just a comment');
      });
    });
  });

  describe('stripVisualAnnotations', () => {
    it('should remove %cal annotations', () => {
      const result = parser.stripVisualAnnotations('Good move %cal Rc8f5,Ra8d8 excellent!');
      expect(result).toBe('Good move  excellent!');
    });

    it('should remove %csl annotations', () => {
      const result = parser.stripVisualAnnotations('Strategic %csl Rd4,Gd5 position');
      expect(result).toBe('Strategic  position');
    });

    it('should remove both types of annotations', () => {
      const result = parser.stripVisualAnnotations('Text %cal Ra1a2 more %csl Gd4 end');
      expect(result).toBe('Text  more  end');
    });

    it('should preserve text without annotations', () => {
      const result = parser.stripVisualAnnotations('Just a regular comment');
      expect(result).toBe('Just a regular comment');
    });
  });

  describe('createAnnotationString', () => {
    it('should create %cal string for arrows', () => {
      const arrows = [
        { from: 'c8', to: 'f5', color: '#ff0000' },
        { from: 'a8', to: 'd8', color: '#00ff00' }
      ];
      const result = parser.createAnnotationString(arrows, []);
      expect(result).toBe('%cal Rc8f5,Ga8d8');
    });

    it('should create %csl string for circles', () => {
      const circles = [
        { square: 'd4', type: 'circle' as const, color: '#ff0000' },
        { square: 'd5', type: 'circle' as const, color: '#00ff00' }
      ];
      const result = parser.createAnnotationString([], circles);
      expect(result).toBe('%csl Rd4,Gd5');
    });

    it('should create combined string for both arrows and circles', () => {
      const arrows = [{ from: 'c8', to: 'f5', color: '#ff0000' }];
      const circles = [{ square: 'd4', type: 'circle' as const, color: '#00ff00' }];
      const result = parser.createAnnotationString(arrows, circles);
      expect(result).toBe('%cal Rc8f5 %csl Gd4');
    });

    it('should return empty string for no annotations', () => {
      const result = parser.createAnnotationString([], []);
      expect(result).toBe('');
    });

    it('should map colors correctly', () => {
      const arrows = [
        { from: 'a1', to: 'a2', color: '#ff0000' }, // Red
        { from: 'b1', to: 'b2', color: '#00ff00' }, // Green  
        { from: 'c1', to: 'c2', color: '#ffff00' }, // Yellow
        { from: 'd1', to: 'd2', color: '#0000ff' }, // Blue
        { from: 'e1', to: 'e2', color: '#ff00ff' }  // Other color should default to Red
      ];
      const result = parser.createAnnotationString(arrows, []);
      expect(result).toBe('%cal Ra1a2,Gb1b2,Yc1c2,Bd1d2,Re1e2');
    });
  });

  describe('Color mapping utilities', () => {
    it('should map color codes to hex correctly', () => {
      expect(parser.colorToHex('R')).toBe('#ff0000');
      expect(parser.colorToHex('G')).toBe('#00ff00');
      expect(parser.colorToHex('Y')).toBe('#ffff00');
      expect(parser.colorToHex('B')).toBe('#0000ff');
      expect(parser.colorToHex('X')).toBe('#ff0000'); // Default to red
    });

    it('should map hex to color codes correctly', () => {
      expect(parser.hexToColor('#ff0000')).toBe('R');
      expect(parser.hexToColor('#00ff00')).toBe('G');
      expect(parser.hexToColor('#ffff00')).toBe('Y');
      expect(parser.hexToColor('#0000ff')).toBe('B');
      expect(parser.hexToColor('#ff00ff')).toBe('R'); // Default to red
    });
  });

  describe('Square validation', () => {
    it('should validate correct square notation', () => {
      expect(parser.isValidSquare('a1')).toBe(true);
      expect(parser.isValidSquare('h8')).toBe(true);
      expect(parser.isValidSquare('d4')).toBe(true);
    });

    it('should reject invalid square notation', () => {
      expect(parser.isValidSquare('i1')).toBe(false); // Invalid file
      expect(parser.isValidSquare('a9')).toBe(false); // Invalid rank
      expect(parser.isValidSquare('z1')).toBe(false); // Invalid file
      expect(parser.isValidSquare('a0')).toBe(false); // Invalid rank
      expect(parser.isValidSquare('')).toBe(false);   // Empty string
      expect(parser.isValidSquare('ab')).toBe(false); // Wrong format
    });
  });

  describe('Integration with real PGN comments', () => {
    it('should parse complex real-world annotations', () => {
      const comment = 'This is a strong move! %cal Rc8f5,Ga8d8,Ye8g8 %csl Rd4,Gd5,Yf7 The position is winning.';
      const result = parser.parseAnnotations(comment);
      
      expect(result.arrows).toHaveLength(3);
      expect(result.circles).toHaveLength(3);
      expect(result.textComment).toBe('This is a strong move!   The position is winning.');
      
      // Verify specific arrows
      expect(result.arrows.some(a => a.from === 'c8' && a.to === 'f5' && a.color === '#ff0000')).toBe(true);
      expect(result.arrows.some(a => a.from === 'a8' && a.to === 'd8' && a.color === '#00ff00')).toBe(true);
      expect(result.arrows.some(a => a.from === 'e8' && a.to === 'g8' && a.color === '#ffff00')).toBe(true);
      
      // Verify specific circles
      expect(result.circles.some(c => c.square === 'd4' && c.color === '#ff0000')).toBe(true);
      expect(result.circles.some(c => c.square === 'd5' && c.color === '#00ff00')).toBe(true);
      expect(result.circles.some(c => c.square === 'f7' && c.color === '#ffff00')).toBe(true);
    });
  });
});
