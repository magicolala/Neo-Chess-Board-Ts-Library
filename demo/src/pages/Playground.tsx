import React, { useMemo, useState, useEffect, useCallback, useRef } from 'react';
import { NeoChessBoard } from '../../../src/react';
import type { NeoChessRef } from '../../../src/react';
import { ChessJsRules } from '../../../src/core/ChessJsRules';
import {
  usePlaygroundState,
  usePlaygroundActions,
  type PlaygroundState,
  type ThemeName,
} from '../state/playgroundStore';
import { playgroundThemeMetadata } from '../themes/customThemes';
import type { PlaygroundThemeMetadata } from '../themes/customThemes';
import '../styles/playground.css';
import '../styles/mobile.css';
import {
  DEFAULT_ORIENTATION,
  clearPlaygroundPermalink,
  parsePlaygroundPermalink,
  syncPlaygroundPermalink,
  type PlaygroundOrientation,
} from '../utils/permalink';
import type { BoardEventMap } from '../../../src/core/types';
import { createPromotionDialogExtension } from '../../../src/extensions/PromotionDialogExtension';
import PgnPanel from '../components/PgnPanel';
import LogsPanel from '../components/LogsPanel';
import CodePanel from '../components/CodePanel';
import PerfPanel from '../components/PerfPanel';
import AppearancePanel from '../components/AppearancePanel';
import SharePanel, { type SharePanelProps } from '../components/SharePanel';
import StickyHeader, { type StickyHeaderCtaLinks } from '../components/StickyHeader';
import OptionHelp from '../components/OptionHelp';
import { ToasterProvider, useToaster } from '../components/Toaster';
import { buildPlaygroundSnippets } from '../utils/snippetBuilder';
import { createFpsMeter } from '../utils/fpsMeter';
import type {
  RenderCommandType,
  RenderDebugRect,
  RenderLayer,
} from '../../../src/core/NeoChessBoard';
import {
  BUILTIN_PIECE_SET_ID,
  pieceSetValueById,
  playgroundPieceSetFallbackNote,
  playgroundPieceSets,
} from '../pieces';
import type { PlaygroundPieceSetMetadata } from '../pieces';
import { ANALYTICS_EVENTS, trackEvent, trackPageView } from '../utils/analytics';

interface PanelSection {
  id: string;
  title: string;
  content: React.ReactNode;
}

interface PlaygroundControlHandlers {
  onThemeSelect: (themeId: ThemeName) => void;
  onPieceSetSelect: (pieceSetId: string) => void;
  onShowCoordinatesChange: React.ChangeEventHandler<HTMLInputElement>;
  onHighlightLegalChange: React.ChangeEventHandler<HTMLInputElement>;
  onInteractiveChange: React.ChangeEventHandler<HTMLInputElement>;
  onAutoFlipChange: React.ChangeEventHandler<HTMLInputElement>;
  onAllowDrawingArrowsChange: React.ChangeEventHandler<HTMLInputElement>;
  onAnimationDurationChange: React.ChangeEventHandler<HTMLInputElement>;
  onDragActivationDistanceChange: React.ChangeEventHandler<HTMLInputElement>;
  onPromotionUiChange: React.ChangeEventHandler<HTMLSelectElement>;
  onAutoQueenChange: React.ChangeEventHandler<HTMLInputElement>;
}

interface BuildOptionsArgs {
  state: PlaygroundState;
  themeOptions: PlaygroundThemeMetadata[];
  pieceSets: PlaygroundPieceSetMetadata[];
  pieceSetFallbackNote?: string;
  handlers: PlaygroundControlHandlers;
}

interface OutputSectionConfig {
  sharePanel: SharePanelProps;
  perfPanel?: React.ReactNode;
}

