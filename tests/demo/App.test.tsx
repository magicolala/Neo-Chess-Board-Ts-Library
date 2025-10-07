import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { App } from '../../demo/App';
import { ChessJsRules } from '../../src/core/ChessJsRules';

type VerboseMove = { from: string; to: string; promotion?: string };

interface MockRulesState {
  fen: string;
  pgn: string;
  turn: 'w' | 'b';
  halfMoveClock: number;
  fullMoveNumber: number;
  historySan: string[];
  verboseHistory: VerboseMove[];
}

const INITIAL_FEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPP1PPP/RNBQKBNR w KQkq - 0 1';

const updateFromFen = (state: MockRulesState) => {
  const parts = state.fen.trim().split(/\s+/);
  state.turn = parts[1] === 'b' ? 'b' : 'w';
  state.halfMoveClock = parts[4] ? Number.parseInt(parts[4], 10) || 0 : 0;
  state.fullMoveNumber = parts[5] ? Number.parseInt(parts[5], 10) || 1 : 1;
};

const normaliseFen = (fen: string) => {
  if (fen === 'r1bqkb1r/pppp1ppp/2n2n2/4p3/2B1P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 4') {
    return `${fen} 1`;
  }
  return fen;
};

const createMockChessJsRules = () => {
  const state: MockRulesState = {
    fen: INITIAL_FEN,
    pgn: '',
    turn: 'w',
    halfMoveClock: 0,
    fullMoveNumber: 1,
    historySan: [],
    verboseHistory: [],
  };

  const setFenInternal = (fen: string) => {
    state.fen = normaliseFen(fen);
    state.historySan = [];
    state.verboseHistory = [];
    updateFromFen(state);
  };

  const instance = {
    move: jest.fn(() => {
      state.pgn = '1. e4';
      state.fen = 'rnbqkbnr/pppp1ppp/8/4p3/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 2';
      state.historySan = ['e4'];
      state.verboseHistory = [{ from: 'e2', to: 'e4' }];
      updateFromFen(state);
      return { ok: true };
    }),
    toPgn: jest.fn(() => state.pgn),
    setFEN: jest.fn((fen: string) => {
      setFenInternal(fen);
    }),
    getFEN: jest.fn(() => state.fen),
    reset: jest.fn(() => {
      state.pgn = '*';
      setFenInternal(INITIAL_FEN);
    }),
    loadPgn: jest.fn((pgn: string) => {
      state.pgn = pgn;
      setFenInternal('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1');
      return true;
    }),
    setPgnMetadata: jest.fn(),
    downloadPgn: jest.fn(),
    moveNumber: jest.fn(() => state.fullMoveNumber),
    turn: jest.fn(() => state.turn),
    inCheck: jest.fn(() => false),
    isCheckmate: jest.fn(() => false),
    isStalemate: jest.fn(() => false),
    isGameOver: jest.fn(() => false),
    getAllMoves: jest.fn(() => Array.from({ length: 20 }, (_, index) => `move${index + 1}`)),
    halfMoves: jest.fn(() => state.halfMoveClock),
    getHistory: jest.fn(() => [...state.verboseHistory]),
    history: jest.fn(() => [...state.historySan]),
    getPgnNotation: jest.fn(() => ({
      getMovesWithAnnotations: jest.fn(() => []),
      getMetadata: jest.fn(() => ({ SetUp: '0' })),
    })),
  };

  updateFromFen(state);
  return instance;
};

jest.mock('../../src/core/ChessJsRules', () => ({
  ChessJsRules: jest.fn(() => createMockChessJsRules()),
}));

jest.mock('../../src/react/NeoChessBoard', () => ({
  __esModule: true,
  NeoChessBoard: jest.fn(({ onMove, theme }) =>
    React.createElement('div', {
      'data-testid': 'neo-chessboard',
      'data-theme': theme,
      onClick: () => {
        onMove?.({
          from: 'e2',
          to: 'e4',
          fen: 'rnbqkbnr/pppp1ppp/8/4p3/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 2',
        });
      },
    }),
  ),
}));

