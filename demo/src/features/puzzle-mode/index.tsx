import { NeoChessBoard } from 'neo-chess-board/react';

export function PuzzleModeDemoPlaceholder() {
  return (
    <section style={{ padding: '1rem' }}>
      <h2>Puzzle Mode (WIP)</h2>
      <p>This demo will showcase Puzzle Mode once implementation tasks are complete.</p>
      <NeoChessBoard puzzleMode={undefined} />
    </section>
  );
}
