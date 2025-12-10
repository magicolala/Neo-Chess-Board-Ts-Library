# Feature Specification: Puzzle Mode

**Feature Branch**: `002-puzzle-mode`  
**Created**: 2025-12-10  
**Status**: Draft  
**Input**: User description: "Create a \"Puzzle Mode\" feature for Neo Chess Board."

## Constitution Alignment *(mandatory)*

- **Scope & Runtime (Principles 1-2)**: Puzzle Mode ships as a TypeScript-first core capability plus optional React helpers that run entirely client-side with no new runtime dependencies beyond existing peer dependencies. Puzzle logic builds on ChessGame and rules adapters, keeping the board headless-friendly.
- **API Stability (Principles 3 & 10)**: Public surface adds additive APIs (e.g., `enablePuzzleMode`, puzzle events, puzzle configuration objects) with defaults that preserve existing board behavior when Puzzle Mode is disabled. Migration guides and changelog entries cover any renamed options.
- **Correctness, Performance & Bundle Size (Principles 4-5)**: Puzzle verification reuses move validation pipelines and Stockfish workers only when integrators opt in to auto-validation, maintaining 60fps rendering and <50KB core bundle by isolating heavy data (PGN/JSON puzzles) in demos.
- **Quality, Docs & Demos (Principles 6-7)**: Specs, plans, and tasks must list Jest suites covering puzzle flows plus MkDocs and demo updates (new guide, example, and README blurb). CI gates (`lint`, `test`, `build`) remain mandatory.
- **UX, Accessibility & AI Workflow (Principles 8-9)**: Puzzle overlays respect theming/accessibility settings, and the feature will be delivered via `/speckit` artifacts ensuring reusable abstractions (EventBus hooks, extensions) instead of bespoke React-only logic.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Solve Curated Puzzle (Priority: P1)

As a chess learner, I want to load a curated tactic puzzle and have the board enforce the exact move order so I know immediately if I solved it correctly.

**Why this priority**: Puzzle play is the core user value; without reliable solve enforcement the mode has no purpose.

**Independent Test**: Load a single puzzle via API/React prop, attempt correct and incorrect moves, observe messaging, hinting, and automatic reset when solved.

**Acceptance Scenarios**:

1. **Given** a loaded puzzle with a known FEN and solution, **When** the user plays a move matching the expected SAN/UGLY format, **Then** the board accepts it, advances to the next required move, and updates progress indicators.
2. **Given** the same puzzle, **When** the user plays an illegal or wrong move, **Then** the board rejects the move with inline feedback (sound toast and/or label) and maintains the puzzle position without corrupting history.

---

### User Story 2 - Request Assistance & Track Attempts (Priority: P2)

As a player who gets stuck, I want optional hints, solution reveal, and attempt tracking so I can learn without brute-forcing.

**Why this priority**: Hints and attempt metrics turn Puzzle Mode into a learning aid rather than a binary pass/fail check.

**Independent Test**: Enable hint controls in Puzzle Mode, trigger them, measure attempt counters, and ensure analytics events fire without needing other user stories.

**Acceptance Scenarios**:

1. **Given** an active puzzle, **When** the user requests a hint, **Then** the board highlights the origin square or displays textual guidance without spoiling the full sequence.
2. **Given** a player who has made N attempts, **When** they solve or reset the puzzle, **Then** the attempt counter and success state persist in the Puzzle Mode session object for reporting.

---

### User Story 3 - Curate Puzzle Collections (Priority: P3)

As a content creator or integrator, I want to package a set of puzzles (JSON/PGN) with metadata (difficulty, tags, author) and plug them into Neo Chess Board so my app can cycle through them with progress tracking.

**Why this priority**: Collections unlock demos, documentation, and partner integrations where multiple puzzles and progress charts are required.

**Independent Test**: Load a JSON/PGN collection, iterate forward/back, observe persisted progress map, and confirm React/demo wrappers can subscribe to puzzle change events.

**Acceptance Scenarios**:

1. **Given** a bundle of puzzles with metadata, **When** the integrator calls the Puzzle Mode loader, **Then** the board exposes a typed API returning normalized puzzles and emits events on puzzle change.
2. **Given** a user who solved subset of puzzles, **When** they reload the experience (within the same session storage scope), **Then** previously solved IDs are restored and the UI reflects completion percentage.

---

### Edge Cases

