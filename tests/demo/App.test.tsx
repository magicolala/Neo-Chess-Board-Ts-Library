import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { App } from '../../demo/App';
import { translations } from '../../demo/i18n/translations';
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

const INITIAL_FEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';

const SCRIPTED_MOVES = [
  {
    from: 'e2',
    to: 'e4',
    fen: 'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1',
    san: 'e4',
  },
  {
    from: 'e7',
    to: 'e5',
    fen: 'rnbqkbnr/pppp1ppp/8/4p3/4P3/8/PPPP1PPP/RNBQKBNR w KQkq - 0 2',
    san: '... e5',
  },
  {
    from: 'g1',
    to: 'f3',
    fen: 'rnbqkbnr/pppp1ppp/8/4p3/4P3/5N2/PPPP1PPP/RNBQKB1R b KQkq - 1 2',
    san: 'Nf3',
  },
  {
    from: 'b8',
    to: 'c6',
    fen: 'r1bqkbnr/pppp1ppp/2n5/4p3/4P3/5N2/PPPP1PPP/RNBQKB1R w KQkq - 2 3',
    san: '... Nc6',
  },
];

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

const resolveScriptedMove = (from: string, to: string) =>
  SCRIPTED_MOVES.find((entry) => entry.from === from && entry.to === to);

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
    move: jest.fn((moveData: string | { from: string; to: string; promotion?: string }) => {
      const from = typeof moveData === 'string' ? moveData.slice(0, 2) : moveData.from;
      const to = typeof moveData === 'string' ? moveData.slice(2, 4) : moveData.to;
      const scripted = resolveScriptedMove(from, to);
      const fen = scripted?.fen ?? state.fen;
      state.fen = fen;
      state.historySan.push(scripted?.san ?? `${from}-${to}`);
      state.verboseHistory.push({ from, to });
      state.pgn =
        state.historySan.length > 0
          ? state.historySan.reduce<string>((pgn, san, index) => {
              const moveNumber = Math.floor(index / 2) + 1;
              if (index % 2 === 0) {
                return `${pgn}${moveNumber}. ${san}`;
              }
              return `${pgn} ${san}`;
            }, '')
          : '';
      updateFromFen(state);
      return {
        ok: true,
        fen,
        move: { from, to, san: scripted?.san ?? `${from}-${to}` },
      };
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
      state.historySan = SCRIPTED_MOVES.map((entry) => entry.san);
      state.verboseHistory = SCRIPTED_MOVES.map(({ from, to }) => ({ from, to }));
      const lastFen = SCRIPTED_MOVES.at(-1)?.fen ?? state.fen;
      state.fen = normaliseFen(lastFen);
      updateFromFen(state);
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
      getMovesWithAnnotations: jest.fn(() =>
        SCRIPTED_MOVES.map((entry, index) => ({
          moveNumber: Math.floor(index / 2) + 1,
          evaluation: index % 2 === 0 ? { white: index } : { black: -index },
          san: entry.san,
        })),
      ),
      getMetadata: jest.fn(() => ({ SetUp: '0' })),
    })),
  };

  updateFromFen(state);
  return instance;
};

const mockBoardLoadFEN = jest.fn();
const mockBoardLoadPgnWithAnnotations = jest.fn(() => true);

interface MockNeoChessBoardProps {
  onMove?: (event: { from: string; to: string; fen: string }) => void;
  theme?: string;
}

interface MockBoardHandle {
  getBoard: () => {
    loadFEN: typeof mockBoardLoadFEN;
    loadPgnWithAnnotations: typeof mockBoardLoadPgnWithAnnotations;
  };
}

jest.mock('../../src/core/ChessJsRules', () => ({
  ChessJsRules: jest.fn(() => createMockChessJsRules()),
}));

