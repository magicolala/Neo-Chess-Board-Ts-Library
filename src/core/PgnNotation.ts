/**
 * PGN (Portable Game Notation) generator for chess games
 * Provides functionality to export games in standard PGN format
 * Supports visual annotations (%cal arrows and %csl circles)
 */
import { PgnAnnotationParser, type ParsedAnnotations } from './PgnAnnotationParser';
import type { Arrow, SquareHighlight, RulesAdapter, PgnMove, PgnMoveAnnotations } from './types';

export interface PgnMetadata {
  Event?: string;
  Site?: string;
  Date?: string;
  Round?: string;
  White?: string;
  Black?: string;
  Result?: string;
  WhiteElo?: string;
  BlackElo?: string;
  TimeControl?: string;
  ECO?: string;
  Opening?: string;
  Variation?: string;
  Annotator?: string;
  FEN?: string;
  SetUp?: string;
  [key: string]: string | undefined;
}

export class PgnNotation {
  private metadata: PgnMetadata;
  private moves: PgnMove[];
  private result: string;
  private rulesAdapter?: RulesAdapter;

  constructor(rulesAdapter?: RulesAdapter) {
    this.rulesAdapter = rulesAdapter;
    this.metadata = {
      Event: 'Casual Game',
      Site: 'Neo Chess Board',
      Date: new Date().toISOString().split('T')[0].replace(/-/g, '.'),
      Round: '1',
      White: 'Player 1',
      Black: 'Player 2',
      Result: '*',
    };
    this.moves = [];
    this.result = '*'; // Game in progress
  }

  /**
   * Set the game metadata (headers)
   */
  setMetadata(metadata: Partial<PgnMetadata>): void {
    this.metadata = { ...this.metadata, ...metadata };

    // Set default values if not provided
    if (!this.metadata.Event) this.metadata.Event = 'Casual Game';
    if (!this.metadata.Site) this.metadata.Site = 'Neo Chess Board';
    if (!this.metadata.Date)
      this.metadata.Date = new Date().toISOString().split('T')[0].replace(/-/g, '.');
    if (!this.metadata.Round) this.metadata.Round = '1';
    if (!this.metadata.White) this.metadata.White = 'Player 1';
    if (!this.metadata.Black) this.metadata.Black = 'Player 2';
    if (!this.metadata.Result) this.metadata.Result = this.result;
  }

  /**
   * Add a move to the game
   */
  addMove(
    moveNumber: number,
    whiteMove?: string,
    blackMove?: string,
    whiteComment?: string,
    blackComment?: string,
  ): void {
    const existingMoveIndex = this.moves.findIndex((move) => move.moveNumber === moveNumber);

    if (existingMoveIndex >= 0) {
      // Update existing move
      const move = this.moves[existingMoveIndex];
      if (whiteMove) move.white = whiteMove;
      if (blackMove) move.black = blackMove;
      if (whiteComment) move.whiteComment = whiteComment;
      if (blackComment) move.blackComment = blackComment;
      // Ensure annotations are initialized if they don't exist
      if (!move.whiteAnnotations)
        move.whiteAnnotations = { arrows: [], circles: [], textComment: '' };
      if (!move.blackAnnotations)
        move.blackAnnotations = { arrows: [], circles: [], textComment: '' };
    } else {
      // Add new move
      this.moves.push({
        moveNumber,
        white: whiteMove,
        black: blackMove,
        whiteComment,
        blackComment,
        whiteAnnotations: { arrows: [], circles: [], textComment: '' },
        blackAnnotations: { arrows: [], circles: [], textComment: '' },
      });
    }
  }

  /**
   * Set the game result
   */
  setResult(result: string): void {
    this.result = result;
    this.metadata.Result = result;
  }

  /**
   * Import moves from a chess.js game
   */
  importFromChessJs(chess: any): void {
    try {
      if (this.rulesAdapter && typeof this.rulesAdapter.getPGN === 'function') {
        const pgnString = this.rulesAdapter.getPGN();
        this.parsePgnMoves(pgnString);
      } else if (typeof chess.pgn === 'function') {
        const pgnString = chess.pgn();
        this.parsePgnMoves(pgnString);
      } else {
        const detailedHistory = chess.history({ verbose: true });
        this.moves = [];

        for (let i = 0; i < detailedHistory.length; i++) {
          const move = detailedHistory[i];
          const moveNumber = Math.floor(i / 2) + 1;
          const isWhite = i % 2 === 0;

          if (isWhite) {
            this.addMove(moveNumber, move.san);
          } else {
            const existingMove = this.moves.find((m) => m.moveNumber === moveNumber);
            if (existingMove) {
              existingMove.black = move.san;
            } else {
              this.addMove(moveNumber, undefined, move.san);
            }
          }
        }
      }
    } catch (error) {
      // Final fallback: use simple history (might be in wrong format but at least something)
      console.warn('Failed to import proper PGN notation, using fallback:', error);
      const history = chess.history();
      this.moves = [];
      for (let i = 0; i < history.length; i += 2) {
        const moveNumber = Math.floor(i / 2) + 1;
        const whiteMove = history[i];
        const blackMove = history[i + 1];
        this.addMove(moveNumber, whiteMove, blackMove);
      }
    }

    // Set result based on game state
    if (chess.isCheckmate()) {
      this.setResult(chess.turn() === 'w' ? '0-1' : '1-0');
    } else if (
      chess.isStalemate() ||
      chess.isThreefoldRepetition() ||
      chess.isInsufficientMaterial()
    ) {
      this.setResult('1/2-1/2');
    } else {
      this.setResult('*');
    }
  }