- Puzzle solution requiring underpromotion or en passant must still be validated and surfaced correctly.
- Player attempts to move after puzzle completion should either start the next puzzle (if configured) or lock moves with a completion message.
- Handling PGN puzzles with alternate winning lines (multiple valid moves) requires disambiguation by allowing puzzle authors to mark acceptable variations, and Puzzle Mode MUST honor only those declared alternates.
- Offline/slow network fallback: puzzle definitions should load from local data without blocking the board render.
- Resetting or skipping puzzles must clear pending promotion dialogs and clocks to avoid leaking prior state.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST expose a Puzzle Mode configuration object on both core and React APIs to enable or disable the feature without affecting default board usage.
- **FR-002**: System MUST accept puzzle definitions (JSON or PGN with metadata) containing FEN, solution move list, difficulty label, tags, and author attribution.
- **FR-003**: System MUST validate player moves against the ordered solution, rejecting incorrect moves with event payloads describing the failure reason.
- **FR-004**: System MUST surface puzzle progress state (current puzzle ID, move index, attempts, solved flag) through typed getters/events so host apps can render UI or emit their own telemetry.
- **FR-005**: System MUST provide optional hint actions (show next move origin, textual clue, or highlight) without revealing entire solutions unless explicitly requested.
- **FR-006**: System MUST allow integrators to configure what happens on completion (auto-advance, stay on board, trigger callback) to keep UX consistent with host apps.
- **FR-007**: System MUST persist solved puzzle IDs and attempt counts automatically via built-in `localStorage`, ensuring progress survives browser refreshes without requiring integrator hooks, and fall back to in-memory state with a warning event if persistence fails.
- **FR-008**: System MUST emit accessibility-friendly announcements (ARIA live region text) when puzzles load, hints fire, or solutions complete.
- **FR-009**: System MUST include MkDocs documentation, README highlights, and at least one demo/example page showing Puzzle Mode usage (vanilla + React).
- **FR-010**: System MUST ship Jest tests covering puzzle validation, hint logic, persistence behavior, and event emissions, ensuring coverage targets remain above constitution thresholds.

### Key Entities *(include if feature involves data)*

- **PuzzleDefinition**: Immutable data describing a single puzzle (id, title, fen, solution[], difficulty, tags, author, optional hint text or PGN reference).
- **PuzzleVariant**: Optional alternate solution line attached to a PuzzleDefinition, containing its own ordered moves plus a label (e.g., “Line B”) to indicate acceptable branching paths.
- **PuzzleSessionState**: Runtime state for the currently active puzzle (currentPuzzleId, moveCursor, attempts, solvedAt, hintUsage, autoAdvance setting).
- **PuzzleCollection**: Ordered list of PuzzleDefinitions plus metadata (collection title, description, filter tags) stored client-side and provided to loaders.
- **PuzzleEvents**: EventBus payloads emitted for `puzzle:load`, `puzzle:move`, `puzzle:hint`, `puzzle:complete`, containing both definitions and session snapshots; no built-in logging backend is provided, so integrators handle observability externally.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 95% of correct solutions entered via Puzzle Mode are recognized within one move and advance instantly, ensuring no false negatives are reported during usability testing.
- **SC-002**: Learners can solve a standard three-move tactic in under 90 seconds using hints, as measured by demo telemetry during acceptance testing.
- **SC-003**: At least 90% of beta testers report that Puzzle Mode feedback (success/failure, hints) is clear and accessible in user testing surveys.
- **SC-004**: Documentation and demo analytics show Puzzle Mode content is discoverable, with at least one dedicated MkDocs page and demo entry point linked from README and landing page.

## Assumptions & Dependencies

- Puzzle content will be bundled as JSON/PGN assets loaded locally or via host-provided fetchers; no remote puzzle API is required for the MVP.
- Puzzle progress persistence will rely on first-party localStorage writes; headless/Node environments can no-op or provide shim storage at integration time.
- When localStorage is unavailable or quota-exceeded, Puzzle Mode falls back to in-memory progress storage for the active session and emits a `puzzle:persistence-warning` event so hosts may notify users.
- Stockfish integration is optional; auto-evaluation for hint generation will only run when the host opts in due to performance considerations.
- Integrators MUST keep puzzle metadata non-sensitive; storing PII (e.g., usernames) alongside progress requires an explicit opt-in field outside the core PuzzleDefinition.

## Clarifications

### Session 2025-12-10

- Q: What persistence strategy should Puzzle Mode use for progress data? → A: Always persist with built-in localStorage without extension hooks (Option C).
- Q: How should Puzzle Mode handle alternate winning lines? → A: Accept additional author-defined alternate lines listed in the puzzle definition (Option B).
- Q: Does Puzzle Mode need dedicated observability hooks? → A: No additional observability; host apps infer from existing puzzle events (Option A).
- Q: How should Puzzle Mode handle sensitive metadata/PII? → A: Assume metadata is non-sensitive and forbid PII unless integrators explicitly opt in outside PuzzleDefinition (Option B).
- Q: What happens if localStorage persistence fails? → A: Degrade to in-memory progress and emit a warning event (Option B).
