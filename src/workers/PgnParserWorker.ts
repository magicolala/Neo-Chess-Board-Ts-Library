/**
 * Web Worker pour parser les fichiers PGN de manière asynchrone
 *
 * Ce worker déporte le parsing PGN (potentiellement lourd pour gros fichiers)
 * vers un thread séparé pour maintenir l'UI fluide.
 */

import { PgnAnnotationParser } from '../core/PgnAnnotationParser';
import { PgnParseError, type PgnParseErrorCode } from '../core/errors';
import type { PgnMetadata } from '../core/PgnNotation';
import type { PgnMove } from '../core/types';

export interface PgnParserWorkerMessage {
  type: 'parsePgn' | 'parsePgnBatch' | 'validatePgn';
  id?: string;
  pgn?: string;
  pgns?: string[];
  options?: {
    includeAnnotations?: boolean;
  };
}

export interface ParsedPgnResult {
  metadata: PgnMetadata;
  moves: PgnMove[];
  result: string;
  parseIssues: Array<{
    message: string;
    code: PgnParseErrorCode;
    details?: Record<string, unknown>;
  }>;
}

export interface PgnParserWorkerResponse {
  type: 'success' | 'error';
  id?: string;
  result?: ParsedPgnResult;
  results?: ParsedPgnResult[];
  valid?: boolean;
  error?: string;
}

const PGN_HEADER_REGEX = /\[(\w+)\s+"([^"]*)"\]/;

/**
 * Parse les métadonnées d'un PGN
 */
function parseMetadata(pgnString: string): PgnMetadata {
  const metadata: PgnMetadata = {};
  const lines = pgnString.split('\n');

  for (const line of lines) {
    if (line.startsWith('[')) {
      const match = PGN_HEADER_REGEX.exec(line);
      if (match) {
        metadata[match[1]!] = match[2];
      }
    } else {
      // On s'arrête à la première ligne non-header
      break;
    }
  }

  return metadata;
}

/**
 * Parse les coups d'un PGN (version simplifiée)
 */
function parseMoves(
  pgnString: string,
  includeAnnotations: boolean,
): {
  moves: PgnMove[];
  result: string;
  parseIssues: PgnParseError[];
} {
  const parser = new PgnMoveParser(pgnString, includeAnnotations);
  return parser.parse();
}

class PgnMoveParser {
  private moves: PgnMove[] = [];
  private parseIssues: PgnParseError[] = [];
  private result: string = '*';
  private movesText = '';
  private tokens: string[] = [];
  private currentMoveNumber = 0;
  private isWhiteMove = true;

  constructor(
    private pgnString: string,
    private includeAnnotations: boolean,
  ) {}

  parse(): {
    moves: PgnMove[];
    result: string;
    parseIssues: PgnParseError[];
  } {
    this.collectMoves();
    this.extractResult();
    this.tokenize();
    this.processTokens();

    return {
      moves: this.moves,
      result: this.result,
      parseIssues: this.parseIssues,
    };
  }

  private collectMoves(): void {
    const lines = this.pgnString.split('\n');
    let inHeaders = true;

    for (const line of lines) {
      if (line.startsWith('[')) {
        continue;
      }
      if (inHeaders && line.trim() === '') {
        inHeaders = false;
        continue;
      }
      if (!inHeaders) {
        this.movesText += `${line} `;
      }
    }
    this.movesText = this.movesText.trim();
  }

  private extractResult(): void {
    const resultMatch = /\s*(1-0|0-1|1\/2-1\/2|\*)\s*$/.exec(this.movesText);
    if (!resultMatch) {
      return;
    }
    this.result = resultMatch[1]!;
    this.movesText = this.movesText.slice(0, resultMatch.index).trimEnd();
  }

