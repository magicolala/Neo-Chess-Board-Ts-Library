import type { ThemeName } from './themes';
import type { NeoChessBoard } from './NeoChessBoard';
import type { EventBus } from './EventBus';
import type { PgnNotation } from './PgnNotation';

export type Square = `${string}${number}`;
export type Color = 'w' | 'b';
export type Piece = 'K' | 'Q' | 'R' | 'B' | 'N' | 'P' | 'k' | 'q' | 'r' | 'b' | 'n' | 'p';
export type BoardOrientation = 'white' | 'black';

export interface SquareDataType {
  square: Square;
  fileLabel: string;
  rankLabel: string;
  fileIndex: number;
  rankIndex: number;
  columnIndex: number;
  rowIndex: number;
}

export type SquareMatrix = SquareDataType[][];

export interface PieceDataType {
  pieceType: Piece;
}

export interface DraggingPieceDataType extends PieceDataType {
  sourceSquare: Square;
  targetSquare: Square | null;
  pointerPosition: { x: number; y: number } | null;
}

export type PositionDataType = Partial<Record<Square, PieceDataType>>;

export interface PieceHandlerArgsBase {
  board: NeoChessBoard;
  position: PositionDataType;
  orientation: BoardOrientation;
}

export interface PieceCanDragHandlerArgs extends PieceHandlerArgsBase {
  square: Square;
  piece: PieceDataType;
}

export interface PieceDragHandlerArgs extends PieceHandlerArgsBase {
  sourceSquare: Square;
  targetSquare: Square | null;
  piece: DraggingPieceDataType;
}

export interface PieceDropHandlerArgs extends PieceDragHandlerArgs {
  newPosition: PositionDataType;
  previousPosition: PositionDataType;
}

export interface Move {
  from: Square;
  to: Square;
  promotion?: 'q' | 'r' | 'b' | 'n';
  captured?: string | null;
  san?: string;
  ep?: boolean;
}

export type PromotionPiece = Required<Move>['promotion'];

export type PromotionMode = 'move' | 'premove';

export type MoveNotation = 'san' | 'uci' | 'coord';

export interface PromotionRequest {
  from: Square;
  to: Square;
  color: Color;
  mode: PromotionMode;
  choices: PromotionPiece[];
  resolve: (choice: PromotionPiece) => void;
  cancel: () => void;
}

export interface ClockCallbacks {
  onClockStart?: (state: ClockState) => void;
  onClockPause?: (state: ClockState) => void;
  onClockChange?: (state: ClockState) => void;
  onFlag?: (payload: { color: Color; state: ClockState }) => void;
}

export interface ClockSideConfig {
  /**
   * Initial time in milliseconds for the side.
   */
  initial?: number;
  /**
   * Increment in milliseconds to add after each completed move.
   */
  increment?: number;
  /**
   * Override of the remaining time. Defaults to the initial value.
   */
  remaining?: number;
}

export interface ClockConfig {
  /**
   * Global initial time in milliseconds for both players or per-side overrides.
   */
  initial?: number | Partial<Record<Color, number>>;
  /**
   * Increment in milliseconds applied after each move (global or per-side).
   */
  increment?: number | Partial<Record<Color, number>>;
  /**
   * Explicit configuration overrides for each side.
   */
  sides?: Partial<Record<Color, ClockSideConfig>>;
  /**
   * Color whose clock is currently running. Defaults to the FEN turn.
   */
  active?: Color | null;
  /**
   * Whether the clock should start in a paused state.
   */
  paused?: boolean;
  /**
   * Callback hooks triggered when the board updates the clock state.
   */
  callbacks?: ClockCallbacks;
}

export interface ClockSideState {
  initial: number;
  increment: number;
  remaining: number;
  isFlagged: boolean;
}

export interface ClockState {
  white: ClockSideState;
  black: ClockSideState;
  active: Color | null;
  isPaused: boolean;
  isRunning: boolean;
  lastUpdatedAt: number | null;
}

export interface ClockStateUpdate {
  active?: Color | null;
  paused?: boolean;
  running?: boolean;
  white?: Partial<ClockSideState>;
  black?: Partial<ClockSideState>;
  timestamp?: number | null;
}

// New types for advanced features
export interface Arrow {
  from: Square;
  to: Square;
  color: string;
  width?: number;
  opacity?: number;
  knightMove?: boolean;
}

export interface ArrowStyleOptions {
  color?: string;
  width?: number;
  opacity?: number;
}

export type HighlightType = 'green' | 'red' | 'blue' | 'yellow' | 'orange' | 'purple' | 'circle';

export interface SquareHighlight {
  square: Square;
  type: HighlightType;
  color?: string;
  opacity?: number;
}

export interface Premove {
  from: Square;
  to: Square;
  promotion?: 'q' | 'r' | 'b' | 'n';
}

export interface DrawingState {
  arrows: Arrow[];
  highlights: SquareHighlight[];
  premove?: Premove;
  promotionPreview?: {
    square: Square;
    color: Color;
    piece?: PromotionPiece;
  };
}

export interface SquarePointerEventPayload {
  square: Square;
  piece: string | null;
  event: PointerEvent;
}

