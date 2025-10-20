import React, { useMemo, useState, useEffect } from 'react';
import { NeoChessBoard } from '../../../src/react';
import '../styles/playground.css';

type Orientation = 'white' | 'black';
type ThemeName = 'midnight' | 'classic';

interface PanelSection {
  id: string;
  title: string;
  content: React.ReactNode;
}

const buildOptionsSections = (): PanelSection[] => [
  {
    id: 'setup',
    title: 'Board setup',
    content: <p>Placeholder controls for configuring the board (FEN import, presets, etc.).</p>,
  },
  {
    id: 'interactions',
    title: 'Interactions',
    content: (
      <p>Toggle annotations, highlights, coordinates, and other interactive helpers here.</p>
    ),
  },
  {
    id: 'advanced',
    title: 'Advanced options',
    content: <p>Extra playground settings will appear here (engine hooks, timers, overlays).</p>,
  },
];

const buildOutputSections = (logs: string[]): PanelSection[] => [
  {
    id: 'logs',
    title: 'Logs',
    content: logs.length ? (
      <ul className="playground__log-list">
        {logs.map((entry) => (
          <li key={entry}>{entry}</li>
        ))}
      </ul>
    ) : (
      <p>No actions logged yet.</p>
    ),
  },
  {
    id: 'code',
    title: 'Generated code',
    content: (
      <pre className="playground__code-block">
        <code>{'// Code preview will appear here once options are wired.'}</code>
      </pre>
    ),
  },
];

const clampBoardSize = (size: number): number => {
  const MIN_SIZE = 280;
  const MAX_SIZE = 640;
  if (size < MIN_SIZE) {
    return MIN_SIZE;
  }
  if (size > MAX_SIZE) {
    return MAX_SIZE;
  }
  return size;
};

const getInitialBoardSize = (): number => {
  if (typeof window === 'undefined') {
    return 480;
  }

  return clampBoardSize(window.innerWidth - 120);
};

export const Playground: React.FC = () => {
  const [orientation, setOrientation] = useState<Orientation>('white');
  const [theme, setTheme] = useState<ThemeName>('midnight');
  const [boardKey, setBoardKey] = useState(0);
  const [logs, setLogs] = useState<string[]>([]);
  const [boardSize, setBoardSize] = useState<number>(() => getInitialBoardSize());

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const updateSize = () => {
      const availableWidth = window.innerWidth - 120;
      setBoardSize(clampBoardSize(availableWidth));
    };

    updateSize();
    window.addEventListener('resize', updateSize);

    return () => {
      window.removeEventListener('resize', updateSize);
    };
  }, []);

  const optionSections = useMemo(buildOptionsSections, []);
  const outputSections = useMemo(() => buildOutputSections(logs), [logs]);

  const pushLog = (label: string) => {
    setLogs((previous) => {
      const timestamp = new Date().toLocaleTimeString();
      const entry = `${timestamp} – ${label}`;
      return [entry, ...previous].slice(0, 8);
    });
  };

  const handleFlip = () => {
    setOrientation((current) => (current === 'white' ? 'black' : 'white'));
    pushLog('Board flipped');
  };

  const handleReset = () => {
    setBoardKey((value) => value + 1);
    setOrientation('white');
    pushLog('Board reset to initial position');
  };

  const handleStressTest = () => {
    pushLog('Stress test triggered');
  };

  const handleA11yAudit = () => {
    pushLog('Accessibility audit placeholder');
  };

  const handleThemeToggle = () => {
    setTheme((current) => {
      const nextTheme: ThemeName = current === 'midnight' ? 'classic' : 'midnight';
      return nextTheme;
    });
    pushLog('Theme toggled');
  };

  return (
    <div className="playground">
      <header className="playground__header">
        <div className="playground__brand">
          <h1>NeoChessBoard Playground</h1>
          <p>Experiment with layouts, themes, and integrations in a dedicated workspace.</p>
        </div>
        <div className="playground__actions" role="group" aria-label="Playground actions">
          <button type="button" onClick={handleFlip}>
            Flip
          </button>
          <button type="button" onClick={handleReset}>
            Reset
          </button>
          <button type="button" onClick={handleStressTest}>
            Stress Test
          </button>
          <button type="button" onClick={handleA11yAudit}>
            A11y
          </button>
          <button type="button" onClick={handleThemeToggle}>
            Theme
          </button>
        </div>
      </header>

      <main className="playground__content">
        <aside className="playground__panel playground__panel--left" aria-label="Options">
          <h2 className="playground__panel-title">Options</h2>
          {optionSections.map((section) => (
            <details key={section.id} className="playground__accordion" open>
              <summary>{section.title}</summary>
              <div className="playground__accordion-body">{section.content}</div>
            </details>
          ))}
        </aside>

        <section className="playground__board" aria-label="Chessboard">
          <div className="playground__board-frame">
            <NeoChessBoard
              key={boardKey}
              theme={theme}
              orientation={orientation}
              showSquareNames
              showArrows
              showHighlights
              highlightLegal
              allowPremoves
              soundEnabled
              size={boardSize}
            />
          </div>

          <div className="playground__mobile-panels" aria-live="polite">
            <section>
              <h2 className="playground__panel-title">Options</h2>
              {optionSections.map((section) => (
                <details key={`mobile-${section.id}`} className="playground__accordion">
                  <summary>{section.title}</summary>
                  <div className="playground__accordion-body">{section.content}</div>
                </details>
              ))}
            </section>
            <section>
              <h2 className="playground__panel-title">Outputs</h2>
              {outputSections.map((section) => (
                <details key={`mobile-${section.id}`} className="playground__accordion">
                  <summary>{section.title}</summary>
                  <div className="playground__accordion-body">{section.content}</div>
                </details>
              ))}
            </section>
          </div>
        </section>

        <aside className="playground__panel playground__panel--right" aria-label="Outputs">
          <h2 className="playground__panel-title">Outputs</h2>
          {outputSections.map((section) => (
            <details
              key={section.id}
              className="playground__accordion"
              open={section.id === 'logs'}
            >
              <summary>{section.title}</summary>
              <div className="playground__accordion-body">{section.content}</div>
            </details>
          ))}
        </aside>
      </main>
    </div>
  );
};

export default Playground;
