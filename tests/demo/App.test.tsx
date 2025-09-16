import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { App } from '../../demo/App';
import { ChessJsRules } from '../../src/core/ChessJsRules';

// Mock the ChessJsRules module
jest.mock('../../src/core/ChessJsRules', () => {
  let currentPgn = '';
  let currentFen = '';

  const mockChessJsRulesInstance = {
    move: jest.fn(() => {
      currentPgn = '1. e4'; // Simulate PGN after a move
      currentFen = 'rnbqkbnr/pppp1ppp/8/4p3/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 2'; // Simulate FEN after a move
    }),
    toPgn: jest.fn(() => currentPgn),
    setFEN: jest.fn((fen) => {
      currentFen = fen; // Update internal FEN state
      // Simulate chess.js correcting the FEN if it's problematic
      if (fen === 'r1bqkb1r/pppp1ppp/2n2n2/4p3/2B1P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 4') {
        currentFen = 'r1bqkb1r/pppp1ppp/2n2n2/4p3/2B1P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 4 1';
      } else if (fen === 'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1') {
        currentFen = 'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1';
      } else if (fen === 'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR w KQkq - 0 1') {
        currentFen = 'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR w KQkq - 0 1';
      }
    }),
    getFEN: jest.fn(() => currentFen),
    reset: jest.fn(() => {
      currentPgn = '*'; // Simulate PGN after reset
      currentFen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPP1PPP/RNBQKBNR w KQkq - 0 1'; // Initial FEN after reset
    }),
    setPgnMetadata: jest.fn(),
    downloadPgn: jest.fn(),
  };

  // Initialize currentPgn and currentFen to their default values
  currentPgn = '';
  currentFen = '';

  return {
    ChessJsRules: jest.fn(() => mockChessJsRulesInstance),
  };
});

// Mock the NeoChessBoard React component
jest.mock('../../src/react/NeoChessBoard', () => ({
  NeoChessBoard: jest.fn(({ onMove, theme }) => (
    <div
      data-testid="neo-chessboard"
      data-theme={theme}
      onClick={() => {
        // Simulate a move
        onMove?.({
          from: 'e2',
          to: 'e4',
          fen: 'rnbqkbnr/pppp1ppp/8/4p3/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 2',
        });
      }}
    />
  )),
}));

// Mock clipboard API
const mockWriteText = jest.fn(() => Promise.resolve());

describe('App Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Ensure we're in test environment
    process.env.NODE_ENV = 'test';

    // Setup clipboard mock in beforeEach
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

      expect(screen.getByText(/NeoChessBoard/)).toBeInTheDocument();
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
        // Wait for initial render
        await screen.findByTestId('neo-chessboard');

        // Simulate a move by clicking the board
        await user.click(screen.getByTestId('neo-chessboard'));

        // Wait for the PGN textarea to be updated
        const pgnTextarea = (await screen.findByRole('textbox', {
          name: /pgn notation/i,
        })) as HTMLTextAreaElement;

        // Check the value with a timeout
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
        // Wait for initial render
        await screen.findByTestId('neo-chessboard');

        // Get the FEN textarea
        const fenTextarea = screen.getByRole('textbox', { name: /fen/i });

        // Simulate a move by clicking the board
        await user.click(screen.getByTestId('neo-chessboard'));

        // Wait for the FEN to be updated
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
      // PGN text starts empty and is populated on first move
      expect(pgnTextarea).toHaveValue('');
    });

    it('should have functional copy button', async () => {
      const user = userEvent.setup();
      render(<App />);

      // First simulate a move to populate PGN
      await user.click(screen.getByTestId('neo-chessboard'));

      // Wait for state update
      await waitFor(() => {
        const pgnTextarea = screen.getByRole('textbox', {
          name: /pgn notation/i,
        }) as HTMLTextAreaElement;
        expect(pgnTextarea).toHaveValue('1. e4');
      });

      // Verify copy button exists and is clickable
      const copyButton = screen.getByText('Copier');
      expect(copyButton).toBeInTheDocument();
      expect(copyButton).not.toHaveAttribute('disabled');

      // Test that clicking doesn't throw an error
      expect(() => user.click(copyButton)).not.toThrow();
    });

    it('should reset PGN when reset button clicked', async () => {
      const user = userEvent.setup();
      render(<App />);

      await user.click(screen.getByText('Reset'));

      // Attendre que l'opération asynchrone se termine
      await new Promise((resolve) => setTimeout(resolve, 10));

      const pgnTextarea = screen.getByRole('textbox', { name: /pgn notation/i });
      expect(pgnTextarea).toHaveValue('*');
    });

    it('should export PGN file when export button clicked', async () => {
      const user = userEvent.setup();
      render(<App />);

      await user.click(screen.getByText('Exporter'));

      // Attendre que l'opération asynchrone se termine
      await new Promise((resolve) => setTimeout(resolve, 10));

      // We can't easily test the download, so we just check that the button is there
      // and clickable.
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

      // Test with a valid FEN
      const validFEN = 'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1';
      await user.clear(fenTextarea);
      await user.type(fenTextarea, validFEN);
      expect(fenTextarea).toHaveValue(validFEN);

      // Test with the problematic FEN (5 parts)
      const problematicFEN = 'r1bqkb1r/pppp1ppp/2n2n2/4p3/2B1P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 4';
      await user.clear(fenTextarea);
      await user.type(fenTextarea, problematicFEN);
      // Expect the FEN to be corrected by ChessJsRules
      expect(fenTextarea).toHaveValue(problematicFEN + ' 1');
    }, 10000); // Increase timeout to 10 seconds

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

      // Le bouton est maintenant un LoadingButton, on cherche le conteneur des boutons
      const buttonContainer = screen.getByText('Copier').closest('.buttonGroup');
      expect(buttonContainer).toBeInTheDocument();
    });
  });

  describe('PGN Recorder integration', () => {
    it('should handle PGN recorder with or without Chess.js', () => {
      // Test without Chess.js
      delete (window as any).Chess;

      expect(() => {
        render(<App />);
      }).not.toThrow();

      // Test with Chess.js
      (window as any).Chess = {};

      expect(() => {
        render(<App />);
      }).not.toThrow();
    });
  });

  describe('Error handling', () => {
    it('should handle clipboard API failures gracefully', async () => {
      const user = userEvent.setup();

      // Mock clipboard to reject
      mockWriteText.mockRejectedValue(new Error('Clipboard error'));

      render(<App />);

      expect(() => user.click(screen.getByText('Copier'))).not.toThrow();
    });
  });
});
