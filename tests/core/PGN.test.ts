import { PGNRecorder } from '../../src/core/PGN';
import type { RulesAdapter } from '../../src/core/types';

// Mock adapter for testing
const createMockAdapter = (pgnOverride?: string): RulesAdapter => ({
  setFEN: jest.fn(),
  getFEN: jest.fn(() => 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1'),
  turn: jest.fn(() => 'w'),
  movesFrom: jest.fn(() => []),
  move: jest.fn(() => ({ ok: true })),
  getPGN: pgnOverride ? jest.fn(() => pgnOverride) : undefined,
  header: jest.fn(),
});

describe('PGNRecorder', () => {
  let pgn: PGNRecorder;
  let mockedDate: string;

  beforeEach(() => {
    // Mock Date pour des tests consistants
    jest.useFakeTimers();
    const date = new Date('2024-01-15');
    jest.setSystemTime(date);
    mockedDate = date.toISOString().slice(0, 10).replace(/-/g, '.');
    pgn = new PGNRecorder();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('Initialization', () => {
    it('should initialize with default headers', () => {
      const result = pgn.getPGN();

      expect(result).toContain('[Event "Casual Game"]');
      expect(result).toContain('[Site "Local"]');
      expect(result).toContain(`[Date "${mockedDate}"]`);
      expect(result).toContain('[Round "1"]');
      expect(result).toContain('[White "White"]');
      expect(result).toContain('[Black "Black"]');
      expect(result).toContain('[Result "*"]');
    });

    it('should work with external adapter', () => {
      const adapter = createMockAdapter('1. e4 e5 2. Nf3');
      const pgnWithAdapter = new PGNRecorder(adapter);

      expect(pgnWithAdapter.getPGN()).toBe('1. e4 e5 2. Nf3');
    });
  });

  describe('Header management', () => {
    it('should update headers correctly', () => {
      pgn.setHeaders({
        Event: 'Test Tournament',
        White: 'Magnus',
        Black: 'Hikaru',
      });

      const result = pgn.getPGN();
      expect(result).toContain('[Event "Test Tournament"]');
      expect(result).toContain('[White "Magnus"]');
      expect(result).toContain('[Black "Hikaru"]');
      expect(result).toContain('[Site "Local"]'); // Should keep existing headers
    });

    it('should set result correctly', () => {
      pgn.setResult('1-0');

      const result = pgn.getPGN();
      expect(result).toContain('[Result "1-0"]');
      expect(result.endsWith(' 1-0')).toBe(true);
    });

    it('should call adapter header method when available', () => {
      const adapter = createMockAdapter();
      const pgnWithAdapter = new PGNRecorder(adapter);

      pgnWithAdapter.setHeaders({ Event: 'Test' });

      expect(adapter.header).toHaveBeenCalledWith(
        expect.objectContaining({
          Event: 'Test',
        }),
      );
    });
  });

  describe('Move recording', () => {
    it('should record and format moves correctly', () => {
      pgn.push({ from: 'e2', to: 'e4' });
      pgn.push({ from: 'e7', to: 'e5' });
      pgn.push({ from: 'g1', to: 'f3' });

      const result = pgn.getPGN();
      expect(result).toContain('1. e2e4 e7e5 2. g1f3');
    });

    it('should handle captures in move notation', () => {
      pgn.push({ from: 'e4', to: 'd5', captured: 'p' });

      const result = pgn.getPGN();
      expect(result).toContain('1. e4xd5');
    });

    it('should handle promotions', () => {
      pgn.push({ from: 'a7', to: 'a8', promotion: 'q' });

      const result = pgn.getPGN();
      expect(result).toContain('1. a7a8=Q');
    });

    it('should reset moves correctly', () => {
      pgn.push({ from: 'e2', to: 'e4' });
      pgn.push({ from: 'e7', to: 'e5' });

      let result = pgn.getPGN();
      expect(result).toContain('1. e2e4 e7e5');

      pgn.reset();
      result = pgn.getPGN();
      expect(result).not.toContain('1. e2e4 e7e5');
    });
  });

  describe('File export', () => {
    beforeEach(() => {
      // Mock DOM methods for file download
      global.document.createElement = jest.fn(() => ({
        href: '',
        download: '',
        click: jest.fn(),
        style: {},
      })) as any;

      global.document.body.appendChild = jest.fn();
      global.document.body.removeChild = jest.fn();

      global.URL.createObjectURL = jest.fn(() => 'mock-blob-url');
      global.URL.revokeObjectURL = jest.fn();
    });

    it('should create correct blob', () => {
      pgn.push({ from: 'e2', to: 'e4' });

      const blob = pgn.toBlob();
      expect(blob).toBeInstanceOf(Blob);
      expect(blob.type).toBe('application/x-chess-pgn');
    });

    it('should suggest correct filename', () => {
      pgn.setHeaders({
        White: 'Magnus Carlsen',
        Black: 'Hikaru Nakamura',
        Date: '2024.01.15',
      });

      const filename = pgn.suggestFilename();
      expect(filename).toBe('Magnus_Carlsen_vs_Hikaru_Nakamura_2024-01-15.pgn');
    });

    it('should handle special characters in names for filename', () => {
      pgn.setHeaders({
        White: 'Player@#$%One',
        Black: 'Player Two!',
      });

      const filename = pgn.suggestFilename();
      expect(filename).toMatch(/Player.*One_vs_Player.*Two.*\d{4}-\d{2}-\d{2}\.pgn/);
    });

    it('should download file when in browser environment', () => {
      pgn.download('test.pgn');

      expect(global.URL.createObjectURL).toHaveBeenCalled();
      expect(global.document.createElement).toHaveBeenCalledWith('a');
      expect(global.document.body.appendChild).toHaveBeenCalled();
    });

    it('should handle SSR environment gracefully', () => {
      const originalDocument = global.document;
      delete (global as any).document;

      expect(() => {
        pgn.download('test.pgn');
      }).not.toThrow();

      global.document = originalDocument;
    });
  });

  describe('PGN format', () => {
    it('should generate proper PGN header format', () => {
      const result = pgn.getPGN();
      const lines = result.split('\n');

      expect(lines[0]).toMatch(/^\[Event ".*"\]$/);
      expect(lines[1]).toMatch(/^\[Site ".*"\]$/);
      expect(lines[2]).toMatch(/^\[Date ".*"\]$/);
    });

    it('should separate headers from moves with blank line', () => {
      pgn.push({ from: 'e2', to: 'e4' });

      const result = pgn.getPGN();
      expect(result).toContain(']\n\n1.');
    });

    it('should handle odd number of moves correctly', () => {
      pgn.push({ from: 'e2', to: 'e4' });
      pgn.push({ from: 'e7', to: 'e5' });
      pgn.push({ from: 'g1', to: 'f3' }); // White's second move

      const result = pgn.getPGN();
      expect(result).toContain('1. e2e4 e7e5 2. g1f3');
    });
  });
});
