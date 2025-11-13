import type { EventBus } from '../core/EventBus';
import type {
  ClockCallbacks,
  ClockColor,
  ClockConfig,
  ClockEvents,
  ClockSideConfig,
  ClockSideState,
  ClockState,
  InternalClockSideState,
  InternalClockState,
} from './types';

const TICK_INTERVAL_MS = 100;

function now(): number {
  if (typeof performance !== 'undefined' && typeof performance.now === 'function') {
    return performance.now();
  }
  return Date.now();
}

function sanitizeMillis(value: unknown, fallback = 0): number {
  const numberValue = typeof value === 'number' && Number.isFinite(value) ? value : fallback;
  if (!Number.isFinite(numberValue)) {
    return 0;
  }
  return Math.max(0, Math.floor(numberValue));
}

function cloneSideState(state: InternalClockSideState): ClockSideState {
  return {
    initial: state.initial,
    increment: state.increment,
    delay: state.delay,
    remaining: state.remaining,
    delayRemaining: state.delayRemaining,
    isFlagged: state.isFlagged,
  };
}

function cloneState(state: InternalClockState): ClockState {
  return {
    white: cloneSideState(state.white),
    black: cloneSideState(state.black),
    active: state.active,
    isRunning: state.isRunning,
    isPaused: state.isPaused,
    lastUpdatedAt: state.lastUpdatedAt,
  };
}

interface ResolvedClockConfig {
  sides: Record<ClockColor, ClockSideConfig>;
  active: ClockColor | null;
  paused: boolean;
}

export class ClockManager {
  private state: InternalClockState;
  private intervalId: ReturnType<typeof setInterval> | null = null;
  private lastTickTime: number = 0;
  private callbacks?: ClockCallbacks;
  private readonly bus: EventBus<ClockEvents>;
  private config: ResolvedClockConfig;
  private destroyed = false;

  constructor(config: ClockConfig, eventBus: EventBus<ClockEvents>) {
    this.bus = eventBus;
    this.callbacks = config.callbacks;
    this.config = this.resolveConfig(config);
    this.state = this.createInitialState(this.config);

    this.emitChange(null);

    if (config.paused === false) {
      this.start();
    }
  }

  public start(): void {
    if (this.destroyed) {
      return;
    }

    const previous = cloneState(this.state);
    const active = this.state.active ?? this.config.active;

    if (active === 'w' || active === 'b') {
      const activeSide = active === 'w' ? this.state.white : this.state.black;
      this.state.active = activeSide.isFlagged ? null : active;
    } else {
      this.state.active = null;
    }

    if (this.state.active === null) {
      this.state.isRunning = false;
      this.state.isPaused = true;
      this.state.lastUpdatedAt = null;
      this.stopInterval();
      this.emitChange(previous);
      return;
    }

    const isFreshStart = !previous.isRunning && previous.lastUpdatedAt === null;
    if (isFreshStart) {
      const activeSide = this.state.active === 'w' ? this.state.white : this.state.black;
      activeSide.delayRemaining = activeSide.delay;
    }

    this.state.isPaused = false;
    this.state.isRunning = true;
    this.lastTickTime = now();
    this.state.lastUpdatedAt = this.lastTickTime;
    this.ensureInterval();
    this.emitChange(previous);
  }

  public pause(): void {
    if (this.destroyed) {
      return;
    }

    const previous = cloneState(this.state);
    const currentTime = now();
    this.flushActive(currentTime);
    this.state.isRunning = false;
    this.state.isPaused = true;
    this.state.lastUpdatedAt = currentTime;
    this.stopInterval();
    this.emitChange(previous);
  }

  public reset(configUpdate?: Partial<ClockConfig>): void {
    if (this.destroyed) {
      return;
    }

    if (configUpdate && Object.prototype.hasOwnProperty.call(configUpdate, 'callbacks')) {
      this.callbacks = configUpdate.callbacks ?? undefined;
    }

    const configKeys: Array<keyof ClockConfig> = [
      'initial',
      'increment',
      'delay',
      'active',
      'paused',
    ];
    const shouldReconfigure =
      configUpdate === undefined ||
      configKeys.some(
        (key) => configUpdate && Object.prototype.hasOwnProperty.call(configUpdate, key),
      );

    if (!shouldReconfigure) {
      return;
    }

    const mergedConfig = configUpdate ? this.mergeConfig(configUpdate) : this.config;
    if (!configUpdate || !Object.prototype.hasOwnProperty.call(configUpdate, 'paused')) {
      mergedConfig.paused = true;
    }
    this.config = mergedConfig;
    this.stopInterval();
    this.state = this.createInitialState(this.config);
    this.emitChange(null);

    if (this.config.paused === false) {
      this.start();
    }
  }

