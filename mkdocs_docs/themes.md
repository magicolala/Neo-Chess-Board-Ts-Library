# Theme Development Guide

This guide explains how to create and customize themes for Neo Chess Board.

## 🎨 Theme Structure

A theme consists of colors for the board, pieces, and UI highlights:

```typescript path=null start=null
interface Theme {
  name: string;
  board: {
    light: string;    // Light squares
    dark: string;     // Dark squares  
    border: string;   // Board border
  };
  pieces: {
    king: { white: string; black: string; };
    queen: { white: string; black: string; };
    rook: { white: string; black: string; };
    bishop: { white: string; black: string; };
    knight: { white: string; black: string; };
    pawn: { white: string; black: string; };
  };
  highlights: {
    lastMove: string;     // Last move highlight
    legalMove: string;    // Legal move dots
    check: string;        // Check warning
    selected: string;     // Selected square
  };
}
```

## 🏗️ Built-in Themes

### Light Theme
Classic wooden chess board appearance:

```typescript path=null start=null
const lightTheme: Theme = {
  name: 'light',
  board: {
    light: '#f0d9b5',
    dark: '#b58863', 
    border: '#8b4513'
  },
  pieces: {
    king: { white: '#ffffff', black: '#000000' },
    queen: { white: '#ffffff', black: '#000000' },
    // ... other pieces
  },
  highlights: {
    lastMove: 'rgba(255, 255, 0, 0.5)',
    legalMove: 'rgba(0, 255, 0, 0.3)',
    check: 'rgba(255, 0, 0, 0.7)',
    selected: 'rgba(0, 0, 255, 0.3)'
  }
};
```

### Dark Theme
Modern dark interface:

```typescript path=null start=null
const darkTheme: Theme = {
  name: 'dark',
  board: {
    light: '#4a4a4a',
    dark: '#2d2d2d',
    border: '#1a1a1a'
  },
  pieces: {
    king: { white: '#f8f8f2', black: '#44475a' },
    // ... 
  },
  highlights: {
    lastMove: 'rgba(139, 233, 253, 0.5)',
    legalMove: 'rgba(80, 250, 123, 0.4)',
    check: 'rgba(255, 85, 85, 0.8)',
    selected: 'rgba(189, 147, 249, 0.4)'
  }
};
```

### Other Built-in Themes
- **Wood**: Traditional wooden board
- **Glass**: Transparent modern look  
- **Neon**: Futuristic cyberpunk style
- **Retro**: Vintage computer aesthetic

## 🎯 Creating Custom Themes

### Step 1: Define Your Color Palette

Start by choosing your base colors:

```typescript path=null start=null
const myColors = {
  // Board colors
  lightSquare: '#e8e8e8',
  darkSquare: '#4169e1',
  boardBorder: '#000080',
  
  // Piece colors
  whitePieces: '#ffffff',
  blackPieces: '#1a1a1a',
  
  // Highlight colors
  highlight: 'rgba(255, 215, 0, 0.6)',
  legal: 'rgba(34, 139, 34, 0.4)',
  danger: 'rgba(220, 20, 60, 0.8)',
  selection: 'rgba(30, 144, 255, 0.5)'
};
```

### Step 2: Create the Theme Object

```typescript path=null start=null
const customTheme: Theme = {
  name: 'ocean',
  board: {
    light: myColors.lightSquare,
    dark: myColors.darkSquare,
    border: myColors.boardBorder
  },
  pieces: {
    king: { 
      white: myColors.whitePieces, 
      black: myColors.blackPieces 
    },
    queen: { 
      white: myColors.whitePieces, 
      black: myColors.blackPieces 
    },
    rook: { 
      white: myColors.whitePieces, 
      black: myColors.blackPieces 
    },
    bishop: { 
      white: myColors.whitePieces, 
      black: myColors.blackPieces 
    },
    knight: { 
      white: myColors.whitePieces, 
      black: myColors.blackPieces 
    },
    pawn: { 
      white: myColors.whitePieces, 
      black: myColors.blackPieces 
    }
  },
  highlights: {
    lastMove: myColors.highlight,
    legalMove: myColors.legal,
    check: myColors.danger,
    selected: myColors.selection
  }
};
```

