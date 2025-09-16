import React, { useMemo, useState, useRef, useEffect, useCallback } from 'react';
import { NeoChessBoard, NeoChessRef } from '../src/react';
import { ChessJsRules } from '../src/core/ChessJsRules';
import styles from './App.module.css';
import {
  LoadingButton,
  DotLoader,
  LoadingOverlay,
  SkeletonText,
  SkeletonButtons,
  useLoadingState,
} from './components/Loaders';

// Type pour les options de l'échiquier
interface BoardOptions {
  showArrows: boolean;
  showHighlights: boolean;
  allowPremoves: boolean;
  showSquareNames: boolean;
  soundEnabled: boolean;
  orientation: 'white' | 'black';
  highlightLegal: boolean;
}

export const App: React.FC = () => {
  const [fen, setFen] = useState<string | undefined>(undefined);
  const [theme, setTheme] = useState<'midnight' | 'classic'>('midnight');
  const chessRules = useMemo(() => new ChessJsRules(), []);
  const [pgnText, setPgnText] = useState('');
  const [boardOptions, setBoardOptions] = useState<BoardOptions>({
    showArrows: true,
    showHighlights: true,
    allowPremoves: true,
    showSquareNames: true,
    soundEnabled: true,
    orientation: 'white',
    highlightLegal: true,
  });
  const boardRef = useRef<NeoChessRef>(null);

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
        setFen(chessRules.getFEN()); // Update FEN state with corrected FEN
        setPgnText(chessRules.toPgn(false));
        setIsManualFenChange(false);
      } catch (error) {
        console.error('FEN invalide:', error);
        setIsManualFenChange(false);
      }
    }
  }, [fen, chessRules, isManualFenChange]);

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
    setFen(chessRules.getFEN());
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

  const toggleOption = useCallback((option: keyof BoardOptions) => {
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
          </div>
        </header>

        <div className={styles.boardWrapper} style={{ position: 'relative' }}>
          <NeoChessBoard
            ref={boardRef}
            theme={theme}
            fen={fen}
            onMove={({ from, to, fen }) => {
              // Jouer le mouvement dans notre instance ChessJsRules pour générer la notation PGN
              chessRules.move({ from, to });
              // Obtenir la notation PGN standard depuis chess.js
              setPgnText(chessRules.toPgn(false));
              setFen(fen);
            }}
            style={{ width: 'min(90vmin,720px)', aspectRatio: '1/1' }}
            showSquareNames={boardOptions.showSquareNames}
            showArrows={boardOptions.showArrows}
            showHighlights={boardOptions.showHighlights}
            allowPremoves={boardOptions.allowPremoves}
            soundEnabled={boardOptions.soundEnabled}
            orientation={boardOptions.orientation}
            highlightLegal={boardOptions.highlightLegal}
          />
        </div>
      </div>

      <div className={styles.controlsSection}>
        <div className={styles.panel}>
          <div className={styles.panelHeader}>
            <h3 className={styles.panelTitle}>⚙️ Options de l'échiquier</h3>
          </div>
          <div className={styles.panelContent}>
            <div className={styles.optionGrid}>
              <button
                className={`${styles.optionButton} ${boardOptions.showArrows ? styles.optionActive : ''}`}
                onClick={() => toggleOption('showArrows')}
              >
                {boardOptions.showArrows ? '✅' : '❌'} Flèches
              </button>

              <button
                className={`${styles.optionButton} ${boardOptions.showHighlights ? styles.optionActive : ''}`}
                onClick={() => toggleOption('showHighlights')}
              >
                {boardOptions.showHighlights ? '✅' : '❌'} Surbrillances
              </button>

              <button
                className={`${styles.optionButton} ${boardOptions.allowPremoves ? styles.optionActive : ''}`}
                onClick={() => toggleOption('allowPremoves')}
              >
                {boardOptions.allowPremoves ? '✅' : '❌'} Pré-mouvements
              </button>

              <button
                className={`${styles.optionButton} ${boardOptions.showSquareNames ? styles.optionActive : ''}`}
                onClick={() => toggleOption('showSquareNames')}
              >
                {boardOptions.showSquareNames ? '✅' : '❌'} Noms des cases
              </button>

              <button
                className={`${styles.optionButton} ${boardOptions.soundEnabled ? styles.optionActive : ''}`}
                onClick={() => toggleOption('soundEnabled')}
              >
                {boardOptions.soundEnabled ? '🔊' : '🔇'} Sons
              </button>

              <button
                className={`${styles.optionButton} ${boardOptions.highlightLegal ? styles.optionActive : ''}`}
                onClick={() => toggleOption('highlightLegal')}
              >
                {boardOptions.highlightLegal ? '✅' : '❌'} Surbrillance légale
              </button>

              <button className={styles.optionButton} onClick={toggleOrientation}>
                🔄 Orientation: {boardOptions.orientation === 'white' ? 'Blanc' : 'Noir'}
              </button>

              <button className={styles.optionButton} onClick={addRandomArrow}>
                🎯 Ajouter une flèche aléatoire
              </button>

              <button className={styles.optionButton} onClick={addRandomHighlight}>
                ✨ Ajouter une surbrillance
              </button>

              <button
                className={styles.optionButton}
                onClick={clearAll}
                style={{ backgroundColor: '#ffebee', color: '#c62828' }}
              >
                🗑️ Tout effacer
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
