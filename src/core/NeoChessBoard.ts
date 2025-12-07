import { ClockManager } from '../clock/ClockManager';
import type { ClockEvents } from '../clock/types';
import { CameraEffects } from '../effects/CameraEffects';
import type { CameraTransform } from '../effects/types';
import { EventBus } from './EventBus';
import {
  parseFEN,
  isWhitePiece,
  sq,
  sqToFR,
  clamp,
  lerp,
  START_FEN,
  generateFileLabels,
  generateRankLabels,
  resolveBoardGeometry,
  fenStringToPositionObject,
  DEFAULT_ANIMATION_EASING as DEFAULT_ANIMATION_EASING_NAME,
  resolveAnimationEasing,
} from './utils';
import { generateChess960Start } from '../utils/chess960';
import type { ParsedFENState } from './utils';
import { resolveTheme } from './themes';
import type { ThemeName } from './themes';
import { FlatSprites } from './FlatSprites';
import type { DrawingManager } from './DrawingManager';
import { BoardDomManager } from './BoardDomManager';
import { BoardAudioManager, type BoardSoundEventType } from './BoardAudioManager';
import { BoardEventManager, type BoardPointerEventPoint } from './BoardEventManager';
import { CanvasRenderer } from '../rendering/CanvasRenderer';
import type { PgnNotation } from './PgnNotation';
import { ChessGame } from './logic/ChessGame';
import { PgnParseError } from './errors';
import { CaptureEffectManager } from './CaptureEffectManager';
import { LegalMovesWorkerManager } from './LegalMovesWorkerManager';
import { PgnParserWorkerManager } from './PgnParserWorkerManager';
import { RuleEngine } from './RuleEngine';
import type {
  Square,
  Color,
  BoardOptions,
  Move,
  RulesAdapter,
  Arrow,
  SquareHighlight,
  Premove,
  BoardPremoveController,
  BoardPremoveEnableOptions,
  BoardPremoveControllerConfig,
  BoardPremoveSettings,
  BoardCameraEffectsOptions,
  Theme,
  Piece,
  PieceSet,
  PieceSprite,
  PieceSpriteSource,
  PieceSpriteImage,
  BoardEventMap,
  PremoveAppliedEvent,
  PremoveInvalidatedEvent,
  Extension,
  ExtensionConfig,
  ExtensionContext,
  PromotionRequest,
  PromotionMode,
  PromotionPiece,
  PromotionOptions,
  RulesMoveDetail,
  RulesMoveResponse,
  PgnMoveAnnotations,
  ArrowStyleOptions,
  InlineStyle,
  SquareStyleOptions,
  NotationStyleOptions,
  SquareRenderer,
  PieceRendererMap,
  PieceRenderer,
  ClockState,
  ClockConfig,
  ThemeOverrides,
  BoardConfiguration,
  BoardAnimationConfig,
  AnimationEasing,
  AnimationEasingName,
  StatusHighlight,
  MoveNotation,
  ColorInput,
  PremoveColorOption,
  PremoveColorListInput,
  Variant,
} from './types';

// ============================================================================
// Constants
// ============================================================================

const DEFAULT_BOARD_SIZE = 480;
const DEFAULT_ANIMATION_MS = 300;
const SPRITE_SIZE = 128;
const DEFAULT_BOARD_RANKS = 8;
const DEFAULT_BOARD_FILES = 8;
const DEFAULT_GHOST_OPACITY = 0.35;
const DRAG_SCALE = 1.05;
const LEGAL_MOVE_DOT_RADIUS = 0.12;
const ARROW_HEAD_SIZE_FACTOR = 0.25;
const ARROW_THICKNESS_FACTOR = 0.08;
const MIN_ARROW_HEAD_SIZE = 16;
const MIN_ARROW_THICKNESS = 6;
const ARROW_OPACITY = 0.95;
const PREMOVE_EXECUTION_DELAY = 150;
const POST_MOVE_PREMOVE_DELAY = 50;

type AnimationEasingId = AnimationEasingName | 'custom';

const REQUIRED_THEME_KEYS: (keyof Theme)[] = [
  'light',
  'dark',
  'boardBorder',
  'whitePiece',
  'blackPiece',
  'pieceShadow',
  'moveFrom',
  'moveTo',
  'moveHighlight',
  'lastMove',
  'premove',
  'check',
  'checkmate',
  'stalemate',
  'dot',
  'arrow',
  'squareNameColor',
];

const PROMOTION_CHOICES: PromotionPiece[] = ['q', 'r', 'b', 'n'];
const PGN_COMMENT_REGEX = /\s*\{[^{}]*\}\s*/g;
const MULTIPLE_SPACE_REGEX = /[ \t]{2,}/g;
const SPACED_NEWLINE_REGEX = / ?\n ?/g;
const MULTIPLE_NEWLINES_REGEX = /\n{3,}/g;

const PIECE_INDEX_MAP: Record<string, number> = {
  k: 0,
  q: 1,
  r: 2,
  b: 3,
  n: 4,
  p: 5,
};

// ============================================================================
// Interfaces
// ============================================================================

type BoardState = ParsedFENState;

interface ResolvedPieceSprite {
  image: PieceSpriteImage;
  scale: number;
  offsetX: number;
  offsetY: number;
}

type SquarePointerEventName =
  | 'squareClick'
  | 'squareMouseDown'
  | 'squareMouseUp'
  | 'squareRightClick';
type SquareTransitionEventName = 'squareMouseOver' | 'squareMouseOut';
type ParsedPgnResult = Awaited<ReturnType<PgnParserWorkerManager['parsePgn']>>;

interface ExtensionState {
  id: string;
  config: ExtensionConfig<unknown>;
  context: ExtensionContext<unknown> | null;
  instance: Extension<unknown> | null;
  disposers: Array<() => void>;
  initialized: boolean;
  destroyed: boolean;
}

interface PendingPromotionState {
  token: number;
  from: Square;
  to: Square;
  color: 'w' | 'b';
  mode: PromotionMode;
  request: PromotionRequest;
}

type Point = BoardPointerEventPoint;

interface DraggingState {
  from: Square;
  piece: string;
  x: number;
  y: number;
}

type PendingPromotionSummary = Pick<PendingPromotionState, 'from' | 'to' | 'color' | 'mode'>;

export type RenderLayer = 'board' | 'pieces' | 'overlay';
export type RenderCommandType = 'clear' | 'fill' | 'sprite';

export interface RenderDebugRect {
  layer: RenderLayer;
  type: RenderCommandType;
  rect: { x: number; y: number; width: number; height: number };
}

export type RenderObserver = (commands: RenderDebugRect[]) => void;

// ============================================================================
// Main Class
// ============================================================================

export class NeoChessBoard {
  // ---- Event & DOM ----
  public bus = new EventBus<BoardEventMap>();
  private game!: ChessGame;
  private root: HTMLElement;
  private cBoard!: HTMLCanvasElement;
  private cPieces!: HTMLCanvasElement;
  private cOverlay!: HTMLCanvasElement;
  private ctxB!: CanvasRenderingContext2D;
  private ctxP!: CanvasRenderingContext2D;
  private ctxO!: CanvasRenderingContext2D;
  private canvasRenderer!: CanvasRenderer;
  private ruleEngine!: RuleEngine;
  private domOverlay?: HTMLDivElement;
  private squareLayer?: HTMLDivElement;
  private pieceLayer?: HTMLDivElement;
  private baseSquareStyle?: SquareStyleOptions;
  private lightSquareStyleOptions?: SquareStyleOptions;
  private darkSquareStyleOptions?: SquareStyleOptions;
  private squareStylesMap?: Partial<Record<Square, SquareStyleOptions>>;
  private boardInlineStyle?: InlineStyle;
  private lightNotationStyle?: NotationStyleOptions;
  private darkNotationStyle?: NotationStyleOptions;
  private alphaNotationStyle?: NotationStyleOptions;
  private numericNotationStyle?: NotationStyleOptions;
  private customSquareRenderer?: SquareRenderer;
  private customPieceRenderers?: PieceRendererMap;
  private squareElements = new Map<Square, HTMLDivElement>();
  private pieceElements = new Map<Square, HTMLDivElement>();
  private captureEffectManager?: CaptureEffectManager;
  private boardId?: string;
  public cameraEffects: CameraEffects | null = null;
  private cameraEffectsOptions: BoardCameraEffectsOptions = {};

  // ---- Rules & State ----
  private get rules(): RulesAdapter {
    return this.game.rules;
  }

  private set rules(adapter: RulesAdapter) {
    this.game.rules = adapter;
  }

  private get state(): BoardState {
    return this.game.state;
  }

  private set state(next: BoardState) {
    this.game.state = next;
  }
  private lastPgnLoadIssues: PgnParseError[] = [];

  // ---- Visual Configuration ----
  private theme: Theme = resolveTheme('classic');
  private orientation: 'white' | 'black' = 'white';
  private sprites!: FlatSprites;
  private sizePx = DEFAULT_BOARD_SIZE;
  private square = 60;
  private dpr = 1;
  private filesCount = DEFAULT_BOARD_FILES;
  private ranksCount = DEFAULT_BOARD_RANKS;
  private fileLabels = generateFileLabels(DEFAULT_BOARD_FILES);
  private rankLabels = generateRankLabels(DEFAULT_BOARD_RANKS);

  // ---- Feature Flags ----
  private interactive: boolean;
  private showCoords: boolean;
  private highlightLegal: boolean;
  private get allowPremoves(): boolean {
    return this.game.allowPremoves;
  }

  private set allowPremoves(value: boolean) {
    this.game.allowPremoves = value;
  }
  private showArrows: boolean;
  private showHighlights: boolean;
  private rightClickHighlights: boolean;
  private allowDrawingArrows: boolean;
  private clearArrowsOnClick: boolean;
  private soundEnabled: boolean;
  private showSquareNames: boolean;
  private autoFlip: boolean;
  private allowAutoScroll: boolean;
  private allowDragging: boolean;
  private allowDragOffBoard: boolean;
  private renderObserver?: RenderObserver;
  private renderFrameRects: RenderDebugRect[] = [];
  private isRenderCaptureActive = false;
  private animationMs: number;
  private showAnimations: boolean;
  private canDragPiece?: BoardOptions['canDragPiece'];
  private dragActivationDistance: number;
  private dragSnapToSquare: boolean;
  private dragGhostPiece: boolean;
  private dragGhostOpacity: number;
  private dragCancelOnEsc: boolean;
  private animationEasingName: AnimationEasingId;
  private animationEasingFn: (t: number) => number;
  private arrowOptions?: ArrowStyleOptions;
  private onArrowsChange?: BoardOptions['onArrowsChange'];
  private controlledArrows?: Arrow[];
  private readonly drawingManagerArrowsChangeHandler = (arrows: Arrow[]): void => {
    this.onArrowsChange?.(arrows);
  };

  // ---- Managers ----
  public drawingManager!: DrawingManager;
  private domManager!: BoardDomManager;
  private audioManager: BoardAudioManager;
  private eventManager?: BoardEventManager;

  // ---- Audio ----

  // ---- Interaction State ----
  private get _lastMove(): { from: Square; to: Square } | null {
    return this.game.lastMove;
  }

  private set _lastMove(move: { from: Square; to: Square } | null) {
    this.game.lastMove = move;
  }

  private get _premove(): { from: Square; to: Square; promotion?: PromotionPiece } | null {
    const premove = this.game.premove;
    return premove ? { ...premove } : null;
  }

  private set _premove(premove: { from: Square; to: Square; promotion?: PromotionPiece } | null) {
    this.game.premove = premove ? { ...premove } : null;
  }

  private get _premoveQueues(): Record<Color, Premove[]> {
    return this.game.premoveQueues;
  }

  private set _premoveQueues(queues: Record<Color, Premove[]>) {
    this.game.premoveQueues = queues;
  }

  private get _premoveSettings(): { multi: boolean; colors: Record<Color, boolean> } {
    return this.game.premoveSettings;
  }

  private set _premoveSettings(settings: { multi: boolean; colors: Record<Color, boolean> }) {
    this.game.premoveSettings = settings;
  }
  public readonly premove: BoardPremoveController;
  private _selected: Square | null = null;
  private _legalCached: Move[] | null = null;
  private _legalMovesWorkerManager?: LegalMovesWorkerManager;
  private _pgnParserWorkerManager?: PgnParserWorkerManager;
  private static workerSupportWarned = false;
  private _useWorkerForLegalMoves: boolean;
  private _useWorkerForPgnParsing: boolean;
  private _pgnWorkerThreshold: number;
  private _dragging: DraggingState | null = null;
  private _hoverSq: Square | null = null;
  private _pointerSquare: Square | null = null;
  private _pendingDrag: {
    from: Square;
    piece: string;
    startClientX: number;
    startClientY: number;
    startX: number;
    startY: number;
  } | null = null;
  private _arrows: Array<{ from: Square; to: Square; color?: string }> = [];
  private _customHighlights: { squares: Square[] } | null = null;
  private _drawingArrow: { from: Square } | null = null;

  // ---- Animation ----
  private _raf = 0;

  // ---- Auto-scroll ----
  private _scrollContainer: HTMLElement | null = null;

  // ---- Piece Sprites ----
  private customPieceSprites: Partial<Record<Piece, ResolvedPieceSprite>> = {};
  private _pieceSetToken = 0;
  private _pieceSetRaw?: PieceSet;

  // ---- Promotion ----
  private promotionHandler?: BoardOptions['onPromotionRequired'];
  private _pendingPromotion: PendingPromotionState | null = null;
  private _promotionToken = 0;
  private promotionOptions: { autoQueen: boolean; ui: 'dialog' | 'inline' } = {
    autoQueen: false,
    ui: 'dialog',
  };
  private inlinePromotionContainer?: HTMLDivElement;
  private inlinePromotionButtons: HTMLButtonElement[] = [];
  private inlinePromotionToken: number | null = null;

  // ---- Clock ----
  private get clockManager(): ClockManager | null {
    return this.game.clockManager;
  }

  private set clockManager(manager: ClockManager | null) {
    this.game.clockManager = manager;
  }

  // ---- Extensions ----
  private extensionStates: ExtensionState[] = [];
  private readonly initialOptions: BoardOptions;

  // ============================================================================
  // Constructor
  // ============================================================================

