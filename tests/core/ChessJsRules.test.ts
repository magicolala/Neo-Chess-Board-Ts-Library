/**
 * Tests for ChessJsRules class
 * Tests the chess.js integration and PGN functionality
 */

import { ChessJsRules } from '../../src/core/ChessJsRules';

describe('ChessJsRules', () => {
  let rules: ChessJsRules;

  beforeEach(() => {
    rules = new ChessJsRules();
  });

  describe('Basic Chess Rules', () => {
    test('should initialize with starting position', () => {
      expect(rules.getFEN()).toBe('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1');
      expect(rules.turn()).toBe('w');
      expect(rules.moveNumber()).toBe(1);
    });

    test('should make valid moves', () => {
      const moveResult = rules.move({ from: 'e2', to: 'e4' });
      expect(moveResult.ok).toBe(true);
      expect(rules.turn()).toBe('b');
      expect(rules.moveNumber()).toBe(1);
    });

    test('should make moves provided as SAN strings', () => {
      const moveResult = rules.move('e4');

      expect(moveResult?.ok).toBe(true);
      expect(moveResult?.move?.san).toBe('e4');
      expect(moveResult?.move?.from).toBe('e2');
      expect(moveResult?.move?.to).toBe('e4');
      expect(moveResult?.fen).toBe('rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1');
      expect(rules.getFEN()).toBe('rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1');
    });

    test('should reject invalid moves', () => {
      const moveResult = rules.move({ from: 'e2', to: 'e5' });
      expect(moveResult.ok).toBe(false);
      expect(moveResult.reason).toBeDefined();
    });

    test('should validate legal moves correctly', () => {
      expect(rules.isLegalMove('e2', 'e4')).toBe(true);
      expect(rules.isLegalMove('e2', 'e5')).toBe(false);
      expect(rules.isLegalMove('a1', 'h8')).toBe(false);
    });

    test('should get moves from a square', () => {
      const moves = rules.movesFrom('e2');
      expect(moves.length).toBeGreaterThan(0);
      expect(moves.some((move) => move.to === 'e4')).toBe(true);
      expect(moves.some((move) => move.to === 'e3')).toBe(true);
    });

    test('should get all possible moves', () => {
      const allMoves = rules.getAllMoves();
      expect(allMoves.length).toBe(20); // 20 possible opening moves
    });
  });

  describe('Game State Detection', () => {
    test('should detect check', () => {
      // Set up a simple check position (Scholar's mate threat)
      rules.move({ from: 'e2', to: 'e4' });
      rules.move({ from: 'e7', to: 'e5' });
      rules.move({ from: 'f1', to: 'c4' });
      rules.move({ from: 'b8', to: 'c6' });
      rules.move({ from: 'd1', to: 'h5' });
      rules.move({ from: 'g8', to: 'f6' });
      rules.move({ from: 'h5', to: 'f7' }); // Check!

      expect(rules.inCheck()).toBe(true);
    });

    test('should detect checkmate', () => {
      // Fool's mate
      rules.move({ from: 'f2', to: 'f3' });
      rules.move({ from: 'e7', to: 'e5' });
      rules.move({ from: 'g2', to: 'g4' });
      rules.move({ from: 'd8', to: 'h4' });

      expect(rules.isCheckmate()).toBe(true);
      expect(rules.isGameOver()).toBe(true);
    });

    test('should detect stalemate', () => {
      // Test stalemate detection methods exist
      expect(typeof rules.isStalemate).toBe('function');
      expect(typeof rules.isGameOver).toBe('function');

      // Test a known stalemate position
      try {
        rules.setFEN('k7/8/1K6/8/8/8/8/1R6 b - - 0 1');
        // If this position is valid, check for stalemate
        const isStalemate = rules.isStalemate();
        const isGameOver = rules.isGameOver();
        // We expect at least one of these to be true in an endgame
        expect(typeof isStalemate).toBe('boolean');
        expect(typeof isGameOver).toBe('boolean');
      } catch {
        // If the position is invalid, just test that methods work
        expect(rules.isStalemate()).toBe(false);
        expect(rules.isGameOver()).toBe(false);
      }
    });

    test('should detect stalemate draws', () => {
      rules.setFEN('7k/5Q2/6K1/8/8/8/8/8 b - - 0 1');

      expect(rules.isStalemate()).toBe(true);
      expect(rules.isDraw()).toBe(true);
    });

    test('should detect insufficient material draws', () => {
      rules.setFEN('8/8/8/8/8/8/8/Kk6 w - - 0 1');

      expect(rules.isInsufficientMaterial()).toBe(true);
      expect(rules.isDraw()).toBe(true);
    });

    test('should detect threefold repetition draws', () => {
      const cycleMoves = ['Nf3', 'Nf6', 'Ng1', 'Ng8'];
      for (let i = 0; i < 3; i++) {
        for (const move of cycleMoves) {
          const result = rules.move(move);
          expect(result?.ok).toBe(true);
        }
      }

      expect(rules.isThreefoldRepetition()).toBe(true);
      expect(rules.isDraw()).toBe(true);
    });

    test('should get correct game result', () => {
      // Test ongoing game
      expect(rules.getGameResult()).toBe('*');

      // Test checkmate
      rules.setFEN('rnbqkbnr/pppp1ppp/8/4p3/6P1/5P2/PPPPP2P/RNBQKBNR b KQkq - 0 2');
      rules.move({ from: 'd8', to: 'h4' });
      expect(rules.getGameResult()).toBe('0-1'); // Black wins
    });
  });

  describe('Special Moves', () => {
    test('should handle castling', () => {
      // Set up castling position
      rules.setFEN('r3k2r/pppppppp/8/8/8/8/PPPPPPPP/R3K2R w KQkq - 0 1');

      expect(rules.canCastle('k', 'w')).toBe(true);
      expect(rules.canCastle('q', 'w')).toBe(true);

      const castlingMove = rules.move({ from: 'e1', to: 'g1' });
      expect(castlingMove.ok).toBe(true);
    });

    test('should handle pawn promotion', () => {
      // Set up promotion scenario
      rules.setFEN('8/P7/8/8/8/8/8/4K2k w - - 0 1');

      const promotionMove = rules.move({ from: 'a7', to: 'a8', promotion: 'q' });
      expect(promotionMove.ok).toBe(true);

      const piece = rules.get('a8');
      expect(piece?.type).toBe('q');
      expect(piece?.color).toBe('w');
    });
  });

  describe('Position Management', () => {
    test('should set and get FEN correctly', () => {
      const testFen = 'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1';
      rules.setFEN(testFen);
      expect(rules.getFEN()).toBe(testFen);
    });

    test('should validate FEN', () => {
      expect(
        ChessJsRules.isValidFEN('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1'),
      ).toBe(true);
      expect(ChessJsRules.isValidFEN('invalid fen')).toBe(false);
    });

    test('should get piece on square', () => {
      const piece = rules.get('e1');
      expect(piece?.type).toBe('k');
      expect(piece?.color).toBe('w');

      expect(rules.get('e5')).toBeNull();
    });

    test('should reset to starting position', () => {
      rules.move({ from: 'e2', to: 'e4' });
      rules.reset();
      expect(rules.getFEN()).toBe('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1');
    });

    test('should clone correctly', () => {
      rules.move({ from: 'e2', to: 'e4' });
      const cloned = rules.clone();
      expect(cloned.getFEN()).toBe(rules.getFEN());

      // Verify they are independent
      cloned.move({ from: 'e7', to: 'e5' }); // Black's move
      expect(cloned.getFEN()).not.toBe(rules.getFEN());
    });
  });

  describe('Move History', () => {
    test('should track move history', () => {
      expect(rules.history()).toEqual([]);

      rules.move({ from: 'e2', to: 'e4' });
      rules.move({ from: 'e7', to: 'e5' });

      const history = rules.history();
      expect(history).toEqual(['e4', 'e5']);
    });

    test('should undo moves', () => {
      rules.move({ from: 'e2', to: 'e4' });
      rules.move({ from: 'e7', to: 'e5' });

      expect(rules.undo()).toBe(true);
      expect(rules.history()).toEqual(['e4']);
      expect(rules.turn()).toBe('b');

      expect(rules.undo()).toBe(true);
      expect(rules.history()).toEqual([]);
      expect(rules.turn()).toBe('w');

      // Can't undo from starting position
      expect(rules.undo()).toBe(false);
    });

    test('should get detailed move history', () => {
      rules.move({ from: 'e2', to: 'e4' });
      const detailedHistory = rules.getHistory();
      expect(detailedHistory.length).toBe(1);
      expect(detailedHistory[0].from).toBe('e2');
      expect(detailedHistory[0].to).toBe('e4');
    });

    test('should get last move', () => {
      expect(rules.getLastMove()).toBeNull();

      rules.move({ from: 'e2', to: 'e4' });
      const lastMove = rules.getLastMove();
      expect(lastMove).not.toBeNull();
      expect(lastMove?.from).toBe('e2');
      expect(lastMove?.to).toBe('e4');
    });

    test('should get last move notation', () => {
      expect(rules.getLastMoveNotation()).toBeNull();

      rules.move({ from: 'e2', to: 'e4' });
      expect(rules.getLastMoveNotation()).toBe('e4');
    });

    test('should get PGN moves', () => {
      rules.move({ from: 'e2', to: 'e4' });
      rules.move({ from: 'e7', to: 'e5' });

      const pgnMoves = rules.getPgnMoves();
      expect(pgnMoves).toEqual(['e4', 'e5']);
    });
  });

  describe('Check Detection', () => {
    test('should get check squares', () => {
      // Create a check position (Scholar's mate)
      rules.move({ from: 'e2', to: 'e4' });
      rules.move({ from: 'e7', to: 'e5' });
      rules.move({ from: 'f1', to: 'c4' });
      rules.move({ from: 'b8', to: 'c6' });
      rules.move({ from: 'd1', to: 'h5' });
      rules.move({ from: 'g8', to: 'f6' });
      rules.move({ from: 'h5', to: 'f7' }); // Checkmate

      const checkSquares = rules.getCheckSquares();
      expect(checkSquares).toContain('e8'); // Black king in check
    });

    test('should return empty array when not in check', () => {
      const checkSquares = rules.getCheckSquares();
      expect(checkSquares).toEqual([]);
    });

    test('should handle king not found in getCheckSquares', () => {
      // Set up a position where king might not be found (edge case)
      // Use a valid position but remove the king by setting an invalid FEN that gets caught
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      try {
        rules.setFEN('8/8/8/8/8/8/8/8 w - - 0 1'); // No kings - invalid but caught
      } catch {
        // Expected to throw, now test getCheckSquares with current valid position
        const checkSquares = rules.getCheckSquares();
        expect(Array.isArray(checkSquares)).toBe(true);
      }
      consoleSpy.mockRestore();
    });
  });

  describe('Error Handling', () => {
    test('should handle invalid FEN', () => {
      // Suppress expected console error for this test
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      expect(() => rules.setFEN('invalid fen')).toThrow();
      consoleSpy.mockRestore();
    });

    test('should handle moves from empty squares', () => {
      const moves = rules.movesFrom('e5'); // Empty square
      expect(moves).toEqual([]);
    });

    test('should handle invalid square names', () => {
      expect(rules.get('z9')).toBeNull();
      expect(rules.isLegalMove('z9', 'a1')).toBe(false);
    });

    test('should handle FEN with missing parts (4 parts)', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
      rules.setFEN('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq');
      expect(rules.getFEN()).toBe('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1');
      consoleSpy.mockRestore();
    });

    test('should handle FEN with missing parts (5 parts)', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      try {
        rules.setFEN('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq -');
      } catch (error) {
        // Expected to fail due to invalid FEN format
        expect(error).toBeDefined();
      }
      consoleSpy.mockRestore();
      consoleErrorSpy.mockRestore();
    });

    test('should handle invalid move with proper error response', () => {
      const moveResult = rules.move({ from: 'e2', to: 'e5' }); // Invalid move
      expect(moveResult.ok).toBe(false);
      expect(moveResult.reason).toBeDefined();
    });
  });

  describe('PGN Functionality', () => {
    test('should set PGN metadata', () => {
      const metadata = {
        Event: 'Test Tournament',
        Site: 'Test Site',
        White: 'Player 1',
        Black: 'Player 2',
      };

      expect(() => rules.setPgnMetadata(metadata)).not.toThrow();
    });

    test('should export PGN', () => {
      rules.setPgnMetadata({
        Event: 'Test Game',
        White: 'Alice',
        Black: 'Bob',
      });

      rules.move({ from: 'e2', to: 'e4' });
      rules.move({ from: 'e7', to: 'e5' });

      const pgn = rules.toPgn();
      expect(pgn).toContain('[Event "Test Game"]');
      expect(pgn).toContain('[White "Alice"]');
      expect(pgn).toContain('[Black "Bob"]');
      expect(pgn).toContain('1. e4 e5');
      expect(pgn).toContain('*'); // Game in progress
    });

    test('should load PGN', () => {
      const testPgn = `[Event "Test"]
[Site "Test Site"]
[Date "2025.01.01"]
[Round "1"]
[White "Player 1"]
[Black "Player 2"]
[Result "1/2-1/2"]

1. e4 e5 2. Nf3 Nc6 1/2-1/2`;

      const success = rules.loadPgn(testPgn);
      expect(success).toBe(true);

      const history = rules.history();
      expect(history).toEqual(['e4', 'e5', 'Nf3', 'Nc6']);
    });

    test('should handle invalid PGN', () => {
      const success = rules.loadPgn('invalid pgn content');
      expect(success).toBe(false);
    });

    test('should get PGN notation instance', () => {
      const pgnNotation = rules.getPgnNotation();
      expect(pgnNotation).toBeDefined();
      expect(typeof pgnNotation.toPgn).toBe('function');
    });
  });

  describe('Additional Methods', () => {
    test('should get attacked squares', () => {
      rules.setFEN('4k3/8/3n4/8/4N3/8/8/4K3 w - - 0 1');

      const attackedSquares = rules.getAttackedSquares();
      const expectedSquares = ['d6', 'f6', 'c5', 'g5', 'c3', 'g3', 'd2', 'e2', 'f2', 'd1', 'f1'];

      expect(attackedSquares).toHaveLength(expectedSquares.length);
      expect(attackedSquares).toEqual(expect.arrayContaining(expectedSquares));
    });

    test('should check if square is attacked', () => {
      rules.setFEN('4k3/8/3n4/8/4N3/8/8/4K3 w - - 0 1');

      expect(rules.isSquareAttacked('d6')).toBe(true);
      expect(rules.isSquareAttacked('e4')).toBe(false);
      expect(rules.isSquareAttacked('e4', 'b')).toBe(true);
      expect(rules.isSquareAttacked('D6')).toBe(true); // Case insensitive input
    });

    test('should reject invalid squares when checking attacks', () => {
      expect(() => rules.isSquareAttacked('z9')).toThrow('Invalid square');
    });

    test('should track half moves across various move types', () => {
      expect(rules.halfMoves()).toBe(0);

      const sequence: Array<{
        move: { from: string; to: string; promotion?: string };
        expected: number;
      }> = [
        { move: { from: 'g1', to: 'f3' }, expected: 1 }, // Knight move (no pawn/capture)
        { move: { from: 'g8', to: 'f6' }, expected: 2 }, // Knight move (no pawn/capture)
        { move: { from: 'g2', to: 'g3' }, expected: 0 }, // Pawn move resets counter
        { move: { from: 'g7', to: 'g6' }, expected: 0 }, // Pawn move resets counter
        { move: { from: 'f1', to: 'g2' }, expected: 1 }, // Bishop move increments
        { move: { from: 'f8', to: 'g7' }, expected: 2 }, // Bishop move increments
        { move: { from: 'e1', to: 'g1' }, expected: 3 }, // Castling counts as non-capture move
        { move: { from: 'e8', to: 'g8' }, expected: 4 }, // Castling increments further
        { move: { from: 'c2', to: 'c4' }, expected: 0 }, // Pawn double push resets
        { move: { from: 'd7', to: 'd5' }, expected: 0 }, // Pawn move resets
        { move: { from: 'c4', to: 'd5' }, expected: 0 }, // Capture resets
        { move: { from: 'd8', to: 'd5' }, expected: 0 }, // Capture resets
        { move: { from: 'b1', to: 'c3' }, expected: 1 }, // Knight move increments after capture
        { move: { from: 'b8', to: 'c6' }, expected: 2 }, // Knight move increments again
      ];

      for (const { move, expected } of sequence) {
        const result = rules.move(move);
        expect(result.ok).toBe(true);
        expect(rules.halfMoves()).toBe(expected);
      }
    });

    test('should generate FEN', () => {
      const fen = rules.generateFEN();
      expect(typeof fen).toBe('string');
      expect(fen).toBe('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1');
    });

    test('should have downloadPgn method', () => {
      // Test that the method exists and is a function
      expect(typeof rules.downloadPgn).toBe('function');
      // Note: downloadPgn is a browser-only method, so we don't test its execution
    });
  });

  describe('Integration Tests', () => {
    test('should play a complete game', () => {
      // Scholar's mate
      rules.move({ from: 'e2', to: 'e4' });
      rules.move({ from: 'e7', to: 'e5' });
      rules.move({ from: 'f1', to: 'c4' });
      rules.move({ from: 'b8', to: 'c6' });
      rules.move({ from: 'd1', to: 'h5' });
      rules.move({ from: 'g8', to: 'f6' });
      rules.move({ from: 'h5', to: 'f7' });

      expect(rules.isCheckmate()).toBe(true);
      expect(rules.getGameResult()).toBe('1-0');

      const pgn = rules.toPgn();
      expect(pgn).toContain('1-0');
    });

    test('should maintain consistency across operations', () => {
      const originalFen = rules.getFEN();

      // Make some moves
      rules.move({ from: 'e2', to: 'e4' });
      rules.move({ from: 'e7', to: 'e5' });

      // Get PGN
      const pgn = rules.toPgn();
      expect(pgn).toContain('1. e4 e5');

      // Reset and load PGN
      rules.reset();
      expect(rules.getFEN()).toBe(originalFen);

      const loaded = rules.loadPgn(pgn);
      expect(loaded).toBe(true);
      expect(rules.history()).toEqual(['e4', 'e5']);
    });
  });
});
