import type {
  Square,
  Arrow,
  SquareHighlight,
  HighlightType,
  DrawingState,
  Premove,
  Color,
  PromotionPiece,
  ArrowStyleOptions,
  NotationStyleOptions,
  StatusHighlight,
} from './types';
import {
  FILES,
  RANKS,
  clamp,
  generateFileLabels,
  generateRankLabels,
  sq,
  sqToFR,
  resolveBoardGeometry,
  getRelativeCoords,
  type RelativeCoord,
} from './utils';

type ModifierKey = 'shiftKey' | 'ctrlKey' | 'altKey';
type ModifierState = Partial<Record<ModifierKey, boolean>>;
type ManagedHighlightType = Exclude<HighlightType, 'circle'>;
type ArrowInput = Pick<Arrow, 'from' | 'to'> & Partial<Omit<Arrow, 'from' | 'to'>>;
type NormalizedArrow = Arrow & Required<Pick<Arrow, 'width' | 'opacity' | 'knightMove'>>;
type DrawingStateInternal = Omit<DrawingState, 'arrows' | 'statusHighlight'> & {
  arrows: NormalizedArrow[];
  statusHighlight: StatusHighlight | null;
};
type DrawingAction =
  | { type: 'none' }
  | ({ type: 'drawing_arrow'; startSquare: Square } & ModifierState);

interface DrawingManagerConfig {
  allowDrawingArrows?: boolean;
  arrowOptions?: ArrowStyleOptions;
  clearArrowsOnClick?: boolean;
  onArrowsChange?: (arrows: Arrow[]) => void;
  lightSquareNotationStyle?: NotationStyleOptions;
  darkSquareNotationStyle?: NotationStyleOptions;
  alphaNotationStyle?: NotationStyleOptions;
  numericNotationStyle?: NotationStyleOptions;
  boardFiles?: number;
  boardRanks?: number;
  fileLabels?: string[];
  rankLabels?: string[];
}

interface NotationStyles {
  light?: NotationStyleOptions | null;
  dark?: NotationStyleOptions | null;
  alpha?: NotationStyleOptions | null;
  numeric?: NotationStyleOptions | null;
}

interface BoardGeometryConfig {
  files: number;
  ranks: number;
  fileLabels: string[];
  rankLabels: string[];
}

const DEFAULT_ARROW_STYLE = {
  color: 'rgba(34, 197, 94, 0.6)',
  width: 2,
  opacity: 0.8,
} as const;

const ARROW_COLOR_BY_MODIFIER: Record<ModifierKey | 'default', string> = {
  default: '#ffeb3b',
  shiftKey: '#22c55e',
  ctrlKey: '#ef4444',
  altKey: '#f59e0b',
} as const;

const MODIFIER_PRIORITY: readonly ModifierKey[] = ['shiftKey', 'ctrlKey', 'altKey'];

const HIGHLIGHT_COLORS: Record<ManagedHighlightType, string> = {
  green: 'rgba(34, 197, 94, 0.6)',
  red: 'rgba(239, 68, 68, 0.6)',
  blue: 'rgba(59, 130, 246, 0.6)',
  yellow: 'rgba(245, 158, 11, 0.6)',
  orange: 'rgba(249, 115, 22, 0.6)',
  purple: 'rgba(168, 85, 247, 0.6)',
} as const;

const HIGHLIGHT_SEQUENCE: readonly ManagedHighlightType[] = [
  'green',
  'red',
  'blue',
  'yellow',
  'orange',
  'purple',
] as const;

const HIGHLIGHT_TYPE_BY_MODIFIER: Record<ModifierKey, ManagedHighlightType> = {
  shiftKey: 'green',
  ctrlKey: 'red',
  altKey: 'yellow',
} as const;

const DEFAULT_HIGHLIGHT_OPACITY = 0.3;
const SPECIAL_HIGHLIGHT_OPACITY: Record<string, number> = {
  selected: 0.5,
  lastMove: 0.6,
};

const DEFAULT_CIRCLE_COLOR = 'rgba(255, 255, 0, 0.5)';

export class DrawingManager {
  private state: DrawingStateInternal = {
    arrows: [],
    highlights: [],
    premove: undefined,
    premoves: undefined,
    activePremoveColor: undefined,
    promotionPreview: undefined,
    statusHighlight: null,
  };

  private readonly canvas: HTMLCanvasElement;
  private squareSize = 60;
  private orientation: 'white' | 'black' = 'white';
  private showSquareNames = false;
  private allowDrawingArrows = true;
  private clearArrowsOnClick = false;
  private arrowOptions: ArrowStyleOptions = {};
  private arrowsChangeCallback?: (arrows: Arrow[]) => void;
  private suppressArrowsChange = false;
  private lightNotationStyle?: NotationStyleOptions;
  private darkNotationStyle?: NotationStyleOptions;
  private alphaNotationStyle?: NotationStyleOptions;
  private numericNotationStyle?: NotationStyleOptions;
  private filesCount = 8;
  private ranksCount = 8;
  private fileLabels = generateFileLabels(8);
  private rankLabels = generateRankLabels(8);

  /**
   * Tracks the current user interaction state
   */
  private currentAction: DrawingAction = { type: 'none' };

  constructor(canvas: HTMLCanvasElement, config: DrawingManagerConfig = {}) {
    this.canvas = canvas;
    if (config.arrowOptions) {
      this.arrowOptions = { ...config.arrowOptions };
    }
    if (config.allowDrawingArrows !== undefined) {
      this.allowDrawingArrows = config.allowDrawingArrows;
    }
    if (config.clearArrowsOnClick !== undefined) {
      this.clearArrowsOnClick = config.clearArrowsOnClick;
    }
    if (config.onArrowsChange) {
      this.arrowsChangeCallback = config.onArrowsChange;
    }
    this.setNotationStyles({
      light: config.lightSquareNotationStyle ?? undefined,
      dark: config.darkSquareNotationStyle ?? undefined,
      alpha: config.alphaNotationStyle ?? undefined,
      numeric: config.numericNotationStyle ?? undefined,
    });
    this.updateDimensions({
      files: config.boardFiles ?? this.filesCount,
      ranks: config.boardRanks ?? this.ranksCount,
      fileLabels: config.fileLabels ?? this.fileLabels,
      rankLabels: config.rankLabels ?? this.rankLabels,
    });
  }

