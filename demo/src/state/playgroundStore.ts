import { useCallback, useSyncExternalStore } from 'react';
import type { CustomThemeName } from '../../../src/core/themes';
import { BUILTIN_PIECE_SET_ID } from '../pieces';

export type ThemeName = CustomThemeName;

export interface PlaygroundState {
  theme: ThemeName;
  pieceSetId: string;
  showCoordinates: boolean;
  highlightLegal: boolean;
  interactive: boolean;
  autoFlip: boolean;
  allowDrawingArrows: boolean;
  animationDurationInMs: number;
  dragActivationDistance: number;
  promotionUi: 'dialog' | 'inline';
  autoQueen: boolean;
}

export const PLAYGROUND_DEFAULT_STATE: PlaygroundState = {
  theme: 'midnight',
  pieceSetId: BUILTIN_PIECE_SET_ID,
  showCoordinates: true,
  highlightLegal: true,
  interactive: true,
  autoFlip: false,
  allowDrawingArrows: true,
  animationDurationInMs: 300,
  dragActivationDistance: 0,
  promotionUi: 'dialog',
  autoQueen: false,
};

type PlaygroundStoreListener = () => void;

const listeners = new Set<PlaygroundStoreListener>();

let state: PlaygroundState = { ...PLAYGROUND_DEFAULT_STATE };

const getSnapshot = (): PlaygroundState => state;
const getServerSnapshot = (): PlaygroundState => PLAYGROUND_DEFAULT_STATE;

const notify = (): void => {
  for (const listener of listeners) {
    listener();
  }
};

type PlaygroundStatePartial = Partial<PlaygroundState>;
export type PlaygroundStateUpdater =
  | PlaygroundStatePartial
  | ((current: PlaygroundState) => PlaygroundStatePartial | void);

const applyPartial = (partial: PlaygroundStatePartial | void): boolean => {
  if (!partial) {
    return false;
  }

  let changed = false;
  const nextState: PlaygroundState = { ...state };

  if (partial.theme !== undefined && !Object.is(nextState.theme, partial.theme)) {
    nextState.theme = partial.theme;
    changed = true;
  }

  if (partial.pieceSetId !== undefined && !Object.is(nextState.pieceSetId, partial.pieceSetId)) {
    nextState.pieceSetId = partial.pieceSetId;
    changed = true;
  }

  if (
    partial.showCoordinates !== undefined &&
    !Object.is(nextState.showCoordinates, partial.showCoordinates)
  ) {
    nextState.showCoordinates = partial.showCoordinates;
    changed = true;
  }

  if (
    partial.highlightLegal !== undefined &&
    !Object.is(nextState.highlightLegal, partial.highlightLegal)
  ) {
    nextState.highlightLegal = partial.highlightLegal;
    changed = true;
  }

  if (partial.interactive !== undefined && !Object.is(nextState.interactive, partial.interactive)) {
    nextState.interactive = partial.interactive;
    changed = true;
  }

  if (partial.autoFlip !== undefined && !Object.is(nextState.autoFlip, partial.autoFlip)) {
    nextState.autoFlip = partial.autoFlip;
    changed = true;
  }

  if (
    partial.allowDrawingArrows !== undefined &&
    !Object.is(nextState.allowDrawingArrows, partial.allowDrawingArrows)
  ) {
    nextState.allowDrawingArrows = partial.allowDrawingArrows;
    changed = true;
  }

  if (
    partial.animationDurationInMs !== undefined &&
    !Object.is(nextState.animationDurationInMs, partial.animationDurationInMs)
  ) {
    nextState.animationDurationInMs = partial.animationDurationInMs;
    changed = true;
  }

  if (
    partial.dragActivationDistance !== undefined &&
    !Object.is(nextState.dragActivationDistance, partial.dragActivationDistance)
  ) {
    nextState.dragActivationDistance = partial.dragActivationDistance;
    changed = true;
  }

  if (partial.promotionUi !== undefined && !Object.is(nextState.promotionUi, partial.promotionUi)) {
    nextState.promotionUi = partial.promotionUi;
    changed = true;
  }

  if (partial.autoQueen !== undefined && !Object.is(nextState.autoQueen, partial.autoQueen)) {
    nextState.autoQueen = partial.autoQueen;
    changed = true;
  }

  if (!changed) {
    return false;
  }

  state = nextState;
  return true;
};

const setState = (update: PlaygroundStateUpdater): void => {
  const partial = typeof update === 'function' ? update(state) : update;
  const changed = applyPartial(partial);
  if (changed) {
    notify();
  }
};

const resetState = (): void => {
  const changed = applyPartial({ ...PLAYGROUND_DEFAULT_STATE });
  if (changed) {
    notify();
  }
};

const subscribe = (listener: PlaygroundStoreListener): (() => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

export const playgroundStore = {
  getState: getSnapshot,
  setState,
  reset: resetState,
  subscribe,
};

export type PlaygroundStateUpdateFn = (update: PlaygroundStateUpdater) => void;

export function usePlaygroundState(): PlaygroundState {
  const subscribeToStore = useCallback(
    (listener: PlaygroundStoreListener) => subscribe(listener),
    [],
  );

  return useSyncExternalStore(subscribeToStore, getSnapshot, getServerSnapshot);
}

export function usePlaygroundSelector<T>(selector: (value: PlaygroundState) => T): T {
  const subscribeToStore = useCallback(
    (listener: PlaygroundStoreListener) => subscribe(listener),
    [],
  );

  const getSelectedSnapshot = useCallback(() => selector(getSnapshot()), [selector]);
  const getSelectedServerSnapshot = useCallback(() => selector(getServerSnapshot()), [selector]);

  return useSyncExternalStore(subscribeToStore, getSelectedSnapshot, getSelectedServerSnapshot);
}

export function usePlaygroundActions(): {
  update: PlaygroundStateUpdateFn;
  reset: () => void;
} {
  const update = useCallback<PlaygroundStateUpdateFn>((updater) => {
    setState(updater);
  }, []);

  const reset = useCallback(() => {
    resetState();
  }, []);

  return { update, reset };
}
