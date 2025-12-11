import {
  loadPuzzleSession,
  savePuzzleSession,
  clearPuzzleSession,
} from '../../utils/puzzle/persistence';
import type { PuzzleDefinition, PuzzleModeConfig, PuzzleSessionState } from './types';
import { PuzzleController } from './PuzzleController';

export interface PuzzleMoveEvaluation {
  accepted: boolean;
  complete: boolean;
  cursor: number;
}

interface PersistedPuzzleSession {
  currentPuzzleId: string;
  solvedPuzzles: string[];
  autoAdvance: boolean;
  attempts: number;
  hintUsage: number;
  persistedAt?: string;
}

interface PuzzleSessionManagerOptions {
  onPersistenceWarning?: (error?: string) => void;
}

const STORAGE_PREFIX = 'puzzle-mode:';

export class PuzzleSessionManager {
  private readonly config: PuzzleModeConfig;
  private readonly puzzles: PuzzleDefinition[];
  private readonly persistenceKey: string;
  private readonly options?: PuzzleSessionManagerOptions;
  private controller: PuzzleController;
  private currentIndex = 0;
  private state: PuzzleSessionState;

  constructor(config: PuzzleModeConfig, options?: PuzzleSessionManagerOptions) {
    this.options = options;
    this.config = {
      autoAdvance: true,
      allowHints: true,
      ...config,
    };
    this.persistenceKey = `${STORAGE_PREFIX}${config.collectionId}`;
    this.puzzles = [...config.puzzles];
    if (this.puzzles.length === 0) {
      throw new Error('[PuzzleSessionManager] At least one puzzle is required.');
    }

    const persisted = this.loadPersistedState();
    const requestedStartId = config.startPuzzleId;
    const initialPuzzleId = requestedStartId ?? persisted?.currentPuzzleId ?? null;
    const resolvedIndex = initialPuzzleId
      ? this.puzzles.findIndex((puzzle) => puzzle.id === initialPuzzleId)
      : -1;
    this.currentIndex = resolvedIndex >= 0 ? resolvedIndex : 0;

    const initialPuzzle = this.puzzles[this.currentIndex];
    this.controller = new PuzzleController({
      puzzle: initialPuzzle,
      variants: initialPuzzle.variants,
    });
    const shouldResetState = Boolean(
      requestedStartId && requestedStartId !== persisted?.currentPuzzleId,
    );
    this.state = {
      collectionId: config.collectionId,
      currentPuzzleId: initialPuzzle.id,
      moveCursor: 0,
      attempts: shouldResetState ? 0 : persisted?.attempts ?? 0,
      solvedPuzzles: new Set<string>(persisted?.solvedPuzzles ?? []),
      hintUsage: shouldResetState ? 0 : persisted?.hintUsage ?? 0,
      autoAdvance: persisted?.autoAdvance ?? this.config.autoAdvance ?? true,
      persistedAt: persisted?.persistedAt,
    };
  }

  public destroy(): void {
    this.controller.reset();
    clearPuzzleSession(this.persistenceKey);
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
      this.persistState();
      return { accepted: false, complete: false, cursor: result.cursor };
    }

    if (result.complete) {
      this.state.solvedPuzzles.add(this.getCurrentPuzzle().id);
    }
    this.persistState();

    return { accepted: true, complete: result.complete, cursor: result.cursor };
  }

  public resetCurrentPuzzle(): void {
    this.controller.reset();
    this.state.moveCursor = 0;
    this.state.attempts = 0;
    this.state.hintUsage = 0;
    this.persistState();
  }

  public getSolvedPuzzleIds(): string[] {
    return Array.from(this.state.solvedPuzzles);
  }

  public peekNextMove(): string | null {
    return this.controller.peekNextMove();
  }

  public recordHintUsage(): number {
    this.state.hintUsage += 1;
    this.persistState();
    return this.state.hintUsage;
  }

  public autoAdvanceIfNeeded(): boolean {
    if (!this.state.autoAdvance) {
      return false;
    }
    return this.advanceToNextPuzzle();
  }

  public advanceToNextPuzzle(): boolean {
    if (this.currentIndex + 1 >= this.puzzles.length) {
      return false;
    }
    this.currentIndex += 1;
    const nextPuzzle = this.getCurrentPuzzle();
    this.controller = new PuzzleController({
      puzzle: nextPuzzle,
      variants: nextPuzzle.variants,
    });
    this.state.currentPuzzleId = nextPuzzle.id;
    this.resetCurrentPuzzle();
    return true;
  }

  private loadPersistedState(): PersistedPuzzleSession | null {
    return loadPuzzleSession<PersistedPuzzleSession>(this.persistenceKey);
  }

  private persistState(): void {
    const nextPersistedAt = new Date().toISOString();
    const payload: PersistedPuzzleSession = {
      currentPuzzleId: this.state.currentPuzzleId,
      solvedPuzzles: Array.from(this.state.solvedPuzzles),
      autoAdvance: this.state.autoAdvance,
      attempts: this.state.attempts,
      hintUsage: this.state.hintUsage,
      persistedAt: nextPersistedAt,
    };
    const result = savePuzzleSession(this.persistenceKey, payload);
    if (result.persisted) {
      this.state.persistedAt = nextPersistedAt;
    } else {
      this.options?.onPersistenceWarning?.(result.error);
    }
  }
}