  private setBoardGeometry({ files, ranks, fileLabels, rankLabels }: BoardGeometryConfig): void {
    const geometry = resolveBoardGeometry({
      files,
      ranks,
      fileLabels,
      rankLabels,
      defaultFiles: this.filesCount,
      defaultRanks: this.ranksCount,
    });

    this.filesCount = geometry.files;
    this.ranksCount = geometry.ranks;
    this.fileLabels = geometry.fileLabels;
    this.rankLabels = geometry.rankLabels;
  }

  private squareFromIndices(file: number, rank: number): Square {
    return sq(file, rank, this.fileLabels, this.rankLabels);
  }

  private indicesFromSquare(square: Square): { f: number; r: number } {
    return sqToFR(square, this.fileLabels, this.rankLabels);
  }

  private resolveRelativeCoords(square: Square): RelativeCoord {
    return getRelativeCoords(
      {
        boardWidth: this.squareSize * this.filesCount,
        boardHeight: this.squareSize * this.ranksCount,
        files: this.filesCount,
        ranks: this.ranksCount,
        orientation: this.orientation,
        fileLabels: this.fileLabels,
        rankLabels: this.rankLabels,
      },
      square,
    );
  }

  public setNotationStyles(styles: NotationStyles): void {
    if (Object.prototype.hasOwnProperty.call(styles, 'light')) {
      this.lightNotationStyle = styles.light ? { ...styles.light } : undefined;
    }
    if (Object.prototype.hasOwnProperty.call(styles, 'dark')) {
      this.darkNotationStyle = styles.dark ? { ...styles.dark } : undefined;
    }
    if (Object.prototype.hasOwnProperty.call(styles, 'alpha')) {
      this.alphaNotationStyle = styles.alpha ? { ...styles.alpha } : undefined;
    }
    if (Object.prototype.hasOwnProperty.call(styles, 'numeric')) {
      this.numericNotationStyle = styles.numeric ? { ...styles.numeric } : undefined;
    }
  }

  public updateDimensions(geometry?: BoardGeometryConfig): void {
    if (geometry) {
      this.setBoardGeometry(geometry);
    }
    if (!this.filesCount || !this.ranksCount) {
      return;
    }
    const squareWidth = this.canvas.width / this.filesCount;
    const squareHeight = this.canvas.height / this.ranksCount;
    this.squareSize = Math.min(squareWidth, squareHeight);
  }

  public setOrientation(orientation: 'white' | 'black'): void {
    this.orientation = orientation;
  }

  public setShowSquareNames(show: boolean): void {
    this.showSquareNames = show;
  }

  public setAllowDrawingArrows(allow: boolean): void {
    if (this.allowDrawingArrows === allow) {
      return;
    }
    this.allowDrawingArrows = allow;
    if (!allow) {
      this.cancelCurrentAction();
    }
  }

  public setClearArrowsOnClick(clear: boolean): void {
    this.clearArrowsOnClick = clear;
  }

  public setArrowOptions(options?: ArrowStyleOptions): void {
    this.arrowOptions = options ? { ...options } : {};
  }

  public setOnArrowsChange(callback?: (arrows: Arrow[]) => void): void {
    this.arrowsChangeCallback = callback;
  }

  public setArrows(arrows: Arrow[]): void {
    this.withSuppressedArrowsChange(() => {
      this.state.arrows = arrows.map((arrow) => this.normalizeArrow(arrow));
    });
  }

  private withSuppressedArrowsChange(callback: () => void): void {
    const previousState = this.suppressArrowsChange;
    this.suppressArrowsChange = true;
    try {
      callback();
    } finally {
      this.suppressArrowsChange = previousState;
    }
  }

  private notifyArrowsChange(): void {
    if (this.suppressArrowsChange) {
      return;
    }
    if (this.arrowsChangeCallback) {
      this.arrowsChangeCallback(this.getArrows());
    }
  }

  // Arrow management
  public addArrow(
    fromOrArrow: Square | ArrowInput,
    to?: Square,
    color?: string,
    width?: number,
    opacity?: number,
  ): void {
    const arrow =
      typeof fromOrArrow === 'object'
        ? this.normalizeArrow(fromOrArrow)
        : this.normalizeArrow({
            from: fromOrArrow,
            to: to!,
            color,
            width,
            opacity,
          });

    const existingIndex = this.findArrowIndex(arrow.from, arrow.to);

    if (existingIndex >= 0) {
      this.state.arrows[existingIndex] = {
        ...this.state.arrows[existingIndex],
        ...arrow,
      };
      this.notifyArrowsChange();
      return;
    }

    this.state.arrows.push(arrow);
    this.notifyArrowsChange();
  }

  private normalizeArrow(arrow: ArrowInput): NormalizedArrow {
    const color = arrow.color ?? this.arrowOptions.color ?? DEFAULT_ARROW_STYLE.color;
    const width = arrow.width ?? this.arrowOptions.width ?? DEFAULT_ARROW_STYLE.width;
    const opacity = arrow.opacity ?? this.arrowOptions.opacity ?? DEFAULT_ARROW_STYLE.opacity;
    const knightMove = arrow.knightMove ?? this.isKnightMove(arrow.from, arrow.to);

    return {
      from: arrow.from,
      to: arrow.to,
      color,
      width,
      opacity,
      knightMove,
    };
  }

  private findArrowIndex(from: Square, to: Square): number {
    return this.state.arrows.findIndex(
      (candidate) => candidate.from === from && candidate.to === to,
    );
  }

  public removeArrow(from: Square, to: Square): void {
    const index = this.findArrowIndex(from, to);
    if (index >= 0) {
      this.state.arrows.splice(index, 1);
      this.notifyArrowsChange();
    }
  }

  public clearArrows(): void {
    if (this.state.arrows.length === 0) {
      return;
    }
    this.state.arrows = [];
    this.notifyArrowsChange();
  }

  public getArrows(): Arrow[] {
    return this.state.arrows.map((arrow) => ({ ...arrow }));
  }

  // Highlight management
  public addHighlight(
    square: Square,
    type: HighlightType | string = 'green',
    opacity?: number,
  ): void {
    const calculatedOpacity = opacity ?? this.getDefaultHighlightOpacity(type);

    const existingIndex = this.findHighlightIndex(square);

    if (existingIndex >= 0) {
      // Update existing highlight
      this.state.highlights[existingIndex] = {
        ...this.state.highlights[existingIndex],
        type: type as HighlightType,
        opacity: calculatedOpacity,
      };
      return;
    }

    // Add new highlight
    this.state.highlights.push({
      square,
      type: type as HighlightType,
      opacity: calculatedOpacity,
    });
  }

