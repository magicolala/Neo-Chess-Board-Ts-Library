export type PuzzleDifficulty = 'beginner' | 'intermediate' | 'advanced';

export interface PuzzleVariant {
  id: string;
  label: string;
  moves: string[];
}

export interface PuzzleDefinition {
  id: string;
  title: string;
  fen: string;
  solution: string[];
  variants?: PuzzleVariant[];
  difficulty: PuzzleDifficulty;
  tags?: string[];
  author?: string;
  hint?: string;
  sourcePgn?: string;
}

export interface PuzzleCollection {
  id: string;
  title: string;
  description?: string;
  puzzles: PuzzleDefinition[];
}

export interface PuzzleSessionState {
  collectionId: string;
  currentPuzzleId: string;
  moveCursor: number;
  attempts: number;
  solvedPuzzles: Set<string>;
  hintUsage: number;
  autoAdvance: boolean;
  persistedAt?: string;
}

export type PuzzleEventType =
  | 'puzzle:load'
  | 'puzzle:move'
  | 'puzzle:hint'
  | 'puzzle:complete'
  | 'puzzle:persistence-warning';

export interface PuzzleEventMap {
  'puzzle:load': {
    collectionId: string;
    puzzle: PuzzleDefinition;
    session: PuzzleSessionState;
  };
  'puzzle:move': {
    puzzleId: string;
    move: string;
    result: 'correct' | 'incorrect';
    cursor: number;
  };
  'puzzle:hint': {
    puzzleId: string;
    hintType: 'text' | 'origin-highlight';
    hintPayload?: string;
  };
  'puzzle:complete': {
    puzzleId: string;
    attempts: number;
    durationMs?: number;
  };
  'puzzle:persistence-warning': {
    error: string;
    fallback: 'memory';
  };
}
