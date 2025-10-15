# Tests for Neo Chess Board

This directory contains all unit, integration, and UI tests for the Neo Chess Board library.

## Test layout

```
tests/
├── README.md                # Overview and organization guide
├── README.fr.md             # Version française du guide
├── RESULTS.md               # Summary of the latest execution
├── RESULTS.fr.md            # Résultats détaillés en français
├── setup.ts                 # Jest configuration and global mocks
├── assets.d.ts              # Static module declarations for tests
├── jest-dom.d.ts            # jest-dom matcher extensions
├── __mocks__/               # Canvas, ResizeObserver, and other mocks
├── core/                    # Core library test suites
│   ├── ChessJsRules.test.ts           # Chess.js adapter
│   ├── DrawingManager.test.ts         # Overlay rendering, coordinates, arrows
│   ├── EventBus.test.ts               # Pub/Sub event bus
│   ├── FlatSprites.test.ts            # Piece sprite rasterization
│   ├── LightRules.test.ts             # Lightweight chess rules engine
│   ├── NeoChessBoard.test.ts          # Main API, auto-flip, interactions
│   ├── PGN.test.ts                    # PGN recording and export
│   ├── PgnAnnotationParser.test.ts    # Advanced annotation parsing
│   ├── PgnNotation.test.ts            # PGN notation read/write
│   ├── PgnNotationAnnotations.test.ts # NAG symbols and comments
│   ├── premoves.test.ts               # Premove management
│   ├── themes.test.ts                 # Built-in theme validation
│   └── utils.test.ts                  # Chess utility helpers
├── integration/
│   └── PgnChessJsIntegration.test.ts  # Chess.js ↔ PGN round-trip
├── react/
│   └── NeoChessBoard.test.tsx         # React component (hooks, props, autoFlip)
├── demo/
│   └── App.test.tsx                   # Full demo application
└── exports.test.ts                    # Public export verification
```

## Available scripts

- `npm test` – Runs the complete suite in CI mode.
- `npm run test:watch` – Re-runs affected tests automatically.
- `npm run test:coverage` – Generates a coverage report (HTML + terminal).
- `npm run test:ci` – Optimized profile for continuous integration.

## Coverage focus areas

### Core modules

- **NeoChessBoard**: FEN loading, auto-flip, coordinate orientation, sound hooks.
- **DrawingManager**: Arrow rendering, highlights, premoves, and axis alignment.
- **LightRules & ChessJsRules**: Legal move validation, special rules (castling, promotion, en passant).
- **PGN**: Recording, advanced annotations (NAG), end-to-end import/export.
- **Premoves**: Storage, validation, and deferred execution of programmed moves.
- **Themes & FlatSprites**: Palette consistency and responsive sprite rasterization.
- **Utils**: FEN/PGN parsing, math helpers, square conversions.

### Integration tests

- **PgnChessJsIntegration**: Full synchronization between Chess.js, the PGN recorder, and the rules engine.

### React components & demo

- **React `<NeoChessBoard />`**: Controlled/uncontrolled props, auto orientation, event callbacks.
- **Demo App**: Real user scenarios (theme selector, auto-flip, coordinate lock).

### Public exports

- **exports.test.ts**: Ensures the public API remains stable and documented.

## Mocks and setup

`setup.ts` wires:

- Canvas mocks (`getContext`, `drawImage`, `measureText`, ...),
- `ResizeObserver`, `IntersectionObserver`, and `OffscreenCanvas`,
- `URL.createObjectURL` / `URL.revokeObjectURL`,
- jest-dom extensions for React tests,
- global configuration (devicePixelRatio, timers).

## Important notes

- Keep new tests colocated with the module they cover.
- Update `RESULTS.md` after significant changes to highlight new coverage.
- Run `npm run lint` and `npm test` locally before pushing to CI.
