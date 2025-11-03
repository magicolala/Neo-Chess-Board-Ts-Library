import React, { useCallback, useMemo, useRef, useState } from 'react';
import type { NeoChessRef } from '../../../src/react';
import type { ChessJsRules } from '../../../src/core/ChessJsRules';
import type { PgnNotation } from '../../../src/core/PgnNotation';
import { ANALYTICS_EVENTS, trackEvent } from '../utils/analytics';
import { useToaster } from './Toaster';

type PgnNavigationDirection = 'first' | 'previous' | 'next' | 'last';

interface PgnPanelProps {
  boardRef: React.RefObject<NeoChessRef>;
  pgn: string;
  onPgnChange: (next: string) => void;
  onLog?: (message: string) => void;
  onNavigate: (direction: PgnNavigationDirection) => void;
  canGoBack: boolean;
  canGoForward: boolean;
  currentMoveLabel?: string;
  isAutoplaying: boolean;
  onAutoplayToggle: () => void;
  autoplayIntervalMs: number;
  autoplaySpeedOptions: { min: number; max: number; step: number };
  onAutoplaySpeedChange: (next: number) => void;
  canAutoplay: boolean;
}

interface ExamplePgn {
  id: string;
  label: string;
  path: string;
}

const EXAMPLE_PGNS: ExamplePgn[] = [
  {
    id: 'classic',
    label: 'Load classic game',
    path: 'pgn/classic.pgn',
  },
  {
    id: 'puzzle',
    label: 'Load puzzle line',
    path: 'pgn/puzzle.pgn',
  },
  {
    id: 'annotations',
    label: 'Load annotated game',
    path: 'pgn/annotations.pgn',
  },
];

const buildAssetUrl = (relativePath: string): string => {
  const normalizedPath = relativePath.startsWith('/') ? relativePath.slice(1) : relativePath;

  if (typeof document !== 'undefined' && typeof document.baseURI === 'string') {
    const resolvedUrl = new URL(normalizedPath, document.baseURI);
    return `${resolvedUrl.pathname}${resolvedUrl.search}${resolvedUrl.hash}`;
  }

  return `/${normalizedPath}`;
};

const getRulesFromBoard = (board: unknown): ChessJsRules | null => {
  if (!board) {
    return null;
  }
  const withRules = board as { rules?: ChessJsRules | null };
  return withRules.rules ?? null;
};

const getPgnNotationFromBoard = (board: unknown): PgnNotation | null => {
  const rules = getRulesFromBoard(board);
  if (!rules || typeof rules.getPgnNotation !== 'function') {
    return null;
  }
  return rules.getPgnNotation();
};

const IconFirst: React.FC = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
    <rect x="4" y="5" width="2" height="14" fill="currentColor" />
    <path d="M18 6L10 12l8 6V6z" fill="currentColor" />
  </svg>
);

const IconPrevious: React.FC = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
    <path d="M16 6L8 12l8 6V6z" fill="currentColor" />
  </svg>
);

const IconNext: React.FC = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
    <path d="M8 6l8 6-8 6V6z" fill="currentColor" />
  </svg>
);

const IconLast: React.FC = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
    <path d="M6 6l8 6-8 6V6z" fill="currentColor" />
    <rect x="18" y="5" width="2" height="14" fill="currentColor" />
  </svg>
);

const IconPlay: React.FC = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
    <path d="M8 5l10 7-10 7V5z" fill="currentColor" />
  </svg>
);

const IconPause: React.FC = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
    <rect x="7" y="5" width="3" height="14" fill="currentColor" />
    <rect x="14" y="5" width="3" height="14" fill="currentColor" />
  </svg>
);

