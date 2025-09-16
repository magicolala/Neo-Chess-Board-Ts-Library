export type Square =
  `${'a' | 'b' | 'c' | 'd' | 'e' | 'f' | 'g' | 'h'}${'1' | '2' | '3' | '4' | '5' | '6' | '7' | '8'}`;
export type Color = 'w' | 'b';
export type Piece = 'K' | 'Q' | 'R' | 'B' | 'N' | 'P' | 'k' | 'q' | 'r' | 'b' | 'n' | 'p';

export interface Move {
  from: Square;
  to: Square;
  promotion?: 'q' | 'r' | 'b' | 'n';
  captured?: string | null;
  san?: string;
  ep?: boolean;
}

// Nouveaux types pour les fonctionnalités avancées
export interface Arrow {
  from: Square;
  to: Square;
  color: string;
  width?: number;
  opacity?: number;
  knightMove?: boolean;
}

export type HighlightType = 'green' | 'red' | 'blue' | 'yellow' | 'orange' | 'purple' | 'circle';

export interface SquareHighlight {
  square: Square;
  type: HighlightType;
  color?: string;
  opacity?: number;
}

export interface Premove {
  from: Square;
  to: Square;
  promotion?: 'q' | 'r' | 'b' | 'n';
}

export interface DrawingState {
  arrows: Arrow[];
  highlights: SquareHighlight[];
  premove?: Premove;
}

export interface RulesAdapter {
  setFEN(fen: string): void;
  getFEN(): string;
  turn(): Color;
  movesFrom(square: Square): Move[];
  move(m: {
    from: Square;
    to: Square;
    promotion?: Move['promotion'];
  }): { ok: boolean; fen?: string; state?: any; move?: any; reason?: string } | null | undefined;
  // Optional API if provided by chess.js
  getPGN?(): string; // chess.js exposes game.pgn(); we'll proxy it here
  header?: (h: Record<string, string>) => void; // chess.js header
  history?(): any[]; // Move history for annotation purposes
}

export interface Theme {
  light: string;
  dark: string;
  boardBorder: string;
  whitePiece: string;
  blackPiece: string;
  pieceShadow: string;
  moveFrom: string;
  moveTo: string;
  lastMove: string;
  premove: string;
  dot: string;
  arrow: string;
}

export interface BoardOptions {
  size?: number;
  orientation?: 'white' | 'black';
  interactive?: boolean;
  theme?: 'classic' | 'midnight';
  showCoordinates?: boolean;
  animationMs?: number;
  highlightLegal?: boolean;
  fen?: string;
  rulesAdapter?: RulesAdapter;
  // Nouvelles options
  allowPremoves?: boolean;
  showArrows?: boolean;
  showHighlights?: boolean;
  rightClickHighlights?: boolean;
  maxArrows?: number;
  maxHighlights?: number;
  soundEnabled?: boolean;
  showSquareNames?: boolean;
  soundUrl?: string;
}

export interface PgnMoveAnnotations {
  arrows?: Arrow[];
  circles?: SquareHighlight[];
  textComment?: string;
}

export interface PgnMove {
  moveNumber: number;
  white?: string;
  black?: string;
  whiteComment?: string;
  blackComment?: string;
  whiteAnnotations?: PgnMoveAnnotations;
  blackAnnotations?: PgnMoveAnnotations;
}
