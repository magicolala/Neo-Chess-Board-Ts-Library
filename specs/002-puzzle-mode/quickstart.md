# Puzzle Mode Quickstart

Deliver curated tactics with enforced move order, hints, persistence, and React HUD controls.

## 1. Install & import

```bash
npm install neo-chess-board
```

```ts
import 'neo-chess-board/style.css';
import { NeoChessBoard } from 'neo-chess-board/react';
import { loadPuzzleCollection } from 'neo-chess-board/utils/puzzleCollections';
import rawCollection from './puzzles/daily-tactics.json';
```

## 2. Load and filter puzzles

Use the helper to normalize metadata, sort puzzles, and apply filters before rendering:

```ts
const view = loadPuzzleCollection(rawCollection, {
  sortBy: 'difficulty',
  filters: { tags: ['tactic'] },
  limit: 25,
});
```

`view.puzzles` contains validated entries; `view.stats` powers dashboards (total, solved, tags).

## 3. Render the React HUD

```tsx
import React, { useMemo, useState } from 'react';

export function PuzzleDemo() {
  const [difficulty, setDifficulty] = useState<'all' | 'beginner' | 'intermediate' | 'advanced'>(
    'all',
  );
  const [activePuzzleId, setActivePuzzleId] = useState<string | undefined>();

  const collection = useMemo(
    () =>
      loadPuzzleCollection(rawCollection, {
        sortBy: 'difficulty',
        filters: difficulty === 'all' ? undefined : { difficulty: [difficulty] },
      }),
    [difficulty],
  );

  return (
    <NeoChessBoard
      size={520}
      puzzleMode={{
        collectionId: 'daily',
        startPuzzleId: activePuzzleId,
        puzzles: collection.puzzles,
        allowHints: true,
        autoAdvance: true,
      }}
      onPuzzleComplete={({ nextPuzzleId }) => setActivePuzzleId(nextPuzzleId)}
      onPuzzleEvent={(event) => console.log(event.type, event.payload)}
      onPuzzlePersistenceWarning={({ error }) => {
        toast.warn(error ?? 'Puzzle progress not saved (private mode).');
      }}
    />
  );
}
```

- The React HUD renders status, hints, and ARIA live region automatically.
- Set `allowHints: false` to disable hint buttons globally.
- Toggle `autoAdvance` to keep the success screen visible until you call `setActivePuzzleId` yourself.

## 4. React & core events

| Event / Prop                    | Purpose                                                           |
| ------------------------------- | ----------------------------------------------------------------- |
| `onPuzzleComplete`              | Receive attempts + next ID before auto-advance.                   |
| `onPuzzleEvent` / `puzzle:*`    | Single telemetry feed for load, move, hint, and completion steps. |
| `onPuzzlePersistenceWarning`    | Surface localStorage failures; app falls back to in-memory state. |

Example core usage:

```ts
board.on('puzzle:hint', ({ type, usageCount }) => {
  analytics.track('hint_used', { type, usageCount });
});

board.on('puzzle:persistence-warning', ({ error }) => {
  console.warn('Puzzle progress not persisted', error);
});
```

## 5. Demo & docs hooks

- See `examples/chess-puzzles.tsx` for filters, solved tracking, and reset helpers.
- The live demo at `demo/src/features/puzzle-mode/` exposes host telemetry hooks and persistence warnings.
- User docs live at `mkdocs_docs/guides/puzzle-mode.md`; keep README and MkDocs examples in sync when APIs evolve.
