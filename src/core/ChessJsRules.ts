import { Chess, SQUARES, type Color, type Move as ChessMove } from 'chess.js';
import type { RulesAdapter, Move, RulesMoveResponse, RulesMoveDetail } from './types';
import { PgnNotation } from './PgnNotation';
import type { PgnMetadata } from './PgnNotation';
import { sanitizePgnString } from './PgnSanitizer';

type ChessSquare = (typeof SQUARES)[number];

/**
 * Rules adapter built on chess.js to provide full move validation
 */
export class ChessJsRules implements RulesAdapter {
  private chess: Chess;
  private pgnNotation: PgnNotation;
  public readonly supportsSanMoves = true;

  private normalizePromotion(symbol: ChessMove['promotion']): Move['promotion'] {
    return symbol === 'q' || symbol === 'r' || symbol === 'b' || symbol === 'n'
      ? symbol
      : undefined;
  }

  private getFenParts(fen?: string): string[] {
    const fenString = (fen ?? this.chess.fen()).trim();
    const parts = fenString.split(/\s+/);

    if (parts.length < 6) {
      return [...parts, ...Array.from({ length: 6 - parts.length }, () => '')];
    }

    return parts;
  }

  public getChessInstance(): Chess {
    return this.chess;
  }

  constructor(fen?: string) {
    this.chess = new Chess(fen);
    this.pgnNotation = new PgnNotation();
  }

  /**
   * Get the current position in FEN format
   */
  getFEN(): string {
    return this.chess.fen();
  }

  /**
   * Set a position from a FEN string
   */
  setFEN(fen: string): void {
    try {
      console.log('Attempting to load FEN:', fen);
      // Ensure FEN has all 6 parts, adding default if missing
      const fenParts = fen.split(' ');
      if (fenParts.length === 4) {
        // Missing en passant, halfmove clock and fullmove number
        fen += ' - 0 1'; // Default values
      } else if (fenParts.length === 5) {
        // Missing fullmove number
        fen += ' 1'; // Default value
      }
      this.chess.load(fen);
    } catch (error) {
      console.error('Invalid FEN:', fen, error);
      throw new Error(`Invalid FEN: ${fen}`);
    }
  }

  /**
   * Play a move
   */
  move(moveData: string): RulesMoveResponse;
  move(moveData: { from: string; to: string; promotion?: string }): RulesMoveResponse;
  move(moveData: string | { from: string; to: string; promotion?: string }): RulesMoveResponse {
    try {
      const chessMove =
        typeof moveData === 'string'
          ? this.chess.move(moveData)
          : this.chess.move({
              from: moveData.from,
              to: moveData.to,
              promotion: moveData.promotion as 'q' | 'r' | 'b' | 'n' | undefined,
            });

      return this.normalizeMoveResponse(chessMove);
    } catch (error: unknown) {
      if (error instanceof Error) {
        return { ok: false, reason: error.message };
      }
      return { ok: false, reason: 'Invalid move' };
    }
  }

  private normalizeMoveResponse(move: ChessMove | null | undefined): RulesMoveResponse {
    if (!move) {
      return { ok: false, reason: 'Invalid move' };
    }

    const normalizedMove: RulesMoveDetail = {
      ...move,
      from: move.from,
      to: move.to,
      san: move.san,
    };

    return { ok: true, fen: this.chess.fen(), move: normalizedMove };
  }

  /**
   * Get every legal move from a square
   */
  movesFrom(square: string): Move[] {
    const moves = this.chess.moves({
      square: square as ChessSquare,
      verbose: true,
    }) as ChessMove[];
    return moves.map((move) => ({
      from: move.from,
      to: move.to,
      promotion: this.normalizePromotion(move.promotion),
      piece: move.piece,
      captured: move.captured,
      flags: move.flags,
    }));
  }

