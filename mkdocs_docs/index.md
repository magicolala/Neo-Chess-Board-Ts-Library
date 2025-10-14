# 🏁 Neo Chess Board

<div align="center">

![Neo Chess Board](https://img.shields.io/badge/Neo_Chess_Board-v1.0.0-blue?style=for-the-badge&logo=chess&logoColor=white)

[![GitHub Package](https://img.shields.io/static/v1?label=GitHub%20Packages&message=v1.0.0&color=0A66C2&style=flat-square)](https://github.com/magicolala/Neo-Chess-Board-Ts-Library/pkgs/npm/neo-chess-board)
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
- ✨ Fluid animations and transitions
- 🎯 Legal move highlighting
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

Configure npm to use the GitHub Packages registry for the `@magicolala` scope before installing. Generate a GitHub Personal Access Token with the `read:packages` permission and add it to your `.npmrc`:

```ini
# .npmrc
@magicolala:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=${GITHUB_TOKEN}
```

Replace `${GITHUB_TOKEN}` with your token or an environment variable. Then install the package:

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

Use `registerTheme('sunset', customTheme)` to add reusable presets. Custom theme objects can also be passed directly to constructors, `setTheme`, or the React component.

### 🌐 Theme Creator Web App

Designing colors manually can be slow. Visit the interactive [Theme Creator](https://magicolala.github.io/Neo-Chess-Board-Ts-Library/demo/theme-creator.html) to preview palettes live and export the resulting code. The builder includes:

- 🎛️ Real-time controls for every theme property (board colors, highlights, arrows, etc.)
- 💾 Quick access to existing presets so you can start from `classic` or `midnight`
- 📤 Export helpers that copy JSON or TypeScript snippets using `registerTheme`

#### Try it out

1. Open the [hosted Theme Creator](https://magicolala.github.io/Neo-Chess-Board-Ts-Library/demo/theme-creator.html). For local work run `npm run dev` inside `demo/` and navigate to `http://localhost:5174/theme-creator.html`.
2. Choose a base theme, tweak the color pickers, and watch the preview board update instantly.
3. Name the palette, save it, and download the generated JSON or TypeScript code.

You can then register the exported object in your project:

```ts
import { registerTheme } from '@magicolala/neo-chess-board';

const aurora = {
  light: '#F5F3FF',
  dark: '#1E1B4B',
  // ...rest of the properties from the generator
};

registerTheme('aurora', aurora);
```

The Theme Creator keeps saved palettes in `localStorage`, so you can revisit and refine them anytime.

## 📖 Documentation

- [API Reference](api.md)
- [Examples](examples.md)
- [PGN Features](pgn-features.md)
- [Themes](themes.md)

### Core Components

#### NeoChessBoard (React)

```tsx
interface NeoChessProps {
  fen?: string; // Chess position in FEN notation
  theme?: ThemeName | Theme; // Built-in theme name or custom object
  orientation?: 'white' | 'black'; // Board orientation
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
import { PgnNotation } from '@magicolala/neo-chess-board';

const pgn = new PgnNotation();

// Set game metadata
pgn.setMetadata({
  Event: 'Annotated Game',
  White: 'Player A',
  Black: 'Player B',
  Date: '2024.09.15'
});

// Add moves with comments and visual annotations
pgn.addMove(1, 'e4', 'e5', 'White starts with king's pawn.', '{%cal Ge2e4,Re7e5}');
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

1. e4 {%cal Ge2e4,Re7e5} e5 {White starts with king's pawn.}
2. Nf3 {%csl Gf3,Gc6} Nc6 {Knights develop.}
*/

// Download PGN
pgn.downloadPgn('annotated_game.pgn');
```

## 🎪 Advanced Examples

### Complete Chess Application

```tsx
import React, { useState, useMemo } from 'react';
import { PGNRecorder } from '@magicolala/neo-chess-board';
import { NeoChessBoard } from '@magicolala/neo-chess-board/react';

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

// Extend existing theme
const customTheme = {
  ...THEMES.midnight,
  moveFrom: 'rgba(255, 215, 0, 0.6)', // Golden highlight
  moveTo: 'rgba(0, 255, 127, 0.4)', // Spring green
};

// Optionally register for later use
registerTheme('sunset', customTheme);

const board = new NeoChessBoard(element, {
  // Apply directly with an object
  theme: customTheme,
});

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

Neo Chess Board ships with **320 Jest tests across 17 suites**, covering the core engine, React bindings, and the live demo.
Explore the `tests/README.md` file for the full test map and `tests/RESULTS.md` for the latest run summary.

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

We love contributions! See [CONTRIBUTING.md](https://github.com/magicolala/Neo-Chess-Board-Ts-Library/blob/main/CONTRIBUTING.md) for details.

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
