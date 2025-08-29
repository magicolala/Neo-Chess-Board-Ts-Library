import React, { useMemo, useState } from "react";
import { NeoChessBoard } from "../src/react/NeoChessBoard";
import { PGNRecorder } from "../src/core/PGN";
import { NeoChessBoard as Chessboard } from '../src/core/NeoChessBoard';

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
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "minmax(280px,1fr) 420px",
        gap: 18,
        padding: 18,
        minHeight: "100dvh",
      }}>
      <div>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
          <div>
            NeoChessBoard · <span style={{ opacity: 0.7 }}>{theme}</span>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={() => setTheme("midnight")}>Midnight</button>
            <button onClick={() => setTheme("classic")}>Classic</button>
          </div>
        </div>
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
      <div>
        <h3>PGN</h3>
        <textarea 
          value={pgnText} 
          readOnly 
          style={{ width: "100%", height: 220 }} 
          aria-label="PGN notation"
        />
        <div style={{ marginTop: 8, display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button
            onClick={() => {
              navigator.clipboard.writeText(pgnText);
            }}>
            Copier PGN
          </button>
          <button
            onClick={() => {
              pgn.reset();
              setPgnText(pgn.getPGN());
            }}>
            Reset
          </button>
          <button onClick={exportPGN}>Exporter .pgn</button>
        </div>
        <h3 style={{ marginTop: 18 }}>FEN</h3>
        <textarea 
          value={fen || ""} 
          onChange={(e) => setFen(e.target.value)} 
          style={{ width: "100%", height: 80 }} 
          aria-label="FEN position"
        />
      </div>
    </div>
  );
};
