interface ProgressPanelProps {
  total: number;
  solved: number;
  attempts: number;
  hintUsage: number;
  status: string;
  lastHint?: string | null;
  warning?: string | null;
}

export function ProgressPanel({
  total,
  solved,
  attempts,
  hintUsage,
  status,
  lastHint,
  warning,
}: ProgressPanelProps) {
  const progress = total === 0 ? 0 : Math.round((solved / total) * 100);

  return (
    <section
      style={{
        background: '#020617',
        color: '#f1f5f9',
        padding: '1.5rem',
        borderRadius: 24,
        boxShadow: '0 30px 80px rgba(2, 6, 23, 0.4)',
        minHeight: 360,
      }}
    >
      <header>
        <p style={{ margin: 0, color: '#94a3b8' }}>Session summary</p>
        <h2 style={{ margin: '0.25rem 0 1rem' }}>Progress tracker</h2>
      </header>
      <div
        style={{
          background: '#1e293b',
          borderRadius: 999,
          height: 12,
          overflow: 'hidden',
          marginBottom: '0.5rem',
        }}
      >
        <div
          style={{
            width: `${progress}%`,
            height: '100%',
            background: 'linear-gradient(90deg, #22d3ee, #6366f1)',
            transition: 'width 200ms ease',
          }}
        />
      </div>
      <strong style={{ fontSize: '1.5rem' }}>{progress}%</strong>
      <p style={{ marginTop: 0, color: '#94a3b8' }}>
        {solved} of {total} puzzles solved
      </p>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, minmax(120px, 1fr))',
          gap: '1rem',
          margin: '1.25rem 0',
        }}
      >
        <Metric label="Attempts" value={attempts} />
        <Metric label="Hints used" value={hintUsage} />
      </div>

      <p style={{ marginTop: 0 }}>{status}</p>
      {lastHint && (
        <p style={{ color: '#22d3ee' }}>
          <strong>Last hint:</strong> {lastHint}
        </p>
      )}
      {warning && (
        <p style={{ color: '#fbbf24' }}>
          <strong>Persistence warning:</strong> {warning}
        </p>
      )}
    </section>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <article
      style={{
        borderRadius: 20,
        border: '1px solid rgba(255,255,255,0.08)',
        padding: '0.75rem 1rem',
      }}
    >
      <p style={{ margin: 0, color: '#94a3b8' }}>{label}</p>
      <strong style={{ fontSize: '1.5rem' }}>{value}</strong>
    </article>
  );
}
