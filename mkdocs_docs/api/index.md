# API Documentation

## Core Classes

### NeoChessBoard

The main chess board class that handles rendering, interaction, and game state.

#### Constructor

```typescript
constructor(root: HTMLElement, options?: BoardOptions)
```

**Parameters:**

- `root: HTMLElement` - The container element that will host the rendered board layers
- `options?: BoardOptions` - Optional board configuration

#### Methods

##### `loadPosition(fen: string, immediate?: boolean): void`

Load a chess position from FEN notation.

**Parameters:**

- `fen: string` - Valid FEN string representing the position
- `immediate?: boolean` - Set to `false` to animate the transition instead of snapping instantly (defaults to `true`)

**Example:**

```typescript
board.loadPosition('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1');
```

##### `loadFEN(fen: string, immediate?: boolean): void`

Alias for `loadPosition` that mirrors popular chessboard APIs. Accepts the same parameters and clears interaction state by default.

**Parameters:**

- `fen: string` - Valid FEN string representing the position
- `immediate?: boolean` - Optional flag forwarded to `loadPosition`

##### `submitMove(notation: string): boolean`

Play a move using SAN (`"Nf3"`, `"exd5"`) or coordinate (`"e2e4"`) notation. The move is validated by the underlying rules
adapter.

**Parameters:**

- `notation: string` - Move string in SAN or coordinate notation

**Returns:**

- `boolean` - `true` if the move was executed, `false` if it was rejected

**Example:**

```typescript
board.submitMove('e4');
board.submitMove('Nf3');
```

##### `attemptMove(from: Square, to: Square, options?: { promotion?: PromotionPiece }): boolean`

Attempt to move a piece directly between two squares. Optionally provide a promotion piece when moving a pawn to the back rank.

**Parameters:**

- `from: Square` - Source square (e.g., 'e2')
- `to: Square` - Destination square (e.g., 'e4')
- `options?: { promotion?: PromotionPiece }` - Optional promotion configuration

**Returns:**

- `boolean` - `true` if the move was successful, `false` otherwise

**Example:**

```typescript
board.attemptMove('e7', 'e8', { promotion: 'q' });
```

##### `getPieceSquares(piece: Piece): Square[]`

Retrieve the list of squares containing a specific piece.

**Parameters:**

- `piece: Piece` - FEN-style piece symbol (`K`, `Q`, `R`, `B`, `N`, `P` for white, lowercase for black)

**Returns:**

- `Square[]` - Squares sorted from `a1` upward for deterministic inspection

##### `setTheme(theme: ThemeName | Theme): void`

Change the visual theme of the board.

**Parameters:**

- `theme: ThemeName | Theme` - Theme name or custom theme object

##### `setOrientation(orientation: 'white' | 'black'): void`

Flip the board orientation.

**Parameters:**

- `orientation: 'white' | 'black'` - Which color should be at the bottom

##### `setAutoFlip(autoFlip: boolean): void`

Enable or disable automatic board flipping based on the side to move.

**Parameters:**

- `autoFlip: boolean` - `true` to follow the active player, `false` to keep the current orientation

##### `setSoundEnabled(enabled: boolean): void`

Toggle move sounds without recreating the board instance.

**Parameters:**

- `enabled: boolean` - `true` to preload and play move sounds, `false` to release audio resources

##### `setSoundUrls(soundUrls: BoardOptions['soundUrls']): void`

Swap the audio clips used for move sounds. When sounds are enabled the board reinitialises its audio elements immediately.

**Parameters:**

- `soundUrls: BoardOptions['soundUrls']` - Optional map with `white` and/or `black` entries that override the default clip

##### `getClockState(): ClockState | null`

Return the current clock snapshot or `null` when no `clock` configuration has been provided.

##### `startClock(): void`

Start (or resume) the active side's timer. When a delay is configured it is applied before subtracting from the remaining time.

##### `pauseClock(): void`

Pause the running timer without losing any Bronstein delay that may still be available.

##### `resetClock(config?: Partial<ClockConfig> | null): void`

Reset the clock to its initial values. Pass a partial `ClockConfig` to change the control or `null` to remove the active clock.

##### `setClockTime(color: Color, milliseconds: number): void`

Force a side's remaining time to a specific value. Useful for adjudications or synchronising with an external arbiter.

##### `addClockTime(color: Color, milliseconds: number): void`

Increment a side's timer. If the clock had previously flagged this clears the flag as long as the new time is positive.

##### `setSoundEventUrls(soundEventUrls: BoardOptions['soundEventUrls']): void`

Update the per-event audio configuration (move, capture, check, checkmate, promote, illegal). Individual entries may be a single clip or a per-color map. Missing events automatically fall back to the move configuration and then to the legacy sound options.

