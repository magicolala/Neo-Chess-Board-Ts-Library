import React, { useMemo, useState, useRef, useEffect, useCallback, useId } from 'react';
import { NeoChessBoard } from '../src/react';
import type { NeoChessRef } from '../src/react';
import { createPromotionDialogExtension } from '../src/extensions/PromotionDialogExtension';
import { ChessJsRules } from '../src/core/ChessJsRules';
import type { PromotionRequest, Square } from '../src/core/types';
import moveSound from './assets/souffle.ogg';
import { LoadingButton, DotLoader, LoadingOverlay, useLoadingState } from './components/Loaders';
import {
  AddArrowIcon,
  AddHighlightIcon,
  ArrowsIcon,
  AutoFlipIcon,
  BoardSizeIcon,
  HighlightIcon,
  LegalMovesIcon,
  OrientationIcon,
  PremovesIcon,
  AnimationIcon,
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
import { pickRandomElement } from './utils/random';
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
    className={`bg-gray-900/70 backdrop-blur-xl rounded-2xl border border-white/10 shadow-[0_8px_30px_rgb(2,6,23,0.35)] ${className}`}
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
  const [evaluationsByPly, setEvaluationsByPly] = useState<Record<number, number | string>>({});
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
  const [boardOptions, setBoardOptions] = useState<BoardFeatureOptions>({
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
  const shouldAnimateMoves = boardOptions.showAnimations && boardOptions.animationDuration > 0;
  const animationSpeedInputId = useId();
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
  const selectedPlyRef = useRef(0);

  useEffect(() => {
    selectedPlyRef.current = selectedPly;
  }, [selectedPly]);

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
    const baseFen = chessRules.getFEN();
    setEvaluationsByPly({});
    setTimeline([{ ply: 0, fen: baseFen }]);
    setCurrentEvaluation(undefined);
    setCurrentPly(0);
    setSelectedPly(0);
    timelineInitialFenRef.current = baseFen;
    timelineMovesRef.current = [];
  }, [chessRules, setTimeline]);

  const syncEvaluationsFromRules = useCallback(() => {
    const notation = chessRules.getPgnNotation();
    const evaluationMap: Record<number, number | string> = {};
    const metadata =
      typeof notation.getMetadata === 'function' ? notation.getMetadata() : undefined;
    const normalizedSetup =
      typeof metadata?.SetUp === 'string' ? metadata.SetUp.trim().toLowerCase() : undefined;
    const metadataFen = metadata?.FEN?.trim();
    const fenFromMetadata =
      metadataFen && (!normalizedSetup || normalizedSetup === '1' || normalizedSetup === 'true')
        ? metadataFen
        : undefined;

    for (const move of notation.getMovesWithAnnotations()) {
      const baseIndex = (move.moveNumber - 1) * 2;
      if (move.evaluation?.white !== undefined) {
        evaluationMap[baseIndex + 1] = move.evaluation.white;
      }
      if (move.evaluation?.black !== undefined) {
        evaluationMap[baseIndex + 2] = move.evaluation.black;
      }
    }

    const verboseHistory = chessRules.getHistory().map((move) => ({
      from: move.from,
      to: move.to,
      promotion: move.promotion,
    }));

    let timelineRules: ChessJsRules;
    let startingFenApplied = false;

    if (fenFromMetadata) {
      try {
        timelineRules = new ChessJsRules(fenFromMetadata);
        startingFenApplied = true;
      } catch (error) {
        console.warn('Unable to rebuild the PGN timeline with the initial FEN:', error);
        timelineRules = new ChessJsRules();
      }
    } else {
      timelineRules = new ChessJsRules();
    }

    if (!startingFenApplied) {
      timelineRules.reset();
    }

    const initialTimelineFen = timelineRules.getFEN();
    const timelineEntries: PlyTimelineEntry[] = [{ ply: 0, fen: initialTimelineFen }];
    const fenMap: Record<string, number> = { [initialTimelineFen]: 0 };

    for (const [index, move] of verboseHistory.entries()) {
      const result = timelineRules.move({
        from: move.from,
        to: move.to,
        promotion: move.promotion,
      });
      if (result.ok) {
        const plyIndex = index + 1;
        const resultingFen = result.fen ?? timelineRules.getFEN();
        fenMap[resultingFen] = plyIndex;
        timelineEntries.push({
          ply: plyIndex,
          fen: resultingFen,
          san: result.move?.san,
        });
      }
    }

    timelineInitialFenRef.current = initialTimelineFen;
    timelineMovesRef.current = verboseHistory;
    setEvaluationsByPly(evaluationMap);
    setTimeline(timelineEntries);
    updateEvaluationFromMap(verboseHistory.length, evaluationMap);
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
          promotion: move.promotion,
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
    (targetPly: number) => {
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
    ],
  );

  const handleBoardUpdate = useCallback(
    ({ fen: nextFen }: { fen: string }) => {
      setFen((previousFen) => (previousFen === nextFen ? previousFen : nextFen));
      syncOrientationWithFen(nextFen);
      setPgnError(null);

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
        timelineMovesRef.current = chessRules.getHistory().map((move) => ({
          from: move.from,
          to: move.to,
          promotion: move.promotion,
        }));
        setCurrentEvaluation(undefined);
        setCurrentPly(fallbackPly);
        setSelectedPly(fallbackPly);
      }
    },
    [
      chessRules,
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

  const isInitialLoading = process.env.NODE_ENV === 'test' ? false : useLoadingState(1200);

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

  const handleLoadPgn = useCallback(async () => {
    const trimmed = pgnText.trim();
    if (!trimmed) {
      setPgnError(translate('pgn.error.empty'));
      return;
    }

    const normalizedPgn = normalizePgn(trimmed);

    setIsPgnLoading(true);
    try {
      setPgnError(null);
      const success = chessRules.loadPgn(normalizedPgn);
      const board = boardRef.current?.getBoard();
      const boardResult = board?.loadPgnWithAnnotations(normalizedPgn);

      if (!success) {
        setPgnError(translate('pgn.error.load'));
        return;
      }

      if (board && boardResult === false) {
        console.warn('PGN annotations failed to load on the board side.');
      }

      const updatedFen = chessRules.getFEN();
      setFen(updatedFen);
      syncOrientationWithFen(updatedFen);
      setPgnText(chessRules.toPgn(false));
      updateStatusSnapshot();
      syncEvaluationsFromRules();
    } catch (error) {
      console.error('Error while loading the PGN:', error);
      setPgnError(translate('pgn.error.generic'));
    } finally {
      setIsPgnLoading(false);
    }
  }, [
    chessRules,
    pgnText,
    syncOrientationWithFen,
    translate,
    updateStatusSnapshot,
    syncEvaluationsFromRules,
  ]);

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
    chessRules.reset();
    setPgnText(chessRules.toPgn(false));
    clearEvaluations();
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
    const files: readonly string[] = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
    const ranks: readonly string[] = ['1', '2', '3', '4', '5', '6', '7', '8'];
    const randomSquare = (): Square => {
      const file = pickRandomElement(files);
      const rank = pickRandomElement(ranks);
      return `${file}${rank}` as Square;
    };
    const from = randomSquare();
    let to = randomSquare();
    while (to === from) {
      to = randomSquare();
    }
    const colors: readonly string[] = ['#3498db', '#e74c3c', '#2ecc71', '#f1c40f', '#9b59b6'];
    const color = pickRandomElement(colors);
    boardRef.current.addArrow({ from, to, color });
  }, []);

  const addRandomHighlight = useCallback(() => {
    if (!boardRef.current) return;
    const files: readonly string[] = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
    const ranks: readonly string[] = ['1', '2', '3', '4', '5', '6', '7', '8'];
    const randomSquare = (): Square => {
      const file = pickRandomElement(files);
      const rank = pickRandomElement(ranks);
      return `${file}${rank}` as Square;
    };
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
  }, []);

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
  const evaluationSummary = evaluationSnapshot.hasValue
    ? currentPly > 0
      ? translate('evaluation.lastScoreWithMove', {
          score: evaluationSnapshot.label,
          move: formatPlyDescriptor(currentPly),
        })
      : translate('evaluation.lastScore', { score: evaluationSnapshot.label })
    : translate('evaluation.waitingData');

  const gameTagClass = status.isCheckmate
    ? 'bg-red-500/15 text-red-300 border-red-400/30'
    : status.isStalemate || status.inCheck
      ? 'bg-yellow-500/15 text-yellow-300 border-yellow-400/30'
      : status.isGameOver
        ? 'bg-blue-500/15 text-blue-300 border-blue-400/30'
        : 'bg-emerald-500/15 text-emerald-300 border-emerald-400/30';
  const gameTagLabel = status.isCheckmate
    ? translate('status.tags.checkmate')
    : status.isStalemate
      ? translate('status.tags.stalemate')
      : status.inCheck
        ? translate('status.tags.check')
        : status.isGameOver
          ? translate('status.tags.gameOver')
          : translate('status.tags.inProgress');
  const fiftyTagClass =
    status.halfMoves >= 100
      ? 'bg-red-500/15 text-red-300 border-red-400/30'
      : status.halfMoves >= 80
        ? 'bg-amber-500/15 text-amber-300 border-amber-400/30'
        : 'bg-sky-500/15 text-sky-300 border-sky-400/30';
  const fiftyTagLabel =
    status.halfMoves >= 100
      ? translate('status.tags.fiftyReached')
      : status.halfMoves >= 80
        ? translate('status.tags.fiftyWarning', {
            halfMoves: halfMovesRemaining,
          })
        : translate('status.tags.fiftyInfo', {
            halfMoves: halfMovesRemaining,
          });

  if (isInitialLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0b0b14] via-[#151225] to-[#2d1b3d] text-gray-200 flex items-center justify-center">
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
    <div className="min-h-screen bg-[radial-gradient(60rem_60rem_at_10%_-20%,rgba(168,85,247,0.15),transparent),radial-gradient(50rem_50rem_at_110%_10%,rgba(59,130,246,0.12),transparent)] bg-[#0b0e17] text-gray-200 font-sans">
      <header className="fixed top-0 w-full border-b border-white/10 bg-black/40 backdrop-blur-xl z-50 h-[64px]">
        {isThemeChanging && <LoadingOverlay text={translate('app.themeChanging')} />}
        <div className="max-w-screen-2xl mx-auto px-3 sm:px-4 h-full flex items-center justify-between">
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
              href="./playground.html"
              className="px-3 py-1.5 text-sm font-medium text-gray-200 hover:text-white rounded-md transition-colors hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500/70"
              title={translate('app.playgroundLinkTitle')}
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
            <select
              id="demo-language"
              className="bg-transparent border-0 text-gray-200 text-sm focus:ring-2 focus:ring-purple-500/70 rounded-md px-2 py-1 hover:bg-white/5"
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
            <LoadingButton
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500/70 ${
                theme === 'midnight'
                  ? 'bg-purple-600 text-white shadow hover:bg-purple-500'
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
                  ? 'bg-purple-600 text-white shadow hover:bg-purple-500'
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
                <div className="grid grid-cols-2 gap-2 mt-3 buttonGroup">
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
            <GlassPanel className="p-4 sm:p-6">
              <div ref={boardContainerRef} style={boardContainerStyle} className="relative mx-auto">
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
                      promotion: move.promotion,
                    }));
                    updateEvaluationFromMap(nextPly, truncatedEvaluationMap);
                  }}
                  onUpdate={handleBoardUpdate}
                  className="w-full aspect-square rounded-xl ring-1 ring-white/10 shadow-[0_20px_70px_-30px_rgba(124,58,237,0.35)]"
                />
                {boardOptions.allowResize && (
                  <div className="absolute right-2 bottom-2 flex items-end gap-2 pointer-events-none">
                    <span
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/70 ring-1 ring-white/10 text-gray-200 text-xs font-medium shadow"
                      aria-live="polite"
                    >
                      <BoardSizeIcon />
                      {boardSizeLabel}
                    </span>
                    <button
                      type="button"
                      className={`pointer-events-auto w-9 h-9 rounded-lg grid place-items-center cursor-nwse-resize transition-colors ring-1 ${
                        isResizingBoard
                          ? 'bg-purple-600/30 ring-purple-400/60'
                          : 'bg-black/70 ring-white/10 hover:ring-white/25'
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
                        className="w-full h-full relative before:content-[''] before:absolute before:right-2 before:bottom-2.5 before:w-4 before:h-0.5 before:bg-gray-300 before:rotate-[-45deg] after:content-[''] after:absolute after:right-2 after:bottom-[15px] after:w-2.5 after:h-0.5 after:bg-gray-300 after:rotate-[-45deg]"
                        aria-hidden="true"
                      />
                    </button>
                  </div>
                )}
              </div>

              <div className="mt-6">
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                  {[
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
                  ].map(({ option, icon, label }) => (
                    <button
                      key={option}
                      type="button"
                      className={`px-3 py-2 rounded-lg text-left transition-colors text-sm ring-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500/70 ${
                        (boardOptions as any)[option]
                          ? 'bg-purple-600/15 ring-purple-400/40 text-gray-100'
                          : 'bg-white/5 hover:bg-white/10 ring-white/10'
                      }`}
                      onClick={() => toggleOption(option as ToggleableOption)}
                      aria-pressed={(boardOptions as any)[option]}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-gray-300">{icon}</span>
                        <span className="font-medium">{translate(label as TranslationKey)}</span>
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
              <PanelHeader>{translate('timeline.title')}</PanelHeader>
              <div className="p-4">
                <PlyNavigator
                  onFirst={() => jumpToPly(0)}
                  onPrevious={() => jumpToPly(selectedPly - 1)}
                  onNext={() => jumpToPly(selectedPly + 1)}
                  onLast={() => jumpToPly(plyTimeline.at(-1)?.ply ?? 0)}
                  isAtStart={selectedPly <= 0}
                  isAtEnd={
                    plyTimeline.length === 0 || selectedPly >= (plyTimeline.at(-1)?.ply ?? 0)
                  }
                  moveLabel={
                    plyTimeline.find((entry) => entry.ply === selectedPly)?.san ||
                    translate('timeline.start')
                  }
                  positionLabel={translate('timeline.position', {
                    descriptor: formatPlyDescriptor(selectedPly),
                  })}
                  labels={{
                    first: translate('timeline.controls.first'),
                    previous: translate('timeline.controls.previous'),
                    next: translate('timeline.controls.next'),
                    last: translate('timeline.controls.last'),
                    currentMove: translate('timeline.currentMove'),
                  }}
                  ariaLabels={{
                    first: translate('timeline.aria.first'),
                    previous: translate('timeline.aria.previous'),
                    next: translate('timeline.aria.next'),
                    last: translate('timeline.aria.last'),
                  }}
                />
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
