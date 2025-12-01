import {
  buildGoCommand,
  buildPositionCommand,
  parseBestMove,
  parseInfo,
} from '../../src/engine/UCIProtocol';

describe('UCIProtocol', () => {
  it('builds position commands with moves', () => {
    expect(buildPositionCommand('startpos', ['e2e4', 'e7e5'])).toBe(
      'position fen startpos moves e2e4 e7e5',
    );
  });

  it('builds go commands with provided options', () => {
    expect(buildGoCommand({ depth: 14, movetimeMs: 500, multiPv: 2 })).toBe(
      'go depth 14 movetime 500 multipv 2',
    );
  });

  it('parses info lines with centipawn scores', () => {
    const line = 'info depth 10 multipv 2 score cp 34 nps 100000 pv e2e4 e7e5';
    expect(parseInfo(line)).toEqual({
      id: 2,
      depth: 10,
      score: { type: 'cp', value: 34 },
      pv: ['e2e4', 'e7e5'],
      nps: 100_000,
      nodes: undefined,
      time: undefined,
    });
  });

  it('parses mate scores and best moves', () => {
    const infoLine = 'info depth 18 score mate 3 pv h7h8q';
    expect(parseInfo(infoLine)).toEqual({
      id: 1,
      depth: 18,
      score: { type: 'mate', value: 3 },
      pv: ['h7h8q'],
      nodes: undefined,
      nps: undefined,
      time: undefined,
    });

    const bestMove = parseBestMove('bestmove e2e4 ponder e7e5');
    expect(bestMove).toEqual({ move: 'e2e4', ponder: 'e7e5' });
  });
});
