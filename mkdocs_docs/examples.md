# Usage Examples

This document provides comprehensive examples for using Neo Chess Board in various scenarios.

## 🔗 Live Example Pages

Experience the library directly in your browser with these hosted demos:

- 🌐 [Vanilla JS Starter](https://magicolala.github.io/Neo-Chess-Board-Ts-Library/examples/vanilla-js-example.html) – Standalone HTML setup featuring theme switching, move history, and PGN export helpers.
- ♞ [Chess.js Integration](https://magicolala.github.io/Neo-Chess-Board-Ts-Library/examples/chess-js-demo.html) – Demonstrates the ChessJsRules adapter synchronized with the chess.js engine.
- 📈 [PGN + Evaluation HUD](https://magicolala.github.io/Neo-Chess-Board-Ts-Library/examples/pgn-import-eval.html) – Import annotated games, auto-sync the orientation, and follow the evaluation bar.
- ⚡ [Advanced Features Showcase](https://magicolala.github.io/Neo-Chess-Board-Ts-Library/examples/advanced-features.html) – Explore puzzles, analysis helpers, and keyboard-driven workflows.

---

## 🚀 Quick Start Examples

### Basic Vanilla JavaScript Setup

```typescript
import { NeoChessBoard } from '@magicolala/neo-chess-board';
// Get canvas element
const canvas = document.getElementById('chess-board') as HTMLCanvasElement;
// Create board with default options
const board = new NeoChessBoard(canvas);
// Listen for moves
board.on('move', (move) => {
  console.log(`Move: ${move.from} → ${move.to}`);
});
// Load a specific position
board.loadPosition('rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1');
```

### Basic React Setup

```typescript
import React, { useRef, useState } from 'react';
import { NeoChessBoard } from '@magicolala/neo-chess-board/react';
import { ChessJsRules, START_FEN } from '@magicolala/neo-chess-board';

const INITIAL_FEN = START_FEN;

function ChessGame() {
  const [fen, setFen] = useState(INITIAL_FEN);
  const [moves, setMoves] = useState<string[]>([]);
  const rules = useRef(new ChessJsRules(INITIAL_FEN));

  const addMove = (event: { from: string; to: string; fen: string }) => {
    rules.current.setFEN(event.fen);
    setFen(event.fen);
    setMoves((previous) => [...previous, `${event.from}→${event.to}`]);
  };

  return (
    <div>
      <NeoChessBoard
        fen={fen}
        theme="neo"
        interactive
        showCoordinates
        onMove={addMove}
        onUpdate={(event) => {
          rules.current.setFEN(event.fen);
          setFen(event.fen);
        }}
        onIllegal={(event) => {
          console.warn('Illegal move blocked:', event.reason);
        }}
      />
      <p>Moves played: {moves.length}</p>
    </div>
  );
}
```

---

## 🎮 Interactive Examples

### Game with Move History

```typescript
import React, { useCallback, useMemo, useState } from 'react';
import { NeoChessBoard } from '@magicolala/neo-chess-board/react';
import { ChessJsRules, START_FEN } from '@magicolala/neo-chess-board';
import type { Move as ChessMove } from 'chess.js';

interface GameMove {
  fen: string;
  lan: string;
  san: string;
}

function ChessGameWithHistory() {
  const [gameHistory, setGameHistory] = useState<GameMove[]>([]);
  const [currentFen, setCurrentFen] = useState(START_FEN);
  const rules = useMemo(() => new ChessJsRules(START_FEN), []);

  const handleMove = useCallback((event: { from: string; to: string; fen: string }) => {
    rules.setFEN(event.fen);
    const verboseHistory = rules.getChessInstance().history({ verbose: true }) as ChessMove[];
    const last = verboseHistory.at(-1);
    setGameHistory((previous) => [
      ...previous,
      {
        fen: event.fen,
        lan: `${event.from}-${event.to}`,
        san: last?.san ?? `${event.from}-${event.to}`,
      },
    ]);
    setCurrentFen(event.fen);
  }, [rules]);

  const goToMove = useCallback(
    (moveIndex: number) => {
      if (moveIndex < 0) {
        setCurrentFen(START_FEN);
        rules.setFEN(START_FEN);
        return;
      }
      const snapshot = gameHistory[moveIndex];
      if (snapshot) {
        setCurrentFen(snapshot.fen);
        rules.setFEN(snapshot.fen);
      }
    },
    [gameHistory, rules],
  );

  return (
    <div style={{ display: 'flex', gap: '20px' }}>
      <div>
        <NeoChessBoard
          fen={currentFen}
          onMove={handleMove}
          onUpdate={(event) => {
            setCurrentFen(event.fen);
            rules.setFEN(event.fen);
          }}
          theme="wood"
          showCoordinates
        />
      </div>
      <div style={{ minWidth: '200px' }}>
        <h3>Move History</h3>
        <button onClick={() => goToMove(-1)}>Start Position</button>
        <div style={{ maxHeight: '300px', overflow: 'auto' }}>
          {gameHistory.map((gameMove, index) => (
            <div
              key={gameMove.lan + index}
              onClick={() => goToMove(index)}
              style={{
                padding: '4px 8px',
                cursor: 'pointer',
                backgroundColor: '#f5f5f5',
                marginBottom: '2px',
              }}
            >
              {Math.floor(index / 2) + 1}
              {index % 2 === 0 ? '.' : '...'} {gameMove.san}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
```

### Puzzle Mode

```typescript
import React, { useEffect, useRef, useState } from 'react';
import { NeoChessBoard } from '@magicolala/neo-chess-board/react';
import { ChessJsRules } from '@magicolala/neo-chess-board';
import type { Move as ChessMove } from 'chess.js';

interface ChessPuzzle {
  fen: string;
  solution: string[]; // SAN moves
  description: string;
}

const puzzles: ChessPuzzle[] = [
  {
    fen: 'r1bqkb1r/pppp1ppp/2n2n2/4p3/2B1P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 4 4',
    solution: ['Ng5', 'd6', 'Nf7#'],
    description: 'White to play and win material',
  },
];

function ChessPuzzle() {
  const [currentPuzzle, setCurrentPuzzle] = useState(0);
  const [solutionIndex, setSolutionIndex] = useState(0);
  const [hint, setHint] = useState('Select the best move.');
  const [boardFen, setBoardFen] = useState(puzzles[0].fen);
  const rules = useRef(new ChessJsRules(puzzles[0].fen));
  const puzzle = puzzles[currentPuzzle];

  useEffect(() => {
    rules.current = new ChessJsRules(puzzle.fen);
    setSolutionIndex(0);
    setHint('Select the best move.');
    setBoardFen(puzzle.fen);
  }, [puzzle]);

  const handleMove = (event: { from: string; to: string; fen: string }) => {
    rules.current.setFEN(event.fen);
    const verboseHistory = rules.current.getChessInstance().history({ verbose: true }) as ChessMove[];
    const lastSan = verboseHistory.at(-1)?.san ?? `${event.from}-${event.to}`;
    const expectedSan = puzzle.solution[solutionIndex];
    if (lastSan === expectedSan) {
      if (solutionIndex + 1 === puzzle.solution.length) {
        setHint('Puzzle solved! 🎉');
      } else {
        setHint(`Correct! Next move ${solutionIndex + 1}/${puzzle.solution.length}`);
      }
      setSolutionIndex((value) => value + 1);
      setBoardFen(event.fen);
    } else {
      setHint(`Try again — expected ${expectedSan}.`);
      setBoardFen(puzzle.fen);
      rules.current.setFEN(puzzle.fen);
    }
  };

  return (
    <div>
      <h2>Chess Puzzle {currentPuzzle + 1}</h2>
      <p>{puzzle.description}</p>
      <NeoChessBoard
        fen={boardFen}
        theme="glass"
        allowPremoves={false}
        onMove={handleMove}
        onUpdate={(event) => {
          rules.current.setFEN(event.fen);
          setBoardFen(event.fen);
        }}
      />
      <div style={{ marginTop: '10px' }}>
        <p>{hint}</p>
        <button
          onClick={() => {
            rules.current.setFEN(puzzle.fen);
            setBoardFen(puzzle.fen);
            setSolutionIndex(0);
            setHint('Select the best move.');
          }}
        >
          Reset
        </button>
        <button
          onClick={() => setCurrentPuzzle((value) => (value + 1) % puzzles.length)}
          style={{ marginLeft: '8px' }}
        >
          Next Puzzle
        </button>
      </div>
    </div>
  );
}
```

### Multi-Board Analysis

```typescript
import React, { useState } from 'react';
import { NeoChessBoard } from '@magicolala/neo-chess-board/react';

const START_FEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';

function MultiboardAnalysis() {
  const [mainFen, setMainFen] = useState(START_FEN);
  const [variations, setVariations] = useState<string[]>([
    'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1',
    'rnbqkbnr/pppp1ppp/8/4p3/4P3/8/PPPP1PPP/RNBQKBNR w KQkq e6 0 2',
  ]);

  return (
    <div>
      <h2>Position Analysis</h2>
      <div style={{ marginBottom: '20px' }}>
        <h3>Main Line</h3>
        <NeoChessBoard
          fen={mainFen}
          theme="light"
          showCoordinates
          onMove={(event) => {
            setMainFen(event.fen);
          }}
        />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
        {variations.map((variation, index) => (
          <div key={variation + index}>
            <h4>Variation {index + 1}</h4>
            <NeoChessBoard
              fen={variation}
              theme="dark"
              interactive={false}
              style={{ width: '300px', maxWidth: '100%' }}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
```

---

## 🎯 Advanced Usage

### Custom Event Handling

```typescript
import { NeoChessBoard, ChessJsRules } from '@magicolala/neo-chess-board';

const canvas = document.getElementById('board') as HTMLCanvasElement;
const board = new NeoChessBoard(canvas, { interactive: true });
const rules = new ChessJsRules();

board.on('move', (move) => {
  rules.setFEN(move.fen);
  updateMoveList(move.from, move.to, move.fen);
  if (rules.isCheckmate()) {
    endGame(rules.turn() === 'w' ? '0-1' : '1-0');
  } else if (rules.isStalemate()) {
    endGame('1/2-1/2');
  } else if (rules.inCheck()) {
    showCheckWarning(rules.turn() === 'w' ? 'black' : 'white');
  }
});

board.on('illegal', (event) => {
  console.warn(`Illegal move ${event.from}→${event.to}: ${event.reason}`);
  showIllegalMoveWarning(event.reason);
});

board.on('update', (event) => {
  rules.setFEN(event.fen);
  updateStatusBanner(event.fen);
});

board.on('promotion', (request) => {
  showPromotionDialog(request);
});

function updateMoveList(from: string, to: string, fen: string) {
  const movesList = document.getElementById('moves-list');
  const moveElement = document.createElement('div');
  moveElement.textContent = `${from}→${to} (${fen})`;
  movesList?.appendChild(moveElement);
}

function showIllegalMoveWarning(reason: string) {
  const banner = document.getElementById('game-status');
  if (banner) {
    banner.textContent = `Illegal move: ${reason}`;
    banner.className = 'illegal-warning';
  }
}

function showCheckWarning(color: string) {
  const banner = document.getElementById('game-status');
  if (banner) {
    banner.textContent = `${color} is in check!`;
    banner.className = 'check-warning';
  }
}

function updateStatusBanner(fen: string) {
  const banner = document.getElementById('fen-status');
  if (banner) {
    banner.textContent = fen;
  }
}

function endGame(result: string) {
  const banner = document.getElementById('game-status');
  if (banner) {
    banner.textContent = `Game over: ${result}`;
    banner.className = 'game-over';
  }
}
```

---

### PGN Import/Export

```typescript
import { NeoChessBoard } from '@magicolala/neo-chess-board';

class PGNManager {
  private board: NeoChessBoard;
  constructor(canvas: HTMLCanvasElement) {
    this.board = new NeoChessBoard(canvas);
  }

  loadPGN(pgnString: string) {
    try {
      // Parse PGN and apply moves
      const moves = this.parsePGN(pgnString);
      this.board.reset();
      moves.forEach((move) => {
        this.board.makeMove(move.from, move.to);
      });
      console.log('PGN loaded successfully');
    } catch (error) {
      console.error('Error loading PGN:', error);
    }
  }

  exportCurrentGame(): string {
    const pgn = this.board.exportPGN();
    // Add additional metadata
    const headers = {
      Event: 'Casual Game',
      Site: 'Neo Chess Board Demo',
      Date: new Date().toISOString().split('T')[0],
      Round: '1',
      White: 'Player 1',
      Black: 'Player 2',
      Result: '*',
    };
    return this.formatPGN(headers, pgn);
  }

  private parsePGN(pgn: string) {
    // Implement PGN parsing logic
    // This is a simplified version
    const moves = [];
    const movePattern = /\b([NBRQK]?[a-h]?[1-8]?x?[a-h][1-8](?:=[NBRQ])?[+#]?)\b/g;
    let match;
    while ((match = movePattern.exec(pgn)) !== null) {
      moves.push(this.sanToMove(match[1]));
    }
    return moves;
  }

  private formatPGN(headers: object, moves: string): string {
    let pgn = '';
    // Add headers
    for (const [key, value] of Object.entries(headers)) {
      pgn += `[${key} "${value}"]\n`;
    }
    pgn += '\n' + moves + '\n';
    return pgn;
  }
}

// Usage
const pgnManager = new PGNManager(canvas);
// Load PGN from file
document.getElementById('load-pgn').addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = () => pgnManager.loadPGN(reader.result as string);
    reader.readAsText(file);
  }
});
// Export current game
document.getElementById('export-pgn').addEventListener('click', () => {
  const pgn = pgnManager.exportCurrentGame();
  downloadPGN(pgn, 'game.pgn');
});

function downloadPGN(content: string, filename: string) {
  const blob = new Blob([content], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
```

---

### Theme Switcher Component

```typescript
import React, { useState } from 'react';
import { NeoChessBoard } from '@magicolala/neo-chess-board/react';

const availableThemes = ['light', 'dark', 'wood', 'glass', 'neon', 'retro'];

function ThemeSwitcher() {
  const [currentTheme, setCurrentTheme] = useState('light');
  return (
    <div>
      <div style={{ marginBottom: '20px' }}>
        <label>Choose Theme: </label>
        <select
          value={currentTheme}
          onChange={(e) => setCurrentTheme(e.target.value)}
        >
          {availableThemes.map(theme => (
            <option key={theme} value={theme}>
              {theme.charAt(0).toUpperCase() + theme.slice(1)}
            </option>
          ))}
        </select>
      </div>
      <NeoChessBoard
        theme={currentTheme}
        showCoordinates={true}
        onMove={(move) => console.log('Move:', move)}
      />
    </div>
  );
}
```

---

## 🏆 Complete Game Implementation

### Full Featured Chess Game

```typescript
import React, { useMemo, useState } from 'react';
import { NeoChessBoard } from '@magicolala/neo-chess-board/react';
import { ChessJsRules, START_FEN } from '@magicolala/neo-chess-board';
import type { Move as ChessMove } from 'chess.js';

type GameStatus = 'playing' | 'check' | 'checkmate' | 'stalemate';

interface GameState {
  fen: string;
  moves: string[];
  status: GameStatus;
  currentPlayer: 'white' | 'black';
  winner?: 'white' | 'black' | 'draw';
  result?: '1-0' | '0-1' | '1/2-1/2';
}

const THEMES = ['light', 'dark', 'wood', 'glass', 'neon', 'retro'] as const;

function FullChessGame() {
  const [gameState, setGameState] = useState<GameState>({
    fen: START_FEN,
    moves: [],
    status: 'playing',
    currentPlayer: 'white',
  });
  const [selectedTheme, setSelectedTheme] = useState<(typeof THEMES)[number]>('light');
  const [orientation, setOrientation] = useState<'white' | 'black'>('white');
  const [showCoordinates, setShowCoordinates] = useState(true);
  const [lastError, setLastError] = useState<string | null>(null);
  const rules = useMemo(() => new ChessJsRules(START_FEN), []);

  const evaluateBoard = (fen: string) => {
    rules.setFEN(fen);
    if (rules.isCheckmate()) {
      const winner = rules.turn() === 'w' ? 'black' : 'white';
      return { status: 'checkmate' as const, winner, result: winner === 'white' ? '1-0' : '0-1' };
    }
    if (rules.isStalemate()) {
      return { status: 'stalemate' as const, winner: 'draw' as const, result: '1/2-1/2' as const };
    }
    if (rules.inCheck()) {
      return { status: 'check' as const, winner: undefined, result: undefined };
    }
    return { status: 'playing' as const, winner: undefined, result: undefined };
  };

  const applyFen = (fen: string, san?: string) => {
    const { status, winner, result } = evaluateBoard(fen);
    const nextPlayer = rules.turn() === 'w' ? 'white' : 'black';
    setGameState((previous) => ({
      fen,
      moves: san ? [...previous.moves, san] : previous.moves,
      status,
      winner,
      result,
      currentPlayer: nextPlayer,
    }));
  };

  const handleMove = (event: { from: string; to: string; fen: string }) => {
    rules.setFEN(event.fen);
    const history = rules.getChessInstance().history({ verbose: true }) as ChessMove[];
    const san = history.at(-1)?.san ?? `${event.from}-${event.to}`;
    setLastError(null);
    applyFen(event.fen, san);
  };

  const handleUpdate = (event: { fen: string }) => {
    applyFen(event.fen);
  };

  const resetGame = () => {
    rules.setFEN(START_FEN);
    setLastError(null);
    setGameState({
      fen: START_FEN,
      moves: [],
      status: 'playing',
      currentPlayer: 'white',
    });
    setOrientation('white');
  };

  const exportPGN = () => {
    console.log(rules.getChessInstance().pgn());
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px' }}>
      <h1>Neo Chess Board - Full Game</h1>
      <div style={{ display: 'flex', gap: '20px', marginBottom: '20px', flexWrap: 'wrap' }}>
        <div>
          <label>Theme: </label>
          <select
            value={selectedTheme}
            onChange={(event) => setSelectedTheme(event.target.value as (typeof THEMES)[number])}
          >
            {THEMES.map((theme) => (
              <option key={theme} value={theme}>
                {theme.charAt(0).toUpperCase() + theme.slice(1)}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label>Orientation: </label>
          <select value={orientation} onChange={(event) => setOrientation(event.target.value as 'white' | 'black')}>
            <option value="white">White</option>
            <option value="black">Black</option>
          </select>
        </div>
        <label>
          <input
            type="checkbox"
            checked={showCoordinates}
            onChange={(event) => setShowCoordinates(event.target.checked)}
          />
          Show Coordinates
        </label>
        <button onClick={() => setOrientation((value) => (value === 'white' ? 'black' : 'white'))}>
          Flip Board
        </button>
      </div>
      <div style={{ display: 'flex', gap: '30px', alignItems: 'flex-start' }}>
        <div>
          <NeoChessBoard
            fen={gameState.fen}
            theme={selectedTheme}
            orientation={orientation}
            showCoordinates={showCoordinates}
            allowPremoves
            onMove={handleMove}
            onUpdate={handleUpdate}
            onIllegal={(event) => setLastError(event.reason)}
            style={{ maxWidth: '500px' }}
          />
        </div>
        <div style={{ minWidth: '300px', padding: '20px', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
          <h3>Game Information</h3>
          <div style={{ marginBottom: '12px' }}>
            <strong>Status:</strong>
            <span
              style={{
                marginLeft: '10px',
                padding: '4px 8px',
                borderRadius: '4px',
                backgroundColor:
                  gameState.status === 'check'
                    ? '#ffe6e6'
                    : gameState.status === 'checkmate'
                      ? '#ffcccc'
                      : gameState.status === 'stalemate'
                        ? '#e6f3ff'
                        : '#e6ffe6',
              }}
            >
              {gameState.status.charAt(0).toUpperCase() + gameState.status.slice(1)}
            </span>
          </div>
          <div style={{ marginBottom: '12px' }}>
            <strong>Current Player:</strong>
            <span style={{ marginLeft: '10px', textTransform: 'capitalize' }}>{gameState.currentPlayer}</span>
          </div>
          <div style={{ marginBottom: '12px' }}>
            <strong>Moves:</strong> {gameState.moves.length}
          </div>
          {gameState.winner && (
            <div style={{ marginBottom: '12px' }}>
              <strong>Result:</strong>
              <span style={{ marginLeft: '10px' }}>
                {gameState.winner === 'draw' ? 'Draw' : `${gameState.winner} wins`} ({gameState.result})
              </span>
            </div>
          )}
          {lastError && (
            <div style={{ marginBottom: '12px', color: '#b91c1c' }}>Illegal move: {lastError}</div>
          )}
          <div style={{ display: 'flex', gap: '10px', flexDirection: 'column' }}>
            <button onClick={resetGame} style={{ padding: '8px 16px' }}>
              New Game
            </button>
            <button onClick={exportPGN} style={{ padding: '8px 16px' }}>
              Export PGN
            </button>
          </div>
        </div>
      </div>
      <div style={{ marginTop: '24px' }}>
        <h3>Move List</h3>
        <ol>
          {gameState.moves.map((san, index) => (
            <li key={`${san}-${index}`}>{san}</li>
          ))}
        </ol>
      </div>
    </div>
  );
}
```

---

### Position Setup Tool

```typescript
import React, { useState } from 'react';
import { NeoChessBoard } from '@magicolala/neo-chess-board/react';

interface Piece {
  type: string;
  color: 'white' | 'black';
}

interface Square {
  file: string;
  rank: number;
}

function PositionEditor() {
  const [editMode, setEditMode] = useState(false);
  const [selectedPiece, setSelectedPiece] = useState<Piece | null>(null);
  const [currentFEN, setCurrentFEN] = useState('start');

  const pieces = [
    { type: 'king', color: 'white' },
    { type: 'queen', color: 'white' },
    { type: 'rook', color: 'white' },
    { type: 'bishop', color: 'white' },
    { type: 'knight', color: 'white' },
    { type: 'pawn', color: 'white' },
    { type: 'king', color: 'black' },
    { type: 'queen', color: 'black' },
    { type: 'rook', color: 'black' },
    { type: 'bishop', color: 'black' },
    { type: 'knight', color: 'black' },
    { type: 'pawn', color: 'black' },
  ];

  const handleSquareClick = (square: Square) => {
    if (editMode && selectedPiece) {
      // Place selected piece on clicked square
      // Implementation depends on board API
      console.log(`Placing ${selectedPiece.color} ${selectedPiece.type} on ${square.file}${square.rank}`);
    }
  };

  return (
    <div>
      <h2>Position Editor</h2>
      <div style={{ marginBottom: '20px' }}>
        <button
          onClick={() => setEditMode(!editMode)}
          style={{
            padding: '8px 16px',
            backgroundColor: editMode ? '#ff6b6b' : '#4ecdc4',
            color: 'white',
            border: 'none',
            borderRadius: '4px'
          }}
        >
          {editMode ? 'Exit Edit Mode' : 'Enter Edit Mode'}
        </button>
      </div>
      {editMode && (
        <div style={{ marginBottom: '20px' }}>
          <h3>Select Piece to Place:</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '10px', maxWidth: '400px' }}>
            {pieces.map((piece, index) => (
              <button
                key={index}
                onClick={() => setSelectedPiece(piece)}
                style={{
                  padding: '10px',
                  backgroundColor: selectedPiece === piece ? '#007bff' : '#f8f9fa',
                  color: selectedPiece === piece ? 'white' : 'black',
                  border: '1px solid #dee2e6',
                  borderRadius: '4px',
                  textTransform: 'capitalize'
                }}
              >
                {piece.color} {piece.type}
              </button>
            ))}
          </div>
        </div>
      )}
      <div style={{ display: 'flex', gap: '20px' }}>
        <div>
          <NeoChessBoard
            position={currentFEN}
            draggable={!editMode}
            onSquareClick={editMode ? handleSquareClick : undefined}
          />
        </div>
        <div style={{ minWidth: '300px' }}>
          <h3>FEN String</h3>
          <textarea
            value={currentFEN}
            onChange={(e) => setCurrentFEN(e.target.value)}
            style={{
              width: '100%',
              height: '100px',
              fontFamily: 'monospace',
              fontSize: '12px'
            }}
          />
          <div style={{ marginTop: '10px' }}>
            <button onClick={() => setCurrentFEN('start')}>
              Reset to Start
            </button>
            <button
              onClick={() => {
                navigator.clipboard.writeText(currentFEN);
                alert('FEN copied to clipboard!');
              }}
              style={{ marginLeft: '10px' }}
            >
              Copy FEN
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
```

---

Pour plus d’exemples, consultez l’application de démonstration complète dans le répertoire `demo/` et explorez les fichiers de test dans `tests/` pour d’autres modèles d’utilisation !