  constructor(root: HTMLElement, options: BoardOptions = {}) {
    this.root = root;
    this.initialOptions = { ...options };

    this._configureVisualOptions(options);
    const { premoveSettings, allowPremoves, variant, initialFen } = this._resolveGameSetup(options);
    this.animationMs = this._resolveAnimationMs(options);
    this.showAnimations = options.showAnimations !== false;

    this.game = new ChessGame({
      fen: initialFen,
      variant,
      rulesAdapter: options.rulesAdapter,
      premove: premoveSettings,
      allowPremoves,
      clock: options.clock,
      bus: this.bus,
      geometry: {
        files: this.filesCount,
        ranks: this.ranksCount,
        fileLabels: this.fileLabels,
        rankLabels: this.rankLabels,
      },
    });
    this.ruleEngine = new RuleEngine(() => this.rules);

    // Initialize feature flags
    this.interactive = options.interactive !== false;
    this.showCoords = options.showCoordinates || false;
    this.highlightLegal = options.highlightLegal !== false;
    this._applyInitialPremoveSettings(premoveSettings);
    this.allowPremoves = allowPremoves;
    this.showArrows = options.showArrows !== false;
    this.showHighlights = options.showHighlights !== false;
    this.rightClickHighlights = options.rightClickHighlights !== false;
    this.allowDrawingArrows = options.allowDrawingArrows !== false;
    this.clearArrowsOnClick = options.clearArrowsOnClick === true;
    this.soundEnabled = options.soundEnabled !== false;
    const showNotationOption = options.showNotation ?? options.showSquareNames;
    this.showSquareNames = Boolean(showNotationOption);
    this.autoFlip = options.autoFlip ?? false;
    const cameraEffectsOptions = options.cameraEffects ?? {};
    this.cameraEffectsOptions = {
      ...cameraEffectsOptions,
      enabled: cameraEffectsOptions.enabled !== false,
      maxZoom: cameraEffectsOptions.maxZoom ?? 3,
      minZoom: cameraEffectsOptions.minZoom ?? 0.5,
      defaultDuration: cameraEffectsOptions.defaultDuration,
      defaultEasing: cameraEffectsOptions.defaultEasing,
      zoomOnMove: cameraEffectsOptions.zoomOnMove ?? false,
      shakeOnCapture: cameraEffectsOptions.shakeOnCapture !== false,
      shakeOnCheckmate: cameraEffectsOptions.shakeOnCheckmate !== false,
      captureShakeIntensity: cameraEffectsOptions.captureShakeIntensity ?? 0.3,
      captureShakeDuration: cameraEffectsOptions.captureShakeDuration ?? 200,
      checkmateShakeIntensity: cameraEffectsOptions.checkmateShakeIntensity ?? 0.8,
      checkmateShakeDuration: cameraEffectsOptions.checkmateShakeDuration ?? 600,
    };
    this.allowAutoScroll = options.allowAutoScroll === true;
    this.allowDragging = options.allowDragging !== false;
    this.allowDragOffBoard = options.allowDragOffBoard !== false;
    this.canDragPiece = options.canDragPiece;
    const activationDistance =
      typeof options.dragActivationDistance === 'number' &&
      Number.isFinite(options.dragActivationDistance)
        ? options.dragActivationDistance
        : 0;
    this.dragActivationDistance = Math.max(0, activationDistance);
    this.dragSnapToSquare = options.dragSnapToSquare ?? false;
    this.dragGhostPiece = options.dragGhostPiece !== false;
    const ghostOpacityOption = options.dragGhostOpacity;
    this.dragGhostOpacity =
      typeof ghostOpacityOption === 'number' && Number.isFinite(ghostOpacityOption)
        ? clamp(ghostOpacityOption, 0, 1)
        : DEFAULT_GHOST_OPACITY;
    this.dragCancelOnEsc = options.dragCancelOnEsc !== false;
    const defaultEasing = resolveAnimationEasing(undefined, DEFAULT_ANIMATION_EASING_NAME);
    this.animationEasingName = defaultEasing.name;
    this.animationEasingFn = defaultEasing.fn;
    const animationOptions = options.animation;
    const hasAnimationEasing =
      animationOptions && Object.prototype.hasOwnProperty.call(animationOptions, 'easing');
    const initialEasing = hasAnimationEasing ? animationOptions?.easing : options.animationEasing;
    this._setAnimationEasing(initialEasing);
    this.arrowOptions = options.arrowOptions;
    this.onArrowsChange = options.onArrowsChange;
    this.controlledArrows = options.arrows;
    this.premove = this._createPremoveController();

    // Initialize Web Workers for performance (skip when not supported, e.g. Node/JSDOM)
    const workersSupported = typeof Worker !== 'undefined';
    this._useWorkerForLegalMoves = workersSupported && (options.useWorkerForLegalMoves ?? false);
    this._useWorkerForPgnParsing = workersSupported && (options.useWorkerForPgnParsing ?? true);
    this._pgnWorkerThreshold = options.pgnWorkerThreshold ?? 100 * 1024; // 100KB default

    if (
      !workersSupported &&
      !NeoChessBoard.workerSupportWarned &&
      (options.useWorkerForLegalMoves || options.useWorkerForPgnParsing !== false)
    ) {
      console.warn(
        '[NeoChessBoard] Web Workers are not available in this environment; worker features disabled.',
      );
      NeoChessBoard.workerSupportWarned = true;
    }

    if (this._useWorkerForLegalMoves) {
      try {
        this._legalMovesWorkerManager = new LegalMovesWorkerManager();
      } catch (error) {
        console.warn('Failed to initialize LegalMovesWorkerManager:', error);
        this._useWorkerForLegalMoves = false;
      }
    }

    if (this._useWorkerForPgnParsing) {
      try {
        this._pgnParserWorkerManager = new PgnParserWorkerManager();
      } catch (error) {
        console.warn('Failed to initialize PgnParserWorkerManager:', error);
        this._useWorkerForPgnParsing = false;
      }
    }

    // Initialize sound configuration
    this.audioManager = new BoardAudioManager({
      enabled: this.soundEnabled,
      soundUrl: options.soundUrl,
      soundUrls: options.soundUrls,
      soundEventUrls: options.soundEventUrls,
    });
    this.audioManager.initialize();
    this.promotionHandler = options.onPromotionRequired;
    this._updatePromotionOptions(options.promotion);

    // Initialize rules and state
    this.state = this.game.state;
    this._syncOrientationFromTurn(true);

    // Initialize extensions
    this._initializeExtensions(options.extensions);

    // Build and setup
    this.domManager = new BoardDomManager({
      root: this.root,
      boardId: this.boardId,
      boardInlineStyle: this.boardInlineStyle,
      filesCount: this.filesCount,
      ranksCount: this.ranksCount,
      fileLabels: this.fileLabels,
      rankLabels: this.rankLabels,
      orientation: this.orientation,
      showSquareNames: this.showSquareNames,
      allowDrawingArrows: this.allowDrawingArrows,
      arrowOptions: this.arrowOptions,
      clearArrowsOnClick: this.clearArrowsOnClick,
      controlledArrows: this.controlledArrows,
      lightNotationStyle: this.lightNotationStyle,
      darkNotationStyle: this.darkNotationStyle,
      alphaNotationStyle: this.alphaNotationStyle,
      numericNotationStyle: this.numericNotationStyle,
      onArrowsChange: this.drawingManagerArrowsChangeHandler,
      onResizeRequested: () => this.resize(),
      theme: this.theme,
      spriteSize: SPRITE_SIZE,
    });
    const domResult = this.domManager.build();
    this.cBoard = domResult.cBoard;
    this.cPieces = domResult.cPieces;
    this.cOverlay = domResult.cOverlay;
    this.ctxB = domResult.ctxBoard;
    this.ctxP = domResult.ctxPieces;
    this.ctxO = domResult.ctxOverlay;
    this.domOverlay = domResult.domOverlay;
    this.squareLayer = domResult.squareLayer;
    this.pieceLayer = domResult.pieceLayer;
    this.drawingManager = domResult.drawingManager;
    this.sprites = domResult.sprites;
    this.captureEffectManager = new CaptureEffectManager({
      overlayRoot: this.domOverlay ?? this.root,
      getSquareBounds: (square) => this._squareCssBounds(square),
      options: options.captureEffect,
      board: this,
    });
    this.squareElements.clear();
    this.pieceElements.clear();
    this._applyNotationStyles();

    this.cameraEffects = new CameraEffects(
      {
        getViewportSize: () => this._getViewportSize(),
        getSquareBounds: (square) => this._getSquareBounds(square as Square),
        requestRender: () => this.renderAll(),
        emit: (event, payload) => this.bus.emit(event, payload as BoardEventMap[typeof event]),
      },
      this.cameraEffectsOptions,
    );

    this.canvasRenderer = new CanvasRenderer(
      () => this.cameraEffects?.getCurrentTransform() ?? null,
    );

    this._invokeExtensionHook('onInit');

    this.eventManager = new BoardEventManager(this.cOverlay, {
      cancelActiveDrag: () => {
        if (!this._dragging) {
          return false;
        }
        this._clearInteractionState();
        this.renderAll();
        return true;
      },
      handleLeftMouseDown: (event) => this._handleLeftMouseDown(event),
      handleLeftMouseUp: (event) => this._handleLeftMouseUp(event),
      handleMouseMove: (event, point) => this._handleMouseMove(event, point),
      handleRightMouseDown: (event) => this._handleRightMouseDown(event),
      handleRightMouseUp: (event) => this._handleRightMouseUp(event),
      handleEscapeKey: () => this._handleEscapeKey(),
      getPointerPosition: (event) => this._getPointerPosition(event),
      isInteractive: () => this.interactive,
      allowDragging: () => this.allowDragging,
      allowRightClickHighlights: () => this.rightClickHighlights,
    });
    this.eventManager.attach();
    this.resize();

    this._initializePieceSetAsync(options.pieceSet);
  }

  private _configureVisualOptions(options: BoardOptions): void {
    this.theme = resolveTheme(options.theme ?? 'classic');
    const desiredOrientation = options.boardOrientation ?? options.orientation;
    this.orientation = desiredOrientation ?? 'white';
    this._setBoardGeometry(
      options.chessboardColumns ?? DEFAULT_BOARD_FILES,
      options.chessboardRows ?? DEFAULT_BOARD_RANKS,
    );
    this.boardId = options.id ?? undefined;
    this.boardInlineStyle = options.boardStyle ? { ...options.boardStyle } : undefined;
    this.baseSquareStyle = options.squareStyle ? { ...options.squareStyle } : undefined;
    this.lightSquareStyleOptions = options.lightSquareStyle
      ? { ...options.lightSquareStyle }
      : undefined;
    this.darkSquareStyleOptions = options.darkSquareStyle
      ? { ...options.darkSquareStyle }
      : undefined;
    this.squareStylesMap = options.squareStyles
      ? Object.entries(options.squareStyles).reduce<Partial<Record<Square, SquareStyleOptions>>>(
          (acc, [sqKey, style]) => {
            if (style) {
              acc[sqKey as Square] = { ...style };
            }
            return acc;
          },
          {},
        )
      : undefined;
    this.lightNotationStyle = options.lightSquareNotationStyle
      ? { ...options.lightSquareNotationStyle }
      : undefined;
    this.darkNotationStyle = options.darkSquareNotationStyle
      ? { ...options.darkSquareNotationStyle }
      : undefined;
    this.alphaNotationStyle = options.alphaNotationStyle
      ? { ...options.alphaNotationStyle }
      : undefined;
    this.numericNotationStyle = options.numericNotationStyle
      ? { ...options.numericNotationStyle }
      : undefined;
    this.customSquareRenderer = options.squareRenderer;
    this.customPieceRenderers = options.pieces ? { ...options.pieces } : undefined;
  }

  private _resolveGameSetup(options: BoardOptions): {
    premoveSettings: BoardPremoveSettings;
    allowPremoves: boolean;
    variant: Variant;
    initialFen?: string;
  } {
    const premoveSettings: BoardPremoveSettings = options.premove ?? {};
    const allowPremovesDefault = options.allowPremoves !== false;
    const allowPremoves = premoveSettings.enabled !== false && allowPremovesDefault;
    const variant: Variant = options.variant === 'chess960' ? 'chess960' : 'standard';
    const initialFen = this._resolveInitialFen(options, variant);
    return { premoveSettings, allowPremoves, variant, initialFen };
  }

  private _resolveInitialFen(options: BoardOptions, variant: Variant): string | undefined {
    const provided = options.fen ?? options.position;
    if (variant === 'chess960' && !provided) {
      return generateChess960Start();
    }
    return provided;
  }

  private _resolveAnimationMs(options: BoardOptions): number {
    const animationOptions = options.animation;
    const animationDurationCandidates = [
      animationOptions?.duration,
      animationOptions?.durationMs,
      options.animationDurationInMs,
      options.animationMs,
    ];
    const resolvedAnimationDuration = animationDurationCandidates.find(
      (value): value is number => typeof value === 'number' && Number.isFinite(value),
    );
    return typeof resolvedAnimationDuration === 'number'
      ? Math.max(0, resolvedAnimationDuration)
      : DEFAULT_ANIMATION_MS;
  }

  // ============================================================================
  // Public API - Board Information
  // ============================================================================

  public getPosition(): string {
    return this.rules.getFEN();
  }

  public getCurrentFEN(): string {
    return this.rules.getFEN();
  }

  public getRootElement(): HTMLElement {
    return this.root;
  }

  public setRenderObserver(observer: RenderObserver | null): void {
    this.renderObserver = observer ?? undefined;
    this.renderFrameRects = [];
    this.isRenderCaptureActive = false;
  }

  public getOrientation(): 'white' | 'black' {
    return this.orientation;
  }

  public getTurn(): 'w' | 'b' {
    return this.state.turn;
  }

  public getPieceAt(square: Square): string | null {
    return this._pieceAt(square) ?? null;
  }

  /**
   * Returns every square currently occupied by the requested piece.
   *
   * The `piece` parameter must use FEN notation: uppercase letters (`K`, `Q`, `R`, `B`, `N`, `P`)
   * target white pieces while their lowercase counterparts (`k`, `q`, `r`, `b`, `n`, `p`) target
   * black pieces. The resulting array is sorted from the lowest rank/file combination (for
   * example `a1`) up to the highest (such as `h8`) to provide a stable order for assertions and
   * deterministic rendering helpers.
   */
  public getPieceSquares(piece: Piece): Square[] {
    const board = this.state.board;
    const squares: Square[] = [];

    for (const [r, row] of board.entries()) {
      if (!row) continue;

      for (const [f, element] of row.entries()) {
        if (element === piece) {
          squares.push(this._indicesToSquare(f, r));
        }
      }
    }

    return squares;
  }

  public getMoveHistory(): string[] {
    if (typeof this.rules.history === 'function') {
      return this.rules.history();
    }
    return [];
  }

  public isDraw(): boolean {
    return this.rules.isDraw();
  }

  public isInsufficientMaterial(): boolean {
    return this.rules.isInsufficientMaterial();
  }

  public isThreefoldRepetition(): boolean {
    return this.rules.isThreefoldRepetition();
  }

  // ============================================================================
  // Public API - Position Management
  // ============================================================================

  public setPosition(fen: string, immediate = false): void {
    this.setFEN(fen, immediate);
  }

  public loadPosition(fen: string, immediate = true): void {
    this.setPosition(fen, immediate);
    this._clearInteractionState();
  }

  public loadFEN(fen: string, immediate = true): void {
    this.loadPosition(fen, immediate);
  }

  public reset(immediate = true): void {
    this._resetRulesAdapter();
    this.loadPosition(this.rules.getFEN(), immediate);
    this._clearAllDrawings();
  }

  public setFEN(fen: string, immediate = false): void {
    this._cancelPendingPromotion();

    const oldState = this.state;
    const oldTurn = this.state.turn;

    this.rules.setFEN(fen);
    this.state = this._parseFEN(this.rules.getFEN());
    this._syncOrientationFromTurn(false);
    this._syncClockFromTurn(oldTurn);
    this._lastMove = null;

    // Execute premove if turn changed
    if (oldTurn !== this.state.turn) {
      this._executePremoveIfValid();
    }

    this._premove = null;
    this._syncPremoveDisplay(undefined, false);

    if (immediate) {
      this._clearAnimation();
      this.renderAll();
    } else {
      this._animateTo(this.state, oldState);
    }

    this._emitUpdateEvent();
  }

  private _adapterSupportsSanMoves(): boolean {
    const adapter = this.rules as { supportsSanMoves?: boolean };
    return adapter?.supportsSanMoves === true;
  }

  // ============================================================================
  // Public API - Move Submission
  // ============================================================================

  public submitMove(notation: string): boolean {
    const sanitizedNotation = notation.trim();

    if (!sanitizedNotation) {
      return false;
    }

    if (this._adapterSupportsSanMoves()) {
      let sanResult: RulesMoveResponse | null | undefined;

      try {
        sanResult = this.rules.move(sanitizedNotation);
      } catch (error) {
        sanResult = null;
        if (process.env.NODE_ENV !== 'production') {
          console.warn('SAN move submission failed; falling back to coordinates.', error);
        }
      }

      if (sanResult?.ok) {
        const move = sanResult.move;
        if (move?.from && move?.to) {
          this._processMoveSuccess(move.from as Square, move.to as Square, sanResult);
        } else {
          const fen = sanResult.fen ?? this.rules.getFEN();
          this.setFEN(fen, true);
        }
        return true;
      }
    }

    const parsed = this.ruleEngine.parseCoordinateNotation(sanitizedNotation);
    if (!parsed) {
      return false;
    }

    return this.attemptMove(parsed.from, parsed.to, { promotion: parsed.promotion });
  }

  public attemptMove(
    from: Square,
    to: Square,
    options: { promotion?: Move['promotion'] } = {},
  ): boolean {
    const outcome = this._attemptMove(from, to, options);
    return outcome !== false;
  }

  public undoMove(immediate = false): boolean {
    const previousState = this.state;
    const undone = this.rules.undo();

    if (!undone) {
      return false;
    }

    this._cancelPendingPromotion();
    this._pendingPromotion = null;
    this.drawingManager?.clearPromotionPreview();

    const fen = this.rules.getFEN();
    const newState = this._parseFEN(fen);

    this.state = newState;
    this._syncOrientationFromTurn(false);
    this._lastMove = null;
    this._clearInteractionState();
    this._premove = null;
    this._premoveQueues.w = [];
    this._premoveQueues.b = [];
    this._syncPremoveDisplay(undefined, false);

    if (immediate || !this.showAnimations || this.animationMs <= 0) {
      this._clearAnimation();
      this.renderAll();
    } else {
      this._animateTo(newState, previousState);
    }

    this._emitUpdateEvent();
    return true;
  }

  public redoMove(immediate = false): boolean {
    if (typeof this.rules.redo !== 'function') {
      return false;
    }

    const previousState = this.state;
    const redone = this.rules.redo();

    if (!redone) {
      return false;
    }

    this._cancelPendingPromotion();
    this._pendingPromotion = null;
    this.drawingManager?.clearPromotionPreview();

    const fen = this.rules.getFEN();
    const newState = this._parseFEN(fen);

    this.state = newState;
    this._syncOrientationFromTurn(false);
    this._lastMove = null;
    this._clearInteractionState();
    this._premove = null;
    this._premoveQueues.w = [];
    this._premoveQueues.b = [];
    this._syncPremoveDisplay(undefined, false);

    if (immediate || !this.showAnimations || this.animationMs <= 0) {
      this._clearAnimation();
      this.renderAll();
    } else {
      this._animateTo(newState, previousState);
    }

    const lastMove = this.rules.getLastMove?.();
    if (lastMove?.from && lastMove?.to) {
      this._lastMove = {
        from: lastMove.from,
        to: lastMove.to,
      };
      this._emitMoveEvent(this._lastMove.from, this._lastMove.to, fen, lastMove);
    }

    this._emitUpdateEvent();
    return true;
  }

  // ============================================================================
  // Public API - PGN Management
  // ============================================================================

  public exportPGN(options: { includeHeaders?: boolean; includeComments?: boolean } = {}): string {
    const { includeHeaders = true, includeComments = true } = options;

    let pgn = '';

    if (typeof this.rules.toPgn === 'function') {
      pgn = this.rules.toPgn(includeHeaders);
    } else if (this.rules.getPGN) {
      pgn = this.rules.getPGN();

      if (!includeHeaders) {
        const headerSplitIndex = pgn.indexOf('\n\n');
        if (headerSplitIndex !== -1) {
          pgn = pgn.slice(headerSplitIndex + 2);
        }
      }
    } else {
      console.warn('[NeoChessBoard] The current rules adapter does not support PGN export.');
    }

    if (!includeComments && pgn) {
      pgn = this._stripPgnComments(pgn);
    }

    return pgn.trim();
  }

  private _shouldUsePgnWorker(pgnString: string): boolean {
    const pgnSize = new Blob([pgnString]).size;
    if (!this._useWorkerForPgnParsing) {
      return false;
    }

    if (!this._pgnParserWorkerManager?.isAvailable()) {
      return false;
    }

    return pgnSize >= this._pgnWorkerThreshold;
  }

  private async _parsePgnWithWorker(pgnString: string): Promise<ParsedPgnResult | null> {
    if (!this._pgnParserWorkerManager) {
      return null;
    }

    try {
      return await this._pgnParserWorkerManager.parsePgn(pgnString, { includeAnnotations: true });
    } catch (workerError) {
      console.warn('Worker parsing failed, falling back to sync:', workerError);
      return null;
    }
  }

  private _loadParsedPgnResult(
    pgnString: string,
    parseIssues?: ParsedPgnResult['parseIssues'],
  ): boolean {
    const success = this._loadPgnInRules(pgnString);
    if (!success) {
      return false;
    }

    this._displayPgnAnnotations(pgnString);
    this._updateStateAfterPgnLoad();
    this.lastPgnLoadIssues = this._resolvePgnParseIssues(parseIssues);
    return true;
  }

  private _resolvePgnParseIssues(parseIssues?: ParsedPgnResult['parseIssues']): PgnParseError[] {
    if (parseIssues && parseIssues.length > 0) {
      return parseIssues.map(
        (issue) => new PgnParseError(issue.message, issue.code, { details: issue.details }),
      );
    }

    const notation = this._getPgnNotation();
    return notation ? notation.getParseIssues() : [];
  }

  public loadPgnWithAnnotations(pgnString: string): boolean {
    // Synchronous version - always uses main thread
    // For Worker-based parsing, use loadPgnWithAnnotationsAsync()
    this.lastPgnLoadIssues = [];
    try {
      const success = this._loadPgnInRules(pgnString);
      if (success) {
        this._displayPgnAnnotations(pgnString);
        this._updateStateAfterPgnLoad();
        if (this.lastPgnLoadIssues.length === 0) {
          const notation = this._getPgnNotation();
          this.lastPgnLoadIssues = notation ? notation.getParseIssues() : [];
        }
        return true;
      }
      return false;
    } catch (error) {
      const normalizedError =
        error instanceof PgnParseError
          ? error
          : new PgnParseError('Failed to load PGN into rules adapter.', 'PGN_IMPORT_FAILED', {
              cause: error,
              details: {
                message: error instanceof Error ? error.message : String(error),
              },
            });
      this.lastPgnLoadIssues = [normalizedError];
      if (process.env.NODE_ENV !== 'test') {
        console.error('Error loading PGN with annotations:', normalizedError);
      }
      return false;
    }
  }

