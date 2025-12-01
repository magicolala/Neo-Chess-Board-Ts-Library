import { NeoChessBoard } from '../src/core/NeoChessBoard';
import type { CaptureEffectRendererParams } from '../src/core/types';

describe('capture effects', () => {
  let container: HTMLDivElement;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.append(container);
  });

  afterEach(() => {
    container.remove();
  });

  it('does not trigger effects on non-capturing moves', () => {
    const renderer = jest.fn<void, [CaptureEffectRendererParams]>();
    const board = new NeoChessBoard(container, {
      captureEffect: { enabled: true, renderer, durationMs: 10 },
      soundEnabled: false,
      showAnimations: false,
    });

    board.attemptMove('e2', 'e4');

    expect(renderer).not.toHaveBeenCalled();
    board.destroy();
  });

  it('triggers effects on capturing moves only', () => {
    const renderer = jest.fn<void, [CaptureEffectRendererParams]>();
    const board = new NeoChessBoard(container, {
      captureEffect: { enabled: true, renderer, durationMs: 10 },
      soundEnabled: false,
      showAnimations: false,
      fen: '4k3/8/8/3p4/4P3/8/8/4K3 w - - 0 1',
    });

    board.attemptMove('e4', 'd5');

    expect(renderer).toHaveBeenCalledTimes(1);
    expect(renderer).toHaveBeenCalledWith(expect.objectContaining({ from: 'e4', to: 'd5' }));
    board.destroy();
  });
});
