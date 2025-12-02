/**
 * Tests for LegalMovesWorker
 *
 * Note: These tests focus on the Worker logic that can be tested
 * without actually spawning a Worker (which requires a browser environment)
 */

import { LightRules } from '../../src/core/LightRules';
import { START_FEN } from '../../src/core/utils';

describe('LegalMovesWorker Logic', () => {
  // Test the core logic that would run in the Worker
  describe('calculateAllMoves', () => {
    it('should calculate all legal moves from starting position', () => {
      const rules = new LightRules();
      rules.setFEN(START_FEN);

      const allMoves: Array<{ from: string; to: string }> = [];
      const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'] as const;
      const ranks = ['1', '2', '3', '4', '5', '6', '7', '8'] as const;

      for (const file of files) {
        for (const rank of ranks) {
          const square = `${file}${rank}` as const;
          const moves = rules.movesFrom(square);
          allMoves.push(...moves.map((m) => ({ from: m.from, to: m.to })));
        }
      }

      // Starting position should have 20 legal moves
      expect(allMoves.length).toBe(20);
      expect(allMoves).toContainEqual({ from: 'e2', to: 'e3' });
      expect(allMoves).toContainEqual({ from: 'e2', to: 'e4' });
      expect(allMoves).toContainEqual({ from: 'g1', to: 'f3' });
      expect(allMoves).toContainEqual({ from: 'g1', to: 'h3' });
    });

    it('should calculate moves from a specific square', () => {
      const rules = new LightRules();
      rules.setFEN(START_FEN);

      const moves = rules.movesFrom('e2');
      expect(moves.length).toBe(2);
      expect(moves).toContainEqual({ from: 'e2', to: 'e3' });
      expect(moves).toContainEqual({ from: 'e2', to: 'e4' });
    });

    it('should handle complex positions', () => {
      const complexFen = 'r1bqkb1r/pppp1ppp/2n2n2/4p3/2B1P3/5N2/PPPP1PPP/RNBQK2R b KQkq - 4 4';
      const rules = new LightRules();
      rules.setFEN(complexFen);

      const moves = rules.movesFrom('e8');
      // King should have some legal moves
      expect(moves.length).toBeGreaterThan(0);
    });
  });

  describe('calculateMovesFrom', () => {
    it('should return empty array for empty square', () => {
      const rules = new LightRules();
      rules.setFEN(START_FEN);

      const moves = rules.movesFrom('e4');
      expect(moves).toEqual([]);
    });

    it('should return empty array for opponent piece', () => {
      const rules = new LightRules();
      rules.setFEN(START_FEN);

      // Black's turn, but trying to get moves for white piece
      rules.setFEN('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR b KQkq - 0 1');
      const moves = rules.movesFrom('e2');
      expect(moves).toEqual([]);
    });
  });
});

describe('LegalMovesWorkerManager', () => {
  // Mock Worker for testing
  let mockWorker: {
    postMessage: jest.Mock;
    terminate: jest.Mock;
    addEventListener: jest.Mock;
  };
  let messageHandler: ((event: MessageEvent) => void) | null = null;
  let errorHandler: ((event: ErrorEvent) => void) | null = null;
  let lastRequestId: string | null = null;
  let LegalMovesWorkerManager: typeof import('../../src/core/LegalMovesWorkerManager').LegalMovesWorkerManager;

  beforeEach(async () => {
    mockWorker = {
      postMessage: jest.fn(),
      terminate: jest.fn(),
      addEventListener: jest.fn(),
    };

    // Mock Worker constructor
    globalThis.Worker = jest.fn().mockImplementation(() => mockWorker) as unknown as typeof Worker;

    // Capture event handlers registered by the manager during construction
    mockWorker.addEventListener.mockImplementation((event: string, handler: unknown) => {
      if (event === 'message') messageHandler = handler as (ev: MessageEvent) => void;
      if (event === 'error') errorHandler = handler as (ev: ErrorEvent) => void;
    });

    // Capture posted messages to extract request IDs used by the manager
    (mockWorker.postMessage as jest.Mock).mockImplementation((message: unknown) => {
      const msg = message as { id?: string; type?: string; [key: string]: unknown };
      if (msg && msg.id) {
        lastRequestId = msg.id as string;
      }

      // Auto-respond to calculateAllMoves requests so sendRequest resolves in tests
      if (msg && msg.id && msg.type === 'calculateAllMoves') {
        setTimeout(() => {
          if (messageHandler) {
            messageHandler({
              data: {
                type: 'success',
                id: msg.id,
                moves: [{ from: 'e2', to: 'e4' }],
              },
            } as MessageEvent);
          }
        }, 0);
      }
    });

    const module = await import('../../src/core/LegalMovesWorkerManager');
    LegalMovesWorkerManager = module.LegalMovesWorkerManager;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should initialize Worker when available', () => {
    const manager = new LegalMovesWorkerManager();

    expect(globalThis.Worker).toHaveBeenCalled();
    expect(manager.isAvailable()).toBe(true);
  });

  it('should handle Worker unavailability gracefully', () => {
    // Make Worker constructor throw
    (globalThis.Worker as jest.Mock) = jest.fn().mockImplementation(() => {
      throw new Error('Worker not supported');
    });

    const manager = new LegalMovesWorkerManager();

    expect(manager.isAvailable()).toBe(false);
  });

  it('should send calculateAllMoves request', async () => {
    const manager = new LegalMovesWorkerManager();

    // Mock response - use request id captured from postMessage
    const mockResponse = {
      type: 'success',
      id: lastRequestId,
      moves: [{ from: 'e2', to: 'e4' }],
    };

    const promise = manager.calculateAllMoves(START_FEN);

    // Wait for the message to be posted and ID to be captured
    await new Promise((resolve) => setTimeout(resolve, 0));

    // Simulate Worker response using the handler captured during construction
    if (messageHandler && lastRequestId) {
      messageHandler({ data: mockResponse } as MessageEvent);
    }

    const result = await promise;
    expect(result).toEqual([{ from: 'e2', to: 'e4' }]);
    expect(mockWorker.postMessage).toHaveBeenCalled();
  });

  it('should handle Worker errors', async () => {
    const manager = new LegalMovesWorkerManager();

    const promise = manager.calculateAllMoves(START_FEN);

    // Simulate Worker error using the handler captured during construction
    if (errorHandler) {
      errorHandler({ message: 'Worker error' } as ErrorEvent);
    }

    await expect(promise).rejects.toThrow();
  });

  it('should terminate Worker on cleanup', () => {
    const manager = new LegalMovesWorkerManager();

    manager.terminate();

    expect(mockWorker.terminate).toHaveBeenCalled();
  });
});
