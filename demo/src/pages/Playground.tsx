import React, { useMemo, useState, useEffect, useCallback, useRef } from 'react';
import { NeoChessBoard } from '../../../src/react';
import type { NeoChessRef } from '../../../src/react';
import { THEMES } from '../../../src/core/themes';
import {
  usePlaygroundState,
  usePlaygroundActions,
  type PlaygroundState,
  type ThemeName,
} from '../state/playgroundStore';
import '../styles/playground.css';
import {
  DEFAULT_ORIENTATION,
  clearPlaygroundPermalink,
  parsePlaygroundPermalink,
  syncPlaygroundPermalink,
  type PlaygroundOrientation,
} from '../utils/permalink';
import type { BoardEventMap } from '../../../src/core/types';
import PgnPanel from '../components/PgnPanel';

interface PanelSection {
  id: string;
  title: string;
  content: React.ReactNode;
}

interface PlaygroundControlHandlers {
  onThemeChange: React.ChangeEventHandler<HTMLSelectElement>;
  onShowCoordinatesChange: React.ChangeEventHandler<HTMLInputElement>;
  onHighlightLegalChange: React.ChangeEventHandler<HTMLInputElement>;
  onInteractiveChange: React.ChangeEventHandler<HTMLInputElement>;
  onAutoFlipChange: React.ChangeEventHandler<HTMLInputElement>;
  onAllowDrawingArrowsChange: React.ChangeEventHandler<HTMLInputElement>;
  onAnimationDurationChange: React.ChangeEventHandler<HTMLInputElement>;
  onDragActivationDistanceChange: React.ChangeEventHandler<HTMLInputElement>;
}

interface BuildOptionsArgs {
  state: PlaygroundState;
  themeOptions: ThemeName[];
  handlers: PlaygroundControlHandlers;
}

const controlStackStyles: React.CSSProperties = {
  display: 'grid',
  gap: '0.75rem',
};

const themeControlStyles: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '0.4rem',
  padding: '0.75rem 1rem',
  borderRadius: '0.85rem',
  border: '1px solid var(--playground-border)',
  backgroundColor: 'rgba(15, 23, 42, 0.55)',
};

const selectControlStyles: React.CSSProperties = {
  width: '100%',
  padding: '0.5rem 0.75rem',
  borderRadius: '0.65rem',
  border: '1px solid var(--playground-border)',
  backgroundColor: 'rgba(15, 23, 42, 0.85)',
  color: 'var(--playground-text)',
  fontSize: '0.95rem',
};

const toggleRowStyles: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: '0.85rem',
  padding: '0.75rem 1rem',
  borderRadius: '0.85rem',
  border: '1px solid var(--playground-border)',
  backgroundColor: 'rgba(15, 23, 42, 0.55)',
  cursor: 'pointer',
};

const toggleTextBlockStyles: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '0.25rem',
  flex: '1 1 auto',
};

const toggleTitleStyles: React.CSSProperties = {
  fontWeight: 600,
  color: 'var(--playground-text)',
  letterSpacing: '0.01em',
};

const toggleDescriptionStyles: React.CSSProperties = {
  fontSize: '0.8rem',
  color: 'var(--playground-muted)',
};

const checkboxInputStyles: React.CSSProperties = {
  width: '1.25rem',
  height: '1.25rem',
  accentColor: '#6366f1',
};

const sliderContainerStyles: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '0.5rem',
  padding: '0.75rem 1rem',
  borderRadius: '0.85rem',
  border: '1px solid var(--playground-border)',
  backgroundColor: 'rgba(15, 23, 42, 0.55)',
};

const sliderHeaderStyles: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: '0.75rem',
};

const sliderValueStyles: React.CSSProperties = {
  fontSize: '0.75rem',
  fontWeight: 600,
  padding: '0.2rem 0.6rem',
  borderRadius: '999px',
  backgroundColor: 'rgba(99, 102, 241, 0.25)',
  color: 'var(--playground-text)',
};

const rangeInputStyles: React.CSSProperties = {
  width: '100%',
  accentColor: '#6366f1',
};

const formatThemeLabel = (value: string): string => value.charAt(0).toUpperCase() + value.slice(1);

