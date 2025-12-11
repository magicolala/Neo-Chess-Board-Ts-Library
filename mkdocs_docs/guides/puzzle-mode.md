# Puzzle Mode Guide

Bring curated tactics into Neo Chess Board with full session tracking, hints, accessibility, and telemetry.

## When to use Puzzle Mode

Use Puzzle Mode when you want to:

- Deliver step-by-step tactics that enforce author-approved move orders (including alternate lines).
- Track attempts, hint usage, and solved IDs across browser sessions via built-in persistence.
- Expose structured React controls, ARIA announcements, and analytics events without writing custom glue code.

## 1. Prepare puzzle data

Puzzle definitions are plain JSON (or TS objects) that match `PuzzleDefinition`. Provide at least an `id`, `fen`, and ordered `solution` array. Optional fields add metadata and optional alternate lines.

```json
[
  {
    "id": "mate-in-two",
    "title": "Mate in two",
    "fen": "r1bqkbnr/pppp1ppp/2n5/4p3/2B1P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 2 3",
    "solution": ["Bxf7+", "Qxd8+"],
    "variants": [{ "id": "line-b", "label": "Line B", "moves": ["Bxf7+", "Nxe5+"] }],
    "difficulty": "intermediate",
    "tags": ["tactic"],
    "hint": "Look for forcing checks on f7."
  }
]
```

For larger collections, store them under `examples/puzzles/*.json` or fetch dynamically and pass the parsed objects to Puzzle Mode.

### Normalize and filter collections

Use the helper exported from `neo-chess-board/utils/puzzleCollections` to normalize metadata and apply filters before sending puzzles to the board or the React component:

```ts
import { loadPuzzleCollection } from 'neo-chess-board/utils/puzzleCollections';
import rawCollection from '../puzzles/daily-tactics.json';

const { puzzles, stats } = loadPuzzleCollection(rawCollection, {
  sortBy: 'difficulty',
  filters: { difficulty: ['intermediate', 'advanced'] },
  limit: 25,
});
```

The helper validates every entry, deduplicates IDs, and exposes aggregated `stats` so dashboards can show completion totals without re-scanning the raw JSON.

## 2. Enable Puzzle Mode on the core board

Add the `puzzleMode` configuration when constructing `NeoChessBoard`.

```ts
import { NeoChessBoard } from 'neo-chess-board';
import puzzles from './puzzles/daily.json';

const board = new NeoChessBoard(canvas, {
  puzzleMode: {
    collectionId: 'daily-tactics',
    puzzles,
    autoAdvance: true,
    allowHints: true,
    onPuzzleEvent: ({ type, payload }) => {
      if (type === 'puzzle:complete') {
        analytics.track('puzzle_complete', payload);
      }
    },
  },
});
```

### Key options

| Option              | Description                                                                 |
| ------------------- | --------------------------------------------------------------------------- |
| `collectionId`      | Persistence namespace (localStorage key uses `puzzle-mode:<collectionId>`). |
| `puzzles`           | Array of `PuzzleDefinition`.                                                 |
| `autoAdvance`       | Auto-load next puzzle on completion (default `true`).                       |
| `allowHints`        | Toggle hint buttons / events (default `true`).                              |
| `startPuzzleId`     | Force an initial puzzle (per session).                                      |
| `onPuzzleEvent`     | Telemetry hook receiving every puzzle lifecycle event.                      |
| `onComplete`        | Callback fired after completion (before auto-advance).                      |

### Completion behaviour controls

- Keep `autoAdvance: true` (default) to load the next puzzle automatically. Set it to `false` to keep the completed puzzle on screen while you display a custom success panel.
- Use the optional `onComplete` callback for post-game logic (rewards, analytics) before the next puzzle loads.
- Drive custom navigation by controlling the `startPuzzleId` prop/value from React (or by re-configuring the core board) and, if needed, re-keying the board component to force a reload.

## 3. React integration (with built-in HUD)

The React bindings automatically render the puzzle overlay, controls, and ARIA live region when `puzzleMode` is provided.

```tsx
import { NeoChessBoard } from 'neo-chess-board/react';
import puzzles from './puzzles/daily.json';

export function PuzzleExample() {
  return (
    <NeoChessBoard
      size={540}
      puzzleMode={{ collectionId: 'daily', puzzles, allowHints: true }}
      onPuzzleComplete={({ puzzleId, attempts }) => {
        toast.success(`Solved ${puzzleId} in ${attempts} attempts`);
      }}
      onPuzzlePersistenceWarning={({ error }) => {
        toast.warn(error);
      }}
    />
  );
}
```

The React ref (`NeoChessRef`) exposes `requestPuzzleHint(type?)` so you can build custom hint buttons if needed.

## 4. Listen to puzzle events

Puzzle Mode emits namespaced events through both the EventBus and React props:

| Event                          | Payload highlights                                                  |
| ------------------------------ | ------------------------------------------------------------------- |
| `puzzle:load`                  | Collection ID, `PuzzleDefinition`, session snapshot.                |
| `puzzle:move`                  | SAN, accepted/incorrect result, attempt counter, cursor index.      |
| `puzzle:hint`                  | Hint type (`text` or `origin-highlight`), payload, usage count.     |
| `puzzle:complete`              | Puzzle ID, attempt count, optional duration.                        |
| `puzzle:persistence-warning`   | Error message, fallback (`memory`).                                 |

Use `onPuzzleEvent` (core) or the React `onPuzzleEvent` prop for a single telemetry entry point.

## 5. Persistence behaviour

- Progress is stored in `localStorage` by default.
- When storage fails (quota/private mode), the session automatically falls back to in-memory storage and dispatches `puzzle:persistence-warning`.
- Call `clearPuzzleSession('puzzle-mode:<collectionId>')` to reset progress manually (see `examples/chess-puzzles.tsx`).
- Listen to `onPuzzlePersistenceWarning` in React (or the `puzzle:persistence-warning` event on the core board) to surface UX-safe banners when persistence is unavailable.

## 6. Accessibility & UX

- Textual status updates and hint usage are sent to an ARIA live region (`role="status"`).
- The React HUD shows attempts, hints used, and solved counts; you can hide it by keeping `puzzleMode` undefined or limiting to the core API.
- Use `allowHints: false` to globally disable the hint buttons (React controls render a message explaining that hints are disabled).

## 7. Demo & reference implementation

- `examples/chess-puzzles.tsx` showcases Puzzle Mode with filters, reset flow, and manual telemetry logging.
- `demo/src/features/puzzle-mode/` provides a production-ready experience:
  - Filter by difficulty or tags.
  - Navigate puzzles.
  - Track progress and warnings.
  - View host integration tips (`api-notes.tsx`).

## 8. Testing Puzzle Mode

Run the dedicated suites targeting both the state machine and React demo:

```bash
npm run test -- puzzle-mode
```

This command executes:

- `tests/unit/extensions/puzzle-mode.*.test.ts`
- `tests/unit/utils/puzzleCollections.test.ts`
- `tests/integration/react/puzzle-mode.demo.test.tsx`

Use `tests/fixtures/puzzles/daily-tactics.json` as a template when creating additional fixtures.
