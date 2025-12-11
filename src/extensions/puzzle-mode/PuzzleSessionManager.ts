import type { PuzzleDefinition, PuzzleModeConfig, PuzzleSessionState } from './types';
import { PuzzleController } from './PuzzleController';

export interface PuzzleMoveEvaluation {
  accepted: boolean;
  complete: boolean;
  cursor: number;
}

export class PuzzleSessionManager {
  private readonly config: PuzzleModeConfig;
  private readonly puzzles: PuzzleDefinition[];
  private controller: PuzzleController;
  private currentIndex = 0;
  private state: PuzzleSessionState;

  constructor(config: PuzzleModeConfig) {
    this.config = {
      autoAdvance: true,
      allowHints: true,
      ...config,
    };
    this.puzzles = [...config.puzzles];
    if (this.puzzles.length === 0) {
      throw new Error('[PuzzleSessionManager] At least one puzzle is required.');
    }
    this.controller = new PuzzleController({ puzzle: this.puzzles[0], variants: this.puzzles[0].variants });
    this.state = {
      collectionId: config.collectionId,
      currentPuzzleId: this.puzzles[0].id,
      moveCursor: 0,
      attempts: 0,
      solvedPuzzles: new Set<string>(),
      hintUsage: 0,
      autoAdvance: this.config.autoAdvance ?? true,
    };
  }

  public getCurrentPuzzle(): PuzzleDefinition {
    return this.puzzles[this.currentIndex];
  }

  public getState(): PuzzleSessionState {
    return this.state;
  }

  public handleMove(san: string): PuzzleMoveEvaluation {
    const result = this.controller.handleMove(san);
    this.state.moveCursor = result.cursor;
    this.state.attempts = this.controller.getAttempts();

    if (!result.success) {
      return { accepted: false, complete: false, cursor: result.cursor };
    }

    if (result.complete) {
      this.state.solvedPuzzles.add(this.getCurrentPuzzle().id);
    }

    return { accepted: true, complete: result.complete, cursor: result.cursor };
  }

  public resetCurrentPuzzle(): void {
    this.controller.reset();
    this.state.moveCursor = 0;
    this.state.attempts = 0;
    this.state.hintUsage = 0;
  }

  public getSolvedPuzzleIds(): string[] {
    return Array.from(this.state.solvedPuzzles);
  }

  public autoAdvanceIfNeeded(): boolean {
    if (!this.config.autoAdvance) {
      return false;
    }

    return this.advanceToNextPuzzle();
  }

  public advanceToNextPuzzle(): boolean {
    if (this.currentIndex + 1 >= this.puzzles.length) {
      return false;
    }
    this.currentIndex += 1;
    this.controller = new PuzzleController({
      puzzle: this.getCurrentPuzzle(),
      variants: this.getCurrentPuzzle().variants,
    });
    this.state.currentPuzzleId = this.getCurrentPuzzle().id;
    this.resetCurrentPuzzle();
    return true;
  }
}
