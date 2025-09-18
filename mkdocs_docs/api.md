# API Documentation

## Core Classes

### NeoChessBoard

The main chess board class that handles rendering, interaction, and game state.

#### Constructor

```typescript
constructor(canvas: HTMLCanvasElement, options?: Partial<BoardOptions>)
```

**Parameters:**

- `canvas: HTMLCanvasElement` - The canvas element to render the board on
- `options?: Partial<BoardOptions>` - Optional board configuration

#### Methods

##### `loadPosition(fen: string): void`

Load a chess position from FEN notation.

**Parameters:**

- `fen: string` - Valid FEN string representing the position

**Example:**

```typescript
board.loadPosition('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1');
```

##### `makeMove(from: Square, to: Square): boolean`

Attempt to make a move on the board.

**Parameters:**

- `from: Square` - Source square (e.g., 'e2')
- `to: Square` - Destination square (e.g., 'e4')

**Returns:**

- `boolean` - True if move was successful, false otherwise

##### `setTheme(theme: ThemeName | Theme): void`

Change the visual theme of the board.

**Parameters:**

- `theme: ThemeName | Theme` - Theme name or custom theme object

##### `setOrientation(color: 'white' | 'black'): void`

Flip the board orientation.

**Parameters:**

- `color: 'white' | 'black'` - Which color should be at the bottom

##### `setAutoFlip(enabled: boolean): void`

Enable or disable automatic board flipping based on the side to move.

**Parameters:**

- `enabled: boolean` - `true` to follow the active player, `false` to keep the current orientation

##### `reset(): void`

Reset the board to the initial chess position.

##### `exportPGN(): string`

Export the current game as PGN format.

**Returns:**

- `string` - PGN representation of the game

##### `destroy(): void`

Clean up event listeners and resources.

#### Events

The board emits events through the EventBus system:

- `move` - When a move is made
- `check` - When a king is in check
- `checkmate` - When checkmate occurs
- `stalemate` - When stalemate occurs
- `promotion` - When pawn promotion is needed

### EventBus

Event handling system for the chess board.

#### Methods

##### `on(event: string, callback: Function): void`

Subscribe to an event.

**Parameters:**

- `event: string` - Event name
- `callback: Function` - Event handler function

##### `off(event: string, callback: Function): void`

Unsubscribe from an event.

##### `emit(event: string, ...args: any[]): void`

Emit an event with optional arguments.

### LightRules

Chess rules validation engine.

#### Constructor

```typescript
constructor(initialFen?: string)
```

#### Methods

##### `isValidMove(from: Square, to: Square): boolean`

Check if a move is valid according to chess rules.

##### `makeMove(from: Square, to: Square): Move | null`

Make a move and return move details or null if invalid.

##### `isInCheck(color: Color): boolean`

Check if the specified color's king is in check.

##### `isCheckmate(color: Color): boolean`

Check if the specified color is in checkmate.

##### `isStalemate(color: Color): boolean`

Check if the specified color is in stalemate.

##### `getFen(): string`

Get the current position as FEN string.

##### `loadFen(fen: string): void`

Load a position from FEN string.

### PgnAnnotationParser

Parses and generates PGN annotations, including visual elements like arrows and circles.

#### Static Methods

##### `static hasVisualAnnotations(comment: string): boolean`

Checks if a comment string contains visual annotations.

##### `static parseComment(comment: string): ParsedAnnotations`

Parses a PGN comment to extract arrows, highlights, and text.

##### `static toDrawingObjects(parsed: ParsedAnnotations): { arrows: Arrow[]; highlights: SquareHighlight[]; }`

Converts parsed annotations into drawing objects for rendering.

##### `static stripAnnotations(comment: string): string`

Removes visual annotations from a comment, leaving only the text.

##### `static fromDrawingObjects(arrows: Arrow[], highlights: SquareHighlight[]): string`

Creates an annotation string from drawing objects.

##### `static colorToHex(colorCode: string): string`

Converts a single-character color code (e.g., 'R', 'G') to a hex color string.

##### `static hexToColor(hex: string): string`

Converts a hex color string back to a single-character color code.

##### `static isValidSquare(square: string): square is Square`

Validates if a string is a valid chess square notation.

### PgnNotation

Manages PGN game data, including metadata, moves, and visual annotations.

#### Constructor

