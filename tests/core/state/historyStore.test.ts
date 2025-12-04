import {
  canRedo,
  canUndo,
  createHistoryStore,
  getCurrentFen,
  getHistory,
  type HistoryStoreState,
  makeMove,
  redo,
  reset,
  undo,
  type MoveState,
} from '../../../src/core/state/historyStore';

const buildMoveState = (fen: string, san: string, move?: MoveState['move']): MoveState => ({
  fen,
  san,
  move:
    move ??
    ({
      from: san.slice(0, 2),
      to: san.slice(2, 4),
      san,
    } as MoveState['move']),
});

describe('historyStore', () => {
  it('tracks moves and exposes history selectors', () => {
    let store = createHistoryStore('start');

    store = makeSequence(store, [
      buildMoveState('fen-after-e4', 'e4'),
      buildMoveState('fen-after-e5', 'e5'),
    ]);

    expect(getHistory(store)).toEqual(['e4', 'e5']);
    expect(getCurrentFen(store)).toBe('fen-after-e5');
    expect(canUndo(store)).toBe(true);
    expect(canRedo(store)).toBe(false);

    const undoResult = undo(store);
    expect(getCurrentFen(undoResult.state)).toBe('fen-after-e4');
    expect(undoResult.state.future).toHaveLength(1);
    expect(getHistory(undoResult.state)).toEqual(['e4']);

    const redoResult = redo(undoResult.state);
    expect(getCurrentFen(redoResult.state)).toBe('fen-after-e5');
    expect(getHistory(redoResult.state)).toEqual(['e4', 'e5']);
  });

  it('clears future moves when a new move is made after undo', () => {
    let store = createHistoryStore('start');
    store = makeSequence(store, [
      buildMoveState('fen-after-e4', 'e4'),
      buildMoveState('fen-after-e5', 'e5'),
    ]);

    const { state: undoneState } = undo(store);
    expect(canRedo(undoneState)).toBe(true);

    const advanced = makeSequence(undoneState, [buildMoveState('fen-after-nf3', 'Nf3')]);
    expect(canRedo(advanced)).toBe(false);
    expect(getHistory(advanced)).toEqual(['e4', 'Nf3']);
  });

  it('resets history and fen', () => {
    let store = createHistoryStore('start');
    store = makeSequence(store, [buildMoveState('fen-after-e4', 'e4')]);

    const resetStore = reset(store, 'fresh');
    expect(getCurrentFen(resetStore)).toBe('fresh');
    expect(resetStore.past).toHaveLength(0);
    expect(resetStore.future).toHaveLength(0);
  });
});

function makeSequence(state: HistoryStoreState, moves: MoveState[]): HistoryStoreState {
  return moves.reduce((current, move) => makeMove(current, move), state);
}
