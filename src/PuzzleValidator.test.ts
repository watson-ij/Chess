import { describe, it, expect, beforeEach } from 'vitest';
import { PuzzleValidator } from './PuzzleValidator';
import type { EndgamePuzzle, SolutionNode } from './EndgameTypes';

describe('PuzzleValidator', () => {
  let simplePuzzle: EndgamePuzzle;
  let validator: PuzzleValidator;

  beforeEach(() => {
    // Create a simple puzzle: King and Rook vs King checkmate
    const solution: SolutionNode = {
      'Rh8+': {
        'Kg5': {
          'Rh5+': {
            'Kg4': {
              'Rh4+': {
                'Kg3': {
                  'Rh3+': {
                    'Kg2': {
                      'Rh2+': {
                        'Kg1': {
                          'Rh1#': 'success'
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    };

    simplePuzzle = {
      id: 'test-puzzle-1',
      name: 'Basic Back Rank Mate',
      description: 'Checkmate with king and rook',
      category: 'KR-K',
      difficulty: 1,
      fen: '7k/8/6K1/8/8/8/8/7R w - - 0 1',
      solution,
      metadata: {
        createdAt: Date.now(),
        solveCount: 0,
        successRate: 0
      }
    };

    validator = new PuzzleValidator(simplePuzzle);
  });

  describe('Move Validation', () => {
    it('should accept correct first move', () => {
      const result = validator.validateMove('Rh8+');

      expect(result.isCorrect).toBe(true);
      expect(result.isComplete).toBe(false);
      expect(result.nextOpponentMove).toBeDefined();
    });

    it('should reject incorrect move', () => {
      const result = validator.validateMove('Ra1');

      expect(result.isCorrect).toBe(false);
      expect(result.isComplete).toBe(false);
      expect(result.feedback).toBeDefined();
    });

    it('should provide alternative moves on incorrect move', () => {
      const result = validator.validateMove('Ra1');

      expect(result.alternativeMoves).toBeDefined();
      expect(result.alternativeMoves!.length).toBeGreaterThan(0);
    });

    it('should normalize moves with check symbols', () => {
      // Should accept move with or without check symbol
      const resultWithCheck = validator.validateMove('Rh8+');
      const validatorCopy = new PuzzleValidator(simplePuzzle);
      const resultWithoutCheck = validatorCopy.validateMove('Rh8');

      expect(resultWithCheck.isCorrect).toBe(true);
      expect(resultWithoutCheck.isCorrect).toBe(true);
    });
  });

  describe('Opponent Moves', () => {
    it('should apply expected opponent move', () => {
      validator.validateMove('Rh8+');
      const opponentResult = validator.applyOpponentMove('Kg5');

      expect(opponentResult).toBe(true);
    });

    it('should reject unexpected opponent move', () => {
      validator.validateMove('Rh8+');
      const opponentResult = validator.applyOpponentMove('Kg7');

      expect(opponentResult).toBe(false);
    });
  });

  describe('Puzzle Completion', () => {
    it('should complete simple two-move puzzle', () => {
      const twoMovePuzzle: EndgamePuzzle = {
        id: 'test-simple',
        name: 'Simple Mate',
        description: 'Mate in one',
        category: 'QK-K',
        difficulty: 1,
        fen: '7k/5Q2/6K1/8/8/8/8/8 w - - 0 1',
        solution: {
          'Qg7#': 'success'
        },
        metadata: {
          createdAt: Date.now(),
          solveCount: 0,
          successRate: 0
        }
      };

      const simpleValidator = new PuzzleValidator(twoMovePuzzle);
      const result = simpleValidator.validateMove('Qg7#');

      expect(result.isCorrect).toBe(true);
      expect(result.isComplete).toBe(true);
      expect(result.feedback).toContain('solved');
    });

    it('should detect puzzle completion after multiple moves', () => {
      // Play through the entire solution
      let result = validator.validateMove('Rh8+');
      expect(result.isCorrect).toBe(true);
      expect(result.isComplete).toBe(false);

      validator.applyOpponentMove('Kg5');

      result = validator.validateMove('Rh5+');
      expect(result.isCorrect).toBe(true);
      expect(result.isComplete).toBe(false);

      validator.applyOpponentMove('Kg4');

      result = validator.validateMove('Rh4+');
      expect(result.isCorrect).toBe(true);
      expect(result.isComplete).toBe(false);
    });
  });

  describe('Draw Outcomes', () => {
    it('should recognize draw solutions', () => {
      const drawPuzzle: EndgamePuzzle = {
        id: 'test-draw',
        name: 'Stalemate Defense',
        description: 'Force a draw',
        category: 'defensive',
        difficulty: 2,
        fen: '8/8/8/8/8/5k2/5q2/5K2 w - - 0 1',
        solution: {
          'Kf1': 'draw'  // Stalemate
        },
        metadata: {
          createdAt: Date.now(),
          solveCount: 0,
          successRate: 0
        }
      };

      const drawValidator = new PuzzleValidator(drawPuzzle);
      const result = drawValidator.validateMove('Kf1');

      expect(result.isCorrect).toBe(true);
      expect(result.isComplete).toBe(true);
      expect(result.isDraw).toBe(true);
      expect(result.feedback).toContain('Draw');
    });
  });

  describe('Progress Tracking', () => {
    it('should track move path', () => {
      validator.validateMove('Rh8+');
      const progress = validator.getProgress();

      expect(progress.currentPath).toHaveLength(1);
      expect(progress.currentPath[0]).toContain('Rh8');
    });

    it('should track puzzle progress', () => {
      // First move
      validator.validateMove('Rh8+');
      let progress = validator.getProgress();
      expect(progress.puzzleId).toBe(simplePuzzle.id);
      expect(progress.currentPath).toHaveLength(1);
      expect(progress.completed).toBe(false);

      // Continue puzzle
      validator.applyOpponentMove('Kg5');
      validator.validateMove('Rh5+');
      progress = validator.getProgress();
      expect(progress.currentPath).toHaveLength(3);
    });
  });

  describe('Hints', () => {
    it('should provide hint for current position', () => {
      const hint = validator.getHint();

      expect(hint).toBeDefined();
      expect(hint).toBe('Rh8+');
    });

    it('should provide different hints at different positions', () => {
      const hint1 = validator.getHint();

      validator.validateMove('Rh8+');
      validator.applyOpponentMove('Kg5');

      const hint2 = validator.getHint();

      expect(hint1).not.toBe(hint2);
      expect(hint2).toBe('Rh5+');
    });
  });

  describe('Reset Functionality', () => {
    it('should reset to initial position', () => {
      validator.validateMove('Rh8+');
      validator.applyOpponentMove('Kg5');
      validator.validateMove('Rh5+');

      validator.reset();

      const progress = validator.getProgress();
      expect(progress.currentPath).toHaveLength(0);
      expect(progress.completed).toBe(false);
    });

    it('should accept first move again after reset', () => {
      validator.validateMove('Rh8+');
      validator.reset();

      const result = validator.validateMove('Rh8+');
      expect(result.isCorrect).toBe(true);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty move string', () => {
      const result = validator.validateMove('');

      expect(result.isCorrect).toBe(false);
    });

    it('should handle invalid move format', () => {
      const result = validator.validateMove('invalid');

      expect(result.isCorrect).toBe(false);
    });

    it('should handle move with extra whitespace', () => {
      const result = validator.validateMove('  Rh8+  ');

      expect(result.isCorrect).toBe(true);
    });

    it('should handle moves with and without check symbols', () => {
      const result = validator.validateMove('Rh8'); // Without +

      expect(result.isCorrect).toBe(true);
    });
  });

  describe('Multiple Solution Paths', () => {
    it('should accept alternative correct moves', () => {
      const multiPathPuzzle: EndgamePuzzle = {
        id: 'test-multi',
        name: 'Multiple Solutions',
        description: 'Multiple winning moves',
        category: 'tactical',
        difficulty: 2,
        fen: '8/8/8/8/8/5k2/6R1/5K2 w - - 0 1',
        solution: {
          'Rg3+': 'success',
          'Rf2+': 'success',
          'Rh2': 'success'
        },
        metadata: {
          createdAt: Date.now(),
          solveCount: 0,
          successRate: 0
        }
      };

      const multiValidator = new PuzzleValidator(multiPathPuzzle);

      const result1 = multiValidator.validateMove('Rg3+');
      expect(result1.isCorrect).toBe(true);
      expect(result1.isComplete).toBe(true);

      const multiValidator2 = new PuzzleValidator(multiPathPuzzle);
      const result2 = multiValidator2.validateMove('Rf2+');
      expect(result2.isCorrect).toBe(true);
      expect(result2.isComplete).toBe(true);
    });
  });
});