```typescript
constructor(rulesAdapter?: RulesAdapter)
```

**Parameters:**

- `rulesAdapter?: RulesAdapter` - Optional rules adapter for move validation and PGN import.

#### Methods

##### `setMetadata(metadata: Partial<PgnMetadata>): void`

Sets or updates the PGN game metadata (headers).

##### `addMove(moveNumber: number, whiteMove?: string, blackMove?: string, whiteComment?: string, blackComment?: string): void`

Adds a move to the game record, optionally with comments.

##### `setResult(result: string): void`

Sets the final result of the game.

##### `importFromChessJs(chess: any): void`

Imports moves and game state from a `chess.js` instance.

##### `toPgn(includeHeaders: boolean = true): string`

Generates the PGN string without visual annotations.

##### `toPgnWithAnnotations(): string`

Generates the PGN string including visual annotations embedded in comments.

##### `downloadPgn(filename: string = 'game.pgn'): void`

Downloads the PGN as a file (browser-only).

##### `addMoveAnnotations(moveNumber: number, isWhite: boolean, annotations: PgnMoveAnnotations): void`

Adds visual annotations (arrows, circles, text) to a specific move.

##### `loadPgnWithAnnotations(pgnString: string): void`

Loads a PGN string, parsing embedded visual annotations.

##### `getMoveAnnotations(moveNumber: number, isWhite: boolean): PgnMoveAnnotations | undefined`

Retrieves visual annotations for a specific move.

##### `getMovesWithAnnotations(): PgnMove[]`

Retrieves all moves with their associated annotations.

##### `clear(): void`

Clears all moves and resets the game state.

##### `getMoveCount(): number`

Returns the total number of moves recorded.

##### `getResult(): string`

Returns the current game result.

### ChessJsRules

Adapter for `chess.js` providing comprehensive chess rule validation and PGN integration.

#### Constructor

```typescript
constructor(fen?: string)
```

**Parameters:**

- `fen?: string` - Optional initial FEN string to load.

#### Methods

##### `getChessInstance(): Chess`

Returns the underlying `chess.js` instance.

##### `getFEN(): string`

Gets the current position in FEN format.

##### `setFEN(fen: string): void`

Sets the current position using a FEN string.

##### `move(moveData: { from: string; to: string; promotion?: string }): { ok: boolean; reason?: string }`

Attempts to make a move and returns its success status.

##### `movesFrom(square: string): Move[]`

Gets all legal moves from a specified square.

##### `getAllMoves(): Move[]`

Gets all legal moves for the current position.

##### `isLegalMove(from: string, to: string, promotion?: string): boolean`

Checks if a specific move is legal.

##### `inCheck(): boolean`

Checks if the current player's king is in check.

##### `isCheckmate(): boolean`

Checks if the current player is in checkmate.

##### `isStalemate(): boolean`

Checks if the current player is in stalemate.

##### `isGameOver(): boolean`

Checks if the game is over (checkmate, stalemate, draw).

##### `getGameResult(): '1-0' | '0-1' | '1/2-1/2' | '*'`

Gets the result of the game.

##### `turn(): 'w' | 'b'`

Gets the color of the player whose turn it is.

##### `get(square: string): { type: string; color: string } | null`

Gets the piece on a specified square.

##### `undo(): boolean`

Undoes the last move.

##### `history(): string[]`

Gets the history of moves in SAN format.

##### `getHistory(): any[]`

Gets the detailed history of moves.

##### `reset(): void`

Resets the board to the initial position.

##### `getCheckSquares(): string[]`

Gets the squares where the king is in check.

##### `canCastle(side: 'k' | 'q', color?: 'w' | 'b'): boolean`

Checks if castling is possible for a given side and color.

##### `moveNumber(): number`

Returns the current move number.

##### `clone(): ChessJsRules`

Creates a clone of the current `ChessJsRules` instance.

##### `static isValidFEN(fen: string): boolean`

Statically validates a FEN string.

##### `getLastMove(): any | null`

Gets information about the last move played.

##### `generateFEN(): string`

Generates the FEN string for the current position.

##### `setPgnMetadata(metadata: Partial<PgnMetadata>): void`

Sets the PGN metadata for the current game.

##### `toPgn(includeHeaders: boolean = true): string`

Exports the current game as a PGN string.

##### `downloadPgn(filename?: string): void`

Downloads the current game as a PGN file.