  private getDefaultHighlightOpacity(type: HighlightType | string): number {
    return SPECIAL_HIGHLIGHT_OPACITY[type] ?? DEFAULT_HIGHLIGHT_OPACITY;
  }

  private findHighlightIndex(square: Square): number {
    return this.state.highlights.findIndex((highlight) => highlight.square === square);
  }

  public removeHighlight(square: Square): void {
    const index = this.findHighlightIndex(square);
    if (index >= 0) {
      this.state.highlights.splice(index, 1);
    }
  }

  public clearHighlights(): void {
    this.state.highlights = [];
  }

  public setStatusHighlight(highlight: StatusHighlight): void {
    this.state.statusHighlight = {
      ...highlight,
      squares: highlight.squares ? [...highlight.squares] : undefined,
    };
  }

  public clearStatusHighlight(): void {
    this.state.statusHighlight = null;
  }

  public getStatusHighlight(): StatusHighlight | null {
    const highlight = this.state.statusHighlight;
    if (!highlight) {
      return null;
    }
    return {
      ...highlight,
      squares: highlight.squares ? [...highlight.squares] : undefined,
    };
  }

  /**
   * Get the pixel coordinates of the top-left corner of a square
   * @param square The square in algebraic notation (e.g., 'a1', 'h8')
   * @returns An object with x and y coordinates
   */
  private getSquareCoordinates(square: string): { x: number; y: number } {
    const coords = this.resolveRelativeCoords(square as Square);
    return coords.topLeft;
  }

  /**
   * Get the size of a square in pixels
   */
  private getSquareSize(): number {
    return this.squareSize;
  }

  /**
   * Get the center point of a square in pixels
   */
  private getSquareCenter(square: string): { x: number; y: number } {
    const coords = this.resolveRelativeCoords(square as Square);
    return coords.center;
  }

  public getHighlights(): SquareHighlight[] {
    return this.state.highlights.map((highlight) => ({ ...highlight }));
  }

  // Premove management
  public setPremove(
    from: Square,
    to: Square,
    promotion?: 'q' | 'r' | 'b' | 'n',
    color?: Color,
  ): void {
    this.state.premove = { from, to, promotion };
    this.state.activePremoveColor = color;
    if (color) {
      if (!this.state.premoves) {
        this.state.premoves = {};
      }
      this.state.premoves[color] = [{ from, to, promotion }];
    }
  }

  public setPremoveQueues(
    queues: Partial<Record<Color, Premove[]>> | undefined,
    active?: { color: Color; premove?: Premove },
  ): void {
    if (queues) {
      const cloned: Partial<Record<Color, Premove[]>> = {};
      for (const color of Object.keys(queues) as Color[]) {
        const list = queues[color];
        if (list && list.length > 0) {
          cloned[color] = list.map((entry) => ({ ...entry }));
        }
      }
      this.state.premoves = Object.keys(cloned).length > 0 ? cloned : undefined;
    } else {
      this.state.premoves = undefined;
    }

    if (active?.premove) {
      this.state.premove = { ...active.premove };
      this.state.activePremoveColor = active.color;
    } else {
      this.state.premove = undefined;
      this.state.activePremoveColor = undefined;
    }
  }

  public clearPremove(color?: Color): void {
    if (!color) {
      this.state.premove = undefined;
      this.state.activePremoveColor = undefined;
      this.state.premoves = undefined;
      return;
    }

    if (this.state.premoves?.[color]) {
      delete this.state.premoves[color];
      if (!Object.values(this.state.premoves).some((queue) => queue && queue.length > 0)) {
        this.state.premoves = undefined;
      }
    }

    if (this.state.activePremoveColor === color) {
      this.state.premove = undefined;
      this.state.activePremoveColor = undefined;
    }
  }

  public getPremove(): Premove | undefined {
    return this.state.premove;
  }

  public getPremoveQueues(): Partial<Record<Color, Premove[]>> | undefined {
    if (!this.state.premoves) {
      return undefined;
    }

    const cloned: Partial<Record<Color, Premove[]>> = {};
    for (const color of Object.keys(this.state.premoves) as Color[]) {
      const list = this.state.premoves[color];
      if (list && list.length > 0) {
        cloned[color] = list.map((entry) => ({ ...entry }));
      }
    }

    return Object.keys(cloned).length > 0 ? cloned : undefined;
  }

  public getActivePremoveColor(): Color | undefined {
    return this.state.activePremoveColor;
  }

  public setPromotionPreview(square: Square, color: Color, piece?: PromotionPiece): void {
    this.state.promotionPreview = { square, color, piece };
  }

  public clearPromotionPreview(): void {
    this.state.promotionPreview = undefined;
  }

  // Coordinate utilities
  public squareToCoords(square: Square): [number, number] {
    const { x, y } = this.getSquareCoordinates(square);
    return [x, y];
  }

  public coordsToSquare(x: number, y: number): Square {
    const maxFile = this.filesCount - 1;
    const maxRank = this.ranksCount - 1;
    const file = clamp(Math.floor(x / this.squareSize), 0, maxFile);
    const rank = clamp(Math.floor(y / this.squareSize), 0, maxRank);

    const boardFile = this.orientation === 'white' ? file : maxFile - file;
    const boardRank = this.orientation === 'white' ? maxRank - rank : rank;

    return this.squareFromIndices(boardFile, boardRank);
  }

  // Knight move detection
  private isKnightMove(from: Square, to: Square): boolean {
    const { f: fromFile, r: fromRank } = this.indicesFromSquare(from);
    const { f: toFile, r: toRank } = this.indicesFromSquare(to);

    const dx = Math.abs(toFile - fromFile);
    const dy = Math.abs(toRank - fromRank);

    // A knight's move is characterized by a (1,2) or (2,1) movement
    return (dx === 1 && dy === 2) || (dx === 2 && dy === 1);
  }

