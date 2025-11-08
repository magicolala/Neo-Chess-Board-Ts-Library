import { createClockExtension } from '../../src/extensions/ClockExtension';
import type {
  ClockExtensionApi,
  ClockExtensionConfig,
  ClockExtensionOptions,
} from '../../src/extensions/ClockExtension';
import type { ClockState, Extension, ExtensionContext } from '../../src/core/types';

type HandlerMap = Record<string, (payload?: any) => void>;

type ExtensionInstance = Extension<ClockExtensionOptions>;

type SetupResult = {
  context: ExtensionContext<ClockExtensionOptions>;
  extension: ExtensionInstance;
  board: {
    getRootElement: jest.Mock<HTMLElement | null>;
    getTurn: jest.Mock<'w' | 'b'>;
    updateClockState: jest.Mock<void, [unknown]>;
    getClockState: jest.Mock<ClockState | null>;
    getOrientation: jest.Mock<'white' | 'black'>;
  };
  api: ClockExtensionApi;
  handlers: HandlerMap;
  root: HTMLElement;
  setClockState(state: ClockState): void;
};

const DEFAULT_STATE: ClockState = {
  white: { initial: 60_000, increment: 0, remaining: 60_000, isFlagged: false },
  black: { initial: 60_000, increment: 0, remaining: 60_000, isFlagged: false },
  active: null,
  isPaused: true,
  isRunning: false,
  lastUpdatedAt: null,
};

function setupExtension(
  config: ClockExtensionConfig = {},
  initialState: ClockState = DEFAULT_STATE,
): SetupResult {
  const root = document.createElement('div');
  document.body.append(root);

  let clockState = initialState;

  const board = {
    getRootElement: jest.fn(() => root),
    getTurn: jest.fn(() => 'w' as const),
    updateClockState: jest.fn(),
    getClockState: jest.fn(() => clockState),
    getOrientation: jest.fn(() => 'white' as const),
  } as SetupResult['board'];

  const handlers: HandlerMap = {};
  const registerExtensionPoint = jest
    .fn((event: string, handler: (payload: any) => void) => {
      handlers[event] = handler;
      return () => {
        delete handlers[event];
      };
    })
    .mockName('registerExtensionPoint') as unknown as ExtensionContext<ClockExtensionOptions>['registerExtensionPoint'];

  const extensionConfig = createClockExtension(config);
  const options: ClockExtensionOptions = {
    ...(extensionConfig.options ?? {}),
  };

  let api: ClockExtensionApi | null = null;
  const originalOnReady = options.onReady;
  options.onReady = (readyApi: ClockExtensionApi) => {
    api = readyApi;
    originalOnReady?.(readyApi);
  };

  const context: ExtensionContext<ClockExtensionOptions> = {
    id: extensionConfig.id ?? 'clock',
    board: board as unknown as ExtensionContext['board'],
    bus: {} as ExtensionContext['bus'],
    options,
    initialOptions: {} as ExtensionContext['initialOptions'],
    registerExtensionPoint,
  };

  const extension = extensionConfig.create(context) as ExtensionInstance;

  return {
    context,
    extension,
    board,
    api: api!,
    handlers,
    root,
    setClockState(state: ClockState) {
      clockState = state;
      board.getClockState.mockImplementation(() => clockState);
    },
  };
}

describe('ClockExtension', () => {
  afterEach(() => {
    document.body.innerHTML = '';
    jest.restoreAllMocks();
  });

  it('exposes an API to start, pause and set the clock', () => {
    const nowSpy = jest.spyOn(window.performance, 'now').mockReturnValue(1_234);
    const { api, board, extension, context } = setupExtension();

    extension.onInit?.(context);

    board.getTurn.mockReturnValue('b');
    api.startClock();

    expect(board.updateClockState).toHaveBeenLastCalledWith({
      running: true,
      paused: false,
      active: 'b',
      timestamp: 1_234,
    });

    api.pauseClock();
    expect(board.updateClockState).toHaveBeenLastCalledWith({
      running: false,
      paused: true,
      active: null,
      timestamp: null,
    });

    nowSpy.mockReturnValue(987);
    api.setTime('w', 321.9);
    expect(board.updateClockState).toHaveBeenLastCalledWith({
      timestamp: 987,
      white: { remaining: 321, isFlagged: false },
    });

    api.setTime('b', -50);
    expect(board.updateClockState).toHaveBeenLastCalledWith({
      timestamp: 987,
      black: { remaining: 0, isFlagged: true },
    });
  });

  it('falls back to default formatting when the custom formatter throws', () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => undefined);
    const failingFormatter = jest.fn(() => {
      throw new Error('boom');
    });

    const state: ClockState = {
      white: { initial: 10_000, increment: 0, remaining: 6_200, isFlagged: false },
      black: { initial: 10_000, increment: 0, remaining: 75_000, isFlagged: false },
      active: null,
      isPaused: true,
      isRunning: false,
      lastUpdatedAt: null,
    };

    const { extension, context, root } = setupExtension({ formatTime: failingFormatter }, state);

    extension.onInit?.(context);

    const times = Array.from(root.querySelectorAll('.ncb-clock-time')).map((node) => node.textContent);
    expect(times.sort()).toEqual(['0:06.2', '1:15']);
    expect(failingFormatter).toHaveBeenCalled();
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('formatTime'), expect.any(Error));
  });

  it('applies increments and switches active side on move events', () => {
    const originalRaf = window.requestAnimationFrame;
    const originalCaf = window.cancelAnimationFrame;
    window.requestAnimationFrame = jest.fn(() => 1);
    window.cancelAnimationFrame = jest.fn();

    let nowValue = 10_000;
    jest.spyOn(window.performance, 'now').mockImplementation(() => nowValue);

    const runningState: ClockState = {
      white: { initial: 30_000, increment: 2_000, remaining: 15_000, isFlagged: false },
      black: { initial: 30_000, increment: 0, remaining: 28_000, isFlagged: false },
      active: 'w',
      isPaused: false,
      isRunning: true,
      lastUpdatedAt: 10_000,
    };

    const { extension, context, handlers, board } = setupExtension({}, runningState);

    extension.onInit?.(context);
    board.getTurn.mockReturnValue('b');

    nowValue = 13_000;
    handlers.move?.();

    expect(board.updateClockState).toHaveBeenLastCalledWith({
      active: 'b',
      timestamp: 13_000,
      white: { remaining: 14_000 },
      running: true,
      paused: false,
    });

    window.requestAnimationFrame = originalRaf;
    window.cancelAnimationFrame = originalCaf;
  });
});
