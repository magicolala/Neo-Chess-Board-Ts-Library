import { useCallback, useSyncExternalStore } from 'react';
import type { ThemeName } from '../../../src/core/themes';

export type { ThemeName } from '../../../src/core/themes';

export interface PlaygroundState {
  theme: ThemeName;
  showCoordinates: boolean;
  highlightLegal: boolean;
  interactive: boolean;
  autoFlip: boolean;
  allowDrawingArrows: boolean;
  animationDurationInMs: number;
  dragActivationDistance: number;
}

export const PLAYGROUND_DEFAULT_STATE: PlaygroundState = {
  theme: 'midnight',
  showCoordinates: true,
  highlightLegal: true,
  interactive: true,
  autoFlip: false,
  allowDrawingArrows: true,
  animationDurationInMs: 300,
  dragActivationDistance: 0,
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

  (Object.keys(partial) as (keyof PlaygroundState)[]).forEach((key) => {
    if (!Object.prototype.hasOwnProperty.call(partial, key)) {
      return;
    }
    const value = partial[key];
    if (typeof value === 'undefined') {
      return;
    }
    if (!Object.is(nextState[key], value)) {
      nextState[key] = value as PlaygroundState[typeof key];
      changed = true;
    }
  });

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
