import { NeoChessBoard } from '../../src/core/NeoChessBoard';

const getPrivate = <T>(instance: unknown, key: string): T =>
  Reflect.get(instance as Record<string, unknown>, key) as T;

const getMethodHost = (instance: NeoChessBoard): Record<string, (...args: unknown[]) => unknown> =>
  instance as unknown as Record<string, (...args: unknown[]) => unknown>;

if (typeof globalThis.PointerEvent === 'undefined') {
  class PointerEventPolyfill extends MouseEvent {
    constructor(type: string, init?: Record<string, unknown>) {
      super(type, init);
    }
  }
  (globalThis as unknown as { PointerEvent: typeof PointerEvent }).PointerEvent =
    PointerEventPolyfill as unknown as typeof PointerEvent;
}

describe('NeoChessBoard.configure', () => {
  let container: HTMLDivElement;
  let board: NeoChessBoard;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    board = new NeoChessBoard(container);
  });

  afterEach(() => {
    board.destroy();
    container.remove();
  });

  it('updates drag configuration properties', () => {
    board.configure({ drag: { threshold: 5, snap: true, ghost: false } });

    expect(getPrivate<number>(board, 'dragActivationDistance')).toBe(5);
    expect(getPrivate<boolean>(board, 'dragSnapToSquare')).toBe(true);
    expect(getPrivate<boolean>(board, 'dragGhostPiece')).toBe(false);
  });

  it('centers dragging piece when snap is enabled', () => {
    board.configure({ drag: { snap: true } });
    const methodHost = getMethodHost(board);

    Reflect.set(board as unknown as Record<string, unknown>, '_dragging', {
      from: 'e2',
      piece: 'P',
      x: 0,
      y: 0,
    });

    const topLeft = methodHost._sqToXY('e4') as { x: number; y: number };
    const squareSize = getPrivate<number>(board, 'square');
    const pointer = { x: topLeft.x + 8, y: topLeft.y + 12 };
    const event = new PointerEvent('pointermove', { clientX: 0, clientY: 0 });

    methodHost._handleMouseMove(event, pointer);

    const dragging = getPrivate<{ x: number; y: number }>(board, '_dragging');
    expect(dragging.x).toBeCloseTo(topLeft.x + squareSize / 2);
    expect(dragging.y).toBeCloseTo(topLeft.y + squareSize / 2);
  });

  it('respects cancelOnEsc configuration during drags', () => {
    board.configure({ drag: { cancelOnEsc: false } });
    Reflect.set(board as unknown as Record<string, unknown>, '_dragging', {
      from: 'e2',
      piece: 'P',
      x: 10,
      y: 10,
    });

    const methodHost = getMethodHost(board);
    methodHost._handleEscapeKey();

    expect(getPrivate<unknown>(board, '_dragging')).not.toBeNull();
  });

  it('updates animation configuration and easing', () => {
    board.configure({ animation: { durationMs: 120, easing: 'linear' } });

    expect(getPrivate<number>(board, 'animationMs')).toBe(120);
    expect(getPrivate<string>(board, 'animationEasingName')).toBe('linear');

    const easing = getPrivate<(value: number) => number>(board, 'animationEasingFn');
    expect(easing(0.5)).toBeCloseTo(0.5);
  });

  it('triggers a render when toggling ghost pieces', () => {
    const renderSpy = jest.spyOn(board, 'renderAll');

    board.configure({ drag: { ghost: false } });

    expect(renderSpy).toHaveBeenCalled();

    renderSpy.mockRestore();
  });
});
