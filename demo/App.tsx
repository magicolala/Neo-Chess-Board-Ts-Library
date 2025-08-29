import React, { useMemo, useState } from "react";
import { NeoChessBoard } from "../src/react/NeoChessBoard";
import { PGNRecorder } from "../src/core/PGN";
import { NeoChessBoard as Chessboard } from '../src/core/NeoChessBoard';
import styles from './App.module.css';

export const App: React.FC = () => {
  const [fen, setFen] = useState<string | undefined>(undefined);
  const [theme, setTheme] = useState<"midnight" | "classic">("midnight");
  const pgn = useMemo(() => new PGNRecorder((window as any).Chess ? (Chessboard as any) : undefined), []);
  const [pgnText, setPgnText] = useState("");

  const exportPGN = () => {
    // Ensure headers are set once if needed
    pgn.setHeaders({
      Event: "Playground",
      Site: "Local",
      Date: new Date().toISOString().slice(0, 10).replace(/-/g, "."),
    });
    pgn.download();
  };

  return (
    <div className={styles.container}>
      <div className={styles.boardSection}>
        <header className={styles.header}>
          <div>
            <h1 className={styles.title}>
              NeoChessBoard
            </h1>
            <span className={styles.themeInfo}>{theme}</span>
          </div>
          <div className={styles.themeButtons}>
            <button 
              className={`${styles.themeButton} ${theme === 'midnight' ? styles.active : ''}`}
              onClick={() => setTheme("midnight")}
            >
              Midnight
            </button>
            <button 
              className={`${styles.themeButton} ${theme === 'classic' ? styles.active : ''}`}
              onClick={() => setTheme("classic")}
            >
              Classic
            </button>
          </div>
        </header>
        
        <div className={styles.boardWrapper}>
          <NeoChessBoard
            theme={theme}
            fen={fen}
            onMove={({ from, to, fen }) => {
              pgn.push({ from, to });
              setPgnText(pgn.getPGN());
              setFen(fen);
            }}
            style={{ width: "min(90vmin,720px)", aspectRatio: "1/1" }}
          />
        </div>
      </div>
      
      <div className={styles.controlsSection}>
        <div className={styles.panel}>
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
              <button
                className={`${styles.button} ${styles.buttonSuccess} ${styles.buttonCopy}`}
                onClick={() => {
                  navigator.clipboard.writeText(pgnText);
                }}
              >
                Copier
              </button>
              <button
                className={`${styles.button} ${styles.buttonWarning} ${styles.buttonReset}`}
                onClick={() => {
                  pgn.reset();
                  setPgnText(pgn.getPGN());
                }}
              >
                Reset
              </button>
              <button 
                className={`${styles.button} ${styles.buttonPrimary} ${styles.buttonExport}`}
                onClick={exportPGN}
              >
                Exporter
              </button>
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
              value={fen || ""} 
              onChange={(e) => setFen(e.target.value)} 
              aria-label="FEN position"
              placeholder="Saisissez une position FEN pour définir l'échiquier..."
            />
          </div>
        </div>
      </div>
    </div>
  );
};
