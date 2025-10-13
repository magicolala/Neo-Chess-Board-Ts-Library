import React, { useState, useCallback } from 'react';
import { NeoChessBoard } from '../src/react/NeoChessBoard';
import type { Move } from '../src/core/types';

interface ChessPuzzle {
  id: string;
  title: string;
  description: string;
  fen: string;
  solution: string[];
  theme: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced' | 'master';
  tags: string[];
}

// Puzzle database
const chessPuzzles: ChessPuzzle[] = [
  {
    id: 'mate-in-1-basic',
    title: 'Mate in 1',
    description: 'Find the checkmate in one move',
    fen: 'r1bqk2r/pppp1ppp/2n2n2/2b1p3/2B1P3/3P1N2/PPP2PPP/RNBQK2R w KQkq - 0 6',
    solution: ['Bxf7#'],
    theme: 'light',
    difficulty: 'beginner',
    tags: ['mate', 'tactics', 'beginner'],
  },
  {
    id: 'fork-knight',
    title: 'Knight Fork',
    description: 'Win material with a knight fork',
    fen: 'r1bqkb1r/pppp1ppp/2n2n2/4p3/2B1P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 4 4',
    solution: ['Ng5', 'd6', 'Nf7'],
    theme: 'wood',
    difficulty: 'intermediate',
    tags: ['fork', 'knight', 'tactics'],
  },
  {
    id: 'pin-attack',
    title: 'Devastating Pin',
    description: 'Exploit a pin to win the game',
    fen: 'r1bqk2r/pp3ppp/2n1pn2/3p4/1b1P4/2N1PN2/PP3PPP/R1BQKB1R w KQkq - 0 7',
    solution: ['Nd5', 'exd5', 'exd5'],
    theme: 'dark',
    difficulty: 'advanced',
    tags: ['pin', 'positional', 'advanced'],
  },
  {
    id: 'back-rank-mate',
    title: 'Back Rank Mate',
    description: 'Deliver mate on the back rank',
    fen: '6k1/5ppp/8/8/8/8/5PPP/4R1K1 w - - 0 1',
    solution: ['Re8#'],
    theme: 'glass',
    difficulty: 'intermediate',
    tags: ['mate', 'back-rank', 'endgame'],
  },
  {
    id: 'discovered-attack',
    title: 'Discovered Attack',
    description: 'Use a discovered attack to win material',
    fen: 'r2qkb1r/pp2nppp/3p1n2/2pP4/2P1P3/2N2N2/PP3PPP/R1BQKB1R w KQkq c6 0 8',
    solution: ['d6', 'Nxd6', 'cxd6'],
    theme: 'neon',
    difficulty: 'advanced',
    tags: ['discovery', 'tactics', 'advanced'],
  },
];

// Difficulty colors
const difficultyColors = {
  beginner: '#10b981',
  intermediate: '#f59e0b',
  advanced: '#ef4444',
  master: '#8b5cf6',
};

// Custom hook for puzzle state
function usePuzzleGame() {
  const [currentPuzzleIndex, setCurrentPuzzleIndex] = useState(0);
  const [solutionIndex, setSolutionIndex] = useState(0);
  const [attempts, setAttempts] = useState(0);
  const [solved, setSolved] = useState(false);
  const [hint, setHint] = useState('');
  const [solvedPuzzles, setSolvedPuzzles] = useState<Set<string>>(new Set());

  const currentPuzzle = chessPuzzles[currentPuzzleIndex];

  const resetPuzzle = useCallback(() => {
    setSolutionIndex(0);
    setAttempts(0);
    setSolved(false);
    setHint('');
  }, []);

  const checkMove = useCallback(
    (move: Move) => {
      const expectedMove = currentPuzzle.solution[solutionIndex];
      const moveNotation = move.san || `${move.from}${move.to}`;

      setAttempts((prev) => prev + 1);

      if (moveNotation === expectedMove || move.from + move.to === expectedMove) {
        setSolutionIndex((prev) => prev + 1);

        if (solutionIndex + 1 >= currentPuzzle.solution.length) {
          setSolved(true);
          setSolvedPuzzles((prev) => new Set([...prev, currentPuzzle.id]));
          setHint(`🎉 Puzzle solved in ${attempts + 1} attempt${attempts > 0 ? 's' : ''}!`);
        } else {
          setHint(`✅ Correct! Move ${solutionIndex + 2} of ${currentPuzzle.solution.length}`);
        }
      } else {
        setHint(`❌ Not quite right. Try again! (Attempt ${attempts + 1})`);
      }
    },
    [currentPuzzle, solutionIndex, attempts],
  );

  const nextPuzzle = useCallback(() => {
    const nextIndex = (currentPuzzleIndex + 1) % chessPuzzles.length;
    setCurrentPuzzleIndex(nextIndex);
    resetPuzzle();
  }, [currentPuzzleIndex, resetPuzzle]);

  const previousPuzzle = useCallback(() => {
    const prevIndex = currentPuzzleIndex === 0 ? chessPuzzles.length - 1 : currentPuzzleIndex - 1;
    setCurrentPuzzleIndex(prevIndex);
    resetPuzzle();
  }, [currentPuzzleIndex, resetPuzzle]);

  const selectPuzzle = useCallback(
    (index: number) => {
      setCurrentPuzzleIndex(index);
      resetPuzzle();
    },
    [resetPuzzle],
  );

  return {
    currentPuzzle,
    currentPuzzleIndex,
    solutionIndex,
    attempts,
    solved,
    hint,
    solvedPuzzles,
    checkMove,
    resetPuzzle,
    nextPuzzle,
    previousPuzzle,
    selectPuzzle,
  };
}

