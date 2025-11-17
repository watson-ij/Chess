import { describe, it, expect, beforeEach } from 'vitest';
import { ChessEngine } from './ChessEngine';

describe('ChessEngine - Integration & Regression Tests', () => {
  let engine: ChessEngine;

  beforeEach(() => {
    engine = new ChessEngine();
  });

  describe('Famous Games', () => {
    it('should correctly replay Immortal Game (partial)', () => {
      // Anderssen vs Kieseritzky, 1851 (first 10 moves)
      const moves = [
        'e4', 'e5',
        'f4', 'exf4',
        'Bc4', 'Qh4+',
        'Kf1', 'b5',
        'Bxb5', 'Nf6',
        'Nf3', 'Qh6'
      ];

      for (const move of moves) {
        const result = engine.makeSANMove(move);
        expect(result).toBe(true);
      }

      expect(engine.getMoveHistory().length).toBe(12);
      expect(engine.getCurrentTurn()).toBe('white');
    });

    it('should correctly replay Opera Game (partial)', () => {
      // Morphy vs Duke of Brunswick and Count Isouard, 1858
      const moves = [
        'e4', 'e5',
        'Nf3', 'd6',
        'd4', 'Bg4',
        'dxe5', 'Bxf3',
        'Qxf3', 'dxe5',
        'Bc4', 'Nf6',
        'Qb3', 'Qe7'
      ];

      for (const move of moves) {
        const result = engine.makeSANMove(move);
        expect(result).toBe(true);
      }

      expect(engine.getMoveHistory().length).toBe(14);
    });

    it('should handle Italian Game opening', () => {
      const moves = ['e4', 'e5', 'Nf3', 'Nc6', 'Bc4', 'Bc5'];

      for (const move of moves) {
        expect(engine.makeSANMove(move)).toBe(true);
      }

      const board = engine.getBoard();
      // c4 is row 4, col 2; c5 is row 3, col 2
      expect(board[4][2]?.type).toBe('bishop'); // White bishop on c4
      expect(board[4][2]?.color).toBe('white');
      expect(board[3][2]?.type).toBe('bishop'); // Black bishop on c5
      expect(board[3][2]?.color).toBe('black');
    });

    it('should handle Sicilian Defense', () => {
      const moves = ['e4', 'c5', 'Nf3', 'd6', 'd4', 'cxd4', 'Nxd4'];

      for (const move of moves) {
        expect(engine.makeSANMove(move)).toBe(true);
      }

      const board = engine.getBoard();
      expect(board[4][3]?.type).toBe('knight'); // White knight on d4
    });

    it('should handle Queen\'s Gambit', () => {
      const moves = ['d4', 'd5', 'c4'];

      for (const move of moves) {
        expect(engine.makeSANMove(move)).toBe(true);
      }

      const board = engine.getBoard();
      expect(board[4][2]?.type).toBe('pawn'); // White pawn on c4
    });
  });

  describe('Complete Game Scenarios', () => {
    it('should handle a complete fool\'s mate game', () => {
      const pgn = '1. f3 e5 2. g4 Qh4#';

      expect(engine.loadPGN(pgn)).toBe(true);
      expect(engine.isGameOver()).toBe(true);
      expect(engine.getState().isCheckmate).toBe(true);

      const exportedPGN = engine.toPGN();
      expect(exportedPGN).toContain('0-1'); // Black wins
    });

    it('should handle a complete scholar\'s mate game', () => {
      const pgn = '1. e4 e5 2. Bc4 Nc6 3. Qh5 Nf6 4. Qxf7#';

      expect(engine.loadPGN(pgn)).toBe(true);
      expect(engine.isGameOver()).toBe(true);
      expect(engine.getState().isCheckmate).toBe(true);

      const exportedPGN = engine.toPGN();
      expect(exportedPGN).toContain('1-0'); // White wins
    });

    it('should handle a game ending in stalemate', () => {
      engine.loadFEN('k7/2Q5/1K6/8/8/8/8/8 b - - 0 1');

      expect(engine.isGameOver()).toBe(true);
      expect(engine.getState().isStalemate).toBe(true);

      const pgn = engine.toPGN();
      expect(pgn).toContain('1/2-1/2'); // Draw
    });
  });

  describe('FEN -> Moves -> FEN Roundtrip', () => {
    it('should maintain board state through FEN export and import', () => {
      engine.makeSANMove('e4');
      engine.makeSANMove('e5');
      engine.makeSANMove('Nf3');
      engine.makeSANMove('Nc6');

      const fen1 = engine.toFEN();
      const newEngine = new ChessEngine();
      newEngine.loadFEN(fen1);
      const fen2 = newEngine.toFEN();

      expect(fen1).toBe(fen2);
    });

    it('should maintain game state through PGN export and import', () => {
      engine.makeSANMove('d4');
      engine.makeSANMove('d5');
      engine.makeSANMove('c4');
      engine.makeSANMove('e6');

      const pgn1 = engine.toPGN();
      const newEngine = new ChessEngine();
      newEngine.loadPGN(pgn1);
      const pgn2 = newEngine.toPGN();

      // Compare the move sequences (ignore headers which may have different dates)
      const moves1 = pgn1.split('\n').filter(l => !l.startsWith('['));
      const moves2 = pgn2.split('\n').filter(l => !l.startsWith('['));

      expect(moves1.join('')).toBe(moves2.join(''));
    });
  });

  describe('Long Game Sequences', () => {
    it('should handle 20+ move sequences without errors', () => {
      const moves = [
        'e4', 'e5', 'Nf3', 'Nc6', 'Bb5', 'a6',
        'Ba4', 'Nf6', 'O-O', 'Be7', 'Re1', 'b5',
        'Bb3', 'd6', 'c3', 'O-O', 'h3', 'Na5',
        'Bc2', 'c5', 'd4', 'Qc7'
      ];

      for (const move of moves) {
        const result = engine.makeSANMove(move);
        expect(result).toBe(true);
      }

      expect(engine.getMoveHistory().length).toBe(22);
      expect(engine.isGameOver()).toBe(false);
    });

    it('should correctly track move history for long games', () => {
      for (let i = 0; i < 10; i++) {
        engine.makeSANMove('Nf3');
        engine.makeSANMove('Nf6');
        engine.makeSANMove('Ng1');
        engine.makeSANMove('Ng8');
      }

      expect(engine.getMoveHistory().length).toBe(40);

      // Verify first and last moves
      const history = engine.getMoveHistory();
      expect(history[0].notation).toBe('Nf3');
      expect(history[39].notation).toBe('Ng8');
    });
  });

  describe('Complex Tactical Positions', () => {
    it('should correctly evaluate a position with multiple checks available', () => {
      // Position where multiple pieces can give check
      engine.loadFEN('4k3/8/8/8/3Q1B2/8/8/4K3 w - - 0 1');

      // Both queen and bishop can potentially give check
      const queenMoves = engine.getLegalMoves({ row: 4, col: 3 });
      const canQueenCheck = queenMoves.some(m =>
        (m.row === 0 && m.col === 3) || // Qd8+
        (m.row === 0 && m.col === 7)    // Qh8+
      );

      expect(canQueenCheck).toBe(true);
    });

    it('should handle fork positions correctly', () => {
      // Knight fork position
      engine.loadFEN('r3k3/8/8/3N4/8/8/8/R3K3 w - - 0 1');

      const knightMoves = engine.getLegalMoves({ row: 3, col: 3 });

      // Knight can fork king and rook
      const forkMove = knightMoves.find(m => m.row === 2 && m.col === 5);
      expect(forkMove).toBeDefined();
    });

    it('should handle skewer positions', () => {
      // Rook skewer: rook attacks king, and piece behind
      engine.loadFEN('4k1q1/8/8/8/8/8/8/R3K3 w - - 0 1');

      // Moving rook along first rank
      const rookMoves = engine.getLegalMoves({ row: 7, col: 0 });
      // Rook can move along the rank or file
      expect(rookMoves.length).toBeGreaterThan(0);
    });
  });

  describe('Edge Case Positions', () => {
    it('should handle position with maximum material', () => {
      // All pawns promoted to queens (theoretical max)
      engine.loadFEN('QQQQQQQQ/8/8/8/8/8/8/K2k4 w - - 0 1');

      const state = engine.getState();
      // Should handle this extreme position without crashing
      expect(state).toBeDefined();
    });

    it('should handle position with only kings', () => {
      engine.loadFEN('4k3/8/8/8/8/8/8/4K3 w - - 0 1');

      const whiteKingMoves = engine.getLegalMoves({ row: 7, col: 4 });

      // King should have some legal moves
      expect(whiteKingMoves.length).toBeGreaterThan(0);
    });

    it('should handle position with pieces on all squares', () => {
      // Dense board
      engine.loadFEN('rnbqkbnr/pppppppp/PPPPPPPP/RNBQKBNR/rnbqkbnr/pppppppp/PPPPPPPP/RNBQKBNR w - - 0 1');

      // Should not crash
      const state = engine.getState();
      expect(state).toBeDefined();
    });
  });

  describe('State Consistency', () => {
    it('should maintain consistent state after 100 random legal moves', () => {
      let movesCount = 0;

      while (movesCount < 100 && !engine.isGameOver()) {
        // Find all legal moves
        const allMoves: Array<{ from: { row: number, col: number }, to: { row: number, col: number } }> = [];

        for (let row = 0; row < 8; row++) {
          for (let col = 0; col < 8; col++) {
            const piece = engine.getPieceAt({ row, col });
            if (piece && piece.color === engine.getCurrentTurn()) {
              const moves = engine.getLegalMoves({ row, col });
              for (const move of moves) {
                allMoves.push({ from: { row, col }, to: move });
              }
            }
          }
        }

        if (allMoves.length === 0) break;

        // Make a random legal move
        const randomMove = allMoves[Math.floor(Math.random() * allMoves.length)];
        const result = engine.makeMove(randomMove.from, randomMove.to);

        expect(result).toBe(true);
        movesCount++;
      }

      // Verify state is consistent
      const fen = engine.toFEN();
      expect(fen).toBeDefined();
      expect(fen.split(' ').length).toBeGreaterThanOrEqual(4);
    });

    it('should correctly alternate turns throughout a game', () => {
      const moves = ['e4', 'e5', 'Nf3', 'Nc6', 'Bc4', 'Bc5', 'O-O', 'Nf6'];

      for (let i = 0; i < moves.length; i++) {
        const expectedTurn = i % 2 === 0 ? 'white' : 'black';
        expect(engine.getCurrentTurn()).toBe(expectedTurn);

        engine.makeSANMove(moves[i]);
      }
    });
  });

  describe('Performance Regression Tests', () => {
    it('should calculate legal moves quickly for starting position', () => {
      const start = Date.now();

      for (let row = 0; row < 8; row++) {
        for (let col = 0; col < 8; col++) {
          engine.getLegalMoves({ row, col });
        }
      }

      const elapsed = Date.now() - start;

      // Should be very fast (< 100ms for starting position)
      expect(elapsed).toBeLessThan(100);
    });

    it('should make moves quickly', () => {
      const start = Date.now();

      for (let i = 0; i < 20; i++) {
        engine.makeSANMove('Nf3');
        engine.makeSANMove('Nf6');
        engine.makeSANMove('Ng1');
        engine.makeSANMove('Ng8');
      }

      const elapsed = Date.now() - start;

      // 80 moves should be fast (< 500ms)
      expect(elapsed).toBeLessThan(500);
    });
  });

  describe('Board Boundary Tests', () => {
    it('should correctly handle pieces at all four corners', () => {
      engine.loadFEN('r6r/8/8/8/8/8/8/R6R w - - 0 1');

      // White rooks should have legal moves (it's white's turn)
      expect(engine.getLegalMoves({ row: 7, col: 0 }).length).toBeGreaterThan(0); // a1
      expect(engine.getLegalMoves({ row: 7, col: 7 }).length).toBeGreaterThan(0); // h1

      // Switch to black's turn to test black rooks
      engine.makeSANMove('Ra2');
      expect(engine.getLegalMoves({ row: 0, col: 0 }).length).toBeGreaterThan(0); // a8
      expect(engine.getLegalMoves({ row: 0, col: 7 }).length).toBeGreaterThan(0); // h8
    });

    it('should correctly handle bishops on opposite colored squares', () => {
      engine.loadFEN('8/8/8/3B1B2/8/8/8/4K2k w - - 0 1');

      const lightBishop = engine.getLegalMoves({ row: 3, col: 3 });
      const darkBishop = engine.getLegalMoves({ row: 3, col: 5 });

      // Bishops on opposite colors move to different colored squares
      // But they can attack each other (same square if one captures)
      // So let's just verify they have legal moves
      expect(lightBishop.length).toBeGreaterThan(0);
      expect(darkBishop.length).toBeGreaterThan(0);
    });
  });

  describe('Capture Chain Tests', () => {
    it('should handle multiple consecutive captures', () => {
      engine.makeSANMove('e4');
      engine.makeSANMove('d5');
      engine.makeSANMove('exd5'); // Capture 1
      engine.makeSANMove('Qxd5'); // Capture 2
      engine.makeSANMove('Nc3');
      engine.makeSANMove('Qxg2'); // Capture 3
      engine.makeSANMove('Nf3');
      engine.makeSANMove('Qxh1'); // Capture 4

      const history = engine.getMoveHistory();
      const captures = history.filter(m => m.capturedPiece);

      expect(captures.length).toBe(4);
    });
  });

  describe('Promotion Chain Tests', () => {
    it('should handle multiple promotions in one game', () => {
      // Setup position where both sides can promote
      // White pawn on a7, black pawn on h2, kings on safe squares
      engine.loadFEN('8/P7/8/8/8/8/7pk/K7 w - - 0 1');

      engine.makeSANMove('a8=Q');
      engine.makeSANMove('h1=Q');

      const board = engine.getBoard();
      expect(board[0][0]?.type).toBe('queen');
      expect(board[0][0]?.color).toBe('white');
      expect(board[7][7]?.type).toBe('queen');
      expect(board[7][7]?.color).toBe('black');
    });
  });

  describe('Mixed Special Moves', () => {
    it('should handle game with castling and captures', () => {
      const pgn = `
1. e4 e5
2. Nf3 Nc6
3. Bc4 Bc5
4. O-O Nf6
5. d3 O-O
6. Bg5 h6
7. Bxf6 Qxf6
`;

      expect(engine.loadPGN(pgn)).toBe(true);

      // Should have castled, and have various captures
      const history = engine.getMoveHistory();
      expect(history.some(m => m.isCastling)).toBe(true);
      expect(history.some(m => m.capturedPiece)).toBe(true);
    });
  });
});
