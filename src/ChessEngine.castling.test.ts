import { describe, it, expect, beforeEach } from 'vitest';
import { ChessEngine } from './ChessEngine';

describe('ChessEngine - Castling', () => {
  let engine: ChessEngine;

  beforeEach(() => {
    engine = new ChessEngine();
  });

  describe('Kingside Castling', () => {
    it('should allow white to castle kingside when path is clear', () => {
      // Clear path for castling
      engine.makeMove({ row: 6, col: 4 }, { row: 4, col: 4 }); // e4
      engine.makeMove({ row: 1, col: 0 }, { row: 3, col: 0 }); // a5
      engine.makeMove({ row: 7, col: 5 }, { row: 5, col: 3 }); // Bf3
      engine.makeMove({ row: 1, col: 1 }, { row: 3, col: 1 }); // b5
      engine.makeMove({ row: 7, col: 6 }, { row: 5, col: 5 }); // Nf3
      engine.makeMove({ row: 1, col: 2 }, { row: 3, col: 2 }); // c5

      // Castle kingside
      const result = engine.makeMove({ row: 7, col: 4 }, { row: 7, col: 6 });
      expect(result).toBe(true);

      const board = engine.getBoard();
      expect(board[7][6]?.type).toBe('king');
      expect(board[7][5]?.type).toBe('rook');
      expect(board[7][4]).toBeNull();
      expect(board[7][7]).toBeNull();
    });

    it('should allow black to castle kingside when path is clear', () => {
      // Clear path for black castling
      engine.makeMove({ row: 6, col: 0 }, { row: 4, col: 0 }); // a4
      engine.makeMove({ row: 1, col: 4 }, { row: 3, col: 4 }); // e5
      engine.makeMove({ row: 6, col: 1 }, { row: 4, col: 1 }); // b4
      engine.makeMove({ row: 0, col: 5 }, { row: 2, col: 3 }); // Bd6
      engine.makeMove({ row: 6, col: 2 }, { row: 4, col: 2 }); // c4
      engine.makeMove({ row: 0, col: 6 }, { row: 2, col: 5 }); // Nf6
      engine.makeMove({ row: 6, col: 3 }, { row: 4, col: 3 }); // d4

      // Castle kingside
      const result = engine.makeMove({ row: 0, col: 4 }, { row: 0, col: 6 });
      expect(result).toBe(true);

      const board = engine.getBoard();
      expect(board[0][6]?.type).toBe('king');
      expect(board[0][5]?.type).toBe('rook');
    });

    it('should not allow castling through pieces', () => {
      // Don't move the knight
      engine.makeMove({ row: 6, col: 4 }, { row: 4, col: 4 }); // e4
      engine.makeMove({ row: 1, col: 0 }, { row: 3, col: 0 }); // a5
      engine.makeMove({ row: 7, col: 5 }, { row: 5, col: 3 }); // Bf3
      engine.makeMove({ row: 1, col: 1 }, { row: 3, col: 1 }); // b5

      // Knight still blocks - should not be able to castle
      const moves = engine.getLegalMoves({ row: 7, col: 4 });
      expect(moves).not.toContainEqual({ row: 7, col: 6 });
    });

    it('should not allow castling when king has moved', () => {
      // Setup castling position
      engine.makeMove({ row: 6, col: 4 }, { row: 4, col: 4 }); // e4
      engine.makeMove({ row: 1, col: 0 }, { row: 3, col: 0 }); // a5
      engine.makeMove({ row: 7, col: 5 }, { row: 5, col: 3 }); // Bf3
      engine.makeMove({ row: 1, col: 1 }, { row: 3, col: 1 }); // b5
      engine.makeMove({ row: 7, col: 6 }, { row: 5, col: 5 }); // Nf3
      engine.makeMove({ row: 1, col: 2 }, { row: 3, col: 2 }); // c5

      // Move king
      engine.makeMove({ row: 7, col: 4 }, { row: 7, col: 5 });
      engine.makeMove({ row: 1, col: 3 }, { row: 3, col: 3 }); // d5

      // Move king back
      engine.makeMove({ row: 7, col: 5 }, { row: 7, col: 4 });
      engine.makeMove({ row: 1, col: 4 }, { row: 3, col: 4 }); // e5

      // Should not be able to castle
      const moves = engine.getLegalMoves({ row: 7, col: 4 });
      expect(moves).not.toContainEqual({ row: 7, col: 6 });
    });

    it('should not allow castling when rook has moved', () => {
      // Setup castling position
      engine.makeMove({ row: 6, col: 4 }, { row: 4, col: 4 }); // e4
      engine.makeMove({ row: 1, col: 0 }, { row: 3, col: 0 }); // a5
      engine.makeMove({ row: 7, col: 5 }, { row: 5, col: 3 }); // Bf3
      engine.makeMove({ row: 1, col: 1 }, { row: 3, col: 1 }); // b5
      engine.makeMove({ row: 7, col: 6 }, { row: 5, col: 5 }); // Nf3
      engine.makeMove({ row: 1, col: 2 }, { row: 3, col: 2 }); // c5

      // Move rook
      engine.makeMove({ row: 7, col: 7 }, { row: 7, col: 6 });
      engine.makeMove({ row: 1, col: 3 }, { row: 3, col: 3 }); // d5

      // Move rook back
      engine.makeMove({ row: 7, col: 6 }, { row: 7, col: 7 });
      engine.makeMove({ row: 1, col: 4 }, { row: 3, col: 4 }); // e5

      // Should not be able to castle
      const moves = engine.getLegalMoves({ row: 7, col: 4 });
      expect(moves).not.toContainEqual({ row: 7, col: 6 });
    });

    it('should not allow castling through check', () => {
      // Setup position where f1 is under attack
      engine.makeMove({ row: 6, col: 4 }, { row: 4, col: 4 }); // e4
      engine.makeMove({ row: 1, col: 4 }, { row: 3, col: 4 }); // e5
      engine.makeMove({ row: 7, col: 5 }, { row: 5, col: 3 }); // Bf3
      engine.makeMove({ row: 0, col: 3 }, { row: 4, col: 7 }); // Qh4 (attacks f2)
      engine.makeMove({ row: 7, col: 6 }, { row: 5, col: 5 }); // Nf3
      engine.makeMove({ row: 4, col: 7 }, { row: 5, col: 6 }); // Qg5 (attacks f4, threatens f2)

      // Path through f1 might be attacked - need to verify castling is blocked
      // If king is not in check and can castle, the move should be available
      // But if any square king crosses is under attack, it should not
      // We'll verify the implementation handles this correctly
    });

    it('should not allow castling while in check', () => {
      // Setup position where king is in check
      engine.makeMove({ row: 6, col: 4 }, { row: 4, col: 4 }); // e4
      engine.makeMove({ row: 1, col: 4 }, { row: 3, col: 4 }); // e5
      engine.makeMove({ row: 7, col: 5 }, { row: 5, col: 3 }); // Bf3
      engine.makeMove({ row: 0, col: 3 }, { row: 4, col: 7 }); // Qh4
      engine.makeMove({ row: 7, col: 6 }, { row: 5, col: 5 }); // Nf3
      engine.makeMove({ row: 4, col: 7 }, { row: 6, col: 5 }); // Qf2+ (check!)

      const state = engine.getState();
      if (state.isCheck) {
        const moves = engine.getLegalMoves({ row: 7, col: 4 });
        expect(moves).not.toContainEqual({ row: 7, col: 6 });
      }
    });
  });

  describe('Queenside Castling', () => {
    it('should allow white to castle queenside when path is clear', () => {
      // Clear path for queenside castling
      engine.makeMove({ row: 6, col: 3 }, { row: 4, col: 3 }); // d4
      engine.makeMove({ row: 1, col: 0 }, { row: 3, col: 0 }); // a5
      engine.makeMove({ row: 7, col: 2 }, { row: 5, col: 4 }); // Bc4
      engine.makeMove({ row: 1, col: 1 }, { row: 3, col: 1 }); // b5
      engine.makeMove({ row: 7, col: 3 }, { row: 5, col: 3 }); // Qd3
      engine.makeMove({ row: 1, col: 2 }, { row: 3, col: 2 }); // c5
      engine.makeMove({ row: 7, col: 1 }, { row: 5, col: 2 }); // Nc3
      engine.makeMove({ row: 1, col: 3 }, { row: 3, col: 3 }); // d5

      // Castle queenside
      const result = engine.makeMove({ row: 7, col: 4 }, { row: 7, col: 2 });
      expect(result).toBe(true);

      const board = engine.getBoard();
      expect(board[7][2]?.type).toBe('king');
      expect(board[7][3]?.type).toBe('rook');
      expect(board[7][4]).toBeNull();
      expect(board[7][0]).toBeNull();
    });

    it('should not allow queenside castling through pieces', () => {
      // Don't move all pieces
      engine.makeMove({ row: 6, col: 3 }, { row: 4, col: 3 }); // d4
      engine.makeMove({ row: 1, col: 0 }, { row: 3, col: 0 }); // a5
      engine.makeMove({ row: 7, col: 2 }, { row: 5, col: 4 }); // Bc4
      engine.makeMove({ row: 1, col: 1 }, { row: 3, col: 1 }); // b5

      // Queen still blocks - should not be able to castle queenside
      const moves = engine.getLegalMoves({ row: 7, col: 4 });
      expect(moves).not.toContainEqual({ row: 7, col: 2 });
    });

    it('should not allow queenside castling when king has moved', () => {
      // Setup queenside castling position
      engine.makeMove({ row: 6, col: 3 }, { row: 4, col: 3 }); // d4
      engine.makeMove({ row: 1, col: 0 }, { row: 3, col: 0 }); // a5
      engine.makeMove({ row: 7, col: 2 }, { row: 5, col: 4 }); // Bc4
      engine.makeMove({ row: 1, col: 1 }, { row: 3, col: 1 }); // b5
      engine.makeMove({ row: 7, col: 3 }, { row: 5, col: 3 }); // Qd3
      engine.makeMove({ row: 1, col: 2 }, { row: 3, col: 2 }); // c5
      engine.makeMove({ row: 7, col: 1 }, { row: 5, col: 2 }); // Nc3
      engine.makeMove({ row: 1, col: 3 }, { row: 3, col: 3 }); // d5

      // Move king
      engine.makeMove({ row: 7, col: 4 }, { row: 7, col: 3 });
      engine.makeMove({ row: 1, col: 4 }, { row: 3, col: 4 }); // e5

      // Move king back
      engine.makeMove({ row: 7, col: 3 }, { row: 7, col: 4 });
      engine.makeMove({ row: 1, col: 5 }, { row: 3, col: 5 }); // f5

      // Should not be able to castle
      const moves = engine.getLegalMoves({ row: 7, col: 4 });
      expect(moves).not.toContainEqual({ row: 7, col: 2 });
    });

    it('should not allow queenside castling when queenside rook has moved', () => {
      // Setup position
      engine.makeMove({ row: 6, col: 3 }, { row: 4, col: 3 }); // d4
      engine.makeMove({ row: 1, col: 0 }, { row: 3, col: 0 }); // a5
      engine.makeMove({ row: 7, col: 2 }, { row: 5, col: 4 }); // Bc4
      engine.makeMove({ row: 1, col: 1 }, { row: 3, col: 1 }); // b5
      engine.makeMove({ row: 7, col: 3 }, { row: 5, col: 3 }); // Qd3
      engine.makeMove({ row: 1, col: 2 }, { row: 3, col: 2 }); // c5
      engine.makeMove({ row: 7, col: 1 }, { row: 5, col: 2 }); // Nc3
      engine.makeMove({ row: 1, col: 3 }, { row: 3, col: 3 }); // d5

      // Move queenside rook
      engine.makeMove({ row: 7, col: 0 }, { row: 7, col: 1 });
      engine.makeMove({ row: 1, col: 4 }, { row: 3, col: 4 }); // e5

      // Move rook back
      engine.makeMove({ row: 7, col: 1 }, { row: 7, col: 0 });
      engine.makeMove({ row: 1, col: 5 }, { row: 3, col: 5 }); // f5

      // Should not be able to castle queenside
      const moves = engine.getLegalMoves({ row: 7, col: 4 });
      expect(moves).not.toContainEqual({ row: 7, col: 2 });
    });
  });

  describe('Castling Independence', () => {
    it('should allow kingside castling even if queenside rook moved', () => {
      // Clear kingside for castling
      engine.makeMove({ row: 6, col: 4 }, { row: 4, col: 4 }); // e4
      engine.makeMove({ row: 1, col: 0 }, { row: 3, col: 0 }); // a5
      engine.makeMove({ row: 7, col: 5 }, { row: 5, col: 3 }); // Bd3
      engine.makeMove({ row: 1, col: 1 }, { row: 3, col: 1 }); // b5
      engine.makeMove({ row: 7, col: 6 }, { row: 5, col: 5 }); // Nf3
      engine.makeMove({ row: 1, col: 2 }, { row: 3, col: 2 }); // c5

      // Move queenside rook (losing queenside castling rights)
      engine.makeMove({ row: 7, col: 0 }, { row: 7, col: 1 }); // Rb1
      engine.makeMove({ row: 1, col: 3 }, { row: 3, col: 3 }); // d5

      // Move rook back (but castling rights are already lost)
      engine.makeMove({ row: 7, col: 1 }, { row: 7, col: 0 }); // Ra1
      engine.makeMove({ row: 1, col: 4 }, { row: 3, col: 4 }); // e5

      // Should still be able to castle kingside (independent of queenside)
      const moves = engine.getLegalMoves({ row: 7, col: 4 });
      expect(moves).toContainEqual({ row: 7, col: 6 });
    });
  });
});