  /**
   * Load PGN with annotations asynchronously using Web Worker
   * This method is non-blocking and should be used for large files
   */
  public async loadPgnWithAnnotationsAsync(pgnString: string): Promise<boolean> {
    this.lastPgnLoadIssues = [];
    try {
      const parsedResult = this._shouldUsePgnWorker(pgnString)
        ? await this._parsePgnWithWorker(pgnString)
        : null;

      if (parsedResult) {
        return this._loadParsedPgnResult(pgnString, parsedResult.parseIssues);
      }

      // Fallback to synchronous parsing
      return this.loadPgnWithAnnotations(pgnString);
    } catch (error) {
      const normalizedError =
        error instanceof PgnParseError
          ? error
          : new PgnParseError('Failed to load PGN into rules adapter.', 'PGN_IMPORT_FAILED', {
              cause: error,
              details: {
                message: error instanceof Error ? error.message : String(error),
              },
            });
      this.lastPgnLoadIssues = [normalizedError];
      if (process.env.NODE_ENV !== 'test') {
        console.error('Error loading PGN with annotations:', normalizedError);
      }
      return false;
    }
  }

  public getLastPgnLoadIssues(): readonly PgnParseError[] {
    return [...this.lastPgnLoadIssues];
  }

  public showPgnAnnotationsForPly(ply: number): boolean {
    if (!this.drawingManager) {
      return false;
    }

    this.drawingManager.clearArrows();
    this.drawingManager.clearHighlights();

    if (ply <= 0) {
      return true;
    }

    const pgnNotation = this._getPgnNotation();
    if (!pgnNotation) {
      return false;
    }

    const moveNumber = Math.ceil(ply / 2);
    const isWhiteMove = ply % 2 === 1;
    const annotations = pgnNotation.getMoveAnnotations(moveNumber, isWhiteMove);

    if (!annotations) {
      return true;
    }

    this._applyAnnotations(annotations);
    return true;
  }

  public exportPgnWithAnnotations(): string {
    const pgnNotation = this._getPgnNotation();
    if (pgnNotation && typeof pgnNotation.toPgnWithAnnotations === 'function') {
      return pgnNotation.toPgnWithAnnotations();
    }
    return this.rules.toPgn?.() ?? '';
  }

  public addAnnotationsToCurrentMove(
    arrows: Arrow[] = [],
    circles: SquareHighlight[] = [],
    comment: string = '',
  ): void {
    if (!this.drawingManager) return;

    this._saveAnnotationsToPgn(arrows, circles, comment);
    this._displayAnnotations(arrows, circles);
    this.renderAll();
  }

  // ============================================================================
  // Public API - Notation Conversion
  // ============================================================================

  public convertMoveNotation(
    notation: string,
    from: MoveNotation,
    to: MoveNotation,
  ): string | null {
    const normalizedFrom = from.toLowerCase() as MoveNotation;
    const normalizedTo = to.toLowerCase() as MoveNotation;

    return this.ruleEngine.convertMoveNotation(notation, normalizedFrom, normalizedTo);
  }

  public sanToUci(san: string): string | null {
    return this.ruleEngine.sanToUci(san);
  }

  public sanToCoordinates(san: string): string | null {
    return this.ruleEngine.sanToCoordinates(san);
  }

  public uciToSan(uci: string): string | null {
    return this.ruleEngine.uciToSan(uci);
  }

  public uciToCoordinates(uci: string): string | null {
    return this.ruleEngine.uciToCoordinates(uci);
  }

  public coordinatesToSan(coordinates: string): string | null {
    return this.convertMoveNotation(coordinates, 'coord', 'san');
  }

  public coordinatesToUci(coordinates: string): string | null {
    return this.convertMoveNotation(coordinates, 'coord', 'uci');
  }

  // ============================================================================
  // Public API - Visual Configuration
  // ============================================================================

  public setTheme(theme: ThemeName | ThemeOverrides): void {
    if (typeof theme === 'string') {
      this.applyTheme(theme);
      return;
    }

    if (this._isCompleteTheme(theme)) {
      this.applyTheme(theme);
      return;
    }

    const merged: Theme = { ...this.theme, ...theme } as Theme;

    if (typeof theme.moveHighlight === 'string') {
      merged.moveHighlight = theme.moveHighlight;
    }
    if (typeof theme.moveTo === 'string') {
      merged.moveTo = theme.moveTo;
    }
    if (typeof theme.check === 'string') {
      merged.check = theme.check;
    }
    if (typeof theme.checkmate === 'string') {
      merged.checkmate = theme.checkmate;
    }
    if (typeof theme.stalemate === 'string') {
      merged.stalemate = theme.stalemate;
    }

    this.applyTheme(merged);
  }

  public applyTheme(theme: ThemeName | Theme): void {
    this.theme = resolveTheme(theme);
    this._rasterize();
    this.renderAll();
  }

  private _isCompleteTheme(theme: ThemeOverrides): theme is Theme {
    return REQUIRED_THEME_KEYS.every((key) => {
      const value = theme[key];
      return typeof value === 'string' && value.length > 0;
    });
  }

  private _initializePieceSetAsync(pieceSet?: PieceSet | null): void {
    if (!pieceSet) {
      return;
    }

    Promise.resolve()
      .then(() => this.setPieceSet(pieceSet))
      .catch((error) => console.error('Failed to apply initial piece set', error));
  }

  public async setPieceSet(pieceSet?: PieceSet | null): Promise<void> {
    if (this._shouldClearPieceSet(pieceSet)) {
      this._clearPieceSet();
      return;
    }

    if (pieceSet === this._pieceSetRaw) {
      return;
    }

    await this._loadPieceSet(pieceSet!);
  }

  public setOrientation(orientation: 'white' | 'black'): void {
    this.orientation = orientation;
    if (this.drawingManager) {
      this.drawingManager.setOrientation(orientation);
    }
    this.renderAll();
  }

  // ============================================================================
  // Public API - Feature Toggles
  // ============================================================================

  public setSoundEnabled(enabled: boolean): void {
    this.soundEnabled = enabled;
    this.audioManager.setEnabled(enabled);
  }

  public setSoundUrls(soundUrls: BoardOptions['soundUrls']): void {
    this.audioManager.setSoundUrls(soundUrls);
  }

  public setSoundEventUrls(soundEventUrls: BoardOptions['soundEventUrls']): void {
    this.audioManager.setSoundEventUrls(soundEventUrls);
  }

  public configure(configuration: BoardConfiguration): void {
    if (!configuration || typeof configuration !== 'object') {
      return;
    }

    const shouldRender = this._applyDragConfiguration(configuration.drag);

    if (configuration.animation) {
      this.setAnimation(configuration.animation);
    }

    if ('promotion' in configuration) {
      this._updatePromotionOptions(configuration.promotion);
    }

    if (shouldRender) {
      this.renderAll();
      return;
    }

    this._updateInlinePromotionPosition();
  }

  public setAutoFlip(autoFlip: boolean): void {
    this.autoFlip = autoFlip;
    if (autoFlip) {
      this._syncOrientationFromTurn(!this.drawingManager);
    }
  }

  public setAnimationDuration(duration: number | undefined): void {
    if (duration === undefined) {
      return;
    }
    this.setAnimation({ duration });
  }

  public setAnimation(animation: BoardAnimationConfig | undefined): void {
    if (!animation) {
      return;
    }

    const { duration, durationMs, easing } = animation;
    const resolvedDuration = this._resolveDurationValue(duration, durationMs);

    if (typeof resolvedDuration === 'number') {
      this.animationMs = Math.max(0, resolvedDuration);
    }

    if (easing !== undefined) {
      this._setAnimationEasing(easing);
    }
  }

  public setShowAnimations(show: boolean): void {
    this.showAnimations = show;
    if (!show) {
      this._clearAnimation();
      this.renderAll();
    }
  }

  private _setAnimationEasing(easing: AnimationEasing | undefined): void {
    const fallbackName: AnimationEasingName =
      this.animationEasingName === 'custom'
        ? DEFAULT_ANIMATION_EASING_NAME
        : this.animationEasingName;
    const resolved = resolveAnimationEasing(easing, fallbackName);

    this.animationEasingName = resolved.name;
    this.animationEasingFn = resolved.fn;
  }

  private _resolveDurationValue(duration?: number, durationMs?: number): number | undefined {
    if (typeof duration === 'number' && Number.isFinite(duration)) {
      return duration;
    }
    if (typeof durationMs === 'number' && Number.isFinite(durationMs)) {
      return durationMs;
    }
    return undefined;
  }

  public setDraggingEnabled(enabled: boolean): void {
    if (this.allowDragging === enabled) {
      return;
    }

    this.allowDragging = enabled;
    if (!enabled) {
      this._clearInteractionState();
      this.renderAll();
    }
    this.eventManager?.updatePointerBindings();
  }

  public setAllowDragOffBoard(allow: boolean): void {
    this.allowDragOffBoard = allow;
  }

  private _applyDragConfiguration(drag?: BoardConfiguration['drag']): boolean {
    if (!drag) {
      return false;
    }

    let shouldRender = false;

    this._setDragThreshold(drag.threshold);
    shouldRender = this._applyDragSnap(drag.snap) || shouldRender;
    shouldRender = this._applyGhostPieceOption(drag.ghost) || shouldRender;
    shouldRender = this._applyGhostOpacity(drag.ghostOpacity) || shouldRender;
    this._applyCancelOnEsc(drag.cancelOnEsc);

    return shouldRender;
  }

  private _setDragThreshold(threshold?: number): void {
    if (typeof threshold === 'number' && Number.isFinite(threshold)) {
      this.setDragActivationDistance(threshold);
    }
  }

  private _applyDragSnap(snap?: boolean): boolean {
    if (typeof snap !== 'boolean') {
      return false;
    }

    const snapChanged = this.dragSnapToSquare !== snap;
    this.dragSnapToSquare = snap;

    if (!snapChanged || !this._dragging) {
      return false;
    }

    if (snap && this._hoverSq) {
      const center = this._squareCenter(this._hoverSq);
      this._dragging.x = center.x;
      this._dragging.y = center.y;
    }

    return true;
  }

  private _applyGhostPieceOption(ghost?: boolean): boolean {
    if (typeof ghost !== 'boolean' || this.dragGhostPiece === ghost) {
      return false;
    }

    this.dragGhostPiece = ghost;
    return true;
  }

  private _applyGhostOpacity(ghostOpacity?: number): boolean {
    if (typeof ghostOpacity !== 'number' || !Number.isFinite(ghostOpacity)) {
      return false;
    }

    const clampedOpacity = clamp(ghostOpacity, 0, 1);
    if (this.dragGhostOpacity === clampedOpacity) {
      return false;
    }

    this.dragGhostOpacity = clampedOpacity;
    return true;
  }

  private _applyCancelOnEsc(cancelOnEsc?: boolean): void {
    if (typeof cancelOnEsc === 'boolean') {
      this.dragCancelOnEsc = cancelOnEsc;
    }
  }

  public setAutoScrollEnabled(allow: boolean): void {
    this.allowAutoScroll = allow;
    if (!allow) {
      this._scrollContainer = null;
    } else if (this._dragging) {
      this._ensureScrollContainer();
    }
  }

  public setCanDragPiece(evaluator: BoardOptions['canDragPiece']): void {
    this.canDragPiece = evaluator;
  }

  public setDragActivationDistance(distance: number): void {
    if (typeof distance !== 'number' || !Number.isFinite(distance)) {
      return;
    }
    this.dragActivationDistance = Math.max(0, distance);
  }

  public setBoardStyle(style?: InlineStyle): void {
    this.domManager.setBoardStyle(style);
  }

  public setBoardId(id?: string): void {
    this.boardId = id ?? undefined;
    if (id && id.length > 0) {
      this.root.id = id;
    } else {
      this.root.removeAttribute('id');
    }
  }

  public setSquareStyle(style?: SquareStyleOptions): void {
    this.baseSquareStyle = style ? { ...style } : undefined;
    this.renderAll();
  }

  public setLightSquareStyle(style?: SquareStyleOptions): void {
    this.lightSquareStyleOptions = style ? { ...style } : undefined;
    this.renderAll();
  }

  public setDarkSquareStyle(style?: SquareStyleOptions): void {
    this.darkSquareStyleOptions = style ? { ...style } : undefined;
    this.renderAll();
  }

  public setSquareStyles(styles?: Partial<Record<Square, SquareStyleOptions>>): void {
    this.squareStylesMap = styles
      ? Object.entries(styles).reduce<Partial<Record<Square, SquareStyleOptions>>>(
          (acc, [key, value]) => {
            if (value) {
              acc[key as Square] = { ...value };
            }
            return acc;
          },
          {},
        )
      : undefined;
    this.renderAll();
  }

  public setLightSquareNotationStyle(style?: NotationStyleOptions): void {
    this.lightNotationStyle = style ? { ...style } : undefined;
    this._applyNotationStyles();
    this.renderAll();
  }

  public setDarkSquareNotationStyle(style?: NotationStyleOptions): void {
    this.darkNotationStyle = style ? { ...style } : undefined;
    this._applyNotationStyles();
    this.renderAll();
  }

  public setAlphaNotationStyle(style?: NotationStyleOptions): void {
    this.alphaNotationStyle = style ? { ...style } : undefined;
    this._applyNotationStyles();
    this.renderAll();
  }

  public setNumericNotationStyle(style?: NotationStyleOptions): void {
    this.numericNotationStyle = style ? { ...style } : undefined;
    this._applyNotationStyles();
    this.renderAll();
  }

  public setShowNotation(show: boolean): void {
    this.setShowSquareNames(show);
  }

  public setSquareRenderer(renderer?: SquareRenderer): void {
    this.customSquareRenderer = renderer;
    if (!renderer) {
      this._clearSquareOverlay();
    }
    this.renderAll();
  }

  public setPieceRenderers(renderers?: PieceRendererMap): void {
    this.customPieceRenderers = renderers ? { ...renderers } : undefined;
    if (!this.customPieceRenderers) {
      this._clearDomPieces();
    }
    this.renderAll();
  }

  public setShowArrows(show: boolean): void {
    this.showArrows = show;
    this.renderAll();
  }

  public setShowHighlights(show: boolean): void {
    this.showHighlights = show;
    this.renderAll();
  }

  public setAllowPremoves(allow: boolean): void {
    this.allowPremoves = allow;
    if (!allow) {
      this._premoveQueues.w = [];
      this._premoveQueues.b = [];
    }
    this._syncPremoveDisplay(undefined, true);
  }

  public setHighlightLegal(highlight: boolean): void {
    this.highlightLegal = highlight;
    this.renderAll();
  }

  public setShowSquareNames(show: boolean): void {
    this.showSquareNames = show;
    if (this.drawingManager) {
      this.drawingManager.setShowSquareNames(show);
    }
    this.renderAll();
  }

  public setAllowDrawingArrows(allow: boolean): void {
    this.allowDrawingArrows = allow;
    this.drawingManager?.setAllowDrawingArrows(allow);
  }

  public setClearArrowsOnClick(clear: boolean): void {
    this.clearArrowsOnClick = clear;
    this.drawingManager?.setClearArrowsOnClick(clear);
  }

  public setArrowOptions(options?: ArrowStyleOptions): void {
    this.arrowOptions = options;
    this.drawingManager?.setArrowOptions(options);
    this.renderAll();
  }

  public setArrows(arrows: Arrow[] | undefined): void {
    this.controlledArrows = arrows;
    if (!this.drawingManager || arrows === undefined) {
      return;
    }
    this.drawingManager.setArrows(arrows);
    this.renderAll();
  }

  public setOnArrowsChange(handler?: BoardOptions['onArrowsChange']): void {
    this.onArrowsChange = handler;
  }

  // ============================================================================
  // Public API - Drawing Management
  // ============================================================================

  public addArrow(arrow: { from: Square; to: Square; color?: string } | Arrow): void {
    if (!this.drawingManager) return;

    if ('from' in arrow && 'to' in arrow) {
      if ('knightMove' in arrow) {
        this.drawingManager.addArrowFromObject(arrow);
      } else {
        this.drawingManager.addArrow(arrow);
      }
      this.renderAll();
    }
  }

  public removeArrow(from: Square, to: Square): void {
    if (this.drawingManager) {
      this.drawingManager.removeArrow(from, to);
      this.renderAll();
    }
  }

  public clearArrows(): void {
    if (this.drawingManager) {
      this.drawingManager.clearArrows();
      this.renderAll();
    }
  }

  public addHighlight(square: Square | SquareHighlight, type?: string): void {
    if (!this.drawingManager) return;

    if (typeof square === 'string' && type) {
      this.drawingManager.addHighlight(square, type);
    } else if (typeof square === 'object' && 'square' in square) {
      this.drawingManager.addHighlightFromObject(square);
    }
    this.renderAll();
  }

  public removeHighlight(square: Square): void {
    if (this.drawingManager) {
      this.drawingManager.removeHighlight(square);
      this.renderAll();
    }
  }

  public clearHighlights(): void {
    if (this.drawingManager) {
      this.drawingManager.clearHighlights();
      this.renderAll();
    }
  }

  public setPremove(premove: Premove, color?: ColorInput): void {
    if (!this.allowPremoves) {
      return;
    }

    const targetColor = this._resolveTargetColor(color);
    this._queuePremove(targetColor, premove, true);
  }

  public clearPremove(color?: PremoveColorOption): void {
    const colors = this._resolveColorsForClearing(color);
    for (const code of colors) {
      if (this._premoveQueues[code].length > 0) {
        this._premoveQueues[code] = [];
      }
    }
    this._syncPremoveDisplay(undefined, true);
  }

  public getPremove(): Premove | null {
    return this._premove ? { ...this._premove } : null;
  }

  public clearAllDrawings(): void {
    this._premoveQueues.w = [];
    this._premoveQueues.b = [];
    if (this.drawingManager) {
      this.drawingManager.clearAll();
    }
    this._syncPremoveDisplay(undefined, true);
  }

  public exportDrawings(): string | null {
    return this.drawingManager ? this.drawingManager.exportState() : null;
  }

  public importDrawings(state: string): void {
    if (this.drawingManager) {
      this.drawingManager.importState(state);
      this._syncQueuesFromDrawingManager();
      this._syncPremoveDisplay(undefined, true);
    }
  }

  // ============================================================================
  // Public API - Promotion Management
  // ============================================================================

  public previewPromotionPiece(piece: PromotionPiece | null): void {
    if (!this._pendingPromotion || !this.drawingManager) {
      return;
    }

    const { to, color } = this._pendingPromotion;
    if (piece) {
      this.drawingManager.setPromotionPreview(to, color, piece);
    } else {
      this.drawingManager.setPromotionPreview(to, color);
    }
    this.renderAll();
  }

  public clearPromotionPreview(): void {
    if (!this.drawingManager) {
      return;
    }
    this.drawingManager.clearPromotionPreview();
    this.renderAll();
  }

  public isPromotionPending(): boolean {
    return this._pendingPromotion !== null;
  }

  public getPendingPromotion(): PendingPromotionSummary | null {
    if (!this._pendingPromotion) {
      return null;
    }

    const { from, to, color, mode } = this._pendingPromotion;
    return { from, to, color, mode };
  }

  // ============================================================================
  // Public API - Clock
  // ============================================================================

  public getClockState(): ClockState | null {
    return this.clockManager?.getState() ?? null;
  }

  public startClock(): void {
    this.clockManager?.start();
  }

  public pauseClock(): void {
    this.clockManager?.pause();
  }

