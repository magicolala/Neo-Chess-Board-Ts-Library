import type {
  Square,
  Color,
  SquareMatrix,
  SquareDataType,
  BoardOrientation,
  Piece,
  PieceDataType,
  PositionDataType,
  AnimationEasing,
  AnimationEasingName,
} from './types';
import { InvalidFENError, type FenErrorCode, type FenErrorDetails } from './errors';

export { InvalidFENError } from './errors';

const DEFAULT_LABEL_COUNT = 26;

function toFileLabel(index: number): string {
  if (index < 0) {
    throw new RangeError(`File index must be non-negative. Received: ${index}`);
  }

  let label = '';
  let current = index;

  do {
    const remainder = current % 26;
    label = String.fromCodePoint(97 + remainder) + label;
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

export interface GenerateBoardOptions {
  files: number;
  ranks: number;
  orientation?: BoardOrientation;
  fileLabels?: readonly string[];
  rankLabels?: readonly string[];
}

export interface RowIndexToChessRowParams {
  rowIndex: number;
  totalRanks: number;
  orientation?: BoardOrientation;
  rankLabels?: readonly string[];
}

export interface RowIndexToChessRowResult {
  rowIndex: number;
  rankIndex: number;
  rankLabel: string;
}

export interface ColumnIndexToChessColumnParams {
  columnIndex: number;
  totalFiles: number;
  orientation?: BoardOrientation;
  fileLabels?: readonly string[];
}

export interface ColumnIndexToChessColumnResult {
  columnIndex: number;
  fileIndex: number;
  fileLabel: string;
}

export interface ChessColumnToColumnIndexParams {
  column: string;
  totalFiles: number;
  orientation?: BoardOrientation;
  fileLabels?: readonly string[];
}

export interface ChessRowToRowIndexParams {
  row: string | number;
  totalRanks: number;
  orientation?: BoardOrientation;
  rankLabels?: readonly string[];
}

export interface ChessRowToRowIndexResult {
  rowIndex: number;
  rankIndex: number;
  rankLabel: string;
}

export interface RelativeCoordsConfig {
  boardWidth: number;
  boardHeight: number;
  files: number;
  ranks: number;
  orientation?: BoardOrientation;
  fileLabels?: readonly string[];
  rankLabels?: readonly string[];
}

export interface RelativeCoord {
  square: Square;
  topLeft: { x: number; y: number };
  center: { x: number; y: number };
  squareWidth: number;
  squareHeight: number;
}

function sanitizeDimension(value: number, fallback: number): number {
  const normalizedFallback = Number.isFinite(fallback) ? fallback : 8;
  const candidate = Number.isFinite(value) ? value : normalizedFallback;
  const normalizedCandidate = Number.isFinite(candidate) ? candidate : normalizedFallback;
  const floored = Math.floor(normalizedCandidate);
  return Math.max(1, Number.isFinite(floored) ? floored : Math.floor(normalizedFallback) || 1);
}

function normalizeOrientation(orientation?: BoardOrientation): BoardOrientation {
  return orientation === 'black' ? 'black' : 'white';
}

function resolveFileLabels(totalFiles: number, fileLabels?: readonly string[]): string[] {
  if (!Number.isFinite(totalFiles) || totalFiles < 1) {
    throw new RangeError(`totalFiles must be a positive integer. Received: ${totalFiles}`);
  }

  const count = Math.max(1, Math.floor(totalFiles));
  if (fileLabels && fileLabels.length >= count) {
    return fileLabels.slice(0, count);
  }
  return generateFileLabels(count);
}

function resolveRankLabels(totalRanks: number, rankLabels?: readonly string[]): string[] {
  if (!Number.isFinite(totalRanks) || totalRanks < 1) {
    throw new RangeError(`totalRanks must be a positive integer. Received: ${totalRanks}`);
  }

  const count = Math.max(1, Math.floor(totalRanks));
  if (rankLabels && rankLabels.length >= count) {
    return rankLabels.slice(0, count);
  }
  return generateRankLabels(count);
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

type FenValidationFail = (code: FenErrorCode, reason: string, details?: FenErrorDetails) => never;

function validateBoardRows(rows: string[], fail: FenValidationFail): void {
  const piecePattern = /^[prnbqkPRNBQK]$/;
  let describedFiles: number | null = null;

  for (const [index, row] of rows.entries()) {
    let totalSquares = 0;
    let i = 0;
    while (i < row.length) {
      const char = row[i]!;
      if (/\d/.test(char)) {
        let digits = char;
        i += 1;
        while (i < row.length && /\d/.test(row[i]!)) {
          digits += row[i]!;
          i += 1;
        }
        const emptyCount = Number.parseInt(digits, 10);
        if (!Number.isFinite(emptyCount) || emptyCount <= 0) {
          fail(
            'INVALID_FEN_INVALID_EMPTY_SQUARE_COUNT',
            `FEN rank ${index + 1} contains an invalid empty square count: ${digits}.`,
            { rank: index + 1, row, digits },
          );
        }
        totalSquares += emptyCount;
      } else if (piecePattern.test(char)) {
        totalSquares += 1;
        i += 1;
      } else {
        fail(
          'INVALID_FEN_INVALID_PIECE',
          `FEN rank ${index + 1} contains an invalid character: '${char}'.`,
          { rank: index + 1, row, character: char },
        );
      }
    }

    if (totalSquares === 0) {
      fail(
        'INVALID_FEN_RANK_NO_SQUARES',
        `FEN rank ${index + 1} must describe at least one square.`,
        {
          rank: index + 1,
          row,
        },
      );
    }

    if (describedFiles === null) {
      describedFiles = totalSquares;
    } else if (totalSquares !== describedFiles) {
      fail(
        'INVALID_FEN_INCONSISTENT_ROW_LENGTH',
        `FEN rank ${index + 1} must describe exactly ${describedFiles} squares but received ${totalSquares}.`,
        {
          rank: index + 1,
          row,
          expectedFiles: describedFiles,
          actualFiles: totalSquares,
        },
      );
    }
  }
}

function validateFenString(fen: string): string[] {
  const trimmedFen = fen.trim();
  const baseDetails: FenErrorDetails = { fen: trimmedFen || fen };
  const fail: FenValidationFail = (
    code: FenErrorCode,
    reason: string,
    details?: FenErrorDetails,
  ) => {
    throw new InvalidFENError(`Invalid FEN: ${reason}`, code, {
      ...baseDetails,
      ...details,
    });
  };

  if (!trimmedFen) {
    fail('INVALID_FEN_EMPTY', 'FEN string cannot be empty.');
  }

  const parts = trimmedFen.split(/\s+/);
  if (parts.length === 0 || parts.length > 6) {
    fail(
      'INVALID_FEN_FIELD_COUNT',
      `FEN string must contain between 1 and 6 fields. Received ${parts.length}.`,
      { fieldValue: String(parts.length) },
    );
  }

  const boardPart = parts[0];
  const rows = boardPart.split('/');
  if (rows.length === 0) {
    fail('INVALID_FEN_BOARD_EMPTY', 'FEN board description must contain at least one rank.');
  }

  validateBoardRows(rows, fail);

  if (parts[1] && parts[1] !== 'w' && parts[1] !== 'b') {
    fail(
      'INVALID_FEN_ACTIVE_COLOR',
      `FEN active color must be either 'w' or 'b', received '${parts[1]}'.`,
      { fieldValue: parts[1] },
    );
  }

  return parts;
}

export function sq(
  file: number,
  rank: number,
  files: readonly string[] = FILES,
  ranks: readonly string[] = RANKS,
): Square {
  const fileLabel = files[file];
  const rankLabel = ranks[rank];
  if (fileLabel === undefined || rankLabel === undefined) {
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
  const fileMatch = /^[a-zA-Z]+/.exec(normalized);
  const rankPart = normalized.slice(fileMatch?.[0]?.length ?? 0);
  const filePart = (fileMatch?.[0] ?? '').toLowerCase();

  const f = files.findIndex((label) => label.toLowerCase() === filePart);
  const r = ranks.indexOf(rankPart);

  if (f === -1 || r === -1) {
    throw new RangeError(`Invalid square notation: ${square}`);
  }

  return { f, r };
}

export function getRelativeCoords<T extends Square | readonly Square[]>(
  config: RelativeCoordsConfig,
  squares: T,
): T extends readonly Square[] ? RelativeCoord[] : RelativeCoord {
  const boardWidth = Number(config.boardWidth);
  const boardHeight = Number(config.boardHeight);

  if (!Number.isFinite(boardWidth) || boardWidth <= 0) {
    throw new RangeError(`boardWidth must be a positive number. Received: ${config.boardWidth}`);
  }
  if (!Number.isFinite(boardHeight) || boardHeight <= 0) {
    throw new RangeError(`boardHeight must be a positive number. Received: ${config.boardHeight}`);
  }

  const files = sanitizeDimension(config.files, config.files);
  const ranks = sanitizeDimension(config.ranks, config.ranks);
  const orientation = normalizeOrientation(config.orientation);

  const resolvedFileLabels = resolveFileLabels(files, config.fileLabels);
  const resolvedRankLabels = resolveRankLabels(ranks, config.rankLabels);

  const squareWidth = boardWidth / files;
  const squareHeight = boardHeight / ranks;
  const maxFile = files - 1;
  const maxRank = ranks - 1;

  const targetSquares = Array.isArray(squares) ? squares : [squares];

  const results = targetSquares.map((targetSquare) => {
    const { f, r } = sqToFR(targetSquare, resolvedFileLabels, resolvedRankLabels);
    const fileIndex = orientation === 'white' ? f : maxFile - f;
    const rankIndex = orientation === 'white' ? maxRank - r : r;
    const x = fileIndex * squareWidth;
    const y = rankIndex * squareHeight;

    return {
      square: targetSquare,
      topLeft: { x, y },
      center: { x: x + squareWidth / 2, y: y + squareHeight / 2 },
      squareWidth,
      squareHeight,
    };
  });

  return (Array.isArray(squares) ? results : results[0]) as T extends readonly Square[]
    ? RelativeCoord[]
    : RelativeCoord;
}

/**
 * Parse une ligne de FEN et la place dans le plateau
 */
function parseFenRow(
  rowString: string,
  rowIndex: number,
  board: (string | null)[][],
  files: number,
): void {
  let fileIndex = 0;
  let charIndex = 0;

  while (charIndex < rowString.length && fileIndex < files) {
    const char = rowString[charIndex];

    if (/\d/.test(char)) {
      // Compte les cases vides consécutives
      let digitEnd = charIndex + 1;
      while (digitEnd < rowString.length && /\d/.test(rowString[digitEnd])) {
        digitEnd++;
      }

      const emptyCount = Number.parseInt(rowString.slice(charIndex, digitEnd), 10);
      fileIndex += emptyCount;
      charIndex = digitEnd;
      continue;
    }

    // C'est une pièce
    const targetRank = board.length - 1 - rowIndex;
    if (fileIndex < files && targetRank >= 0) {
      board[targetRank][fileIndex] = char;
    }
    fileIndex++;
    charIndex++;
  }
}

/**
 * Parse le plateau (la première partie du FEN)
 */
function parseFenBoard(boardString: string, files: number, ranks: number): (string | null)[][] {
  const board: (string | null)[][] = Array.from({ length: ranks }, () =>
    Array.from({ length: files }, () => null),
  );

  const rows = boardString.split('/');
  const rowCount = Math.min(rows.length, ranks);

  for (let r = 0; r < rowCount; r++) {
    parseFenRow(rows[r], r, board, files);
  }

  return board;
}

export function parseFEN(
  fen: string,
  dimensions: { files?: number; ranks?: number } = {},
): ParsedFENState {
  const files = Math.max(1, Math.floor(dimensions.files ?? 8));
  const ranks = Math.max(1, Math.floor(dimensions.ranks ?? 8));
  const parts = validateFenString(fen);

  const board = parseFenBoard(parts[0], files, ranks);

  return {
    board,
    turn: (parts[1] || 'w') as Color,
    castling: parts[2] || 'KQkq',
    ep: parts[3] === '-' ? null : parts[3],
    halfmove: Number.parseInt(parts[4] || '0'),
    fullmove: Number.parseInt(parts[5] || '1'),
  };
}

export interface FenStringToPositionObjectOptions {
  files?: number;
  ranks?: number;
  fileLabels?: readonly string[];
  rankLabels?: readonly string[];
}

export function fenStringToPositionObject(
  fen: string,
  options: FenStringToPositionObjectOptions = {},
): PositionDataType {
  const { files, ranks, fileLabels, rankLabels } = options;
  const parsed = parseFEN(fen, { files, ranks });
  const board = parsed.board;

  const totalRanks = board.length;
  const totalFiles = totalRanks > 0 ? board[0]!.length : Math.max(1, Math.floor(files ?? 8));

  const resolvedFileLabels = resolveFileLabels(totalFiles, fileLabels);
  const resolvedRankLabels = resolveRankLabels(totalRanks, rankLabels);

  const position: PositionDataType = {};

  for (let r = 0; r < totalRanks; r++) {
    const row = board[r];
    for (let f = 0; f < totalFiles; f++) {
      const piece = row[f];
      if (!piece) {
        continue;
      }

      const square = sq(f, r, resolvedFileLabels, resolvedRankLabels);
      position[square] = { pieceType: piece as Piece };
    }
  }

  return position;
}

export interface GetPositionUpdatesOptions extends FenStringToPositionObjectOptions {
  previousOrientation?: BoardOrientation;
  nextOrientation?: BoardOrientation;
}

export interface PositionUpdateResult {
  added: PositionDataType;
  removed: Square[];
}

function clonePosition(position: PositionDataType): PositionDataType {
  return Object.entries(position).reduce<PositionDataType>((acc, [square, piece]) => {
    if (piece) {
      acc[square as Square] = { pieceType: piece.pieceType };
    }
    return acc;
  }, {});
}

export function getPositionUpdates(
  previous: string | PositionDataType,
  next: string | PositionDataType,
  options: GetPositionUpdatesOptions = {},
): PositionUpdateResult {
  const {
    previousOrientation = 'white',
    nextOrientation = previousOrientation,
    ...fenOptions
  } = options;

  const resolvePosition = (value: string | PositionDataType): PositionDataType =>
    typeof value === 'string' ? fenStringToPositionObject(value, fenOptions) : clonePosition(value);

  const previousPosition = resolvePosition(previous);
  const nextPosition = resolvePosition(next);

  const removedSet = new Set<Square>();
  const added: PositionDataType = {};

  const orientationChanged = previousOrientation !== nextOrientation;

  if (orientationChanged) {
    for (const square of Object.keys(previousPosition) as Square[]) {
      removedSet.add(square);
    }
    for (const [square, piece] of Object.entries(nextPosition) as Array<
      [Square, PieceDataType | undefined]
    >) {
      if (piece) {
        added[square] = { pieceType: piece.pieceType };
      }
    }
  } else {
    const squares = new Set<Square>([
      ...(Object.keys(previousPosition) as Square[]),
      ...(Object.keys(nextPosition) as Square[]),
    ]);

    for (const square of squares) {
      const previousPiece = previousPosition[square];
      const nextPiece = nextPosition[square];

      if (!nextPiece && previousPiece) {
        removedSet.add(square);
        continue;
      }

      if (nextPiece && (!previousPiece || previousPiece.pieceType !== nextPiece.pieceType)) {
        if (previousPiece) {
          removedSet.add(square);
        }
        added[square] = { pieceType: nextPiece.pieceType };
      }
    }
  }

  const removed = [...removedSet];
  removed.sort((a, b) => a.localeCompare(b));
  return { added, removed };
}

export function rowIndexToChessRow({
  rowIndex,
  totalRanks,
  orientation,
  rankLabels,
}: RowIndexToChessRowParams): RowIndexToChessRowResult {
  const count = Math.max(1, Math.floor(totalRanks));
  if (!Number.isInteger(rowIndex) || rowIndex < 0 || rowIndex >= count) {
    throw new RangeError(`rowIndex must be between 0 and ${count - 1}. Received: ${rowIndex}`);
  }

  const normalizedOrientation = normalizeOrientation(orientation);
  const labels = resolveRankLabels(count, rankLabels);
  const rankIndex = normalizedOrientation === 'white' ? count - 1 - rowIndex : rowIndex;

  const rankLabel = labels[rankIndex];
  if (rankLabel === undefined) {
    throw new RangeError(`Rank label not found for index ${rankIndex}`);
  }

  return {
    rowIndex,
    rankIndex,
    rankLabel,
  };
}

export function columnIndexToChessColumn({
  columnIndex,
  totalFiles,
  orientation,
  fileLabels,
}: ColumnIndexToChessColumnParams): ColumnIndexToChessColumnResult {
  const count = Math.max(1, Math.floor(totalFiles));
  if (!Number.isInteger(columnIndex) || columnIndex < 0 || columnIndex >= count) {
    throw new RangeError(
      `columnIndex must be between 0 and ${count - 1}. Received: ${columnIndex}`,
    );
  }

  const normalizedOrientation = normalizeOrientation(orientation);
  const labels = resolveFileLabels(count, fileLabels);
  const fileIndex = normalizedOrientation === 'white' ? columnIndex : count - 1 - columnIndex;

  const fileLabel = labels[fileIndex];
  if (fileLabel === undefined) {
    throw new RangeError(`File label not found for index ${fileIndex}`);
  }

  return {
    columnIndex,
    fileIndex,
    fileLabel,
  };
}

export function chessColumnToColumnIndex({
  column,
  totalFiles,
  orientation,
  fileLabels,
}: ChessColumnToColumnIndexParams): ColumnIndexToChessColumnResult {
  if (typeof column !== 'string') {
    throw new TypeError('column must be a string');
  }

  const count = Math.max(1, Math.floor(totalFiles));
  const labels = resolveFileLabels(count, fileLabels);
  const normalizedOrientation = normalizeOrientation(orientation);
  const normalizedColumn = column.trim().toLowerCase();

  if (!normalizedColumn) {
    throw new RangeError('column must be a non-empty string');
  }

  const fileIndex = labels.findIndex((label) => label.toLowerCase() === normalizedColumn);
  if (fileIndex === -1) {
    throw new RangeError(`Unknown column label: ${column}`);
  }

  const columnIndex = normalizedOrientation === 'white' ? fileIndex : count - 1 - fileIndex;

  return {
    columnIndex,
    fileIndex,
    fileLabel: labels[fileIndex],
  };
}

export function chessRowToRowIndex({
  row,
  totalRanks,
  orientation,
  rankLabels,
}: ChessRowToRowIndexParams): ChessRowToRowIndexResult {
  const count = Math.max(1, Math.floor(totalRanks));
  const labels = resolveRankLabels(count, rankLabels);
  const normalizedOrientation = normalizeOrientation(orientation);
  const normalizedRow = String(row).trim();

  if (!normalizedRow) {
    throw new RangeError('row must be a non-empty string or number');
  }

  const rankIndex = labels.indexOf(normalizedRow);
  if (rankIndex === -1) {
    throw new RangeError(`Unknown row label: ${row}`);
  }

  const rowIndex = normalizedOrientation === 'white' ? count - 1 - rankIndex : rankIndex;

  return {
    rowIndex,
    rankIndex,
    rankLabel: labels[rankIndex],
  };
}

export function generateBoard({
  files,
  ranks,
  orientation,
  fileLabels,
  rankLabels,
}: GenerateBoardOptions): SquareMatrix {
  const {
    files: resolvedFiles,
    ranks: resolvedRanks,
    fileLabels: resolvedFileLabels,
    rankLabels: resolvedRankLabels,
  } = resolveBoardGeometry({
    files,
    ranks,
    fileLabels,
    rankLabels,
    defaultFiles: files,
    defaultRanks: ranks,
  });

  const normalizedOrientation = normalizeOrientation(orientation);

  return Array.from({ length: resolvedRanks }, (_, rowIndex) => {
    const rowInfo = rowIndexToChessRow({
      rowIndex,
      totalRanks: resolvedRanks,
      orientation: normalizedOrientation,
      rankLabels: resolvedRankLabels,
    });

    return Array.from({ length: resolvedFiles }, (_, columnIndex) => {
      const columnInfo = columnIndexToChessColumn({
        columnIndex,
        totalFiles: resolvedFiles,
        orientation: normalizedOrientation,
        fileLabels: resolvedFileLabels,
      });

      const square = `${columnInfo.fileLabel}${rowInfo.rankLabel}` as Square;

      const squareData: SquareDataType = {
        square,
        fileLabel: columnInfo.fileLabel,
        rankLabel: rowInfo.rankLabel,
        fileIndex: columnInfo.fileIndex,
        rankIndex: rowInfo.rankIndex,
        columnIndex: columnInfo.columnIndex,
        rowIndex: rowInfo.rowIndex,
      };

      return squareData;
    });
  });
}

export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

export function easeLinear(t: number): number {
  return t;
}

export function easeInCubic(t: number): number {
  return t * t * t;
}

export function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

export function easeInOutCubic(t: number): number {
  if (t < 0.5) {
    return 4 * t * t * t;
  }
  const factor = -2 * t + 2;
  return 1 - Math.pow(factor, 3) / 2;
}

const NAMED_ANIMATION_EASINGS: Record<AnimationEasingName, (t: number) => number> = {
  linear: easeLinear,
  ease: easeInOutCubic,
  'ease-in': easeInCubic,
  'ease-out': easeOutCubic,
  'ease-in-out': easeInOutCubic,
};

export const DEFAULT_ANIMATION_EASING: AnimationEasingName = 'ease-out';

export interface ResolvedAnimationEasing {
  name: AnimationEasingName | 'custom';
  fn: (t: number) => number;
}

export function resolveAnimationEasing(
  easing: AnimationEasing | undefined,
  fallbackName: AnimationEasingName = DEFAULT_ANIMATION_EASING,
): ResolvedAnimationEasing {
  if (typeof easing === 'function') {
    return {
      name: 'custom',
      fn: (value: number) => clamp(easing(clamp(value, 0, 1)), 0, 1),
    };
  }

  const safeFallback = NAMED_ANIMATION_EASINGS[fallbackName]
    ? fallbackName
    : DEFAULT_ANIMATION_EASING;
  const requested = typeof easing === 'string' ? easing : safeFallback;
  const normalized = (
    requested in NAMED_ANIMATION_EASINGS ? requested : safeFallback
  ) as AnimationEasingName;

  return {
    name: normalized,
    fn: NAMED_ANIMATION_EASINGS[normalized],
  };
}
