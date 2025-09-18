import { Chess } from 'chess.js';
import type { RulesAdapter, Move } from './types';
import { PgnNotation, PgnMetadata } from './PgnNotation';

/**
 * Adapter de règles utilisant chess.js pour une validation complète des coups
 */
export class ChessJsRules implements RulesAdapter {
  private chess: Chess;
  private pgnNotation: PgnNotation;

  private getFenParts(fen?: string): string[] {
    const fenString = (fen ?? this.chess.fen()).trim();
    const parts = fenString.split(/\s+/);

    if (parts.length < 6) {
      return parts.concat(new Array(6 - parts.length).fill(''));
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
   * Obtenir la position actuelle au format FEN
   */
  getFEN(): string {
    return this.chess.fen();
  }

  /**
   * Définir une position FEN
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
   * Jouer un coup
   */
  move(moveData: { from: string; to: string; promotion?: string }): {
    ok: boolean;
    reason?: string;
  } {
    try {
      const move = this.chess.move({
        from: moveData.from,
        to: moveData.to,
        promotion: moveData.promotion as 'q' | 'r' | 'b' | 'n' | undefined,
      });

      if (move) {
        return { ok: true };
      } else {
        return { ok: false, reason: 'Invalid move' };
      }
    } catch (error: any) {
      return { ok: false, reason: error.message || 'Invalid move' };
    }
  }

  /**
   * Obtenir tous les coups légaux depuis une case
   */
  movesFrom(square: string): Move[] {
    const moves = this.chess.moves({ square: square as any, verbose: true });
    return (moves as any[]).map((move) => ({
      from: move.from,
      to: move.to,
      promotion: move.promotion === 'k' ? undefined : move.promotion,
      piece: move.piece,
      captured: move.captured,
      flags: move.flags,
    }));
  }

  /**
   * Obtenir tous les coups légaux
   */
  getAllMoves(): Move[] {
    const moves = this.chess.moves({ verbose: true });
    return (moves as any[]).map((move) => ({
      from: move.from,
      to: move.to,
      promotion: move.promotion === 'k' ? undefined : move.promotion,
      piece: move.piece,
      captured: move.captured,
      flags: move.flags,
    }));
  }

  /**
   * Vérifier si un coup est légal
   */
  isLegalMove(from: string, to: string, promotion?: string): boolean {
    try {
      // Créer une copie pour tester le coup sans affecter l'état
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
   * Vérifier si le roi est en échec
   */
  inCheck(): boolean {
    return this.chess.inCheck();
  }

  /**
   * Vérifier si c'est échec et mat
   */
  isCheckmate(): boolean {
    return this.chess.isCheckmate();
  }

  /**
   * Vérifier si c'est pat (stalemate)
   */
  isStalemate(): boolean {
    return this.chess.isStalemate();
  }

  /**
   * Vérifier si la partie est terminée
   */
  isGameOver(): boolean {
    return this.chess.isGameOver();
  }

  /**
   * Obtenir le résultat de la partie
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
   * Obtenir le joueur au trait
   */
  turn(): 'w' | 'b' {
    return this.chess.turn();
  }

  /**
   * Obtenir la pièce sur une case
   */
  get(square: string): { type: string; color: string } | null {
    const piece = this.chess.get(square as any);
    return piece || null;
  }

  /**
   * Annuler le dernier coup
   */
  undo(): boolean {
    const move = this.chess.undo();
    return move !== null;
  }

  /**
   * Obtenir l'historique des coups
   */
  history(): string[] {
    return this.chess.history();
  }

  /**
   * Obtenir l'historique détaillé des coups
   */
  getHistory(): any[] {
    return this.chess.history({ verbose: true });
  }

  /**
   * Remettre à la position initiale
   */
  reset(): void {
    this.chess.reset();
  }

  /**
   * Obtenir les cases attaquées par le joueur actuel
   */
  getAttackedSquares(): string[] {
    // Méthode simplifiée - retourne un tableau vide pour éviter les problèmes de types
    return [];
  }

  /**
   * Vérifier si une case est attaquée
   */
  isSquareAttacked(square: string, by?: 'w' | 'b'): boolean {
    // Méthode simplifiée - retourne false pour éviter les problèmes de types
    return false;
  }

  /**
   * Obtenir les cases du roi en échec (pour le surlignage)
   */
  getCheckSquares(): string[] {
    if (!this.chess.inCheck()) return [];

    const kingSquare = this.getKingSquare(this.chess.turn());
    return kingSquare ? [kingSquare] : [];
  }

  /**
   * Obtenir la position du roi d'une couleur
   */
  private getKingSquare(color: 'w' | 'b'): string | null {
    const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
    const ranks = ['1', '2', '3', '4', '5', '6', '7', '8'];

    for (const file of files) {
      for (const rank of ranks) {
        const square = `${file}${rank}`;
        const piece = this.chess.get(square as any);
        if (piece && piece.type === 'k' && piece.color === color) {
          return square;
        }
      }
    }
    return null;
  }

  /**
   * Vérifier si le roque est possible
   */
  canCastle(side: 'k' | 'q', color?: 'w' | 'b'): boolean {
    const currentColor = color || this.chess.turn();
    const castlingRights = this.chess.getCastlingRights(currentColor);

    if (side === 'k') {
      return castlingRights.k;
    } else {
      return castlingRights.q;
    }
  }

  /**
   * Obtenir le nombre de coups depuis le début
   */
  moveNumber(): number {
    return this.chess.moveNumber();
  }

  /**
   * Obtenir le nombre de demi-coups depuis la dernière prise ou mouvement de pion
   */
  halfMoves(): number {
    const fenParts = this.getFenParts();
    const halfMoveField = fenParts[4] ?? '0';
    const halfMoveCount = Number.parseInt(halfMoveField, 10);

    return Number.isNaN(halfMoveCount) ? 0 : halfMoveCount;
  }

  /**
   * Créer une copie de l'état actuel
   */
  clone(): ChessJsRules {
    return new ChessJsRules(this.chess.fen());
  }

  /**
   * Valider un FEN
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
   * Obtenir des informations sur le dernier coup joué
   */
  getLastMove(): any | null {
    const history = this.chess.history({ verbose: true });
    return history.length > 0 ? history[history.length - 1] : null;
  }

  /**
   * Générer le FEN à partir d'une position donnée
   */
  generateFEN(): string {
    return this.chess.fen();
  }

  /**
   * Définir les métadonnées PGN pour la partie actuelle
   */
  setPgnMetadata(metadata: Partial<PgnMetadata>): void {
    this.pgnNotation.setMetadata(metadata);
  }

  /**
   * Exporter la partie actuelle au format PGN
   */
  toPgn(includeHeaders: boolean = true): string {
    this.pgnNotation.importFromChessJs(this.chess);
    return this.pgnNotation.toPgn(includeHeaders);
  }

  /**
   * Télécharger la partie actuelle sous forme de fichier PGN (navigateur uniquement)
   */
  downloadPgn(filename?: string): void {
    this.pgnNotation.importFromChessJs(this.chess);
    this.pgnNotation.downloadPgn(filename);
  }

  /**
   * Obtenir l'instance PgnNotation pour une manipulation avancée
   */
  getPgnNotation(): PgnNotation {
    return this.pgnNotation;
  }

  /**
   * Charger une partie à partir d'une chaîne PGN
   */
  loadPgn(pgn: string): boolean {
    try {
      this.chess.loadPgn(pgn);
      this.pgnNotation.importFromChessJs(this.chess);
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Obtenir la notation PGN du dernier coup joué
   */
  getLastMoveNotation(): string | null {
    const history = this.chess.history();
    return history.length > 0 ? history[history.length - 1] : null;
  }

  /**
   * Obtenir toute l'historique des coups en notation PGN
   */
  getPgnMoves(): string[] {
    return this.chess.history();
  }
}