  /**
   * Get every legal move in the current position
   */
  getAllMoves(): Move[] {
    const moves = this.chess.moves({ verbose: true }) as ChessMove[];
    return moves.map((move) => ({
      from: move.from,
      to: move.to,
      promotion: this.normalizePromotion(move.promotion),
      piece: move.piece,
      captured: move.captured,
      flags: move.flags,
    }));
  }

  /**
   * Check if a move is legal
   */
  isLegalMove(from: string, to: string, promotion?: string): boolean {
    try {
      // Create a copy to test the move without altering the actual game state
      const testChess = new Chess(this.chess.fen());
      const move = testChess.move({
        from,
        to,
        promotion: promotion as 'q' | 'r' | 'b' | 'n' | undefined,
      });
      return move !== null;
    } catch {
      return false;
    }
  }

  /**
   * Check whether the side to move is in check
   */
  inCheck(): boolean {
    return this.chess.inCheck();
  }

  /**
   * Check whether the position is checkmate
   */
  isCheckmate(): boolean {
    return this.chess.isCheckmate();
  }

  /**
   * Check whether the position is stalemate
   */
  isStalemate(): boolean {
    return this.chess.isStalemate();
  }

  /**
   * Check whether the game is drawn
   */
  isDraw(): boolean {
    return this.chess.isDraw();
  }

  /**
   * Check whether the game is drawn by insufficient material
   */
  isInsufficientMaterial(): boolean {
    return this.chess.isInsufficientMaterial();
  }

  /**
   * Check whether the current position has occurred three times
   */
  isThreefoldRepetition(): boolean {
    return this.chess.isThreefoldRepetition();
  }

  /**
   * Determine whether the game has ended
   */
  isGameOver(): boolean {
    return this.chess.isGameOver();
  }

  /**
   * Get the result of the game
   */
  getGameResult(): '1-0' | '0-1' | '1/2-1/2' | '*' {
    if (this.chess.isCheckmate()) {
      return this.chess.turn() === 'w' ? '0-1' : '1-0';
    } else if (this.chess.isStalemate() || this.chess.isDraw()) {
      return '1/2-1/2';
    }
    return '*';
  }

  /**
   * Get the player to move
   */
  turn(): 'w' | 'b' {
    return this.chess.turn();
  }

  /**
   * Get the piece on a square
   */
  get(square: string): { type: string; color: string } | null {
    const piece = this.chess.get(square as ChessSquare);
    return piece || null;
  }

  /**
   * Undo the last move
   */
  undo(): boolean {
    const move = this.chess.undo();
    return move !== null;
  }

  /**
   * Get the list of moves played
   */
  history(): string[] {
    return this.chess.history();
  }

  /**
   * Get the detailed move history
   */
  getHistory(): ChessMove[] {
    return this.chess.history({ verbose: true });
  }

  /**
   * Reset the game to the initial position
   */
  reset(): void {
    this.chess.reset();
  }

  /**
   * Get the squares attacked by the side to move
   *
   * Uses the native chess.js detection to identify every square currently
   * controlled by the active player.
   */
  getAttackedSquares(): string[] {
    const attackingColor: Color = this.chess.turn();

    return SQUARES.filter((square) => this.chess.isAttacked(square, attackingColor)).map(
      (square) => square,
    );
  }

  /**
   * Check whether a square is attacked
   *
   * @param square Square to inspect (algebraic notation, case insensitive)
   * @param by Optional color to check a specific side
   * @throws {Error} if the square or color value is invalid
   */
  isSquareAttacked(square: string, by?: 'w' | 'b'): boolean {
    if (typeof square !== 'string') {
      throw new TypeError(`Invalid square: ${square}`);
    }

    const normalizedSquare = square.toLowerCase();
    if (!(SQUARES as readonly string[]).includes(normalizedSquare)) {
      throw new Error(`Invalid square: ${square}`);
    }

    let colorToCheck: Color;
    if (by === undefined) {
      colorToCheck = this.chess.turn();
    } else if (by === 'w' || by === 'b') {
      colorToCheck = by;
    } else {
      throw new Error(`Invalid color: ${by}`);
    }

    return this.chess.isAttacked(normalizedSquare as (typeof SQUARES)[number], colorToCheck);
  }