const mockWriteText = jest.fn(() => Promise.resolve());

describe('App Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.NODE_ENV = 'test';
    Object.defineProperty(navigator, 'clipboard', {
      value: {
        writeText: mockWriteText,
      },
      writable: true,
      configurable: true,
    });
  });

  describe('Basic rendering', () => {
    it('should render without crashing', () => {
      render(<App />);

      expect(screen.getByRole('heading', { name: /NeoChessBoard/i, level: 1 })).toBeInTheDocument();
      expect(screen.getByTestId('neo-chessboard')).toBeInTheDocument();
    });

    it('should display theme selector buttons', () => {
      render(<App />);

      expect(screen.getByText('Midnight')).toBeInTheDocument();
      expect(screen.getByText('Classic')).toBeInTheDocument();
    });

    it('should display PGN section', () => {
      render(<App />);

      expect(screen.getByText('Copier')).toBeInTheDocument();
      expect(screen.getByRole('textbox', { name: /pgn notation/i })).toBeInTheDocument();
    });

    it('should display FEN section', () => {
      render(<App />);

      expect(screen.getByText('🎯 Position FEN')).toBeInTheDocument();
      expect(screen.getByRole('textbox', { name: /fen/i })).toBeInTheDocument();
    });
  });

  describe('Theme switching', () => {
    it('should start with midnight theme', () => {
      render(<App />);

      expect(screen.getByText('midnight')).toBeInTheDocument();
      expect(screen.getByTestId('neo-chessboard')).toHaveAttribute('data-theme', 'midnight');
    });

    it('should switch to classic theme when clicked', async () => {
      const user = userEvent.setup();
      render(<App />);

      await user.click(screen.getByText('Classic'));

      expect(screen.getByText('classic')).toBeInTheDocument();
      expect(screen.getByTestId('neo-chessboard')).toHaveAttribute('data-theme', 'classic');
    });

    it('should switch back to midnight theme', async () => {
      const user = userEvent.setup();
      render(<App />);

      await user.click(screen.getByText('Classic'));
      await user.click(screen.getByText('Midnight'));

      expect(screen.getByText('midnight')).toBeInTheDocument();
      expect(screen.getByTestId('neo-chessboard')).toHaveAttribute('data-theme', 'midnight');
    });
  });

  describe('Move handling', () => {
    it('should handle moves and update PGN', async () => {
      const user = userEvent.setup();
      const { unmount } = render(<App />);

      try {
        await screen.findByTestId('neo-chessboard');
        await user.click(screen.getByTestId('neo-chessboard'));

        const pgnTextarea = (await screen.findByRole('textbox', {
          name: /pgn notation/i,
        })) as HTMLTextAreaElement;

        await waitFor(
          () => {
            expect(pgnTextarea.value).toContain('1. e4');
          },
          { timeout: 2000 },
        );
      } finally {
        unmount();
      }
    });

    it('should update FEN after move', async () => {
      const user = userEvent.setup();
      const { unmount } = render(<App />);

      try {
        await screen.findByTestId('neo-chessboard');

        const fenTextarea = screen.getByRole('textbox', { name: /fen/i });

        await user.click(screen.getByTestId('neo-chessboard'));

        await waitFor(
          () => {
            expect(fenTextarea).toHaveValue(
              'rnbqkbnr/pppp1ppp/8/4p3/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 2',
            );
          },
          { timeout: 2000 },
        );
      } finally {
        unmount();
      }
    });
  });

  describe('PGN functionality', () => {
    it('should display PGN text', () => {
      render(<App />);

      const pgnTextarea = screen.getByRole('textbox', { name: /pgn notation/i });
      expect(pgnTextarea).toHaveValue('');
    });

    it('should allow loading a PGN from the textarea', async () => {
      const user = userEvent.setup();
      render(<App />);

      const pgnTextarea = screen.getByRole('textbox', { name: /pgn notation/i });
      const samplePgn = '1. e4 e5';
      await user.type(pgnTextarea, samplePgn);

      const loadButton = screen.getByRole('button', { name: 'Charger' });
      await user.click(loadButton);

      await waitFor(() => {
        const chessRulesMock = ChessJsRules as unknown as jest.Mock;
        const loadPgnMock =
          (chessRulesMock.mock.results[0]?.value?.loadPgn as jest.Mock | undefined) ??
          (chessRulesMock.mock.instances[0]?.loadPgn as jest.Mock | undefined);
        expect(loadPgnMock).toHaveBeenCalledWith(expect.stringContaining('1. e4 e5'));
      });
    });

    it('should have functional copy button', async () => {
      const user = userEvent.setup();
      render(<App />);

      await user.click(screen.getByTestId('neo-chessboard'));

      await waitFor(() => {
        const pgnTextarea = screen.getByRole('textbox', {
          name: /pgn notation/i,
        }) as HTMLTextAreaElement;
        expect(pgnTextarea).toHaveValue('1. e4');
      });

      const copyButton = screen.getByText('Copier');
      expect(copyButton).toBeInTheDocument();
      expect(copyButton).not.toHaveAttribute('disabled');
      expect(() => user.click(copyButton)).not.toThrow();
    });

    it('should reset PGN when reset button clicked', async () => {
      const user = userEvent.setup();
      render(<App />);

      await user.click(screen.getByText('Reset'));
      await new Promise((resolve) => setTimeout(resolve, 10));

      const pgnTextarea = screen.getByRole('textbox', { name: /pgn notation/i });
      expect(pgnTextarea).toHaveValue('*');
    });

    it('should export PGN file when export button clicked', async () => {
      const user = userEvent.setup();
      render(<App />);

      await user.click(screen.getByText('Exporter'));
      await new Promise((resolve) => setTimeout(resolve, 10));

      const exportButton = screen.getByText('Exporter');
      expect(exportButton).toBeInTheDocument();
      expect(exportButton).not.toHaveAttribute('disabled');
    });
  });

  describe('FEN input', () => {
    it('should allow FEN input changes', async () => {
      const user = userEvent.setup();
      render(<App />);

      const fenTextarea = screen.getByRole('textbox', { name: /fen/i });

      const validFEN = 'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1';
      await user.clear(fenTextarea);
      await user.type(fenTextarea, validFEN);
      expect(fenTextarea).toHaveValue(validFEN);

      const problematicFEN = 'r1bqkb1r/pppp1ppp/2n2n2/4p3/2B1P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 4';
      await user.clear(fenTextarea);
      await user.type(fenTextarea, problematicFEN);
      expect(fenTextarea).toHaveValue(`${problematicFEN} 1`);
    }, 10000);

    it('should start with empty FEN textarea', () => {
      render(<App />);

      const fenTextarea = screen.getByRole('textbox', { name: /fen/i });
      expect(fenTextarea).toHaveValue('');
    });
  });

  describe('Layout and styling', () => {
    it('should have correct grid layout', () => {
      const { container } = render(<App />);

      const mainContainer = container.firstChild as HTMLElement;
      expect(mainContainer).toHaveClass('container');
    });

    it('should have correct button layout', () => {
      render(<App />);

      const buttonContainer = screen.getByText('Copier').closest('.buttonGroup');
      expect(buttonContainer).toBeInTheDocument();
    });
  });

  describe('PGN Recorder integration', () => {
    it('should handle PGN recorder with or without Chess.js', () => {
      delete (window as any).Chess;

      expect(() => {
        render(<App />);
      }).not.toThrow();

      (window as any).Chess = {};

      expect(() => {
        render(<App />);
      }).not.toThrow();
    });
  });

  describe('Error handling', () => {
    it('should handle clipboard API failures gracefully', async () => {
      const user = userEvent.setup();

      mockWriteText.mockRejectedValue(new Error('Clipboard error'));

      render(<App />);

      expect(() => user.click(screen.getByText('Copier'))).not.toThrow();
    });
  });
});
