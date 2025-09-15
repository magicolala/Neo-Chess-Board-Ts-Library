import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { NeoChessBoard } from '../src/react/NeoChessBoard';
import type { Move, Theme } from '../src/core/types';

// Custom hook for chess game state management
function useChessGame(initialPosition = 'start') {
  const [position, setPosition] = useState(initialPosition);
  const [moves, setMoves] = useState<Move[]>([]);
  const [gameStatus, setGameStatus] = useState<'playing' | 'check' | 'checkmate' | 'stalemate'>(
    'playing',
  );
  const [currentPlayer, setCurrentPlayer] = useState<'white' | 'black'>('white');

  const makeMove = useCallback(
    (move: Move) => {
      setMoves((prev) => [...prev, move]);
      setPosition(move.fen || position);
      setCurrentPlayer((prev) => (prev === 'white' ? 'black' : 'white'));
      setGameStatus('playing'); // Reset to playing, events will update if needed
    },
    [position],
  );

  const resetGame = useCallback(() => {
    setPosition('start');
    setMoves([]);
    setGameStatus('playing');
    setCurrentPlayer('white');
  }, []);

  const undoLastMove = useCallback(() => {
    if (moves.length > 0) {
      const newMoves = moves.slice(0, -1);
      setMoves(newMoves);

      if (newMoves.length === 0) {
        setPosition('start');
        setCurrentPlayer('white');
      } else {
        const lastMove = newMoves[newMoves.length - 1];
        setPosition(lastMove.fen || 'start');
        setCurrentPlayer(newMoves.length % 2 === 0 ? 'white' : 'black');
      }

      setGameStatus('playing');
    }
  }, [moves]);

  const goToMove = useCallback(
    (moveIndex: number) => {
      if (moveIndex < 0) {
        setPosition('start');
        setCurrentPlayer('white');
      } else if (moveIndex < moves.length) {
        setPosition(moves[moveIndex].fen || 'start');
        setCurrentPlayer(moveIndex % 2 === 0 ? 'black' : 'white');
      }
    },
    [moves],
  );

  return {
    position,
    moves,
    gameStatus,
    currentPlayer,
    makeMove,
    resetGame,
    undoLastMove,
    goToMove,
    setGameStatus,
  };
}

// Custom hook for theme management
function useChessTheme() {
  const [currentTheme, setCurrentTheme] = useState('light');
  const [customThemes, setCustomThemes] = useState<Theme[]>([]);

  const availableThemes = useMemo(
    () => [
      'light',
      'dark',
      'wood',
      'glass',
      'neon',
      'retro',
      ...customThemes.map((theme) => theme.name),
    ],
    [customThemes],
  );

  const addCustomTheme = useCallback((theme: Theme) => {
    setCustomThemes((prev) => [...prev.filter((t) => t.name !== theme.name), theme]);
  }, []);

  const getTheme = useCallback(
    (themeName: string) => {
      const customTheme = customThemes.find((t) => t.name === themeName);
      return customTheme || themeName;
    },
    [customThemes],
  );

  return {
    currentTheme,
    setCurrentTheme,
    availableThemes,
    addCustomTheme,
    getTheme,
  };
}

// Custom hook for board preferences
function useBoardPreferences() {
  const [orientation, setOrientation] = useState<'white' | 'black'>('white');
  const [showCoordinates, setShowCoordinates] = useState(true);
  const [highlightLastMove, setHighlightLastMove] = useState(true);
  const [animationSpeed, setAnimationSpeed] = useState(250);

  // Load preferences from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('neochess-preferences');
    if (saved) {
      try {
        const prefs = JSON.parse(saved);
        setOrientation(prefs.orientation || 'white');
        setShowCoordinates(prefs.showCoordinates ?? true);
        setHighlightLastMove(prefs.highlightLastMove ?? true);
        setAnimationSpeed(prefs.animationSpeed || 250);
      } catch (error) {
        console.warn('Failed to load preferences:', error);
      }
    }
  }, []);

  // Save preferences to localStorage
  useEffect(() => {
    const preferences = {
      orientation,
      showCoordinates,
      highlightLastMove,
      animationSpeed,
    };
    localStorage.setItem('neochess-preferences', JSON.stringify(preferences));
  }, [orientation, showCoordinates, highlightLastMove, animationSpeed]);

  const flipBoard = useCallback(() => {
    setOrientation((prev) => (prev === 'white' ? 'black' : 'white'));
  }, []);

  return {
    orientation,
    showCoordinates,
    highlightLastMove,
    animationSpeed,
    setOrientation,
    setShowCoordinates,
    setHighlightLastMove,
    setAnimationSpeed,
    flipBoard,
  };
}

