# Neo Chess Board Theme Creator

An interactive web application for creating custom themes for the Neo Chess Board library.

## Features

- **Live Color Picker**: Adjust all 15 theme properties with real-time preview
- **Theme Management**: Load existing themes (classic, midnight), save custom themes
- **Export Options**: Download themes as JSON or TypeScript code
- **Visual Feedback**: Color swatches and descriptions for each property

## Usage

1. Open `theme-creator.html` in your browser
2. Select a base theme from the dropdown or start with the default
3. Adjust colors using the color pickers or text inputs
4. See changes reflected instantly on the chess board
5. Save your theme with a custom name
6. Export as JSON or TypeScript code for use in your projects

## Theme Properties

| Property | Description |
|----------|-------------|
| `light` | Background color for light squares |
| `dark` | Background color for dark squares |
| `boardBorder` | Outer border around the board |
| `whitePiece` | Fill color for white pieces |
| `blackPiece` | Fill color for black pieces |
| `pieceShadow` | Drop shadow under pieces |
| `pieceStroke` | Outline color for pieces (optional) |
| `pieceHighlight` | Highlight overlay on pieces (optional) |
| `moveFrom` | Highlight for move origin square |
| `moveTo` | Highlight for destination/legal moves |
| `lastMove` | Overlay for most recent move |
| `premove` | Highlight for premove indicators |
| `dot` | Small circles for legal moves |
| `arrow` | Default color for arrows |
| `squareNameColor` | Color for coordinate labels |

## Development

The theme creator is built with React and uses the Neo Chess Board library for the live preview. To run the development server:

```bash
cd demo
npm run dev
```

Then open `http://localhost:5174/theme-creator.html` in your browser.

## Integration

Themes created with this tool can be used directly in your Neo Chess Board implementation:

```typescript
import { registerTheme } from '@magicolala/neo-chess-board';

const myTheme = {
  light: '#EBEDF0',
  dark: '#B3C0CE',
  // ... other properties
};

registerTheme('myTheme', myTheme);

// Use in your board
<NeoChessBoard theme="myTheme" />
