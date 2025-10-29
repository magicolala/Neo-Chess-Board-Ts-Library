import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Playground from '../../demo/src/pages/Playground';

const INITIAL_FEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';

const SCRIPTED_MOVES = [
  {
    from: 'e2',
    to: 'e4',
    san: 'e4',
    fen: 'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1',
  },
  {
    from: 'e7',
    to: 'e5',
    san: 'e5',
    fen: 'rnbqkbnr/pppp1ppp/8/4p3/4P3/8/PPPP1PPP/RNBQKBNR w KQkq - 0 2',
  },
  {
    from: 'g1',
    to: 'f3',
    san: 'Nf3',
    fen: 'rnbqkbnr/pppp1ppp/8/4p3/4P3/5N2/PPPP1PPP/RNBQKB1R b KQkq - 1 2',
  },
  {
    from: 'b8',
    to: 'c6',
    san: 'Nc6',
    fen: 'r1bqkbnr/pppp1ppp/2n5/4p3/4P3/5N2/PPPP1PPP/RNBQKB1R w KQkq - 2 3',
  },
] as const;

type ScriptedMove = (typeof SCRIPTED_MOVES)[number];

const buildPgnFromMoves = (count: number): string => {
  const moves = SCRIPTED_MOVES.slice(0, count).map((move) => move.san);
  return moves
    .map((san, index) => {
      const moveNumber = Math.floor(index / 2) + 1;
      return index % 2 === 0 ? `${moveNumber}. ${san}` : san;
    })
    .reduce<string>((acc, token, index) => {
      if (index === 0) {
        return token;
      }
      if (index % 2 === 0) {
        return `${acc} ${token}`;
      }
      return `${acc} ${token}`;
    }, '')
    .trim();
};

const FULL_PGN = buildPgnFromMoves(SCRIPTED_MOVES.length);

const boardState = {
  moveIndex: 0,
  currentFen: INITIAL_FEN,
  pgn: '',
};

jest.mock('../../demo/src/utils/analytics', () => ({
  ANALYTICS_EVENTS: {
    PAGE_VIEW: 'page',
    THEME_SWITCH: 'theme',
    IMPORT_PGN: 'import',
    COPY_CODE: 'copy',
  },
  trackEvent: jest.fn(),
  trackPageView: jest.fn(),
  configureAnalytics: jest.fn(),
}));

jest.mock('../../demo/src/utils/fpsMeter', () => ({
  createFpsMeter: jest.fn(() => ({
    start: jest.fn(),
    stop: jest.fn(),
    subscribe: jest.fn(() => jest.fn()),
  })),
}));

jest.mock('../../demo/src/utils/snippetBuilder', () => ({
  buildPlaygroundSnippets: jest.fn(() => []),
}));

jest.mock('../../src/extensions/PromotionDialogExtension', () => ({
  createPromotionDialogExtension: jest.fn(() => ({ id: 'promotion-extension' })),
}));

jest.mock('../../src/react', () => {
  const React = require('react');

  const submitMoveFromScript = () => {
    const move: ScriptedMove | undefined = SCRIPTED_MOVES[boardState.moveIndex];
    if (!move) {
      return false;
    }
    boardState.moveIndex += 1;
    boardState.currentFen = move.fen;
    boardState.pgn = buildPgnFromMoves(boardState.moveIndex);
    return true;
  };

  const getBoardApi = () => ({
    exportPgnWithAnnotations: jest.fn(() => boardState.pgn),
    exportPGN: jest.fn(() => boardState.pgn),
    loadPgnWithAnnotations: jest.fn(() => true),
    submitMove: jest.fn(submitMoveFromScript),
    reset: jest.fn(() => {
      boardState.moveIndex = 0;
      boardState.currentFen = INITIAL_FEN;
      boardState.pgn = '';
      return true;
    }),
    rules: {
      getPgnNotation: () => ({
        toPgnWithAnnotations: () => boardState.pgn || FULL_PGN,
      }),
    },
  });

  const MockNeoChessBoard = React.forwardRef(
    (
      props: Record<string, unknown>,
      ref: React.ForwardedRef<{ getBoard: ReturnType<typeof getBoardApi> }>,
    ) => {
      const { onMove } = props as {
        onMove?: (event: { from: string; to: string; fen: string }) => void;
      };

      React.useImperativeHandle(ref, () => ({
        getBoard: getBoardApi,
      }));

      React.useEffect(() => {
        boardState.currentFen = props.fen as string;
      }, [props.fen]);

      return React.createElement('button', {
        type: 'button',
        'data-testid': 'mock-board',
        'data-fen': props.fen,
        onClick: () => {
          const move = SCRIPTED_MOVES[boardState.moveIndex];
          if (!move) {
            return;
          }
          boardState.moveIndex += 1;
          boardState.currentFen = move.fen;
          boardState.pgn = buildPgnFromMoves(boardState.moveIndex);
          onMove?.({ from: move.from, to: move.to, fen: move.fen });
        },
      });
    },
  );

  MockNeoChessBoard.displayName = 'MockNeoChessBoard';

  return {
    NeoChessBoard: MockNeoChessBoard,
  };
});

