# Clean Code Guidelines

This project relies on a lean codebase to deliver great performance and keep maintenance affordable. This document recaps the most recent cleanup work, highlights areas that still need attention, and restates the habits that help us keep the library "clean" over time.

## Recent cleanup summary

- Removed the `DrawingManager.ts.bak` backup file that duplicated the active drawing manager implementation.
- Deleted unused imports and constants (`sqToFR`, `Move`, `highlightCycle`, recursive export) to avoid unnecessary dependencies.
- Harmonized exports to reduce circular references and make the public API easier to understand.

## Principles to follow

### Remove dead code as soon as it appears

- Delete backup files, unused functions, and unreferenced constants as soon as they are no longer needed.
- Prefer genuinely shared helpers over duplicating snippets across multiple modules.

### Keep imports explicit

- Only import the symbols that are required by the file.
- Group related imports, and keep type-only imports separated when it improves clarity.

### Guard the public API surface

- Export modules intentionally to prevent circular dependencies.
- Keep barrel files minimal and well-documented so consumers can discover capabilities quickly.

### Maintain comprehensive tests

- Update or add tests whenever the public behavior changes.
- Use snapshot tests sparingly and prefer explicit assertions for critical behavior.

### Document decisions

- Leave short comments when non-obvious tradeoffs are made (performance vs. readability, for example).
- Capture noteworthy refactors in the changelog so that future contributors understand the intent behind large diffs.

## Additional recommendations

- Run `npm run lint` and `npm run test` locally before opening a pull request.
- Sync with the maintainer when planning structural changes that may impact the published API.
- Keep dependencies up to date, but always validate the build and demo playgrounds before merging upgrades.
