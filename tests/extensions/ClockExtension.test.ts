import { createClockExtension } from '../../src/extensions/clockExtension';
import type { ClockExtensionApi, ClockExtensionOptions } from '../../src/extensions/clockExtension';
import type { ClockConfig, ClockState, Extension, ExtensionContext } from '../../src/core/types';

interface HandlerMap {
  [event: string]: Array<(payload: unknown) => void>;
}

type ExtensionInstance = Extension<ClockExtensionOptions>;

type SetupResult = {
  context: ExtensionContext<ClockExtensionOptions>;
  extension: ExtensionInstance;
  board: {
    getRootElement: jest.Mock<HTMLElement | null>;
    getClockState: jest.Mock<ClockState | null>;
    startClock: jest.Mock<void, []>;
    pauseClock: jest.Mock<void, []>;
    resetClock: jest.Mock<void, [Partial<ClockConfig> | null | undefined]>;
    setClockTime: jest.Mock<void, [unknown, number]>;
    addClockTime: jest.Mock<void, [unknown, number]>;
  };
  api: ClockExtensionApi;
  handlers: HandlerMap;
  root: HTMLElement;
  emit<K extends string>(event: K, payload: unknown): void;
  destroy(): void;
};

const BASE_STATE: ClockState = {
  white: {
    initial: 60_000,
    increment: 0,
    delay: 0,
    remaining: 60_000,
    delayRemaining: 0,
    isFlagged: false,
  },
  black: {
    initial: 60_000,
    increment: 0,
    delay: 0,
    remaining: 60_000,
    delayRemaining: 0,
    isFlagged: false,
  },
  active: null,
  isRunning: false,
  isPaused: true,
  lastUpdatedAt: null,
};

function setupExtension(
  options: ClockExtensionOptions = {},
  initialState: ClockState = BASE_STATE,
): SetupResult {
  const root = document.createElement('div');
  document.body.append(root);

  const handlers: HandlerMap = {};

  const board = {
    getRootElement: jest.fn(() => root),
    getClockState: jest.fn(() => initialState),
    startClock: jest.fn(),
    pauseClock: jest.fn(),
    resetClock: jest.fn(),
    setClockTime: jest.fn(),
    addClockTime: jest.fn(),
  };

  let api: ClockExtensionApi | null = null;
  const extensionConfig = createClockExtension({
    ...options,
    onReady: (readyApi) => {
      api = readyApi;
      options.onReady?.(readyApi);
    },
  });

  const context: ExtensionContext<ClockExtensionOptions> = {
    id: extensionConfig.id ?? 'clock-display',
    board: board as unknown as ExtensionContext['board'],
    bus: {
      on(event: string, handler: (payload: unknown) => void) {
        if (!handlers[event]) {
          handlers[event] = [];
        }
        handlers[event]!.push(handler);
        return () => {
          handlers[event] = handlers[event]!.filter((h) => h !== handler);
        };
      },
    } as ExtensionContext['bus'],
    options: extensionConfig.options ?? {},
    initialOptions: {} as ExtensionContext['initialOptions'],
    registerExtensionPoint: jest.fn(),
  };

  const extension = extensionConfig.create(context) as ExtensionInstance;
  extension.onInit?.(context);

  if (!api) {
    throw new Error('Clock extension did not provide API');
  }

  return {
    context,
    extension,
    board: board as SetupResult['board'],
    api,
    handlers,
    root,
    emit(event, payload) {
      handlers[event]?.forEach((handler) => handler(payload));
    },
    destroy() {
      extension.onDestroy?.(context);
      root.remove();
    },
  };
}