### Step 3: Apply Your Theme

```typescript path=null start=null
// Vanilla JavaScript
board.setTheme(customTheme);

// React
<NeoChessBoard theme={customTheme} />
```

## 🎨 Design Guidelines

### Color Contrast
Ensure sufficient contrast between:
- Light and dark squares (minimum 3:1 ratio)
- White and black pieces (minimum 4.5:1 ratio)  
- Highlights and board background (minimum 3:1 ratio)

### Accessibility
- Test with colorblind simulators
- Provide alternative visual cues beyond color
- Ensure highlights are clearly visible
- Consider high contrast themes

### Visual Harmony
- Use a consistent color palette
- Limit the number of colors (5-7 maximum)
- Consider the emotional impact of colors
- Test on different screen types and lighting

## 🛠️ Advanced Theme Features

### Gradients and Patterns

You can use CSS gradients and patterns:

```typescript path=null start=null
const gradientTheme: Theme = {
  name: 'gradient',
  board: {
    light: 'linear-gradient(45deg, #f0f0f0, #e0e0e0)',
    dark: 'linear-gradient(45deg, #606060, #505050)',
    border: '#333333'
  },
  // ... rest of theme
};
```

### Semi-transparent Effects

Use alpha channels for subtle effects:

```typescript path=null start=null
highlights: {
  lastMove: 'rgba(255, 255, 0, 0.3)',      // Subtle yellow
  legalMove: 'rgba(0, 255, 0, 0.2)',       // Light green dots
  check: 'rgba(255, 0, 0, 0.6)',           // Strong red warning
  selected: 'rgba(0, 100, 255, 0.4)'       // Blue selection
}
```

### Dynamic Themes

Create themes that respond to game state:

```typescript path=null start=null
class DynamicTheme {
  private baseTheme: Theme;
  
  constructor(base: Theme) {
    this.baseTheme = base;
  }
  
  getThemeForState(gameState: GameState): Theme {
    if (gameState.isCheck) {
      return {
        ...this.baseTheme,
        highlights: {
          ...this.baseTheme.highlights,
          check: 'rgba(255, 0, 0, 0.9)' // Stronger red in check
        }
      };
    }
    return this.baseTheme;
  }
}
```

## 🎨 Theme Examples

### Minimalist Theme
Clean, minimal design:

```typescript path=null start=null
const minimalistTheme: Theme = {
  name: 'minimalist',
  board: {
    light: '#ffffff',
    dark: '#f5f5f5',
    border: '#e0e0e0'
  },
  pieces: {
    king: { white: '#333333', black: '#666666' },
    queen: { white: '#333333', black: '#666666' },
    rook: { white: '#333333', black: '#666666' },
    bishop: { white: '#333333', black: '#666666' },
    knight: { white: '#333333', black: '#666666' },
    pawn: { white: '#333333', black: '#666666' }
  },
  highlights: {
    lastMove: 'rgba(100, 100, 100, 0.3)',
    legalMove: 'rgba(150, 150, 150, 0.2)',
    check: 'rgba(200, 50, 50, 0.5)',
    selected: 'rgba(100, 150, 200, 0.3)'
  }
};
```

### High Contrast Theme
Accessibility-focused theme:

```typescript path=null start=null
const highContrastTheme: Theme = {
  name: 'high-contrast',
  board: {
    light: '#ffffff',
    dark: '#000000',
    border: '#808080'
  },
  pieces: {
    king: { white: '#000000', black: '#ffffff' },
    queen: { white: '#000000', black: '#ffffff' },
    rook: { white: '#000000', black: '#ffffff' },
    bishop: { white: '#000000', black: '#ffffff' },
    knight: { white: '#000000', black: '#ffffff' },
    pawn: { white: '#000000', black: '#ffffff' }
  },
  highlights: {
    lastMove: 'rgba(255, 255, 0, 0.8)',
    legalMove: 'rgba(0, 255, 0, 0.6)',
    check: 'rgba(255, 0, 0, 1.0)',
    selected: 'rgba(0, 0, 255, 0.6)'
  }
};
```

