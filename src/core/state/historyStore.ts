import type { RulesMoveDetail } from '../types';

export interface MoveState {
  fen: string;
  san?: string;
  move?: RulesMoveDetail;
}

export interface HistoryStoreState {
  past: MoveState[];
  present: MoveState;
  future: MoveState[];
}

function cloneMoveState(move: MoveState): MoveState {
  return {
    fen: move.fen,
    san: move.san,
    move: move.move ? { ...move.move } : undefined,
  };
}

export function createHistoryStore(
  initialFen: string,
  initialState?: Partial<MoveState>,
): HistoryStoreState {
  return {
    past: [],
    present: {
      fen: initialFen,
      san: initialState?.san,
      move: initialState?.move,
    },
    future: [],
  };
}

export function makeMove(state: HistoryStoreState, next: MoveState): HistoryStoreState {
  return {
    past: [...state.past.map((entry) => cloneMoveState(entry)), cloneMoveState(state.present)],
    present: cloneMoveState(next),
    future: [],
  };
}

export function undo(state: HistoryStoreState): {
  state: HistoryStoreState;
  previous?: MoveState;
  undone?: MoveState;
} {
  if (state.past.length === 0) {
    return { state };
  }

  const previous = cloneMoveState(state.past.at(-1));
  const remainingPast = state.past.slice(0, -1).map((entry) => cloneMoveState(entry));
  const future = [
    cloneMoveState(state.present),
    ...state.future.map((entry) => cloneMoveState(entry)),
  ];

  return {
    state: {
      past: remainingPast,
      present: previous,
      future,
    },
    previous,
    undone: state.present,
  };
}

export function redo(state: HistoryStoreState): {
  state: HistoryStoreState;
  next?: MoveState;
  restored?: MoveState;
} {
  const [next, ...future] = state.future;
  if (!next) {
    return { state };
  }

  return {
    state: {
      past: [...state.past.map((entry) => cloneMoveState(entry)), cloneMoveState(state.present)],
      present: cloneMoveState(next),
      future: future.map((entry) => cloneMoveState(entry)),
    },
    next,
    restored: next,
  };
}

export function reset(
  state: HistoryStoreState,
  fen: string,
  initialState?: Partial<MoveState>,
): HistoryStoreState {
  return {
    past: [],
    present: {
      fen,
      san: initialState?.san,
      move: initialState?.move,
    },
    future: [],
  };
}

export function getCurrentFen(state: HistoryStoreState): string {
  return state.present.fen;
}

export function canUndo(state: HistoryStoreState): boolean {
  return state.past.length > 0;
}

export function canRedo(state: HistoryStoreState): boolean {
  return state.future.length > 0;
}

export function getHistory(state: HistoryStoreState): string[] {
  const timeline = [...state.past.slice(1), state.present];
  return timeline.map((entry) => entry.san ?? entry.move?.san).filter(Boolean);
}

export function getVerboseHistory(state: HistoryStoreState): RulesMoveDetail[] {
  const timeline = [...state.past.slice(1), state.present];
  return timeline
    .map((entry) =>
      entry.move && entry.move.san ? ({ ...entry.move } as RulesMoveDetail) : undefined,
    )
    .filter(Boolean);
}

export function getLastMoveState(state: HistoryStoreState): MoveState | undefined {
  const withMove = [...state.past.slice(1), state.present].filter(
    (entry) => entry.move || entry.san,
  );
  return withMove.at(-1);
}

export function cloneHistoryStore(state: HistoryStoreState): HistoryStoreState {
  return {
    past: state.past.map((entry) => cloneMoveState(entry)),
    present: cloneMoveState(state.present),
    future: state.future.map((entry) => cloneMoveState(entry)),
  };
}
