import { DrawingManager } from './DrawingManager';
import { FlatSprites } from './FlatSprites';
import type { Arrow, ArrowStyleOptions, InlineStyle, NotationStyleOptions, Theme } from './types';

export interface BoardDomManagerOptions {
  root: HTMLElement;
  boardId?: string;
  boardInlineStyle?: InlineStyle;
  filesCount: number;
  ranksCount: number;
  fileLabels: readonly string[];
  rankLabels: readonly string[];
  orientation: 'white' | 'black';
  showSquareNames: boolean;
  allowDrawingArrows: boolean;
  arrowOptions?: ArrowStyleOptions;
  clearArrowsOnClick: boolean;
  controlledArrows?: Arrow[];
  lightNotationStyle?: NotationStyleOptions;
  darkNotationStyle?: NotationStyleOptions;
  alphaNotationStyle?: NotationStyleOptions;
  numericNotationStyle?: NotationStyleOptions;
  onArrowsChange: (arrows: Arrow[]) => void;
  onResizeRequested: () => void;
  theme: Theme;
  spriteSize: number;
}

export interface BoardDomBuildResult {
  cBoard: HTMLCanvasElement;
  cPieces: HTMLCanvasElement;
  cOverlay: HTMLCanvasElement;
  ctxBoard: CanvasRenderingContext2D;
  ctxPieces: CanvasRenderingContext2D;
  ctxOverlay: CanvasRenderingContext2D;
  domOverlay?: HTMLDivElement;
  squareLayer?: HTMLDivElement;
  pieceLayer?: HTMLDivElement;
  drawingManager: DrawingManager;
  sprites: FlatSprites;
}

export class BoardDomManager {
  private readonly root: HTMLElement;
  private readonly options: Omit<BoardDomManagerOptions, 'root'>;
  private appliedBoardStyleKeys = new Set<string>();
  private resizeObserver?: ResizeObserver;
  private boardInlineStyle?: InlineStyle;

  constructor(options: BoardDomManagerOptions) {
    const { root, ...rest } = options;
    this.root = root;
    this.options = rest;
    this.boardInlineStyle = options.boardInlineStyle ? { ...options.boardInlineStyle } : undefined;
  }

  public build(): BoardDomBuildResult {
    this.setupRootElement();
    const { cBoard, cPieces, cOverlay } = this.createCanvases();
    const { domOverlay, squareLayer, pieceLayer } = this.createDomLayers();
    const { ctxBoard, ctxPieces, ctxOverlay } = this.initializeContexts({
      cBoard,
      cPieces,
      cOverlay,
    });
    const drawingManager = this.createDrawingManager(cOverlay);
    const sprites = new FlatSprites(this.options.spriteSize, this.options.theme);
    this.setupResizeObserver();
    this.injectStyles();

    return {
      cBoard,
      cPieces,
      cOverlay,
      ctxBoard,
      ctxPieces,
      ctxOverlay,
      domOverlay,
      squareLayer,
      pieceLayer,
      drawingManager,
      sprites,
    };
  }

  public setBoardStyle(style?: InlineStyle): void {
    this.boardInlineStyle = style ? { ...style } : undefined;
    this.applyBoardStyle();
  }

  public disconnect(): void {
    this.resizeObserver?.disconnect();
    this.resizeObserver = undefined;
  }

  private setupRootElement(): void {
    this.root.classList.add('ncb-root');
    this.root.style.position = 'relative';
    this.root.style.userSelect = 'none';
    this.root.style.aspectRatio = `${this.options.filesCount} / ${this.options.ranksCount}`;
    if (this.options.boardId) {
      this.root.id = this.options.boardId;
    }
    this.applyBoardStyle();
  }

  private createCanvases(): {
    cBoard: HTMLCanvasElement;
    cPieces: HTMLCanvasElement;
    cOverlay: HTMLCanvasElement;
  } {
    const doc = this.root.ownerDocument ?? document;
    const create = (): HTMLCanvasElement => {
      const canvas = doc.createElement('canvas');
      Object.assign(canvas.style, {
        position: 'absolute',
        left: '0',
        top: '0',
        width: '100%',
        height: '100%',
      });
      return canvas;
    };

    const cBoard = create();
    const cPieces = create();
    const cOverlay = create();

    this.root.append(cBoard, cPieces, cOverlay);

    return { cBoard, cPieces, cOverlay };
  }

