/**
 * Validates user moves against puzzle solutions
 */

import {
  EndgamePuzzle,
  SolutionNode,
  MoveValidationResult,
  PuzzleProgress,
} from './EndgameTypes';

export class PuzzleValidator {
  private puzzle: EndgamePuzzle;
  private currentNode: SolutionNode;
  private movePath: string[];

  constructor(puzzle: EndgamePuzzle) {
    this.puzzle = puzzle;
    this.currentNode = puzzle.solution;
    this.movePath = [];
  }

  /**
   * Validates a player's move against the solution tree
   * @param move - Move in Standard Algebraic Notation (SAN)
   * @returns Validation result with feedback
   */
  validateMove(move: string): MoveValidationResult {
    // Check if this move exists in the current solution node
    const normalizedMove = this.normalizeMove(move);

    // Find the matching key in the solution tree by normalizing all keys
    let matchingKey: string | null = null;
    for (const key of Object.keys(this.currentNode)) {
      if (this.normalizeMove(key) === normalizedMove) {
        matchingKey = key;
        break;
      }
    }

    if (!matchingKey) {
      // Move is not in the solution
      const alternatives = this.getAlternativeMoves();
      return {
        isCorrect: false,
        isComplete: false,
        feedback: this.getIncorrectMoveFeedback(),
        alternativeMoves: alternatives,
      };
    }

    // Move is correct! Add to path
    this.movePath.push(normalizedMove);
    const nextNode = this.currentNode[matchingKey];

    // Check if puzzle is complete
    if (nextNode === 'success') {
      return {
        isCorrect: true,
        isComplete: true,
        feedback: '🎉 Puzzle solved! Excellent work!',
      };
    }

    if (nextNode === 'draw') {
      return {
        isCorrect: true,
        isComplete: true,
        isDraw: true,
        feedback: '✓ Draw achieved! Puzzle complete.',
      };
    }

    // Move is correct but puzzle continues
    this.currentNode = nextNode as SolutionNode;

    // Get opponent's response (should be the next move in the tree)
    const opponentMove = this.getOpponentResponse();

    return {
      isCorrect: true,
      isComplete: false,
      feedback: this.getCorrectMoveFeedback(),
      nextOpponentMove: opponentMove,
    };
  }

  /**
   * Simulates the opponent's move after a correct player move
   * @param opponentMove - The SAN move the opponent makes
   * @returns True if the move was expected, false otherwise
   */
  applyOpponentMove(opponentMove: string): boolean {
    const normalizedMove = this.normalizeMove(opponentMove);

    // Find the matching key in the solution tree by normalizing all keys
    let matchingKey: string | null = null;
    for (const key of Object.keys(this.currentNode)) {
      if (this.normalizeMove(key) === normalizedMove) {
        matchingKey = key;
        break;
      }
    }

    if (!matchingKey) {
      console.error(`Unexpected opponent move: ${opponentMove}`);
      return false;
    }

    this.movePath.push(normalizedMove);
    const nextNode = this.currentNode[matchingKey];

    // Check if puzzle is complete after opponent's move
    if (nextNode === 'success' || nextNode === 'draw') {
      return true;
    }

    this.currentNode = nextNode as SolutionNode;
    return true;
  }

  /**
   * Gets the opponent's scripted response
   * In the solution tree, opponent moves are the keys after player moves
   */
  private getOpponentResponse(): string | undefined {
    const moves = Object.keys(this.currentNode);

    // For puzzles, typically there's one main line the opponent follows
    // If multiple moves exist, we can:
    // 1. Return the first one (most forcing line)
    // 2. Return a random one (variation)
    // 3. Return the one marked as 'main' (future enhancement)

    return moves.length > 0 ? moves[0] : undefined;
  }

  /**
   * Gets all valid alternative moves at the current position
   */
  private getAlternativeMoves(): string[] {
    return Object.keys(this.currentNode);
  }

  /**
   * Normalizes move notation for comparison
   * Handles different notations: e4, e2-e4, etc.
   */
  private normalizeMove(move: string): string {
    // Remove whitespace and convert to standard form
    let normalized = move.trim();

    // Remove check (+) and checkmate (#) symbols for comparison
    // They'll be added by the engine based on resulting position
    normalized = normalized.replace(/[+#]$/, '');

    return normalized;
  }

  /**
   * Get current progress through the puzzle
   */
  getProgress(): PuzzleProgress {
    return {
      puzzleId: this.puzzle.id,
      currentPath: [...this.movePath],
      hintsUsed: 0, // Tracked externally
      attempts: 0, // Tracked externally
      completed: false,
      success: false,
    };
  }

  /**
   * Get the next hint (correct move from current position)
   */
  getHint(): string | null {
    const validMoves = Object.keys(this.currentNode);
    if (validMoves.length === 0) {
      return null;
    }

    // Return the first valid move as a hint
    // Could be enhanced to return the "best" move
    return validMoves[0];
  }

  /**
   * Get all valid moves at current position
   */
  getValidMoves(): string[] {
    return Object.keys(this.currentNode);
  }

  /**
   * Reset the puzzle to starting position
   */
  reset(): void {
    this.currentNode = this.puzzle.solution;
    this.movePath = [];
  }

  /**
   * Get current move path
   */
  getMovePath(): string[] {
    return [...this.movePath];
  }

  /**
   * Check if we're at a terminal node
   */
  isComplete(): boolean {
    return Object.keys(this.currentNode).length === 0;
  }

  /**
   * Feedback for correct moves
   */
  private getCorrectMoveFeedback(): string {
    const encouragements = [
      '✓ Correct! Keep going.',
      '✓ Good move!',
      '✓ Well done!',
      '✓ Excellent!',
      '✓ Perfect!',
      '✓ Right on track!',
    ];
    return encouragements[Math.floor(Math.random() * encouragements.length)];
  }

  /**
   * Feedback for incorrect moves
   */
  private getIncorrectMoveFeedback(): string {
    return '✗ Not quite. Try another move or use a hint.';
  }

  /**
   * Get puzzle metadata
   */
  getPuzzle(): EndgamePuzzle {
    return this.puzzle;
  }

  /**
   * Check how deep into the solution we are
   */
  getDepth(): number {
    return this.movePath.length;
  }

  /**
   * Check if there are multiple valid continuations
   */
  hasMultipleOptions(): boolean {
    return Object.keys(this.currentNode).length > 1;
  }
}
