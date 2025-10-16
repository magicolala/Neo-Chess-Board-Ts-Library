import { NeoChessBoard } from '../../src/core/NeoChessBoard';
import type { Square, Move, RulesAdapter, RulesMoveResponse, Premove } from '../../src/core/types';

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

    if (move.from === 'e2' && move.to === 'e4') {
      position = 'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1';
      return { ok: true, fen: position };
    }
    if (move.from === 'e7' && move.to === 'e5') {
      position = 'rnbqkbnr/pppp1ppp/8/4p3/4P3/8/PPPP1PPP/RNBQKBNR w KQkq e6 0 2';
      return { ok: true, fen: position };
    }
    if (move.from === 'g1' && move.to === 'f3') {
      position = 'rnbqkbnr/pppp1ppp/8/4p3/4P3/5N2/PPPP1PPP/RNBQKB1R b KQkq - 1 2';
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
    document.body.appendChild(container);

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
    document.body.removeChild(container);
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
  });

  /**
   * Tests the automatic execution of a valid premove when the board position changes
   * and it becomes the turn of the player who set the premove.
   * It also verifies that the premove is cleared after successful execution.
   */
  it('should execute premove automatically when position changes', (done) => {
    const premove: Premove = { from: 'e7', to: 'e5' };

    // Set a premove for black
    board.setPremove(premove);

    // Verify that the premove is stored
    expect(board.getPremove()).toEqual(premove);

    // Listen for move events to confirm premove execution
    board.on('move', ({ from, to }) => {
      // This move should be the automatic premove for black
      expect(from).toBe('e7');
      expect(to).toBe('e5');

      // The premove should be cleared after execution
      // A small delay is added to ensure the asynchronous clear operation completes.
      const ASYNC_OPERATION_DELAY = 200; // Milliseconds
      setTimeout(() => {
        expect(board.getPremove()).toBeNull();
        done();
      }, ASYNC_OPERATION_DELAY);
    });

    // Simulate a white move that triggers the premove execution
    // Change the position to make it black's turn
    board.setPosition('rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1');
  });

  /**
   * Verifies that an invalid premove is automatically cleared when the board position changes
   * and the premove cannot be executed.
   */
  it('should clear invalid premoves when position changes', (done) => {
    const invalidPremove: Premove = { from: 'e7', to: 'e3' }; // Invalid move for black from initial position

    board.setPremove(invalidPremove);
    expect(board.getPremove()).toEqual(invalidPremove);

    // Change the position (which should try to execute the invalid premove)
    board.setPosition('rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1');

    // The invalid premove should be cleared
    // A small delay is added to ensure the asynchronous clear operation completes.
    const ASYNC_OPERATION_DELAY = 200; // Milliseconds
    setTimeout(() => {
      expect(board.getPremove()).toBeNull();
      done();
    }, ASYNC_OPERATION_DELAY);
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

    board.importDrawings(exported!); // The '!' asserts that exported is not null
    expect(board.getPremove()).toEqual(premove);
  });
});