##### `getPgnNotation(): PgnNotation`

Gets the underlying `PgnNotation` instance for advanced PGN manipulation.

##### `loadPgn(pgn: string): boolean`

Loads a game from a PGN string.

##### `getLastMoveNotation(): string | null`

Gets the PGN notation of the last move played.

##### `getPgnMoves(): string[]`

Gets the history of moves in PGN notation.

### FlatSprites

Handles piece sprite rendering.

#### Constructor

```typescript
constructor(canvas: HTMLCanvasElement | OffscreenCanvas, theme: Theme)
```

#### Methods

##### `drawPiece(ctx: CanvasRenderingContext2D, piece: Piece, x: number, y: number, size: number): void`

Draw a piece at the specified position.

##### `updateTheme(theme: Theme): void`

Update the sprite theme.

## React Component

### NeoChessBoard (React)

React wrapper component for the core chess board.

#### Props

```typescript
interface NeoChessBoardProps {
  position?: string; // FEN string
  orientation?: 'white' | 'black';
  theme?: ThemeName | Theme;
  draggable?: boolean;
  showCoordinates?: boolean;
  onMove?: (move: Move) => void;
  onCheck?: () => void;
  onCheckmate?: () => void;
  onStalemate?: () => void;
  className?: string;
  style?: React.CSSProperties;
}
```

#### Usage

```typescript path=null start=null
import { NeoChessBoard } from 'neochessboard/react';

function App() {
  const handleMove = (move) => {
    console.log('Move made:', move);
  };

  return (
    <NeoChessBoard
      theme="dark"
      orientation="white"
      draggable={true}
      onMove={handleMove}
    />
  );
}
```

## Type Definitions

### BoardOptions

```typescript
interface BoardOptions {
  size?: number;
  orientation?: 'white' | 'black';
  interactive?: boolean;
  theme?: ThemeName | Theme;
  pieceSet?: PieceSet;
  showCoordinates?: boolean;
  animationMs?: number;
  highlightLegal?: boolean;
  fen?: string;
  rulesAdapter?: RulesAdapter;
  allowPremoves?: boolean;
  showArrows?: boolean;
  showHighlights?: boolean;
  rightClickHighlights?: boolean;
  maxArrows?: number;
  maxHighlights?: number;
  soundEnabled?: boolean;
  showSquareNames?: boolean;
  autoFlip?: boolean;
  soundUrl?: string;
  soundUrls?: Partial<Record<'white' | 'black', string>>;
}
```

> **Note:** When `showSquareNames` is enabled, the file letters and rank numbers remain on the bottom and left edges even when the board flips orientation, mirroring the behaviour of chess.com.

### Theme

```typescript
interface Theme {
  light: string;
  dark: string;
  boardBorder: string;
  whitePiece: string;
  blackPiece: string;
  pieceShadow: string;
  pieceStroke?: string;
  pieceHighlight?: string;
  moveFrom: string;
  moveTo: string;
  lastMove: string;
  premove: string;
  dot: string;
  arrow: string;
  squareNameColor: string;
}
```

### Move

```typescript
interface Move {
  from: Square;
  to: Square;
  piece: Piece;
  captured?: Piece;
  promotion?: PieceType;
  castling?: 'kingside' | 'queenside';
  enPassant?: boolean;
  ep?: boolean;
  check?: boolean;
  checkmate?: boolean;
  stalemate?: boolean;
}
```

### Piece

```typescript
interface Piece {
  type: PieceType;
  color: Color;
}

type PieceType = 'pawn' | 'rook' | 'knight' | 'bishop' | 'queen' | 'king';
type Color = 'white' | 'black';
```

### Square

```typescript
type Square = 'a1' | 'a2' | ... | 'h8'; // All 64 chess squares
```

### PGNHeaders

```typescript
interface PGNHeaders {
  Event?: string;
  Site?: string;
  Date?: string;
  Round?: string;
  White?: string;
  Black?: string;
  Result?: string;
  [key: string]: string | undefined;
}
```

### PgnMetadata

```typescript
interface PgnMetadata {
  Event?: string;
  Site?: string;
  Date?: string;
  Round?: string;
  White?: string;
  Black?: string;
  Result?: string;
  WhiteElo?: string;
  BlackElo?: string;
  TimeControl?: string;
  ECO?: string;
  Opening?: string;
  Variation?: string;
  Annotator?: string;
  FEN?: string;
  SetUp?: string;
  [key: string]: string | undefined;
}
```

