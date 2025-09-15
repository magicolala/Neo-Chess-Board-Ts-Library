import { PgnNotation } from '../../src/core/PgnNotation';
import { ChessJsRules } from '../../src/core/ChessJsRules';
import type { Square } from '../../src/core/types';

describe('PgnNotation with Annotations', () => {
  let rules: ChessJsRules;
  let pgnNotation: PgnNotation;

  beforeEach(() => {
    rules = new ChessJsRules();
    pgnNotation = new PgnNotation(rules);
  });

  describe('Loading PGN with annotations', () => {
    it('should parse a PGN with arrow annotations', () => {
      const pgn = `1. e4 {Great opening move! %cal Re1e4,Gd1h5} e5 2. Nf3 {%cal Rg1f3} Nc6`;

      pgnNotation.loadPgnWithAnnotations(pgn);
      const moves = pgnNotation.getMovesWithAnnotations();

      expect(moves).toHaveLength(2);

      // Check first move (1. e4)
      const firstMove = moves[0];
      expect(firstMove.whiteAnnotations).toBeDefined();
      expect(firstMove.whiteAnnotations?.arrows).toHaveLength(2);
      expect(
        firstMove.whiteAnnotations?.arrows?.some((a) => a.from === 'e1' && a.to === 'e4'),
      ).toBe(true);
      expect(
        firstMove.whiteAnnotations?.arrows?.some((a) => a.from === 'd1' && a.to === 'h5'),
      ).toBe(true);
      expect(firstMove.whiteAnnotations?.textComment).toBe('Great opening move!');

      // Check second move (2. Nf3)
      const secondMove = moves[1];
      expect(secondMove.whiteAnnotations).toBeDefined();
      expect(secondMove.whiteAnnotations?.arrows).toHaveLength(1);
      expect(secondMove.whiteAnnotations?.arrows?.[0].from).toBe('g1');
      expect(secondMove.whiteAnnotations?.arrows?.[0].to).toBe('f3');
      expect(secondMove.whiteAnnotations?.arrows?.[0].color).toBe('#ff0000');
    });

    it('should parse a PGN with circle annotations', () => {
      const pgn = `1. d4 {Controlling the center %csl Rd4,Ge4} Nf6 {%csl Gf6,Ye6} 2. c4`;

      pgnNotation.loadPgnWithAnnotations(pgn);
      const moves = pgnNotation.getMovesWithAnnotations();

      expect(moves).toHaveLength(2);

      // Check first move white (1. d4)
      const firstMove = moves[0];
      expect(firstMove.whiteAnnotations?.circles).toHaveLength(2);
      expect(
        firstMove.whiteAnnotations?.circles?.some(
          (c) => c.square === 'd4' && c.color === '#ff0000',
        ),
      ).toBe(true);
      expect(
        firstMove.whiteAnnotations?.circles?.some(
          (c) => c.square === 'e4' && c.color === '#00ff00',
        ),
      ).toBe(true);

      // Check first move black (1... Nf6)
      expect(firstMove.blackAnnotations?.circles).toHaveLength(2);
      expect(
        firstMove.blackAnnotations?.circles?.some(
          (c) => c.square === 'f6' && c.color === '#00ff00',
        ),
      ).toBe(true);
      expect(
        firstMove.blackAnnotations?.circles?.some(
          (c) => c.square === 'e6' && c.color === '#ffff00',
        ),
      ).toBe(true);
    });

    it('should parse a PGN with combined annotations', () => {
      const pgn = `1. e4 {Excellent! %cal Re1e4 %csl Rd4,Ge4} e5 {%cal Ge8e5 %csl Re5}`;

      pgnNotation.loadPgnWithAnnotations(pgn);
      const moves = pgnNotation.getMovesWithAnnotations();

      expect(moves).toHaveLength(1);

      const move = moves[0];

      // White annotations
      expect(move.whiteAnnotations?.arrows).toHaveLength(1);
      expect(move.whiteAnnotations?.circles).toHaveLength(2);
      expect(move.whiteAnnotations?.textComment).toBe('Excellent!');

      // Black annotations
      expect(move.blackAnnotations?.arrows).toHaveLength(1);
      expect(move.blackAnnotations?.circles).toHaveLength(1);
      expect(move.blackAnnotations?.arrows?.[0].color).toBe('#00ff00');
      expect(move.blackAnnotations?.circles?.[0].color).toBe('#ff0000');
    });
  });

  describe('Adding annotations to moves', () => {
    it('should add annotations to a specific move', () => {
      // Make some moves first
      rules.move({ from: 'e2', to: 'e4' });
      rules.move({ from: 'e7', to: 'e5' });

      // Import moves into pgnNotation instance
      pgnNotation.importFromChessJs(rules.getChessInstance());

      const arrows = [{ from: 'e1' as Square, to: 'e4' as Square, color: '#ff0000' }];
      const circles = [{ square: 'e4' as Square, type: 'circle' as const, color: '#00ff00' }];

      pgnNotation.addMoveAnnotations(1, true, {
        arrows,
        circles,
        textComment: 'Great move!',
      });

      const moves = pgnNotation.getMovesWithAnnotations();
      const firstMove = moves[0];

      expect(firstMove.whiteAnnotations).toBeDefined();
      expect(firstMove.whiteAnnotations?.arrows).toEqual(arrows);
      expect(firstMove.whiteAnnotations?.circles).toEqual(circles);
      expect(firstMove.whiteAnnotations?.textComment).toBe('Great move!');
    });

    it('should add annotations to black moves', () => {
      // Make some moves first
      rules.move({ from: 'e2', to: 'e4' });
      rules.move({ from: 'e7', to: 'e5' });

      // Import moves into pgnNotation instance
      pgnNotation.importFromChessJs(rules.getChessInstance());

      const circles = [{ square: 'e5' as Square, type: 'circle' as const, color: '#ffff00' }];

      pgnNotation.addMoveAnnotations(1, false, {
        arrows: [],
        circles,
        textComment: 'Solid response',
      });

      const moves = pgnNotation.getMovesWithAnnotations();
      const firstMove = moves[0];

      expect(firstMove.blackAnnotations).toBeDefined();
      expect(firstMove.blackAnnotations?.circles).toEqual(circles);
      expect(firstMove.blackAnnotations?.textComment).toBe('Solid response');
    });

    it('should handle adding annotations to non-existent moves gracefully', () => {
      const arrows = [{ from: 'e1' as Square, to: 'e4' as Square, color: '#ff0000' }];

      // Should not throw
      expect(() => {
        pgnNotation.addMoveAnnotations(5, true, {
          arrows,
          circles: [],
          textComment: 'This move does not exist',
        });
      }).not.toThrow();

      // Should create empty moves array since no moves exist
      const moves = pgnNotation.getMovesWithAnnotations();
      expect(moves).toHaveLength(0);
    });
  });

  describe('Exporting PGN with annotations', () => {
    it('should export PGN with arrow annotations', () => {
      // Make some moves
      rules.move({ from: 'e2', to: 'e4' });
      rules.move({ from: 'e7', to: 'e5' });

      // Import moves into pgnNotation instance
      pgnNotation.importFromChessJs(rules.getChessInstance());

      // Add annotations
      pgnNotation.addMoveAnnotations(1, true, {
        arrows: [
          { from: 'e1', to: 'e4', color: '#ff0000' },
          { from: 'd1', to: 'h5', color: '#00ff00' },
        ],
        circles: [],
        textComment: 'Strong opening',
      });

      const pgnWithAnnotations = pgnNotation.toPgnWithAnnotations();

      expect(pgnWithAnnotations).toContain('%cal Re1e4,Gd1h5');
      expect(pgnWithAnnotations).toContain('Strong opening');
      expect(pgnWithAnnotations).toContain('1. e4');
      expect(pgnWithAnnotations).toContain('e5');
    });

    it('should export PGN with circle annotations', () => {
      rules.move({ from: 'd2', to: 'd4' });
      rules.move({ from: 'd7', to: 'd5' });

      // Import moves into pgnNotation instance
      pgnNotation.importFromChessJs(rules.getChessInstance());

      pgnNotation.addMoveAnnotations(1, true, {
        arrows: [],
        circles: [
          { square: 'd4', type: 'circle', color: '#ff0000' },
          { square: 'e4', type: 'circle', color: '#ffff00' },
        ],
        textComment: 'Central control',
      });

      const pgnWithAnnotations = pgnNotation.toPgnWithAnnotations();

      expect(pgnWithAnnotations).toContain('%csl Rd4,Ye4');
      expect(pgnWithAnnotations).toContain('Central control');
    });

    it('should export PGN with combined annotations', () => {
      rules.move({ from: 'e2', to: 'e4' });
      rules.move({ from: 'c7', to: 'c5' });

      // Import moves into pgnNotation instance
      pgnNotation.importFromChessJs(rules.getChessInstance());

      pgnNotation.addMoveAnnotations(1, true, {
        arrows: [{ from: 'e1', to: 'e4', color: '#0000ff' }],
        circles: [{ square: 'e4', type: 'circle', color: '#00ff00' }],
        textComment: 'King pawn opening',
      });

      pgnNotation.addMoveAnnotations(1, false, {
        arrows: [{ from: 'c7', to: 'c5', color: '#ff0000' }],
        circles: [{ square: 'c5', type: 'circle', color: '#ff0000' }],
        textComment: 'Sicilian Defense',
      });

      const pgnWithAnnotations = pgnNotation.toPgnWithAnnotations();

      expect(pgnWithAnnotations).toContain('%cal Be1e4');
      expect(pgnWithAnnotations).toContain('%csl Ge4');
      expect(pgnWithAnnotations).toContain('King pawn opening');
      expect(pgnWithAnnotations).toContain('%cal Rc7c5');
      expect(pgnWithAnnotations).toContain('%csl Rc5');
      expect(pgnWithAnnotations).toContain('Sicilian Defense');
    });

    it('should preserve standard PGN format when no annotations are present', () => {
      rules.move({ from: 'e2', to: 'e4' });
      rules.move({ from: 'e7', to: 'e5' });
      rules.move({ from: 'g1', to: 'f3' });

      // Import moves into pgnNotation instance
      pgnNotation.importFromChessJs(rules.getChessInstance());

      const standardPgn = pgnNotation.toPgn();
      const annotatedPgn = pgnNotation.toPgnWithAnnotations();

      // Should be identical when no annotations are present
      expect(annotatedPgn.replace(/\s+/g, ' ').trim()).toBe(
        standardPgn.replace(/\s+/g, ' ').trim(),
      );
    });
  });

  describe('Round-trip testing (parse -> export)', () => {
    it('should maintain annotation integrity in round-trip', () => {
      const originalPgn = `1. e4 {Great move! %cal Re1e4,Gd1h5 %csl Rd4} e5 {%cal Ge7e5} 2. Nf3 {%csl Gf3,Ye4}`;

      // Parse the PGN
      pgnNotation.loadPgnWithAnnotations(originalPgn);

      // Export back to PGN
      const exportedPgn = pgnNotation.toPgnWithAnnotations();

      // Should contain all the annotation elements
      expect(exportedPgn).toContain('%cal Re1e4,Gd1h5');
      expect(exportedPgn).toContain('%csl Rd4');
      expect(exportedPgn).toContain('%cal Ge7e5');
      expect(exportedPgn).toContain('%csl Gf3,Ye4');
      expect(exportedPgn).toContain('Great move!');

      // Parse the exported PGN again
      const secondPgnNotation = new PgnNotation(new ChessJsRules());
      secondPgnNotation.loadPgnWithAnnotations(exportedPgn);

      // Should have same moves and annotations
      const originalMoves = pgnNotation.getMovesWithAnnotations();
      const secondMoves = secondPgnNotation.getMovesWithAnnotations();

      expect(secondMoves).toHaveLength(originalMoves.length);

      // Check that annotations are preserved
      for (let i = 0; i < originalMoves.length; i++) {
        const original = originalMoves[i];
        const second = secondMoves[i];

        if (original.whiteAnnotations) {
          expect(second.whiteAnnotations?.arrows).toEqual(original.whiteAnnotations.arrows);
          expect(second.whiteAnnotations?.circles).toEqual(original.whiteAnnotations.circles);
          expect(second.whiteAnnotations?.textComment?.trim()).toBe(
            original.whiteAnnotations.textComment?.trim(),
          );
        }

        if (original.blackAnnotations) {
          expect(second.blackAnnotations?.arrows).toEqual(original.blackAnnotations.arrows);
          expect(second.blackAnnotations?.circles).toEqual(original.blackAnnotations.circles);
          expect(second.blackAnnotations?.textComment?.trim()).toBe(
            original.blackAnnotations.textComment?.trim(),
          );
        }
      }
    });
  });

  describe('Error handling', () => {
    it('should handle malformed PGN gracefully', () => {
      const malformedPgn = '1. e4 {%cal Rinvalidmove} e5 {%csl Zinvalid}';

      expect(() => {
        pgnNotation.loadPgnWithAnnotations(malformedPgn);
      }).not.toThrow();

      const moves = pgnNotation.getMovesWithAnnotations();
      expect(moves).toHaveLength(1);

      // Invalid annotations should be filtered out
      expect(moves[0].whiteAnnotations?.arrows).toHaveLength(0);
      expect(moves[0].blackAnnotations?.circles).toHaveLength(0);
    });

    it('should handle empty comments gracefully', () => {
      const pgnWithEmptyComments = '1. e4 {} e5 {   } 2. Nf3';

      expect(() => {
        pgnNotation.loadPgnWithAnnotations(pgnWithEmptyComments);
      }).not.toThrow();

      const moves = pgnNotation.getMovesWithAnnotations();
      expect(moves).toHaveLength(2);
    });

    it('should handle PGN without comments', () => {
      const standardPgn = '1. e4 e5 2. Nf3 Nc6 3. Bb5';

      expect(() => {
        pgnNotation.loadPgnWithAnnotations(standardPgn);
      }).not.toThrow();

      const moves = pgnNotation.getMovesWithAnnotations();
      expect(moves.length).toBeGreaterThan(0);

      // No annotations should be present
      moves.forEach((move) => {
        expect(move.whiteAnnotations?.arrows || []).toHaveLength(0);
        expect(move.whiteAnnotations?.circles || []).toHaveLength(0);
        expect(move.blackAnnotations?.arrows || []).toHaveLength(0);
        expect(move.blackAnnotations?.circles || []).toHaveLength(0);
      });
    });
  });
});
