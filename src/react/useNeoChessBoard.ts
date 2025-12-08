import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { MutableRefObject } from 'react';
import { NeoChessBoard as Chessboard } from '../core/NeoChessBoard';
import type { BoardEventMap, BoardOptions, ClockConfig, ClockState, Color } from '../core/types';
import type { NeoChessRef } from './NeoChessBoard';

export type UpdatableBoardOptions = Omit<BoardOptions, 'fen' | 'rulesAdapter'>;

/** Handlers pour les événements de mouvement et validation */
export interface MoveHandlers {
  onMove?: (event: BoardEventMap['move']) => void;
  onIllegal?: (event: BoardEventMap['illegal']) => void;
  onUpdate?: (event: BoardEventMap['update']) => void;
}

/** Handlers pour les événements de clic/interaction sur les cases */
export interface SquareHandlers {
  onSquareClick?: (event: BoardEventMap['squareClick']) => void;
  onSquareMouseDown?: (event: BoardEventMap['squareMouseDown']) => void;
  onSquareMouseUp?: (event: BoardEventMap['squareMouseUp']) => void;
  onSquareRightClick?: (event: BoardEventMap['squareRightClick']) => void;
  onSquareMouseOver?: (event: BoardEventMap['squareMouseOver']) => void;
  onSquareMouseOut?: (event: BoardEventMap['squareMouseOut']) => void;
}

/** Handlers pour les événements de pièces */
export interface PieceHandlers {
  onPieceClick?: (event: BoardEventMap['pieceClick']) => void;
  onPieceDrag?: (event: BoardEventMap['pieceDrag']) => void;
  onPieceDrop?: (event: BoardEventMap['pieceDrop']) => void;
}

/** Handlers pour les événements d'horloge */
export interface ClockHandlers {
  onClockChange?: (state: ClockState) => void;
  onClockStart?: () => void;
  onClockPause?: () => void;
  onClockFlag?: (event: BoardEventMap['clock:flag']) => void;
}

