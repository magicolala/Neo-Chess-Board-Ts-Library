import { PuzzleSessionManager } from '../../../src/extensions/puzzle-mode/PuzzleSessionManager';
import { PuzzleHintService } from '../../../src/extensions/puzzle-mode/PuzzleHintService';
import type { PuzzleDefinition } from '../../../src/extensions/puzzle-mode/types';

const basePuzzle: PuzzleDefinition = {
  id: 'mate-in-two',
  title: 'Mate in two',
  fen: 'r1bqkbnr/pppp1ppp/2n5/4p3/2B1P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 2 3',
  solution: ['Bxf7+', 'Qxd8+'],
  difficulty: 'intermediate',
  hint: 'Look for checks on f7.',
};

describe('PuzzleHintService', () => {
  it('returns puzzle-provided text hint and tracks usage', () => {
    const session = new PuzzleSessionManager({
      collectionId: 'daily',
      puzzles: [basePuzzle],
    });
    const hints = new PuzzleHintService(session);

    const hint = hints.requestHint('text');
    expect(hint).toEqual({
      type: 'text',
      puzzle: basePuzzle,
      message: 'Look for checks on f7.',
      hintUsage: 1,
    });
    expect(session.getState().hintUsage).toBe(1);
  });

  it('highlights next move destination even with SAN suffixes', () => {
    const castlePuzzle: PuzzleDefinition = {
      id: 'castle',
      title: 'Castle to safety',
      fen: 'r3k2r/pppq1ppp/2npbn2/2b1p3/2B1P3/2NP1N2/PPPQ1PPP/R3K2R w KQkq - 0 1',
      solution: ['O-O'],
      difficulty: 'beginner',
    };
    const session = new PuzzleSessionManager({
      collectionId: 'daily-castle',
      puzzles: [castlePuzzle],
    });
    const hints = new PuzzleHintService(session);

    const hint = hints.requestHint('origin-highlight');
    expect(hint?.type).toBe('origin-highlight');
    if (hint?.type !== 'origin-highlight') {
      throw new Error('Expected origin highlight hint');
    }
    expect(hint.targetSquare).toBe('g1');
    expect(hint.hintUsage).toBe(1);
  });
});

describe('PuzzleSessionManager attempts', () => {
  it('increments attempts when incorrect SAN is provided', () => {
    const session = new PuzzleSessionManager({
      collectionId: 'daily',
      puzzles: [basePuzzle],
    });

    const evaluation = session.handleMove('Kh1');
    expect(evaluation.accepted).toBe(false);
    expect(session.getState().attempts).toBe(1);
  });
});
