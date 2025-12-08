import { Chess, SQUARES, type Color, type Move as ChessMove } from 'chess.js';
import type { RulesAdapter, Move, RulesMoveResponse, RulesMoveDetail, Variant } from './types';
import { PgnNotation } from './PgnNotation';
import type { PgnMetadata } from './PgnNotation';
import { sanitizePgnString } from './PgnSanitizer';
import {
  canRedo,
  canUndo,
  cloneHistoryStore,
  createHistoryStore,
  getCurrentFen,
  getHistory as getHistorySelector,
  getLastMoveState,
  getVerboseHistory,
  makeMove,
  redo as redoHistory,
  reset as resetHistory,
  undo as undoHistory,
  type HistoryStoreState,
} from './state/historyStore';

type ChessSquare = (typeof SQUARES)[number];

export interface ChessJsRulesOptions {
  fen?: string;
  variant?: Variant;
}

/**
 * Rules adapter built on chess.js to provide full move validation
 */
export class ChessJsRules implements RulesAdapter {
  private chess: Chess;
  private pgnNotation: PgnNotation;
  public readonly supportsSanMoves = true;
  private readonly variant: Variant;
  private historyStore: HistoryStoreState;

  private normalizePromotion(symbol: ChessMove['promotion']): Move['promotion'] {
    return symbol === 'q' || symbol === 'r' || symbol === 'b' || symbol === 'n'
      ? symbol
      : undefined;
  }

  private getFenParts(fen?: string): string[] {
    const fenString = (fen ?? getCurrentFen(this.historyStore)).trim();
    const parts = fenString.split(/\s+/);

    if (parts.length < 6) {
      return [...parts, ...Array.from({ length: 6 - parts.length }, () => '')];
    }

    return parts;
  }

  private getInitialFen(): string {
    return this.historyStore.past[0]?.fen ?? this.historyStore.present.fen;
  }

  private applyHistoryStoreToChess(): void {
    const baseFen = this.getInitialFen();
    const chess = this.createChessInstance(baseFen);
    const timeline = [...this.historyStore.past.slice(1), this.historyStore.present];

    for (const entry of timeline) {
      const move = entry.move ?? (entry.san ? { san: entry.san } : undefined);

      if (!move) {
        continue;
      }

      if ('from' in move && 'to' in move && move.from && move.to) {
        const replayMove = move as unknown as ChessMove;
        chess.move({
          from: replayMove.from,
          to: replayMove.to,
          promotion: replayMove.promotion,
        });
      } else if (move.san) {
        chess.move(move.san);
      }
    }

    this.chess = chess;
  }

  private rebuildHistoryStoreFromChess(): void {
    const undoneMoves: ChessMove[] = [];
    let undone: ChessMove | null;

    while ((undone = this.chess.undo())) {
      undoneMoves.push(undone);
    }

    const initialFen = this.chess.fen();
    const replay = this.createChessInstance(initialFen);
    let nextStore = createHistoryStore(initialFen);

    for (let index = undoneMoves.length - 1; index >= 0; index -= 1) {
      const move = undoneMoves[index];
      const applied = replay.move(move);
      if (applied) {
        const moveDetail = {
          ...applied,
          from: applied.from,
          to: applied.to,
          san: applied.san,
        } as RulesMoveDetail;
        nextStore = makeMove(nextStore, {
          fen: replay.fen(),
          san: applied.san,
          move: moveDetail,
        });
      }
    }

    this.chess = replay;
    this.historyStore = nextStore;
  }

  public getChessInstance(): Chess {
    return this.chess;
  }

  constructor(fenOrOptions?: string | ChessJsRulesOptions) {
    let fen: string | undefined;
    let variant: Variant = 'standard';

    if (typeof fenOrOptions === 'string') {
      fen = fenOrOptions;
    } else if (fenOrOptions) {
      fen = fenOrOptions.fen;
      variant = fenOrOptions.variant ?? 'standard';
    }

    this.variant = variant;

    // chess.js supports Chess960 by loading a Chess960 FEN
    // The engine automatically detects Chess960 from the FEN structure
    this.chess = this.createChessInstance(fen);

    this.historyStore = createHistoryStore(this.chess.fen());

    this.pgnNotation = new PgnNotation();
  }

  private createChessInstance(fen?: string): Chess {
    if (this.variant === 'chess960') {
      const chess = new Chess();
      if (fen) {
        chess.load(fen);
      }
      return chess;
    }

    return new Chess(fen);
  }

  /**
   * Get the current variant
   */
  getVariant(): Variant {
    return this.variant;
  }

  /**
   * Get the current position in FEN format
   */
  getFEN(): string {
    return getCurrentFen(this.historyStore);
  }

