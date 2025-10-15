# Test Results - Neo Chess Board

## Summary

Complete test suite for the Neo Chess Board TypeScript/React library.

**Total tests executed: 320 tests (17 suites)**

- ✅ **Passed tests: 320**
- ❌ **Failed tests: 0**
- ⏱️ **Execution time: ~17 seconds on a standard CI machine**

## Tests by module

### ✅ Core modules (13 suites)

- **NeoChessBoard**: Manual orientation & auto-flip, sound management, event callbacks, and `DrawingManager` integration.
- **DrawingManager**: Pixel-perfect rendering for arrows, circles, highlights, premoves, and coordinates that always stay bottom/left.
- **LightRules**: Legal move logic, promotions, castling, repetition detection, and check detection.
- **ChessJsRules**: Full compatibility with Chess.js (valid/invalid FEN, synchronized side to move).
- **PGN & PgnNotation**: Generation, parsing, and advanced annotations (NAG, comments, symbolic glyphs).
- **PgnAnnotationParser / PgnNotationAnnotations**: Validation for symbols, comments, and nested variations.
- **Premoves**: End-to-end storage, execution, and cancellation of programmed moves.
- **Themes & FlatSprites**: High-resolution palette rendering and responsive piece sprites.
- **Utils**: FEN/PGN helpers, square conversions, easing utilities.

### 🔗 Integration tests

- **PgnChessJsIntegration**: Chess.js ↔ PGN ↔ Chess.js round-trip with metadata validation and legal move checks.

### ⚛️ React components & demo

- **React `<NeoChessBoard />`**: Controlled props, auto-flip, event hooks, SSR-friendly rendering.
- **Demo App**: User scenarios (auto-flip toggle, theme switches, locked coordinates).

### 📦 Public API

- **exports.test.ts**: Ensures documented exports stay available and properly typed.

## Test configuration

- Jest runs with a custom `setup.ts` that handles Canvas, ResizeObserver, and DOM APIs.
- Coverage is collected via `npm run test:coverage` and published to `coverage/lcov-report` locally.
- Visual regression helpers live in `tests/demo` and can be reused for manual QA.
