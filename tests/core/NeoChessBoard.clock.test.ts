import { NeoChessBoard } from '../../src/core/NeoChessBoard';
import type { ClockState } from '../../src/core/types';

describe('NeoChessBoard clock integration', () => {
  let root: HTMLDivElement;

  beforeEach(() => {
    root = document.createElement('div');
    document.body.append(root);
  });

  afterEach(() => {
    root.remove();
  });

  function expectState(state: ClockState | null): asserts state is ClockState {
    expect(state).not.toBeNull();
  }

  it('initializes the clock state from options', () => {
    const change = jest.fn();
    const board = new NeoChessBoard(root, {
      soundEnabled: false,
      clock: {
        initial: { w: 300_000, b: 180_000 },
        increment: { w: 2000, b: 1000 },
        active: 'b',
        paused: true,
        callbacks: {
          onClockChange: change,
        },
      },
    });

    const state = board.getClockState();
    expectState(state);
    expect(state.white.remaining).toBe(300_000);
    expect(state.black.remaining).toBe(180_000);
    expect(state.white.increment).toBe(2000);
    expect(state.black.increment).toBe(1000);
    expect(state.active).toBe('b');
    expect(state.isPaused).toBe(true);
    expect(change).toHaveBeenCalled();

    board.destroy();
  });

  it('emits events when the clock starts, pauses and flags', () => {
    const board = new NeoChessBoard(root, {
      soundEnabled: false,
      clock: {
        initial: 5000,
        active: 'w',
        paused: true,
      },
    });

    const startSpy = jest.fn();
    const pauseSpy = jest.fn();
    const changeSpy = jest.fn();
    const flagSpy = jest.fn();

    board.on('clockStart', startSpy);
    board.on('clockPause', pauseSpy);
    board.on('clockChange', changeSpy);
    board.on('clockFlag', flagSpy);

    board.updateClockState({ running: true, paused: false, timestamp: 42 });
    const runningState = board.getClockState();
    expectState(runningState);
    expect(runningState.isRunning).toBe(true);
    expect(startSpy).toHaveBeenCalledTimes(1);
    expect(changeSpy).toHaveBeenCalled();

    board.updateClockState({ white: { remaining: 0 } });
    expect(flagSpy).toHaveBeenCalledWith(expect.objectContaining({ color: 'w' }));

    board.updateClockState({ running: false, paused: true, timestamp: null });
    const pausedState = board.getClockState();
    expectState(pausedState);
    expect(pausedState.isRunning).toBe(false);
    expect(pauseSpy).toHaveBeenCalledTimes(1);

    board.destroy();
  });

  it('reconfigures the clock when setClockConfig is called', () => {
    const board = new NeoChessBoard(root, {
      soundEnabled: false,
      clock: {
        initial: 10_000,
        increment: 500,
        active: 'w',
      },
    });

    board.updateClockState({ white: { remaining: 2000 } });
    board.setClockConfig({
      initial: { w: 4000, b: 8000 },
      increment: { w: 1000, b: 2000 },
      active: 'b',
      paused: true,
    });

    const state = board.getClockState();
    expectState(state);
    expect(state.white.remaining).toBe(4000);
    expect(state.black.remaining).toBe(8000);
    expect(state.white.increment).toBe(1000);
    expect(state.black.increment).toBe(2000);
    expect(state.active).toBe('b');
    expect(state.isRunning).toBe(false);

    board.destroy();
  });

  it('synchronizes the active clock with the board turn when the position changes', () => {
    const board = new NeoChessBoard(root, {
      soundEnabled: false,
      clock: {
        initial: 3000,
        active: 'w',
        paused: false,
      },
    });

    board.updateClockState({ running: true, paused: false, timestamp: 0 });
    board.setFEN('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR b KQkq - 0 1');

    const state = board.getClockState();
    expectState(state);
    expect(state.active).toBe('b');

    board.destroy();
  });
});
