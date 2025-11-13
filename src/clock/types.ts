export type ClockColor = 'w' | 'b';

export interface ClockSideConfig {
  initial: number;
  increment: number;
  delay: number;
}

export interface ClockCallbacks {
  onClockChange?: (state: ClockState) => void;
  onClockStart?: () => void;
  onClockPause?: () => void;
  onFlag?: (data: { color: ClockColor; remaining: number }) => void;
}

export interface ClockConfig {
  initial: number | { w: number; b: number };
  increment?: number | { w: number; b: number };
  delay?: number | { w: number; b: number };
  active?: ClockColor | null;
  paused?: boolean;
  callbacks?: ClockCallbacks;
}

export interface ClockSideState {
  initial: number;
  increment: number;
  delay: number;
  remaining: number;
  delayRemaining: number;
  isFlagged: boolean;
}

export interface ClockState {
  white: ClockSideState;
  black: ClockSideState;
  active: ClockColor | null;
  isRunning: boolean;
  isPaused: boolean;
  lastUpdatedAt: number | null;
}

export interface InternalClockSideState extends ClockSideState {}

export interface InternalClockState extends ClockState {
  white: InternalClockSideState;
  black: InternalClockSideState;
}

export interface ClockEvents {
  'clock:change': ClockState;
  'clock:start': undefined;
  'clock:pause': undefined;
  'clock:flag': { color: ClockColor; remaining: number };
  [event: string]: unknown;
}
