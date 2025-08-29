import type { Square, Color } from './types';

export const FILES = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'] as const;
export const RANKS = ['1', '2', '3', '4', '5', '6', '7', '8'] as const;

export const START_FEN = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";

export function isWhitePiece(piece: string): boolean {
  return piece === piece.toUpperCase();
}

export function sq(file: number, rank: number): Square {
  return (FILES[file] + RANKS[rank]) as Square;
}

export function sqToFR(square: Square): { f: number; r: number } {
  return {
    f: FILES.indexOf(square[0] as any),
    r: RANKS.indexOf(square[1] as any)
  };
}

export function parseFEN(fen: string) {
  const parts = fen.split(' ');
  const board: (string | null)[][] = Array(8).fill(null).map(() => Array(8).fill(null));
  
  const rows = parts[0].split('/');
  for (let r = 0; r < 8; r++) {
    const row = rows[r];
    let f = 0;
    for (const char of row) {
      if (/\d/.test(char)) {
        f += parseInt(char);
      } else {
        board[7 - r][f] = char;
        f++;
      }
    }
  }
  
  return {
    board,
    turn: (parts[1] || 'w') as Color,
    castling: parts[2] || 'KQkq',
    ep: parts[3] === '-' ? null : parts[3],
    halfmove: parseInt(parts[4] || '0'),
    fullmove: parseInt(parts[5] || '1')
  };
}

export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

export function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}