  // Square names rendering
  public renderSquareNames(orientation: 'white' | 'black', _square: number, dpr: number = 1): void {
    const ctx = this.canvas.getContext('2d');
    if (!ctx) return;

    ctx.save();
    ctx.scale(dpr, dpr);

    const squareSize = this.squareSize / dpr;
    const boardHeight = this.canvas.height / dpr;

    const bottomRankIndex = orientation === 'white' ? 0 : this.ranksCount - 1;
    const leftFileIndex = orientation === 'white' ? 0 : this.filesCount - 1;

    // Draw file letters along the bottom edge
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
    for (let column = 0; column < this.filesCount; column++) {
      const boardFileIndex = orientation === 'white' ? column : this.filesCount - 1 - column;
      const char = this.resolveFileLabel(boardFileIndex);
      const isLightSquare = (boardFileIndex + bottomRankIndex) % 2 === 0;
      const { color, font, padding, opacity, textTransform } = this.resolveNotationStyle(
        squareSize,
        this.alphaNotationStyle,
        isLightSquare ? this.lightNotationStyle : this.darkNotationStyle,
        isLightSquare,
      );
      ctx.font = font;
      ctx.globalAlpha = opacity;
      const x = column * squareSize + padding;
      const y = boardHeight - padding;
      ctx.fillStyle = color;
      ctx.fillText(this.applyTextTransform(char, textTransform), x, y);
      ctx.globalAlpha = 1;
    }

    // Draw rank numbers along the left edge
    ctx.textBaseline = 'middle';
    for (let row = 0; row < this.ranksCount; row++) {
      const boardRankIndex = orientation === 'white' ? row : this.ranksCount - 1 - row;
      const label = this.resolveRankLabel(boardRankIndex);
      const isLightSquare = (leftFileIndex + boardRankIndex) % 2 === 0;
      const { color, font, padding, opacity, textTransform } = this.resolveNotationStyle(
        squareSize,
        this.numericNotationStyle,
        isLightSquare ? this.lightNotationStyle : this.darkNotationStyle,
        isLightSquare,
      );
      ctx.font = font;
      ctx.globalAlpha = opacity;
      const x = padding;
      const y = boardHeight - (row + 0.5) * squareSize;
      ctx.fillStyle = color;
      ctx.fillText(this.applyTextTransform(label, textTransform), x, y);
      ctx.globalAlpha = 1;
    }

    ctx.restore();
  }

  private resolveNotationStyle(
    squareSize: number,
    axisStyle: NotationStyleOptions | undefined,
    squareStyle: NotationStyleOptions | undefined,
    isLight: boolean,
  ): {
    color: string;
    font: string;
    padding: number;
    opacity: number;
    textTransform: 'uppercase' | 'lowercase' | 'none';
  } {
    const DEFAULT_LIGHT_COLOR = 'rgba(240, 217, 181, 0.7)';
    const DEFAULT_DARK_COLOR = 'rgba(181, 136, 99, 0.7)';
    const merged: NotationStyleOptions = { ...axisStyle, ...squareStyle };
    const fontSizeValue = merged.fontSize ?? Math.max(10, squareSize * 0.18);
    const fontSize =
      typeof fontSizeValue === 'number'
        ? `${fontSizeValue}px`
        : fontSizeValue || `${Math.max(10, squareSize * 0.18)}px`;
    const fontFamily = merged.fontFamily ?? "'Segoe UI', Arial, sans-serif";
    const fontStyle = merged.fontStyle ? `${merged.fontStyle.trim()} ` : '';
    const fontWeight = merged.fontWeight ?? 500;
    const padding = merged.padding ?? squareSize * 0.12;
    const opacity = typeof merged.opacity === 'number' ? merged.opacity : 1;
    const color = merged.color ?? (isLight ? DEFAULT_LIGHT_COLOR : DEFAULT_DARK_COLOR);
    const textTransform = merged.textTransform ?? 'none';

    return {
      color,
      font: `${fontStyle}${fontWeight} ${fontSize} ${fontFamily}`,
      padding,
      opacity,
      textTransform,
    };
  }

  private applyTextTransform(value: string, transform: 'uppercase' | 'lowercase' | 'none'): string {
    if (transform === 'uppercase') {
      return value.toUpperCase();
    }
    if (transform === 'lowercase') {
      return value.toLowerCase();
    }
    return value;
  }

  private resolveFileLabel(boardFileIndex: number): string {
    const fallbackFileLabels = generateFileLabels(boardFileIndex + 1);

    return (
      this.fileLabels[boardFileIndex] ?? FILES[boardFileIndex] ?? fallbackFileLabels.at(-1) ?? ''
    );
  }

  private resolveRankLabel(boardRankIndex: number): string {
    const fallbackRankLabels = generateRankLabels(boardRankIndex + 1);

    return (
      this.rankLabels[boardRankIndex] ??
      RANKS[boardRankIndex] ??
      fallbackRankLabels.at(-1) ??
      String(boardRankIndex + 1)
    );
  }

  public drawArrows(ctx: CanvasRenderingContext2D): void {
    ctx.save();

    for (const arrow of this.state.arrows) {
      this.drawArrow(ctx, arrow);
    }

    ctx.restore();
  }

  private drawArrow(ctx: CanvasRenderingContext2D, arrow: NormalizedArrow): void {
    if (arrow.knightMove) {
      this.drawKnightArrow(ctx, arrow);
    } else {
      this.drawStraightArrow(ctx, arrow);
    }
  }

  private applyArrowStyle(ctx: CanvasRenderingContext2D, arrow: NormalizedArrow): number {
    const lineWidth = arrow.width;

    ctx.globalAlpha = arrow.opacity;
    ctx.strokeStyle = arrow.color;
    ctx.fillStyle = arrow.color;
    ctx.lineWidth = lineWidth;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    return lineWidth;
  }

  private drawStraightArrow(ctx: CanvasRenderingContext2D, arrow: NormalizedArrow): void {
    const [fromX, fromY] = this.squareToCoords(arrow.from);
    const [toX, toY] = this.squareToCoords(arrow.to);

    // Center coordinates on squares
    const centerFromX = fromX + this.squareSize / 2;
    const centerFromY = fromY + this.squareSize / 2;
    const centerToX = toX + this.squareSize / 2;
    const centerToY = toY + this.squareSize / 2;

    // Calculate angle and distance
    const dx = centerToX - centerFromX;
    const dy = centerToY - centerFromY;
    const angle = Math.atan2(dy, dx);

    // Adjust start and end points to avoid overlapping pieces
    const offset = this.squareSize * 0.25;
    const startX = centerFromX + Math.cos(angle) * offset;
    const startY = centerFromY + Math.sin(angle) * offset;
    const endX = centerToX - Math.cos(angle) * offset;
    const endY = centerToY - Math.sin(angle) * offset;

    // Style configuration
    const lineWidth = this.applyArrowStyle(ctx, arrow);

    // Draw the line
    ctx.beginPath();
    ctx.moveTo(startX, startY);
    ctx.lineTo(endX, endY);
    ctx.stroke();

    // Draw the arrowhead
    const arrowHeadSize = lineWidth * 3;
    const arrowAngle = Math.PI / 6; // 30 degrees

    ctx.beginPath();
    ctx.moveTo(endX, endY);
    ctx.lineTo(
      endX - arrowHeadSize * Math.cos(angle - arrowAngle),
      endY - arrowHeadSize * Math.sin(angle - arrowAngle),
    );
    ctx.lineTo(
      endX - arrowHeadSize * Math.cos(angle + arrowAngle),
      endY - arrowHeadSize * Math.sin(angle + arrowAngle),
    );
    ctx.closePath();
    ctx.fill();
  }

