import React, { useMemo, useState, useRef, useEffect, useCallback, useId } from 'react';
import { NeoChessBoard } from '../src/react';
import type { NeoChessRef } from '../src/react';
import { createPromotionDialogExtension } from '../src/extensions/PromotionDialogExtension';
import { ChessJsRules } from '../src/core/ChessJsRules';
import type { PromotionRequest, Square } from '../src/core/types';
import styles from './App.module.css';
import moveSound from './assets/souffle.ogg';
import {
  LoadingButton,
  DotLoader,
  LoadingOverlay,
  SkeletonText,
  SkeletonButtons,
  useLoadingState,
} from './components/Loaders';
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
import {
  createTranslationValue,
  type Language,
  TranslationContext,
  type TranslationKey,
  useTranslation,
} from './i18n/translations';

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

// Type definition for board options
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
  const [fen, setFen] = useState<string | undefined>(undefined);
  const [theme, setTheme] = useState<'midnight' | 'classic'>('midnight');
  const [status, setStatus] = useState<GameStatus>(() => buildStatusSnapshot(chessRules));
  const [pgnText, setPgnText] = useState('');
  const [pgnError, setPgnError] = useState<string | null>(null);
  const [isPgnLoading, setIsPgnLoading] = useState(false);
  const [evaluationsByPly, setEvaluationsByPly] = useState<Record<number, number | string>>({});
  const [fenToPlyMap, setFenToPlyMap] = useState<Record<string, number>>({});
  const [currentPly, setCurrentPly] = useState(0);
  const [currentEvaluation, setCurrentEvaluation] = useState<number | string | undefined>(
    undefined,
  );
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
    },
    [evaluationsByPly],
  );

  const clearEvaluations = useCallback(() => {
    setEvaluationsByPly({});
    setFenToPlyMap({});
    setCurrentEvaluation(undefined);
    setCurrentPly(chessRules.history().length);
  }, [chessRules]);

  const syncEvaluationsFromRules = useCallback(() => {
    const notation = chessRules.getPgnNotation();
    const evaluationMap: Record<number, number | string> = {};
    const metadata =
      typeof notation.getMetadata === 'function' ? notation.getMetadata() : undefined;
    const fenFromMetadata =
      metadata?.FEN && metadata.FEN.trim().length > 0
        ? (() => {
            const rawSetup = metadata?.SetUp;
            const normalizedSetup = rawSetup ? rawSetup.trim().toLowerCase() : undefined;
            if (!normalizedSetup || normalizedSetup === '1' || normalizedSetup === 'true') {
              return metadata.FEN.trim();
            }
            return undefined;
          })()
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

    const fenMap: Record<string, number> = {};
    fenMap[timelineRules.getFEN()] = 0;

    verboseHistory.forEach((move, index) => {
      const result = timelineRules.move({
        from: move.from,
        to: move.to,
        promotion: move.promotion,
      });
      if (result.ok) {
        fenMap[timelineRules.getFEN()] = index + 1;
      }
    });

    setEvaluationsByPly(evaluationMap);
    setFenToPlyMap(fenMap);
    updateEvaluationFromMap(verboseHistory.length, evaluationMap);
  }, [chessRules, updateEvaluationFromMap]);

  const handleBoardUpdate = useCallback(
    ({ fen: nextFen }: { fen: string }) => {
      setFen((previousFen) => (previousFen === nextFen ? previousFen : nextFen));
      syncOrientationWithFen(nextFen);
      setPgnError(null);

      if (chessRules.getFEN() !== nextFen) {
        try {
          chessRules.setFEN(nextFen);
        } catch (error) {
          console.error('Error while syncing the FEN with PGN navigation:', error);
        }
        updateStatusSnapshot();
      }

      const mappedPly = fenToPlyMap[nextFen];
      if (typeof mappedPly === 'number') {
        updateEvaluationFromMap(mappedPly);
      } else {
        setCurrentEvaluation(undefined);
        setCurrentPly(chessRules.history().length);
      }
    },
    [
      chessRules,
      fenToPlyMap,
      syncOrientationWithFen,
      updateEvaluationFromMap,
      updateStatusSnapshot,
    ],
  );

  // Loading states used for demonstration purposes
  const [isCopying, setIsCopying] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isThemeChanging, setIsThemeChanging] = useState(false);

  // Simulate initial loading (disabled during tests)
  const isInitialLoading = process.env.NODE_ENV === 'test' ? false : useLoadingState(1500);

  // Synchronise the FEN position with the ChessJsRules instance only for manual FEN changes
  // (not when moves are played on the board)
  const [isManualFenChange, setIsManualFenChange] = useState(false);

  useEffect(() => {
    if (fen && isManualFenChange) {
      try {
        chessRules.setFEN(fen);
        const updatedFen = chessRules.getFEN();
        setFen(updatedFen); // Update FEN state with corrected FEN
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

    setIsPgnLoading(true);
    try {
      setPgnError(null);
      const success = chessRules.loadPgn(trimmed);
      const board = boardRef.current?.getBoard();
      const boardResult = board?.loadPgnWithAnnotations(trimmed);

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
      // Simulate a delay to display the loader (disabled during tests)
      if (process.env.NODE_ENV !== 'test') {
        await new Promise((resolve) => setTimeout(resolve, 800));
      }
    } catch (error) {
      console.error('Error while copying to the clipboard:', error);
    } finally {
      setIsCopying(false);
    }
  };

  const handleReset = async () => {
    setIsResetting(true);
    // Simulate a delay to display the loader (disabled during tests)
    if (process.env.NODE_ENV !== 'test') {
      await new Promise((resolve) => setTimeout(resolve, 1000));
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
      // Simulate a delay to display the loader (disabled during tests)
      if (process.env.NODE_ENV !== 'test') {
        await new Promise((resolve) => setTimeout(resolve, 1200));
      }
      chessRules.setPgnMetadata({
        Event: 'Playground',
        Site: 'Local',
        Date: new Date().toISOString().slice(0, 10).replace(/-/g, '.'),
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
    // Simulate a delay to display the loader (disabled during tests)
    if (process.env.NODE_ENV !== 'test') {
      await new Promise((resolve) => setTimeout(resolve, 600));
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

  // Add a custom arrow
  const addRandomArrow = useCallback(() => {
    if (!boardRef.current) return;

    const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
    const ranks = ['1', '2', '3', '4', '5', '6', '7', '8'];

    const randomSquare = (): Square => {
      const file = files[Math.floor(Math.random() * files.length)];
      const rank = ranks[Math.floor(Math.random() * ranks.length)];
      return `${file}${rank}` as Square;
    };

    const from = randomSquare();
    let to = randomSquare();

    // Ensure the squares are different
    while (to === from) {
      to = randomSquare();
    }

    const colors = ['#3498db', '#e74c3c', '#2ecc71', '#f1c40f', '#9b59b6'];
    const color = colors[Math.floor(Math.random() * colors.length)];

    boardRef.current.addArrow({
      from,
      to,
      color,
    });
  }, []);

  // Add a custom highlight
  const addRandomHighlight = useCallback(() => {
    if (!boardRef.current) return;

    const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
    const ranks = ['1', '2', '3', '4', '5', '6', '7', '8'];

    const randomSquare = (): Square => {
      const file = files[Math.floor(Math.random() * files.length)];
      const rank = ranks[Math.floor(Math.random() * ranks.length)];
      return `${file}${rank}` as Square;
    };

    const square = randomSquare();
    const types: Array<'move' | 'capture' | 'check' | 'selected'> = [
      'move',
      'capture',
      'check',
      'selected',
    ];
    const type = types[Math.floor(Math.random() * types.length)];

    // Get the board instance from the ref
    const board = boardRef.current.getBoard();
    if (board && typeof board.addHighlight === 'function') {
      board.addHighlight(square, type);
    } else {
      // Fallback to direct method if getBoard() is not available
      boardRef.current.addHighlight(square, type);
    }
  }, []);

  // Clear all highlights and arrows
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
    ? `${styles.statusTag} ${styles.statusTagCritical}`
    : status.isStalemate || status.inCheck
      ? `${styles.statusTag} ${styles.statusTagWarning}`
      : status.isGameOver
        ? `${styles.statusTag} ${styles.statusTagInfo}`
        : `${styles.statusTag} ${styles.statusTagSuccess}`;
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
      ? `${styles.statusTag} ${styles.statusTagCritical}`
      : status.halfMoves >= 80
        ? `${styles.statusTag} ${styles.statusTagWarning}`
        : `${styles.statusTag} ${styles.statusTagInfo}`;
  const fiftyTagLabel =
    status.halfMoves >= 100
      ? translate('status.tags.fiftyReached')
      : status.halfMoves >= 80
        ? translate('status.tags.fiftyWarning', { halfMoves: halfMovesRemaining })
        : translate('status.tags.fiftyInfo', { halfMoves: halfMovesRemaining });

  // Display the initial loading screen
  if (isInitialLoading) {
    return (
      <div className={styles.container}>
        <div className={styles.boardSection}>
          <header className={styles.header}>
            <div>
              <h1 className={styles.title}>NeoChessBoard</h1>
              <span className={styles.themeInfo}>{translate('app.loading')}</span>
            </div>
            <div className={styles.themeButtons}>
              <SkeletonButtons count={2} />
            </div>
          </header>

          <div className={styles.boardWrapper}>
            <div className={styles.boardLoading}>
              <DotLoader />
              <div className={styles.loadingText}>{translate('app.initializing')}</div>
            </div>
          </div>
        </div>

        <div className={styles.controlsSection}>
          <div className={styles.panel}>
            <div className={styles.panelHeader}>
              <h3 className={styles.panelTitle}>{translate('pgn.title')}</h3>
            </div>
            <div className={styles.panelContent}>
              <SkeletonText lines={8} />
              <SkeletonButtons count={3} />
            </div>
          </div>

          <div className={styles.panel}>
            <div className={styles.panelHeader}>
              <h3 className={styles.panelTitle}>{translate('fen.title')}</h3>
            </div>
            <div className={styles.panelContent}>
              <SkeletonText lines={3} />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.boardSection}>
        <header className={styles.header}>
          <div>
            <h1 className={styles.title}>NeoChessBoard</h1>
            <span className={styles.themeInfo}>{themeNames[theme]}</span>
          </div>
          <div className={styles.themeButtons}>
            <div className={styles.languageControl}>
              <label htmlFor="demo-language" className={styles.languageLabel}>
                {translate('app.languageLabel')}
              </label>
              <select
                id="demo-language"
                className={styles.languageSelect}
                value={language}
                onChange={(event) => setLanguage(event.target.value as Language)}
              >
                <option value="en">{translate('app.languageEnglish')}</option>
                <option value="fr">{translate('app.languageFrench')}</option>
              </select>
            </div>
            {isThemeChanging && <LoadingOverlay text={translate('app.themeChanging')} />}
            <LoadingButton
              className={`${styles.themeButton} ${theme === 'midnight' ? styles.active : ''}`}
              onClick={() => handleThemeChange('midnight')}
              isLoading={isThemeChanging}
              disabled={isThemeChanging}
            >
              {translate('app.themes.midnight')}
            </LoadingButton>
            <LoadingButton
              className={`${styles.themeButton} ${theme === 'classic' ? styles.active : ''}`}
              onClick={() => handleThemeChange('classic')}
              isLoading={isThemeChanging}
              disabled={isThemeChanging}
            >
              {translate('app.themes.classic')}
            </LoadingButton>
            <a
              href="./playground.html"
              className={`${styles.themeButton} ${styles.playgroundLink}`}
              title={translate('app.playgroundLinkTitle')}
            >
              {translate('app.playgroundLinkText')}
            </a>
            <a
              href="./theme-creator.html"
              className={`${styles.themeButton} ${styles.themeCreatorLink}`}
              title={translate('app.themeCreatorTitle')}
            >
              {translate('app.themeCreatorLinkText')}
            </a>
          </div>
        </header>

        <div className={styles.boardWrapper}>
          <div
            ref={boardContainerRef}
            className={styles.boardCanvasContainer}
            style={boardContainerStyle}
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
              animationDurationInMs={boardOptions.animationDuration}
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
                // Play the move in our ChessJsRules instance to generate PGN notation
                const result = chessRules.move({ from, to });
                if (!result.ok) {
                  return;
                }
                setPgnError(null);
                // Obtenir la notation PGN standard depuis chess.js
                setPgnText(chessRules.toPgn(false));
                setFen(nextFen);
                syncOrientationWithFen(nextFen);
                updateStatusSnapshot();
                const historyLength = chessRules.history().length;
                setFenToPlyMap((prev) => {
                  if (prev[nextFen] === historyLength) {
                    return prev;
                  }
                  return { ...prev, [nextFen]: historyLength };
                });
                updateEvaluationFromMap(historyLength);
              }}
              onUpdate={handleBoardUpdate}
              className={styles.boardCanvas}
            />
            {boardOptions.allowResize && (
              <div className={styles.boardResizeAffordance}>
                <span className={styles.boardResizeSize} aria-live="polite">
                  <span className={styles.boardResizeIcon} aria-hidden="true">
                    <BoardSizeIcon />
                  </span>
                  {boardSizeLabel}
                </span>
                <button
                  type="button"
                  className={
                    isResizingBoard
                      ? `${styles.boardResizeHandle} ${styles.boardResizeHandleActive}`
                      : styles.boardResizeHandle
                  }
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
                  <span className={styles.boardResizeHandleGrip} aria-hidden="true" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className={styles.controlsSection}>
        <div className={styles.panel}>
          <div className={styles.panelHeader}>
            <h3 className={styles.panelTitle}>{translate('status.title')}</h3>
          </div>
          <div className={styles.panelContent}>
            <div className={styles.statusGrid}>
              <div className={styles.statusItem}>
                <span className={styles.statusLabel}>{translate('status.turn.label')}</span>
                <span className={styles.statusValue}>
                  {status.turn === 'w' ? whiteLabel : blackLabel}
                </span>
                <span className={styles.statusHint}>
                  {translate('status.turn.moveNumber', { moveNumber: status.moveNumber })}
                </span>
              </div>
              <div className={styles.statusItem}>
                <span className={styles.statusLabel}>{translate('status.legalMoves.label')}</span>
                <span className={styles.statusValue}>{status.legalMoves}</span>
                <span className={styles.statusHint}>
                  {translate('status.legalMoves.hint', {
                    color: status.turn === 'w' ? whiteSideLabel : blackSideLabel,
                  })}
                </span>
              </div>
              <div className={styles.statusItem}>
                <span className={styles.statusLabel}>{translate('status.halfMoves.label')}</span>
                <span className={styles.statusValue}>{status.halfMoves}</span>
                <span className={styles.statusHint}>{translate('status.halfMoves.hint')}</span>
              </div>
              <div className={styles.statusItem}>
                <span className={styles.statusLabel}>{translate('status.fifty.label')}</span>
                <span className={styles.statusValue}>{halfMovesRemaining}</span>
                <span className={styles.statusHint}>{translate('status.fifty.hint')}</span>
              </div>
            </div>
            <div className={styles.statusTags}>
              <span className={gameTagClass}>{gameTagLabel}</span>
              <span className={fiftyTagClass}>{fiftyTagLabel}</span>
            </div>
          </div>
        </div>

        <div className={styles.panel}>
          <div className={styles.panelHeader}>
            <h3 className={styles.panelTitle}>{translate('evaluation.panelTitle')}</h3>
          </div>
          <div className={styles.panelContent}>
            <div className={styles.evaluationPanel}>
              <div className={styles.evaluationBarSlot}>
                <EvaluationBar
                  evaluation={currentEvaluation}
                  orientation={boardOptions.orientation}
                  ply={currentPly}
                />
              </div>
              <div className={styles.evaluationInfo}>
                <h4 className={styles.evaluationInfoTitle}>
                  {translate('evaluation.analysisTitle')}
                </h4>
                <p className={styles.evaluationInfoText}>{evaluationSummary}</p>
                <p className={styles.evaluationInfoText}>
                  {translate('evaluation.instructions.prefix')} <code>[%eval ...]</code>{' '}
                  {translate('evaluation.instructions.middle')}{' '}
                  <strong>{translate('pgn.load')}</strong>{' '}
                  {translate('evaluation.instructions.suffix')}
                </p>
                <ul className={styles.evaluationInfoList}>
                  <li>{translate('evaluation.list.perspective')}</li>
                  <li>{translate('evaluation.list.updates')}</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        <div className={styles.panel}>
          <div className={styles.panelHeader}>
            <h3 className={styles.panelTitle}>{translate('options.title')}</h3>
          </div>
          <div className={styles.panelContent}>
            <div className={styles.optionGrid}>
              <button
                type="button"
                className={`${styles.optionButton} ${boardOptions.showArrows ? styles.optionActive : ''}`}
                onClick={() => toggleOption('showArrows')}
                aria-pressed={boardOptions.showArrows}
              >
                <span className={styles.optionIcon}>
                  <ArrowsIcon />
                </span>
                <span className={styles.optionLabel}>
                  <span className={styles.optionTitle}>
                    {translate('options.showArrows.title')}
                  </span>
                  <span className={styles.optionHint}>
                    {translate(
                      boardOptions.showArrows
                        ? 'options.showArrows.enabled'
                        : 'options.showArrows.disabled',
                    )}
                  </span>
                </span>
              </button>

              <button
                type="button"
                className={`${styles.optionButton} ${boardOptions.showHighlights ? styles.optionActive : ''}`}
                onClick={() => toggleOption('showHighlights')}
                aria-pressed={boardOptions.showHighlights}
              >
                <span className={styles.optionIcon}>
                  <HighlightIcon />
                </span>
                <span className={styles.optionLabel}>
                  <span className={styles.optionTitle}>
                    {translate('options.showHighlights.title')}
                  </span>
                  <span className={styles.optionHint}>
                    {translate(
                      boardOptions.showHighlights
                        ? 'options.showHighlights.enabled'
                        : 'options.showHighlights.disabled',
                    )}
                  </span>
                </span>
              </button>

              <button
                type="button"
                className={`${styles.optionButton} ${boardOptions.allowPremoves ? styles.optionActive : ''}`}
                onClick={() => toggleOption('allowPremoves')}
                aria-pressed={boardOptions.allowPremoves}
              >
                <span className={styles.optionIcon}>
                  <PremovesIcon />
                </span>
                <span className={styles.optionLabel}>
                  <span className={styles.optionTitle}>
                    {translate('options.allowPremoves.title')}
                  </span>
                  <span className={styles.optionHint}>
                    {translate(
                      boardOptions.allowPremoves
                        ? 'options.allowPremoves.enabled'
                        : 'options.allowPremoves.disabled',
                    )}
                  </span>
                </span>
              </button>

              <button
                type="button"
                className={`${styles.optionButton} ${boardOptions.showAnimations ? styles.optionActive : ''}`}
                onClick={() => toggleOption('showAnimations')}
                aria-pressed={boardOptions.showAnimations}
              >
                <span className={styles.optionIcon}>
                  <AnimationIcon />
                </span>
                <span className={styles.optionLabel}>
                  <span className={styles.optionTitle}>
                    {translate('options.showAnimations.title')}
                  </span>
                  <span className={styles.optionHint}>
                    {translate(
                      boardOptions.showAnimations
                        ? 'options.showAnimations.enabled'
                        : 'options.showAnimations.disabled',
                    )}
                  </span>
                </span>
              </button>

              <div className={styles.animationControl} aria-disabled={!boardOptions.showAnimations}>
                <label className={styles.optionTitle} htmlFor={animationSpeedInputId}>
                  {translate('options.animationSpeed.label')}
                </label>
                <input
                  id={animationSpeedInputId}
                  type="range"
                  min={0}
                  max={2000}
                  step={50}
                  value={boardOptions.animationDuration}
                  onChange={handleAnimationSpeedChange}
                  className={styles.animationControlInput}
                  disabled={!boardOptions.showAnimations}
                  aria-valuemin={0}
                  aria-valuemax={2000}
                  aria-valuenow={boardOptions.animationDuration}
                  aria-label={translate('options.animationSpeed.label')}
                />
                <span className={styles.animationControlValue}>
                  {translate('options.animationSpeed.value', {
                    milliseconds: boardOptions.animationDuration,
                  })}
                </span>
              </div>

              <button
                type="button"
                className={`${styles.optionButton} ${boardOptions.showSquareNames ? styles.optionActive : ''}`}
                onClick={() => toggleOption('showSquareNames')}
                aria-pressed={boardOptions.showSquareNames}
              >
                <span className={styles.optionIcon}>
                  <SquareNamesIcon />
                </span>
                <span className={styles.optionLabel}>
                  <span className={styles.optionTitle}>
                    {translate('options.showSquareNames.title')}
                  </span>
                  <span className={styles.optionHint}>
                    {translate(
                      boardOptions.showSquareNames
                        ? 'options.showSquareNames.enabled'
                        : 'options.showSquareNames.disabled',
                    )}
                  </span>
                </span>
              </button>

              <button
                type="button"
                className={`${styles.optionButton} ${boardOptions.soundEnabled ? styles.optionActive : ''}`}
                onClick={() => toggleOption('soundEnabled')}
                aria-pressed={boardOptions.soundEnabled}
              >
                <span className={styles.optionIcon}>
                  <SoundIcon />
                </span>
                <span className={styles.optionLabel}>
                  <span className={styles.optionTitle}>
                    {translate('options.soundEnabled.title')}
                  </span>
                  <span className={styles.optionHint}>
                    {translate(
                      boardOptions.soundEnabled
                        ? 'options.soundEnabled.enabled'
                        : 'options.soundEnabled.disabled',
                    )}
                  </span>
                </span>
              </button>

              <button
                type="button"
                className={`${styles.optionButton} ${boardOptions.allowResize ? styles.optionActive : ''}`}
                onClick={() => toggleOption('allowResize')}
                aria-pressed={boardOptions.allowResize}
              >
                <span className={styles.optionIcon}>
                  <BoardSizeIcon />
                </span>
                <span className={styles.optionLabel}>
                  <span className={styles.optionTitle}>
                    {translate('options.allowResize.title')}
                  </span>
                  <span className={styles.optionHint}>
                    {translate(
                      boardOptions.allowResize
                        ? 'options.allowResize.enabled'
                        : 'options.allowResize.disabled',
                    )}
                  </span>
                </span>
              </button>

              <button
                type="button"
                className={`${styles.optionButton} ${boardOptions.highlightLegal ? styles.optionActive : ''}`}
                onClick={() => toggleOption('highlightLegal')}
                aria-pressed={boardOptions.highlightLegal}
              >
                <span className={styles.optionIcon}>
                  <LegalMovesIcon />
                </span>
                <span className={styles.optionLabel}>
                  <span className={styles.optionTitle}>
                    {translate('options.highlightLegal.title')}
                  </span>
                  <span className={styles.optionHint}>
                    {translate(
                      boardOptions.highlightLegal
                        ? 'options.highlightLegal.enabled'
                        : 'options.highlightLegal.disabled',
                    )}
                  </span>
                </span>
              </button>

              <button
                type="button"
                className={`${styles.optionButton} ${boardOptions.autoFlip ? styles.optionActive : ''}`}
                onClick={toggleAutoFlip}
                aria-pressed={boardOptions.autoFlip}
              >
                <span className={styles.optionIcon}>
                  <AutoFlipIcon />
                </span>
                <span className={styles.optionLabel}>
                  <span className={styles.optionTitle}>{translate('options.autoFlip.title')}</span>
                  <span className={styles.optionHint}>
                    {translate(
                      boardOptions.autoFlip
                        ? 'options.autoFlip.enabled'
                        : 'options.autoFlip.disabled',
                    )}
                  </span>
                </span>
              </button>

              <button
                type="button"
                className={styles.optionButton}
                onClick={toggleOrientation}
                disabled={boardOptions.autoFlip}
                title={
                  boardOptions.autoFlip ? translate('board.orientation.autoDisabled') : undefined
                }
              >
                <span className={styles.optionIcon}>
                  <OrientationIcon />
                </span>
                <span className={styles.optionLabel}>
                  <span className={styles.optionTitle}>
                    {translate('options.orientation.title')}
                  </span>
                  <span className={styles.optionHint}>
                    {boardOptions.autoFlip
                      ? translate('options.orientation.auto')
                      : translate('options.orientation.view', {
                          color: boardOptions.orientation === 'white' ? whiteLabel : blackLabel,
                        })}
                  </span>
                </span>
              </button>

              <button type="button" className={styles.optionButton} onClick={addRandomArrow}>
                <span className={styles.optionIcon}>
                  <AddArrowIcon />
                </span>
                <span className={styles.optionLabel}>
                  <span className={styles.optionTitle}>{translate('options.addArrow.title')}</span>
                  <span className={styles.optionHint}>{translate('options.addArrow.hint')}</span>
                </span>
              </button>

              <button type="button" className={styles.optionButton} onClick={addRandomHighlight}>
                <span className={styles.optionIcon}>
                  <AddHighlightIcon />
                </span>
                <span className={styles.optionLabel}>
                  <span className={styles.optionTitle}>
                    {translate('options.addHighlight.title')}
                  </span>
                  <span className={styles.optionHint}>
                    {translate('options.addHighlight.hint')}
                  </span>
                </span>
              </button>

              <button
                type="button"
                className={`${styles.optionButton} ${styles.danger}`}
                onClick={clearAll}
              >
                <span className={styles.optionIcon}>
                  <TrashIcon />
                </span>
                <span className={styles.optionLabel}>
                  <span className={styles.optionTitle}>{translate('options.clearAll.title')}</span>
                  <span className={styles.optionHint}>{translate('options.clearAll.hint')}</span>
                </span>
              </button>
            </div>
          </div>
        </div>

        <div className={styles.panel} style={{ position: 'relative' }}>
          <div className={styles.panelHeader}>
            <h3 className={styles.panelTitle}>{translate('pgn.title')}</h3>
          </div>
          <div className={styles.panelContent}>
            <textarea
              className={styles.textarea}
              value={pgnText}
              onChange={(event) => {
                setPgnText(event.target.value);
                if (pgnError) {
                  setPgnError(null);
                }
              }}
              aria-label={translate('pgn.title')}
              placeholder={translate('pgn.placeholder')}
            />
            <div className={styles.buttonGroup}>
              <LoadingButton
                className={`${styles.button} ${styles.buttonPrimary}`}
                onClick={() => {
                  void handleLoadPgn();
                }}
                isLoading={isPgnLoading}
              >
                {isPgnLoading ? translate('pgn.loading') : translate('pgn.load')}
              </LoadingButton>
              <LoadingButton
                className={`${styles.button} ${styles.buttonSuccess} ${styles.buttonCopy}`}
                onClick={handleCopyPGN}
                isLoading={isCopying}
              >
                {isCopying ? translate('pgn.copying') : translate('pgn.copy')}
              </LoadingButton>
              <LoadingButton
                className={`${styles.button} ${styles.buttonWarning} ${styles.buttonReset}`}
                onClick={handleReset}
                isLoading={isResetting}
              >
                {isResetting ? translate('pgn.resetting') : translate('pgn.reset')}
              </LoadingButton>
              <LoadingButton
                className={`${styles.button} ${styles.buttonPrimary} ${styles.buttonExport}`}
                onClick={handleExport}
                isLoading={isExporting}
              >
                {isExporting ? translate('pgn.exporting') : translate('pgn.export')}
              </LoadingButton>
            </div>
            {pgnError ? <div className={styles.pgnError}>{pgnError}</div> : null}
            <p className={styles.pgnHelper}>
              <strong>{translate('pgn.helper.prefix')}</strong> {translate('pgn.helper.middle')}{' '}
              <code>[%eval ...]</code> {translate('pgn.helper.suffix')}
            </p>
          </div>
        </div>

        <div className={styles.panel}>
          <div className={styles.panelHeader}>
            <h3 className={styles.panelTitle}>{translate('fen.title')}</h3>
          </div>
          <div className={styles.panelContent}>
            <textarea
              className={`${styles.textarea} ${styles.textareaSmall}`}
              value={fen || ''}
              onChange={(e) => {
                setFen(e.target.value);
                setIsManualFenChange(true);
              }}
              aria-label={translate('fen.title')}
              placeholder={translate('fen.placeholder')}
            />
          </div>
        </div>

        <div className={styles.panel}>
          <div className={styles.panelHeader}>
            <h3 className={styles.panelTitle}>{translate('premoves.title')}</h3>
          </div>
          <div className={styles.panelContent}>
            <div className={styles.infoBox}>
              <p>
                <strong>{translate('premoves.instructions')}</strong>
              </p>
              <ul>
                <li>{translate('premoves.step.examples')}</li>
                <li>{translate('premoves.step.outOfTurn')}</li>
                <li>{translate('premoves.step.stored')}</li>
                <li>{translate('premoves.step.execute')}</li>
              </ul>
            </div>
            <div className={styles.buttonGroup}>
              <button
                className={`${styles.button} ${styles.buttonPrimary}`}
                onClick={() => {
                  setFen('rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1');
                  setIsManualFenChange(true);
                }}
              >
                {translate('premoves.sample.opening')}
              </button>
              <button
                className={`${styles.button} ${styles.buttonPrimary}`}
                onClick={() => {
                  setFen('r1bqkb1r/pppp1ppp/2n2n2/4p3/2B1P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 4 4');
                  setIsManualFenChange(true);
                }}
              >
                {translate('premoves.sample.middleGame')}
              </button>
              <button
                className={`${styles.button} ${styles.buttonPrimary}`}
                onClick={() => {
                  setFen('4k3/8/8/8/8/8/4P3/4K3 w - - 0 1');
                  setIsManualFenChange(true);
                }}
              >
                {translate('premoves.sample.endgame')}
              </button>
            </div>
          </div>
        </div>

        <div className={styles.panel}>
          <div className={styles.panelHeader}>
            <h3 className={styles.panelTitle}>{translate('examples.title')}</h3>
          </div>
          <div className={styles.panelContent}>
            <p className={styles.exampleIntro}>{translate('examples.intro')}</p>
            <div className={styles.exampleLinks}>
              {LIVE_EXAMPLES.map((example) => (
                <a
                  key={example.href}
                  className={styles.exampleLinkCard}
                  href={example.href}
                  target="_blank"
                  rel="noreferrer"
                >
                  <div className={styles.exampleLinkText}>
                    <span className={styles.exampleLinkLabel}>
                      <span aria-hidden="true" className={styles.exampleLinkIcon}>
                        {example.icon}
                      </span>
                      {translate(example.labelKey)}
                    </span>
                    <span className={styles.exampleLinkDescription}>
                      {translate(example.descriptionKey)}
                    </span>
                  </div>
                  <span aria-hidden="true" className={styles.exampleLinkArrow}>
                    ↗
                  </span>
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>
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