### PgnMove

```typescript
interface PgnMove {
  moveNumber: number;
  white?: string;
  black?: string;
  whiteComment?: string;
  blackComment?: string;
  whiteAnnotations: PgnMoveAnnotations;
  blackAnnotations: PgnMoveAnnotations;
}
```

### PgnMoveAnnotations

```typescript
interface PgnMoveAnnotations {
  arrows: Arrow[];
  circles: SquareHighlight[];
  textComment: string;
}
```

### ParsedAnnotations

```typescript
interface ParsedAnnotations {
  arrows: Arrow[];
  highlights: Array<SquareHighlight & { color: string }>;
  textComment: string;
}
```

### Arrow

```typescript
interface Arrow {
  from: Square;
  to: Square;
  color: string;
}
```

### SquareHighlight

```typescript
interface SquareHighlight {
  square: Square;
  type: 'circle' | 'square';
  color: string;
}
```

## Utilities

### Chess Utilities

#### `parseSquare(square: string): [number, number] | null`

Convert algebraic notation to file/rank coordinates.

#### `squareToCoords(square: Square): [number, number]`

Convert square to board coordinates.

#### `coordsToSquare(file: number, rank: number): Square`

Convert coordinates to square notation.

#### `isValidSquare(square: string): boolean`

Validate if a string represents a valid chess square.

#### `oppositeColor(color: Color): Color`

Get the opposite color.

## Built-in Themes

### Available Themes

- **`classic`** – Neutral palette ideal for most UIs
- **`midnight`** – Dark theme with vivid highlights

### Using Themes

```typescript path=null start=null
import { registerTheme, THEMES } from 'neochessboard';

// Use a built-in preset by name
board.setTheme('classic');

// Register a reusable custom preset
registerTheme('sunset', {
  ...THEMES.midnight,
  moveFrom: 'rgba(255, 200, 87, 0.55)',
  moveTo: 'rgba(244, 114, 182, 0.45)',
});

board.setTheme('sunset');

// Apply an inline theme object directly
board.applyTheme({
  ...THEMES.classic,
  arrow: 'rgba(34, 197, 94, 0.9)',
});
```

#### `registerTheme(name: string, theme: Theme): Theme`

Add a custom preset to the global `THEMES` map. The function normalizes the theme and returns the stored copy.

- `name: string` – Unique identifier for the theme.
- `theme: Theme` – Theme definition to store.

#### `resolveTheme(theme: ThemeName | Theme): Theme`

Convert a theme name or object into the normalized structure used internally. Useful when you want to inspect or serialize a theme without registering it permanently.

## Error Handling

### Common Errors

#### `InvalidMoveError`

Thrown when attempting to make an invalid move.

#### `InvalidFenError`

Thrown when loading an invalid FEN string.

#### `InvalidSquareError`

Thrown when referencing a non-existent square.

### Error Handling Examples

```typescript path=null start=null
try {
  board.makeMove('e2', 'e5'); // Invalid move
} catch (error) {
  if (error instanceof InvalidMoveError) {
    console.log('Invalid move:', error.message);
  }
}

try {
  board.loadPosition('invalid fen');
} catch (error) {
  console.log('Invalid FEN:', error.message);
}
```

## Performance Considerations

### Canvas Optimization

- Use `OffscreenCanvas` when available for better performance
- Minimize redraws by only updating changed areas
- Use efficient sprite rendering for pieces

### Memory Management

- Call `destroy()` method when removing board instances
- Remove event listeners properly
- Clean up canvas contexts

## Browser Compatibility

### Minimum Requirements

- Modern browsers with Canvas API support
- ES2015+ JavaScript support
- For React: React 18+

### Feature Support

- **Canvas API**: Required for basic functionality
- **OffscreenCanvas**: Optional, used for performance optimization
- **ResizeObserver**: Optional, used for responsive sizing

## Examples

See the `examples/` directory and the demo application for comprehensive usage examples.

## Migration Guide

### From Version 0.0.x to 0.1.0

- No breaking changes in this initial release
- All APIs are stable for the 0.1.x series

---

For more detailed examples and guides, see the main [README.md](../README.md) and [examples documentation](./EXAMPLES.md).
