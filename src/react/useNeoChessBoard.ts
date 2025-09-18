import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { MutableRefObject } from 'react';
import { NeoChessBoard as Chessboard } from '../core/NeoChessBoard';
import type { BoardOptions, Square } from '../core/types';
import type { NeoChessRef } from './NeoChessBoard';

export type UpdatableBoardOptions = Omit<BoardOptions, 'fen' | 'rulesAdapter'>;

export interface UseNeoChessBoardOptions {
  fen?: string;
  options?: UpdatableBoardOptions;
  onMove?: (event: { from: Square; to: Square; fen: string }) => void;
  onIllegal?: (event: { from: Square; to: Square; reason: string }) => void;
  onUpdate?: (event: { fen: string }) => void;
}

export interface UseNeoChessBoardResult {
  containerRef: MutableRefObject<HTMLDivElement | null>;
  boardRef: MutableRefObject<Chessboard | null>;
  isReady: boolean;
  api: NeoChessRef;
}

function useLatestRef<T>(value: T) {
  const ref = useRef(value);

  useEffect(() => {
    ref.current = value;
  }, [value]);

  return ref;
}

function useBoardOption<T>(
  boardRef: MutableRefObject<Chessboard | null>,
  isReady: boolean,
  value: T,
  shouldApply: boolean,
  apply: (board: Chessboard, value: T) => void,
) {
  useEffect(() => {
    if (!isReady || !shouldApply) {
      return;
    }

    const board = boardRef.current;
    if (!board) {
      return;
    }

    apply(board, value);
  }, [apply, boardRef, isReady, shouldApply, value]);
}

