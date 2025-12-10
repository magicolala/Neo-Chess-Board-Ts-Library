<!--
Sync Impact Report
Version: 1.0.0 -> 1.1.0
Modified Principles:
- TypeScript-first -> TypeScript-First Safety
- Zero runtime dependencies -> Runtime Minimalism & Peer Boundaries
- Stable public API -> Stable Public API Contracts
- Performance first + Performance & Bundle Size -> Performance & Bundle Discipline
- Chess correctness -> Chess Correctness & Engine Fidelity
- Testing & Quality -> Quality Gates & Test Coverage
- Documentation & Demos -> Documentation & Demo Accountability
- UX, Accessibility & Polishing -> UX, Accessibility & Polish
- AI & Spec-Driven Workflow -> Spec-Driven AI Workflow
- Contribution Principles -> Incremental Contribution Discipline
Added Sections:
- Governance Metadata
- Architectural Guardrails
- Governance (Amendments, Versioning Policy, Compliance Review)
Removed Sections:
- API & Versioning (merged into Principle 3 + Governance)

Templates requiring updates:
- .specify/templates/plan-template.md [updated] ✅
- .specify/templates/spec-template.md [updated] ✅
- .specify/templates/tasks-template.md [updated] ✅

Follow-up TODOs:
- TODO(RATIFICATION_DATE): Confirm original adoption date with maintainers
-->

# Neo Chess Board Project Constitution

This constitution defines the non-negotiable rules for Neo Chess Board. Every spec,
plan, task list, code change, documentation update, and AI-assisted workflow MUST
comply with the principles below.

---

## Governance Metadata

- **Constitution Version**: 1.1.0
- **Ratification Date**: TODO(RATIFICATION_DATE): Confirm original adoption date with maintainers
- **Last Amended Date**: 2025-12-10
- **Stewards**: Neo Chess Board maintainers (Cedric Oloa plus trusted contributors)
- **Applies To**: Library source, demo, docs, tests, tooling, and all Spec Kit outputs

---

## Purpose & Scope

Neo Chess Board is a TypeScript-first, zero-runtime-dependency chess rendering
library that provides:

- A high-performance Canvas chess board that targets 60fps interactions
- A headless chess engine/game core (ChessGame plus adapters)
- Optional React bindings, Stockfish integrations, clocks, themes, and extensions

### Out-of-Scope Commitments

- Backend services, persistence, or multiplayer infra
- Account systems, chat, matchmaking, analytics pipelines
- Feature work that bypasses the core-first approach (React-only features are disallowed)

Any proposal that drifts outside this remit MUST be rejected or moved to an
extension that is clearly optional.

---

## Principles

### Principle 1 – TypeScript-First Safety

- All new modules MUST be written in TypeScript with strict typing enabled.
- Public APIs MUST declare explicit interfaces; `any` is forbidden unless justified
  with a comment referencing the blocking issue.
- Workers, React bindings, demo code, and tests MUST keep type coverage at 100%.

**Rationale**: Type-level guarantees prevent runtime regressions in a library that
is embedded into third-party apps.

---

### Principle 2 – Runtime Minimalism & Peer Boundaries

- The core package MUST remain dependency-free at runtime; React stays a peer-only
  dependency for the bindings.
- Heavy features (Stockfish, effects, analytics) MUST ship as optional extensions
  loaded on demand.
- Build tooling dependencies are allowed only in dev; runtime additions require
  written steward approval inside the spec.

**Rationale**: Zero dependencies keep bundle size predictable and make the library
safe for any consumer environment.

---

### Principle 3 – Stable Public API Contracts

- Public APIs (classes, hooks, helpers, events) MUST be intentional, documented,
  and semver-governed.
- Breaking changes demand a spec section describing migration steps and require a
  major release plus doc updates before merge.
- Default behaviors are sacred; new options MUST be additive with sane defaults.

**Rationale**: App teams integrate Neo Chess Board in production; API churn erodes
trust and increases migration cost.

---

### Principle 4 – Chess Correctness & Engine Fidelity

- Move validation, FEN/PGN parsing, Chess960 handling, Stockfish interop, and
  clock behavior MUST be provably correct with tests replicating tricky cases.
- Fancy UX cannot override chess rules. Illegal move blocking, promotion flows,
  and premove logic MUST defer to the rules adapters.
- Any change touching rules MUST describe coverage in specs and add regression
  tests before merge.

**Rationale**: Visual polish is useless without accurate chess decisions.

---

### Principle 5 – Performance & Bundle Discipline