  public setTime(color: ClockColor, milliseconds: number): void {
    if (this.destroyed) {
      return;
    }

    const timestamp = now();
    if (this.state.isRunning && this.state.active === color) {
      this.flushActive(timestamp);
    }

    const target = color === 'w' ? this.state.white : this.state.black;
    const previous = cloneState(this.state);
    const value = sanitizeMillis(milliseconds);
    const wasFlagged = target.isFlagged;
    target.remaining = value;
    target.isFlagged = value === 0;

    const isActiveRunning = this.state.isRunning && this.state.active === color;
    target.delayRemaining =
      isActiveRunning && !target.isFlagged
        ? Math.min(target.delayRemaining, target.delay)
        : target.delay;

    if (target.isFlagged && !wasFlagged) {
      this.handleFlag(color, timestamp);
    }

    this.emitChange(previous);
  }

  public addTime(color: ClockColor, milliseconds: number): void {
    if (this.destroyed || milliseconds === 0) {
      return;
    }

    const timestamp = now();
    const isActiveRunning = this.state.isRunning && this.state.active === color;
    if (isActiveRunning) {
      this.flushActive(timestamp);
    }

    const target = color === 'w' ? this.state.white : this.state.black;
    const previous = cloneState(this.state);
    const delta = sanitizeMillis(milliseconds);
    target.remaining = Math.max(0, target.remaining + delta);
    if (target.remaining > 0) {
      target.isFlagged = false;
      target.delayRemaining = isActiveRunning
        ? Math.min(target.delayRemaining, target.delay)
        : target.delay;
    }
    this.emitChange(previous);
  }

  public switchActive(): void {
    if (this.destroyed) {
      return;
    }

    const previous = cloneState(this.state);
    const currentTime = now();
    const wasRunning = this.state.isRunning;
    this.flushActive(currentTime);

    const previousActive = this.state.active;
    if (previousActive === 'w' || previousActive === 'b') {
      const previousSide = previousActive === 'w' ? this.state.white : this.state.black;
      if (wasRunning && !previousSide.isFlagged && previousSide.increment > 0) {
        previousSide.remaining = Math.max(0, previousSide.remaining + previousSide.increment);
      }
      previousSide.delayRemaining = previousSide.delay;
    }

    const nextActive: ClockColor | null =
      previousActive === 'w' ? 'b' : previousActive === 'b' ? 'w' : this.config.active;

    if (nextActive && !(nextActive === 'w' ? this.state.white : this.state.black).isFlagged) {
      this.state.active = nextActive;
      const nextSide = nextActive === 'w' ? this.state.white : this.state.black;
      nextSide.delayRemaining = nextSide.delay;
      if (wasRunning) {
        this.state.isPaused = false;
        this.state.isRunning = true;
        this.lastTickTime = currentTime;
        this.state.lastUpdatedAt = currentTime;
        this.ensureInterval();
      } else {
        this.state.isRunning = false;
        this.state.isPaused = true;
      }
    } else {
      this.state.active = null;
      this.state.isRunning = false;
      this.state.isPaused = true;
      this.state.lastUpdatedAt = currentTime;
      this.stopInterval();
    }

    this.emitChange(previous);
  }

  public getState(): ClockState {
    return cloneState(this.state);
  }

  public destroy(): void {
    if (this.destroyed) {
      return;
    }
    this.destroyed = true;
    this.stopInterval();
  }

  private ensureInterval(): void {
    if (!this.state.isRunning || this.intervalId) {
      return;
    }
    this.intervalId = setInterval(() => this.tick(), TICK_INTERVAL_MS);
  }

