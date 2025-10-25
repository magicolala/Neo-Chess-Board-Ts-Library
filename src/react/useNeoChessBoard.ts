import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { MutableRefObject } from 'react';
import { NeoChessBoard as Chessboard } from '../core/NeoChessBoard';
import type {
  BoardEventMap,
  BoardOptions,
  ClockCallbacks,
  ClockConfig,
  ClockSideConfig,
  ClockState,
  ClockStateUpdate,
  Color,
} from '../core/types';
import type { NeoChessRef } from './NeoChessBoard';

export type UpdatableBoardOptions = Omit<BoardOptions, 'fen' | 'rulesAdapter'>;

export interface UseNeoChessBoardOptions {
  fen?: string;
  position?: string;
  options?: UpdatableBoardOptions;
  onMove?: (event: BoardEventMap['move']) => void;
  onIllegal?: (event: BoardEventMap['illegal']) => void;
  onUpdate?: (event: BoardEventMap['update']) => void;
  onSquareClick?: (event: BoardEventMap['squareClick']) => void;
  onSquareMouseDown?: (event: BoardEventMap['squareMouseDown']) => void;
  onSquareMouseUp?: (event: BoardEventMap['squareMouseUp']) => void;
  onSquareRightClick?: (event: BoardEventMap['squareRightClick']) => void;
  onSquareMouseOver?: (event: BoardEventMap['squareMouseOver']) => void;
  onSquareMouseOut?: (event: BoardEventMap['squareMouseOut']) => void;
  onPieceClick?: (event: BoardEventMap['pieceClick']) => void;
  onPieceDrag?: (event: BoardEventMap['pieceDrag']) => void;
  onPieceDrop?: (event: BoardEventMap['pieceDrop']) => void;
  onClockChange?: (state: ClockState) => void;
  onClockStart?: (state: ClockState) => void;
  onClockPause?: (state: ClockState) => void;
  onClockFlag?: (event: BoardEventMap['clockFlag']) => void;
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

const CLOCK_COLORS: Color[] = ['w', 'b'];

function normalizeClockValue(
  value: ClockConfig['initial'],
): number | Partial<Record<Color, number>> | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return Math.floor(value);
  }
  if (!value || typeof value !== 'object') {
    return undefined;
  }

  const normalized: Partial<Record<Color, number>> = {};
  for (const color of CLOCK_COLORS) {
    const candidate = value[color];
    if (typeof candidate === 'number' && Number.isFinite(candidate)) {
      normalized[color] = Math.floor(candidate);
    }
  }

  return Object.keys(normalized).length > 0 ? normalized : undefined;
}

function normalizeClockSideConfig(side?: ClockSideConfig): Record<string, number> | undefined {
  if (!side || typeof side !== 'object') {
    return undefined;
  }

  const normalized: Record<string, number> = {};

  if (typeof side.initial === 'number' && Number.isFinite(side.initial)) {
    normalized.initial = Math.floor(side.initial);
  }
  if (typeof side.increment === 'number' && Number.isFinite(side.increment)) {
    normalized.increment = Math.floor(side.increment);
  }
  if (typeof side.remaining === 'number' && Number.isFinite(side.remaining)) {
    normalized.remaining = Math.floor(side.remaining);
  }

  return Object.keys(normalized).length > 0 ? normalized : undefined;
}

function normalizeClockSides(
  sides: ClockConfig['sides'],
): Partial<Record<Color, Record<string, number>>> | undefined {
  if (!sides || typeof sides !== 'object') {
    return undefined;
  }

  const normalized: Partial<Record<Color, Record<string, number>>> = {};
  for (const color of CLOCK_COLORS) {
    const side = normalizeClockSideConfig(sides[color]);
    if (side) {
      normalized[color] = side;
    }
  }

  return Object.keys(normalized).length > 0 ? normalized : undefined;
}