  private createDomLayers(): {
    domOverlay?: HTMLDivElement;
    squareLayer?: HTMLDivElement;
    pieceLayer?: HTMLDivElement;
  } {
    if (typeof document === 'undefined') {
      return {};
    }

    const overlay = document.createElement('div');
    overlay.classList.add('ncb-dom-overlay');
    Object.assign(overlay.style, {
      position: 'absolute',
      left: '0',
      top: '0',
      width: '100%',
      height: '100%',
      pointerEvents: 'none',
    });

    const squareLayer = document.createElement('div');
    squareLayer.classList.add('ncb-square-overlay');
    Object.assign(squareLayer.style, {
      position: 'absolute',
      left: '0',
      top: '0',
      width: '100%',
      height: '100%',
      pointerEvents: 'none',
    });
    overlay.append(squareLayer);

    const pieceLayer = document.createElement('div');
    pieceLayer.classList.add('ncb-piece-overlay');
    Object.assign(pieceLayer.style, {
      position: 'absolute',
      left: '0',
      top: '0',
      width: '100%',
      height: '100%',
      pointerEvents: 'none',
    });
    overlay.append(pieceLayer);

    this.root.append(overlay);

    return { domOverlay: overlay, squareLayer, pieceLayer };
  }

  private initializeContexts(canvases: {
    cBoard: HTMLCanvasElement;
    cPieces: HTMLCanvasElement;
    cOverlay: HTMLCanvasElement;
  }): {
    ctxBoard: CanvasRenderingContext2D;
    ctxPieces: CanvasRenderingContext2D;
    ctxOverlay: CanvasRenderingContext2D;
  } {
    const ctxBoard = canvases.cBoard.getContext('2d')!;
    const ctxPieces = canvases.cPieces.getContext('2d')!;
    const ctxOverlay = canvases.cOverlay.getContext('2d')!;
    return { ctxBoard, ctxPieces, ctxOverlay };
  }

  private createDrawingManager(cOverlay: HTMLCanvasElement): DrawingManager {
    const drawingManager = new DrawingManager(cOverlay, {
      allowDrawingArrows: this.options.allowDrawingArrows,
      arrowOptions: this.options.arrowOptions,
      clearArrowsOnClick: this.options.clearArrowsOnClick,
      onArrowsChange: this.options.onArrowsChange,
      lightSquareNotationStyle: this.options.lightNotationStyle,
      darkSquareNotationStyle: this.options.darkNotationStyle,
      alphaNotationStyle: this.options.alphaNotationStyle,
      numericNotationStyle: this.options.numericNotationStyle,
      boardFiles: this.options.filesCount,
      boardRanks: this.options.ranksCount,
      fileLabels: [...this.options.fileLabels],
      rankLabels: [...this.options.rankLabels],
    });
    drawingManager.setOrientation(this.options.orientation);
    drawingManager.setShowSquareNames(this.options.showSquareNames);
    if (this.options.controlledArrows) {
      drawingManager.setArrows(this.options.controlledArrows);
    }
    return drawingManager;
  }

  private setupResizeObserver(): void {
    if (typeof ResizeObserver === 'undefined') {
      return;
    }
    this.resizeObserver?.disconnect();
    this.resizeObserver = new ResizeObserver(() => this.options.onResizeRequested());
    this.resizeObserver.observe(this.root);
  }

  private injectStyles(): void {
    if (typeof document === 'undefined') {
      return;
    }

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
    document.head.append(style);
  }

  private applyBoardStyle(): void {
    const style = this.boardInlineStyle;
    const nextKeys = new Set<string>(style ? Object.keys(style) : []);

    for (const key of this.appliedBoardStyleKeys) {
      if (!nextKeys.has(key)) {
        this.setRootStyleValue(key, '');
      }
    }

    this.appliedBoardStyleKeys.clear();

    if (!style) {
      return;
    }

    for (const [key, value] of Object.entries(style)) {
      const normalized = this.normalizeStyleValue(value);
      this.setRootStyleValue(key, normalized);
      this.appliedBoardStyleKeys.add(key);
    }
  }

  private setRootStyleValue(key: string, value: string): void {
    if (key.includes('-')) {
      this.root.style.setProperty(key, value);
    } else {
      (this.root.style as unknown as Record<string, string>)[key] = value;
    }
  }

  private normalizeStyleValue(value: string | number): string {
    if (typeof value === 'number') {
      return Number.isFinite(value) ? `${value}` : '';
    }
    return value;
  }
}