const PgnPanel: React.FC<PgnPanelProps> = ({
  boardRef,
  pgn,
  onPgnChange,
  onLog,
  onNavigate,
  canGoBack,
  canGoForward,
  currentMoveLabel,
  isAutoplaying,
  onAutoplayToggle,
  autoplayIntervalMs,
  autoplaySpeedOptions,
  onAutoplaySpeedChange,
  canAutoplay,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [loadingExample, setLoadingExample] = useState<string | null>(null);
  const { pushToast } = useToaster();

  const resetTransientMessages = useCallback(() => {
    setError(null);
    setStatus(null);
  }, []);

  const handleBoardPgnExport = useCallback((): string => {
    const board = boardRef.current?.getBoard();
    if (!board) {
      return '';
    }
    const notation = getPgnNotationFromBoard(board);
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
  }, [boardRef]);

  const applyPgnToBoard = useCallback(
    (pgnString: string, originLabel: string): void => {
      const trimmed = pgnString.trim();
      if (!trimmed) {
        const message = 'The provided PGN is empty.';
        setError(message);
        setStatus(null);
        pushToast(message, { intent: 'error' });
        return;
      }

      const board = boardRef.current?.getBoard();
      if (!board) {
        const message = 'Chessboard is not ready yet.';
        setError(message);
        setStatus(null);
        pushToast(message, { intent: 'error' });
        return;
      }

      const notation = getPgnNotationFromBoard(board);
      if (!notation) {
        const message = 'Unable to access PGN notation from the rules adapter.';
        setError(message);
        setStatus(null);
        pushToast(message, { intent: 'error' });
        return;
      }

      try {
        const success = board.loadPgnWithAnnotations(trimmed);
        if (!success) {
          throw new Error('Board rejected PGN string');
        }
        const exported = notation.toPgnWithAnnotations?.() ?? handleBoardPgnExport();
        onPgnChange(exported);
        setError(null);
        const message = `Loaded PGN from ${originLabel}.`;
        setStatus(message);
        pushToast(message, { intent: 'success' });
        onLog?.(`Loaded PGN from ${originLabel}`);
        trackEvent(ANALYTICS_EVENTS.IMPORT_PGN, {
          origin: originLabel,
          success: true,
        });
      } catch (loadError) {
        console.error(loadError);
        const message = 'Failed to load PGN. Please verify the file content.';
        setError(message);
        setStatus(null);
        pushToast(message, { intent: 'error' });
        trackEvent(ANALYTICS_EVENTS.IMPORT_PGN, {
          origin: originLabel,
          success: false,
          error: loadError instanceof Error ? loadError.message : 'unknown-error',
        });
      }
    },
    [boardRef, handleBoardPgnExport, onLog, onPgnChange, pushToast],
  );

  const handleFileContent = useCallback(
    async (file: File | null) => {
      if (!file) {
        return;
      }
      resetTransientMessages();
      if (!file.name.toLowerCase().endsWith('.pgn')) {
        const message = 'Only .pgn files are supported.';
        setError(message);
        pushToast(message, { intent: 'error' });
        return;
      }
      try {
        const content = await file.text();
        applyPgnToBoard(content, file.name);
      } catch (readError) {
        console.error(readError);
        const message = 'Unable to read the selected file.';
        setError(message);
        pushToast(message, { intent: 'error' });
      }
    },
    [applyPgnToBoard, resetTransientMessages, pushToast],
  );

  const handleInputChange: React.ChangeEventHandler<HTMLInputElement> = useCallback(
    (event) => {
      const [file] = [...(event.target.files ?? [])];
      void handleFileContent(file ?? null);
      event.target.value = '';
    },
    [handleFileContent],
  );

  const handleDrop: React.DragEventHandler<HTMLDivElement> = useCallback(
    (event) => {
      event.preventDefault();
      event.stopPropagation();
      setIsDragging(false);
      const [file] = [...(event.dataTransfer.files ?? [])];
      void handleFileContent(file ?? null);
    },
    [handleFileContent],
  );

  const handleDragOver: React.DragEventHandler<HTMLDivElement> = useCallback(
    (event) => {
      event.preventDefault();
      event.stopPropagation();
      if (!isDragging) {
        setIsDragging(true);
      }
    },
    [isDragging],
  );

  const handleDragLeave: React.DragEventHandler<HTMLDivElement> = useCallback((event) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleExampleClick = useCallback(
    async (example: ExamplePgn) => {
      resetTransientMessages();
      setLoadingExample(example.id);
      try {
        const response = await fetch(buildAssetUrl(example.path));
        if (!response.ok) {
          throw new Error(`Failed to fetch ${example.path}`);
        }
        const content = await response.text();
        applyPgnToBoard(content, example.label);
      } catch (fetchError) {
        console.error(fetchError);
        const message = 'Unable to load the example PGN.';
        setError(message);
        pushToast(message, { intent: 'error' });
      } finally {
        setLoadingExample(null);
      }
    },
    [applyPgnToBoard, resetTransientMessages, pushToast],
  );

  const handleExport = useCallback(() => {
    resetTransientMessages();
    const exported = handleBoardPgnExport();
    if (!exported) {
      const message = 'There is no PGN to export yet.';
      setError(message);
      pushToast(message, { intent: 'error' });
      return;
    }
    const blob = new Blob([exported], { type: 'application/x-chess-pgn' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'neo-chess-board-game.pgn';
    document.body.append(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
    const message = 'PGN exported successfully.';
    setStatus(message);
    pushToast(message, { intent: 'success' });
    onLog?.('Exported current PGN.');
  }, [handleBoardPgnExport, onLog, pushToast, resetTransientMessages]);

  const handleSelectFileClick = useCallback(() => {
    resetTransientMessages();
    fileInputRef.current?.click();
  }, [resetTransientMessages]);

  const helperText = useMemo(() => {
    if (error) {
      return error;
    }
    if (status) {
      return status;
    }
    return 'Drop a .pgn file here or use one of the example games.';
  }, [error, status]);

  const autoplayButtonLabel = isAutoplaying ? 'Pause autoplay' : 'Play moves automatically';
  const autoplaySpeedLabel = useMemo(() => {
    if (autoplayIntervalMs < 1000) {
      return `${autoplayIntervalMs} ms per move`;
    }
    return `${(autoplayIntervalMs / 1000).toFixed(1)} s per move`;
  }, [autoplayIntervalMs]);

  const handleAutoplaySpeedInputChange: React.ChangeEventHandler<HTMLInputElement> = useCallback(
    (event) => {
      const value = Number(event.target.value);
      if (Number.isFinite(value)) {
        onAutoplaySpeedChange(value);
      }
    },
    [onAutoplaySpeedChange],
  );

  return (
    <div className="playground__pgn-panel">
      <div
        className={
          isDragging ? 'playground__dropzone playground__dropzone--active' : 'playground__dropzone'
        }
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        role="button"
        tabIndex={0}
        onClick={handleSelectFileClick}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            handleSelectFileClick();
          }
        }}
        aria-label="Import PGN"
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".pgn"
          className="playground__dropzone-input"
          onChange={handleInputChange}
          aria-hidden="true"
        />
        <span className="playground__dropzone-label">Import PGN</span>
        <span className="playground__dropzone-hint">Click or drop a .pgn file</span>
      </div>

      <div className="playground__example-buttons" role="group" aria-label="PGN examples">
        {EXAMPLE_PGNS.map((example) => (
          <button
            key={example.id}
            type="button"
            className="playground__example-button"
            onClick={() => void handleExampleClick(example)}
            disabled={loadingExample === example.id}
          >
            {loadingExample === example.id ? 'Loading…' : example.label}
          </button>
        ))}
      </div>

      <div className="playground__pgn-navigation">
        <div className="playground__pgn-navigation-header">
          <span className="playground__pgn-navigation-label" aria-live="polite">
            {currentMoveLabel ?? 'Start position'}
          </span>
          <button
            type="button"
            className="playground__icon-button playground__pgn-autoplay-button"
            onClick={onAutoplayToggle}
            aria-label={autoplayButtonLabel}
            title={autoplayButtonLabel}
            aria-pressed={isAutoplaying}
            disabled={!canAutoplay}
          >
            {isAutoplaying ? <IconPause /> : <IconPlay />}
          </button>
        </div>
        <div
          className="playground__pgn-navigation-buttons"
          role="group"
          aria-label="Move navigation"
        >
          <button
            type="button"
            className="playground__icon-button playground__pgn-nav-button"
            onClick={() => onNavigate('first')}
            disabled={!canGoBack}
            aria-label="Go to first move"
            title="Go to first move"
          >
            <IconFirst />
          </button>
          <button
            type="button"
            className="playground__icon-button playground__pgn-nav-button"
            onClick={() => onNavigate('previous')}
            disabled={!canGoBack}
            aria-label="Go to previous move"
            title="Go to previous move"
          >
            <IconPrevious />
          </button>
          <button
            type="button"
            className="playground__icon-button playground__pgn-nav-button"
            onClick={() => onNavigate('next')}
            disabled={!canGoForward}
            aria-label="Go to next move"
            title="Go to next move"
          >
            <IconNext />
          </button>
          <button
            type="button"
            className="playground__icon-button playground__pgn-nav-button"
            onClick={() => onNavigate('last')}
            disabled={!canGoForward}
            aria-label="Go to last move"
            title="Go to last move"
          >
            <IconLast />
          </button>
        </div>
        <label className="playground__pgn-speed">
          <span className="playground__pgn-speed-label">
            <span>Autoplay speed</span>
            <span>{autoplaySpeedLabel}</span>
          </span>
          <input
            type="range"
            className="playground__pgn-speed-input"
            value={autoplayIntervalMs}
            min={autoplaySpeedOptions.min}
            max={autoplaySpeedOptions.max}
            step={autoplaySpeedOptions.step}
            onChange={handleAutoplaySpeedInputChange}
            aria-label="Autoplay speed"
            disabled={!canAutoplay}
          />
        </label>
      </div>

      <textarea
        className="playground__pgn-textarea"
        value={pgn}
        readOnly
        placeholder="Current PGN will appear here"
        spellCheck={false}
      />

      <div className="playground__pgn-actions">
        <button type="button" className="playground__export-button" onClick={handleExport}>
          Export current PGN
        </button>
      </div>

      <p
        className={
          error ? 'playground__pgn-helper playground__pgn-helper--error' : 'playground__pgn-helper'
        }
      >
        {helperText}
      </p>
    </div>
  );
};

export default PgnPanel;