- Canvas rendering MUST target 60fps on mid-range hardware with dirty-region and
  caching strategies; regressions require performance notes in PRs.
- Library builds MUST stay under 50KB gzipped; heavy assets belong in demos or
  are lazy-loaded.
- Plans MUST explain bundle and runtime impact plus opt-in strategy for costly
  features (extensions, async imports, workers).

**Rationale**: Consumers embed the board alongside other UI; performance regressions
harm entire hosts.

---

### Principle 6 – Quality Gates & Test Coverage

- `npm run lint`, `npm run test`, and `npm run build` MUST pass locally before a
  PR is considered mergeable.
- Jest coverage targets stay above 80% statements/branches/functions/lines; new
  features cannot lower coverage.
- Specs and plans MUST state which behaviors will be covered by tests, and tasks
  MUST include the corresponding test files.

**Rationale**: Automated gates are the only scalable way to protect a library that
is widely reused.

---

### Principle 7 – Documentation & Demo Accountability

- MkDocs docs, README, and demos MUST reflect every public change before release.
- Specs MUST answer “what needs to be documented?” and “does a demo/example need
  to change?”; tasks MUST include Doc + Demo items when applicable.
- Breaking or notable behavioral shifts require migration notes in docs plus
  changelog entries.

**Rationale**: Without up-to-date docs, downstream integrators cannot safely adopt
new versions.

---

### Principle 8 – UX, Accessibility & Polish

- Default themes, piece sets, audio, and animations MUST remain visually coherent
  and configurable; no hard-coded colors where configuration exists.
- Accessibility extensions (keyboard, screen reader, ARIA) MUST stay compatible
  with new features.
- Any UX-breaking change (interaction defaults, auto-flip rules, coordinate
  layout) MUST receive explicit sign-off in the spec and doc updates.

**Rationale**: The board is often embedded in consumer-facing products; regressions
in polish or accessibility are customer-visible defects.

---

### Principle 9 – Spec-Driven AI Workflow

- Every AI-assisted change MUST originate from `/speckit.specify` and `/speckit.plan`
  outputs, with `/speckit.tasks` used for execution breakdown.
- Files generated from templates MUST replace placeholder content; no “rewrite the
  whole file” prompts without context.
- Plans MUST reuse existing abstractions (EventBus, extensions, adapters) and
  state explicitly when they diverge (with steward approval).

**Rationale**: Structured specs keep AI contributions auditable and prevent scope
drift.

---

### Principle 10 – Incremental Contribution Discipline

- Keep PRs small, focused, and reference the relevant Spec Kit artifacts.
- Maintain backward compatibility; experimental ideas belong in feature flags or
  extensions, not the mainline path.
- Changes touching public contracts MUST include migration guidance and tests in
  the same PR.

**Rationale**: Incremental delivery keeps the library releasable at all times.

---

## Architectural Guardrails

- Core logic (ChessGame, rules adapters) MUST remain headless and DOM-free; UI
  layers consume these APIs via events.
- Rendering stays Canvas-first with React as a wrapper, never the source of truth.
- Extensions handle optional capabilities (clock UI, Stockfish workers, camera
  effects); core stays lean and composable.
- Workers MUST use `addEventListener` for message/error handling; `onmessage`
  shortcuts are forbidden to maintain lint compliance.
- Configuration flows from core → React wrappers → demos; never the reverse.

---

## Governance

### Amendment Procedure

1. Propose a change via `/speckit.specify` describing the governance gap.
2. Draft the amendment in `/speckit.plan`, including version bump rationale.
3. Update this constitution plus impacted templates in the same PR.
4. Obtain steward approval before merge; document rationale in PR notes.

---

### Versioning Policy

- Use semantic versioning for the constitution itself.
- **MAJOR**: Removes or redefines a principle or governance process.
- **MINOR**: Adds a new principle/section or materially expands guidance (this amendment is MINOR).
- **PATCH**: Clarifications, typo fixes, or wording-only tweaks.
- Version line in Governance Metadata MUST match the Sync Impact Report.

---

### Compliance Review

- Plans and specs MUST cite how they satisfy Principles 1–10 in the Constitution
  Check section.
- During code review, maintainers MUST block any change that bypasses lint/test/
  build gates, introduces runtime dependencies, or lacks docs/tests per the above.
- Quarterly (or before each release), run a compliance audit: confirm docs, demos,
  and templates still reflect the constitution; record findings in `/specs` or
  governance notes.

---

Adhering to this constitution keeps Neo Chess Board reliable, predictable, and
pleasant to integrate. Deviations require explicit written approval and a follow-up
amendment.
