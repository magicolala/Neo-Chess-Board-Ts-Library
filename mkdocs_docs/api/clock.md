# Clock API Reference

The Neo Chess Board clock subsystem combines precision timers, flexible time controls, and ergonomic event hooks. This page
summarises the public types and methods you will interact with when embedding clocks in your application.

## Configuration

```ts
interface ClockConfig {
  initial: number | { w: number; b: number };
  increment?: number | { w: number; b: number };
  delay?: number | { w: number; b: number };
  active?: 'w' | 'b';
  paused?: boolean;
  callbacks?: ClockCallbacks;
}
```

* `initial` *(required)* – Starting time for each side in milliseconds. Provide a single number or per-side values.
* `increment` – Fischer increment applied after a side completes a move.
* `delay` – Bronstein delay consumed before the remaining time is reduced.
* `active` – Side that should move first. Defaults to White when omitted.
* `paused` – Set to `false` to start the clock immediately after construction.
* `callbacks` – Optional hooks invoked alongside the board's event bus.

```ts
interface ClockCallbacks {
  onClockChange?: (state: ClockState) => void;
  onClockStart?: () => void;
  onClockPause?: () => void;
  onFlag?: (data: { color: 'w' | 'b'; remaining: number }) => void;
}
```

Callbacks fire in sync with the event bus events documented later in this page.

## Clock state

```ts
interface ClockSideState {
  initial: number;
  increment: number;
  delay: number;
  remaining: number;
  delayRemaining: number;
  isFlagged: boolean;
}

interface ClockState {
  white: ClockSideState;
  black: ClockSideState;
  active: 'w' | 'b' | null;
  isRunning: boolean;
  isPaused: boolean;
  lastUpdatedAt: number | null;
}
```

`ClockState` snapshots are immutable copies returned by `board.getClockState()` and emitted through the event bus. You can
persist them or derive formatted strings without mutating the internal timer.

## ClockManager class

`ClockManager` powers the built-in timers and is exported for advanced integrations.

```ts
import { ClockManager } from '@magicolala/neo-chess-board';
import type { ClockConfig, ClockState } from '@magicolala/neo-chess-board';

const manager = new ClockManager(config, eventBus);
```

### Methods

* `start(): void` – Start or resume the active side. Applies any pending Bronstein delay.
* `pause(): void` – Pause the timer while preserving the remaining delay.
* `reset(config?: Partial<ClockConfig>): void` – Reset to the original configuration or merge the provided partial config.
  Updating only `callbacks` swaps handlers without resetting the timers.
* `setTime(color: 'w' | 'b', milliseconds: number): void` – Force the remaining time for a side.
* `addTime(color: 'w' | 'b', milliseconds: number): void` – Increase a side's remaining time and clear flags when positive.
* `switchActive(): void` – Apply increments to the side that just moved and switch the active clock.
* `getState(): ClockState` – Return a snapshot of the current state.
* `destroy(): void` – Stop the timers and detach the internal interval.

### Event bus contract

`ClockManager` emits the following events through the board's `EventBus` (and mirrors them through callbacks):

```ts
interface ClockEvents {
  'clock:change': ClockState;
  'clock:start': void;
  'clock:pause': void;
  'clock:flag': { color: 'w' | 'b'; remaining: number };
}
```

These events are surfaced via `board.on()` and power the bundled clock extension. Use them to update external UIs, persist
state, or trigger game adjudication when a flag falls.

## Usage patterns

* **Asymmetric controls** – Supply `{ w, b }` objects for `initial`, `increment`, or `delay` to simulate odds matches.
* **Runtime reconfiguration** – Call `board.resetClock({ increment: 2_000 })` to update increments mid-game without
  rebuilding the board.
* **Removing the clock** – Pass `null` to `board.resetClock(null)` to detach the timers entirely.
* **React integration** – Access the same helpers via `NeoChessRef` from `@magicolala/neo-chess-board/react`.

For a step-by-step walkthrough, read the [Time Controls Guide](../guides/time-controls.md) or explore the
[`examples/clock-demo.html`](../../examples/clock-demo.html) file.
