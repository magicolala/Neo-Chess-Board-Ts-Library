import { PuzzleSessionManager } from '../../../src/extensions/puzzle-mode/PuzzleSessionManager';
import { formatPuzzleAriaMessage } from '../../../src/react/utils/puzzleAria';
import * as persistence from '../../../src/utils/puzzle/persistence';
import type { PuzzleDefinition } from '../../../src/extensions/puzzle-mode/types';

const storageSafePuzzle: PuzzleDefinition = {
  id: 'warning-test',
  title: 'Persistence warning',
  fen: '8/8/8/8/8/8/8/K6k w - - 0 1',
  solution: ['Ka2'],
  difficulty: 'beginner',
};

describe('Puzzle persistence warnings', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('invokes warning callback when persistence falls back to memory', () => {
    jest.spyOn(persistence, 'loadPuzzleSession').mockReturnValue(null);
    const saveSpy = jest
      .spyOn(persistence, 'savePuzzleSession')
      .mockReturnValue({ persisted: false, error: 'quota exceeded' });

    const warning = jest.fn();
    const session = new PuzzleSessionManager(
      { collectionId: 'warn', puzzles: [storageSafePuzzle] },
      { onPersistenceWarning: warning },
    );

    session.recordHintUsage();
    expect(saveSpy).toHaveBeenCalled();
    expect(warning).toHaveBeenCalledWith('quota exceeded');
  });
});

describe('Puzzle ARIA helper', () => {
  it('formats load, hint, and warning events', () => {
    expect(formatPuzzleAriaMessage({ type: 'load', title: 'Mate in one' })).toBe(
      'Puzzle loaded: Mate in one',
    );
    expect(
      formatPuzzleAriaMessage({
        type: 'hint',
        hintType: 'text',
        payload: 'Fork the queen.',
      }),
    ).toBe('Hint: Fork the queen.');
    expect(
      formatPuzzleAriaMessage({
        type: 'warning',
        message: 'Progress not saved.',
      }),
    ).toBe('Progress not saved.');
  });
});