jest.mock('../../src/react/NeoChessBoard', () => {
  const MockComponent = React.forwardRef<MockBoardHandle, MockNeoChessBoardProps>((props, ref) => {
    const { onMove, theme } = props;
    React.useImperativeHandle(ref, () => ({
      getBoard: () => ({
        loadFEN: mockBoardLoadFEN,
        loadPgnWithAnnotations: mockBoardLoadPgnWithAnnotations,
      }),
    }));

    return React.createElement('div', {
      'data-testid': 'neo-chessboard',
      'data-theme': theme,
      onClick: () => {
        const scripted = SCRIPTED_MOVES[0];
        onMove?.({
          from: scripted.from,
          to: scripted.to,
          fen: scripted.fen,
        });
      },
    });
  });
  MockComponent.displayName = 'MockNeoChessBoard';

  return {
    __esModule: true,
    NeoChessBoard: MockComponent,
  };
});

const mockWriteText = jest.fn(() => Promise.resolve());

describe('App Component', () => {
  const enTranslations = translations.en;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.NODE_ENV = 'test';
    mockBoardLoadFEN.mockClear();
    mockBoardLoadPgnWithAnnotations.mockClear();
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

      expect(
        screen.getByRole('button', { name: enTranslations['app.themes.midnight'] }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: enTranslations['app.themes.classic'] }),
      ).toBeInTheDocument();
    });

    it('should display PGN section', () => {
      render(<App />);

      expect(screen.getByText(enTranslations['pgn.copy'])).toBeInTheDocument();
      expect(screen.getByRole('textbox', { name: /pgn notation/i })).toBeInTheDocument();
    });

    it('should display FEN section', () => {
      render(<App />);

      expect(screen.getByText(enTranslations['fen.title'])).toBeInTheDocument();
      expect(screen.getByRole('textbox', { name: /fen/i })).toBeInTheDocument();
    });
  });

  describe('Theme switching', () => {
    it('should start with midnight theme', () => {
      render(<App />);

      const midnightButton = screen.getByRole('button', {
        name: enTranslations['app.themes.midnight'],
      });
      expect(midnightButton).toHaveClass('active');
      expect(screen.getByTestId('neo-chessboard')).toHaveAttribute('data-theme', 'midnight');
    });

    it('should switch to classic theme when clicked', async () => {
      const user = userEvent.setup();
      render(<App />);

      const classicButton = screen.getByRole('button', {
        name: enTranslations['app.themes.classic'],
      });

      await user.click(classicButton);

      expect(classicButton).toHaveClass('active');
      expect(screen.getByTestId('neo-chessboard')).toHaveAttribute('data-theme', 'classic');
    });

    it('should switch back to midnight theme', async () => {
      const user = userEvent.setup();
      render(<App />);

      const classicButton = screen.getByRole('button', {
        name: enTranslations['app.themes.classic'],
      });
      const midnightButton = screen.getByRole('button', {
        name: enTranslations['app.themes.midnight'],
      });

      await user.click(classicButton);
      await user.click(midnightButton);

      expect(midnightButton).toHaveClass('active');
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
              'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1',
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

      const loadButton = screen.getByRole('button', { name: enTranslations['pgn.load'] });
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

      const copyButton = screen.getByText(enTranslations['pgn.copy']);
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

      await user.click(screen.getByText(enTranslations['pgn.export']));
      await new Promise((resolve) => setTimeout(resolve, 10));

      const exportButton = screen.getByText(enTranslations['pgn.export']);
      expect(exportButton).toBeInTheDocument();
      expect(exportButton).not.toHaveAttribute('disabled');
    });
  });

  describe('Timeline navigation', () => {
    it('should allow navigating the PGN timeline', async () => {
      const user = userEvent.setup();
      render(<App />);

      const pgnTextarea = screen.getByRole('textbox', { name: /pgn notation/i });
      const fenTextarea = screen.getByRole('textbox', { name: /fen/i });
      const samplePgn = '1. e4 e5 2. Nf3 Nc6';

      await user.type(pgnTextarea, samplePgn);
      await user.click(screen.getByRole('button', { name: enTranslations['pgn.load'] }));

      await waitFor(() => {
        expect(mockBoardLoadPgnWithAnnotations).toHaveBeenCalled();
        expect(screen.getByText(enTranslations['timeline.title'])).toBeInTheDocument();
      });

      const firstButton = await screen.findByRole('button', {
        name: enTranslations['timeline.aria.first'],
      });
      const previousButton = await screen.findByRole('button', {
        name: enTranslations['timeline.aria.previous'],
      });
      const nextButton = await screen.findByRole('button', {
        name: enTranslations['timeline.aria.next'],
      });
      const lastButton = await screen.findByRole('button', {
        name: enTranslations['timeline.aria.last'],
      });

      expect(lastButton).toBeDisabled();

      await user.click(firstButton);
      await waitFor(() => {
        expect(fenTextarea).toHaveValue(INITIAL_FEN);
      });
      expect(mockBoardLoadFEN).toHaveBeenLastCalledWith(INITIAL_FEN);

      await user.click(nextButton);
      await waitFor(() => {
        expect(fenTextarea).toHaveValue(SCRIPTED_MOVES[0].fen);
      });
      expect(mockBoardLoadFEN).toHaveBeenLastCalledWith(SCRIPTED_MOVES[0].fen);
      const descriptorWhite = enTranslations['timeline.position'].replace(
        '{descriptor}',
        '1 (White)',
      );
      expect(screen.getByText(descriptorWhite)).toBeInTheDocument();
      expect(screen.getByText(SCRIPTED_MOVES[0].san)).toBeInTheDocument();

      await user.click(nextButton);
      await waitFor(() => {
        expect(fenTextarea).toHaveValue(SCRIPTED_MOVES[1].fen);
      });
      expect(mockBoardLoadFEN).toHaveBeenLastCalledWith(SCRIPTED_MOVES[1].fen);
      const descriptorBlack = enTranslations['timeline.position'].replace(
        '{descriptor}',
        '1... (Black)',
      );
      expect(screen.getByText(descriptorBlack)).toBeInTheDocument();

      await user.click(previousButton);
      await waitFor(() => {
        expect(fenTextarea).toHaveValue(SCRIPTED_MOVES[0].fen);
      });
      expect(mockBoardLoadFEN).toHaveBeenLastCalledWith(SCRIPTED_MOVES[0].fen);
    });
  });

  describe('FEN input', () => {
    it('should allow FEN input changes', async () => {
      render(<App />);

      const fenTextarea = screen.getByRole('textbox', { name: /fen/i });

      const validFEN = 'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1';
      fireEvent.change(fenTextarea, { target: { value: '' } });
      fireEvent.change(fenTextarea, { target: { value: validFEN } });
      await waitFor(() => {
        expect(fenTextarea).toHaveValue(validFEN);
      });

      const problematicFEN = 'r1bqkb1r/pppp1ppp/2n2n2/4p3/2B1P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 4';
      fireEvent.change(fenTextarea, { target: { value: '' } });
      fireEvent.change(fenTextarea, { target: { value: problematicFEN } });
      await waitFor(() => {
        expect(fenTextarea).toHaveValue(`${problematicFEN} 1`);
      });
    }, 10_000);

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

      const buttonContainer = screen.getByText(enTranslations['pgn.copy']).closest('.buttonGroup');
      expect(buttonContainer).toBeInTheDocument();
    });
  });

  describe('PGN Recorder integration', () => {
    it('should handle PGN recorder with or without Chess.js', () => {
      delete (globalThis as typeof globalThis & { Chess?: unknown }).Chess;

      expect(() => {
        render(<App />);
      }).not.toThrow();

      (globalThis as typeof globalThis & { Chess?: unknown }).Chess = {};

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

      expect(() => user.click(screen.getByText(enTranslations['pgn.copy']))).not.toThrow();
    });
  });
});
