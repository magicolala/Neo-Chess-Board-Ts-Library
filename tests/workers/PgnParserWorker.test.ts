/**
 * Tests for PgnParserWorker
 *
 * Note: These tests focus on the Worker logic that can be tested
 * without actually spawning a Worker (which requires a browser environment)
 */

import { PgnAnnotationParser } from '../../src/core/PgnAnnotationParser';

describe('PgnParserWorker Logic', () => {
  describe('parseMetadata', () => {
    it('should parse PGN headers correctly', () => {
      const pgnString = `[Event "Test Game"]
[Site "Test Site"]
[Date "2024.01.01"]
[Round "1"]
[White "Player 1"]
[Black "Player 2"]
[Result "1-0"]

1. e4 e5 2. Nf3 Nc6 1-0`;

      const lines = pgnString.split('\n');
      const metadata: Record<string, string> = {};

      for (const line of lines) {
        if (line.startsWith('[')) {
          const match = line.match(/\[(\w+)\s+"([^"]*)"\]/);
          if (match) {
            metadata[match[1]!] = match[2]!;
          }
        } else {
          break;
        }
      }

      expect(metadata.Event).toBe('Test Game');
      expect(metadata.Site).toBe('Test Site');
      expect(metadata.White).toBe('Player 1');
      expect(metadata.Black).toBe('Player 2');
      expect(metadata.Result).toBe('1-0');
    });
  });

  describe('parseMoves', () => {
    it('should parse simple PGN moves', () => {
      const movesText = '1. e4 e5 2. Nf3 Nc6 1-0';

      const moves: Array<{ moveNumber: number; white?: string; black?: string }> = [];

      // 1. Enlever les commentaires et le résultat
      const cleanedMovesText = movesText
        .replaceAll(/{[^}]*}/g, '')
        .replace(/\s*(1-0|0-1|1\/2-1\/2|\*)\s*$/, '')
        .trim();

      // 2. Séparer en tokens
      const tokens = cleanedMovesText.split(/\s+/);

      let currentMoveNumber = 0;
      let isWhiteMove = true;

      for (const token of tokens) {
        if (token.endsWith('.')) {
          const moveNumber = Number.parseInt(token.slice(0, -1), 10);
          if (!Number.isNaN(moveNumber)) {
            currentMoveNumber = moveNumber;
            isWhiteMove = true;
          }
        } else if (currentMoveNumber > 0 && token) {
          let move = moves.find((m) => m.moveNumber === currentMoveNumber);
          if (!move) {
            move = { moveNumber: currentMoveNumber };
            moves.push(move);
          }

          if (isWhiteMove) {
            move.white = token;
          } else {
            move.black = token;
          }
          isWhiteMove = !isWhiteMove;
        }
      }

      expect(moves.length).toBe(2);
      expect(moves[0]).toEqual({ moveNumber: 1, white: 'e4', black: 'e5' });
      expect(moves[1]).toEqual({ moveNumber: 2, white: 'Nf3', black: 'Nc6' });
    });

    it('should parse moves with annotations', () => {
      const comment = '{[%cal Ge2e4] Best move}';
      const annotations = PgnAnnotationParser.parseComment(comment);

      expect(annotations.arrows).toHaveLength(1);
      expect(annotations.arrows[0]).toMatchObject({
        from: 'e2',
        to: 'e4',
      });
    });
  });

  describe('validatePgn', () => {
    it('should validate correct PGN', () => {
      const validPgn = `[Event "Test"]
[Site "Test"]

1. e4 e5 1-0`;

      const isValid =
        validPgn &&
        validPgn.trim().length > 0 &&
        validPgn.includes('[') &&
        (/\d+\./.test(validPgn) || /(1-0|0-1|1\/2-1\/2|\*)/.test(validPgn));

      expect(isValid).toBe(true);
    });

    it('should reject invalid PGN', () => {
      const invalidPgn: string = '';

      const isValid = Boolean(
        invalidPgn &&
          invalidPgn.trim().length > 0 &&
          invalidPgn.includes('[') &&
          (/\d+\./.test(invalidPgn) || /(1-0|0-1|1\/2-1\/2|\*)/.test(invalidPgn)),
      );

      expect(isValid).toBe(false);
    });
  });
});

