# PGN Features - Neo Chess Board

## 📝 Portable Game Notation (PGN) Support

Neo Chess Board now provides full PGN (Portable Game Notation) support aligned with international standards.

### ✨ Capabilities

#### 📊 **Complete PGN Metadata**

- **Seven mandatory headers**: Event, Site, Date, Round, White, Black, Result
- **Optional headers**: WhiteElo, BlackElo, ECO, Opening, TimeControl, and more
- **Standardized date format**: YYYY.MM.DD (for example, 2025.08.29)
- **ISO/IEC 8859-1 character set** compliance

#### 🎯 **Short Algebraic Notation**

- **Standard moves**: e4, Nf3, Bb5, O-O, Qxe7+, Rf8#
- **Special moves**: Kingside castling (O-O), Queenside castling (O-O-O)
- **Checks and mates**: `+` for check, `#` for checkmate

#### 🌀 **Variations & Comments**

- Supports nested variations using parentheses `( ... )`
- Accepts semicolon line comments `;` and brace comments `{ ... }`
- Preserves Numeric Annotation Glyphs (NAGs) and inline annotations

#### 🧮 **Result Validation**

- Verifies terminal results: `1-0`, `0-1`, `1/2-1/2`, `*`
- Keeps the result synchronized with the move list when importing/exporting
- Detects inconsistencies between declared result and final board state

### 🧠 Advanced Parsing

- Resolves SAN moves against the current board state and validates legality
- Handles promotions, en passant captures, and disambiguation automatically
- Converts `fen` and metadata into the internal move tree representation

### 🚀 Integration Helpers

- Out-of-the-box adapters for Chess.js (`ChessJsRules`) and the lightweight engine (`LightRules`)
- Event hooks for move import/export, metadata updates, and PGN annotations
- Utility helpers to serialize games back to PGN strings with optional prettification

### 📦 Tooling

- Dedicated Jest suites validate PGN parsing, serialization, and annotation handling
- Example demos show how to import annotated games, follow evaluation bars, and replay moves
- CLI-friendly utilities simplify regression testing for PGN-related features
