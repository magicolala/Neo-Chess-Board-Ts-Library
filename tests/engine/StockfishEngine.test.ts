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
});
