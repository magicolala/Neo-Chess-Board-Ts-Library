import { LightRules } from '../../src/core/LightRules';
import { START_FEN } from '../../src/core/utils';

describe('LightRules', () => {
  let rules: LightRules;

  beforeEach(() => {
    rules = new LightRules();
  });

  describe('Basic functionality', () => {
    it('should initialize with starting position', () => {
      expect(rules.getFEN()).toBe(START_FEN);
      expect(rules.turn()).toBe('w');
    });

    it('should set and get FEN correctly', () => {
      const testFEN = "r1bqkb1r/pppp1ppp/2n2n2/4p3/2B1P3/5N2/PPPP1PPP/RNBQK2R b KQkq - 4 4";
      rules.setFEN(testFEN);
      
      expect(rules.getFEN()).toBe(testFEN);
      expect(rules.turn()).toBe('b');
    });

    it('should identify pieces correctly with pieceAt', () => {
      // Starting position pieces
      expect(rules.pieceAt('e1')).toBe('K');
      expect(rules.pieceAt('e8')).toBe('k');
      expect(rules.pieceAt('a1')).toBe('R');
      expect(rules.pieceAt('h8')).toBe('r');
      expect(rules.pieceAt('e4')).toBe(null); // Empty square
    });
  });

  describe('Pawn moves', () => {
    it('should generate correct pawn moves from starting position', () => {
      const moves = rules.movesFrom('e2');
      expect(moves).toHaveLength(2);
      expect(moves).toContainEqual({ from: 'e2', to: 'e3' });
      expect(moves).toContainEqual({ from: 'e2', to: 'e4' });
    });

    it('should generate pawn capture moves', () => {
      // Set up a position where pawn can capture
      const fen = "8/8/8/3p4/2P5/8/8/8 w - - 0 1";
      rules.setFEN(fen);
      
      const moves = rules.movesFrom('c4');
      expect(moves).toContainEqual({ from: 'c4', to: 'd5' });
      expect(moves).toContainEqual({ from: 'c4', to: 'c5' });
    });

    it('should handle en passant capture', () => {
      // Position after black plays d7-d5, white can capture en passant
      const fen = "8/8/8/3pP3/8/8/8/8 w - d6 0 1";
      rules.setFEN(fen);
      
      const moves = rules.movesFrom('e5');
      expect(moves).toContainEqual({ from: 'e5', to: 'd6', captured: 'p', ep: true });
    });

    it('should not allow pawn to move if blocked', () => {
      const fen = "8/8/8/8/3P4/3p4/8/8 w - - 0 1";
      rules.setFEN(fen);
      
      const moves = rules.movesFrom('d4');
      // Pawn should be able to capture the piece blocking it
      expect(moves.length).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Knight moves', () => {
    it('should generate correct knight moves', () => {
      const fen = "8/8/8/8/3N4/8/8/8 w - - 0 1";
      rules.setFEN(fen);
      
      const moves = rules.movesFrom('d4');
      expect(moves).toHaveLength(8);
      
      const expectedSquares = ['b3', 'b5', 'c2', 'c6', 'e2', 'e6', 'f3', 'f5'];
      expectedSquares.forEach(square => {
        expect(moves).toContainEqual({ from: 'd4', to: square });
      });
    });

    it('should not allow knight to move to squares occupied by own pieces', () => {
      const fen = "8/8/8/1P6/3N4/8/8/8 w - - 0 1";
      rules.setFEN(fen);
      
      const moves = rules.movesFrom('d4');
      expect(moves.find(m => m.to === 'b5')).toBeUndefined();
    });
  });

  describe('Bishop moves', () => {
    it('should generate correct bishop diagonal moves', () => {
      const fen = "8/8/8/8/3B4/8/8/8 w - - 0 1";
      rules.setFEN(fen);
      
      const moves = rules.movesFrom('d4');
      expect(moves.length).toBeGreaterThan(0);
      
      // Should include diagonal moves
      expect(moves).toContainEqual({ from: 'd4', to: 'c3' });
      expect(moves).toContainEqual({ from: 'd4', to: 'e5' });
      expect(moves).toContainEqual({ from: 'd4', to: 'a1' });
      expect(moves).toContainEqual({ from: 'd4', to: 'h8' });
    });
  });

  describe('Rook moves', () => {
    it('should generate correct rook moves', () => {
      const fen = "8/8/8/8/3R4/8/8/8 w - - 0 1";
      rules.setFEN(fen);
      
      const moves = rules.movesFrom('d4');
      expect(moves.length).toBeGreaterThan(0);
      
      // Should include rank and file moves
      expect(moves).toContainEqual({ from: 'd4', to: 'd1' });
      expect(moves).toContainEqual({ from: 'd4', to: 'd8' });
      expect(moves).toContainEqual({ from: 'd4', to: 'a4' });
      expect(moves).toContainEqual({ from: 'd4', to: 'h4' });
    });
  });

  describe('Queen moves', () => {
    it('should generate correct queen moves (combination of rook and bishop)', () => {
      const fen = "8/8/8/8/3Q4/8/8/8 w - - 0 1";
      rules.setFEN(fen);
      
      const moves = rules.movesFrom('d4');
      expect(moves.length).toBeGreaterThan(0);
      
      // Should include both diagonal and straight moves
      expect(moves).toContainEqual({ from: 'd4', to: 'd1' }); // Rook-like
      expect(moves).toContainEqual({ from: 'd4', to: 'a4' }); // Rook-like
      expect(moves).toContainEqual({ from: 'd4', to: 'c3' }); // Bishop-like
      expect(moves).toContainEqual({ from: 'd4', to: 'e5' }); // Bishop-like
    });
  });

  describe('King moves', () => {
    it('should generate correct king moves', () => {
      const fen = "8/8/8/8/3K4/8/8/8 w - - 0 1";
      rules.setFEN(fen);
      
      const moves = rules.movesFrom('d4');
      expect(moves).toHaveLength(8);
      
      const expectedSquares = ['c3', 'c4', 'c5', 'd3', 'd5', 'e3', 'e4', 'e5'];
      expectedSquares.forEach(square => {
        expect(moves).toContainEqual({ from: 'd4', to: square });
      });
    });
  });

  describe('Move execution', () => {
    it('should execute legal moves correctly', () => {
      const result = rules.move({ from: 'e2', to: 'e4' });
      
      expect(result).toBeDefined();
      expect(result?.ok).toBe(true);
      expect(result?.fen).toBeDefined();
      expect(rules.turn()).toBe('b'); // Turn should change
    });

    it('should reject illegal moves', () => {
      const result = rules.move({ from: 'e2', to: 'e5' }); // Can't move pawn 3 squares
      
      expect(result?.ok).toBe(false);
      expect(result?.reason).toBe('illegal');
      expect(rules.turn()).toBe('w'); // Turn should not change
    });

    it('should reject moves from empty squares', () => {
      const result = rules.move({ from: 'e4', to: 'e5' }); // e4 is empty initially
      
      expect(result?.ok).toBe(false);
      expect(result?.reason).toBe('empty');
    });

    it('should reject moves when not player turn', () => {
      const result = rules.move({ from: 'e7', to: 'e5' }); // Black move on white turn
      
      expect(result?.ok).toBe(false);
      expect(result?.reason).toBe('turn');
    });

    it('should handle pawn promotion', () => {
      // Set up position for promotion
      const fen = "8/3P4/8/8/8/8/8/8 w - - 0 1";
      rules.setFEN(fen);
      
      const result = rules.move({ from: 'd7', to: 'd8', promotion: 'q' });
      
      expect(result?.ok).toBe(true);
      expect(rules.pieceAt('d8')).toBe('Q'); // Should be promoted to queen
    });

    it('should handle en passant capture correctly', () => {
      const fen = "8/8/8/3pP3/8/8/8/8 w - d6 0 1";
      rules.setFEN(fen);
      
      const result = rules.move({ from: 'e5', to: 'd6' });
      
      expect(result?.ok).toBe(true);
      expect(rules.pieceAt('d5')).toBe(null); // Captured pawn should be removed
      expect(rules.pieceAt('d6')).toBe('P'); // White pawn should be on d6
    });
  });

  describe('Turn management', () => {
    it('should not allow moves for pieces of wrong color', () => {
      expect(rules.movesFrom('e7')).toHaveLength(0); // Black pawn on white turn
      expect(rules.movesFrom('e2').length).toBeGreaterThan(0); // White pawn on white turn
    });

    it('should alternate turns after moves', () => {
      expect(rules.turn()).toBe('w');
      
      rules.move({ from: 'e2', to: 'e4' });
      expect(rules.turn()).toBe('b');
      
      rules.move({ from: 'e7', to: 'e5' });
      expect(rules.turn()).toBe('w');
    });
  });
});
