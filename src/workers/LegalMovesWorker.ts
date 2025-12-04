/**
 * Web Worker pour calculer les coups légaux de manière asynchrone
 *
 * Ce worker déporte les calculs de coups légaux (potentiellement lourds)
 * vers un thread séparé pour maintenir l'UI fluide.
 */

import { LightRules } from '../core/LightRules';
import type { Move, Square } from '../core/types';

export interface LegalMovesWorkerMessage {
  type: 'calculateAllMoves' | 'calculateMovesFrom' | 'calculateDeep';
  id?: string;
  fen: string;
  square?: Square;
  options?: {
    includeAllPieces?: boolean;
  };
}

export interface LegalMovesWorkerResponse {
  type: 'success' | 'error';
  id?: string;
  moves?: Move[];
  error?: string;
}

/**
 * Calcule tous les coups légaux depuis une position FEN
 */
function calculateAllMoves(fen: string): Move[] {
  const rules = new LightRules();
  rules.setFEN(fen);

  // Pour LightRules, on doit itérer sur toutes les cases
  // et calculer les coups de chaque pièce
  const allMoves: Move[] = [];
  const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'] as const;
  const ranks = ['1', '2', '3', '4', '5', '6', '7', '8'] as const;

  for (const file of files) {
    for (const rank of ranks) {
      const square = `${file}${rank}` as Square;
      const moves = rules.movesFrom(square);
      allMoves.push(...moves);
    }
  }

  return allMoves;
}

/**
 * Calcule les coups légaux d'une pièce spécifique
 */
function calculateMovesFrom(fen: string, square: Square): Move[] {
  const rules = new LightRules();
  rules.setFEN(fen);
  return rules.movesFrom(square);
}

/**
 * Crée une règle avec FEN modifié (trait changé)
 */
function createTempRulesWithTurnChange(fen: string, targetColor: 'w' | 'b'): LightRules {
  const tempRules = new LightRules();
  const currentTurn = fen.split(' ')[1];

  if (currentTurn === targetColor) {
    tempRules.setFEN(fen);
  } else {
    const fenParts = fen.split(' ');
    fenParts[1] = targetColor;
    const modifiedFen = fenParts.join(' ');
    tempRules.setFEN(modifiedFen);
  }

  return tempRules;
}

/**
 * Calcule les coups d'une pièce spécifique
 */
function calculateMovesForPiece(
  rules: LightRules,
  fen: string,
  square: Square,
  piece: string,
): Move[] {
  const pieceColor = piece === piece.toUpperCase() ? 'w' : 'b';
  const tempRules = createTempRulesWithTurnChange(fen, pieceColor);
  return tempRules.movesFrom(square);
}

/**
 * Calcule les coups de toutes les pièces (incluant celles hors du trait)
 */
function calculateAllPiecesMoves(rules: LightRules, fen: string): Move[] {
  const allMoves: Move[] = [];
  const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'] as const;
  const ranks = ['1', '2', '3', '4', '5', '6', '7', '8'] as const;

  for (const file of files) {
    for (const rank of ranks) {
      const square = `${file}${rank}` as Square;
      const piece = rules.pieceAt(square);

      if (piece) {
        const moves = calculateMovesForPiece(rules, fen, square, piece);
        allMoves.push(...moves);
      }
    }
  }

  return allMoves;
}

/**
 * Calcule les coups des pièces au trait uniquement
 */
function calculateCurrentTurnMoves(rules: LightRules): Move[] {
  const allMoves: Move[] = [];
  const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'] as const;
  const ranks = ['1', '2', '3', '4', '5', '6', '7', '8'] as const;

  for (const file of files) {
    for (const rank of ranks) {
      const square = `${file}${rank}` as Square;
      const moves = rules.movesFrom(square);
      allMoves.push(...moves);
    }
  }

  return allMoves;
}

/**
 * Calcule les coups légaux de manière approfondie
 * (tous les coups de toutes les pièces avec informations détaillées)
 */
function calculateDeep(fen: string, options?: { includeAllPieces?: boolean }): Move[] {
  const rules = new LightRules();
  rules.setFEN(fen);

  if (options?.includeAllPieces) {
    return calculateAllPiecesMoves(rules, fen);
  }

  return calculateCurrentTurnMoves(rules);
}

/**
 * Gère les messages reçus du thread principal
 */
globalThis.addEventListener('message', (event: MessageEvent<LegalMovesWorkerMessage>) => {
  const { type, id, fen, square, options } = event.data;

  try {
    let moves: Move[] = [];

    switch (type) {
      case 'calculateAllMoves': {
        moves = calculateAllMoves(fen);
        break;
      }

      case 'calculateMovesFrom': {
        if (!square) {
          throw new Error('square is required for calculateMovesFrom');
        }
        moves = calculateMovesFrom(fen, square);
        break;
      }

      case 'calculateDeep': {
        moves = calculateDeep(fen, options);
        break;
      }

      default: {
        throw new Error(`Unknown message type: ${type}`);
      }
    }

    const response: LegalMovesWorkerResponse = {
      type: 'success',
      id,
      moves,
    };

    self.postMessage(response);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const response: LegalMovesWorkerResponse = {
      type: 'error',
      id,
      error: errorMessage,
    };

    self.postMessage(response);
  }
});

/**
 * Gère les erreurs du Worker
 */
self.addEventListener('error', (error: ErrorEvent) => {
  self.postMessage({
    type: 'error',
    error: `Worker error: ${error.message}`,
  } as LegalMovesWorkerResponse);
});
