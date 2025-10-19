export interface BoardPointerEventPoint {
  x: number;
  y: number;
}

export interface BoardEventManagerCallbacks {
  cancelActiveDrag(): boolean;
  handleLeftMouseDown(event: PointerEvent): void;
  handleLeftMouseUp(event: PointerEvent): void;
  handleMouseMove(event: PointerEvent, point: BoardPointerEventPoint | null): void;
  handleRightMouseDown(event: PointerEvent): void;
  handleRightMouseUp(event: PointerEvent): void;
  handleEscapeKey(): void;
  getPointerPosition(event: PointerEvent): BoardPointerEventPoint | null;
  isInteractive(): boolean;
  allowDragging(): boolean;
  allowRightClickHighlights(): boolean;
}

export class BoardEventManager {
  private pointerDownHandler?: (event: PointerEvent) => void;
  private pointerMoveHandler?: (event: PointerEvent) => void;
  private pointerUpHandler?: (event: PointerEvent) => void;
  private keyDownHandler?: (event: KeyboardEvent) => void;
  private contextMenuHandler?: (event: Event) => void;
  private pointerDownAttached = false;
  private globalPointerEventsAttached = false;
  private localPointerEventsAttached = false;
  private cancelledDragWithRightClick = false;

  constructor(
    private readonly overlay: HTMLCanvasElement,
    private readonly callbacks: BoardEventManagerCallbacks,
  ) {}

  public attach(): void {
    const cancelActiveDrag = (): boolean => {
      const cancelled = this.callbacks.cancelActiveDrag();
      if (cancelled) {
        this.cancelledDragWithRightClick = true;
      }
      return cancelled;
    };

    const onPointerDown = (event: PointerEvent): void => {
      if (event.button === 2) {
        event.preventDefault();
        if (cancelActiveDrag()) {
          return;
        }
        this.cancelledDragWithRightClick = false;
        this.callbacks.handleRightMouseDown(event);
        return;
      }

      if (event.button !== 0 || !this.callbacks.isInteractive()) {
        return;
      }
      this.callbacks.handleLeftMouseDown(event);
    };

    const onPointerMove = (event: PointerEvent): void => {
      const point = this.callbacks.getPointerPosition(event);
      this.callbacks.handleMouseMove(event, point);
    };

    const onPointerUp = (event: PointerEvent): void => {
      if (event.button === 2) {
        if (cancelActiveDrag()) {
          this.cancelledDragWithRightClick = false;
          return;
        }
        if (this.cancelledDragWithRightClick) {
          this.cancelledDragWithRightClick = false;
          return;
        }
        this.callbacks.handleRightMouseUp(event);
        return;
      }

      this.callbacks.handleLeftMouseUp(event);
    };

    const onKeyDown = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') {
        this.callbacks.handleEscapeKey();
      }
    };

    const onContextMenu = (event: Event): void => {
      if (this.callbacks.allowRightClickHighlights()) {
        event.preventDefault();
      }
    };

    this.pointerDownHandler = onPointerDown;
    this.pointerMoveHandler = onPointerMove;
    this.pointerUpHandler = onPointerUp;
    this.keyDownHandler = onKeyDown;
    this.contextMenuHandler = onContextMenu;

    this.overlay.addEventListener('contextmenu', onContextMenu);
    globalThis.addEventListener('keydown', onKeyDown);

    this.updatePointerBindings();
  }

  public detach(): void {
    if (this.pointerDownAttached && this.pointerDownHandler) {
      this.overlay.removeEventListener('pointerdown', this.pointerDownHandler);
      this.pointerDownAttached = false;
    }

    if (this.contextMenuHandler) {
      this.overlay.removeEventListener('contextmenu', this.contextMenuHandler);
      this.contextMenuHandler = undefined;
    }

    this.unbindGlobalPointerEvents();
    this.unbindLocalPointerEvents();

    if (this.keyDownHandler) {
      globalThis.removeEventListener('keydown', this.keyDownHandler);
      this.keyDownHandler = undefined;
    }

    this.pointerDownHandler = undefined;
    this.pointerMoveHandler = undefined;
    this.pointerUpHandler = undefined;
  }

  public updatePointerBindings(): void {
    if (!this.pointerDownHandler || !this.pointerMoveHandler || !this.pointerUpHandler) {
      return;
    }

    if (!this.pointerDownAttached) {
      this.overlay.addEventListener('pointerdown', this.pointerDownHandler);
      this.pointerDownAttached = true;
    }

    if (this.callbacks.allowDragging()) {
      this.unbindLocalPointerEvents();
      this.bindGlobalPointerEvents();
    } else {
      this.unbindGlobalPointerEvents();
      this.bindLocalPointerEvents();
    }
  }

  private bindGlobalPointerEvents(): void {
    if (this.globalPointerEventsAttached || !this.pointerMoveHandler || !this.pointerUpHandler) {
      return;
    }

    globalThis.addEventListener('pointermove', this.pointerMoveHandler);
    globalThis.addEventListener('pointerup', this.pointerUpHandler);
    this.globalPointerEventsAttached = true;
  }

  private unbindGlobalPointerEvents(): void {
    if (!this.globalPointerEventsAttached || !this.pointerMoveHandler || !this.pointerUpHandler) {
      return;
    }

    globalThis.removeEventListener('pointermove', this.pointerMoveHandler);
    globalThis.removeEventListener('pointerup', this.pointerUpHandler);
    this.globalPointerEventsAttached = false;
  }

  private bindLocalPointerEvents(): void {
    if (this.localPointerEventsAttached || !this.pointerMoveHandler || !this.pointerUpHandler) {
      return;
    }

    this.overlay.addEventListener('pointermove', this.pointerMoveHandler);
    this.overlay.addEventListener('pointerup', this.pointerUpHandler);
    this.localPointerEventsAttached = true;
  }

  private unbindLocalPointerEvents(): void {
    if (!this.localPointerEventsAttached || !this.pointerMoveHandler || !this.pointerUpHandler) {
      return;
    }

    this.overlay.removeEventListener('pointermove', this.pointerMoveHandler);
    this.overlay.removeEventListener('pointerup', this.pointerUpHandler);
    this.localPointerEventsAttached = false;
  }
}
