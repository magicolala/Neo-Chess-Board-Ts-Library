# 🏁 Neo Chess Board

<div align="center">

![Neo Chess Board](https://img.shields.io/badge/Neo_Chess_Board-v1.0.0-blue?style=for-the-badge&logo=chess&logoColor=white)

[![GitHub Package](https://img.shields.io/static/v1?label=GitHub%20Packages&message=v1.0.0&color=0A66C2&style=flat-square)](https://github.com/magicolala/Neo-Chess-Board-Ts-Library/pkgs/npm/neo-chess-board)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-61DAFB?style=flat-square&logo=react&logoColor=black)](https://reactjs.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](https://opensource.org/licenses/MIT)

**A modern, lightweight chess board library built with Canvas and TypeScript**

*Chessbook-inspired performance meets developer-friendly APIs*

[🎮 Live Demo](https://magicolala.github.io/Neo-Chess-Board-Ts-Library/) • [📖 Documentation](#-documentation) • [⚡ Quick Start](#-quick-start) • [🎨 Themes](#-themes)

</div>

---

## ✨ Why Neo Chess Board?

| Feature                | Neo Chess Board          | Other Libraries      |
|------------------------|--------------------------|----------------------|
| **Bundle Size**        | 🟢 ~15kb (minified)      | 🔴 50-200kb          |
| **Dependencies**       | 🟢 Zero core deps        | 🔴 Multiple          |
| **TypeScript**         | 🟢 Full native support   | 🟡 Partial/types-only|
| **React Integration**  | 🟢 Native hooks & SSR    | 🔴 Wrapper required  |
| **Performance**        | 🟢 Canvas optimized      | 🟡 DOM-heavy         |
| **Customization**      | 🟢 Themes + piece sets   | 🔴 Limited options   |
| **PGN Support**        | 🟢 Built-in w/ annotations| 🔴 External library |
| **Accessibility**      | 🟢 Optional extension    | 🔴 None/limited      |

## 🎯 Key Features

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

Neo Chess Board is distributed via GitHub Packages. Configure npm to use the GitHub registry for the `@magicolala` scope:

**Step 1:** Create a [GitHub Personal Access Token](https://docs.github.com/authentication/keeping-your-account-and-data-secure/managing-your-personal-access-tokens) with `read:packages` permission.

**Step 2:** Add to your `.npmrc` file:

```ini
@magicolala:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=YOUR_GITHUB_TOKEN
```

**Step 3:** Install the package:

```bash
npm install @magicolala/neo-chess-board
# or
yarn add @magicolala/neo-chess-board
# or
pnpm add @magicolala/neo-chess-board
```

### Basic Usage (React)

```tsx
import { NeoChessBoard } from '@magicolala/neo-chess-board/react';

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

### 🔊 Event-aware sound cues

Customize the audio feedback per event or per side. Provide a single clip for all moves or tailor captures, checks, and mates for each color:

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
  },
});
```

When a specific clip is missing the board gracefully falls back to the move configuration (`soundEventUrls.move`), the color-specific defaults (`soundUrls`), and finally the legacy `soundUrl`.

## 🎨 Themes

Neo Chess Board includes two beautiful themes out of the box, and you can easily create your own.

### Built-in Themes

| Theme        | Description               | Best For                    |
|--------------|---------------------------|-----------------------------|
| **Classic**  | Light & clean design      | Traditional chess apps      |
| **Midnight** | Dark & modern aesthetic   | Night mode, modern UIs      |

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

<NeoChessBoard theme="midnight" pieceSet={customPieces} />
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
  fen?: string;                    // FEN position string
  orientation?: 'white' | 'black'; // Board orientation
  autoFlip?: boolean;              // Follow active player
  
  // Visual Styling
  theme?: ThemeName | Theme;       // Built-in name or custom object
  pieceSet?: PieceSet;             // Custom piece images
  showCoordinates?: boolean;       // Show rank/file labels
  
  // Interaction
  interactive?: boolean;           // Enable drag & drop
  highlightLegal?: boolean;        // Show legal move indicators
  allowDragging?: boolean;         // Enable pointer dragging
  dragActivationDistance?: number; // Pixels before drag starts
  allowDragOffBoard?: boolean;     // Allow cancel by dropping outside
  allowAutoScroll?: boolean;       // Scroll container during drag
  
  // Animations
  showAnimations?: boolean;        // Toggle animations
  animationDurationInMs?: number;  // Animation speed (default: 200)
  
  // Arrows & Annotations
  allowDrawingArrows?: boolean;    // Enable right-click arrows
  clearArrowsOnClick?: boolean;    // Clear arrows on left click
  arrows?: Arrow[];                // Controlled arrows state
  onArrowsChange?: (arrows: Arrow[]) => void;
  arrowOptions?: {
    color?: string;
    width?: number;
    opacity?: number;
  };
  
  // Advanced
  rulesAdapter?: RulesAdapter;     // Custom chess rules
  canDragPiece?: (params: {
    square: Square;
    piece: string;
    board: NeoChessBoard;
  }) => boolean;
  
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
  attemptMove(from: Square, to: Square, options?: {
    promotion?: 'q' | 'r' | 'b' | 'n';
  }): boolean;
  
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
  
  // Rendering
  resize(): void;
  renderAll(): void;

  // Runtime configuration
  configure(configuration: {
    drag?: { threshold?: number; snap?: boolean; ghost?: boolean; ghostOpacity?: number; cancelOnEsc?: boolean };
    animation?: { durationMs?: number; easing?: AnimationEasing };
    promotion?: { autoQueen?: boolean; ui?: 'dialog' | 'inline' };
  }): void;

  // Lifecycle
  destroy(): void;
}
```

### Pawn Promotion

Neo Chess Board offers three ways to handle pawn promotion:

#### 1. Event Listener

```typescript
board.on('promotion', (request) => {
  // Show your custom UI
  showPromotionDialog().then(piece => {
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
  }
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
      rules.getPgnNotation().addMove(
        rules.moveNumber(),
        move.san,
        'Good move!',
        `{%cal G${from}${to}}`
      );
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
    })
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
        <textarea 
          value={pgn.getPGN()} 
          readOnly 
          rows={10}
        />
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