  private drawKnightArrow(ctx: CanvasRenderingContext2D, arrow: NormalizedArrow): void {
    const [fromX, fromY] = this.squareToCoords(arrow.from);
    const [toX, toY] = this.squareToCoords(arrow.to);

    // Center coordinates on squares
    const centerFromX = fromX + this.squareSize / 2;
    const centerFromY = fromY + this.squareSize / 2;
    const centerToX = toX + this.squareSize / 2;
    const centerToY = toY + this.squareSize / 2;

    // Calculate knight move
    const dx = centerToX - centerFromX;
    const dy = centerToY - centerFromY;

    const offset = this.squareSize * 0.2;
    const lineWidth = this.applyArrowStyle(ctx, arrow);
    const { cornerX, cornerY, startX, startY, endX, endY, finalAngle } = this.buildKnightArrowPath({
      dx,
      dy,
      centerFromX,
      centerFromY,
      centerToX,
      centerToY,
      offset,
    });

    this.drawKnightSegments(ctx, { startX, startY, cornerX, cornerY, endX, endY });
    this.drawArrowHead(ctx, { endX, endY, lineWidth, angle: finalAngle });
  }

  private buildKnightArrowPath({
    dx,
    dy,
    centerFromX,
    centerFromY,
    centerToX,
    centerToY,
    offset,
  }: {
    dx: number;
    dy: number;
    centerFromX: number;
    centerFromY: number;
    centerToX: number;
    centerToY: number;
    offset: number;
  }): {
    cornerX: number;
    cornerY: number;
    startX: number;
    startY: number;
    endX: number;
    endY: number;
    finalAngle: number;
  } {
    const goesHorizontalFirst = Math.abs(dx) > Math.abs(dy);
    const cornerX = goesHorizontalFirst ? centerToX : centerFromX;
    const cornerY = goesHorizontalFirst ? centerFromY : centerToY;

    const { startX, startY, endX, endY } = this.adjustKnightEndpoints({
      goesHorizontalFirst,
      dx,
      dy,
      centerFromX,
      centerFromY,
      centerToX,
      centerToY,
      offset,
    });

    const finalAngle = this.getKnightFinalAngle(goesHorizontalFirst, dx, dy);

    return { cornerX, cornerY, startX, startY, endX, endY, finalAngle };
  }

  private adjustKnightEndpoints({
    goesHorizontalFirst,
    dx,
    dy,
    centerFromX,
    centerFromY,
    centerToX,
    centerToY,
    offset,
  }: {
    goesHorizontalFirst: boolean;
    dx: number;
    dy: number;
    centerFromX: number;
    centerFromY: number;
    centerToX: number;
    centerToY: number;
    offset: number;
  }): { startX: number; startY: number; endX: number; endY: number } {
    if (goesHorizontalFirst) {
      const startX = centerFromX + (dx > 0 ? offset : -offset);
      const endX = centerToX + (dx > 0 ? -offset : offset);
      return { startX, startY: centerFromY, endX, endY: centerToY };
    }

    const startY = centerFromY + (dy > 0 ? offset : -offset);
    const endY = centerToY + (dy > 0 ? -offset : offset);
    return { startX: centerFromX, startY, endX: centerToX, endY };
  }

  private getKnightFinalAngle(goesHorizontalFirst: boolean, dx: number, dy: number): number {
    if (goesHorizontalFirst) {
      return dy > 0 ? Math.PI / 2 : -Math.PI / 2;
    }

    return dx > 0 ? 0 : Math.PI;
  }

  private drawKnightSegments(
    ctx: CanvasRenderingContext2D,
    {
      startX,
      startY,
      cornerX,
      cornerY,
      endX,
      endY,
    }: {
      startX: number;
      startY: number;
      cornerX: number;
      cornerY: number;
      endX: number;
      endY: number;
    },
  ): void {
    ctx.beginPath();
    ctx.moveTo(startX, startY);
    ctx.lineTo(cornerX, cornerY);
    ctx.lineTo(endX, endY);
    ctx.stroke();
  }

  private drawArrowHead(
    ctx: CanvasRenderingContext2D,
    {
      endX,
      endY,
      lineWidth,
      angle,
    }: { endX: number; endY: number; lineWidth: number; angle: number },
  ): void {
    const arrowHeadSize = lineWidth * 3;
    const arrowAngle = Math.PI / 6; // 30 degrees

    ctx.beginPath();
    ctx.moveTo(endX, endY);
    ctx.lineTo(
      endX - arrowHeadSize * Math.cos(angle - arrowAngle),
      endY - arrowHeadSize * Math.sin(angle - arrowAngle),
    );
    ctx.lineTo(
      endX - arrowHeadSize * Math.cos(angle + arrowAngle),
      endY - arrowHeadSize * Math.sin(angle + arrowAngle),
    );
    ctx.closePath();
    ctx.fill();
  }

  // Highlight rendering
  private drawStatusHighlight(ctx: CanvasRenderingContext2D): void {
    const highlight = this.state.statusHighlight;
    if (!highlight) {
      return;
    }

    ctx.save();
    ctx.globalAlpha = highlight.opacity ?? 1;
    ctx.fillStyle = highlight.color;

    if (highlight.mode === 'board') {
      ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    } else {
      const squares = highlight.squares ?? [];
      for (const square of squares) {
        const [x, y] = this.squareToCoords(square);
        ctx.fillRect(x, y, this.squareSize, this.squareSize);
      }
    }

    ctx.restore();
  }

  public drawHighlights(ctx: CanvasRenderingContext2D): void {
    ctx.save();

    for (const highlight of this.state.highlights) {
      this.drawHighlight(ctx, highlight);
    }

    ctx.restore();
  }

