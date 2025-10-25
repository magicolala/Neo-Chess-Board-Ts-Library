# Seamless Integration Guide

Learn how to embed Neo Chess Board into your application and tailor it to your brand. This guide walks through the recommended setup for both vanilla JavaScript and React projects, then highlights the most useful customization hooks.

## Prerequisites

- An application that can serve static assets (Vite, Next.js, Create React App, etc.).
- Node.js 18+.
- Access to the `@magicolala` npm scope via GitHub Packages.

> For installation basics, refer to the [Quick Start](https://github.com/magicolala/Neo-Chess-Board-Ts-Library#-quick-start) section in the repository README.

## 1. Install and Configure the Registry

Create or update your `.npmrc` file so the `@magicolala` scope points to GitHub Packages:

```ini
@magicolala:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=${GITHUB_TOKEN}
```

Replace `${GITHUB_TOKEN}` with a personal access token that has the `read:packages` permission. Then install the library with your package manager of choice:

```bash
npm install @magicolala/neo-chess-board
# or
yarn add @magicolala/neo-chess-board
# or
pnpm add @magicolala/neo-chess-board
```

## 2. Render the Board

### Vanilla JavaScript

```ts
import { NeoChessBoard } from '@magicolala/neo-chess-board';

const board = new NeoChessBoard(document.getElementById('board'), {
  theme: 'classic',
  interactive: true,
});

board.on('move', ({ from, to, fen }) => {
  console.log(`${from} → ${to}`);
});
```

```html
<div id="board" style="width: 420px; height: 420px;"></div>
```

### React

```tsx
import { useState } from 'react';
import { NeoChessBoard } from '@magicolala/neo-chess-board/react';

export function Playground() {
  const [fen, setFen] = useState<string | undefined>();

  return (
    <NeoChessBoard
      fen={fen}
      theme="midnight"
      onMove={({ fen: nextFen }) => setFen(nextFen)}
      style={{ width: 440, height: 440, borderRadius: '1rem', overflow: 'hidden' }}
    />
  );
}
```

## 3. Customize the Look & Feel

### Built-in Themes

Choose from the bundled presets through the `theme` option. Theme names correspond to those in the [Themes catalog](themes.md).

```tsx
<NeoChessBoard theme="classic" />
<NeoChessBoard theme="midnight" />
```

### Register a Custom Theme

```ts
import { registerTheme } from '@magicolala/neo-chess-board';

const auroraTheme = {
  light: '#f5f3ff',
  dark: '#1e1b4b',
  highlight: '#fbbf24',
  check: '#f59e0b',
  coordinates: '#312e81',
  // ...set the remaining palette fields here
};

registerTheme('aurora', auroraTheme);

new NeoChessBoard(container, { theme: 'aurora' });
```

> Tip: Use the [Theme Creator](https://magicolala.github.io/Neo-Chess-Board-Ts-Library/demo/theme-creator.html) to generate the palette interactively and export ready-to-paste code.

### Custom Piece Sets

```ts
import type { PieceSet } from '@magicolala/neo-chess-board';
import whiteKing from './pieces/wK.svg';
import blackKing from './pieces/bK.svg';

const glossyPieces: PieceSet = {
  defaultScale: 0.92,
  pieces: {
    K: { image: whiteKing },
    k: { image: blackKing },
    // provide other piece sprites as needed
  },
};

const board = new NeoChessBoard(container, {
  pieceSet: glossyPieces,
  background: '#0f172a',
});
```

Missing entries automatically fall back to the default minimalist sprites. Use `offsetX`, `offsetY`, or per-piece `scale` to nudge artwork into place.

## 4. Fine-tune Interactions

### Highlighting & Coordinates

```ts
const board = new NeoChessBoard(container, {
  showCoordinates: true,
  highlightMoves: true,
  highlightLastMove: true,
  highlightCheck: true,
});
```

### Event Lifecycle

Listen to board events (`move`, `promotion`, `select`, etc.) to synchronize with the rest of your application.

```ts
board.on('promotion', ({ square, setPiece }) => {
  openPromotionModal({
    square,
    onChoice(piece) {
      setPiece(piece);
    },
  });
});
```

In React, use the dedicated props: `onMove`, `onPromotion`, `onSquareClick`, and others.

### Sound cues & board chrome

Runtime toggles delegate to the new audio and DOM managers, which means you can change ambience or styling without rebuilding the board.

```ts
board.setSoundEnabled(true);
board.setSoundUrls({
  white: '/sounds/light-move.mp3',
  black: '/sounds/dark-move.mp3',
});
board.setSoundEventUrls({
  capture: {
    white: '/sounds/white-capture.mp3',
    black: '/sounds/black-capture.mp3',
  },
  check: '/sounds/check.mp3',
});

// Apply inline CSS to the layered root element
board.setBoardStyle({
  borderRadius: '18px',
  boxShadow: '0 12px 35px rgba(15, 23, 42, 0.25)',
});
```

Changes propagate immediately—the board keeps a ResizeObserver active through `BoardDomManager`, and sound sources hot-reload via `BoardAudioManager`.

### Translate squares into pixel coordinates

Use `getRelativeCoords` when you need to align your own overlays or DOM nodes with specific board squares. The helper understands files/ranks, orientation, and even non-square boards. It returns both the top-left origin and the center point for each queried square.

```ts
import { getRelativeCoords } from '@magicolala/neo-chess-board';

const { center } = getRelativeCoords(
  {
    boardWidth: 640,
    boardHeight: 640,
    files: 8,
    ranks: 8,
    orientation: 'white',
  },
  'e4',
);

// Position a tooltip over e4
tooltip.style.transform = `translate(${center.x}px, ${center.y}px)`;
```

You can also query multiple squares at once or work with rectangular boards by passing an array of algebraic identifiers:

```ts
const [from, to] = getRelativeCoords(
  {
    boardWidth: 960,
    boardHeight: 640,
    files: 8,
    ranks: 8,
    orientation: 'black',
  },
  ['g7', 'g2'],
);

drawArrow(from.center, to.center);
```

## 5. Layout and Responsiveness

Wrap the board in a responsive container and control its dimensions using CSS. Because the board uses a `<canvas>`, it scales smoothly with `width`/`height` changes.

```tsx
<div className="board-shell">
  <NeoChessBoard theme="classic" autoFlip style={{ width: '100%', aspectRatio: '1 / 1' }} />
</div>
```

```css
.board-shell {
  max-width: 520px;
  margin: 0 auto;
}
```

## 6. Persisting State

Combine PGN/FEN helpers with your own storage solution to keep games across sessions.

```ts
import { NeoChessBoard, parsePgn, toPgn } from '@magicolala/neo-chess-board';

const saved = localStorage.getItem('neo-chess-game');
const board = new NeoChessBoard(container, { fen: saved ?? undefined });

board.on('move', () => {
  localStorage.setItem('neo-chess-game', board.getFen());
});
```

## 7. Deploying

Neo Chess Board does not ship assets that require special hosting—once bundled by your build tool, it works on any static host or CDN. If you rely on external piece sprites, ensure they are copied by your bundler or reachable via public URLs.

---

With these building blocks you can integrate Neo Chess Board into landing pages, dashboards, or full-featured chess platforms with brand-consistent visuals and polished user flows.
