import type { Move, Square } from '../types';

export interface DraggingState {
  from: Square;
  piece: string;
  x: number;
  y: number;
}

export interface PendingDragState {
  from: Square;
  piece: string;
  startClientX: number;
  startClientY: number;
  startX: number;
  startY: number;
}

export class InteractionStateManager {
  private selected: Square | null = null;
  private legalCached: Move[] | null = null;
  private dragging: DraggingState | null = null;
  private hoverSq: Square | null = null;
  private pointerSquare: Square | null = null;
  private pendingDrag: PendingDragState | null = null;

  isDragging(): this is { dragging: DraggingState } {
    return this.dragging !== null;
  }

  hasSelection(): this is { selected: Square } {
    return this.selected !== null;
  }

  hasPendingDrag(): this is { pendingDrag: PendingDragState } {
    return this.pendingDrag !== null;
  }

  getSelected(): Square | null {
    return this.selected;
  }

  setSelected(square: Square | null, legal?: Move[]): void {
    this.selected = square;
    this.legalCached = legal ?? null;
  }

  getLegalCached(): Move[] | null {
    return this.legalCached;
  }

  setLegalCached(moves: Move[] | null): void {
    this.legalCached = moves;
  }

  getDragging(): DraggingState | null {
    return this.dragging;
  }

  startDrag(state: DraggingState): void {
    this.dragging = state;
  }

  stopDrag(): void {
    this.dragging = null;
  }

  getHoverSquare(): Square | null {
    return this.hoverSq;
  }

  setHoverSquare(square: Square | null): void {
    this.hoverSq = square;
  }

  getPointerSquare(): Square | null {
    return this.pointerSquare;
  }

  setPointerSquare(square: Square | null): void {
    this.pointerSquare = square;
  }

  getPendingDrag(): PendingDragState | null {
    return this.pendingDrag;
  }

  setPendingDrag(state: PendingDragState | null): void {
    this.pendingDrag = state;
  }

  clearAll(): void {
    this.selected = null;
    this.legalCached = null;
    this.dragging = null;
    this.hoverSq = null;
    this.pointerSquare = null;
    this.pendingDrag = null;
  }
}
