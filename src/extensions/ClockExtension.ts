import type {
  ClockState,
  ClockStateUpdate,
  Color,
  ExtensionConfig,
  ExtensionContext,
} from '../core/types';

export interface ClockExtensionApi {
  /** Starts or resumes the clock. */
  startClock(color?: Color | null): void;
  /** Pauses the clock. */
  pauseClock(): void;
  /** Updates the remaining time for a side in milliseconds. */
  setTime(color: Color, milliseconds: number): void;
  /** Returns the most recent clock state. */
  getState(): ClockState | null;
}

export interface ClockExtensionOptions {
  container?: HTMLElement;
  formatTime?: (
    milliseconds: number,
    context: { color: Color; state: ClockState; isActive: boolean },
  ) => string;
  labels?: Partial<Record<Color, string>>;
  onReady?: (api: ClockExtensionApi) => void;
}

export interface ClockExtensionConfig extends ClockExtensionOptions {
  id?: string;
}

type CleanupFn = () => void;

type ClockRow = {
  root: HTMLDivElement;
  label: HTMLSpanElement;
  value: HTMLSpanElement;
  color: Color;
};

const DEFAULT_LABELS: Record<Color, string> = {
  w: 'White',
  b: 'Black',
};

function defaultFormatTime(milliseconds: number): string {
  const safeMs = Number.isFinite(milliseconds) ? Math.max(0, Math.floor(milliseconds)) : 0;
  const seconds = Math.floor(safeMs / 1000);
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;

  if (safeMs < 10_000) {
    const tenths = Math.floor((safeMs % 1000) / 100);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}.${tenths}`;
  }

  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}

class ClockExtensionInstance {
  private container: HTMLElement | null = null;
  private inner: HTMLDivElement | null = null;
  private rows: Record<Color, ClockRow> | null = null;
  private cleanup: CleanupFn[] = [];
  private currentState: ClockState | null = null;
  private rafId: number | null = null;
  private lastTick: number | null = null;
  private readonly raf: (cb: (timestamp: number) => void) => number;
  private readonly caf: (handle: number) => void;
  private readonly now: () => number;
  private fallbackTimerId = 0;
  private readonly fallbackTimers = new Map<number, ReturnType<typeof setTimeout>>();
  private readonly api: ClockExtensionApi;

  constructor(private readonly context: ExtensionContext<ClockExtensionOptions>) {
    const root = context.board.getRootElement();
    const doc = root?.ownerDocument ?? (typeof document === 'undefined' ? undefined : document);
    const win = doc?.defaultView ?? (globalThis.window === undefined ? undefined : globalThis);

    if (
      win &&
      typeof win.requestAnimationFrame === 'function' &&
      typeof win.cancelAnimationFrame === 'function'
    ) {
      this.raf = win.requestAnimationFrame.bind(win);
      this.caf = win.cancelAnimationFrame.bind(win);
    } else {
      this.raf = (cb) => {
        this.fallbackTimerId += 1;
        const id = this.fallbackTimerId;
        const handle = setTimeout(() => {
          this.fallbackTimers.delete(id);
          cb(this.now());
        }, 16);
        this.fallbackTimers.set(id, handle);
        return id;
      };
      this.caf = (id) => {
        const handle = this.fallbackTimers.get(id);
        if (handle) {
          clearTimeout(handle);
          this.fallbackTimers.delete(id);
        }
      };
    }

    if (win?.performance?.now) {
      this.now = () => win.performance.now();
    } else if (typeof performance !== 'undefined' && typeof performance.now === 'function') {
      this.now = () => performance.now();
    } else {
      this.now = () => Date.now();
    }

    this.api = {
      startClock: (color?: Color | null) => {
        const targetColor: Color | null =
          color === undefined || color === null ? (context.board.getTurn() as Color) : color;
        const updates: ClockStateUpdate = {
          running: true,
          paused: false,
          active: targetColor,
          timestamp: this.now(),
        };
        context.board.updateClockState(updates);
      },
      pauseClock: () => {
        context.board.updateClockState({
          running: false,
          paused: true,
          active: null,
          timestamp: null,
        });
      },
      setTime: (color: Color, milliseconds: number) => {
        const clamped = Math.max(0, Math.floor(milliseconds));
        const update: ClockStateUpdate = { timestamp: this.now() };
        const sideUpdate = { remaining: clamped } as Partial<ClockState['white']>;
        sideUpdate.isFlagged = clamped === 0;
        if (color === 'w') {
          update.white = sideUpdate;
        } else {
          update.black = sideUpdate;
        }
        context.board.updateClockState(update);
      },
      getState: () => this.currentState,
    };

    context.options?.onReady?.(this.api);
  }

  onInit(context: ExtensionContext<ClockExtensionOptions>): void {
    const board = context.board;
    const root = board.getRootElement();
    const doc = root?.ownerDocument ?? (typeof document === 'undefined' ? undefined : document);
    if (!doc) {
      return;
    }

    const container = context.options?.container ?? doc.createElement('div');
    this.container = container;
    container.classList.add('ncb-clock-overlay');
    container.dataset.clockOverlay = 'true';
    container.style.position = 'absolute';
    container.style.inset = '0';
    container.style.pointerEvents = 'none';
    container.style.display = 'flex';
    container.style.zIndex = '10';

    const inner = doc.createElement('div');
    inner.style.flex = '1';
    inner.style.display = 'flex';
    inner.style.flexDirection = 'column';
    inner.style.justifyContent = 'space-between';
    inner.style.padding = '8px';
    inner.style.boxSizing = 'border-box';
    inner.style.gap = '8px';
    inner.style.pointerEvents = 'none';
    container.append(inner);
    this.inner = inner;

    const rows: Record<Color, ClockRow> = {
      w: this.createRow(doc, 'w'),
      b: this.createRow(doc, 'b'),
    };
    this.rows = rows;
    inner.append(rows.b.root, rows.w.root);

    if (!context.options?.container && root) {
      const win = doc.defaultView;
      let revertPosition: (() => void) | null = null;
      if (win?.getComputedStyle(root).position === 'static') {
        const previous = root.style.position;
        root.style.position = 'relative';
        revertPosition = () => {
          root.style.position = previous;
        };
      }
      root.append(container);
      this.cleanup.push(() => {
        container.remove();
        revertPosition?.();
      });
    }

    this.cleanup.push(
      context.registerExtensionPoint('clockChange', (state) => this.handleClockChange(state)),
      context.registerExtensionPoint('move', () => this.handleMove()),
      context.registerExtensionPoint('update', () => {
        if (this.currentState) {
          this.render(this.currentState);
        }
      }),
    );

    const initialState = board.getClockState();
    this.currentState = initialState;
    this.render(initialState);
    if (initialState?.isRunning && initialState.active) {
      this.lastTick = initialState.lastUpdatedAt ?? this.now();
      this.startTicking();
    }
  }

  onDestroy(): void {
    this.stopTicking();
    while (this.cleanup.length > 0) {
      try {
        this.cleanup.pop()?.();
      } catch (error) {
        console.error('[ClockExtension] cleanup failed', error);
      }
    }
    for (const handle of this.fallbackTimers.values()) {
      clearTimeout(handle);
    }
    this.fallbackTimers.clear();
    this.container = null;
    this.inner = null;
    this.rows = null;
    this.currentState = null;
  }

  private createRow(doc: Document, color: Color): ClockRow {
    const row = doc.createElement('div');
    row.classList.add('ncb-clock-row');
    row.dataset.color = color;
    row.style.display = 'flex';
    row.style.alignItems = 'center';
    row.style.justifyContent = 'space-between';
    row.style.gap = '12px';
    row.style.padding = '6px 10px';
    row.style.borderRadius = '8px';
    row.style.background = 'rgba(17, 24, 39, 0.75)';
    row.style.color = '#f9fafb';
    row.style.fontFamily = 'monospace';
    row.style.fontSize = '0.95rem';
    row.style.boxShadow = '0 2px 8px rgba(0,0,0,0.35)';
    row.style.pointerEvents = 'none';

    const label = doc.createElement('span');
    label.classList.add('ncb-clock-label');
    label.textContent = this.context.options?.labels?.[color] ?? DEFAULT_LABELS[color];

    const value = doc.createElement('span');
    value.classList.add('ncb-clock-time');
    value.textContent = '--:--';

    row.append(label, value);

    return {
      root: row,
      label,
      value,
      color,
    };
  }

  private handleClockChange(state: ClockState): void {
    this.currentState = state;
    if (state.isRunning && state.active) {
      if (this.lastTick === null && state.lastUpdatedAt !== null) {
        this.lastTick = state.lastUpdatedAt;
      }
      this.startTicking();
    } else {
      this.stopTicking();
    }
    this.render(state);
  }

  private handleMove(): void {
    const state = this.currentState ?? this.context.board.getClockState();
    if (!state) {
      return;
    }

    const timestamp = this.now();
    const nextTurn = this.context.board.getTurn() as Color;
    const movedColor: Color = nextTurn === 'w' ? 'b' : 'w';
    const movedKey = movedColor === 'w' ? 'white' : 'black';
    const movedSide = state[movedKey];

    let remaining = movedSide.remaining;
    let isFlagged = movedSide.isFlagged;

    if (state.isRunning && !state.isPaused && state.active === movedColor && !movedSide.isFlagged) {
      const lastTick = this.lastTick ?? state.lastUpdatedAt ?? timestamp;
      let elapsed = timestamp - lastTick;
      if (!Number.isFinite(elapsed) || elapsed < 0) {
        elapsed = 0;
      }
      if (elapsed > 0) {
        remaining = Math.max(0, remaining - elapsed);
        if (remaining === 0) {
          isFlagged = true;
        }
      }
    }

    if (!isFlagged && movedSide.increment > 0) {
      remaining += movedSide.increment;
    }

    const sideUpdate: Partial<ClockState['white']> = { remaining };
    if (isFlagged !== movedSide.isFlagged) {
      sideUpdate.isFlagged = isFlagged;
    }

    const updates: ClockStateUpdate = {
      active: nextTurn,
      timestamp,
    };

    if (movedKey === 'white') {
      updates.white = sideUpdate;
    } else {
      updates.black = sideUpdate;
    }

    const nextSide = nextTurn === 'w' ? state.white : state.black;
    if (isFlagged || nextSide.isFlagged) {
      updates.running = false;
      updates.paused = true;
      updates.active = null;
      this.lastTick = null;
    } else if (state.isPaused) {
      updates.running = false;
      updates.paused = true;
      this.lastTick = null;
    } else {
      updates.running = true;
      updates.paused = false;
      this.lastTick = timestamp;
    }

    this.context.board.updateClockState(updates);
  }

  private render(state: ClockState | null): void {
    if (!this.container || !this.inner || !this.rows) {
      return;
    }

    if (!state) {
      this.container.style.display = 'none';
      return;
    }

    this.container.style.display = 'flex';
    const orientation = this.context.board.getOrientation();
    const firstRow = orientation === 'white' ? this.rows.b.root : this.rows.w.root;
    const secondRow = orientation === 'white' ? this.rows.w.root : this.rows.b.root;
    if (this.inner.firstChild !== firstRow) {
      this.inner.replaceChildren(firstRow, secondRow);
    }

    this.updateRow(this.rows.w, state, state.white, state.active === 'w');
    this.updateRow(this.rows.b, state, state.black, state.active === 'b');
  }

  private updateRow(
    row: ClockRow,
    state: ClockState,
    side: ClockState['white'],
    isActive: boolean,
  ): void {
    row.label.textContent = this.context.options?.labels?.[row.color] ?? DEFAULT_LABELS[row.color];
    row.value.textContent = this.formatTime(side.remaining, row.color, state, isActive);
    row.root.style.opacity = side.isFlagged ? '0.7' : '1';
    row.root.style.background = side.isFlagged
      ? 'rgba(127, 29, 29, 0.85)'
      : 'rgba(17, 24, 39, 0.75)';
    row.root.style.outline = isActive ? '2px solid rgba(34, 197, 94, 0.75)' : 'none';
  }

  private formatTime(
    milliseconds: number,
    color: Color,
    state: ClockState,
    isActive: boolean,
  ): string {
    const formatter = this.context.options?.formatTime;
    if (typeof formatter === 'function') {
      try {
        return formatter(milliseconds, { color, state, isActive });
      } catch (error) {
        console.error('[ClockExtension] formatTime callback failed', error);
      }
    }
    return defaultFormatTime(milliseconds);
  }

  private startTicking(): void {
    if (this.rafId !== null) {
      return;
    }
    if (!this.currentState || !this.currentState.isRunning || !this.currentState.active) {
      return;
    }
    if (this.lastTick === null) {
      this.lastTick = this.currentState.lastUpdatedAt ?? this.now();
    }
    this.rafId = this.raf((time) => this.tick(time));
  }

  private stopTicking(): void {
    if (this.rafId !== null) {
      this.caf(this.rafId);
      this.rafId = null;
    }
    this.lastTick = null;
  }

  private tick = (time: number): void => {
    this.rafId = null;
    if (!this.currentState || !this.currentState.isRunning || !this.currentState.active) {
      this.lastTick = null;
      return;
    }

    const last = this.lastTick ?? time;
    let elapsed = time - last;
    if (!Number.isFinite(elapsed) || elapsed < 0) {
      elapsed = 0;
    }

    const activeColor = this.currentState.active;
    const key = activeColor === 'w' ? 'white' : 'black';
    const side = this.currentState[key];
    if (!side) {
      this.stopTicking();
      return;
    }

    if (elapsed > 0) {
      const remaining = Math.max(0, side.remaining - elapsed);
      const update: ClockStateUpdate = { timestamp: time };
      const sideUpdate: Partial<ClockState['white']> = { remaining };
      if (remaining === 0) {
        sideUpdate.isFlagged = true;
        update.running = false;
        update.paused = true;
        update.active = null;
      }
      if (key === 'white') {
        update.white = sideUpdate;
      } else {
        update.black = sideUpdate;
      }
      this.context.board.updateClockState(update);
    }

    this.lastTick = time;
    this.startTicking();
  };
}

export function createClockExtension(
  config: ClockExtensionConfig = {},
): ExtensionConfig<ClockExtensionOptions> {
  const { id = 'clock', ...options } = config;

  return {
    id,
    options,
    create(context) {
      return new ClockExtensionInstance(context);
    },
  };
}
