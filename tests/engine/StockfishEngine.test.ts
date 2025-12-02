import { StockfishEngine } from '../../src/engine/StockfishEngine';
import type { EngineTransport } from '../../src/engine/types';

const START_FEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';

class RecordingTransport implements EngineTransport {
  messages: string[] = [];
  private listeners: Array<(message: string) => void> = [];
  private errorListeners: Array<(error: ErrorEvent | MessageEvent) => void> = [];

  postMessage(message: string): void {
    this.messages.push(message);
    this.handle(message).catch((error) =>
      this.errorListeners.forEach((listener) =>
        listener(new MessageEvent('error', { data: error })),
      ),
    );
  }

  terminate(): void {
    this.listeners = [];
    this.errorListeners = [];
  }

  onMessage(callback: (message: string) => void): void {
    this.listeners.push(callback);
  }

  onError(callback: (error: ErrorEvent | MessageEvent) => void): void {
    this.errorListeners.push(callback);
  }

  private async handle(message: string): Promise<void> {
    const [command] = message.split(' ');
    switch (command) {
      case 'uci': {
        this.emit('uciok');
        break;
      }
      case 'isready': {
        this.emit('readyok');
        break;
      }
      case 'go': {
        setTimeout(() => this.emit('bestmove e2e4'), 10);
        break;
      }
      default: {
        break;
      }
    }
  }

  private emit(message: string): void {
    this.listeners.forEach((listener) => listener(message));
  }
}

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

  it('applies a default search limit when none is provided', async () => {
    const transport = new RecordingTransport();
    const engine = new StockfishEngine({ transportFactory: () => transport });
    await engine.analyze({ fen: START_FEN });

    const goCommand = transport.messages.find((message) => message.startsWith('go'));
    expect(goCommand).toBeDefined();
    expect(goCommand).toContain('movetime');

    engine.terminate();
  });
});
