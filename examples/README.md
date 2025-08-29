# Examples

This directory contains comprehensive examples demonstrating how to use Neo Chess Board in different scenarios.

## 📁 Available Examples

### 🌐 Vanilla JavaScript
- **`vanilla-js-example.html`** - Complete standalone HTML page with interactive chess board
  - Theme switching
  - Move history tracking
  - PGN export
  - FEN position loading
  - Game status monitoring

### ⚛️ React Examples
- **`react-hooks-example.tsx`** - Advanced React implementation with custom hooks
  - `useChessGame` - Game state management
  - `useChessTheme` - Theme management with custom themes
  - `useBoardPreferences` - User preferences with localStorage
  - Full game statistics and analytics

### 🧩 Puzzle Applications
- **`chess-puzzles.tsx`** - Complete chess puzzle application
  - Multiple difficulty levels
  - Progress tracking
  - Puzzle creation tools
  - Solution validation
  - Statistics and achievements

## 🚀 Running Examples

### Vanilla JavaScript Example
1. Build the library first:
   ```bash
   npm run build
   ```

2. Open `vanilla-js-example.html` in your browser or serve it with a local server:
   ```bash
   # Using Node.js http-server
   npx http-server examples
   
   # Using Python
   python -m http.server 8000
   
   # Using PHP
   php -S localhost:8000
   ```

### React Examples
1. The React examples are TypeScript files that can be integrated into your React application.

2. Copy the desired example file to your React project and adjust the import paths:
   ```tsx
   // Change this:
   import { NeoChessBoard } from '../src/react/NeoChessBoard';
   
   // To this:
   import { NeoChessBoard } from 'neochessboard/react';
   ```

3. Install Neo Chess Board in your project:
   ```bash
   npm install neochessboard
   ```

## 🎯 Example Features Demonstrated

### Core Functionality
- ✅ Basic board setup and rendering
- ✅ Move making and validation
- ✅ FEN position loading
- ✅ Theme switching
- ✅ Board orientation flipping
- ✅ Event handling (move, check, checkmate, etc.)

### Advanced Features
- ✅ PGN import/export
- ✅ Move history navigation
- ✅ Custom themes creation
- ✅ User preferences persistence
- ✅ Game statistics tracking
- ✅ Puzzle solving mechanics
- ✅ Multi-board analysis
- ✅ Position editor tools

### UI/UX Patterns
- ✅ Responsive design
- ✅ Mobile-friendly interfaces
- ✅ Accessibility considerations
- ✅ Loading states
- ✅ Error handling
- ✅ User feedback
- ✅ Progressive enhancement

## 🎨 Styling Examples

### Basic CSS Integration
```css
/* Custom board container styling */
.chess-board-wrapper {
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
  padding: 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

/* Theme-specific styling */
.chess-board-wrapper[data-theme="neon"] {
  background: linear-gradient(45deg, #ff006e, #8338ec);
  box-shadow: 0 0 40px rgba(255, 0, 110, 0.3);
}
```

### Responsive Design
```css
/* Mobile-first approach */
.chess-container {
  width: 100%;
  max-width: 500px;
  margin: 0 auto;
}

/* Desktop enhancements */
@media (min-width: 768px) {
  .chess-container {
    display: flex;
    gap: 30px;
    max-width: 1200px;
  }
  
  .chess-board {
    flex-shrink: 0;
  }
  
  .game-controls {
    min-width: 300px;
  }
}
```

## 🔧 Customization Examples

### Custom Event Handlers
```typescript
board.on('move', (move) => {
  // Custom move handling
  analytics.trackMove(move);
  updateGameState(move);
  checkWinCondition();
});

board.on('check', (color) => {
  // Custom check handling
  playSound('check');
  showNotification(`${color} king is in check!`);
});
```

### Theme Customization
```typescript
const customTheme = {
  name: 'corporate',
  board: {
    light: '#f8fafc',
    dark: '#1e293b',
    border: '#334155'
  },
  pieces: {
    king: { white: '#3b82f6', black: '#1e40af' },
    // ... other pieces
  },
  highlights: {
    lastMove: 'rgba(59, 130, 246, 0.4)',
    legalMove: 'rgba(34, 197, 94, 0.3)',
    check: 'rgba(239, 68, 68, 0.6)',
    selected: 'rgba(168, 85, 247, 0.4)'
  }
};

board.setTheme(customTheme);
```

## 🎮 Integration Patterns

