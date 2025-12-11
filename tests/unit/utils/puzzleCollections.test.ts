import type { PuzzleCollection, PuzzleDefinition } from '../../../src/extensions/puzzle-mode/types';
import {
  filterPuzzles,
  loadPuzzleCollection,
  normalizePuzzleCollection,
} from '../../../src/utils/puzzleCollections';

const demoCollection: PuzzleCollection = {
  id: 'daily-set',
  title: ' Daily tactics ',
  description: '  Mixed motifs ',
  puzzles: [
    buildPuzzle('fork', 'Fork tactic', 'intermediate', ['fork', 'tactic']),
    buildPuzzle('mate', 'Back rank mate', 'advanced', ['mate']),
    buildPuzzle('opening', 'Opening trap', undefined, ['trap']),
    buildPuzzle('beginner', 'Mate in one', 'beginner', ['mate', 'basic']),
  ],
};

describe('puzzleCollections normalization', () => {
  it('trims metadata and ensures defaults', () => {
    const normalized = normalizePuzzleCollection(demoCollection);
    expect(normalized.title).toBe('Daily tactics');
    expect(normalized.description).toBe('Mixed motifs');
    expect(normalized.puzzles[2].difficulty).toBe('beginner');
    expect(normalized.puzzles[0].tags).toEqual(['fork', 'tactic']);
  });
});

describe('puzzleCollections filtering & pagination', () => {
  it('filters by difficulty, tags, and search text', () => {
    const normalized = normalizePuzzleCollection(demoCollection);
    const filtered = filterPuzzles(normalized.puzzles, {
      difficulty: ['advanced', 'intermediate'],
      tags: ['mate'],
      search: 'back rank',
    });
    expect(filtered).toHaveLength(1);
    expect(filtered[0].id).toBe('mate');
  });

  it('paginates and sorts collections deterministically', () => {
    const result = loadPuzzleCollection(demoCollection, {
      sortBy: 'title',
      page: 2,
      pageSize: 2,
    });
    expect(result.page).toBe(2);
    expect(result.pageSize).toBe(2);
    expect(result.total).toBe(4);
    expect(result.hasPrevious).toBe(true);
    expect(result.hasNext).toBe(false);
    expect(result.puzzles.map((p) => p.id)).toEqual(['beginner', 'opening']);
  });
});

function buildPuzzle(
  id: string,
  title: string,
  difficulty?: PuzzleDefinition['difficulty'],
  tags?: string[],
): PuzzleDefinition {
  return {
    id,
    title,
    fen: '8/8/8/8/8/8/8/8 w - - 0 1',
    solution: ['Kd2'],
    difficulty: (difficulty as PuzzleDefinition['difficulty']) ?? 'beginner',
    tags,
  };
}
