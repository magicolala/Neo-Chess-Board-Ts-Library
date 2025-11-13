import './clock-display.css';
import type {
  Color,
  ClockConfig,
  ClockState,
  Extension,
  ExtensionConfig,
  ExtensionContext,
} from '../core/types';

export interface ClockExtensionApi {
  startClock: () => void;
  pauseClock: () => void;
  resetClock: (config?: Partial<ClockConfig> | null) => void;
  setClockTime: (color: Color, milliseconds: number) => void;
  addClockTime: (color: Color, milliseconds: number) => void;
  getState: () => ClockState | null;
}

export interface ClockExtensionOptions {
  position?: 'top' | 'bottom' | 'side';
  labels?: { w: string; b: string };
  formatTime?: (milliseconds: number, context: { color: Color; state: ClockState }) => string;
  showTenths?: boolean;
  highlightActive?: boolean;
  flagIcon?: string;
  onReady?: (api: ClockExtensionApi) => void;
}

export interface ClockExtensionConfig extends ClockExtensionOptions {
  id?: string;
}

interface ClockElements {
  container: HTMLDivElement;
  white: HTMLDivElement;
  black: HTMLDivElement;
  whiteTime: HTMLSpanElement;
  blackTime: HTMLSpanElement;
  whiteLabel: HTMLSpanElement;
  blackLabel: HTMLSpanElement;
}

const DEFAULT_LABELS: { w: string; b: string } = {
  w: 'White',
  b: 'Black',
};

