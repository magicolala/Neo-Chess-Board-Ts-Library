import { getRelativeCoords } from '../src/core/utils';

describe('getRelativeCoords', () => {
  it('returns top-left and center coordinates for white orientation on a square board', () => {
    const coords = getRelativeCoords(
      {
        boardWidth: 800,
        boardHeight: 800,
        files: 8,
        ranks: 8,
        orientation: 'white',
      },
      'a1',
    );

    expect(coords.square).toBe('a1');
    expect(coords.topLeft).toEqual({ x: 0, y: 700 });
    expect(coords.center).toEqual({ x: 50, y: 750 });
    expect(coords.squareWidth).toBe(100);
    expect(coords.squareHeight).toBe(100);
  });

  it('flips coordinates for black orientation on a square board', () => {
    const coords = getRelativeCoords(
      {
        boardWidth: 800,
        boardHeight: 800,
        files: 8,
        ranks: 8,
        orientation: 'black',
      },
      'a1',
    );

    expect(coords.topLeft).toEqual({ x: 700, y: 0 });
    expect(coords.center).toEqual({ x: 750, y: 50 });
  });

  it('handles rectangular boards while preserving orientation rules', () => {
    const [a1, h8] = getRelativeCoords(
      {
        boardWidth: 900,
        boardHeight: 600,
        files: 8,
        ranks: 8,
        orientation: 'white',
      },
      ['a1', 'h8'],
    );

    expect(a1.topLeft).toEqual({ x: 0, y: 525 });
    expect(a1.center).toEqual({ x: 56.25, y: 562.5 });
    expect(a1.squareWidth).toBeCloseTo(112.5);
    expect(a1.squareHeight).toBeCloseTo(75);

    expect(h8.topLeft).toEqual({ x: 787.5, y: 0 });
    expect(h8.center).toEqual({ x: 843.75, y: 37.5 });
  });
});
