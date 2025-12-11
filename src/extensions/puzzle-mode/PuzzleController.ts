import type { PuzzleDefinition, PuzzleVariant } from './types';

export interface PuzzleControllerOptions {
  puzzle: PuzzleDefinition;
  variants?: PuzzleVariant[];
}

export interface PuzzleMoveResult {
  success: boolean;
  complete: boolean;
  cursor: number;
}

export class PuzzleController {
  private readonly sequences: string[][];
  private readonly normalizedSequences: string[][];
  private activeLines: number[];
  private cursor = 0;
  private solved = false;
  private attempts = 0;

  constructor(options: PuzzleControllerOptions) {
    const { puzzle, variants = [] } = options;
    const canonical = puzzle.solution ?? [];
    if (!Array.isArray(canonical) || canonical.length === 0) {
      throw new Error('[PuzzleController] Puzzle solutions must include at least one move.');
    }
    this.sequences = [canonical, ...variants.map((variant) => variant.moves)];
    this.normalizedSequences = this.sequences.map((seq) =>
      seq.map((move) => PuzzleController.normalize(move)),
    );
    this.activeLines = this.normalizedSequences.map((_, index) => index);
  }

  public reset(): void {
    this.cursor = 0;
    this.solved = false;
    this.attempts = 0;
    this.activeLines = this.normalizedSequences.map((_, index) => index);
  }

  public getCursor(): number {
    return this.cursor;
  }

  public getAttempts(): number {
    return this.attempts;
  }

  public isSolved(): boolean {
    return this.solved;
  }

  public handleMove(move: string): PuzzleMoveResult {
    if (this.solved) {
      return { success: false, complete: true, cursor: this.cursor };
    }

    const normalized = PuzzleController.normalize(move);
    const nextLines = this.activeLines.filter((lineIndex) => {
      const expected = this.normalizedSequences[lineIndex][this.cursor];
      return expected === normalized;
    });

    if (nextLines.length === 0) {
      this.attempts += 1;
      return { success: false, complete: false, cursor: this.cursor };
    }

    this.activeLines = nextLines;
    this.cursor += 1;
    const solvedLine = this.activeLines.find(
      (lineIndex) => this.cursor === this.normalizedSequences[lineIndex].length,
    );

    if (typeof solvedLine === 'number') {
      this.solved = true;
      return { success: true, complete: true, cursor: this.cursor };
    }

    return { success: true, complete: false, cursor: this.cursor };
  }

  private static normalize(move: string): string {
    return move.trim().replace(/\s+/g, ' ');
  }
}
