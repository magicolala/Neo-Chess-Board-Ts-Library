import React, {
  useMemo,
  useState,
  useRef,
  useEffect,
  useCallback,
  useId,
  type ChangeEvent,
} from 'react';
import { NeoChessBoard } from '../src/react';
import type { NeoChessRef } from '../src/react';
import { createPromotionDialogExtension } from '../src/extensions/PromotionDialogExtension';
import { ChessJsRules } from '../src/core/ChessJsRules';
import type { PromotionRequest, PgnMoveAnnotations } from '../src/core/types';
import moveSound from './assets/souffle.ogg';
import { LoadingButton, DotLoader, LoadingOverlay, useLoadingState } from './components/Loaders';
import {
  AddArrowIcon,
  AddHighlightIcon,
  AnimationIcon,
  ArrowsIcon,
  AutoFlipIcon,
  BoardSizeIcon,
  FirstIcon,
  HighlightIcon,
  LastIcon,
  LegalMovesIcon,
  NextIcon,
  OrientationIcon,
  PauseIcon,
  PlayIcon,
  PremovesIcon,
  PreviousIcon,
  SoundIcon,
  SquareNamesIcon,
  TrashIcon,
} from './components/Icons';
import { EvaluationBar, interpretEvaluationValue } from './components/EvaluationBar';
import { useBoardSize } from './hooks/useBoardSize';
import { PlyNavigator } from './components/PlyNavigator';
import {
  createTranslationValue,
  type Language,
  TranslationContext,
  type TranslationKey,
  useTranslation,
} from './i18n/translations';
import { pickRandomElement, randomSquare } from './utils/random';
import { normalizePgn } from './utils/pgn-normalizer';

const buildStatusSnapshot = (rules: ChessJsRules) => ({
  moveNumber: rules.moveNumber(),
  turn: rules.turn(),
  inCheck: rules.inCheck(),
  isCheckmate: rules.isCheckmate(),
  isStalemate: rules.isStalemate(),
  isGameOver: rules.isGameOver(),
  legalMoves: rules.getAllMoves().length,
  halfMoves: rules.halfMoves(),
});

type GameStatus = ReturnType<typeof buildStatusSnapshot>;

interface PlyTimelineEntry {
  ply: number;
  fen: string;
  san?: string;
}

interface TimelineMove {
  from: string;
  to: string;
  promotion?: string;
}

const normalizePromotion = (value: unknown): string | undefined =>
  typeof value === 'string' ? value : undefined;

interface PlyAnnotationInfo {
  moveNumber: number;
  color: 'white' | 'black';
  san?: string;
  comment?: string;
  annotations?: PgnMoveAnnotations;
}

const sanitizeComment = (comment?: string): string | undefined => {
  if (!comment) {
    return undefined;
  }

  const trimmed = comment.trim();
  const withoutBraces =
    trimmed.startsWith('{') && trimmed.endsWith('}') ? trimmed.slice(1, -1) : trimmed;
  const cleaned = withoutBraces
    .replaceAll(/\[%[^]]*\]/g, ' ')
    .replaceAll(/:[a-zA-Z]+\[[^\]]*\](?:\{[^{}]*\})?/g, ' ')
    .replaceAll(/\s+/g, ' ')
    .trim();

  return cleaned.length > 0 ? cleaned : undefined;
};

const renderCommentSection = (
  commentText: string | undefined,
  selectedPly: number,
  translate: (key: TranslationKey, params?: Record<string, string>) => string,
): React.ReactNode => {
  if (commentText) {
    return (
      <p className="text-sm leading-relaxed text-gray-200 whitespace-pre-wrap">{commentText}</p>
    );
  }
  if (selectedPly > 0) {
    return <p className="text-sm text-gray-500 italic">{translate('comments.noComment')}</p>;
  }
  return <p className="text-sm text-gray-500 italic">{translate('comments.noMoveSelected')}</p>;
};

const getDefaultBoardOptions = (): BoardFeatureOptions => ({
  showArrows: true,
  showHighlights: true,
  allowPremoves: true,
  showSquareNames: true,
  soundEnabled: true,
  orientation: 'white',
  highlightLegal: true,
  autoFlip: false,
  allowResize: true,
  showAnimations: true,
  animationDuration: 300,
});

const extractCommentText = (
  annotations?: PgnMoveAnnotations,
  fallback?: string,
): string | undefined => {
  const sanitizedFromAnnotations = sanitizeComment(annotations?.textComment);
  if (sanitizedFromAnnotations) {
    return sanitizedFromAnnotations;
  }
  return sanitizeComment(fallback);
};

type PgnNotationInstance = ReturnType<ChessJsRules['getPgnNotation']>;
type ChessHistoryMove = ReturnType<ChessJsRules['getHistory']>[number];

const extractMetadataFen = (notation: PgnNotationInstance) => {
  const metadata = typeof notation.getMetadata === 'function' ? notation.getMetadata() : undefined;
  const normalizedSetup =
    typeof metadata?.SetUp === 'string' ? metadata.SetUp.trim().toLowerCase() : undefined;
  const metadataFen = metadata?.FEN?.trim();
  return metadataFen && (!normalizedSetup || normalizedSetup === '1' || normalizedSetup === 'true')
    ? metadataFen
    : undefined;
};

const collectEvaluationsAndAnnotations = (notation: PgnNotationInstance) => {
  const evaluationMap: Record<number, number | string> = {};
  const annotationMap: Record<number, PlyAnnotationInfo> = {};

  for (const move of notation.getMovesWithAnnotations()) {
    const baseIndex = (move.moveNumber - 1) * 2;
    if (move.evaluation?.white !== undefined) {
      evaluationMap[baseIndex + 1] = move.evaluation.white;
    }
    if (move.evaluation?.black !== undefined) {
      evaluationMap[baseIndex + 2] = move.evaluation.black;
    }

    if (move.whiteAnnotations || move.whiteComment) {
      annotationMap[baseIndex + 1] = {
        moveNumber: move.moveNumber,
        color: 'white',
        san: move.white,
        comment: extractCommentText(move.whiteAnnotations, move.whiteComment),
        annotations: move.whiteAnnotations,
      };
    }
    if (move.blackAnnotations || move.blackComment) {
      annotationMap[baseIndex + 2] = {
        moveNumber: move.moveNumber,
        color: 'black',
        san: move.black,
        comment: extractCommentText(move.blackAnnotations, move.blackComment),
        annotations: move.blackAnnotations,
      };
    }
  }

  return { evaluationMap, annotationMap };
};

const buildVerboseHistory = (history: ChessHistoryMove[]): TimelineMove[] =>
  history.map((move) => ({
    from: move.from,
    to: move.to,
    promotion: normalizePromotion(move.promotion),
  }));

const createTimelineRules = (fenFromMetadata?: string) => {
  let timelineRules = new ChessJsRules();
  const hasMetadataFen = typeof fenFromMetadata === 'string' && fenFromMetadata.length > 0;
  let metadataApplied = false;

  if (hasMetadataFen) {
    try {
      timelineRules = new ChessJsRules(fenFromMetadata);
      metadataApplied = true;
    } catch (error) {
      console.warn('Unable to rebuild the PGN timeline with the initial FEN:', error);
      timelineRules = new ChessJsRules();
    }
  }

  if (!metadataApplied) {
    timelineRules.reset();
  }

  return timelineRules;
};

const buildTimelineFromHistory = (history: TimelineMove[], fenFromMetadata?: string) => {
  const timelineRules = createTimelineRules(fenFromMetadata);
  const initialTimelineFen = timelineRules.getFEN();
  const timelineEntries: PlyTimelineEntry[] = [{ ply: 0, fen: initialTimelineFen }];

  history.forEach((move, index) => {
    const result = timelineRules.move({
      from: move.from,
      to: move.to,
      promotion: normalizePromotion(move.promotion),
    });

    if (!result.ok) {
      return;
    }

    const plyIndex = index + 1;
    const resultingFen = result.fen ?? timelineRules.getFEN();
    timelineEntries.push({
      ply: plyIndex,
      fen: resultingFen,
      san: result.move?.san,
    });
  });

  return { timelineEntries, initialTimelineFen };
};

const MIN_BOARD_SIZE = 320;
const MAX_BOARD_SIZE = 720;
const BOARD_SIZE_STEP = 20;
const DEFAULT_BOARD_SIZE = 520;

interface LiveExampleLink {
  href: string;
  icon: string;
  labelKey: TranslationKey;
  descriptionKey: TranslationKey;
}