  public resetClock(config?: Partial<ClockConfig> | null): void {
    if (config === null) {
      if (this.clockManager) {
        this.clockManager.destroy();
        this.clockManager = null;
      }
      return;
    }

    if (!this.clockManager) {
      if (config?.initial === undefined) {
        return;
      }

      const nextConfig: ClockConfig = {
        initial: config.initial,
        increment: config.increment,
        delay: config.delay,
        active: config.active ?? this.state?.turn ?? 'w',
        paused: config.paused,
        callbacks: config.callbacks,
      };
      this._initializeClock(nextConfig);
      return;
    }

    if (config) {
      this.clockManager.reset(config);
    } else {
      this.clockManager.reset();
    }
  }

  public setClockTime(color: Color, milliseconds: number): void {
    this.clockManager?.setTime(color, milliseconds);
  }

  public addClockTime(color: Color, milliseconds: number): void {
    this.clockManager?.addTime(color, milliseconds);
  }

  // ============================================================================
  // Public API - Camera Effects
  // ============================================================================

  public zoomToSquare(square: Square, scale = 2): Promise<void> {
    if (!this.cameraEffects) return Promise.resolve();
    return this.cameraEffects.zoomTo({ square, scale });
  }

  public zoomToMove(from: Square, to: Square, scale = 1.8): Promise<void> {
    if (!this.cameraEffects) return Promise.resolve();
    return this.cameraEffects.zoomTo({ squares: [from, to], scale });
  }

  public resetCamera(animated = true): Promise<void> {
    if (!this.cameraEffects) return Promise.resolve();
    return this.cameraEffects.reset(animated);
  }

  public getCameraTransform(): CameraTransform | null {
    return this.cameraEffects?.getCurrentTransform() ?? null;
  }

  // ============================================================================
  // Public API - Event Management
  // ============================================================================

  public on<K extends keyof BoardEventMap>(
    event: K,
    handler: (payload: BoardEventMap[K]) => void,
  ): () => void {
    return this.bus.on(event, handler);
  }

  public registerExtensionPoint<K extends keyof BoardEventMap>(
    extensionId: string,
    event: K,
    handler: (payload: BoardEventMap[K]) => void,
  ): () => void {
    const state = this._findExtensionState(extensionId);
    if (!state) {
      throw new Error(`No extension with id "${extensionId}" is registered on this board.`);
    }
    return this._registerExtensionHandler(state, event, handler);
  }

  // ============================================================================
  // Public API - Lifecycle
  // ============================================================================

  public resize(): void {
    const dimensions = this._calculateBoardDimensions();
    this._updateCanvasDimensions(dimensions);
    this._updateInternalDimensions(dimensions);
    this._notifyDrawingManagerResize();
    this.renderAll();
  }

  public renderAll(): void {
    const cameraTransform = this.cameraEffects?.getCurrentTransform() ?? null;
    this._applyCameraDomTransforms(cameraTransform);
    this._invokeExtensionHook('onBeforeRender');
    this._startRenderCaptureFrame();
    this._drawBoard(cameraTransform);
    this._renderPiecesAndOverlayLayers(cameraTransform);
    this._flushRenderCaptureFrame();
    this._invokeExtensionHook('onAfterRender');
    this._updateInlinePromotionPosition();
  }

  public destroy(): void {
    // Terminate Web Workers
    this._legalMovesWorkerManager?.terminate();
    this._pgnParserWorkerManager?.terminate();
    this.clockManager?.destroy();
    this.clockManager = null;
    this._cancelPendingPromotion();
    this.eventManager?.detach();
    this.domManager.disconnect();
    this.captureEffectManager?.destroy();
    this.captureEffectManager = undefined;
    this._disposeExtensions();
    this._hideInlinePromotion();
    this.root.innerHTML = '';
    this.domOverlay = undefined;
    this.squareLayer = undefined;
    this.pieceLayer = undefined;
    this.squareElements.clear();
    this.pieceElements.clear();
    this.inlinePromotionContainer = undefined;
    this.inlinePromotionButtons = [];
    this.inlinePromotionToken = null;
    this.cameraEffects?.destroy();
    this.cameraEffects = null;
    this._applyCameraDomTransforms(null);
  }

  // ============================================================================
  // Private - DOM Utilities
  // ============================================================================

  private _applyNotationStyles(): void {
    if (!this.drawingManager) {
      return;
    }
    this.drawingManager.setNotationStyles({
      light: this.lightNotationStyle ?? null,
      dark: this.darkNotationStyle ?? null,
      alpha: this.alphaNotationStyle ?? null,
      numeric: this.numericNotationStyle ?? null,
    });
  }

  private _rasterize(): void {
    this.sprites = new FlatSprites(SPRITE_SIZE, this.theme);
  }

  // ============================================================================
  // Private - Clock Management
  // ============================================================================

  private _initializeClock(clockConfig: ClockConfig | undefined): void {
    if (this.clockManager) {
      this.clockManager.destroy();
      this.clockManager = null;
    }

    if (!clockConfig) {
      return;
    }

    const resolvedConfig: ClockConfig = {
      ...clockConfig,
      active: clockConfig.active ?? this.state?.turn ?? 'w',
    };

    const bus = this.bus as unknown as EventBus<ClockEvents>;
    this.clockManager = new ClockManager(resolvedConfig, bus);
  }

  private _syncClockFromTurn(previousTurn: Color): void {
    const manager = this.clockManager;
    if (!manager) {
      return;
    }

    const currentTurn = this.state.turn;
    if (previousTurn === currentTurn) {
      return;
    }

    const state = manager.getState();
    if (!state || state.active === null) {
      return;
    }

    if (state.active === currentTurn) {
      return;
    }

    manager.switchActive();
  }

  // ============================================================================
  // Private - Dimension Management
  // ============================================================================

  private _setBoardGeometry(
    files: number,
    ranks: number,
    fileLabels?: readonly string[],
    rankLabels?: readonly string[],
  ): void {
    const geometry = resolveBoardGeometry({
      files,
      ranks,
      fileLabels,
      rankLabels,
      defaultFiles: DEFAULT_BOARD_FILES,
      defaultRanks: DEFAULT_BOARD_RANKS,
    });

    this.filesCount = geometry.files;
    this.ranksCount = geometry.ranks;
    this.fileLabels = geometry.fileLabels;
    this.rankLabels = geometry.rankLabels;
  }

  private _parseFEN(fen: string): ParsedFENState {
    return parseFEN(fen, { files: this.filesCount, ranks: this.ranksCount });
  }

  private _indicesToSquare(file: number, rank: number): Square {
    return sq(file, rank, this.fileLabels, this.rankLabels);
  }

  private _squareToIndices(square: Square): { f: number; r: number } {
    return sqToFR(square, this.fileLabels, this.rankLabels);
  }

  private _calculateBoardDimensions(): {
    cssWidth: number;
    cssHeight: number;
    pixelWidth: number;
    pixelHeight: number;
    dpr: number;
    square: number;
  } {
    const rect = this.root.getBoundingClientRect();
    const availableWidth = rect.width || DEFAULT_BOARD_SIZE;
    const availableHeight = rect.height || DEFAULT_BOARD_SIZE;
    const aspectRatio = this.filesCount / this.ranksCount;

    let cssWidth = availableWidth;
    let cssHeight = cssWidth / aspectRatio;

    if (cssHeight > availableHeight) {
      cssHeight = availableHeight;
      cssWidth = cssHeight * aspectRatio;
    }

    const dpr = globalThis.devicePixelRatio || 1;
    const pixelWidth = Math.max(1, Math.round(cssWidth * dpr));
    const pixelHeight = Math.max(1, Math.round(cssHeight * dpr));
    const square = pixelWidth / this.filesCount;

    return { cssWidth, cssHeight, pixelWidth, pixelHeight, dpr, square };
  }

  private _updateCanvasDimensions(dimensions: { pixelWidth: number; pixelHeight: number }): void {
    const { pixelWidth, pixelHeight } = dimensions;
    for (const canvas of [this.cBoard, this.cPieces, this.cOverlay]) {
      canvas.width = pixelWidth;
      canvas.height = pixelHeight;
    }
  }

  private _updateInternalDimensions(dimensions: {
    cssWidth: number;
    cssHeight: number;
    dpr: number;
    square: number;
  }): void {
    this.sizePx = Math.max(dimensions.cssWidth, dimensions.cssHeight);
    this.dpr = dimensions.dpr;
    this.square = dimensions.square;
  }

  private _notifyDrawingManagerResize(): void {
    if (this.drawingManager) {
      this.drawingManager.updateDimensions({
        files: this.filesCount,
        ranks: this.ranksCount,
        fileLabels: this.fileLabels,
        rankLabels: this.rankLabels,
      });
    }
  }

  // ============================================================================
  // Private - Rendering
  // ============================================================================

  private _startRenderCaptureFrame(): void {
    if (!this.renderObserver) {
      this.isRenderCaptureActive = false;
      this.renderFrameRects = [];
      return;
    }

    this.renderFrameRects = [];
    this.isRenderCaptureActive = true;
  }

  private _recordRenderRect(
    layer: RenderLayer,
    type: RenderCommandType,
    x: number,
    y: number,
    width: number,
    height: number,
  ): void {
    if (!this.renderObserver || !this.isRenderCaptureActive) {
      return;
    }

    this.renderFrameRects.push({ layer, type, rect: { x, y, width, height } });
  }

  private _flushRenderCaptureFrame(): void {
    if (!this.renderObserver || !this.isRenderCaptureActive) {
      this.renderFrameRects = [];
      this.isRenderCaptureActive = false;
      return;
    }

    const payload = [...this.renderFrameRects];
    try {
      this.renderObserver(payload);
    } finally {
      this.renderFrameRects = [];
      this.isRenderCaptureActive = false;
    }
  }

  private _clearCanvas(
    ctx: CanvasRenderingContext2D,
    layer: RenderLayer,
    x: number,
    y: number,
    width: number,
    height: number,
  ): void {
    ctx.clearRect(x, y, width, height);
    this._recordRenderRect(layer, 'clear', x, y, width, height);
  }

  private _fillCanvas(
    ctx: CanvasRenderingContext2D,
    layer: RenderLayer,
    x: number,
    y: number,
    width: number,
    height: number,
  ): void {
    ctx.fillRect(x, y, width, height);
    this._recordRenderRect(layer, 'fill', x, y, width, height);
  }

  private _drawImage(
    ctx: CanvasRenderingContext2D,
    layer: RenderLayer,
    image: PieceSpriteImage,
    dx: number,
    dy: number,
    dWidth: number,
    dHeight: number,
    sx?: number,
    sy?: number,
    sWidth?: number,
    sHeight?: number,
  ): void {
    if (
      typeof sx === 'number' &&
      typeof sy === 'number' &&
      typeof sWidth === 'number' &&
      typeof sHeight === 'number'
    ) {
      ctx.drawImage(image, sx, sy, sWidth, sHeight, dx, dy, dWidth, dHeight);
    } else {
      ctx.drawImage(image, dx, dy, dWidth, dHeight);
    }

    this._recordRenderRect(layer, 'sprite', dx, dy, dWidth, dHeight);
  }

  private _drawBoard(transform?: CameraTransform | null): void {
    const { light, dark, boardBorder } = this.theme;
    const ctx = this.ctxB;
    const s = this.square;
    const W = this.cBoard.width;
    const H = this.cBoard.height;

    this._clearCanvas(ctx, 'board', 0, 0, W, H);
    const appliedTransform = this.canvasRenderer.applyCameraTransform(ctx, this.cBoard, transform);
    ctx.fillStyle = boardBorder;
    this._fillCanvas(ctx, 'board', 0, 0, W, H);

    for (let r = 0; r < this.ranksCount; r++) {
      for (let f = 0; f < this.filesCount; f++) {
        const square = this._indicesToSquare(f, r);
        const { x, y } = this._calculateSquarePosition(f, r);
        const isLight = (r + f) % 2 === 0;
        const style = this._resolveSquareStyle(square, isLight);
        const fill = style.fill ?? (isLight ? light : dark);
        if (fill) {
          ctx.fillStyle = fill as CanvasGradient | CanvasPattern | string;
          this._fillCanvas(ctx, 'board', x, y, s, s);
        }
        if (style.stroke) {
          const strokeWidth = style.strokeWidth ?? 1;
          ctx.lineWidth = strokeWidth;
          ctx.strokeStyle = style.stroke as CanvasGradient | CanvasPattern | string;
          const inset = strokeWidth / 2;
          ctx.strokeRect(x + inset, y + inset, s - strokeWidth, s - strokeWidth);
        }
      }
    }

    this._renderSquareOverlays();

    this.canvasRenderer.restore(ctx, appliedTransform);
  }

  private _drawPieces(transform?: CameraTransform | null): void {
    const ctx = this.ctxP;
    const W = this.cPieces.width;
    const H = this.cPieces.height;

    this._clearCanvas(ctx, 'pieces', 0, 0, W, H);
    const appliedTransform = this.canvasRenderer.applyCameraTransform(ctx, this.cPieces, transform);

    const draggingSq = this._dragging?.from;
    const activeDomPieces = new Set<Square>();
    const hasCustomPieces =
      this.customPieceRenderers && Object.keys(this.customPieceRenderers).length > 0;

    if (!hasCustomPieces) {
      this._clearDomPieces();
    }

    for (let r = 0; r < this.ranksCount; r++) {
      for (let f = 0; f < this.filesCount; f++) {
        const piece = this.state.board[r][f];
        if (!piece) continue;

        const square = this._indicesToSquare(f, r);
        const renderer = this._getCustomPieceRenderer(piece);

        if (renderer) {
          if (draggingSq === square) {
            this._removeDomPiece(square);
            continue;
          }
          this._renderDomPiece(square, piece as Piece, renderer, activeDomPieces);
          continue;
        }

        this._removeDomPiece(square);

        if (draggingSq === square) {
          if (this._dragging && this.dragGhostPiece) {
            this._drawGhostPiece(piece, square);
          }
          continue;
        }

        const { x, y } = this._sqToXY(square);
        this._drawPieceSprite(piece, x, y, 1);
      }
    }

    if (hasCustomPieces) {
      this._cleanupDomPieces(activeDomPieces);
    }

    if (this._dragging) {
      this._drawDraggingPiece();
    }

    this.canvasRenderer.restore(ctx, appliedTransform);
  }

  private _drawGhostPiece(piece: string, square: Square): void {
    const ctx = this.ctxP;
    ctx.save();
    ctx.globalAlpha = clamp(this.dragGhostOpacity, 0, 1);
    const { x, y } = this._sqToXY(square);
    this._drawPieceSprite(piece, x, y, 1);
    ctx.restore();
  }

  private _drawDraggingPiece(): void {
    if (!this._dragging) return;

    const { piece, x, y } = this._dragging;
    this._drawPieceSprite(piece, x - this.square / 2, y - this.square / 2, DRAG_SCALE);
  }

  private _getCustomPieceRenderer(piece: string): PieceRenderer | undefined {
    if (!this.customPieceRenderers) {
      return undefined;
    }
    return this.customPieceRenderers[piece as Piece];
  }

  private _renderDomPiece(
    square: Square,
    piece: Piece,
    renderer: PieceRenderer,
    active: Set<Square>,
  ): void {
    if (!this.pieceLayer) {
      return;
    }
    const element = this._ensurePieceElement(square);
    element.dataset.square = square;
    element.dataset.piece = piece;
    this._positionPieceElement(element, square);
    renderer({ square, piece, element, board: this });
    active.add(square);
  }

  private _ensureDomElement(
    square: Square,
    elementsMap: Map<Square, HTMLDivElement>,
    layer: HTMLDivElement | undefined,
  ): HTMLDivElement {
    let element = elementsMap.get(square);
    if (element) {
      return element;
    }

    const doc = this.root.ownerDocument ?? document;
    element = doc.createElement('div');
    element.dataset.square = square;
    element.style.position = 'absolute';
    element.style.left = '0';
    element.style.top = '0';
    element.style.pointerEvents = 'none';
    element.style.willChange = 'transform';
    layer?.append(element);
    elementsMap.set(square, element);
    return element;
  }

  private _ensurePieceElement(square: Square): HTMLDivElement {
    return this._ensureDomElement(square, this.pieceElements, this.pieceLayer);
  }

  private _positionPieceElement(element: HTMLDivElement, square: Square): void {
    this._positionElement(element, square);
  }

  private _cleanupDomPieces(active: Set<Square>): void {
    for (const [square, element] of this.pieceElements.entries()) {
      if (active.has(square)) {
        continue;
      }
      element.remove();
      this.pieceElements.delete(square);
    }
  }

  private _removeDomPiece(square: Square): void {
    const element = this.pieceElements.get(square);
    if (!element) {
      return;
    }
    element.remove();
    this.pieceElements.delete(square);
  }

  private _clearDomPieces(): void {
    for (const element of this.pieceElements.values()) {
      element.remove();
    }
    this.pieceElements.clear();
  }

  private _resolveSquareStyle(square: Square, isLight: boolean): SquareStyleOptions {
    const layers: SquareStyleOptions[] = [];
    if (this.baseSquareStyle) {
      layers.push(this.baseSquareStyle);
    }
    const colorStyle = isLight ? this.lightSquareStyleOptions : this.darkSquareStyleOptions;
    if (colorStyle) {
      layers.push(colorStyle);
    }
    const squareSpecific = this.squareStylesMap?.[square];
    if (squareSpecific) {
      layers.push(squareSpecific);
    }

    if (layers.length === 0) {
      return {};
    }

    return layers.reduce<SquareStyleOptions>((acc, style) => ({ ...acc, ...style }), {});
  }

  private _positionElement(element: HTMLDivElement, square: Square): void {
    const size = this.dpr ? this.square / this.dpr : this.square;
    const { x, y } = this._sqToXY(square);
    const cssX = this.dpr ? x / this.dpr : x;
    const cssY = this.dpr ? y / this.dpr : y;
    element.style.width = `${size}px`;
    element.style.height = `${size}px`;
    element.style.transform = `translate(${cssX}px, ${cssY}px)`;
  }

  private _renderSquareOverlays(): void {
    if (!this.squareLayer) {
      return;
    }
    if (!this.customSquareRenderer) {
      this._clearSquareOverlay();
      return;
    }

    const renderer = this.customSquareRenderer;

    for (let r = 0; r < this.ranksCount; r++) {
      for (let f = 0; f < this.filesCount; f++) {
        const square = this._indicesToSquare(f, r);
        const element = this._ensureSquareElement(square);
        this._positionSquareElement(element, square);
        const isLight = (r + f) % 2 === 0;
        renderer({ square, isLight, element, board: this });
      }
    }
  }

  private _ensureSquareElement(square: Square): HTMLDivElement {
    return this._ensureDomElement(square, this.squareElements, this.squareLayer);
  }

  private _positionSquareElement(element: HTMLDivElement, square: Square): void {
    this._positionElement(element, square);
  }

  private _clearSquareOverlay(): void {
    if (!this.squareLayer) {
      return;
    }
    this.squareLayer.innerHTML = '';
    this.squareElements.clear();
  }

