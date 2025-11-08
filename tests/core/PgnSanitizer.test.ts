import { sanitizePgnString } from '../../src/core/PgnSanitizer';

describe('sanitizePgnString', () => {
  it('should remove nested variations while keeping comments intact', () => {
    const pgn = `[Event "Test"]

1. e4 { [%eval 0.1] } (1... c5 { [%eval 0.0] }) 1... e5 { (the main line) } 2. Nf3 (2. Nc3 Nc6) 2... Nc6 *`;

    const sanitized = sanitizePgnString(pgn);
    const expectedSequence = [
      '1. e4 { [%eval 0.1] }',
      '1... e5 { (the main line) }',
      '2. Nf3 2... Nc6 *',
    ].join(' ');
    expect(sanitized).toContain(expectedSequence);
    expect(sanitized).not.toContain('(1... c5');
    expect(sanitized).not.toContain('(2. Nc3');
    expect(sanitized).toContain('{ (the main line) }');
  });

  it('should gracefully handle PGN without headers', () => {
    const pgn = '1. d4 (1. e4 e5) d5 { [%eval 0.0] } *';
    const sanitized = sanitizePgnString(pgn);

    expect(sanitized).toBe('1. d4 d5 { [%eval 0.0] } *');
  });
});