export interface SquareTransitionEventPayload extends SquarePointerEventPayload {
  relatedSquare: Square | null;
}

export interface PiecePointerEventPayload {
  square: Square;
  piece: string;
  event: PointerEvent;
}

export interface PieceDragEventPayload {
  from: Square;
  piece: string;
  over: Square | null;
  position: { x: number; y: number } | null;
  event: PointerEvent;
}

export interface PieceDropEventPayload {
  from: Square;
  piece: string;
  drop: Square | null;
  position: { x: number; y: number } | null;
  event: PointerEvent;
}

export type BoardSoundEventType = 'move' | 'capture' | 'check' | 'checkmate';
export type BoardSoundEventColor = 'white' | 'black';
export type BoardSoundEventUrl = string | Partial<Record<BoardSoundEventColor, string>>;
export type BoardSoundEventUrls = Partial<Record<BoardSoundEventType, BoardSoundEventUrl>>;

export interface BoardEventMap {
  move: { from: Square; to: Square; fen: string };
  illegal: { from: Square; to: Square; reason: string };
  update: { fen: string };
  promotion: PromotionRequest;
  clockChange: ClockState;
  clockStart: ClockState;
  clockPause: ClockState;
  clockFlag: { color: Color; state: ClockState };
  squareClick: SquarePointerEventPayload;
  squareMouseDown: SquarePointerEventPayload;
  squareMouseUp: SquarePointerEventPayload;
  squareRightClick: SquarePointerEventPayload;
  squareMouseOver: SquareTransitionEventPayload;
  squareMouseOut: SquareTransitionEventPayload;
  pieceClick: PiecePointerEventPayload;
  pieceDrag: PieceDragEventPayload;
  pieceDrop: PieceDropEventPayload;
  [event: string]: unknown;
}

export type VerboseHistoryEntry = { san: string } & Record<string, unknown>;

export interface ChessLike {
  history(options?: { verbose?: boolean }): string[] | VerboseHistoryEntry[];
  pgn?(): string;
  isDraw?(): boolean;
  isCheckmate(): boolean;
  isStalemate(): boolean;
  isThreefoldRepetition(): boolean;
  isInsufficientMaterial(): boolean;
  turn(): Color | string;
}

export type RulesMoveDetail = {
  from: Square;
  to: Square;
  san?: string;
} & Record<string, unknown>;

export interface RulesMoveResponse {
  ok: boolean;
  fen?: string;
  state?: unknown;
  move?: RulesMoveDetail;
  reason?: string;
}

export interface RulesAdapter {
  setFEN(fen: string): void;
  getFEN(): string;
  turn(): Color;
  movesFrom(square: Square): Move[];
  /**
   * Indicates whether the adapter supports SAN/LAN string move submissions.
   * Adapters should opt in explicitly to avoid accidental invocation with
   * unsupported argument shapes.
   */
  supportsSanMoves?: boolean;
  /**
   * Execute a move. When a string is provided it should be interpreted as SAN/LAN notation.
   */
  move(m: {
    from: Square;
    to: Square;
    promotion?: Move['promotion'];
  }): RulesMoveResponse | null | undefined;
  move(notation: string): RulesMoveResponse | null | undefined;
  undo(): boolean;
  isCheckmate?(): boolean;
  inCheck?(): boolean;
  isStalemate?(): boolean;
  isDraw(): boolean;
  isInsufficientMaterial(): boolean;
  isThreefoldRepetition(): boolean;
  reset?(): void;
  // Optional API if provided by chess.js
  getPGN?(): string; // chess.js exposes game.pgn(); we'll proxy it here
  header?: (h: Record<string, string>) => void; // chess.js header
  history?(): string[]; // Move history for annotation purposes
  toPgn?(includeHeaders?: boolean): string;
  loadPgn?(pgn: string): boolean;
  getPgnNotation?(): PgnNotation;
}

export interface Theme {
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
  moveHighlight: string;
  lastMove: string;
  premove: string;
  check: string;
  checkmate: string;
  stalemate: string;
  dot: string;
  arrow: string;
  squareNameColor: string;
}

export type ThemeOverrides = Partial<Theme>;

export type AnimationEasingName = 'linear' | 'ease' | 'ease-in' | 'ease-out' | 'ease-in-out';
export type AnimationEasing = AnimationEasingName | ((t: number) => number);

export interface BoardDragConfig {
  threshold?: number;
  snap?: boolean;
  ghost?: boolean;
  ghostOpacity?: number;
  cancelOnEsc?: boolean;
}

export interface BoardAnimationConfig {
  durationMs?: number;
  easing?: AnimationEasing;
}

export interface BoardConfiguration {
  drag?: BoardDragConfig;
  animation?: BoardAnimationConfig;
}

export type PieceSpriteImage =
  | HTMLImageElement
  | HTMLCanvasElement
  | HTMLVideoElement
  | ImageBitmap
  | OffscreenCanvas;

export type PieceSpriteSource = string | PieceSpriteImage;

export interface PieceSprite {
  image: PieceSpriteSource;
  scale?: number;
  offsetX?: number;
  offsetY?: number;
}

