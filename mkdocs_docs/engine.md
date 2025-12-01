# Stockfish Engine Integration

Neo Chess Board now ships with a lightweight Stockfish integration designed to keep the core bundle slim while enabling deep on-device analysis.

## Getting Started

```ts
import { createEngineExtension } from 'neo-chess-board';

const board = new NeoChessBoard(container, {
  extensions: [
    createEngineExtension({
      autoStart: true,
      multiPv: 2,
      engine: { depth: 14 },
    }),
  ],
});
```

The extension listens to board updates and re-runs analysis automatically. It emits results through the provided callbacks, making it easy to display evaluation scores, principal variations, or best move suggestions.

## Playing vs the AI

```ts
import { createAIPlayerExtension } from 'neo-chess-board';

const board = new NeoChessBoard(container, {
  extensions: [
    createAIPlayerExtension({ aiColor: 'black', movetimeMs: 250 }),
  ],
});
```

When it is the AI's turn the engine produces a move asynchronously and plays it on the board. You can use `onMoveStart` and `onMoveComplete` hooks to update the UI.

## API Reference

### StockfishEngine

- `init()` — Prepare the transport and wait for `ready`.
- `analyze(request)` — Run analysis for a FEN position. Resolves with `EngineAnalysisResult`.
- `getBestMove(fen, movetimeMs?)` — Convenience helper for one-shot best move queries.
- `stop()` / `terminate()` — Abort analysis and release the transport.

### Engine Options

| Option | Description |
| --- | --- |
| `depth` | Limits search depth |
| `movetimeMs` | Milliseconds to think for a one-shot call |
| `multiPv` | Number of principal variations to return |
| `skillLevel` | Optional skill slider for Stockfish-compatible transports |
| `elo` | Soft cap on playing strength |
| `threads` / `hash` | Pass-through configuration for worker-based transports |
| `wasmUrl` | Override the Stockfish wasm bundle URL |

## Notes

- The default transport is a mocked worker that mirrors the UCI lifecycle without bundling the heavy wasm payload. Swap the `transportFactory` option to point to your own WebAssembly worker when running in production.
- All events are throttled to avoid UI spam. Use the `throttleMs` option to fine-tune updates.
- Keep the board responsive by instantiating the engine lazily and disposing it on unmount.
