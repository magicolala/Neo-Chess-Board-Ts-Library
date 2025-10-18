# Extensions API

Neo Chess Board now supports a lightweight extension system that lets you hook into the board lifecycle, respond to moves, and reuse shared utilities such as the internal `EventBus`. Extensions are configured at construction time through the `extensions` entry of `BoardOptions`.

## Lifecycle overview

Every extension implements the `Extension` interface exposed by `@magicolala/neo-chess-board`:

```ts
export interface Extension<TOptions = unknown> {
  onInit?(context: ExtensionContext<TOptions>): void;
  onBeforeRender?(context: ExtensionContext<TOptions>): void;
  onAfterRender?(context: ExtensionContext<TOptions>): void;
  onMove?(context: ExtensionContext<TOptions>, payload: BoardEventMap['move']): void;
  onIllegalMove?(context: ExtensionContext<TOptions>, payload: BoardEventMap['illegal']): void;
  onUpdate?(context: ExtensionContext<TOptions>, payload: BoardEventMap['update']): void;
  onDestroy?(context: ExtensionContext<TOptions>): void;
}
```

The provided `ExtensionContext` exposes:

* a reference to the live `NeoChessBoard` instance
* the `EventBus` used by the board
* extension specific options
* `registerExtensionPoint`, a helper that registers and automatically disposes bus listeners when the board is destroyed

Extensions are instantiated by `NeoChessBoard` during construction and receive the context in their `create` factory.

## Registering an extension

Supply an array of `ExtensionConfig` objects to the `extensions` field of `BoardOptions`:

```ts
new NeoChessBoard(container, {
  theme: 'classic',
  extensions: [
    myExtensionConfig,
    otherExtensionConfig,
  ],
});
```

Each config exposes an `id`, optional `options` bag, and a `create` callback that returns the actual `Extension` implementation.

## Arrow/highlight helper extension

The library ships with `createArrowHighlightExtension`, a migration of the legacy drawing helpers onto the new extension surface. It adds initial arrows and highlights, keeps them in sync after board updates, and draws a coloured arrow for the last move. Cleanup happens automatically when the board is destroyed.

```ts
import { NeoChessBoard, createArrowHighlightExtension } from '@magicolala/neo-chess-board';

const board = new NeoChessBoard(container, {
  extensions: [
    createArrowHighlightExtension({
      arrows: [{ from: 'a2', to: 'a4', color: '#ff0000' }],
      highlights: [{ square: 'h7', type: 'circle', color: '#00ff00' }],
      lastMoveColor: '#0000ff',
      persistOnUpdate: true,
    }),
  ],
});
```

Internally the extension uses `context.registerExtensionPoint('update', ...)` to reapply drawings whenever the board position changes. Move hooks are handled through the `onMove` lifecycle and produce the animated last-move arrow.【F:src/extensions/ArrowHighlightExtension.ts†L1-L109】【F:src/core/types.ts†L74-L107】

## Subscribing to board events

Use `registerExtensionPoint` when you need to react to events emitted through the board's `EventBus`:

```ts
create(ctx) {
  ctx.registerExtensionPoint('move', (payload) => {
    console.log('Move played:', payload);
  });

  return {
    onDestroy() {
      console.log('Extension disposed');
    },
  };
}
```

The board tracks all registered listeners and disposes them during `destroy()`, so extensions do not have to manage unsubscription manually.【F:src/core/NeoChessBoard.ts†L56-L68】【F:src/core/NeoChessBoard.ts†L499-L547】

!!! note
    All bundled extensions are available directly from the root package export, so you can import them alongside `NeoChessBoard`.