  private drawHighlight(ctx: CanvasRenderingContext2D, highlight: SquareHighlight): void {
    const [x, y] = this.squareToCoords(highlight.square);

    const color = this.resolveHighlightColor(highlight);
    const opacity = highlight.opacity ?? 0.6;

    ctx.globalAlpha = opacity;
    ctx.fillStyle = color;

    // Draw a circle in the center of the square
    const centerX = x + this.squareSize / 2;
    const centerY = y + this.squareSize / 2;
    const radius = this.squareSize * 0.15;

    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
    ctx.fill();

    // Add an outline
    ctx.globalAlpha = opacity * 1.5;
    ctx.strokeStyle = color;
    ctx.lineWidth = 3;
    ctx.stroke();
  }

  private resolveHighlightColor(highlight: SquareHighlight): string {
    if (highlight.type === 'circle') {
      return highlight.color ?? DEFAULT_CIRCLE_COLOR;
    }

    const managedType = highlight.type as ManagedHighlightType;
    return HIGHLIGHT_COLORS[managedType] ?? highlight.color ?? DEFAULT_CIRCLE_COLOR;
  }

  private isInHighlightSequence(type: HighlightType): type is ManagedHighlightType {
    return HIGHLIGHT_SEQUENCE.includes(type as ManagedHighlightType);
  }

  private getNextHighlightType(type: HighlightType): ManagedHighlightType | null {
    if (!this.isInHighlightSequence(type)) {
      return null;
    }

    const currentIndex = HIGHLIGHT_SEQUENCE.indexOf(type);
    const nextIndex = (currentIndex + 1) % HIGHLIGHT_SEQUENCE.length;

    if (nextIndex === 0) {
      return null;
    }

    return HIGHLIGHT_SEQUENCE[nextIndex];
  }

  private getActiveModifier(modifiers: ModifierState): ModifierKey | null {
    for (const key of MODIFIER_PRIORITY) {
      if (modifiers[key]) {
        return key;
      }
    }

    return null;
  }

  private resolveArrowColor(modifiers: ModifierState): string {
    const modifier = this.getActiveModifier(modifiers);
    if (!modifier) {
      return this.arrowOptions.color ?? ARROW_COLOR_BY_MODIFIER.default;
    }

    return ARROW_COLOR_BY_MODIFIER[modifier];
  }

  private resolveHighlightTypeFromModifiers(modifiers: ModifierState): HighlightType {
    const modifier = this.getActiveModifier(modifiers);
    if (!modifier) {
      return HIGHLIGHT_SEQUENCE[0];
    }

    return HIGHLIGHT_TYPE_BY_MODIFIER[modifier];
  }

  private withContext(callback: (ctx: CanvasRenderingContext2D) => void): void {
    const ctx = this.canvas.getContext('2d');
    if (!ctx) {
      return;
    }

    callback(ctx);
  }

  // Premove rendering
  public drawPremove(ctx: CanvasRenderingContext2D): void {
    if (!this.state.premove) return;

    ctx.save();

    const [fromX, fromY] = this.squareToCoords(this.state.premove.from);
    const [toX, toY] = this.squareToCoords(this.state.premove.to);

    // Premove style (dashed arrow)
    ctx.globalAlpha = 0.7;
    ctx.strokeStyle = '#ff9800';
    ctx.lineWidth = 3;
    // Use setLineDash only if available (environment testing)
    if (ctx.setLineDash) {
      ctx.setLineDash([8, 4]);
    }
    ctx.lineCap = 'round';

    const centerFromX = fromX + this.squareSize / 2;
    const centerFromY = fromY + this.squareSize / 2;
    const centerToX = toX + this.squareSize / 2;
    const centerToY = toY + this.squareSize / 2;

    // Draw the dashed line
    ctx.beginPath();
    ctx.moveTo(centerFromX, centerFromY);
    ctx.lineTo(centerToX, centerToY);
    ctx.stroke();

    // Draw the start and end squares
    if (ctx.setLineDash) {
      ctx.setLineDash([]);
    }
    ctx.fillStyle = 'rgba(255, 152, 0, 0.3)';

    // Start square
    ctx.fillRect(fromX, fromY, this.squareSize, this.squareSize);

    // End square
    ctx.fillRect(toX, toY, this.squareSize, this.squareSize);

    ctx.restore();
  }

