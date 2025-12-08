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
  const moves: PgnMove[] = [];
  const parseIssues: PgnParseError[] = [];
  let result = '*';

  const lines = pgnString.split('\n');
  let movesText = '';
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
      movesText += line + ' ';
    }
  }

  const resultMatch = /\s*(1-0|0-1|1\/2-1\/2|\*)\s*$/.exec(movesText);
  if (resultMatch) {
    result = resultMatch[1]!;
    movesText = movesText.replace(/\s*(1-0|0-1|1\/2-1\/2|\*)\s*$/, '');
  }

  const tokenRegex = /{[^}]*}|\S+/g;
  const tokens: string[] = [];
  let tokenMatch: RegExpExecArray | null;
  while ((tokenMatch = tokenRegex.exec(movesText)) !== null) {
    tokens.push(tokenMatch[0]);
  }
  let currentMoveNumber = 0;
  let isWhiteMove = true;

  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];

    if (token.endsWith('...')) {
      currentMoveNumber = Number.parseInt(token.slice(0, -3), 10);
      isWhiteMove = false;
      continue;
    }

    if (token.endsWith('.')) {
      currentMoveNumber = Number.parseInt(token.slice(0, -1), 10);
      isWhiteMove = true;
      continue;
    }

    if (token.startsWith('{')) {
      continue;
    }

    const san = token;
    let move = moves.find((m) => m.moveNumber === currentMoveNumber);
    if (!move) {
      move = { moveNumber: currentMoveNumber };
      moves.push(move);
    }

    let comment: string | undefined;
    if (i + 1 < tokens.length && tokens[i + 1].startsWith('{')) {
      comment = tokens[i + 1].slice(1, -1).trim();
    }

    const addAnnotations = (targetMove: PgnMove, side: 'white' | 'black') => {
      if (comment && includeAnnotations) {
        try {
          const annotations = PgnAnnotationParser.parseComment(comment);
          const annotationProp = side === 'white' ? 'whiteAnnotations' : 'blackAnnotations';
          const commentProp = side === 'white' ? 'whiteComment' : 'blackComment';

          targetMove[commentProp] = annotations.textComment;
          targetMove[annotationProp] = {
            arrows: annotations.arrows,
            circles: annotations.highlights.map((h) => ({
              square: h.square,
              type: 'circle',
              color: h.color,
            })),
            evaluation: annotations.evaluation,
          };

          if (annotations.issues) {
            parseIssues.push(...annotations.issues);
          }
        } catch (error) {
          parseIssues.push(
            new PgnParseError(
              `Failed to parse annotations: ${error instanceof Error ? error.message : String(error)}`,
              'PGN_IMPORT_FAILED',
              { details: { moveNumber: currentMoveNumber, comment } },
            ),
          );
        }
      } else if (comment) {
        const commentProp = side === 'white' ? 'whiteComment' : 'blackComment';
        targetMove[commentProp] = comment;
      }
    };

    if (isWhiteMove) {
      move.white = san;
      addAnnotations(move, 'white');
    } else {
      move.black = san;
      addAnnotations(move, 'black');
    }

    isWhiteMove = !isWhiteMove;
  }

  return { moves, result, parseIssues };
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
