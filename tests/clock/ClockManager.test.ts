import { ClockManager } from '../../src/clock/ClockManager';
import type { ClockConfig, ClockEvents, ClockState } from '../../src/clock/types';
import { EventBus } from '../../src/core/EventBus';

describe('ClockManager', () => {
  let bus: EventBus<ClockEvents>;
  let now = 0;
  let performanceSpy: jest.SpyInstance<number, []> | undefined;

  const advanceTime = (ms: number) => {
    const step = 100;
    let remaining = ms;
    while (remaining > 0) {
      const slice = Math.min(step, remaining);
      now += slice;
      jest.advanceTimersByTime(slice);
      remaining -= slice;
    }
    jest.runOnlyPendingTimers();
  };

  beforeEach(() => {
    jest.useFakeTimers();
    now = 0;
    bus = new EventBus<ClockEvents>();
    if (typeof performance !== 'undefined' && 'now' in performance) {
      performanceSpy = jest.spyOn(performance, 'now').mockImplementation(() => now);
    }
  });

  afterEach(() => {
    jest.useRealTimers();
    performanceSpy?.mockRestore();
  });

  const createManager = (config: ClockConfig) => new ClockManager(config, bus);

  const expectState = (state: ClockState | null): ClockState => {
    expect(state).not.toBeNull();
    return state!;
  };

  it('counts down the active side when running', () => {
    const manager = createManager({
      initial: 5000,
      active: 'w',
      paused: true,
    });

    manager.start();
    advanceTime(1000);
    const state = expectState(manager.getState());
    expect(state.white.remaining).toBeLessThan(5000);
    expect(state.white.remaining).toBeGreaterThanOrEqual(3900);
    expect(state.black.remaining).toBe(5000);
    manager.destroy();
  });

  it('applies increment to the side that just moved', () => {
    const manager = createManager({
      initial: 2000,
      increment: { w: 500, b: 0 },
      active: 'w',
      paused: false,
    });

    advanceTime(1000);
    manager.switchActive();
    const state = expectState(manager.getState());
    expect(state.white.remaining).toBeGreaterThanOrEqual(1400);
    expect(state.white.remaining).toBeLessThanOrEqual(1600);
    expect(state.black.remaining).toBe(2000);
    manager.destroy();
  });

  it('respects delay before subtracting from the remaining time', () => {
    const manager = createManager({
      initial: 3000,
      delay: 2000,
      active: 'w',
      paused: false,
    });

    advanceTime(1500);
    let state = expectState(manager.getState());
    expect(state.white.remaining).toBe(3000);
    expect(state.white.delayRemaining).toBeGreaterThanOrEqual(400);
    expect(state.white.delayRemaining).toBeLessThanOrEqual(600);

    advanceTime(1000);
    state = expectState(manager.getState());
    expect(state.white.remaining).toBeLessThan(3000);
    expect(state.white.remaining).toBeGreaterThanOrEqual(1400);
    manager.destroy();
  });

  it('emits a flag event once when time expires', () => {
    const onFlag = jest.fn();
    bus.on('clock:flag', onFlag);

    const manager = createManager({
      initial: 500,
      active: 'w',
      paused: false,
    });

    advanceTime(600);
    advanceTime(200);
    expect(onFlag).toHaveBeenCalledTimes(1);
    expect(onFlag).toHaveBeenCalledWith({ color: 'w', remaining: 0 });
    manager.destroy();
  });

  it('resets to the initial configuration', () => {
    const manager = createManager({
      initial: 4000,
      increment: 500,
      active: 'w',
      paused: false,
    });

    advanceTime(1500);
    manager.reset();
    const state = expectState(manager.getState());
    expect(state.white.remaining).toBe(4000);
    expect(state.white.increment).toBe(500);
    expect(state.active).toBe('w');
    expect(state.isRunning).toBe(false);
    manager.destroy();
  });

  it('updates callbacks without resetting the clock state', () => {
    const manager = createManager({
      initial: 2000,
      active: 'w',
      paused: false,
    });

    advanceTime(750);
    const before = expectState(manager.getState());
    manager.reset({ callbacks: {} });
    const after = expectState(manager.getState());
    expect(after.white.remaining).toBe(before.white.remaining);
    manager.destroy();
  });

  it('clears a flag when time is added back', () => {
    const manager = createManager({
      initial: 300,
      active: 'w',
      paused: false,
    });

    advanceTime(350);
    manager.addTime('w', 1000);
    const state = expectState(manager.getState());
    expect(state.white.isFlagged).toBe(false);
    expect(Math.abs(state.white.remaining - 1000)).toBeLessThanOrEqual(50);
    manager.destroy();
  });
});
