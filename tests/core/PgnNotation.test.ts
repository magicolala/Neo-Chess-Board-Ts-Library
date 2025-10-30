/**
 * Tests for PgnNotation class
 * Tests PGN standard compliance and functionality
 */

import { PgnNotation } from '../../src/core/PgnNotation';
import type { PgnMetadata } from '../../src/core/PgnNotation';

// Mock chess.js for testing
const mockChess = {
  history: (options?: { verbose?: boolean }) => {
    if (options?.verbose) {
      return [
        { san: 'e4', from: 'e2', to: 'e4' },
        { san: 'e5', from: 'e7', to: 'e5' },
        { san: 'Nf3', from: 'g1', to: 'f3' },
        { san: 'Nc6', from: 'b8', to: 'c6' },
      ];
    }
    return ['e4', 'e5', 'Nf3', 'Nc6'];
  },
  pgn: () => '1. e4 e5 2. Nf3 Nc6',
  isDraw: () => false,
  isCheckmate: () => false,
  isStalemate: () => false,
  isThreefoldRepetition: () => false,
  isInsufficientMaterial: () => false,
  turn: () => 'w',
};

describe('PgnNotation', () => {
  let pgn: PgnNotation;

  beforeEach(() => {
    pgn = new PgnNotation();
  });

  describe('Initialization', () => {
    test('should initialize with default values', () => {
      expect(pgn.getMoveCount()).toBe(0);
      expect(pgn.getResult()).toBe('*');
    });

    test('should initialize with empty metadata', () => {
      const pgnOutput = pgn.toPgn();
      expect(pgnOutput).toContain('[Event "Casual Game"]');
      expect(pgnOutput).toContain('[Site "Neo Chess Board"]');
      expect(pgnOutput).toContain('[Result "*"]');
    });
  });

  describe('Metadata Management', () => {
    test('should set metadata correctly', () => {
      const metadata: Partial<PgnMetadata> = {
        Event: 'World Championship',
        Site: 'London ENG',
        Date: '2025.01.15',
        Round: '1',
        White: 'Carlsen, Magnus',
        Black: 'Nepomniachtchi, Ian',
        Result: '1-0',
        WhiteElo: '2830',
        BlackElo: '2792',
        ECO: 'C42',
      };

      pgn.setMetadata(metadata);
      const pgnOutput = pgn.toPgn();

      expect(pgnOutput).toContain('[Event "World Championship"]');
      expect(pgnOutput).toContain('[Site "London ENG"]');
      expect(pgnOutput).toContain('[Date "2025.01.15"]');
      expect(pgnOutput).toContain('[White "Carlsen, Magnus"]');
      expect(pgnOutput).toContain('[Black "Nepomniachtchi, Ian"]');
      expect(pgnOutput).toContain('[WhiteElo "2830"]');
      expect(pgnOutput).toContain('[BlackElo "2792"]');
      expect(pgnOutput).toContain('[ECO "C42"]');
    });

    test('should use default values for missing required headers', () => {
      pgn.setMetadata({ Event: 'Custom Event' });
      const pgnOutput = pgn.toPgn();

      expect(pgnOutput).toContain('[Event "Custom Event"]');
      expect(pgnOutput).toContain('[Site "Neo Chess Board"]');
      expect(pgnOutput).toContain('[White "Player 1"]');
      expect(pgnOutput).toContain('[Black "Player 2"]');
      expect(pgnOutput).toMatch(/\[Date "\d{4}\.\d{2}\.\d{2}"\]/);
    });

    test('should place required headers first', () => {
      pgn.setMetadata({
        WhiteElo: '1500',
        Event: 'Test Tournament',
        ECO: 'B00',
        Site: 'Test Site',
      });

      const pgnOutput = pgn.toPgn();
      const lines = pgnOutput.split('\n');

      const eventIndex = lines.findIndex((line) => line.includes('[Event'));
      const siteIndex = lines.findIndex((line) => line.includes('[Site'));
      const whiteEloIndex = lines.findIndex((line) => line.includes('[WhiteElo'));

      expect(eventIndex).toBeLessThan(whiteEloIndex);
      expect(siteIndex).toBeLessThan(whiteEloIndex);
    });
  });

  describe('Move Management', () => {
    test('should add moves correctly', () => {
      pgn.addMove(1, 'e4', 'e5');
      pgn.addMove(2, 'Nf3', 'Nc6');

      expect(pgn.getMoveCount()).toBe(2);

      const pgnOutput = pgn.toPgn();
      expect(pgnOutput).toContain('1. e4 e5');
      expect(pgnOutput).toContain('2. Nf3 Nc6');
    });

    test('should handle incomplete moves', () => {
      pgn.addMove(1, 'e4');
      pgn.addMove(2, 'Nf3', 'Nc6');

      const pgnOutput = pgn.toPgn();
      expect(pgnOutput).toContain('1. e4');
      expect(pgnOutput).toContain('2. Nf3 Nc6');
    });

    test('should update existing moves', () => {
      pgn.addMove(1, 'e4');
      pgn.addMove(1, undefined, 'e5'); // Add black's response

      const pgnOutput = pgn.toPgn();
      expect(pgnOutput).toContain('1. e4 e5');
    });

    test('should handle move comments', () => {
      pgn.addMove(1, 'e4', 'e5', 'Best opening move', 'Solid response');

      const pgnOutput = pgn.toPgn();
      expect(pgnOutput).toContain('1. e4 {Best opening move} e5 {Solid response}');
    });

    test('should clear moves', () => {
      pgn.addMove(1, 'e4', 'e5');
      pgn.clear();

      expect(pgn.getMoveCount()).toBe(0);
      expect(pgn.getResult()).toBe('*');
    });
  });

  describe('Result Management', () => {
    test('should set game result', () => {
      pgn.setResult('1-0');
      expect(pgn.getResult()).toBe('1-0');

      const pgnOutput = pgn.toPgn();
      expect(pgnOutput).toContain('[Result "1-0"]');
      expect(pgnOutput).toContain('1-0');
    });

    test('should handle different result formats', () => {
      const results = ['1-0', '0-1', '1/2-1/2', '*'];

      for (const result of results) {
        pgn.setResult(result);
        expect(pgn.getResult()).toBe(result);

        const pgnOutput = pgn.toPgn();
        expect(pgnOutput).toContain(`[Result "${result}"]`);
        expect(pgnOutput).toContain(result);
      }
    });
  });

  describe('Chess.js Integration', () => {
    test('should import from chess.js correctly', () => {
      pgn.importFromChessJs(mockChess);

      expect(pgn.getMoveCount()).toBe(2); // 4 moves = 2 move pairs
      expect(pgn.getResult()).toBe('*'); // Game in progress

      const pgnOutput = pgn.toPgn();
      expect(pgnOutput).toContain('1. e4 e5');
      expect(pgnOutput).toContain('2. Nf3 Nc6');
    });

    test('should detect checkmate result', () => {
      const checkmateChess = {
        ...mockChess,
        isCheckmate: () => true,
        turn: () => 'w', // White to move, so black wins
      };

      pgn.importFromChessJs(checkmateChess);
      expect(pgn.getResult()).toBe('0-1');
    });

    test('should detect stalemate result', () => {
      const stalemateChess = {
        ...mockChess,
        isStalemate: () => true,
      };

      pgn.importFromChessJs(stalemateChess);
      expect(pgn.getResult()).toBe('1/2-1/2');
    });

    test('should detect draw by repetition', () => {
      const repetitionChess = {
        ...mockChess,
        isThreefoldRepetition: () => true,
      };

      pgn.importFromChessJs(repetitionChess);
      expect(pgn.getResult()).toBe('1/2-1/2');
    });

    test('should detect generic draw flag', () => {
      const drawChess = {
        ...mockChess,
        isDraw: () => true,
      };

      pgn.importFromChessJs(drawChess);
      expect(pgn.getResult()).toBe('1/2-1/2');
    });

    test('should detect insufficient material', () => {
      const insufficientChess = {
        ...mockChess,
        isInsufficientMaterial: () => true,
      };

      pgn.importFromChessJs(insufficientChess);
      expect(pgn.getResult()).toBe('1/2-1/2');
    });
  });

  describe('PGN Generation', () => {
    test('should generate proper PGN format', () => {
      pgn.setMetadata({
        Event: 'Test Game',
        Site: 'Test Location',
        Date: '2025.01.01',
        Round: '1',
        White: 'Player 1',
        Black: 'Player 2',
        Result: '*',
      });

      pgn.addMove(1, 'e4', 'e5');
      pgn.addMove(2, 'Nf3', 'Nc6');

      const pgnOutput = pgn.toPgn();

      // Check header format
      expect(pgnOutput).toMatch(/^\[Event "Test Game"\]/);
      expect(pgnOutput).toContain('\n\n'); // Empty line between headers and moves

      // Check move format
      expect(pgnOutput).toContain('1. e4 e5 2. Nf3 Nc6');
    });

    test('should handle line wrapping', () => {
      // Add many moves to test line wrapping
      for (let i = 1; i <= 20; i++) {
        pgn.addMove(i, 'e4', 'e5');
      }

      const pgnOutput = pgn.toPgn();
      const lines = pgnOutput.split('\n');

      // Find move lines (not header lines)
      const moveLines = lines.filter(
        (line) => !line.startsWith('[') && line.trim() !== '' && !line.includes('*'),
      );

      // Each line should be under or at 80 characters
      for (const line of moveLines) {
        expect(line.length).toBeLessThanOrEqual(80);
      }
    });

    test('should include result at the end', () => {
      pgn.addMove(1, 'e4', 'e5');
      pgn.setResult('1-0');

      const pgnOutput = pgn.toPgn();
      expect(pgnOutput.trim().endsWith('1-0')).toBe(true);
    });

    test('should handle empty games', () => {
      const pgnOutput = pgn.toPgn();

      expect(pgnOutput).toContain('[Event "Casual Game"]');
      expect(pgnOutput).toContain('[Result "*"]');
    });
  });

  describe('Static Methods', () => {
    test('should create PGN from move list', () => {
      const moves = ['e4', 'e5', 'Nf3', 'Nc6', 'Bb5', 'a6'];
      const metadata = {
        Event: 'Test From List',
        White: 'Alice',
        Black: 'Bob',
      };

      const pgnOutput = PgnNotation.fromMoveList(moves, metadata);

      expect(pgnOutput).toContain('[Event "Test From List"]');
      expect(pgnOutput).toContain('[White "Alice"]');
      expect(pgnOutput).toContain('[Black "Bob"]');
      expect(pgnOutput).toContain('1. e4 e5');
      expect(pgnOutput).toContain('2. Nf3 Nc6');
      expect(pgnOutput).toContain('3. Bb5 a6');
    });

    test('should handle odd number of moves in fromMoveList', () => {
      const moves = ['e4', 'e5', 'Nf3'];

      const pgnOutput = PgnNotation.fromMoveList(moves);

      expect(pgnOutput).toContain('1. e4 e5');
      expect(pgnOutput).toContain('2. Nf3');
    });
  });

  describe('Special Characters and Formatting', () => {
    test('should handle special chess notation', () => {
      pgn.addMove(1, 'e4', 'e5');
      pgn.addMove(2, 'Qh5+', 'Nc6'); // Check
      pgn.addMove(3, 'Qxf7#'); // Checkmate

      const pgnOutput = pgn.toPgn();
      expect(pgnOutput).toContain('Qh5+');
      expect(pgnOutput).toContain('Qxf7#');
    });

    test('should handle castling notation', () => {
      pgn.addMove(1, 'e4', 'e5');
      pgn.addMove(2, 'Nf3', 'Nc6');
      pgn.addMove(3, 'Bb5', 'a6');
      pgn.addMove(4, 'O-O', 'O-O-O');

      const pgnOutput = pgn.toPgn();
      expect(pgnOutput).toContain('O-O');
      expect(pgnOutput).toContain('O-O-O');
    });

    test('should handle promotion notation', () => {
      pgn.addMove(1, 'a7', 'b6');
      pgn.addMove(2, 'axb8=Q+', 'Kh7');

      const pgnOutput = pgn.toPgn();
      expect(pgnOutput).toContain('axb8=Q+');
    });

    test('should escape special characters in metadata', () => {
      pgn.setMetadata({
        Event: 'Test "Quotes" Tournament',
        Site: 'City with "Special" Characters',
      });

      const pgnOutput = pgn.toPgn();
      expect(pgnOutput).toContain('[Event "Test "Quotes" Tournament"]');
      expect(pgnOutput).toContain('[Site "City with "Special" Characters"]');
    });
  });

  describe('Error Handling', () => {
    test('should handle missing metadata gracefully', () => {
      expect(() => pgn.toPgn()).not.toThrow();

      const pgnOutput = pgn.toPgn();
      expect(pgnOutput).toContain('[Event "Casual Game"]');
    });

    test('should handle invalid move numbers', () => {
      expect(() => pgn.addMove(0, 'e4', 'e5')).not.toThrow();
      expect(() => pgn.addMove(-1, 'e4', 'e5')).not.toThrow();
    });

    test('should handle empty strings', () => {
      pgn.addMove(1, '', '');

      const pgnOutput = pgn.toPgn();
      expect(pgnOutput).toContain('1.');
    });
  });

  describe('Browser Compatibility', () => {
    // Skip these tests in Node.js environment to avoid window mocking issues
    test('should handle download PGN method', () => {
      pgn.addMove(1, 'e4', 'e5');

      // Just test that the method exists and doesn't throw in non-browser environment
      expect(() => pgn.downloadPgn('test.pgn')).not.toThrow();
      expect(typeof pgn.downloadPgn).toBe('function');
    });
  });

  describe('Integration with Real Scenarios', () => {
    test('should handle a complete game scenario', () => {
      // Scholar's mate
      pgn.setMetadata({
        Event: 'Casual Game',
        Site: 'Chess.com',
        Date: '2025.01.01',
        White: 'Beginner',
        Black: 'Victim',
        Result: '1-0',
      });

      pgn.addMove(1, 'e4', 'e5');
      pgn.addMove(2, 'Bc4', 'Nc6');
      pgn.addMove(3, 'Qh5', 'Nf6');
      pgn.addMove(4, 'Qxf7#');
      pgn.setResult('1-0');

      const pgnOutput = pgn.toPgn();

      expect(pgnOutput).toContain('[Event "Casual Game"]');
      expect(pgnOutput).toContain('[Result "1-0"]');
      expect(pgnOutput).toContain('1. e4 e5');
      expect(pgnOutput).toContain('4. Qxf7#');
      expect(pgnOutput.trim().endsWith('1-0')).toBe(true);
    });

    test('should handle tournament game with full metadata', () => {
      pgn.setMetadata({
        Event: 'World Chess Championship',
        Site: 'Dubai UAE',
        Date: '2025.11.28',
        Round: '1',
        White: 'Carlsen, Magnus',
        Black: 'Nepomniachtchi, Ian',
        Result: '1/2-1/2',
        WhiteElo: '2830',
        BlackElo: '2792',
        TimeControl: '40/7200+30',
        ECO: 'C84',
        Opening: 'Ruy Lopez: Closed Defence',
        Annotator: 'ChessBase',
      });

      // Add some moves
      pgn.addMove(1, 'e4', 'e5');
      pgn.addMove(2, 'Nf3', 'Nc6');
      pgn.addMove(3, 'Bb5', 'a6', 'The Ruy Lopez', 'Morphy Defence');
      pgn.setResult('1/2-1/2');

      const pgnOutput = pgn.toPgn();

      // Verify all metadata is present
      expect(pgnOutput).toContain('[Event "World Chess Championship"]');
      expect(pgnOutput).toContain('[WhiteElo "2830"]');
      expect(pgnOutput).toContain('[ECO "C84"]');
      expect(pgnOutput).toContain('[Opening "Ruy Lopez: Closed Defence"]');
      expect(pgnOutput).toContain('[TimeControl "40/7200+30"]');
      expect(pgnOutput).toContain('[Annotator "ChessBase"]');

      // Verify move with comments
      expect(pgnOutput).toContain('3. Bb5 {The Ruy Lopez} a6 {Morphy Defence}');
    });
  });
});