/** Configuration complète pour le hook useNeoChessBoard */
export interface UseNeoChessBoardOptions
  extends MoveHandlers,
    SquareHandlers,
    PieceHandlers,
    ClockHandlers {
  /** Position FEN initiale */
  fen?: string;
  /** Position ou alias (e.g., 'start') */
  position?: string;
  /** Options additionnelles du board */
  options?: UpdatableBoardOptions;
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

function normalizePerSide(
  value?: number | { w: number; b: number },
): { w: number; b: number } | null {
  if (value === undefined) {
    return null;
  }
  if (typeof value === 'number' && Number.isFinite(value)) {
    const ms = Math.max(0, Math.floor(value));
    return { w: ms, b: ms };
  }
  if (value && typeof value === 'object') {
    const w = value.w;
    const b = value.b;
    if (
      typeof w === 'number' &&
      Number.isFinite(w) &&
      typeof b === 'number' &&
      Number.isFinite(b)
    ) {
      return { w: Math.max(0, Math.floor(w)), b: Math.max(0, Math.floor(b)) };
    }
  }
  return null;
}

function serializeClockConfig(clock?: ClockConfig): string | null {
  if (!clock) {
    return null;
  }

  const initial = normalizePerSide(clock.initial);
  if (!initial) {
    return null;
  }

  const payload: Record<string, unknown> = { initial };

  const increment = normalizePerSide(clock.increment);
  if (increment) {
    payload.increment = increment;
  }

  const delay = normalizePerSide(clock.delay);
  if (delay) {
    payload.delay = delay;
  }

  if (clock.active === 'w' || clock.active === 'b') {
    payload.active = clock.active;
  }

  if (Object.prototype.hasOwnProperty.call(clock, 'paused')) {
    payload.paused = clock.paused === true;
  }

  return JSON.stringify(payload);
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

/**
 * Crée un objet consolidé de handlers à partir de l'interface
 */
function createEventHandlers(options: UseNeoChessBoardOptions) {
  return {
    // Move handlers
    onMove: options.onMove,
    onIllegal: options.onIllegal,
    onUpdate: options.onUpdate,
    // Square handlers
    onSquareClick: options.onSquareClick,
    onSquareMouseDown: options.onSquareMouseDown,
    onSquareMouseUp: options.onSquareMouseUp,
    onSquareRightClick: options.onSquareRightClick,
    onSquareMouseOver: options.onSquareMouseOver,
    onSquareMouseOut: options.onSquareMouseOut,
    // Piece handlers
    onPieceClick: options.onPieceClick,
    onPieceDrag: options.onPieceDrag,
    onPieceDrop: options.onPieceDrop,
    // Clock handlers
    onClockChange: options.onClockChange,
    onClockStart: options.onClockStart,
    onClockPause: options.onClockPause,
    onClockFlag: options.onClockFlag,
  };
}

export function useNeoChessBoard(options: UseNeoChessBoardOptions): UseNeoChessBoardResult {
  const resolvedOptions = options.options ?? {};
  const containerRef = useRef<HTMLDivElement | null>(null);
  const boardRef = useRef<Chessboard | null>(null);
  const [isReady, setIsReady] = useState(false);

  const fenRef = useLatestRef(options.fen);
  const positionRef = useLatestRef(options.position);
  const optionsRef = useLatestRef(resolvedOptions);
  const handlersRef = useLatestRef(createEventHandlers(options));

  const lastClockConfigRef = useRef<string | null>(serializeClockConfig(resolvedOptions.clock));
  const lastClockCallbacksRef = useRef<ClockConfig['callbacks'] | undefined>(
    resolvedOptions.clock?.callbacks,
  );

  useEffect(() => {
    let mounted = true;

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
    lastClockCallbacksRef.current = optionsRef.current.clock?.callbacks;

    if (mounted) {
      setIsReady(true);
    }

    return () => {
      mounted = false;
      board.destroy();
      boardRef.current = null;
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
      board.on('clock:change', (event) => handlersRef.current.onClockChange?.(event)),
      board.on('clock:start', () => handlersRef.current.onClockStart?.()),
      board.on('clock:pause', () => handlersRef.current.onClockPause?.()),
      board.on('clock:flag', (event) => handlersRef.current.onClockFlag?.(event)),
    ];

    return () => {
      for (const off of unsubscribers) {
        off?.();
      }
    };
  }, [handlersRef, isReady]);

  useEffect(() => {
    const resolvedFen = options.fen === undefined ? options.position : options.fen;

    if (!isReady || resolvedFen === undefined) {
      return;
    }

    const board = boardRef.current;
    if (!board) {
      return;
    }

    if (board.getPosition() !== resolvedFen) {
      board.setFEN(resolvedFen);
    }
  }, [options.fen, options.position, isReady]);

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
    board.setPieceSet(nextPieceSet ?? undefined);
  }, []);

  const applyClockConfig = useCallback((board: Chessboard, clock: BoardOptions['clock']) => {
    const serialized = serializeClockConfig(clock as ClockConfig | undefined);
    const callbacks = clock?.callbacks;

    if (clock === undefined) {
      if (lastClockConfigRef.current !== null || lastClockCallbacksRef.current !== undefined) {
        board.resetClock(null);
        lastClockConfigRef.current = null;
        lastClockCallbacksRef.current = undefined;
      }
      return;
    }

    if (serialized !== lastClockConfigRef.current) {
      board.resetClock(clock as ClockConfig);
      lastClockConfigRef.current = serialized;
      lastClockCallbacksRef.current = callbacks;
      return;
    }

    if (callbacks !== lastClockCallbacksRef.current) {
      board.resetClock({ callbacks });
      lastClockCallbacksRef.current = callbacks;
    }
  }, []);

  const applySoundEnabled = useCallback(
    (board: Chessboard, enabled: BoardOptions['soundEnabled']) => {
      if (enabled === undefined) {
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

  const applyPromotionOptions = useCallback(
    (board: Chessboard, promotion: BoardOptions['promotion']) => {
      board.configure({ promotion });
    },
    [],
  );

  const applyAutoFlip = useCallback((board: Chessboard, autoFlip: BoardOptions['autoFlip']) => {
    if (autoFlip === undefined) {
      return;
    }
    board.setAutoFlip(autoFlip);
  }, []);

  const applyAnimationDuration = useCallback((board: Chessboard, duration: number | undefined) => {
    if (duration === undefined) {
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
      if (easing === undefined) {
        return;
      }
      board.setAnimation({ easing });
    },
    [],
  );

  const applyShowAnimations = useCallback(
    (board: Chessboard, show: BoardOptions['showAnimations']) => {
      if (show === undefined) {
        return;
      }
      board.setShowAnimations(show);
    },
    [],
  );

  const applyDraggingEnabled = useCallback(
    (board: Chessboard, allow: BoardOptions['allowDragging']) => {
      if (allow === undefined) {
        return;
      }
      board.setDraggingEnabled(allow);
    },
    [],
  );

  const applyAllowDragOffBoard = useCallback(
    (board: Chessboard, allow: BoardOptions['allowDragOffBoard']) => {
      if (allow === undefined) {
        return;
      }
      board.setAllowDragOffBoard(allow);
    },
    [],
  );

  const applyAutoScroll = useCallback(
    (board: Chessboard, allow: BoardOptions['allowAutoScroll']) => {
      if (allow === undefined) {
        return;
      }
      board.setAutoScrollEnabled(allow);
    },
    [],
  );

  const applyAllowDrawingArrows = useCallback(
    (board: Chessboard, allow: BoardOptions['allowDrawingArrows']) => {
      if (allow === undefined) {
        return;
      }
      board.setAllowDrawingArrows(allow);
    },
    [],
  );

  const applyClearArrowsOnClick = useCallback(
    (board: Chessboard, clear: BoardOptions['clearArrowsOnClick']) => {
      if (clear === undefined) {
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
      if (distance === undefined) {
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
    if (show === undefined) {
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
    if (show === undefined) {
      return;
    }
    board.setShowArrows(show);
  }, []);

  const applyShowHighlights = useCallback(
    (board: Chessboard, show: BoardOptions['showHighlights']) => {
      if (show === undefined) {
        return;
      }
      board.setShowHighlights(show);
    },
    [],
  );

  const applyAllowPremoves = useCallback(
    (board: Chessboard, allow: BoardOptions['allowPremoves']) => {
      if (allow === undefined) {
        return;
      }
      board.setAllowPremoves(allow);
    },
    [],
  );

  const applyHighlightLegal = useCallback(
    (board: Chessboard, highlight: BoardOptions['highlightLegal']) => {
      if (highlight === undefined) {
        return;
      }
      board.setHighlightLegal(highlight);
    },
    [],
  );

  const applyShowSquareNames = useCallback(
    (board: Chessboard, show: BoardOptions['showSquareNames']) => {
      if (show === undefined) {
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
    promotion,
  } = resolvedOptions;

  const hasPieceSet = Object.prototype.hasOwnProperty.call(resolvedOptions, 'pieceSet');
  const hasSoundUrls = Object.prototype.hasOwnProperty.call(resolvedOptions, 'soundUrls');
  const hasClock = Object.prototype.hasOwnProperty.call(resolvedOptions, 'clock');
  const hasSoundEventUrls = Object.prototype.hasOwnProperty.call(resolvedOptions, 'soundEventUrls');
  const hasAnimation = animation !== undefined;
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
  const hasAnimationEasing = animationEasing !== undefined;
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
  const hasPromotion = Object.prototype.hasOwnProperty.call(resolvedOptions, 'promotion');

  useBoardOption(boardRef, isReady, theme, theme !== undefined, applyTheme);
  useBoardOption(boardRef, isReady, pieceSet, hasPieceSet, applyPieceSet);
  useBoardOption(boardRef, isReady, clock, hasClock, applyClockConfig);
  useBoardOption(boardRef, isReady, soundEnabled, soundEnabled !== undefined, applySoundEnabled);
  useBoardOption(boardRef, isReady, soundUrls, hasSoundUrls, applySoundUrls);
  useBoardOption(boardRef, isReady, soundEventUrls, hasSoundEventUrls, applySoundEventUrls);
  useBoardOption(boardRef, isReady, promotion, hasPromotion, applyPromotionOptions);
  useBoardOption(boardRef, isReady, autoFlip, autoFlip !== undefined, applyAutoFlip);
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
    showAnimations !== undefined,
    applyShowAnimations,
  );
  useBoardOption(
    boardRef,
    isReady,
    allowDragging,
    allowDragging !== undefined,
    applyDraggingEnabled,
  );
  useBoardOption(
    boardRef,
    isReady,
    allowDragOffBoard,
    allowDragOffBoard !== undefined,
    applyAllowDragOffBoard,
  );
  useBoardOption(
    boardRef,
    isReady,
    allowAutoScroll,
    allowAutoScroll !== undefined,
    applyAutoScroll,
  );
  useBoardOption(
    boardRef,
    isReady,
    allowDrawingArrows,
    allowDrawingArrows !== undefined,
    applyAllowDrawingArrows,
  );
  useBoardOption(
    boardRef,
    isReady,
    clearArrowsOnClick,
    clearArrowsOnClick !== undefined,
    applyClearArrowsOnClick,
  );
  const hasCanDragPiece = Object.prototype.hasOwnProperty.call(resolvedOptions, 'canDragPiece');
  useBoardOption(boardRef, isReady, canDragPiece, hasCanDragPiece, applyCanDragPiece);
  useBoardOption(
    boardRef,
    isReady,
    dragActivationDistance,
    dragActivationDistance !== undefined,
    applyDragActivationDistance,
  );
  useBoardOption(boardRef, isReady, orientation, orientation !== undefined, applyOrientation);
  useBoardOption(boardRef, isReady, showArrows, showArrows !== undefined, applyShowArrows);
  useBoardOption(
    boardRef,
    isReady,
    showHighlights,
    showHighlights !== undefined,
    applyShowHighlights,
  );
  useBoardOption(boardRef, isReady, allowPremoves, allowPremoves !== undefined, applyAllowPremoves);
  useBoardOption(
    boardRef,
    isReady,
    highlightLegal,
    highlightLegal !== undefined,
    applyHighlightLegal,
  );
  useBoardOption(
    boardRef,
    isReady,
    showSquareNames,
    showSquareNames !== undefined,
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

  const startClock = useCallback(() => {
    boardRef.current?.startClock();
  }, [boardRef]);

  const pauseClock = useCallback(() => {
    boardRef.current?.pauseClock();
  }, [boardRef]);

  const setClockTime = useCallback(
    (color: Color, milliseconds: number) => {
      boardRef.current?.setClockTime(color, milliseconds);
    },
    [boardRef],
  );

  const addClockTime = useCallback(
    (color: Color, milliseconds: number) => {
      boardRef.current?.addClockTime(color, milliseconds);
    },
    [boardRef],
  );

  const resetClock = useCallback(
    (config?: Partial<ClockConfig> | null) => {
      boardRef.current?.resetClock(config);
    },
    [boardRef],
  );

  const api = useMemo<NeoChessRef>(
    () => ({
      getBoard,
      addArrow,
      addHighlight,
      clearArrows,
      clearHighlights,
      getClockState,
      startClock,
      pauseClock,
      setClockTime,
      addClockTime,
      resetClock,
    }),
    [
      addArrow,
      addHighlight,
      addClockTime,
      clearArrows,
      clearHighlights,
      getBoard,
      getClockState,
      pauseClock,
      resetClock,
      setClockTime,
      startClock,
    ],
  );

  return {
    containerRef,
    boardRef,
    isReady,
    api,
  };
}
