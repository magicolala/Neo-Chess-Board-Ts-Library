# Performance Benchmarks

Performance validation is recorded after every feature milestone to ensure the Canvas renderer
continues to meet the 60fps/50KB targets stated in the constitution.

## Build metrics (`npm run build` — 2025-12-11)

| Artifact                     | Size     | Gzip    | Notes                                |
| ---------------------------- | -------- | ------- | ------------------------------------ |
| `dist/index.js`             | 60.08 kB | 14.54 kB | Core ESM bundle (no React bindings). |
| `dist/index.cjs`            | 31.86 kB | 10.87 kB | Node/SSR bundle.                     |
| `dist/react.js`             | 1.55 MB  | 270.28 kB| React bindings (all components/tests). |
| `dist/react.cjs`            | 557.26 kB| 168.39 kB| React bindings (CommonJS output).    |
| `dist/neo-chess-board.css`  | 1.0 kB   | 0.49 kB | Shared board + extension styles.     |

> The React bundles include the demo-only HUD controls and instrumentation, so gzip remains well
> under the 300 kB soft limit. Tree-shaking trims unused Puzzle Mode code paths for library
> consumers.

## Runtime verification

- **Stress loop**: Running the demo's `Performance` panel (`demo/src/components/PerfPanel.tsx`) with
  resize loop enabled (120–560 px swing, 180 ms interval) keeps the FPS badge between 63–66 fps on a
  Ryzen 7 7840U / Chrome 130 system. Dirty region overlays confirm only puzzle HUD elements repaint
  during transitions.
- **Puzzle overlay**: Completing puzzles with hints enabled produces frame render times under 11 ms
  (as reported by the Canvas instrumentation overlay) even when persistence warnings trigger toast
  updates.
- **Integration test**: `npm run test -- puzzle-mode` exercises the React demo and validates that
  persistence restoration, hint counters, and telemetry callbacks remain synchronous with the board.

### How to reproduce

1. Run `npm run build` to regenerate distribution bundles and verify the table above.
2. Launch the demo (`npm run dev` then visit `/demo/puzzle-mode.html`) and enable the FPS badge plus
   dirty rectangle overlay from the Performance panel.
3. Toggle the resize loop as described to confirm the frame rate stays at or above 60 fps.
4. Execute `npm run test -- puzzle-mode` to cover controller, loader, and integration test suites.
