/**
 * Chess960 (Fischer Random Chess) utilities
 *
 * Chess960 is a variant where the back rank pieces are randomly arranged
 * following specific constraints:
 * - Bishops must be on opposite-colored squares
 * - King must be between the two rooks
 * - All other pieces can be placed freely
 *
 * This results in 960 possible starting positions (indexed 0-959).
 */

// Chess960 index type: 0-959

/**
 * Validates that a FEN string represents a valid Chess960 starting position
 */
export function isValidChess960Start(fen: string): boolean {
  try {
    const pieces = extractBackRankPieces(fen);
    if (!pieces) return false;

    return (
      hasRequiredWhitePieces(pieces) && bishopsOnOppositeColors(pieces) && kingBetweenRooks(pieces)
    );
  } catch {
    return false;
  }
}

/**
 * Generates a Chess960 starting position FEN string
 *
 * @param rankIndex Optional index (0-959) for a specific position. If not provided, generates a random position.
 * @returns A valid FEN string for the starting position
 */
export function generateChess960Start(rankIndex?: number): string {
  const index =
    rankIndex === undefined
      ? getRandomChess960Index()
      : Math.max(0, Math.min(959, Math.floor(rankIndex)));

  // Generate the back rank arrangement
  const backRank = generateChess960BackRank(index);

  // Standard starting position for other ranks
  const standardFen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
  const parts = standardFen.split(' ');

  // Replace the back ranks with our Chess960 arrangement
  // In FEN, rank 0 is black's back rank (rank 8), rank 7 is white's back rank (rank 1)
  const ranks = parts[0].split('/');
  ranks[7] = backRank; // White back rank (rank 1)
  ranks[0] = backRank.toLowerCase(); // Black back rank (rank 8, mirrored)

  return [ranks.join('/'), ...parts.slice(1)].join(' ');
}

function extractBackRankPieces(fen: string): (string | null)[] | null {
  const parts = fen.trim().split(/\s+/);
  if (parts.length === 0) return null;

  // In FEN, rank 0 is black's back rank, rank 7 is white's back rank
  // For Chess960 validation, we check white's back rank (rank 7)
  const ranks = parts[0].split('/');
  if (ranks.length < 8) return null;
  const firstRank = ranks[7]; // White back rank
  if (!firstRank || firstRank.length < 8) return null;

  const pieces: (string | null)[] = Array.from({ length: 8 }, () => null);
  let fileIndex = 0;
  for (const char of firstRank) {
    if (/[prnbqkPRNBQK]/.test(char)) {
      if (fileIndex < 8) {
        pieces[fileIndex] = char;
        fileIndex++;
      }
    } else if (/\d/.test(char)) {
      fileIndex += Number.parseInt(char, 10);
    }
  }

  return pieces;
}

function hasRequiredWhitePieces(pieces: (string | null)[]): boolean {
  const getCount = (piece: string) => pieces.filter((p) => p === piece).length;

  return (
    pieces.filter((p) => p !== null).length === 8 &&
    getCount('K') === 1 &&
    getCount('R') === 2 &&
    getCount('B') === 2 &&
    getCount('Q') === 1 &&
    getCount('N') === 2
  );
}

function bishopsOnOppositeColors(pieces: (string | null)[]): boolean {
  const whiteBishopPositions: number[] = [];
  for (let i = 0; i < 8; i++) {
    if (pieces[i] === 'B') whiteBishopPositions.push(i);
  }

  if (whiteBishopPositions.length !== 2) return false;
  const bishop1Color = whiteBishopPositions[0]! % 2;
  const bishop2Color = whiteBishopPositions[1]! % 2;
  return bishop1Color !== bishop2Color;
}

function kingBetweenRooks(pieces: (string | null)[]): boolean {
  const whiteRookPositions: number[] = [];
  let whiteKingPos = -1;

  for (let i = 0; i < 8; i++) {
    if (pieces[i] === 'R') whiteRookPositions.push(i);
    if (pieces[i] === 'K') whiteKingPos = i;
  }

  if (whiteRookPositions.length !== 2 || whiteKingPos < 0) return false;
  whiteRookPositions.sort((a, b) => a - b);

  return whiteKingPos >= whiteRookPositions[0]! && whiteKingPos <= whiteRookPositions[1]!;
}

/**
 * Generates the back rank arrangement for a specific Chess960 index
 */