export type PieceSprites = Partial<Record<Piece, PieceSpriteSource | PieceSprite>>;

export interface PieceSet {
  pieces: PieceSprites;
  defaultScale?: number;
}

export type InlineStyle = Record<string, string | number>;

export type CanvasFill = string | CanvasGradient | CanvasPattern;

export interface SquareStyleOptions {
  fill?: CanvasFill;
  stroke?: CanvasFill;
  strokeWidth?: number;
}

export interface NotationStyleOptions {
  color?: string;
  fontFamily?: string;
  fontSize?: number | string;
  fontStyle?: string;
  fontWeight?: string | number;
  textTransform?: 'uppercase' | 'lowercase' | 'none';
  padding?: number;
  opacity?: number;
}

export interface SquareRendererParams {
  square: Square;
  isLight: boolean;
  element: HTMLDivElement;
  board: NeoChessBoard;
}

export type SquareRenderer = (params: SquareRendererParams) => void;

export interface PieceRendererParams {
  square: Square;
  piece: Piece;
  element: HTMLDivElement;
  board: NeoChessBoard;
}

export type PieceRenderer = (params: PieceRendererParams) => void;

export type PieceRendererMap = Partial<Record<Piece, PieceRenderer>>;

export interface BoardOptions {
  size?: number;
  orientation?: 'white' | 'black';
  boardOrientation?: 'white' | 'black';
  chessboardRows?: number;
  chessboardColumns?: number;
  interactive?: boolean;
  theme?: ThemeName | Theme;
  pieceSet?: PieceSet;
  showCoordinates?: boolean;
  animationMs?: number;
  animationDurationInMs?: number;
  animationEasing?: AnimationEasing;
  showAnimations?: boolean;
  highlightLegal?: boolean;
  fen?: string;
  position?: string;
  rulesAdapter?: RulesAdapter;
  // Additional options
  allowAutoScroll?: boolean;
  allowDragging?: boolean;
  allowDragOffBoard?: boolean;
  canDragPiece?: (params: PieceCanDragHandlerArgs) => boolean;
  dragActivationDistance?: number;
  dragSnapToSquare?: boolean;
  dragGhostPiece?: boolean;
  dragGhostOpacity?: number;
  dragCancelOnEsc?: boolean;
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
  soundEventUrls?: BoardSoundEventUrls;
  extensions?: ExtensionConfig[];
  onPromotionRequired?: (request: PromotionRequest) => void | Promise<void>;
  allowDrawingArrows?: boolean;
  arrows?: Arrow[];
  arrowOptions?: ArrowStyleOptions;
  onArrowsChange?: (arrows: Arrow[]) => void;
  clearArrowsOnClick?: boolean;
  id?: string;
  boardStyle?: InlineStyle;
  squareStyle?: SquareStyleOptions;
  lightSquareStyle?: SquareStyleOptions;
  darkSquareStyle?: SquareStyleOptions;
  squareStyles?: Partial<Record<Square, SquareStyleOptions>>;
  lightSquareNotationStyle?: NotationStyleOptions;
  darkSquareNotationStyle?: NotationStyleOptions;
  alphaNotationStyle?: NotationStyleOptions;
  numericNotationStyle?: NotationStyleOptions;
  showNotation?: boolean;
  squareRenderer?: SquareRenderer;
  pieces?: PieceRendererMap;
  clock?: ClockConfig;
}

export interface ExtensionContext<TOptions = unknown> {
  readonly id: string;
  readonly board: NeoChessBoard;
  readonly bus: EventBus<BoardEventMap>;
  readonly options: TOptions;
  readonly initialOptions: Readonly<BoardOptions>;
  registerExtensionPoint<K extends keyof BoardEventMap>(
    event: K,
    handler: (payload: BoardEventMap[K]) => void,
  ): () => void;
}

export interface Extension<TOptions = unknown> {
  onInit?(context: ExtensionContext<TOptions>): void;
  onBeforeRender?(context: ExtensionContext<TOptions>): void;
  onAfterRender?(context: ExtensionContext<TOptions>): void;
  onMove?(context: ExtensionContext<TOptions>, payload: BoardEventMap['move']): void;
  onIllegalMove?(context: ExtensionContext<TOptions>, payload: BoardEventMap['illegal']): void;
  onUpdate?(context: ExtensionContext<TOptions>, payload: BoardEventMap['update']): void;
  onDestroy?(context: ExtensionContext<TOptions>): void;
}

export interface ExtensionConfig<TOptions = unknown> {
  id?: string;
  options?: TOptions;
  create(context: ExtensionContext<TOptions>): Extension<TOptions> | void;
}

export interface PgnMoveAnnotations {
  arrows?: Arrow[];
  circles?: SquareHighlight[];
  textComment?: string;
  evaluation?: number | string;
}

export interface PgnMove {
  moveNumber: number;
  white?: string;
  black?: string;
  whiteComment?: string;
  blackComment?: string;
  whiteAnnotations?: PgnMoveAnnotations;
  blackAnnotations?: PgnMoveAnnotations;
  evaluation?: {
    white?: number | string;
    black?: number | string;
  };
}
