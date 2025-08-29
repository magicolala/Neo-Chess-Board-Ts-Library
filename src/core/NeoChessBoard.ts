import { EventBus } from "./EventBus";
import { parseFEN, FILES, RANKS, isWhitePiece, sq, sqToFR, clamp, lerp, easeOutCubic } from "./utils";
import { THEMES } from "./themes";
import { FlatSprites } from "./FlatSprites";
import { LightRules } from "./LightRules";
import { DrawingManager } from "./DrawingManager";
import type { Square, BoardOptions, Move, RulesAdapter, Arrow, SquareHighlight, HighlightType, Premove } from "./types";

interface BoardState {
  board: (string | null)[][];
  turn: "w" | "b";
  castling: string;
  ep: string | null;
  halfmove: number;
  fullmove: number;
}

interface BoardEvents {
  move: { from: Square; to: Square; fen: string };
  illegal: { from: Square; to: Square; reason: string };
  update: { fen: string };
}

export class NeoChessBoard {
  public bus = new EventBus<BoardEvents>();
  private root: HTMLElement;
  private rules: RulesAdapter;
  private state: BoardState;
  private theme: any;
  private orientation: "white" | "black";
  private interactive: boolean;
  private showCoords: boolean;
  private highlightLegal: boolean;
  private animationMs: number;
  private sprites!: FlatSprites;
  private sizePx = 480;
  private square = 60;
  private dpr = 1;

  // Canvas elements
  private cBoard!: HTMLCanvasElement;
  private cPieces!: HTMLCanvasElement;
  private cOverlay!: HTMLCanvasElement;
  private ctxB!: CanvasRenderingContext2D;
  private ctxP!: CanvasRenderingContext2D;
  private ctxO!: CanvasRenderingContext2D;

  // Drawing manager for arrows, highlights, premoves
  private drawingManager!: DrawingManager;
  
  // Nouvelles options
  private allowPremoves: boolean;
  private showArrows: boolean;
  private showHighlights: boolean;
  private rightClickHighlights: boolean;

  // State tracking
  private _lastMove: { from: Square; to: Square } | null = null;
  private _premove: { from: Square; to: Square } | null = null;
  private _selected: Square | null = null;
  private _legalCached: Move[] | null = null;
  private _dragging: { from: Square; piece: string; x: number; y: number } | null = null;
  private _hoverSq: Square | null = null;
  private _arrows: Array<{ from: Square; to: Square; color?: string }> = [];
  private _customHighlights: { squares: Square[] } | null = null;
  private _raf = 0;
  
  // État pour le dessin des flèches
  private _drawingArrow: { from: Square } | null = null;

  constructor(root: HTMLElement, options: BoardOptions = {}) {
    this.root = root;
    this.theme = THEMES[options.theme || "classic"];
    this.orientation = options.orientation || "white";
    this.interactive = options.interactive !== false;
    this.showCoords = options.showCoordinates || false;
    this.highlightLegal = options.highlightLegal !== false;
    this.animationMs = options.animationMs || 300;
    
    // Nouvelles options
    this.allowPremoves = options.allowPremoves !== false;
    this.showArrows = options.showArrows !== false;
    this.showHighlights = options.showHighlights !== false;
    this.rightClickHighlights = options.rightClickHighlights !== false;

    // Initialize rules adapter
    this.rules = options.rulesAdapter || new LightRules();
    if (options.fen) {
      this.rules.setFEN(options.fen);
    }
    this.state = parseFEN(this.rules.getFEN());

    // Build DOM and setup
    this._buildDOM();
    this._attachEvents();
    this.resize();
  }

  // Public API methods
  public getPosition(): string {
    return this.rules.getFEN();
  }

  public setPosition(fen: string, immediate = false) {
    this.setFEN(fen, immediate);
  }

  public on<K extends keyof BoardEvents>(event: K, handler: (payload: BoardEvents[K]) => void) {
    return this.bus.on(event, handler);
  }

  public destroy() {
    this._removeEvents();
    this.root.innerHTML = "";
  }

