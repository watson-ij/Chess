import { describe, it, expect, beforeEach } from 'vitest';
import { ChessEngine } from './ChessEngine';

describe('ChessEngine - Basic Moves', () => {
  let engine: ChessEngine;

  beforeEach(() => {
    engine = new ChessEngine();
  });

  describe('Initial Board Setup', () => {
    it('should initialize with white to move', () => {
      expect(engine.getCurrentTurn()).toBe('white');
    });

    it('should have all pieces in starting positions', () => {
      const board = engine.getBoard();

      // Check white pieces
      expect(board[7][0]?.type).toBe('rook');
      expect(board[7][0]?.color).toBe('white');
      expect(board[7][4]?.type).toBe('king');
      expect(board[7][4]?.color).toBe('white');
      expect(board[6][0]?.type).toBe('pawn');
      expect(board[6][0]?.color).toBe('white');

      // Check black pieces
      expect(board[0][0]?.type).toBe('rook');
      expect(board[0][0]?.color).toBe('black');
      expect(board[0][4]?.type).toBe('king');
      expect(board[0][4]?.color).toBe('black');
      expect(board[1][0]?.type).toBe('pawn');
      expect(board[1][0]?.color).toBe('black');
    });

    it('should have empty squares in the middle', () => {
      const board = engine.getBoard();
      for (let row = 2; row < 6; row++) {
        for (let col = 0; col < 8; col++) {
          expect(board[row][col]).toBeNull();
        }
      }
    });
  });

  describe('Knight Moves', () => {
    it('should allow knights to move in L-shape from starting position', () => {
      const moves = engine.getLegalMoves({ row: 7, col: 1 });

      expect(moves).toContainEqual({ row: 5, col: 0 });
      expect(moves).toContainEqual({ row: 5, col: 2 });
      expect(moves.length).toBe(2);
    });

    it('should allow knights to jump over pieces', () => {
      // Knights can jump over pawns
      expect(() => {
        engine.makeMove({ row: 7, col: 1 }, { row: 5, col: 2 });
      }).not.toThrow();
    });

    it('should not allow knight to move to invalid squares', () => {
      engine.makeMove({ row: 7, col: 1 }, { row: 5, col: 2 });
      const moves = engine.getLegalMoves({ row: 5, col: 2 });

      // Knight should not be able to move like a bishop
      expect(moves).not.toContainEqual({ row: 6, col: 3 });
    });
  });

  describe('Rook Moves', () => {
    it('should not allow rook to move through pieces initially', () => {
      const moves = engine.getLegalMoves({ row: 7, col: 0 });
      expect(moves.length).toBe(0); // Blocked by pawn
    });

    it('should allow rook to move horizontally and vertically', () => {
      // Clear path for rook
      engine.makeMove({ row: 6, col: 0 }, { row: 4, col: 0 }); // White pawn
      engine.makeMove({ row: 1, col: 1 }, { row: 3, col: 1 }); // Black pawn

      const moves = engine.getLegalMoves({ row: 7, col: 0 });
      expect(moves).toContainEqual({ row: 6, col: 0 });
      expect(moves).toContainEqual({ row: 5, col: 0 });
      expect(moves.length).toBeGreaterThan(0);
    });
  });

  describe('Bishop Moves', () => {
    it('should not allow bishop to move through pieces initially', () => {
      const moves = engine.getLegalMoves({ row: 7, col: 2 });
      expect(moves.length).toBe(0); // Blocked by pawn
    });

    it('should allow bishop to move diagonally', () => {
      // Clear path for bishop
      engine.makeMove({ row: 6, col: 3 }, { row: 4, col: 3 }); // White pawn d4
      engine.makeMove({ row: 1, col: 0 }, { row: 3, col: 0 }); // Black pawn a5

      const moves = engine.getLegalMoves({ row: 7, col: 2 });
      expect(moves).toContainEqual({ row: 6, col: 3 });
      expect(moves).toContainEqual({ row: 5, col: 4 });
      expect(moves.length).toBeGreaterThan(0);
    });
  });

  describe('Queen Moves', () => {
    it('should allow queen to move like rook and bishop', () => {
      // Clear path for queen
      engine.makeMove({ row: 6, col: 3 }, { row: 4, col: 3 }); // White pawn d4
      engine.makeMove({ row: 1, col: 0 }, { row: 3, col: 0 }); // Black pawn a5
      engine.makeMove({ row: 6, col: 2 }, { row: 5, col: 2 }); // White pawn c3
      engine.makeMove({ row: 1, col: 1 }, { row: 3, col: 1 }); // Black pawn b5

      const moves = engine.getLegalMoves({ row: 7, col: 3 });

      // Should be able to move forward
      expect(moves).toContainEqual({ row: 6, col: 3 });
      expect(moves).toContainEqual({ row: 5, col: 3 });

      // Should be able to move diagonally
      expect(moves).toContainEqual({ row: 6, col: 2 });
      expect(moves.length).toBeGreaterThan(0);
    });
  });

  describe('King Moves', () => {
    it('should allow king to move one square in any direction', () => {
      // Clear path for king
      engine.makeMove({ row: 6, col: 4 }, { row: 4, col: 4 }); // White pawn
      engine.makeMove({ row: 1, col: 0 }, { row: 3, col: 0 }); // Black pawn

      const moves = engine.getLegalMoves({ row: 7, col: 4 });
      expect(moves).toContainEqual({ row: 6, col: 4 });
      expect(moves.length).toBe(1); // Can only move forward initially
    });
  });

  describe('Turn Management', () => {
    it('should not allow moving opponent pieces', () => {
      const result = engine.makeMove({ row: 1, col: 0 }, { row: 3, col: 0 });
      expect(result).toBe(false);
      expect(engine.getCurrentTurn()).toBe('white');
    });

    it('should alternate turns after valid moves', () => {
      expect(engine.getCurrentTurn()).toBe('white');

      engine.makeMove({ row: 6, col: 0 }, { row: 4, col: 0 });
      expect(engine.getCurrentTurn()).toBe('black');

      engine.makeMove({ row: 1, col: 0 }, { row: 3, col: 0 });
      expect(engine.getCurrentTurn()).toBe('white');
    });

    it('should not change turn on invalid move', () => {
      const result = engine.makeMove({ row: 6, col: 0 }, { row: 3, col: 0 }); // Invalid move
      expect(result).toBe(false);
      expect(engine.getCurrentTurn()).toBe('white');
    });
  });

  describe('Captures', () => {
    it('should allow capturing opponent pieces', () => {
      engine.makeMove({ row: 6, col: 4 }, { row: 4, col: 4 }); // e4
      engine.makeMove({ row: 1, col: 3 }, { row: 3, col: 3 }); // d5
      engine.makeMove({ row: 4, col: 4 }, { row: 3, col: 3 }); // exd5

      const board = engine.getBoard();
      expect(board[3][3]?.type).toBe('pawn');
      expect(board[3][3]?.color).toBe('white');
    });

    it('should not allow capturing own pieces', () => {
      const moves = engine.getLegalMoves({ row: 7, col: 1 });

      // Knight should not be able to capture own pawn
      expect(moves).not.toContainEqual({ row: 6, col: 3 });
    });
  });

  describe('Move History', () => {
    it('should record moves in history', () => {
      engine.makeMove({ row: 6, col: 4 }, { row: 4, col: 4 }); // e4
      engine.makeMove({ row: 1, col: 4 }, { row: 3, col: 4 }); // e5

      const history = engine.getMoveHistory();
      expect(history.length).toBe(2);
      expect(history[0].from).toEqual({ row: 6, col: 4 });
      expect(history[0].to).toEqual({ row: 4, col: 4 });
    });

    it('should generate algebraic notation for moves', () => {
      engine.makeMove({ row: 6, col: 4 }, { row: 4, col: 4 }); // e4

      const history = engine.getMoveHistory();
      expect(history[0].notation).toBe('e4');
    });
  });
});