const LIVE_EXAMPLES: LiveExampleLink[] = [
  {
    href: 'https://magicolala.github.io/Neo-Chess-Board-Ts-Library/examples/vanilla-js-example.html',
    icon: '🌐',
    labelKey: 'examples.live.vanilla.label',
    descriptionKey: 'examples.live.vanilla.description',
  },
  {
    href: 'https://magicolala.github.io/Neo-Chess-Board-Ts-Library/examples/chess-js-demo.html',
    icon: '♞',
    labelKey: 'examples.live.chessJs.label',
    descriptionKey: 'examples.live.chessJs.description',
  },
  {
    href: 'https://magicolala.github.io/Neo-Chess-Board-Ts-Library/examples/pgn-import-eval.html',
    icon: '📈',
    labelKey: 'examples.live.pgnEval.label',
    descriptionKey: 'examples.live.pgnEval.description',
  },
  {
    href: 'https://magicolala.github.io/Neo-Chess-Board-Ts-Library/examples/advanced-features.html',
    icon: '⚡',
    labelKey: 'examples.live.advanced.label',
    descriptionKey: 'examples.live.advanced.description',
  },
];

interface BoardFeatureOptions {
  showArrows: boolean;
  showHighlights: boolean;
  allowPremoves: boolean;
  showSquareNames: boolean;
  soundEnabled: boolean;
  orientation: 'white' | 'black';
  highlightLegal: boolean;
  autoFlip: boolean;
  allowResize: boolean;
  showAnimations: boolean;
  animationDuration: number;
}

const GlassPanel: React.FC<{
  children: React.ReactNode;
  className?: string;
}> = ({ children, className = '' }) => (
  <div
    className={`bg-gray-900/70 backdrop-blur-xl border border-white/10 shadow-[0_8px_30px_rgb(2,6,23,0.35)] ${className}`}
  >
    {children}
  </div>
);

const PanelHeader: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="px-4 py-3 border-b border-white/10">
    <h3 className="text-[11px] font-semibold text-gray-300 uppercase tracking-[0.14em]">
      {children}
    </h3>
  </div>
);

const getGameStatusTag = (gameStatus: GameStatus): { className: string; label: TranslationKey } => {
  if (gameStatus.isCheckmate) {
    return {
      className: 'bg-red-500/15 text-red-300 border-red-400/30',
      label: 'status.tags.checkmate',
    };
  }
  if (gameStatus.isStalemate) {
    return {
      className: 'bg-yellow-500/15 text-yellow-300 border-yellow-400/30',
      label: 'status.tags.stalemate',
    };
  }
  if (gameStatus.inCheck) {
    return {
      className: 'bg-yellow-500/15 text-yellow-300 border-yellow-400/30',
      label: 'status.tags.check',
    };
  }
  if (gameStatus.isGameOver) {
    return {
      className: 'bg-blue-500/15 text-blue-300 border-blue-400/30',
      label: 'status.tags.gameOver',
    };
  }
  return {
    className: 'bg-emerald-500/15 text-emerald-300 border-emerald-400/30',
    label: 'status.tags.inProgress',
  };
};

const getFiftyMoveRuleTag = (
  gameStatus: GameStatus,
): {
  className: string;
  label: TranslationKey;
  params?: { halfMoves: number };
} => {
  if (gameStatus.halfMoves >= 100) {
    return {
      className: 'bg-red-500/15 text-red-300 border-red-400/30',
      label: 'status.tags.fiftyReached',
    };
  }
  if (gameStatus.halfMoves >= 80) {
    return {
      className: 'bg-amber-500/15 text-amber-300 border-amber-400/30',
      label: 'status.tags.fiftyWarning',
      params: { halfMoves: 100 - gameStatus.halfMoves },
    };
  }
  return {
    className: 'bg-sky-500/15 text-sky-300 border-sky-400/30',
    label: 'status.tags.fiftyInfo',
    params: { halfMoves: 100 - gameStatus.halfMoves },
  };
};

