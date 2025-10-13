# Contributing to Neo Chess Board

Thank you for your interest in contributing to Neo Chess Board! 🎉

We welcome contributions from everyone, whether you're fixing bugs, adding features, improving documentation, or suggesting enhancements.

## 🚀 Quick Start

1. **Fork the repository** on GitHub
2. **Clone your fork** locally:
   ```bash
   git clone https://github.com/magicolala/Neo-Chess-Board-Ts-Library.git
   cd Neo-Chess-Board-Ts-Library
   ```
3. **Install dependencies**:
   ```bash
   npm install
   ```
4. **Run the development server**:
   ```bash
   npm run dev
   ```

## 🛠️ Development Setup

### Prerequisites

- Node.js >= 16.0.0
- npm >= 8.0.0

### Project Structure

```
Neo-Chess-Board-Ts-Library/
├── src/                 # Core library source code
│   ├── core/           # Main chess board logic
│   ├── events/         # Event handling system
│   ├── light-rules/    # Chess rules engine
│   ├── pgn/           # PGN recording functionality
│   ├── themes/        # Visual themes
│   ├── sprites/       # Piece rendering
│   └── react/         # React component wrapper
├── demo/               # Demo application
├── tests/              # Test suites
└── docs/               # Documentation
```

### Available Scripts

- `npm run dev` - Start development server with demo
- `npm run build` - Build both library and demo
- `npm run build:lib` - Build library only
- `npm run build:demo` - Build demo only
- `npm test` - Run tests
- `npm run test:watch` - Run tests in watch mode
- `npm run test:coverage` - Generate coverage report
- `npm run lint` - Type checking with TypeScript

## 🧪 Testing

We use Jest for testing. All contributions should include appropriate tests.

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode during development
npm run test:watch

# Generate coverage report
npm run test:coverage
```

### Writing Tests

- Place test files in the `tests/` directory
- Use descriptive test names that explain what is being tested
- Follow the existing test patterns in the codebase
- Ensure good test coverage for new features

Example test structure:

```typescript
describe('YourFeature', () => {
  it('should behave correctly when...', () => {
    // Test implementation
    expect(result).toBe(expected);
  });
});
```

## 📝 Code Style

### TypeScript Guidelines

- Use strict TypeScript configuration
- Define proper interfaces and types
- Avoid `any` type unless absolutely necessary
- Use meaningful variable and function names

### Code Organization

- Keep functions small and focused
- Use clear, self-documenting code
- Add comments for complex logic
- Follow existing patterns in the codebase

### Naming Conventions

- Use camelCase for variables and functions
- Use PascalCase for classes and interfaces
- Use SCREAMING_SNAKE_CASE for constants
- Use kebab-case for file names

## 🎨 Themes Development

When working on themes:

- Ensure consistent visual style across pieces
- Test themes with different board orientations
- Verify readability and accessibility
- Follow the existing theme structure

## 🐛 Bug Reports

When reporting bugs, please include:

- **Clear description** of the issue
- **Steps to reproduce** the problem
- **Expected behavior** vs actual behavior
- **Environment details** (browser, OS, etc.)
- **Minimal code example** if possible

Use our bug report template:

```markdown
## Bug Description

Brief description of the bug.

## Steps to Reproduce

1. Step one
2. Step two
3. Step three

## Expected Behavior

What should happen.

## Actual Behavior

What actually happens.

## Environment

- Browser: [e.g., Chrome 120]
- OS: [e.g., Windows 11]
- Library Version: [e.g., 0.1.0]
```

## ✨ Feature Requests

For new features:

- **Check existing issues** first to avoid duplicates
- **Describe the use case** clearly
- **Explain why** the feature would be valuable
- **Consider backwards compatibility**

## 🔄 Pull Request Process

### Before Submitting

1. **Check your changes** work correctly
2. **Run the test suite** (`npm test`)
3. **Update documentation** if needed
4. **Add tests** for new functionality
5. **Follow code style** guidelines

### Pull Request Guidelines

1. **Create a feature branch** from `main`:
   ```bash
   git checkout -b feature/your-feature-name
   ```
2. **Make your changes** with clear, atomic commits
3. **Write descriptive commit messages**:

   ```
   feat: add custom piece sprite support

   - Allow users to provide custom piece images
   - Add validation for image formats
   - Update documentation with examples
   ```

4. **Push your branch** and create a pull request
5. **Fill out the PR template** completely
6. **Address review feedback** promptly

### Commit Message Format

We use conventional commits:

- `feat:` for new features
- `fix:` for bug fixes
- `docs:` for documentation changes
- `test:` for test additions/changes
- `refactor:` for code refactoring
- `style:` for formatting changes
- `perf:` for performance improvements

## 📋 PR Checklist

Before submitting your pull request, ensure:

- [ ] Code follows the project's style guidelines
- [ ] Self-review of the code has been performed
- [ ] Code is well-commented, particularly in hard-to-understand areas
- [ ] Corresponding changes to documentation have been made
- [ ] Changes generate no new warnings
- [ ] Tests have been added that prove the fix is effective or feature works
- [ ] New and existing unit tests pass locally
- [ ] Any dependent changes have been merged and published

## 🎯 Areas for Contribution

We especially welcome contributions in these areas:

### Core Features

- New piece movement animations
- Enhanced drag-and-drop interactions
- Additional chess variants support
- Performance optimizations

### Themes & Visual

- New visual themes
- Accessibility improvements
- High-DPI display support
- Custom piece sets

### Documentation

- API documentation improvements
- More usage examples
- Video tutorials
- Translation to other languages

### Testing

- Increased test coverage
- Performance benchmarks
- Cross-browser testing
- Edge case testing

## 🤝 Community Guidelines

### Be Respectful

- Use welcoming and inclusive language
- Be respectful of differing viewpoints
- Accept constructive criticism gracefully
- Focus on what's best for the community

### Be Collaborative

- Ask questions when unsure
- Offer help to newcomers
- Share knowledge and expertise
- Credit others for their contributions

## 📞 Getting Help

Need help with development?

- **GitHub Issues**: For bugs and feature requests
- **Discussions**: For questions and general discussion
- **Documentation**: Check the docs/ folder
- **Code Examples**: See the demo/ folder

## 🏷️ Release Process

Releases are managed by maintainers following semantic versioning:

- **Major version** (X.0.0): Breaking changes
- **Minor version** (0.X.0): New features (backwards compatible)
- **Patch version** (0.0.X): Bug fixes

## 📄 License

By contributing, you agree that your contributions will be licensed under the MIT License.

---

Thank you for contributing to Neo Chess Board! Every contribution, no matter how small, is valuable and appreciated. 🙏