describe('clock extension', () => {
  afterEach(() => {
    document.body.innerHTML = '';
    jest.restoreAllMocks();
  });

  it('exposes the control API', () => {
    const { api, board, destroy } = setupExtension();

    api.startClock();
    expect(board.startClock).toHaveBeenCalled();

    api.pauseClock();
    expect(board.pauseClock).toHaveBeenCalled();

    api.resetClock({ paused: true });
    expect(board.resetClock).toHaveBeenCalledWith({ paused: true });

    api.resetClock(null);
    expect(board.resetClock).toHaveBeenCalledWith(null);

    api.setClockTime('w', 1234);
    expect(board.setClockTime).toHaveBeenCalledWith('w', 1234);

    api.addClockTime('b', 500);
    expect(board.addClockTime).toHaveBeenCalledWith('b', 500);

    expect(api.getState()).toEqual(BASE_STATE);

    destroy();
  });

  it('renders the current clock values and updates on change', () => {
    const activeState: ClockState = {
      ...BASE_STATE,
      active: 'w',
      isPaused: false,
      isRunning: true,
    };
    const { root, emit, destroy } = setupExtension(
      { highlightActive: true, showTenths: true },
      activeState,
    );

    const times = [...root.querySelectorAll<HTMLSpanElement>('.neo-clock-time')].map(
      (node) => node.textContent,
    );
    expect(times).toEqual(['1:00', '1:00']);

    emit('clock:change', {
      ...activeState,
      white: { ...activeState.white, remaining: 5400 },
      black: { ...activeState.black, remaining: 9500 },
    });

    const whiteTimeNode = root.querySelector('.neo-clock-white .neo-clock-time') as HTMLElement;
    const blackTimeNode = root.querySelector('.neo-clock-black .neo-clock-time') as HTMLElement;
    expect(whiteTimeNode.textContent).toBe('0:05.4');
    expect(blackTimeNode.textContent).toBe('0:09.5');

    const whiteSide = root.querySelector('.neo-clock-white') as HTMLElement;
    const blackSide = root.querySelector('.neo-clock-black') as HTMLElement;
    expect(whiteSide.dataset.active).toBe('true');
    expect(blackSide.dataset.active).toBe('false');

    destroy();
  });

  it('passes the color and clock state to custom formatters', () => {
    const format = jest.fn(() => 'formatted');
    const { emit, destroy } = setupExtension({ formatTime: format }, BASE_STATE);

    expect(format).toHaveBeenCalledTimes(2);
    const firstCall = format.mock.calls[0] as unknown[];
    const [firstValue, firstContext] = firstCall as [number, { color: string; state: ClockState }];
    expect(firstValue).toBe(BASE_STATE.black.remaining);
    expect(firstContext.state.black.remaining).toBe(BASE_STATE.black.remaining);
    const colors = format.mock.calls.reduce<string[]>((acc, call) => {
      const args = call as unknown[];
      const ctx = args[1] as { color?: string } | undefined;
      if (ctx?.color) {
        acc.push(ctx.color);
      }
      return acc;
    }, []);
    expect(new Set(colors)).toEqual(new Set(['w', 'b']));

    emit('clock:change', {
      ...BASE_STATE,
      active: 'b',
    });

    expect(format).toHaveBeenCalledTimes(4);

    destroy();
  });

  it('marks a side as flagged when the flag event is emitted', () => {
    const { root, board, emit, destroy } = setupExtension({}, BASE_STATE);

    board.getClockState.mockReturnValue({
      ...BASE_STATE,
      black: { ...BASE_STATE.black, isFlagged: true },
    });

    emit('clock:flag', { color: 'b', remaining: 0 });
    const blackSide = root.querySelector('.neo-clock-black') as HTMLElement;
    expect(blackSide.dataset.flagged).toBe('true');

    destroy();
  });

  it('appends the flag icon to flagged labels when configured', () => {
    const { root, board, emit, destroy } = setupExtension({ flagIcon: '⚑' }, BASE_STATE);

    board.getClockState.mockReturnValue({
      ...BASE_STATE,
      white: { ...BASE_STATE.white, isFlagged: true },
    });

    emit('clock:flag', { color: 'w', remaining: 0 });
    const whiteLabel = root.querySelector('.neo-clock-white .neo-clock-label') as HTMLElement;
    expect(whiteLabel.textContent).toContain('⚑');

    destroy();
  });

  it('cleans up DOM nodes on destroy', () => {
    const { extension, context, root } = setupExtension();
    expect(root.querySelector('.neo-clock-display')).not.toBeNull();

    extension.onDestroy?.(context);
    expect(root.querySelector('.neo-clock-display')).toBeNull();
  });
});
