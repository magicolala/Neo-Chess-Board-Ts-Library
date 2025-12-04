import { ChessJsRules } from '../../src/core/ChessJsRules';
import type { Move, RulesAdapter, Square } from '../../src/core/types';
import { RuleEngine } from '../../src/core/RuleEngine';

class StubRulesAdapter implements RulesAdapter {
  private fen: string;

  constructor(initialFen: string) {
    this.fen = initialFen;
  }

  setFEN(fen: string): void {
    this.fen = fen;
  }

  getFEN(): string {
    return this.fen;
  }

  turn(): 'w' | 'b' {
    return 'w';
  }

  movesFrom(_square: Square): Move[] {
    return [];
  }

  move(move: { from: Square; to: Square; promotion?: Move['promotion'] }): null;
  move(move: string): null;
  move(): null {
    return null;
  }

  undo(): boolean {
    return false;
  }

  isDraw(): boolean {
    return false;
  }

  isInsufficientMaterial(): boolean {
    return false;
  }

  isThreefoldRepetition(): boolean {
    return false;
  }
}

describe('RuleEngine', () => {
  it('converts between UCI and SAN using the provided rules adapter', () => {
    const rules = new ChessJsRules();
    const engine = new RuleEngine(() => rules);

    const san = engine.convertMoveNotation('e2e4', 'uci', 'san');
    const uci = engine.convertMoveNotation('Nf3', 'san', 'uci');

    expect(san).toBe('e4');
    expect(uci).toBe('g1f3');
  });

  it('parses coordinate notation with optional promotions', () => {
    const engine = new RuleEngine(() => new ChessJsRules());

    expect(engine.parseCoordinateNotation('a7a8q')).toEqual({
      from: 'a7',
      to: 'a8',
      promotion: 'q',
    });
    expect(engine.parseCoordinateNotation('h2-h1')).toEqual({
      from: 'h2',
      to: 'h1',
      promotion: undefined,
    });
    expect(engine.parseCoordinateNotation('invalid')).toBeNull();
  });

  it('supports custom notation engine factories', () => {
    const rules = new StubRulesAdapter('4k3/8/8/8/8/8/8/4K3 w - - 0 1');
    const moveResult = { from: 'e2' as Square, to: 'e4' as Square, san: 'e4' };
    const mockMove = jest.fn((_input: unknown) => moveResult);
    const mockFactory = jest.fn(() => ({ move: mockMove }));
    const engine = new RuleEngine(() => rules, mockFactory);

    expect(engine.convertMoveNotation('e2e4', 'uci', 'san')).toBe('e4');
    expect(mockFactory).toHaveBeenCalledWith('4k3/8/8/8/8/8/8/4K3 w - - 0 1');
    expect(mockMove).toHaveBeenCalledWith({ from: 'e2', to: 'e4', promotion: undefined });
  });
});