  private _drawPieceSprite(piece: string, x: number, y: number, scale = 1): void {
    const custom = this.customPieceSprites[piece as Piece];
    if (custom) {
      this._drawCustomPieceSprite(custom, x, y, scale);
      return;
    }

    this._drawDefaultPieceSprite(piece, x, y, scale);
  }

  private _drawCustomPieceSprite(
    sprite: ResolvedPieceSprite,
    x: number,
    y: number,
    scale: number,
  ): void {
    const spriteScale = scale * (sprite.scale ?? 1);
    const size = this.square * spriteScale;
    const dx = x + (this.square - size) / 2 + sprite.offsetX * this.square;
    const dy = y + (this.square - size) / 2 + sprite.offsetY * this.square;
    this._drawImage(this.ctxP, 'pieces', sprite.image, dx, dy, size, size);
  }

  private _drawDefaultPieceSprite(piece: string, x: number, y: number, scale: number): void {
    const isWhite = isWhitePiece(piece);
    const idx = PIECE_INDEX_MAP[piece.toLowerCase()];
    const sx = idx * SPRITE_SIZE;
    const sy = isWhite ? SPRITE_SIZE : 0;
    const d = this.square * scale;
    const dx = x + (this.square - d) / 2;
    const dy = y + (this.square - d) / 2;

    this._drawImage(
      this.ctxP,
      'pieces',
      this.sprites.getSheet(),
      dx,
      dy,
      d,
      d,
      sx,
      sy,
      SPRITE_SIZE,
      SPRITE_SIZE,
    );
  }

  private _drawOverlay(transform?: CameraTransform | null): void {
    const ctx = this.ctxO;
    const W = this.cOverlay.width;
    const H = this.cOverlay.height;

    this._clearCanvas(ctx, 'overlay', 0, 0, W, H);
    const appliedTransform = this.canvasRenderer.applyCameraTransform(
      ctx,
      this.cOverlay,
      transform,
    );

    this._drawLastMoveHighlight();
    this._drawCustomHighlights();
    this._drawSelectedSquare();
    this._drawLegalMoves();
    this._drawLegacyArrows();
    this._drawPremoveHighlight();
    this._drawCheckStatusHighlight();
    this._drawHoverHighlight();
    this._drawDrawingManagerElements();

    this.canvasRenderer.restore(ctx, appliedTransform);
  }

  private _applyCameraDomTransforms(transform: CameraTransform | null): void {
    const cssTransform = this._formatCssCameraTransform(transform);

    if (this.domOverlay) {
      this.domOverlay.style.transform = cssTransform;
    }
    if (this.pieceLayer) {
      this.pieceLayer.style.transform = cssTransform;
    }
    if (this.squareLayer) {
      this.squareLayer.style.transform = cssTransform;
    }
  }

  private _formatCssCameraTransform(transform: CameraTransform | null): string {
    if (!transform) {
      return '';
    }

    const dpr = this.dpr || 1;
    const width = this.cOverlay ? this.cOverlay.width / dpr : this.sizePx;
    const height = this.cOverlay ? this.cOverlay.height / dpr : this.sizePx;

    return [
      `translate(${width / 2}px, ${height / 2}px)`,
      `scale(${transform.scale})`,
      `rotate(${transform.rotation}deg)`,
      `translate(${width / -2 + transform.x / dpr}px, ${height / -2 + transform.y / dpr}px)`,
    ].join(' ');
  }

  private _renderPiecesAndOverlayLayers(transform?: CameraTransform | null): void {
    const alreadyCapturing = this.isRenderCaptureActive;
    if (!alreadyCapturing) {
      this._startRenderCaptureFrame();
    }

    const cameraTransform = transform ?? this.cameraEffects?.getCurrentTransform() ?? null;
    this._applyCameraDomTransforms(cameraTransform);
    this._drawPieces(cameraTransform);
    this._drawOverlay(cameraTransform);

    if (!alreadyCapturing) {
      this._flushRenderCaptureFrame();
    }
  }

  private _drawLastMoveHighlight(): void {
    if (!this._lastMove) return;

    const { from, to } = this._lastMove;
    const s = this.square;
    const A = this._sqToXY(from);
    const B = this._sqToXY(to);

    this.ctxO.fillStyle = this.theme.lastMove;
    this._fillCanvas(this.ctxO, 'overlay', A.x, A.y, s, s);
    this._fillCanvas(this.ctxO, 'overlay', B.x, B.y, s, s);
  }

  private _drawCustomHighlights(): void {
    if (!this._customHighlights?.squares) return;

    this.ctxO.fillStyle = this._getMoveHighlightColor();
    for (const sqr of this._customHighlights.squares) {
      const { x, y } = this._sqToXY(sqr);
      this._fillCanvas(this.ctxO, 'overlay', x, y, this.square, this.square);
    }
  }

  private _drawSelectedSquare(): void {
    if (!this._selected) return;

    const { x, y } = this._sqToXY(this._selected);
    this.ctxO.fillStyle = this.theme.moveFrom;
    this._fillCanvas(this.ctxO, 'overlay', x, y, this.square, this.square);
  }

  private _drawLegalMoves(): void {
    if (!this.highlightLegal || !this._selected || !this._legalCached) return;

    const s = this.square;
    this.ctxO.fillStyle = this.theme.dot;

    for (const move of this._legalCached) {
      const { x, y } = this._sqToXY(move.to);
      this.ctxO.beginPath();
      this.ctxO.arc(x + s / 2, y + s / 2, s * LEGAL_MOVE_DOT_RADIUS, 0, Math.PI * 2);
      this.ctxO.fill();
    }
  }

  private _drawLegacyArrows(): void {
    for (const arrow of this._arrows) {
      this._drawArrow(arrow.from, arrow.to, arrow.color || this.theme.arrow);
    }
  }

  private _drawPremoveHighlight(): void {
    if (!this._premove) return;

    const s = this.square;
    const A = this._sqToXY(this._premove.from);
    const B = this._sqToXY(this._premove.to);

    this.ctxO.fillStyle = this.theme.premove;
    this._fillCanvas(this.ctxO, 'overlay', A.x, A.y, s, s);
    this._fillCanvas(this.ctxO, 'overlay', B.x, B.y, s, s);
  }

  private _drawCheckStatusHighlight(): void {
    const highlight = this._computeStatusHighlight();

    if (this.drawingManager) {
      if (highlight) {
        this.drawingManager.setStatusHighlight(highlight);
      } else {
        this.drawingManager.clearStatusHighlight();
      }
    }

    if (!highlight || this.drawingManager) {
      return;
    }

    this.ctxO.save();
    this.ctxO.fillStyle = highlight.color;
    this.ctxO.globalAlpha = highlight.opacity ?? 1;

    if (highlight.mode === 'board') {
      this._fillCanvas(
        this.ctxO,
        'overlay',
        0,
        0,
        this.square * this.filesCount,
        this.square * this.ranksCount,
      );
    } else {
      for (const sqr of highlight.squares ?? []) {
        const { x, y } = this._sqToXY(sqr);
        this._fillCanvas(this.ctxO, 'overlay', x, y, this.square, this.square);
      }
    }

    this.ctxO.restore();
  }

  private _computeStatusHighlight(): StatusHighlight | null {
    const inCheck = this.rules.inCheck?.() ?? false;
    const checkmate = this.rules.isCheckmate?.() ?? false;
    const stalemate = this.rules.isStalemate?.() ?? false;

    if (!inCheck && !checkmate && !stalemate) {
      return null;
    }

    if (stalemate) {
      return {
        mode: 'board',
        color: this._resolveStatusColor('stalemate'),
      };
    }

    const defendingColor = this.state.turn;
    const kingPiece: Piece = defendingColor === 'w' ? 'K' : 'k';
    const [kingSquare] = this.getPieceSquares(kingPiece);

    if (!kingSquare) {
      return null;
    }

    const status: 'check' | 'checkmate' = checkmate ? 'checkmate' : 'check';
    return {
      mode: 'squares',
      squares: [kingSquare],
      color: this._resolveStatusColor(status),
    };
  }

  private _drawHoverHighlight(): void {
    if (!this._hoverSq || !this._dragging) return;

    const { x, y } = this._sqToXY(this._hoverSq);
    this.ctxO.fillStyle = this._getMoveHighlightColor();
    this._fillCanvas(this.ctxO, 'overlay', x, y, this.square, this.square);
  }

  private _getMoveHighlightColor(): string {
    return this.theme.moveHighlight || this.theme.moveTo;
  }

  private _resolveStatusColor(status: 'check' | 'checkmate' | 'stalemate'): string {
    const color = this.theme[status];
    if (typeof color === 'string' && color.length > 0) {
      return color;
    }
    if (status === 'stalemate') {
      return this.theme.lastMove;
    }
    return this._getMoveHighlightColor();
  }

  private _drawDrawingManagerElements(): void {
    if (!this.drawingManager) return;

    this.drawingManager.renderStatusHighlight();
    if (this.showArrows) {
      this.drawingManager.renderArrows();
    }
    if (this.showHighlights) {
      this.drawingManager.renderHighlights();
    }
    if (this.allowPremoves) {
      this.drawingManager.renderPremove();
    }
    this.drawingManager.renderPromotionPreview();
    if (this.showSquareNames) {
      this.drawingManager.renderSquareNames(this.orientation, this.square, this.dpr);
    }
  }

  private _drawArrow(from: Square, to: Square, color: string): void {
    const s = this.square;
    const A = this._sqToXY(from);
    const B = this._sqToXY(to);
    this._drawArrowBetween(A.x + s / 2, A.y + s / 2, B.x + s / 2, B.y + s / 2, color);
  }

  private _drawArrowBetween(
    fromX: number,
    fromY: number,
    toX: number,
    toY: number,
    color: string,
  ): void {
    const dx = toX - fromX;
    const dy = toY - fromY;
    const len = Math.hypot(dx, dy);
    if (len < 1) return;

    const ux = dx / len;
    const uy = dy / len;
    const head = Math.min(MIN_ARROW_HEAD_SIZE * this.dpr, len * ARROW_HEAD_SIZE_FACTOR);
    const thick = Math.max(MIN_ARROW_THICKNESS * this.dpr, this.square * ARROW_THICKNESS_FACTOR);

    const ctx = this.ctxO;
    ctx.save();
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.globalAlpha = ARROW_OPACITY;

    // Draw arrow shaft
    ctx.beginPath();
    ctx.moveTo(fromX, fromY);
    ctx.lineTo(toX - ux * head, toY - uy * head);
    ctx.lineWidth = thick;
    ctx.stroke();

    // Draw arrow head
    ctx.beginPath();
    ctx.moveTo(toX, toY);
    ctx.lineTo(toX - ux * head - uy * head * 0.5, toY - uy * head + ux * head * 0.5);
    ctx.lineTo(toX - ux * head + uy * head * 0.5, toY - uy * head - ux * head * 0.5);
    ctx.closePath();
    ctx.fill();

    ctx.restore();
  }

  // ============================================================================
  // Private - Coordinate Conversion
  // ============================================================================

  private _getViewportSize(): { width: number; height: number } {
    return {
      width: this.cOverlay?.width ?? 0,
      height: this.cOverlay?.height ?? 0,
    };
  }

  private _getSquareBounds(square: Square): { x: number; y: number; size: number } | null {
    if (!square) {
      return null;
    }
    const { x, y } = this._sqToXY(square);
    return { x, y, size: this.square };
  }

  private _applyInverseCameraTransform(point: Point): Point {
    const transform = this.cameraEffects?.getCurrentTransform();
    if (!transform) {
      return point;
    }

    const { width, height } = this._getViewportSize();
    const scale = transform.scale || 1;
    const rad = (-transform.rotation * Math.PI) / 180;
    const cos = Math.cos(rad);
    const sin = Math.sin(rad);

    const dx = (point.x - width / 2) / scale;
    const dy = (point.y - height / 2) / scale;
    const rx = dx * cos - dy * sin;
    const ry = dx * sin + dy * cos;

    return {
      x: rx + width / 2 - transform.x,
      y: ry + height / 2 - transform.y,
    };
  }

  private _sqToXY(square: Square): Point {
    const { f, r } = this._squareToIndices(square);
    return this._calculateSquarePosition(f, r);
  }

  private _squareCssBounds(square: Square): { left: number; top: number; size: number } {
    const { x, y } = this._sqToXY(square);
    const scale = this.dpr || 1;
    return { left: x / scale, top: y / scale, size: this.square / scale };
  }

  private _squareCenter(square: Square): Point {
    const origin = this._sqToXY(square);
    return { x: origin.x + this.square / 2, y: origin.y + this.square / 2 };
  }

  private _calculateSquarePosition(file: number, rank: number): Point {
    const maxFile = this.filesCount - 1;
    const maxRank = this.ranksCount - 1;
    const ff = this.orientation === 'white' ? file : maxFile - file;
    const rr = this.orientation === 'white' ? maxRank - rank : rank;
    return { x: ff * this.square, y: rr * this.square };
  }

  private _xyToSquare(x: number, y: number): Square {
    const maxFile = this.filesCount - 1;
    const maxRank = this.ranksCount - 1;
    const f = clamp(Math.floor(x / this.square), 0, maxFile);
    const r = clamp(Math.floor(y / this.square), 0, maxRank);
    const ff = this.orientation === 'white' ? f : maxFile - f;
    const rr = this.orientation === 'white' ? maxRank - r : r;
    return this._indicesToSquare(ff, rr);
  }

  private _pieceAt(square: Square): string | null {
    const { f, r } = this._squareToIndices(square);
    return this.state.board[r]?.[f] ?? null;
  }

  // ============================================================================
  // Private - Event Handling
  // ============================================================================

  private _emitSquarePointerEvent<K extends SquarePointerEventName>(
    type: K,
    square: Square,
    event: PointerEvent,
  ): void {
    const piece = this._pieceAt(square) ?? null;
    const payload: BoardEventMap[K] = { square, piece, event } as BoardEventMap[K];
    this.bus.emit(type, payload);
  }

  private _emitSquareTransitionEvent<K extends SquareTransitionEventName>(
    type: K,
    square: Square,
    relatedSquare: Square | null,
    event: PointerEvent,
  ): void {
    const piece = this._pieceAt(square) ?? null;
    const payload: BoardEventMap[K] = {
      square,
      piece,
      relatedSquare,
      event,
    } as BoardEventMap[K];
    this.bus.emit(type, payload);
  }

  private _updatePointerSquare(square: Square | null, event: PointerEvent): void {
    if (square === this._pointerSquare) {
      return;
    }

    const previous = this._pointerSquare;
    if (previous) {
      this._emitSquareTransitionEvent('squareMouseOut', previous, square, event);
    }

    this._pointerSquare = square;

    if (square) {
      this._emitSquareTransitionEvent('squareMouseOver', square, previous, event);
    }
  }

  private _emitPieceDragEvent(
    event: PointerEvent,
    from: Square,
    piece: string,
    over: Square | null,
    pt: Point | null,
  ): void {
    this.bus.emit('pieceDrag', {
      from,
      piece,
      over,
      position: pt ? { x: pt.x, y: pt.y } : null,
      event,
    });
  }

  private _emitPieceDropEvent(
    event: PointerEvent,
    from: Square,
    piece: string,
    drop: Square | null,
    pt: Point | null,
  ): void {
    this.bus.emit('pieceDrop', {
      from,
      piece,
      drop,
      position: pt ? { x: pt.x, y: pt.y } : null,
      event,
    });
  }

  private _handleLeftMouseDown(e: PointerEvent): void {
    const pt = this._getPointerPosition(e);
    if (!pt) {
      this._updatePointerSquare(null, e);
      return;
    }

    const from = this._xyToSquare(pt.x, pt.y);
    this._updatePointerSquare(from, e);
    this._emitSquarePointerEvent('squareMouseDown', from, e);

    const piece = this._pieceAt(from);
    if (!piece) {
      return;
    }

    const side = isWhitePiece(piece) ? 'w' : 'b';
    if (side !== this.state.turn && !this.allowPremoves) {
      return;
    }

    if (this.canDragPiece) {
      const currentPosition = fenStringToPositionObject(this.getPosition(), {
        files: this.filesCount,
        ranks: this.ranksCount,
        fileLabels: this.fileLabels,
        rankLabels: this.rankLabels,
      });

      const canDrag = this.canDragPiece({
        board: this,
        orientation: this.orientation,
        position: currentPosition,
        square: from,
        piece: { pieceType: piece as Piece },
      });

      if (!canDrag) {
        return;
      }
    }

    if (!this._shouldSelectOnPointerDown(from, piece)) {
      this._hoverSq = from;
      this.renderAll();
      return;
    }

    this._setSelection(from, piece);
    this._hoverSq = from;
    this.renderAll();

    if (!this.allowDragging) {
      return;
    }

    this._pendingDrag = {
      from,
      piece,
      startClientX: e.clientX,
      startClientY: e.clientY,
      startX: pt.x,
      startY: pt.y,
    };

    if (this.dragActivationDistance <= 0) {
      this._activatePendingDrag(pt, e);
    }
  }

  private _handleLeftMouseUp(e: PointerEvent): void {
    const pt = this._getPointerPosition(e);
    const square = pt ? this._xyToSquare(pt.x, pt.y) : null;

    this._updatePointerAfterMouseUp(square, e);

    if (this.drawingManager?.handleMouseUp(pt?.x || 0, pt?.y || 0)) {
      this.renderAll();
      this._pendingDrag = null;
      return;
    }

    if (!this._dragging) {
      this._handleClickRelease(square, e);
      this._pendingDrag = null;
      return;
    }

    const dropPoint = this._resolveDropPoint(pt);

    this._handleDragEnd(e, dropPoint);
    this._pendingDrag = null;
  }

  private _updatePointerAfterMouseUp(square: Square | null, e: PointerEvent): void {
    if (square) {
      this._updatePointerSquare(square, e);
      this._emitSquarePointerEvent('squareMouseUp', square, e);
    } else {
      this._updatePointerSquare(null, e);
    }
  }

  private _resolveDropPoint(pt: Point | null): Point | null {
    if (pt) {
      return pt;
    }
    if (!this.allowDragOffBoard && this._dragging) {
      return { x: this._dragging.x, y: this._dragging.y };
    }
    return null;
  }

  private _handleClickRelease(square: Square | null, e: PointerEvent): void {
    if (this.drawingManager?.handleLeftClick()) {
      this.renderAll();
    }
    if (!square || e.button !== 0) {
      return;
    }
    this._emitSquarePointerEvent('squareClick', square, e);
    const clickedPiece = this._pieceAt(square);
    if (clickedPiece) {
      this.bus.emit('pieceClick', { square, piece: clickedPiece, event: e });
    }
    if (this.interactive) {
      this._handleClickMove(square);
    }
  }

  private _handleRightMouseDown(e: PointerEvent): void {
    const pt = this._getPointerPosition(e);
    if (pt) {
      const square = this._xyToSquare(pt.x, pt.y);
      this._updatePointerSquare(square, e);
      this._emitSquarePointerEvent('squareRightClick', square, e);
    } else {
      this._updatePointerSquare(null, e);
    }
    if (
      pt &&
      this.drawingManager?.handleRightMouseDown(pt.x, pt.y, e.shiftKey, e.ctrlKey, e.altKey)
    ) {
      this.renderAll();
    }
  }