  /**
   * Parse PGN move text to extract individual moves
   */
  private parsePgnMoves(pgnText: string): void {
    this.moves = [];

    // Remove comments and variations for now (simple implementation)
    let cleanPgn = pgnText.replace(/\{[^}]*\}/g, '').replace(/\([^)]*\)/g, '');

    // Extract and remove the result from the end if present
    const resultPattern = /\s*(1-0|0-1|1\/2-1\/2|\*)\s*$/;
    const resultMatch = cleanPgn.match(resultPattern);
    if (resultMatch) {
      this.setResult(resultMatch[1]);
      cleanPgn = cleanPgn.replace(resultPattern, '');
    }

    // Split by move numbers and process
    const movePattern = /(\d+)\.\s*([^\s]+)(?:\s+([^\s]+))?/g;
    let match;

    while ((match = movePattern.exec(cleanPgn)) !== null) {
      const moveNumber = parseInt(match[1]);
      const whiteMove = match[2];
      const blackMove = match[3];

      // Additional check to make sure we don\'t include result markers as moves
      if (whiteMove && !['1-0', '0-1', '1/2-1/2', '*'].includes(whiteMove)) {
        // Filter out result markers from black move as well
        const filteredBlackMove =
          blackMove && !['1-0', '0-1', '1/2-1/2', '*'].includes(blackMove) ? blackMove : undefined;
        this.addMove(moveNumber, whiteMove, filteredBlackMove);
      }
    }
  }

  /**
   * Generate the complete PGN string
   */
  toPgn(includeHeaders: boolean = true): string {
    let pgn = '';

    if (includeHeaders) {
      // Add headers
      const requiredHeaders = ['Event', 'Site', 'Date', 'Round', 'White', 'Black', 'Result'];

      // Add required headers first
      for (const header of requiredHeaders) {
        if (this.metadata[header]) {
          pgn += `[${header} "${this.metadata[header]}"]\n`;
        }
      }

      // Add optional headers
      for (const [key, value] of Object.entries(this.metadata)) {
        if (!requiredHeaders.includes(key) && value) {
          pgn += `[${key} "${value}"]\n`;
        }
      }

      pgn += '\n'; // Empty line after headers
    }

    // If no moves and no headers, return just the result (which should be '*')
    if (this.moves.length === 0 && !includeHeaders) {
      return this.result;
    }

    // Add moves
    let lineLength = 0;
    const maxLineLength = 80;

    for (const move of this.moves) {
      let moveText = `${move.moveNumber}.`;

      if (move.white) {
        moveText += ` ${move.white}`;
        if (move.whiteComment) {
          moveText += ` {${move.whiteComment}}`;
        }
      }

      if (move.black) {
        moveText += ` ${move.black}`;
        if (move.blackComment) {
          moveText += ` {${move.blackComment}}`;
        }
      }

      // Check if we need a new line
      if (lineLength + moveText.length + 1 > maxLineLength) {
        pgn += '\n';
        lineLength = 0;
      }

      if (lineLength > 0) {
        pgn += ' ';
        lineLength++;
      }

      pgn += moveText;
      lineLength += moveText.length;
    }

    // Add result only if the game is over
    if (this.result !== '*') {
      if (lineLength > 0 && this.moves.length > 0) {
        // Only add space if there are moves
        pgn += ' ';
      }
      pgn += this.result;
    }

    return pgn.trim();
  }

  /**
   * Clear all moves and reset
   */
  clear(): void {
    this.moves = [];
    this.result = '*';
    this.metadata.Result = '*';
  }

  /**
   * Get move count
   */
  getMoveCount(): number {
    return this.moves.length;
  }

  /**
   * Get current result
   */
  getResult(): string {
    return this.result;
  }

  /**
   * Create a PGN from a simple move list
   */
  static fromMoveList(moves: string[], metadata?: Partial<PgnMetadata>): string {
    const pgn = new PgnNotation();
    pgn.setMetadata(metadata || {});

    for (let i = 0; i < moves.length; i += 2) {
      const moveNumber = Math.floor(i / 2) + 1;
      const whiteMove = moves[i];
      const blackMove = moves[i + 1];
      pgn.addMove(moveNumber, whiteMove, blackMove);
    }

    return pgn.toPgn();
  }

  /**
   * Download PGN as file (browser only)
   */
  downloadPgn(filename: string = 'game.pgn'): void {
    if (typeof window !== 'undefined' && window.document) {
      const blob = new Blob([this.toPgnWithAnnotations()], { type: 'application/x-chess-pgn' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  }

  /**
   * Add visual annotations to a move
   */
  addMoveAnnotations(moveNumber: number, isWhite: boolean, annotations: PgnMoveAnnotations): void {
    const existingMoveIndex = this.moves.findIndex((move) => move.moveNumber === moveNumber);

    if (existingMoveIndex >= 0) {
      if (isWhite) {
        this.moves[existingMoveIndex].whiteAnnotations = annotations;
      } else {
        this.moves[existingMoveIndex].blackAnnotations = annotations;
      }
    }
  }

  /**
   * Parse a PGN string with comments containing visual annotations
   */
  loadPgnWithAnnotations(pgnString: string): void {
    // Implementation simplifiée - dans une vraie implémentation,
    // il faudrait parser complètement le PGN avec toutes ses variations
    const lines = pgnString.split('\n');
    let inMoves = false;
    let movesText = '';

    for (const line of lines) {
      if (line.startsWith('[')) {
        // Header line
        const match = line.match(/\[(\w+)\s+\"([^\"]*)\"\]/);
        if (match) {
          this.metadata[match[1]] = match[2];
        }
      } else if (line.trim() && !line.startsWith('[')) {
        inMoves = true;
        movesText += line + ' ';
      }
    }

    if (inMoves) {
      this.parseMovesWithAnnotations(movesText);
    }
  }

  /**
   * Parse moves string with embedded annotations
   */
  private parseMovesWithAnnotations(movesText: string): void {
    this.moves = [];

    const movePattern = /(\d+)\.(?!\d)(\.{2})?/g;
    const extractMoveSection = (
      startIndex: number,
    ): { san?: string; comments: string[]; nextIndex: number } => {
      let index = startIndex;
      const comments: string[] = [];
      const length = movesText.length;

      const skipWhitespace = () => {
        while (index < length && /\s/.test(movesText[index])) {
          index++;
        }
      };

      const collectComments = () => {
        while (true) {
          skipWhitespace();
          if (index >= length || movesText[index] !== '{') {
            break;
          }

          const closingIndex = movesText.indexOf('}', index + 1);
          if (closingIndex === -1) {
            const remaining = movesText.slice(index + 1).trim();
            if (remaining) {
              comments.push(remaining);
            }
            index = length;
            break;
          }

          const content = movesText.slice(index + 1, closingIndex).trim();
          if (content) {
            comments.push(content);
          }
          index = closingIndex + 1;
        }
      };

      collectComments();
      skipWhitespace();

      if (index >= length) {
        return { san: undefined, comments, nextIndex: index };
      }

      const rest = movesText.slice(index);

      if (/^(\d+)\.(?!\d)(\.{2})?/.test(rest) || /^(1-0|0-1|1\/2-1\/2|\*)/.test(rest)) {
        return { san: undefined, comments, nextIndex: index };
      }

      const sanMatch = rest.match(/^([^\s{]+)/);
      if (!sanMatch) {
        return { san: undefined, comments, nextIndex: index };
      }

      const san = sanMatch[1];
      index += san.length;

      collectComments();

      return { san, comments, nextIndex: index };
    };

    let match;

    while ((match = movePattern.exec(movesText)) !== null) {
      const moveNumber = parseInt(match[1], 10);
      const startsWithBlack = Boolean(match[2]);
      let currentIndex = movePattern.lastIndex;

      let pgnMove = this.moves.find((move) => move.moveNumber === moveNumber);
      if (!pgnMove) {
        pgnMove = {
          moveNumber,
          whiteAnnotations: { arrows: [], circles: [], textComment: '' },
          blackAnnotations: { arrows: [], circles: [], textComment: '' },
        };
        this.moves.push(pgnMove);
      } else {
        if (!pgnMove.whiteAnnotations) {
          pgnMove.whiteAnnotations = { arrows: [], circles: [], textComment: '' };
        }
        if (!pgnMove.blackAnnotations) {
          pgnMove.blackAnnotations = { arrows: [], circles: [], textComment: '' };
        }
      }

      if (!startsWithBlack) {
        const whiteSection = extractMoveSection(currentIndex);
        currentIndex = whiteSection.nextIndex;

        if (whiteSection.san) {
          pgnMove.white = whiteSection.san;
          if (whiteSection.comments.length > 0) {
            const normalizedComment = this.normalizeCommentParts(whiteSection.comments);
            if (normalizedComment) {
              const parsed = PgnAnnotationParser.parseComment(normalizedComment);
              pgnMove.whiteComment = normalizedComment;
              pgnMove.whiteAnnotations = {
                arrows: parsed.arrows,
                circles: parsed.highlights,
                textComment: parsed.textComment,
              };
            }
          }
        }
      }

      const blackSection = extractMoveSection(currentIndex);
      if (blackSection.san) {
        pgnMove.black = blackSection.san;
        if (blackSection.comments.length > 0) {
          const normalizedComment = this.normalizeCommentParts(blackSection.comments);
          if (normalizedComment) {
            const parsed = PgnAnnotationParser.parseComment(normalizedComment);
            pgnMove.blackComment = normalizedComment;
            pgnMove.blackAnnotations = {
              arrows: parsed.arrows,
              circles: parsed.highlights,
              textComment: parsed.textComment,
            };
          }
        }
      }
    }
  }

  private normalizeCommentParts(parts: string[]): string | undefined {
    const normalizedParts = parts.map((part) => part.trim()).filter((part) => part.length > 0);

    if (normalizedParts.length === 0) {
      return undefined;
    }

    const normalizedContent = normalizedParts.join(' ').replace(/\s+/g, ' ').trim();
    if (!normalizedContent) {
      return undefined;
    }

    return `{${normalizedContent}}`;
  }

  /**
   * Generate PGN with visual annotations embedded in comments
   */
  toPgnWithAnnotations(): string {
    let pgn = '';

    // Add headers
    const requiredHeaders = ['Event', 'Site', 'Date', 'Round', 'White', 'Black', 'Result'];

    // Add required headers first
    for (const header of requiredHeaders) {
      if (this.metadata[header]) {
        pgn += `[${header} "${this.metadata[header]}"]\n`;
      }
    }

    // Add optional headers
    for (const [key, value] of Object.entries(this.metadata)) {
      if (!requiredHeaders.includes(key) && value) {
        pgn += `[${key} "${value}"]\n`;
      }
    }

    pgn += '\n'; // Empty line after headers

    // Add moves with annotations
    let lineLength = 0;
    const maxLineLength = 80;

    for (const move of this.moves) {
      let moveText = `${move.moveNumber}.`;

      if (move.white) {
        moveText += ` ${move.white}`;

        let fullWhiteComment = '';
        if (move.whiteAnnotations) {
          const visualAnnotations = PgnAnnotationParser.fromDrawingObjects(
            move.whiteAnnotations.arrows || [],
            move.whiteAnnotations.circles || [],
          );
          const textComment = move.whiteAnnotations.textComment || '';
          fullWhiteComment = [visualAnnotations, textComment].filter(Boolean).join(' ').trim();
        }
        // If there's a whiteComment but no whiteAnnotations, use it as a fallback
        else if (move.whiteComment) {
          fullWhiteComment = move.whiteComment;
        }

        if (fullWhiteComment) {
          moveText += ` {${fullWhiteComment}}`;
        }
      }

      if (move.black) {
        moveText += ` ${move.black}`;

        let fullBlackComment = '';
        if (move.blackAnnotations) {
          const visualAnnotations = PgnAnnotationParser.fromDrawingObjects(
            move.blackAnnotations.arrows || [],
            move.blackAnnotations.circles || [],
          );
          const textComment = move.blackAnnotations.textComment || '';
          fullBlackComment = [visualAnnotations, textComment].filter(Boolean).join(' ').trim();
        }
        // If there's a blackComment but no blackAnnotations, use it as a fallback
        else if (move.blackComment) {
          fullBlackComment = move.blackComment;
        }

        if (fullBlackComment) {
          moveText += ` {${fullBlackComment}}`;
        }
      }

      // Check if we need a new line
      if (lineLength + moveText.length + 1 > maxLineLength) {
        pgn += '\n';
        lineLength = 0;
      }

      if (lineLength > 0) {
        pgn += ' ';
        lineLength++;
      }

      pgn += moveText;
      lineLength += moveText.length;
    }

    // Add result only if the game is over
    if (this.result !== '*') {
      if (lineLength > 0) {
        pgn += ' ';
      }
      pgn += this.result;
    }

    return pgn.trim();
  }

  /**
   * Get annotations for a specific move
   */
  getMoveAnnotations(moveNumber: number, isWhite: boolean): PgnMoveAnnotations | undefined {
    const move = this.moves.find((m) => m.moveNumber === moveNumber);
    if (!move) return undefined;

    return isWhite ? move.whiteAnnotations : move.blackAnnotations;
  }

  /**
   * Get all moves with their annotations
   */
  getMovesWithAnnotations(): PgnMove[] {
    return [...this.moves];
  }
}