### With State Management (Redux/Zustand)
```typescript
// Redux action creators
const gameActions = {
  makeMove: (move) => ({ type: 'MAKE_MOVE', payload: move }),
  setTheme: (theme) => ({ type: 'SET_THEME', payload: theme }),
  resetGame: () => ({ type: 'RESET_GAME' })
};

// Component integration
const ChessGame = () => {
  const { position, theme } = useSelector(state => state.chess);
  const dispatch = useDispatch();
  
  return (
    <NeoChessBoard
      position={position}
      theme={theme}
      onMove={(move) => dispatch(gameActions.makeMove(move))}
    />
  );
};
```

### With Form Libraries
```typescript
// React Hook Form integration
const { control, watch, setValue } = useForm({
  defaultValues: {
    position: 'start',
    theme: 'light',
    orientation: 'white'
  }
});

const position = watch('position');

return (
  <Controller
    name="theme"
    control={control}
    render={({ field }) => (
      <NeoChessBoard
        position={position}
        theme={field.value}
        onMove={(move) => setValue('position', move.fen)}
      />
    )}
  />
);
```

## 📱 Mobile Examples

### Touch Optimization
```typescript
const MobileBoard = () => {
  const [touchStarted, setTouchStarted] = useState(false);
  
  return (
    <NeoChessBoard
      style={{
        touchAction: 'none', // Prevent scrolling during drag
        userSelect: 'none'   // Prevent text selection
      }}
      onTouchStart={() => setTouchStarted(true)}
      onTouchEnd={() => setTouchStarted(false)}
      // Add haptic feedback for moves
      onMove={(move) => {
        if ('vibrate' in navigator) {
          navigator.vibrate(50);
        }
      }}
    />
  );
};
```

### PWA Integration
```typescript
// Service Worker registration for offline support
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/chess-sw.js')
    .then(() => console.log('Chess app available offline'));
}

// Cache chess positions and games
const gameCache = {
  save: (gameId, gameData) => {
    localStorage.setItem(`chess-game-${gameId}`, JSON.stringify(gameData));
  },
  load: (gameId) => {
    const data = localStorage.getItem(`chess-game-${gameId}`);
    return data ? JSON.parse(data) : null;
  }
};
```

## 🎯 Performance Examples

### Large Game Analysis
```typescript
// Efficient handling of large move histories
const GameAnalyzer = ({ moves }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  
  // Virtualize large move lists
  const visibleMoves = useMemo(() => {
    const start = Math.max(0, currentIndex - 50);
    const end = Math.min(moves.length, currentIndex + 50);
    return moves.slice(start, end);
  }, [moves, currentIndex]);
  
  return (
    <div>
      <NeoChessBoard position={moves[currentIndex]?.fen} />
      <VirtualizedMoveList 
        moves={visibleMoves} 
        onMoveSelect={setCurrentIndex}
      />
    </div>
  );
};
```

### Memory Management
```typescript
// Proper cleanup in React components
useEffect(() => {
  const board = new NeoChessBoard(canvasRef.current);
  
  return () => {
    board.destroy(); // Clean up event listeners and resources
  };
}, []);
```

## 🧪 Testing Examples

### Component Testing
```typescript
import { render, fireEvent } from '@testing-library/react';
import { NeoChessBoard } from 'neochessboard/react';

test('handles move events correctly', () => {
  const handleMove = jest.fn();
  
  render(<NeoChessBoard onMove={handleMove} />);
  
  // Simulate move (this would require more complex board interaction)
  // fireEvent.mouseDown(getSquare('e2'));
  // fireEvent.mouseUp(getSquare('e4'));
  
  // expect(handleMove).toHaveBeenCalledWith(expect.objectContaining({
  //   from: 'e2',
  //   to: 'e4'
  // }));
});
```

## 🌐 Online Examples

For live, interactive examples, visit:

- **CodeSandbox**: [Try Neo Chess Board](https://codesandbox.io/s/neochessboard-demo)
- **StackBlitz**: [Edit in StackBlitz](https://stackblitz.com/github/yourusername/neochessboard)
- **Demo Site**: [Live Demo](https://yourusername.github.io/neochessboard)

## 🤝 Contributing Examples

Have a great example to share? We'd love to include it!

1. Fork the repository
2. Add your example to this directory
3. Update this README with a description
4. Submit a pull request

### Example Guidelines
- Include clear comments explaining key concepts
- Follow the existing code style
- Provide a brief description of what the example demonstrates
- Test your example thoroughly
- Consider accessibility and mobile users

---

Happy coding! 🚀