  private _handleRightMouseUp(e: PointerEvent): void {
    const pt = this._getPointerPosition(e);
    const handledByDrawingManager = Boolean(
      this.drawingManager && pt && this.drawingManager.handleRightMouseUp(pt.x, pt.y),
    );

    if (!handledByDrawingManager && pt) {
      const handledByPremove = this._handleRightClickPremoveClear();
      if (!handledByPremove && this.rightClickHighlights) {
        const square = this._xyToSquare(pt.x, pt.y);
        this.drawingManager?.handleHighlightClick(square, e.shiftKey, e.ctrlKey, e.altKey);
      }
    }

    this.renderAll();
  }

  private _handleRightClickPremoveClear(): boolean {
    const activePremove = this.drawingManager?.getPremove();
    const queuedForWhite = this._premoveQueues.w.length > 0;
    const queuedForBlack = this._premoveQueues.b.length > 0;

    if (!activePremove && !queuedForWhite && !queuedForBlack) {
      return false;
    }

    const activeColor = this.drawingManager?.getActivePremoveColor?.();
    const colorsToClear = this._determineRightClickClearColors(
      activeColor,
      queuedForWhite,
      queuedForBlack,
    );

    this._clearPremoveColors(colorsToClear);
    return true;
  }

  private _determineRightClickClearColors(
    activeColor: 'w' | 'b' | undefined,
    queuedForWhite: boolean,
    queuedForBlack: boolean,
  ): Set<'white' | 'black'> {
    const colorsToClear = new Set<'white' | 'black'>();
    if (activeColor === 'w') {
      colorsToClear.add('white');
    } else if (activeColor === 'b') {
      colorsToClear.add('black');
    } else {
      if (queuedForWhite) colorsToClear.add('white');
      if (queuedForBlack) colorsToClear.add('black');
    }
    return colorsToClear;
  }

  private _clearPremoveColors(colorsToClear: Set<'white' | 'black'>): void {
    if (colorsToClear.size === 0) {
      this.clearPremove();
    } else if (colorsToClear.size === 2) {
      this.clearPremove('both');
    } else {
      this.clearPremove(colorsToClear.has('white') ? 'white' : 'black');
    }
  }

  private _handleMouseMove(e: PointerEvent, pt: Point | null): void {
    const square = pt ? this._xyToSquare(pt.x, pt.y) : null;
    if (square || this._pointerSquare) {
      this._updatePointerSquare(square, e);
    }

    this._maybeActivatePendingDrag(e, pt);

    if (pt && this.drawingManager?.handleMouseMove(pt.x, pt.y)) {
      this.renderAll();
    }

    if (this._dragging && pt) {
      if (this.dragSnapToSquare && square) {
        const center = this._squareCenter(square);
        this._dragging.x = center.x;
        this._dragging.y = center.y;
      } else {
        this._dragging.x = pt.x;
        this._dragging.y = pt.y;
      }
      this._hoverSq = square;
      this._autoScrollDuringDrag(e);
      this._renderPiecesAndOverlayLayers();
      this._emitPieceDragEvent(e, this._dragging.from, this._dragging.piece, square, pt);
    } else if (this._dragging && !pt) {
      this._autoScrollDuringDrag(e);
      this._emitPieceDragEvent(e, this._dragging.from, this._dragging.piece, null, null);
    } else if (pt && this.interactive) {
      const piece = square ? this._pieceAt(square) : null;
      this._updateCursor(piece ? 'pointer' : 'default');
    } else if (!pt) {
      this._updateCursor('default');
    }
  }

  private _maybeActivatePendingDrag(e: PointerEvent, pt: Point | null): void {
    if (!this._pendingDrag || !this.allowDragging) {
      return;
    }
    const distance = Math.hypot(
      e.clientX - this._pendingDrag.startClientX,
      e.clientY - this._pendingDrag.startClientY,
    );

    if (distance < this.dragActivationDistance) {
      return;
    }

    const activationPoint = pt ?? {
      x: this._pendingDrag.startX,
      y: this._pendingDrag.startY,
    };
    this._activatePendingDrag(activationPoint, e);
  }

  private _activatePendingDrag(pt: Point, event: PointerEvent): void {
    if (!this._pendingDrag) {
      return;
    }

    const { from, piece } = this._pendingDrag;
    const hoverSquare = this._xyToSquare(pt.x, pt.y);
    let dragX = pt.x;
    let dragY = pt.y;

    if (this.dragSnapToSquare && hoverSquare) {
      const center = this._squareCenter(hoverSquare);
      dragX = center.x;
      dragY = center.y;
    }

    this._dragging = { from, piece, x: dragX, y: dragY };
    this._pendingDrag = null;
    this._hoverSq = hoverSquare;

    if (this.allowAutoScroll) {
      this._ensureScrollContainer();
    }

    this._renderPiecesAndOverlayLayers();
    this._emitPieceDragEvent(event, from, piece, this._hoverSq, pt);
  }

  private _ensureScrollContainer(): void {
    if (!this.allowAutoScroll) {
      this._scrollContainer = null;
      return;
    }

    if (this._scrollContainer && this._scrollContainer.isConnected) {
      return;
    }

    let element: HTMLElement | null = this.root;
    while (element) {
      const style = globalThis.getComputedStyle?.(element);
      if (style && /(auto|scroll)/.test(`${style.overflow}${style.overflowX}${style.overflowY}`)) {
        this._scrollContainer = element;
        return;
      }
      element = element.parentElement;
    }

    this._scrollContainer = null;
  }

  private _autoScrollDuringDrag(e: PointerEvent): void {
    if (!this.allowAutoScroll || !this._dragging) {
      return;
    }

    this._ensureScrollContainer();
    const container = this._scrollContainer;
    if (!container) {
      return;
    }

    const rect = container.getBoundingClientRect();
    const threshold = 32;
    const maxStep = 24;

    const horizontalScrollable = container.scrollWidth > container.clientWidth;
    const verticalScrollable = container.scrollHeight > container.clientHeight;

    let deltaX = 0;
    let deltaY = 0;

    if (horizontalScrollable) {
      const distanceLeft = e.clientX - rect.left;
      const distanceRight = rect.right - e.clientX;
      if (distanceLeft < threshold) {
        deltaX = -Math.min(maxStep, threshold - distanceLeft);
      } else if (distanceRight < threshold) {
        deltaX = Math.min(maxStep, threshold - distanceRight);
      }
    }

    if (verticalScrollable) {
      const distanceTop = e.clientY - rect.top;
      const distanceBottom = rect.bottom - e.clientY;
      if (distanceTop < threshold) {
        deltaY = -Math.min(maxStep, threshold - distanceTop);
      } else if (distanceBottom < threshold) {
        deltaY = Math.min(maxStep, threshold - distanceBottom);
      }
    }

    if (!deltaX && !deltaY) {
      return;
    }

    if (typeof container.scrollBy === 'function') {
      container.scrollBy({ left: deltaX, top: deltaY, behavior: 'auto' });
    } else {
      container.scrollLeft += deltaX;
      container.scrollTop += deltaY;
    }
  }

  private _handleEscapeKey(): void {
    if (!this.dragCancelOnEsc && this._dragging) {
      return;
    }
    this._clearInteractionState();
    if (this.drawingManager) {
      this.drawingManager.cancelCurrentAction();
    }
    this.renderAll();
  }

  private _handleDragEnd(e: PointerEvent, pt: Point | null): void {
    if (!this._dragging) {
      return;
    }

    const dragging = this._dragging;
    const drop = pt ? this._xyToSquare(pt.x, pt.y) : null;

    this._emitPieceDropEvent(e, dragging.from, dragging.piece, drop, pt);

    this._dragging = null;
    this._hoverSq = null;

    if (!drop) {
      this._selected = null;
      this._legalCached = null;
      this.renderAll();
      return;
    }

    if (drop === dragging.from) {
      this.renderAll();
      return;
    }

    this.attemptMove(dragging.from, drop);
  }

  private _getPointerPosition(e: PointerEvent): Point | null {
    const rect = this.cOverlay.getBoundingClientRect();
    const scaleX = rect.width ? this.cOverlay.width / rect.width : 1;
    const scaleY = rect.height ? this.cOverlay.height / rect.height : 1;
    let x = (e.clientX - rect.left) * scaleX;
    let y = (e.clientY - rect.top) * scaleY;

    if (this.allowDragOffBoard) {
      x = clamp(x, 0, this.cOverlay.width);
      y = clamp(y, 0, this.cOverlay.height);
    } else if (x < 0 || y < 0 || x > this.cOverlay.width || y > this.cOverlay.height) {
      return null;
    }
    const adjusted = this._applyInverseCameraTransform({ x, y });
    if (
      !this.allowDragOffBoard &&
      (adjusted.x < 0 ||
        adjusted.y < 0 ||
        adjusted.x > this.cOverlay.width ||
        adjusted.y > this.cOverlay.height)
    ) {
      return null;
    }

    return {
      x: this.allowDragOffBoard ? clamp(adjusted.x, 0, this.cOverlay.width) : adjusted.x,
      y: this.allowDragOffBoard ? clamp(adjusted.y, 0, this.cOverlay.height) : adjusted.y,
    };
  }

  private _updateCursor(cursor: string): void {
    this.cOverlay.style.cursor = cursor;
  }

  // ============================================================================
  // Private - Move Logic
  // ============================================================================

  private _stripPgnComments(pgn: string): string {
    return pgn
      .replaceAll(PGN_COMMENT_REGEX, ' ')
      .replaceAll(MULTIPLE_SPACE_REGEX, ' ')
      .replaceAll(SPACED_NEWLINE_REGEX, '\n')
      .replaceAll(MULTIPLE_NEWLINES_REGEX, '\n\n')
      .trim();
  }

  private _handleClickMove(target: Square): void {
    const from = this._selected;
    if (!from || from === target) {
      if (from === target) {
        this.renderAll();
      }
      return;
    }

    const piece = this._pieceAt(from);
    if (!piece) {
      this._clearSelectionState();
      this.renderAll();
      return;
    }

    const targetPiece = this._pieceAt(target);
    if (targetPiece && isWhitePiece(targetPiece) === isWhitePiece(piece)) {
      this._setSelection(target, targetPiece);
      this.renderAll();
      return;
    }

    this.attemptMove(from, target);
  }

  private _attemptMove(
    from: Square,
    to: Square,
    options: { promotion?: Move['promotion'] } = {},
  ): boolean | 'pending' {
    if (this._isConflictingWithPendingPromotion(from, to)) {
      return false;
    }

    const piece = this._pieceAt(from);
    if (!piece) return false;

    const side = isWhitePiece(piece) ? 'w' : 'b';
    const promotion = options.promotion?.toLowerCase() as PromotionPiece | undefined;

    if (from === to) {
      this.renderAll();
      return true;
    }

    if (side !== this.state.turn) {
      return this._handlePremoveAttempt(from, to, side, promotion);
    }

    if (this._isPromotionMove(piece, to, side) && !promotion) {
      if (this.promotionOptions.autoQueen) {
        return this._executeMove(from, to, 'q');
      }
      return this._beginPromotionRequest(from, to, side, 'move');
    }

    return this._executeMove(from, to, promotion);
  }

  private _isConflictingWithPendingPromotion(from: Square, to: Square): boolean {
    return Boolean(
      this._pendingPromotion?.mode === 'move' &&
        (this._pendingPromotion.from !== from || this._pendingPromotion.to !== to),
    );
  }

  private _handlePremoveAttempt(
    from: Square,
    to: Square,
    side: 'w' | 'b',
    promotion?: PromotionPiece,
  ): boolean | 'pending' {
    if (!this.allowPremoves || !this._premoveSettings.colors[side]) return false;

    const piece = this._pieceAt(from)!;
    if (this._isPromotionMove(piece, to, side) && !promotion) {
      if (this.promotionOptions.autoQueen) {
        this._setPremove(from, to, 'q', side);
        return true;
      }
      return this._beginPromotionRequest(from, to, side, 'premove');
    }

    this._setPremove(from, to, promotion, side);
    return true;
  }

  private _executeMove(from: Square, to: Square, promotion?: PromotionPiece): boolean {
    const legal = this.rules.move({ from, to, promotion });

    if (legal?.ok) {
      this._processMoveSuccess(from, to, legal);
      return true;
    }

    this._processMoveFailure(from, to, legal);
    return false;
  }

  private _processMoveSuccess(from: Square, to: Square, legal: RulesMoveResponse): void {
    const fen = this.rules.getFEN();
    const oldState = this.state;
    const newState = this._parseFEN(fen);
    const movingColor = oldState.turn === 'w' ? 'white' : 'black';
    const moveDetail = legal.move as RulesMoveDetail | undefined;

    this.state = newState;
    this._syncOrientationFromTurn(false);
    this._clearSelectionState();
    if (!this._pendingPromotion) {
      this._hideInlinePromotion();
    }
    this._lastMove = { from, to };

    if (this.drawingManager) {
      this.drawingManager.clearArrows();
    }

    const eventType = this._determineSoundEventType(legal);
    if (eventType === 'capture') {
      this.captureEffectManager?.trigger(from, to);
    }
    this.audioManager.playSound(eventType, movingColor);
    this._animateTo(newState, oldState);
    this._triggerCameraEffectsForMove(from, to, legal);
    this._emitMoveEvent(from, to, fen, moveDetail ?? null);

    this.clockManager?.switchActive();

    setTimeout(() => {
      this._executePremoveIfValid();
    }, this.animationMs + POST_MOVE_PREMOVE_DELAY);
  }

  private _determineSoundEventType(legal: RulesMoveResponse): BoardSoundEventType {
    const moveDetail = legal.move as
      | { captured?: unknown; san?: string; promotion?: unknown; flags?: string }
      | undefined;
    const san = moveDetail?.san;

    const isCheckmate =
      this.rules.isCheckmate?.() === true || (typeof san === 'string' && san.includes('#'));

    if (isCheckmate) {
      return 'checkmate';
    }

    const isCheck =
      this.rules.inCheck?.() === true || (typeof san === 'string' && san.includes('+'));

    if (isCheck) {
      return 'check';
    }

    const isPromotion =
      moveDetail?.promotion !== undefined ||
      (typeof moveDetail?.flags === 'string' && moveDetail.flags.includes('p')) ||
      (typeof san === 'string' && san.includes('='));

    if (isPromotion) {
      return 'promote';
    }

    const capturedPiece = moveDetail?.captured;

    if (capturedPiece) {
      return 'capture';
    }

    return 'move';
  }

  private _triggerCameraEffectsForMove(from: Square, to: Square, legal: RulesMoveResponse): void {
    if (!this.cameraEffects || this.cameraEffectsOptions.enabled === false) {
      return;
    }

    if (this.cameraEffectsOptions.zoomOnMove) {
      this.zoomToMove(from, to).catch(() => {});
    }

    const moveDetail = legal.move as { captured?: unknown; san?: string } | undefined;
    const capturedPiece = moveDetail?.captured as string | null | undefined;
    const san = moveDetail?.san;
    const isCheckmate =
      this.rules.isCheckmate?.() === true || (typeof san === 'string' && san.includes('#'));

    if (isCheckmate && this.cameraEffectsOptions.shakeOnCheckmate !== false) {
      this.cameraEffects
        .shake(
          this.cameraEffectsOptions.checkmateShakeIntensity ?? 0.8,
          this.cameraEffectsOptions.checkmateShakeDuration ?? 600,
        )
        .catch(() => {});
      return;
    }

    if (capturedPiece && this.cameraEffectsOptions.shakeOnCapture !== false) {
      this.cameraEffects
        .shake(
          this.cameraEffectsOptions.captureShakeIntensity ?? 0.3,
          this.cameraEffectsOptions.captureShakeDuration ?? 200,
        )
        .catch(() => {});
    }
  }

  private _processMoveFailure(
    from: Square,
    to: Square,
    legal: RulesMoveResponse | null | undefined,
  ): void {
    this._clearSelectionState();
    this.renderAll();
    const activeColor = this.state.turn === 'w' ? 'white' : 'black';
    this.audioManager.playSound('illegal', activeColor);
    this._emitIllegalMoveEvent(from, to, legal);
  }

  private _setPremove(
    from: Square,
    to: Square,
    promotion: PromotionPiece | undefined,
    color: Color,
  ): void {
    if (!this.allowPremoves || !this._premoveSettings.colors[color]) return;

    const premove: Premove = promotion ? { from, to, promotion } : { from, to };
    this._queuePremove(color, premove, true);
    this._clearSelectionState();
  }

  private _shouldSelectOnPointerDown(square: Square, piece: string): boolean {
    if (!this._selected || this._selected === square) {
      return true;
    }

    const current = this._pieceAt(this._selected);
    if (!current) return true;

    const currentIsWhite = isWhitePiece(current);
    const nextIsWhite = isWhitePiece(piece);

    if (currentIsWhite === nextIsWhite) return true;

    const orientationIsWhite = this.orientation === 'white';
    return nextIsWhite === orientationIsWhite;
  }

  private _setSelection(square: Square, piece: string): void {
    const side = isWhitePiece(piece) ? 'w' : 'b';
    this._selected = square;

    if (side === this.state.turn) {
      // Use Worker if enabled and available
      if (this._useWorkerForLegalMoves && this._legalMovesWorkerManager?.isAvailable()) {
        // Calculate asynchronously with Worker
        const fen = this.rules.getFEN();
        this._legalCached = null; // Clear cache while calculating
        this._legalMovesWorkerManager
          .calculateMovesFrom(fen, square)
          .then((moves) => {
            // Only update if still the same selection
            if (this._selected === square && this.rules.getFEN() === fen) {
              this._legalCached = moves;
              this.renderAll();
            }
          })
          .catch((error) => {
            console.warn('Worker calculation failed, falling back to sync:', error);
            // Fallback to synchronous calculation
            if (this._selected === square) {
              this._legalCached = this.rules.movesFrom(square);
              this.renderAll();
            }
          });
      } else {
        // Synchronous calculation (default or fallback)
        this._legalCached = this.rules.movesFrom(square);
      }
    } else if (this.allowPremoves) {
      this._legalCached = [];
    } else {
      this._legalCached = null;
    }
  }

  // ============================================================================
  // Private - Promotion Logic
  // ============================================================================

  private _isPromotionMove(piece: string, to: Square, side: 'w' | 'b'): boolean {
    if (piece.toLowerCase() !== 'p') return false;

    if (this.ranksCount <= 0) return false;

    let rankIndex: number;
    try {
      ({ r: rankIndex } = this._squareToIndices(to));
    } catch {
      return false;
    }

    const promotionRankIndex = side === 'w' ? this.ranksCount - 1 : 0;
    return rankIndex === promotionRankIndex;
  }

