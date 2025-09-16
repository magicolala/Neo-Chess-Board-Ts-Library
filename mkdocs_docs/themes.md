# Theme Development Guide

Neo Chess Board ships with a lightweight theming system focused on color palettes. Themes control the board background, piece colors and all highlight layers so you can match the board to the rest of your application.

## 🎨 Theme structure

```ts
import type { Theme } from 'neochessboard';

interface Theme {
  light: string;           // Light squares
  dark: string;            // Dark squares
  boardBorder: string;     // Outer border around the board
  whitePiece: string;      // Fill color for white pieces
  blackPiece: string;      // Fill color for black pieces
  pieceShadow: string;     // Soft drop shadow rendered under every piece
  pieceStroke?: string;    // Optional outline for the pieces
  pieceHighlight?: string; // Optional highlight overlay on top of the pieces
  moveFrom: string;        // Highlight for the origin square of the last move
  moveTo: string;          // Highlight for the destination square / legal moves
  lastMove: string;        // Overlay for the most recent move
  premove: string;         // Highlight when a premove is set
  dot: string;             // Small circle rendered for legal moves
  arrow: string;           // Default arrow color
  squareNameColor: string; // Coordinate labels drawn on the board
}
```

All properties accept any valid CSS color string. `pieceStroke` and `pieceHighlight` are optional; when omitted they fall back to the values from the default `classic` theme.

## 🌈 Built-in themes

| Name      | Description         |
| --------- | ------------------- |
| `classic` | Neutral, wood-inspired palette suitable for most UIs |
| `midnight`| Sleek dark theme with high-contrast highlights        |

Import the catalog through `THEMES`:

```ts
import { THEMES } from 'neochessboard';

const { classic, midnight } = THEMES;
```

## 🧪 Creating a custom theme

```ts
import { THEMES } from 'neochessboard';

const sunsetTheme = {
  ...THEMES.midnight,
  light: '#2E1F47',
  dark: '#1A102B',
  moveFrom: 'rgba(250, 204, 21, 0.55)',
  moveTo: 'rgba(249, 115, 22, 0.45)',
  arrow: 'rgba(236, 72, 153, 0.9)',
};
```

You can pass the theme object directly when creating a board or when calling `setTheme`/`applyTheme`.

## 🗂️ Registering reusable themes

Use `registerTheme` to store a theme under a name so it can be referenced later:

```ts
import { registerTheme, THEMES } from 'neochessboard';

registerTheme('sunset', {
  ...THEMES.classic,
  light: '#FDF2F8',
  dark: '#831843',
  squareNameColor: '#4C1D95',
});
```

Registration normalizes the theme and inserts it in the `THEMES` map. Missing optional fields inherit the values from the `classic` preset.

If you need the final normalized object without registering it, call `resolveTheme`:

```ts
import { resolveTheme, THEMES } from 'neochessboard';

const normalized = resolveTheme({
  ...THEMES.midnight,
  pieceHighlight: undefined,
});
```

## ⚙️ Applying themes

### Vanilla JavaScript

```ts
import { NeoChessBoard, THEMES } from 'neochessboard';

const board = new NeoChessBoard(container, {
  theme: THEMES.classic,        // built-in object
  // or theme: 'classic',       // built-in name
});

// Apply a custom object at runtime
board.applyTheme({
  ...THEMES.midnight,
  dot: 'rgba(147, 51, 234, 0.5)',
});

// Switch back to a registered preset
board.setTheme('sunset');
```

### React component

```tsx
import { NeoChessBoard } from 'neochessboard';

const customTheme = {
  light: '#F5F3FF',
  dark: '#312E81',
  boardBorder: '#3730A3',
  whitePiece: '#F8FAFC',
  blackPiece: '#1E1B4B',
  pieceShadow: 'rgba(0,0,0,0.2)',
  moveFrom: 'rgba(251, 191, 36, 0.55)',
  moveTo: 'rgba(129, 140, 248, 0.45)',
  lastMove: 'rgba(165, 180, 252, 0.35)',
  premove: 'rgba(217, 70, 239, 0.35)',
  dot: 'rgba(30, 64, 175, 0.4)',
  arrow: 'rgba(129, 140, 248, 0.9)',
  squareNameColor: '#E0E7FF',
};

function Board() {
  return <NeoChessBoard theme={customTheme} showCoordinates />;
}
```

The React wrapper automatically chooses between `setTheme` and `applyTheme` based on the value you provide.

## 📦 Serialization and persistence

The helper functions return plain objects, so you can safely persist them:

```ts
const registered = registerTheme('aurora', customTheme);
localStorage.setItem('aurora-theme', JSON.stringify(registered));

const restored = JSON.parse(localStorage.getItem('aurora-theme')!);
board.applyTheme(restored);
```

`resolveTheme` applies the same normalization used during registration, ensuring that serialized objects remain compatible in future sessions.

## 🧑‍🎨 Design guidelines

- Ensure clear contrast between `light` and `dark` squares (recommended ratio ≥ 3:1).
- Keep the highlight colors semi-transparent (`moveFrom`, `moveTo`, `lastMove`, `premove`) so the pieces remain visible.
- Use `squareNameColor` that contrasts with both square colors if coordinates are visible.
- Prefer slightly darker `dot` colors for legal moves to maintain subtlety.
- Reuse your primary brand colors across `arrow` and highlight layers to maintain cohesion.

## ♿ Accessibility tips

- Check your palette with color-blind simulators to guarantee differentiation between highlight states.
- Increase the opacity of `dot` and `arrow` colors for users with low-vision modes.
- Consider providing an alternative high-contrast theme by adjusting `whitePiece`, `blackPiece`, and highlight colors.

## ✅ Testing your theme

```ts
import { resolveTheme } from 'neochessboard';

describe('sunset theme', () => {
  it('serializes correctly', () => {
    const normalized = resolveTheme(customTheme);
    expect(() => JSON.stringify(normalized)).not.toThrow();
  });

  it('keeps light and dark squares distinct', () => {
    const normalized = resolveTheme(customTheme);
    expect(normalized.light).not.toBe(normalized.dark);
  });
});
```

## 🤝 Sharing your work

- Open a pull request with your theme proposal and a short description.
- Include screenshots or GIFs showing the board in action.
- Mention any accessibility considerations or design goals.

Happy theming!
