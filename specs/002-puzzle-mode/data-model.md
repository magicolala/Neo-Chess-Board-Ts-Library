# Puzzle Mode Data Model

## PuzzleDefinition
| Field | Type | Constraints / Notes |
|-------|------|---------------------|
| `id` | string | Unique across collection; used as storage key |
| `title` | string | Display name (<=120 chars) |
| `fen` | string | Valid FEN for puzzle start |
| `solution` | string[] | Ordered SAN/long algebraic moves for canonical line |
| `variants` | PuzzleVariant[] | Optional alternate winning lines |
| `difficulty` | `'beginner' \| 'intermediate' \| 'advanced'` | Used for filtering UI |
| `tags` | string[] | Non-sensitive descriptors |
| `author` | string | Attribution/non-sensitive metadata |
| `hint` | string? | Text shown when user requests hint |
| `sourcePgn` | string? | Optional PGN reference/URL |

Validation:
- `solution` length >= 1.
- `variants` moves must not duplicate canonical solution exactly.
- `tags` limited to 10 entries to keep metadata compact.

## PuzzleVariant
| Field | Type | Notes |
|-------|------|-------|
| `id` | string | Unique within same puzzle (e.g., `line-b`) |
| `label` | string | Display label for UI |
| `moves` | string[] | Ordered moves representing alternate accepted path |

## PuzzleCollection
| Field | Type | Notes |
|-------|------|-------|
| `id` | string | Collection identifier used for persistence namespace |
| `title` | string | Display name |
| `description` | string | Optional markdown/HTML-safe description |
| `puzzles` | PuzzleDefinition[] | Ordered list |

## PuzzleSessionState
| Field | Type | Notes |
|-------|------|-------|
| `collectionId` | string | Matches `PuzzleCollection.id` |
| `currentPuzzleId` | string | Points to active `PuzzleDefinition` |
| `moveCursor` | number | Zero-based index into current expected move sequence |
| `attempts` | number | Increments on wrong move per puzzle |
| `solvedPuzzles` | Set<string> | Puzzle IDs solved in this storage namespace |
| `hintUsage` | number | Count per puzzle for analytics |
| `autoAdvance` | boolean | Behavior flag configured via Puzzle Mode options |
| `persistedAt` | ISO string | Timestamp of last localStorage sync |

## PuzzleEvents Payloads
- `puzzle:load`: `{ collectionId, puzzle: PuzzleDefinition, session: PuzzleSessionState }`
- `puzzle:move`: `{ puzzleId, move, result: 'correct' | 'incorrect', cursor }`
- `puzzle:hint`: `{ puzzleId, hintType: 'text' | 'origin-highlight', hintPayload }`
- `puzzle:complete`: `{ puzzleId, attempts, durationMs }`
- `puzzle:persistence-warning`: `{ error: string, fallback: 'memory' }`

## State Transitions
1. **Load Puzzle** → session resets `moveCursor`, `attempts`, `hintUsage`.
2. **Submit Move**:
   - If move matches canonical/variant move at `moveCursor`, increment cursor.
   - When cursor equals solution length, mark `solvedPuzzles` and emit completion event.
   - Wrong move increments `attempts` and emits failure feedback.
3. **Request Hint** → increments `hintUsage`, surfaces text/highlight.
4. **Persist State** → serialize `PuzzleSessionState` to `localStorage[collectionId]`; if fails, keep memory copy and emit warning.
5. **Advance Puzzle** → select next puzzle (auto or manual), update `currentPuzzleId`, reset transient fields.
