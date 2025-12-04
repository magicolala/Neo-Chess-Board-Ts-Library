# Neo Chess Board - LLM Agent Guidelines

> [!IMPORTANT]
> **Primary Reference Document**: This file is the authoritative source for LLM agents working on this codebase.
> Read completely before starting any work. All workflows and patterns described here are mandatory.

## 🤖 Quick Start

### New to Neo Chess Board? Start Here

1. **Project Type**: TypeScript chess rendering library with React bindings
2. **Build Tool**: Vite (library mode + demo)
3. **Testing**: Jest with coverage requirements
4. **Documentation**: MkDocs for user-facing docs

### Pre-Work Checklist (Mandatory)

```bash
git status && npm --version && ls -la
npm run test && npm run build  # Verify baseline works
```

## 📚 Project Structure

```text
neo-chess-board/
├── src/                    # Library source code
│   ├── agents/            # Stockfish agent and analysis
│   ├── clock/             # Clock management
│   ├── core/              # Core chess board logic
│   │   ├── logic/        # Chess game logic
│   │   └── extensions/   # Board extensions
│   ├── effects/           # Visual effects (camera, easing)
│   ├── engine/            # Stockfish engine integration
│   ├── extensions/        # High-level extensions
│   ├── rendering/         # Rendering utilities
│   ├── react/             # React component wrappers
│   ├── utils/             # Helper functions
│   └── workers/           # Web Workers (Stockfish)
├── demo/                  # Standalone demo application
├── examples/              # Usage examples
├── mkdocs_docs/           # User documentation (MkDocs)
├── tests/                 # Jest test files
└── dist/                  # Build output (gitignored)
```

## 🛠️ Development Workflows

### Essential Commands

```bash
# Installation
npm install              # After clone or dependency changes

# Development
npm run dev             # Start Vite dev server
npm run test:watch      # Jest watch mode
npm run lint            # ESLint check
npm run format          # Prettier format

# Quality Gates (Mandatory before commit)
npm run lint            # ESLint validation
npm run test            # Run all tests
npm run build           # Verify build succeeds

# Specialized Builds
npm run build:lib       # Library only
npm run build:demo      # Demo only
npm run test:coverage   # Coverage report
```

### Pre-Commit Checklist

- [ ] `npm run lint` passes (no warnings)
- [ ] `npm run test` passes (all tests green)
- [ ] `npm run build` succeeds (no TypeScript errors)
- [ ] Documentation updated if API changed
- [ ] Demo/examples updated if behavior changed

## 🎯 Coding Standards

### TypeScript Guidelines

```typescript
// ✅ CORRECT: Strict typing with generics
interface ChessPieceProps<T extends PieceType> {
  type: T;
  position: Position;
  onMove: (from: Position, to: Position) => void;
}

// ✅ CORRECT: Explicit return types
export function calculateValidMoves(
  piece: ChessPiece,
  board: Board
): Position[] {
  // Implementation
}

// ❌ INCORRECT: Implicit any
function processMove(data) { ... }

// ❌ INCORRECT: Type assertions without verification
const piece = data as ChessPiece;
```

### Component Patterns

```typescript
// ✅ CORRECT: Focused, composable components
export const ChessBoard: React.FC<ChessBoardProps> = ({ position, onMove }) => {
  // Single responsibility: render board
};

// ✅ CORRECT: Custom hooks for logic
export const useChessGame = (initialFen?: string) => {
  // Encapsulated game logic
};

// ❌ INCORRECT: God components with mixed concerns
export const ChessApp: React.FC = () => {
  // Rendering + game logic + state + API calls
};
```

### Naming Conventions

- **Components**: `PascalCase` (e.g., `ChessBoard`, `PieceRenderer`)
- **Functions/Variables**: `camelCase` (e.g., `calculateMoves`, `isValidMove`)
- **Constants**: `UPPER_SNAKE_CASE` (e.g., `DEFAULT_FEN`, `PIECE_VALUES`)
- **Types/Interfaces**: `PascalCase` (e.g., `Position`, `GameState`)
- **Files**: `kebab-case` (e.g., `chess-board.tsx`, `move-validator.ts`)

## 🧪 Testing Strategy

### Test Requirements

```typescript
// ✅ CORRECT: Test public API behavior
describe('ChessBoard', () => {
  it('should render all pieces from FEN notation', () => {
    const { getByTestId } = render(
      <ChessBoard fen="rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR" />
    );
    expect(getByTestId('piece-e1')).toBeInTheDocument();
  });

  it('should call onMove when valid move is made', () => {
    const onMove = jest.fn();
    // Test implementation
  });
});

// ✅ CORRECT: Edge case coverage
it('should handle invalid FEN notation gracefully', () => {
  expect(() => parseFEN('invalid')).toThrow(InvalidFENError);
});

// ❌ INCORRECT: Testing implementation details
it('should update internal state variable', () => {
  // Testing private implementation
});
```

### Coverage Targets

- **Statements**: > 80%
- **Branches**: > 75%
- **Functions**: > 80%
- **Lines**: > 80%

```bash
npm run test:coverage  # Generate coverage report
```

