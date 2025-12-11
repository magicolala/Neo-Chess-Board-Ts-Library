import type { PuzzleDefinition } from './types';
import { type PuzzleSessionManager } from './PuzzleSessionManager';

export type PuzzleHintResult =
  | { type: 'text'; puzzle: PuzzleDefinition; message: string; hintUsage: number }
  | {
      type: 'origin-highlight';
      puzzle: PuzzleDefinition;
      targetSquare?: string | null;
      hintUsage: number;
    };

export class PuzzleHintService {
  constructor(private readonly session: PuzzleSessionManager) {}

  public requestHint(type: 'text' | 'origin-highlight' = 'text'): PuzzleHintResult | null {
    const puzzle = this.session.getCurrentPuzzle();
    if (!puzzle) {
      return null;
    }
    const nextMove = this.session.peekNextMove();
    const hintUsage = this.session.recordHintUsage();

    if (type === 'origin-highlight') {
      const targetSquare = nextMove
        ? PuzzleHintService.extractTargetSquare(nextMove, puzzle)
        : null;
      return {
        type: 'origin-highlight',
        puzzle,
        targetSquare,
        hintUsage,
      };
    }

    const message = PuzzleHintService.resolveTextHint(puzzle, nextMove);

    return {
      type: 'text',
      puzzle,
      message,
      hintUsage,
    };
  }

  private static resolveTextHint(puzzle: PuzzleDefinition, nextMove: string | null): string {
    if (typeof puzzle.hint === 'string' && puzzle.hint.trim().length > 0) {
      return puzzle.hint.trim();
    }
    if (nextMove) {
      return `Consider candidate moves similar to ${nextMove}.`;
    }
    return 'Look for forcing moves near the king.';
  }

  private static extractTargetSquare(san: string, puzzle: PuzzleDefinition): string | null {
    const cleaned = PuzzleHintService.normalizeSan(san);
    if (cleaned.startsWith('O-O-O')) {
      return PuzzleHintService.readCastleTarget(puzzle, 'queen');
    }
    if (cleaned.startsWith('O-O')) {
      return PuzzleHintService.readCastleTarget(puzzle, 'king');
    }
    const matches = cleaned.match(/[a-h][1-8]/g);
    if (!matches || matches.length === 0) {
      return null;
    }
    const lastIndex = matches.length - 1;
    if (lastIndex < 0) {
      return null;
    }
    const candidate = matches[lastIndex];
    return candidate ?? null;
  }

  private static normalizeSan(san: string): string {
    return san.replaceAll(/[+#?!]/g, '');
  }

  private static readCastleTarget(puzzle: PuzzleDefinition, side: 'king' | 'queen'): string | null {
    const activeColor = puzzle.fen?.split(' ')?.[1] === 'b' ? 'b' : 'w';
    if (side === 'king') {
      return activeColor === 'w' ? 'g1' : 'g8';
    }
    return activeColor === 'w' ? 'c1' : 'c8';
  }
}
