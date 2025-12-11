---

description: "Task list for Puzzle Mode feature implementation"
---

# Tasks: Puzzle Mode

**Input**: Design documents from `/specs/002-puzzle-mode/`  
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, quickstart.md, contracts/

**Tests**: Story phases include targeted Jest coverage per FR-010.

**Organization**: Tasks are grouped by user story so each slice is independently testable.

**Constitution Reminder**: Each story MUST maintain zero runtime dependencies, include lint/test/build validation, document public changes, and protect accessibility/performance commitments.

## Format: `[ID] [P?] [Story?] Description`

- **[P]** marks parallelizable tasks.
- **[US#]** labels user-story phases only.
- Every task references exact file paths.

---

## Phase 1: Setup (Shared Infrastructure)

- [X] T001 Seed reusable puzzle fixtures in `tests/fixtures/puzzles/daily-tactics.json` covering canonical + variant lines
- [X] T002 Scaffold extension directory `src/extensions/puzzle-mode/` with placeholder `index.ts`
- [X] T003 Create demo feature entry folder `demo/src/features/puzzle-mode/` and register route in `demo/src/main.tsx`

---

## Phase 2: Foundational (Blocking Prerequisites)

- [X] T004 Implement Puzzle Mode type definitions (`PuzzleDefinition`, `PuzzleVariant`, `PuzzleSessionState`) in `src/extensions/puzzle-mode/types.ts`
- [X] T005 Build persistence helper with localStorage + in-memory fallback in `src/utils/puzzle/persistence.ts`
- [X] T006 Extend EventBus typings with `puzzle:*` payloads in `src/core/logic/events/puzzle-events.ts`
- [X] T007 Add puzzle feature guards and configuration keys to `src/core/logic/NeoChessBoard.ts`

**Checkpoint**: Types, persistence utilities, and events exist before story work.

---

## Phase 3: User Story 1 – Solve Curated Puzzle (Priority: P1) 🎯 MVP

**Goal**: Enforce ordered puzzle solutions (including alternate lines) with completion controls and UI feedback.

**Independent Test**: Load one puzzle via API/React prop, play correct & incorrect moves, confirm inline feedback, completion airflow (auto-advance vs hold), and that resets clear pending promotions/clocks.

### Tests for User Story 1

- [X] T008 [P] [US1] Add controller happy-path tests (`canonical`, `variant`) in `tests/unit/extensions/puzzle-mode.controller.test.ts`
- [X] T009 [P] [US1] Add edge-case tests (underpromotion, en passant, post-completion lock, reset clearing) in `tests/unit/extensions/puzzle-mode.edge-cases.test.ts`

### Implementation for User Story 1

- [X] T010 [US1] Implement `PuzzleController` state machine honoring canonical + variant lines in `src/extensions/puzzle-mode/PuzzleController.ts`
- [X] T011 [US1] Wire Puzzle Mode configuration into board lifecycle (`enablePuzzleMode`, puzzle events) in `src/core/logic/NeoChessBoard.ts`
- [X] T012 [US1] Implement completion behavior options (auto-advance, stay, callback hook) in `src/extensions/puzzle-mode/completion-options.ts`
- [X] T013 [US1] Ensure resets/skip clear promotion dialogs and clocks in `src/core/logic/NeoChessBoard.ts`
- [X] T014 [US1] Expose puzzle props/events via React wrapper `src/react/components/NeoChessBoard.tsx`
- [X] T015 [P] [US1] Build puzzle status overlay component (progress, remaining moves) in `src/extensions/puzzle-mode/components/PuzzleStatusOverlay.tsx`

**Checkpoint**: Puzzle Mode toggles on, enforces move order, and surfaces completion behaviors + overlay.

---

## Phase 4: User Story 2 – Request Assistance & Track Attempts (Priority: P2)

**Goal**: Provide hints, track attempts, persist progress state, and emit accessibility-friendly feedback.

**Independent Test**: Enable hints, request assistance, observe attempt counter + ARIA announcements, and verify persistence warnings surface when storage fails.

### Tests for User Story 2

- [ ] T016 [P] [US2] Add hint + attempt tracking unit tests `tests/unit/extensions/puzzle-mode.hints.test.ts`
- [ ] T017 [P] [US2] Add persistence warning + ARIA event tests `tests/unit/extensions/puzzle-mode.persistence-warning.test.ts`

### Implementation for User Story 2

- [ ] T018 [US2] Implement `PuzzleHintService` (origin highlight + textual hints) in `src/extensions/puzzle-mode/PuzzleHintService.ts`
- [ ] T019 [US2] Extend `PuzzleSessionManager` for attempt counters, hint usage, and fallback warnings in `src/extensions/puzzle-mode/PuzzleSessionManager.ts`
- [ ] T020 [US2] Add React hint controls + attempt readouts in `src/react/components/PuzzleControls.tsx`
- [ ] T021 [US2] Emit ARIA live-region announcements for hints/completions in `src/react/components/NeoChessBoard.tsx`
- [ ] T022 [US2] Surface telemetry hooks (`onPuzzleEvent`) for host analytics in `src/extensions/puzzle-mode/events.ts`

**Checkpoint**: Hints, attempts, persistence fallback, and ARIA messaging work end-to-end.

---

## Phase 5: User Story 3 – Curate Puzzle Collections (Priority: P3)

**Goal**: Load puzzle collections with metadata, navigate puzzles, and present progress dashboards in examples/demo.

**Independent Test**: Load JSON/PGN collection, change filters, navigate puzzles, reload page to confirm persisted solved map and view demo analytics panel.

### Tests for User Story 3

- [ ] T023 [P] [US3] Add collection loader tests (filtering, pagination) `tests/unit/utils/puzzleCollections.test.ts`
- [ ] T024 [P] [US3] Add React/demo integration test covering persistence restoration `tests/integration/react/puzzle-mode.demo.test.tsx`

### Implementation for User Story 3

- [ ] T025 [US3] Implement loader utilities + metadata normalization in `src/utils/puzzleCollections.ts`
- [ ] T026 [US3] Update `examples/chess-puzzles.tsx` to consume Puzzle Mode APIs and show solved progress
- [ ] T027 [US3] Build demo experience `demo/src/features/puzzle-mode/index.tsx` (filters, navigation, success metrics)
- [ ] T028 [US3] Create progress/persistence panel component `demo/src/features/puzzle-mode/ProgressPanel.tsx`
- [ ] T029 [US3] Document optional host API hooks (per contracts) in `demo/src/features/puzzle-mode/api-notes.tsx`

**Checkpoint**: Collections feature is demoable with persistent progress and host extension hooks.

---

## Phase 6: Polish & Cross-Cutting Concerns

- [ ] T030 Update MkDocs guide `mkdocs_docs/guides/puzzle-mode.md` with configuration, completion options, and persistence warnings
- [ ] T031 Extend `mkdocs_docs/examples.md` + landing page links showcasing Puzzle Mode example
- [ ] T032 Refresh README feature list + Quick Start snippet referencing Puzzle Mode `README.md`
- [ ] T033 Update quickstart instructions in `specs/002-puzzle-mode/quickstart.md` with final API and success metrics
- [ ] T034 Record release notes + success metrics summary in `CHANGELOG.md`
- [ ] T035 Capture bundle size + 60fps validation notes in `docs/performance.md` (create if missing)
- [ ] T036 Run `npm run lint` and document outcome in `specs/002-puzzle-mode/tasks.md`
- [ ] T037 Run `npm run test -- --runInBand` ensuring coverage for new suites; log summary in `specs/002-puzzle-mode/tasks.md`
- [ ] T038 Run `npm run build` to confirm type safety; log success in `specs/002-puzzle-mode/tasks.md`

---

## Dependencies & Execution Order

- Setup (Phase 1) → Foundational (Phase 2) unlocks all user stories.
- Story order: US1 → US2 → US3 (later stories rely on controller/session primitives).
- Polish phase runs after all stories; quality gates (lint/test/build) must pass before completion.

## Parallel Opportunities

- **US1**: Controller/edge-case tests (T008–T009) can run parallel once types exist; UI overlay (T015) can progress alongside core integration (T010–T014).
- **US2**: Hint + persistence tests (T016–T017) may start while services (T018–T019) are underway; ARIA work (T021) can run parallel to React controls (T020) after base wiring.
- **US3**: Loader tests (T023) can run with example updates (T026); demo components (T027–T028) are parallel once loader util (T025) lands.
- **Polish**: Documentation tasks (T030–T034) can be split, while performance validation (T035) happens before running lint/test/build (T036–T038).

## Implementation Strategy

1. **MVP First**: Complete Phases 1–3 to deliver solvable puzzles with strict validation and completion options.
2. **Enhance UX**: Layer hints, tracking, and accessibility in Phase 4.
3. **Showcase Collections**: Implement loaders, examples, and demo dashboards in Phase 5.
4. **Polish & Validate**: Update docs, measure performance, and run lint/test/build before concluding.
