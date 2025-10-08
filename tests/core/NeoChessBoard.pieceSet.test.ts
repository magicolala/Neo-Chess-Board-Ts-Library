import { NeoChessBoard } from '../../src/core/NeoChessBoard';
import type { PieceSet } from '../../src/core/types';

describe('NeoChessBoard piece set handling', () => {
  let originalCreateElement: typeof document.createElement;
  let container: HTMLDivElement;
  let board: NeoChessBoard;

  const createMockElement = (tag: string) => {
    const baseCreate = originalCreateElement ?? Document.prototype.createElement;
    const element = baseCreate.call(document, tag) as HTMLElement;

    if (tag === 'canvas') {
      const canvas = element as HTMLCanvasElement;
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

      canvas.getContext = jest.fn(() => ({
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
      })) as any;

      return canvas as any;
    }

    return element as any;
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
      (document as any).head = {
        appendChild: jest.fn(),
      };
    }

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
    const renderSpy = jest.spyOn(board as any, 'renderAll');
    const resolveSpy = jest.spyOn(board as any, '_resolvePieceSprite');
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
    expect((board as any).customPieceSprites.P.image).toBe(spriteImage);
  });

  it('clears custom sprites when pieceSet is reset', async () => {
    const resolveSpriteSpy = jest.spyOn(board as any, '_resolvePieceSprite');
    resolveSpriteSpy.mockResolvedValue({
      image: document.createElement('img'),
      scale: 1,
      offsetX: 0,
      offsetY: 0,
    });

    const renderSpy = jest.spyOn(board as any, 'renderAll');

    await board.setPieceSet(
      createPieceSet({
        Q: { image: document.createElement('img') },
      }),
    );

    expect(Object.keys((board as any).customPieceSprites)).toContain('Q');

    renderSpy.mockClear();

    await board.setPieceSet(null);

    expect((board as any).customPieceSprites).toEqual({});
    expect(renderSpy).toHaveBeenCalled();
  });

  it('avoids reloading when applying the same pieceSet reference', async () => {
    const resolveSpy = jest.spyOn(board as any, '_resolvePieceSprite');
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
