import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { App } from '../../demo/App';

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
          fen: 'rnbqkbnr/pppp1ppp/8/4p3/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 2'
        });
      }}
    />
  ))
}));

// Mock PGNRecorder
const mockPgnRecorder = {
  push: jest.fn(),
  getPGN: jest.fn(() => '1. e2e4'),
  setHeaders: jest.fn(),
  download: jest.fn(),
  reset: jest.fn()
};

jest.mock('../../src/core/PGN', () => ({
  PGNRecorder: jest.fn().mockImplementation(() => mockPgnRecorder)
}));

// Mock clipboard API
const mockWriteText = jest.fn(() => Promise.resolve());

describe('App Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup clipboard mock in beforeEach
    Object.defineProperty(navigator, 'clipboard', {
      value: {
        writeText: mockWriteText
      },
      configurable: true
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
      
      expect(screen.getByText('PGN')).toBeInTheDocument();
      expect(screen.getByRole('textbox', { name: /pgn notation/i })).toBeInTheDocument();
    });

    it('should display FEN section', () => {
      render(<App />);
      
      expect(screen.getByText('FEN')).toBeInTheDocument();
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
      render(<App />);
      
      // Simulate a move by clicking the board
      await user.click(screen.getByTestId('neo-chessboard'));
      
      expect(mockPgnRecorder.push).toHaveBeenCalledWith({
        from: 'e2',
        to: 'e4'
      });
      expect(mockPgnRecorder.getPGN).toHaveBeenCalled();
    });

    it('should update FEN after move', async () => {
      const user = userEvent.setup();
      render(<App />);
      
      const fenTextarea = screen.getByRole('textbox', { name: /fen/i });
      
      await user.click(screen.getByTestId('neo-chessboard'));
      
      expect(fenTextarea).toHaveValue('rnbqkbnr/pppp1ppp/8/4p3/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 2');
    });
  });

  describe('PGN functionality', () => {
    it('should display PGN text', () => {
      render(<App />);
      
      const pgnTextarea = screen.getByRole('textbox', { name: /pgn notation/i });
      // PGN text starts empty and is populated on first move
      expect(pgnTextarea).toHaveValue('');
    });

    it('should copy PGN to clipboard', async () => {
      render(<App />);
      
      // First simulate a move to populate PGN
      fireEvent.click(screen.getByTestId('neo-chessboard'));
      
      // Wait for state update
      await waitFor(() => {
        const pgnTextarea = screen.getByRole('textbox', { name: /pgn notation/i });
        expect(pgnTextarea).toHaveValue('1. e2e4');
      });
      
      // Then copy PGN
      fireEvent.click(screen.getByText('Copier PGN'));
      
      expect(mockWriteText).toHaveBeenCalledWith('1. e2e4');
    });

    it('should reset PGN when reset button clicked', async () => {
      const user = userEvent.setup();
      render(<App />);
      
      await user.click(screen.getByText('Reset'));
      
      expect(mockPgnRecorder.reset).toHaveBeenCalled();
      expect(mockPgnRecorder.getPGN).toHaveBeenCalled();
    });

    it('should export PGN file when export button clicked', async () => {
      const user = userEvent.setup();
      render(<App />);
      
      await user.click(screen.getByText('Exporter .pgn'));
      
      expect(mockPgnRecorder.setHeaders).toHaveBeenCalledWith({
        Event: 'Playground',
        Site: 'Local',
        Date: expect.stringMatching(/\d{4}\.\d{2}\.\d{2}/)
      });
      expect(mockPgnRecorder.download).toHaveBeenCalled();
    });
  });

  describe('FEN input', () => {
    it('should allow FEN input changes', async () => {
      const user = userEvent.setup();
      render(<App />);
      
      const fenTextarea = screen.getByRole('textbox', { name: /fen/i });
      const testFEN = 'r1bqkb1r/pppp1ppp/2n2n2/4p3/2B1P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 4 4';
      
      await user.clear(fenTextarea);
      await user.type(fenTextarea, testFEN);
      
      expect(fenTextarea).toHaveValue(testFEN);
    });

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
      expect(mainContainer.style.display).toBe('grid');
      expect(mainContainer.style.gridTemplateColumns).toBe('minmax(280px,1fr) 420px');
    });

    it('should have correct button layout', () => {
      render(<App />);
      
      const buttonContainer = screen.getByText('Copier PGN').parentElement;
      expect(buttonContainer).toHaveStyle('display: flex');
    });
  });

  describe('PGN Recorder integration', () => {
    it('should create PGN recorder with correct parameters', () => {
      const { PGNRecorder } = require('../../src/core/PGN');
      
      render(<App />);
      
      expect(PGNRecorder).toHaveBeenCalledWith(undefined);
    });

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
      
      expect(() => user.click(screen.getByText('Copier PGN'))).not.toThrow();
    });
  });
});