function defaultFormatTime(milliseconds: number, showTenths: boolean): string {
  const safeMs = Number.isFinite(milliseconds) ? Math.max(0, Math.floor(milliseconds)) : 0;
  const totalSeconds = Math.floor(safeMs / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  const base = `${minutes}:${seconds.toString().padStart(2, '0')}`;

  if (showTenths && totalSeconds < 10) {
    const tenths = Math.floor((safeMs % 1000) / 100);
    return `${base}.${tenths}`;
  }

  return base;
}

function resolveLabels(options?: ClockExtensionOptions): { w: string; b: string } {
  const labels = options?.labels;
  if (!labels) {
    return { ...DEFAULT_LABELS };
  }

  return {
    w: labels.w ?? DEFAULT_LABELS.w,
    b: labels.b ?? DEFAULT_LABELS.b,
  };
}

function applyPosition(
  container: HTMLDivElement,
  position: ClockExtensionOptions['position'],
): void {
  container.dataset.position = position ?? 'top';
}

class ClockDisplayExtension implements Extension<ClockExtensionOptions> {
  private elements: ClockElements | null = null;
  private cleanup: Array<() => void> = [];
  private state: ClockState | null = null;
  private readonly labels: { w: string; b: string };

  constructor(private readonly context: ExtensionContext<ClockExtensionOptions>) {
    this.labels = resolveLabels(context.options);
  }

  onInit(): void {
    const { board, options } = this.context;
    const root = board.getRootElement();
    const doc = root?.ownerDocument ?? document;
    if (!doc) {
      return;
    }

    const container = doc.createElement('div');
    container.classList.add('neo-clock-display');
    applyPosition(container, options?.position);

    const createSide = (
      color: Color,
      label: string,
    ): [HTMLDivElement, HTMLSpanElement, HTMLSpanElement] => {
      const side = doc.createElement('div');
      side.className = `neo-clock-side neo-clock-${color === 'w' ? 'white' : 'black'}`;
      side.dataset.active = 'false';
      side.dataset.flagged = 'false';

      const labelEl = doc.createElement('span');
      labelEl.className = 'neo-clock-label';
      labelEl.textContent = label;

      const timeEl = doc.createElement('span');
      timeEl.className = 'neo-clock-time';
      timeEl.textContent = '0:00';

      side.append(labelEl, timeEl);
      return [side, labelEl, timeEl];
    };

    const [blackRoot, blackLabel, blackTime] = createSide('b', this.labels.b);
    const [whiteRoot, whiteLabel, whiteTime] = createSide('w', this.labels.w);

    container.append(blackRoot, whiteRoot);

    if (!root) {
      return;
    }

    root.append(container);

    this.elements = {
      container,
      white: whiteRoot,
      black: blackRoot,
      whiteTime,
      blackTime,
      whiteLabel,
      blackLabel,
    };

    const handleChange = (state: ClockState) => {
      this.state = state;
      this.render(state);
    };
    const handleFlag = () => {
      const snapshot = this.context.board.getClockState();
      if (snapshot) {
        this.state = snapshot;
      }
      this.render(this.state);
    };
    const handleStart = () => {
      this.render(this.state);
    };
    const handlePause = () => {
      this.render(this.state);
    };

    this.cleanup.push(
      this.context.bus.on('clock:change', handleChange),
      this.context.bus.on('clock:flag', handleFlag),
      this.context.bus.on('clock:start', handleStart),
      this.context.bus.on('clock:pause', handlePause),
    );

    const api: ClockExtensionApi = {
      startClock: () => this.context.board.startClock(),
      pauseClock: () => this.context.board.pauseClock(),
      resetClock: (config) => this.context.board.resetClock(config),
      setClockTime: (color, milliseconds) => this.context.board.setClockTime(color, milliseconds),
      addClockTime: (color, milliseconds) => this.context.board.addClockTime(color, milliseconds),
      getState: () => this.context.board.getClockState(),
    };

    this.context.options?.onReady?.(api);

    const initialState = this.context.board.getClockState();
    if (initialState) {
      this.state = initialState;
      this.render(initialState);
    }
  }

  onDestroy(): void {
    for (const dispose of this.cleanup.splice(0)) {
      try {
        dispose();
      } catch (error) {
        console.error('[neo-chess-board] clock extension cleanup failed', error);
      }
    }
    this.elements?.container.remove();
    this.elements = null;
  }

  private render(state: ClockState | null): void {
    if (!this.elements || !state) {
      return;
    }
    const { white, black } = state;
    const options = this.context.options;
    const showTenths = options?.showTenths ?? false;
    const format = options?.formatTime;

    const formatValue = (color: Color, remaining: number) => {
      if (format) {
        try {
          return format(remaining, { color, state });
        } catch (error) {
          console.error('[neo-chess-board] clock formatTime callback failed', error);
        }
      }
      return defaultFormatTime(remaining, showTenths);
    };

    const whiteTime = formatValue('w', white.remaining);
    const blackTime = formatValue('b', black.remaining);

    this.elements.whiteTime.textContent = whiteTime;
    this.elements.blackTime.textContent = blackTime;

    this.elements.whiteTime.classList.toggle('low-time', white.remaining < 10_000);
    this.elements.blackTime.classList.toggle('low-time', black.remaining < 10_000);

    const active = state.active;
    if (options?.highlightActive) {
      this.elements.white.dataset.active = active === 'w' ? 'true' : 'false';
      this.elements.black.dataset.active = active === 'b' ? 'true' : 'false';
    } else {
      this.elements.white.dataset.active = 'false';
      this.elements.black.dataset.active = 'false';
    }

    const whiteFlagged = white.isFlagged;
    const blackFlagged = black.isFlagged;
    this.elements.white.dataset.flagged = whiteFlagged ? 'true' : 'false';
    this.elements.black.dataset.flagged = blackFlagged ? 'true' : 'false';

    const { flagIcon } = this.context.options ?? {};
    if (flagIcon) {
      this.elements.whiteLabel.textContent = whiteFlagged
        ? `${this.labels.w} ${flagIcon}`
        : this.labels.w;
      this.elements.blackLabel.textContent = blackFlagged
        ? `${this.labels.b} ${flagIcon}`
        : this.labels.b;
    } else {
      this.elements.whiteLabel.textContent = this.labels.w;
      this.elements.blackLabel.textContent = this.labels.b;
    }
  }
}

export function createClockExtension(
  config: ClockExtensionConfig = {},
): ExtensionConfig<ClockExtensionOptions> {
  const { id = 'clock-display', ...options } = config;

  return {
    id,
    options,
    create(context) {
      return new ClockDisplayExtension({ ...context, options });
    },
  };
}