// Main puzzle component
export function ChessPuzzleApp() {
  const puzzle = usePuzzleGame();
  const [showSolution, setShowSolution] = useState(false);
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('all');

  // Filter puzzles by difficulty
  const filteredPuzzles =
    selectedDifficulty === 'all'
      ? chessPuzzles
      : chessPuzzles.filter((p) => p.difficulty === selectedDifficulty);

  const handleMove = useCallback(
    (move: Move) => {
      if (!puzzle.solved) {
        puzzle.checkMove(move);
      }
    },
    [puzzle.checkMove, puzzle.solved],
  );

  // Calculate progress
  const progressPercentage = (puzzle.solvedPuzzles.size / chessPuzzles.length) * 100;

  return (
    <div
      style={{
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '20px',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        minHeight: '100vh',
      }}
    >
      {/* Header */}
      <div
        style={{
          background: 'white',
          borderRadius: '12px',
          padding: '20px',
          marginBottom: '20px',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
        }}
      >
        <h1
          style={{
            textAlign: 'center',
            margin: '0 0 10px 0',
            background: 'linear-gradient(45deg, #667eea, #764ba2)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            fontSize: '2.5em',
          }}
        >
          ♟️ Chess Puzzle Master
        </h1>

        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
          <div
            style={{
              display: 'inline-block',
              background: '#f0fdf4',
              border: '1px solid #bbf7d0',
              borderRadius: '8px',
              padding: '8px 16px',
            }}
          >
            <span style={{ fontWeight: '600', color: '#16a34a' }}>
              Progress: {puzzle.solvedPuzzles.size}/{chessPuzzles.length} (
              {Math.round(progressPercentage)}%)
            </span>
          </div>
        </div>

        {/* Difficulty filter */}
        <div style={{ textAlign: 'center' }}>
          <label style={{ marginRight: '10px', fontWeight: '600' }}>Filter by difficulty:</label>
          <select
            value={selectedDifficulty}
            onChange={(e) => setSelectedDifficulty(e.target.value)}
            style={{
              padding: '6px 12px',
              borderRadius: '6px',
              border: '1px solid #d1d5db',
            }}
          >
            <option value="all">All Difficulties</option>
            <option value="beginner">Beginner</option>
            <option value="intermediate">Intermediate</option>
            <option value="advanced">Advanced</option>
            <option value="master">Master</option>
          </select>
        </div>
      </div>

      {/* Main puzzle area */}
      <div
        style={{
          background: 'white',
          borderRadius: '12px',
          padding: '30px',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
          marginBottom: '20px',
        }}
      >
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'auto 350px',
            gap: '30px',
            alignItems: 'start',
          }}
        >
          {/* Chess board */}
          <div>
            <NeoChessBoard
              position={puzzle.currentPuzzle.fen}
              theme={puzzle.currentPuzzle.theme}
              orientation="white"
              showCoordinates={true}
              onMove={handleMove}
              style={{ maxWidth: '500px', width: '100%' }}
            />
          </div>

          {/* Puzzle info panel */}
          <div>
            {/* Puzzle header */}
            <div style={{ marginBottom: '20px' }}>
              <div
                style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}
              >
                <h2 style={{ margin: 0, color: '#374151' }}>{puzzle.currentPuzzle.title}</h2>
                <span
                  style={{
                    background: difficultyColors[puzzle.currentPuzzle.difficulty],
                    color: 'white',
                    padding: '4px 8px',
                    borderRadius: '12px',
                    fontSize: '12px',
                    fontWeight: '600',
                    textTransform: 'uppercase',
                  }}
                >
                  {puzzle.currentPuzzle.difficulty}
                </span>
              </div>

              <p style={{ margin: '0', color: '#6b7280', fontSize: '16px' }}>
                {puzzle.currentPuzzle.description}
              </p>

              <div style={{ marginTop: '10px' }}>
                {puzzle.currentPuzzle.tags.map((tag) => (
                  <span
                    key={tag}
                    style={{
                      background: '#f3f4f6',
                      color: '#374151',
                      padding: '2px 8px',
                      borderRadius: '8px',
                      fontSize: '12px',
                      marginRight: '6px',
                      display: 'inline-block',
                    }}
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            </div>

            {/* Puzzle status */}
            <div
              style={{
                padding: '15px',
                borderRadius: '8px',
                marginBottom: '20px',
                background: puzzle.solved
                  ? '#f0fdf4'
                  : puzzle.hint.includes('❌')
                    ? '#fef2f2'
                    : puzzle.hint.includes('✅')
                      ? '#f0f9ff'
                      : '#f9fafb',
                border: `1px solid ${
                  puzzle.solved
                    ? '#bbf7d0'
                    : puzzle.hint.includes('❌')
                      ? '#fecaca'
                      : puzzle.hint.includes('✅')
                        ? '#bfdbfe'
                        : '#e5e7eb'
                }`,
              }}
            >
              <div style={{ fontWeight: '600', marginBottom: '8px' }}>
                Status: {puzzle.solved ? '🎉 Solved!' : 'In Progress'}
              </div>

              {puzzle.hint && (
                <div style={{ fontSize: '14px', color: '#6b7280' }}>{puzzle.hint}</div>
              )}

              <div style={{ fontSize: '14px', color: '#9ca3af', marginTop: '8px' }}>
                Progress: {puzzle.solutionIndex}/{puzzle.currentPuzzle.solution.length} moves
                {puzzle.attempts > 0 && ` • Attempts: ${puzzle.attempts}`}
              </div>
            </div>

            {/* Solution controls */}
            <div style={{ marginBottom: '20px' }}>
              <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
                <button
                  onClick={() => setShowSolution(!showSolution)}
                  style={{
                    padding: '8px 12px',
                    background: '#6b7280',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    fontSize: '14px',
                  }}
                >
                  {showSolution ? '🙈 Hide' : '💡 Show'} Solution
                </button>

                <button
                  onClick={puzzle.resetPuzzle}
                  style={{
                    padding: '8px 12px',
                    background: '#f59e0b',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    fontSize: '14px',
                  }}
                >
                  🔄 Reset
                </button>
              </div>

              {showSolution && (
                <div
                  style={{
                    background: '#fef3c7',
                    border: '1px solid #fcd34d',
                    borderRadius: '6px',
                    padding: '10px',
                    fontSize: '14px',
                  }}
                >
                  <strong>Solution:</strong>
                  <br />
                  {puzzle.currentPuzzle.solution.map((move, index) => (
                    <span
                      key={index}
                      style={{
                        marginRight: '8px',
                        fontFamily: 'monospace',
                        background: index < puzzle.solutionIndex ? '#dcfce7' : 'transparent',
                        padding: '2px 4px',
                        borderRadius: '3px',
                      }}
                    >
                      {index + 1}. {move}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Navigation */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={puzzle.previousPuzzle}
                  style={{
                    flex: 1,
                    padding: '10px',
                    background: '#374151',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                  }}
                >
                  ← Previous
                </button>

                <button
                  onClick={puzzle.nextPuzzle}
                  style={{
                    flex: 1,
                    padding: '10px',
                    background: '#374151',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                  }}
                >
                  Next →
                </button>
              </div>

              <div style={{ fontSize: '14px', textAlign: 'center', color: '#6b7280' }}>
                Puzzle {puzzle.currentPuzzleIndex + 1} of {chessPuzzles.length}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Puzzle grid */}
      <div
        style={{
          background: 'white',
          borderRadius: '12px',
          padding: '20px',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
        }}
      >
        <h3 style={{ margin: '0 0 20px 0', color: '#374151' }}>All Puzzles</h3>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
            gap: '15px',
          }}
        >
          {filteredPuzzles.map((puzzleItem) => {
            const actualIndex = chessPuzzles.findIndex((p) => p.id === puzzleItem.id);
            const isSolved = puzzle.solvedPuzzles.has(puzzleItem.id);
            const isCurrent = actualIndex === puzzle.currentPuzzleIndex;

            return (
              <div
                key={puzzleItem.id}
                onClick={() => puzzle.selectPuzzle(actualIndex)}
                style={{
                  padding: '15px',
                  border: `2px solid ${isCurrent ? '#3b82f6' : isSolved ? '#10b981' : '#e5e7eb'}`,
                  borderRadius: '8px',
                  background: isCurrent ? '#eff6ff' : isSolved ? '#f0fdf4' : 'white',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  position: 'relative',
                }}
                onMouseEnter={(e) => {
                  if (!isCurrent) {
                    e.currentTarget.style.borderColor = '#94a3b8';
                    e.currentTarget.style.transform = 'translateY(-2px)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isCurrent) {
                    e.currentTarget.style.borderColor = isSolved ? '#10b981' : '#e5e7eb';
                    e.currentTarget.style.transform = 'translateY(0)';
                  }
                }}
              >
                {isSolved && (
                  <div
                    style={{
                      position: 'absolute',
                      top: '10px',
                      right: '10px',
                      background: '#10b981',
                      color: 'white',
                      width: '20px',
                      height: '20px',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '12px',
                    }}
                  >
                    ✓
                  </div>
                )}

                <div
                  style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}
                >
                  <h4 style={{ margin: 0, color: '#374151' }}>{puzzleItem.title}</h4>
                  <span
                    style={{
                      background: difficultyColors[puzzleItem.difficulty],
                      color: 'white',
                      padding: '2px 6px',
                      borderRadius: '8px',
                      fontSize: '10px',
                      fontWeight: '600',
                      textTransform: 'uppercase',
                    }}
                  >
                    {puzzleItem.difficulty}
                  </span>
                </div>

                <p
                  style={{
                    margin: '0 0 10px 0',
                    fontSize: '14px',
                    color: '#6b7280',
                    lineHeight: '1.4',
                  }}
                >
                  {puzzleItem.description}
                </p>

                <div style={{ fontSize: '12px' }}>
                  {puzzleItem.tags.map((tag) => (
                    <span
                      key={tag}
                      style={{
                        background: '#f3f4f6',
                        color: '#6b7280',
                        padding: '2px 6px',
                        borderRadius: '6px',
                        marginRight: '4px',
                        display: 'inline-block',
                      }}
                    >
                      #{tag}
                    </span>
                  ))}
                </div>

                <div
                  style={{
                    marginTop: '10px',
                    fontSize: '12px',
                    color: '#9ca3af',
                    fontFamily: 'monospace',
                  }}
                >
                  Solution: {puzzleItem.solution.length} move
                  {puzzleItem.solution.length > 1 ? 's' : ''}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Statistics panel */}
      {puzzle.solvedPuzzles.size > 0 && (
        <div
          style={{
            background: 'white',
            borderRadius: '12px',
            padding: '20px',
            marginTop: '20px',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
          }}
        >
          <h3 style={{ margin: '0 0 15px 0', color: '#374151' }}>Your Statistics</h3>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
              gap: '20px',
            }}
          >
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#10b981' }}>
                {puzzle.solvedPuzzles.size}
              </div>
              <div style={{ fontSize: '14px', color: '#6b7280' }}>Puzzles Solved</div>
            </div>

            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#3b82f6' }}>
                {Math.round(progressPercentage)}%
              </div>
              <div style={{ fontSize: '14px', color: '#6b7280' }}>Completion</div>
            </div>

            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#f59e0b' }}>
                {
                  Array.from(puzzle.solvedPuzzles).filter((id) => {
                    const p = chessPuzzles.find((puzzle) => puzzle.id === id);
                    return p?.difficulty === 'advanced' || p?.difficulty === 'master';
                  }).length
                }
              </div>
              <div style={{ fontSize: '14px', color: '#6b7280' }}>Hard Puzzles</div>
            </div>

            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#8b5cf6' }}>
                {chessPuzzles.length - puzzle.solvedPuzzles.size}
              </div>
              <div style={{ fontSize: '14px', color: '#6b7280' }}>Remaining</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Puzzle creator component
export function PuzzleCreator() {
  const [customPuzzle, setCustomPuzzle] = useState({
    title: '',
    description: '',
    fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
    solution: [''],
    difficulty: 'beginner' as const,
    tags: [''],
  });

  const [testMode, setTestMode] = useState(false);

  const handleSolutionChange = (index: number, value: string) => {
    const newSolution = [...customPuzzle.solution];
    newSolution[index] = value;
    if (value && index === newSolution.length - 1) {
      newSolution.push(''); // Add empty slot for next move
    }
    setCustomPuzzle((prev) => ({
      ...prev,
      solution: newSolution.filter(
        (move) => move || newSolution.indexOf(move) < newSolution.length - 1,
      ),
    }));
  };

  const handleTagChange = (index: number, value: string) => {
    const newTags = [...customPuzzle.tags];
    newTags[index] = value;
    if (value && index === newTags.length - 1) {
      newTags.push(''); // Add empty slot for next tag
    }
    setCustomPuzzle((prev) => ({
      ...prev,
      tags: newTags.filter((tag) => tag || newTags.indexOf(tag) < newTags.length - 1),
    }));
  };

  const exportPuzzle = () => {
    const puzzle = {
      ...customPuzzle,
      id: `custom-${Date.now()}`,
      solution: customPuzzle.solution.filter((move) => move.trim()),
      tags: customPuzzle.tags.filter((tag) => tag.trim()),
    };

    const puzzleJson = JSON.stringify(puzzle, null, 2);

    const blob = new Blob([puzzleJson], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${puzzle.title.replace(/\s+/g, '-').toLowerCase()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '20px' }}>
      <h2>Chess Puzzle Creator</h2>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 400px', gap: '30px' }}>
        {/* Board preview */}
        <div>
          <h3>Puzzle Preview</h3>
          <NeoChessBoard
            position={customPuzzle.fen}
            theme="light"
            orientation="white"
            draggable={false}
          />
        </div>

        {/* Puzzle form */}
        <div style={{ background: '#f8fafc', padding: '20px', borderRadius: '8px' }}>
          <h3 style={{ margin: '0 0 15px 0' }}>Puzzle Details</h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600' }}>
                Title:
              </label>
              <input
                type="text"
                value={customPuzzle.title}
                onChange={(e) => setCustomPuzzle((prev) => ({ ...prev, title: e.target.value }))}
                placeholder="Enter puzzle title..."
                style={{ width: '100%', padding: '8px' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600' }}>
                Description:
              </label>
              <textarea
                value={customPuzzle.description}
                onChange={(e) =>
                  setCustomPuzzle((prev) => ({ ...prev, description: e.target.value }))
                }
                placeholder="Describe what the solver should do..."
                rows={3}
                style={{ width: '100%', padding: '8px' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600' }}>
                FEN Position:
              </label>
              <textarea
                value={customPuzzle.fen}
                onChange={(e) => setCustomPuzzle((prev) => ({ ...prev, fen: e.target.value }))}
                rows={2}
                style={{ width: '100%', padding: '8px', fontFamily: 'monospace', fontSize: '12px' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600' }}>
                Difficulty:
              </label>
              <select
                value={customPuzzle.difficulty}
                onChange={(e) =>
                  setCustomPuzzle((prev) => ({ ...prev, difficulty: e.target.value as any }))
                }
                style={{ width: '100%', padding: '8px' }}
              >
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
                <option value="master">Master</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600' }}>
                Solution Moves:
              </label>
              {customPuzzle.solution.map((move, index) => (
                <input
                  key={index}
                  type="text"
                  value={move}
                  onChange={(e) => handleSolutionChange(index, e.target.value)}
                  placeholder={`Move ${index + 1} (e.g., Nf3, Qh5+, O-O)`}
                  style={{
                    width: '100%',
                    padding: '6px',
                    marginBottom: '5px',
                    fontFamily: 'monospace',
                  }}
                />
              ))}
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600' }}>
                Tags:
              </label>
              {customPuzzle.tags.map((tag, index) => (
                <input
                  key={index}
                  type="text"
                  value={tag}
                  onChange={(e) => handleTagChange(index, e.target.value)}
                  placeholder={`Tag ${index + 1} (e.g., tactics, endgame)`}
                  style={{ width: '100%', padding: '6px', marginBottom: '5px' }}
                />
              ))}
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={() => setTestMode(!testMode)}
                style={{
                  flex: 1,
                  padding: '10px',
                  background: '#6366f1',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                }}
              >
                {testMode ? 'Stop Test' : 'Test Puzzle'}
              </button>

              <button
                onClick={exportPuzzle}
                disabled={!customPuzzle.title || !customPuzzle.solution.some((move) => move.trim())}
                style={{
                  flex: 1,
                  padding: '10px',
                  background:
                    customPuzzle.title && customPuzzle.solution.some((move) => move.trim())
                      ? '#10b981'
                      : '#d1d5db',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                }}
              >
                💾 Export
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ChessPuzzleApp;
