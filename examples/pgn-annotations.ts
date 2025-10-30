/**
 * Example demonstrating PGN annotation support with arrows and circles
 * This example shows how to use the new %cal and %csl annotation features
 */

import { NeoChessBoard } from '../src/core/NeoChessBoard';
import { ChessJsRules } from '../src/core/ChessJsRules';
import { PgnNotation } from '../src/core/PgnNotation';

// Example PGN with visual annotations
const pgnWithAnnotations = `
[Event "Chess.com Analysis"]
[Site "Online"]
[Date "2024.01.20"]
[White "Player"]
[Black "Opponent"]
[Result "*"]

1. e4 {Great opening move! %cal Re1e4,Gd1h5 %csl Rd4} e5 {%cal Ge7e5 %csl Re5} 
2. Nf3 {Development %cal Rg1f3} Nc6 {%csl Gc6,Yf6} 
3. Bc4 {Attacking f7 %cal Rc4f7 %csl Rf7} f5?! {Premature %csl Rf5}
*`;

// Example usage
export function demonstratePgnAnnotations() {
  // Create a container element
  const container = document.createElement('div');
  document.body.append(container);

  // Create the chessboard with ChessJsRules
  const rules = new ChessJsRules();
  const board = new NeoChessBoard(container, {
    interactive: true,
    showArrows: true,
    showHighlights: true,
    rightClickHighlights: true,
    rulesAdapter: rules,
  });

  // Load the PGN with annotations
  const success = board.loadPgnWithAnnotations(pgnWithAnnotations);

  if (success) {
    console.log('PGN loaded successfully with annotations!');

    // Export the PGN with annotations to verify it worked
    const exportedPgn = board.exportPgnWithAnnotations();
    console.log('Exported PGN:', exportedPgn);

    // You can also manually add annotations
    board.addAnnotationsToCurrentMove(
      [{ from: 'e1', to: 'g1', color: '#0000ff' }], // Blue arrow from e1 to g1
      [{ square: 'g1', type: 'circle', color: '#ffff00' }], // Yellow circle on g1
      'King safety move',
    );
  } else {
    console.error('Failed to load PGN');
  }
}

// Demonstrate individual components
export function demonstrateAnnotationParsing() {
  const pgnNotation = new PgnNotation();

  // Example of adding annotations programmatically
  const rules = new ChessJsRules();
  rules.move({ from: 'e2', to: 'e4' });
  rules.move({ from: 'e7', to: 'e5' });

  // Add annotations to the first move
  pgnNotation.addMoveAnnotations(1, true, {
    arrows: [
      { from: 'e1', to: 'e4', color: '#ff0000' }, // Red arrow
      { from: 'd1', to: 'h5', color: '#00ff00' }, // Green arrow
    ],
    circles: [
      { square: 'd4', type: 'circle', color: '#ff0000' }, // Red circle
      { square: 'e4', type: 'circle', color: '#00ff00' }, // Green circle
    ],
    textComment: 'Excellent opening move!',
  });

  // Export the PGN with annotations
  const pgnWithAnnotations = pgnNotation.toPgnWithAnnotations();
  console.log('Generated PGN:', pgnWithAnnotations);

  // Parse it back
  const newPgnNotation = new PgnNotation();
  newPgnNotation.loadPgnWithAnnotations(pgnWithAnnotations);

  const moves = newPgnNotation.getMovesWithAnnotations();
  console.log('Parsed moves:', moves);
}

// Usage examples for different annotation types
export const annotationExamples = {
  // Arrow annotations
  arrows: {
    simple: '%cal Re1e4',
    multiple: '%cal Re1e4,Gd1h5,Yg1f3',
    colors: {
      red: 'R', // %cal Re1e4
      green: 'G', // %cal Ga1a2
      yellow: 'Y', // %cal Yb1b2
      blue: 'B', // %cal Cc1c2
    },
  },

  // Circle annotations
  circles: {
    simple: '%csl Rd4',
    multiple: '%csl Rd4,Gd5,Yf7',
    colors: {
      red: 'R', // %csl Re4
      green: 'G', // %csl Gd5
      yellow: 'Y', // %csl Yf7
      blue: 'B', // %csl Bc6
    },
  },

  // Combined annotations
  combined: 'Great move! %cal Re1e4 %csl Gd4 This secures the center.',

  // Real game example
  gamePosition: `1. e4 {The king's pawn opening %cal Re1e4 %csl Gd4,Ge4} e5 {Symmetrical response %cal Ge7e5 %csl Re5}`,
};

// Call demonstration functions when this module is imported
if (globalThis.window !== undefined) {
  // Browser environment
  document.addEventListener('DOMContentLoaded', () => {
    demonstratePgnAnnotations();
    demonstrateAnnotationParsing();
  });
}
