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

  function expectState(state: ClockState | null): ClockState {
    expect(state).not.toBeNull();
    return state!;
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

    const state = expectState(board.getClockState());
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

    board.on('clock:start', startSpy);
    board.on('clock:pause', pauseSpy);
    board.on('clock:change', changeSpy);
    board.on('clock:flag', flagSpy);

    board.startClock();
    const runningState = expectState(board.getClockState());
    expect(runningState.isRunning).toBe(true);
    expect(startSpy).toHaveBeenCalledTimes(1);
    expect(changeSpy).toHaveBeenCalled();

    board.setClockTime('w', 0);
    expect(flagSpy).toHaveBeenCalledWith(expect.objectContaining({ color: 'w' }));

    board.pauseClock();
    const pausedState = expectState(board.getClockState());
    expect(pausedState.isRunning).toBe(false);
    expect(pauseSpy).toHaveBeenCalledTimes(1);

    board.destroy();
  });

  it('reconfigures the clock when resetClock is called', () => {
    const board = new NeoChessBoard(root, {
      soundEnabled: false,
      clock: {
        initial: 10_000,
        increment: 500,
        active: 'w',
      },
    });

    board.setClockTime('w', 2000);
    board.resetClock({
      initial: { w: 4000, b: 8000 },
      increment: { w: 1000, b: 2000 },
      active: 'b',
      paused: true,
    });

    const state = expectState(board.getClockState());
    expect(state.white.remaining).toBe(4000);
    expect(state.black.remaining).toBe(8000);
    expect(state.white.increment).toBe(1000);
    expect(state.black.increment).toBe(2000);
    expect(state.active).toBe('b');
    expect(state.isRunning).toBe(false);

    board.destroy();
  });

  it('removes the clock when resetClock receives null', () => {
    const board = new NeoChessBoard(root, {
      soundEnabled: false,
      clock: {
        initial: 5000,
        active: 'w',
      },
    });

    expect(board.getClockState()).not.toBeNull();
    board.resetClock(null);
    expect(board.getClockState()).toBeNull();

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

    board.startClock();
    board.setFEN('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR b KQkq - 0 1');

    const state = expectState(board.getClockState());
    expect(state.active).toBe('b');

    board.destroy();
  });
});