export function useNeoChessBoard({
  fen,
  options,
  onMove,
  onIllegal,
  onUpdate,
}: UseNeoChessBoardOptions): UseNeoChessBoardResult {
  const resolvedOptions = options ?? {};
  const containerRef = useRef<HTMLDivElement | null>(null);
  const boardRef = useRef<Chessboard | null>(null);
  const [isReady, setIsReady] = useState(false);

  const fenRef = useLatestRef(fen);
  const optionsRef = useLatestRef(resolvedOptions);
  const handlersRef = useLatestRef({ onMove, onIllegal, onUpdate });

  useEffect(() => {
    const element = containerRef.current;
    if (!element || boardRef.current) {
      return;
    }

    const board = new Chessboard(element, {
      ...optionsRef.current,
      fen: fenRef.current,
    });
    boardRef.current = board;
    setIsReady(true);

    return () => {
      board.destroy();
      boardRef.current = null;
      setIsReady(false);
    };
  }, [containerRef, optionsRef, fenRef]);

  useEffect(() => {
    if (!isReady) {
      return;
    }

    const board = boardRef.current;
    if (!board) {
      return;
    }

    const offMove = board.on('move', (event) => handlersRef.current.onMove?.(event));
    const offIllegal = board.on('illegal', (event) => handlersRef.current.onIllegal?.(event));
    const offUpdate = board.on('update', (event) => handlersRef.current.onUpdate?.(event));

    return () => {
      offMove?.();
      offIllegal?.();
      offUpdate?.();
    };
  }, [handlersRef, isReady]);

  useEffect(() => {
    if (!isReady || typeof fen === 'undefined') {
      return;
    }

    const board = boardRef.current;
    if (!board) {
      return;
    }

    if (board.getPosition() !== fen) {
      board.setFEN(fen);
    }
  }, [fen, isReady]);

  const applyTheme = useCallback((board: Chessboard, nextTheme: BoardOptions['theme']) => {
    if (!nextTheme) {
      return;
    }
    if (typeof nextTheme === 'string') {
      board.setTheme(nextTheme);
    } else {
      board.applyTheme(nextTheme);
    }
  }, []);

  const applyPieceSet = useCallback((board: Chessboard, nextPieceSet: BoardOptions['pieceSet']) => {
    void board.setPieceSet(nextPieceSet ?? undefined);
  }, []);

  const applySoundEnabled = useCallback(
    (board: Chessboard, enabled: BoardOptions['soundEnabled']) => {
      if (typeof enabled === 'undefined') {
        return;
      }
      board.setSoundEnabled(enabled);
    },
    [],
  );

  const applySoundUrls = useCallback(
    (board: Chessboard, urls: BoardOptions['soundUrls']) => board.setSoundUrls(urls),
    [],
  );

  const applyAutoFlip = useCallback((board: Chessboard, autoFlip: BoardOptions['autoFlip']) => {
    if (typeof autoFlip === 'undefined') {
      return;
    }
    board.setAutoFlip(autoFlip);
  }, []);

  const applyOrientation = useCallback(
    (board: Chessboard, orientation: BoardOptions['orientation']) => {
      if (!orientation) {
        return;
      }
      board.setOrientation(orientation);
    },
    [],
  );

  const applyShowArrows = useCallback((board: Chessboard, show: BoardOptions['showArrows']) => {
    if (typeof show === 'undefined') {
      return;
    }
    board.setShowArrows(show);
  }, []);

  const applyShowHighlights = useCallback(
    (board: Chessboard, show: BoardOptions['showHighlights']) => {
      if (typeof show === 'undefined') {
        return;
      }
      board.setShowHighlights(show);
    },
    [],
  );

  const applyAllowPremoves = useCallback(
    (board: Chessboard, allow: BoardOptions['allowPremoves']) => {
      if (typeof allow === 'undefined') {
        return;
      }
      board.setAllowPremoves(allow);
    },
    [],
  );

  const applyHighlightLegal = useCallback(
    (board: Chessboard, highlight: BoardOptions['highlightLegal']) => {
      if (typeof highlight === 'undefined') {
        return;
      }
      board.setHighlightLegal(highlight);
    },
    [],
  );

  const applyShowSquareNames = useCallback(
    (board: Chessboard, show: BoardOptions['showSquareNames']) => {
      if (typeof show === 'undefined') {
        return;
      }
      board.setShowSquareNames(show);
    },
    [],
  );

  const {
    theme,
    pieceSet,
    soundEnabled,
    soundUrls,
    autoFlip,
    orientation,
    showArrows,
    showHighlights,
    allowPremoves,
    highlightLegal,
    showSquareNames,
  } = resolvedOptions;

  const hasPieceSet = Object.prototype.hasOwnProperty.call(resolvedOptions, 'pieceSet');
  const hasSoundUrls = Object.prototype.hasOwnProperty.call(resolvedOptions, 'soundUrls');

  useBoardOption(boardRef, isReady, theme, typeof theme !== 'undefined', applyTheme);
  useBoardOption(boardRef, isReady, pieceSet, hasPieceSet, applyPieceSet);
  useBoardOption(
    boardRef,
    isReady,
    soundEnabled,
    typeof soundEnabled !== 'undefined',
    applySoundEnabled,
  );
  useBoardOption(boardRef, isReady, soundUrls, hasSoundUrls, applySoundUrls);
  useBoardOption(boardRef, isReady, autoFlip, typeof autoFlip !== 'undefined', applyAutoFlip);
  useBoardOption(
    boardRef,
    isReady,
    orientation,
    typeof orientation !== 'undefined',
    applyOrientation,
  );
  useBoardOption(boardRef, isReady, showArrows, typeof showArrows !== 'undefined', applyShowArrows);
  useBoardOption(
    boardRef,
    isReady,
    showHighlights,
    typeof showHighlights !== 'undefined',
    applyShowHighlights,
  );
  useBoardOption(
    boardRef,
    isReady,
    allowPremoves,
    typeof allowPremoves !== 'undefined',
    applyAllowPremoves,
  );
  useBoardOption(
    boardRef,
    isReady,
    highlightLegal,
    typeof highlightLegal !== 'undefined',
    applyHighlightLegal,
  );
  useBoardOption(
    boardRef,
    isReady,
    showSquareNames,
    typeof showSquareNames !== 'undefined',
    applyShowSquareNames,
  );

  const getBoard = useCallback(() => boardRef.current, [boardRef]);

  const addArrow = useCallback<NeoChessRef['addArrow']>(
    (arrow) => {
      return boardRef.current?.addArrow?.(arrow);
    },
    [boardRef],
  );

  const addHighlight = useCallback<NeoChessRef['addHighlight']>(
    (square, type) => {
      return boardRef.current?.addHighlight?.(square, type);
    },
    [boardRef],
  );

  const clearArrows = useCallback(() => {
    return boardRef.current?.clearArrows?.();
  }, [boardRef]);

  const clearHighlights = useCallback(() => {
    return boardRef.current?.clearHighlights?.();
  }, [boardRef]);

  const api = useMemo<NeoChessRef>(
    () => ({
      getBoard,
      addArrow,
      addHighlight,
      clearArrows,
      clearHighlights,
    }),
    [addArrow, addHighlight, clearArrows, clearHighlights, getBoard],
  );

  return {
    containerRef,
    boardRef,
    isReady,
    api,
  };
}