## 📝 Documentation Requirements

### When to Update Docs

Update `mkdocs_docs/` when you change:

- **Public API**: New components, props, or functions
- **Behavior**: Changed move validation, rendering logic
- **Breaking Changes**: Any non-backward-compatible change
- **Examples**: New usage patterns or features

### Documentation Structure

```text
mkdocs_docs/
├── index.md              # Getting started
├── api/                  # API reference
│   ├── components.md     # Component props
│   ├── hooks.md          # Custom hooks
│   └── utilities.md      # Helper functions
├── guides/              # Usage guides
│   ├── basic-usage.md
│   ├── customization.md
│   └── advanced.md
└── examples/            # Code examples
```

### Documentation Style

````markdown
## ChessBoard Component

**Description**: Renders an interactive chess board with piece movement.

**Props**:

- `fen` (string, optional): FEN notation for initial position
- `onMove` ((from: Position, to: Position) => void): Move callback
- `orientation` ('white' | 'black', default: 'white'): Board orientation

**Example**:

```tsx
import { ChessBoard } from 'neo-chess-board';

function App() {
  return (
    <ChessBoard
      fen="rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR"
      onMove={(from, to) => console.log(`${from} -> ${to}`)}
    />
  );
}
```
````

````

## 🔄 Build System

### Build Targets

```bash
# Library (ESM + UMD)
npm run build:lib
# Output: dist/neo-chess-board.js, dist/neo-chess-board.umd.js

# Demo Application
npm run build:demo
# Output: dist-demo/

# Both (default)
npm run build
````

### Build Verification

```bash
# Always verify builds locally
npm run build

# Check bundle size
ls -lh dist/

# Test library import
node -e "const { ChessBoard } = require('./dist/neo-chess-board.umd.js'); console.log(ChessBoard);"
```

## 🚫 Anti-Patterns

### Code Anti-Patterns

```typescript
// ❌ NEVER: Mutating props
function ChessBoard({ position }: Props) {
  position.fen = newFen;  // WRONG
}

// ❌ NEVER: Side effects in render
function PieceRenderer({ piece }: Props) {
  localStorage.setItem('lastPiece', piece);  // WRONG
  return <div>{piece}</div>;
}

// ❌ NEVER: Untyped external data
function loadGame(data: any) {  // WRONG - use unknown instead
  return data.fen;
}

// ❌ NEVER: Using any in tests
const mockTransport = createMock() as any;  // WRONG - use proper type like EngineTransport

// ❌ NEVER: Using onmessage/onerror in Workers
worker.onmessage = (event) => { ... };  // WRONG - use addEventListener

// ✅ CORRECT: Validation and typing
function loadGame(data: unknown): GameState {
  if (!isGameState(data)) {
    throw new InvalidGameStateError();
  }
  return data;
}

// ✅ CORRECT: Using proper types in tests
const mockTransport = createMock() as EngineTransport;

// ✅ CORRECT: Using addEventListener in Workers
worker.addEventListener('message', (event) => { ... });
worker.addEventListener('error', (error) => { ... });
```

### Workflow Anti-Patterns

```bash
# ❌ NEVER: Skip quality gates
git commit -m "quick fix"  # Without running tests/lint

# ❌ NEVER: Commit build artifacts
git add dist/  # dist/ is gitignored

# ❌ NEVER: Use wrong package manager
yarn install  # Use npm only

# ❌ NEVER: Bypass TypeScript
// @ts-ignore
const result = unsafeOperation();

# ✅ CORRECT: Full workflow
npm run lint && npm run test && npm run build
git add src/ tests/ mkdocs_docs/
git commit -m "feat: add castling support"
```

## 🤖 LLM-Specific Guidelines

### File Operations

```bash
# ✅ ALWAYS: Read before editing
cat src/components/ChessBoard.tsx  # Understand context

# ✅ ALWAYS: Verify changes compile
npm run build  # After TypeScript changes

# ✅ ALWAYS: Run affected tests
npm run test -- ChessBoard.test.tsx  # Targeted testing
```

### Code Generation

1. **Check existing patterns** in similar components
2. **Maintain consistency** with naming and structure
3. **Add TypeScript types** for all new code (avoid `any`, use `unknown` when needed)
4. **Include tests** for new functionality
5. **Update documentation** if API changed
6. **Use `addEventListener`** instead of `onmessage`/`onerror` for Workers
7. **Prefix unused parameters** with `_` (e.g., `_unusedParam`)
8. **Remove commented code** - use version control instead

### Communication Patterns

- **Ask for clarification** when requirements are ambiguous
- **Provide evidence** with test output or build logs
- **Break down complex tasks** into smaller steps
- **Verify assumptions** by checking existing code

## 🎯 Pull Request Guidelines

### Commit Message Format

```bash
# Format: <type>(<scope>): <description>

