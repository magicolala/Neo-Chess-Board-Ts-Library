# Time Controls Guide

Neo Chess Board ships with a built-in chess clock so you can add time controls without wiring your own timers. This guide
covers the configuration options, runtime API, UI integration, and best practices for delivering reliable clocks in both
vanilla and React applications.

## Clock basics

Provide a `clock` configuration when you construct the board. The clock does not start automatically unless `paused` is set
to `false` – this lets you keep the timers frozen on the initial position.

```ts
import { NeoChessBoard } from '@magicolala/neo-chess-board';

const board = new NeoChessBoard(container, {
  clock: {
    initial: { w: 300_000, b: 180_000 },
    increment: { w: 2_000, b: 0 },
    delay: 2_000,
    active: 'w',
    paused: true,
  },
});
```

The `initial`, `increment`, and `delay` options accept either a single number (applied to both sides) or per-side objects.
All values are expressed in milliseconds.

### Time control modes

* **Classical countdown** – omit `increment` and `delay`. Each side receives `initial` milliseconds.
* **Fischer increment** – provide `increment`. Time is added immediately after a side ends its move.
* **Bronstein delay** – provide `delay`. The delay counts down first; unused delay is credited back to the clock.
* **Hybrid** – combine increment and delay for modes such as "5+3 with 2 second delay".

You can configure asymmetric controls by providing `{ w, b }` objects for each property.

## Runtime API

The board exposes clock helpers so you can control the timers from your own UI:

```ts
board.startClock();    // Start or resume the active side
board.pauseClock();    // Pause the countdown
board.resetClock();    // Reset to the original configuration
board.resetClock(null); // Remove the clock entirely
board.setClockTime('w', 45_000); // Force White to 45 seconds
board.addClockTime('b', 5_000);  // Add 5 seconds to Black

const state = board.getClockState();
// state.white.remaining, state.black.remaining, etc.
```

The `ClockState` snapshot tracks the remaining time, increment, delay, and whether a side has flagged. Use it to
update UI elements or persist the clock between sessions.

### Event bus integration

Every change to the timers emits strongly typed events through the board's `EventBus`:

* `clock:change` – Fired on every tick with the full `ClockState`.
* `clock:start` – Fired when the clock transitions into a running state.
* `clock:pause` – Fired when the countdown stops (manual pause, promotion dialog, or flag).
* `clock:flag` – Fired once per side when the remaining time reaches zero.

You can listen to these events via `board.on()` or within extensions using `registerExtensionPoint`.

## React usage

The React component mirrors the vanilla API. Pass a `clock` prop and subscribe to the `onClockChange`, `onClockStart`,
`onClockPause`, and `onClockFlag` callbacks as needed. All clock helpers (`startClock`, `resetClock`, etc.) are available
through the component ref.

```tsx
import { NeoChessBoard, type NeoChessRef } from '@magicolala/neo-chess-board/react';
import { useRef } from 'react';

const ref = useRef<NeoChessRef>(null);

<NeoChessBoard
  ref={ref}
  clock={{ initial: 600_000, increment: 5_000, paused: true }}
  onClockChange={(state) => console.log(state.white.remaining)}
/>;

ref.current?.startClock();
```

`useNeoChessBoard` watches the clock configuration. Passing the same values between renders keeps the timer untouched,
while changing `initial`, `increment`, `delay`, `active`, or `paused` triggers a reset with the new configuration.
Updating only the callbacks reuses the existing clock without resetting the time.

## UI integration with the bundled extension

`createClockExtension` renders a ready-to-use overlay with active side highlighting, low time styling, and optional
flag icons. It emits a `ClockExtensionApi` via the `onReady` hook so custom controls can drive the timers.

```ts
import { createClockExtension } from '@magicolala/neo-chess-board';

const board = new NeoChessBoard(container, {
  clock: { initial: 300_000, increment: 2_000 },
  extensions: [
    createClockExtension({
      highlightActive: true,
      showTenths: true,
      labels: { w: 'You', b: 'Opponent' },
      onReady(api) {
        api.startClock();
      },
    }),
  ],
});
```

The extension listens to the same clock events described above and keeps its DOM state synchronised with the board. When
you remove the clock (`resetClock(null)`) the extension tears down automatically.

## Best practices

* **Pause on modal interactions** – The board automatically pauses during promotion selection. Do the same if your UI
  opens additional modals (e.g. takeback confirmation).
* **Persist state for reconnections** – Store `ClockState` snapshots to resume play after network interruptions.
* **Avoid drift** – Always read the clock from events or `getClockState()`; do not maintain your own countdown timers.
* **Handle flags** – The `clock:flag` event fires once per side. After resolving the game state, call `pauseClock()` or
  `resetClock()` to prevent further updates.

## Next steps

See the [Clock API reference](../api/clock.md) for detailed type definitions and method signatures, and check the
[`examples/clock-demo.html`](../../examples/clock-demo.html) file for a complete clock-enabled experience.