const controlStackStyles: React.CSSProperties = {
  display: 'grid',
  gap: '0.75rem',
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

const toggleTitleRowStyles: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '0.4rem',
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

const selectInputStyles: React.CSSProperties = {
  flex: '0 0 auto',
  minWidth: '9rem',
  padding: '0.45rem 0.65rem',
  borderRadius: '0.6rem',
  border: '1px solid var(--playground-border)',
  backgroundColor: 'rgba(15, 23, 42, 0.65)',
  color: 'var(--playground-text)',
  fontSize: '0.85rem',
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

const sliderTitleGroupStyles: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '0.4rem',
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

const DIRTY_FILL_BY_COMMAND: Record<RenderCommandType, string> = {
  clear: 'rgba(59, 130, 246, 0.24)',
  fill: 'rgba(34, 197, 94, 0.3)',
  sprite: 'rgba(192, 132, 252, 0.36)',
};

const DIRTY_STROKE_BY_LAYER: Record<RenderLayer, string> = {
  board: 'rgba(56, 189, 248, 0.75)',
  pieces: 'rgba(168, 85, 247, 0.75)',
  overlay: 'rgba(250, 204, 21, 0.75)',
};

const DEFAULT_START_FEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';

const formatPlyLabel = (ply: number): string => {
  if (ply <= 0) {
    return 'Start position';
  }

  const moveNumber = Math.ceil(ply / 2);
  const isWhite = ply % 2 === 1;
  const sideLabel = isWhite ? 'White' : 'Black';

  return `Move ${moveNumber} (${sideLabel})`;
};

const formatThemeLabel = (value: string): string => value.charAt(0).toUpperCase() + value.slice(1);

const renderToggle = (
  label: string,
  description: string,
  checked: boolean,
  onChange: React.ChangeEventHandler<HTMLInputElement>,
  docsHref: string,
): React.ReactElement => (
  <label style={toggleRowStyles}>
    <span style={toggleTextBlockStyles}>
      <span style={toggleTitleRowStyles}>
        <span style={toggleTitleStyles}>{label}</span>
        <OptionHelp href={docsHref} label={`Open documentation for ${label}`} />
      </span>
      <span style={toggleDescriptionStyles}>{description}</span>
    </span>
    <input type="checkbox" style={checkboxInputStyles} checked={checked} onChange={onChange} />
  </label>
);

const renderSelect = (
  label: string,
  description: string,
  value: string,
  options: Array<{ value: string; label: string }>,
  onChange: React.ChangeEventHandler<HTMLSelectElement>,
  docsHref: string,
): React.ReactElement => (
  <label style={toggleRowStyles}>
    <span style={toggleTextBlockStyles}>
      <span style={toggleTitleRowStyles}>
        <span style={toggleTitleStyles}>{label}</span>
        <OptionHelp href={docsHref} label={`Open documentation for ${label}`} />
      </span>
      <span style={toggleDescriptionStyles}>{description}</span>
    </span>
    <select value={value} onChange={onChange} style={selectInputStyles}>
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  </label>
);

const renderSlider = (
  label: string,
  valueLabel: string,
  description: string,
  value: number,
  options: { min: number; max: number; step: number },
  onChange: React.ChangeEventHandler<HTMLInputElement>,
  docsHref: string,
): React.ReactElement => (
  <label style={sliderContainerStyles}>
    <span style={sliderHeaderStyles}>
      <span style={sliderTitleGroupStyles}>
        <span style={toggleTitleStyles}>{label}</span>
        <OptionHelp href={docsHref} label={`Open documentation for ${label}`} />
      </span>
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
  pieceSets,
  pieceSetFallbackNote,
  handlers,
}: BuildOptionsArgs): PanelSection[] => [
  {
    id: 'setup',
    title: 'Board setup',
    content: (
      <div style={controlStackStyles}>
        <AppearancePanel
          themes={themeOptions}
          selectedTheme={state.theme}
          onSelectTheme={handlers.onThemeSelect}
          pieceSets={pieceSets}
          selectedPieceSetId={state.pieceSetId}
          onSelectPieceSet={handlers.onPieceSetSelect}
          fallbackNote={pieceSetFallbackNote}
        />
        {renderToggle(
          'Show coordinates',
          'Display algebraic notation along the board borders.',
          state.showCoordinates,
          handlers.onShowCoordinatesChange,
          `${PLAYGROUND_CTA_LINKS.docs}integration/#highlighting-coordinates`,
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
          `${PLAYGROUND_CTA_LINKS.docs}api/#neochessboard-react`,
        )}
        {renderToggle(
          'Highlight legal moves',
          'Emphasize the valid destinations for the selected piece.',
          state.highlightLegal,
          handlers.onHighlightLegalChange,
          `${PLAYGROUND_CTA_LINKS.docs}api/#neochessboard-react`,
        )}
        {renderToggle(
          'Auto flip orientation',
          'Rotate the board automatically after every move turn.',
          state.autoFlip,
          handlers.onAutoFlipChange,
          `${PLAYGROUND_CTA_LINKS.docs}api/#neochessboard-react`,
        )}
        {renderToggle(
          'Allow drawing arrows',
          'Enable training annotations by holding the right mouse button.',
          state.allowDrawingArrows,
          handlers.onAllowDrawingArrowsChange,
          `${PLAYGROUND_CTA_LINKS.docs}api/#neochessboard-react`,
        )}
        {renderSelect(
          'Promotion UI',
          'Choose whether promotions open the dialog extension or the inline picker.',
          state.promotionUi,
          [
            { value: 'dialog', label: 'Dialog (extension)' },
            { value: 'inline', label: 'Inline overlay' },
          ],
          handlers.onPromotionUiChange,
          `${PLAYGROUND_CTA_LINKS.docs}api/#boardconfiguration`,
        )}
        {renderToggle(
          'Auto-queen promotions',
          'Skip the selection step and immediately promote pawns to queens.',
          state.autoQueen,
          handlers.onAutoQueenChange,
          `${PLAYGROUND_CTA_LINKS.docs}api/#boardconfiguration`,
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
          `${PLAYGROUND_CTA_LINKS.docs}api/#neochessboard-react`,
        )}
        {renderSlider(
          'Drag activation distance',
          `${state.dragActivationDistance} px`,
          'Require the pointer to travel this distance before starting a drag operation.',
          state.dragActivationDistance,
          { min: 0, max: 48, step: 1 },
          handlers.onDragActivationDistanceChange,
          `${PLAYGROUND_CTA_LINKS.docs}api/#neochessboard-react`,
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
  config: OutputSectionConfig,
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
    {
      id: 'share',
      title: 'Share & Embed',
      content: <SharePanel {...config.sharePanel} />,
    },
  ];

  if (config.perfPanel) {
    sections.push({
      id: 'perf',
      title: 'Performance',
      content: config.perfPanel,
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
  if (globalThis.window === undefined) {
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

const PLAYGROUND_CTA_LINKS: StickyHeaderCtaLinks = {
  tryPlayground: 'https://neo-chess-board.vercel.app/playground',
  docs: 'https://magicolala.github.io/Neo-Chess-Board-Ts-Library/docs/',
  install: 'https://www.npmjs.com/package/@magicolala/neo-chess-board',
  github: 'https://github.com/magicolala/Neo-Chess-Board-Ts-Library',
};

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

const PlaygroundView: React.FC = () => {
  const permalinkSnapshot = useMemo(() => {
    if (globalThis.window === undefined) {
      return {};
    }

    return parsePlaygroundPermalink(globalThis.location.search);
  }, []);

  const [orientation, setOrientation] = useState<PlaygroundOrientation>(
    permalinkSnapshot.orientation ?? DEFAULT_ORIENTATION,
  );
  const [boardKey, setBoardKey] = useState(0);
  const [logs, setLogs] = useState<string[]>([]);
  const [boardSize, setBoardSize] = useState<number>(() => getInitialBoardSize());
  const [pgn, setPgn] = useState('');
  const initialFen =
    typeof permalinkSnapshot.fen === 'string' && permalinkSnapshot.fen.trim().length > 0
      ? permalinkSnapshot.fen
      : DEFAULT_START_FEN;
  const [currentFen, setCurrentFen] = useState<string>(initialFen);
  const [fenTimeline, setFenTimeline] = useState<string[]>([initialFen]);
  const [plyIndex, setPlyIndex] = useState(0);
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
  const fpsMeterRef = useRef<ReturnType<typeof createFpsMeter> | null>(null);
  const fpsUnsubscribeRef = useRef<(() => void) | null>(null);
  const dirtyCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const dirtyObserverBoardRef = useRef<ReturnType<NeoChessRef['getBoard']>>(null);
  const fenTimelineRef = useRef<string[]>([initialFen]);
  const plyIndexRef = useRef(0);
  const orientationRef = useRef(orientation);
  const initialFenRef = useRef(initialFen);

  const boardOptions = usePlaygroundState();
  const boardOptionsRef = useRef(boardOptions);
  const { update: updateBoardOptions, reset: resetBoardOptions } = usePlaygroundActions();
  const { pushToast } = useToaster();

  const copyToClipboard = useCallback(async (value: string): Promise<boolean> => {
    if (!value) {
      return false;
    }

    if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
      try {
        await navigator.clipboard.writeText(value);
        return true;
      } catch (error) {
        console.error(error);
      }
    }

    if (typeof document === 'undefined') {
      return false;
    }

    try {
      const textarea = document.createElement('textarea');
      textarea.value = value;
      textarea.setAttribute('readonly', '');
      textarea.style.position = 'absolute';
      textarea.style.left = '-9999px';
      document.body.append(textarea);
      textarea.select();
      const result = document.execCommand('copy');
      textarea.remove();
      return result;
    } catch (error) {
      console.error(error);
      return false;
    }
  }, []);

  useEffect(() => {
    const payload =
      globalThis.window === undefined
        ? undefined
        : {
            path: globalThis.location.pathname,
            search: globalThis.location.search,
            title: document?.title,
          };
    trackPageView(ANALYTICS_EVENTS.PAGE_VIEW, payload);
  }, []);

  useEffect(() => {
    if (!permalinkSnapshot.state) {
      return;
    }

    updateBoardOptions(permalinkSnapshot.state);
  }, [permalinkSnapshot.state, updateBoardOptions]);

  useEffect(() => {
    const fenFromPermalink =
      typeof permalinkSnapshot.fen === 'string' && permalinkSnapshot.fen.trim().length > 0
        ? permalinkSnapshot.fen.trim()
        : undefined;

    if (!fenFromPermalink) {
      return;
    }

    setCurrentFen((current) => (current === fenFromPermalink ? current : fenFromPermalink));

    if (globalThis.window === undefined) {
      return;
    }

    const applyFenToBoard = (): boolean => {
      const boardInstance = boardRef.current?.getBoard?.();
      if (!boardInstance) {
        return false;
      }

      const setFen =
        (boardInstance as { setFEN?: (value: string) => void }).setFEN ??
        (boardInstance as { setPosition?: (value: string) => void }).setPosition;

      if (typeof setFen !== 'function') {
        return true;
      }

      try {
        setFen.call(boardInstance, fenFromPermalink);
      } catch (error) {
        console.error(error);
      }

      return true;
    };

    if (applyFenToBoard()) {
      return;
    }

    let frameId: number | null = null;
    let attempts = 0;
    const MAX_ATTEMPTS = 10;

    const scheduleAttempt = () => {
      if (attempts >= MAX_ATTEMPTS) {
        return;
      }

      attempts += 1;
      frameId = globalThis.requestAnimationFrame(() => {
        if (!applyFenToBoard()) {
          scheduleAttempt();
        }
      });
    };

    scheduleAttempt();

    return () => {
      if (frameId !== null) {
        globalThis.cancelAnimationFrame(frameId);
      }
    };
  }, [permalinkSnapshot.fen]);

  useEffect(() => {
    syncPlaygroundPermalink({
      orientation,
      state: boardOptions,
      fen: currentFen,
    });
  }, [orientation, boardOptions, currentFen]);

  useEffect(() => {
    boardSizeRef.current = boardSize;
  }, [boardSize]);

  useEffect(() => {
    fenTimelineRef.current = fenTimeline;
  }, [fenTimeline]);

  useEffect(() => {
    plyIndexRef.current = plyIndex;
  }, [plyIndex]);

  useEffect(() => {
    orientationRef.current = orientation;
  }, [orientation]);

  useEffect(() => {
    boardOptionsRef.current = boardOptions;
  }, [boardOptions]);

  useEffect(() => {
    const boardInstance = boardRef.current?.getBoard?.();
    if (!boardInstance) {
      return;
    }

    const candidate =
      (boardInstance as { getCurrentFEN?: () => string }).getCurrentFEN ??
      (boardInstance as { getPosition?: () => string }).getPosition;

    if (typeof candidate === 'function') {
      try {
        const fenValue = candidate.call(boardInstance);
        if (typeof fenValue === 'string' && fenValue.trim().length > 0) {
          setCurrentFen(fenValue);
        }
      } catch (error) {
        console.error(error);
      }
    }
  }, [boardKey]);

  const themeMetadata = useMemo(() => playgroundThemeMetadata, []);
  const themeOptions = useMemo<ThemeName[]>(
    () => themeMetadata.map((metadata) => metadata.id),
    [themeMetadata],
  );
  const themeLabelById = useMemo(() => {
    const entries = new Map<ThemeName, string>();
    for (const metadata of themeMetadata) {
      entries.set(metadata.id, metadata.label || formatThemeLabel(metadata.id));
    }
    return entries;
  }, [themeMetadata]);

  const getThemeLabel = useCallback(
    (id: ThemeName): string => themeLabelById.get(id) ?? formatThemeLabel(id),
    [themeLabelById],
  );

  const pieceSetMetadata = useMemo<PlaygroundPieceSetMetadata[]>(() => playgroundPieceSets, []);
  const pieceSetLabelById = useMemo(() => {
    const entries = new Map<string, string>();
    for (const metadata of pieceSetMetadata) {
      entries.set(metadata.id, metadata.label);
    }
    return entries;
  }, [pieceSetMetadata]);

  const getPieceSetLabel = useCallback(
    (id: string): string => pieceSetLabelById.get(id) ?? id,
    [pieceSetLabelById],
  );

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

    const lastWidth = widths.at(-1);
    if (!lastWidth || lastWidth !== normalizedMax) {
      widths.push(normalizedMax);
    }

    return widths;
  }, [stressResizeEnabled, stressResizeMinWidth, stressResizeMaxWidth]);

  const {
    theme,
    pieceSetId,
    showCoordinates,
    highlightLegal,
    interactive,
    autoFlip,
    allowDrawingArrows,
    animationDurationInMs,
    dragActivationDistance,
    promotionUi,
    autoQueen,
  } = boardOptions;

  const promotionExtensions = useMemo(() => [createPromotionDialogExtension()], []);

  const selectedPieceSet = useMemo(
    () => pieceSetValueById.get(pieceSetId) ?? pieceSetValueById.get(BUILTIN_PIECE_SET_ID),
    [pieceSetId],
  );

  useEffect(() => {
    if (globalThis.window === undefined) {
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
      fpsUnsubscribeRef.current?.();
      fpsUnsubscribeRef.current = null;
      fpsMeterRef.current?.stop();
      setFpsSample(null);
      return;
    }

    if (globalThis.window === undefined || typeof globalThis.requestAnimationFrame !== 'function') {
      setFpsSample(null);
      return;
    }

    const meter = fpsMeterRef.current ?? createFpsMeter();
    fpsMeterRef.current = meter;
    const unsubscribe = meter.subscribe((value) => {
      setFpsSample(Math.max(0, value));
    });
    fpsUnsubscribeRef.current = unsubscribe;
    meter.start();

    return () => {
      unsubscribe();
      fpsUnsubscribeRef.current = null;
      meter.stop();
      setFpsSample(null);
    };
  }, [showFpsBadge]);

  useEffect(() => {
    if (globalThis.window === undefined) {
      return;
    }

    const boardInstance = boardRef.current?.getBoard();
    const canvas = dirtyCanvasRef.current;

    if (!showDirtyOverlay || !boardInstance || !canvas) {
      if (dirtyObserverBoardRef.current) {
        dirtyObserverBoardRef.current.setRenderObserver(null);
        dirtyObserverBoardRef.current = null;
      }
      if (canvas) {
        const context = canvas.getContext('2d');
        if (context) {
          context.clearRect(0, 0, canvas.width, canvas.height);
        }
      }
      return;
    }

    const context = canvas.getContext('2d');
    if (!context) {
      boardInstance.setRenderObserver(null);
      dirtyObserverBoardRef.current = null;
      return;
    }

    dirtyObserverBoardRef.current = boardInstance;

    const renderObserver = (commands: RenderDebugRect[]): void => {
      const root = boardInstance.getRootElement();
      const bounds = root.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      const pixelWidth = Math.max(1, Math.round(bounds.width * dpr));
      const pixelHeight = Math.max(1, Math.round(bounds.height * dpr));

      if (canvas.width !== pixelWidth || canvas.height !== pixelHeight) {
        canvas.width = pixelWidth;
        canvas.height = pixelHeight;
        canvas.style.width = `${bounds.width}px`;
        canvas.style.height = `${bounds.height}px`;
      }

      context.save();
      context.setTransform(1, 0, 0, 1, 0, 0);
      context.clearRect(0, 0, canvas.width, canvas.height);

      if (commands.length > 0) {
        const strokeWidth = Math.max(1, dpr * 0.75);
        for (const command of commands) {
          const fill = DIRTY_FILL_BY_COMMAND[command.type] ?? 'rgba(148, 163, 184, 0.2)';
          const stroke = DIRTY_STROKE_BY_LAYER[command.layer] ?? 'rgba(148, 163, 184, 0.5)';
          context.fillStyle = fill;
          context.fillRect(command.rect.x, command.rect.y, command.rect.width, command.rect.height);
          context.strokeStyle = stroke;
          context.lineWidth = strokeWidth;
          const offset = strokeWidth / 2;
          const width = Math.max(0, command.rect.width - strokeWidth);
          const height = Math.max(0, command.rect.height - strokeWidth);
          context.strokeRect(command.rect.x + offset, command.rect.y + offset, width, height);
        }
      }

      context.restore();
    };

    boardInstance.setRenderObserver(renderObserver);
    boardInstance.renderAll();

    return () => {
      if (dirtyObserverBoardRef.current === boardInstance) {
        boardInstance.setRenderObserver(null);
        dirtyObserverBoardRef.current = null;
      }
      context.clearRect(0, 0, canvas.width, canvas.height);
    };
  }, [showDirtyOverlay, boardKey, boardSize, orientation, theme]);

  useEffect(() => {
    return () => {
      fpsUnsubscribeRef.current?.();
      fpsUnsubscribeRef.current = null;
      fpsMeterRef.current?.stop();
      fpsMeterRef.current = null;
      const boardInstance = boardRef.current?.getBoard();
      if (boardInstance) {
        boardInstance.setRenderObserver(null);
      }
    };
  }, []);

  const cancelStressTestTimers = useCallback(() => {
    const state = stressTestStateRef.current;
    if (!state) {
      return;
    }

    if (typeof state.moveTimeoutId === 'number') {
      globalThis.clearTimeout(state.moveTimeoutId);
      state.moveTimeoutId = undefined;
    }

    if (typeof state.resizeTimeoutId === 'number') {
      globalThis.clearTimeout(state.resizeTimeoutId);
      state.resizeTimeoutId = undefined;
    }

    if (typeof state.rafId === 'number') {
      globalThis.cancelAnimationFrame(state.rafId);
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

  const applyPly = useCallback(
    (index: number, options?: { timelineOverride?: string[]; logLabel?: string }) => {
      const timeline = options?.timelineOverride ?? fenTimelineRef.current;
      if (timeline.length === 0) {
        return;
      }

      const maxIndex = timeline.length - 1;
      const clampedIndex = Math.max(0, Math.min(index, maxIndex));
      const fen = timeline[clampedIndex] ?? timeline[maxIndex];

      plyIndexRef.current = clampedIndex;
      setPlyIndex(clampedIndex);
      setCurrentFen(fen);

      const stateSnapshot = boardOptionsRef.current ?? boardOptions;
      syncPlaygroundPermalink({
        orientation: orientationRef.current,
        state: stateSnapshot,
        fen,
      });

      if (options?.logLabel) {
        pushLog(options.logLabel);
      }
    },
    [boardOptions, pushLog],
  );

  const rebuildTimelineFromPgn = useCallback(
    (sourcePgn: string, options?: { jumpToEnd?: boolean; logLabel?: string }) => {
      const trimmed = sourcePgn.trim();
      let sanitizedPgn = trimmed;
      let startingFen = initialFenRef.current ?? DEFAULT_START_FEN;
      let frames: string[] = [];

      if (trimmed.length === 0) {
        frames = [startingFen];
      } else {
        try {
          const rules = new ChessJsRules();
          const loaded = rules.loadPgn(trimmed);
          if (!loaded) {
            throw new Error('Failed to load PGN into ChessJsRules.');
          }

          const notation = rules.getPgnNotation?.();
          const metadata = notation?.getMetadata?.();
          const metadataFen = typeof metadata?.FEN === 'string' ? metadata.FEN.trim() : undefined;
          const normalizedSetUp =
            typeof metadata?.SetUp === 'string' ? metadata.SetUp.trim().toLowerCase() : undefined;
          if (
            metadataFen &&
            (!normalizedSetUp || normalizedSetUp === '1' || normalizedSetUp === 'true')
          ) {
            startingFen = metadataFen;
          }

          sanitizedPgn = notation?.toPgnWithAnnotations?.() ?? trimmed;

          const verboseHistory = rules.getChessInstance().history({ verbose: true }) as Array<{
            from: string;
            to: string;
            promotion?: string;
          }>;

          const timelineRules = new ChessJsRules(startingFen);
          const nextFrames: string[] = [timelineRules.getFEN()];
          for (const move of verboseHistory) {
            const response = timelineRules.move({
              from: move.from,
              to: move.to,
              promotion: move.promotion,
            });

            if (!response.ok || typeof response.fen !== 'string') {
              break;
            }

            nextFrames.push(response.fen);
          }

          frames = nextFrames.length > 0 ? nextFrames : [startingFen];
        } catch (error) {
          console.error('Failed to rebuild PGN timeline:', error);
          const fallback =
            fenTimelineRef.current[plyIndexRef.current] ?? fenTimelineRef.current[0] ?? startingFen;
          frames = [fallback];
        }
      }

      if (frames.length === 0) {
        frames = [startingFen];
      }

      fenTimelineRef.current = frames;
      setFenTimeline(frames);

      const maxIndex = frames.length > 0 ? frames.length - 1 : 0;
      const targetIndex = options?.jumpToEnd ? maxIndex : Math.min(plyIndexRef.current, maxIndex);
      applyPly(targetIndex, { timelineOverride: frames, logLabel: options?.logLabel });

      if (sanitizedPgn !== sourcePgn) {
        setPgn(sanitizedPgn);
      }
    },
    [applyPly, setPgn],
  );

  useEffect(() => {
    rebuildTimelineFromPgn(pgn, { jumpToEnd: true });
  }, [pgn, rebuildTimelineFromPgn]);

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

  const handleThemeSelect = useCallback(
    (nextTheme: ThemeName) => {
      updateBoardOptions({ theme: nextTheme });
      pushLog(`Theme changed to ${getThemeLabel(nextTheme)}`);
      trackEvent(ANALYTICS_EVENTS.THEME_SWITCH, {
        theme: nextTheme,
        origin: 'options-panel',
      });
    },
    [updateBoardOptions, pushLog, getThemeLabel],
  );

  const handlePieceSetSelect = useCallback(
    (nextPieceSetId: string) => {
      if (nextPieceSetId === pieceSetId) {
        return;
      }

      updateBoardOptions({ pieceSetId: nextPieceSetId });
      const label = getPieceSetLabel(nextPieceSetId);
      pushLog(`Pieces changed to ${label}`);
    },
    [pieceSetId, updateBoardOptions, pushLog, getPieceSetLabel],
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

  const handlePromotionUiChange = useCallback<React.ChangeEventHandler<HTMLSelectElement>>(
    (event) => {
      const nextUi = event.target.value === 'inline' ? 'inline' : 'dialog';
      updateBoardOptions({ promotionUi: nextUi });
      pushLog(
        `Promotion UI switched to ${nextUi === 'inline' ? 'inline overlay' : 'dialog extension'}.`,
      );
    },
    [updateBoardOptions, pushLog],
  );

  const handleAutoQueenChange = useCallback<React.ChangeEventHandler<HTMLInputElement>>(
    (event) => {
      const nextValue = event.target.checked;
      updateBoardOptions({ autoQueen: nextValue });
      pushLog(
        nextValue
          ? 'Auto-queen enabled: promotions will resolve to queens automatically.'
          : 'Auto-queen disabled: promotions now require a manual choice.',
      );
    },
    [updateBoardOptions, pushLog],
  );

  const optionSections = useMemo(
    () =>
      buildOptionsSections({
        state: boardOptions,
        themeOptions: themeMetadata,
        pieceSets: pieceSetMetadata,
        pieceSetFallbackNote: playgroundPieceSetFallbackNote,
        handlers: {
          onThemeSelect: handleThemeSelect,
          onPieceSetSelect: handlePieceSetSelect,
          onShowCoordinatesChange: handleShowCoordinatesChange,
          onHighlightLegalChange: handleHighlightLegalChange,
          onInteractiveChange: handleInteractiveChange,
          onAutoFlipChange: handleAutoFlipChange,
          onAllowDrawingArrowsChange: handleAllowDrawingArrowsChange,
          onAnimationDurationChange: handleAnimationDurationChange,
          onDragActivationDistanceChange: handleDragActivationDistanceChange,
          onPromotionUiChange: handlePromotionUiChange,
          onAutoQueenChange: handleAutoQueenChange,
        },
      }),
    [
      boardOptions,
      themeMetadata,
      pieceSetMetadata,
      playgroundPieceSetFallbackNote,
      handleThemeSelect,
      handlePieceSetSelect,
      handleShowCoordinatesChange,
      handleHighlightLegalChange,
      handleInteractiveChange,
      handleAutoFlipChange,
      handleAllowDrawingArrowsChange,
      handleAnimationDurationChange,
      handleDragActivationDistanceChange,
      handlePromotionUiChange,
      handleAutoQueenChange,
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

  const sharePanelProps = useMemo<SharePanelProps>(
    () => ({
      orientation,
      state: boardOptions,
      fen: currentFen,
      onCopy: copyToClipboard,
    }),
    [orientation, boardOptions, currentFen, copyToClipboard],
  );

  const currentMoveLabel = useMemo(() => formatPlyLabel(plyIndex), [plyIndex]);
  const canNavigateBackward = plyIndex > 0;
  const canNavigateForward = plyIndex < Math.max(0, fenTimeline.length - 1);

  const handleNavigate = useCallback(
    (direction: 'first' | 'previous' | 'next' | 'last') => {
      const timeline = fenTimelineRef.current;
      if (timeline.length === 0) {
        return;
      }

      const maxIndex = timeline.length - 1;
      let targetIndex = plyIndexRef.current;

      switch (direction) {
        case 'first': {
          targetIndex = 0;
          break;
        }
        case 'previous': {
          targetIndex = Math.max(0, plyIndexRef.current - 1);
          break;
        }
        case 'next': {
          targetIndex = Math.min(maxIndex, plyIndexRef.current + 1);
          break;
        }
        case 'last': {
          targetIndex = maxIndex;
          break;
        }
        default: {
          targetIndex = plyIndexRef.current;
        }
      }

      if (targetIndex === plyIndexRef.current) {
        return;
      }

      const label = formatPlyLabel(targetIndex);
      const verb =
        direction === 'next'
          ? 'Moved forward to'
          : direction === 'previous'
            ? 'Moved back to'
            : 'Navigated to';

      applyPly(targetIndex, { logLabel: `${verb} ${label}.` });
    },
    [applyPly],
  );

  const outputSections = useMemo(
    () =>
      buildOutputSections(
        logs,
        <PgnPanel
          boardRef={boardRef}
          pgn={pgn}
          onPgnChange={setPgn}
          onLog={pushLog}
          onNavigate={handleNavigate}
          canGoBack={canNavigateBackward}
          canGoForward={canNavigateForward}
          currentMoveLabel={currentMoveLabel}
        />,
        codePanelElement,
        handleClearLogs,
        {
          sharePanel: sharePanelProps,
          perfPanel: perfPanelElement ?? undefined,
        },
      ),
    [
      boardRef,
      logs,
      pgn,
      pushLog,
      handleClearLogs,
      codePanelElement,
      sharePanelProps,
      perfPanelElement,
      handleNavigate,
      canNavigateBackward,
      canNavigateForward,
      currentMoveLabel,
    ],
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
    const resetTimeline = [DEFAULT_START_FEN];
    fenTimelineRef.current = resetTimeline;
    setFenTimeline(resetTimeline);
    setPgn('');
    applyPly(0, {
      timelineOverride: resetTimeline,
      logLabel: 'Board reset and controls restored to defaults',
    });
    clearPlaygroundPermalink();
    pushToast('Playground reset to defaults and permalink cleared.', { intent: 'success' });
  }, [isStressTestRunning, resetBoardOptions, stopStressTest, applyPly, pushToast]);

  const handleStressTest = useCallback(() => {
    if (globalThis.window === undefined) {
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
      state.moveTimeoutId = globalThis.setTimeout(playNextMove, STRESS_TEST_MOVE_DELAY_MS);
    };

    const animateResizeTo = (targetSize: number) => {
      const state = stressTestStateRef.current;
      if (!state) {
        return;
      }

      if (typeof state.rafId === 'number') {
        globalThis.cancelAnimationFrame(state.rafId);
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

        activeState.rafId = progress < 1 ? globalThis.requestAnimationFrame(step) : undefined;
      };

      state.rafId = globalThis.requestAnimationFrame(step);
    };

    const scheduleNextResize = () => {
      const state = stressTestStateRef.current;
      if (!state || !state.resizeLoopEnabled || state.resizeWidths.length === 0) {
        return;
      }

      state.resizeTimeoutId = globalThis.setTimeout(() => {
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

    runState.moveTimeoutId = globalThis.setTimeout(() => {
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
    const nextIndex = currentIndex === -1 ? 0 : (currentIndex + 1) % themeOptions.length;
    const nextTheme = themeOptions[nextIndex];
    updateBoardOptions({ theme: nextTheme });
    pushLog(`Theme changed to ${getThemeLabel(nextTheme)}`);
    trackEvent(ANALYTICS_EVENTS.THEME_SWITCH, {
      theme: nextTheme,
      origin: 'header-toggle',
    });
  }, [themeOptions, theme, updateBoardOptions, pushLog, getThemeLabel]);

  const handleBoardMove = useCallback(
    (event: BoardEventMap['move']) => {
      const exported = exportPgnFromBoard();
      setPgn(exported);

      const baseTimeline = fenTimelineRef.current.slice(0, plyIndexRef.current + 1);
      const nextTimeline = [...baseTimeline, event.fen];
      fenTimelineRef.current = nextTimeline;
      setFenTimeline(nextTimeline);

      applyPly(nextTimeline.length - 1, {
        timelineOverride: nextTimeline,
        logLabel: `Move played from ${event.from} to ${event.to}`,
      });
    },
    [applyPly, exportPgnFromBoard],
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
      const exported = exportPgnFromBoard();
      setPgn(exported);

      const sliceEnd = Math.max(0, plyIndexRef.current) + 1;
      const baseTimeline = fenTimelineRef.current.slice(0, sliceEnd);
      const nextTimeline =
        baseTimeline.length > 0 ? [...baseTimeline.slice(0, -1), event.fen] : [event.fen];

      fenTimelineRef.current = nextTimeline;
      setFenTimeline(nextTimeline);

      applyPly(nextTimeline.length - 1, {
        timelineOverride: nextTimeline,
        logLabel: `Board updated: ${event.fen}`,
      });
    },
    [applyPly, exportPgnFromBoard],
  );

  const handlePromotionRequired = useCallback(
    (request: BoardEventMap['promotion']) => {
      const colorLabel = request.color === 'w' ? 'White' : 'Black';
      const prompt =
        promotionUi === 'inline'
          ? 'Use the inline picker to choose a promotion piece.'
          : 'Select a piece in the dialog to finish the move.';
      pushLog(`Promotion required for ${colorLabel} pawn on ${request.to}. ${prompt}`);
    },
    [promotionUi, pushLog],
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
      <StickyHeader
        onFlip={handleFlip}
        onReset={handleReset}
        onStressTest={handleStressTest}
        onAccessibilityAudit={handleA11yAudit}
        onPerfToggle={handlePerfToggle}
        onThemeToggle={handleThemeToggle}
        isStressTestRunning={isStressTestRunning}
        isPerfPanelVisible={isPerfPanelVisible}
        perfPanelId={PERF_PANEL_ID}
        ctaLinks={PLAYGROUND_CTA_LINKS}
      />

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
                pieceSet={selectedPieceSet ?? undefined}
                orientation={orientation}
                fen={currentFen}
                showCoordinates={showCoordinates}
                showSquareNames={showCoordinates}
                highlightLegal={highlightLegal}
                interactive={interactive}
                autoFlip={autoFlip}
                allowDrawingArrows={allowDrawingArrows}
                animation={{ duration: animationDurationInMs }}
                dragActivationDistance={dragActivationDistance}
                showArrows
                showHighlights
                allowPremoves
                soundEnabled
                size={boardSize}
                promotion={{ ui: promotionUi, autoQueen }}
                extensions={promotionUi === 'dialog' ? promotionExtensions : undefined}
                onMove={handleBoardMove}
                onIllegal={handleBoardIllegal}
                onUpdate={handleBoardUpdate}
                onPromotionRequired={handlePromotionRequired}
              />
              {showDirtyOverlay ? (
                <canvas
                  ref={dirtyCanvasRef}
                  className="playground__dirty-overlay"
                  aria-hidden="true"
                />
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

export const Playground: React.FC = () => (
  <ToasterProvider>
    <PlaygroundView />
  </ToasterProvider>
);

export default Playground;