feat(board): add support for custom piece sets
fix(validation): correct castling rights detection
docs(api): update ChessBoard props documentation
test(utils): add coverage for FEN parsing edge cases
refactor(hooks): simplify useChessGame hook
```

### PR Checklist

- [ ] Descriptive title and summary
- [ ] All tests pass (`npm run test`)
- [ ] Linting passes (`npm run lint`)
- [ ] Build succeeds (`npm run build`)
- [ ] Documentation updated (if API changed)
- [ ] Examples updated (if behavior changed)
- [ ] Coverage maintained or improved
- [ ] Manual testing performed (describe in PR)

### PR Description Template

```markdown
## Changes

Brief description of what changed and why.

## Testing

- [ ] Unit tests added/updated
- [ ] Manual testing in demo application
- [ ] Coverage: XX% → YY%

## Breaking Changes

List any breaking changes (if applicable).

## Related Issues

Closes #123
```

## 📊 Quality Metrics

### Code Quality Targets

- **Type Coverage**: 100% (no `any` unless justified)
- **Test Coverage**: > 80% statements
- **Bundle Size**: < 50KB (gzipped)
- **Build Time**: < 30 seconds
- **Zero ESLint Warnings**: Mandatory

### Performance Benchmarks

- **Render Time**: < 16ms for 64 squares
- **Move Validation**: < 5ms per move
- **FEN Parsing**: < 10ms per position

## 🎯 SonarQube Rules Configuration

### Active SonarJS Rules

All SonarJS rules are **ENABLED as warnings** to maintain code quality while allowing builds to succeed:

| Rule                           | Threshold       | Status  | Notes                                         |
| ------------------------------ | --------------- | ------- | --------------------------------------------- |
| `cognitive-complexity`         | 25 per function | ⚠️ warn | Refactor functions exceeding complexity       |
| `no-nested-conditional`        | N/A             | ⚠️ warn | Extract nested ternary to variables           |
| `no-nested-functions`          | 4 levels        | ⚠️ warn | Move nested functions to module level         |
| `no-identical-functions`       | N/A             | ⚠️ warn | Consolidate duplicate function logic          |
| `constructor-for-side-effects` | N/A             | ⚠️ warn | Use constructors only for object creation     |
| `pseudo-random`                | N/A             | ⚠️ warn | Math.random() acceptable for non-crypto usage |
| `slow-regex`                   | N/A             | ⭕ off  | Disabled - PGN patterns use controlled input  |

### Current Violations: 85 warnings

**Distribution**:

- Cognitive Complexity: 13 functions (range: 25-67)
- Nested Conditionals: 35+ ternary operations
- Nested Functions: 9 locations (5+ levels deep)
- Identical Functions: 2 instances
- Constructor-for-side-effects: 3 test locations

## 🛡️ Security & Safety

### Input Validation

```typescript
// ✅ CORRECT: Validate external data
export function parseFEN(fen: string): Board {
  if (!isValidFENFormat(fen)) {
    throw new InvalidFENError(`Invalid FEN: ${fen}`);
  }
  // Parse safely
}

// ❌ INCORRECT: Trust user input
export function parseFEN(fen: string): Board {
  return eval(fen); // NEVER DO THIS
}
```

### Dependency Management

```bash
# Check for vulnerabilities
npm audit

# Update dependencies safely
npm update --save  # Minor/patch only
npm outdated       # Check major versions
```

## 🔍 Troubleshooting

### Common Issues

**Issue**: Build fails with "Cannot find module"
**Solution**: Run `npm install` and verify `node_modules/` exists

**Issue**: Tests fail with snapshot mismatches
**Solution**: Review changes, update snapshots if intentional: `npm run test -- -u`

**Issue**: TypeScript errors in IDE but build succeeds
**Solution**: Restart TypeScript server (VS Code: Cmd+Shift+P → "Restart TS Server")

**Issue**: Demo doesn't reflect library changes
**Solution**: Rebuild library: `npm run build:lib`, then restart demo

**Issue**: ESLint errors about unused imports/variables
**Solution**: Remove unused imports, prefix unused parameters with `_`, or use the variable

**Issue**: ESLint errors about `onmessage`/`onerror` in Workers
**Solution**: Use `addEventListener('message', ...)` and `addEventListener('error', ...)` instead

**Issue**: ESLint errors about useless `undefined`
**Solution**: Remove `undefined` from function calls (e.g., `emit('event')` instead of `emit('event', undefined)`)

### Debug Commands

```bash
# Verbose build output
npm run build -- --verbose

# Test specific file
npm run test -- ChessBoard.test.tsx

# Check TypeScript without building
npx tsc --noEmit

# Clear cache and reinstall
rm -rf node_modules dist && npm install
```

## 📚 Additional Resources

### External Documentation

- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [React Documentation](https://react.dev/)
- [Vite Guide](https://vitejs.dev/guide/)
- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [MkDocs Material](https://squidfunk.github.io/mkdocs-material/)

### Internal Documentation

- Check `mkdocs_docs/` for user-facing documentation
- Check `examples/` for usage patterns
- Check `demo/` for full application example

---

**Focus**: Library development with strict type safety and comprehensive testing.
**Philosophy**: Type safety > convenience | Tests before features | Documentation is code

**Questions?** Open an issue or check existing documentation first.

**Last Updated**: 2025-01-29