  public setFEN(fen: string, immediate = false) {
    const old = this.state;
    this.rules.setFEN(fen);
    this.state = parseFEN(this.rules.getFEN());
    this._lastMove = null;
    this._premove = null;
    if (immediate) {
      this._clearAnim();
      this.renderAll();
    } else {
      this._animateTo(this.state, old);
    }
    this.bus.emit("update", { fen: this.getPosition() });
  }

  // ---- DOM & render ----
  private _buildDOM() {
    this.root.classList.add("ncb-root");
    this.root.style.position = "relative";
    this.root.style.userSelect = "none";
    this.cBoard = document.createElement("canvas");
    this.cPieces = document.createElement("canvas");
    this.cOverlay = document.createElement("canvas");
    for (const c of [this.cBoard, this.cPieces, this.cOverlay]) {
      Object.assign(c.style, { position: "absolute", left: "0", top: "0", width: "100%", height: "100%" } as any);
      this.root.appendChild(c);
    }
    this.ctxB = this.cBoard.getContext("2d")!;
    this.ctxP = this.cPieces.getContext("2d")!;
    this.ctxO = this.cOverlay.getContext("2d")!;
    
    // Initialiser le DrawingManager
    this.drawingManager = new DrawingManager(this.cOverlay);
    this.drawingManager.setOrientation(this.orientation);
    
    this._rasterize();
    const ro = new ResizeObserver(() => this.resize());
    ro.observe(this.root);
    (this as any)._ro = ro;
    // inject tiny styles
    if (typeof document !== "undefined") {
      const style = document.createElement("style");
      style.textContent = `.ncb-root{display:block;max-width:100%;aspect-ratio:1/1;border-radius:14px;overflow:hidden;box-shadow:0 10px 30px rgba(0,0,0,0.10);} canvas{image-rendering:optimizeQuality;}`;
      document.head.appendChild(style);
    }
  }
  resize() {
    const rect = this.root.getBoundingClientRect();
    const sz = Math.min(rect.width, rect.height) || 480;
    const dpr = globalThis.devicePixelRatio || 1;
    for (const c of [this.cBoard, this.cPieces, this.cOverlay]) {
      c.width = Math.round(sz * dpr);
      c.height = Math.round(sz * dpr);
    }
    this.sizePx = sz;
    this.square = (sz * dpr) / 8;
    this.dpr = dpr;
    
    // Mettre à jour les dimensions du DrawingManager
    if (this.drawingManager) {
      this.drawingManager.updateDimensions();
    }
    
    this.renderAll();
  }
  private _rasterize() {
    this.sprites = new FlatSprites(128, this.theme as any);
  }
  renderAll() {
    this._drawBoard();
    this._drawPieces();
    this._drawOverlay();
  }

