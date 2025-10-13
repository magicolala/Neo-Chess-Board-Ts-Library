# Usage Examples

This document provides comprehensive examples for using Neo Chess Board in various scenarios.

## 🔗 Live Example Pages

Experience the library directly in your browser with these hosted demos:

- 🌐 [Vanilla JS Starter](https://magicolala.github.io/Neo-Chess-Board-Ts-Library/examples/vanilla-js-example.html) – Standalone HTML setup featuring theme switching, move history, and PGN export helpers.
- ♞ [Chess.js Integration](https://magicolala.github.io/Neo-Chess-Board-Ts-Library/examples/chess-js-demo.html) – Demonstrates the ChessJsRules adapter synchronized with the chess.js engine.
- 📈 [PGN + Evaluation HUD](https://magicolala.github.io/Neo-Chess-Board-Ts-Library/examples/pgn-import-eval.html) – Import annotated games, auto-sync the orientation, and follow the evaluation bar.
- ⚡ [Advanced Features Showcase](https://magicolala.github.io/Neo-Chess-Board-Ts-Library/examples/advanced-features.html) – Explore puzzles, analysis helpers, and keyboard-driven workflows.

## 🚀 Quick Start Examples

### Basic Vanilla JavaScript Setup

```typescript path=null start=null
import { NeoChessBoard } from 'neochessboard';

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

```typescript path=null start=null
import React, { useState } from 'react';
import { NeoChessBoard } from 'neochessboard/react';

function ChessGame() {
  const [position, setPosition] = useState('start');
  const [moves, setMoves] = useState([]);

  const handleMove = (move) => {
    setMoves(prev => [...prev, move]);
    console.log(`Move ${moves.length + 1}: ${move.san}`);
  };

  return (
    <div>
      <NeoChessBoard
        position={position}
        onMove={handleMove}
        theme="dark"
        draggable={true}
      />
      <div>
        <p>Moves: {moves.length}</p>
      </div>
    </div>
  );
}
```

## 🎮 Interactive Examples

### Game with Move History

```typescript path=null start=null
import React, { useState, useCallback } from 'react';
import { NeoChessBoard } from 'neochessboard/react';

interface GameMove {
  move: Move;
  fen: string;
  san: string;
}

function ChessGameWithHistory() {
  const [gameHistory, setGameHistory] = useState<GameMove[]>([]);
  const [currentPosition, setCurrentPosition] = useState('start');

  const handleMove = useCallback((move: Move) => {
    const newGameMove: GameMove = {
      move,
      fen: move.fen || currentPosition,
      san: move.san || `${move.from}-${move.to}`
    };

    setGameHistory(prev => [...prev, newGameMove]);
    setCurrentPosition(newGameMove.fen);
  }, [currentPosition]);

  const goToMove = (moveIndex: number) => {
    if (moveIndex < 0) {
      setCurrentPosition('start');
    } else {
      setCurrentPosition(gameHistory[moveIndex].fen);
    }
  };

  return (
    <div style={{ display: 'flex', gap: '20px' }}>
      <div>
        <NeoChessBoard
          position={currentPosition}
          onMove={handleMove}
          theme="wood"
          showCoordinates={true}
        />
      </div>

      <div style={{ minWidth: '200px' }}>
        <h3>Move History</h3>
        <button onClick={() => goToMove(-1)}>Start Position</button>
        <div style={{ maxHeight: '300px', overflow: 'auto' }}>
          {gameHistory.map((gameMove, index) => (
            <div
              key={index}
              onClick={() => goToMove(index)}
              style={{
                padding: '4px 8px',
                cursor: 'pointer',
                backgroundColor: '#f5f5f5',
                marginBottom: '2px'
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

```typescript path=null start=null
import React, { useState, useEffect } from 'react';
import { NeoChessBoard } from 'neochessboard/react';

interface ChessPuzzle {
  fen: string;
  solution: string[];
  description: string;
}

const puzzles: ChessPuzzle[] = [
  {
    fen: 'r1bqkb1r/pppp1ppp/2n2n2/4p3/2B1P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 4 4',
    solution: ['Ng5', 'd6', 'Nf7'],
    description: 'White to play and win material'
  },
  // Add more puzzles...
];

function ChessPuzzle() {
  const [currentPuzzle, setCurrentPuzzle] = useState(0);
  const [solutionIndex, setSolutionIndex] = useState(0);
  const [solved, setSolved] = useState(false);
  const [hint, setHint] = useState('');

  const puzzle = puzzles[currentPuzzle];

  const handleMove = (move: Move) => {
    const expectedMove = puzzle.solution[solutionIndex];

    if (move.san === expectedMove) {
      setSolutionIndex(prev => prev + 1);

      if (solutionIndex + 1 >= puzzle.solution.length) {
        setSolved(true);
        setHint('Puzzle solved! 🎉');
      } else {
        setHint(`Correct! Next move: ${solutionIndex + 1}/${puzzle.solution.length}`);
      }
    } else {
      setHint('Try again! That\'s not the best move.');
    }
  };

  const resetPuzzle = () => {
    setSolutionIndex(0);
    setSolved(false);
    setHint('');
  };

  const nextPuzzle = () => {
    setCurrentPuzzle(prev => (prev + 1) % puzzles.length);
    resetPuzzle();
  };

  return (
    <div>
      <h2>Chess Puzzle {currentPuzzle + 1}</h2>
      <p>{puzzle.description}</p>

      <NeoChessBoard
        position={puzzle.fen}
        onMove={handleMove}
        theme="glass"
        orientation="white"
      />

      <div style={{ marginTop: '10px' }}>
        <p>{hint}</p>
        <button onClick={resetPuzzle}>Reset</button>
        <button onClick={nextPuzzle} disabled={!solved}>
          Next Puzzle
        </button>
      </div>
    </div>
  );
}
```

### Multi-Board Analysis

```typescript path=null start=null
import React, { useState } from 'react';
import { NeoChessBoard } from 'neochessboard/react';

function MultiboardAnalysis() {
  const [mainPosition, setMainPosition] = useState('start');
  const [variations, setVariations] = useState([
    'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1',
    'rnbqkbnr/pppp1ppp/8/4p3/4P3/8/PPPP1PPP/RNBQKBNR w KQkq e6 0 2'
  ]);

  return (
    <div>
      <h2>Position Analysis</h2>

      {/* Main board */}
      <div style={{ marginBottom: '20px' }}>
        <h3>Main Line</h3>
        <NeoChessBoard
          position={mainPosition}
          theme="light"
          showCoordinates={true}
          onMove={(move) => {
            // Update main position and create new variation
            setMainPosition(move.fen);
          }}
        />
      </div>

      {/* Variation boards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
        {variations.map((variation, index) => (
          <div key={index}>
            <h4>Variation {index + 1}</h4>
            <NeoChessBoard
              position={variation}
              theme="dark"
              draggable={false}
              style={{ width: '300px', height: '300px' }}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
```

## 🎯 Advanced Usage

### Custom Event Handling

```typescript path=null start=null
import { NeoChessBoard } from 'neochessboard';

const canvas = document.getElementById('board') as HTMLCanvasElement;
const board = new NeoChessBoard(canvas);

// Listen to all available events
board.on('move', (move) => {
  console.log('Move made:', move);
  updateMoveList(move);
});

board.on('check', (color) => {
  console.log(`${color} king is in check!`);
  showCheckWarning(color);
});

board.on('checkmate', (color) => {
  console.log(`Checkmate! ${color} loses.`);
  endGame(color === 'white' ? 'Black wins' : 'White wins');
});

board.on('stalemate', () => {
  console.log('Stalemate - Draw!');
  endGame('Draw by stalemate');
});

board.on('promotion', (request) => {
  console.log(`Pawn promotion at ${request.to} for ${request.color}`);
  showPromotionDialog(request);
});

// Or plug in the built-in overlay
const boardWithDialog = new NeoChessBoard(canvas, {
  extensions: [createPromotionDialogExtension()],
});

board.on('pieceSelect', (square, piece) => {
  console.log(`Selected ${piece.color} ${piece.type} at ${square}`);
});

board.on('illegalMove', (from, to) => {
  console.log(`Illegal move attempted: ${from} to ${to}`);
  showIllegalMoveWarning();
});

function updateMoveList(move) {
  const movesList = document.getElementById('moves-list');
  const moveElement = document.createElement('div');
  moveElement.textContent = `${move.san} (${move.from}-${move.to})`;
  movesList.appendChild(moveElement);
}

function showCheckWarning(color) {
  const warning = document.getElementById('game-status');
  warning.textContent = `${color} king is in check!`;
  warning.className = 'check-warning';
}
```

### PGN Import/Export

```typescript path=null start=null
import { NeoChessBoard } from 'neochessboard';

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

### Theme Switcher Component

```typescript path=null start=null
import React, { useState } from 'react';
import { NeoChessBoard } from 'neochessboard/react';

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

## 🏆 Complete Game Implementation

### Full Featured Chess Game

```typescript path=null start=null
import React, { useState, useCallback, useEffect } from 'react';
import { NeoChessBoard } from 'neochessboard/react';

interface GameState {
  position: string;
  moves: Move[];
  status: 'playing' | 'check' | 'checkmate' | 'stalemate' | 'draw';
  winner?: 'white' | 'black' | 'draw';
  currentPlayer: 'white' | 'black';
}

function FullChessGame() {
  const [gameState, setGameState] = useState<GameState>({
    position: 'start',
    moves: [],
    status: 'playing',
    currentPlayer: 'white'
  });

  const [selectedTheme, setSelectedTheme] = useState('light');
  const [orientation, setOrientation] = useState<'white' | 'black'>('white');
  const [showCoordinates, setShowCoordinates] = useState(true);

  const handleMove = useCallback((move: Move) => {
    setGameState(prev => ({
      ...prev,
      moves: [...prev.moves, move],
      position: move.fen,
      currentPlayer: prev.currentPlayer === 'white' ? 'black' : 'white'
    }));
  }, []);

  const handleCheck = useCallback(() => {
    setGameState(prev => ({ ...prev, status: 'check' }));
  }, []);

  const handleCheckmate = useCallback(() => {
    setGameState(prev => ({
      ...prev,
      status: 'checkmate',
      winner: prev.currentPlayer === 'white' ? 'black' : 'white'
    }));
  }, []);

  const handleStalemate = useCallback(() => {
    setGameState(prev => ({
      ...prev,
      status: 'stalemate',
      winner: 'draw'
    }));
  }, []);

  const resetGame = () => {
    setGameState({
      position: 'start',
      moves: [],
      status: 'playing',
      currentPlayer: 'white'
    });
  };

  const exportPGN = () => {
    // Implementation for PGN export
    const headers = {
      Event: 'Neo Chess Board Game',
      Site: 'Demo Application',
      Date: new Date().toISOString().split('T')[0],
      White: 'Player 1',
      Black: 'Player 2',
      Result: gameState.winner === 'draw' ? '1/2-1/2' :
              gameState.winner === 'white' ? '1-0' : '0-1'
    };

    // Generate PGN from moves
    const pgnMoves = gameState.moves.map(move => move.san).join(' ');
    console.log('PGN Export:', headers, pgnMoves);
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px' }}>
      <h1>Neo Chess Board - Full Game</h1>

      {/* Game Controls */}
      <div style={{ display: 'flex', gap: '20px', marginBottom: '20px', flexWrap: 'wrap' }}>
        <div>
          <label>Theme: </label>
          <select value={selectedTheme} onChange={(e) => setSelectedTheme(e.target.value)}>
            <option value="light">Light</option>
            <option value="dark">Dark</option>
            <option value="wood">Wood</option>
            <option value="glass">Glass</option>
            <option value="neon">Neon</option>
            <option value="retro">Retro</option>
          </select>
        </div>

        <div>
          <label>Orientation: </label>
          <select value={orientation} onChange={(e) => setOrientation(e.target.value as 'white' | 'black')}>
            <option value="white">White</option>
            <option value="black">Black</option>
          </select>
        </div>

        <div>
          <label>
            <input
              type="checkbox"
              checked={showCoordinates}
              onChange={(e) => setShowCoordinates(e.target.checked)}
            />
            Show Coordinates
          </label>
        </div>
      </div>

      {/* Main Game Area */}
      <div style={{ display: 'flex', gap: '30px', alignItems: 'flex-start' }}>

        {/* Chess Board */}
        <div>
          <NeoChessBoard
            position={gameState.position}
            theme={selectedTheme}
            orientation={orientation}
            showCoordinates={showCoordinates}
            onMove={handleMove}
            onCheck={handleCheck}
            onCheckmate={handleCheckmate}
            onStalemate={handleStalemate}
            style={{ maxWidth: '500px' }}
          />
        </div>

        {/* Game Info Panel */}
        <div style={{ minWidth: '300px', padding: '20px', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
          <h3>Game Information</h3>

          <div style={{ marginBottom: '15px' }}>
            <strong>Status:</strong>
            <span style={{
              marginLeft: '10px',
              padding: '4px 8px',
              borderRadius: '4px',
              backgroundColor: gameState.status === 'check' ? '#ffe6e6' :
                              gameState.status === 'checkmate' ? '#ffcccc' :
                              gameState.status === 'stalemate' ? '#e6f3ff' : '#e6ffe6'
            }}>
              {gameState.status.charAt(0).toUpperCase() + gameState.status.slice(1)}
            </span>
          </div>

          <div style={{ marginBottom: '15px' }}>
            <strong>Current Player:</strong>
            <span style={{ marginLeft: '10px', textTransform: 'capitalize' }}>
              {gameState.currentPlayer}
            </span>
          </div>

          <div style={{ marginBottom: '15px' }}>
            <strong>Moves:</strong> {gameState.moves.length}
          </div>

          {gameState.winner && (
            <div style={{ marginBottom: '15px' }}>
              <strong>Winner:</strong>
              <span style={{ marginLeft: '10px', fontWeight: 'bold' }}>
                {gameState.winner === 'draw' ? 'Draw' :
                 gameState.winner.charAt(0).toUpperCase() + gameState.winner.slice(1)}
              </span>
            </div>
          )}

          {/* Game Controls */}
          <div style={{ display: 'flex', gap: '10px', flexDirection: 'column' }}>
            <button onClick={resetGame} style={{ padding: '8px 16px' }}>
              New Game
            </button>
            <button onClick={exportPGN} style={{ padding: '8px 16px' }}>
              Export PGN
            </button>
            <button
              onClick={() => setOrientation(orientation === 'white' ? 'black' : 'white')}
              style={{ padding: '8px 16px' }}
            >
              Flip Board
            </button>
          </div>

          {/* Move History */}
          <div style={{ marginTop: '20px' }}>
            <h4>Move History</h4>
            <div style={{
              maxHeight: '200px',
              overflow: 'auto',
              backgroundColor: 'white',
              padding: '10px',
              borderRadius: '4px',
              fontSize: '14px'
            }}>
              {gameState.moves.length === 0 ? (
                <em>No moves yet</em>
              ) : (
                gameState.moves.map((move, index) => (
                  <div key={index} style={{ marginBottom: '2px' }}>
                    {Math.floor(index / 2) + 1}
                    {index % 2 === 0 ? '.' : '...'} {move.san}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
```

### Position Setup Tool

```typescript path=null start=null
import React, { useState } from 'react';
import { NeoChessBoard } from 'neochessboard/react';

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
      console.log(`Placing ${selectedPiece.color} ${selectedPiece.type} on ${square}`);
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

## 🎲 Game Variants

### King of the Hill

```typescript path=null start=null
import { NeoChessBoard } from 'neochessboard';

class KingOfTheHillGame {
  private board: NeoChessBoard;
  private centerSquares = ['d4', 'd5', 'e4', 'e5'];

  constructor(canvas: HTMLCanvasElement) {
    this.board = new NeoChessBoard(canvas, {
      theme: 'neon',
      highlightLegalMoves: true,
    });

    this.board.on('move', this.checkWinCondition.bind(this));
  }

  private checkWinCondition(move: Move) {
    // Check if a king reached the center
    if (move.piece.type === 'king' && this.centerSquares.includes(move.to)) {
      const winner = move.piece.color;
      alert(`${winner} wins by reaching the center!`);
      this.board.emit('gameEnd', { winner, reason: 'king-of-the-hill' });
    }
  }

  highlightCenter() {
    // Highlight the center squares
    this.centerSquares.forEach((square) => {
      this.board.highlightSquare(square, 'rgba(255, 215, 0, 0.6)');
    });
  }
}
```

### Chess960 (Fischer Random)

```typescript path=null start=null
function generateChess960Position(): string {
  // Generate random starting position for Chess960
  const backrank = ['r', 'n', 'b', 'q', 'k', 'b', 'n', 'r'];

  // Fisher-Yates shuffle with Chess960 constraints
  // (bishops on opposite colors, king between rooks)

  // Simplified version - in real implementation, ensure valid Chess960 rules
  for (let i = backrank.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [backrank[i], backrank[j]] = [backrank[j], backrank[i]];
  }

  const chess960FEN = backrank.join('').toUpperCase() + '/pppppppp/8/8/8/8/PPPPPPPP/' + backrank.join('') + ' w KQkq - 0 1';

  return chess960FEN;
}

function Chess960Game() {
  const [position, setPosition] = useState(() => generateChess960Position());

  const newRandomGame = () => {
    setPosition(generateChess960Position());
  };

  return (
    <div>
      <h2>Chess960 (Fischer Random)</h2>
      <button onClick={newRandomGame} style={{ marginBottom: '20px' }}>
        New Random Position
      </button>

      <NeoChessBoard
        position={position}
        theme="retro"
        onMove={(move) => console.log('Chess960 move:', move)}
      />
    </div>
  );
}
```

## 🎯 Integration Examples

### With Chess Engine

```typescript path=null start=null
import { NeoChessBoard } from 'neochessboard';
// Assuming integration with a chess engine like Stockfish

class EngineGame {
  private board: NeoChessBoard;
  private engine: ChessEngine;
  private playerColor: 'white' | 'black' = 'white';

  constructor(canvas: HTMLCanvasElement) {
    this.board = new NeoChessBoard(canvas);
    this.engine = new ChessEngine(); // Your engine implementation

    this.board.on('move', this.handlePlayerMove.bind(this));
  }

  private async handlePlayerMove(move: Move) {
    if (move.piece.color !== this.playerColor) return;

    // Get engine response
    const engineMove = await this.engine.getBestMove(move.fen, 1000); // 1 second think time

    setTimeout(() => {
      this.board.makeMove(engineMove.from, engineMove.to);
    }, 500); // Delay for realistic feel
  }

  setPlayerColor(color: 'white' | 'black') {
    this.playerColor = color;
    this.board.setOrientation(color);

    if (color === 'black') {
      // Engine plays first move as white
      this.makeEngineMove();
    }
  }

  private async makeEngineMove() {
    const engineMove = await this.engine.getBestMove(this.board.getFEN(), 1000);
    this.board.makeMove(engineMove.from, engineMove.to);
  }
}
```

### Real-time Multiplayer

```typescript path=null start=null
import { NeoChessBoard } from 'neochessboard';
import { io, Socket } from 'socket.io-client';

class MultiplayerGame {
  private board: NeoChessBoard;
  private socket: Socket;
  private gameId: string;
  private playerColor: 'white' | 'black';

  constructor(canvas: HTMLCanvasElement, gameId: string) {
    this.board = new NeoChessBoard(canvas);
    this.gameId = gameId;
    this.socket = io('ws://your-server.com');

    this.setupSocketEvents();
    this.setupBoardEvents();
  }

  private setupSocketEvents() {
    this.socket.on('gameJoined', ({ color, position }) => {
      this.playerColor = color;
      this.board.setOrientation(color);
      this.board.loadPosition(position);
    });

    this.socket.on('moveReceived', ({ move }) => {
      this.board.makeMove(move.from, move.to);
    });

    this.socket.on('gameEnded', ({ winner, reason }) => {
      alert(`Game ended: ${winner} wins by ${reason}`);
    });
  }

  private setupBoardEvents() {
    this.board.on('move', (move) => {
      // Only send moves for the current player
      if (move.piece.color === this.playerColor) {
        this.socket.emit('makeMove', {
          gameId: this.gameId,
          move: {
            from: move.from,
            to: move.to,
            promotion: move.promotion,
          },
        });
      }
    });
  }

  joinGame(gameId: string) {
    this.socket.emit('joinGame', { gameId });
  }
}

// Usage
const canvas = document.getElementById('board') as HTMLCanvasElement;
const game = new MultiplayerGame(canvas, 'game-123');
game.joinGame('game-123');
```

## 🧩 Utility Functions

### Position Analysis

```typescript path=null start=null
import { LightRules } from 'neochessboard';

function analyzePosition(fen: string) {
  const rules = new LightRules(fen);

  const analysis = {
    material: calculateMaterial(fen),
    kingSafety: assessKingSafety(rules),
    centerControl: evaluateCenterControl(fen),
    development: checkDevelopment(fen)
  };

  return analysis;
}

function calculateMaterial(fen: string): { white: number; black: number } {
  const pieceValues = {
    'p': 1, 'n': 3, 'b': 3, 'r': 5, 'q': 9,
    'P': 1, 'N': 3, 'B': 3, 'R': 5, 'Q': 9
  };

  const position = fen.split(' ')[0];
  let whiteMaterial = 0, blackMaterial = 0;

  for (const char of position) {
    if (pieceValues[char]) {
      if (char === char.toUpperCase()) {
        whiteMaterial += pieceValues[char];
      } else {
        blackMaterial += pieceValues[char];
      }
    }
  }

  return { white: whiteMaterial, black: blackMaterial };
}

// Usage in React component
function PositionAnalysis({ position }: { position: string }) {
  const [analysis, setAnalysis] = useState(null);

  useEffect(() => {
    const result = analyzePosition(position);
    setAnalysis(result);
  }, [position]);

  return (
    <div>
      {analysis && (
        <div>
          <h3>Position Analysis</h3>
          <p>Material: White {analysis.material.white} - Black {analysis.material.black}</p>
          {/* Display other analysis results */}
        </div>
      )}
    </div>
  );
}
```

## 📱 Mobile Optimization

### Touch-Friendly Interface

```typescript path=null start=null
import React, { useState } from 'react';
import { NeoChessBoard } from 'neochessboard/react';

function MobileChessBoard() {
  const [orientation, setOrientation] = useState<'white' | 'black'>('white');

  return (
    <div style={{
      padding: '10px',
      maxWidth: '100vw',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center'
    }}>
      <h2 style={{ fontSize: '1.5em', margin: '10px 0' }}>Neo Chess</h2>

      {/* Mobile controls */}
      <div style={{
        display: 'flex',
        gap: '10px',
        marginBottom: '15px',
        fontSize: '14px'
      }}>
        <button
          onClick={() => setOrientation(orientation === 'white' ? 'black' : 'white')}
          style={{
            padding: '10px 15px',
            fontSize: '16px',
            touchAction: 'manipulation'
          }}
        >
          Flip
        </button>
      </div>

      <div style={{
        width: '100%',
        maxWidth: '400px',
        aspectRatio: '1 / 1'
      }}>
        <NeoChessBoard
          orientation={orientation}
          theme="dark"
          showCoordinates={false}
          style={{
            width: '100%',
            height: '100%',
            touchAction: 'none' // Prevent scroll during drag
          }}
          onMove={(move) => {
            // Haptic feedback on mobile
            if ('vibrate' in navigator) {
              navigator.vibrate(50);
            }
            console.log('Mobile move:', move);
          }}
        />
      </div>
    </div>
  );
}
```

## 📊 Analytics Integration

### Game Statistics

```typescript path=null start=null
class GameAnalytics {
  private moves: Move[] = [];
  private startTime: number = Date.now();

  recordMove(move: Move) {
    this.moves.push({
      ...move,
      timestamp: Date.now(),
      timeElapsed: Date.now() - this.startTime,
    });
  }

  getStatistics() {
    return {
      totalMoves: this.moves.length,
      gameDuration: Date.now() - this.startTime,
      averageThinkTime: this.calculateAverageThinkTime(),
      capturedPieces: this.moves.filter((m) => m.captured).length,
      checksGiven: this.moves.filter((m) => m.check).length,
    };
  }

  private calculateAverageThinkTime(): number {
    if (this.moves.length < 2) return 0;

    let totalTime = 0;
    for (let i = 1; i < this.moves.length; i++) {
      totalTime += this.moves[i].timestamp - this.moves[i - 1].timestamp;
    }

    return totalTime / (this.moves.length - 1);
  }
}
```

---

For more examples, check out the complete demo application in the `demo/` directory and explore the test files in `tests/` for additional usage patterns!