  private _beginPromotionRequest(
    from: Square,
    to: Square,
    color: 'w' | 'b',
    mode: PromotionMode,
  ): 'pending' {
    this._cancelPendingPromotion();

    const token = ++this._promotionToken;
    const pending: PendingPromotionState = {
      token,
      from,
      to,
      color,
      mode,
      request: undefined as unknown as PromotionRequest,
    };

    this._pendingPromotion = pending;
    this._clearSelectionState();
    this._dragging = null;
    this.previewPromotionPiece(null);

    this.clockManager?.pause();

    const request: PromotionRequest = {
      from,
      to,
      color,
      mode,
      choices: [...PROMOTION_CHOICES],
      resolve: (choice) => this._resolvePromotion(token, choice),
      cancel: () => this._cancelPromotionRequest(token),
    };

    pending.request = request;
    this._handlePromotionRequestUI(pending);
    this._emitPromotionRequest(request);
    return 'pending';
  }

  private _resolvePromotion(token: number, piece: PromotionPiece): void {
    const pending = this._pendingPromotion;
    if (pending?.token !== token) return;

    this.previewPromotionPiece(piece);

    const { from, to, mode } = pending;
    this._pendingPromotion = null;
    this._hideInlinePromotion();

    this.clockManager?.start();

    if (mode === 'move') {
      this._attemptMove(from, to, { promotion: piece });
    } else {
      this._setPremove(from, to, piece, pending.color);
    }

    this.clearPromotionPreview();
  }

  private _cancelPromotionRequest(token: number): void {
    const pending = this._pendingPromotion;
    if (pending?.token !== token) return;

    this._pendingPromotion = null;
    this._hideInlinePromotion();
    this.clearPromotionPreview();

    this.clockManager?.start();
  }

  private _cancelPendingPromotion(): void {
    if (this._pendingPromotion) {
      this._pendingPromotion.request.cancel();
    }
  }

  private _emitPromotionRequest(request: PromotionRequest): void {
    if (this.promotionHandler) {
      try {
        const result = this.promotionHandler(request);
        if (result && typeof (result as Promise<unknown>).then === 'function') {
          Promise.resolve(result).catch((error) => {
            console.error('[NeoChessBoard] Promotion handler rejected.', error);
          });
        }
      } catch (error) {
        console.error('[NeoChessBoard] Promotion handler threw an error.', error);
      }
    }

    this.bus.emit('promotion', request);
  }

  private _handlePromotionRequestUI(pending: PendingPromotionState): void {
    if (this.promotionOptions.autoQueen) {
      this._hideInlinePromotion();
      return;
    }

    if (this.promotionOptions.ui === 'inline') {
      this._showInlinePromotion(pending);
    } else {
      this._hideInlinePromotion();
    }
  }

  private _updatePromotionOptions(options?: PromotionOptions): void {
    const previous = this.promotionOptions;
    const next: { autoQueen: boolean; ui: 'dialog' | 'inline' } = {
      autoQueen: options?.autoQueen === true,
      ui: options?.ui === 'inline' ? 'inline' : 'dialog',
    };

    this.promotionOptions = next;

    const pending = this._pendingPromotion;
    if (!pending) {
      if (previous.ui === 'inline' && next.ui !== 'inline') {
        this._hideInlinePromotion();
      }
      return;
    }

    if (next.autoQueen) {
      const token = pending.token;
      this._hideInlinePromotion();
      this._resolvePromotion(token, 'q');
      for (const overlay of this.root.querySelectorAll<HTMLElement>('.ncb-inline-promotion')) {
        overlay.innerHTML = '';
        delete overlay.dataset.square;
        delete overlay.dataset.color;
        delete overlay.dataset.mode;
      }
      return;
    }

    if (next.ui === 'inline') {
      this._showInlinePromotion(pending);
    } else if (previous.ui === 'inline') {
      this._hideInlinePromotion();
    }
  }

  private _ensureInlinePromotionContainer(): HTMLDivElement | null {
    if (typeof document === 'undefined') {
      return null;
    }

    const overlayRoot = this.domOverlay ?? this.root;
    const existing = overlayRoot.querySelectorAll<HTMLDivElement>('.ncb-inline-promotion');
    if (existing.length > 0) {
      const primary = existing[0];
      for (let i = 1; i < existing.length; i += 1) {
        const extra = existing[i];
        extra.remove();
      }
      this.inlinePromotionContainer = primary;
      return primary;
    }

    if (this.inlinePromotionContainer?.isConnected) {
      return this.inlinePromotionContainer;
    }

    const doc = this.root.ownerDocument ?? document;
    const container = doc.createElement('div');
    container.className = 'ncb-inline-promotion';
    Object.assign(container.style, {
      position: 'absolute',
      left: '0',
      top: '0',
      display: 'none',
      pointerEvents: 'auto',
      zIndex: '40',
    });
    container.addEventListener('pointerdown', (event) => {
      event.stopPropagation();
    });
    container.addEventListener('pointerup', (event) => {
      event.stopPropagation();
    });
    container.addEventListener('click', (event) => {
      event.stopPropagation();
    });

    overlayRoot.append(container);
    this.inlinePromotionContainer = container;
    return container;
  }

  private _calculateInlinePromotionMetrics(): {
    buttonSize: number;
    padding: number;
    gap: number;
    containerWidth: number;
    containerHeight: number;
  } {
    const cssSquare = this.dpr ? this.square / this.dpr : this.square;
    const buttonSize = Math.max(28, Math.min(72, Math.round(cssSquare * 0.82)));
    const padding = Math.max(4, Math.round(buttonSize * 0.24));
    const gap = Math.max(4, Math.round(buttonSize * 0.2));
    const count = Math.max(1, this.inlinePromotionButtons.length || 4);
    const containerWidth = buttonSize + padding * 2;
    const containerHeight = padding * 2 + buttonSize * count + gap * Math.max(0, count - 1);
    return { buttonSize, padding, gap, containerWidth, containerHeight };
  }

  private _styleInlinePromotionButtons(): { containerWidth: number; containerHeight: number } {
    if (!this.inlinePromotionContainer) {
      return { containerWidth: 0, containerHeight: 0 };
    }

    const metrics = this._calculateInlinePromotionMetrics();
    const { buttonSize, padding, gap, containerWidth, containerHeight } = metrics;
    const container = this.inlinePromotionContainer;

    Object.assign(container.style, {
      flexDirection: 'column',
      alignItems: 'stretch',
      padding: `${padding}px`,
      gap: `${gap}px`,
      width: `${containerWidth}px`,
      borderRadius: `${Math.max(8, Math.round(buttonSize * 0.28))}px`,
      background: 'rgba(15, 23, 42, 0.92)',
      boxShadow: '0 18px 40px rgba(15, 23, 42, 0.35)',
      backdropFilter: 'blur(6px)',
    });

    for (const button of this.inlinePromotionButtons) {
      Object.assign(button.style, {
        width: `${buttonSize}px`,
        height: `${buttonSize}px`,
        borderRadius: `${Math.max(6, Math.round(buttonSize * 0.28))}px`,
        border: '1px solid rgba(148, 163, 184, 0.45)',
        background: 'rgba(30, 41, 59, 0.85)',
        color: '#f8fafc',
        fontWeight: '600',
        fontSize: `${Math.round(buttonSize * 0.5)}px`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        padding: '0',
        transition: 'transform 120ms ease, background 120ms ease',
      });
    }

    return { containerWidth, containerHeight };
  }

  private _showInlinePromotion(pending: PendingPromotionState): void {
    const request = pending.request;
    if (!request) {
      return;
    }

    const container = this._ensureInlinePromotionContainer();
    if (!container) {
      return;
    }

    container.innerHTML = '';
    container.dataset.square = pending.to;
    container.dataset.color = pending.color;
    container.dataset.mode = pending.mode;

    const doc = container.ownerDocument ?? document;
    const pieces =
      request.choices && request.choices.length > 0 ? request.choices : [...PROMOTION_CHOICES];

    this.inlinePromotionButtons = pieces.map((piece) => {
      const button = doc.createElement('button');
      button.type = 'button';
      button.className = 'ncb-inline-promotion__choice';
      button.dataset.piece = piece;
      button.title = `Promote to ${piece.toUpperCase()}`;
      button.textContent = piece.toUpperCase();
      button.addEventListener('pointerenter', () => {
        this.previewPromotionPiece(piece);
      });
      button.addEventListener('pointerleave', () => {
        this.previewPromotionPiece(null);
      });
      button.addEventListener('focus', () => {
        this.previewPromotionPiece(piece);
      });
      button.addEventListener('blur', () => {
        this.previewPromotionPiece(null);
      });
      button.addEventListener('click', (event) => {
        event.preventDefault();
        event.stopPropagation();
        if (!this._pendingPromotion || this._pendingPromotion.token !== pending.token) {
          return;
        }
        request.resolve(piece);
      });
      button.addEventListener('keydown', (event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          event.stopPropagation();
          if (!this._pendingPromotion || this._pendingPromotion.token !== pending.token) {
            return;
          }
          request.resolve(piece);
        }
      });
      button.addEventListener('pointerdown', (event) => {
        event.stopPropagation();
        button.style.transform = 'scale(0.97)';
      });
      button.addEventListener('pointerup', (event) => {
        event.stopPropagation();
        button.style.transform = 'scale(1)';
      });
      button.addEventListener('pointerleave', () => {
        button.style.transform = 'scale(1)';
      });
      container.append(button);
      return button;
    });

