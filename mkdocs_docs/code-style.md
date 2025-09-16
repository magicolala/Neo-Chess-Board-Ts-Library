# 🎯 Neo Chess Board Code Style Guide

This document describes the internal style conventions that keep the Neo Chess Board
canvas utilities predictable and easy to maintain. The rules are enforced directly in
`DrawingManager` through reusable helpers and constants so behaviour stays consistent
across new features.

## ♟️ Drawing primitives

- **Normalize arrow input** – every arrow must pass through `normalizeArrow` before
  entering the manager's state. The helper injects default `color`, `width`, `opacity`
  and `knightMove` values defined in `DEFAULT_ARROW_STYLE` so downstream rendering never
  has to branch on optional properties.
- **Immutable accessors** – public getters such as `getArrows`, `getHighlights` and
  `getDrawingState` always clone the internal arrays. External code cannot mutate the
  drawing state inadvertently.
- **Deterministic exports** – `exportState` serializes the sanitized `getDrawingState`
  output. Import routines re-run the same normalization to avoid stale or malformed
  data sneaking into the overlay cache.

## ⌨️ Modifier handling

- **Single source of truth** – the trio of modifier keys (`shift`, `ctrl`, `alt`) is
  represented by the `ModifierState` type and resolved through `getActiveModifier`.
  Priority is defined once in `MODIFIER_PRIORITY` (`Shift` > `Ctrl` > `Alt`).
- **Arrow colors** – `resolveArrowColor` maps the active modifier to
  `ARROW_COLOR_BY_MODIFIER`, guaranteeing that identical gestures always reuse the same
  tint.
- **Highlight colors** – `resolveHighlightTypeFromModifiers` applies
  `HIGHLIGHT_TYPE_BY_MODIFIER`, mirroring the arrow logic so keyboard shortcuts remain
  intuitive.

## 🟥 Highlight rules

- **Managed highlight cycle** – `HIGHLIGHT_SEQUENCE` defines the precise order used by
  `cycleHighlight`. Cycling past the last entry removes the highlight, matching the
  previous UI expectation.
- **Opacity semantics** – default opacity values live in
  `SPECIAL_HIGHLIGHT_OPACITY` and `DEFAULT_HIGHLIGHT_OPACITY`. Any new highlight type
  should either reuse these constants or introduce a dedicated entry rather than inline
  literals.
- **Color fallback** – `resolveHighlightColor` delegates to the managed palette and
  gracefully falls back to the configured circle color when an unknown type is
  encountered.

## 🖼 Canvas hygiene

- **Centralised context access** – helpers like `renderArrows`, `renderHighlights` and
  `renderPremove` wrap drawing logic in `withContext` to ensure a valid 2D context is
  present before performing work.
- **Reusable stroke styling** – `applyArrowStyle` is the only place that mutates line
  caps, joins, widths and opacities for arrows. Custom arrow renderers must call it to
  stay visually consistent.

## ✅ Recommended workflow

1. Use the helpers above instead of duplicating modifier or colour logic.
2. When a new drawing type is introduced, extend the relevant constant
   (`DEFAULT_ARROW_STYLE`, `HIGHLIGHT_SEQUENCE`, etc.) first so subsequent code reads the
   rule rather than redefining it.
3. Keep public methods free of raw state mutations—always go through the provided
   helpers to preserve invariants.