  private tokenize(): void {
    const tokenRegex = /{[^}]*}|\S+/g;
    let tokenMatch: RegExpExecArray | null;
    while ((tokenMatch = tokenRegex.exec(this.movesText)) !== null) {
      this.tokens.push(tokenMatch[0]);
    }
  }

  private processTokens(): void {
    for (let index = 0; index < this.tokens.length; index++) {
      const token = this.tokens[index];
      if (this.handleEllipsis(token)) {
        continue;
      }
      if (this.handleMoveNumber(token)) {
        continue;
      }
      if (this.isCommentToken(token)) {
        continue;
      }

      const comment = this.peekComment(index);
      this.applySan(token, comment);
    }
  }

  private handleEllipsis(token: string): boolean {
    if (!token.endsWith('...')) {
      return false;
    }
    const moveNumber = Number.parseInt(token.slice(0, -3), 10);
    if (Number.isFinite(moveNumber)) {
      this.currentMoveNumber = moveNumber;
    }
    this.isWhiteMove = false;
    return true;
  }

  private handleMoveNumber(token: string): boolean {
    if (!token.endsWith('.')) {
      return false;
    }
    const moveNumber = Number.parseInt(token.slice(0, -1), 10);
    if (Number.isFinite(moveNumber)) {
      this.currentMoveNumber = moveNumber;
    }
    this.isWhiteMove = true;
    return true;
  }

  private isCommentToken(token: string): boolean {
    return token.startsWith('{') && token.endsWith('}');
  }

  private peekComment(index: number): string | undefined {
    const nextToken = this.tokens[index + 1];
    if (nextToken && this.isCommentToken(nextToken)) {
      return nextToken.slice(1, -1).trim();
    }
    return undefined;
  }

  private applySan(token: string, comment?: string): void {
    const move = this.ensureMoveEntry();
    if (this.isWhiteMove) {
      move.white = token;
      this.attachAnnotations(move, 'white', comment);
    } else {
      move.black = token;
      this.attachAnnotations(move, 'black', comment);
    }
    this.isWhiteMove = !this.isWhiteMove;
  }

  private ensureMoveEntry(): PgnMove {
    let move = this.moves.find((entry) => entry.moveNumber === this.currentMoveNumber);
    if (!move) {
      move = { moveNumber: this.currentMoveNumber };
      this.moves.push(move);
    }
    return move;
  }

  private attachAnnotations(targetMove: PgnMove, side: 'white' | 'black', comment?: string): void {
    if (!comment) {
      return;
    }

    const annotationProp = side === 'white' ? 'whiteAnnotations' : 'blackAnnotations';
    const commentProp = side === 'white' ? 'whiteComment' : 'blackComment';

    if (!this.includeAnnotations) {
      targetMove[commentProp] = comment;
      return;
    }

    try {
      const annotations = PgnAnnotationParser.parseComment(comment);
      targetMove[commentProp] = annotations.textComment;
      targetMove[annotationProp] = {
        arrows: annotations.arrows,
        circles: annotations.highlights.map((highlight) => ({
          square: highlight.square,
          type: 'circle',
          color: highlight.color,
        })),
        evaluation: annotations.evaluation,
      };

      if (annotations.issues) {
        this.parseIssues.push(...annotations.issues);
      }
    } catch (error) {
      this.parseIssues.push(
        new PgnParseError(
          `Failed to parse annotations: ${error instanceof Error ? error.message : String(error)}`,
          'PGN_IMPORT_FAILED',
          { details: { moveNumber: this.currentMoveNumber, comment } },
        ),
      );
    }
  }
}

/**
 * Parse un PGN complet
 */
function parsePgn(pgn: string, options?: { includeAnnotations?: boolean }): ParsedPgnResult {
  const includeAnnotations = options?.includeAnnotations ?? true;

  const metadata = parseMetadata(pgn);
  const { moves, result, parseIssues } = parseMoves(pgn, includeAnnotations);

  return {
    metadata,
    moves,
    result,
    parseIssues: parseIssues.map((issue) => ({
      message: issue.message,
      code: issue.code,
      details: issue.details,
    })),
  };
}

/**
 * Valide un PGN (vérification basique de syntaxe)
 */
function validatePgn(pgn: string): boolean {
  try {
    // Vérifications basiques
    if (!pgn || pgn.trim().length === 0) {
      return false;
    }

    // Doit contenir au moins un header
    if (!pgn.includes('[')) {
      return false;
    }

    // Doit contenir soit des coups, soit un résultat
    const hasMoves = /\d+\./.test(pgn);
    const hasResult = /(1-0|0-1|1\/2-1\/2|\*)/.test(pgn);

    return hasMoves || hasResult;
  } catch {
    return false;
  }
}

/**
 * Gère les messages reçus du thread principal
 */
globalThis.addEventListener('message', (event: MessageEvent<PgnParserWorkerMessage>) => {
  if (event.origin && event.origin !== globalThis.origin) {
    globalThis.postMessage({
      type: 'error',
      error: `Untrusted message origin: ${event.origin}`,
    } as PgnParserWorkerResponse);
    return;
  }

  const { type, id, pgn, pgns, options } = event.data;

  try {
    switch (type) {
      case 'parsePgn': {
        if (!pgn) {
          throw new Error('pgn is required for parsePgn');
        }
        const result = parsePgn(pgn, options);
        self.postMessage({
          type: 'success',
          id,
          result,
        } as PgnParserWorkerResponse);
        break;
      }

      case 'parsePgnBatch': {
        if (!pgns || pgns.length === 0) {
          throw new Error('pgns array is required for parsePgnBatch');
        }
        const results = pgns.map((p) => parsePgn(p, options));
        self.postMessage({
          type: 'success',
          id,
          results,
        } as PgnParserWorkerResponse);
        break;
      }

      case 'validatePgn': {
        if (!pgn) {
          throw new Error('pgn is required for validatePgn');
        }
        const valid = validatePgn(pgn);
        self.postMessage({
          type: 'success',
          id,
          valid,
        } as PgnParserWorkerResponse);
        break;
      }

      default: {
        throw new Error(`Unknown message type: ${type}`);
      }
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    self.postMessage({
      type: 'error',
      id,
      error: errorMessage,
    } as PgnParserWorkerResponse);
  }
});

/**
 * Gère les erreurs du Worker
 */
self.addEventListener('error', (error: ErrorEvent) => {
  self.postMessage({
    type: 'error',
    error: `Worker error: ${error.message}`,
  } as PgnParserWorkerResponse);
});
