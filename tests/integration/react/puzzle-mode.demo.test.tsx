import React, { act } from 'react';
import { render, screen } from '@testing-library/react';
import type { NeoChessProps } from '../../../src/react/NeoChessBoard';
import type { PuzzleEventMap, PuzzleDefinition } from '../../../src/extensions/puzzle-mode/types';
import { PuzzleModeDemo } from '../../../demo/src/features/puzzle-mode';

let latestProps: NeoChessProps | null = null;

jest.mock('neo-chess-board/react', () => {
  const ReactModule = require('react');
  return {
    __esModule: true,
    NeoChessBoard: (props: NeoChessProps) => {
      latestProps = props;
      return ReactModule.createElement('div', { 'data-testid': 'mock-puzzle-board' });
    },
  };
});

function emitLoadEvent(puzzle: PuzzleDefinition, solvedIds: string[] = []) {
  act(() => {
    latestProps?.onPuzzleLoad?.({
      collectionId: latestProps?.puzzleMode?.collectionId ?? '',
      puzzle,
      session: {
        collectionId: latestProps?.puzzleMode?.collectionId ?? '',
        currentPuzzleId: puzzle.id,
        moveCursor: 0,
        attempts: 0,
        solvedPuzzles: new Set(solvedIds),
        hintUsage: 0,
        autoAdvance: true,
      },
    } satisfies PuzzleEventMap['puzzle:load']);
  });
}

describe('PuzzleModeDemo integration (persistence restoration)', () => {
  beforeEach(() => {
    latestProps = null;
  });

  it('restores solved progress when persisted session emits solved puzzle ids and surfaces warnings', async () => {
    const { rerender } = render(<PuzzleModeDemo />);

    expect(latestProps?.puzzleMode?.collectionId).toBe('demo-tactics');
    const initialPuzzle = latestProps?.puzzleMode?.puzzles?.[0];
    expect(initialPuzzle).toBeTruthy();
    if (!initialPuzzle) {
      throw new Error('Puzzle list missing');
    }

    emitLoadEvent(initialPuzzle, []);

    expect(
      await screen.findByText(/0 of .* puzzles solved/i, {}, { timeout: 1000 }),
    ).toBeInTheDocument();

    act(() => {
      latestProps?.onPuzzleComplete?.({
        puzzleId: initialPuzzle.id,
        attempts: 1,
        durationMs: undefined,
      });
    });

    expect(
      await screen.findByText(/1 of .* puzzles solved/i, {}, { timeout: 1000 }),
    ).toBeInTheDocument();

    rerender(<PuzzleModeDemo />);
    const reloadedPuzzle = latestProps?.puzzleMode?.puzzles?.[0];
    if (!reloadedPuzzle) {
      throw new Error('Reloaded puzzle list missing');
    }

    emitLoadEvent(reloadedPuzzle, [initialPuzzle.id]);

    expect(
      await screen.findByText(/1 of .* puzzles solved/i, {}, { timeout: 1000 }),
    ).toBeInTheDocument();

    act(() => {
      latestProps?.onPuzzlePersistenceWarning?.({
        error: 'Progress stored in memory only',
        fallback: 'memory',
      });
    });

    expect(
      await screen.findByText(/Progress stored in memory only/i, {}, { timeout: 1000 }),
    ).toBeInTheDocument();
  });
});