  private stopInterval(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  private tick(): void {
    if (!this.state.isRunning || this.destroyed) {
      this.stopInterval();
      return;
    }

    const previous = cloneState(this.state);
    const currentTime = now();
    this.flushActive(currentTime);
    this.emitChange(previous);
  }

  private flushActive(timestamp: number): void {
    if (!this.state.isRunning || this.state.active === null) {
      return;
    }

    const activeSide = this.state.active === 'w' ? this.state.white : this.state.black;
    const delta = Math.max(0, timestamp - (this.lastTickTime || timestamp));
    this.lastTickTime = timestamp;
    this.state.lastUpdatedAt = timestamp;

    if (delta === 0) {
      return;
    }

    let remainingDelta = delta;
    if (activeSide.delayRemaining > 0) {
      const consumedDelay = Math.min(activeSide.delayRemaining, remainingDelta);
      activeSide.delayRemaining = Math.max(0, activeSide.delayRemaining - consumedDelay);
      remainingDelta -= consumedDelay;
    }

    if (remainingDelta > 0) {
      activeSide.remaining = Math.max(0, activeSide.remaining - remainingDelta);
    }

    if (activeSide.remaining === 0 && !activeSide.isFlagged) {
      activeSide.isFlagged = true;
      this.handleFlag(this.state.active, timestamp);
    }
  }

  private handleFlag(color: ClockColor, timestamp: number): void {
    this.state.active = null;
    this.state.isRunning = false;
    this.state.isPaused = true;
    this.state.lastUpdatedAt = timestamp;
    this.stopInterval();
    const remaining = color === 'w' ? this.state.white.remaining : this.state.black.remaining;
    this.bus.emit('clock:flag', { color, remaining });
    this.callbacks?.onFlag?.({ color, remaining });
  }

  private emitChange(previous: ClockState | null): void {
    const snapshot = cloneState(this.state);
    this.bus.emit('clock:change', snapshot);
    this.callbacks?.onClockChange?.(snapshot);

    const wasRunning = previous?.isRunning ?? false;
    const isRunning = this.state.isRunning;
    const startPayload: ClockEvents['clock:start'] = undefined;
    const pausePayload: ClockEvents['clock:pause'] = undefined;
    if (!wasRunning && isRunning) {
      this.bus.emit('clock:start', startPayload);
      this.callbacks?.onClockStart?.();
    } else if (wasRunning && !isRunning) {
      this.bus.emit('clock:pause', pausePayload);
      this.callbacks?.onClockPause?.();
    }
  }

  private resolveConfig(config: ClockConfig): ResolvedClockConfig {
    const initial = this.resolvePerSide(config.initial);
    const increment = this.resolvePerSide(config.increment ?? 0);
    const delay = this.resolvePerSide(config.delay ?? 0);

    const sides: Record<ClockColor, ClockSideConfig> = {
      w: {
        initial: initial.w,
        increment: increment.w,
        delay: delay.w,
      },
      b: {
        initial: initial.b,
        increment: increment.b,
        delay: delay.b,
      },
    };

    const active = config.active === 'w' || config.active === 'b' ? config.active : 'w';
    const paused = config.paused !== false;

    return { sides, active, paused };
  }

  private mergeConfig(update: Partial<ClockConfig>): ResolvedClockConfig {
    const current = this.config;
    const nextSides: Record<ClockColor, ClockSideConfig> = {
      w: { ...current.sides.w },
      b: { ...current.sides.b },
    };

    if (update.initial !== undefined) {
      const values = this.resolvePerSide(update.initial, {
        w: nextSides.w.initial,
        b: nextSides.b.initial,
      });
      nextSides.w.initial = values.w;
      nextSides.b.initial = values.b;
    }

    if (update.increment !== undefined) {
      const values = this.resolvePerSide(update.increment, {
        w: nextSides.w.increment,
        b: nextSides.b.increment,
      });
      nextSides.w.increment = values.w;
      nextSides.b.increment = values.b;
    }

    if (update.delay !== undefined) {
      const values = this.resolvePerSide(update.delay, {
        w: nextSides.w.delay,
        b: nextSides.b.delay,
      });
      nextSides.w.delay = values.w;
      nextSides.b.delay = values.b;
    }

    const active =
      update.active === undefined
        ? current.active
        : update.active === 'w' || update.active === 'b'
          ? update.active
          : null;

    let paused = current.paused;
    if (update.paused !== undefined) {
      paused = update.paused;
    } else if (Object.prototype.hasOwnProperty.call(update, 'active') && update.active === null) {
      paused = true;
    }

    return {
      sides: nextSides,
      active,
      paused,
    };
  }

  private createInitialState(config: ResolvedClockConfig): InternalClockState {
    const white = this.createSideState(config.sides.w);
    const black = this.createSideState(config.sides.b);

    const active = config.active ?? null;
    const activeSide = active === 'w' ? white : active === 'b' ? black : null;
    const resolvedActive = activeSide?.isFlagged ? null : (active as ClockColor | null);

    return {
      white,
      black,
      active: resolvedActive,
      isRunning: false,
      isPaused: true,
      lastUpdatedAt: null,
    };
  }

  private createSideState(config: ClockSideConfig): InternalClockSideState {
    const initial = sanitizeMillis(config.initial);
    const remaining = Math.max(0, initial);
    const isFlagged = remaining === 0;

    return {
      initial,
      increment: sanitizeMillis(config.increment),
      delay: sanitizeMillis(config.delay),
      remaining,
      delayRemaining: sanitizeMillis(config.delay),
      isFlagged,
    };
  }

  private resolvePerSide(
    value: number | { w?: number; b?: number },
    fallback?: { w: number; b: number },
  ): { w: number; b: number } {
    if (typeof value === 'number') {
      const sanitized = sanitizeMillis(value);
      return { w: sanitized, b: sanitized };
    }

    const base = fallback ?? { w: 0, b: 0 };
    return {
      w: sanitizeMillis(value.w, base.w),
      b: sanitizeMillis(value.b, base.b),
    };
  }
}
