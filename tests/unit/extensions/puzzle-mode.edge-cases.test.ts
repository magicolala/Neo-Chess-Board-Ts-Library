import { PuzzleController } from '../../../src/extensions/puzzle-mode/PuzzleController';

describe('PuzzleController edge cases', () => {
  it('supports underpromotion moves', () => {
    const controller = new PuzzleController({
      puzzle: {
        id: 'underpromotion',
        title: 'Underpromotion tactic',
        fen: '8/1P6/8/8/8/8/8/k6K w - - 0 1',
        solution: ['b8=N#'],
        difficulty: 'advanced',
      },
    });

    const result = controller.handleMove('b8=N#');
    expect(result.success).toBe(true);
    expect(result.complete).toBe(true);
  });

  it('supports en passant notation', () => {
    const controller = new PuzzleController({
      puzzle: {
        id: 'en-passant',
        title: 'En passant trap',
        fen: 'rnbqkbnr/pppp1ppp/8/4p3/3Pp3/2N5/PPP1PPPP/R1BQKBNR w KQkq - 0 1',
        solution: ['dxe5 e.p.', 'Qxd8+'],
        difficulty: 'intermediate',
      },
    });

    controller.handleMove('dxe5 e.p.');
    const result = controller.handleMove('Qxd8+');
    expect(result.success).toBe(true);
    expect(result.complete).toBe(true);
  });

  it('prevents further moves after completion', () => {
    const controller = new PuzzleController({
      puzzle: {
        id: 'simple',
        title: 'Simple mate',
        fen: '8/8/8/8/8/8/8/K6k w - - 0 1',
        solution: ['Ka2'],
        difficulty: 'beginner',
      },
    });

    controller.handleMove('Ka2');
    const result = controller.handleMove('Ka3');
    expect(result.success).toBe(false);
    expect(result.complete).toBe(true);
  });

  it('reset clears attempts and cursor state', () => {
    const controller = new PuzzleController({
      puzzle: {
        id: 'reset',
        title: 'Reset state',
        fen: '8/8/8/8/8/8/8/K6k w - - 0 1',
        solution: ['Ka2', 'Ka3'],
        difficulty: 'beginner',
      },
    });

    controller.handleMove('Ka4');
    expect(controller.getAttempts()).toBe(1);

    controller.reset();
    expect(controller.getAttempts()).toBe(0);
    expect(controller.getCursor()).toBe(0);
    const result = controller.handleMove('Ka2');
    expect(result.success).toBe(true);
  });
});
