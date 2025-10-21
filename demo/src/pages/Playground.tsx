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
import LogsPanel from '../components/LogsPanel';
import CodePanel from '../components/CodePanel';
import PerfPanel from '../components/PerfPanel';
import { buildPlaygroundSnippets } from '../utils/snippetBuilder';

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

const buildOutputSections = (
  logs: string[],
  pgnPanel: React.ReactNode,
  codePanel: React.ReactNode,
  onClearLogs: () => void,
  perfPanel?: React.ReactNode,
): PanelSection[] => {
  const sections: PanelSection[] = [
    {
      id: 'pgn',
      title: 'PGN',
      content: pgnPanel,
    },
    {
      id: 'logs',
      title: 'Logs',
      content: <LogsPanel logs={logs} onClear={onClearLogs} />,
    },
    {
      id: 'code',
      title: 'Generated code',
      content: codePanel,
    },
  ];

  if (perfPanel) {
    sections.push({
      id: 'perf',
      title: 'Performance',
      content: perfPanel,
    });
  }

  return sections;
};

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

const STRESS_TEST_CYCLE: readonly string[] = ['Nf3', 'Nf6', 'Ng1', 'Ng8'] as const;

const STRESS_TEST_MOVES: readonly string[] = (() => {
  const moves: string[] = [];
  for (let i = 0; i < 50; i += 1) {
    moves.push(...STRESS_TEST_CYCLE);
  }
  return moves;
})();

const STRESS_TEST_MOVE_DELAY_MS = 160;
const STRESS_TEST_INITIAL_DELAY_MS = 240;
const STRESS_TEST_DEFAULT_RESIZE_MIN = 320;
const STRESS_TEST_DEFAULT_RESIZE_MAX = 600;
const STRESS_TEST_RESIZE_STEP = 40;
const STRESS_TEST_DEFAULT_RESIZE_INTERVAL_MS = 420;
const STRESS_TEST_DEFAULT_RESIZE_ANIMATION_MS = 180;
const PERF_PANEL_ID = 'playground-perf-panel';

interface StressTestBoardApi {
  submitMove?: (notation: string) => boolean;
  reset?: (immediate?: boolean) => void;
}

