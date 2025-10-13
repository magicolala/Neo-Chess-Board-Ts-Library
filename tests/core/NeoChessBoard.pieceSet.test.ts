import { NeoChessBoard } from '../../src/core/NeoChessBoard';
import type { PieceSet } from '../../src/core/types';

type MockCanvasElement = HTMLCanvasElement & {
  getContext: jest.MockedFunction<typeof HTMLCanvasElement.prototype.getContext>;
  getBoundingClientRect: jest.Mock<ReturnType<HTMLCanvasElement['getBoundingClientRect']>>;
};

const getCustomPieceSprites = (instance: NeoChessBoard): Record<string, unknown> =>
  Reflect.get(instance as unknown as Record<string, unknown>, 'customPieceSprites') as Record<
    string,
    unknown
  >;

const asPieceSetInternals = (instance: NeoChessBoard) =>
  instance as unknown as {
    renderAll: () => void;
    _resolvePieceSprite: (...args: unknown[]) => Promise<unknown>;
  };

describe('NeoChessBoard piece set handling', () => {
  let originalCreateElement: typeof document.createElement;
  let container: HTMLDivElement;
  let board: NeoChessBoard;

  const createMockElement = (tag: string): HTMLElement => {
    const baseCreate = originalCreateElement ?? Document.prototype.createElement;
    const element = baseCreate.call(document, tag) as HTMLElement;

    if (tag === 'canvas') {
      const canvas = element as MockCanvasElement;
      canvas.getBoundingClientRect = jest.fn(() => ({
        width: 400,
        height: 400,
        left: 0,
        top: 0,
        right: 400,
        bottom: 400,
        x: 0,
        y: 0,
        toJSON: () => {},
      }));

      const contextMock = {
        fillRect: jest.fn(),
        clearRect: jest.fn(),
        beginPath: jest.fn(),
        moveTo: jest.fn(),
        lineTo: jest.fn(),
        quadraticCurveTo: jest.fn(),
        rect: jest.fn(),
        arc: jest.fn(),
        ellipse: jest.fn(),
        closePath: jest.fn(),
        fill: jest.fn(),
        stroke: jest.fn(),
        drawImage: jest.fn(),
        fillText: jest.fn(),
        measureText: jest.fn(() => ({ width: 0 })),
        createLinearGradient: jest.fn(() => ({ addColorStop: jest.fn() })),
        save: jest.fn(),
        restore: jest.fn(),
        translate: jest.fn(),
        scale: jest.fn(),
        fillStyle: '#000000',
        strokeStyle: '#000000',
        lineWidth: 1,
        lineCap: 'butt',
        lineJoin: 'miter',
        textBaseline: 'alphabetic',
        textAlign: 'start',
        globalAlpha: 1,
        globalCompositeOperation: 'source-over',
        font: '10px sans-serif',
        canvas,
      } as unknown as jest.Mocked<CanvasRenderingContext2D>;

      canvas.getContext = jest.fn(() => contextMock) as unknown as MockCanvasElement['getContext'];

      return canvas;
    }

    return element;
  };

  const createPieceSet = (pieces: PieceSet['pieces']): PieceSet => ({
    defaultScale: 0.75,
    pieces,
  });

  beforeEach(() => {
    originalCreateElement = document.createElement;
    document.createElement = jest.fn((tag) => createMockElement(tag));

    container = document.createElement('div') as HTMLDivElement;
    if (!document.head) {
      Object.defineProperty(document, 'head', {
        value: document.createElement('head'),
        configurable: true,
      });
    }
    jest.spyOn(document.head!, 'appendChild').mockImplementation((node) => node);

    board = new NeoChessBoard(container, {
      theme: 'classic',
      size: 400,
      interactive: true,
    });
  });

  afterEach(() => {
    if (originalCreateElement) {
      document.createElement = originalCreateElement;
    }

    if (board && typeof board.destroy === 'function') {
      board.destroy();
    }
  });

  it('loads custom piece sprites and triggers a render', async () => {
    const spriteImage = document.createElement('img');
    const internals = asPieceSetInternals(board);
    const renderSpy = jest.spyOn(internals, 'renderAll');
    const resolveSpy = jest.spyOn(internals, '_resolvePieceSprite');
    resolveSpy.mockImplementation(async () => ({
      image: spriteImage,
      scale: 0.9,
      offsetX: 0,
      offsetY: 0,
    }));

    const pieceSet = createPieceSet({
      P: { image: document.createElement('img') },
      k: { image: document.createElement('img') },
    });

    await board.setPieceSet(pieceSet);

    expect(resolveSpy).toHaveBeenCalledTimes(2);
    expect(renderSpy).toHaveBeenCalled();
    const sprites = getCustomPieceSprites(board);
    expect((sprites.P as { image: unknown } | undefined)?.image).toBe(spriteImage);
  });

  it('clears custom sprites when pieceSet is reset', async () => {
    const internals = asPieceSetInternals(board);
    const resolveSpriteSpy = jest.spyOn(internals, '_resolvePieceSprite');
    resolveSpriteSpy.mockResolvedValue({
      image: document.createElement('img'),
      scale: 1,
      offsetX: 0,
      offsetY: 0,
    });

    const renderSpy = jest.spyOn(internals, 'renderAll');

    await board.setPieceSet(
      createPieceSet({
        Q: { image: document.createElement('img') },
      }),
    );

    const updatedSprites = getCustomPieceSprites(board);
    expect(Object.keys(updatedSprites)).toContain('Q');

    renderSpy.mockClear();

    await board.setPieceSet(null);

    const clearedSprites = getCustomPieceSprites(board);
    expect(clearedSprites).toEqual({});
    expect(renderSpy).toHaveBeenCalled();
  });

  it('avoids reloading when applying the same pieceSet reference', async () => {
    const internals = asPieceSetInternals(board);
    const resolveSpy = jest.spyOn(internals, '_resolvePieceSprite');
    resolveSpy.mockResolvedValue({
      image: document.createElement('img'),
      scale: 1,
      offsetX: 0,
      offsetY: 0,
    });

    const pieceSet = createPieceSet({
      B: { image: document.createElement('img') },
    });

    await board.setPieceSet(pieceSet);

    resolveSpy.mockClear();

    await board.setPieceSet(pieceSet);

    expect(resolveSpy).not.toHaveBeenCalled();
  });
});
