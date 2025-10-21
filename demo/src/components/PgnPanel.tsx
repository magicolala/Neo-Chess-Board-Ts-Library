import React, { useCallback, useMemo, useRef, useState } from 'react';
import type { NeoChessRef } from '../../../src/react';
import type { ChessJsRules } from '../../../src/core/ChessJsRules';
import type { PgnNotation } from '../../../src/core/PgnNotation';

interface PgnPanelProps {
  boardRef: React.RefObject<NeoChessRef>;
  pgn: string;
  onPgnChange: (next: string) => void;
  onLog?: (message: string) => void;
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
  const baseHref =
    typeof document !== 'undefined'
      ? document.querySelector('base')?.getAttribute('href')
      : undefined;
  const base = baseHref ?? '/';
  const normalizedBase = base.endsWith('/') ? base : `${base}/`;
  const normalizedPath = relativePath.startsWith('/') ? relativePath.slice(1) : relativePath;
  return `${normalizedBase}${normalizedPath}`;
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

const PgnPanel: React.FC<PgnPanelProps> = ({ boardRef, pgn, onPgnChange, onLog }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [loadingExample, setLoadingExample] = useState<string | null>(null);

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
        setError('The provided PGN is empty.');
        setStatus(null);
        return;
      }

      const board = boardRef.current?.getBoard();
      if (!board) {
        setError('Chessboard is not ready yet.');
        setStatus(null);
        return;
      }

      const notation = getPgnNotationFromBoard(board);
      if (!notation) {
        setError('Unable to access PGN notation from the rules adapter.');
        setStatus(null);
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
        setStatus(`Loaded PGN from ${originLabel}.`);
        onLog?.(`Loaded PGN from ${originLabel}`);
      } catch (loadError) {
        console.error(loadError);
        setError('Failed to load PGN. Please verify the file content.');
        setStatus(null);
      }
    },
    [boardRef, handleBoardPgnExport, onLog, onPgnChange],
  );

  const handleFileContent = useCallback(
    async (file: File | null) => {
      if (!file) {
        return;
      }
      resetTransientMessages();
      if (!file.name.toLowerCase().endsWith('.pgn')) {
        setError('Only .pgn files are supported.');
        return;
      }
      try {
        const content = await file.text();
        applyPgnToBoard(content, file.name);
      } catch (readError) {
        console.error(readError);
        setError('Unable to read the selected file.');
      }
    },
    [applyPgnToBoard, resetTransientMessages],
  );

  const handleInputChange: React.ChangeEventHandler<HTMLInputElement> = useCallback(
    (event) => {
      const [file] = Array.from(event.target.files ?? []);
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
      const [file] = Array.from(event.dataTransfer.files ?? []);
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
        applyPgnToBoard(content, `${example.label.toLowerCase()}`);
      } catch (fetchError) {
        console.error(fetchError);
        setError('Unable to load the example PGN.');
      } finally {
        setLoadingExample(null);
      }
    },
    [applyPgnToBoard, resetTransientMessages],
  );

  const handleExport = useCallback(() => {
    resetTransientMessages();
    const exported = handleBoardPgnExport();
    if (!exported) {
      setError('There is no PGN to export yet.');
      return;
    }
    const blob = new Blob([exported], { type: 'application/x-chess-pgn' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'neo-chess-board-game.pgn';
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);
    setStatus('PGN exported successfully.');
    onLog?.('Exported current PGN.');
  }, [handleBoardPgnExport, onLog, resetTransientMessages]);

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
