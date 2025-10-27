# AGENTS Guidelines for Neo Chess Board TS Library

Welcome! This repository contains a TypeScript chessboard rendering library with React bindings built with Vite. Please keep the following points in mind when contributing:

## Workflow
1. **Check for nested instructions** – Look for additional `AGENTS.md` files in subdirectories you work in; they override these root instructions.
2. **Install dependencies** – Run `npm install` after cloning or when dependencies change.
3. **Code style** – Follow the ESLint/Prettier configuration in the repo. Avoid unrelated formatting-only changes.
4. **Testing** – Run `npm run lint` and `npm run test`. Use `npm run test:watch` or `npm run test:coverage` when appropriate.
5. **Build** – Run `npm run build` to compile the library (this runs `tsc` and the Vite build). Use `npm run build:lib` or `npm run build:demo` if you need to build only the library or the demo respectively.
6. **Documentation** – Update the MkDocs documentation in `mkdocs_docs/` when you change public APIs or behaviour that users rely on.
7. **Demo updates** – Keep the examples in `examples/` and the standalone demo in `demo/` in sync with new features whenever possible.

## Coding Guidelines
- Prefer strict TypeScript typing and generics where it clarifies API usage.
- Keep components and utilities focused and composable.
- Respect existing naming conventions (PascalCase for components, camelCase for helpers).
- Add or update Jest tests for new functionality or bug fixes.
- Do not commit generated build artifacts (`dist/`, coverage folders, etc.).

## Pull Requests
- Write descriptive commit messages.
- Summarize the changes and list the tests you ran in the PR description.

Thank you for contributing!