  /**
   * Set a position from a FEN string
   */
  setFEN(fen: string): void {
    const normalizedFen = this.normalizeFenInput(fen);
    try {
      this.chess = this.createChessInstance();
      this.chess.load(normalizedFen);
      this.historyStore = resetHistory(this.historyStore, this.chess.fen());
    } catch (error) {
      console.error('Invalid FEN:', normalizedFen, error);
      throw new Error(`Invalid FEN: ${normalizedFen}`);
    }
  }

  private normalizeFenInput(fen: string): string {
    const fenParts = fen.trim().split(/\s+/);

    if (fenParts.length === 4) {
      // Missing en passant, halfmove clock and fullmove number
      fenParts.push('-', '0', '1');
    } else if (fenParts.length === 5) {
      // Missing fullmove number
      fenParts.push('1');
    }

    return fenParts.join(' ');
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

      if (chessMove) {
        const moveDetail = {
          ...chessMove,
          from: chessMove.from,
          to: chessMove.to,
          san: chessMove.san,
        } as RulesMoveDetail;
        this.historyStore = makeMove(this.historyStore, {
          fen: this.chess.fen(),
          san: chessMove.san,
          move: moveDetail,
        });
      }

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

    return { ok: true, fen: getCurrentFen(this.historyStore), move: normalizedMove };
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
      const testChess = new Chess(getCurrentFen(this.historyStore));
      const move = testChess.move({
        from,
        to,
        promotion: promotion as 'q' | 'r' | 'b' | 'n' | undefined,
      }) as ChessMove | null;
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
    const { state, previous } = undoHistory(this.historyStore);
    if (!previous) {
      return false;
    }

    this.historyStore = state;
    this.applyHistoryStoreToChess();
    return true;
  }

  redo(): boolean {
    const { state, next } = redoHistory(this.historyStore);
    if (!next) {
      return false;
    }

    this.historyStore = state;
    this.applyHistoryStoreToChess();
    return true;
  }

  /**
   * Check whether undo is available
   */
  canUndo(): boolean {
    return canUndo(this.historyStore);
  }

  /**
   * Check whether redo is available
   */
  canRedo(): boolean {
    return canRedo(this.historyStore);
  }

  /**
   * Get the list of moves played
   */
  history(): string[] {
    return getHistorySelector(this.historyStore);
  }

  /**
   * Get the detailed move history
   */
  getHistory(): RulesMoveDetail[] {
    return getVerboseHistory(this.historyStore);
  }

  /**
   * Reset the game to the initial position
   */
  reset(): void {
    const initialFen = this.getInitialFen();
    this.chess = this.createChessInstance(initialFen);
    this.historyStore = resetHistory(this.historyStore, initialFen);
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
        if (piece?.type === 'k' && piece.color === color) {
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
    const fenParts = this.getFenParts(getCurrentFen(this.historyStore));
    const halfMoveField = fenParts[4] ?? '0';
    const halfMoveCount = Number.parseInt(halfMoveField, 10);

    return Number.isNaN(halfMoveCount) ? 0 : halfMoveCount;
  }

  /**
   * Create a copy of the current state
   */
  clone(): ChessJsRules {
    const clone = new ChessJsRules({
      fen: this.getFEN(),
      variant: this.variant,
    });

    clone.historyStore = cloneHistoryStore(this.historyStore);
    clone.applyHistoryStoreToChess();
    return clone;
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
  getLastMove(): RulesMoveDetail | null {
    const lastMoveState = getLastMoveState(this.historyStore);
    if (!lastMoveState?.move) {
      return null;
    }

    const { from, to, san } = lastMoveState.move;

    if (!from || !to) {
      return null;
    }

    return { ...lastMoveState.move, from, to, san } as RulesMoveDetail;
  }

  /**
   * Generate the FEN string for the current position
   */
  generateFEN(): string {
    return getCurrentFen(this.historyStore);
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
      const loadResult = this.chess.loadPgn(sanitized) as unknown;

      if (typeof loadResult === 'boolean' && !loadResult) {
        return false;
      }

      try {
        this.pgnNotation.loadPgnWithAnnotations(sanitized);
      } catch {
        return false;
      }

      this.pgnNotation.importFromChessJs(this.chess);
      this.rebuildHistoryStoreFromChess();
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get the PGN notation for the most recent move
   */
  getLastMoveNotation(): string | null {
    const history = getHistorySelector(this.historyStore);
    const lastMove = history.at(-1);
    return lastMove ?? null;
  }

  /**
   * Retrieve the entire move history in PGN notation
   */
  getPgnMoves(): string[] {
    return getHistorySelector(this.historyStore);
  }
}
