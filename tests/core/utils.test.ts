import {
  FILES,
  RANKS,
  START_FEN,
  isWhitePiece,
  sq,
  sqToFR,
  parseFEN,
  InvalidFENError,
  clamp,
  lerp,
  easeOutCubic,
} from '../../src/core/utils';

describe('Chess Utils', () => {
  describe('Constants', () => {
    it('should have correct FILES array', () => {
      expect(FILES.slice(0, 8)).toEqual(['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h']);
      expect(FILES.length).toBeGreaterThanOrEqual(8);
    });

    it('should have correct RANKS array', () => {
      expect(RANKS.slice(0, 8)).toEqual(['1', '2', '3', '4', '5', '6', '7', '8']);
      expect(RANKS.length).toBeGreaterThanOrEqual(8);
    });

    it('should have valid starting position FEN', () => {
      expect(START_FEN).toBe('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1');
    });
  });

  describe('isWhitePiece', () => {
    it('should identify white pieces correctly', () => {
      expect(isWhitePiece('K')).toBe(true);
      expect(isWhitePiece('Q')).toBe(true);
      expect(isWhitePiece('R')).toBe(true);
      expect(isWhitePiece('B')).toBe(true);
      expect(isWhitePiece('N')).toBe(true);
      expect(isWhitePiece('P')).toBe(true);
    });

    it('should identify black pieces correctly', () => {
      expect(isWhitePiece('k')).toBe(false);
      expect(isWhitePiece('q')).toBe(false);
      expect(isWhitePiece('r')).toBe(false);
      expect(isWhitePiece('b')).toBe(false);
      expect(isWhitePiece('n')).toBe(false);
      expect(isWhitePiece('p')).toBe(false);
    });
  });

  describe('sq', () => {
    it('should create square notation from coordinates', () => {
      expect(sq(0, 0)).toBe('a1');
      expect(sq(7, 7)).toBe('h8');
      expect(sq(4, 3)).toBe('e4');
      expect(sq(9, 9)).toBe('j10');
    });
  });

  describe('sqToFR', () => {
    it('should convert square notation to file/rank coordinates', () => {
      expect(sqToFR('a1')).toEqual({ f: 0, r: 0 });
      expect(sqToFR('h8')).toEqual({ f: 7, r: 7 });
      expect(sqToFR('e4')).toEqual({ f: 4, r: 3 });
      expect(sqToFR('j10')).toEqual({ f: 9, r: 9 });
    });
  });

  describe('parseFEN', () => {
    it('should parse starting position correctly', () => {
      const state = parseFEN(START_FEN);

      expect(state.turn).toBe('w');
      expect(state.castling).toBe('KQkq');
      expect(state.ep).toBe(null);
      expect(state.halfmove).toBe(0);
      expect(state.fullmove).toBe(1);

      // Check some key pieces
      expect(state.board[0][0]).toBe('R'); // a1 white rook
      expect(state.board[0][4]).toBe('K'); // e1 white king
      expect(state.board[7][0]).toBe('r'); // a8 black rook
      expect(state.board[7][4]).toBe('k'); // e8 black king
      expect(state.board[1][0]).toBe('P'); // a2 white pawn
      expect(state.board[6][0]).toBe('p'); // a7 black pawn
    });

    it('should parse custom position correctly', () => {
      const customFEN = 'r1bqkb1r/pppp1ppp/2n2n2/4p3/2B1P3/5N2/PPPP1PPP/RNBQK2R b KQkq - 4 4';
      const state = parseFEN(customFEN);

      expect(state.turn).toBe('b');
      expect(state.halfmove).toBe(4);
      expect(state.fullmove).toBe(4);
    });

    it('should handle empty squares in FEN correctly', () => {
      const fenWithGaps = '8/8/8/8/8/8/8/8 w - - 0 1';
      const state = parseFEN(fenWithGaps);

      // All squares should be null/empty
      for (let r = 0; r < 8; r++) {
        for (let f = 0; f < 8; f++) {
          expect(state.board[r][f]).toBe(null);
        }
      }
    });

    it('supports non-standard board dimensions', () => {
      const fen = '10/10/10/10/10/10 w - - 0 1';
      const state = parseFEN(fen, { files: 10, ranks: 6 });

      expect(state.board).toHaveLength(6);
      for (const row of state.board) {
        expect(row).toHaveLength(10);
      }
    });

    it('throws an explicit error for malformed FEN strings', () => {
      expect(() => parseFEN('invalid fen')).toThrow(InvalidFENError);
      expect(() => parseFEN('invalid fen')).toThrow('Invalid FEN');
    });
  });

  describe('Math utilities', () => {
    describe('clamp', () => {
      it('should clamp values within range', () => {
        expect(clamp(5, 0, 10)).toBe(5);
        expect(clamp(-5, 0, 10)).toBe(0);
        expect(clamp(15, 0, 10)).toBe(10);
        expect(clamp(0, 0, 10)).toBe(0);
        expect(clamp(10, 0, 10)).toBe(10);
      });
    });

    describe('lerp', () => {
      it('should interpolate between values correctly', () => {
        expect(lerp(0, 10, 0)).toBe(0);
        expect(lerp(0, 10, 1)).toBe(10);
        expect(lerp(0, 10, 0.5)).toBe(5);
        expect(lerp(20, 30, 0.3)).toBe(23);
      });
    });

    describe('easeOutCubic', () => {
      it('should provide correct easing values', () => {
        expect(easeOutCubic(0)).toBe(0);
        expect(easeOutCubic(1)).toBe(1);
        expect(easeOutCubic(0.5)).toBeCloseTo(0.875, 3);
      });
    });
  });
});
