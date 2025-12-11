import type {
  PuzzleCollection,
  PuzzleDefinition,
  PuzzleDifficulty,
  PuzzleVariant,
} from '../extensions/puzzle-mode/types';

const DEFAULT_DIFFICULTY: PuzzleDifficulty = 'beginner';
const DIFFICULTY_ORDER: readonly PuzzleDifficulty[] = [
  'beginner',
  'intermediate',
  'advanced',
] as const;

export interface PuzzleCollectionFilters {
  difficulty?: PuzzleDifficulty[];
  tags?: string[];
  search?: string;
}

export interface PuzzleCollectionLoaderOptions {
  filters?: PuzzleCollectionFilters;
  page?: number;
  pageSize?: number;
  sortBy?: 'difficulty' | 'title';
}

export interface PuzzleCollectionLoaderResult {
  collection: PuzzleCollection;
  puzzles: PuzzleDefinition[];
  total: number;
  page: number;
  pageSize: number;
  hasPrevious: boolean;
  hasNext: boolean;
}

export function normalizePuzzleCollection(raw: PuzzleCollection): PuzzleCollection {
  const title = (raw.title ?? 'Puzzle Collection').trim();
  const description = raw.description?.trim() ?? undefined;
  const puzzles = (raw.puzzles ?? []).map((puzzle) => normalizePuzzleDefinition(puzzle));
  return {
    id: raw.id,
    title,
    description,
    puzzles,
  };
}

export function normalizePuzzleDefinition(def: PuzzleDefinition): PuzzleDefinition {
  const variants = Array.isArray(def.variants)
    ? def.variants.map((variant) => normalizePuzzleVariant(variant))
    : undefined;
  const tags = normalizeTags(def.tags);
  const difficulty = normalizeDifficulty(def.difficulty);
  return {
    id: def.id,
    title: def.title?.trim() ?? 'Untitled Puzzle',
    fen: def.fen,
    solution: Array.isArray(def.solution) ? [...def.solution] : [],
    variants,
    difficulty,
    tags: tags.length > 0 ? tags : undefined,
    author: def.author?.trim() ?? undefined,
    hint: def.hint?.trim() ?? undefined,
    sourcePgn: def.sourcePgn?.trim() ?? undefined,
  };
}

export function normalizePuzzleVariant(variant: PuzzleVariant): PuzzleVariant {
  return {
    id: variant.id,
    label: variant.label?.trim() ?? variant.id,
    moves: Array.isArray(variant.moves) ? [...variant.moves] : [],
  };
}

function normalizeTags(tags?: string[]): string[] {
  if (!Array.isArray(tags)) {
    return [];
  }
  const seen = new Set<string>();
  for (const tag of tags) {
    const trimmed = tag?.trim();
    if (trimmed) {
      seen.add(trimmed);
    }
  }
  return [...seen];
}

function normalizeDifficulty(candidate?: PuzzleDifficulty): PuzzleDifficulty {
  if (candidate && (DIFFICULTY_ORDER as readonly string[]).includes(candidate)) {
    return candidate;
  }
  return DEFAULT_DIFFICULTY;
}

export function loadPuzzleCollection(
  raw: PuzzleCollection,
  options: PuzzleCollectionLoaderOptions = {},
): PuzzleCollectionLoaderResult {
  const normalized = normalizePuzzleCollection(raw);
  const filters = options.filters ?? {};
  const filtered = filterPuzzles(normalized.puzzles, filters);
  const sorted = sortPuzzles(filtered, options.sortBy);
  const pageSize = Math.max(1, options.pageSize ?? 10);
  const page = Math.max(1, options.page ?? 1);
  const sliceStart = (page - 1) * pageSize;
  const puzzles = sorted.slice(sliceStart, sliceStart + pageSize);
  const total = sorted.length;
  const hasPrevious = sliceStart > 0;
  const hasNext = sliceStart + puzzles.length < total;

  return {
    collection: normalized,
    puzzles,
    total,
    page,
    pageSize,
    hasPrevious,
    hasNext,
  };
}

export function filterPuzzles(
  puzzles: PuzzleDefinition[],
  filters: PuzzleCollectionFilters,
): PuzzleDefinition[] {
  return puzzles.filter(
    (puzzle) =>
      matchesDifficulty(puzzle, filters) &&
      matchesTags(puzzle, filters) &&
      matchesSearch(puzzle, filters),
  );
}

function matchesDifficulty(puzzle: PuzzleDefinition, filters: PuzzleCollectionFilters): boolean {
  if (!filters.difficulty || filters.difficulty.length === 0) {
    return true;
  }
  return filters.difficulty.includes(puzzle.difficulty);
}

function matchesTags(puzzle: PuzzleDefinition, filters: PuzzleCollectionFilters): boolean {
  if (!filters.tags || filters.tags.length === 0) {
    return true;
  }
  if (!puzzle.tags || puzzle.tags.length === 0) {
    return false;
  }
  return filters.tags.some((tag) => puzzle.tags?.includes(tag));
}

function matchesSearch(puzzle: PuzzleDefinition, filters: PuzzleCollectionFilters): boolean {
  const query = filters.search?.trim();
  if (!query) {
    return true;
  }
  const lower = query.toLowerCase();
  const haystack = [puzzle.title, puzzle.author, puzzle.hint, ...(puzzle.tags ?? [])]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
  return haystack.includes(lower);
}

function sortPuzzles(puzzles: PuzzleDefinition[], sortBy: PuzzleCollectionLoaderOptions['sortBy']) {
  if (sortBy === 'difficulty') {
    return [...puzzles].sort((a, b) => {
      const diff = DIFFICULTY_ORDER.indexOf(a.difficulty) - DIFFICULTY_ORDER.indexOf(b.difficulty);
      if (diff !== 0) {
        return diff;
      }
      return a.title.localeCompare(b.title);
    });
  }
  if (sortBy === 'title') {
    return [...puzzles].sort((a, b) => a.title.localeCompare(b.title));
  }
  return puzzles;
}