### Seasonal Themes

Create themes for different occasions:

```typescript path=null start=null
// Christmas theme
const christmasTheme: Theme = {
  name: 'christmas',
  board: {
    light: '#f8f8ff',    // Snow white
    dark: '#228b22',     // Forest green
    border: '#dc143c'    // Crimson red
  },
  pieces: {
    king: { white: '#ffd700', black: '#8b0000' },    // Gold/Dark red
    // ... other pieces in festive colors
  },
  highlights: {
    lastMove: 'rgba(255, 215, 0, 0.6)',   // Gold
    legalMove: 'rgba(255, 255, 255, 0.4)', // Snow
    check: 'rgba(220, 20, 60, 0.8)',      // Crimson
    selected: 'rgba(65, 105, 225, 0.5)'   // Royal blue
  }
};
```

## 📱 Responsive Considerations

### Mobile-Friendly Themes
For mobile devices, consider:
- Larger highlight areas for touch targets
- Higher contrast for outdoor viewing
- Simplified piece designs for small screens

```typescript path=null start=null
const mobileTheme: Theme = {
  // ... base theme
  highlights: {
    lastMove: 'rgba(255, 255, 0, 0.7)',     // Higher opacity
    legalMove: 'rgba(0, 255, 0, 0.5)',      // Larger visible area
    check: 'rgba(255, 0, 0, 0.9)',          // Very prominent
    selected: 'rgba(0, 0, 255, 0.6)'        // Clear selection
  }
};
```

## 🔧 Testing Your Themes

### Visual Testing Checklist
- [ ] All pieces are clearly distinguishable
- [ ] Board squares have sufficient contrast
- [ ] Highlights are visible but not overwhelming
- [ ] Theme works in both orientations
- [ ] Colors look good on different monitors
- [ ] Theme is accessible to colorblind users

### Code Testing

```typescript path=null start=null
describe('Custom Theme', () => {
  it('should apply theme correctly', () => {
    board.setTheme(customTheme);
    expect(board.getCurrentTheme().name).toBe('custom');
  });
  
  it('should maintain piece visibility', () => {
    board.setTheme(customTheme);
    // Test that pieces are rendered correctly
  });
});
```

## 🚀 Sharing Your Themes

### Contributing Themes
1. Test your theme thoroughly
2. Follow the naming conventions
3. Add to the built-in themes collection
4. Include screenshots in your pull request
5. Document any special features

### Theme Gallery
We maintain a gallery of community themes. Submit yours via pull request with:
- Theme definition file
- Screenshot showing the theme
- Brief description and inspiration
- Accessibility notes if relevant

## 🎨 Theme Inspiration

