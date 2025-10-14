# 🏁 Neo Chess Board

<div align="center">

<!-- BADGES:START -->
![Neo Chess Board](https://img.shields.io/badge/Neo_Chess_Board-v1.0.0-blue?style=for-the-badge&logo=chess&logoColor=white)

[![GitHub Package](https://img.shields.io/static/v1?label=GitHub%20Packages&message=v1.0.0&color=0A66C2&style=flat-square)](https://github.com/magicolala/Neo-Chess-Board-Ts-Library/pkgs/npm/neo-chess-board)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-61DAFB?style=flat-square&logo=react&logoColor=black)](https://reactjs.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](https://opensource.org/licenses/MIT)
<!-- BADGES:END -->

**A modern, lightweight, and beautiful chess board library built with Canvas and TypeScript**

_Perfect for creating chess applications with Chessbook-like feel and performance_

[🎮 Live Demo](https://magicolala.github.io/Neo-Chess-Board-Ts-Library/) • [📖 Documentation](#documentation) • [⚡ Quick Start](#quick-start) • [🎨 Themes](#themes)

</div>

---

## ✨ Features

🎯 **Modern & Lightweight**

- 📦 Zero dependencies (React is peer dependency)
- 🪶 Minimal bundle size
- ⚡ High performance Canvas rendering
- 🔧 Full TypeScript support

🎮 **Rich Chess Experience**

- 🖱️ Smooth drag & drop interactions
- 🎨 Beautiful piece sprites with shadows
- 🧩 Bring your own piece set (SVG, PNG, or Canvas sources)
- ✨ Fluid animations and transitions
- 🎯 Legal move highlighting
- 📈 Demo evaluation bar that reads PGN [%eval] annotations
- 🔄 Optional auto-flip to follow the side to move
- 📱 Responsive design

🔧 **Developer Friendly**

- 🅰️ Complete TypeScript types
- ⚛️ React hooks ready
- 📋 Advanced PGN Management (import/export with annotations)
- 🎨 Customizable themes
- 🧪 Jest setup for automated testing

🎪 **Advanced Features**

- 📝 Built-in PGN recorder
- 🎭 Multiple visual themes
- 🔄 FEN support
- 🎮 Custom rules engine
- 🏹 Visual PGN Annotations (arrows & circles)
- 📐 Square names stay aligned to the bottom and left edges in every orientation

## 🚀 Quick Start

### Installation

Configure npm to use the GitHub Packages registry for the `@magicolala` scope before installing. Create a [GitHub Personal Access Token](https://docs.github.com/authentication/keeping-your-account-and-data-secure/managing-your-personal-access-tokens) with the **`read:packages`** permission and add it to your `.npmrc`:

```ini
# .npmrc
@magicolala:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=${GITHUB_TOKEN}
```

Replace `${GITHUB_TOKEN}` with your token or an environment variable that provides it. After the registry is configured, install the package with your preferred client:

```bash
npm install @magicolala/neo-chess-board
# or
yarn add @magicolala/neo-chess-board
# or
pnpm add @magicolala/neo-chess-board
```

### React Usage

```tsx
import React, { useState } from 'react';
import { NeoChessBoard } from '@magicolala/neo-chess-board/react';

function ChessApp() {
  const [fen, setFen] = useState();

  return (
    <NeoChessBoard
      theme="midnight"
      onMove={({ from, to, fen }) => {
        console.log(`Move: ${from} → ${to}`);
        setFen(fen);
      }}
      style={{ width: '400px', height: '400px' }}
    />
  );
}
```

### Vanilla JavaScript

```javascript
import { NeoChessBoard } from '@magicolala/neo-chess-board';

const board = new NeoChessBoard(document.getElementById('board'), {
  theme: 'classic',
  interactive: true,
  showCoordinates: true,
});

board.on('move', ({ from, to, fen }) => {
  console.log(`Move: ${from} → ${to}`);
});
```

## 🎨 Themes

Neo Chess Board comes with beautiful built-in themes:

| Theme        | Preview                                                                     | Colors               |
| ------------ | --------------------------------------------------------------------------- | -------------------- |
| **Classic**  | ![Classic Theme](https://via.placeholder.com/100x100/EBEDF0/B3C0CE?text=♔)  | Light & clean design |
| **Midnight** | ![Midnight Theme](https://via.placeholder.com/100x100/2A2F3A/1F242E?text=♔) | Dark & modern feel   |

```tsx
// Switch themes dynamically
<NeoChessBoard theme="midnight" />
<NeoChessBoard theme="classic" />
```

To define your own presets, call `registerTheme('sunset', customTheme)` once during initialization. Custom theme objects can also be passed directly to the constructor, `setTheme`, or the React component.

## 🧩 Custom Piece Sets

Prefer wooden Staunton pieces, minimalist line art, or even emoji? Pass a `pieceSet` option to the board (or React component) and supply the sprites you want to use. Each entry can be an imported image/URL, an `HTMLCanvasElement`, or any other [`CanvasImageSource`](https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/drawImage#parameters) instance.

```tsx
import type { PieceSet } from '@magicolala/neo-chess-board';
import whiteKing from './pieces/wK.svg';
import blackKing from './pieces/bK.svg';
import whitePawn from './pieces/wP.png';
import blackPawn from './pieces/bP.png';

const customPieces = {
  defaultScale: 0.9,
  pieces: {
    K: { image: whiteKing },
    k: { image: blackKing },
    P: { image: whitePawn, offsetY: 0.02 },
    p: { image: blackPawn },
  },
} satisfies PieceSet;

<NeoChessBoard theme="midnight" pieceSet={customPieces} />;
```

- Keys follow FEN notation (`K`, `Q`, `R`, `B`, `N`, `P` for white and lowercase for black). Any pieces you omit will fall back to the default flat sprites.
- `defaultScale` and per-piece `scale` let you shrink or enlarge the artwork relative to the square size, while `offsetX`/`offsetY` (fractions of the square) help fine tune alignment.
- At runtime you can call `board.setPieceSet(newSet)` (or `setPieceSet(undefined)`) to swap collections instantly.

### 🌐 Theme Creator Web App

Looking for a faster way to design palettes? The project ships with an interactive [Theme Creator](https://magicolala.github.io/Neo-Chess-Board-Ts-Library/demo/theme-creator.html) that lets you experiment visually before exporting code. It provides:

- 🎛️ Live controls for all 15 theme properties with instant board preview
- 💾 Theme management helpers to load presets (`classic`, `midnight`), rename them, and store new ideas
- 📤 Export buttons that generate JSON payloads or ready-to-paste TypeScript snippets using `registerTheme`

#### How to use it

1. Open the [Theme Creator page](https://magicolala.github.io/Neo-Chess-Board-Ts-Library/demo/theme-creator.html) or, for local development, run `npm run dev` from the `demo` folder and visit `http://localhost:5174/theme-creator.html`.
2. Pick a starting palette from the dropdown or begin with a blank canvas.
3. Adjust colors via the color pickers/text inputs and watch the preview board update in real time.
4. Give your creation a name, save it, and export the JSON/code snippet when you are happy with the result.

### 🧪 Demo Playground Highlights

- The demo PGN textarea now accepts pasted games (including comments such as `[%eval 0.45]`). Hit **Charger** to load the position, annotations and metadata in one go.
- A vertical evaluation bar displays the last imported score, stays aligned with the current board orientation and refreshes as you replay moves or navigate through the game.

Once exported you can register the theme in your app:

```ts
import { registerTheme } from '@magicolala/neo-chess-board';

const aurora = {
  light: '#F5F3FF',
  dark: '#1E1B4B',
  // ...other properties from the generator
};

registerTheme('aurora', aurora);
```

The saved presets can also be stored in `localStorage` for later editing, making it easy to iterate on branding.

## 📖 Documentation

### Core Components

#### NeoChessBoard (React)

```typescript
interface NeoChessProps {
  fen?: string; // Chess position in FEN notation
  theme?: ThemeName | Theme; // Built-in theme name or custom object
  pieceSet?: PieceSet; // Provide custom piece sprites
  orientation?: 'white' | 'black'; // Board orientation
  autoFlip?: boolean; // Follow the side to move automatically
  interactive?: boolean; // Enable drag & drop
  showCoordinates?: boolean; // Show file/rank labels
  animationMs?: number; // Animation duration
  highlightLegal?: boolean; // Highlight legal moves
  onMove?: (move) => void; // Move event handler
  onIllegal?: (attempt) => void; // Illegal move handler
  onPromotionRequired?: (request) => void; // Optional promotion resolver
  style?: React.CSSProperties; // CSS styling
  className?: string; // CSS class
}
```

#### Core Chess Engine

```typescript
// Initialize board
const board = new NeoChessBoard(element, options);

// Event handling
board.on('move', ({ from, to, fen }) => {
  // Handle move
});

board.on('illegal', ({ from, to, reason }) => {
  // Handle illegal move attempt
});

board.on('promotion', (request) => {
  // Show your UI here or default to a queen
  request.resolve('q');
});

### Pawn promotion helpers

When a pawn reaches the back rank, NeoChessBoard pauses the move and emits a `promotion` request. You can respond in three
different ways:

- **Listen for the `promotion` event** (as shown above) and resolve or cancel the request when your UI is ready.
- **Provide `onPromotionRequired` in the board options** to centralize the handler without registering listeners manually.
- **Use the built-in `createPromotionDialogExtension`** to display a ready-to-go overlay that lets players pick between a queen,
  rook, bishop, or knight.

Each `PromotionRequest` exposes `{ from, to, color, mode, choices, resolve, cancel }`. Call `resolve('q' | 'r' | 'b' | 'n')` once
the user has selected a piece or `cancel()` to abort. While the chooser is open you can preview the selection with
`board.previewPromotionPiece(piece)` and inspect the pending request via `board.getPendingPromotion()`.

```ts
import { NeoChessBoard, createPromotionDialogExtension } from '@magicolala/neo-chess-board';

const board = new NeoChessBoard(document.getElementById('board')!, {
  onPromotionRequired(request) {
    // Optional hook (the extension also calls resolve/cancel)
    console.log('Promotion pending for', request.mode, request.from, '→', request.to);
  },
  extensions: [createPromotionDialogExtension()],
});
```

// Position management
board.setPosition('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1');
const currentFEN = board.getPosition();

```

#### PGN Recording & Annotations

```typescript
import { PgnNotation } from '@magicolala/neo-chess-board';

const pgn = new PgnNotation();

// Set game metadata
pgn.setMetadata({
  Event: 'Annotated Game',
  White: 'Player A',
  Black: 'Player B',
  Date: '2024.09.15',
});

// Add moves with comments and visual annotations
pgn.addMove(1, 'e4', 'e5', "White starts with king's pawn.", '{%cal Ge2e4,Re7e5}');
pgn.addMove(2, 'Nf3', 'Nc6', 'Knights develop.', '{%csl Gf3,Gc6}');

// Generate PGN with annotations
const pgnText = pgn.toPgnWithAnnotations();
console.log(pgnText);
/*
[Event "Annotated Game"]
[Site "Neo Chess Board"]
[Date "2024.09.15"]
[Round "1"]
[White "Player A"]
[Black "Player B"]
[Result "*"]

1. e4 {%cal Ge2e4,Re7e5} e5 {White starts with king\'s pawn.}
2. Nf3 {%csl Gf3,Gc6} Nc6 {Knights develop.}
*/

// Download PGN
pgn.downloadPgn('annotated_game.pgn');
```

## 🎪 Advanced Examples

### Complete Chess Application

```tsx
import React, { useState, useMemo } from 'react';
import { NeoChessBoard, PGNRecorder } from '@magicolala/neo-chess-board';

function ChessGame() {
  const [fen, setFen] = useState();
  const [theme, setTheme] = useState('midnight');
  const pgn = useMemo(() => new PGNRecorder(), []);

  const handleMove = ({ from, to, fen }) => {
    pgn.push({ from, to });
    setFen(fen);
  };

  const exportGame = () => {
    pgn.setHeaders({
      Event: 'Online Game',
      Site: 'My App',
      Date: new Date().toISOString().slice(0, 10),
    });
    pgn.download();
  };

  return (
    <div className="chess-game">
      <div className="board-controls">
        <button onClick={() => setTheme('classic')}>Classic</button>
        <button onClick={() => setTheme('midnight')}>Midnight</button>
        <button onClick={exportGame}>Export PGN</button>
      </div>

      <NeoChessBoard
        theme={theme}
        fen={fen}
        onMove={handleMove}
        showCoordinates
        style={{ width: '100%', maxWidth: '500px' }}
      />

      <div className="game-info">
        <textarea value={pgn.getPGN()} readOnly />
      </div>
    </div>
  );
}
```

### Custom Themes

```typescript
import { NeoChessBoard, THEMES, registerTheme } from '@magicolala/neo-chess-board';

// Extend an existing preset
const customTheme = {
  ...THEMES.midnight,
  moveFrom: 'rgba(255, 215, 0, 0.6)', // Golden highlight
  moveTo: 'rgba(0, 255, 127, 0.4)', // Spring green
};

// Optionally register the theme under a name for reuse
registerTheme('sunset', customTheme);

const board = new NeoChessBoard(element, {
  // Direct object support
  theme: customTheme,
});

// Or later by name after registration
board.setTheme('sunset');
```

### Integration with Chess.js

```typescript
import { Chess } from 'chess.js';
import { NeoChessBoard, ChessJsRules } from '@magicolala/neo-chess-board';

const game = new Chess();
const rules = new ChessJsRules();

const board = new NeoChessBoard(element, {
  rulesAdapter: rules,
  onMove: ({ from, to }) => {
    const move = game.move({ from, to });
    if (move) {
      rules.getPgnNotation().addMove(rules.moveNumber(), move.san);
      // Add annotations to the last move
      rules.getPgnNotation().addMoveAnnotations(rules.moveNumber(), true, {
        arrows: [{ from: move.from, to: move.to, color: '#00ff00' }],
        circles: [{ square: move.to, color: '#ffff00' }],
        textComment: 'Good move!',
      });
    }
  },
});

// To get the PGN with annotations from ChessJsRules:
const pgnWithAnnotations = rules.toPgn(true);
console.log(pgnWithAnnotations);
```

#### Détection des cases attaquées

`ChessJsRules` s'appuie directement sur `chess.js` pour analyser le contrôle des cases :

- `getAttackedSquares()` retourne toutes les cases actuellement menacées par le joueur au trait, idéal pour mettre à jour un surlignage dynamique.
- `isSquareAttacked(square, by?)` vérifie si une case donnée est attaquée par la couleur spécifiée (ou par le joueur au trait par défaut). La méthode valide la case fournie (notation algébrique) et accepte des entrées insensibles à la casse.

## 🏗️ Architecture

```
Neo-Chess-Board-Ts-Library/
├── 🎯 Core Engine
│   ├── EventBus          # Type-safe event system
│   ├── LightRules        # Built-in chess rules
│   ├── NeoChessBoard     # Main board class
│   └── Utils             # Chess utilities
├── 🎨 Rendering
│   ├── FlatSprites       # SVG-like piece rendering
│   ├── Themes            # Visual theme system
│   └── Canvas Layers     # Optimized rendering
├── ⚛️ React Integration
│   └── NeoChessBoard     # React component wrapper
└── 📝 PGN Support
    └── PGNRecorder       # Game notation recording
```

## 🎯 Why Neo Chess Board?

| Feature         | Neo Chess Board      | Other Libraries   |
| --------------- | -------------------- | ----------------- |
| **Bundle Size** | 🟢 ~15kb             | 🔴 50-200kb       |
| **TypeScript**  | 🟢 Full support      | 🟡 Partial        |
| **React Ready** | 🟢 Native hooks      | 🔴 Wrapper needed |
| **Performance** | 🟢 Canvas optimized  | 🟡 DOM heavy      |
| **Themes**      | 🟢 Built-in + custom | 🔴 Limited        |
| **PGN Export**  | 🟢 Included          | 🔴 External dep   |
| **Modern Code** | 🟢 ES2022+           | 🔴 Legacy         |

## 📋 API Reference

### React Component Props

```typescript
interface NeoChessProps {
  // Position & Rules
  fen?: string; // Position in FEN notation
  rulesAdapter?: RulesAdapter; // Custom rules engine

  // Visual Appearance
  theme?: ThemeName | Theme; // Built-in theme name or custom object
  orientation?: 'white' | 'black'; // Board flip
  autoFlip?: boolean; // Automatically follow the side to move
  showCoordinates?: boolean; // A-H, 1-8 labels (always bottom/left)

  // Interaction
  interactive?: boolean; // Enable piece dragging
  highlightLegal?: boolean; // Show legal move dots
  animationMs?: number; // Move animation speed

  // Event Handlers
  onMove?: (move: MoveEvent) => void;
  onIllegal?: (attempt: IllegalMoveEvent) => void;
  onUpdate?: (state: UpdateEvent) => void;
  onPromotionRequired?: (request: PromotionRequest) => void;

  // Styling
  style?: React.CSSProperties;
  className?: string;
}
```

### Core Board Methods

```typescript
class NeoChessBoard {
  constructor(element: HTMLElement, options?: BoardOptions);

  // Position Management
  getPosition(): string;
  getCurrentFEN(): string; // Alias for current position
  setPosition(fen: string, immediate?: boolean): void;
  getMoveHistory(): string[]; // SAN strings when supported by the rules adapter
  submitMove(notation: string): boolean; // Coordinate notation helper (e.g. "e2e4")

  // Board Introspection
  getRootElement(): HTMLElement;
  getOrientation(): 'white' | 'black';
  getTurn(): 'w' | 'b';
  getPieceAt(square: Square): string | null;
  attemptMove(from: Square, to: Square, options?: { promotion?: Move['promotion'] }): boolean;
  previewPromotionPiece(piece: Move['promotion'] | null): void;
  isPromotionPending(): boolean;
  getPendingPromotion(): { from: Square; to: Square; color: 'w' | 'b'; mode: 'move' | 'premove' } | null;

  // Event System
  on<T>(event: string, handler: (data: T) => void): () => void;

  // Rendering
  resize(): void;
  renderAll(): void;

  // Cleanup
  destroy(): void;
}
```

## ♿ Accessibility

The library ships with an optional `AccessibilityExtension` that mirrors the board state in accessible formats so screen-reader
and keyboard users can follow along without relying on the canvas.

### What it provides

- A live-updating table that exposes every square as a focusable control with `aria-label`s describing the occupying piece.
- A synchronized braille/text representation of the position and a FEN readout that both update after every move or FEN change.
- A move history list sourced from `board.getMoveHistory()` so textual updates stay in sync with piece animations.
- An optional move form that accepts coordinate notation (for example, `e2e4`) and forwards it through `board.submitMove()`.
- Keyboard navigation with the arrow keys and <kbd>Enter</kbd>/<kbd>Space</kbd> for picking origin and destination squares. When
  `enableKeyboard` is disabled, focus falls back to the canvas interactions.

### Usage

```ts
import { NeoChessBoard, createAccessibilityExtension } from '@magicolala/neo-chess-board';

const board = new NeoChessBoard(document.getElementById('board')!, {
  extensions: [
    createAccessibilityExtension({
      regionLabel: 'Accessible chessboard controls',
      enableKeyboard: true,
    }),
  ],
});

// Text-only integrations can drive the position without the mouse.
board.submitMove('e2e4');
console.log(board.getCurrentFEN());
console.log(board.getMoveHistory());
```

#### Configuration

- `container`: supply a custom element to host the controls; otherwise the extension appends itself beneath the board.
- `enableKeyboard`: toggle the arrow-key/Enter navigation helpers (defaults to `true`).
- `regionLabel`, `boardLabel`, `moveInputLabel`, `livePoliteness`: customize the ARIA copy announced to assistive tech.

## 🧪 Testing

Neo Chess Board comes with a Jest-based test suite that exercises the core engine, React bindings, and the demo scenarios. The
suite lives under [`tests/`](tests/), and [`tests/README.md`](tests/README.md) explains the folder layout together with tips for
adding new coverage. When you run the suite locally it will refresh the generated artifacts such as `tests/RESULTS.md` and the
coverage report.

```bash
npm test              # Run the full suite once
npm run test:watch    # Re-run affected tests on file changes
npm run test:coverage # Produce an updated coverage summary + HTML report
```

> ℹ️ Coverage percentages depend on the latest local run. After executing the commands above you can open `coverage/lcov-report/index.html`
> for detailed metrics and, if desired, commit an updated summary to `tests/RESULTS.md`.

## 🚀 Performance

- **Smooth 60fps** animations
- **Optimized Canvas** rendering with layers
- **Efficient** piece sprite system
- **Minimal re-renders** in React
- **Memory efficient** event system

## 🌟 Examples Gallery

Check out these live examples powered by Neo Chess Board:

- 🌐 [Vanilla JS Starter](https://magicolala.github.io/Neo-Chess-Board-Ts-Library/examples/vanilla-js-example.html) – Quick start board with theme switching, move history, and PGN export helpers.
- ♞ [Chess.js Integration](https://magicolala.github.io/Neo-Chess-Board-Ts-Library/examples/chess-js-demo.html) – Demonstrates the ChessJsRules adapter synchronized with the chess.js engine.
- 📈 [PGN + Evaluation HUD](https://magicolala.github.io/Neo-Chess-Board-Ts-Library/examples/pgn-import-eval.html) – Import annotated games and follow the evaluation bar as you navigate.
- ⚡ [Advanced Features Showcase](https://magicolala.github.io/Neo-Chess-Board-Ts-Library/examples/advanced-features.html) – Explore puzzles, analysis tools, and keyboard-driven workflows.

## 🤝 Contributing

We love contributions! See [CONTRIBUTING.md](./CONTRIBUTING.md) for details.

- 🐛 [Report bugs](https://github.com/magicolala/Neo-Chess-Board-Ts-Library/issues)
- 💡 [Request features](https://github.com/magicolala/Neo-Chess-Board-Ts-Library/issues)
- 🔧 [Submit PRs](https://github.com/magicolala/Neo-Chess-Board-Ts-Library/pulls)

## 📄 License

MIT © [Cédric Oloa](https://github.com/magicolala)

---

<div align="center">

**Made with ❤️ for the chess community**

⭐ **Star this repo if you find it useful!** ⭐

</div>
