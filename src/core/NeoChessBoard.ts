import { EventBus } from './EventBus';
import {
  parseFEN,
  isWhitePiece,
  sq,
  sqToFR,
  clamp,
  lerp,
  easeOutCubic,
  START_FEN,
  type ParsedFENState,
} from './utils';
import { resolveTheme } from './themes';
import type { ThemeName } from './themes';
import { FlatSprites } from './FlatSprites';
import { ChessJsRules } from './ChessJsRules';
import { DrawingManager } from './DrawingManager';
import type { PgnNotation } from './PgnNotation';
import type {
  Square,
  BoardOptions,
  Move,
  RulesAdapter,
  Arrow,
  SquareHighlight,
  Premove,
  Theme,
  Piece,
  PieceSet,
  PieceSprite,
  PieceSpriteSource,
  PieceSpriteImage,
  BoardEventMap,
  Extension,
  ExtensionConfig,
  ExtensionContext,
  PromotionRequest,
  PromotionMode,
  PromotionPiece,
  RulesMoveResponse,
  PgnMoveAnnotations,
} from './types';

// ============================================================================
// Constants
// ============================================================================

const DEFAULT_BOARD_SIZE = 480;
const DEFAULT_ANIMATION_MS = 300;
const DEFAULT_AUDIO_VOLUME = 0.3;
const SPRITE_SIZE = 128;
const BOARD_RANKS = 8;
const BOARD_FILES = 8;
const DRAG_SCALE = 1.05;
const LEGAL_MOVE_DOT_RADIUS = 0.12;
const ARROW_HEAD_SIZE_FACTOR = 0.25;
const ARROW_THICKNESS_FACTOR = 0.08;
const MIN_ARROW_HEAD_SIZE = 16;
const MIN_ARROW_THICKNESS = 6;
const ARROW_OPACITY = 0.95;
const PREMOVE_EXECUTION_DELAY = 150;
const POST_MOVE_PREMOVE_DELAY = 50;

const PROMOTION_CHOICES: PromotionPiece[] = ['q', 'r', 'b', 'n'];

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

interface Point {
  x: number;
  y: number;
}

interface DraggingState {
  from: Square;
  piece: string;
  x: number;
  y: number;
}

type PendingPromotionSummary = Pick<PendingPromotionState, 'from' | 'to' | 'color' | 'mode'>;

// ============================================================================
// Main Class
// ============================================================================

export class NeoChessBoard {
  // ---- Event & DOM ----
  public bus = new EventBus<BoardEventMap>();
  private root: HTMLElement;
  private cBoard!: HTMLCanvasElement;
  private cPieces!: HTMLCanvasElement;
  private cOverlay!: HTMLCanvasElement;
  private ctxB!: CanvasRenderingContext2D;
  private ctxP!: CanvasRenderingContext2D;
  private ctxO!: CanvasRenderingContext2D;

  // ---- Rules & State ----
  private rules: RulesAdapter;
  private state: BoardState;

  // ---- Visual Configuration ----
  private theme: Theme;
  private orientation: 'white' | 'black';
  private sprites!: FlatSprites;
  private sizePx = DEFAULT_BOARD_SIZE;
  private square = 60;
  private dpr = 1;

  // ---- Feature Flags ----
  private interactive: boolean;
  private showCoords: boolean;
  private highlightLegal: boolean;
  private allowPremoves: boolean;
  private showArrows: boolean;
  private showHighlights: boolean;
  private rightClickHighlights: boolean;
  private soundEnabled: boolean;
  private showSquareNames: boolean;
  private autoFlip: boolean;
  private allowAutoScroll: boolean;
  private allowDragging: boolean;
  private allowDragOffBoard: boolean;
  private animationMs: number;
  private showAnimations: boolean;
  private canDragPiece?: BoardOptions['canDragPiece'];
  private dragActivationDistance: number;

  // ---- Managers ----
  public drawingManager!: DrawingManager;

  // ---- Audio ----
  private soundUrl: string | undefined;
  private soundUrls: BoardOptions['soundUrls'];
  private moveSound: HTMLAudioElement | null = null;
  private moveSounds: Partial<Record<'white' | 'black', HTMLAudioElement>> = {};

  // ---- Interaction State ----
  private _lastMove: { from: Square; to: Square } | null = null;
  private _premove: { from: Square; to: Square; promotion?: PromotionPiece } | null = null;
  private _selected: Square | null = null;
  private _legalCached: Move[] | null = null;
  private _dragging: DraggingState | null = null;
  private _hoverSq: Square | null = null;
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

  // ---- Extensions ----
  private extensionStates: ExtensionState[] = [];
  private readonly initialOptions: BoardOptions;

  // ---- Event Handlers (stored for cleanup) ----
  private _onPointerDown?: (e: PointerEvent) => void;
  private _onPointerMove?: (e: PointerEvent) => void;
  private _onPointerUp?: (e: PointerEvent) => void;
  private _onKeyDown?: (e: KeyboardEvent) => void;
  private _onContextMenu?: (e: Event) => void;
  private _ro?: ResizeObserver;
  private _pointerDownAttached = false;
  private _globalPointerEventsAttached = false;
  private _localPointerEventsAttached = false;

  // ============================================================================
  // Constructor
  // ============================================================================

