export type PuzzleAriaEvent =
  | { type: 'load'; title: string }
  | { type: 'move'; result: 'correct' | 'incorrect' }
  | { type: 'hint'; hintType: 'text' | 'origin-highlight'; payload?: string }
  | { type: 'complete'; title: string }
  | { type: 'warning'; message: string };

export function formatPuzzleAriaMessage(event: PuzzleAriaEvent): string {
  switch (event.type) {
    case 'load': {
      return `Puzzle loaded: ${event.title}`;
    }
    case 'move': {
      return event.result === 'correct' ? 'Correct move entered.' : 'Incorrect move.';
    }
    case 'hint': {
      if (event.hintType === 'text') {
        return event.payload ? `Hint: ${event.payload}` : 'Hint requested.';
      }
      return event.payload
        ? `Highlighting target square ${event.payload}.`
        : 'Highlight hint requested.';
    }
    case 'complete': {
      return `Puzzle complete: ${event.title}`;
    }
    case 'warning': {
      return event.message;
    }
    default: {
      return '';
    }
  }
}
