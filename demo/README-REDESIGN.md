# NeoChessBoard Demo Redesign

This document outlines the structure and workflow of the redesigned NeoChessBoard playground.

## Quick Start

```bash
npm install
npm run build:lib        # generates the library bundle consumed by the demo
cd demo
npm install              # installs optional demo dependencies (Tailwind CDN is loaded at runtime)
npm run dev              # starts the Vite development server
```

> [!IMPORTANT]
> The demo consumes the local `@magicolala/neo-chess-board` build. Run `npm run build:lib` from the repository root whenever
you change the library sources so the demo can resolve the latest build from `dist/`.

## Architecture Overview

```
demo/
├── index.html                 # Tailwind powered layout (3-column shell + notation zone)
├── assets/
│   ├── css/
│   │   └── custom-styles.css  # Gradient, glassmorphism, and animation tokens
│   └── js/
│       └── demo-logic.js      # Vanilla JS orchestrating the board + analytics
├── README-REDESIGN.md         # This file
└── (legacy React playgrounds) # Theme creator & playground remain untouched
```

- **Tailwind CDN** is used for utility primitives; `custom-styles.css` adds bespoke effects (glassmorphism, glow, scrollbars).
- **demo-logic.js** imports the TypeScript library via ESM and exposes:
  - NeoChessBoard initialisation with `ChessJsRules`
  - Move history timeline & navigation helpers
  - Evaluation bar, move-map canvas, blunder meter, and status badges
  - PGN/FEN management with support for `[%eval ...]` annotations
  - Board option toggles (arrows, highlights, premoves, sound, auto-flip, etc.)

## Feature Checklist

| Zone                 | Highlights |
| -------------------- | ---------- |
| Left Sidebar         | Move grid with live cursor, engine selector, theme picker, options, animation speed slider |
| Central Canvas       | Player cards, timers, navigation controls, live status tags, board quick tools |
| Right Insights Panel | Evaluation bar, sparkline move map, blunder meter, live stats grid |
| Bottom Strip         | PGN textarea (load/copy/reset/export), FEN display, sample loader |

## Loading PGNs With Evaluations

1. Paste or load a PGN that contains comments of the form `[%eval +1.25]` or `[%eval #-5]`.
2. Click **Load PGN**.
3. The evaluation bar, move map, and blunder meter synchronise with the cursor position.

The sample button ships with an annotated Ruy Lopez so you can see all widgets in action.

## Responsive Behaviour

- ≥ 1280px: three columns side-by-side, 520–560px board canvas.
- 1024–1280px: columns tighten, board resizes to ~480px.
- ≤ 768px: sections stack vertically and buttons adopt touch-friendly spacing.

## Accessibility & UX Notes

- Keyboard-accessible move list buttons and toggles.
- Toast feedback for copy, load, reset, and option changes.
- `aria-live` regions for evaluation and status updates.
- High contrast by default; focus rings rely on Tailwind form plugin.

## Known Limitations

- Engine profiles are cosmetic presets; hook into your engine backend if available.
- Evaluation-based widgets require PGNs with `[%eval]` comments (no live engine running in the demo).
- Theme creator / playground remain React-powered for backwards compatibility.

## Troubleshooting

| Issue                              | Resolution |
| ---------------------------------- | ---------- |
| `Cannot find module '@magicolala/neo-chess-board'` | Run `npm run build:lib` at repo root to regenerate `dist/`. |
| Board animations feel laggy        | Adjust the slider to < 150 ms or disable animations via toggles. |
| Evaluation widgets empty           | Ensure your PGN contains `[%eval ...]` markers or load the provided sample. |
| Sounds do not play                 | Browser autoplay policies may require a user interaction before sounds are enabled. |

Happy hacking! ♟️