  constructor(root: HTMLElement, options: BoardOptions = {}) {
    this.root = root;
    this.initialOptions = { ...options };

    // Initialize visual configuration
    this.theme = resolveTheme(options.theme ?? 'classic');
    this.orientation = options.orientation || 'white';
    const resolvedAnimationDuration =
      typeof options.animationDurationInMs === 'number'
        ? options.animationDurationInMs
        : options.animationMs;
    const sanitizedAnimationDuration =
      typeof resolvedAnimationDuration === 'number' && Number.isFinite(resolvedAnimationDuration)
        ? Math.max(0, resolvedAnimationDuration)
        : undefined;
    this.animationMs = sanitizedAnimationDuration ?? DEFAULT_ANIMATION_MS;
    this.showAnimations = options.showAnimations !== false;

    // Initialize feature flags
    this.interactive = options.interactive !== false;
    this.showCoords = options.showCoordinates || false;
    this.highlightLegal = options.highlightLegal !== false;
    this.allowPremoves = options.allowPremoves !== false;
    this.showArrows = options.showArrows !== false;
    this.showHighlights = options.showHighlights !== false;
    this.rightClickHighlights = options.rightClickHighlights !== false;
    this.soundEnabled = options.soundEnabled !== false;
    this.showSquareNames = options.showSquareNames || false;
    this.autoFlip = options.autoFlip ?? false;
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

    // Initialize sound configuration
    this.soundUrl = options.soundUrl;
    this.soundUrls = options.soundUrls;
    this.promotionHandler = options.onPromotionRequired;
    this._initializeSound();

    // Initialize rules and state
    this.rules = options.rulesAdapter || new ChessJsRules();
    if (options.fen) {
      this.rules.setFEN(options.fen);
    }
    this.state = parseFEN(this.rules.getFEN());
    this._syncOrientationFromTurn(true);

    // Initialize extensions
    this._initializeExtensions(options.extensions);

    // Build and setup
    this._buildDOM();
    this._attachEvents();
    this.resize();

    if (options.pieceSet) {
      void this.setPieceSet(options.pieceSet);
    }
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

  public getOrientation(): 'white' | 'black' {
    return this.orientation;
  }

  public getTurn(): 'w' | 'b' {
    return this.state.turn;
  }

  public getPieceAt(square: Square): string | null {
    return this._pieceAt(square) ?? null;
  }

  public getMoveHistory(): string[] {
    if (typeof this.rules.history === 'function') {
      return this.rules.history();
    }
    return [];
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
    this.state = parseFEN(this.rules.getFEN());
    this._syncOrientationFromTurn(false);
    this._lastMove = null;

    // Execute premove if turn changed
    if (oldTurn !== this.state.turn) {
      this._executePremoveIfValid();
    }

    this._premove = null;

    if (immediate) {
      this._clearAnimation();
      this.renderAll();
    } else {
      this._animateTo(this.state, oldState);
    }

    this._emitUpdateEvent();
  }

  // ============================================================================
  // Public API - Move Submission
  // ============================================================================

  public submitMove(notation: string): boolean {
    const parsed = this._parseCoordinateNotation(notation);
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

  // ============================================================================
  // Public API - PGN Management
  // ============================================================================

  public exportPGN(): string {
    if (typeof this.rules.toPgn === 'function') {
      return this.rules.toPgn(true);
    }

    if (this.rules.getPGN) {
      return this.rules.getPGN();
    }

    console.warn('[NeoChessBoard] The current rules adapter does not support PGN export.');
    return '';
  }

  public loadPgnWithAnnotations(pgnString: string): boolean {
    try {
      const success = this._loadPgnInRules(pgnString);
      if (success) {
        this._displayPgnAnnotations(pgnString);
        this._updateStateAfterPgnLoad();
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error loading PGN with annotations:', error);
      return false;
    }
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
  // Public API - Visual Configuration
  // ============================================================================

  public setTheme(theme: ThemeName | Theme): void {
    this.applyTheme(theme);
  }

  public applyTheme(theme: ThemeName | Theme): void {
    this.theme = resolveTheme(theme);
    this._rasterize();
    this.renderAll();
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
    if (enabled) {
      this._initializeSound();
    } else {
      this._clearSound();
    }
  }

  public setSoundUrls(soundUrls: BoardOptions['soundUrls']): void {
    this.soundUrls = soundUrls;
    if (this.soundEnabled) {
      this._initializeSound();
    } else {
      this._clearSound();
    }
  }

  public setAutoFlip(autoFlip: boolean): void {
    this.autoFlip = autoFlip;
    if (autoFlip) {
      this._syncOrientationFromTurn(!this.drawingManager);
    }
  }

  public setAnimationDuration(duration: number | undefined): void {
    if (typeof duration !== 'number' || !Number.isFinite(duration)) {
      return;
    }
    this.animationMs = Math.max(0, duration);
  }

  public setShowAnimations(show: boolean): void {
    this.showAnimations = show;
    if (!show) {
      this._clearAnimation();
      this.renderAll();
    }
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
    this._updatePointerEventBindings();
  }

  public setAllowDragOffBoard(allow: boolean): void {
    this.allowDragOffBoard = allow;
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
      this.clearPremove();
    }
    this.renderAll();
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

  public setPremove(premove: Premove): void {
    if (this.drawingManager && this.allowPremoves) {
      this.drawingManager.setPremoveFromObject(premove);
      this._premove = { ...premove };
      this.renderAll();
    }
  }

  public clearPremove(): void {
    if (this.drawingManager) {
      this.drawingManager.clearPremove();
      this._premove = null;
      this.renderAll();
    }
  }

  public getPremove(): Premove | null {
    return this.drawingManager ? this.drawingManager.getPremove() || null : null;
  }

  public clearAllDrawings(): void {
    if (this.drawingManager) {
      this.drawingManager.clearAll();
      this.renderAll();
    }
  }

  public exportDrawings(): string | null {
    return this.drawingManager ? this.drawingManager.exportState() : null;
  }

  public importDrawings(state: string): void {
    if (this.drawingManager) {
      this.drawingManager.importState(state);
      this.renderAll();
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
    this._invokeExtensionHook('onBeforeRender');
    this._drawBoard();
    this._drawPieces();
    this._drawOverlay();
    this._invokeExtensionHook('onAfterRender');
  }

  public destroy(): void {
    this._cancelPendingPromotion();
    this._removeEvents();
    this._disposeExtensions();
    this.root.innerHTML = '';
  }

  // ============================================================================
  // Private - DOM & Initialization
  // ============================================================================

  private _buildDOM(): void {
    this._setupRootElement();
    this._createCanvases();
    this._initializeContexts();
    this._initializeDrawingManager();
    this._rasterize();
    this._setupResizeObserver();
    this._injectStyles();
    this._invokeExtensionHook('onInit');
  }

  private _setupRootElement(): void {
    this.root.classList.add('ncb-root');
    this.root.style.position = 'relative';
    this.root.style.userSelect = 'none';
  }

  private _createCanvases(): void {
    this.cBoard = this._createCanvas();
    this.cPieces = this._createCanvas();
    this.cOverlay = this._createCanvas();

    [this.cBoard, this.cPieces, this.cOverlay].forEach((canvas) => {
      this.root.appendChild(canvas);
    });
  }

  private _createCanvas(): HTMLCanvasElement {
    const canvas = document.createElement('canvas');
    Object.assign(canvas.style, {
      position: 'absolute',
      left: '0',
      top: '0',
      width: '100%',
      height: '100%',
      aspectRatio: '606 / 606',
    });
    return canvas;
  }

  private _initializeContexts(): void {
    this.ctxB = this.cBoard.getContext('2d')!;
    this.ctxP = this.cPieces.getContext('2d')!;
    this.ctxO = this.cOverlay.getContext('2d')!;
  }

  private _initializeDrawingManager(): void {
    this.drawingManager = new DrawingManager(this.cOverlay);
    this.drawingManager.setOrientation(this.orientation);
    this.drawingManager.setShowSquareNames(this.showSquareNames);
  }

  private _setupResizeObserver(): void {
    const ro = new ResizeObserver(() => this.resize());
    ro.observe(this.root);
    this._ro = ro;
  }

  private _injectStyles(): void {
    if (typeof document === 'undefined') return;

    const style = document.createElement('style');
    style.textContent = `
      .ncb-root {
        display: block;
        max-width: 100%;
        aspect-ratio: auto 606/606;
        border-radius: 14px;
        overflow: hidden;
        box-shadow: 0 10px 30px rgba(0,0,0,0.10);
      }
      canvas {
        image-rendering: optimizeQuality;
        aspect-ratio: auto 606/606;
      }
    `;
    document.head.appendChild(style);
  }

  private _rasterize(): void {
    this.sprites = new FlatSprites(SPRITE_SIZE, this.theme);
  }

  // ============================================================================
  // Private - Dimension Management
  // ============================================================================

  private _calculateBoardDimensions(): { size: number; dpr: number; square: number } {
    const rect = this.root.getBoundingClientRect();
    const size = Math.min(rect.width, rect.height) || DEFAULT_BOARD_SIZE;
    const dpr = globalThis.devicePixelRatio || 1;
    const square = (size * dpr) / BOARD_FILES;

    return { size, dpr, square };
  }

  private _updateCanvasDimensions(dimensions: { size: number; dpr: number }): void {
    const { size, dpr } = dimensions;
    const width = Math.round(size * dpr);
    const height = Math.round(size * dpr);

    [this.cBoard, this.cPieces, this.cOverlay].forEach((canvas) => {
      canvas.width = width;
      canvas.height = height;
    });
  }

  private _updateInternalDimensions(dimensions: {
    size: number;
    dpr: number;
    square: number;
  }): void {
    this.sizePx = dimensions.size;
    this.dpr = dimensions.dpr;
    this.square = dimensions.square;
  }

  private _notifyDrawingManagerResize(): void {
    if (this.drawingManager) {
      this.drawingManager.updateDimensions();
    }
  }

  // ============================================================================
  // Private - Rendering
  // ============================================================================

  private _drawBoard(): void {
    const { light, dark, boardBorder } = this.theme;
    const ctx = this.ctxB;
    const s = this.square;
    const W = this.cBoard.width;
    const H = this.cBoard.height;

    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = boardBorder;
    ctx.fillRect(0, 0, W, H);

    for (let r = 0; r < BOARD_RANKS; r++) {
      for (let f = 0; f < BOARD_FILES; f++) {
        const { x, y } = this._calculateSquarePosition(f, r);
        ctx.fillStyle = (r + f) % 2 === 0 ? light : dark;
        ctx.fillRect(x, y, s, s);
      }
    }
  }

  private _drawPieces(): void {
    const ctx = this.ctxP;
    const W = this.cPieces.width;
    const H = this.cPieces.height;

    ctx.clearRect(0, 0, W, H);

    const draggingSq = this._dragging?.from;

    for (let r = 0; r < BOARD_RANKS; r++) {
      for (let f = 0; f < BOARD_FILES; f++) {
        const piece = this.state.board[r][f];
        if (!piece) continue;

        const square = sq(f, r);
        if (draggingSq === square) continue;

        const { x, y } = this._sqToXY(square);
        this._drawPieceSprite(piece, x, y, 1);
      }
    }

    if (this._dragging) {
      this._drawDraggingPiece();
    }
  }

  private _drawDraggingPiece(): void {
    if (!this._dragging) return;

    const { piece, x, y } = this._dragging;
    this._drawPieceSprite(piece, x - this.square / 2, y - this.square / 2, DRAG_SCALE);
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
    this.ctxP.drawImage(sprite.image, dx, dy, size, size);
  }

  private _drawDefaultPieceSprite(piece: string, x: number, y: number, scale: number): void {
    const isWhite = isWhitePiece(piece);
    const idx = PIECE_INDEX_MAP[piece.toLowerCase()];
    const sx = idx * SPRITE_SIZE;
    const sy = isWhite ? SPRITE_SIZE : 0;
    const d = this.square * scale;
    const dx = x + (this.square - d) / 2;
    const dy = y + (this.square - d) / 2;

    this.ctxP.drawImage(this.sprites.getSheet(), sx, sy, SPRITE_SIZE, SPRITE_SIZE, dx, dy, d, d);
  }

  private _drawOverlay(): void {
    const ctx = this.ctxO;
    const W = this.cOverlay.width;
    const H = this.cOverlay.height;

    ctx.clearRect(0, 0, W, H);

    this._drawLastMoveHighlight();
    this._drawCustomHighlights();
    this._drawSelectedSquare();
    this._drawLegalMoves();
    this._drawLegacyArrows();
    this._drawPremoveHighlight();
    this._drawHoverHighlight();
    this._drawDrawingManagerElements();
  }

  private _drawLastMoveHighlight(): void {
    if (!this._lastMove) return;

    const { from, to } = this._lastMove;
    const s = this.square;
    const A = this._sqToXY(from);
    const B = this._sqToXY(to);

    this.ctxO.fillStyle = this.theme.lastMove;
    this.ctxO.fillRect(A.x, A.y, s, s);
    this.ctxO.fillRect(B.x, B.y, s, s);
  }

  private _drawCustomHighlights(): void {
    if (!this._customHighlights?.squares) return;

    this.ctxO.fillStyle = this.theme.moveTo;
    for (const sqr of this._customHighlights.squares) {
      const { x, y } = this._sqToXY(sqr);
      this.ctxO.fillRect(x, y, this.square, this.square);
    }
  }

  private _drawSelectedSquare(): void {
    if (!this._selected) return;

    const { x, y } = this._sqToXY(this._selected);
    this.ctxO.fillStyle = this.theme.moveFrom;
    this.ctxO.fillRect(x, y, this.square, this.square);
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
    this.ctxO.fillRect(A.x, A.y, s, s);
    this.ctxO.fillRect(B.x, B.y, s, s);
  }

  private _drawHoverHighlight(): void {
    if (!this._hoverSq || !this._dragging) return;

    const { x, y } = this._sqToXY(this._hoverSq);
    this.ctxO.fillStyle = this.theme.moveTo;
    this.ctxO.fillRect(x, y, this.square, this.square);
  }

  private _drawDrawingManagerElements(): void {
    if (!this.drawingManager) return;

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

  private _sqToXY(square: Square): Point {
    const { f, r } = sqToFR(square);
    return this._calculateSquarePosition(f, r);
  }

  private _calculateSquarePosition(file: number, rank: number): Point {
    const ff = this.orientation === 'white' ? file : 7 - file;
    const rr = this.orientation === 'white' ? 7 - rank : rank;
    return { x: ff * this.square, y: rr * this.square };
  }

  private _xyToSquare(x: number, y: number): Square {
    const f = clamp(Math.floor(x / this.square), 0, 7);
    const r = clamp(Math.floor(y / this.square), 0, 7);
    const ff = this.orientation === 'white' ? f : 7 - f;
    const rr = this.orientation === 'white' ? 7 - r : r;
    return sq(ff, rr);
  }

  private _pieceAt(square: Square): string | null {
    const { f, r } = sqToFR(square);
    return this.state.board[r][f] ?? null;
  }

  // ============================================================================
  // Private - Event Handling
  // ============================================================================

  private _attachEvents(): void {
    let cancelledDragWithRightClick = false;

    const cancelActiveDrag = (): boolean => {
      if (!this._dragging) return false;
      this._clearInteractionState();
      this.renderAll();
      return true;
    };

    const onDown = (e: PointerEvent) => {
      if (e.button === 2) {
        e.preventDefault();
        if (cancelActiveDrag()) {
          cancelledDragWithRightClick = true;
          return;
        }
        cancelledDragWithRightClick = false;
        this._handleRightMouseDown(e);
        return;
      }

      if (e.button !== 0 || !this.interactive) return;
      this._handleLeftMouseDown(e);
    };

    const onMove = (e: PointerEvent) => {
      const pt = this._getPointerPosition(e);
      this._handleMouseMove(e, pt);
    };

    const onUp = (e: PointerEvent) => {
      if (e.button === 2) {
        if (cancelActiveDrag()) {
          cancelledDragWithRightClick = false;
          return;
        }
        if (cancelledDragWithRightClick) {
          cancelledDragWithRightClick = false;
          return;
        }
        this._handleRightMouseUp(e);
        return;
      }

      this._handleLeftMouseUp(e);
    };

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        this._handleEscapeKey();
      }
    };

    const onContextMenu = (e: Event) => {
      if (this.rightClickHighlights) {
        e.preventDefault();
      }
    };

    this._onPointerDown = onDown;
    this._onPointerMove = onMove;
    this._onPointerUp = onUp;
    this._onKeyDown = onKeyDown;
    this._onContextMenu = onContextMenu;

    this.cOverlay.addEventListener('contextmenu', onContextMenu);
    globalThis.addEventListener('keydown', onKeyDown);

    this._updatePointerEventBindings();
  }

  private _removeEvents(): void {
    if (this._pointerDownAttached && this._onPointerDown) {
      this.cOverlay.removeEventListener('pointerdown', this._onPointerDown);
      this._pointerDownAttached = false;
    }
    if (this._onContextMenu) {
      this.cOverlay.removeEventListener('contextmenu', this._onContextMenu);
    }
    this._unbindGlobalPointerEvents();
    this._unbindLocalPointerEvents();
    if (this._onKeyDown) {
      globalThis.removeEventListener('keydown', this._onKeyDown);
    }
    this._ro?.disconnect();
  }

  private _updatePointerEventBindings(): void {
    if (!this._onPointerDown || !this._onPointerMove || !this._onPointerUp) {
      return;
    }

    if (!this._pointerDownAttached) {
      this.cOverlay.addEventListener('pointerdown', this._onPointerDown);
      this._pointerDownAttached = true;
    }

    if (this.allowDragging) {
      this._unbindLocalPointerEvents();
      this._bindGlobalPointerEvents();
    } else {
      this._unbindGlobalPointerEvents();
      this._bindLocalPointerEvents();
    }
  }

  private _bindGlobalPointerEvents(): void {
    if (this._globalPointerEventsAttached || !this._onPointerMove || !this._onPointerUp) {
      return;
    }
    globalThis.addEventListener('pointermove', this._onPointerMove);
    globalThis.addEventListener('pointerup', this._onPointerUp);
    this._globalPointerEventsAttached = true;
  }

  private _unbindGlobalPointerEvents(): void {
    if (!this._globalPointerEventsAttached || !this._onPointerMove || !this._onPointerUp) {
      return;
    }
    globalThis.removeEventListener('pointermove', this._onPointerMove);
    globalThis.removeEventListener('pointerup', this._onPointerUp);
    this._globalPointerEventsAttached = false;
  }

  private _bindLocalPointerEvents(): void {
    if (this._localPointerEventsAttached || !this._onPointerMove || !this._onPointerUp) {
      return;
    }
    this.cOverlay.addEventListener('pointermove', this._onPointerMove);
    this.cOverlay.addEventListener('pointerup', this._onPointerUp);
    this._localPointerEventsAttached = true;
  }

  private _unbindLocalPointerEvents(): void {
    if (!this._localPointerEventsAttached || !this._onPointerMove || !this._onPointerUp) {
      return;
    }
    this.cOverlay.removeEventListener('pointermove', this._onPointerMove);
    this.cOverlay.removeEventListener('pointerup', this._onPointerUp);
    this._localPointerEventsAttached = false;
  }

  private _handleLeftMouseDown(e: PointerEvent): void {
    const pt = this._getPointerPosition(e);
    if (!pt) return;

    const from = this._xyToSquare(pt.x, pt.y);
    const piece = this._pieceAt(from);
    if (!piece) return;

    const side = isWhitePiece(piece) ? 'w' : 'b';
    if (side !== this.state.turn && !this.allowPremoves) {
      return;
    }

    if (this.canDragPiece && !this.canDragPiece({ square: from, piece, board: this })) {
      return;
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
      this._activatePendingDrag(pt);
    }
  }

  private _handleLeftMouseUp(e: PointerEvent): void {
    const pt = this._getPointerPosition(e);

    if (this.drawingManager?.handleMouseUp(pt?.x || 0, pt?.y || 0)) {
      this.renderAll();
      this._pendingDrag = null;
      return;
    }

    if (!this._dragging) {
      if (this.interactive && e.button === 0 && pt) {
        const square = this._xyToSquare(pt.x, pt.y);
        this._handleClickMove(square);
      }
      this._pendingDrag = null;
      return;
    }

    const dropPoint =
      pt ??
      (!this.allowDragOffBoard && this._dragging
        ? { x: this._dragging.x, y: this._dragging.y }
        : null);

    this._handleDragEnd(dropPoint);
    this._pendingDrag = null;
  }

  private _handleRightMouseDown(e: PointerEvent): void {
    const pt = this._getPointerPosition(e);
    if (
      pt &&
      this.drawingManager?.handleRightMouseDown(pt.x, pt.y, e.shiftKey, e.ctrlKey, e.altKey)
    ) {
      this.renderAll();
    }
  }

  private _handleRightMouseUp(e: PointerEvent): void {
    const pt = this._getPointerPosition(e);
    let handled = false;

    if (this.drawingManager && pt) {
      handled = this.drawingManager.handleRightMouseUp(pt.x, pt.y);
    }

    if (!handled && pt) {
      if (this.drawingManager?.getPremove()) {
        this.drawingManager.clearPremove();
        this._premove = null;
        console.log('Premove cancelled by right-click');
        handled = true;
      } else if (this.rightClickHighlights) {
        const square = this._xyToSquare(pt.x, pt.y);
        this.drawingManager?.handleHighlightClick(square, e.shiftKey, e.ctrlKey, e.altKey);
      }
    }

    this.renderAll();
  }

  private _handleMouseMove(e: PointerEvent, pt: Point | null): void {
    if (this._pendingDrag && this.allowDragging) {
      const distance = Math.hypot(
        e.clientX - this._pendingDrag.startClientX,
        e.clientY - this._pendingDrag.startClientY,
      );

      if (distance >= this.dragActivationDistance) {
        const activationPoint = pt ?? {
          x: this._pendingDrag.startX,
          y: this._pendingDrag.startY,
        };
        this._activatePendingDrag(activationPoint);
      }
    }

    if (pt && this.drawingManager?.handleMouseMove(pt.x, pt.y)) {
      this.renderAll();
    }

    if (this._dragging && pt) {
      this._dragging.x = pt.x;
      this._dragging.y = pt.y;
      this._hoverSq = this._xyToSquare(pt.x, pt.y);
      this._autoScrollDuringDrag(e);
      this._drawPieces();
      this._drawOverlay();
    } else if (this._dragging && !pt) {
      this._autoScrollDuringDrag(e);
    } else if (pt && this.interactive) {
      const sq = this._xyToSquare(pt.x, pt.y);
      const piece = this._pieceAt(sq);
      this._updateCursor(piece ? 'pointer' : 'default');
    } else if (!pt) {
      this._updateCursor('default');
    }
  }

  private _activatePendingDrag(pt: Point): void {
    if (!this._pendingDrag) {
      return;
    }

    const { from, piece } = this._pendingDrag;
    this._dragging = { from, piece, x: pt.x, y: pt.y };
    this._pendingDrag = null;
    this._hoverSq = this._xyToSquare(pt.x, pt.y);

    if (this.allowAutoScroll) {
      this._ensureScrollContainer();
    }

    this._drawPieces();
    this._drawOverlay();
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
    this._clearInteractionState();
    if (this.drawingManager) {
      this.drawingManager.cancelCurrentAction();
    }
    this.renderAll();
  }

  private _handleDragEnd(pt: Point | null): void {
    const drop = pt ? this._xyToSquare(pt.x, pt.y) : null;
    const from = this._dragging!.from;

    this._dragging = null;
    this._hoverSq = null;

    if (!drop) {
      this._selected = null;
      this._legalCached = null;
      this.renderAll();
      return;
    }

    if (drop === from) {
      this.renderAll();
      return;
    }

    this.attemptMove(from, drop);
  }

  private _getPointerPosition(e: PointerEvent): Point | null {
    const rect = this.cOverlay.getBoundingClientRect();
    const scaleX = rect.width ? this.cOverlay.width / rect.width : 1;
    const scaleY = rect.height ? this.cOverlay.height / rect.height : 1;
    let x = (e.clientX - rect.left) * scaleX;
    let y = (e.clientY - rect.top) * scaleY;

    if (!this.allowDragOffBoard) {
      if (x < 0 || y < 0 || x > this.cOverlay.width || y > this.cOverlay.height) {
        return null;
      }
    } else {
      x = clamp(x, 0, this.cOverlay.width);
      y = clamp(y, 0, this.cOverlay.height);
    }

    return { x, y };
  }

  private _updateCursor(cursor: string): void {
    this.cOverlay.style.cursor = cursor;
  }

  // ============================================================================
  // Private - Move Logic
  // ============================================================================

  private _parseCoordinateNotation(
    notation: string,
  ): { from: Square; to: Square; promotion?: PromotionPiece } | null {
    const cleaned = notation.trim();
    if (!cleaned) return null;

    const match = cleaned.match(
      /^([a-h][1-8])\s*(?:-|\s)?\s*([a-h][1-8])(?:\s*(?:=)?\s*([qrbnQRBN]))?$/,
    );
    if (!match) return null;

    return {
      from: match[1] as Square,
      to: match[2] as Square,
      promotion: match[3]?.toLowerCase() as PromotionPiece | undefined,
    };
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
      return this._beginPromotionRequest(from, to, side, 'move');
    }

    return this._executeMove(from, to, promotion);
  }

  private _isConflictingWithPendingPromotion(from: Square, to: Square): boolean {
    return Boolean(
      this._pendingPromotion &&
        this._pendingPromotion.mode === 'move' &&
        (this._pendingPromotion.from !== from || this._pendingPromotion.to !== to),
    );
  }

  private _handlePremoveAttempt(
    from: Square,
    to: Square,
    side: 'w' | 'b',
    promotion?: PromotionPiece,
  ): boolean | 'pending' {
    if (!this.allowPremoves) return false;

    const piece = this._pieceAt(from)!;
    if (this._isPromotionMove(piece, to, side) && !promotion) {
      return this._beginPromotionRequest(from, to, side, 'premove');
    }

    this._setPremove(from, to, promotion);
    return true;
  }

  private _executeMove(from: Square, to: Square, promotion?: PromotionPiece): boolean {
    const legal = this.rules.move({ from, to, promotion });

    if (legal?.ok) {
      this._processMoveSuccess(from, to);
      return true;
    }

    this._processMoveFailure(from, to, legal);
    return false;
  }

  private _processMoveSuccess(from: Square, to: Square): void {
    const fen = this.rules.getFEN();
    const oldState = this.state;
    const newState = parseFEN(fen);

    this.state = newState;
    this._syncOrientationFromTurn(false);
    this._clearSelectionState();
    this._lastMove = { from, to };

    if (this.drawingManager) {
      this.drawingManager.clearArrows();
    }

    this._playMoveSound();
    this._animateTo(newState, oldState);
    this._emitMoveEvent(from, to, fen);

    setTimeout(() => {
      this._executePremoveIfValid();
    }, this.animationMs + POST_MOVE_PREMOVE_DELAY);
  }

  private _processMoveFailure(
    from: Square,
    to: Square,
    legal: RulesMoveResponse | null | undefined,
  ): void {
    this._clearSelectionState();
    this.renderAll();
    this._emitIllegalMoveEvent(from, to, legal);
  }

  private _setPremove(from: Square, to: Square, promotion?: PromotionPiece): void {
    if (!this.allowPremoves) return;

    if (this.drawingManager) {
      this.drawingManager.setPremove(from, to, promotion);
    }
    this._premove = promotion ? { from, to, promotion } : { from, to };
    this._clearSelectionState();
    this.renderAll();
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
      this._legalCached = this.rules.movesFrom(square);
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

    const targetRank = Number(to[1]);
    if (Number.isNaN(targetRank)) return false;

    return (side === 'w' && targetRank === 8) || (side === 'b' && targetRank === 1);
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
    this._emitPromotionRequest(request);
    return 'pending';
  }

  private _resolvePromotion(token: number, piece: PromotionPiece): void {
    const pending = this._pendingPromotion;
    if (!pending || pending.token !== token) return;

    this.previewPromotionPiece(piece);

    const { from, to, mode } = pending;
    this._pendingPromotion = null;

    if (mode === 'move') {
      this._attemptMove(from, to, { promotion: piece });
    } else {
      this._setPremove(from, to, piece);
    }

    this.clearPromotionPreview();
  }

  private _cancelPromotionRequest(token: number): void {
    const pending = this._pendingPromotion;
    if (!pending || pending.token !== token) return;

    this._pendingPromotion = null;
    this.clearPromotionPreview();
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
        if (result && typeof (result as Promise<void>).then === 'function') {
          void (result as Promise<void>).catch((error) => {
            console.error('[NeoChessBoard] Promotion handler rejected.', error);
          });
        }
      } catch (error) {
        console.error('[NeoChessBoard] Promotion handler threw an error.', error);
      }
    }

    this.bus.emit('promotion', request);
  }

  // ============================================================================
  // Private - Premove Execution
  // ============================================================================

  private _executePremoveIfValid(): void {
    if (!this.allowPremoves || !this.drawingManager) return;

    const premove = this.drawingManager.getPremove();
    if (!premove) return;

    const premoveResult = this.rules.move({
      from: premove.from,
      to: premove.to,
      promotion: premove.promotion,
    });

    if (premoveResult?.ok) {
      setTimeout(() => {
        this._executePremove(premove);
      }, PREMOVE_EXECUTION_DELAY);
    } else {
      this._clearPremove();
    }
  }

  private _executePremove(premove: Premove): void {
    const newFen = this.rules.getFEN();
    const newState = parseFEN(newFen);
    const oldState = this.state;

    this.state = newState;
    this._syncOrientationFromTurn(false);
    this._lastMove = { from: premove.from, to: premove.to };

    this.drawingManager?.clearPremove();
    this.drawingManager?.clearArrows();
    this._premove = null;

    this._animateTo(newState, oldState);
    this._emitMoveEvent(premove.from, premove.to, newFen);
  }

  private _clearPremove(): void {
    this.drawingManager?.clearPremove();
    this._premove = null;
    this.renderAll();
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
      const eased = easeOutCubic(progress);

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

    for (let r = 0; r < BOARD_RANKS; r++) {
      for (let f = 0; f < BOARD_FILES; f++) {
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
            moving.set(sq(f, r), sq(destination.f, destination.r));
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
    ctx.clearRect(0, 0, this.cPieces.width, this.cPieces.height);

    for (let r = 0; r < BOARD_RANKS; r++) {
      for (let f = 0; f < BOARD_FILES; f++) {
        const targetPiece = target.board[r][f];
        if (!targetPiece) continue;

        const toSq = sq(f, r);
        const fromKey = this._findMovingPieceSource(moving, toSq);

        if (fromKey) {
          this._drawMovingPiece(fromKey, toSq, targetPiece, progress);
        } else {
          this._drawStationaryPiece(toSq, targetPiece);
        }
      }
    }

    this._drawOverlay();
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
    for (let r = 0; r < BOARD_RANKS; r++) {
      for (let f = 0; f < BOARD_FILES; f++) {
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

  private _initializeSound(): void {
    this.moveSound = null;
    this.moveSounds = {};

    if (!this.soundEnabled || typeof Audio === 'undefined') return;

    const defaultUrl = this.soundUrl;
    const whiteUrl = this.soundUrls?.white;
    const blackUrl = this.soundUrls?.black;

    if (!defaultUrl && !whiteUrl && !blackUrl) return;

    if (whiteUrl) {
      const whiteSound = this._createAudioElement(whiteUrl);
      if (whiteSound) {
        this.moveSounds.white = whiteSound;
      }
    }
    if (blackUrl) {
      const blackSound = this._createAudioElement(blackUrl);
      if (blackSound) {
        this.moveSounds.black = blackSound;
      }
    }
    if (defaultUrl) {
      this.moveSound = this._createAudioElement(defaultUrl);
    }
  }

  private _createAudioElement(url: string): HTMLAudioElement | null {
    try {
      const audio = new Audio(url);
      audio.volume = DEFAULT_AUDIO_VOLUME;
      audio.preload = 'auto';
      audio.addEventListener('error', () => {
        console.debug('Sound not available');
      });
      return audio;
    } catch (error) {
      console.warn('Unable to load move sound:', error);
      return null;
    }
  }

  private _playMoveSound(): void {
    if (!this.soundEnabled) return;

    const movedColor: 'white' | 'black' = this.state.turn === 'w' ? 'black' : 'white';
    const sound = this.moveSounds[movedColor] ?? this.moveSound;

    if (!sound) return;

    try {
      sound.currentTime = 0;
      sound.play().catch((error) => {
        console.debug('Sound not played:', error.message);
      });
    } catch (error) {
      console.debug('Error playing sound:', error);
    }
  }

  private _clearSound(): void {
    this.moveSound = null;
    this.moveSounds = {};
  }

  // ============================================================================
  // Private - Piece Set Management
  // ============================================================================

  private _shouldClearPieceSet(pieceSet?: PieceSet | null): boolean {
    const hasExistingPieces =
      Boolean(this._pieceSetRaw) || Object.keys(this.customPieceSprites).length > 0;

    return (
      (!pieceSet || !pieceSet.pieces || Object.keys(pieceSet.pieces).length === 0) &&
      hasExistingPieces
    );
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
    const config: PieceSprite =
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
      const doc = this.root?.ownerDocument ?? (typeof document !== 'undefined' ? document : null);
      const img =
        typeof Image !== 'undefined'
          ? new Image()
          : doc
            ? (doc.createElement('img') as HTMLImageElement)
            : null;

      if (!img) {
        reject(new Error('Image loading is not supported in the current environment.'));
        return;
      }

      if (!src.startsWith('data:')) {
        img.crossOrigin = 'anonymous';
      }

      try {
        img.decoding = 'async';
      } catch (_error) {
        // Ignore browsers that do not support decoding
      }

      img.onload = () => resolve(img);
      img.onerror = (err) => reject(err instanceof Error ? err : new Error(String(err)));
      img.src = src;
    });
  }

  // ============================================================================
  // Private - Extension Management
  // ============================================================================

  private _initializeExtensions(configs: ExtensionConfig[] | undefined): void {
    this.extensionStates = [];
    if (!configs || configs.length === 0) return;

    configs.forEach((config, index) => {
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
    });
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
    while (state.disposers.length) {
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
      this._displayAnnotationsFromPgn(pgnNotation);
    }
  }

  private _updateStateAfterPgnLoad(): void {
    this.state = parseFEN(this.rules.getFEN());
    this._syncOrientationFromTurn(false);
    this.renderAll();
  }

  private _displayAnnotationsFromPgn(pgnNotation: PgnNotation): void {
    if (!this.drawingManager) return;

    this.drawingManager.clearArrows();
    this.drawingManager.clearHighlights();

    const moves = pgnNotation.getMovesWithAnnotations();
    if (moves.length === 0) return;

    const lastMove = moves[moves.length - 1];
    const totalMoves = moves.reduce(
      (acc, move) => acc + (move.white ? 1 : 0) + (move.black ? 1 : 0),
      0,
    );

    let annotationsToShow: PgnMoveAnnotations | null = null;

    if (totalMoves % 2 === 0 && lastMove.blackAnnotations) {
      annotationsToShow = lastMove.blackAnnotations;
    } else if (totalMoves % 2 === 1 && lastMove.whiteAnnotations) {
      annotationsToShow = lastMove.whiteAnnotations;
    }

    if (annotationsToShow) {
      this._applyAnnotations(annotationsToShow);
    }
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

  private _emitMoveEvent(from: Square, to: Square, fen: string): void {
    const movePayload = { from, to, fen } as BoardEventMap['move'];
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
