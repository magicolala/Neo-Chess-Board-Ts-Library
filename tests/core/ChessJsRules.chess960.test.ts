import { ChessJsRules } from '../../src/core/ChessJsRules';
import { generateChess960Start } from '../../src/utils/chess960';

describe('ChessJsRules with Chess960', () => {
  it('should create a Chess960 rules adapter', () => {
    const rules = new ChessJsRules({ variant: 'chess960' });
    expect(rules.getVariant()).toBe('chess960');
  });

  it('should accept a Chess960 FEN position', () => {
    const chess960Fen = generateChess960Start(0);
    const rules = new ChessJsRules({ variant: 'chess960', fen: chess960Fen });
    expect(rules.getFEN()).toBe(chess960Fen);
  });

  it('should validate moves in Chess960', () => {
    const chess960Fen = generateChess960Start(0);
    const rules = new ChessJsRules({ variant: 'chess960', fen: chess960Fen });

    // Get legal moves
    const moves = rules.movesFrom('e2');
    expect(Array.isArray(moves)).toBe(true);
  });

  it('should handle castling in Chess960', () => {
    const chess960Fen = generateChess960Start(0);
    const rules = new ChessJsRules({ variant: 'chess960', fen: chess960Fen });

    // In Chess960, castling moves are still valid but work differently
    // The exact castling squares depend on the starting position
    const fen = rules.getFEN();
    expect(fen).toContain('KQkq'); // Castling rights should be present
  });

  it('should maintain variant when loading new FEN', () => {
    const rules = new ChessJsRules({ variant: 'chess960' });
    const chess960Fen = generateChess960Start(42);
    rules.setFEN(chess960Fen);
    expect(rules.getVariant()).toBe('chess960');
    expect(rules.getFEN()).toBe(chess960Fen);
  });

  it('should work with standard variant by default', () => {
    const rules = new ChessJsRules();
    expect(rules.getVariant()).toBe('standard');
  });

  it('should accept variant in constructor options', () => {
    const rules1 = new ChessJsRules({ variant: 'standard' });
    const rules2 = new ChessJsRules({ variant: 'chess960' });

    expect(rules1.getVariant()).toBe('standard');
    expect(rules2.getVariant()).toBe('chess960');
  });

  it('should preserve variant when cloning', () => {
    const chess960Fen = generateChess960Start(42);
    const rules = new ChessJsRules({ variant: 'chess960', fen: chess960Fen });
    const cloned = rules.clone();

    // Verify variant is preserved
    expect(cloned.getVariant()).toBe('chess960');
    expect(cloned.getFEN()).toBe(rules.getFEN());

    // Verify cloned instance is independent
    cloned.move({ from: 'e2', to: 'e4' });
    expect(cloned.getFEN()).not.toBe(rules.getFEN());
    expect(rules.getVariant()).toBe('chess960'); // Original still has variant
  });
});
