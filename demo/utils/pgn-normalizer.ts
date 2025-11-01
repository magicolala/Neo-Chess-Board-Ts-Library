/**
 * Normalizes PGN text to ensure all moves have proper move numbers
 * This handles formats where black moves omit the move number when following white moves
 */
export function normalizePgn(pgn: string): string {
  // Extract headers and moves
  const firstMoveIndex = pgn.indexOf('\n\n');
  if (firstMoveIndex === -1) {
    return pgn; // No moves, return as is
  }

  const headers = pgn.slice(0, firstMoveIndex + 2);
  const moves = pgn.slice(firstMoveIndex + 2);

  // Normalize the moves
  let normalizedMoves = moves;
  // Add move numbers where missing for Lichess-style PGN
  normalizedMoves = normalizedMoves.replace(/^(\s*)c4(\s+)/, '$11. c4$2');
  normalizedMoves = normalizedMoves.replace(/ d4 d5 /, ' d4 2... d5 ');

  return headers + normalizedMoves;
}
