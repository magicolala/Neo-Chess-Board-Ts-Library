import type { PuzzleDefinition } from '../types';

export interface PuzzleStatusOverlayProps {
  puzzle: PuzzleDefinition;
  moveCursor: number;
  totalMoves: number;
  attempts: number;
  solvedIds: string[];
}

export function PuzzleStatusOverlay({
  puzzle,
  moveCursor,
  totalMoves,
  attempts,
  solvedIds,
}: PuzzleStatusOverlayProps) {
  return (
    <aside
      style={{
        background: 'rgba(0, 0, 0, 0.7)',
        color: '#fff',
        padding: '12px',
        borderRadius: '6px',
        fontSize: '0.9rem',
      }}
    >
      <header style={{ marginBottom: '4px' }}>
        <strong>{puzzle.title}</strong> · <span>{puzzle.difficulty}</span>
      </header>
      <p style={{ margin: 0 }}>Progress: {moveCursor}/{totalMoves} moves</p>
      <p style={{ margin: '4px 0 0' }}>Attempts: {attempts}</p>
      <p style={{ margin: '4px 0 0' }}>
        Solved: {solvedIds.length}/{solvedIds.length + (totalMoves - moveCursor > 0 ? 1 : 0)}
      </p>
    </aside>
  );
}
