import React, { useMemo, useState, useRef, useEffect, useCallback, useId } from 'react';
import { NeoChessBoard, NeoChessRef } from '../src/react';
import { ChessJsRules } from '../src/core/ChessJsRules';
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
import { useBoardSize } from './hooks/useBoardSize';

const SvgIcon: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.6}
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
    focusable="false"
  >
    {children}
  </svg>
);

const ArrowsIcon: React.FC = () => (
  <SvgIcon>
    <path d="M5 7h8" />
    <path d="m13 7-2-2" />
    <path d="m13 7-2 2" />
    <path d="M19 17h-8" />
    <path d="m11 17 2-2" />
    <path d="m11 17 2 2" />
  </SvgIcon>
);

const HighlightIcon: React.FC = () => (
  <SvgIcon>
    <path d="m12 6.4 1.7 3.3 3.6.5-2.7 2.6.6 3.6L12 15.8l-3.2 1.6.6-3.6-2.7-2.6 3.6-.5z" />
  </SvgIcon>
);

const PremovesIcon: React.FC = () => (
  <SvgIcon>
    <path d="m6 8 4 4-4 4" />
    <path d="m12 8 4 4-4 4" />
  </SvgIcon>
);

const SquareNamesIcon: React.FC = () => (
  <SvgIcon>
    <rect x={4.5} y={4.5} width={15} height={15} rx={2} />
    <path d="M9.5 4.5v15" />
    <path d="M14.5 4.5v15" />
    <path d="M4.5 9.5h15" />
    <path d="M4.5 14.5h15" />
  </SvgIcon>
);

const SoundIcon: React.FC = () => (
  <SvgIcon>
    <path d="M5.5 10v4h2.8L12 15.7V8.3L8.3 10z" />
    <path d="M15 9.5a2.5 2.5 0 0 1 0 5" />
    <path d="M17.5 8a5 5 0 0 1 0 8" />
  </SvgIcon>
);

const LegalMovesIcon: React.FC = () => (
  <SvgIcon>
    <circle cx={12} cy={12} r={6} />
    <circle cx={12} cy={12} r={2.6} />
    <path d="M12 6v2" />
    <path d="M12 16v2" />
    <path d="M6 12h2" />
    <path d="M16 12h2" />
  </SvgIcon>
);

const AutoFlipIcon: React.FC = () => (
  <SvgIcon>
    <path d="M8 7a6 6 0 0 1 9 2" />
    <path d="M17 5v4h-4" />
    <path d="M16 17a6 6 0 0 1-9-2" />
    <path d="M7 19v-4h4" />
  </SvgIcon>
);

const OrientationIcon: React.FC = () => (
  <SvgIcon>
    <rect x={4.5} y={4.5} width={15} height={15} rx={2} />
    <path d="m9 9 3 3-3 3" />
    <path d="m15 9-3 3 3 3" />
  </SvgIcon>
);

const BoardSizeIcon: React.FC = () => (
  <SvgIcon>
    <rect x={4.5} y={4.5} width={15} height={15} rx={2} />
    <path d="M8 16h8" />
    <path d="M16 8v8" />
    <path d="m8 8 2 2" />
    <path d="m8 8 2-2" />
  </SvgIcon>
);

const AddArrowIcon: React.FC = () => (
  <SvgIcon>
    <path d="M5 16h8" />
    <path d="m13 16-2-2" />
    <path d="m13 16-2 2" />
    <path d="M17 7v4" />
    <path d="M15 9h4" />
  </SvgIcon>
);

const AddHighlightIcon: React.FC = () => (
  <SvgIcon>
    <path d="m12 6.4 1.7 3.3 3.6.5-2.7 2.6.6 3.6L12 15.8l-3.2 1.6.6-3.6-2.7-2.6 3.6-.5z" />
    <path d="M19 6v4" />
    <path d="M17 8h4" />
  </SvgIcon>
);

const TrashIcon: React.FC = () => (
  <SvgIcon>
    <path d="M10 5h4" />
    <path d="M6 7h12" />
    <path d="M9 7v10a1 1 0 0 0 1 1h4a1 1 0 0 0 1-1V7" />
    <path d="M10.5 11v6" />
    <path d="M13.5 11v6" />
  </SvgIcon>
);

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

