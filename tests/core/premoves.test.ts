import { NeoChessBoard } from '../../src/core/NeoChessBoard';
import type { Square, Move, RulesAdapter, RulesMoveResponse, Premove, Color } from '../../src/core/types';

/**
 * @fileoverview Test suite for premove functionality in NeoChessBoard.
 * This file contains tests to ensure that premoves are correctly handled,
 * including setting, clearing, automatic execution, and interaction with board state changes.
 */

// --- Mocks and Setup ---

/**
 * Creates a mock chess engine for testing purposes.
 * This mock simulates basic chess engine behavior like setting/getting FEN,
 * determining the current turn, listing possible moves, and executing moves.
 * It has predefined responses for specific moves to facilitate controlled testing scenarios.
 * @returns A mock object mimicking a chess engine's interface.
 */
const createMockEngine = (): RulesAdapter => {
  let position = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';

  const scriptedMoves: Record<string, string> = {
    e2e4: 'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1',
    e7e5: 'rnbqkbnr/pppp1ppp/8/4p3/4P3/8/PPPP1PPP/RNBQKBNR w KQkq e6 0 2',
    g1f3: 'rnbqkbnr/pppp1ppp/8/4p3/4P3/5N2/PPPP1PPP/RNBQKB1R b KQkq - 1 2',
    g8f6: 'rnbqkb1r/pppp1ppp/5n2/4p3/4P3/5N2/PPPP1PPP/RNBQKB1R w KQkq - 2 3',
    b8c6: 'r1bqkb1r/pppp1ppp/2n2n2/4p3/4P3/5N2/PPPP1PPP/RNBQKB1R w KQkq - 2 3',
  };

  const moveMock = jest.fn<
    RulesMoveResponse | null | undefined,
    [
      | string
      | {
          from: Square;
          to: Square;
          promotion?: Move['promotion'];
        },
    ]
  >((move) => {
    if (typeof move === 'string') {
      return { ok: false, reason: 'unsupported' };
    }

    const key = `${move.from}${move.to}${move.promotion ?? ''}`.toLowerCase();
    const nextPosition = scriptedMoves[key];
    if (nextPosition) {
      position = nextPosition;
      return { ok: true, fen: position };
    }
    return { ok: false, reason: 'illegal move' };
  });

  return {
    /**
     * Sets the current FEN position of the mock engine.
     * @param fen The FEN string to set.
     */
    setFEN: jest.fn((fen: string) => {
      position = fen;
    }),
    /**
     * Gets the current FEN position from the mock engine.
     * @returns The current FEN string.
     */
    getFEN: jest.fn(() => position),
    /**
     * Determines the current turn based on the FEN string.
     * @returns 'w' for white's turn, 'b' for black's turn.
     */
    turn: jest.fn(() => position.split(' ')[1] as 'w' | 'b'),
    /**
     * Simulates moves available from a given square.
     * For testing, it always returns a fixed set of moves from 'e2'.
     * @returns An array of mock moves.
     */
    movesFrom: jest.fn((): Move[] => [
      { from: 'e2' as Square, to: 'e4' as Square },
      { from: 'e2' as Square, to: 'e3' as Square },
    ]),
    /**
     * Simulates executing a move.
     * It updates the FEN for specific predefined moves and returns a success/failure object.
     * @param move The move to execute.
     * @returns An object indicating if the move was successful and the new FEN if so.
     */
    move: moveMock,
    undo: jest.fn(() => false),
    isDraw: jest.fn(() => false),
    isInsufficientMaterial: jest.fn(() => false),
    isThreefoldRepetition: jest.fn(() => false),
  };
};

const wait = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms));

// --- Test Suite for Premoves ---

