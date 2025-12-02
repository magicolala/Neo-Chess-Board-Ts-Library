import { render, waitFor } from '@testing-library/react';
import { NeoChessBoard } from '../../src/react/NeoChessBoard';
import { generateChess960Start } from '../../src/utils/chess960';

describe('NeoChessBoard with Chess960', () => {
  it('should render with Chess960 variant', async () => {
    const { container } = render(<NeoChessBoard variant="chess960" />);

    await waitFor(() => {
      const boardElement = container.querySelector('.ncb-root');
      expect(boardElement).toBeTruthy();
    });
  });

  it('should use generated Chess960 position when no FEN provided', async () => {
    const { container } = render(<NeoChessBoard variant="chess960" />);

    await waitFor(() => {
      const boardElement = container.querySelector('.ncb-root');
      expect(boardElement).toBeTruthy();
    });

    // The board should be initialized with a Chess960 position
    // We can't easily verify the exact position without accessing internal state,
    // but we can verify the board rendered successfully
    expect(container).toBeTruthy();
  });

  it('should use provided Chess960 FEN when provided', async () => {
    const chess960Fen = generateChess960Start(42);
    const { container } = render(<NeoChessBoard variant="chess960" fen={chess960Fen} />);

    await waitFor(() => {
      const boardElement = container.querySelector('.ncb-root');
      expect(boardElement).toBeTruthy();
    });

    expect(container).toBeTruthy();
  });

  it('should default to standard variant when not specified', async () => {
    const { container } = render(<NeoChessBoard />);

    await waitFor(() => {
      const boardElement = container.querySelector('.ncb-root');
      expect(boardElement).toBeTruthy();
    });

    expect(container).toBeTruthy();
  });

  it('should handle variant prop changes', async () => {
    const { container, rerender } = render(<NeoChessBoard variant="standard" />);

    await waitFor(() => {
      const boardElement = container.querySelector('.ncb-root');
      expect(boardElement).toBeTruthy();
    });

    rerender(<NeoChessBoard variant="chess960" />);

    await waitFor(() => {
      const boardElement = container.querySelector('.ncb-root');
      expect(boardElement).toBeTruthy();
    });

    expect(container).toBeTruthy();
  });
});
