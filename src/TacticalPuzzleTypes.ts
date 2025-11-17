/**
 * Types for the Tactical Puzzle System
 */

export type PuzzleDifficulty = 1 | 2 | 3 | 4 | 5;

export type TacticalTheme =
  | 'fork'
  | 'pin'
  | 'skewer'
  | 'discovered-attack'
  | 'double-attack'
  | 'back-rank-mate'
  | 'deflection'
  | 'decoy'
  | 'remove-defender'
  | 'sacrifice'
  | 'zugzwang'
  | 'in-between-move';

export type PuzzleObjective =
  | 'checkmate'
  | 'win-material'
  | 'draw'
  | 'defend'
  | 'promotion';

/**
 * Solution tree structure
 * Key is the move in SAN notation (e.g., "Qh5+" or "Kd6")
 * Value is either:
 * - Another SolutionNode (more moves to follow)
 * - 'success' (puzzle solved)
 * - 'draw' (acceptable draw result)
 */
export interface SolutionNode {
  [moveInSAN: string]: SolutionNode | 'success' | 'draw';
}

/**
 * Complete tactical puzzle definition
 */
export interface TacticalPuzzle {
  id: string;
  theme: TacticalTheme;
  title: string;
  description: string;
  fen: string;  // Starting position in FEN notation
  playerSide: 'white' | 'black';  // Which side the user plays
  objective: PuzzleObjective;
  objectiveDescription: string;  // Human-readable goal (e.g., "Win the Queen")
  difficulty: PuzzleDifficulty;
  solution: SolutionNode;  // Tree of correct moves
  hints: string[];  // Progressive hints
  educational: string;  // Learning points and explanation
  tags?: string[];  // Additional tags for categorization
}

/**
 * Tracks user progress through a puzzle
 */
export interface PuzzleProgress {
  puzzleId: string;
  currentPath: string[];  // Move sequence so far (SAN)
  hintsUsed: number;
  attempts: number;
  completed: boolean;
  success: boolean;
}

/**
 * Result of validating a move against the solution
 */
export interface MoveValidationResult {
  isCorrect: boolean;
  isComplete: boolean;  // Puzzle solved
  isDraw?: boolean;  // Reached acceptable draw
  feedback?: string;  // Feedback message
  nextOpponentMove?: string;  // The opponent's scripted response (SAN)
  alternativeMoves?: string[];  // Other valid moves at this position
}
