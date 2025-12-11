import type { PuzzleModeConfig } from './types';

export interface CompletionBehavior {
  autoAdvance: boolean;
  stayOnBoard: boolean;
  invokeCallback: boolean;
}

export function resolveCompletionBehavior(config?: PuzzleModeConfig): CompletionBehavior {
  const autoAdvance = config?.autoAdvance !== false;
  const stayOnBoard = config?.autoAdvance === false;
  const invokeCallback = typeof config?.onComplete === 'function';

  return {
    autoAdvance,
    stayOnBoard,
    invokeCallback,
  };
}
