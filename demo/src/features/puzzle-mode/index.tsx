import { useMemo, useState, useCallback, useEffect } from 'react';
import { NeoChessBoard } from 'neo-chess-board/react';
import type {
  PuzzleCollection,
  PuzzleDefinition,
  PuzzleDifficulty,
  PuzzleEventMap,
} from '../../../../src/extensions/puzzle-mode/types';
import { loadPuzzleCollection } from '../../../../src/utils/puzzleCollections';
import { ProgressPanel } from './ProgressPanel';
import { PuzzleApiNotes } from './api-notes';

const demoCollection: PuzzleCollection = {
  id: 'demo-tactics',
  title: 'Puzzle Mode Playground',
  description: 'Interact with Puzzle Mode directly inside the Neo Chess Board demo.',
  puzzles: buildPuzzles(),
};

const tagFilters = ['mate', 'fork', 'pin', 'endgame', 'discovery'];

export function PuzzleModeDemo() {
  const [difficulty, setDifficulty] = useState<'all' | PuzzleDifficulty>('all');
  const [activeTag, setActiveTag] = useState<'all' | string>('all');
  const [activePuzzleId, setActivePuzzleId] = useState(demoCollection.puzzles[0]?.id ?? '');
  const [solvedIds, setSolvedIds] = useState<Set<string>>(new Set());
  const [attempts, setAttempts] = useState(0);
  const [hintUsage, setHintUsage] = useState(0);
  const [status, setStatus] = useState('Load a puzzle to begin.');
  const [lastHint, setLastHint] = useState<string | null>(null);
  const [warning, setWarning] = useState<string | null>(null);

  const filters = useMemo(() => {
    const nextFilters: { difficulty?: PuzzleDifficulty[]; tags?: string[] } = {};
    if (difficulty !== 'all') {
      nextFilters.difficulty = [difficulty];
    }
    if (activeTag !== 'all') {
      nextFilters.tags = [activeTag];
    }
    return nextFilters;
  }, [difficulty, activeTag]);

  const collectionView = useMemo(
    () => loadPuzzleCollection(demoCollection, { filters, sortBy: 'difficulty' }),
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
      collectionId: demoCollection.id,
      puzzles: collectionView.puzzles,
      allowHints: true,
      autoAdvance: true,
      startPuzzleId: activePuzzleId,
    }),
    [collectionView.puzzles, activePuzzleId],
  );

  const boardKey = `${puzzleModeConfig.collectionId}:${puzzleModeConfig.startPuzzleId}:${collectionView.puzzles.length}`;

  const handlePuzzleLoad = useCallback((event: PuzzleEventMap['puzzle:load']) => {
    setActivePuzzleId(event.puzzle.id);
    setSolvedIds(new Set(event.session.solvedPuzzles));
    setAttempts(event.session.attempts);
    setHintUsage(event.session.hintUsage ?? 0);
    setStatus(`Loaded "${event.puzzle.title}" (${event.puzzle.difficulty}).`);
    setLastHint(null);
    setWarning(null);
  }, []);

  const handlePuzzleMove = useCallback((event: PuzzleEventMap['puzzle:move']) => {
    setAttempts(event.attempts);
    setStatus(event.result === 'correct' ? 'Correct move!' : 'Incorrect move, try again.');
  }, []);

  const handlePuzzleHint = useCallback((event: PuzzleEventMap['puzzle:hint']) => {
    setHintUsage(event.hintUsage);
    const hint =
      event.hintType === 'text'
        ? event.hintPayload ?? 'Hint requested.'
        : event.hintPayload
          ? `Target square: ${event.hintPayload}`
          : 'Highlight hint requested.';
    setLastHint(hint);
  }, []);

  const handlePuzzleComplete = useCallback((event: PuzzleEventMap['puzzle:complete']) => {
    setSolvedIds((prev) => {
      const next = new Set(prev);
      next.add(event.puzzleId);
      return next;
    });
    setStatus(`Puzzle solved in ${event.attempts} attempt${event.attempts === 1 ? '' : 's'}.`);
  }, []);

  const handleWarning = useCallback((event: PuzzleEventMap['puzzle:persistence-warning']) => {
    setWarning(event.error);
  }, []);

  const navigatePuzzle = useCallback(
    (direction: 'next' | 'previous') => {
      if (collectionView.puzzles.length === 0) {
        return;
      }
      const currentIndex = collectionView.puzzles.findIndex((puzzle) => puzzle.id === activePuzzleId);
      if (currentIndex === -1) {
        setActivePuzzleId(collectionView.puzzles[0].id);
        return;
      }
      const nextIndex =
        direction === 'next'
          ? (currentIndex + 1) % collectionView.puzzles.length
          : (currentIndex - 1 + collectionView.puzzles.length) % collectionView.puzzles.length;
      setActivePuzzleId(collectionView.puzzles[nextIndex].id);
    },
    [collectionView, activePuzzleId],
  );

  const totalPuzzles = collectionView.puzzles.length;
  const solvedCount = solvedIds.size;

  return (
    <div
      style={{
        padding: '2rem',
        background: '#0f172a',
        color: '#e2e8f0',
        minHeight: '100vh',
        fontFamily: 'Inter, system-ui, sans-serif',
      }}
    >
      <header style={{ marginBottom: '1.5rem' }}>
        <p style={{ textTransform: 'uppercase', letterSpacing: 2, margin: 0, color: '#94a3b8' }}>
          Neo Chess Board
        </p>
        <h1 style={{ fontSize: '2.5rem', margin: '0.25rem 0 0.5rem' }}>{demoCollection.title}</h1>
        <p style={{ margin: 0, color: '#cbd5f5' }}>{demoCollection.description}</p>
      </header>

      <section
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '0.75rem',
          alignItems: 'center',
          marginBottom: '1.5rem',
        }}
      >
        <strong style={{ letterSpacing: 1 }}>Difficulty:</strong>
        {['all', 'beginner', 'intermediate', 'advanced'].map((option) => (
          <button
            type="button"
            key={option}
            onClick={() => setDifficulty(option as typeof difficulty)}
            style={{
              borderRadius: 999,
              padding: '0.35rem 0.9rem',
              border: '1px solid rgba(255,255,255,0.2)',
              background: difficulty === option ? '#e2e8f0' : 'transparent',
              color: difficulty === option ? '#0f172a' : '#e2e8f0',
              cursor: 'pointer',
            }}
          >
            {option[0].toUpperCase() + option.slice(1)}
          </button>
        ))}

        <strong style={{ marginLeft: '1rem', letterSpacing: 1 }}>Tags:</strong>
        <button
          type="button"
          onClick={() => setActiveTag('all')}
          style={{
            borderRadius: 999,
            padding: '0.35rem 0.9rem',
            border: '1px solid rgba(255,255,255,0.2)',
            background: activeTag === 'all' ? '#22d3ee' : 'transparent',
            color: activeTag === 'all' ? '#0f172a' : '#e2e8f0',
            cursor: 'pointer',
          }}
        >
          All
        </button>
        {tagFilters.map((tag) => (
          <button
            key={tag}
            type="button"
            onClick={() => setActiveTag(tag)}
            style={{
              borderRadius: 999,
              padding: '0.35rem 0.9rem',
              border: '1px solid rgba(255,255,255,0.2)',
              background: activeTag === tag ? '#22d3ee' : 'transparent',
              color: activeTag === tag ? '#0f172a' : '#e2e8f0',
              cursor: 'pointer',
            }}
          >
            #{tag}
          </button>
        ))}

        <span style={{ marginLeft: 'auto', display: 'flex', gap: '0.75rem' }}>
          <button
            type="button"
            onClick={() => navigatePuzzle('previous')}
            style={{
              padding: '0.4rem 0.9rem',
              borderRadius: 8,
              border: '1px solid rgba(255,255,255,0.2)',
              background: 'transparent',
              color: '#e2e8f0',
              cursor: 'pointer',
            }}
          >
            Previous
          </button>
          <button
            type="button"
            onClick={() => navigatePuzzle('next')}
            style={{
              padding: '0.4rem 0.9rem',
              borderRadius: 8,
              border: '1px solid rgba(255,255,255,0.2)',
              background: '#22d3ee',
              color: '#0f172a',
              cursor: 'pointer',
            }}
          >
            Next
          </button>
        </span>
      </section>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(320px, 520px) minmax(260px, 1fr)',
          gap: '1.5rem',
          alignItems: 'flex-start',
        }}
      >
        <div
          style={{
            background: '#020617',
            padding: '1rem',
            borderRadius: 24,
            boxShadow: '0 30px 80px rgba(2, 6, 23, 0.65)',
          }}
        >
          <NeoChessBoard
            key={boardKey}
            size={520}
            puzzleMode={puzzleModeConfig}
            showNotation
            onPuzzleLoad={handlePuzzleLoad}
            onPuzzleMove={handlePuzzleMove}
            onPuzzleHint={handlePuzzleHint}
            onPuzzleComplete={handlePuzzleComplete}
            onPuzzlePersistenceWarning={handleWarning}
          />
        </div>
        <ProgressPanel
          total={totalPuzzles}
          solved={solvedCount}
          attempts={attempts}
          hintUsage={hintUsage}
          status={status}
          lastHint={lastHint}
          warning={warning}
        />
      </div>

      <section
        style={{
          marginTop: '2rem',
          background: '#020617',
          borderRadius: 16,
          padding: '1.25rem',
        }}
      >
        <h2 style={{ marginTop: 0, marginBottom: '0.75rem', fontSize: '1.25rem' }}>
          Puzzle collection
        </h2>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '0.75rem',
          }}
        >
          {collectionView.puzzles.map((puzzle) => {
            const solved = solvedIds.has(puzzle.id);
            const isActive = puzzle.id === activePuzzleId;
            return (
              <button
                key={puzzle.id}
                type="button"
                onClick={() => setActivePuzzleId(puzzle.id)}
                style={{
                  textAlign: 'left',
                  borderRadius: 14,
                  border: '1px solid rgba(255,255,255,0.1)',
                  padding: '0.85rem 1rem',
                  background: isActive ? '#1e293b' : 'transparent',
                  color: '#e2e8f0',
                  cursor: 'pointer',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <strong>{puzzle.title}</strong>
                  <span
                    style={{
                      fontSize: '0.75rem',
                      textTransform: 'uppercase',
                      padding: '0.2rem 0.6rem',
                      borderRadius: 999,
                      background: difficultyBadge(puzzle.difficulty),
                      color: '#0f172a',
                    }}
                  >
                    {puzzle.difficulty}
                  </span>
                </div>
                <small style={{ color: '#94a3b8' }}>
                  {puzzle.hint ?? 'Solve the tactic to advance.'}
                </small>
                {solved && (
                  <div style={{ marginTop: '0.3rem', fontSize: '0.75rem', color: '#4ade80' }}>
                    ✓ Solved
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </section>

      <PuzzleApiNotes />
    </div>
  );
}

function buildPuzzles(): PuzzleDefinition[] {
  const seeds: Array<PuzzleDefinition> = [
    {
      id: 'demo-mate',
      title: 'Mate in one',
      fen: '6k1/5ppp/8/8/8/8/5PPP/4R1K1 w - - 0 1',
      solution: ['Re8#'],
      difficulty: 'beginner',
      tags: ['mate', 'endgame'],
      hint: 'Look for a back-rank mate.',
    },
    {
      id: 'demo-fork',
      title: 'Knight fork',
      fen: 'r1bqkb1r/pppp1ppp/2n2n2/4p3/2B1P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 4 4',
      solution: ['Ng5', 'd5', 'Bxf7+'],
      difficulty: 'intermediate',
      tags: ['fork', 'tactic'],
      hint: 'Target f7 with forcing checks.',
    },
    {
      id: 'demo-pin',
      title: 'Devastating pin',
      fen: 'r1bqk2r/pp3ppp/2n1pn2/3p4/1b1P4/2N1PN2/PP3PPP/R1BQKB1R w KQkq - 0 7',
      solution: ['Nd5', 'exd5', 'exd5'],
      difficulty: 'advanced',
      tags: ['pin'],
      hint: 'Pin the knight on f6 to win material.',
    },
    {
      id: 'demo-discovery',
      title: 'Discovered attack',
      fen: 'r2qkb1r/pp2nppp/3p1n2/2pP4/2P1P3/2N2N2/PP3PPP/R1BQKB1R w KQkq - 0 8',
      solution: ['Qa4+', 'Bd7', 'Nb5'],
      difficulty: 'advanced',
      tags: ['discovery'],
      hint: 'Reveal an attack on the diagonal.',
    },
    {
      id: 'demo-stalemate',
      title: 'Avoid stalemate',
      fen: '7k/5K2/6Q1/8/8/8/8/8 w - - 0 1',
      solution: ['Qg7#'],
      difficulty: 'beginner',
      tags: ['mate', 'endgame'],
      hint: 'Deliver mate without stalemate traps.',
    },
  ];
  return seeds;
}

function difficultyBadge(difficulty: PuzzleDifficulty): string {
  switch (difficulty) {
    case 'beginner':
      return '#a3e635';
    case 'intermediate':
      return '#fde047';
    case 'advanced':
      return '#f87171';
    default:
      return '#94a3b8';
  }
}