    container.style.display = 'flex';
    this.inlinePromotionToken = pending.token;
    this._styleInlinePromotionButtons();
    this._updateInlinePromotionPosition();
  }

  private _hideInlinePromotion(): void {
    const container = this.inlinePromotionContainer;
    if (!container) {
      return;
    }
    container.style.display = 'none';
    delete container.dataset.square;
    delete container.dataset.color;
    delete container.dataset.mode;
    const replacer = container as HTMLElement & {
      replaceChildren?: (...nodes: Node[]) => void;
    };
    replacer.replaceChildren?.();
    container.innerHTML = '';
    this.inlinePromotionButtons = [];
    this.inlinePromotionToken = null;
  }

  private _updateInlinePromotionPosition(): void {
    const container = this.inlinePromotionContainer;
    const pending = this._pendingPromotion;

    if (!container || !pending) {
      return;
    }
    if (container.style.display === 'none') {
      return;
    }
    if (this.inlinePromotionToken !== pending.token) {
      return;
    }

    const { containerWidth, containerHeight } = this._styleInlinePromotionButtons();
    const boardWidth = this.cOverlay ? this.cOverlay.width / (this.dpr || 1) : this.sizePx;
    const boardHeight = this.cOverlay ? this.cOverlay.height / (this.dpr || 1) : this.sizePx;
    const { x, y } = this._sqToXY(pending.to);
    const cssX = this.dpr ? x / this.dpr : x;
    const cssY = this.dpr ? y / this.dpr : y;
    const cssSquare = this.dpr ? this.square / this.dpr : this.square;

    let left = cssX + cssSquare;
    if (left + containerWidth > boardWidth) {
      left = cssX - containerWidth;
    }
    if (left < 0) {
      left = 0;
    }

    let top = cssY + cssSquare / 2 - containerHeight / 2;
    if (top < 0) {
      top = 0;
    }
    if (top + containerHeight > boardHeight) {
      top = boardHeight - containerHeight;
    }

    container.style.left = `${Math.round(left)}px`;
    container.style.top = `${Math.round(top)}px`;
  }

  // ============================================================================
  // Private - Premove Execution
  // ============================================================================

  private _executePremoveIfValid(): void {
    if (!this.allowPremoves) return;

    const color = this.state.turn;
    const queue = this._premoveQueues[color];

    if (queue.length === 0) {
      this._syncPremoveDisplay(undefined, false);
      return;
    }

    while (queue.length > 0) {
      const premove = queue[0];
      const premoveResult = this.rules.move({
        from: premove.from,
        to: premove.to,
        promotion: premove.promotion,
      });

      if (premoveResult?.ok) {
        setTimeout(() => {
          this._executePremove(premove, color);
        }, PREMOVE_EXECUTION_DELAY);
        return;
      }

      this._handleInvalidPremove(color, premove, premoveResult?.reason);
      if (queue.length === 0) {
        this._syncPremoveDisplay(undefined, false);
        return;
      }
    }

    this._syncPremoveDisplay(undefined, false);
  }

  private _executePremove(premove: Premove, color: Color): void {
    this._removeMatchingPremove(color, premove);

    const newFen = this.rules.getFEN();
    const newState = this._parseFEN(newFen);
    const oldState = this.state;

    this.state = newState;
    this._syncOrientationFromTurn(false);
    this._lastMove = { from: premove.from, to: premove.to };

    this.drawingManager?.clearArrows();

    this._syncPremoveDisplay(undefined, false);

    this._animateTo(newState, oldState);
    this._emitMoveEvent(premove.from, premove.to, newFen);
    this._emitPremoveApplied(premove, color, newFen);

    setTimeout(() => {
      this._executePremoveIfValid();
    }, this.animationMs + POST_MOVE_PREMOVE_DELAY);
  }

  private _queuePremove(color: Color, premove: Premove, render: boolean): void {
    if (!this._premoveSettings.colors[color]) {
      return;
    }

    const entry: Premove = premove.promotion
      ? { from: premove.from, to: premove.to, promotion: premove.promotion }
      : { from: premove.from, to: premove.to };

    this._premoveQueues[color] = this._premoveSettings.multi
      ? [...this._premoveQueues[color], entry]
      : [entry];

    this._syncPremoveDisplay(color, render);
  }

  private _syncPremoveDisplay(preferredColor?: Color, render = false): void {
    if (!this.allowPremoves) {
      if (this.drawingManager) {
        this.drawingManager.setPremoveQueues(undefined, undefined);
      }
      this._premove = null;
      if (render) {
        this.renderAll();
      }
      return;
    }

    const active = this._determineActivePremove(preferredColor);
    if (this.drawingManager) {
      this.drawingManager.setPremoveQueues(this._buildPremoveQueueState(), active ?? undefined);
    }
    this._premove = active ? { ...active.premove } : null;

    if (render) {
      this.renderAll();
    }
  }

  private _buildPremoveQueueState(): Partial<Record<Color, Premove[]>> | undefined {
    const queues: Partial<Record<Color, Premove[]>> = {};
    for (const color of ['w', 'b'] as const) {
      if (!this._premoveSettings.colors[color]) continue;
      if (this._premoveQueues[color].length > 0) {
        queues[color] = this._premoveQueues[color].map((entry) => ({ ...entry }));
      }
    }
    return Object.keys(queues).length > 0 ? queues : undefined;
  }

  private _determineActivePremove(
    preferredColor?: Color,
  ): { color: Color; premove: Premove } | null {
    const order: Color[] = [];
    const seen = new Set<Color>();
    const push = (color: Color): void => {
      if (!seen.has(color)) {
        seen.add(color);
        order.push(color);
      }
    };

    if (preferredColor) {
      push(preferredColor);
    } else {
      const waiting = this._defaultPremoveColor();
      push(waiting);
      push(this.state.turn);
    }
    push('w');
    push('b');

    for (const color of order) {
      if (!this._premoveSettings.colors[color]) continue;
      const queue = this._premoveQueues[color];
      if (queue.length > 0) {
        return { color, premove: { ...queue[0] } };
      }
    }

    return null;
  }

  private _truncateQueuesForSingle(): void {
    for (const color of ['w', 'b'] as const) {
      if (this._premoveQueues[color].length > 1) {
        this._premoveQueues[color] = [this._premoveQueues[color][0]];
      }
    }
  }

  private _handleInvalidPremove(color: Color, premove: Premove, reason?: string): void {
    this._removeMatchingPremove(color, premove);
    this._syncPremoveDisplay(color, true);
    const payload: PremoveInvalidatedEvent = {
      color: this._colorCodeToString(color),
      premove: { ...premove },
      reason,
    };
    this.bus.emit('premoveInvalidated', payload);
  }

  private _removeMatchingPremove(color: Color, premove: Premove): void {
    const queue = this._premoveQueues[color];
    if (queue.length === 0) return;

    if (this._arePremovesEqual(queue[0], premove)) {
      queue.shift();
      return;
    }

    const index = queue.findIndex((entry) => this._arePremovesEqual(entry, premove));
    if (index !== -1) {
      queue.splice(index, 1);
    }
  }

  private _arePremovesEqual(a: Premove, b: Premove): boolean {
    return a.from === b.from && a.to === b.to && (a.promotion ?? null) === (b.promotion ?? null);
  }

  private _emitPremoveApplied(premove: Premove, color: Color, fen: string): void {
    const payload: PremoveAppliedEvent = {
      from: premove.from,
      to: premove.to,
      fen,
      color: this._colorCodeToString(color),
      promotion: premove.promotion,
      remaining: this._premoveQueues[color].length,
    };
    this.bus.emit('premoveApplied', payload);
  }

  private _colorCodeToString(color: Color): 'white' | 'black' {
    return color === 'w' ? 'white' : 'black';
  }

  private _resolveTargetColor(color?: ColorInput): Color {
    const normalized = this._normalizeColorSelection(color as Color | 'white' | 'black');
    return normalized[0] ?? this._defaultPremoveColor();
  }

  private _defaultPremoveColor(): Color {
    return this.state.turn === 'w' ? 'b' : 'w';
  }

  private _normalizeColorSelection(input?: PremoveColorListInput): Color[] {
    if (input === undefined) {
      return [];
    }

    const values = Array.isArray(input) ? input : [input];
    const result: Color[] = [];

    for (const value of values) {
      if (value === 'both') {
        if (!result.includes('w')) result.push('w');
        if (!result.includes('b')) result.push('b');
        continue;
      }

      let code: Color | PremoveColorOption | undefined = value;
      if (value === 'white') {
        code = 'w';
      } else if (value === 'black') {
        code = 'b';
      }
      if ((code === 'w' || code === 'b') && !result.includes(code)) {
        result.push(code);
      }
    }

    return result;
  }

  private _resolveColorsForClearing(color?: PremoveColorOption): Color[] {
    const normalized = this._normalizeColorSelection(color);
    return normalized.length > 0 ? normalized : (['w', 'b'] as Color[]);
  }

  private _applyInitialPremoveSettings(settings: BoardPremoveSettings): void {
    if (typeof settings.multi === 'boolean') {
      this._premoveSettings.multi = settings.multi;
    }
    if (settings.color) {
      this._setPremoveColorsFromColorOption(settings.color);
    }
    if (settings.colors) {
      this._setPremoveColors(settings.colors);
    }
  }

  private _setPremoveColorsFromColorOption(option: PremoveColorOption): void {
    if (option === 'white') {
      this._premoveSettings.colors = { w: true, b: false };
      this._premoveQueues.b = [];
    } else if (option === 'black') {
      this._premoveSettings.colors = { w: false, b: true };
      this._premoveQueues.w = [];
    } else {
      this._premoveSettings.colors = { w: true, b: true };
    }
  }

  private _setPremoveColors(colors: Partial<Record<'white' | 'black', boolean>>): void {
    if (typeof colors.white === 'boolean') {
      this._premoveSettings.colors.w = colors.white;
      if (!colors.white) {
        this._premoveQueues.w = [];
      }
    }
    if (typeof colors.black === 'boolean') {
      this._premoveSettings.colors.b = colors.black;
      if (!colors.black) {
        this._premoveQueues.b = [];
      }
    }
  }

  private _createPremoveController(): BoardPremoveController {
    return {
      enable: (options: BoardPremoveEnableOptions = {}) => {
        if (typeof options.multi === 'boolean') {
          this._premoveSettings.multi = options.multi;
          if (!options.multi) {
            this._truncateQueuesForSingle();
          }
        }

        if (options.color) {
          this._setPremoveColorsFromColorOption(options.color);
        }

        if (options.colors) {
          this._setPremoveColors(options.colors);
        }

        if (this.allowPremoves) {
          this._syncPremoveDisplay(undefined, true);
        } else {
          this.setAllowPremoves(true);
        }
      },
      disable: (color) => {
        if (!color) {
          this.setAllowPremoves(false);
          return;
        }

        const colors = this._normalizeColorSelection(color);
        if (colors.length === 0) {
          this.setAllowPremoves(false);
          return;
        }

        let updated = false;
        for (const code of colors) {
          if (this._premoveSettings.colors[code]) {
            this._premoveSettings.colors[code] = false;
            this._premoveQueues[code] = [];
            updated = true;
          }
        }

        if (updated) {
          this._syncPremoveDisplay(undefined, true);
        }
      },
      clear: (color) => {
        const colors = color ? this._resolveColorsForClearing(color) : (['w', 'b'] as Color[]);
        let updated = false;
        for (const code of colors) {
          if (this._premoveQueues[code].length > 0) {
            this._premoveQueues[code] = [];
            updated = true;
          }
        }
        if (updated) {
          this._syncPremoveDisplay(undefined, true);
        }
      },
      getQueue: (color) => {
        const resolved = color
          ? this._normalizeColorSelection(color)[0]
          : this._defaultPremoveColor();
        const target = resolved ?? this._defaultPremoveColor();
        return this._premoveQueues[target].map((entry) => ({ ...entry }));
      },
      getQueues: () => ({
        white: this._premoveQueues.w.map((entry) => ({ ...entry })),
        black: this._premoveQueues.b.map((entry) => ({ ...entry })),
      }),
      isEnabled: () => this.allowPremoves,
      isMulti: () => this._premoveSettings.multi,
      setMulti: (enabled) => {
        this._premoveSettings.multi = enabled;
        if (!enabled) {
          this._truncateQueuesForSingle();
        }
        this._syncPremoveDisplay(undefined, true);
      },
      config: (): BoardPremoveControllerConfig => ({
        enabled: this.allowPremoves,
        multi: this._premoveSettings.multi,
        colors: {
          white: this._premoveSettings.colors.w,
          black: this._premoveSettings.colors.b,
        },
      }),
    };
  }

  private _syncQueuesFromDrawingManager(): void {
    if (!this.drawingManager) {
      return;
    }

    const queues = this.drawingManager.getPremoveQueues();
    this._premoveQueues.w = queues?.w ? queues.w.map((entry) => ({ ...entry })) : [];
    this._premoveQueues.b = queues?.b ? queues.b.map((entry) => ({ ...entry })) : [];

    const activeColor = this.drawingManager.getActivePremoveColor();
    this._premove =
      activeColor && this._premoveQueues[activeColor]?.length
        ? { ...this._premoveQueues[activeColor][0] }
        : null;
  }

  // ============================================================================
  // Private - Animation
  // ============================================================================

  private _clearAnimation(): void {
    cancelAnimationFrame(this._raf);
    this._raf = 0;
  }

  private _animateTo(target: BoardState, start: BoardState): void {
    this._clearAnimation();

    if (!this.showAnimations || this.animationMs <= 0) {
      this.renderAll();
      return;
    }

    const startTime = performance.now();
    const moving = this._identifyMovingPieces(start, target);

    const tick = () => {
      const progress = clamp((performance.now() - startTime) / this.animationMs, 0, 1);
      const eased = this.animationEasingFn(progress);

      this._renderAnimationFrame(target, moving, eased);

      if (progress < 1) {
        this._raf = requestAnimationFrame(tick);
      } else {
        this._raf = 0;
        this.renderAll();
      }
    };

    this._raf = requestAnimationFrame(tick);
  }

  private _identifyMovingPieces(start: BoardState, target: BoardState): Map<string, string> {
    const moving = new Map<string, string>();

    for (let r = 0; r < this.ranksCount; r++) {
      for (let f = 0; f < this.filesCount; f++) {
        const startPiece = start.board[r][f];
        const targetPiece = target.board[r][f];

        if (startPiece && (!targetPiece || startPiece !== targetPiece)) {
          const destination = this._findPieceDestination(
            target.board,
            startPiece,
            r,
            f,
            start.board,
          );
          if (destination) {
            moving.set(
              this._indicesToSquare(f, r),
              this._indicesToSquare(destination.f, destination.r),
            );
          }
        }
      }
    }

    return moving;
  }

  private _renderAnimationFrame(
    target: BoardState,
    moving: Map<string, string>,
    progress: number,
  ): void {
    const ctx = this.ctxP;
    const transform = this.cameraEffects?.getCurrentTransform() ?? null;
    this._applyCameraDomTransforms(transform);
    this._startRenderCaptureFrame();
    this._clearCanvas(ctx, 'pieces', 0, 0, this.cPieces.width, this.cPieces.height);
    const appliedTransform = this.canvasRenderer.applyCameraTransform(ctx, this.cPieces, transform);

    for (let r = 0; r < this.ranksCount; r++) {
      for (let f = 0; f < this.filesCount; f++) {
        const targetPiece = target.board[r][f];
        if (!targetPiece) continue;

        const toSq = this._indicesToSquare(f, r);
        const fromKey = this._findMovingPieceSource(moving, toSq);

        if (fromKey) {
          this._drawMovingPiece(fromKey, toSq, targetPiece, progress);
        } else {
          this._drawStationaryPiece(toSq, targetPiece);
        }
      }
    }

    this.canvasRenderer.restore(ctx, appliedTransform);

    this._drawOverlay(transform);
    this._flushRenderCaptureFrame();
  }

  private _findMovingPieceSource(moving: Map<string, string>, target: Square): Square | null {
    for (const [from, to] of moving.entries()) {
      if (to === target) return from as Square;
    }
    return null;
  }

  private _drawMovingPiece(from: Square, to: Square, piece: string, progress: number): void {
    const { x: fx, y: fy } = this._sqToXY(from);
    const { x: tx, y: ty } = this._sqToXY(to);
    const x = lerp(fx, tx, progress);
    const y = lerp(fy, ty, progress);
    this._drawPieceSprite(piece, x, y, 1);
  }

  private _drawStationaryPiece(square: Square, piece: string): void {
    const { x, y } = this._sqToXY(square);
    this._drawPieceSprite(piece, x, y, 1);
  }

  private _findPieceDestination(
    board: (string | null)[][],
    piece: string,
    r0: number,
    f0: number,
    start: (string | null)[][],
  ): { r: number; f: number } | null {
    for (let r = 0; r < this.ranksCount; r++) {
      for (let f = 0; f < this.filesCount; f++) {
        if (board[r][f] === piece && start[r][f] !== piece) {
          return { r, f };
        }
      }
    }
    return null;
  }

  // ============================================================================
  // Private - Sound Management
  // ============================================================================
  // ============================================================================
  // Private - Piece Set Management
  // ============================================================================

  private _shouldClearPieceSet(pieceSet?: PieceSet | null): boolean {
    const hasExistingPieces =
      Boolean(this._pieceSetRaw) || Object.keys(this.customPieceSprites).length > 0;

    return (!pieceSet?.pieces || Object.keys(pieceSet.pieces).length === 0) && hasExistingPieces;
  }

  private _clearPieceSet(): void {
    this._pieceSetRaw = undefined;
    this.customPieceSprites = {};
    this._pieceSetToken++;
    this.renderAll();
  }

  private async _loadPieceSet(pieceSet: PieceSet): Promise<void> {
    this._pieceSetRaw = pieceSet;
    const token = ++this._pieceSetToken;
    const defaultScale = pieceSet.defaultScale ?? 1;
    const resolved: Partial<Record<Piece, ResolvedPieceSprite>> = {};

    const entries = Object.entries(pieceSet.pieces) as Array<
      [Piece, PieceSpriteSource | PieceSprite]
    >;

    await Promise.all(
      entries.map(async ([pieceKey, sprite]) => {
        if (!sprite) return;
        try {
          const resolvedSprite = await this._resolvePieceSprite(sprite, defaultScale);
          if (resolvedSprite) {
            resolved[pieceKey as Piece] = resolvedSprite;
          }
        } catch (error) {
          console.warn(`[NeoChessBoard] Failed to load sprite for piece "${pieceKey}".`, error);
        }
      }),
    );

    if (token !== this._pieceSetToken) return;

    this.customPieceSprites = resolved;
    this.renderAll();
  }

  private async _resolvePieceSprite(
    sprite: PieceSpriteSource | PieceSprite,
    defaultScale: number,
  ): Promise<ResolvedPieceSprite | null> {
    let config: PieceSprite;
    config =
      typeof sprite === 'object' && sprite !== null && 'image' in (sprite as PieceSprite)
        ? (sprite as PieceSprite)
        : ({ image: sprite } as PieceSprite);

    let source: PieceSpriteImage | null = null;
    if (typeof config.image === 'string') {
      source = await this._loadImage(config.image);
    } else if (config.image) {
      source = config.image;
    }

    if (!source) return null;

    return {
      image: source,
      scale: config.scale ?? defaultScale ?? 1,
      offsetX: config.offsetX ?? 0,
      offsetY: config.offsetY ?? 0,
    };
  }

  private _loadImage(src: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const doc = this.root?.ownerDocument ?? (typeof document === 'undefined' ? null : document);
      let img: HTMLImageElement | null = null;
      if (typeof Image !== 'undefined') {
        img = new Image();
      } else if (doc) {
        img = doc.createElement('img') as HTMLImageElement;
      }

      if (!img) {
        reject(new Error('Image loading is not supported in the current environment.'));
        return;
      }

      if (!src.startsWith('data:')) {
        img.crossOrigin = 'anonymous';
      }

      try {
        img.decoding = 'async';
      } catch {
        // Ignore browsers that do not support decoding
      }

      img.addEventListener('load', () => resolve(img));
      img.addEventListener('error', (event) => {
        if (event instanceof ErrorEvent && event.error instanceof Error) {
          reject(event.error);
          return;
        }

        const message =
          event instanceof ErrorEvent && event.message ? event.message : 'Image failed to load.';
        reject(new Error(message));
      });
      img.src = src;
    });
  }

  // ============================================================================
  // Private - Extension Management
  // ============================================================================

  private _initializeExtensions(configs: ExtensionConfig[] | undefined): void {
    this.extensionStates = [];
    if (!configs || configs.length === 0) return;

    for (const [index, config] of configs.entries()) {
      const id = config.id ?? `extension-${index + 1}`;
      const state: ExtensionState = {
        id,
        config,
        context: null,
        instance: null,
        disposers: [],
        initialized: false,
        destroyed: false,
      };

      this.extensionStates.push(state);
      const options = (config.options ?? {}) as unknown;
      const context = this._createExtensionContext(state, options);
      state.context = context;

      try {
        const instance = config.create(context);
        state.instance = (instance as Extension<unknown>) ?? null;
      } catch (error) {
        console.error(`[NeoChessBoard] Failed to create extension "${id}".`, error);
        state.instance = null;
      }
    }
  }

  private _createExtensionContext<TOptions>(
    state: ExtensionState,
    options: TOptions,
  ): ExtensionContext<TOptions> {
    return {
      id: state.id,
      board: this,
      bus: this.bus,
      options,
      initialOptions: this.initialOptions,
      registerExtensionPoint: (event, handler) =>
        this._registerExtensionHandler(state, event, handler),
    };
  }

  private _registerExtensionHandler<K extends keyof BoardEventMap>(
    state: ExtensionState,
    event: K,
    handler: (payload: BoardEventMap[K]) => void,
  ): () => void {
    const off = this.bus.on(event, handler);
    state.disposers.push(off);
    return () => {
      off();
      state.disposers = state.disposers.filter((candidate) => candidate !== off);
    };
  }

  private _findExtensionState(extensionId: string): ExtensionState | undefined {
    return this.extensionStates.find((item) => item.id === extensionId);
  }

  private _callExtensionHook(
    state: ExtensionState,
    hook: keyof Extension<unknown>,
    ...args: unknown[]
  ): void {
    if (!state.instance || !state.context) {
      return;
    }

    const fn = state.instance[hook];
    if (typeof fn !== 'function') return;

    try {
      (fn as (...fnArgs: unknown[]) => void).apply(state.instance, [state.context, ...args]);
    } catch (error) {
      console.error(`Extension "${state.id}" hook ${String(hook)} failed.`, error);
    }
  }

  private _invokeExtensionHook(hook: 'onInit' | 'onBeforeRender' | 'onAfterRender'): void {
    for (const state of this.extensionStates) {
      if (state.destroyed) continue;
      if (hook === 'onInit') {
        if (state.initialized) continue;
        state.initialized = true;
      }
      this._callExtensionHook(state, hook);
    }
  }

  private _notifyExtensionEvent(
    hook: 'onMove' | 'onIllegalMove' | 'onUpdate',
    payload: BoardEventMap[keyof BoardEventMap],
  ): void {
    for (const state of this.extensionStates) {
      if (state.destroyed) continue;
      this._callExtensionHook(state, hook, payload);
    }
  }

  private _runExtensionDisposers(state: ExtensionState): void {
    while (state.disposers.length > 0) {
      const disposer = state.disposers.pop();
      if (!disposer) continue;
      try {
        disposer();
      } catch (error) {
        console.error(`Extension "${state.id}" cleanup failed.`, error);
      }
    }
  }

  private _disposeExtensions(): void {
    for (const state of this.extensionStates) {
      if (state.destroyed) continue;
      state.destroyed = true;
      this._callExtensionHook(state, 'onDestroy');
      this._runExtensionDisposers(state);
    }
    this.extensionStates = [];
  }

  // ============================================================================
  // Private - PGN & Annotations
  // ============================================================================

  private _loadPgnInRules(pgnString: string): boolean {
    return this.rules.loadPgn?.(pgnString) ?? false;
  }

  private _getPgnNotation(): PgnNotation | null {
    return this.rules.getPgnNotation?.() ?? null;
  }

  private _displayPgnAnnotations(pgnString: string): void {
    const pgnNotation = this._getPgnNotation();
    if (pgnNotation) {
      pgnNotation.loadPgnWithAnnotations(pgnString);
      this.lastPgnLoadIssues = pgnNotation.getParseIssues();
      this._displayAnnotationsFromPgn(pgnNotation);
    }
  }

  private _updateStateAfterPgnLoad(): void {
    this.state = this._parseFEN(this.rules.getFEN());
    this._syncOrientationFromTurn(false);
    this.renderAll();
  }

  private _displayAnnotationsFromPgn(pgnNotation: PgnNotation): void {
    if (!this.drawingManager) return;

    this.drawingManager.clearArrows();
    this.drawingManager.clearHighlights();

    const moves = pgnNotation.getMovesWithAnnotations();
    if (moves.length === 0) return;

    const totalPlies = moves.reduce(
      (accumulator, move) => accumulator + (move.white ? 1 : 0) + (move.black ? 1 : 0),
      0,
    );

    this.showPgnAnnotationsForPly(totalPlies);
  }

  private _applyAnnotations(annotations: PgnMoveAnnotations): void {
    if (annotations.arrows) {
      for (const arrow of annotations.arrows) {
        this.drawingManager!.addArrowFromObject(arrow);
      }
    }

    if (annotations.circles) {
      for (const circle of annotations.circles) {
        this.drawingManager!.addHighlightFromObject(circle);
      }
    }
  }

  private _saveAnnotationsToPgn(
    arrows: Arrow[],
    circles: SquareHighlight[],
    comment: string,
  ): void {
    const pgnNotation = this._getPgnNotation();
    if (!pgnNotation) return;

    const moveHistory = this.rules.history ? this.rules.history() : [];
    const moveCount = moveHistory.length;
    const moveNumber = Math.floor(moveCount / 2) + 1;
    const isWhite = moveCount % 2 === 0;

    pgnNotation.addMoveAnnotations(moveNumber, isWhite, {
      arrows,
      circles,
      textComment: comment,
    });
  }

  private _displayAnnotations(arrows: Arrow[], circles: SquareHighlight[]): void {
    for (const arrow of arrows) {
      this.drawingManager!.addArrowFromObject(arrow);
    }

    for (const circle of circles) {
      this.drawingManager!.addHighlightFromObject(circle);
    }
  }

  // ============================================================================
  // Private - State Management
  // ============================================================================

  private _clearInteractionState(): void {
    this._selected = null;
    this._legalCached = null;
    this._dragging = null;
    this._hoverSq = null;
    this._pendingDrag = null;
  }

  private _clearSelectionState(): void {
    this._selected = null;
    this._legalCached = null;
    this._hoverSq = null;
  }

  private _clearAllDrawings(): void {
    this._customHighlights = null;
    this._arrows = [];

    if (this.drawingManager) {
      if (typeof this.drawingManager.clearAllDrawings === 'function') {
        this.drawingManager.clearAllDrawings();
      } else {
        this.drawingManager.clearArrows();
        this.drawingManager.clearHighlights();
        this.drawingManager.clearPremove();
      }
    }
  }

  private _resetRulesAdapter(): void {
    if (typeof this.rules.reset === 'function') {
      this.rules.reset();
    } else {
      this.rules.setFEN(START_FEN);
    }
  }

  private _syncOrientationFromTurn(initial = false): void {
    if (!this.autoFlip) return;

    const desired: 'white' | 'black' = this.state.turn === 'w' ? 'white' : 'black';

    if (initial || !this.drawingManager) {
      this.orientation = desired;
      if (this.drawingManager && !initial) {
        this.drawingManager.setOrientation(desired);
      }
      return;
    }

    if (this.orientation !== desired) {
      this.setOrientation(desired);
    }
  }

  // ============================================================================
  // Private - Event Emission
  // ============================================================================

  private _emitUpdateEvent(): void {
    const updatePayload = { fen: this.getPosition() } as BoardEventMap['update'];
    this.bus.emit('update', updatePayload);
    this._notifyExtensionEvent('onUpdate', updatePayload);
  }

  private _emitMoveEvent(
    from: Square,
    to: Square,
    fen: string,
    detail?: RulesMoveDetail | null,
  ): void {
    const movePayload = {
      from,
      to,
      fen,
      captured: detail?.captured ?? undefined,
      san: detail?.san ?? undefined,
    } as BoardEventMap['move'];
    this.bus.emit('move', movePayload);
    this._notifyExtensionEvent('onMove', movePayload);
  }

  private _emitIllegalMoveEvent(
    from: Square,
    to: Square,
    legal: RulesMoveResponse | null | undefined,
  ): void {
    const illegalPayload = {
      from,
      to,
      reason: legal?.reason ?? 'illegal',
    } as BoardEventMap['illegal'];
    this.bus.emit('illegal', illegalPayload);
    this._notifyExtensionEvent('onIllegalMove', illegalPayload);
  }
}
