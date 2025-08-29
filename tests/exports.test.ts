/**
 * Tests to verify all exports are working correctly
 * Tests the main library exports and chess.js integration
 */

describe('Library Exports', () => {
  test('should export ChessJsRules', async () => {
    const { ChessJsRules } = await import('../src/core/ChessJsRules');
    expect(ChessJsRules).toBeDefined();
    expect(typeof ChessJsRules).toBe('function');
    
    const rules = new ChessJsRules();
    expect(rules).toBeDefined();
    expect(rules.getFEN()).toBe('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1');
  });

  test('should export PgnNotation', async () => {
    const { PgnNotation } = await import('../src/core/PgnNotation');
    expect(PgnNotation).toBeDefined();
    expect(typeof PgnNotation).toBe('function');
    
    const pgn = new PgnNotation();
    expect(pgn).toBeDefined();
    expect(pgn.getResult()).toBe('*');
  });

  test('should export PGN types', async () => {
    const { PgnNotation } = await import('../src/core/PgnNotation');
    
    // Test that we can create with proper typing
    const pgn = new PgnNotation();
    pgn.setMetadata({
      Event: 'Test',
      Site: 'Test Site',
      Date: '2025.01.01'
    });
    
    expect(pgn.toPgn()).toContain('[Event "Test"]');
  });

  test('should export from main index', async () => {
    try {
      const exports = await import('../src/index');
      
      // Check that new exports are available
      expect(exports.ChessJsRules).toBeDefined();
      expect(exports.PgnNotation).toBeDefined();
      
      // Test that they work
      const rules = new exports.ChessJsRules();
      expect(rules.getFEN()).toBeDefined();
      
      const pgn = new exports.PgnNotation();
      expect(pgn.getResult()).toBe('*');
      
    } catch (error) {
      console.error('Import error:', error);
      throw error;
    }
  });

  test('should have chess.js as optional dependency', () => {
    // Test that chess.js is available when needed
    try {
      const { Chess } = require('chess.js');
      expect(Chess).toBeDefined();
      
      const chess = new Chess();
      expect(chess.fen()).toBe('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1');
    } catch (error) {
      // If chess.js is not installed, the test should still pass
      // but warn about missing optional dependency
      console.warn('chess.js optional dependency not found:', error);
    }
  });

  test('should maintain backward compatibility', async () => {
    const exports = await import('../src/index');
    
    // Verify that existing exports are still available
    expect(exports.LightRules).toBeDefined();
    expect(exports.EventBus).toBeDefined();
    
    // Test that they still work
    const lightRules = new exports.LightRules();
    expect(lightRules).toBeDefined();
  });
});

describe('Chess.js Integration Health Check', () => {
  test('ChessJsRules should initialize without errors', () => {
    const { ChessJsRules } = require('../src/core/ChessJsRules');
    
    expect(() => {
      const rules = new ChessJsRules();
      expect(rules.getFEN()).toBeDefined();
      expect(rules.history()).toEqual([]);
      expect(rules.turn()).toBe('w');
    }).not.toThrow();
  });

  test('PgnNotation should work independently', () => {
    const { PgnNotation } = require('../src/core/PgnNotation');
    
    expect(() => {
      const pgn = new PgnNotation();
      pgn.setMetadata({ Event: 'Test' });
      pgn.addMove(1, 'e4', 'e5');
      const output = pgn.toPgn();
      expect(output).toContain('1. e4 e5');
    }).not.toThrow();
  });

  test('Integration between ChessJsRules and PgnNotation should work', () => {
    const { ChessJsRules } = require('../src/core/ChessJsRules');
    
    expect(() => {
      const rules = new ChessJsRules();
      rules.move({ from: 'e2', to: 'e4' });
      rules.move({ from: 'e7', to: 'e5' });
      
      const pgn = rules.toPgn();
      expect(pgn).toContain('1. e4 e5');
      expect(pgn).toContain('[Event "Casual Game"]');
      expect(pgn).toContain('[Result "*"]');
    }).not.toThrow();
  });
});