jest.mock('../../src/core/ChessJsRules', () => {
  return {
    ChessJsRules: class MockChessJsRules {
      private fen: string;
      private movePointer: number;
      private pgn: string;
      private history: ScriptedMove[];
      private readonly initialFen: string;

      constructor(initialFen?: string) {
        this.initialFen = initialFen ?? INITIAL_FEN;
        this.fen = this.initialFen;
        this.movePointer = 0;
        this.pgn = '';
        this.history = [];
      }

      loadPgn(pgn: string): boolean {
        const trimmed = pgn.trim();
        const tokens = trimmed ? trimmed.split(/\s+/).filter((token) => !token.endsWith('.')) : [];
        const moveCount = Math.min(tokens.length, SCRIPTED_MOVES.length);
        this.history = SCRIPTED_MOVES.slice(0, moveCount);
        this.pgn = trimmed || buildPgnFromMoves(this.history.length);
        this.movePointer = 0;
        this.fen = this.history.length
          ? this.history[this.history.length - 1].fen
          : this.initialFen;
        return true;
      }

      getPgnNotation() {
        return {
          getMetadata: () => ({ SetUp: '0' }),
          toPgnWithAnnotations: () => this.pgn || FULL_PGN,
        };
      }

      getChessInstance() {
        const source = this.history.length ? this.history : SCRIPTED_MOVES;
        return {
          history: ({ verbose }: { verbose?: boolean } = {}) => {
            if (verbose) {
              return source.map(({ from, to }) => ({ from, to }));
            }
            return source.map((move) => move.san);
          },
        };
      }

      move(moveData: string | { from: string; to: string }) {
        const from = typeof moveData === 'string' ? moveData.slice(0, 2) : moveData.from;
        const to = typeof moveData === 'string' ? moveData.slice(2, 4) : moveData.to;
        const move = SCRIPTED_MOVES[this.movePointer];
        if (!move || move.from !== from || move.to !== to) {
          return { ok: false, reason: 'invalid move' };
        }
        this.fen = move.fen;
        this.movePointer += 1;
        return { ok: true, fen: move.fen, move: { from, to, san: move.san } };
      }

      getFEN() {
        return this.fen;
      }
    },
  };
});

describe('Playground navigation', () => {
  beforeEach(() => {
    boardState.moveIndex = 0;
    boardState.currentFen = INITIAL_FEN;
    boardState.pgn = '';
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('navigates between moves using previous and next controls', async () => {
    const user = userEvent.setup();
    render(<Playground />);

    const board = await screen.findByTestId('mock-board');

    await user.click(board);
    await user.click(board);

    await waitFor(() => {
      expect(board).toHaveAttribute('data-fen', SCRIPTED_MOVES[1].fen);
    });

    const [previousButton] = await screen.findAllByRole('button', { name: /^Previous$/i });
    const [nextButton] = await screen.findAllByRole('button', { name: /^Next$/i });

    await waitFor(() => {
      expect(previousButton).not.toBeDisabled();
    });
    expect(nextButton).toBeDisabled();

    await user.click(previousButton);

    await waitFor(() => {
      expect(board).toHaveAttribute('data-fen', SCRIPTED_MOVES[0].fen);
    });

    const backLogs = await screen.findAllByText(/Moved back to Move 1 \(White\)\./i);
    expect(backLogs.length).toBeGreaterThan(0);

    await waitFor(() => {
      expect(nextButton).not.toBeDisabled();
    });

    await user.click(nextButton);

    await waitFor(() => {
      expect(board).toHaveAttribute('data-fen', SCRIPTED_MOVES[1].fen);
    });

    const forwardLogs = await screen.findAllByText(/Moved forward to Move 1 \(Black\)\./i);
    expect(forwardLogs.length).toBeGreaterThan(0);
  });
});
