import type { ThemeName } from './themes';
import type { NeoChessBoard } from './NeoChessBoard';
import type { EventBus } from './EventBus';
import type { PgnNotation } from './PgnNotation';

export type Square =
  `${'a' | 'b' | 'c' | 'd' | 'e' | 'f' | 'g' | 'h'}${'1' | '2' | '3' | '4' | '5' | '6' | '7' | '8'}`;
export type Color = 'w' | 'b';
export type Piece = 'K' | 'Q' | 'R' | 'B' | 'N' | 'P' | 'k' | 'q' | 'r' | 'b' | 'n' | 'p';

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

export interface PromotionRequest {
  from: Square;
  to: Square;
  color: Color;
  mode: PromotionMode;
  choices: PromotionPiece[];
  resolve: (choice: PromotionPiece) => void;
  cancel: () => void;
}

// Nouveaux types pour les fonctionnalités avancées
export interface Arrow {
  from: Square;
  to: Square;
  color: string;
  width?: number;
  opacity?: number;
  knightMove?: boolean;
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

export interface BoardEventMap {
  move: { from: Square; to: Square; fen: string };
  illegal: { from: Square; to: Square; reason: string };
  update: { fen: string };
  promotion: PromotionRequest;
  [event: string]: unknown;
}

export type VerboseHistoryEntry = { san: string } & Record<string, unknown>;

export interface ChessLike {
  history(options?: { verbose?: boolean }): string[] | VerboseHistoryEntry[];
  pgn?(): string;
  isCheckmate(): boolean;
  isStalemate(): boolean;
  isThreefoldRepetition(): boolean;
  isInsufficientMaterial(): boolean;
  turn(): Color | string;
}

export interface RulesMoveResponse {
  ok: boolean;
  fen?: string;
  state?: unknown;
  move?: unknown;
  reason?: string;
}

export interface RulesAdapter {
  setFEN(fen: string): void;
  getFEN(): string;
  turn(): Color;
  movesFrom(square: Square): Move[];
  move(m: {
    from: Square;
    to: Square;
    promotion?: Move['promotion'];
  }): RulesMoveResponse | null | undefined;
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
  lastMove: string;
  premove: string;
  dot: string;
  arrow: string;
  squareNameColor: string;
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

export interface BoardOptions {
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
  // Nouvelles options
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
  extensions?: ExtensionConfig[];
  onPromotionRequired?: (request: PromotionRequest) => void | Promise<void>;
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
