import type { CSSProperties } from 'react';

export function PuzzleApiNotes() {
  const cardStyle: CSSProperties = {
    marginTop: '2rem',
    padding: '1.5rem',
    borderRadius: 16,
    background: 'rgba(15, 23, 42, 0.45)',
    border: '1px solid rgba(148, 163, 184, 0.2)',
  };

  const listStyle: CSSProperties = {
    margin: '0.75rem 0',
    paddingLeft: '1.25rem',
    color: '#cbd5e1',
  };

  return (
    <section style={cardStyle}>
      <h2 style={{ marginTop: 0, fontSize: '1.35rem' }}>Host integration notes</h2>
      <p style={{ marginBottom: '0.75rem', color: '#94a3b8' }}>
        Puzzle Mode emits typed events so hosts can log analytics, store progress remotely, or
        hydrate dashboards. Each event is documented in{' '}
        <code>specs/002-puzzle-mode/contracts/puzzle-mode.openapi.yaml</code>.
      </p>
      <ul style={listStyle}>
        <li>
          <strong>Telemetry hook:</strong> pass <code>puzzleMode.onPuzzleEvent</code> or the React
          prop <code>onPuzzleEvent</code> to receive every puzzle lifecycle event in one place.
        </li>
        <li>
          <strong>Persistence warnings:</strong> listen to <code>puzzle:persistence-warning</code>{' '}
          to detect private browsing quotas and offer host-side storage fallbacks.
        </li>
        <li>
          <strong>Attempt tracking:</strong> <code>puzzle:move</code> includes the running attempt
          count so you can send metrics to the endpoints described in the OpenAPI contract.
        </li>
        <li>
          <strong>Hint usage:</strong> <code>puzzle:hint</code> exposes the hint type and payload,
          letting you meter assistance or bill for help requests.
        </li>
      </ul>
      <p style={{ color: '#94a3b8' }}>Example handler:</p>
      <pre
        style={{
          background: '#0f172a',
          borderRadius: 12,
          padding: '1rem',
          overflowX: 'auto',
          fontSize: '0.85rem',
        }}
      >
        <code>
          {`puzzleMode={{
  collectionId: 'demo-tactics',
  puzzles,
  onPuzzleEvent: ({ type, payload }) => {
    fetch('/puzzle-sessions/telemetry', {
      method: 'POST',
      body: JSON.stringify({ type, payload }),
    });
  },
}}`}
        </code>
      </pre>
    </section>
  );
}
