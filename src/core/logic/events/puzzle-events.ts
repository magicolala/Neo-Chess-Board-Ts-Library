import type { PuzzleEventMap } from '../../../extensions/puzzle-mode/types';

export const PUZZLE_EVENTS = {
  LOAD: 'puzzle:load',
  MOVE: 'puzzle:move',
  HINT: 'puzzle:hint',
  COMPLETE: 'puzzle:complete',
  PERSISTENCE_WARNING: 'puzzle:persistence-warning',
} as const;

export type PuzzleEventName = (typeof PUZZLE_EVENTS)[keyof typeof PUZZLE_EVENTS];

export type PuzzleEventPayload<N extends PuzzleEventName> = PuzzleEventMap[N];
