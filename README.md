# Chess App

A fully-functional chess game built with TypeScript and Vite, featuring a custom chess engine and geometric piece visualization.

## Features

- ✅ Complete chess engine with move validation
- ✅ Check, checkmate, and stalemate detection
- ✅ En passant and castling support
- ✅ Pawn promotion
- ✅ Move history tracking with algebraic notation
- ✅ Interactive board with click-to-move interface
- ✅ Geometric piece design (no external assets needed)
- ✅ Responsive UI with move highlighting

## Live Demo

The app is deployed at: https://watson-ij.github.io/Chess/

## Development

### Prerequisites

- Node.js 20 or higher
- npm

### Installation

```bash
npm install
```

### Running locally

```bash
npm run dev
```

Then open your browser to `http://localhost:5173`

### Building for production

```bash
npm run build
```

The built files will be in the `dist` directory.

## Architecture

The project is well-factored for future extensibility:

- **ChessEngine.ts** - Core chess logic (move generation, validation, game state)
- **ChessBoardRenderer.ts** - Visualization layer (can be reused for puzzles, studies, etc.)
- **types.ts** - Shared type definitions
- **main.ts** - Application entry point and UI coordination

## Future Plans

- Opening repository explorer
- Endgame studies
- Chess puzzles
- Move analysis
- Game import/export (PGN format)

## License

MIT