// Main game component using all custom hooks
export function AdvancedChessGame() {
  const game = useChessGame();
  const theme = useChessTheme();
  const prefs = useBoardPreferences();

  // Event handlers
  const handleMove = useCallback(
    (move: Move) => {
      game.makeMove(move);
    },
    [game.makeMove],
  );

  const handleCheck = useCallback(() => {
    game.setGameStatus('check');
  }, [game.setGameStatus]);

  const handleCheckmate = useCallback(() => {
    game.setGameStatus('checkmate');
  }, [game.setGameStatus]);

  const handleStalemate = useCallback(() => {
    game.setGameStatus('stalemate');
  }, [game.setGameStatus]);

  const exportPGN = useCallback(() => {
    const headers = {
      Event: 'Neo Chess Board Game',
      Site: 'React Hooks Example',
      Date: new Date().toISOString().split('T')[0],
      White: 'Player 1',
      Black: 'Player 2',
      Result:
        game.gameStatus === 'checkmate'
          ? game.currentPlayer === 'white'
            ? '0-1'
            : '1-0'
          : game.gameStatus === 'stalemate'
            ? '1/2-1/2'
            : '*',
    };

    // Simple PGN export (in real app, use proper PGN formatting)
    const pgnMoves = game.moves
      .map((move, index) => {
        const moveNumber = Math.floor(index / 2) + 1;
        const prefix = index % 2 === 0 ? `${moveNumber}.` : '';
        return prefix + (move.san || `${move.from}-${move.to}`);
      })
      .join(' ');

    const pgn =
      Object.entries(headers)
        .map(([key, value]) => `[${key} "${value}"]`)
        .join('\n') +
      '\n\n' +
      pgnMoves +
      '\n';

    // Download PGN
    const blob = new Blob([pgn], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'chess-game.pgn';
    a.click();
    URL.revokeObjectURL(url);
  }, [game.moves, game.gameStatus, game.currentPlayer]);

  // Create a custom theme example
  const createCustomTheme = () => {
    const customTheme: Theme = {
      name: 'ocean',
      board: {
        light: '#e8f4fd',
        dark: '#1e3a8a',
        border: '#1e40af',
      },
      pieces: {
        king: { white: '#ffffff', black: '#1f2937' },
        queen: { white: '#ffffff', black: '#1f2937' },
        rook: { white: '#ffffff', black: '#1f2937' },
        bishop: { white: '#ffffff', black: '#1f2937' },
        knight: { white: '#ffffff', black: '#1f2937' },
        pawn: { white: '#ffffff', black: '#1f2937' },
      },
      highlights: {
        lastMove: 'rgba(59, 130, 246, 0.5)',
        legalMove: 'rgba(34, 197, 94, 0.4)',
        check: 'rgba(239, 68, 68, 0.8)',
        selected: 'rgba(168, 85, 247, 0.4)',
      },
    };

    theme.addCustomTheme(customTheme);
    theme.setCurrentTheme('ocean');
  };

  return (
    <div
      style={{
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '20px',
        fontFamily: 'system-ui, -apple-system, sans-serif',
      }}
    >
      <h1 style={{ textAlign: 'center', marginBottom: '30px' }}>
        🏆 Advanced Chess Game with React Hooks
      </h1>

      {/* Main game area */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'auto 300px',
          gap: '30px',
          alignItems: 'start',
        }}
      >
        {/* Chess board */}
        <div>
          <NeoChessBoard
            position={game.position}
            theme={theme.getTheme(theme.currentTheme)}
            orientation={prefs.orientation}
            showCoordinates={prefs.showCoordinates}
            onMove={handleMove}
            onCheck={handleCheck}
            onCheckmate={handleCheckmate}
            onStalemate={handleStalemate}
            style={{ maxWidth: '500px', width: '100%' }}
          />
        </div>

        {/* Control panel */}
        <div
          style={{
            background: '#f8fafc',
            padding: '20px',
            borderRadius: '12px',
            border: '1px solid #e2e8f0',
          }}
        >
          {/* Game status */}
          <div style={{ marginBottom: '20px' }}>
            <h3 style={{ margin: '0 0 10px 0', color: '#374151' }}>Game Status</h3>
            <div
              style={{
                padding: '8px 12px',
                borderRadius: '6px',
                fontWeight: '600',
                background:
                  game.gameStatus === 'check'
                    ? '#fef2f2'
                    : game.gameStatus === 'checkmate'
                      ? '#fee2e2'
                      : game.gameStatus === 'stalemate'
                        ? '#eff6ff'
                        : '#f0fdf4',
                color:
                  game.gameStatus === 'check'
                    ? '#dc2626'
                    : game.gameStatus === 'checkmate'
                      ? '#dc2626'
                      : game.gameStatus === 'stalemate'
                        ? '#2563eb'
                        : '#16a34a',
              }}
            >
              {game.gameStatus.charAt(0).toUpperCase() + game.gameStatus.slice(1)}
            </div>
            <div style={{ marginTop: '8px', fontSize: '14px', color: '#6b7280' }}>
              Current player: <strong>{game.currentPlayer}</strong>
            </div>
          </div>

          {/* Theme controls */}
          <div style={{ marginBottom: '20px' }}>
            <h4 style={{ margin: '0 0 10px 0', color: '#374151' }}>Appearance</h4>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px' }}>
                  Theme:
                </label>
                <select
                  value={theme.currentTheme}
                  onChange={(e) => theme.setCurrentTheme(e.target.value)}
                  style={{ width: '100%', padding: '6px 10px' }}
                >
                  {theme.availableThemes.map((themeName) => (
                    <option key={themeName} value={themeName}>
                      {themeName.charAt(0).toUpperCase() + themeName.slice(1)}
                    </option>
                  ))}
                </select>
              </div>

              <button
                onClick={createCustomTheme}
                style={{
                  padding: '6px 12px',
                  background: '#8b5cf6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '14px',
                }}
              >
                ✨ Create Ocean Theme
              </button>
            </div>
          </div>

          {/* Board preferences */}
          <div style={{ marginBottom: '20px' }}>
            <h4 style={{ margin: '0 0 10px 0', color: '#374151' }}>Board Settings</h4>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <label
                style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px' }}
              >
                <input
                  type="checkbox"
                  checked={prefs.showCoordinates}
                  onChange={(e) => prefs.setShowCoordinates(e.target.checked)}
                />
                Show coordinates
              </label>

              <label
                style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px' }}
              >
                <input
                  type="checkbox"
                  checked={prefs.highlightLastMove}
                  onChange={(e) => prefs.setHighlightLastMove(e.target.checked)}
                />
                Highlight last move
              </label>

              <div>
                <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px' }}>
                  Animation Speed: {prefs.animationSpeed}ms
                </label>
                <input
                  type="range"
                  min="100"
                  max="1000"
                  step="50"
                  value={prefs.animationSpeed}
                  onChange={(e) => prefs.setAnimationSpeed(parseInt(e.target.value))}
                  style={{ width: '100%' }}
                />
              </div>
            </div>
          </div>

          {/* Game actions */}
          <div style={{ marginBottom: '20px' }}>
            <h4 style={{ margin: '0 0 10px 0', color: '#374151' }}>Actions</h4>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <button
                onClick={prefs.flipBoard}
                style={{
                  padding: '8px 12px',
                  background: '#06b6d4',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                }}
              >
                🔄 Flip Board
              </button>

              <button
                onClick={game.undoLastMove}
                disabled={game.moves.length === 0}
                style={{
                  padding: '8px 12px',
                  background: game.moves.length === 0 ? '#d1d5db' : '#f59e0b',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: game.moves.length === 0 ? 'not-allowed' : 'pointer',
                }}
              >
                ↶ Undo Move
              </button>

              <button
                onClick={game.resetGame}
                style={{
                  padding: '8px 12px',
                  background: '#ef4444',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                }}
              >
                🆕 New Game
              </button>

              <button
                onClick={exportPGN}
                disabled={game.moves.length === 0}
                style={{
                  padding: '8px 12px',
                  background: game.moves.length === 0 ? '#d1d5db' : '#10b981',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: game.moves.length === 0 ? 'not-allowed' : 'pointer',
                }}
              >
                📋 Export PGN
              </button>
            </div>
          </div>

          {/* Move history */}
          <div>
            <h4 style={{ margin: '0 0 10px 0', color: '#374151' }}>
              Move History ({game.moves.length})
            </h4>

            <div
              style={{
                maxHeight: '200px',
                overflow: 'auto',
                background: 'white',
                border: '1px solid #e5e7eb',
                borderRadius: '6px',
                padding: '10px',
              }}
            >
              {game.moves.length === 0 ? (
                <em style={{ color: '#9ca3af' }}>No moves yet</em>
              ) : (
                <div style={{ fontFamily: 'monospace', fontSize: '13px', lineHeight: '1.4' }}>
                  {game.moves.map((move, index) => (
                    <div
                      key={index}
                      onClick={() => game.goToMove(index)}
                      style={{
                        padding: '2px 6px',
                        borderRadius: '3px',
                        cursor: 'pointer',
                        transition: 'background-color 0.15s',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = '#f3f4f6';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'transparent';
                      }}
                    >
                      {Math.floor(index / 2) + 1}
                      {index % 2 === 0 ? '.' : '...'} {move.san || `${move.from}-${move.to}`}
                      {move.check && ' +'}
                      {move.checkmate && ' #'}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Game stats */}
      {game.moves.length > 0 && (
        <div
          style={{
            marginTop: '30px',
            padding: '20px',
            background: '#f1f5f9',
            borderRadius: '12px',
            border: '1px solid #cbd5e1',
          }}
        >
          <h3 style={{ margin: '0 0 15px 0', color: '#374151' }}>Game Statistics</h3>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
              gap: '15px',
            }}
          >
            <div>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#1f2937' }}>
                {game.moves.length}
              </div>
              <div style={{ fontSize: '14px', color: '#6b7280' }}>Total Moves</div>
            </div>

            <div>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#1f2937' }}>
                {game.moves.filter((m) => m.captured).length}
              </div>
              <div style={{ fontSize: '14px', color: '#6b7280' }}>Captures</div>
            </div>

            <div>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#1f2937' }}>
                {game.moves.filter((m) => m.check).length}
              </div>
              <div style={{ fontSize: '14px', color: '#6b7280' }}>Checks</div>
            </div>

            <div>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#1f2937' }}>
                {game.gameStatus === 'checkmate' ? '1' : '0'}
              </div>
              <div style={{ fontSize: '14px', color: '#6b7280' }}>Checkmates</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Component for loading famous games
export function FamousGamesExample() {
  const game = useChessGame();

  const famousGames = [
    {
      name: 'Kasparov vs Deep Blue (1997)',
      moves: ['e4', 'c6', 'd4', 'd5', 'Nc3', 'dxe4', 'Nxe4', 'Nd7'],
      description: 'Historic man vs machine match',
    },
    {
      name: 'Fischer vs Spassky (1972)',
      moves: ['e4', 'c5', 'Nf3', 'd6', 'd4', 'cxd4', 'Nxd4', 'Nf6'],
      description: 'World Championship Game 6',
    },
    {
      name: 'Morphy vs Duke Karl (1858)',
      moves: ['e4', 'e5', 'Nf3', 'd6', 'd4', 'Bg4', 'dxe5', 'Bxf3'],
      description: 'Opera House Game',
    },
  ];

  const loadFamousGame = (gameIndex: number) => {
    const selectedGame = famousGames[gameIndex];
    console.log(`Loading: ${selectedGame.name}`);

    // In a real implementation, you would apply these moves to the board
    // For now, we'll just reset and show the game info
    game.resetGame();
    alert(`Loading: ${selectedGame.name}\n${selectedGame.description}`);
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '20px' }}>
      <h2>Famous Chess Games</h2>

      <div style={{ marginBottom: '20px' }}>
        <NeoChessBoard
          position={game.position}
          theme="retro"
          orientation="white"
          onMove={game.makeMove}
        />
      </div>

      <div style={{ display: 'grid', gap: '10px' }}>
        {famousGames.map((famousGame, index) => (
          <div
            key={index}
            style={{
              padding: '15px',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              background: 'white',
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
            onClick={() => loadFamousGame(index)}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = '#3b82f6';
              e.currentTarget.style.transform = 'translateY(-1px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = '#e5e7eb';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            <div style={{ fontWeight: '600', marginBottom: '5px' }}>{famousGame.name}</div>
            <div style={{ fontSize: '14px', color: '#6b7280' }}>{famousGame.description}</div>
            <div style={{ fontSize: '12px', color: '#9ca3af', marginTop: '5px' }}>
              Opening: {famousGame.moves.slice(0, 4).join(' ')}...
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Export both components
export default AdvancedChessGame;