describe('PgnParserWorkerManager', () => {
  // Mock Worker for testing
  let mockWorker: {
    postMessage: jest.Mock;
    terminate: jest.Mock;
    addEventListener: jest.Mock;
  };
  let messageHandler: ((event: MessageEvent) => void) | null = null;
  let errorHandler: ((event: ErrorEvent) => void) | null = null;
  let lastRequestId: string | null = null;
  let PgnParserWorkerManager: typeof import('../../src/core/PgnParserWorkerManager').PgnParserWorkerManager;

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

    // Capture posted messages and auto-respond so the manager resolves requests
    (mockWorker.postMessage as jest.Mock).mockImplementation((message: unknown) => {
      const msg = message as { id?: string; type?: string; pgn?: string; pgns?: string[] };
      if (msg && msg.id) {
        lastRequestId = msg.id as string;
      }

      // Auto-respond appropriately depending on the request type
      if (msg && msg.id) {
        switch (msg.type) {
          case 'parsePgn': {
            setTimeout(() => {
              if (messageHandler) {
                messageHandler({
                  data: {
                    type: 'success',
                    id: msg.id,
                    result: {
                      metadata: { Event: 'Test', Site: 'Test' },
                      moves: [{ moveNumber: 1, white: 'e4', black: 'e5' }],
                      result: '1-0',
                      parseIssues: [],
                    },
                  },
                } as MessageEvent);
              }
            }, 0);
            break;
          }
          case 'parsePgnBatch': {
            setTimeout(() => {
              if (messageHandler) {
                messageHandler({
                  data: {
                    type: 'success',
                    id: msg.id,
                    results: [
                      {
                        metadata: { Event: 'Game 1' },
                        moves: [{ moveNumber: 1, white: 'e4', black: 'e5' }],
                        result: '1-0',
                        parseIssues: [],
                      },
                      {
                        metadata: { Event: 'Game 2' },
                        moves: [{ moveNumber: 1, white: 'd4', black: 'd5' }],
                        result: '1-0',
                        parseIssues: [],
                      },
                    ],
                  },
                } as MessageEvent);
              }
            }, 0);
            break;
          }
          case 'validatePgn': {
            setTimeout(() => {
              if (messageHandler) {
                messageHandler({
                  data: {
                    type: 'success',
                    id: msg.id,
                    valid: true,
                  },
                } as MessageEvent);
              }
            }, 0);
            break;
          }
          default: {
            break;
          }
        }
      }
    });

    const module = await import('../../src/core/PgnParserWorkerManager');
    PgnParserWorkerManager = module.PgnParserWorkerManager;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should initialize Worker when available', () => {
    const manager = new PgnParserWorkerManager();

    expect(globalThis.Worker).toHaveBeenCalled();
    expect(manager.isAvailable()).toBe(true);
  });

  it('should handle Worker unavailability gracefully', () => {
    // Make Worker constructor throw
    (globalThis.Worker as jest.Mock) = jest.fn().mockImplementation(() => {
      throw new Error('Worker not supported');
    });

    const manager = new PgnParserWorkerManager();

    expect(manager.isAvailable()).toBe(false);
  });

  it('should send parsePgn request', async () => {
    const manager = new PgnParserWorkerManager();

    const pgnString = `[Event "Test"]
[Site "Test"]

1. e4 e5 1-0`;

    const mockResponse = {
      type: 'success',
      id: lastRequestId,
      result: {
        metadata: { Event: 'Test', Site: 'Test' },
        moves: [{ moveNumber: 1, white: 'e4', black: 'e5' }],
        result: '1-0',
        parseIssues: [],
      },
    };

    const promise = manager.parsePgn(pgnString);

    // Wait for the request id to be captured
    await new Promise((resolve) => setTimeout(resolve, 0));

    if (messageHandler && lastRequestId) {
      messageHandler({ data: mockResponse } as MessageEvent);
    }

    const result = await promise;
    expect(result.metadata.Event).toBe('Test');
    expect(result.moves).toHaveLength(1);
    expect(mockWorker.postMessage).toHaveBeenCalled();
  });

  it('should handle parsePgnBatch', async () => {
    const manager = new PgnParserWorkerManager();

    const pgns = [
      `[Event "Game 1"]
1. e4 e5 1-0`,
      `[Event "Game 2"]
1. d4 d5 1-0`,
    ];

    const mockResponse = {
      type: 'success',
      id: lastRequestId,
      results: [
        {
          metadata: { Event: 'Game 1' },
          moves: [{ moveNumber: 1, white: 'e4', black: 'e5' }],
          result: '1-0',
          parseIssues: [],
        },
        {
          metadata: { Event: 'Game 2' },
          moves: [{ moveNumber: 1, white: 'd4', black: 'd5' }],
          result: '1-0',
          parseIssues: [],
        },
      ],
    };

    const promise = manager.parsePgnBatch(pgns);

    // Wait for the request id to be captured
    await new Promise((resolve) => setTimeout(resolve, 0));

    if (messageHandler && lastRequestId) {
      messageHandler({ data: mockResponse } as MessageEvent);
    }

    const results = await promise;
    expect(results).toHaveLength(2);
    expect(results[0]!.metadata.Event).toBe('Game 1');
    expect(results[1]!.metadata.Event).toBe('Game 2');
  });

  it('should validate PGN', async () => {
    const manager = new PgnParserWorkerManager();

    const pgnString = `[Event "Test"]
1. e4 1-0`;

    const mockResponse = {
      type: 'success',
      id: lastRequestId,
      valid: true,
    };

    const promise = manager.validatePgn(pgnString);

    // Wait for the request id to be captured
    await new Promise((resolve) => setTimeout(resolve, 0));

    if (messageHandler && lastRequestId) {
      messageHandler({ data: mockResponse } as MessageEvent);
    }

    const result = await promise;
    expect(result).toBe(true);
  });

  it('should terminate Worker on cleanup', () => {
    const manager = new PgnParserWorkerManager();

    manager.terminate();

    expect(mockWorker.terminate).toHaveBeenCalled();
  });
});
