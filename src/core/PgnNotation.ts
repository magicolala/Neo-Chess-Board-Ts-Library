/**
 * PGN (Portable Game Notation) generator for chess games
 * Provides functionality to export games in standard PGN format
 * Supports visual annotations (%cal arrows and %csl circles)
 */
import { PgnAnnotationParser } from './PgnAnnotationParser';
import { PgnParseError, type PgnParseErrorCode } from './errors';
import type {
  RulesAdapter,
  PgnMove,
  PgnMoveAnnotations,
  ChessLike,
  VerboseHistoryEntry,
} from './types';

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
  private parseIssues: PgnParseError[];

  private static isVerboseHistory(
    history: ReturnType<ChessLike['history']>,
  ): history is VerboseHistoryEntry[] {
    return history.length > 0 && typeof history[0] !== 'string';
  }

  constructor(rulesAdapter?: RulesAdapter) {
    this.rulesAdapter = rulesAdapter;
    this.metadata = {
      Event: 'Casual Game',
      Site: 'Neo Chess Board',
      Date: new Date().toISOString().split('T')[0].replaceAll('-', '.'),
      Round: '1',
      White: 'Player 1',
      Black: 'Player 2',
      Result: '*',
    };
    this.moves = [];
    this.result = '*'; // Game in progress
    this.parseIssues = [];
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
      this.metadata.Date = new Date().toISOString().split('T')[0].replaceAll('-', '.');
    if (!this.metadata.Round) this.metadata.Round = '1';
    if (!this.metadata.White) this.metadata.White = 'Player 1';
    if (!this.metadata.Black) this.metadata.Black = 'Player 2';
    if (!this.metadata.Result) this.metadata.Result = this.result;
  }

  getMetadata(): PgnMetadata {
    return { ...this.metadata };
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

    if (existingMoveIndex === -1) {
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
    } else {
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
  importFromChessJs(chess: ChessLike): void {
    const preservedMoves = new Map<
      number,
      {
        whiteComment?: string;
        blackComment?: string;
        whiteAnnotations?: PgnMoveAnnotations;
        blackAnnotations?: PgnMoveAnnotations;
        evaluation?: PgnMove['evaluation'];
      }
    >();

    for (const move of this.moves) {
      preservedMoves.set(move.moveNumber, {
        whiteComment: move.whiteComment,
        blackComment: move.blackComment,
        whiteAnnotations: this.cloneAnnotations(move.whiteAnnotations),
        blackAnnotations: this.cloneAnnotations(move.blackAnnotations),
        evaluation: move.evaluation ? { ...move.evaluation } : undefined,
      });
    }

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

        if (PgnNotation.isVerboseHistory(detailedHistory)) {
          for (const [i, move] of detailedHistory.entries()) {
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
        } else {
          const historyStrings = detailedHistory as string[];
          for (let i = 0; i < historyStrings.length; i += 2) {
            const moveNumber = Math.floor(i / 2) + 1;
            const whiteMove = historyStrings[i];
            const blackMove = historyStrings[i + 1];
            this.addMove(moveNumber, whiteMove, blackMove);
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
        const whiteMove = history[i] as string | undefined;
        const blackMove = history[i + 1] as string | undefined;
        this.addMove(moveNumber, whiteMove, blackMove);
      }
    }

    this.restorePreservedMoveState(preservedMoves);

    // Set result based on game state
    if (chess.isCheckmate()) {
      const turn = chess.turn();
      this.setResult((turn === 'w' ? '0-1' : '1-0') as '0-1' | '1-0');
    } else if (
      chess.isDraw?.() ||
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
    let cleanPgn = pgnText.replaceAll(/\{[^}]*\}/g, '').replaceAll(/\([^)]*\)/g, '');

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
      const moveNumber = Number.parseInt(match[1]);
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

  private cloneAnnotations(annotations?: PgnMoveAnnotations): PgnMoveAnnotations | undefined {
    if (!annotations) {
      return undefined;
    }

    return {
      ...annotations,
      arrows: annotations.arrows?.map((arrow) => ({ ...arrow })),
      circles: annotations.circles?.map((circle) => ({ ...circle })),
    };
  }

  private restorePreservedMoveState(
    preservedMoves: Map<
      number,
      {
        whiteComment?: string;
        blackComment?: string;
        whiteAnnotations?: PgnMoveAnnotations;
        blackAnnotations?: PgnMoveAnnotations;
        evaluation?: PgnMove['evaluation'];
      }
    >,
  ): void {
    if (preservedMoves.size === 0 || this.moves.length === 0) {
      return;
    }

    for (const move of this.moves) {
      const snapshot = preservedMoves.get(move.moveNumber);
      if (!snapshot) {
        continue;
      }

      if (snapshot.whiteComment && !move.whiteComment) {
        move.whiteComment = snapshot.whiteComment;
      }

      if (snapshot.blackComment && !move.blackComment) {
        move.blackComment = snapshot.blackComment;
      }

      if (snapshot.whiteAnnotations) {
        move.whiteAnnotations = this.cloneAnnotations(snapshot.whiteAnnotations);
        this.updateMoveEvaluation(move, 'white', snapshot.whiteAnnotations.evaluation);
      } else if (snapshot.evaluation?.white !== undefined) {
        this.updateMoveEvaluation(move, 'white', snapshot.evaluation.white);
      }

      if (snapshot.blackAnnotations) {
        move.blackAnnotations = this.cloneAnnotations(snapshot.blackAnnotations);
        this.updateMoveEvaluation(move, 'black', snapshot.blackAnnotations.evaluation);
      } else if (snapshot.evaluation?.black !== undefined) {
        this.updateMoveEvaluation(move, 'black', snapshot.evaluation.black);
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
    if (globalThis.window !== undefined && globalThis.document) {
      const blob = new Blob([this.toPgnWithAnnotations()], { type: 'application/x-chess-pgn' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.append(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    }
  }

  /**
   * Add visual annotations to a move
   */
  addMoveAnnotations(moveNumber: number, isWhite: boolean, annotations: PgnMoveAnnotations): void {
    const existingMoveIndex = this.moves.findIndex((move) => move.moveNumber === moveNumber);

    if (existingMoveIndex !== -1) {
      const move = this.moves[existingMoveIndex];
      if (isWhite) {
        move.whiteAnnotations = annotations;
        this.updateMoveEvaluation(move, 'white', annotations.evaluation);
      } else {
        move.blackAnnotations = annotations;
        this.updateMoveEvaluation(move, 'black', annotations.evaluation);
      }
    }
  }

  /**
   * Parse a PGN string with comments containing visual annotations
   */
  loadPgnWithAnnotations(pgnString: string): void {
    // Simplified implementation - a full-featured version would parse PGN with every variation
    const lines = pgnString.split('\n');
    let inMoves = false;
    let movesText = '';
    this.parseIssues = [];

    for (const line of lines) {
      if (line.startsWith('[')) {
        // Header line
        const match = line.match(/\[(\w+)\s+"([^"]*)"\]/);
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

  getParseIssues(): PgnParseError[] {
    return [...this.parseIssues];
  }

  /**
   * Parse moves string with embedded annotations
   */
  private parseMovesWithAnnotations(movesText: string): void {
    this.moves = [];

    const movePattern = /(\d+)\.(?!\d)(\.{2})?/g;
    const registerIssue = (
      code: PgnParseErrorCode,
      message: string,
      details?: Record<string, unknown>,
    ) => {
      this.parseIssues.push(new PgnParseError(message, code, { details }));
    };

    const mergeAnnotationIssueDetails = (
      issue: PgnParseError,
      moveNumber: number,
      color: 'white' | 'black',
    ): Record<string, unknown> => {
      const baseDetails: Record<string, unknown> = issue.details ? { ...issue.details } : {};
      baseDetails.moveNumber = moveNumber;
      baseDetails.color = color;
      return baseDetails;
    };

    const extractMoveSection = (
      startIndex: number,
      moveNumber: number,
      color: 'white' | 'black',
    ): { san?: string; comments: string[]; nextIndex: number } => {
      let index = startIndex;
      const comments: string[] = [];
      const length = movesText.length;

      const skipWhitespace = () => {
        while (index < length && /\s/.test(movesText[index]!)) {
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
            registerIssue(
              'PGN_PARSE_UNTERMINATED_COMMENT',
              'Unterminated PGN comment detected while parsing annotations.',
              { moveNumber, color, index },
            );
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

      const resultTokenMatch = /^(1-0|0-1|1\/2-1\/2|\*)/.exec(rest);
      if (/^(\d+)\.(?!\d)(\.{2})?/.test(rest) || resultTokenMatch) {
        if (resultTokenMatch) {
          registerIssue(
            'PGN_PARSE_RESULT_IN_MOVE',
            'Game result token encountered before move text.',
            { moveNumber, color, rawComment: resultTokenMatch[1] },
          );
        }
        return { san: undefined, comments, nextIndex: index };
      }

      const sanMatch = rest.match(/^([^\s{]+)/);
      if (!sanMatch) {
        if (rest.trim()) {
          registerIssue(
            'PGN_PARSE_MOVE_TEXT_MISSING',
            'Unable to parse move text segment in PGN.',
            { moveNumber, color, rawComment: rest.trim().slice(0, 20) },
          );
        }
        return { san: undefined, comments, nextIndex: index };
      }

      const san = sanMatch[1];
      index += san.length;

      collectComments();

      return { san, comments, nextIndex: index };
    };

    let match: RegExpExecArray | null;

    while ((match = movePattern.exec(movesText)) !== null) {
      const moveNumber = Number.parseInt(match[1], 10);
      const startsWithBlack = Boolean(match[2]);
      let currentIndex = movePattern.lastIndex;

      let pgnMove = this.moves.find((move) => move.moveNumber === moveNumber);
      if (pgnMove) {
        if (!pgnMove.whiteAnnotations) {
          pgnMove.whiteAnnotations = { arrows: [], circles: [], textComment: '' };
        }
        if (!pgnMove.blackAnnotations) {
          pgnMove.blackAnnotations = { arrows: [], circles: [], textComment: '' };
        }
      } else {
        pgnMove = {
          moveNumber,
          whiteAnnotations: { arrows: [], circles: [], textComment: '' },
          blackAnnotations: { arrows: [], circles: [], textComment: '' },
        };
        this.moves.push(pgnMove);
      }

      if (!startsWithBlack) {
        const whiteSection = extractMoveSection(currentIndex, moveNumber, 'white');
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
                evaluation: parsed.evaluation,
              };
              this.updateMoveEvaluation(pgnMove, 'white', parsed.evaluation);
              if (parsed.issues?.length) {
                for (const issue of parsed.issues) {
                  const issueCode = issue.code as PgnParseErrorCode;
                  this.parseIssues.push(
                    new PgnParseError(issue.message, issueCode, {
                      details: mergeAnnotationIssueDetails(issue, moveNumber, 'white'),
                    }),
                  );
                }
              }
            }
          }
        } else if (whiteSection.comments.length > 0) {
          registerIssue(
            'PGN_PARSE_MOVE_TEXT_MISSING',
            'Comment found without preceding white move.',
            { moveNumber, color: 'white', rawComment: whiteSection.comments.join(' ') },
          );
        }
      }

      const blackSection = extractMoveSection(currentIndex, moveNumber, 'black');

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
              evaluation: parsed.evaluation,
            };
            this.updateMoveEvaluation(pgnMove, 'black', parsed.evaluation);
            if (parsed.issues?.length) {
              for (const issue of parsed.issues) {
                const issueCode = issue.code as PgnParseErrorCode;
                this.parseIssues.push(
                  new PgnParseError(issue.message, issueCode, {
                    details: mergeAnnotationIssueDetails(issue, moveNumber, 'black'),
                  }),
                );
              }
            }
          }
        }
      } else if (blackSection.comments.length > 0) {
        registerIssue(
          'PGN_PARSE_MOVE_TEXT_MISSING',
          'Comment found without preceding black move.',
          { moveNumber, color: 'black', rawComment: blackSection.comments.join(' ') },
        );
      }
    }
  }

  private static formatEvaluation(value: number | string): string {
    return `[%eval ${String(value).trim()}]`;
  }

  private updateMoveEvaluation(
    move: PgnMove,
    color: 'white' | 'black',
    value: number | string | undefined,
  ): void {
    if (value !== undefined) {
      move.evaluation = { ...move.evaluation, [color]: value };
      return;
    }

    if (!move.evaluation) {
      return;
    }

    if (color === 'white') {
      delete move.evaluation.white;
    } else {
      delete move.evaluation.black;
    }

    if (move.evaluation.white === undefined && move.evaluation.black === undefined) {
      move.evaluation = undefined;
    }
  }

  private normalizeCommentParts(parts: string[]): string | undefined {
    const normalizedParts = parts.map((part) => part.trim()).filter((part) => part.length > 0);

    if (normalizedParts.length === 0) {
      return undefined;
    }

    const normalizedContent = normalizedParts.join(' ').replaceAll(/\s+/g, ' ').trim();
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
          const annotationParts: string[] = [];
          const visualAnnotations = PgnAnnotationParser.fromDrawingObjects(
            move.whiteAnnotations.arrows || [],
            move.whiteAnnotations.circles || [],
          );
          if (visualAnnotations) {
            annotationParts.push(visualAnnotations);
          }
          if (move.whiteAnnotations.evaluation !== undefined) {
            annotationParts.push(PgnNotation.formatEvaluation(move.whiteAnnotations.evaluation));
          }
          const textComment = move.whiteAnnotations.textComment?.trim();
          if (textComment) {
            annotationParts.push(textComment);
          }
          fullWhiteComment = annotationParts.join(' ').trim();
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
          const annotationParts: string[] = [];
          const visualAnnotations = PgnAnnotationParser.fromDrawingObjects(
            move.blackAnnotations.arrows || [],
            move.blackAnnotations.circles || [],
          );
          if (visualAnnotations) {
            annotationParts.push(visualAnnotations);
          }
          if (move.blackAnnotations.evaluation !== undefined) {
            annotationParts.push(PgnNotation.formatEvaluation(move.blackAnnotations.evaluation));
          }
          const textComment = move.blackAnnotations.textComment?.trim();
          if (textComment) {
            annotationParts.push(textComment);
          }
          fullBlackComment = annotationParts.join(' ').trim();
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
