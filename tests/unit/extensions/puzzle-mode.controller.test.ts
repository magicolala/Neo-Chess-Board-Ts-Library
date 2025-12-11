import { PuzzleController } from '../../../src/extensions/puzzle-mode/PuzzleController';
import type { PuzzleDefinition, PuzzleVariant } from '../../../src/extensions/puzzle-mode/types';

describe('PuzzleController - canonical + variants', () => {
  const basePuzzle: PuzzleDefinition = {
    id: 'mate-in-two-001',
    title: 'Mate in two',
    fen: 'r1bqkbnr/pppp1ppp/2n5/4p3/2B1P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 2 3',
    solution: ['Bxf7+', 'Qxd8+'],
    variants: [
      { id: 'line-b', label: 'Line B', moves: ['Bxf7+', 'Nxe5+'] },
    ],
    difficulty: 'intermediate',
  };

  it('accepts canonical solution line', () => {
    const controller = new PuzzleController({ puzzle: basePuzzle });

    const first = controller.handleMove('Bxf7+');
    expect(first.success).toBe(true);
    expect(first.complete).toBe(false);
    expect(controller.getCursor()).toBe(1);

    const second = controller.handleMove('Qxd8+');
    expect(second.success).toBe(true);
    expect(second.complete).toBe(true);
    expect(controller.isSolved()).toBe(true);
  });

  it('accepts declared alternate line', () => {
    const controller = new PuzzleController({ puzzle: basePuzzle });
    controller.handleMove('Bxf7+');
    const result = controller.handleMove('Nxe5+');

    expect(result.success).toBe(true);
    expect(result.complete).toBe(true);
  });

  it('rejects wrong move and increments attempts', () => {
    const controller = new PuzzleController({ puzzle: basePuzzle });
    const result = controller.handleMove('Kh1');

    expect(result.success).toBe(false);
    expect(controller.getAttempts()).toBe(1);
    expect(controller.getCursor()).toBe(0);
  });
});
