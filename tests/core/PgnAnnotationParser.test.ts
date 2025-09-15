import { PgnAnnotationParser } from '../../src/core/PgnAnnotationParser';
import { Arrow, SquareHighlight } from '../../src/core/types';

describe('PgnAnnotationParser', () => {

  describe('hasVisualAnnotations', () => {
    it('should detect %cal annotations', () => {
      expect(PgnAnnotationParser.hasVisualAnnotations('Some text %cal Rc8f5,Ra8d8')).toBe(true);
    });

    it('should detect %csl annotations', () => {
      expect(PgnAnnotationParser.hasVisualAnnotations('Some text %csl Rd4,Gd5')).toBe(true);
    });

    it('should detect both annotations', () => {
      expect(PgnAnnotationParser.hasVisualAnnotations('%cal Rc8f5 %csl Gd4')).toBe(true);
    });

    it('should return false for text without annotations', () => {
      expect(PgnAnnotationParser.hasVisualAnnotations('Just a regular comment')).toBe(false);
    });

    it('should return false for empty string', () => {
      expect(PgnAnnotationParser.hasVisualAnnotations('')).toBe(false);
    });
  });

  describe('parseComment', () => {
    describe('Arrow annotations (%cal)', () => {
      it('should parse single arrow', () => {
        const result = PgnAnnotationParser.parseComment('%cal Rc8f5');
        expect(result.arrows).toHaveLength(1);
        expect(result.arrows[0]).toEqual({
          from: 'c8',
          to: 'f5',
          color: '#ff0000'
        });
      });

      it('should parse multiple arrows', () => {
        const result = PgnAnnotationParser.parseComment('%cal Rc8f5,Ga8d8,Ye1c1');
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
        const result = PgnAnnotationParser.parseComment('%cal Ra1a2,Gb1b2,Yc1c2,Bd1d2');
        expect(result.arrows).toHaveLength(4);
        expect(result.arrows[0].color).toBe('#ff0000'); // Red
        expect(result.arrows[1].color).toBe('#00ff00'); // Green
        expect(result.arrows[2].color).toBe('#ffff00'); // Yellow
        expect(result.arrows[3].color).toBe('#0000ff'); // Blue
      });
    });

    describe('Circle annotations (%csl)', () => {
      it('should parse single circle', () => {
        const result = PgnAnnotationParser.parseComment('%csl Rd4');
        expect(result.highlights).toHaveLength(1);
        expect(result.highlights[0]).toEqual({
          square: 'd4',
          type: 'circle',
          color: '#ff0000'
        });
      });

      it('should parse multiple circles', () => {
        const result = PgnAnnotationParser.parseComment('%csl Rd4,Gd5,Ya4');
        expect(result.highlights).toHaveLength(3);
        expect(result.highlights[0]).toEqual({
          square: 'd4',
          type: 'circle',
          color: '#ff0000'
        });
        expect(result.highlights[1]).toEqual({
          square: 'd5',
          type: 'circle',
          color: '#00ff00'
        });
        expect(result.highlights[2]).toEqual({
          square: 'a4',
          type: 'circle',
          color: '#ffff00'
        });
      });
    });

    describe('Combined annotations', () => {
      it('should parse both arrows and circles', () => {
        const result = PgnAnnotationParser.parseComment('%cal Rc8f5,Ga8d8 %csl Rd4,Gd5');
        expect(result.arrows).toHaveLength(2);
        expect(result.highlights).toHaveLength(2);
        
        expect(result.arrows[0]).toEqual({
          from: 'c8',
          to: 'f5',
          color: '#ff0000'
        });
        expect(result.highlights[0]).toEqual({
          square: 'd4',
          type: 'circle',
          color: '#ff0000'
        });
      });

      it('should preserve text comments', () => {
        const result = PgnAnnotationParser.parseComment('Good move! %cal Rc8f5 This is strategic %csl Gd4');
        expect(result.textComment).toBe('Good move! This is strategic');
        expect(result.arrows).toHaveLength(1);
        expect(result.highlights).toHaveLength(1);
      });
    });

    describe('Edge cases', () => {
      it('should handle invalid square notation gracefully', () => {
        const result = PgnAnnotationParser.parseComment('%cal Rz9z9,Ra1a2');
        expect(result.arrows).toHaveLength(1); // Only the valid one
        expect(result.arrows[0].from).toBe('a1');
      });

      it('should handle invalid color codes', () => {
        const result = PgnAnnotationParser.parseComment('%cal Xa1a2,Ra2a3');
        expect(result.arrows).toHaveLength(2);
      });

      it('should handle malformed annotations', () => {
        const result = PgnAnnotationParser.parseComment('%cal R,abc,Ra1a2');
        expect(result.arrows).toHaveLength(1); // Only the valid one
        expect(result.arrows[0].from).toBe('a1');
      });

      it('should return empty arrays for no annotations', () => {
        const result = PgnAnnotationParser.parseComment('Just a comment');
        expect(result.arrows).toHaveLength(0);
        expect(result.highlights).toHaveLength(0);
        expect(result.textComment).toBe('Just a comment');
      });
    });
  });

  describe('stripAnnotations', () => {
    it('should remove %cal annotations', () => {
      const result = PgnAnnotationParser.stripAnnotations('Good move %cal Rc8f5,Ra8d8 excellent!');
      expect(result).toBe('Good move excellent!');
    });

    it('should remove %csl annotations', () => {
      const result = PgnAnnotationParser.stripAnnotations('Strategic %csl Rd4,Gd5 position');
      expect(result).toBe('Strategic position');
    });

    it('should remove both types of annotations', () => {
      const result = PgnAnnotationParser.stripAnnotations('Text %cal Ra1a2 more %csl Gd4 end');
      expect(result).toBe('Text more end');
    });

    it('should preserve text without annotations', () => {
      const result = PgnAnnotationParser.stripAnnotations('Just a regular comment');
      expect(result).toBe('Just a regular comment');
    });
  });

  describe('fromDrawingObjects', () => {
    it('should create %cal string for arrows', () => {
      const arrows: Arrow[] = [
        { from: 'c8', to: 'f5', color: '#ff0000' },
        { from: 'a8', to: 'd8', color: '#00ff00' }
      ];
      const result = PgnAnnotationParser.fromDrawingObjects(arrows, []);
      expect(result).toBe('%cal Rc8f5,Ga8d8');
    });

    it('should create %csl string for circles', () => {
      const circles: SquareHighlight[] = [
        { square: 'd4', type: 'circle', color: '#ff0000' },
        { square: 'd5', type: 'circle', color: '#00ff00' }
      ];
      const result = PgnAnnotationParser.fromDrawingObjects([], circles);
      expect(result).toBe('%csl Rd4,Gd5');
    });

    it('should create combined string for both arrows and circles', () => {
      const arrows: Arrow[] = [{ from: 'c8', to: 'f5', color: '#ff0000' }];
      const circles: SquareHighlight[] = [{ square: 'd4', type: 'circle', color: '#00ff00' }];
      const result = PgnAnnotationParser.fromDrawingObjects(arrows, circles);
      expect(result).toBe('%cal Rc8f5 %csl Gd4');
    });

    it('should return empty string for no annotations', () => {
      const result = PgnAnnotationParser.fromDrawingObjects([], []);
      expect(result).toBe('');
    });

    it('should map colors correctly', () => {
      const arrows: Arrow[] = [
        { from: 'a1', to: 'a2', color: '#ff0000' }, // Red
        { from: 'b1', to: 'b2', color: '#00ff00' }, // Green  
        { from: 'c1', to: 'c2', color: '#ffff00' }, // Yellow
        { from: 'd1', to: 'd2', color: '#0000ff' }, // Blue
        { from: 'e1', to: 'e2', color: '#ff00ff' }  // Other color should default to Red
      ];
      const result = PgnAnnotationParser.fromDrawingObjects(arrows, []);
      expect(result).toBe('%cal Ra1a2,Gb1b2,Yc1c2,Bd1d2,Re1e2');
    });
  });

  describe('Color mapping utilities', () => {
    it('should map color codes to hex correctly', () => {
      expect(PgnAnnotationParser.colorToHex('R')).toBe('#ff0000');
      expect(PgnAnnotationParser.colorToHex('G')).toBe('#00ff00');
      expect(PgnAnnotationParser.colorToHex('Y')).toBe('#ffff00');
      expect(PgnAnnotationParser.colorToHex('B')).toBe('#0000ff');
      expect(PgnAnnotationParser.colorToHex('X')).toBe('#ff0000'); // Default to red
    });

    it('should map hex to color codes correctly', () => {
      expect(PgnAnnotationParser.hexToColor('#ff0000')).toBe('R');
      expect(PgnAnnotationParser.hexToColor('#00ff00')).toBe('G');
      expect(PgnAnnotationParser.hexToColor('#ffff00')).toBe('Y');
      expect(PgnAnnotationParser.hexToColor('#0000ff')).toBe('B');
      expect(PgnAnnotationParser.hexToColor('#ff00ff')).toBe('R'); // Default to red
    });
  });

  describe('Square validation', () => {
    it('should validate correct square notation', () => {
      expect(PgnAnnotationParser.isValidSquare('a1')).toBe(true);
      expect(PgnAnnotationParser.isValidSquare('h8')).toBe(true);
      expect(PgnAnnotationParser.isValidSquare('d4')).toBe(true);
    });

    it('should reject invalid square notation', () => {
      expect(PgnAnnotationParser.isValidSquare('i1')).toBe(false); // Invalid file
      expect(PgnAnnotationParser.isValidSquare('a9')).toBe(false); // Invalid rank
      expect(PgnAnnotationParser.isValidSquare('z1')).toBe(false); // Invalid file
      expect(PgnAnnotationParser.isValidSquare('a0')).toBe(false); // Invalid rank
      expect(PgnAnnotationParser.isValidSquare('')).toBe(false);   // Empty string
      expect(PgnAnnotationParser.isValidSquare('ab')).toBe(false); // Wrong format
    });
  });

  describe('Integration with real PGN comments', () => {
    it('should parse complex real-world annotations', () => {
      const comment = 'This is a strong move! %cal Rc8f5,Ga8d8,Ye8g8 %csl Rd4,Gd5,Yf7 The position is winning.';
      const result = PgnAnnotationParser.parseComment(comment);
      
      expect(result.arrows).toHaveLength(3);
      expect(result.highlights).toHaveLength(3);
      expect(result.textComment).toBe('This is a strong move! The position is winning.');
      
      // Verify specific arrows
      expect(result.arrows.some(a => a.from === 'c8' && a.to === 'f5' && a.color === '#ff0000')).toBe(true);
      expect(result.arrows.some(a => a.from === 'a8' && a.to === 'd8' && a.color === '#00ff00')).toBe(true);
      expect(result.arrows.some(a => a.from === 'e8' && a.to === 'g8' && a.color === '#ffff00')).toBe(true);
      
      // Verify specific circles
      expect(result.highlights.some(c => c.square === 'd4' && c.color === '#ff0000')).toBe(true);
      expect(result.highlights.some(c => c.square === 'd5' && c.color === '#00ff00')).toBe(true);
      expect(result.highlights.some(c => c.square === 'f7' && c.color === '#ffff00')).toBe(true);
    });
  });
});