function normalizeClockConfig(clock?: ClockConfig): Record<string, unknown> | null {
  if (!clock) {
    return null;
  }

  const normalized: Record<string, unknown> = {};

  const initial = normalizeClockValue(clock.initial);
  if (typeof initial !== 'undefined') {
    normalized.initial = initial;
  }

  const increment = normalizeClockValue(clock.increment);
  if (typeof increment !== 'undefined') {
    normalized.increment = increment;
  }

  const sides = normalizeClockSides(clock.sides);
  if (sides) {
    normalized.sides = sides;
  }

  if (Object.prototype.hasOwnProperty.call(clock, 'active')) {
    normalized.active = clock.active ?? null;
  }

  if (Object.prototype.hasOwnProperty.call(clock, 'paused')) {
    normalized.paused = clock.paused === true;
  }

  return normalized;
}

function serializeClockConfig(clock?: ClockConfig): string | null {
  const normalized = normalizeClockConfig(clock);
  if (!normalized) {
    return null;
  }
  if (Object.keys(normalized).length === 0) {
    return '{}';
  }
  const ordered: Record<string, unknown> = {};
  if (typeof normalized.initial !== 'undefined') {
    ordered.initial = normalized.initial;
  }
  if (typeof normalized.increment !== 'undefined') {
    ordered.increment = normalized.increment;
  }
  if (typeof normalized.sides !== 'undefined') {
    ordered.sides = normalized.sides;
  }
  if (Object.prototype.hasOwnProperty.call(normalized, 'active')) {
    ordered.active = normalized.active;
  }
  if (Object.prototype.hasOwnProperty.call(normalized, 'paused')) {
    ordered.paused = normalized.paused;
  }
  return JSON.stringify(ordered);
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
  position,
  options,
  onMove,
  onIllegal,
  onUpdate,
  onSquareClick,
  onSquareMouseDown,
  onSquareMouseUp,
  onSquareRightClick,
  onSquareMouseOver,
  onSquareMouseOut,
  onPieceClick,
  onPieceDrag,
  onPieceDrop,
  onClockChange,
  onClockStart,
  onClockPause,
  onClockFlag,
}: UseNeoChessBoardOptions): UseNeoChessBoardResult {
  const resolvedOptions = options ?? {};
  const containerRef = useRef<HTMLDivElement | null>(null);
  const boardRef = useRef<Chessboard | null>(null);
  const [isReady, setIsReady] = useState(false);

  const fenRef = useLatestRef(fen);
  const positionRef = useLatestRef(position);
  const optionsRef = useLatestRef(resolvedOptions);
  const handlersRef = useLatestRef({
    onMove,
    onIllegal,
    onUpdate,
    onSquareClick,
    onSquareMouseDown,
    onSquareMouseUp,
    onSquareRightClick,
    onSquareMouseOver,
    onSquareMouseOut,
    onPieceClick,
    onPieceDrag,
    onPieceDrop,
    onClockChange,
    onClockStart,
    onClockPause,
    onClockFlag,
  });

  const lastClockConfigRef = useRef<string | null>(serializeClockConfig(resolvedOptions.clock));
  const lastClockCallbacksRef = useRef<ClockCallbacks | null>(
    resolvedOptions.clock?.callbacks ?? null,
  );

  useEffect(() => {
    const element = containerRef.current;
    if (!element || boardRef.current) {
      return;
    }

    const initialFen = fenRef.current ?? positionRef.current ?? optionsRef.current.position;
    const board = new Chessboard(element, {
      ...optionsRef.current,
      fen: initialFen,
      position: positionRef.current ?? optionsRef.current.position,
    });
    boardRef.current = board;
    lastClockConfigRef.current = serializeClockConfig(optionsRef.current.clock);
    lastClockCallbacksRef.current = optionsRef.current.clock?.callbacks ?? null;
    setIsReady(true);

    return () => {
      board.destroy();
      boardRef.current = null;
      setIsReady(false);
    };
  }, [containerRef, optionsRef, fenRef, positionRef]);

  useEffect(() => {
    if (!isReady) {
      return;
    }

    const board = boardRef.current;
    if (!board) {
      return;
    }

    const unsubscribers = [
      board.on('move', (event) => handlersRef.current.onMove?.(event)),
      board.on('illegal', (event) => handlersRef.current.onIllegal?.(event)),
      board.on('update', (event) => handlersRef.current.onUpdate?.(event)),
      board.on('squareClick', (event) => handlersRef.current.onSquareClick?.(event)),
      board.on('squareMouseDown', (event) => handlersRef.current.onSquareMouseDown?.(event)),
      board.on('squareMouseUp', (event) => handlersRef.current.onSquareMouseUp?.(event)),
      board.on('squareRightClick', (event) => handlersRef.current.onSquareRightClick?.(event)),
      board.on('squareMouseOver', (event) => handlersRef.current.onSquareMouseOver?.(event)),
      board.on('squareMouseOut', (event) => handlersRef.current.onSquareMouseOut?.(event)),
      board.on('pieceClick', (event) => handlersRef.current.onPieceClick?.(event)),
      board.on('pieceDrag', (event) => handlersRef.current.onPieceDrag?.(event)),
      board.on('pieceDrop', (event) => handlersRef.current.onPieceDrop?.(event)),
      board.on('clockChange', (event) => handlersRef.current.onClockChange?.(event)),
      board.on('clockStart', (event) => handlersRef.current.onClockStart?.(event)),
      board.on('clockPause', (event) => handlersRef.current.onClockPause?.(event)),
      board.on('clockFlag', (event) => handlersRef.current.onClockFlag?.(event)),
    ];

    return () => {
      for (const off of unsubscribers) {
        off?.();
      }
    };
  }, [handlersRef, isReady]);

  useEffect(() => {
    const resolvedFen = typeof fen !== 'undefined' ? fen : position;

    if (!isReady || typeof resolvedFen === 'undefined') {
      return;
    }

    const board = boardRef.current;
    if (!board) {
      return;
    }

    if (board.getPosition() !== resolvedFen) {
      board.setFEN(resolvedFen);
    }
  }, [fen, position, isReady]);

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

  const applyClockConfig = useCallback((board: Chessboard, clock: BoardOptions['clock']) => {
    const serialized = serializeClockConfig(clock as ClockConfig | undefined);
    if (serialized !== lastClockConfigRef.current) {
      board.setClockConfig(clock);
      lastClockConfigRef.current = serialized;
    }

    const nextCallbacks = (clock?.callbacks ?? null) as ClockCallbacks | null;
    if (nextCallbacks !== lastClockCallbacksRef.current) {
      board.setClockCallbacks(nextCallbacks);
    }
    lastClockCallbacksRef.current = nextCallbacks;
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

  const applySoundEventUrls = useCallback(
    (board: Chessboard, urls: BoardOptions['soundEventUrls']) => board.setSoundEventUrls(urls),
    [],
  );

  const applyAutoFlip = useCallback((board: Chessboard, autoFlip: BoardOptions['autoFlip']) => {
    if (typeof autoFlip === 'undefined') {
      return;
    }
    board.setAutoFlip(autoFlip);
  }, []);

  const applyAnimationDuration = useCallback((board: Chessboard, duration: number | undefined) => {
    if (typeof duration === 'undefined') {
      return;
    }
    board.setAnimationDuration(duration);
  }, []);

  const applyAnimation = useCallback((board: Chessboard, animation: BoardOptions['animation']) => {
    if (!animation) {
      return;
    }
    board.setAnimation(animation);
  }, []);

  const applyAnimationEasing = useCallback(
    (board: Chessboard, easing: BoardOptions['animationEasing']) => {
      if (typeof easing === 'undefined') {
        return;
      }
      board.setAnimation({ easing });
    },
    [],
  );

  const applyShowAnimations = useCallback(
    (board: Chessboard, show: BoardOptions['showAnimations']) => {
      if (typeof show === 'undefined') {
        return;
      }
      board.setShowAnimations(show);
    },
    [],
  );

  const applyDraggingEnabled = useCallback(
    (board: Chessboard, allow: BoardOptions['allowDragging']) => {
      if (typeof allow === 'undefined') {
        return;
      }
      board.setDraggingEnabled(allow);
    },
    [],
  );

  const applyAllowDragOffBoard = useCallback(
    (board: Chessboard, allow: BoardOptions['allowDragOffBoard']) => {
      if (typeof allow === 'undefined') {
        return;
      }
      board.setAllowDragOffBoard(allow);
    },
    [],
  );

  const applyAutoScroll = useCallback(
    (board: Chessboard, allow: BoardOptions['allowAutoScroll']) => {
      if (typeof allow === 'undefined') {
        return;
      }
      board.setAutoScrollEnabled(allow);
    },
    [],
  );

  const applyAllowDrawingArrows = useCallback(
    (board: Chessboard, allow: BoardOptions['allowDrawingArrows']) => {
      if (typeof allow === 'undefined') {
        return;
      }
      board.setAllowDrawingArrows(allow);
    },
    [],
  );

  const applyClearArrowsOnClick = useCallback(
    (board: Chessboard, clear: BoardOptions['clearArrowsOnClick']) => {
      if (typeof clear === 'undefined') {
        return;
      }
      board.setClearArrowsOnClick(clear);
    },
    [],
  );
  const applyArrowOptions = useCallback(
    (board: Chessboard, options: BoardOptions['arrowOptions']) => {
      board.setArrowOptions(options);
    },
    [],
  );
  const applyArrows = useCallback((board: Chessboard, arrows: BoardOptions['arrows']) => {
    board.setArrows(arrows);
  }, []);
  const applyOnArrowsChange = useCallback(
    (board: Chessboard, handler: BoardOptions['onArrowsChange']) => {
      board.setOnArrowsChange(handler);
    },
    [],
  );

  const applyCanDragPiece = useCallback(
    (board: Chessboard, evaluator: BoardOptions['canDragPiece']) => {
      board.setCanDragPiece(evaluator);
    },
    [],
  );

  const applyDragActivationDistance = useCallback(
    (board: Chessboard, distance: BoardOptions['dragActivationDistance']) => {
      if (typeof distance === 'undefined') {
        return;
      }
      board.setDragActivationDistance(distance);
    },
    [],
  );

  const applyBoardStyle = useCallback((board: Chessboard, style: BoardOptions['boardStyle']) => {
    board.setBoardStyle(style);
  }, []);

  const applyBoardId = useCallback((board: Chessboard, id: BoardOptions['id']) => {
    board.setBoardId(id);
  }, []);

  const applySquareStyle = useCallback((board: Chessboard, style: BoardOptions['squareStyle']) => {
    board.setSquareStyle(style);
  }, []);

  const applyLightSquareStyle = useCallback(
    (board: Chessboard, style: BoardOptions['lightSquareStyle']) => {
      board.setLightSquareStyle(style);
    },
    [],
  );

  const applyDarkSquareStyle = useCallback(
    (board: Chessboard, style: BoardOptions['darkSquareStyle']) => {
      board.setDarkSquareStyle(style);
    },
    [],
  );

  const applySquareStyles = useCallback(
    (board: Chessboard, styles: BoardOptions['squareStyles']) => {
      board.setSquareStyles(styles);
    },
    [],
  );

  const applyLightNotationStyle = useCallback(
    (board: Chessboard, style: BoardOptions['lightSquareNotationStyle']) => {
      board.setLightSquareNotationStyle(style);
    },
    [],
  );

  const applyDarkNotationStyle = useCallback(
    (board: Chessboard, style: BoardOptions['darkSquareNotationStyle']) => {
      board.setDarkSquareNotationStyle(style);
    },
    [],
  );

  const applyAlphaNotationStyle = useCallback(
    (board: Chessboard, style: BoardOptions['alphaNotationStyle']) => {
      board.setAlphaNotationStyle(style);
    },
    [],
  );

  const applyNumericNotationStyle = useCallback(
    (board: Chessboard, style: BoardOptions['numericNotationStyle']) => {
      board.setNumericNotationStyle(style);
    },
    [],
  );

  const applyShowNotation = useCallback((board: Chessboard, show: BoardOptions['showNotation']) => {
    if (typeof show === 'undefined') {
      return;
    }
    board.setShowNotation(show);
  }, []);

  const applySquareRenderer = useCallback(
    (board: Chessboard, renderer: BoardOptions['squareRenderer']) => {
      board.setSquareRenderer(renderer);
    },
    [],
  );

  const applyPieceRenderers = useCallback(
    (board: Chessboard, renderers: BoardOptions['pieces']) => {
      board.setPieceRenderers(renderers);
    },
    [],
  );

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
    soundEventUrls,
    autoFlip,
    clock,
    allowAutoScroll,
    allowDragging,
    allowDragOffBoard,
    canDragPiece,
    dragActivationDistance,
    showAnimations,
    animation,
    animationMs,
    animationDurationInMs,
    animationEasing,
    orientation,
    showArrows,
    showHighlights,
    allowPremoves,
    highlightLegal,
    showSquareNames,
    showNotation,
    allowDrawingArrows,
    clearArrowsOnClick,
    arrowOptions,
    arrows,
    onArrowsChange,
    boardStyle,
    id,
    squareStyle,
    lightSquareStyle,
    darkSquareStyle,
    squareStyles,
    lightSquareNotationStyle,
    darkSquareNotationStyle,
    alphaNotationStyle,
    numericNotationStyle,
    squareRenderer,
    pieces,
  } = resolvedOptions;

  const hasPieceSet = Object.prototype.hasOwnProperty.call(resolvedOptions, 'pieceSet');
  const hasSoundUrls = Object.prototype.hasOwnProperty.call(resolvedOptions, 'soundUrls');
  const hasClock = Object.prototype.hasOwnProperty.call(resolvedOptions, 'clock');
  const hasSoundEventUrls = Object.prototype.hasOwnProperty.call(resolvedOptions, 'soundEventUrls');
  const hasAnimation = typeof animation !== 'undefined';
  const hasArrowOptions = Object.prototype.hasOwnProperty.call(resolvedOptions, 'arrowOptions');
  const hasArrows = Object.prototype.hasOwnProperty.call(resolvedOptions, 'arrows');
  const hasOnArrowsChange = Object.prototype.hasOwnProperty.call(resolvedOptions, 'onArrowsChange');
  const hasBoardStyle = Object.prototype.hasOwnProperty.call(resolvedOptions, 'boardStyle');
  const hasBoardId = Object.prototype.hasOwnProperty.call(resolvedOptions, 'id');
  const hasSquareStyle = Object.prototype.hasOwnProperty.call(resolvedOptions, 'squareStyle');
  const hasLightSquareStyle = Object.prototype.hasOwnProperty.call(
    resolvedOptions,
    'lightSquareStyle',
  );
  const hasDarkSquareStyle = Object.prototype.hasOwnProperty.call(
    resolvedOptions,
    'darkSquareStyle',
  );
  const hasSquareStyles = Object.prototype.hasOwnProperty.call(resolvedOptions, 'squareStyles');
  const hasLightNotationStyle = Object.prototype.hasOwnProperty.call(
    resolvedOptions,
    'lightSquareNotationStyle',
  );
  const hasDarkNotationStyle = Object.prototype.hasOwnProperty.call(
    resolvedOptions,
    'darkSquareNotationStyle',
  );
  const hasAnimationEasing = typeof animationEasing !== 'undefined';
  const hasAlphaNotationStyle = Object.prototype.hasOwnProperty.call(
    resolvedOptions,
    'alphaNotationStyle',
  );
  const hasNumericNotationStyle = Object.prototype.hasOwnProperty.call(
    resolvedOptions,
    'numericNotationStyle',
  );
  const hasShowNotation = Object.prototype.hasOwnProperty.call(resolvedOptions, 'showNotation');
  const hasSquareRenderer = Object.prototype.hasOwnProperty.call(resolvedOptions, 'squareRenderer');
  const hasPieces = Object.prototype.hasOwnProperty.call(resolvedOptions, 'pieces');

  useBoardOption(boardRef, isReady, theme, typeof theme !== 'undefined', applyTheme);
  useBoardOption(boardRef, isReady, pieceSet, hasPieceSet, applyPieceSet);
  useBoardOption(boardRef, isReady, clock, hasClock, applyClockConfig);
  useBoardOption(
    boardRef,
    isReady,
    soundEnabled,
    typeof soundEnabled !== 'undefined',
    applySoundEnabled,
  );
  useBoardOption(boardRef, isReady, soundUrls, hasSoundUrls, applySoundUrls);
  useBoardOption(boardRef, isReady, soundEventUrls, hasSoundEventUrls, applySoundEventUrls);
  useBoardOption(boardRef, isReady, autoFlip, typeof autoFlip !== 'undefined', applyAutoFlip);
  useBoardOption(boardRef, isReady, animation, hasAnimation, applyAnimation);
  const hasAnimationMs = Object.prototype.hasOwnProperty.call(resolvedOptions, 'animationMs');
  const hasAnimationDuration = Object.prototype.hasOwnProperty.call(
    resolvedOptions,
    'animationDurationInMs',
  );
  const animationDuration = hasAnimationDuration ? animationDurationInMs : animationMs;
  const shouldApplyLegacyAnimation = !hasAnimation && (hasAnimationDuration || hasAnimationMs);
  useBoardOption(
    boardRef,
    isReady,
    animationDuration,
    shouldApplyLegacyAnimation,
    applyAnimationDuration,
  );
  useBoardOption(
    boardRef,
    isReady,
    animationEasing,
    !hasAnimation && hasAnimationEasing,
    applyAnimationEasing,
  );
  useBoardOption(
    boardRef,
    isReady,
    showAnimations,
    typeof showAnimations !== 'undefined',
    applyShowAnimations,
  );
  useBoardOption(
    boardRef,
    isReady,
    allowDragging,
    typeof allowDragging !== 'undefined',
    applyDraggingEnabled,
  );
  useBoardOption(
    boardRef,
    isReady,
    allowDragOffBoard,
    typeof allowDragOffBoard !== 'undefined',
    applyAllowDragOffBoard,
  );
  useBoardOption(
    boardRef,
    isReady,
    allowAutoScroll,
    typeof allowAutoScroll !== 'undefined',
    applyAutoScroll,
  );
  useBoardOption(
    boardRef,
    isReady,
    allowDrawingArrows,
    typeof allowDrawingArrows !== 'undefined',
    applyAllowDrawingArrows,
  );
  useBoardOption(
    boardRef,
    isReady,
    clearArrowsOnClick,
    typeof clearArrowsOnClick !== 'undefined',
    applyClearArrowsOnClick,
  );
  const hasCanDragPiece = Object.prototype.hasOwnProperty.call(resolvedOptions, 'canDragPiece');
  useBoardOption(boardRef, isReady, canDragPiece, hasCanDragPiece, applyCanDragPiece);
  useBoardOption(
    boardRef,
    isReady,
    dragActivationDistance,
    typeof dragActivationDistance !== 'undefined',
    applyDragActivationDistance,
  );
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
  useBoardOption(boardRef, isReady, showNotation, hasShowNotation, applyShowNotation);
  useBoardOption(boardRef, isReady, boardStyle, hasBoardStyle, applyBoardStyle);
  useBoardOption(boardRef, isReady, id, hasBoardId, applyBoardId);
  useBoardOption(boardRef, isReady, squareStyle, hasSquareStyle, applySquareStyle);
  useBoardOption(boardRef, isReady, lightSquareStyle, hasLightSquareStyle, applyLightSquareStyle);
  useBoardOption(boardRef, isReady, darkSquareStyle, hasDarkSquareStyle, applyDarkSquareStyle);
  useBoardOption(boardRef, isReady, squareStyles, hasSquareStyles, applySquareStyles);
  useBoardOption(
    boardRef,
    isReady,
    lightSquareNotationStyle,
    hasLightNotationStyle,
    applyLightNotationStyle,
  );
  useBoardOption(
    boardRef,
    isReady,
    darkSquareNotationStyle,
    hasDarkNotationStyle,
    applyDarkNotationStyle,
  );
  useBoardOption(
    boardRef,
    isReady,
    alphaNotationStyle,
    hasAlphaNotationStyle,
    applyAlphaNotationStyle,
  );
  useBoardOption(
    boardRef,
    isReady,
    numericNotationStyle,
    hasNumericNotationStyle,
    applyNumericNotationStyle,
  );
  useBoardOption(boardRef, isReady, arrowOptions, hasArrowOptions, applyArrowOptions);
  useBoardOption(boardRef, isReady, arrows, hasArrows, applyArrows);
  useBoardOption(boardRef, isReady, onArrowsChange, hasOnArrowsChange, applyOnArrowsChange);
  useBoardOption(boardRef, isReady, squareRenderer, hasSquareRenderer, applySquareRenderer);
  useBoardOption(boardRef, isReady, pieces, hasPieces, applyPieceRenderers);

  const getTimestamp = useCallback(() => {
    if (typeof performance !== 'undefined' && typeof performance.now === 'function') {
      return performance.now();
    }
    return Date.now();
  }, []);

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

  const getClockState = useCallback(() => boardRef.current?.getClockState() ?? null, [boardRef]);

  const setClockConfigRef = useCallback(
    (clock?: BoardOptions['clock']) => {
      boardRef.current?.setClockConfig(clock);
    },
    [boardRef],
  );

  const updateClockState = useCallback(
    (update: ClockStateUpdate) => {
      boardRef.current?.updateClockState(update);
    },
    [boardRef],
  );

  const setClockCallbacksRef = useCallback(
    (callbacks?: ClockCallbacks | null) => {
      boardRef.current?.setClockCallbacks(callbacks ?? undefined);
    },
    [boardRef],
  );

  const startClock = useCallback(
    (color?: Color | null) => {
      const board = boardRef.current;
      if (!board) {
        return;
      }
      const state = board.getClockState();
      const targetColor: Color | null =
        typeof color === 'undefined' || color === null
          ? (state?.active ?? (board.getTurn() as Color))
          : color;
      board.updateClockState({
        active: targetColor,
        running: true,
        paused: false,
        timestamp: getTimestamp(),
      });
    },
    [boardRef, getTimestamp],
  );

  const pauseClock = useCallback(() => {
    const board = boardRef.current;
    if (!board) {
      return;
    }
    board.updateClockState({ running: false, paused: true, active: null, timestamp: null });
  }, [boardRef]);

  const setClockTime = useCallback(
    (color: Color, milliseconds: number) => {
      const board = boardRef.current;
      if (!board) {
        return;
      }
      const clamped = Math.max(0, Math.floor(milliseconds));
      const update: ClockStateUpdate = { timestamp: getTimestamp() };
      const sideUpdate: Partial<ClockState['white']> = {
        remaining: clamped,
        isFlagged: clamped === 0,
      };
      if (color === 'w') {
        update.white = sideUpdate;
      } else {
        update.black = sideUpdate;
      }
      board.updateClockState(update);
    },
    [boardRef, getTimestamp],
  );

  const api = useMemo<NeoChessRef>(
    () => ({
      getBoard,
      addArrow,
      addHighlight,
      clearArrows,
      clearHighlights,
      getClockState,
      setClockConfig: setClockConfigRef,
      updateClockState,
      setClockCallbacks: setClockCallbacksRef,
      startClock,
      pauseClock,
      setClockTime,
    }),
    [
      addArrow,
      addHighlight,
      clearArrows,
      clearHighlights,
      getBoard,
      getClockState,
      pauseClock,
      setClockCallbacksRef,
      setClockConfigRef,
      setClockTime,
      startClock,
      updateClockState,
    ],
  );

  return {
    containerRef,
    boardRef,
    isReady,
    api,
  };
}