### Color Palette Resources
- [Adobe Color](https://color.adobe.com)
- [Coolors.co](https://coolors.co)
- [Material Design Colors](https://material.io/design/color)
- [Tailwind CSS Colors](https://tailwindcss.com/docs/customizing-colors)

### Chess Set Inspiration
- Classical Staunton sets
- Modern minimalist designs
- Historical chess sets
- Cultural and regional variations
- Art movements (Art Deco, Bauhaus, etc.)

### Color Psychology
- **Blue**: Trust, stability, intelligence
- **Green**: Growth, harmony, nature
- **Red**: Energy, power, attention
- **Brown**: Earthiness, reliability, comfort
- **Purple**: Creativity, luxury, mystery
- **Gray**: Neutrality, sophistication, balance

## 🔄 Theme Switching

### Smooth Transitions

```typescript path=null start=null
// Gradual theme transition
function switchThemeWithAnimation(newTheme: Theme) {
  const transition = {
    duration: 300,
    easing: 'ease-in-out'
  };
  
  board.setTheme(newTheme, transition);
}
```

### User Preferences

```typescript path=null start=null
// Save user's theme preference
function saveThemePreference(themeName: string) {
  localStorage.setItem('neochessboard-theme', themeName);
}

// Load saved theme
function loadThemePreference(): string | null {
  return localStorage.getItem('neochessboard-theme');
}

// Apply saved theme on startup
const savedTheme = loadThemePreference();
if (savedTheme) {
  board.setTheme(savedTheme);
}
```

## 🌙 Dark Mode Support

### System Theme Detection

```typescript path=null start=null
// Detect system dark mode preference
const prefersDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;

// Apply appropriate theme
const defaultTheme = prefersDarkMode ? 'dark' : 'light';
board.setTheme(defaultTheme);

// Listen for system theme changes
window.matchMedia('(prefers-color-scheme: dark)')
  .addEventListener('change', (e) => {
    const newTheme = e.matches ? 'dark' : light';
    board.setTheme(newTheme);
  });
```

## 🎨 Advanced Styling

### CSS Integration

You can enhance themes with CSS for the container:

```css
/* Custom board container styling */
.neo-chess-board-container {
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 16px;
}

/* Theme-specific styling */
.neo-chess-board-container[data-theme="neon"] {
  background: linear-gradient(45deg, #ff006e, #8338ec);
  box-shadow: 0 0 20px rgba(255, 0, 110, 0.5);
}
```

### Animation Support

```typescript path=null start=null
const animatedTheme: Theme = {
  name: 'animated',
  // ... base theme
  animations: {
    pieceMove: {
      duration: 250,
      easing: 'ease-out'
    },
    highlight: {
      duration: 150,
      easing: 'ease-in-out'
    }
  }
};
```

## 📐 Size and Scaling

### Responsive Piece Sizes

```typescript path=null start=null
// Theme with size-responsive piece rendering
const responsiveTheme: Theme = {
  // ... base theme
  sizing: {
    borderWidth: (boardSize: number) => Math.max(1, boardSize / 100),
    pieceScale: (squareSize: number) => squareSize > 60 ? 0.9 : 0.85,
    highlightThickness: (squareSize: number) => Math.max(2, squareSize / 20)
  }
};
```

## 🔍 Theme Validation

### Validation Function

```typescript path=null start=null
function validateTheme(theme: Theme): boolean {
  // Check required properties exist
  if (!theme.name || !theme.board || !theme.pieces || !theme.highlights) {
    return false;
  }
  
  // Validate color formats
  const colorRegex = /^(#[0-9a-f]{3,6}|rgba?\([^)]+\)|[a-z]+)$/i;
  
  // Check board colors
  if (!colorRegex.test(theme.board.light) || 
      !colorRegex.test(theme.board.dark)) {
    return false;
  }
  
  // Check piece colors
  for (const piece of Object.values(theme.pieces)) {
    if (!colorRegex.test(piece.white) || !colorRegex.test(piece.black)) {
      return false;
    }
  }
  
  return true;
}
```

## 🎯 Performance Tips

### Efficient Color Usage
- Use hex colors when possible (faster parsing)
- Avoid complex gradients for frequently redrawn elements
- Cache computed colors for repeated use
- Use solid colors for piece sprites

### Memory Optimization
```typescript path=null start=null
// Reuse theme objects instead of creating new ones
const themeCache = new Map<string, Theme>();

function getTheme(name: string): Theme {
  if (!themeCache.has(name)) {
    themeCache.set(name, createTheme(name));
  }
  return themeCache.get(name)!;
}
```

## 📋 Theme Checklist

When creating a new theme, ensure:

- [ ] Theme name is unique and descriptive
- [ ] All required properties are defined
- [ ] Colors use valid CSS color formats
- [ ] Sufficient contrast for accessibility
- [ ] Tested on multiple devices/screens
- [ ] Works with both board orientations
- [ ] Highlights are clearly visible
- [ ] Pieces are distinguishable
- [ ] Theme follows design guidelines
- [ ] Performance is acceptable

## 🎨 Community Themes

Visit our [theme gallery](https://github.com/yourusername/neochessboard/wiki/Theme-Gallery) to see community-created themes and share your own creations!

---

Happy theme designing! 🎨✨
