# AGENTS Guidelines for Neo Chess Board TS Library

Welcome! This repository uses TypeScript, Vite, Jest, ESLint, and Playwright for testing. Please keep the following points in mind when contributing:

## Workflow
1. **Check for existing instructions** – Look for nested `AGENTS.md` files in the subdirectories you work in; they override these root instructions.
2. **Install dependencies** – Run `npm install` if you haven't already.
3. **Code style** – Use the default ESLint/Prettier config. Avoid formatting changes that aren't relevant to your change.
4. **Testing** – Run `npm run lint` and `npm run test`. If you change anything that affects the demos, also run `npm run test:e2e`.
5. **Build** – Run `npm run build` to ensure the bundle compiles without errors.
6. **Documentation** – Update docs if necessary. The docs site is powered by MkDocs.
7. **Demo updates** – Whenever you add or adjust features, update the public demos (e.g., under `examples/` or `demo/`) when possible so they showcase the latest capabilities.

## Coding Guidelines
- Prefer TypeScript generics and strict typing.
- Keep components small and focused.
- Respect existing naming conventions (PascalCase for components, camelCase for helpers).
- Write unit tests for new functionality.
- Do not check in generated files.

## Pull Requests
- Provide clear commit messages.
- Summarize your changes and testing in the PR description.

Thank you for contributing!