const renderThemeControl = (
  currentTheme: ThemeName,
  themeOptions: ThemeName[],
  onChange: React.ChangeEventHandler<HTMLSelectElement>,
): React.ReactElement => (
  <label style={themeControlStyles}>
    <span style={toggleTitleStyles}>Theme</span>
    <span style={toggleDescriptionStyles}>
      Switch between the available board palettes in real time.
    </span>
    <select style={selectControlStyles} value={currentTheme} onChange={onChange}>
      {themeOptions.map((themeOption) => (
        <option key={themeOption} value={themeOption}>
          {formatThemeLabel(themeOption)}
        </option>
      ))}
    </select>
  </label>
);

const renderToggle = (
  label: string,
  description: string,
  checked: boolean,
  onChange: React.ChangeEventHandler<HTMLInputElement>,
): React.ReactElement => (
  <label style={toggleRowStyles}>
    <span style={toggleTextBlockStyles}>
      <span style={toggleTitleStyles}>{label}</span>
      <span style={toggleDescriptionStyles}>{description}</span>
    </span>
    <input type="checkbox" style={checkboxInputStyles} checked={checked} onChange={onChange} />
  </label>
);

const renderSlider = (
  label: string,
  valueLabel: string,
  description: string,
  value: number,
  options: { min: number; max: number; step: number },
  onChange: React.ChangeEventHandler<HTMLInputElement>,
): React.ReactElement => (
  <label style={sliderContainerStyles}>
    <span style={sliderHeaderStyles}>
      <span style={toggleTitleStyles}>{label}</span>
      <span style={sliderValueStyles}>{valueLabel}</span>
    </span>
    <span style={toggleDescriptionStyles}>{description}</span>
    <input
      type="range"
      style={rangeInputStyles}
      value={value}
      min={options.min}
      max={options.max}
      step={options.step}
      onChange={onChange}
    />
  </label>
);

const buildOptionsSections = ({
  state,
  themeOptions,
  handlers,
}: BuildOptionsArgs): PanelSection[] => [
  {
    id: 'setup',
    title: 'Board setup',
    content: (
      <div style={controlStackStyles}>
        {renderThemeControl(state.theme, themeOptions, handlers.onThemeChange)}
        {renderToggle(
          'Show coordinates',
          'Display algebraic notation along the board borders.',
          state.showCoordinates,
          handlers.onShowCoordinatesChange,
        )}
      </div>
    ),
  },
  {
    id: 'interactions',
    title: 'Interactions',
    content: (
      <div style={controlStackStyles}>
        {renderToggle(
          'Interactive mode',
          'Allow pointer interactions such as dragging pieces and hovering.',
          state.interactive,
          handlers.onInteractiveChange,
        )}
        {renderToggle(
          'Highlight legal moves',
          'Emphasize the valid destinations for the selected piece.',
          state.highlightLegal,
          handlers.onHighlightLegalChange,
        )}
        {renderToggle(
          'Auto flip orientation',
          'Rotate the board automatically after every move turn.',
          state.autoFlip,
          handlers.onAutoFlipChange,
        )}
        {renderToggle(
          'Allow drawing arrows',
          'Enable training annotations by holding the right mouse button.',
          state.allowDrawingArrows,
          handlers.onAllowDrawingArrowsChange,
        )}
      </div>
    ),
  },
  {
    id: 'advanced',
    title: 'Advanced options',
    content: (
      <div style={controlStackStyles}>
        {renderSlider(
          'Animation duration',
          `${state.animationDurationInMs} ms`,
          'Control how long move animations take when pieces slide across the board.',
          state.animationDurationInMs,
          { min: 0, max: 2000, step: 50 },
          handlers.onAnimationDurationChange,
        )}
        {renderSlider(
          'Drag activation distance',
          `${state.dragActivationDistance} px`,
          'Require the pointer to travel this distance before starting a drag operation.',
          state.dragActivationDistance,
          { min: 0, max: 48, step: 1 },
          handlers.onDragActivationDistanceChange,
        )}
      </div>
    ),
  },
];