describe('Premoves', () => {
  let container: HTMLElement;
  let board: NeoChessBoard;
  let mockEngine: ReturnType<typeof createMockEngine>;

  /**
   * Sets up the testing environment before each test.
   * Creates a new DOM container, initializes the mock chess engine,
   * and instantiates NeoChessBoard with premoves enabled.
   */
  beforeEach(() => {
    container = document.createElement('div');
    document.body.append(container);

    mockEngine = createMockEngine();
    board = new NeoChessBoard(container, {
      allowPremoves: true,
      rulesAdapter: mockEngine,
      fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPP1PPP/RNBQKBNR w KQkq - 0 1',
    });
  });

  /**
   * Cleans up the testing environment after each test.
   * Destroys the NeoChessBoard instance and removes the DOM container.
   */
  afterEach(() => {
    board.destroy();
    container.remove();
  });

  // --- Test Cases ---

  /**
   * Verifies that a premove can be set programmatically using `setPremove`
   * and retrieved correctly using `getPremove`.
   */
  it('should allow setting a premove programmatically', () => {
    const premove: Premove = { from: 'e7', to: 'e5' };

    board.setPremove(premove);

    const currentPremove = board.getPremove();
    expect(currentPremove).toEqual(premove);
    expect(board.premove.getQueue('black')).toEqual([premove]);
  });

  /**
   * Verifies that premoves can be cleared using `clearPremove`,
   * resulting in no active premove on the board.
   */
  it('should clear premoves', () => {
    const premove: Premove = { from: 'e7', to: 'e5' };

    board.setPremove(premove);
    expect(board.getPremove()).toEqual(premove);

    board.clearPremove();
    expect(board.getPremove()).toBeNull();
    expect(board.premove.getQueue('black')).toHaveLength(0);
  });

  /**
   * Tests the automatic execution of a valid premove when the board position changes
   * and it becomes the turn of the player who set the premove.
   * It also verifies that the premove is cleared after successful execution.
   */
  it('should execute premove automatically when position changes', async () => {
    const premove: Premove = { from: 'e7', to: 'e5' };

    board.setPremove(premove);
    expect(board.getPremove()).toEqual(premove);

    const movePromise = new Promise<void>((resolve) => {
      board.on('move', ({ from, to }) => {
        expect(from).toBe('e7');
        expect(to).toBe('e5');
        resolve();
      });
    });

    const appliedPromise = new Promise<void>((resolve) => {
      board.on('premoveApplied', ({ from, to, color, remaining }) => {
        expect(from).toBe('e7');
        expect(to).toBe('e5');
        expect(color).toBe('black');
        expect(remaining).toBe(0);
        resolve();
      });
    });

    board.setPosition('rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1');

    await Promise.all([movePromise, appliedPromise]);
    await wait(200);
    expect(board.getPremove()).toBeNull();
    expect(board.premove.getQueue('black')).toHaveLength(0);
  });

  /**
   * Verifies that an invalid premove is automatically cleared when the board position changes
   * and the premove cannot be executed.
   */
  it('should clear invalid premoves when position changes', async () => {
    const invalidPremove: Premove = { from: 'e7', to: 'e3' };

    const invalidatedPromise = new Promise<void>((resolve) => {
      board.on('premoveInvalidated', ({ premove, reason }) => {
        expect(premove).toEqual(invalidPremove);
        expect(reason).toBe('illegal move');
        resolve();
      });
    });

    board.setPremove(invalidPremove);
    expect(board.getPremove()).toEqual(invalidPremove);

    board.setPosition('rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1');

    await invalidatedPromise;
    await wait(200);
    expect(board.getPremove()).toBeNull();
    expect(board.premove.getQueue('black')).toHaveLength(0);
  });

  it('skips execution and syncs display when premoves are disabled', () => {
    const boardPrivate = board as unknown as {
      _executePremoveIfValid: () => void;
      _syncPremoveDisplay: (preferredColor?: Color, render?: boolean) => void;
    };

    const premove: Premove = { from: 'e7', to: 'e5' };
    board.setPremove(premove, 'black');
    board.setAllowPremoves(false);

    const syncSpy = jest.spyOn(boardPrivate, '_syncPremoveDisplay');

    boardPrivate._executePremoveIfValid();

    expect(syncSpy).toHaveBeenCalledWith(undefined, false);
  });

  it('executes the next valid premove after clearing an invalid head of the queue', () => {
    const boardPrivate = board as unknown as {
      _executePremoveIfValid: () => void;
      _executePremove: (premove: Premove, color: Color) => void;
    };

    jest.useFakeTimers();
    try {
      board.premove.enable({ multi: true });
      board.setPremove({ from: 'e7', to: 'e3' }, 'black');
      const validPremove: Premove = { from: 'e7', to: 'e5' };
      board.setPremove(validPremove, 'black');
      board.setPosition('rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1');

      const executeSpy = jest.spyOn(boardPrivate, '_executePremove').mockImplementation(() => undefined);

      boardPrivate._executePremoveIfValid();

      expect(board.premove.getQueue('black')).toEqual([validPremove]);

      jest.runOnlyPendingTimers();

      expect(executeSpy).toHaveBeenCalledWith(validPremove, 'b');
    } finally {
      jest.useRealTimers();
    }
  });

  it('should support multiple queued premoves when multi enabled', async () => {
    board.premove.enable({ multi: true });

    board.setPremove({ from: 'e7', to: 'e5' });
    board.setPremove({ from: 'g8', to: 'f6' });

    expect(board.premove.getQueue('black')).toHaveLength(2);

    const appliedMoves: string[] = [];
    board.on('premoveApplied', ({ from, to }) => {
      appliedMoves.push(`${from}${to}`);
    });

    board.setPosition('rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1');
    await wait(200);
    expect(appliedMoves).toContain('e7e5');
    expect(board.premove.getQueue('black')).toHaveLength(1);

    board.setPosition('rnbqkbnr/pppp1ppp/8/4p3/4P3/5N2/PPPP1PPP/RNBQKB1R b KQkq - 1 2');
    await wait(200);

    expect(appliedMoves).toEqual(['e7e5', 'g8f6']);
    expect(board.premove.getQueue('black')).toHaveLength(0);
  });

  it('should honor color filters when enabling premoves', () => {
    board.premove.enable({ color: 'white' });

    board.setPremove({ from: 'e7', to: 'e5' });
    expect(board.premove.getQueue('black')).toHaveLength(0);

    board.setPremove({ from: 'g2', to: 'g3' }, 'white');
    expect(board.premove.getQueue('white')).toHaveLength(1);

    board.premove.disable('white');
    expect(board.premove.config().colors.white).toBe(false);
    expect(board.premove.getQueue('white')).toHaveLength(0);
  });

  /**
   * Ensures that premoves cannot be set when the `allowPremoves` option is disabled
   * during the NeoChessBoard initialization.
   */
  it('should not allow premoves when disabled', () => {
    // Destroy the existing board and create a new one with premoves disabled
    board.destroy();
    board = new NeoChessBoard(container, {
      allowPremoves: false,
      rulesAdapter: mockEngine,
    });

    const premove: Premove = { from: 'e7', to: 'e5' };

    board.setPremove(premove);

    // The premove should not be set because they are disabled
    expect(board.getPremove()).toBeNull();
    expect(board.premove.getQueue('black')).toHaveLength(0);
  });

  /**
   * Tests the ability to export and import premoves along with other drawings.
   * This ensures that premove state is correctly serialized and deserialized.
   */
  it('should export and import premoves with drawings', () => {
    const premove: Premove = { from: 'e7', to: 'e5' };

    board.setPremove(premove);

    const exported = board.exportDrawings();
    expect(exported).toBeTruthy();

    // Clear the premove and then re-import to verify
    board.clearPremove();
    expect(board.getPremove()).toBeNull();
    expect(board.premove.getQueue('black')).toHaveLength(0);

    board.importDrawings(exported!); // The '!' asserts that exported is not null
    expect(board.getPremove()).toEqual(premove);
    expect(board.premove.getQueue('black')).toEqual([premove]);
  });
});
