import type { Square, Arrow, SquareHighlight, HighlightType, DrawingState, Premove } from './types';
import { FILES, RANKS } from './utils';

type ModifierKey = 'shiftKey' | 'ctrlKey' | 'altKey';
type ModifierState = Partial<Record<ModifierKey, boolean>>;
type ManagedHighlightType = Exclude<HighlightType, 'circle'>;
type ArrowInput = Pick<Arrow, 'from' | 'to'> & Partial<Omit<Arrow, 'from' | 'to'>>;
type NormalizedArrow = Arrow & Required<Pick<Arrow, 'width' | 'opacity' | 'knightMove'>>;
type DrawingStateInternal = Omit<DrawingState, 'arrows'> & { arrows: NormalizedArrow[] };
type DrawingAction =
  | { type: 'none' }
  | ({ type: 'drawing_arrow'; startSquare: Square } & ModifierState);

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
  };

  private readonly canvas: HTMLCanvasElement;
  private squareSize = 60;
  private orientation: 'white' | 'black' = 'white';
  private showSquareNames = false;

  /**
   * Tracks the current user interaction state
   */
  private currentAction: DrawingAction = { type: 'none' };

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.updateDimensions();
  }

  public updateDimensions(): void {
    // Use the real canvas size in pixels, not the DOM size
    const boardSize = Math.min(this.canvas.width, this.canvas.height);
    this.squareSize = boardSize / 8;
  }

  public setOrientation(orientation: 'white' | 'black'): void {
    this.orientation = orientation;
  }

  public setShowSquareNames(show: boolean): void {
    this.showSquareNames = show;
  }

  // Arrow management
  public addArrow(
    fromOrArrow: Square | ArrowInput,
    to?: Square,
    color: string = DEFAULT_ARROW_STYLE.color,
    width: number = DEFAULT_ARROW_STYLE.width,
    opacity: number = DEFAULT_ARROW_STYLE.opacity,
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
      return;
    }

    this.state.arrows.push(arrow);
  }

  private normalizeArrow(arrow: ArrowInput): NormalizedArrow {
    const color = arrow.color ?? DEFAULT_ARROW_STYLE.color;
    const width = arrow.width ?? DEFAULT_ARROW_STYLE.width;
    const opacity = arrow.opacity ?? DEFAULT_ARROW_STYLE.opacity;
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
    }
  }

  public clearArrows(): void {
    this.state.arrows = [];
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

  /**
   * Get the pixel coordinates of the top-left corner of a square
   * @param square The square in algebraic notation (e.g., 'a1', 'h8')
   * @returns An object with x and y coordinates
   */
  private getSquareCoordinates(square: string): { x: number; y: number } {
    const file = square[0].toLowerCase();
    const rank = parseInt(square[1], 10);

    let fileIndex = file.charCodeAt(0) - 'a'.charCodeAt(0);
    let rankIndex = 8 - rank;

    // Adjust for board orientation
    if (this.orientation === 'black') {
      fileIndex = 7 - fileIndex;
      rankIndex = 7 - rankIndex;
    }

    return {
      x: fileIndex * this.squareSize,
      y: rankIndex * this.squareSize,
    };
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
    const { x, y } = this.getSquareCoordinates(square);
    const halfSize = this.squareSize / 2;
    return {
      x: x + halfSize,
      y: y + halfSize,
    };
  }

  public getHighlights(): SquareHighlight[] {
    return this.state.highlights.map((highlight) => ({ ...highlight }));
  }

  // Premove management
  public setPremove(from: Square, to: Square, promotion?: 'q' | 'r' | 'b' | 'n'): void {
    this.state.premove = { from, to, promotion };
  }

  public clearPremove(): void {
    this.state.premove = undefined;
  }

  public getPremove(): Premove | undefined {
    return this.state.premove;
  }

  // Coordinate utilities
  public squareToCoords(square: Square): [number, number] {
    const file = square.charCodeAt(0) - 97; // 'a' = 0, 'b' = 1, etc.
    const rank = parseInt(square[1]) - 1; // '1' = 0, '2' = 1, etc.

    if (this.orientation === 'white') {
      return [file * this.squareSize, (7 - rank) * this.squareSize];
    } else {
      return [(7 - file) * this.squareSize, rank * this.squareSize];
    }
  }

  public coordsToSquare(x: number, y: number): Square {
    const file = Math.floor(x / this.squareSize);
    const rank = Math.floor(y / this.squareSize);

    let actualFile: number;
    let actualRank: number;

    if (this.orientation === 'white') {
      actualFile = file;
      actualRank = 7 - rank;
    } else {
      actualFile = 7 - file;
      actualRank = rank;
    }

    const fileChar = String.fromCharCode(97 + actualFile); // 0 = 'a', 1 = 'b', etc.
    const rankChar = (actualRank + 1).toString();

    return `${fileChar}${rankChar}` as Square;
  }

  // Knight move detection
  private isKnightMove(from: Square, to: Square): boolean {
    const fromFile = from.charCodeAt(0) - 97; // 'a' = 0, 'b' = 1, etc.
    const fromRank = parseInt(from[1]) - 1; // '1' = 0, '2' = 1, etc.
    const toFile = to.charCodeAt(0) - 97;
    const toRank = parseInt(to[1]) - 1;

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
    const fontSize = Math.max(10, squareSize * 0.18); // Slightly reduced font size
    const filePadding = squareSize * 0.1;
    const rankPadding = squareSize * 0.15;

    // More subtle font style
    ctx.font = `500 ${fontSize}px 'Segoe UI', Arial, sans-serif`;
    ctx.textBaseline = 'middle';

    // More subtle colors with opacity
    const lightSquareColor = 'rgba(240, 217, 181, 0.7)';
    const darkSquareColor = 'rgba(181, 136, 99, 0.7)';

    // Draw column letters (a-h)
    for (let file = 0; file < 8; file++) {
      const char = String.fromCharCode(97 + file); // a-h
      const x =
        (orientation === 'white' ? file : 7 - file) * squareSize +
        (orientation === 'white' ? filePadding : squareSize - filePadding);
      const y =
        orientation === 'white'
          ? this.canvas.height / dpr - filePadding
          : filePadding + fontSize / 2;

      // Use the correct color based on orientation and square
      const isLightSquare = (file + (orientation === 'white' ? 7 : 0)) % 2 === 1;
      ctx.fillStyle = isLightSquare ? lightSquareColor : darkSquareColor;

      ctx.textAlign = 'left'; // Always left for file labels
      ctx.fillText(char, x, y);
    }

    // Draw rank numbers (1-8)
    for (let rank = 0; rank < 8; rank++) {
      const num = 8 - rank;
      const x = orientation === 'white' ? rankPadding : this.canvas.width / dpr - rankPadding;
      const y =
        (orientation === 'white' ? rank : 7 - rank) * squareSize +
        (orientation === 'white' ? squareSize - rankPadding : rankPadding + fontSize / 2);

      // Use the correct color based on orientation and square
      const isLightSquare = (rank + (orientation === 'white' ? 1 : 0)) % 2 === 0;
      ctx.fillStyle = isLightSquare ? lightSquareColor : darkSquareColor;

      ctx.textAlign = 'left'; // Always left for rank labels
      ctx.fillText(num.toString(), x, y);
    }

    ctx.restore();
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

    // Determine L-shape orientation (horizontal then vertical or vertical then horizontal)
    const absDx = Math.abs(dx);
    const absDy = Math.abs(dy);

    let cornerX: number, cornerY: number;

    // If horizontal movement is greater, go horizontally first
    if (absDx > absDy) {
      cornerX = centerToX;
      cornerY = centerFromY;
    } else {
      // Otherwise, go vertically first
      cornerX = centerFromX;
      cornerY = centerToY;
    }

    // Style configuration
    const lineWidth = this.applyArrowStyle(ctx, arrow);

    // Adjustment to avoid overlapping with pieces
    const offset = this.squareSize * 0.2;

    // Calculate adjusted start and end points
    let startX = centerFromX;
    let startY = centerFromY;
    let endX = centerToX;
    let endY = centerToY;

    // Adjust start point
    if (absDx > absDy) {
      // First horizontal segment
      startX += dx > 0 ? offset : -offset;
      endX += dx > 0 ? -offset : offset;
    } else {
      // First vertical segment
      startY += dy > 0 ? offset : -offset;
      endY += dy > 0 ? -offset : offset;
    }

    // Draw the L with two segments
    ctx.beginPath();
    ctx.moveTo(startX, startY);
    ctx.lineTo(cornerX, cornerY);
    ctx.lineTo(endX, endY);
    ctx.stroke();

    // Draw the arrowhead at the end
    const arrowHeadSize = lineWidth * 3;
    const arrowAngle = Math.PI / 6; // 30 degrees

    // Calculate the angle of the last segment
    let finalAngle: number;
    if (absDx > absDy) {
      // The last segment is vertical
      finalAngle = dy > 0 ? Math.PI / 2 : -Math.PI / 2;
    } else {
      // The last segment is horizontal
      finalAngle = dx > 0 ? 0 : Math.PI;
    }

    ctx.beginPath();
    ctx.moveTo(endX, endY);
    ctx.lineTo(
      endX - arrowHeadSize * Math.cos(finalAngle - arrowAngle),
      endY - arrowHeadSize * Math.sin(finalAngle - arrowAngle),
    );
    ctx.lineTo(
      endX - arrowHeadSize * Math.cos(finalAngle + arrowAngle),
      endY - arrowHeadSize * Math.sin(finalAngle + arrowAngle),
    );
    ctx.closePath();
    ctx.fill();
  }

  // Highlight rendering
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
      return ARROW_COLOR_BY_MODIFIER.default;
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

  // Methods to get the complete state
  public getDrawingState(): DrawingState {
    return {
      arrows: this.getArrows(),
      highlights: this.getHighlights(),
      premove: this.state.premove ? { ...this.state.premove } : undefined,
    };
  }

  public setDrawingState(state: Partial<DrawingState>): void {
    if (state.arrows !== undefined) {
      this.state.arrows = state.arrows.map((arrow) => this.normalizeArrow(arrow));
    }
    if (state.highlights !== undefined) {
      this.state.highlights = state.highlights.map((highlight) => ({ ...highlight }));
    }
    if (state.premove !== undefined) {
      this.state.premove = state.premove ? { ...state.premove } : undefined;
    }
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

  public handleMouseDown(x: number, y: number, shiftKey: boolean, ctrlKey: boolean): boolean {
    // Do not handle left-click here, arrows are now made with right-click
    return false;
  }

  public handleRightMouseDown(
    x: number,
    y: number,
    shiftKey: boolean = false,
    ctrlKey: boolean = false,
    altKey: boolean = false,
  ): boolean {
    const square = this.coordsToSquare(x, y);

    // Start drawing an arrow on right-click with modifiers
    this.currentAction = { type: 'drawing_arrow', startSquare: square, shiftKey, ctrlKey, altKey };
    return true;
  }

  public handleMouseMove(x: number, y: number): boolean {
    // For now, do nothing during movement
    return false;
  }

  public handleMouseUp(x: number, y: number): boolean {
    // This method is no longer used for arrows (right-click)
    this.cancelCurrentAction();
    return false;
  }

  public handleRightMouseUp(x: number, y: number): boolean {
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

    if (existingIndex >= 0) {
      this.removeHighlight(square);
      return;
    }

    this.addHighlight(square, highlightType);
  }

  public renderPremove(): void {
    this.withContext((ctx) => this.drawPremove(ctx));
  }

  public renderHighlights(): void {
    this.withContext((ctx) => this.drawHighlights(ctx));
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

    for (let r = 0; r < 8; r++) {
      for (let f = 0; f < 8; f++) {
        const square = this.coordsToSquare(f * this.squareSize, r * this.squareSize);
        const [x, y] = this.squareToCoords(square);

        // Draw file names (a, b, c...)
        if (r === (this.orientation === 'white' ? 7 : 0)) {
          // Bottom rank for white, top rank for black
          const file = this.orientation === 'white' ? FILES[f] : FILES[7 - f];
          ctx.textAlign = this.orientation === 'white' ? 'left' : 'right';
          ctx.textBaseline = 'bottom';
          ctx.fillText(
            file,
            x +
              (this.orientation === 'white'
                ? this.squareSize * 0.06
                : this.squareSize - this.squareSize * 0.06),
            y + this.squareSize - this.squareSize * 0.06,
          );
        }

        // Draw rank names (1, 2, 3...)
        if (f === (this.orientation === 'white' ? 0 : 7)) {
          // Left file for white, right file for black
          const rank = RANKS[7 - r];
          ctx.textAlign = this.orientation === 'white' ? 'left' : 'right';
          ctx.textBaseline = this.orientation === 'white' ? 'top' : 'bottom';
          ctx.fillText(
            rank,
            x +
              (this.orientation === 'white'
                ? this.squareSize * 0.06
                : this.squareSize - this.squareSize * 0.06),
            y +
              (this.orientation === 'white'
                ? this.squareSize * 0.06
                : this.squareSize - this.squareSize * 0.06),
          );
        }
      }
    }
    ctx.restore();
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
    this.state.arrows = [];
    this.state.highlights = [];
    this.state.premove = undefined;
  }
}
