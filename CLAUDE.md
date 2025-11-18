# Claude Code Navigation Guide

This document helps future Claude instances quickly understand and navigate this Chess application codebase.

## 🎯 Project Overview

**What**: A full-featured web-based chess application with three modes:
1. **Play Mode**: PvP or vs Stockfish AI
2. **Opening Trainer**: Build and practice chess opening repertoire with spaced repetition
3. **Endgame Puzzles**: Practice endgame techniques with validation

**Tech Stack**: Vanilla TypeScript + Canvas rendering (no frameworks), Vite build tool, Vitest testing

## 📁 Codebase Structure

### Core Chess Logic (5,336 LOC)
```
src/ChessEngine.ts (948 lines) - Complete chess game logic
  ├─ Move generation, validation, legal move checking
  ├─ FEN/PGN import/export
  ├─ Standard Algebraic Notation (SAN) generation
  └─ Check/checkmate/stalemate detection

src/ChessBoardRenderer.ts (584 lines) - Canvas-based board visualization
  ├─ Geometric piece rendering (no image assets)
  ├─ Responsive canvas sizing
  ├─ Highlight rendering (selections, legal moves)
  └─ Click-to-square coordinate mapping
```

### Opening Trainer System
```
src/OpeningApp.ts (699 lines) - Opening trainer UI/logic
src/OpeningNode.ts (195 lines) - Tree structure for move variations
src/OpeningRepository.ts (452 lines) - Opening data persistence
src/SRSManager.ts (211 lines) - SuperMemo SM-2 spaced repetition
```

### Endgame Puzzle System
```
src/PuzzleMode.ts (365 lines) - Puzzle gameplay mechanics
src/PuzzleDatabase.ts (344 lines) - Puzzle definitions (KR-K, KQ-K, etc.)
src/PuzzleValidator.ts (259 lines) - Solution tree validation
src/PuzzleSelector.ts (229 lines) - Puzzle category selection UI
```

### Application Shell
```
src/main.ts (769 lines) - App orchestration, mode switching, navigation
src/StockfishAI.ts (159 lines) - Stockfish.js Web Worker wrapper
src/constants.ts (242 lines) - Centralized configuration values
src/Logger.ts (100 lines) - Logging utility with severity levels
```

## 🧪 Test Coverage

**Current Status**: 311 tests passing across 15 test files (5,000+ LOC)

### Comprehensive Coverage
- ✅ **ChessEngine**: 9 test suites (basic, castling, checkmate, edgecases, enpassant, integration, notation, notation-advanced, pawn)
- ✅ **OpeningNode**: Tree structure, SRS data, JSON serialization
- ✅ **OpeningRepository**: CRUD, PGN import/export, persistence
- ✅ **SRSManager**: Spaced repetition algorithm, scheduling
- ✅ **ChessBoardRenderer**: Canvas initialization, rendering, coordinate mapping
- ✅ **PuzzleValidator**: Move validation, solution trees, hints
- ✅ **StockfishAI**: UCI parsing, move conversion

### Key Test Commands
```bash
npm test                 # Run all tests
npm test -- --watch      # Watch mode
npm test ChessEngine     # Run specific file
```

## 🔑 Key Design Patterns

### 1. Separation of Concerns
- **ChessEngine**: Pure game logic (no UI)
- **ChessBoardRenderer**: Pure visualization (reusable across modes)
- **main.ts**: UI coordination and event handling

### 2. Configuration Management
All magic numbers centralized in `src/constants.ts`:
- Board rendering constants
- SRS algorithm coefficients
- UI timing (AI delay, debounce)
- Color schemes

### 3. State Management
- ChessEngine: Immutable board getters, internal state mutation
- Move history: Tracked with notation, used for navigation
- SRS data: Stored in OpeningNode, managed by SRSManager

## 🚀 Common Tasks

### Adding a New Feature
1. **Identify affected files**: Use Glob/Grep to find related code
2. **Check tests**: Ensure existing tests pass
3. **Update constants**: Add any new magic numbers to `constants.ts`
4. **Use Logger**: Replace `console.*` with `Logger.*` calls
5. **Add tests**: Target 80%+ coverage for new code
6. **Run tests**: `npm test` before committing

### Refactoring Checklist
✅ Extract magic numbers → `constants.ts`
✅ Break functions >50 lines into smaller units
✅ Use `Logger` instead of `console`
✅ Add JSDoc comments for public methods
✅ Test before and after changes
✅ Update this guide if architecture changes

