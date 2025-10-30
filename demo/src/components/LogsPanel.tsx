import React, { useEffect, useMemo, useRef } from 'react';

interface LogsPanelProps {
  logs: string[];
  onClear?: () => void;
}

const panelStyles: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '0.75rem',
};

const toolbarStyles: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  gap: '0.5rem',
};

const clearButtonStyles: React.CSSProperties = {
  appearance: 'none',
  border: '1px solid rgba(99, 102, 241, 0.4)',
  borderRadius: '999px',
  padding: '0.35rem 0.9rem',
  background: 'rgba(99, 102, 241, 0.16)',
  color: 'var(--playground-text)',
  fontWeight: 600,
  letterSpacing: '0.01em',
  cursor: 'pointer',
  transition: 'background 0.2s ease, box-shadow 0.2s ease, transform 0.2s ease',
};

const logViewportStyles: React.CSSProperties = {
  position: 'relative',
  border: '1px solid var(--playground-border)',
  borderRadius: '0.85rem',
  backgroundColor: 'rgba(15, 23, 42, 0.55)',
  padding: '0.75rem 1rem',
  maxHeight: '260px',
  overflowY: 'auto',
};

const emptyStateStyles: React.CSSProperties = {
  margin: 0,
  fontSize: '0.85rem',
  color: 'var(--playground-muted)',
};

const srOnlyStyles: React.CSSProperties = {
  position: 'absolute',
  width: '1px',
  height: '1px',
  padding: 0,
  margin: '-1px',
  overflow: 'hidden',
  clip: 'rect(0, 0, 0, 0)',
  whiteSpace: 'nowrap',
  border: 0,
};

const LogsPanel: React.FC<LogsPanelProps> = ({ logs, onClear }) => {
  const viewportRef = useRef<HTMLDivElement>(null);
  const liveRegionRef = useRef<HTMLDivElement>(null);
  const lastEntry = useMemo(() => (logs.length > 0 ? logs.at(-1) : ''), [logs]);

  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) {
      return;
    }

    viewport.scrollTop = viewport.scrollHeight;
  }, [logs]);

  useEffect(() => {
    if (!liveRegionRef.current) {
      return;
    }

    liveRegionRef.current.textContent = lastEntry;
  }, [lastEntry]);

  const handleClear = (): void => {
    onClear?.();
  };

  const clearButtonDynamicStyles = useMemo(() => {
    return {
      ...clearButtonStyles,
      opacity: logs.length > 0 ? 1 : 0.5,
      cursor: logs.length > 0 ? 'pointer' : 'not-allowed',
    };
  }, [logs.length]);

  return (
    <div style={panelStyles}>
      <div style={toolbarStyles}>
        <span aria-hidden="true">Console</span>
        <button
          type="button"
          onClick={handleClear}
          style={clearButtonDynamicStyles}
          disabled={logs.length === 0}
        >
          Clear
        </button>
      </div>
      <div
        ref={viewportRef}
        style={logViewportStyles}
        role="log"
        aria-live="polite"
        aria-relevant="additions"
        aria-atomic="false"
        aria-label="Activity log"
      >
        <div ref={liveRegionRef} aria-live="polite" aria-atomic="true" style={srOnlyStyles} />
        {logs.length > 0 ? (
          <ul className="playground__log-list">
            {logs.map((entry, index) => (
              <li key={`${index}-${entry}`}>{entry}</li>
            ))}
          </ul>
        ) : (
          <p style={emptyStateStyles}>No actions logged yet.</p>
        )}
      </div>
    </div>
  );
};

export default LogsPanel;
