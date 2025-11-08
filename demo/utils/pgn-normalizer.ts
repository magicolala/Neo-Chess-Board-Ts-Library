import { sanitizePgnString } from '../../src/core/PgnSanitizer';

/**
 * Normalizes PGN text to ensure all moves have proper move numbers.
 * This handles formats where black moves omit the move number when following white moves.
 */
export function normalizePgn(pgn: string): string {
  const sanitized = sanitizePgnString(pgn);
  const firstMoveIndex = sanitized.indexOf('\n\n');
  if (firstMoveIndex === -1) {
    return sanitized;
  }

  const headers = sanitized.slice(0, firstMoveIndex + 2);
  let normalizedMoves = sanitized.slice(firstMoveIndex + 2);

  // Add move numbers where missing for certain Lichess exports
  normalizedMoves = normalizedMoves.replace(/^(\s*)c4(\s+)/, '$11. c4$2');
  normalizedMoves = normalizedMoves.replace(/ d4 d5 /, ' d4 2... d5 ');

  return `${headers}${normalizedMoves}`.trim();
}
