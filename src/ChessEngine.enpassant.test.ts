import { describe, it, expect, beforeEach } from 'vitest';
import { ChessEngine } from './ChessEngine';

describe('ChessEngine - En Passant', () => {
  let engine: ChessEngine;

  beforeEach(() => {
    engine = new ChessEngine();
  });

  describe('White En Passant', () => {
    it('should allow white to capture black pawn en passant on queenside', () => {
      // Get white pawn to 5th rank
      engine.makeMove({ row: 6, col: 0 }, { row: 4, col: 0 }); // a4
      engine.makeMove({ row: 1, col: 7 }, { row: 3, col: 7 }); // h5
      engine.makeMove({ row: 4, col: 0 }, { row: 3, col: 0 }); // a5

      // Black pawn moves two squares next to white pawn
      engine.makeMove({ row: 1, col: 1 }, { row: 3, col: 1 }); // b5

      // White should be able to capture en passant
      const moves = engine.getLegalMoves({ row: 3, col: 0 });
      expect(moves).toContainEqual({ row: 2, col: 1 });

      // Make en passant capture
      const result = engine.makeMove({ row: 3, col: 0 }, { row: 2, col: 1 });
      expect(result).toBe(true);

      const board = engine.getBoard();
      expect(board[2][1]?.type).toBe('pawn');
      expect(board[2][1]?.color).toBe('white');
      expect(board[3][1]).toBeNull(); // Black pawn should be captured
      expect(board[3][0]).toBeNull(); // White pawn moved from here
    });

    it('should allow white to capture black pawn en passant on kingside', () => {
      // Get white pawn to 5th rank
      engine.makeMove({ row: 6, col: 7 }, { row: 4, col: 7 }); // h4
      engine.makeMove({ row: 1, col: 0 }, { row: 3, col: 0 }); // a5
      engine.makeMove({ row: 4, col: 7 }, { row: 3, col: 7 }); // h5

      // Black pawn moves two squares next to white pawn
      engine.makeMove({ row: 1, col: 6 }, { row: 3, col: 6 }); // g5

      // White should be able to capture en passant
      const moves = engine.getLegalMoves({ row: 3, col: 7 });
      expect(moves).toContainEqual({ row: 2, col: 6 });

      // Make en passant capture
      const result = engine.makeMove({ row: 3, col: 7 }, { row: 2, col: 6 });
      expect(result).toBe(true);

      const board = engine.getBoard();
      expect(board[2][6]?.type).toBe('pawn');
      expect(board[2][6]?.color).toBe('white');
      expect(board[3][6]).toBeNull(); // Black pawn should be captured
    });

    it('should not allow en passant after another move is made', () => {
      // Setup en passant opportunity
      engine.makeMove({ row: 6, col: 0 }, { row: 4, col: 0 }); // a4
      engine.makeMove({ row: 1, col: 7 }, { row: 3, col: 7 }); // h5
      engine.makeMove({ row: 4, col: 0 }, { row: 3, col: 0 }); // a5
      engine.makeMove({ row: 1, col: 1 }, { row: 3, col: 1 }); // b5

      // Make a different move instead of en passant
      engine.makeMove({ row: 6, col: 7 }, { row: 5, col: 7 }); // h3
      engine.makeMove({ row: 0, col: 0 }, { row: 2, col: 0 }); // Ra6

      // En passant should no longer be available
      const moves = engine.getLegalMoves({ row: 3, col: 0 });
      expect(moves).not.toContainEqual({ row: 2, col: 1 });
    });

    it('should not allow en passant if pawn only moved one square', () => {
      // Get white pawn to 5th rank
      engine.makeMove({ row: 6, col: 0 }, { row: 4, col: 0 }); // a4
      engine.makeMove({ row: 1, col: 1 }, { row: 3, col: 1 }); // b5
      engine.makeMove({ row: 4, col: 0 }, { row: 3, col: 0 }); // a5

      // Black pawn moves one square (not two)
      engine.makeMove({ row: 3, col: 1 }, { row: 2, col: 1 }); // b6

      // White should NOT be able to capture en passant
      const moves = engine.getLegalMoves({ row: 3, col: 0 });
      expect(moves).not.toContainEqual({ row: 2, col: 1 });
    });
  });

  describe('Black En Passant', () => {
    it('should allow black to capture white pawn en passant', () => {
      // Get black pawn to 4th rank
      engine.makeMove({ row: 6, col: 7 }, { row: 5, col: 7 }); // h3
      engine.makeMove({ row: 1, col: 0 }, { row: 3, col: 0 }); // a5
      engine.makeMove({ row: 6, col: 6 }, { row: 5, col: 6 }); // g3
      engine.makeMove({ row: 3, col: 0 }, { row: 4, col: 0 }); // a4

      // White pawn moves two squares next to black pawn
      engine.makeMove({ row: 6, col: 1 }, { row: 4, col: 1 }); // b4

      // Black should be able to capture en passant
      const moves = engine.getLegalMoves({ row: 4, col: 0 });
      expect(moves).toContainEqual({ row: 5, col: 1 });

      // Make en passant capture
      const result = engine.makeMove({ row: 4, col: 0 }, { row: 5, col: 1 });
      expect(result).toBe(true);

      const board = engine.getBoard();
      expect(board[5][1]?.type).toBe('pawn');
      expect(board[5][1]?.color).toBe('black');
      expect(board[4][1]).toBeNull(); // White pawn should be captured
      expect(board[4][0]).toBeNull(); // Black pawn moved from here
    });

    it('should not allow black en passant after another move is made', () => {
      // Setup en passant opportunity
      engine.makeMove({ row: 6, col: 7 }, { row: 5, col: 7 }); // h3
      engine.makeMove({ row: 1, col: 0 }, { row: 3, col: 0 }); // a5
      engine.makeMove({ row: 6, col: 6 }, { row: 5, col: 6 }); // g3
      engine.makeMove({ row: 3, col: 0 }, { row: 4, col: 0 }); // a4
      engine.makeMove({ row: 6, col: 1 }, { row: 4, col: 1 }); // b4

      // Black makes a different move instead of en passant
      engine.makeMove({ row: 1, col: 7 }, { row: 2, col: 7 }); // h6
      engine.makeMove({ row: 7, col: 0 }, { row: 5, col: 0 }); // Ra3

      // En passant should no longer be available
      const moves = engine.getLegalMoves({ row: 4, col: 0 });
      expect(moves).not.toContainEqual({ row: 5, col: 1 });
    });
  });

  describe('En Passant Edge Cases', () => {
    it('should only allow en passant on the immediately following move', () => {
      // Get white pawn to 5th rank
      engine.makeMove({ row: 6, col: 4 }, { row: 4, col: 4 }); // e4
      engine.makeMove({ row: 1, col: 0 }, { row: 3, col: 0 }); // a5
      engine.makeMove({ row: 4, col: 4 }, { row: 3, col: 4 }); // e5

      // Black pawn moves two squares next to white pawn
      engine.makeMove({ row: 1, col: 3 }, { row: 3, col: 3 }); // d5

      // En passant is available
      let moves = engine.getLegalMoves({ row: 3, col: 4 });
      expect(moves).toContainEqual({ row: 2, col: 3 });

      // White makes different move
      engine.makeMove({ row: 7, col: 6 }, { row: 5, col: 5 }); // Nf3
      engine.makeMove({ row: 0, col: 1 }, { row: 2, col: 0 }); // Nc6

      // En passant should no longer be available
      moves = engine.getLegalMoves({ row: 3, col: 4 });
      expect(moves).not.toContainEqual({ row: 2, col: 3 });
    });

    it('should allow en passant with multiple pawns adjacent', () => {
      // Setup multiple white pawns on 5th rank
      engine.makeMove({ row: 6, col: 3 }, { row: 4, col: 3 }); // d4
      engine.makeMove({ row: 1, col: 0 }, { row: 3, col: 0 }); // a5
      engine.makeMove({ row: 4, col: 3 }, { row: 3, col: 3 }); // d5
      engine.makeMove({ row: 1, col: 1 }, { row: 3, col: 1 }); // b5
      engine.makeMove({ row: 6, col: 5 }, { row: 4, col: 5 }); // f4
      engine.makeMove({ row: 1, col: 2 }, { row: 3, col: 2 }); // c5
      engine.makeMove({ row: 4, col: 5 }, { row: 3, col: 5 }); // f5

      // Black plays e5
      engine.makeMove({ row: 1, col: 4 }, { row: 3, col: 4 }); // e5

      // Both d5 and f5 pawns should be able to capture en passant
      const dPawnMoves = engine.getLegalMoves({ row: 3, col: 3 });
      expect(dPawnMoves).toContainEqual({ row: 2, col: 4 });

      const fPawnMoves = engine.getLegalMoves({ row: 3, col: 5 });
      expect(fPawnMoves).toContainEqual({ row: 2, col: 4 });
    });

    it('should mark en passant capture in move history', () => {
      // Setup and execute en passant
      engine.makeMove({ row: 6, col: 0 }, { row: 4, col: 0 }); // a4
      engine.makeMove({ row: 1, col: 7 }, { row: 3, col: 7 }); // h5
      engine.makeMove({ row: 4, col: 0 }, { row: 3, col: 0 }); // a5
      engine.makeMove({ row: 1, col: 1 }, { row: 3, col: 1 }); // b5
      engine.makeMove({ row: 3, col: 0 }, { row: 2, col: 1 }); // axb6 e.p.

      const history = engine.getMoveHistory();
      const enPassantMove = history[history.length - 1];

      expect(enPassantMove.isEnPassant).toBe(true);
      expect(enPassantMove.capturedPiece?.type).toBe('pawn');
    });
  });
});