### Debugging Tips
- **Move generation issues**: Check `ChessEngine.getLegalMoves()`
- **Rendering bugs**: Inspect `ChessBoardRenderer.render()` with canvas debugger
- **Notation problems**: Check `generateMoveNotation()` helper methods
- **SRS bugs**: Verify `SRSManager.review()` algorithm implementation
- **Puzzle validation**: Trace through `PuzzleValidator.validateMove()`

## 📊 Architecture Highlights

### Chess Move Flow
```
User Click → getSquareFromClick() → getLegalMoves() → makeMove()
         → generateMoveNotation() → updateGameState() → render()
```

### Opening Practice Flow
```
OpeningApp → ChessEngine (position) → SRSManager (scheduling)
         → OpeningRepository (persistence) → LocalStorage
```

### Puzzle Flow
```
PuzzleMode → ChessEngine (board state) → PuzzleValidator (solution tree)
         → User move → validate → opponent response → check completion
```

## 🔧 Recent Refactorings (2025-01)

### Constants Extraction (c56e51c)
- Created `src/constants.ts` with 20+ constant groups
- Eliminated all magic numbers from codebase
- Improved maintainability and tunability

### Function Decomposition
- `startGameFromSetup()`: 70 lines → 8 focused functions
- `generateMoveNotation()`: 71 lines → 8 helper methods
- `updateMoveHistory()`: 57 lines → 4 DOM builders
- `handlePieceMovement()`: Consolidated 80+ lines of duplication

### Logging Standardization
- Added `src/Logger.ts` with DEBUG/INFO/WARN/ERROR levels
- Replaced 13 `console.*` calls with `Logger.*`
- Environment-aware log level configuration

## 📝 Code Style Guidelines

### TypeScript
- **Strict mode**: Enabled in `tsconfig.json`
- **No `any` types**: Use proper types or `unknown`
- **Explicit return types**: For public methods
- **Const assertions**: Use `as const` for constant objects

### Testing
- **Arrange-Act-Assert**: Clear test structure
- **Descriptive names**: `it('should validate correct move in puzzle solution')`
- **Mock external dependencies**: Workers, DOM APIs, LocalStorage
- **Test edge cases**: Empty inputs, invalid data, boundary values

### File Organization
- **One class per file**: Unless tightly coupled
- **Colocation**: Tests next to implementation (`*.test.ts`)
- **Barrel exports**: Avoid; explicit imports only
- **Type definitions**: In `types.ts` or `EndgameTypes.ts`

## 🐛 Known Issues & Tech Debt

1. ~~**Test Bug**: Checkmate notation test expected wrong value~~ ✅ Fixed
2. **Performance**: `getLegalMoves()` creates temporary board copies (consider caching)
3. **Accessibility**: Canvas not screen-reader friendly (needs ARIA labels)
4. **Move Disambiguation**: Not yet implemented for complex positions
5. **Error Boundaries**: Missing for DOM queries and LocalStorage operations

## 📚 Additional Resources

- **Chess Rules**: Standard FIDE laws of chess
- **SRS Algorithm**: SuperMemo SM-2 (see `SRSManager.ts` comments)
- **UCI Protocol**: Universal Chess Interface (Stockfish communication)
- **PGN Format**: Portable Game Notation standard
- **FEN Format**: Forsyth-Edwards Notation for positions

## 🆘 Getting Help

If stuck on a task:
1. **Search codebase**: Use Grep for keywords
2. **Check tests**: Often show usage examples
3. **Read JSDoc comments**: Most public methods documented
4. **Review constants**: Configuration often explains behavior
5. **Check git history**: Recent commits show patterns

## 💡 Future Improvement Ideas

- [ ] Add disambiguation to move notation (Rae1 vs Rhe1)
- [ ] Implement move history undo/redo
- [ ] Add position search/filter in opening repository
- [ ] Performance: Virtual DOM for move history
- [ ] Accessibility: Keyboard navigation support
- [ ] PWA: Offline support with Service Worker
- [ ] Multi-language support (i18n)
- [ ] Opening database import from Lichess/Chess.com

---

**Last Updated**: 2025-01-18
**Maintainer**: Claude Code
**Test Status**: ✅ 311/311 passing
**Code Quality**: 8.5/10
