# Puzzle Mode Quickstart

## 1. Install & import

```bash
npm install neo-chess-board
```

```ts
import 'neo-chess-board/style.css';
import { NeoChessBoard } from 'neo-chess-board/react';
import puzzles from './puzzles/tactics.json';
```

## 2. Enable Puzzle Mode

```tsx
<NeoChessBoard
  puzzleMode={{
    collectionId: 'daily-tactics',
    puzzles,
    autoAdvance: true,
    allowHints: true,
  }}
  onPuzzleEvent={(event) => {
    if (event.type === 'persistence-warning') {
      toast.warn('Progress not saved; private mode detected.');
    }
  }}
/>
```

Key options:

- `collectionId`: namespace for localStorage.
- `puzzles`: array of `PuzzleDefinition` objects.
- `autoAdvance`: automatically load next puzzle on completion.
- `allowHints`: toggles hint controls.

## 3. Provide puzzle data

```json
[
  {
    "id": "mate-in-two-001",
    "title": "Mate in two",
    "fen": "r1bqkbnr/pppp1ppp/2n5/4p3/2B1P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 2 3",
    "solution": ["Bxf7+", "Qxd8+"],
    "variants": [
      { "id": "line-b", "label": "Line B", "moves": ["Bxf7+", "Nxe5+"] }
    ],
    "difficulty": "intermediate",
    "tags": ["tactic", "sacrifice"],
    "author": "Neo Library",
    "hint": "Look for checks on f7."
  }
]
```

## 4. Handle events

```ts
board.on('puzzle:complete', ({ puzzleId, attempts }) => {
  analytics.track('puzzle_complete', { puzzleId, attempts });
});

board.on('puzzle:persistence-warning', ({ error }) => {
  console.warn('Puzzle progress not persisted', error);
});
```

## 5. Document & demo updates

- Add usage docs to `mkdocs_docs/guides/puzzle-mode.md`.
- Extend `README.md` feature list.
- Create demo page in `demo/src/features/puzzle-mode/` showcasing hints, persistence, and accessibility.
