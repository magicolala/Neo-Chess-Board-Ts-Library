# Puzzle Mode – Research Findings

## Decision: Built-in localStorage persistence with graceful fallback

- **Rationale**: Keeps progress storage zero-dependency, works in all browsers, and satisfies spec requirement for automatic persistence. Falling back to in-memory storage avoids blocking puzzles when storage is unavailable.
- **Alternatives considered**: Pluggable persistence adapters (more surface area, harder to test); session-only memory (no persistence across refresh); forcing integrators to supply storage (higher integration friction).

## Decision: Puzzle authors define alternate winning lines explicitly

- **Rationale**: Ensures deterministic validation without bundling engine analysis or heuristic detection. Authors already curate puzzles, so listing acceptable branches is practical.
- **Alternatives considered**: Engine-driven alternate detection (expensive, requires Stockfish by default); allowing any legal move that keeps evaluation high (ambiguous expectations).

## Decision: Reuse existing EventBus events for observability

- **Rationale**: `puzzle:load`, `puzzle:move`, `puzzle:hint`, `puzzle:complete`, and `puzzle:persistence-warning` provide structured payloads that host apps can log without inflating the core with analytics dependencies.
- **Alternatives considered**: Dedicated logging backend (violates runtime minimalism); forcing integrators to provide callbacks (extra boilerplate with no added value).

## Decision: Treat puzzle metadata as non-PII by default

- **Rationale**: Puzzle files ship with public tactical data; keeping metadata non-sensitive avoids compliance overhead. Integrators needing PII must store it outside core PuzzleDefinition.
- **Alternatives considered**: Including user identifiers in PuzzleDefinition (risks leaking data through demos/examples); prompting for consent (overkill for library defaults).

## Decision: LocalStorage failure emits warning and retains in-memory state

- **Rationale**: Handles quotas/private browsing gracefully while informing hosts via `puzzle:persistence-warning`. Keeps puzzles usable even when persistence is blocked.
- **Alternatives considered**: Hard-fail initialization (puzzle mode unusable); silently ignoring failures (debugging difficulty); requiring integrators to polyfill storage (extra burden).