const buildOutputSections = (logs: string[], pgnPanel: React.ReactNode): PanelSection[] => [
  {
    id: 'pgn',
    title: 'PGN',
    content: pgnPanel,
  },
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
  const permalinkSnapshot = useMemo(() => {
    if (typeof window === 'undefined') {
      return {};
    }

    return parsePlaygroundPermalink(window.location.search);
  }, []);

  const [orientation, setOrientation] = useState<PlaygroundOrientation>(
    permalinkSnapshot.orientation ?? DEFAULT_ORIENTATION,
  );
  const [boardKey, setBoardKey] = useState(0);
  const [logs, setLogs] = useState<string[]>([]);
  const [boardSize, setBoardSize] = useState<number>(() => getInitialBoardSize());
  const [pgn, setPgn] = useState('');
  const boardRef = useRef<NeoChessRef | null>(null);

  const boardOptions = usePlaygroundState();
  const { update: updateBoardOptions, reset: resetBoardOptions } = usePlaygroundActions();

  useEffect(() => {
    if (!permalinkSnapshot.state) {
      return;
    }

    updateBoardOptions(permalinkSnapshot.state);
  }, [permalinkSnapshot.state, updateBoardOptions]);

  useEffect(() => {
    syncPlaygroundPermalink({
      orientation,
      state: boardOptions,
    });
  }, [orientation, boardOptions]);

  const themeOptions = useMemo(() => Object.keys(THEMES) as ThemeName[], []);

  const {
    theme,
    showCoordinates,
    highlightLegal,
    interactive,
    autoFlip,
    allowDrawingArrows,
    animationDurationInMs,
    dragActivationDistance,
  } = boardOptions;

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

  const pushLog = useCallback((label: string) => {
    setLogs((previous) => {
      const timestamp = new Date().toLocaleTimeString();
      const entry = `${timestamp} – ${label}`;
      return [entry, ...previous].slice(0, 8);
    });
  }, []);

  const handleThemeChange = useCallback<React.ChangeEventHandler<HTMLSelectElement>>(
    (event) => {
      const nextTheme = event.target.value as ThemeName;
      updateBoardOptions({ theme: nextTheme });
      pushLog(`Theme changed to ${formatThemeLabel(nextTheme)}`);
    },
    [updateBoardOptions, pushLog],
  );

  const handleShowCoordinatesChange = useCallback<React.ChangeEventHandler<HTMLInputElement>>(
    (event) => {
      updateBoardOptions({ showCoordinates: event.target.checked });
    },
    [updateBoardOptions],
  );

  const handleHighlightLegalChange = useCallback<React.ChangeEventHandler<HTMLInputElement>>(
    (event) => {
      updateBoardOptions({ highlightLegal: event.target.checked });
    },
    [updateBoardOptions],
  );

  const handleInteractiveChange = useCallback<React.ChangeEventHandler<HTMLInputElement>>(
    (event) => {
      updateBoardOptions({ interactive: event.target.checked });
    },
    [updateBoardOptions],
  );

  const handleAutoFlipChange = useCallback<React.ChangeEventHandler<HTMLInputElement>>(
    (event) => {
      updateBoardOptions({ autoFlip: event.target.checked });
    },
    [updateBoardOptions],
  );

  const handleAllowDrawingArrowsChange = useCallback<React.ChangeEventHandler<HTMLInputElement>>(
    (event) => {
      updateBoardOptions({ allowDrawingArrows: event.target.checked });
    },
    [updateBoardOptions],
  );

  const handleAnimationDurationChange = useCallback<React.ChangeEventHandler<HTMLInputElement>>(
    (event) => {
      const nextValue = Number(event.target.value);
      if (Number.isFinite(nextValue)) {
        updateBoardOptions({ animationDurationInMs: nextValue });
      }
    },
    [updateBoardOptions],
  );

  const handleDragActivationDistanceChange = useCallback<
    React.ChangeEventHandler<HTMLInputElement>
  >(
    (event) => {
      const nextValue = Number(event.target.value);
      if (Number.isFinite(nextValue)) {
        updateBoardOptions({ dragActivationDistance: nextValue });
      }
    },
    [updateBoardOptions],
  );

  const optionSections = useMemo(
    () =>
      buildOptionsSections({
        state: boardOptions,
        themeOptions,
        handlers: {
          onThemeChange: handleThemeChange,
          onShowCoordinatesChange: handleShowCoordinatesChange,
          onHighlightLegalChange: handleHighlightLegalChange,
          onInteractiveChange: handleInteractiveChange,
          onAutoFlipChange: handleAutoFlipChange,
          onAllowDrawingArrowsChange: handleAllowDrawingArrowsChange,
          onAnimationDurationChange: handleAnimationDurationChange,
          onDragActivationDistanceChange: handleDragActivationDistanceChange,
        },
      }),
    [
      boardOptions,
      themeOptions,
      handleThemeChange,
      handleShowCoordinatesChange,
      handleHighlightLegalChange,
      handleInteractiveChange,
      handleAutoFlipChange,
      handleAllowDrawingArrowsChange,
      handleAnimationDurationChange,
      handleDragActivationDistanceChange,
    ],
  );

  const exportPgnFromBoard = useCallback((): string => {
    const board = boardRef.current?.getBoard();
    if (!board) {
      return '';
    }
    const withRules = board as unknown as {
      rules?: { getPgnNotation?: () => { toPgnWithAnnotations?: () => string } | null };
    };
    const notation = withRules.rules?.getPgnNotation?.();
    if (notation && typeof notation.toPgnWithAnnotations === 'function') {
      return notation.toPgnWithAnnotations();
    }
    if (typeof board.exportPgnWithAnnotations === 'function') {
      return board.exportPgnWithAnnotations();
    }
    if (typeof board.exportPGN === 'function') {
      return board.exportPGN();
    }
    return '';
  }, []);

  const outputSections = useMemo(
    () =>
      buildOutputSections(
        logs,
        <PgnPanel boardRef={boardRef} pgn={pgn} onPgnChange={setPgn} onLog={pushLog} />,
      ),
    [boardRef, logs, pgn, pushLog],
  );

  const handleFlip = useCallback(() => {
    setOrientation((current) => (current === 'white' ? 'black' : 'white'));
    pushLog('Board flipped');
  }, [pushLog]);

  const handleReset = useCallback(() => {
    setBoardKey((value) => value + 1);
    setOrientation(DEFAULT_ORIENTATION);
    resetBoardOptions();
    clearPlaygroundPermalink();
    setPgn('');
    pushLog('Board reset and controls restored to defaults');
  }, [resetBoardOptions, pushLog]);

  const handleStressTest = useCallback(() => {
    pushLog('Stress test triggered');
  }, [pushLog]);

  const handleA11yAudit = useCallback(() => {
    pushLog('Accessibility audit placeholder');
  }, [pushLog]);

  const handleThemeToggle = useCallback(() => {
    if (themeOptions.length === 0) {
      return;
    }
    const currentIndex = themeOptions.indexOf(theme);
    const nextIndex = currentIndex >= 0 ? (currentIndex + 1) % themeOptions.length : 0;
    const nextTheme = themeOptions[nextIndex];
    updateBoardOptions({ theme: nextTheme });
    pushLog(`Theme changed to ${formatThemeLabel(nextTheme)}`);
  }, [themeOptions, theme, updateBoardOptions, pushLog]);

  const handleBoardMove = useCallback(
    (event: BoardEventMap['move']) => {
      setPgn(exportPgnFromBoard());
      pushLog(`Move played from ${event.from} to ${event.to}`);
    },
    [exportPgnFromBoard, pushLog],
  );

  const handleBoardUpdate = useCallback(() => {
    setPgn(exportPgnFromBoard());
  }, [exportPgnFromBoard]);

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
              ref={boardRef}
              key={boardKey}
              theme={theme}
              orientation={orientation}
              showCoordinates={showCoordinates}
              showSquareNames={showCoordinates}
              highlightLegal={highlightLegal}
              interactive={interactive}
              autoFlip={autoFlip}
              allowDrawingArrows={allowDrawingArrows}
              animationDurationInMs={animationDurationInMs}
              dragActivationDistance={dragActivationDistance}
              showArrows
              showHighlights
              allowPremoves
              soundEnabled
              size={boardSize}
              onMove={handleBoardMove}
              onUpdate={handleBoardUpdate}
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
