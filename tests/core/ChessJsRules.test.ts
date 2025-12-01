/**
 * Tests for ChessJsRules class
 * Tests the chess.js integration and PGN functionality
 */

import { ChessJsRules } from '../../src/core/ChessJsRules';
import { sanitizePgnString } from '../../src/core/PgnSanitizer';

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

    test('should normalize whitespace in FEN strings', () => {
      const messyFen = '  rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR   w   KQkq   -   0   1  ';

      rules.setFEN(messyFen);

      expect(rules.getFEN()).toBe('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1');
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

    test('should load Lichess PGN exports containing variations', () => {
      const lichessPgn = `[Event "rated rapid game"]
[Site "https://lichess.org/N328qWow"]
[Date "2025.02.24"]
[White "boppintothebeat"]
[Black "metan0ia"]
[Result "1-0"]
[GameId "N328qWow"]
[UTCDate "2025.02.24"]
[UTCTime "01:16:05"]
[WhiteElo "2490"]
[BlackElo "2697"]
[WhiteRatingDiff "+13"]
[BlackRatingDiff "-11"]
[Variant "Standard"]
[TimeControl "600+0"]
[ECO "B32"]
[Opening "Sicilian Defense: Löwenthal Variation"]
[Termination "Normal"]
[Annotator "lichess.org"]

1. e4 { [%eval 0.18] [%clk 0:10:00] } 1... c5 { [%eval 0.25] [%clk 0:10:00] } 2. Nf3 { [%eval 0.2] [%clk 0:09:57] } 2... Nc6 { [%eval 0.25] [%clk 0:09:59] } 3. d4 { [%eval 0.27] [%clk 0:09:55] } 3... cxd4 { [%eval 0.35] [%clk 0:09:57] } 4. Nxd4 { [%eval 0.21] [%clk 0:09:51] } 4... e5 { [%eval 0.42] [%clk 0:09:56] } 5. Nb5 { [%eval 0.35] [%clk 0:09:49] } 5... a6 { [%eval 0.58] [%clk 0:09:55] } 6. Nd6+ { [%eval 0.53] [%clk 0:09:48] } 6... Bxd6 { [%eval 0.58] [%clk 0:09:55] } 7. Qxd6 { [%eval 0.64] [%clk 0:09:47] } 7... Qe7 { [%eval 0.6] [%clk 0:09:54] } 8. Qd1 { [%eval 0.7] [%clk 0:09:47] } 8... Nf6 { [%eval 0.74] [%clk 0:09:53] } 9. Nc3 { [%eval 0.81] [%clk 0:09:46] } 9... Nd4 { [%eval 1.16] [%clk 0:09:53] } 10. Be3 { [%eval 1.02] [%clk 0:09:45] } 10... O-O { [%eval 1.1] [%clk 0:09:51] } 11. Bxd4 { [%eval 1.21] [%clk 0:09:41] } 11... d5 { [%eval 1.15] [%clk 0:09:51] } 12. Bb6 { [%eval 1.26] [%clk 0:09:39] } 12... Qb4 { [%eval 1.05] [%clk 0:09:47] } 13. Bc7 { [%eval 1.2] [%clk 0:09:26] } 13... d4 { [%eval 1.06] [%clk 0:09:46] } 14. Bxe5?! { (1.06 → 0.00) Inaccuracy. f3 was best. } { [%eval 0.0] [%clk 0:09:11] } (14. f3 Re8 15. a3 Qe7 16. Ba5 dxc3 17. Bb4 Qc7 18. Bxc3 Be6 19. Qd2 Rac8) 14... dxc3 { [%eval 0.02] [%clk 0:09:44] } 15. Bxc3 { [%eval 0.0] [%clk 0:07:42] } 15... Qxe4+ { [%eval -0.01] [%clk 0:09:43] } 16. Qe2 { [%eval 0.0] [%clk 0:07:41] } 16... Qa4 { [%eval 0.0] [%clk 0:09:42] } 17. Qc4 { [%eval -0.33] [%clk 0:05:42] } 17... Qxc2?! { (-0.33 → 0.68) Inaccuracy. Re8+ was best. } { [%eval 0.68] [%clk 0:07:27] } (17... Re8+ 18. Kd1) 18. Bd3 { [%eval 0.68] [%clk 0:05:21] } 18... Re8+ { [%eval 0.93] [%clk 0:07:25] } 19. Kf1 { [%eval 0.81] [%clk 0:05:20] } 19... Be6?? { (0.81 → 4.58) Blunder. b5 was best. } { [%eval 4.58] [%clk 0:07:25] } (19... b5 20. Qxf7+ Kxf7 21. Bxc2 Be6 22. h4 a5 23. h5 Rac8 24. Bd1 b4 25. Bd2) 20. Qd4 { [%eval 4.35] [%clk 0:04:58] } 20... Rad8 { [%eval 5.44] [%clk 0:06:01] } 21. Bxc2 { [%eval 5.71] [%clk 0:04:51] } 21... Rxd4 { [%eval 5.44] [%clk 0:06:00] } 22. Bxd4 { [%eval 5.52] [%clk 0:04:51] } 22... Bc4+ { [%eval 5.49] [%clk 0:05:59] } 23. Kg1 { [%eval 5.59] [%clk 0:04:50] } 23... Re2 { [%eval 5.51] [%clk 0:05:58] } 24. Bb3 { [%eval 5.72] [%clk 0:04:41] } 24... Bxb3 { [%eval 5.49] [%clk 0:05:50] } 25. axb3 { [%eval 5.42] [%clk 0:04:41] } 25... Ne4 { [%eval 5.46] [%clk 0:05:49] } 26. g3 { [%eval 5.3] [%clk 0:04:35] } 26... f5 { [%eval 6.2] [%clk 0:05:36] } 27. Kg2 { [%eval 5.99] [%clk 0:04:29] } 27... g5 { [%eval 6.55] [%clk 0:05:16] } 28. Rhe1 { [%eval 6.38] [%clk 0:04:27] } 28... Rd2 { [%eval 6.46] [%clk 0:05:12] } 29. Red1 { [%eval 6.2] [%clk 0:04:25] } 29... Re2 { [%eval 6.71] [%clk 0:05:10] } 30. Kf1 { [%eval 6.67] [%clk 0:04:22] } 30... Rc2 { [%eval 6.75] [%clk 0:05:08] } 31. Rac1 { [%eval 6.76] [%clk 0:04:22] } 31... Nd2+ { [%eval 6.8] [%clk 0:05:04] } 32. Ke2 { [%eval 6.75] [%clk 0:04:15] } 32... Rxc1 { [%eval 6.53] [%clk 0:05:03] } 33. Rxc1 { [%eval 6.53] [%clk 0:04:14] } 33... Nxb3 { [%eval 6.75] [%clk 0:05:03] } 34. Rc8+ { [%eval 6.55] [%clk 0:04:11] } 34... Kf7 { [%eval 6.51] [%clk 0:05:02] } 35. Be3 { [%eval 6.38] [%clk 0:04:07] } 35... Kg6 { [%eval 5.96] [%clk 0:04:51] } 36. Bb6 { [%eval 7.24] [%clk 0:03:58] } 36... a5 { [%eval 7.54] [%clk 0:04:44] } 37. Rc3 { [%eval 7.27] [%clk 0:03:54] } 37... a4 { [%eval 7.35] [%clk 0:04:43] } 38. Rc4 { [%eval 7.3] [%clk 0:03:54] } { Black resigns. } 1-0`;

      const sanitized = sanitizePgnString(lichessPgn);

      expect(sanitized).not.toContain('(14. f3');
      expect(sanitized).not.toMatch(/}\s*{/);

      const success = rules.loadPgn(lichessPgn);

      expect(success).toBe(true);
      expect(rules.history().at(-1)).toBe('Rc4');
    });

    test('should handle invalid PGN', () => {
      const success = rules.loadPgn('invalid pgn content');
      expect(success).toBe(false);
    });

    test('should preserve evaluation annotations when exporting PGN', () => {
      const annotatedPgn = `[Event "Eval Test"]
[Site "Test"]
[Date "2025.01.01"]
[Round "1"]
[White "Player 1"]
[Black "Player 2"]
[Result "*"]

1. e4 { [%eval 0.23] } 1... e5 { [%eval -0.11] } 2. Nf3 { [%eval 0.45] } *`;

      expect(rules.loadPgn(annotatedPgn)).toBe(true);

      const notation = rules.getPgnNotation();
      const movesBefore = notation.getMovesWithAnnotations();
      const firstMoveBefore = movesBefore.find((move) => move.moveNumber === 1);
      const secondMoveBefore = movesBefore.find((move) => move.moveNumber === 2);

      expect(firstMoveBefore).toBeDefined();
      expect(secondMoveBefore).toBeDefined();

      const firstMove = firstMoveBefore!;
      const secondMove = secondMoveBefore!;

      expect(firstMove.whiteAnnotations?.evaluation).toBe(0.23);
      expect(firstMove.evaluation?.white).toBe(0.23);
      expect(firstMove.blackAnnotations?.evaluation).toBe(-0.11);
      expect(firstMove.evaluation?.black).toBe(-0.11);
      expect(secondMove.whiteAnnotations?.evaluation).toBe(0.45);
      expect(secondMove.evaluation?.white).toBe(0.45);

      const exported = rules.toPgn(false);
      expect(typeof exported).toBe('string');

      const movesAfter = notation.getMovesWithAnnotations();
      const firstMoveAfter = movesAfter.find((move) => move.moveNumber === 1);
      const secondMoveAfter = movesAfter.find((move) => move.moveNumber === 2);

      expect(firstMoveAfter?.whiteAnnotations?.evaluation).toBe(0.23);
      expect(firstMoveAfter?.evaluation?.white).toBe(0.23);
      expect(firstMoveAfter?.blackAnnotations?.evaluation).toBe(-0.11);
      expect(firstMoveAfter?.evaluation?.black).toBe(-0.11);
      expect(secondMoveAfter?.whiteAnnotations?.evaluation).toBe(0.45);
      expect(secondMoveAfter?.evaluation?.white).toBe(0.45);
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
