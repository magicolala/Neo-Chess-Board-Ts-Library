# 🏁 Neo Chess Board

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

Themes also control board-state overlays. Customize the `check`, `checkmate`, and `stalemate` colors to style how the board reacts when the game reaches those statuses.

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
- [Chess960 Guide](guides/chess960.md)

### Core Components

#### NeoChessBoard (React)

```tsx
interface NeoChessProps {
  fen?: string; // Chess position in FEN notation
  position?: string; // Alias for FEN when integrating with other APIs
  theme?: ThemeName | Theme; // Built-in theme name or custom object
  orientation?: 'white' | 'black'; // Board orientation
  boardOrientation?: 'white' | 'black'; // Orientation alias
  chessboardRows?: number; // Number of ranks to render
  chessboardColumns?: number; // Number of files to render
  interactive?: boolean; // Enable drag & drop
  showCoordinates?: boolean; // Show file/rank labels
  animation?: { duration?: number; easing?: AnimationEasing }; // Animation configuration
  animationDurationInMs?: number; // Legacy duration alias
  animationEasing?: AnimationEasing; // Legacy easing alias
  animationMs?: number; // Legacy duration alias
  showAnimations?: boolean; // Toggle move animations
  highlightLegal?: boolean; // Highlight legal moves
  allowDragging?: boolean; // Enable pointer dragging
  dragActivationDistance?: number; // Pixels required before a drag starts
  allowDragOffBoard?: boolean; // Allow dropping outside the board to cancel
  allowAutoScroll?: boolean; // Auto-scroll parent containers near edges
  allowDrawingArrows?: boolean; // Enable right-click arrow drawing
  clearArrowsOnClick?: boolean; // Clear arrows with a left click
  arrowOptions?: { color?: string; width?: number; opacity?: number }; // Default arrow styling
  arrows?: Arrow[]; // Controlled arrow collection
  onArrowsChange?: (arrows: Arrow[]) => void; // Called when arrows change
  canDragPiece?: (params: { square: Square; piece: string; board: NeoChessBoard }) => boolean; // Filter draggable pieces
  onMove?: (move) => void; // Move event handler
  onIllegal?: (attempt) => void; // Illegal move handler
  style?: React.CSSProperties; // CSS styling
  className?: string; // CSS class
}
```

> Configure animations with the `animation` prop or call `board.setAnimation({ duration, easing })` at runtime. Easing accepts `'linear'`, `'ease'`, `'ease-in'`, `'ease-out'`, `'ease-in-out'`, or a custom `(t: number) => number` function.

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
│   ├── NeoChessBoard     # Main board class
│   ├── BoardDomManager   # Canvas & DOM layout orchestration
│   ├── BoardEventManager # Pointer + keyboard routing
│   ├── BoardAudioManager # Move sound lifecycle
│   ├── EventBus          # Type-safe event system
│   ├── LightRules        # Built-in chess rules
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

### Internal helper managers

The refactored core is split into focused helpers so you can reason about behaviour changes quickly:

- **`BoardDomManager`** builds and maintains the layered canvas/DOM structure, applies inline styles, and wires resize logic.
- **`BoardEventManager`** centralises pointer/keyboard routing so interaction tweaks stay isolated from rendering concerns.
- **`BoardAudioManager`** owns move sound configuration, live toggles, and per-colour playback.

Each manager exposes a small API and is orchestrated by `NeoChessBoard`, making it easier to customise or swap subsystems without touching unrelated code.

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
  animationMs?: number; // Move animation speed (legacy alias)
  animationDurationInMs?: number; // Preferred animation duration alias
  showAnimations?: boolean; // Toggle move animations
  allowDragging?: boolean; // Enable pointer dragging interactions
  dragActivationDistance?: number; // Minimum pointer travel before dragging starts
  allowDragOffBoard?: boolean; // Allow dropping outside the board to cancel
  allowAutoScroll?: boolean; // Auto-scroll scrollable ancestors near edges
  allowDrawingArrows?: boolean; // Enable right-click arrow drawing
  clearArrowsOnClick?: boolean; // Clear arrows on left click
  arrowOptions?: { color?: string; width?: number; opacity?: number }; // Default arrow styling
  arrows?: Arrow[]; // Controlled arrows collection
  onArrowsChange?: (arrows: Arrow[]) => void; // Change callback for arrows
  canDragPiece?: (params: { square: Square; piece: string; board: NeoChessBoard }) => boolean; // Control drag eligibility

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

Neo Chess Board ships with a Jest-based test environment that covers the core engine, React bindings, and demo scenarios. The suite lives under [`tests/`](https://github.com/magicolala/Neo-Chess-Board-Ts-Library/tree/main/tests), and [`tests/README.md`](https://github.com/magicolala/Neo-Chess-Board-Ts-Library/blob/main/tests/README.md) describes the folder structure together with guidance for adding additional cases. Running the suite locally will also refresh helper artifacts such as [`tests/RESULTS.md`](https://github.com/magicolala/Neo-Chess-Board-Ts-Library/blob/main/tests/RESULTS.md) and the coverage output.

```bash
npm test              # Run the full suite once
npm run test:watch    # Re-run affected tests on file changes
npm run test:coverage # Produce an updated coverage summary + HTML report
```

> ℹ️ Coverage numbers depend on your latest local execution. After running the commands above you can open `coverage/lcov-report/index.html` for detailed metrics or commit an updated summary to [`tests/RESULTS.md`](https://github.com/magicolala/Neo-Chess-Board-Ts-Library/blob/main/tests/RESULTS.md) if you capture a new campaign.

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