interface StressTestRunState {
  board: StressTestBoardApi;
  moveIndex: number;
  moveTimeoutId?: number;
  resizeTimeoutId?: number;
  rafId?: number;
  resizeIndex: number;
  resizeDirection: 1 | -1;
  resizeLoopEnabled: boolean;
  resizeWidths: number[];
  resizeIntervalMs: number;
  resizeAnimationMs: number;
  originalOrientation: PlaygroundOrientation;
  originalOptions: PlaygroundState;
  originalBoardSize: number;
}

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
  const [isStressTestRunning, setIsStressTestRunning] = useState(false);
  const [isPerfPanelVisible, setIsPerfPanelVisible] = useState(false);
  const [showFpsBadge, setShowFpsBadge] = useState(false);
  const [showDirtyOverlay, setShowDirtyOverlay] = useState(false);
  const [stressResizeEnabled, setStressResizeEnabled] = useState(true);
  const [stressResizeIntervalMs, setStressResizeIntervalMs] = useState(
    STRESS_TEST_DEFAULT_RESIZE_INTERVAL_MS,
  );
  const [stressResizeAnimationMs, setStressResizeAnimationMs] = useState(
    STRESS_TEST_DEFAULT_RESIZE_ANIMATION_MS,
  );
  const [stressResizeMinWidth, setStressResizeMinWidth] = useState(STRESS_TEST_DEFAULT_RESIZE_MIN);
  const [stressResizeMaxWidth, setStressResizeMaxWidth] = useState(STRESS_TEST_DEFAULT_RESIZE_MAX);
  const [fpsSample, setFpsSample] = useState<number | null>(null);
  const boardRef = useRef<NeoChessRef | null>(null);
  const stressTestStateRef = useRef<StressTestRunState | null>(null);
  const boardSizeRef = useRef(boardSize);

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

  useEffect(() => {
    boardSizeRef.current = boardSize;
  }, [boardSize]);

  const themeOptions = useMemo(() => Object.keys(THEMES) as ThemeName[], []);

  const codeSnippets = useMemo(
    () => buildPlaygroundSnippets({ state: boardOptions, orientation }),
    [boardOptions, orientation],
  );

  const codePanelElement = useMemo(() => <CodePanel snippets={codeSnippets} />, [codeSnippets]);

  const stressResizeWidths = useMemo(() => {
    if (!stressResizeEnabled) {
      return [] as number[];
    }

    const normalizedMin = clampBoardSize(Math.min(stressResizeMinWidth, stressResizeMaxWidth));
    const normalizedMax = clampBoardSize(Math.max(stressResizeMinWidth, stressResizeMaxWidth));

    const widths: number[] = [];
    for (let size = normalizedMin; size <= normalizedMax; size += STRESS_TEST_RESIZE_STEP) {
      widths.push(clampBoardSize(size));
    }

    const lastWidth = widths[widths.length - 1];
    if (!lastWidth || lastWidth !== normalizedMax) {
      widths.push(normalizedMax);
    }

    return widths;
  }, [stressResizeEnabled, stressResizeMinWidth, stressResizeMaxWidth]);

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

  useEffect(() => {
    if (!showFpsBadge) {
      setFpsSample(null);
      return;
    }

    if (typeof window === 'undefined' || typeof window.requestAnimationFrame !== 'function') {
      setFpsSample(null);
      return;
    }

    let frameCount = 0;
    let animationFrameId: number;
    let lastTime =
      typeof performance !== 'undefined' && typeof performance.now === 'function'
        ? performance.now()
        : Date.now();

    const measure = (timestamp: number) => {
      frameCount += 1;
      const elapsed = timestamp - lastTime;
      if (elapsed >= 500) {
        const fpsValue = Math.round((frameCount * 1000) / elapsed);
        setFpsSample(fpsValue);
        frameCount = 0;
        lastTime = timestamp;
      }
      animationFrameId = window.requestAnimationFrame(measure);
    };

    animationFrameId = window.requestAnimationFrame(measure);

    return () => {
      if (typeof animationFrameId === 'number') {
        window.cancelAnimationFrame(animationFrameId);
      }
      setFpsSample(null);
    };
  }, [showFpsBadge]);

  const cancelStressTestTimers = useCallback(() => {
    const state = stressTestStateRef.current;
    if (!state) {
      return;
    }

    if (typeof state.moveTimeoutId === 'number') {
      window.clearTimeout(state.moveTimeoutId);
      state.moveTimeoutId = undefined;
    }

    if (typeof state.resizeTimeoutId === 'number') {
      window.clearTimeout(state.resizeTimeoutId);
      state.resizeTimeoutId = undefined;
    }

    if (typeof state.rafId === 'number') {
      window.cancelAnimationFrame(state.rafId);
      state.rafId = undefined;
    }
  }, []);

  const pushLog = useCallback((label: string) => {
    setLogs((previous) => {
      const timestamp = new Date().toLocaleTimeString();
      const entry = `${timestamp} – ${label}`;
      return [...previous, entry];
    });
  }, []);

  const stopStressTest = useCallback(
    (message?: string, options?: { silent?: boolean }) => {
      const state = stressTestStateRef.current;
      if (!state) {
        return;
      }

      cancelStressTestTimers();

      stressTestStateRef.current = null;
      setIsStressTestRunning(false);
      const restoredSize = clampBoardSize(state.originalBoardSize);
      setBoardSize(restoredSize);
      boardSizeRef.current = restoredSize;
      setOrientation(state.originalOrientation);
      updateBoardOptions(() => ({ ...state.originalOptions }));
      if (typeof state.board.reset === 'function') {
        state.board.reset(true);
      }

      if (!options?.silent) {
        if (message) {
          pushLog(message);
        }
        pushLog('Stress test finished');
      }
    },
    [cancelStressTestTimers, pushLog, setOrientation, updateBoardOptions],
  );

  useEffect(
    () => () => {
      cancelStressTestTimers();
      stressTestStateRef.current = null;
    },
    [cancelStressTestTimers],
  );

  const handleClearLogs = useCallback(() => {
    setLogs([]);
  }, []);

  const handleShowFpsBadgeChange = useCallback(
    (next: boolean) => {
      setShowFpsBadge(next);
      pushLog(`FPS badge ${next ? 'enabled' : 'disabled'}.`);
    },
    [pushLog],
  );

  const handleShowDirtyOverlayChange = useCallback(
    (next: boolean) => {
      setShowDirtyOverlay(next);
      pushLog(`Dirty rectangle overlay ${next ? 'enabled' : 'disabled'}.`);
    },
    [pushLog],
  );

  const handleStressResizeEnabledChange = useCallback(
    (next: boolean) => {
      setStressResizeEnabled(next);
      pushLog(`Stress test resize loop ${next ? 'enabled' : 'disabled'}.`);
    },
    [pushLog],
  );

  const handleStressResizeIntervalChange = useCallback((next: number) => {
    setStressResizeIntervalMs((value) => {
      const clamped = Math.max(120, Math.min(1500, Math.round(next)));
      return value === clamped ? value : clamped;
    });
  }, []);

  const handleStressResizeAnimationChange = useCallback((next: number) => {
    setStressResizeAnimationMs((value) => {
      const clamped = Math.max(60, Math.min(600, Math.round(next)));
      return value === clamped ? value : clamped;
    });
  }, []);

  const handleStressResizeMinChange = useCallback(
    (next: number) => {
      const normalized = clampBoardSize(Math.max(280, Math.min(next, stressResizeMaxWidth)));
      setStressResizeMinWidth(normalized);
    },
    [stressResizeMaxWidth],
  );

  const handleStressResizeMaxChange = useCallback(
    (next: number) => {
      const normalized = clampBoardSize(Math.max(next, stressResizeMinWidth));
      setStressResizeMaxWidth(normalized);
    },
    [stressResizeMinWidth],
  );

  const perfPanelElement = useMemo(() => {
    if (!isPerfPanelVisible) {
      return null;
    }

    return (
      <PerfPanel
        id={PERF_PANEL_ID}
        showFpsBadge={showFpsBadge}
        onShowFpsBadgeChange={handleShowFpsBadgeChange}
        showDirtyOverlay={showDirtyOverlay}
        onShowDirtyOverlayChange={handleShowDirtyOverlayChange}
        resizeLoopEnabled={stressResizeEnabled}
        onResizeLoopEnabledChange={handleStressResizeEnabledChange}
        resizeIntervalInMs={stressResizeIntervalMs}
        onResizeIntervalInMsChange={handleStressResizeIntervalChange}
        resizeAnimationInMs={stressResizeAnimationMs}
        onResizeAnimationInMsChange={handleStressResizeAnimationChange}
        resizeMinWidth={stressResizeMinWidth}
        onResizeMinWidthChange={handleStressResizeMinChange}
        resizeMaxWidth={stressResizeMaxWidth}
        onResizeMaxWidthChange={handleStressResizeMaxChange}
      />
    );
  }, [
    isPerfPanelVisible,
    showFpsBadge,
    handleShowFpsBadgeChange,
    showDirtyOverlay,
    handleShowDirtyOverlayChange,
    stressResizeEnabled,
    handleStressResizeEnabledChange,
    stressResizeIntervalMs,
    handleStressResizeIntervalChange,
    stressResizeAnimationMs,
    handleStressResizeAnimationChange,
    stressResizeMinWidth,
    handleStressResizeMinChange,
    stressResizeMaxWidth,
    handleStressResizeMaxChange,
  ]);

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
        codePanelElement,
        handleClearLogs,
        perfPanelElement ?? undefined,
      ),
    [boardRef, logs, pgn, pushLog, handleClearLogs, codePanelElement, perfPanelElement],
  );

  const handleFlip = useCallback(() => {
    setOrientation((current) => (current === 'white' ? 'black' : 'white'));
    pushLog('Board flipped');
  }, [pushLog]);

  const handleReset = useCallback(() => {
    if (isStressTestRunning) {
      stopStressTest('Stress test aborted: manual reset triggered.');
    }
    setBoardKey((value) => value + 1);
    setOrientation(DEFAULT_ORIENTATION);
    resetBoardOptions();
    clearPlaygroundPermalink();
    setPgn('');
    pushLog('Board reset and controls restored to defaults');
  }, [isStressTestRunning, resetBoardOptions, stopStressTest, pushLog]);

  const handleStressTest = useCallback(() => {
    if (typeof window === 'undefined') {
      pushLog('Stress test is only available in a browser environment.');
      return;
    }

    if (isStressTestRunning) {
      pushLog('Stress test is already running; ignoring duplicate request.');
      return;
    }

    const board = boardRef.current?.getBoard() as StressTestBoardApi | null;
    if (!board) {
      pushLog('Unable to start stress test: board instance is not ready.');
      return;
    }

    if (typeof board.submitMove !== 'function') {
      pushLog('Unable to start stress test: submitMove API is unavailable.');
      return;
    }

    const runState: StressTestRunState = {
      board,
      moveIndex: 0,
      resizeIndex: 0,
      resizeDirection: 1,
      resizeLoopEnabled: stressResizeEnabled && stressResizeWidths.length > 0,
      resizeWidths: [...stressResizeWidths],
      resizeIntervalMs: stressResizeIntervalMs,
      resizeAnimationMs: stressResizeAnimationMs,
      originalOrientation: orientation,
      originalOptions: { ...boardOptions },
      originalBoardSize: boardSizeRef.current,
    };

    stressTestStateRef.current = runState;
    setIsStressTestRunning(true);
    pushLog(`Stress test started with ${STRESS_TEST_MOVES.length} SAN moves.`);

    if (typeof board.reset === 'function') {
      board.reset(true);
    }

    const playNextMove = () => {
      const state = stressTestStateRef.current;
      if (!state) {
        return;
      }

      if (state.moveIndex >= STRESS_TEST_MOVES.length) {
        stopStressTest('Stress test completed successfully.');
        return;
      }

      const notation = STRESS_TEST_MOVES[state.moveIndex];
      const submitMove = state.board.submitMove;
      const ok = typeof submitMove === 'function' ? submitMove.call(state.board, notation) : false;
      const moveNumber = state.moveIndex + 1;

      pushLog(
        `Move ${moveNumber}/${STRESS_TEST_MOVES.length}: ${notation}${ok ? '' : ' (failed)'}`,
      );

      if (!ok) {
        stopStressTest(`Stress test aborted: move "${notation}" could not be played.`);
        return;
      }

      state.moveIndex += 1;
      state.moveTimeoutId = window.setTimeout(playNextMove, STRESS_TEST_MOVE_DELAY_MS);
    };

    const animateResizeTo = (targetSize: number) => {
      const state = stressTestStateRef.current;
      if (!state) {
        return;
      }

      if (typeof state.rafId === 'number') {
        window.cancelAnimationFrame(state.rafId);
      }

      const startSize = boardSizeRef.current;
      const normalizedTarget = clampBoardSize(targetSize);
      if (startSize === normalizedTarget) {
        return;
      }

      const startTime = performance.now();

      const step = (timestamp: number) => {
        const activeState = stressTestStateRef.current;
        if (!activeState) {
          return;
        }

        const elapsed = timestamp - startTime;
        const duration = activeState.resizeAnimationMs || STRESS_TEST_DEFAULT_RESIZE_ANIMATION_MS;
        const progress = Math.min(elapsed / duration, 1);
        const interpolated = Math.round(startSize + (normalizedTarget - startSize) * progress);
        const clamped = clampBoardSize(interpolated);
        setBoardSize(clamped);

        if (progress < 1) {
          activeState.rafId = window.requestAnimationFrame(step);
        } else {
          activeState.rafId = undefined;
        }
      };

      state.rafId = window.requestAnimationFrame(step);
    };

    const scheduleNextResize = () => {
      const state = stressTestStateRef.current;
      if (!state || !state.resizeLoopEnabled || state.resizeWidths.length === 0) {
        return;
      }

      state.resizeTimeoutId = window.setTimeout(() => {
        const activeState = stressTestStateRef.current;
        if (
          !activeState ||
          !activeState.resizeLoopEnabled ||
          activeState.resizeWidths.length === 0
        ) {
          return;
        }

        const widths = activeState.resizeWidths;
        if (widths.length === 1) {
          animateResizeTo(widths[0]);
          scheduleNextResize();
          return;
        }

        let nextIndex = activeState.resizeIndex + activeState.resizeDirection;
        if (nextIndex >= widths.length) {
          nextIndex = widths.length - 2;
          activeState.resizeDirection = -1;
        } else if (nextIndex < 0) {
          nextIndex = 1;
          activeState.resizeDirection = 1;
        }

        activeState.resizeIndex = nextIndex;
        animateResizeTo(widths[nextIndex]);
        scheduleNextResize();
      }, state.resizeIntervalMs);
    };

    if (runState.resizeLoopEnabled && runState.resizeWidths.length > 0) {
      animateResizeTo(runState.resizeWidths[0]);
      scheduleNextResize();
    }

    runState.moveTimeoutId = window.setTimeout(() => {
      playNextMove();
    }, STRESS_TEST_INITIAL_DELAY_MS);
  }, [
    boardOptions,
    boardRef,
    boardSizeRef,
    isStressTestRunning,
    orientation,
    pushLog,
    stopStressTest,
    stressResizeWidths,
    stressResizeEnabled,
    stressResizeIntervalMs,
    stressResizeAnimationMs,
  ]);

  const handlePerfToggle = useCallback(() => {
    setIsPerfPanelVisible((visible) => {
      const next = !visible;
      pushLog(`Performance panel ${next ? 'opened' : 'hidden'}.`);
      return next;
    });
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

  const handleBoardIllegal = useCallback(
    (event: BoardEventMap['illegal']) => {
      pushLog(
        `Illegal move attempted from ${event.from} to ${event.to}: ${event.reason || 'Unknown reason'}`,
      );
    },
    [pushLog],
  );

  const handleBoardUpdate = useCallback(
    (event: BoardEventMap['update']) => {
      setPgn(exportPgnFromBoard());
      pushLog(`Board updated: ${event.fen}`);
    },
    [exportPgnFromBoard, pushLog],
  );

  const handlePromotionRequired = useCallback(
    (request: BoardEventMap['promotion']) => {
      const fallbackChoice = request.choices[0] ?? 'q';
      const choice = request.choices.includes('q') ? 'q' : fallbackChoice;
      const pieceLabel = choice.toUpperCase();
      pushLog(
        `Promotion required for ${request.color === 'w' ? 'White' : 'Black'} pawn on ${request.to}. Auto-selecting ${pieceLabel}.`,
      );
      request.resolve(choice);
      pushLog(`Promotion resolved with ${pieceLabel}.`);
    },
    [pushLog],
  );

  const fpsStatusColor = useMemo(() => {
    if (fpsSample === null) {
      return 'rgba(148, 163, 184, 0.65)';
    }
    if (fpsSample >= 55) {
      return '#34d399';
    }
    if (fpsSample >= 45) {
      return '#facc15';
    }
    return '#f87171';
  }, [fpsSample]);

  const fpsStatusLabel = useMemo(() => {
    if (fpsSample === null) {
      return 'Measuring…';
    }
    if (fpsSample >= 55) {
      return 'Smooth';
    }
    if (fpsSample >= 45) {
      return 'Stable';
    }
    return 'Degraded';
  }, [fpsSample]);

  const fpsDisplayValue = useMemo(() => (fpsSample === null ? '—' : `${fpsSample}`), [fpsSample]);

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
          <button type="button" onClick={handleStressTest} disabled={isStressTestRunning}>
            {isStressTestRunning ? 'Running…' : 'Stress Test'}
          </button>
          <button type="button" onClick={handleA11yAudit}>
            A11y
          </button>
          <button
            type="button"
            onClick={handlePerfToggle}
            aria-pressed={isPerfPanelVisible}
            aria-expanded={isPerfPanelVisible}
            aria-controls={isPerfPanelVisible ? PERF_PANEL_ID : undefined}
          >
            Perf
          </button>
          <button type="button" onClick={handleThemeToggle}>
            Theme
          </button>
        </div>
      </header>

      <main className="playground__content">
        <aside className="playground__panel playground__panel--left" aria-label="Options">
          <div className="playground__panel-content">
            <h2 className="playground__panel-title">Options</h2>
            {optionSections.map((section) => (
              <details key={section.id} className="playground__accordion" open>
                <summary>{section.title}</summary>
                <div className="playground__accordion-body">{section.content}</div>
              </details>
            ))}
          </div>
        </aside>

        <section className="playground__board" aria-label="Chessboard">
          <div className="playground__board-frame">
            <div className="playground__board-stage">
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
                onIllegal={handleBoardIllegal}
                onUpdate={handleBoardUpdate}
                onPromotionRequired={handlePromotionRequired}
              />
              {showDirtyOverlay ? (
                <div className="playground__dirty-overlay" aria-hidden="true" />
              ) : null}
              {showFpsBadge ? (
                <div className="playground__fps-badge" role="status" aria-live="polite">
                  <span
                    className="playground__fps-dot"
                    style={{ backgroundColor: fpsStatusColor }}
                    aria-hidden="true"
                  />
                  <span className="playground__fps-metrics">
                    <span className="playground__fps-value">{fpsDisplayValue} FPS</span>
                    <span className="playground__fps-subtitle">{fpsStatusLabel}</span>
                  </span>
                </div>
              ) : null}
            </div>
          </div>

          <div className="playground__mobile-panels" aria-live="polite">
            <section>
              <div className="playground__panel-content">
                <h2 className="playground__panel-title">Options</h2>
                {optionSections.map((section) => (
                  <details key={`mobile-${section.id}`} className="playground__accordion">
                    <summary>{section.title}</summary>
                    <div className="playground__accordion-body">{section.content}</div>
                  </details>
                ))}
              </div>
            </section>
            <section>
              <div className="playground__panel-content">
                <h2 className="playground__panel-title">Outputs</h2>
                {outputSections.map((section) => (
                  <details key={`mobile-${section.id}`} className="playground__accordion">
                    <summary>{section.title}</summary>
                    <div className="playground__accordion-body">{section.content}</div>
                  </details>
                ))}
              </div>
            </section>
          </div>
        </section>

        <aside className="playground__panel playground__panel--right" aria-label="Outputs">
          <div className="playground__panel-content">
            <h2 className="playground__panel-title">Outputs</h2>
            {outputSections.map((section) => (
              <details
                key={section.id}
                className="playground__accordion"
                open={section.id === 'logs' || section.id === 'perf'}
              >
                <summary>{section.title}</summary>
                <div className="playground__accordion-body">{section.content}</div>
              </details>
            ))}
          </div>
        </aside>
      </main>
    </div>
  );
};

export default Playground;