const AppContent: React.FC = () => {
  const { translate, language, setLanguage } = useTranslation();
  const whiteLabel = translate('common.white');
  const blackLabel = translate('common.black');
  const themeNames: Record<'midnight' | 'classic', string> = {
    midnight: translate('app.themes.midnight'),
    classic: translate('app.themes.classic'),
  };
  const whiteSideLabel = language === 'fr' ? `les ${whiteLabel}` : whiteLabel;
  const blackSideLabel = language === 'fr' ? `les ${blackLabel}` : blackLabel;
  const chessRules = useMemo(() => new ChessJsRules(), []);
  const [fen, setFen] = useState<string | undefined>();
  const [theme, setTheme] = useState<'midnight' | 'classic'>('midnight');
  const [status, setStatus] = useState<GameStatus>(() => buildStatusSnapshot(chessRules));
  const [pgnText, setPgnText] = useState('');
  const [pgnError, setPgnError] = useState<string | null>(null);
  const [isPgnLoading, setIsPgnLoading] = useState(false);
  const [isImportingFromFile, setIsImportingFromFile] = useState(false);
  const [evaluationsByPly, setEvaluationsByPly] = useState<Record<number, number | string>>({});
  const [plyAnnotations, setPlyAnnotations] = useState<Record<number, PlyAnnotationInfo>>({});
  const initialFen = chessRules.getFEN();
  const timelineInitialFenRef = useRef(initialFen);
  const timelineMovesRef = useRef<TimelineMove[]>([]);
  const [plyTimeline, setPlyTimeline] = useState<PlyTimelineEntry[]>([{ ply: 0, fen: initialFen }]);
  const [fenToPlyMap, setFenToPlyMap] = useState<Record<string, number>>({
    [initialFen]: 0,
  });
  const [currentPly, setCurrentPly] = useState(0);
  const [currentEvaluation, setCurrentEvaluation] = useState<number | string | undefined>();
  const [selectedPly, setSelectedPly] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1000);
  const [boardOptions, setBoardOptions] = useState<BoardFeatureOptions>(() =>
    getDefaultBoardOptions(),
  );
  const shouldAnimateMoves = boardOptions.showAnimations && boardOptions.animationDuration > 0;
  const animationSpeedInputId = useId();
  const playbackSpeedInputId = useId();
  const pgnFileInputId = useId();
  const promotionExtensions = useMemo(() => [createPromotionDialogExtension()], []);

  const {
    containerRef: boardContainerRef,
    containerStyle: boardContainerStyle,
    size: boardSize,
    sizeLabel: boardSizeLabel,
    isResizing: isResizingBoard,
    minSize: minBoardSize,
    maxSize: maxBoardSize,
    handlePointerDown: handleBoardResizeStart,
    handlePointerMove: handleBoardResizeMove,
    handlePointerUp: handleBoardResizeEnd,
    handlePointerCancel: handleBoardResizeCancel,
    handleKeyDown: handleBoardResizeKeyDown,
    handleDoubleClick: handleBoardResizeReset,
  } = useBoardSize({
    defaultSize: DEFAULT_BOARD_SIZE,
    minSize: MIN_BOARD_SIZE,
    maxSize: MAX_BOARD_SIZE,
    step: BOARD_SIZE_STEP,
  });

  const boardRef = useRef<NeoChessRef>(null);
  const pgnFileInputRef = useRef<HTMLInputElement | null>(null);
  const selectedPlyRef = useRef(0);
  const autoplayTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const timelineMaxPly = useMemo(() => plyTimeline.at(-1)?.ply ?? 0, [plyTimeline]);
  const isAutoplayAvailable = timelineMaxPly > 0;

  const clearAutoplayTimer = useCallback(() => {
    if (autoplayTimeoutRef.current !== null) {
      clearTimeout(autoplayTimeoutRef.current);
      autoplayTimeoutRef.current = null;
    }
  }, []);

  useEffect(() => {
    selectedPlyRef.current = selectedPly;
  }, [selectedPly]);

  useEffect(() => {
    return () => {
      clearAutoplayTimer();
    };
  }, [clearAutoplayTimer]);

  useEffect(() => {
    const boardInstance = boardRef.current?.getBoard();
    if (!boardInstance || typeof boardInstance.showPgnAnnotationsForPly !== 'function') {
      return;
    }
    boardInstance.showPgnAnnotationsForPly(selectedPly);
  }, [plyAnnotations, selectedPly]);

  useEffect(() => {
    const boardInstance = boardRef.current?.getBoard();
    boardInstance?.resize?.();
  }, [boardSize]);

  const updateStatusSnapshot = useCallback(() => {
    setStatus(buildStatusSnapshot(chessRules));
  }, [chessRules]);

  const handlePromotionRequest = useCallback((request: PromotionRequest) => {
    console.info('Promotion request pending', request);
  }, []);

  const getOrientationFromFen = useCallback((fenString: string) => {
    return fenString.split(' ')[1] === 'w' ? 'white' : 'black';
  }, []);

  const syncOrientationWithFen = useCallback(
    (nextFen: string) => {
      setBoardOptions((prev) => {
        if (!prev.autoFlip) {
          return prev;
        }
        const orientation = getOrientationFromFen(nextFen);
        if (prev.orientation === orientation) {
          return prev;
        }
        return { ...prev, orientation };
      });
    },
    [getOrientationFromFen],
  );

  const formatPlyDescriptor = useCallback(
    (ply: number) => {
      if (ply <= 0) {
        return translate('evaluationBar.ply.start');
      }
      const moveNumber = Math.ceil(ply / 2);
      const isWhiteMove = ply % 2 === 1;
      const suffix = isWhiteMove ? '' : '...';
      const color = isWhiteMove ? whiteLabel : blackLabel;
      return translate('evaluationBar.ply.move', {
        moveNumber: moveNumber.toString(),
        suffix,
        color,
      });
    },
    [blackLabel, translate, whiteLabel],
  );

  const updateEvaluationFromMap = useCallback(
    (ply: number, map?: Record<number, number | string>) => {
      const source = map ?? evaluationsByPly;
      setCurrentEvaluation(source[ply]);
      setCurrentPly(ply);
      setSelectedPly(ply);
    },
    [evaluationsByPly],
  );

  const createFenToPlyMap = useCallback((timeline: PlyTimelineEntry[]) => {
    return timeline.reduce<Record<string, number>>((accumulator, entry) => {
      accumulator[entry.fen] = entry.ply;
      return accumulator;
    }, {});
  }, []);

  const setTimeline = useCallback(
    (updater: PlyTimelineEntry[] | ((previous: PlyTimelineEntry[]) => PlyTimelineEntry[])) => {
      if (typeof updater === 'function') {
        setPlyTimeline((previous) => {
          const nextTimeline = (updater as (prev: PlyTimelineEntry[]) => PlyTimelineEntry[])(
            previous,
          );
          setFenToPlyMap(createFenToPlyMap(nextTimeline));
          return nextTimeline;
        });
      } else {
        setFenToPlyMap(createFenToPlyMap(updater));
        setPlyTimeline(updater);
      }
    },
    [createFenToPlyMap],
  );

  const clearEvaluations = useCallback(() => {
    setIsAutoPlaying(false);
    clearAutoplayTimer();
    const baseFen = chessRules.getFEN();
    setEvaluationsByPly({});
    setPlyAnnotations({});
    setTimeline([{ ply: 0, fen: baseFen }]);
    setCurrentEvaluation(undefined);
    setCurrentPly(0);
    setSelectedPly(0);
    timelineInitialFenRef.current = baseFen;
    timelineMovesRef.current = [];
  }, [chessRules, clearAutoplayTimer, setIsAutoPlaying, setTimeline]);

  const syncEvaluationsFromRules = useCallback(() => {
    const notation = chessRules.getPgnNotation();
    const fenFromMetadata = extractMetadataFen(notation);
    const { evaluationMap, annotationMap } = collectEvaluationsAndAnnotations(notation);
    const verboseHistory = buildVerboseHistory(chessRules.getHistory());
    const { timelineEntries, initialTimelineFen } = buildTimelineFromHistory(
      verboseHistory,
      fenFromMetadata,
    );

    timelineInitialFenRef.current = initialTimelineFen;
    timelineMovesRef.current = verboseHistory;
    setEvaluationsByPly(evaluationMap);
    setPlyAnnotations(annotationMap);
    setTimeline(timelineEntries);
    updateEvaluationFromMap(0, evaluationMap);
  }, [chessRules, setTimeline, updateEvaluationFromMap]);

  const rebuildRulesFromTimeline = useCallback(
    (targetPly: number) => {
      const baseFen = timelineInitialFenRef.current;
      const moves = timelineMovesRef.current;

      try {
        if (typeof baseFen === 'string' && baseFen.trim().length > 0) {
          chessRules.setFEN(baseFen);
        } else {
          chessRules.reset();
        }
      } catch (error) {
        console.error('Unable to reset rules with the timeline starting FEN:', error);
        return;
      }

      if (targetPly <= 0) {
        return;
      }

      const limit = Math.min(targetPly, moves.length);
      for (let index = 0; index < limit; index += 1) {
        const move = moves[index];
        if (!move) {
          break;
        }

        const response = chessRules.move({
          from: move.from,
          to: move.to,
          promotion: normalizePromotion(move.promotion),
        });

        if (!response.ok) {
          console.warn('Failed to replay PGN move while rebuilding rules history:', move);
          break;
        }
      }
    },
    [chessRules],
  );

  const jumpToPly = useCallback(
    (targetPly: number, options?: { stopAutoplay?: boolean }) => {
      if (options?.stopAutoplay !== false) {
        setIsAutoPlaying(false);
        clearAutoplayTimer();
      }

      if (plyTimeline.length === 0) {
        return;
      }
      const maxPly = plyTimeline.at(-1)?.ply ?? 0;
      const clampedPly = Math.max(0, Math.min(targetPly, maxPly));
      const entry = plyTimeline.find((item) => item.ply === clampedPly);
      if (!entry) {
        return;
      }

      const board = boardRef.current?.getBoard();
      setFen((previousFen) => (previousFen === entry.fen ? previousFen : entry.fen));
      board?.loadFEN?.(entry.fen, !shouldAnimateMoves);
      board?.showPgnAnnotationsForPly?.(clampedPly);
      syncOrientationWithFen(entry.fen);
      rebuildRulesFromTimeline(clampedPly);
      updateStatusSnapshot();
      updateEvaluationFromMap(clampedPly);
    },
    [
      boardRef,
      rebuildRulesFromTimeline,
      plyTimeline,
      syncOrientationWithFen,
      updateEvaluationFromMap,
      updateStatusSnapshot,
      shouldAnimateMoves,
      clearAutoplayTimer,
    ],
  );

  const handleToggleAutoplay = useCallback(() => {
    setIsAutoPlaying((previous) => {
      if (previous) {
        return false;
      }

      if (timelineMaxPly <= 0) {
        return false;
      }

      if (selectedPly >= timelineMaxPly) {
        jumpToPly(0, { stopAutoplay: false });
      }

      return true;
    });
  }, [jumpToPly, selectedPly, timelineMaxPly]);

  const handlePlaybackSpeedChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    const nextValue = Number(event.target.value);
    if (!Number.isFinite(nextValue) || nextValue <= 0) {
      return;
    }
    setPlaybackSpeed(nextValue);
  }, []);

  useEffect(() => {
    if (!isAutoPlaying) {
      clearAutoplayTimer();
      return;
    }

    if (selectedPly >= timelineMaxPly) {
      setIsAutoPlaying(false);
      return;
    }

    clearAutoplayTimer();
    autoplayTimeoutRef.current = setTimeout(() => {
      jumpToPly(selectedPlyRef.current + 1, { stopAutoplay: false });
    }, playbackSpeed);

    return () => {
      clearAutoplayTimer();
    };
  }, [clearAutoplayTimer, isAutoPlaying, jumpToPly, playbackSpeed, selectedPly, timelineMaxPly]);

  const handleBoardUpdate = useCallback(
    ({ fen: nextFen }: { fen: string }) => {
      setIsAutoPlaying(false);
      clearAutoplayTimer();
      setFen((previousFen) => (previousFen === nextFen ? previousFen : nextFen));
      syncOrientationWithFen(nextFen);
      setPgnError(null);
      const board = boardRef.current?.getBoard();

      const mappedPly = fenToPlyMap[nextFen];
      if (chessRules.getFEN() !== nextFen) {
        if (typeof mappedPly === 'number') {
          rebuildRulesFromTimeline(mappedPly);
        } else {
          try {
            chessRules.setFEN(nextFen);
          } catch (error) {
            console.error('Error while syncing the FEN with PGN navigation:', error);
          }
        }
        updateStatusSnapshot();
      }

      if (typeof mappedPly === 'number') {
        updateEvaluationFromMap(mappedPly);
        board?.showPgnAnnotationsForPly?.(mappedPly);
      } else {
        const fallbackPly = chessRules.history().length;
        setTimeline((previousTimeline) => {
          const trimmedTimeline = previousTimeline.filter((entry) => entry.ply <= fallbackPly);
          const alreadyRegistered = trimmedTimeline.some((entry) => entry.fen === nextFen);
          if (alreadyRegistered) {
            return trimmedTimeline;
          }
          return [...trimmedTimeline, { ply: fallbackPly, fen: nextFen }];
        });
        setPlyAnnotations((previousAnnotations) => {
          const nextAnnotations: Record<number, PlyAnnotationInfo> = {};
          for (const [plyKey, info] of Object.entries(previousAnnotations)) {
            const numericPly = Number(plyKey);
            if (!Number.isNaN(numericPly) && numericPly <= fallbackPly) {
              nextAnnotations[numericPly] = info;
            }
          }
          return nextAnnotations;
        });
        timelineMovesRef.current = chessRules.getHistory().map((move) => ({
          from: move.from,
          to: move.to,
          promotion: normalizePromotion(move.promotion),
        }));
        setCurrentEvaluation(undefined);
        setCurrentPly(fallbackPly);
        setSelectedPly(fallbackPly);
      }
    },
    [
      chessRules,
      clearAutoplayTimer,
      fenToPlyMap,
      rebuildRulesFromTimeline,
      setTimeline,
      syncOrientationWithFen,
      updateEvaluationFromMap,
      updateStatusSnapshot,
    ],
  );

  const [isCopying, setIsCopying] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isThemeChanging, setIsThemeChanging] = useState(false);

  const initialLoadingDuration = process.env.NODE_ENV === 'test' ? 0 : 1200;
  const isInitialLoading = useLoadingState(initialLoadingDuration);

  const [isManualFenChange, setIsManualFenChange] = useState(false);

  useEffect(() => {
    if (fen && isManualFenChange) {
      try {
        chessRules.setFEN(fen);
        const updatedFen = chessRules.getFEN();
        setFen(updatedFen);
        syncOrientationWithFen(updatedFen);
        setPgnText(chessRules.toPgn(false));
        clearEvaluations();
        setPgnError(null);
        updateStatusSnapshot();
        setIsManualFenChange(false);
      } catch (error) {
        console.error('Invalid FEN:', error);
        setIsManualFenChange(false);
      }
    }
  }, [
    fen,
    chessRules,
    isManualFenChange,
    syncOrientationWithFen,
    updateStatusSnapshot,
    clearEvaluations,
  ]);

  const normalizeInputPgn = useCallback(
    (rawPgn: string) => {
      const trimmed = rawPgn.trim();
      if (!trimmed) {
        setPgnError(translate('pgn.error.empty'));
        return null;
      }

      return normalizePgn(trimmed);
    },
    [translate],
  );

  const prepareForPgnLoad = useCallback(() => {
    setIsAutoPlaying(false);
    clearAutoplayTimer();
    setPgnError(null);
  }, [clearAutoplayTimer]);

  const loadPgnIntoRules = useCallback(
    (normalizedPgn: string) => {
      const board = boardRef.current?.getBoard() ?? null;
      const success = chessRules.loadPgn(normalizedPgn);
      const boardResult = board?.loadPgnWithAnnotations(normalizedPgn);

      return { board, success, boardResult };
    },
    [boardRef, chessRules],
  );

  const resolveInitialTimelineFen = useCallback(() => {
    const initialFen = timelineInitialFenRef.current;
    if (typeof initialFen === 'string' && initialFen.trim().length > 0) {
      return initialFen;
    }
    return chessRules.getFEN();
  }, [chessRules]);

  const applyLoadedPgn = useCallback(
    (board: ReturnType<NeoChessRef['getBoard']> | null) => {
      const initialTimelineFen = resolveInitialTimelineFen();
      rebuildRulesFromTimeline(0);
      setFen(initialTimelineFen);
      board?.loadFEN?.(initialTimelineFen, !shouldAnimateMoves);
      board?.showPgnAnnotationsForPly?.(0);
      syncOrientationWithFen(initialTimelineFen);
      try {
        const statusRules = new ChessJsRules(initialTimelineFen);
        setStatus(buildStatusSnapshot(statusRules));
      } catch (statusError) {
        console.error('Unable to derive status from the initial timeline FEN:', statusError);
        updateStatusSnapshot();
      }
      return initialTimelineFen;
    },
    [
      rebuildRulesFromTimeline,
      resolveInitialTimelineFen,
      shouldAnimateMoves,
      syncOrientationWithFen,
      updateStatusSnapshot,
    ],
  );

  const loadPgn = useCallback(
    async (rawPgn: string) => {
      const normalizedPgn = normalizeInputPgn(rawPgn);
      if (!normalizedPgn) {
        return;
      }

      setIsPgnLoading(true);
      prepareForPgnLoad();

      try {
        const { board, success, boardResult } = loadPgnIntoRules(normalizedPgn);

        if (!success) {
          setPgnError(translate('pgn.error.load'));
          return;
        }

        if (board && boardResult === false) {
          console.warn('PGN annotations failed to load on the board side.');
        }

        const normalizedOutput = chessRules.toPgn(false);
        syncEvaluationsFromRules();
        applyLoadedPgn(board);
        setPgnText(normalizedOutput);
      } catch (error) {
        console.error('Error while loading the PGN:', error);
        setPgnError(translate('pgn.error.generic'));
      } finally {
        setIsPgnLoading(false);
      }
    },
    [
      applyLoadedPgn,
      chessRules,
      loadPgnIntoRules,
      normalizeInputPgn,
      prepareForPgnLoad,
      syncEvaluationsFromRules,
      translate,
    ],
  );

  const handleLoadPgn = useCallback(() => {
    void loadPgn(pgnText);
  }, [loadPgn, pgnText]);

  const handlePgnFileUpload = useCallback(
    async (event: ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) {
        return;
      }

      try {
        setIsImportingFromFile(true);
        const text = await file.text();
        setPgnText(text);
        await loadPgn(text);
      } catch (error) {
        console.error('Error while reading the PGN file:', error);
        setPgnError(translate('pgn.error.generic'));
      } finally {
        setIsImportingFromFile(false);
        event.target.value = '';
      }
    },
    [loadPgn, translate],
  );

  const handleCopyPGN = async () => {
    setIsCopying(true);
    try {
      await navigator.clipboard.writeText(pgnText);
      if (process.env.NODE_ENV !== 'test') {
        await new Promise((resolve) => setTimeout(resolve, 500));
      }
    } catch (error) {
      console.error('Error while copying to the clipboard:', error);
    } finally {
      setIsCopying(false);
    }
  };

  const handleReset = async () => {
    setIsResetting(true);
    if (process.env.NODE_ENV !== 'test') {
      await new Promise((resolve) => setTimeout(resolve, 700));
    }
    setIsAutoPlaying(false);
    clearAutoplayTimer();
    chessRules.reset();
    setPgnText(chessRules.toPgn(false));
    clearEvaluations();
    boardRef.current?.getBoard()?.showPgnAnnotationsForPly?.(0);
    setPgnError(null);
    const resetFen = chessRules.getFEN();
    setFen(resetFen);
    syncOrientationWithFen(resetFen);
    updateStatusSnapshot();
    setIsResetting(false);
  };

  const handleExport = async () => {
    setIsExporting(true);
    setPgnError(null);
    try {
      if (process.env.NODE_ENV !== 'test') {
        await new Promise((resolve) => setTimeout(resolve, 800));
      }
      chessRules.setPgnMetadata({
        Event: 'Playground',
        Site: 'Local',
        Date: new Date().toISOString().slice(0, 10).replaceAll('-', '.'),
      });
      chessRules.downloadPgn();
    } catch (error) {
      console.error('Error during export:', error);
    } finally {
      setIsExporting(false);
    }
  };

  const handleThemeChange = async (newTheme: 'midnight' | 'classic') => {
    if (newTheme === theme) return;

    setIsThemeChanging(true);
    if (process.env.NODE_ENV !== 'test') {
      await new Promise((resolve) => setTimeout(resolve, 400));
    }
    setTheme(newTheme);
    setIsThemeChanging(false);
  };

  type ToggleableOption =
    | 'showArrows'
    | 'showHighlights'
    | 'allowPremoves'
    | 'showSquareNames'
    | 'soundEnabled'
    | 'highlightLegal'
    | 'allowResize'
    | 'showAnimations';

  const toggleOption = useCallback((option: ToggleableOption) => {
    setBoardOptions((prev) => ({
      ...prev,
      [option]: !prev[option],
    }));
  }, []);

  const handleAnimationSpeedChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const nextValue = Number(event.target.value);
    setBoardOptions((prev) => ({
      ...prev,
      animationDuration: Number.isNaN(nextValue) ? prev.animationDuration : nextValue,
    }));
  }, []);

  const toggleOrientation = useCallback(() => {
    setBoardOptions((prev) => ({
      ...prev,
      orientation: prev.orientation === 'white' ? 'black' : 'white',
    }));
  }, []);

  const toggleAutoFlip = useCallback(() => {
    const sourceFen = fen ?? chessRules.getFEN();
    setBoardOptions((prev) => {
      const nextAutoFlip = !prev.autoFlip;
      if (!nextAutoFlip) {
        return { ...prev, autoFlip: false };
      }

      return {
        ...prev,
        autoFlip: true,
        orientation: getOrientationFromFen(sourceFen),
      };
    });
  }, [fen, chessRules, getOrientationFromFen]);

  const addRandomArrow = useCallback(() => {
    if (!boardRef.current) return;
    const from = randomSquare();
    let to = randomSquare();
    while (to === from) {
      to = randomSquare();
    }
    const colors: readonly string[] = ['#3498db', '#e74c3c', '#2ecc71', '#f1c40f', '#9b59b6'];
    const color = pickRandomElement(colors);
    boardRef.current.addArrow({ from, to, color });
  }, [randomSquare]);

  const addRandomHighlight = useCallback(() => {
    if (!boardRef.current) return;
    const square = randomSquare();
    const types: ReadonlyArray<'move' | 'capture' | 'check' | 'selected'> = [
      'move',
      'capture',
      'check',
      'selected',
    ];
    const type = pickRandomElement(types);
    const board = boardRef.current.getBoard();
    if (board && typeof board.addHighlight === 'function') {
      board.addHighlight(square, type);
    } else {
      boardRef.current.addHighlight(square, type);
    }
  }, [randomSquare]);

  const clearAll = useCallback(() => {
    if (!boardRef.current) return;
    boardRef.current.clearArrows();
    boardRef.current.clearHighlights();
  }, []);

  const evaluationSnapshot = useMemo(
    () => interpretEvaluationValue(currentEvaluation),
    [currentEvaluation],
  );
  const halfMovesRemaining = Math.max(0, 100 - status.halfMoves);

  const getEvaluationSummary = () => {
    if (!evaluationSnapshot.hasValue) {
      return translate('evaluation.waitingData');
    }
    if (currentPly > 0) {
      return translate('evaluation.lastScoreWithMove', {
        score: evaluationSnapshot.label,
        move: formatPlyDescriptor(currentPly),
      });
    }
    return translate('evaluation.lastScore', { score: evaluationSnapshot.label });
  };
  const evaluationSummary = getEvaluationSummary();

  const selectedTimelineEntry = useMemo(
    () => plyTimeline.find((entry) => entry.ply === selectedPly),
    [plyTimeline, selectedPly],
  );
  const activePlyInfo = plyAnnotations[selectedPly];
  const sanForSelectedPly = selectedTimelineEntry?.san ?? activePlyInfo?.san;
  const commentForSelectedPly = activePlyInfo?.comment;
  const arrowCount = activePlyInfo?.annotations?.arrows?.length ?? 0;
  const highlightCount = activePlyInfo?.annotations?.circles?.length ?? 0;
  const evaluationForSelectedPly =
    activePlyInfo?.annotations?.evaluation ?? evaluationsByPly[selectedPly];
  const annotationBadges: string[] = [];

  if (arrowCount > 0) {
    annotationBadges.push(
      translate(
        arrowCount === 1
          ? 'comments.annotations.arrows.single'
          : 'comments.annotations.arrows.plural',
        { count: arrowCount },
      ),
    );
  }

  if (highlightCount > 0) {
    annotationBadges.push(
      translate(
        highlightCount === 1
          ? 'comments.annotations.highlights.single'
          : 'comments.annotations.highlights.plural',
        { count: highlightCount },
      ),
    );
  }

  if (evaluationForSelectedPly !== undefined) {
    annotationBadges.push(
      translate('comments.annotations.evaluation', {
        value: evaluationForSelectedPly,
      }),
    );
  }

  const optionToggleDescriptors = [
    {
      option: 'showArrows',
      icon: <ArrowsIcon />,
      label: 'options.showArrows.title',
      hint_enabled: 'options.showArrows.enabled',
      hint_disabled: 'options.showArrows.disabled',
    },
    {
      option: 'showHighlights',
      icon: <HighlightIcon />,
      label: 'options.showHighlights.title',
      hint_enabled: 'options.showHighlights.enabled',
      hint_disabled: 'options.showHighlights.disabled',
    },
    {
      option: 'allowPremoves',
      icon: <PremovesIcon />,
      label: 'options.allowPremoves.title',
      hint_enabled: 'options.allowPremoves.enabled',
      hint_disabled: 'options.allowPremoves.disabled',
    },
    {
      option: 'showAnimations',
      icon: <AnimationIcon />,
      label: 'options.showAnimations.title',
      hint_enabled: 'options.showAnimations.enabled',
      hint_disabled: 'options.showAnimations.disabled',
    },
    {
      option: 'showSquareNames',
      icon: <SquareNamesIcon />,
      label: 'options.showSquareNames.title',
      hint_enabled: 'options.showSquareNames.enabled',
      hint_disabled: 'options.showSquareNames.disabled',
    },
    {
      option: 'soundEnabled',
      icon: <SoundIcon />,
      label: 'options.soundEnabled.title',
      hint_enabled: 'options.soundEnabled.enabled',
      hint_disabled: 'options.soundEnabled.disabled',
    },
    {
      option: 'allowResize',
      icon: <BoardSizeIcon />,
      label: 'options.allowResize.title',
      hint_enabled: 'options.allowResize.enabled',
      hint_disabled: 'options.allowResize.disabled',
    },
    {
      option: 'highlightLegal',
      icon: <LegalMovesIcon />,
      label: 'options.highlightLegal.title',
      hint_enabled: 'options.highlightLegal.enabled',
      hint_disabled: 'options.highlightLegal.disabled',
    },
  ] as const;

  const gameTagInfo = getGameStatusTag(status);
  const fiftyTagInfo = getFiftyMoveRuleTag(status);

  const gameTagClass = gameTagInfo.className;
  const gameTagLabel = translate(gameTagInfo.label);

  const fiftyTagClass = fiftyTagInfo.className;
  const fiftyTagLabel = translate(fiftyTagInfo.label, fiftyTagInfo.params);

  if (isInitialLoading) {
    return (
      <div className="container min-h-screen bg-gradient-to-br from-[#0b0b14] via-[#151225] to-[#2d1b3d] text-gray-200 flex items-center justify-center">
        <div className="text-center">
          <DotLoader />
          <div className="mt-4 text-[15px] font-medium text-gray-300">
            {translate('app.initializing')}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full text-gray-200 font-sans">
      <header className="fixed top-0 w-full border-b border-white/10 bg-black/40 backdrop-blur-xl z-50 h-[64px]">
        {isThemeChanging && <LoadingOverlay text={translate('app.themeChanging')} />}
        <div className="w-full max-w-screen-2xl mx-auto px-3 sm:px-4 h-full flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-purple-500/50 to-indigo-500/50 grid place-items-center ring-1 ring-white/15 shadow-inner">
              <span className="text-white/90 text-base">♟</span>
            </div>
            <h1 className="text-lg sm:text-xl font-semibold text-white tracking-tight">
              NeoChessBoard
            </h1>
            <span className="hidden sm:inline-flex text-[11px] text-gray-300 bg-white/5 px-2.5 py-1 rounded-full ring-1 ring-white/10">
              {themeNames[theme]}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <a
              href="https://magicolala.github.io/Neo-Chess-Board-Ts-Library/demo/"
              className="px-3 py-1.5 text-sm font-medium text-gray-200 hover:text-white rounded-md transition-colors hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500/70"
              title={translate('app.playgroundLinkTitle')}
              rel="noreferrer"
              target="_blank"
            >
              {translate('app.playgroundLinkText')}
            </a>
            <a
              href="./theme-creator.html"
              className="px-3 py-1.5 text-sm font-medium text-gray-200 hover:text-white rounded-md transition-colors hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500/70"
              title={translate('app.themeCreatorTitle')}
            >
              {translate('app.themeCreatorLinkText')}
            </a>
            <div className="hidden sm:block w-px h-6 bg-white/10" />
            <div className="relative">
              <select
                id="demo-language"
                className="appearance-none bg-transparent border-0 text-gray-200 text-sm focus:ring-2 focus:ring-purple-500/70 rounded-md pl-2 pr-7 py-1 hover:bg-white/5"
                value={language}
                onChange={(event) => setLanguage(event.target.value as Language)}
              >
                <option value="en" className="text-black">
                  {translate('app.languageEnglish')}
                </option>
                <option value="fr" className="text-black">
                  {translate('app.languageFrench')}
                </option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-400">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </div>
            </div>
            <LoadingButton
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500/70 ${
                theme === 'midnight'
                  ? 'active bg-purple-600 text-white shadow hover:bg-purple-500'
                  : 'text-gray-200 hover:bg-white/10'
              }`}
              onClick={() => handleThemeChange('midnight')}
              isLoading={isThemeChanging}
              disabled={isThemeChanging}
            >
              {translate('app.themes.midnight')}
            </LoadingButton>
            <LoadingButton
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500/70 ${
                theme === 'classic'
                  ? 'active bg-purple-600 text-white shadow hover:bg-purple-500'
                  : 'text-gray-200 hover:bg-white/10'
              }`}
              onClick={() => handleThemeChange('classic')}
              isLoading={isThemeChanging}
              disabled={isThemeChanging}
            >
              {translate('app.themes.classic')}
            </LoadingButton>
          </div>
        </div>
      </header>

      <main className="max-w-screen-2xl mx-auto px-3 sm:px-4 lg:px-6 pt-[88px] pb-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 lg:gap-6">
          {/* Left Column */}
          <div className="lg:col-span-3 space-y-4 lg:space-y-5">
            <GlassPanel>
              <PanelHeader>{translate('status.title')}</PanelHeader>
              <div className="p-4 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-sm">
                    <div className="text-gray-400">{translate('status.turn.label')}</div>
                    <div className="text-lg font-semibold text-gray-50">
                      {status.turn === 'w' ? whiteLabel : blackLabel}
                    </div>
                    <div className="text-xs text-gray-500">
                      {translate('status.turn.moveNumber', { moveNumber: status.moveNumber })}
                    </div>
                  </div>
                  <div className="text-sm">
                    <div className="text-gray-400">{translate('status.legalMoves.label')}</div>
                    <div className="text-lg font-semibold text-gray-50">{status.legalMoves}</div>
                    <div className="text-xs text-gray-500">
                      {translate('status.legalMoves.hint', {
                        color: status.turn === 'w' ? whiteSideLabel : blackSideLabel,
                      })}
                    </div>
                  </div>
                  <div className="text-sm">
                    <div className="text-gray-400">{translate('status.halfMoves.label')}</div>
                    <div className="text-lg font-semibold text-gray-50">{status.halfMoves}</div>
                    <div className="text-xs text-gray-500">
                      {translate('status.halfMoves.hint')}
                    </div>
                  </div>
                  <div className="text-sm">
                    <div className="text-gray-400">{translate('status.fifty.label')}</div>
                    <div className="text-lg font-semibold text-gray-50">{halfMovesRemaining}</div>
                    <div className="text-xs text-gray-500">{translate('status.fifty.hint')}</div>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <span
                    className={`px-2.5 py-1 text-xs font-medium rounded-full border ${gameTagClass}`}
                  >
                    {gameTagLabel}
                  </span>
                  <span
                    className={`px-2.5 py-1 text-xs font-medium rounded-full border ${fiftyTagClass}`}
                  >
                    {fiftyTagLabel}
                  </span>
                </div>
              </div>
            </GlassPanel>

            <GlassPanel>
              <PanelHeader>{translate('pgn.title')}</PanelHeader>
              <div className="p-4">
                <textarea
                  className="w-full h-40 bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-[13px] text-gray-200 focus:ring-2 focus:ring-purple-500/70 focus:border-purple-500/70 transition placeholder:text-gray-500 font-mono/[*]"
                  value={pgnText}
                  onChange={(event) => {
                    setPgnText(event.target.value);
                    if (pgnError) setPgnError(null);
                  }}
                  aria-label={translate('pgn.title')}
                  placeholder={translate('pgn.placeholder')}
                />
                <input
                  id={pgnFileInputId}
                  ref={pgnFileInputRef}
                  type="file"
                  accept=".pgn,.txt,text/plain,application/x-chess-pgn"
                  className="hidden"
                  onChange={handlePgnFileUpload}
                />
                <div className="grid grid-cols-2 gap-2 mt-3 buttonGroup">
                  <LoadingButton
                    className="w-full px-4 py-2 bg-white/10 hover:bg-white/15 rounded-md font-medium transition text-white text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500/70"
                    onClick={() => pgnFileInputRef.current?.click()}
                    isLoading={isImportingFromFile}
                    disabled={isPgnLoading}
                  >
                    {isImportingFromFile ? translate('pgn.importing') : translate('pgn.import')}
                  </LoadingButton>
                  <LoadingButton
                    className="w-full px-4 py-2 bg-purple-600 hover:bg-purple-500 rounded-md font-medium transition text-white text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500/70"
                    onClick={handleLoadPgn}
                    isLoading={isPgnLoading}
                  >
                    {isPgnLoading ? translate('pgn.loading') : translate('pgn.load')}
                  </LoadingButton>
                  <LoadingButton
                    className="w-full px-4 py-2 bg-white/10 hover:bg-white/15 rounded-md font-medium transition text-white text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500/70"
                    onClick={handleCopyPGN}
                    isLoading={isCopying}
                  >
                    {isCopying ? translate('pgn.copying') : translate('pgn.copy')}
                  </LoadingButton>
                  <LoadingButton
                    className="w-full px-4 py-2 bg-white/10 hover:bg-white/15 rounded-md font-medium transition text-white text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500/70"
                    onClick={handleReset}
                    isLoading={isResetting}
                  >
                    {isResetting ? translate('pgn.resetting') : translate('pgn.reset')}
                  </LoadingButton>
                  <LoadingButton
                    className="w-full px-4 py-2 bg-white/10 hover:bg-white/15 rounded-md font-medium transition text-white text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500/70"
                    onClick={handleExport}
                    isLoading={isExporting}
                  >
                    {isExporting ? translate('pgn.exporting') : translate('pgn.export')}
                  </LoadingButton>
                </div>
                {pgnError && <div className="mt-2 text-sm text-red-400">{pgnError}</div>}
                <p className="mt-2 text-xs text-gray-500">
                  <strong>{translate('pgn.helper.prefix')}</strong> {translate('pgn.helper.middle')}{' '}
                  <code className="bg-white/10 px-1 rounded">[%eval ...]</code>{' '}
                  {translate('pgn.helper.suffix')}
                </p>
              </div>
            </GlassPanel>

            <GlassPanel>
              <PanelHeader>{translate('fen.title')}</PanelHeader>
              <div className="p-4">
                <textarea
                  className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-[13px] text-gray-200 focus:ring-2 focus:ring-purple-500/70 focus:border-purple-500/70 transition placeholder:text-gray-500 font-mono/[*]"
                  value={fen || ''}
                  onChange={(e) => {
                    setFen(e.target.value);
                    setIsManualFenChange(true);
                  }}
                  aria-label={translate('fen.title')}
                  placeholder={translate('fen.placeholder')}
                />
              </div>
            </GlassPanel>

            <GlassPanel>
              <PanelHeader>{translate('premoves.title')}</PanelHeader>
              <div className="p-4">
                <div className="text-xs text-gray-400 space-y-1 mb-3">
                  <p>
                    <strong>{translate('premoves.instructions')}</strong>
                  </p>
                  <ul className="list-disc list-inside space-y-0.5">
                    <li>{translate('premoves.step.examples')}</li>
                    <li>{translate('premoves.step.outOfTurn')}</li>
                    <li>{translate('premoves.step.stored')}</li>
                    <li>{translate('premoves.step.execute')}</li>
                  </ul>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <button
                    className="px-3 py-1.5 bg-white/10 hover:bg-white/15 rounded-md font-medium transition text-white text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500/70"
                    onClick={() => {
                      setFen('rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1');
                      setIsManualFenChange(true);
                    }}
                  >
                    {translate('premoves.sample.opening')}
                  </button>
                  <button
                    className="px-3 py-1.5 bg-white/10 hover:bg-white/15 rounded-md font-medium transition text-white text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500/70"
                    onClick={() => {
                      setFen('r1bqkb1r/pppp1ppp/2n2n2/4p3/2B1P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 4 4');
                      setIsManualFenChange(true);
                    }}
                  >
                    {translate('premoves.sample.middleGame')}
                  </button>
                  <button
                    className="px-3 py-1.5 bg-white/10 hover:bg-white/15 rounded-md font-medium transition text-white text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500/70"
                    onClick={() => {
                      setFen('4k3/8/8/8/8/8/4P3/4K3 w - - 0 1');
                      setIsManualFenChange(true);
                    }}
                  >
                    {translate('premoves.sample.endgame')}
                  </button>
                </div>
              </div>
            </GlassPanel>
          </div>

          {/* Center Column */}
          <div className="lg:col-span-6">
            <GlassPanel className="p-4 sm:p-6 shadow-[0_20px_60px_rgba(0,0,0,0.6)]">
              <div
                ref={boardContainerRef}
                style={boardContainerStyle}
                className="relative mx-auto group rounded-lg shadow-inner"
              >
                <NeoChessBoard
                  ref={boardRef}
                  theme={theme}
                  fen={fen}
                  size={boardSize}
                  showSquareNames={boardOptions.showSquareNames}
                  showArrows={boardOptions.showArrows}
                  showHighlights={boardOptions.showHighlights}
                  allowPremoves={boardOptions.allowPremoves}
                  soundEnabled={boardOptions.soundEnabled}
                  showAnimations={boardOptions.showAnimations}
                  animation={{ duration: boardOptions.animationDuration }}
                  soundUrl={moveSound}
                  soundEventUrls={{
                    move: moveSound,
                    capture: moveSound,
                    check: moveSound,
                    checkmate: moveSound,
                  }}
                  orientation={boardOptions.orientation}
                  highlightLegal={boardOptions.highlightLegal}
                  autoFlip={boardOptions.autoFlip}
                  extensions={promotionExtensions}
                  onPromotionRequired={handlePromotionRequest}
                  onMove={({ from, to, fen: nextFen }) => {
                    const result = chessRules.move({ from, to });
                    if (!result.ok) return;
                    setPgnError(null);
                    setPgnText(chessRules.toPgn(false));
                    setFen(nextFen);
                    syncOrientationWithFen(nextFen);
                    updateStatusSnapshot();
                    const basePly = selectedPlyRef.current;
                    const nextPly = basePly + 1;
                    const truncatedEvaluationMap = Object.entries(evaluationsByPly).reduce<
                      Record<number, number | string>
                    >((accumulator, [plyKey, value]) => {
                      const numericPly = Number(plyKey);
                      if (!Number.isNaN(numericPly) && numericPly <= basePly) {
                        accumulator[numericPly] = value;
                      }
                      return accumulator;
                    }, {});
                    setEvaluationsByPly(truncatedEvaluationMap);
                    setPlyAnnotations((previousAnnotations) => {
                      const nextAnnotations: Record<number, PlyAnnotationInfo> = {};
                      for (const [plyKey, info] of Object.entries(previousAnnotations)) {
                        const numericPly = Number(plyKey);
                        if (!Number.isNaN(numericPly) && numericPly <= basePly) {
                          nextAnnotations[numericPly] = info;
                        }
                      }
                      return nextAnnotations;
                    });
                    setTimeline((previousTimeline) => {
                      const trimmedTimeline = previousTimeline.filter(
                        (entry) => entry.ply <= basePly,
                      );
                      const ensuredTimeline =
                        trimmedTimeline.length > 0
                          ? trimmedTimeline
                          : [
                              {
                                ply: 0,
                                fen: previousTimeline[0]?.fen ?? nextFen,
                                san: previousTimeline[0]?.san,
                              },
                            ];
                      const nextTimeline = [
                        ...ensuredTimeline,
                        { ply: nextPly, fen: nextFen, san: result.move?.san },
                      ];
                      return nextTimeline;
                    });
                    timelineMovesRef.current = chessRules.getHistory().map((move) => ({
                      from: move.from,
                      to: move.to,
                      promotion: normalizePromotion(move.promotion),
                    }));
                    updateEvaluationFromMap(nextPly, truncatedEvaluationMap);
                    boardRef.current?.getBoard()?.showPgnAnnotationsForPly?.(nextPly);
                  }}
                  onUpdate={handleBoardUpdate}
                  className="w-full aspect-square ring-1 ring-white/10 shadow-[0_20px_70px_-30px_rgba(124,58,237,0.35)]"
                />
                {boardOptions.allowResize && (
                  <div
                    className={`absolute right-2 bottom-2 flex items-end gap-2 pointer-events-none transition-opacity ${
                      isResizingBoard
                        ? 'opacity-100'
                        : 'opacity-0 group-hover:opacity-100 group-focus-within:opacity-100'
                    }`}
                  >
                    <span
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-black/70 ring-1 ring-white/10 text-gray-200 text-xs font-medium shadow"
                      aria-live="polite"
                    >
                      <BoardSizeIcon />
                      {boardSizeLabel}
                    </span>
                    <button
                      type="button"
                      className={`pointer-events-auto group relative flex h-11 w-11 items-center justify-center overflow-hidden rounded-xl cursor-nwse-resize transition-colors ring-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-400/70 ${
                        isResizingBoard
                          ? 'bg-purple-500/20 ring-purple-300/60 shadow-[0_10px_30px_rgba(168,85,247,0.35)]'
                          : 'bg-black/60 ring-white/10 hover:bg-black/45 hover:ring-white/25 shadow-[0_12px_40px_-18px_rgba(15,23,42,0.75)]'
                      }`}
                      onPointerDown={handleBoardResizeStart}
                      onPointerMove={handleBoardResizeMove}
                      onPointerUp={handleBoardResizeEnd}
                      onPointerCancel={handleBoardResizeCancel}
                      onDoubleClick={handleBoardResizeReset}
                      onKeyDown={handleBoardResizeKeyDown}
                      role="slider"
                      aria-label={translate('board.resize.ariaLabel')}
                      aria-valuemin={minBoardSize}
                      aria-valuemax={maxBoardSize}
                      aria-valuenow={boardSize}
                      aria-valuetext={boardSizeLabel}
                      title={translate('board.resize.tooltip')}
                    >
                      <span
                        className="pointer-events-none absolute inset-0 rounded-xl bg-gradient-to-br from-white/10 via-white/0 to-purple-500/40 opacity-0 transition-opacity duration-300 group-hover:opacity-60 group-focus-visible:opacity-60"
                        aria-hidden="true"
                      />
                      <span
                        className="relative -rotate-45 flex flex-col items-center justify-center gap-1.5 text-gray-100"
                        aria-hidden="true"
                      >
                        <span className="h-0.5 w-6 rounded-full bg-current/90" />
                        <span className="h-0.5 w-4 rounded-full bg-current/70" />
                        <span className="h-0.5 w-2 rounded-full bg-current/60" />
                      </span>
                    </button>
                  </div>
                )}
              </div>

              <div className="mt-6">
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                  {optionToggleDescriptors.map(({ option, icon, label }) => (
                    <button
                      key={option}
                      type="button"
                      className={`px-3 py-2 rounded-lg text-left transition-colors text-sm ring-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500/70 ${
                        boardOptions[option]
                          ? 'bg-purple-600/15 ring-purple-400/40 text-gray-100'
                          : 'bg-white/5 hover:bg-white/10 ring-white/10'
                      }`}
                      onClick={() => toggleOption(option)}
                      aria-pressed={boardOptions[option]}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-gray-300">{icon}</span>
                        <span className="font-medium">{translate(label)}</span>
                      </div>
                    </button>
                  ))}
                  <button
                    type="button"
                    className={`px-3 py-2 rounded-lg text-left transition-colors text-sm ring-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500/70 ${
                      boardOptions.autoFlip
                        ? 'bg-purple-600/15 ring-purple-400/40 text-gray-100'
                        : 'bg-white/5 hover:bg-white/10 ring-white/10'
                    }`}
                    onClick={toggleAutoFlip}
                    aria-pressed={boardOptions.autoFlip}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-gray-300">
                        <AutoFlipIcon />
                      </span>
                      <span className="font-medium">{translate('options.autoFlip.title')}</span>
                    </div>
                  </button>
                  <button
                    type="button"
                    className="px-3 py-2 rounded-lg text-left transition-colors text-sm bg-white/5 hover:bg-white/10 ring-1 ring-white/10 disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500/70"
                    onClick={toggleOrientation}
                    disabled={boardOptions.autoFlip}
                    title={
                      boardOptions.autoFlip
                        ? translate('board.orientation.autoDisabled')
                        : undefined
                    }
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-gray-300">
                        <OrientationIcon />
                      </span>
                      <span className="font-medium">{translate('options.orientation.title')}</span>
                    </div>
                  </button>
                  <button
                    type="button"
                    className="px-3 py-2 rounded-lg text-left transition-colors text-sm bg-white/5 hover:bg-white/10 ring-1 ring-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500/70"
                    onClick={addRandomArrow}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-gray-300">
                        <AddArrowIcon />
                      </span>
                      <span className="font-medium">{translate('options.addArrow.title')}</span>
                    </div>
                  </button>
                  <button
                    type="button"
                    className="px-3 py-2 rounded-lg text-left transition-colors text-sm bg-white/5 hover:bg-white/10 ring-1 ring-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500/70"
                    onClick={addRandomHighlight}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-gray-300">
                        <AddHighlightIcon />
                      </span>
                      <span className="font-medium">{translate('options.addHighlight.title')}</span>
                    </div>
                  </button>
                  <button
                    type="button"
                    className="px-3 py-2 rounded-lg text-left transition-colors text-sm bg-red-500/15 hover:bg-red-500/25 ring-1 ring-red-400/30 text-red-300"
                    onClick={clearAll}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-red-300">
                        <TrashIcon />
                      </span>
                      <span className="font-medium">{translate('options.clearAll.title')}</span>
                    </div>
                  </button>
                </div>
                <div className="mt-4" aria-disabled={!boardOptions.showAnimations}>
                  <label
                    className="text-sm font-medium text-gray-300"
                    htmlFor={animationSpeedInputId}
                  >
                    {translate('options.animationSpeed.label')}
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      id={animationSpeedInputId}
                      type="range"
                      min={0}
                      max={2000}
                      step={50}
                      value={boardOptions.animationDuration}
                      onChange={handleAnimationSpeedChange}
                      className="w-full h-2 bg-white/10 rounded-full appearance-none cursor-pointer accent-purple-500 disabled:opacity-50"
                      disabled={!boardOptions.showAnimations}
                      aria-valuemin={0}
                      aria-valuemax={2000}
                      aria-valuenow={boardOptions.animationDuration}
                      aria-label={translate('options.animationSpeed.label')}
                    />
                    <span className="text-sm text-gray-400 w-24 text-right">
                      {translate('options.animationSpeed.value', {
                        milliseconds: boardOptions.animationDuration,
                      })}
                    </span>
                  </div>
                </div>
              </div>
            </GlassPanel>
          </div>

          {/* Right Column */}
          <div className="lg:col-span-3 space-y-4 lg:space-y-5">
            {' '}
            <GlassPanel>
              <PanelHeader>{translate('timeline.title')}</PanelHeader>
              <div className="p-4 space-y-4">
                <PlyNavigator
                  onFirst={() => jumpToPly(0)}
                  onPrevious={() => jumpToPly(selectedPly - 1)}
                  onNext={() => jumpToPly(selectedPly + 1)}
                  onLast={() => jumpToPly(timelineMaxPly)}
                  isAtStart={selectedPly <= 0}
                  isAtEnd={plyTimeline.length === 0 || selectedPly >= timelineMaxPly}
                  moveLabel={selectedTimelineEntry?.san || translate('timeline.start')}
                  positionLabel={translate('timeline.position', {
                    descriptor: formatPlyDescriptor(selectedPly),
                  })}
                  icons={{
                    first: <FirstIcon />,
                    previous: <PreviousIcon />,
                    next: <NextIcon />,
                    last: <LastIcon />,
                    play: <PlayIcon />,
                    pause: <PauseIcon />,
                  }}
                  labels={{
                    first: translate('timeline.controls.first'),
                    previous: translate('timeline.controls.previous'),
                    next: translate('timeline.controls.next'),
                    last: translate('timeline.controls.last'),
                    play: translate('timeline.playback.play'),
                    pause: translate('timeline.playback.pause'),
                    playbackSpeed: translate('timeline.playback.speed'),
                    playbackSpeedValue: translate('timeline.playback.speedValue', {
                      milliseconds: playbackSpeed,
                    }),
                    currentMove: translate('timeline.currentMove'),
                  }}
                  ariaLabels={{
                    first: translate('timeline.aria.first'),
                    previous: translate('timeline.aria.previous'),
                    next: translate('timeline.aria.next'),
                    last: translate('timeline.aria.last'),
                    play: translate('timeline.aria.play'),
                    pause: translate('timeline.aria.pause'),
                    speed: translate('timeline.aria.speed'),
                  }}
                  isAutoPlaying={isAutoPlaying}
                  isAutoplayAvailable={isAutoplayAvailable}
                  onToggleAutoplay={handleToggleAutoplay}
                  playbackSpeed={playbackSpeed}
                  playbackSpeedInputId={playbackSpeedInputId}
                  playbackSpeedMin={250}
                  playbackSpeedMax={2000}
                  playbackSpeedStep={250}
                  onPlaybackSpeedChange={handlePlaybackSpeedChange}
                />
              </div>
            </GlassPanel>
            <GlassPanel>
              <PanelHeader>{translate('evaluation.panelTitle')}</PanelHeader>
              <div className="p-4 flex flex-col sm:flex-row lg:flex-col gap-4">
                <div className="flex-shrink-0 mx-auto">
                  <EvaluationBar
                    evaluation={currentEvaluation}
                    orientation={boardOptions.orientation}
                    ply={currentPly}
                  />
                </div>
                <div className="text-sm text-gray-400 space-y-2">
                  <p>{evaluationSummary}</p>
                  <p>
                    {translate('evaluation.instructions.prefix')}{' '}
                    <code className="bg-white/10 px-1 rounded">[%eval ...]</code>{' '}
                    {translate('evaluation.instructions.middle')}{' '}
                    <strong>{translate('pgn.load')}</strong>{' '}
                    {translate('evaluation.instructions.suffix')}
                  </p>
                  <ul className="list-disc list-inside text-xs space-y-0.5">
                    <li>{translate('evaluation.list.perspective')}</li>
                    <li>{translate('evaluation.list.updates')}</li>
                  </ul>
                </div>
              </div>
            </GlassPanel>
            <GlassPanel>
              <PanelHeader>{translate('comments.title')}</PanelHeader>
              <div className="p-4 space-y-3">
                <div className="flex items-baseline justify-between gap-3">
                  <span className="text-xs font-semibold text-gray-400 uppercase tracking-[0.14em]">
                    {translate('comments.current')}
                  </span>
                  <span
                    className={`text-sm font-semibold ${
                      selectedPly <= 0 ? 'text-gray-400' : 'text-gray-100'
                    }`}
                  >
                    {formatPlyDescriptor(selectedPly)}
                  </span>
                </div>
                {selectedPly > 0 && sanForSelectedPly ? (
                  <div className="flex items-center gap-2 text-xs text-purple-200">
                    <span className="uppercase tracking-[0.14em] text-gray-500">
                      {translate('comments.sanLabel')}
                    </span>
                    <code className="px-2 py-1 rounded-md bg-purple-500/10 font-mono text-sm text-purple-200">
                      {sanForSelectedPly}
                    </code>
                  </div>
                ) : null}
                {renderCommentSection(commentForSelectedPly, selectedPly, translate)}
                {annotationBadges.length > 0 && (
                  <div className="pt-1 space-y-2">
                    <div className="text-xs font-semibold uppercase tracking-[0.14em] text-gray-400">
                      {translate('comments.annotationsTitle')}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {annotationBadges.map((badge) => (
                        <span
                          key={badge}
                          className="inline-flex items-center px-2.5 py-1 rounded-full bg-white/10 text-xs text-gray-200"
                        >
                          {badge}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </GlassPanel>
            <GlassPanel>
              <PanelHeader>{translate('examples.title')}</PanelHeader>
              <div className="p-4 space-y-3">
                {LIVE_EXAMPLES.map((example) => (
                  <a
                    key={example.href}
                    className="group flex items-center p-3 bg-white/5 hover:bg-white/10 rounded-xl transition-colors ring-1 ring-white/10"
                    href={example.href}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <span className="text-xl mr-3">{example.icon}</span>
                    <div>
                      <div className="font-semibold text-gray-100 text-sm">
                        {translate(example.labelKey)}
                      </div>
                      <div className="text-xs text-gray-400">
                        {translate(example.descriptionKey)}
                      </div>
                    </div>
                    <span className="ml-auto text-gray-500 transition-transform group-hover:translate-x-0.5">
                      ↗
                    </span>
                  </a>
                ))}
              </div>
            </GlassPanel>
          </div>
        </div>
      </main>
    </div>
  );
};

export const App: React.FC = () => {
  const [language, setLanguage] = useState<Language>('en');
  const translationValue = useMemo(() => createTranslationValue(language, setLanguage), [language]);

  return (
    <TranslationContext.Provider value={translationValue}>
      <AppContent />
    </TranslationContext.Provider>
  );
};
