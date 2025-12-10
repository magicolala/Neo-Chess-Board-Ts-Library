---

description: "Task list for Puzzle Mode feature implementation"
---

# Tasks: Puzzle Mode

**Input**: Design documents from `/specs/002-puzzle-mode/`  
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, quickstart.md, contracts/

**Tests**: Story phases include targeted Jest tasks to keep FR-010 coverage.

**Organization**: Tasks are grouped by user story so each slice is independently testable.

**Constitution Reminder**: Every story MUST cover lint/test/build gates, docs/demo updates when behavior changes, performance/bundle considerations, and zero-runtime-dependency constraints.

## Format: `[ID] [P?] [Story?] Description`

- **[P]**: Parallelizable (different files, no blocking dependency)
- **[Story]**: User story mapping (US1, US2, US3)
- Include exact file paths in every description

---

## Phase 1: Setup (Shared Infrastructure)

- [ ] T001 Create puzzle fixture dataset `tests/fixtures/puzzles/daily-tactics.json` with canonical + variant lines for reuse across stories
- [ ] T002 Scaffold demo entry directory `demo/src/features/puzzle-mode/` with placeholder `index.tsx` and routing hook-up in `demo/src/main.tsx`

---

## Phase 2: Foundational (Blocking Prerequisites)

- [ ] T003 Implement Puzzle Mode TypeScript interfaces (`PuzzleDefinition`, `PuzzleVariant`, `PuzzleSessionState`) in `src/extensions/puzzle-mode/types.ts`
- [ ] T004 Build `puzzlePersistence` helper (localStorage + memory fallback) in `src/utils/puzzle/persistence.ts`
- [ ] T005 Extend EventBus typings and constants for `puzzle:*` events in `src/core/logic/events/puzzle-events.ts`

**Checkpoint**: Types, persistence utilities, and events ready before any user story work.

---

## Phase 3: User Story 1 – Solve Curated Puzzle (Priority: P1) 🎯 MVP

**Goal**: Enforce ordered puzzle solutions with immediate feedback and board integration.

**Independent Test**: Load a single puzzle via API/React prop, play correct and incorrect moves, observe inline feedback and automatic reset on completion.

### Tests for User Story 1

- [ ] T006 [P] [US1] Add core validation tests for puzzle sequences in `tests/unit/core/puzzle-mode.validation.test.ts`

### Implementation for User Story 1

- [ ] T007 [US1] Implement `PuzzleController` state machine in `src/extensions/puzzle-mode/PuzzleController.ts`
- [ ] T008 [US1] Wire Puzzle Mode configuration into `NeoChessBoard` core logic at `src/core/logic/NeoChessBoard.ts`
- [ ] T009 [US1] Expose puzzleMode props/events through React wrapper `src/react/components/NeoChessBoard.tsx`
- [ ] T010 [P] [US1] Create puzzle status overlay component in `src/extensions/puzzle-mode/components/PuzzleStatusOverlay.tsx`

**Checkpoint**: Puzzle Mode can be toggled on, validates move order, and surfaces UI feedback.

---

## Phase 4: User Story 2 – Request Assistance & Track Attempts (Priority: P2)

**Goal**: Provide hints, track attempts, and persist progress metrics with accessibility signals.

**Independent Test**: Enable hints in Puzzle Mode, request assistance, verify attempt counter updates, and ensure ARIA announcements occur without other story dependencies.

### Tests for User Story 2

- [ ] T011 [P] [US2] Add hint + attempt tracking unit tests `tests/unit/core/puzzle-mode.hints.test.ts`

### Implementation for User Story 2

- [ ] T012 [US2] Implement `PuzzleHintService` handling origin highlights/text in `src/extensions/puzzle-mode/PuzzleHintService.ts`
- [ ] T013 [US2] Extend `PuzzleSessionManager` with attempt counters and persistence hooks in `src/extensions/puzzle-mode/PuzzleSessionManager.ts`
- [ ] T014 [US2] Add React controls for hint buttons and attempt readouts in `src/react/components/PuzzleControls.tsx`
- [ ] T015 [P] [US2] Emit ARIA live-region announcements for hints/completions in `src/react/components/NeoChessBoard.tsx`

**Checkpoint**: Hints and attempt tracking fully functional with persistence and accessibility compliance.

---

## Phase 5: User Story 3 – Curate Puzzle Collections (Priority: P3)

**Goal**: Support loading collections with metadata, navigating puzzles, and showcasing progress in demo/examples.

**Independent Test**: Load a JSON/PGN collection, navigate forward/back, persist solved IDs, and render progress charts in demo without relying on previous stories.

### Tests for User Story 3

- [ ] T016 [P] [US3] Add collection loader tests for pagination/filtering `tests/unit/utils/puzzleCollections.test.ts`

### Implementation for User Story 3

- [ ] T017 [US3] Implement collection loader utilities `src/utils/puzzleCollections.ts`
- [ ] T018 [US3] Update `examples/chess-puzzles.tsx` to consume Puzzle Mode APIs and new loader
- [ ] T019 [US3] Build demo showcase `demo/src/features/puzzle-mode/index.tsx` with controls for filters and navigation
- [ ] T020 [US3] Implement progress/persistence panel in `demo/src/features/puzzle-mode/ProgressPanel.tsx`

**Checkpoint**: Collections can be curated, navigated, and demoed with persisted progress visualized.

---

## Phase 6: Polish & Cross-Cutting Concerns

- [ ] T021 Document Puzzle Mode usage in `mkdocs_docs/guides/puzzle-mode.md` (props, events, persistence, demos)
- [ ] T022 Update README feature list and Quick Start snippets referencing Puzzle Mode `README.md`
- [ ] T023 Add quickstart instructions/examples to `mkdocs_docs/examples.md` and link from `mkdocs_docs/index.md`
- [ ] T024 Record release notes in `CHANGELOG.md` and ensure success metrics in `quickstart.md`

---

## Dependencies & Execution Order

- **Setup (Phase 1)** → **Foundational (Phase 2)** → unlocks all user stories.
- **User Story Order**: US1 (core validation) → US2 (hints/tracking) → US3 (collections). Later stories depend on PuzzleController + session state from earlier phases.
- **Polish** runs after all stories or when docs/demo ready.

## Parallel Opportunities

- US1: T006/T010 can run parallel to T007-T009 once foundational types exist.
- US2: T011 and T015 can run while T012-T014 progress.
- US3: T016 and T018 can run once loader API contract (T017) stabilizes; demo tasks (T019-T020) parallelizable.
- Cross-cutting docs (T021-T023) may start after relevant features stabilize.

## Implementation Strategy

1. **MVP First**: Complete Phases 1–3 to deliver solvable puzzles with enforced move order.
2. **Incremental Enhancements**: Layer hints/attempt tracking (Phase 4) and collections/demo work (Phase 5).
3. **Polish** last, ensuring documentation, README, and changelog accurately reflect delivered features.