**Parameters:**

- `soundEventUrls: BoardOptions['soundEventUrls']` - Optional map of event names to clip URLs or `{ white, black }` overrides. Supported keys: `move`, `capture`, `check`, `checkmate`, `promote`, `illegal`.

##### `configure(configuration: BoardConfiguration): void`

Update the board's runtime configuration without recreating the instance. You can tweak drag sensitivity, animation easing, or promotion behaviour (including inline UI and auto-queen) even while a promotion request is pending.

**Parameters:**

- `configuration: BoardConfiguration` - Partial configuration object. Supports `drag`, `animation`, and `promotion` keys.

##### `setBoardStyle(style?: InlineStyle): void`

Apply inline CSS to the board wrapper. Passing `undefined` clears previously assigned keys while leaving other styles untouched.

**Parameters:**

- `style?: InlineStyle` - CSS properties expressed as camelCase keys or CSS custom property names

##### `reset(immediate?: boolean): void`

Reset the board to the initial chess position.

**Parameters:**

- `immediate?: boolean` - Set to `false` to animate the reset instead of snapping instantly (defaults to `true`)

##### `exportPGN(options?: { includeHeaders?: boolean; includeComments?: boolean }): string`

Export the current game in PGN format with optional control over headers and in-line comments.

**Parameters:**

- `options?: { includeHeaders?: boolean; includeComments?: boolean }`
  - `includeHeaders` (default `true`) – Pass `false` to omit the metadata header section
  - `includeComments` (default `true`) – Pass `false` to strip `{...}` move comments from the output

**Returns:**

- `string` - PGN representation of the game

##### `destroy(): void`

Clean up event listeners and resources.

##### `previewPromotionPiece(piece: 'q' | 'r' | 'b' | 'n' | null): void`

Display a ghosted promotion piece on the target square while a promotion request is pending. Pass `null` to return to the
default highlight.

##### `isPromotionPending(): boolean`

Returns `true` while the board is waiting for a promotion choice.

##### `getPendingPromotion(): { from: Square; to: Square; color: 'w' | 'b'; mode: 'move' | 'premove' } | null`

Inspect the currently pending promotion request, if any.

##### `isDraw(): boolean`

Returns `true` if the underlying rules adapter reports a drawn position.

##### `isInsufficientMaterial(): boolean`

Returns `true` when the game cannot be won due to insufficient mating material.

##### `isThreefoldRepetition(): boolean`

Returns `true` when the current position has occurred at least three times.

##### `convertMoveNotation(notation: string, from: 'san' | 'uci' | 'coord', to: 'san' | 'uci' | 'coord'): string | null`

Translate a move between SAN, UCI, and coordinate styles using the current board position for context.

**Parameters:**

- `notation: string` - Source notation string
- `from: 'san' | 'uci' | 'coord'` - The notation of the input
- `to: 'san' | 'uci' | 'coord'` - Desired output notation

**Returns:**

- `string | null` - Converted notation, or `null` when parsing fails or the move is illegal in the current position

**Related helpers:**

- `sanToUci(san: string): string | null`
- `sanToCoordinates(san: string): string | null`
- `uciToSan(uci: string): string | null`
- `uciToCoordinates(uci: string): string | null`
- `coordinatesToSan(coord: string): string | null`
- `coordinatesToUci(coord: string): string | null`

## Utility Functions

The core utilities provide helpers for working with FEN strings and incremental board updates.

### `fenStringToPositionObject(fen: string, options?: FenStringToPositionObjectOptions): PositionDataType`

Convert a FEN string into a plain object keyed by algebraic square names. Each entry contains the corresponding `pieceType`,
allowing consumers to inspect or diff a position without parsing the FEN manually.

**Example:**

```typescript
import { fenStringToPositionObject, START_FEN } from 'neo-chess-board';

const position = fenStringToPositionObject(START_FEN);
// position.e2 => { pieceType: 'P' }
```

### `getPositionUpdates(previous: string | PositionDataType, next: string | PositionDataType, options?: GetPositionUpdatesOptions): PositionUpdateResult`

Compute the differences between two positions, returning the squares that were removed and the set of updated squares with
their new `pieceType`. The helper accepts both FEN strings and already-parsed position objects. When the board orientation
changes (for example, flipping from white to black), every occupied square is marked for re-rendering so DOM overlays can be
correctly repositioned.

**Example:**

```typescript
import { getPositionUpdates } from 'neo-chess-board';

const { added, removed } = getPositionUpdates('8/8/8/4P3/8/8/8/8 w - - 0 1', '8/8/8/8/4P3/8/8/8 b - - 0 1');
// removed => ['e4']
// added   => { e5: { pieceType: 'P' } }
```

