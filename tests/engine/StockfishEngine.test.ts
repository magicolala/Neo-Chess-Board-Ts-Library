import { StockfishEngine } from '../../src/engine/StockfishEngine';

const START_FEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';

describe('StockfishEngine (mock transport)', () => {
  it('emits ready and computes a best move', async () => {
    const engine = new StockfishEngine();
    const ready = new Promise<void>((resolve) => engine.on('ready', () => resolve()));
    await engine.init();
    await ready;
    const move = await engine.getBestMove(START_FEN, 50);
    expect(move).toBeTruthy();
    engine.terminate();
  });

  it('returns analysis results', async () => {
    const engine = new StockfishEngine();
    const result = await engine.analyze({ fen: START_FEN, depth: 10 });
    expect(result.fen).toBe(START_FEN);
    expect(result.lines.length).toBeGreaterThan(0);
    engine.terminate();
  });

  it('should set UCI_Chess960 option after engine is ready', async () => {
    const messages: string[] = [];
    let messageHandler: ((message: string) => void) | null = null;

    const mockTransport = {
      onMessage: jest.fn((handler: (message: string) => void) => {
        messageHandler = handler;
      }),
      onError: jest.fn(),
      postMessage: jest.fn((msg: string) => {
        messages.push(msg);
        // Simulate UCI responses immediately
        if (msg === 'uci' && messageHandler) {
          messageHandler('id name mock-stockfish');
          messageHandler('uciok');
        }
        if (msg === 'isready' && messageHandler) {
          messageHandler('readyok');
        }
      }),
      terminate: jest.fn(),
    };

    const engine = new StockfishEngine({
      variant: 'chess960',
      transportFactory: () => mockTransport as any,
    });

    await engine.init();

    // Verify that UCI_Chess960 option is set AFTER ready
    const uciIndex = messages.indexOf('uci');
    const isreadyIndex = messages.indexOf('isready');
    const setOptionIndex = messages.findIndex((msg) =>
      msg.includes('setoption name UCI_Chess960 value true'),
    );

    expect(uciIndex).toBeGreaterThanOrEqual(0);
    expect(isreadyIndex).toBeGreaterThanOrEqual(0);
    expect(setOptionIndex).toBeGreaterThanOrEqual(0);
    // setOption should come after isready
    expect(setOptionIndex).toBeGreaterThan(isreadyIndex);

    engine.terminate();
  });
});