  private drawPromotionPreview(ctx: CanvasRenderingContext2D): void {
    const preview = this.state.promotionPreview;
    if (!preview) {
      return;
    }

    const [x, y] = this.squareToCoords(preview.square);
    const size = this.squareSize;

    ctx.save();
    ctx.globalAlpha = 0.85;
    ctx.fillStyle = 'rgba(17, 24, 39, 0.4)';
    ctx.fillRect(x, y, size, size);

    if (preview.piece) {
      const isWhite = preview.color === 'w';
      ctx.fillStyle = isWhite ? '#f9fafb' : '#111827';
      ctx.font = `${Math.max(24, Math.round(size * 0.58))}px ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      const label = preview.piece.toUpperCase();
      ctx.fillText(label, x + size / 2, y + size / 2);
    }

    ctx.restore();
  }

  // Methods to get the complete state
  public getDrawingState(): DrawingState {
    return {
      arrows: this.getArrows(),
      highlights: this.getHighlights(),
      premove: this.state.premove ? { ...this.state.premove } : undefined,
      premoves: this.state.premoves
        ? Object.fromEntries(
            Object.entries(this.state.premoves).map(([color, queue]) => [
              color,
              queue?.map((entry) => ({ ...entry })) ?? [],
            ]),
          )
        : undefined,
      activePremoveColor: this.state.activePremoveColor,
      promotionPreview: this.state.promotionPreview
        ? { ...this.state.promotionPreview }
        : undefined,
      statusHighlight: this.state.statusHighlight
        ? {
            ...this.state.statusHighlight,
            squares: this.state.statusHighlight.squares
              ? [...this.state.statusHighlight.squares]
              : undefined,
          }
        : undefined,
    };
  }

  public setDrawingState(state: Partial<DrawingState>): void {
    this.withSuppressedArrowsChange(() => {
      this.applyArrowsState(state.arrows);
      this.applyHighlightsState(state.highlights);
      this.applyPremoveState(state.premove);
      this.applyPremoveQueuesState(state.premoves);
      this.applyActivePremoveColor(state.activePremoveColor);
      this.applyPromotionPreviewState(state.promotionPreview);
      this.applyStatusHighlightState(state.statusHighlight);
    });
  }

  private applyArrowsState(arrows?: Arrow[]): void {
    if (arrows === undefined) {
      return;
    }

    this.state.arrows = arrows.map((arrow) => this.normalizeArrow(arrow));
  }

  private applyHighlightsState(highlights?: SquareHighlight[]): void {
    if (highlights === undefined) {
      return;
    }

    this.state.highlights = highlights.map((highlight) => ({ ...highlight }));
  }

  private applyPremoveState(premove?: Premove | null): void {
    if (premove === undefined) {
      return;
    }

    this.state.premove = premove ? { ...premove } : undefined;
  }

  private applyPremoveQueuesState(premoves?: Partial<Record<Color, Premove[]>>): void {
    if (premoves === undefined) {
      return;
    }

    this.state.premoves = this.clonePremoveQueues(premoves);
  }

  private clonePremoveQueues(
    premoves: Partial<Record<Color, Premove[]>>,
  ): Partial<Record<Color, Premove[]>> | undefined {
    if (!premoves) {
      return undefined;
    }

    const queues: Partial<Record<Color, Premove[]>> = {};
    for (const [color, queue] of Object.entries(premoves) as [Color, Premove[]][]) {
      if (queue && queue.length > 0) {
        queues[color] = queue.map((entry) => ({ ...entry }));
      }
    }

    return Object.keys(queues).length > 0 ? queues : undefined;
  }

  private applyActivePremoveColor(color?: Color | null): void {
    if (color === undefined) {
      return;
    }

    this.state.activePremoveColor = color ?? undefined;
  }

  private applyPromotionPreviewState(preview?: DrawingState['promotionPreview']): void {
    if (preview === undefined) {
      return;
    }

    this.state.promotionPreview = preview ? { ...preview } : undefined;
  }

  private applyStatusHighlightState(highlight?: StatusHighlight | null): void {
    if (highlight === undefined) {
      return;
    }

    this.state.statusHighlight = highlight
      ? { ...highlight, squares: highlight.squares ? [...highlight.squares] : undefined }
      : null;
  }

  // Utilities for interactions
  public getSquareFromMousePosition(mouseX: number, mouseY: number): Square | null {
    const rect = this.canvas.getBoundingClientRect();
    const x = (mouseX - rect.left) * (this.canvas.width / rect.width);
    const y = (mouseY - rect.top) * (this.canvas.height / rect.height);

    if (x < 0 || y < 0 || x >= this.canvas.width || y >= this.canvas.height) {
      return null;
    }

    return this.coordsToSquare(x, y);
  }

  // Cycle highlight colors on right-click
  public cycleHighlight(square: Square): void {
    const existingIndex = this.findHighlightIndex(square);

    if (existingIndex >= 0) {
      const currentHighlight = this.state.highlights[existingIndex];
      const nextType = this.getNextHighlightType(currentHighlight.type);

      if (!nextType) {
        this.removeHighlight(square);
        return;
      }

      this.state.highlights[existingIndex].type = nextType;
      return;
    }

    // Add a new highlight starting from the first color in the cycle
    this.addHighlight(square, HIGHLIGHT_SEQUENCE[0]);
  }

  // Complete rendering of all elements
  public draw(ctx: CanvasRenderingContext2D): void {
    // The order is important for correct layering
    this.drawHighlights(ctx);
    this.drawPremove(ctx);
    this.drawArrows(ctx);
    if (this.showSquareNames) {
      this._drawSquareNames(ctx);
    }
  }

  // Check if a point is near an arrow (for deletion)
  public getArrowAt(mouseX: number, mouseY: number, tolerance: number = 10): Arrow | null {
    const rect = this.canvas.getBoundingClientRect();
    const x = mouseX - rect.left;
    const y = mouseY - rect.top;

    for (const arrow of this.state.arrows) {
      if (this.isPointNearArrow(x, y, arrow, tolerance)) {
        return { ...arrow };
      }
    }

    return null;
  }

  private isPointNearArrow(
    x: number,
    y: number,
    arrow: NormalizedArrow,
    tolerance: number,
  ): boolean {
    const [fromX, fromY] = this.squareToCoords(arrow.from);
    const [toX, toY] = this.squareToCoords(arrow.to);

    const centerFromX = fromX + this.squareSize / 2;
    const centerFromY = fromY + this.squareSize / 2;
    const centerToX = toX + this.squareSize / 2;
    const centerToY = toY + this.squareSize / 2;

    // Calculate the distance from the point to the line
    const lineLength = Math.sqrt(
      Math.pow(centerToX - centerFromX, 2) + Math.pow(centerToY - centerFromY, 2),
    );

    if (lineLength === 0) return false;

    const distance = Math.abs(
      ((centerToY - centerFromY) * x -
        (centerToX - centerFromX) * y +
        centerToX * centerFromY -
        centerToY * centerFromX) /
        lineLength,
    );

    return distance <= tolerance;
  }

  // Export/Import for persistence
  public exportState(): string {
    return JSON.stringify(this.getDrawingState());
  }

  public importState(stateJson: string): void {
    try {
      const imported = JSON.parse(stateJson);
      this.setDrawingState(imported);
    } catch (error) {
      console.warn('Failed to import drawing state:', error);
    }
  }

  // Interaction methods for NeoChessBoard

  public handleMouseDown(_x: number, _y: number, _shiftKey: boolean, _ctrlKey: boolean): boolean {
    // Do not handle left-click here, arrows are now made with right-click
    return false;
  }

  public handleLeftClick(): boolean {
    if (!this.clearArrowsOnClick || this.state.arrows.length === 0) {
      return false;
    }

    this.clearArrows();
    return true;
  }

  public handleRightMouseDown(
    x: number,
    y: number,
    shiftKey: boolean = false,
    ctrlKey: boolean = false,
    altKey: boolean = false,
  ): boolean {
    if (!this.allowDrawingArrows) {
      return false;
    }

    const square = this.coordsToSquare(x, y);

    // Start drawing an arrow on right-click with modifiers
    this.currentAction = { type: 'drawing_arrow', startSquare: square, shiftKey, ctrlKey, altKey };
    return true;
  }

  public handleMouseMove(_x: number, _y: number): boolean {
    // For now, do nothing during movement
    return false;
  }

  public handleMouseUp(_x: number, _y: number): boolean {
    // This method is no longer used for arrows (right-click)
    this.cancelCurrentAction();
    return false;
  }

  public handleRightMouseUp(x: number, y: number): boolean {
    if (!this.allowDrawingArrows) {
      this.cancelCurrentAction();
      return false;
    }

    if (this.currentAction.type !== 'drawing_arrow') {
      this.cancelCurrentAction();
      return false;
    }

    const currentDrawingAction = this.currentAction;

    const endSquare = this.coordsToSquare(x, y);
    if (endSquare === currentDrawingAction.startSquare) {
      this.cancelCurrentAction();
      return false;
    }

    const color = this.resolveArrowColor(currentDrawingAction);

    // Check if an identical arrow already exists (same from, to, and color)
    const existingArrow = this.state.arrows.find(
      (arrow) =>
        arrow.from === currentDrawingAction.startSquare &&
        arrow.to === endSquare &&
        arrow.color === color,
    );

    if (existingArrow) {
      // Remove the identical arrow
      this.removeArrow(currentDrawingAction.startSquare, endSquare);
    } else {
      // Add or replace the arrow with the new color
      this.addArrow(currentDrawingAction.startSquare, endSquare, color);
    }

    this.cancelCurrentAction();
    return true;
  }

  public handleHighlightClick(
    square: Square,
    shiftKey: boolean = false,
    ctrlKey: boolean = false,
    altKey: boolean = false,
  ): void {
    if (!shiftKey && !ctrlKey && !altKey) {
      // Without modifiers, keep the existing cycling behavior
      this.cycleHighlight(square);
      return;
    }

    // With modifiers, apply the corresponding color directly
    const modifiers: ModifierState = { shiftKey, ctrlKey, altKey };
    const highlightType = this.resolveHighlightTypeFromModifiers(modifiers);

    // If a highlight already exists with the same color, remove it
    const existingIndex = this.state.highlights.findIndex(
      (highlight) => highlight.square === square && highlight.type === highlightType,
    );

    if (existingIndex !== -1) {
      this.removeHighlight(square);
      return;
    }

    this.addHighlight(square, highlightType);
  }

  public renderStatusHighlight(): void {
    this.withContext((ctx) => this.drawStatusHighlight(ctx));
  }

  public renderPremove(): void {
    this.withContext((ctx) => this.drawPremove(ctx));
  }

  public renderHighlights(): void {
    this.withContext((ctx) => this.drawHighlights(ctx));
  }

  public renderPromotionPreview(): void {
    this.withContext((ctx) => this.drawPromotionPreview(ctx));
  }

  // Methods with signatures adapted for NeoChessBoard
  public addArrowFromObject(arrow: Arrow): void {
    this.addArrow(arrow.from, arrow.to, arrow.color, arrow.width, arrow.opacity);
  }

  public addHighlightFromObject(highlight: SquareHighlight): void {
    this.addHighlight(highlight.square, highlight.type, highlight.opacity);
  }

  public setPremoveFromObject(premove: Premove): void {
    this.setPremove(premove.from, premove.to, premove.promotion);
  }

  // Alias for clearAllDrawings for backward compatibility
  public clearAll = this.clearAllDrawings;

  private _drawSquareNames(ctx: CanvasRenderingContext2D): void {
    ctx.save();
    ctx.font = `${Math.floor(this.squareSize * 0.18)}px ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto`;
    ctx.fillStyle = 'rgba(0,0,0,0.35)';

    const isWhite = this.orientation === 'white';
    const textOffset = this.squareSize * 0.06;
    const fileLabelRow = isWhite ? this.ranksCount - 1 : 0;
    const rankLabelColumn = isWhite ? 0 : this.filesCount - 1;

    this.drawFileNames(ctx, fileLabelRow, isWhite, textOffset);
    this.drawRankNames(ctx, rankLabelColumn, isWhite, textOffset);
    ctx.restore();
  }

  private drawFileNames(
    ctx: CanvasRenderingContext2D,
    rowIndex: number,
    isWhite: boolean,
    textOffset: number,
  ): void {
    for (let fileIndex = 0; fileIndex < this.filesCount; fileIndex++) {
      const x = fileIndex * this.squareSize;
      const y = rowIndex * this.squareSize;
      const square = this.coordsToSquare(x, y);
      const [squareX, squareY] = this.squareToCoords(square);
      const boardFileIndex = isWhite ? fileIndex : this.filesCount - 1 - fileIndex;
      const fileLabel = this.resolveFileLabel(boardFileIndex);

      ctx.textAlign = isWhite ? 'left' : 'right';
      ctx.textBaseline = 'bottom';
      ctx.fillText(
        fileLabel,
        squareX + (isWhite ? textOffset : this.squareSize - textOffset),
        squareY + this.squareSize - textOffset,
      );
    }
  }

  private drawRankNames(
    ctx: CanvasRenderingContext2D,
    columnIndex: number,
    isWhite: boolean,
    textOffset: number,
  ): void {
    for (let rankIndex = 0; rankIndex < this.ranksCount; rankIndex++) {
      const x = columnIndex * this.squareSize;
      const y = rankIndex * this.squareSize;
      const square = this.coordsToSquare(x, y);
      const [squareX, squareY] = this.squareToCoords(square);
      const boardRankIndex = isWhite ? this.ranksCount - 1 - rankIndex : rankIndex;
      const rankLabel = this.resolveRankLabel(boardRankIndex);

      ctx.textAlign = isWhite ? 'left' : 'right';
      ctx.textBaseline = isWhite ? 'top' : 'bottom';
      ctx.fillText(
        rankLabel,
        squareX + (isWhite ? textOffset : this.squareSize - textOffset),
        squareY + (isWhite ? textOffset : this.squareSize - textOffset),
      );
    }
  }

  // Additional helper methods for integration with NeoChessBoard

  /**
   * Render arrows on the canvas
   */
  public renderArrows(): void {
    this.withContext((ctx) => this.drawArrows(ctx));
  }

  /**
   * Cancel the current drawing action
   */
  public cancelCurrentAction(): void {
    this.currentAction = { type: 'none' };
  }

  /**
   * Clear all drawings (arrows, highlights, premoves)
   */
  public clearAllDrawings(): void {
    const hadArrows = this.state.arrows.length > 0;
    this.state.arrows = [];
    this.state.highlights = [];
    this.state.premove = undefined;
    this.state.premoves = undefined;
    this.state.activePremoveColor = undefined;
    this.state.promotionPreview = undefined;
    this.state.statusHighlight = null;
    if (hadArrows) {
      this.notifyArrowsChange();
    }
  }
}