`PositionDataType`, `PieceDataType`, `PieceCanDragHandlerArgs`, and related interfaces are exported alongside these helpers
so extensions and integrations can share a consistent shape when reacting to position updates or drag/drop lifecycle events.

#### Events

The board emits events through the EventBus system:

- `move` – Fired every time a legal move is executed. The payload contains the `from` and `to` squares as well as the resulting FEN string.
- `illegal` – Triggered when a move attempt is rejected. The payload exposes the attempted squares together with a `reason` string.
- `update` – Emitted whenever the board state changes (for example after a move, a FEN load, or a rewind) with the latest FEN.
- `promotion` – Fired with a `PromotionRequest` whenever a pawn reaches the back rank and the board needs a promotion choice.

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

Adapter for `chess.js` providing comprehensive chess rule validation and PGN integration. Supports both standard chess and Chess960 (Fischer Random Chess).

#### Constructor

```typescript
constructor(fenOrOptions?: string | ChessJsRulesOptions)
```

**Parameters:**

- `fenOrOptions?: string | ChessJsRulesOptions` - Optional initial FEN string or options object.
  - `fen?: string` - Optional initial FEN string to load.
  - `variant?: 'standard' | 'chess960'` - Chess variant (default: 'standard').

**Example:**

```typescript
// Standard chess
const rules = new ChessJsRules();

// Chess960
const rules960 = new ChessJsRules({ variant: 'chess960' });

// Chess960 with initial position
const rules960WithFen = new ChessJsRules({ 
  variant: 'chess960', 
  fen: generateChess960Start(42) 
});
```

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

##### `isDraw(): boolean`

Checks if the current position is a draw for any reason supported by the rules engine.

##### `isInsufficientMaterial(): boolean`

Checks if the game is drawn due to insufficient mating material.

##### `isThreefoldRepetition(): boolean`

Checks if the current position has occurred three times (threefold repetition).

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
interface NeoChessProps extends Omit<BoardOptions, 'fen' | 'rulesAdapter'> {
  fen?: string;
  className?: string;
  style?: React.CSSProperties;
  onMove?: (event: { from: Square; to: Square; fen: string }) => void;
  onIllegal?: (event: { from: Square; to: Square; reason: string }) => void;
  onUpdate?: (event: { fen: string }) => void;
  onClockChange?: (state: ClockState) => void;
  onClockStart?: (state: ClockState) => void;
  onClockPause?: (state: ClockState) => void;
  onClockFlag?: (event: BoardEventMap['clockFlag']) => void;
}
```

The component accepts every interactive option defined on [`BoardOptions`](#boardoptions) — such as `interactive`, `theme`, `allowPremoves`, `showHighlights`, `showArrows`, `soundEnabled`, `clock`, or `autoFlip` — in addition to the props above. Use a [`ref`](https://react.dev/reference/react/forwardRef) to access the imperative helpers exposed through `NeoChessRef` (`getBoard`, `addArrow`, `startClock`, `setClockTime`, `clearHighlights`, ...).

#### Usage

```typescript path=null start=null
import React, { useMemo, useRef, useState } from 'react';
import { NeoChessBoard, type NeoChessRef } from '@magicolala/neo-chess-board/react';
import { ChessJsRules, START_FEN } from '@magicolala/neo-chess-board';

const INITIAL_FEN = START_FEN; // 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1'

