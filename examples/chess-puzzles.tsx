import React, { useMemo, useState, useCallback, useEffect } from 'react';
import { NeoChessBoard } from '../src/react/NeoChessBoard';
import type {
  PuzzleCollection,
  PuzzleDefinition,
  PuzzleDifficulty,
  PuzzleEventMap,
} from '../src/extensions/puzzle-mode/types';
import { loadPuzzleCollection } from '../src/utils/puzzleCollections';
import { clearPuzzleSession } from '../src/utils/puzzle/persistence';

const difficultyColors: Record<PuzzleDifficulty, string> = {
  beginner: '#10b981',
  intermediate: '#f59e0b',
  advanced: '#ef4444',
};

const seedCollection: PuzzleCollection = {
  id: 'example-daily-puzzles',
  title: 'Daily Tactical Mix',
  description: 'Sample tactics bundled with the Neo Chess Board source repository.',
  puzzles: buildPuzzleDefinitions(),
};

const difficultyFilters: Array<{ label: string; value: 'all' | PuzzleDifficulty }> = [
  { label: 'All', value: 'all' },
  { label: 'Beginner', value: 'beginner' },
  { label: 'Intermediate', value: 'intermediate' },
  { label: 'Advanced', value: 'advanced' },
];

export function ChessPuzzleApp() {
  const [difficulty, setDifficulty] = useState<(typeof difficultyFilters)[number]['value']>('all');
  const [activePuzzleId, setActivePuzzleId] = useState(seedCollection.puzzles[0]?.id ?? '');
  const [solvedIds, setSolvedIds] = useState<Set<string>>(new Set());
  const [statusMessage, setStatusMessage] = useState('Pick a puzzle to begin solving.');
  const [lastHint, setLastHint] = useState<string | null>(null);
  const [persistenceWarning, setPersistenceWarning] = useState<string | null>(null);

  const filters = useMemo(
    () =>
      difficulty === 'all'
        ? {}
        : {
            difficulty: [difficulty as PuzzleDifficulty],
          },
    [difficulty],
  );

  const collectionView = useMemo(
    () => loadPuzzleCollection(seedCollection, { filters, sortBy: 'difficulty' }),
    [filters],
  );

  useEffect(() => {
    if (collectionView.puzzles.length === 0) {
      return;
    }
    if (!collectionView.puzzles.some((puzzle) => puzzle.id === activePuzzleId)) {
      setActivePuzzleId(collectionView.puzzles[0].id);
    }
  }, [collectionView, activePuzzleId]);

  const puzzleModeConfig = useMemo(
    () => ({
      collectionId: seedCollection.id,
      puzzles: collectionView.puzzles,
      allowHints: true,
      autoAdvance: false,
      startPuzzleId: activePuzzleId,
    }),
    [collectionView.puzzles, activePuzzleId],
  );

  const handlePuzzleLoad = useCallback((event: PuzzleEventMap['puzzle:load']) => {
    setActivePuzzleId(event.puzzle.id);
    setSolvedIds(new Set(event.session.solvedPuzzles));
    setStatusMessage(`Loaded "${event.puzzle.title}" (${event.puzzle.difficulty}).`);
    setLastHint(null);
    setPersistenceWarning(null);
  }, []);

  const handlePuzzleMove = useCallback((event: PuzzleEventMap['puzzle:move']) => {
    if (event.result === 'correct') {
      setStatusMessage(`Correct move ${event.cursor}/${event.cursor + 1}. Keep going!`);
    } else {
      setStatusMessage(`Incorrect move (attempt ${event.attempts}). Try again.`);
    }
  }, []);

  const handlePuzzleHint = useCallback((event: PuzzleEventMap['puzzle:hint']) => {
    const hint =
      event.hintType === 'text'
        ? (event.hintPayload ?? 'Hint requested.')
        : event.hintPayload
          ? `Target square highlighted: ${event.hintPayload}`
          : 'Highlight hint requested.';
    setLastHint(hint);
    setStatusMessage('Hint requested.');
  }, []);

  const handlePuzzleComplete = useCallback((event: PuzzleEventMap['puzzle:complete']) => {
    setSolvedIds((prev) => {
      const next = new Set(prev);
      next.add(event.puzzleId);
      return next;
    });
    setStatusMessage(
      `Puzzle solved in ${event.attempts} attempt${event.attempts === 1 ? '' : 's'}.`,
    );
  }, []);

  const handleWarning = useCallback((event: PuzzleEventMap['puzzle:persistence-warning']) => {
    setPersistenceWarning(event.error);
  }, []);

  const resetProgress = useCallback(() => {
    clearPuzzleSession(`puzzle-mode:${seedCollection.id}`);
    setSolvedIds(new Set());
    setStatusMessage('Progress cleared. Reload puzzle to start over.');
  }, []);

  const totalPuzzles = collectionView.puzzles.length;
  const solvedCount = solvedIds.size;
  const progressPercent = totalPuzzles === 0 ? 0 : Math.round((solvedCount / totalPuzzles) * 100);
  const boardKey = `${puzzleModeConfig.collectionId}:${puzzleModeConfig.startPuzzleId}:${totalPuzzles}`;

  return (
    <div
      style={{
        fontFamily: 'Inter, system-ui, sans-serif',
        display: 'grid',
        gap: '1.5rem',
        padding: '1.5rem',
        maxWidth: 1200,
        margin: '0 auto',
      }}
    >
      <header>
        <h1 style={{ fontSize: '1.75rem', margin: 0 }}>{seedCollection.title}</h1>
        <p style={{ margin: '0.25rem 0 0', color: '#4b5563' }}>{seedCollection.description}</p>
      </header>

      <section
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '0.5rem',
          alignItems: 'center',
        }}
      >
        <span style={{ fontWeight: 600 }}>Filter by difficulty:</span>
        {difficultyFilters.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => setDifficulty(option.value)}
            style={{
              borderRadius: '999px',
              padding: '0.25rem 0.85rem',
              border: '1px solid #d1d5db',
              background: option.value === difficulty ? '#111827' : '#fff',
              color: option.value === difficulty ? '#fff' : '#111827',
              cursor: 'pointer',
            }}
          >
            {option.label}
          </button>
        ))}
        <button
          type="button"
          onClick={resetProgress}
          style={{
            marginLeft: 'auto',
            border: 'none',
            background: '#fee2e2',
            color: '#b91c1c',
            padding: '0.35rem 0.85rem',
            borderRadius: 6,
            cursor: 'pointer',
          }}
        >
          Reset progress
        </button>
      </section>

      <section
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '1rem',
        }}
      >
        <article
          style={{
            background: '#fff',
            borderRadius: 12,
            padding: '1rem',
            boxShadow: '0 10px 30px rgba(15, 23, 42, 0.06)',
          }}
        >
          <header style={{ marginBottom: '0.75rem' }}>
            <h2 style={{ margin: 0, fontSize: '1.25rem' }}>Progress</h2>
            <p style={{ margin: 0, color: '#6b7280' }}>
              {solvedCount} of {totalPuzzles} puzzles solved
            </p>
          </header>
          <div
            style={{
              background: '#e5e7eb',
              borderRadius: 999,
              height: 10,
              overflow: 'hidden',
              marginBottom: '0.5rem',
            }}
          >
            <div
              style={{
                width: `${progressPercent}%`,
                height: '100%',
                background: '#6366f1',
                transition: 'width 200ms ease',
              }}
            />
          </div>
          <strong style={{ fontSize: '1rem' }}>{progressPercent}% complete</strong>
          {lastHint && (
            <p style={{ marginTop: '0.75rem', color: '#0369a1' }}>
              <strong>Last hint:</strong> {lastHint}
            </p>
          )}
          {persistenceWarning && (
            <p style={{ marginTop: '0.5rem', color: '#b45309' }}>
              <strong>Warning:</strong> {persistenceWarning}
            </p>
          )}
          <p style={{ marginTop: '0.75rem', color: '#374151' }}>{statusMessage}</p>
        </article>

        <article
          style={{
            background: '#fff',
            borderRadius: 12,
            padding: '1rem',
            boxShadow: '0 10px 30px rgba(15, 23, 42, 0.06)',
            maxHeight: 420,
            overflow: 'auto',
          }}
        >
          <h2 style={{ margin: '0 0 0.5rem' }}>Available puzzles</h2>
          <ul
            style={{
              listStyle: 'none',
              padding: 0,
              margin: 0,
              display: 'flex',
              flexDirection: 'column',
              gap: '0.5rem',
            }}
          >
            {collectionView.puzzles.map((puzzle) => {
              const isActive = puzzle.id === activePuzzleId;
              const solved = solvedIds.has(puzzle.id);
              return (
                <li key={puzzle.id}>
                  <button
                    type="button"
                    onClick={() => setActivePuzzleId(puzzle.id)}
                    style={{
                      width: '100%',
                      textAlign: 'left',
                      border: '1px solid #e5e7eb',
                      borderRadius: 10,
                      padding: '0.6rem 0.85rem',
                      background: isActive ? '#111827' : '#fff',
                      color: isActive ? '#fff' : '#111827',
                      cursor: 'pointer',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        gap: '0.5rem',
                      }}
                    >
                      <strong>{puzzle.title}</strong>
                      <span
                        style={{
                          background: difficultyColors[puzzle.difficulty],
                          color: '#fff',
                          borderRadius: 999,
                          padding: '0.15rem 0.65rem',
                          fontSize: '0.75rem',
                          textTransform: 'capitalize',
                        }}
                      >
                        {puzzle.difficulty}
                      </span>
                    </div>
                    <small style={{ color: isActive ? '#e5e7eb' : '#4b5563' }}>
                      {puzzle.hint ?? 'Tactical motif'}
                    </small>
                    {solved && (
                      <span
                        style={{
                          display: 'inline-block',
                          marginTop: '0.15rem',
                          fontSize: '0.75rem',
                          color: '#22c55e',
                        }}
                      >
                        Solved
                      </span>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        </article>
      </section>

      <div
        style={{
          background: '#0f172a',
          borderRadius: 16,
          padding: '1rem',
          boxShadow: '0 25px 70px rgba(15, 23, 42, 0.4)',
        }}
      >
        <NeoChessBoard
          key={boardKey}
          size={540}
          puzzleMode={puzzleModeConfig}
          onPuzzleLoad={handlePuzzleLoad}
          onPuzzleMove={handlePuzzleMove}
          onPuzzleHint={handlePuzzleHint}
          onPuzzleComplete={handlePuzzleComplete}
          onPuzzlePersistenceWarning={handleWarning}
          style={{
            margin: '0 auto',
            borderRadius: 12,
            overflow: 'hidden',
          }}
        />
      </div>
    </div>
  );
}

function buildPuzzleDefinitions(): PuzzleDefinition[] {
  const seeds: Array<{
    id: string;
    title: string;
    fen: string;
    solution: string[];
    difficulty: PuzzleDifficulty;
    tags: string[];
    hint: string;
  }> = [
    {
      id: 'mate-in-one',
      title: 'Mate in one',
      fen: 'r1bqk2r/pppp1ppp/2n2n2/2b1p3/2B1P3/3P1N2/PPP2PPP/RNBQK2R w KQkq - 0 6',
      solution: ['Bxf7+'],
      difficulty: 'beginner',
      tags: ['mate', 'opening'],
      hint: 'Look for forcing checks on f7.',
    },
    {
      id: 'fork-trick',
      title: 'Knight fork',
      fen: 'r1bqkb1r/pppp1ppp/2n2n2/4p3/2B1P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 4 4',
      solution: ['Ng5', 'd6', 'Nxf7'],
      difficulty: 'intermediate',
      tags: ['fork', 'tactic'],
      hint: 'Aim for forks on f7.',
    },
    {
      id: 'pin-and-win',
      title: 'Devastating pin',
      fen: 'r1bqk2r/pp3ppp/2n1pn2/3p4/1b1P4/2N1PN2/PP3PPP/R1BQKB1R w KQkq - 0 7',
      solution: ['Nd5', 'exd5', 'exd5'],
      difficulty: 'advanced',
      tags: ['pin'],
      hint: 'Look for pins on the d-file.',
    },
    {
      id: 'back-rank',
      title: 'Back rank mate',
      fen: '6k1/5ppp/8/8/8/8/5PPP/4R1K1 w - - 0 1',
      solution: ['Re8#'],
      difficulty: 'intermediate',
      tags: ['mate', 'endgame'],
      hint: 'The king is stuck on the back rank.',
    },
    {
      id: 'discovered-attack',
      title: 'Discovered attack',
      fen: 'r2qkb1r/pp2nppp/3p1n2/2pP4/2P1P3/2N2N2/PP3PPP/R1BQKB1R w KQkq - 0 8',
      solution: ['dxc5', 'dxc5', 'Bb5+'],
      difficulty: 'advanced',
      tags: ['discovery'],
      hint: 'Open lines for your bishops.',
    },
  ];

  return seeds.map((seed) => ({
    ...seed,
    variants: [],
    author: 'Neo Chess Board',
  }));
}