// Type pour les options de l'échiquier
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
}

export const App: React.FC = () => {
  const chessRules = useMemo(() => new ChessJsRules(), []);
  const [fen, setFen] = useState<string | undefined>(undefined);
  const [theme, setTheme] = useState<'midnight' | 'classic'>('midnight');
  const [status, setStatus] = useState<GameStatus>(() => buildStatusSnapshot(chessRules));
  const [pgnText, setPgnText] = useState('');
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
  });

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

  // États de loading pour démonstration
  const [isCopying, setIsCopying] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isThemeChanging, setIsThemeChanging] = useState(false);

  // Simuler le chargement initial (désactivé pendant les tests)
  const isInitialLoading = process.env.NODE_ENV === 'test' ? false : useLoadingState(1500);

  // Synchroniser la position FEN avec l'instance ChessJsRules uniquement pour les changements manuels de FEN
  // (pas lors des coups joués sur l'échiquier)
  const [isManualFenChange, setIsManualFenChange] = useState(false);

  useEffect(() => {
    if (fen && isManualFenChange) {
      try {
        chessRules.setFEN(fen);
        const updatedFen = chessRules.getFEN();
        setFen(updatedFen); // Update FEN state with corrected FEN
        syncOrientationWithFen(updatedFen);
        setPgnText(chessRules.toPgn(false));
        updateStatusSnapshot();
        setIsManualFenChange(false);
      } catch (error) {
        console.error('FEN invalide:', error);
        setIsManualFenChange(false);
      }
    }
  }, [fen, chessRules, isManualFenChange, syncOrientationWithFen, updateStatusSnapshot]);

  const handleCopyPGN = async () => {
    setIsCopying(true);
    try {
      await navigator.clipboard.writeText(pgnText);
      // Simuler un délai pour montrer le loader (désactivé pendant les tests)
      if (process.env.NODE_ENV !== 'test') {
        await new Promise((resolve) => setTimeout(resolve, 800));
      }
    } catch (error) {
      console.error('Erreur lors de la copie:', error);
    } finally {
      setIsCopying(false);
    }
  };

  const handleReset = async () => {
    setIsResetting(true);
    // Simuler un délai pour montrer le loader (désactivé pendant les tests)
    if (process.env.NODE_ENV !== 'test') {
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
    chessRules.reset();
    setPgnText(chessRules.toPgn(false));
    const resetFen = chessRules.getFEN();
    setFen(resetFen);
    syncOrientationWithFen(resetFen);
    updateStatusSnapshot();
    setIsResetting(false);
  };

  const handleExport = async () => {
    setIsExporting(true);
    try {
      // Simuler un délai pour montrer le loader (désactivé pendant les tests)
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
      console.error("Erreur lors de l'export:", error);
    } finally {
      setIsExporting(false);
    }
  };

  const handleThemeChange = async (newTheme: 'midnight' | 'classic') => {
    if (newTheme === theme) return;

    setIsThemeChanging(true);
    // Simuler un délai pour montrer le loader (désactivé pendant les tests)
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
    | 'allowResize';

  const toggleOption = useCallback((option: ToggleableOption) => {
    setBoardOptions((prev) => ({
      ...prev,
      [option]: !prev[option],
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

  // Ajouter une flèche personnalisée
  const addRandomArrow = useCallback(() => {
    if (!boardRef.current) return;

    const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
    const ranks = ['1', '2', '3', '4', '5', '6', '7', '8'];

    const randomSquare = () => {
      const file = files[Math.floor(Math.random() * files.length)];
      const rank = ranks[Math.floor(Math.random() * ranks.length)];
      return `${file}${rank}` as any;
    };

    const from = randomSquare();
    let to = randomSquare();

    // S'assurer que les cases sont différentes
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

  // Ajouter une surbrillance personnalisée
  const addRandomHighlight = useCallback(() => {
    if (!boardRef.current) return;

    const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
    const ranks = ['1', '2', '3', '4', '5', '6', '7', '8'];

    const randomSquare = () => {
      const file = files[Math.floor(Math.random() * files.length)];
      const rank = ranks[Math.floor(Math.random() * ranks.length)];
      return `${file}${rank}` as any;
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

  // Effacer toutes les surbrillances et flèches
  const clearAll = useCallback(() => {
    if (!boardRef.current) return;
    boardRef.current.clearArrows();
    boardRef.current.clearHighlights();
  }, []);

  const halfMovesRemaining = Math.max(0, 100 - status.halfMoves);
  const gameTagClass = status.isCheckmate
    ? `${styles.statusTag} ${styles.statusTagCritical}`
    : status.isStalemate || status.inCheck
      ? `${styles.statusTag} ${styles.statusTagWarning}`
      : status.isGameOver
        ? `${styles.statusTag} ${styles.statusTagInfo}`
        : `${styles.statusTag} ${styles.statusTagSuccess}`;
  const gameTagLabel = status.isCheckmate
    ? 'Échec et mat'
    : status.isStalemate
      ? 'Pat'
      : status.inCheck
        ? 'Échec en cours'
        : status.isGameOver
          ? 'Partie terminée'
          : 'Partie en cours';
  const fiftyTagClass =
    status.halfMoves >= 100
      ? `${styles.statusTag} ${styles.statusTagCritical}`
      : status.halfMoves >= 80
        ? `${styles.statusTag} ${styles.statusTagWarning}`
        : `${styles.statusTag} ${styles.statusTagInfo}`;
  const fiftyTagLabel =
    status.halfMoves >= 100
      ? 'Limite des 50 coups atteinte'
      : status.halfMoves >= 80
        ? `${halfMovesRemaining} demi-coups avant la limite`
        : `${halfMovesRemaining} demi-coups restants`;

  // Afficher l'écran de chargement initial
  if (isInitialLoading) {
    return (
      <div className={styles.container}>
        <div className={styles.boardSection}>
          <header className={styles.header}>
            <div>
              <h1 className={styles.title}>NeoChessBoard</h1>
              <span className={styles.themeInfo}>chargement...</span>
            </div>
            <div className={styles.themeButtons}>
              <SkeletonButtons count={2} />
            </div>
          </header>

          <div className={styles.boardWrapper}>
            <div className={styles.boardLoading}>
              <DotLoader />
              <div className={styles.loadingText}>Initialisation de l'échiquier...</div>
            </div>
          </div>
        </div>

        <div className={styles.controlsSection}>
          <div className={styles.panel}>
            <div className={styles.panelHeader}>
              <h3 className={styles.panelTitle}>📋 PGN Notation</h3>
            </div>
            <div className={styles.panelContent}>
              <SkeletonText lines={8} />
              <SkeletonButtons count={3} />
            </div>
          </div>

          <div className={styles.panel}>
            <div className={styles.panelHeader}>
              <h3 className={styles.panelTitle}>🎯 Position FEN</h3>
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
            <span className={styles.themeInfo}>{theme}</span>
          </div>
          <div className={styles.themeButtons}>
            {isThemeChanging && <LoadingOverlay text="Changement de thème..." />}
            <LoadingButton
              className={`${styles.themeButton} ${theme === 'midnight' ? styles.active : ''}`}
              onClick={() => handleThemeChange('midnight')}
              isLoading={isThemeChanging}
              disabled={isThemeChanging}
            >
              Midnight
            </LoadingButton>
            <LoadingButton
              className={`${styles.themeButton} ${theme === 'classic' ? styles.active : ''}`}
              onClick={() => handleThemeChange('classic')}
              isLoading={isThemeChanging}
              disabled={isThemeChanging}
            >
              Classic
            </LoadingButton>
            <a
              href="./theme-creator.html"
              className={`${styles.themeButton} ${styles.themeCreatorLink}`}
              title="Créer un thème personnalisé"
            >
              🎨 Theme Creator
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
              soundUrl={moveSound}
              orientation={boardOptions.orientation}
              highlightLegal={boardOptions.highlightLegal}
              autoFlip={boardOptions.autoFlip}
              onMove={({ from, to, fen: nextFen }) => {
                // Jouer le mouvement dans notre instance ChessJsRules pour générer la notation PGN
                chessRules.move({ from, to });
                // Obtenir la notation PGN standard depuis chess.js
                setPgnText(chessRules.toPgn(false));
                setFen(nextFen);
                syncOrientationWithFen(nextFen);
                updateStatusSnapshot();
              }}
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
                  aria-label="Redimensionner l'échiquier"
                  aria-valuemin={minBoardSize}
                  aria-valuemax={maxBoardSize}
                  aria-valuenow={boardSize}
                  aria-valuetext={boardSizeLabel}
                  title="Glisser pour redimensionner (double-clic pour réinitialiser)"
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
            <h3 className={styles.panelTitle}>📊 Statut de la partie</h3>
          </div>
          <div className={styles.panelContent}>
            <div className={styles.statusGrid}>
              <div className={styles.statusItem}>
                <span className={styles.statusLabel}>Trait</span>
                <span className={styles.statusValue}>
                  {status.turn === 'w' ? 'Blancs' : 'Noirs'}
                </span>
                <span className={styles.statusHint}>Coup n° {status.moveNumber}</span>
              </div>
              <div className={styles.statusItem}>
                <span className={styles.statusLabel}>Coups légaux</span>
                <span className={styles.statusValue}>{status.legalMoves}</span>
                <span className={styles.statusHint}>
                  Options disponibles pour {status.turn === 'w' ? 'les Blancs' : 'les Noirs'}
                </span>
              </div>
              <div className={styles.statusItem}>
                <span className={styles.statusLabel}>Demi-coups</span>
                <span className={styles.statusValue}>{status.halfMoves}</span>
                <span className={styles.statusHint}>
                  Depuis la dernière prise ou avancée de pion
                </span>
              </div>
              <div className={styles.statusItem}>
                <span className={styles.statusLabel}>Reste avant 50 coups</span>
                <span className={styles.statusValue}>{halfMovesRemaining}</span>
                <span className={styles.statusHint}>
                  Demi-coups restants avant une nulle réclamable
                </span>
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
            <h3 className={styles.panelTitle}>⚙️ Options de l'échiquier</h3>
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
                  <span className={styles.optionTitle}>Flèches interactives</span>
                  <span className={styles.optionHint}>
                    {boardOptions.showArrows ? 'Activées' : 'Masquées'}
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
                  <span className={styles.optionTitle}>Surbrillances</span>
                  <span className={styles.optionHint}>
                    {boardOptions.showHighlights ? 'Visibles' : 'Masquées'}
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
                  <span className={styles.optionTitle}>Pré-mouvements</span>
                  <span className={styles.optionHint}>
                    {boardOptions.allowPremoves ? 'Autorisés' : 'Bloqués'}
                  </span>
                </span>
              </button>

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
                  <span className={styles.optionTitle}>Coordonnées</span>
                  <span className={styles.optionHint}>
                    {boardOptions.showSquareNames ? 'Affichées' : 'Masquées'}
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
                  <span className={styles.optionTitle}>Effets sonores</span>
                  <span className={styles.optionHint}>
                    {boardOptions.soundEnabled ? 'Actifs' : 'Coupés'}
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
                  <span className={styles.optionTitle}>Coin redimensionnable</span>
                  <span className={styles.optionHint}>
                    {boardOptions.allowResize ? 'Activé' : 'Désactivé'}
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
                  <span className={styles.optionTitle}>Coups légaux</span>
                  <span className={styles.optionHint}>
                    {boardOptions.highlightLegal ? 'Signalés' : 'Masqués'}
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
                  <span className={styles.optionTitle}>Auto-flip</span>
                  <span className={styles.optionHint}>
                    {boardOptions.autoFlip ? 'Synchronisé' : 'Manuel'}
                  </span>
                </span>
              </button>

              <button
                type="button"
                className={styles.optionButton}
                onClick={toggleOrientation}
                disabled={boardOptions.autoFlip}
                title={
                  boardOptions.autoFlip
                    ? 'Désactivez l’auto-flip pour changer manuellement l’orientation'
                    : undefined
                }
              >
                <span className={styles.optionIcon}>
                  <OrientationIcon />
                </span>
                <span className={styles.optionLabel}>
                  <span className={styles.optionTitle}>Orientation</span>
                  <span className={styles.optionHint}>
                    {boardOptions.autoFlip
                      ? 'Contrôlée automatiquement'
                      : `Vue ${boardOptions.orientation === 'white' ? 'Blancs' : 'Noirs'}`}
                  </span>
                </span>
              </button>

              <button type="button" className={styles.optionButton} onClick={addRandomArrow}>
                <span className={styles.optionIcon}>
                  <AddArrowIcon />
                </span>
                <span className={styles.optionLabel}>
                  <span className={styles.optionTitle}>Ajouter une flèche</span>
                  <span className={styles.optionHint}>Placement aléatoire</span>
                </span>
              </button>

              <button type="button" className={styles.optionButton} onClick={addRandomHighlight}>
                <span className={styles.optionIcon}>
                  <AddHighlightIcon />
                </span>
                <span className={styles.optionLabel}>
                  <span className={styles.optionTitle}>Ajouter une zone</span>
                  <span className={styles.optionHint}>Surbrillance aléatoire</span>
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
                  <span className={styles.optionTitle}>Tout effacer</span>
                  <span className={styles.optionHint}>Réinitialise annotations</span>
                </span>
              </button>
            </div>
          </div>
        </div>

        <div className={styles.panel} style={{ position: 'relative' }}>
          <div className={styles.panelHeader}>
            <h3 className={styles.panelTitle}>📋 PGN Notation</h3>
          </div>
          <div className={styles.panelContent}>
            <textarea
              className={styles.textarea}
              value={pgnText}
              readOnly
              aria-label="PGN notation"
              placeholder="Les mouvements apparaîtront ici au format PGN..."
            />
            <div className={styles.buttonGroup}>
              <LoadingButton
                className={`${styles.button} ${styles.buttonSuccess} ${styles.buttonCopy}`}
                onClick={handleCopyPGN}
                isLoading={isCopying}
              >
                {isCopying ? 'Copie...' : 'Copier'}
              </LoadingButton>
              <LoadingButton
                className={`${styles.button} ${styles.buttonWarning} ${styles.buttonReset}`}
                onClick={handleReset}
                isLoading={isResetting}
              >
                {isResetting ? 'Remise à zéro...' : 'Reset'}
              </LoadingButton>
              <LoadingButton
                className={`${styles.button} ${styles.buttonPrimary} ${styles.buttonExport}`}
                onClick={handleExport}
                isLoading={isExporting}
              >
                {isExporting ? 'Export...' : 'Exporter'}
              </LoadingButton>
            </div>
          </div>
        </div>

        <div className={styles.panel}>
          <div className={styles.panelHeader}>
            <h3 className={styles.panelTitle}>🎯 Position FEN</h3>
          </div>
          <div className={styles.panelContent}>
            <textarea
              className={`${styles.textarea} ${styles.textareaSmall}`}
              value={fen || ''}
              onChange={(e) => {
                setFen(e.target.value);
                setIsManualFenChange(true);
              }}
              aria-label="FEN position"
              placeholder="Saisissez une position FEN pour définir l'échiquier..."
            />
          </div>
        </div>

        <div className={styles.panel}>
          <div className={styles.panelHeader}>
            <h3 className={styles.panelTitle}>⚡ Test des Premoves</h3>
          </div>
          <div className={styles.panelContent}>
            <div className={styles.infoBox}>
              <p>
                <strong>Comment tester les premoves:</strong>
              </p>
              <ul>
                <li>Utilisez les positions d'exemple ci-dessous</li>
                <li>Essayez de déplacer une pièce qui n'est pas de votre tour</li>
                <li>Le coup sera stocké comme "premove" (flèche orange pointillée)</li>
                <li>
                  Jouez un coup normal - le premove s'exécutera automatiquement s'il est légal
                </li>
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
                Position d'ouverture
              </button>
              <button
                className={`${styles.button} ${styles.buttonPrimary}`}
                onClick={() => {
                  setFen('r1bqkb1r/pppp1ppp/2n2n2/4p3/2B1P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 4 4');
                  setIsManualFenChange(true);
                }}
              >
                Milieu de partie
              </button>
              <button
                className={`${styles.button} ${styles.buttonPrimary}`}
                onClick={() => {
                  setFen('4k3/8/8/8/8/8/4P3/4K3 w - - 0 1');
                  setIsManualFenChange(true);
                }}
              >
                Finale simple
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