  private _sqToXY(square: Square) {
    const { f, r } = sqToFR(square);
    const ff = this.orientation === "white" ? f : 7 - f;
    const rr = this.orientation === "white" ? 7 - r : r;
    return { x: ff * this.square, y: rr * this.square };
  }
  private _drawBoard() {
    const ctx = this.ctxB,
      s = this.square,
      W = this.cBoard.width,
      H = this.cBoard.height;
    const { light, dark, boardBorder } = this.theme as any;
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = boardBorder;
    ctx.fillRect(0, 0, W, H);
    for (let r = 0; r < 8; r++)
      for (let f = 0; f < 8; f++) {
        const x = (this.orientation === "white" ? f : 7 - f) * s;
        const y = (this.orientation === "white" ? 7 - r : r) * s;
        ctx.fillStyle = (r + f) % 2 === 0 ? light : dark;
        ctx.fillRect(x, y, s, s);
      }
    if (this.showCoords) {
      ctx.save();
      ctx.font = `${Math.floor(s * 0.18)}px ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto`;
      ctx.textBaseline = "bottom";
      ctx.textAlign = "left";
      ctx.fillStyle = "rgba(0,0,0,0.35)";
      for (let f = 0; f < 8; f++) {
        const file = this.orientation === "white" ? FILES[f] : FILES[7 - f];
        ctx.fillText(file, f * s + s * 0.06, H - s * 0.06);
      }
      ctx.textBaseline = "top";
      ctx.textAlign = "right";
      for (let r = 0; r < 8; r++) {
        const rank = this.orientation === "white" ? RANKS[7 - r] : RANKS[r];
        ctx.fillText(rank, s * 0.94, r * s + s * 0.06);
      }
      ctx.restore();
    }
  }
  private _drawPieceSprite(piece: string, x: number, y: number, scale = 1) {
    const map: any = { k: 0, q: 1, r: 2, b: 3, n: 4, p: 5 };
    const isW = isWhitePiece(piece);
    const idx = map[piece.toLowerCase()];
    const s128 = 128;
    const sx = idx * s128;
    const sy = isW ? s128 : 0;
    const d = this.square * scale;
    const dx = x + (this.square - d) / 2;
    const dy = y + (this.square - d) / 2;
    (this.ctxP as any).drawImage(this.sprites.getSheet(), sx, sy, s128, s128, dx, dy, d, d);
  }
  private _drawPieces() {
    const ctx = this.ctxP,
      W = this.cPieces.width,
      H = this.cPieces.height;
    ctx.clearRect(0, 0, W, H);
    const draggingSq = this._dragging?.from;
    for (let r = 0; r < 8; r++)
      for (let f = 0; f < 8; f++) {
        const p = this.state.board[r][f];
        if (!p) continue;
        const square = sq(f, r);
        if (draggingSq === square) continue;
        const { x, y } = this._sqToXY(square);
        this._drawPieceSprite(p, x, y, 1);
      }
    if (this._dragging) {
      const { piece, x, y } = this._dragging;
      this._drawPieceSprite(piece, x - this.square / 2, y - this.square / 2, 1.05);
    }
  }
  private _drawOverlay() {
    const ctx = this.ctxO,
      W = this.cOverlay.width,
      H = this.cOverlay.height;
    ctx.clearRect(0, 0, W, H);
    const s = this.square;
    
    // Rendu des éléments classiques (lastMove, selected, etc.)
    if (this._lastMove) {
      const { from, to } = this._lastMove;
      const A = this._sqToXY(from),
        B = this._sqToXY(to);
      ctx.fillStyle = (this.theme as any).lastMove;
      ctx.fillRect(A.x, A.y, s, s);
      ctx.fillRect(B.x, B.y, s, s);
    }
    if (this._customHighlights?.squares) {
      ctx.fillStyle = (this.theme as any).moveTo;
      for (const sqr of this._customHighlights.squares) {
        const B = this._sqToXY(sqr);
        ctx.fillRect(B.x, B.y, s, s);
      }
    }
    if (this._selected) {
      const A = this._sqToXY(this._selected);
      ctx.fillStyle = (this.theme as any).moveFrom;
      ctx.fillRect(A.x, A.y, s, s);
      if (this.highlightLegal && this._legalCached) {
        ctx.fillStyle = (this.theme as any).dot;
        for (const m of this._legalCached) {
          const B = this._sqToXY(m.to);
          ctx.beginPath();
          ctx.arc(B.x + s / 2, B.y + s / 2, s * 0.12, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }
    
    // Rendu classique des flèches anciennes (pour compatibilité)
    for (const a of this._arrows) {
      this._drawArrow(a.from, a.to, a.color || (this.theme as any).arrow);
    }
    
    if (this._premove) {
      const A = this._sqToXY(this._premove.from),
        B = this._sqToXY(this._premove.to);
      ctx.fillStyle = (this.theme as any).premove;
      ctx.fillRect(A.x, A.y, s, s);
      ctx.fillRect(B.x, B.y, s, s);
    }
    if (this._hoverSq && this._dragging) {
      const B = this._sqToXY(this._hoverSq);
      ctx.fillStyle = (this.theme as any).moveTo;
      ctx.fillRect(B.x, B.y, s, s);
    }
    
    // Déléguer le rendu des nouveaux dessins au DrawingManager
    if (this.drawingManager) {
      if (this.showArrows) {
        this.drawingManager.renderArrows();
      }
      if (this.showHighlights) {
        this.drawingManager.renderHighlights();
      }
      if (this.allowPremoves) {
        this.drawingManager.renderPremove();
      }
    }
  }
  private _drawArrow(from: Square, to: Square, color: string) {
    const s = this.square;
    const A = this._sqToXY(from),
      B = this._sqToXY(to);
    this._drawArrowBetween(A.x + s / 2, A.y + s / 2, B.x + s / 2, B.y + s / 2, color);
  }
  private _drawArrowBetween(fromX: number, fromY: number, toX: number, toY: number, color: string) {
    const dx = toX - fromX,
      dy = toY - fromY;
    const len = Math.hypot(dx, dy);
    if (len < 1) return;
    const ux = dx / len,
      uy = dy / len;
    const head = Math.min(16 * this.dpr, len * 0.25);
    const thick = Math.max(6 * this.dpr, this.square * 0.08);
    const ctx = this.ctxO;
    ctx.save();
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.globalAlpha = 0.95;
    ctx.beginPath();
    ctx.moveTo(fromX, fromY);
    ctx.lineTo(toX - ux * head, toY - uy * head);
    ctx.lineWidth = thick;
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(toX, toY);
    ctx.lineTo(toX - ux * head - uy * head * 0.5, toY - uy * head + ux * head * 0.5);
    ctx.lineTo(toX - ux * head + uy * head * 0.5, toY - uy * head - ux * head * 0.5);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  // ---- interaction ----
  private _attachEvents() {
    const onDown = (e: PointerEvent) => {
      const pt = this._evt(e);
      if (!pt) return;
      if (!this.interactive) return;
      
      // Gestion du clic droit pour les flèches (drag & drop)
      if (e.button === 2) {
        e.preventDefault();
        if (this.drawingManager && this.drawingManager.handleRightMouseDown(pt.x, pt.y)) {
          this.renderAll();
          return;
        }
      }
      
      if (e.button !== 0) return;
      const from = this._xyToSquare(pt.x, pt.y);
      
      const piece = this._pieceAt(from);
      if (!piece) return;
      const side = isWhitePiece(piece) ? "w" : "b";
      if (side !== (this.state.turn as any)) return;
      this._selected = from;
      this._legalCached = this.rules.movesFrom(from);
      this._dragging = { from, piece, x: pt.x, y: pt.y };
      this._hoverSq = from;
      this.renderAll();
    };
    
    const onMove = (e: PointerEvent) => {
      const pt = this._evt(e);
      if (!pt) return;
      
      // Déléguer à DrawingManager
      if (this.drawingManager && this.drawingManager.handleMouseMove(pt.x, pt.y)) {
        this.renderAll();
      }
      
      if (this._dragging) {
        this._dragging.x = pt.x;
        this._dragging.y = pt.y;
        this._hoverSq = this._xyToSquare(pt.x, pt.y);
        this._drawPieces();
        this._drawOverlay();
      }
    };
    
    const onUp = (e: PointerEvent) => {
      const pt = this._evt(e);
      
      // Gestion du relâchement du clic droit pour les flèches
      if (e.button === 2) {
        let handled = false;
        
        if (this.drawingManager && pt) {
          handled = this.drawingManager.handleRightMouseUp(pt.x, pt.y);
        }
        
        // Si aucune flèche n'a été créée et que c'était un simple clic, gérer le cycle des highlights
        if (!handled && pt && this.rightClickHighlights) {
          const square = this._xyToSquare(pt.x, pt.y);
          if (this.drawingManager) {
            this.drawingManager.cycleHighlight(square);
          }
        }
        
        this.renderAll();
        return;
      }
      
      // Déléguer à DrawingManager pour les autres interactions
      if (this.drawingManager && this.drawingManager.handleMouseUp(pt?.x || 0, pt?.y || 0)) {
        this.renderAll();
        return;
      }
      
      if (!this._dragging) return;
      const drop = pt ? this._xyToSquare(pt.x, pt.y) : null;
      const from = this._dragging.from;
      this._dragging = null;
      this._hoverSq = null;
      if (!drop) {
        this._selected = null;
        this._legalCached = null;
        this.renderAll();
        return;
      }
      const legal = this.rules.move({ from, to: drop! });
      if (legal && (legal as any).ok) {
        const fen = this.rules.getFEN();
        const old = this.state;
        const next = parseFEN(fen);
        this.state = next;
        this._selected = null;
        this._legalCached = null;
        this._lastMove = { from, to: drop! };
        
        // Exécuter le premove s'il y en a un
        if (this.drawingManager) {
          const premove = this.drawingManager.getPremove();
          if (premove && this.allowPremoves) {
            // Essayer d'exécuter le premove après un délai
            setTimeout(() => {
              const premoveResult = this.rules.move(premove);
              if (premoveResult && (premoveResult as any).ok) {
                const newFen = this.rules.getFEN();
                const newState = parseFEN(newFen);
                this.state = newState;
                this._lastMove = { from: premove.from, to: premove.to };
                this.drawingManager?.clearPremove();
                this.renderAll();
                this.bus.emit("move", { from: premove.from, to: premove.to, fen: newFen });
              } else {
                this.drawingManager?.clearPremove();
                this.renderAll();
              }
            }, 100);
          }
        }
        
        this._animateTo(next, old);
        this.bus.emit("move", { from, to: drop!, fen });
      } else {
        this._selected = null;
        this._legalCached = null;
        this.renderAll();
        this.bus.emit("illegal", { from, to: drop!, reason: (legal as any)?.reason || "illegal" });
      }
    };
    
    // Gestionnaire pour les touches clavier
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        // Effacer toutes les sélections et dessins temporaires
        this._selected = null;
        this._legalCached = null;
        this._dragging = null;
        this._hoverSq = null;
        if (this.drawingManager) {
          this.drawingManager.cancelCurrentAction();
        }
        this.renderAll();
      }
    };
    
    // Gestionnaire pour le menu contextuel (désactiver le clic droit)
    const onContextMenu = (e: Event) => {
      if (this.rightClickHighlights) {
        e.preventDefault();
      }
    };
    
    this.cOverlay.addEventListener("pointerdown", onDown as any);
    this.cOverlay.addEventListener("contextmenu", onContextMenu);
    (this as any)._onPointerDown = onDown;
    (this as any)._onContextMenu = onContextMenu;
    globalThis.addEventListener("pointermove", onMove as any);
    (this as any)._onPointerMove = onMove;
    globalThis.addEventListener("pointerup", onUp as any);
    (this as any)._onPointerUp = onUp;
    globalThis.addEventListener("keydown", onKeyDown);
    (this as any)._onKeyDown = onKeyDown;
  }
  private _removeEvents() {
    this.cOverlay.removeEventListener("pointerdown", (this as any)._onPointerDown);
    this.cOverlay.removeEventListener("contextmenu", (this as any)._onContextMenu);
    globalThis.removeEventListener("pointermove", (this as any)._onPointerMove);
    globalThis.removeEventListener("pointerup", (this as any)._onPointerUp);
    globalThis.removeEventListener("keydown", (this as any)._onKeyDown);
    (this as any)._ro?.disconnect();
  }
  private _evt(e: PointerEvent) {
    const rect = this.cOverlay.getBoundingClientRect();
    const x = (e.clientX - rect.left) * (this.cOverlay.width / rect.width);
    const y = (e.clientY - rect.top) * (this.cOverlay.height / rect.height);
    if (x < 0 || y < 0 || x > this.cOverlay.width || y > this.cOverlay.height) return null;
    return { x, y };
  }
  private _xyToSquare(x: number, y: number) {
    const f = clamp(Math.floor(x / this.square), 0, 7);
    const r = clamp(Math.floor(y / this.square), 0, 7);
    const ff = this.orientation === "white" ? f : 7 - f;
    const rr = this.orientation === "white" ? 7 - r : r;
    return sq(ff, rr);
  }
  private _pieceAt(square: Square) {
    const { f, r } = sqToFR(square);
    return this.state.board[r][f];
  }

  // ---- animation ----
  private _clearAnim() {
    cancelAnimationFrame(this._raf);
    this._raf = 0;
  }
  private _animateTo(target: any, start: any) {
    this._clearAnim();
    const startTime = performance.now();
    const dur = this.animationMs;
    const moving = new Map<string, string>();
    for (let r = 0; r < 8; r++)
      for (let f = 0; f < 8; f++) {
        const a = start.board[r][f];
        const b = target.board[r][f];
        if (a && (!b || a !== b)) {
          const to = this.findPiece(target.board, a, r, f, start.board);
          if (to) moving.set(sq(f, r), sq(to.f, to.r));
        }
      }
    const tick = () => {
      const t = clamp((performance.now() - startTime) / dur, 0, 1);
      const e = easeOutCubic(t);
      const ctx = this.ctxP;
      ctx.clearRect(0, 0, this.cPieces.width, this.cPieces.height);
      for (let r = 0; r < 8; r++)
        for (let f = 0; f < 8; f++) {
          const targetPiece = target.board[r][f];
          if (!targetPiece) continue;
          const toSq = sq(f, r);
          const fromKey = [...moving.entries()].find(([from, to]) => to === toSq)?.[0];
          if (fromKey) {
            const { x: fx, y: fy } = this._sqToXY(fromKey as Square);
            const { x: tx, y: ty } = this._sqToXY(toSq as Square);
            const x = lerp(fx, tx, e),
              y = lerp(fy, ty, e);
            this._drawPieceSprite(targetPiece, x, y, 1);
          } else {
            const { x, y } = this._sqToXY(toSq as Square);
            this._drawPieceSprite(targetPiece, x, y, 1);
          }
        }
      this._drawOverlay();
      if (t < 1) this._raf = requestAnimationFrame(tick);
      else {
        this._raf = 0;
        this.renderAll();
      }
    };
    this._raf = requestAnimationFrame(tick);
  }
  private findPiece(board: (string | null)[][], piece: string, r0: number, f0: number, start: (string | null)[][]) {
    for (let r = 0; r < 8; r++)
      for (let f = 0; f < 8; f++) {
        if (board[r][f] === piece && start[r][f] !== piece) return { r, f };
      }
    return null;
  }

  // ---- New feature methods ----
  
  /**
   * Ajouter une flèche sur l'échiquier
   */
  public addArrow(arrow: Arrow) {
    if (this.drawingManager) {
      this.drawingManager.addArrowFromObject(arrow);
      this.renderAll();
    }
  }

  /**
   * Supprimer une flèche de l'échiquier
   */
  public removeArrow(from: Square, to: Square) {
    if (this.drawingManager) {
      this.drawingManager.removeArrow(from, to);
      this.renderAll();
    }
  }

  /**
   * Vider toutes les flèches
   */
  public clearArrows() {
    if (this.drawingManager) {
      this.drawingManager.clearArrows();
      this.renderAll();
    }
  }

  /**
   * Ajouter un highlight sur une case
   */
  public addHighlight(highlight: SquareHighlight) {
    if (this.drawingManager) {
      this.drawingManager.addHighlightFromObject(highlight);
      this.renderAll();
    }
  }

  /**
   * Supprimer un highlight d'une case
   */
  public removeHighlight(square: Square) {
    if (this.drawingManager) {
      this.drawingManager.removeHighlight(square);
      this.renderAll();
    }
  }

  /**
   * Vider tous les highlights
   */
  public clearHighlights() {
    if (this.drawingManager) {
      this.drawingManager.clearHighlights();
      this.renderAll();
    }
  }

  /**
   * Définir un premove
   */
  public setPremove(premove: Premove) {
    if (this.drawingManager && this.allowPremoves) {
      this.drawingManager.setPremoveFromObject(premove);
      this.renderAll();
    }
  }

  /**
   * Effacer le premove actuel
   */
  public clearPremove() {
    if (this.drawingManager) {
      this.drawingManager.clearPremove();
      this.renderAll();
    }
  }

  /**
   * Obtenir le premove actuel
   */
  public getPremove(): Premove | null {
    return this.drawingManager ? this.drawingManager.getPremove() || null : null;
  }

  /**
   * Vider tous les dessins (flèches, highlights, premoves)
   */
  public clearAllDrawings() {
    if (this.drawingManager) {
      this.drawingManager.clearAll();
      this.renderAll();
    }
  }

  /**
   * Exporter l'état des dessins
   */
  public exportDrawings() {
    return this.drawingManager ? this.drawingManager.exportState() : null;
  }

  /**
   * Importer l'état des dessins
   */
  public importDrawings(state: any) {
    if (this.drawingManager) {
      this.drawingManager.importState(state);
      this.renderAll();
    }
  }
}
