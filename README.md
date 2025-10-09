# 🏁 Neo Chess Board

<div align="center">

![Neo Chess Board](https://img.shields.io/badge/Neo_Chess_Board-v0.1.0-blue?style=for-the-badge&logo=chess&logoColor=white)

[![npm version](https://img.shields.io/npm/v/neochessboard?style=flat-square)](https://www.npmjs.com/package/neochessboard)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-61DAFB?style=flat-square&logo=react&logoColor=black)](https://reactjs.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](https://opensource.org/licenses/MIT)

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
- 🧪 100% tested

🎪 **Advanced Features**

- 📝 Built-in PGN recorder
- 🎭 Multiple visual themes
- 🔄 FEN support
- 🎮 Custom rules engine
- 🏹 Visual PGN Annotations (arrows & circles)
- 📐 Square names stay aligned to the bottom and left edges in every orientation

## 🚀 Quick Start

### Installation

```bash
npm install neochessboard
# or
yarn add neochessboard
# or
pnpm add neochessboard
```

### React Usage

```tsx
import React, { useState } from 'react';
import { NeoChessBoard } from 'neochessboard/react';

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

> ℹ️ The React bindings live under the `neochessboard/react` subpath. If you prefer importing everything from the root package, you can use the `NeoChessBoardReact` named export instead.

### Vanilla JavaScript

```javascript
import { NeoChessBoard } from 'neochessboard';

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
import type { PieceSet } from 'neochessboard';
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
import { registerTheme } from 'neochessboard';

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

// Position management
board.setPosition('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1');
const currentFEN = board.getPosition();
```

#### PGN Recording & Annotations

```typescript
import { PgnNotation } from 'neochessboard';

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
import { NeoChessBoard } from 'neochessboard/react';
import { PGNRecorder } from 'neochessboard';

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
import { NeoChessBoard, THEMES, registerTheme } from 'neochessboard';

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
import { NeoChessBoard, ChessJsRules } from 'neochessboard';

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
neochessboard/
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
  setPosition(fen: string, immediate?: boolean): void;

  // Event System
  on<T>(event: string, handler: (data: T) => void): () => void;

  // Rendering
  resize(): void;
  renderAll(): void;

  // Cleanup
  destroy(): void;
}
```

## 🧪 Testing

Neo Chess Board ships with **320 Jest tests across 17 suites**, covering the core engine, React bindings, and the live demo. Check
out [`tests/README.md`](tests/README.md) for the detailed structure and [`tests/RESULTS.md`](tests/RESULTS.md) for the latest run
summary.

```bash
npm test              # Run all tests
npm run test:watch    # Watch mode
npm run test:coverage # Coverage report
```

**Coverage**: 95%+ across all modules

- ✅ Chess rules validation (LightRules & ChessJsRules)
- ✅ React component lifecycle & event hooks
- ✅ Auto-flip orientation and coordinate layout
- ✅ PGN import/export with advanced annotations
- ✅ Theme and sprite pipelines
- ✅ Canvas rendering overlays (arrows, highlights, premoves)

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
