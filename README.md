# ♟️ Neo Chess Board

<div align="center">

![Neo Chess Board](https://img.shields.io/badge/Neo_Chess_Board-v1.0.0-blue?style=for-the-badge&logo=chess&logoColor=white)

[![npm](https://img.shields.io/npm/v/neo-chess-board.svg?style=flat-square)](https://www.npmjs.com/package/neo-chess-board)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-61DAFB?style=flat-square&logo=react&logoColor=black)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-646CFF?style=flat-square&logo=vite&logoColor=white)](https://vitejs.dev/)
[![Jest](https://img.shields.io/badge/Jest-C21325?style=flat-square&logo=jest&logoColor=white)](https://jestjs.io/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](https://opensource.org/licenses/MIT)

**A modern, lightweight chess board library built with Canvas and TypeScript**

_Type-safe • Zero dependencies • Performance optimized • React ready_

[🎮 Live Demo](https://magicolala.github.io/Neo-Chess-Board-Ts-Library/) • [📖 Documentation](mkdocs_docs/) • [⚡ Quick Start](#quick-start) • [✨ Features](#features)

</div>

---

## ✨ Features

### 🚀 Performance & Modern Stack

- 📦 **Zero dependencies** (React is peer dependency only)
- 🪶 **~15kb minified** – Minimal bundle impact
- ⚡ **60fps animations** with optimized Canvas rendering
- 🔧 **Full TypeScript** support with complete type definitions
- 📱 **Responsive design** that scales beautifully

### 🎮 Rich Chess Experience

- 🖱️ **Smooth drag & drop** with customizable activation distance
- 🎨 **Beautiful piece sprites** with shadows and anti-aliasing
- 🧩 **Custom piece sets** – Bring your own SVG, PNG, or Canvas images
- ✨ **Fluid animations** with configurable duration
- 🎯 **Legal move highlighting** with dots and indicators
- 🔊 **Event-aware audio** with per-color overrides for moves, captures, checks, and mates
- 📈 **Evaluation bar** that reads PGN `[%eval]` annotations
- 🔄 **Auto-flip board** to follow the active player
- 🏹 **Visual annotations** – Draw arrows and highlight squares

### 🔧 Developer Experience

- ⚛️ **React hooks ready** with SSR support
- 🅰️ **Complete TypeScript types** for everything
- 📋 **Advanced PGN management** – Import/export with comments
- 🎨 **Customizable themes** with visual creator tool
- 🧪 **Jest test suite** with coverage reports
- 🔌 **Extensible architecture** via plugin system
- 📐 **Smart coordinate display** – Labels stay aligned in any orientation

### ♿ Accessibility

- ⌨️ **Keyboard navigation** with arrow keys
- 🔊 **Screen reader support** via optional extension
- 📝 **Move history** in text format
- 🎯 **ARIA labels** for all interactive elements

## 🚀 Quick Start

### Installation

Install Neo Chess Board from npm:

```bash
npm install neo-chess-board
# or
yarn add neo-chess-board
# or
pnpm add neo-chess-board
```

### Basic Usage (React)

Import the packaged stylesheet to enable the built-in board and extension styles, then render the React component:

```tsx
import 'neo-chess-board/style.css';
import { NeoChessBoard } from 'neo-chess-board/react';

function ChessApp() {
  return (
    <NeoChessBoard
      theme="midnight"
      showCoordinates
      highlightLegal
      onMove={({ from, to, fen }) => {
        console.log(`Move: ${from} → ${to}`);
      }}
      style={{ width: '500px', height: '500px' }}
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
  highlightLegal: true,
});

board.on('move', ({ from, to, fen }) => {
  console.log(`Move: ${from} → ${to}`);
});
```

### Headless logic (Node-friendly)

Use the new `ChessGame` core to validate moves, manage FEN/PGN, and drive clocks without any DOM or canvas dependencies. `NeoChessBoard` composes this class internally for rendering, but you can also use it directly in server-side environments:

```ts
import { ChessGame } from 'neo-chess-board';

const game = new ChessGame({ fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1' });

game.move({ from: 'e2', to: 'e4' });
console.log(game.getFEN());
```

### 🔊 Event-aware sound cues

Customize the audio feedback per event or per side. Provide a single clip for all moves or tailor captures, checks, promotions, mates, and illegal move warnings for each color:

```ts
const board = new NeoChessBoard(container, {
  soundEnabled: true,
  soundUrl: '/sounds/default-move.mp3',
  soundEventUrls: {
    move: '/sounds/quiet-move.mp3',
    capture: {
      white: '/sounds/white-capture.mp3',
      black: '/sounds/black-capture.mp3',
    },
    check: '/sounds/check.mp3',
    checkmate: '/sounds/mate.mp3',
    promote: '/sounds/promote.mp3',
    illegal: '/sounds/illegal.mp3',
  },
});
```

When a specific clip is missing the board gracefully falls back to the move configuration (`soundEventUrls.move`), the color-specific defaults (`soundUrls`), and finally the legacy `soundUrl`.

Available sound event keys: `move`, `capture`, `check`, `checkmate`, `promote`, and `illegal`.

## 🤖 AI Analysis with Stockfish

Neo Chess Board ships with an optional Stockfish integration powered by WebAssembly. Use the new `StockfishEngine` helper and extensions to enable real-time analysis or to play against an AI opponent.

```ts
import { createEngineExtension, createAIPlayerExtension } from 'neo-chess-board';

const board = new NeoChessBoard(container, {
  extensions: [
    createEngineExtension({
      autoStart: true,
      onResult: (result) => console.log('Engine score', result.lines[0]?.score),
    }),
    createAIPlayerExtension({ aiColor: 'black', movetimeMs: 200 }),
  ],
});
```

The engine runs in an isolated worker transport (mocked during testing) to keep the UI responsive. Configure skill level, depth, or Multi-PV via the `engine` options passed to the extension factories.

## 🎨 Themes

Neo Chess Board includes two beautiful themes out of the box, and you can easily create your own.

### Built-in Themes

| Theme        | Description             | Best For               |
| ------------ | ----------------------- | ---------------------- |
| **Classic**  | Light & clean design    | Traditional chess apps |
| **Midnight** | Dark & modern aesthetic | Night mode, modern UIs |

```tsx
// Use built-in themes
<NeoChessBoard theme="midnight" />
<NeoChessBoard theme="classic" />
```

### Custom Themes

Create and register your own themes:

```typescript
import { registerTheme, THEMES } from '@magicolala/neo-chess-board';

// Extend existing theme
const customTheme = {
  ...THEMES.midnight,
  light: '#E8E8E8',
  dark: '#4A4A4A',
  moveFrom: 'rgba(255, 215, 0, 0.6)',
  moveTo: 'rgba(0, 255, 127, 0.4)',
  border: '#2C2C2C',
};

// Register for reuse
registerTheme('custom', customTheme);

// Use by name or pass directly
<NeoChessBoard theme="custom" />
<NeoChessBoard theme={customTheme} />
```

### 🌐 Interactive Theme Creator

Use our [Theme Creator web app](https://magicolala.github.io/Neo-Chess-Board-Ts-Library/demo/theme-creator.html) to design themes visually:

- 🎛️ **Live preview** – See changes instantly
- 💾 **Save presets** – Store themes in localStorage
- 📤 **Export code** – Generate JSON or TypeScript snippets
- 🎨 **15 customizable properties** – Full control over appearance

Try it locally: `npm run dev` in the `demo` folder, then visit `http://localhost:5174/theme-creator.html`

## 🧩 Custom Piece Sets

Replace default pieces with your own artwork:

```tsx
import type { PieceSet } from '@magicolala/neo-chess-board';
import whiteKing from './pieces/wK.svg';
import blackKing from './pieces/bK.svg';

const customPieces: PieceSet = {
  defaultScale: 0.9,
  pieces: {
    K: { image: whiteKing },
    k: { image: blackKing },
    P: { image: whitePawn, offsetY: 0.02 },
    p: { image: blackPawn, scale: 0.85 },
    // ... other pieces
  },
};

<NeoChessBoard theme="midnight" pieceSet={customPieces} />;
```

**Features:**

- ✅ Keys follow FEN notation (`K`, `Q`, `R`, `B`, `N`, `P` for white; lowercase for black)
- ✅ Any `CanvasImageSource` supported (SVG, PNG, Canvas elements)
- ✅ Per-piece `scale`, `offsetX`, `offsetY` for fine-tuning
- ✅ Runtime swapping with `board.setPieceSet(newSet)`
- ✅ Omitted pieces fall back to default sprites

## 📖 Documentation

### React Component API

```typescript
interface NeoChessProps {
  // Position & State
  fen?: string; // FEN position string
  orientation?: 'white' | 'black'; // Board orientation
  autoFlip?: boolean; // Follow active player

  // Visual Styling
  theme?: ThemeName | Theme; // Built-in name or custom object
  pieceSet?: PieceSet; // Custom piece images
  showCoordinates?: boolean; // Show rank/file labels

  // Interaction
  interactive?: boolean; // Enable drag & drop
  highlightLegal?: boolean; // Show legal move indicators
  allowDragging?: boolean; // Enable pointer dragging
  dragActivationDistance?: number; // Pixels before drag starts
  allowDragOffBoard?: boolean; // Allow cancel by dropping outside
  allowAutoScroll?: boolean; // Scroll container during drag

  // Animations
  showAnimations?: boolean; // Toggle animations
  animation?: {
    // Animation configuration
    duration?: number; // Duration in milliseconds
    easing?: AnimationEasing; // Name or custom easing function
  };
  animationDurationInMs?: number; // Legacy duration alias
  animationEasing?: AnimationEasing; // Legacy easing alias

  // Arrows & Annotations
  allowDrawingArrows?: boolean; // Enable right-click arrows
  clearArrowsOnClick?: boolean; // Clear arrows on left click
  arrows?: Arrow[]; // Controlled arrows state
  onArrowsChange?: (arrows: Arrow[]) => void;
  arrowOptions?: {
    color?: string;
    width?: number;
    opacity?: number;
  };

  // Advanced
  rulesAdapter?: RulesAdapter; // Custom chess rules
  canDragPiece?: (params: { square: Square; piece: string; board: NeoChessBoard }) => boolean;

  // Events
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
  // Position Management
  getPosition(): string;
  getCurrentFEN(): string;
  setPosition(fen: string, immediate?: boolean): void;
  getMoveHistory(): string[];
  submitMove(notation: string): boolean;

  // Board State
  getOrientation(): 'white' | 'black';
  getTurn(): 'w' | 'b';
  getPieceAt(square: Square): string | null;
  getPieceSquares(piece: Piece): Square[];

  // Move Handling
  attemptMove(
    from: Square,
    to: Square,
    options?: {
      promotion?: 'q' | 'r' | 'b' | 'n';
    },
  ): boolean;

  // Promotion
  previewPromotionPiece(piece: 'q' | 'r' | 'b' | 'n' | null): void;
  isPromotionPending(): boolean;
  getPendingPromotion(): {
    from: Square;
    to: Square;
    color: 'w' | 'b';
    mode: 'move' | 'premove';
  } | null;

  // Event System
  on<T>(event: string, handler: (data: T) => void): () => void;

  // Animation
  setAnimation(animation: { duration?: number; easing?: AnimationEasing }): void;
  setAnimationDuration(duration: number): void;

  // Rendering
  resize(): void;
  renderAll(): void;

  // Runtime configuration
  configure(configuration: {
    drag?: {
      threshold?: number;
      snap?: boolean;
      ghost?: boolean;
      ghostOpacity?: number;
      cancelOnEsc?: boolean;
    };
    animation?: { durationMs?: number; easing?: AnimationEasing };
    promotion?: { autoQueen?: boolean; ui?: 'dialog' | 'inline' };
  }): void;

  // Lifecycle
  destroy(): void;
}
```

Use the `animation` board option or `setAnimation` method to adjust duration and easing at runtime.
`AnimationEasing` accepts one of the built-in easing names (`'linear'`, `'ease'`, `'ease-in'`, `'ease-out'`, `'ease-in-out'`) or a custom `(t: number) => number` function.

### Pawn Promotion

Neo Chess Board offers three ways to handle pawn promotion:

#### 1. Event Listener

```typescript
board.on('promotion', (request) => {
  // Show your custom UI
  showPromotionDialog().then((piece) => {
    request.resolve(piece); // 'q', 'r', 'b', or 'n'
  });
});
```

#### 2. Callback Option

```typescript
const board = new NeoChessBoard(element, {
  onPromotionRequired(request) {
    // Handle promotion
    request.resolve('q');
  },
});
```

#### 3. Built-in UI Extension

```typescript
import { createPromotionDialogExtension } from '@magicolala/neo-chess-board';

const board = new NeoChessBoard(element, {
  extensions: [createPromotionDialogExtension()],
});
```

#### 4. Inline Overlay & Auto-Queen Controls

You can control the promotion experience directly from the board without writing a custom handler.

```typescript
const board = new NeoChessBoard(element, {
  promotion: {
    ui: 'inline', // show a compact overlay next to the target square
    autoQueen: false, // set to true to always promote to a queen
  },
});

// Update at runtime using the configure API
board.configure({ promotion: { autoQueen: true } });
```

`promotion.ui` defaults to `'dialog'`, which preserves the event/callback behaviour above. When set to `'inline'` the board renders a lightweight picker on top of the board, integrated with the existing promotion preview pipeline. `autoQueen` resolves promotions immediately with a queen, skipping any UI or callbacks.

## ⏱️ Integrated Game Clocks

Neo Chess Board ships with a battle-tested game clock so you can add time controls without wiring a separate timer. Configure the
`clock` option with global or per-side times, increments, an initial active color, and lifecycle callbacks:

```ts
import { NeoChessBoard, createClockExtension } from '@magicolala/neo-chess-board';

const board = new NeoChessBoard(element, {
  soundEnabled: false,
  clock: {
    initial: { w: 300_000, b: 300_000 }, // 5 minutes each
    increment: 2_000,
    active: 'w',
    paused: true,
    callbacks: {
      onClockChange: (state) => console.log('tick', state.white.remaining, state.black.remaining),
      onFlag: ({ color }) => console.warn(`${color} flagged`),
    },
  },
  extensions: [
    createClockExtension({
      labels: { w: 'White', b: 'Black' },
      highlightActive: true,
      showTenths: true,
      formatTime: (ms, { color }) => {
        const seconds = Math.floor(ms / 1000);
        const minutes = Math.floor(seconds / 60);
        const suffix = color === 'w' ? '⏱️' : '⌛️';
        return `${minutes}:${(seconds % 60).toString().padStart(2, '0')} ${suffix}`;
      },
      onReady(api) {
        (window as typeof window & { clock?: typeof api }).clock = api;
      },
    }),
  ],
});
```

The board keeps the current `ClockState` internally. Inspect it at any time via `board.getClockState()` and control the timers
with `startClock()`, `pauseClock()`, `resetClock()`, `setClockTime()`, and `addClockTime()`. Every change triggers strongly typed bus events so other systems can react:

- `clock:change` – fires on every update with the full `ClockState`
- `clock:start` / `clock:pause` – emitted when the clock transitions between running and paused states
- `clock:flag` – dispatched once per side when a timer reaches zero

### React integration

The React component exposes the same functionality:

```tsx
import { NeoChessBoard, type NeoChessRef } from '@magicolala/neo-chess-board/react';
import { useRef } from 'react';

const ref = useRef<NeoChessRef>(null);

<NeoChessBoard
  ref={ref}
  clock={{ initial: 600_000, increment: 5_000 }}
  onClockChange={(state) => console.log('remaining', state.white.remaining)}
/>;

ref.current?.startClock();
ref.current?.resetClock({ initial: { w: 300_000, b: 120_000 }, paused: true });
ref.current?.addClockTime('w', 5_000);
```

The React bindings keep the clock configuration stable across renders—passing the same values will not reset the timers, while changes to the configuration or callbacks are propagated automatically.

`NeoChessRef` now includes helpers such as `getClockState`, `startClock`, `pauseClock`, `resetClock`, `setClockTime`, and
`addClockTime`, while the component accepts `onClockChange`, `onClockStart`, `onClockPause`, and `onClockFlag` props for reactive
UIs.

## 📝 PGN Support

### Recording Games

```typescript
import { PgnNotation } from '@magicolala/neo-chess-board';

const pgn = new PgnNotation();

// Set metadata
pgn.setMetadata({
  Event: 'World Championship',
  White: 'Magnus Carlsen',
  Black: 'Ian Nepomniachtchi',
  Date: '2024.04.15',
});

// Add moves with annotations
pgn.addMove(1, 'e4', 'e5', "King's pawn opening.", '{%cal Ge2e4}');
pgn.addMove(2, 'Nf3', 'Nc6', 'Knights develop.', '{%csl Gf3,Gc6}');

// Export
const pgnText = pgn.toPgnWithAnnotations();
pgn.downloadPgn('game.pgn');
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
      rules
        .getPgnNotation()
        .addMove(rules.moveNumber(), move.san, 'Good move!', `{%cal G${from}${to}}`);
    }
  },
});

// Get annotated PGN
const pgn = rules.toPgn(true);
```

### Attack Detection

```typescript
// Get all attacked squares by current player
const attackedSquares = rules.getAttackedSquares();

// Check if specific square is attacked
const isAttacked = rules.isSquareAttacked('e4', 'w'); // by white
```

## ♿ Accessibility Extension

Make your chess board accessible to all users:

```typescript
import { createAccessibilityExtension } from '@magicolala/neo-chess-board';

const board = new NeoChessBoard(element, {
  extensions: [
    createAccessibilityExtension({
      enableKeyboard: true,
      regionLabel: 'Interactive chessboard',
    }),
  ],
});
```

**Features:**

- ⌨️ Arrow key navigation
- 🔊 Screen reader compatible table
- 📝 Braille/text representation
- 📜 Move history list
- 💬 ARIA labels and live regions
- 🎯 Coordinate notation input

## 🎪 Advanced Examples

### Complete Chess Application

```tsx
import React, { useState, useMemo } from 'react';
import { NeoChessBoard, PGNRecorder } from '@magicolala/neo-chess-board';

function ChessGame() {
  const [fen, setFen] = useState<string>();
  const [theme, setTheme] = useState<'classic' | 'midnight'>('midnight');
  const pgn = useMemo(() => new PGNRecorder(), []);

  const handleMove = ({ from, to, fen }: MoveEvent) => {
    pgn.push({ from, to });
    setFen(fen);
  };

  const exportGame = () => {
    pgn.setHeaders({
      Event: 'Online Game',
      Site: 'My Chess App',
      Date: new Date().toISOString().slice(0, 10),
    });
    pgn.download('my-game.pgn');
  };

  return (
    <div className="chess-game">
      <div className="controls">
        <button onClick={() => setTheme('classic')}>Classic Theme</button>
        <button onClick={() => setTheme('midnight')}>Midnight Theme</button>
        <button onClick={exportGame}>Export PGN</button>
      </div>

      <NeoChessBoard
        theme={theme}
        fen={fen}
        onMove={handleMove}
        showCoordinates
        highlightLegal
        style={{ width: '100%', maxWidth: '600px' }}
      />

      <div className="game-notation">
        <h3>PGN</h3>
        <textarea value={pgn.getPGN()} readOnly rows={10} />
      </div>
    </div>
  );
}
```

## 🌟 Live Examples

Explore these interactive examples:

- 🌐 [**Vanilla JS Starter**](https://magicolala.github.io/Neo-Chess-Board-Ts-Library/examples/vanilla-js-example.html) – Basic setup with theme switching and PGN export
- ♞ [**Chess.js Integration**](https://magicolala.github.io/Neo-Chess-Board-Ts-Library/examples/chess-js-demo.html) – Full rules engine integration
- 📈 [**PGN Import & Evaluation**](https://magicolala.github.io/Neo-Chess-Board-Ts-Library/examples/pgn-import-eval.html) – Annotated games with eval bar
- ⚡ [**Advanced Features**](https://magicolala.github.io/Neo-Chess-Board-Ts-Library/examples/advanced-features.html) – Puzzles, analysis, keyboard controls

## 🧪 Testing

Neo Chess Board includes a comprehensive Jest test suite:

```bash
npm test              # Run all tests
npm run test:watch    # Watch mode
npm run test:coverage # Generate coverage report
```

Tests cover:

- ✅ Core chess engine
- ✅ React component integration
- ✅ PGN parsing and export
- ✅ Theme system
- ✅ Accessibility features

See [`tests/README.md`](tests/README.md) for details on the test structure and how to add new tests.

## 🤖 AI & Analysis Features

### Real-time Engine Analysis

```typescript
const board = new NeoChessBoard(element, {
  extensions: [
    createEngineExtension({
      depth: 20,
      movetimeMs: 1000,
      onResult: (result) => console.log('Best move:', result.bestMove),
    }),
  ],
});
```

### AI Opponent (Stockfish)

```typescript
const board = new NeoChessBoard(element, {
  extensions: [
    createAIPlayerExtension({
      aiColor: 'black',
      movetimeMs: 1000,
      onMoveComplete: (move) => console.log('AI played:', move),
    }),
  ],
});
```

### Stockfish Agent (Manual Control)

```typescript
import { ChessGame } from 'neo-chess-board';
import { StockfishAgent } from 'neo-chess-board';

const game = new ChessGame();
const agent = new StockfishAgent(game, '/stockfish.js', 20);

agent.on('analysisUpdate', (analysis) => {
  console.log('Depth:', analysis.depth);
  console.log('Best move:', analysis.bestMove);
  console.log('Score:', analysis.score);
});

game.move({ from: 'e2', to: 'e4' });
agent.terminate();
```

## 🏁 Chess960 (Fischer Random Chess)

```typescript
import { generateChess960StartPosition, isValidChess960Start } from 'neo-chess-board';

// Generate a random Chess960 position
const randomFEN = generateChess960StartPosition();

// Or use a specific Chess960 index (0-959)
const specificFEN = generateChess960StartPosition(518);

// Validate Chess960 position
const isValid = isValidChess960Start(fen);

board.setPosition(randomFEN);
```

## 🔌 Built-in Extensions

| Extension                    | Purpose                   | Use Case                    |
| ---------------------------- | ------------------------- | --------------------------- |
| **PromotionDialogExtension** | UI for pawn promotion     | Automatic promotion dialogs |
| **ArrowHighlightExtension**  | Draw and manage arrows    | Annotate games with arrows  |
| **ClockExtension**           | Display game clock        | Show time controls on board |
| **EngineExtension**          | Real-time engine analysis | Get computer analysis       |
| **AIPlayerExtension**        | Play against AI           | Stockfish opponent          |
| **CameraEffectsExtension**   | Visual effects            | Zoom, pan, shake animations |
| **AccessibilityExtension**   | Screen reader support     | Accessibility compliance    |

## 🏗️ Architecture

```
Neo-Chess-Board-Ts-Library/
├── 🎯 Core Engine
│   ├── EventBus           # Type-safe event system
│   ├── LightRules         # Built-in chess rules
│   ├── ChessJsRules       # Chess.js adapter
│   └── NeoChessBoard      # Main board class
│
├── 🎨 Rendering
│   ├── Canvas Layers      # Optimized multi-layer rendering
│   ├── FlatSprites        # Default piece renderer
│   └── Themes             # Theme system
│
├── ⚛️ React
│   └── NeoChessBoard      # React component with hooks
│
├── 📝 PGN
│   ├── PgnNotation        # PGN data structure
│   └── PGNRecorder        # Game recording
│
└── 🔌 Extensions
    ├── PromotionDialog    # Built-in promotion UI
    └── Accessibility      # A11y features
```

## 🚀 Performance Optimizations

- ⚡ **Canvas layering** – Separate layers for board, pieces, and highlights
- 🎯 **Dirty rectangle tracking** – Only redraw changed regions
- 💾 **Sprite caching** – Pre-rendered piece images
- 🔄 **Efficient animations** – RequestAnimationFrame with interpolation
- 📦 **Tree-shaking friendly** – Import only what you need
- 🧮 **Minimal re-renders** – React memo and optimization

## 🤝 Contributing

Contributions are welcome! Here's how to get started:

1. 🍴 Fork the repository
2. 🌿 Create a feature branch (`git checkout -b feature/amazing-feature`)
3. ✅ Write tests for your changes
4. 💚 Ensure tests pass (`npm test`)
5. 📝 Commit your changes (`git commit -m 'Add amazing feature'`)
6. 🚀 Push to the branch (`git push origin feature/amazing-feature`)
7. 🎉 Open a Pull Request

See [CONTRIBUTING.md](./CONTRIBUTING.md) for detailed guidelines.

For demo QA expectations and release polish steps, follow the [Demo QA & Release Checklist](./demo/README.md).

### Report Issues

- 🐛 [Report bugs](https://github.com/magicolala/Neo-Chess-Board-Ts-Library/issues)
- 💡 [Request features](https://github.com/magicolala/Neo-Chess-Board-Ts-Library/issues)
- 🔧 [Submit PRs](https://github.com/magicolala/Neo-Chess-Board-Ts-Library/pulls)

## 📄 License

MIT © [Cédric Oloa](https://github.com/magicolala)

---

<div align="center">

**Made with ❤️ for the chess community**

⭐ **If Neo Chess Board helps your project, consider giving it a star!** ⭐

[🎮 Try the Demo](https://magicolala.github.io/Neo-Chess-Board-Ts-Library/) • [📖 Read the Docs](#-documentation) • [💬 Join Discussions](https://github.com/magicolala/Neo-Chess-Board-Ts-Library/discussions)

</div>