function generateChess960BackRank(index: number): string {
  // Algorithm based on the standard Chess960 numbering scheme
  const pieces: (string | null)[] = Array.from({ length: 8 }, () => null);

  // Step 1: Place bishops on opposite colors
  // First bishop: even square (0, 2, 4, 6) = 4 choices
  // Second bishop: odd square (1, 3, 5, 7) = 4 choices
  // Total: 4 * 4 = 16 combinations
  const bishopIndex = index % 16;
  const firstBishopSquare = (bishopIndex % 4) * 2; // 0, 2, 4, 6
  const secondBishopSquare = Math.floor(bishopIndex / 4) * 2 + 1; // 1, 3, 5, 7
  pieces[firstBishopSquare] = 'B';
  pieces[secondBishopSquare] = 'B';

  // Step 2: Place queen
  // 6 remaining squares = 6 choices
  const queenIndex = Math.floor(index / 16) % 6;
  const queenSquare = getNthEmptySquare(pieces, queenIndex);
  pieces[queenSquare] = 'Q';

  // Step 3: Place knights
  // 5 remaining squares, choose 2 = C(5,2) = 10 combinations
  const knightIndex = Math.floor(index / (16 * 6)) % 10;
  const knightSquares = getNthCombination(5, 2, knightIndex);
  const emptySquares = getEmptySquares(pieces);
  pieces[emptySquares[knightSquares[0]]] = 'N';
  pieces[emptySquares[knightSquares[1]]] = 'N';

  // Step 4: Place king and rooks
  // 3 remaining squares: king must be between rooks
  // Only 1 valid arrangement: R-K-R
  const remainingSquares = getEmptySquares(pieces);
  pieces[remainingSquares[0]] = 'R';
  pieces[remainingSquares[1]] = 'K';
  pieces[remainingSquares[2]] = 'R';

  return pieces.join('');
}

function getRandomChess960Index(): number {
  const cryptoObj = globalThis.crypto;
  if (!cryptoObj?.getRandomValues) {
    throw new Error('Cryptographic random number generator unavailable for Chess960 index');
  }

  const buffer = new Uint32Array(1);
  cryptoObj.getRandomValues(buffer);
  return buffer[0] % 960;
}

/**
 * Gets the nth empty square index
 */
function getNthEmptySquare(pieces: (string | null)[], n: number): number {
  let count = 0;
  for (const [i, piece] of pieces.entries()) {
    if (piece === null) {
      if (count === n) return i;
      count++;
    }
  }
  throw new Error('Not enough empty squares');
}

/**
 * Gets all empty square indices
 */
function getEmptySquares(pieces: (string | null)[]): number[] {
  const empty: number[] = [];
  for (const [i, piece] of pieces.entries()) {
    if (piece === null) {
      empty.push(i);
    }
  }
  return empty;
}

/**
 * Gets the nth combination of k elements from n total
 * Returns the indices in the combination
 */
function getNthCombination(n: number, k: number, index: number): number[] {
  const result: number[] = [];
  let remaining = index;
  let available = n;
  let toChoose = k;

  for (let i = 0; i < n && toChoose > 0; i++) {
    // Number of combinations if we skip this element
    const skipCombinations = binomialCoefficient(available - 1, toChoose - 1);

    if (remaining < skipCombinations) {
      result.push(i);
      toChoose--;
    } else {
      remaining -= skipCombinations;
    }
    available--;
  }

  return result;
}

/**
 * Calculates binomial coefficient C(n, k)
 */
function binomialCoefficient(n: number, k: number): number {
  if (k > n || k < 0) return 0;
  if (k === 0 || k === n) return 1;

  let result = 1;
  for (let i = 0; i < k; i++) {
    result = (result * (n - i)) / (i + 1);
  }
  return Math.floor(result);
}

/**
 * Attempts to determine the Chess960 index from a FEN string
 * Returns null if the position is not a valid Chess960 starting position
 */
export function getChess960IndexFromFen(fen: string): number | null {
  if (!isValidChess960Start(fen)) {
    return null;
  }

  try {
    const parts = fen.trim().split(/\s+/);
    // In FEN, rank 0 is black's back rank, rank 7 is white's back rank
    const ranks = parts[0].split('/');
    if (ranks.length < 8) return null;
    const firstRank = ranks[7]; // White back rank

    // Extract piece positions (expand numbers to positions)
    const pieces: (string | null)[] = Array.from({ length: 8 }, () => null);
    let fileIndex = 0;
    for (const char of firstRank) {
      if (/[prnbqkPRNBQK]/.test(char)) {
        if (fileIndex < 8) {
          pieces[fileIndex] = char;
          fileIndex++;
        }
      } else if (/\d/.test(char)) {
        fileIndex += Number.parseInt(char, 10);
      }
    }

    // Build normalized string (only white pieces, no nulls)
    const normalizedPieces = pieces.filter((p) => p !== null && /[PRNBQK]/.test(p!)).join('');
    if (normalizedPieces.length !== 8) {
      return null;
    }

    // Try all 960 indices to find a match
    // This is brute force but reliable
    for (let i = 0; i < 960; i++) {
      const generated = generateChess960BackRank(i);
      if (generated === normalizedPieces) {
        return i;
      }
    }

    return null;
  } catch {
    return null;
  }
}
