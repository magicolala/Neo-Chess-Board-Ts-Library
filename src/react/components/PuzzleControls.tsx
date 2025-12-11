import type { NeoChessRef } from '../NeoChessBoard';

interface PuzzleControlsProps {
  api: NeoChessRef | null;
  attempts: number;
  hintUsage: number;
  allowHints?: boolean;
}

export function PuzzleControls({
  api,
  attempts,
  hintUsage,
  allowHints = true,
}: PuzzleControlsProps) {
  const hintsDisabled = !allowHints || !api?.requestPuzzleHint;

  const requestTextHint = () => {
    if (!hintsDisabled) {
      api?.requestPuzzleHint?.('text');
    }
  };
  const requestHighlightHint = () => {
    if (!hintsDisabled) {
      api?.requestPuzzleHint?.('origin-highlight');
    }
  };

  return (
    <div
      style={{
        display: 'flex',
        gap: '0.5rem',
        alignItems: 'center',
        flexWrap: 'wrap',
      }}
    >
      <button
        type="button"
        disabled={hintsDisabled}
        onClick={requestTextHint}
        style={{ padding: '0.4rem 0.75rem', borderRadius: 4 }}
      >
        Show Hint
      </button>
      <button
        type="button"
        disabled={hintsDisabled}
        onClick={requestHighlightHint}
        style={{ padding: '0.4rem 0.75rem', borderRadius: 4 }}
      >
        Highlight Next Move
      </button>
      <span>Attempts: {attempts}</span>
      <span>Hints used: {hintUsage}</span>
      {!allowHints && <span style={{ color: '#d97706' }}>Hints disabled for this puzzle.</span>}
    </div>
  );
}
