import { getPositionUpdates, fenStringToPositionObject, START_FEN } from '../src/core/utils';

describe('fenStringToPositionObject', () => {
  it('creates a position map keyed by squares', () => {
    const position = fenStringToPositionObject(START_FEN);

    expect(position['e2']).toEqual({ pieceType: 'P' });
    expect(position['e7']).toEqual({ pieceType: 'p' });
    expect(position['a1']).toEqual({ pieceType: 'R' });
  });

  it('omits empty squares', () => {
    const position = fenStringToPositionObject('8/8/8/8/8/8/8/8 w - - 0 1');

    expect(Object.keys(position)).toHaveLength(0);
  });
});

describe('getPositionUpdates', () => {
  it('detects simple piece movement', () => {
    const start = '8/8/8/8/4P3/8/8/8 w - - 0 1';
    const next = '8/8/8/4P3/8/8/8/8 b - - 0 1';

    const updates = getPositionUpdates(start, next);

    expect(updates.removed).toEqual(['e4']);
    expect(updates.added).toEqual({ e5: { pieceType: 'P' } });
  });

  it('tracks captures by replacing the destination piece', () => {
    const start = '8/8/8/3p4/4P3/8/8/8 w - - 0 1';
    const next = '8/8/8/3P4/8/8/8/8 b - - 0 1';

    const updates = getPositionUpdates(start, next);

    expect(updates.removed.sort()).toEqual(['d5', 'e4']);
    expect(updates.added).toEqual({ d5: { pieceType: 'P' } });
  });

  it('handles promotions', () => {
    const start = '4k3/7P/8/8/8/8/8/4K3 w - - 0 1';
    const promoted = '4k2Q/8/8/8/8/8/8/4K3 b - - 0 1';

    const updates = getPositionUpdates(start, promoted);

    expect(updates.removed.sort()).toEqual(['h7']);
    expect(updates.added).toEqual({ h8: { pieceType: 'Q' } });
  });

  it('marks every square as changed when the orientation flips', () => {
    const baseline = fenStringToPositionObject(START_FEN);
    const updates = getPositionUpdates(baseline, baseline, {
      previousOrientation: 'white',
      nextOrientation: 'black',
    });

    const expectedSquares = Object.keys(baseline).sort();

    expect(updates.removed.sort()).toEqual(expectedSquares);
    expect(Object.keys(updates.added).sort()).toEqual(expectedSquares);
  });
});