function App() {
  const [fen, setFen] = useState(INITIAL_FEN);
  const [status, setStatus] = useState<'playing' | 'check' | 'checkmate' | 'stalemate'>('playing');
  const boardRef = useRef<NeoChessRef>(null);
  const chessRules = useMemo(() => new ChessJsRules(INITIAL_FEN), []);

  const syncStatus = (nextFen: string) => {
    chessRules.setFEN(nextFen);
    if (chessRules.isCheckmate()) {
      setStatus('checkmate');
    } else if (chessRules.isStalemate()) {
      setStatus('stalemate');
    } else if (chessRules.inCheck()) {
      setStatus('check');
    } else {
      setStatus('playing');
    }
  };

  return (
    <NeoChessBoard
      ref={boardRef}
      fen={fen}
      theme="neo"
      interactive
      allowPremoves
      showCoordinates
      onMove={(event) => {
        setFen(event.fen);
        syncStatus(event.fen);
      }}
      onIllegal={(event) => {
        console.warn('Illegal move', event.reason);
      }}
      onUpdate={(event) => {
        setFen(event.fen);
        syncStatus(event.fen);
      }}
    />
  );
}
```

When the clock option is enabled the board also emits `clock:change`, `clock:start`, `clock:pause`, and `clock:flag` events. Combine the chessboard with `ChessJsRules` (or another rules adapter) if you need richer game-state insights such as detecting checks or stalemates.

## Type Definitions

### BoardOptions

```typescript
interface BoardOptions {
  size?: number;
  orientation?: 'white' | 'black';
  boardOrientation?: 'white' | 'black';
  chessboardRows?: number;
  chessboardColumns?: number;
  interactive?: boolean;
  theme?: ThemeName | Theme;
  pieceSet?: PieceSet;
  showCoordinates?: boolean;
  animation?: { duration?: number; easing?: AnimationEasing };
  animationDurationInMs?: number;
  animationEasing?: AnimationEasing;
  animationMs?: number;
  showAnimations?: boolean;
  highlightLegal?: boolean;
  fen?: string;
  position?: string;
  variant?: 'standard' | 'chess960';
  rulesAdapter?: RulesAdapter;
  clock?: ClockConfig;
  allowAutoScroll?: boolean;
  allowDragging?: boolean;
  allowDragOffBoard?: boolean;
  allowDrawingArrows?: boolean;
  arrows?: Arrow[];
  arrowOptions?: { color?: string; width?: number; opacity?: number };
  onArrowsChange?: (arrows: Arrow[]) => void;
  clearArrowsOnClick?: boolean;
  canDragPiece?: (params: { square: Square; piece: string; board: NeoChessBoard }) => boolean;
  dragActivationDistance?: number;
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
  soundEventUrls?: Partial<
    Record<
      'move' | 'capture' | 'check' | 'checkmate' | 'promote' | 'illegal',
      string | Partial<Record<'white' | 'black', string>>
    >
  >;
  captureEffect?: {
    enabled?: boolean;
    durationMs?: number;
    palette?: string[];
    effect?: 'sparkles' | 'ripple';
    renderer?: CaptureEffectRenderer;
  };
  onPromotionRequired?: (request: PromotionRequest) => void;
  promotion?: { autoQueen?: boolean; ui?: 'dialog' | 'inline' };
}
```

> **Tip:** Use the `animation` object to configure move animations. `AnimationEasing` accepts the built-in names (`'linear'`, `'ease'`, `'ease-in'`, `'ease-out'`, `'ease-in-out'`) or a custom function that receives progress from 0 to 1.

> **Note:** When `showSquareNames` is enabled, the file letters and rank numbers remain on the bottom and left edges even when the board flips orientation, mirroring the behaviour of chess.com.

Enable `captureEffect.enabled` to overlay a short particle burst on the captured square. Tune it with `durationMs`, `palette`, or an alternate `effect` style. Advanced consumers can pass `renderer` (or the React prop `captureEffectRenderer`) to draw custom visuals on the provided overlay container instead of the built-in sparkles.

### BoardConfiguration

```typescript
interface BoardConfiguration {
  drag?: {
    threshold?: number;
    snap?: boolean;
    ghost?: boolean;
    ghostOpacity?: number;
    cancelOnEsc?: boolean;
  };
  animation?: {
    durationMs?: number;
    easing?: AnimationEasing;
  };
  promotion?: {
    autoQueen?: boolean;
    ui?: 'dialog' | 'inline';
  };
### ClockConfig

```typescript
interface ClockConfig {
  initial?: number | Partial<Record<Color, number>>;
  increment?: number | Partial<Record<Color, number>>;
  sides?: Partial<Record<Color, { initial?: number; increment?: number; remaining?: number }>>;
  active?: Color | null;
  paused?: boolean;
  callbacks?: ClockCallbacks;
}

interface ClockCallbacks {
  onClockChange?(state: ClockState): void;
  onClockStart?(): void;
  onClockPause?(): void;
  onFlag?(payload: { color: Color; remaining: number }): void;
}

interface ClockSideState {
  initial: number;
  increment: number;
  delay: number;
  remaining: number;
  delayRemaining: number;
  isFlagged: boolean;
}

interface ClockState {
  white: ClockSideState;
  black: ClockSideState;
  active: Color | null;
  isPaused: boolean;
  isRunning: boolean;
  lastUpdatedAt: number | null;
}
```

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
  check?: string;
  checkmate?: string;
  stalemate?: string;
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

### PromotionRequest

```typescript
interface PromotionRequest {
  from: Square;
  to: Square;
  color: 'w' | 'b';
  mode: 'move' | 'premove';
  choices: Array<'q' | 'r' | 'b' | 'n'>;
  resolve(choice: 'q' | 'r' | 'b' | 'n'): void;
  cancel(): void;
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
import { registerTheme, THEMES } from '@magicolala/neo-chess-board';

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

For more detailed examples and guides, see the main [README.md](https://github.com/magicolala/Neo-Chess-Board-Ts-Library/blob/main/README.md) and the [examples documentation](examples.md).
