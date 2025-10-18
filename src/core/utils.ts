import type { Square, Color } from './types';

const DEFAULT_LABEL_COUNT = 26;

function toFileLabel(index: number): string {
  if (index < 0) {
    throw new RangeError(`File index must be non-negative. Received: ${index}`);
  }

  let label = '';
  let current = index;

  do {
    const remainder = current % 26;
    label = String.fromCharCode(97 + remainder) + label;
    current = Math.floor(current / 26) - 1;
  } while (current >= 0);

  return label;
}

export function generateFileLabels(count: number): string[] {
  const safeCount = Math.max(0, Math.floor(count));
  const labels: string[] = [];
  for (let i = 0; i < safeCount; i++) {
    labels.push(toFileLabel(i));
  }
  return labels;
}

export function generateRankLabels(count: number): string[] {
  const safeCount = Math.max(0, Math.floor(count));
  return Array.from({ length: safeCount }, (_, index) => String(index + 1));
}

export interface ResolveBoardGeometryOptions {
  files: number;
  ranks: number;
  fileLabels?: readonly string[];
  rankLabels?: readonly string[];
  defaultFiles?: number;
  defaultRanks?: number;
}

export interface ResolvedBoardGeometry {
  files: number;
  ranks: number;
  fileLabels: string[];
  rankLabels: string[];
}

function sanitizeDimension(value: number, fallback: number): number {
  const normalizedFallback = Number.isFinite(fallback) ? fallback : 8;
  const candidate = Number.isFinite(value) ? value : normalizedFallback;
  const normalizedCandidate = Number.isFinite(candidate) ? candidate : normalizedFallback;
  const floored = Math.floor(normalizedCandidate);
  return Math.max(1, Number.isFinite(floored) ? floored : Math.floor(normalizedFallback) || 1);
}

export function resolveBoardGeometry({
  files,
  ranks,
  fileLabels,
  rankLabels,
  defaultFiles = 8,
  defaultRanks = 8,
}: ResolveBoardGeometryOptions): ResolvedBoardGeometry {
  const sanitizedFiles = sanitizeDimension(files, defaultFiles);
  const sanitizedRanks = sanitizeDimension(ranks, defaultRanks);

  const resolvedFileLabels =
    fileLabels && fileLabels.length >= sanitizedFiles
      ? fileLabels.slice(0, sanitizedFiles)
      : generateFileLabels(sanitizedFiles);

  const resolvedRankLabels =
    rankLabels && rankLabels.length >= sanitizedRanks
      ? rankLabels.slice(0, sanitizedRanks)
      : generateRankLabels(sanitizedRanks);

  return {
    files: sanitizedFiles,
    ranks: sanitizedRanks,
    fileLabels: resolvedFileLabels,
    rankLabels: resolvedRankLabels,
  };
}

export const FILES = Object.freeze(generateFileLabels(DEFAULT_LABEL_COUNT));
export const RANKS = Object.freeze(generateRankLabels(DEFAULT_LABEL_COUNT));

export const START_FEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';

export function isWhitePiece(piece: string): boolean {
  return piece === piece.toUpperCase();
}

export interface ParsedFENState {
  board: (string | null)[][];
  turn: Color;
  castling: string;
  ep: string | null;
  halfmove: number;
  fullmove: number;
}

export function sq(
  file: number,
  rank: number,
  files: readonly string[] = FILES,
  ranks: readonly string[] = RANKS,
): Square {
  const fileLabel = files[file];
  const rankLabel = ranks[rank];
  if (typeof fileLabel === 'undefined' || typeof rankLabel === 'undefined') {
    throw new RangeError(`Invalid square indices f=${file} r=${rank}`);
  }
  return `${fileLabel}${rankLabel}` as Square;
}

export function sqToFR(
  square: Square,
  files: readonly string[] = FILES,
  ranks: readonly string[] = RANKS,
): { f: number; r: number } {
  const normalized = square.toString().trim();
  const fileMatch = normalized.match(/^[a-zA-Z]+/);
  const rankPart = normalized.slice(fileMatch?.[0]?.length ?? 0);
  const filePart = (fileMatch?.[0] ?? '').toLowerCase();

  const f = files.findIndex((label) => label.toLowerCase() === filePart);
  const r = ranks.findIndex((label) => label === rankPart);

  if (f === -1 || r === -1) {
    throw new RangeError(`Invalid square notation: ${square}`);
  }

  return { f, r };
}

export function parseFEN(
  fen: string,
  dimensions: { files?: number; ranks?: number } = {},
): ParsedFENState {
  const parts = fen.split(' ');
  const files = Math.max(1, Math.floor(dimensions.files ?? 8));
  const ranks = Math.max(1, Math.floor(dimensions.ranks ?? 8));
  const board: (string | null)[][] = Array.from({ length: ranks }, () => Array(files).fill(null));

  const rows = parts[0].split('/');
  const rowCount = Math.min(rows.length, ranks);
  for (let r = 0; r < rowCount; r++) {
    const row = rows[r];
    let f = 0;
    for (let i = 0; i < row.length && f < files; i++) {
      const char = row[i];
      if (/\d/.test(char)) {
        let digits = char;
        while (i + 1 < row.length && /\d/.test(row[i + 1])) {
          digits += row[i + 1];
          i++;
        }
        f += parseInt(digits, 10);
      } else {
        const targetRank = ranks - 1 - r;
        if (f < files) {
          board[targetRank][f] = char;
        }
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
    fullmove: parseInt(parts[5] || '1'),
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