  /**
   * Get the king squares that are in check (for highlighting)
   */
  getCheckSquares(): string[] {
    if (!this.chess.inCheck()) return [];

    const kingSquare = this.getKingSquare(this.chess.turn());
    return kingSquare ? [kingSquare] : [];
  }

  /**
   * Locate the king square for a color
   */
  private getKingSquare(color: 'w' | 'b'): string | null {
    const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
    const ranks = ['1', '2', '3', '4', '5', '6', '7', '8'];

    for (const file of files) {
      for (const rank of ranks) {
        const square = `${file}${rank}`;
        const piece = this.chess.get(square as ChessSquare);
        if (piece && piece.type === 'k' && piece.color === color) {
          return square;
        }
      }
    }
    return null;
  }

  /**
   * Check if castling is allowed
   */
  canCastle(side: 'k' | 'q', color?: 'w' | 'b'): boolean {
    const currentColor = color || this.chess.turn();
    const castlingRights = this.chess.getCastlingRights(currentColor);

    return side === 'k' ? castlingRights.k : castlingRights.q;
  }

  /**
   * Get the current move number
   */
  moveNumber(): number {
    return this.chess.moveNumber();
  }

  /**
   * Get the halfmove clock since the last capture or pawn move
   */
  halfMoves(): number {
    const fenParts = this.getFenParts();
    const halfMoveField = fenParts[4] ?? '0';
    const halfMoveCount = Number.parseInt(halfMoveField, 10);

    return Number.isNaN(halfMoveCount) ? 0 : halfMoveCount;
  }

  /**
   * Create a copy of the current state
   */
  clone(): ChessJsRules {
    return new ChessJsRules(this.chess.fen());
  }

  /**
   * Validate a FEN string
   */
  static isValidFEN(fen: string): boolean {
    try {
      const chess = new Chess();
      chess.load(fen);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get information about the last move played
   */
  getLastMove(): ChessMove | null {
    const history = this.chess.history({ verbose: true }) as ChessMove[];
    const lastMove = history.at(-1);
    return lastMove ?? null;
  }

  /**
   * Generate the FEN string for the current position
   */
  generateFEN(): string {
    return this.chess.fen();
  }

  /**
   * Set PGN metadata for the current game
   */
  setPgnMetadata(metadata: Partial<PgnMetadata>): void {
    this.pgnNotation.setMetadata(metadata);
  }

  /**
   * Export the current game as PGN
   */
  toPgn(includeHeaders: boolean = true): string {
    this.pgnNotation.importFromChessJs(this.chess);
    return this.pgnNotation.toPgn(includeHeaders);
  }

  /**
   * Download the current game as a PGN file (browser only)
   */
  downloadPgn(filename?: string): void {
    this.pgnNotation.importFromChessJs(this.chess);
    this.pgnNotation.downloadPgn(filename);
  }

  /**
   * Get the PgnNotation instance for advanced manipulation
   */
  getPgnNotation(): PgnNotation {
    return this.pgnNotation;
  }

  /**
   * Load a game from a PGN string
   */
  loadPgn(pgn: string): boolean {
    try {
      const sanitized = sanitizePgnString(pgn);
      this.chess.loadPgn(sanitized);
      this.pgnNotation.importFromChessJs(this.chess);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get the PGN notation for the most recent move
   */
  getLastMoveNotation(): string | null {
    const history = this.chess.history();
    const lastMove = history.at(-1);
    return lastMove ?? null;
  }

  /**
   * Retrieve the entire move history in PGN notation
   */
  getPgnMoves(): string[] {
    return this.chess.history();
  }
}
