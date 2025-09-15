import React, { useMemo, useState, useRef, useEffect } from 'react';
import { NeoChessBoard } from '../src/react/NeoChessBoard';
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

export const App: React.FC = () => {
  const [fen, setFen] = useState<string | undefined>(undefined);
  const [theme, setTheme] = useState<'midnight' | 'classic'>('midnight');
  const chessRules = useMemo(() => new ChessJsRules(), []);
  const [pgnText, setPgnText] = useState('');

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
            showSquareNames={true}
          />
        </div>
      </div>

      <div className={styles.controlsSection}>
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
