import { NeoChessBoard } from '../../src/core/NeoChessBoard';

describe('NeoChessBoard piece set management', () => {
  let container: HTMLDivElement;
  let board: NeoChessBoard;

  const createRect = () => ({
    width: 480,
    height: 480,
    top: 0,
    left: 0,
    right: 480,
    bottom: 480,
    x: 0,
    y: 0,
    toJSON: () => ({}),
  });

  beforeEach(() => {
    container = document.createElement('div');
    container.getBoundingClientRect = jest.fn(createRect);
    board = new NeoChessBoard(container, {
      interactive: false,
      soundEnabled: false,
      showArrows: false,
      showHighlights: false,
      allowPremoves: false,
    });
  });

  afterEach(() => {
    board.destroy();
    jest.clearAllMocks();
  });

  it('returns early when clearing piece set without custom sprites', async () => {
    const renderSpy = jest.spyOn(board as any, 'renderAll');
    renderSpy.mockClear();

    try {
      await board.setPieceSet(undefined);
      expect(renderSpy).not.toHaveBeenCalled();
    } finally {
      renderSpy.mockRestore();
    }
  });

  it('applies and clears a custom piece set', async () => {
    const renderSpy = jest.spyOn(board as any, 'renderAll').mockImplementation(() => {});
    renderSpy.mockClear();
    const fakeImage = { width: 10, height: 10 } as HTMLImageElement;
    const loadSpy = jest.spyOn(board as any, '_loadImage').mockResolvedValue(fakeImage);

    try {
      const pieceSet = { defaultScale: 0.8, pieces: { P: 'http://example.com/p.png' } };

      await board.setPieceSet(pieceSet);

      expect(loadSpy).toHaveBeenCalledWith('http://example.com/p.png');
      expect((board as any).customPieceSprites.P).toEqual(
        expect.objectContaining({ image: fakeImage, scale: expect.any(Number) }),
      );
      expect(renderSpy).toHaveBeenCalledTimes(1);

      renderSpy.mockClear();
      await board.setPieceSet(pieceSet);
      expect(renderSpy).not.toHaveBeenCalled();

      renderSpy.mockClear();
      await board.setPieceSet(null);
      expect((board as any).customPieceSprites).toEqual({});
      expect((board as any)._pieceSetRaw).toBeUndefined();
      expect(renderSpy).toHaveBeenCalledTimes(1);
    } finally {
      loadSpy.mockRestore();
      renderSpy.mockRestore();
    }
  });

  it('logs a warning when sprite resolution fails', async () => {
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    const resolveSpy = jest.spyOn(board as any, '_resolvePieceSprite').mockImplementation(async () => {
      throw new Error('boom');
    });
    const renderSpy = jest.spyOn(board as any, 'renderAll').mockImplementation(() => {});
    renderSpy.mockClear();

    try {
      await board.setPieceSet({ pieces: { K: { image: document.createElement('img') } } });

      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining('Failed to load sprite for piece "K"'),
        expect.any(Error),
      );
      expect(renderSpy).toHaveBeenCalledTimes(1);
    } finally {
      renderSpy.mockRestore();
      resolveSpy.mockRestore();
      warnSpy.mockRestore();
    }
  });

  it('ignores outdated piece set resolutions when newer call occurs', async () => {
    const renderSpy = jest.spyOn(board as any, 'renderAll').mockImplementation(() => {});
    renderSpy.mockClear();

    const deferredResolvers: Array<(value: any) => void> = [];
    const resolveSpy = jest.spyOn(board as any, '_resolvePieceSprite').mockImplementation(
      () =>
        new Promise((resolve) => {
          deferredResolvers.push(resolve);
        }),
    );

    try {
      const firstSet = board.setPieceSet({ pieces: { P: { image: document.createElement('img') } } });
      const secondSet = board.setPieceSet({
        pieces: { Q: { image: document.createElement('img') } },
      });

      const spriteB = { image: { id: 'B' }, scale: 1, offsetX: 0, offsetY: 0 };
      const spriteA = { image: { id: 'A' }, scale: 1, offsetX: 0, offsetY: 0 };
      deferredResolvers[1](spriteB);
      deferredResolvers[0](spriteA);

      await Promise.all([firstSet, secondSet]);

      expect((board as any).customPieceSprites).toEqual({ Q: spriteB });
      expect(renderSpy).toHaveBeenCalledTimes(1);
    } finally {
      resolveSpy.mockRestore();
      renderSpy.mockRestore();
    }
  });

  it('returns null when _resolvePieceSprite cannot load image', async () => {
    const loadSpy = jest.spyOn(board as any, '_loadImage').mockResolvedValue(null);

    try {
      const result = await (board as any)._resolvePieceSprite('http://example.com/missing.png', 1);
      expect(result).toBeNull();
    } finally {
      loadSpy.mockRestore();
    }
  });

  it('resolves inline piece sprite without loading image', async () => {
    const fakeImage = { id: 'inline' } as HTMLImageElement;
    const loadSpy = jest.spyOn(board as any, '_loadImage');

    try {
      const result = await (board as any)._resolvePieceSprite(
        { image: fakeImage, scale: 0.5, offsetX: 0.1, offsetY: -0.2 },
        1,
      );

      expect(loadSpy).not.toHaveBeenCalled();
      expect(result).toEqual({
        image: fakeImage,
        scale: 0.5,
        offsetX: 0.1,
        offsetY: -0.2,
      });
    } finally {
      loadSpy.mockRestore();
    }
  });

  it('_loadImage resolves with created Image instance', async () => {
    const originalImage = global.Image;
    let currentInstance: any;

    class MockImage {
      public crossOrigin: string | null = null;
      public decoding: string | undefined;
      public onload: (() => void) | null = null;
      public onerror: ((err: any) => void) | null = null;
      private _src = '';

      constructor() {
        currentInstance = this;
      }

      set src(value: string) {
        this._src = value;
      }

      get src() {
        return this._src;
      }
    }

    (global as any).Image = MockImage;

    try {
      const loadPromise = (board as any)._loadImage('http://example.com/piece.png');

      expect(currentInstance.crossOrigin).toBe('anonymous');
      expect(currentInstance.decoding).toBe('async');

      currentInstance.onload?.();

      const result = await loadPromise;
      expect(result).toBe(currentInstance);
    } finally {
      (global as any).Image = originalImage;
    }
  });

  it('_loadImage rejects when no image creation is possible', async () => {
    const originalImage = global.Image;
    const originalRoot = (board as any).root;

    (board as any).root = { ownerDocument: { createElement: () => null } };
    (global as any).Image = undefined;

    try {
      await expect((board as any)._loadImage('http://example.com/fail.png')).rejects.toThrow(
        'Image loading is not supported',
      );
    } finally {
      (board as any).root = originalRoot;
      (global as any).Image = originalImage;
    }
  });
});
