/**
 * Puzzle Mode - Endgame Training Interface
 */

import { ChessEngine } from './ChessEngine';
import { ChessBoardRenderer } from './ChessBoardRenderer';
import { PuzzleValidator } from './PuzzleValidator';
import { EndgamePuzzle } from './EndgameTypes';
import { Position } from './types';

export class PuzzleMode {
  private engine: ChessEngine;
  private renderer: ChessBoardRenderer;
  private validator: PuzzleValidator;
  private puzzle: EndgamePuzzle;

  private selectedSquare: Position | null = null;
  private hintsUsed: number = 0;
  private attempts: number = 0;
  private isComplete: boolean = false;

  // UI elements
  private puzzleTitle: HTMLElement;
  private puzzleDescription: HTMLElement;
  private puzzleObjective: HTMLElement;
  private puzzleFeedback: HTMLElement;
  private puzzleHints: HTMLElement;
  private moveList: HTMLElement;
  private hintButton: HTMLButtonElement;
  private resetButton: HTMLButtonElement;
  private backButton: HTMLButtonElement;
  private nextPuzzleButton: HTMLButtonElement;
  private educational: HTMLElement;

  private onBack: () => void;
  private onNextPuzzle?: () => void;

  constructor(
    canvas: HTMLCanvasElement,
    puzzle: EndgamePuzzle,
    onBack: () => void,
    onNextPuzzle?: () => void
  ) {
    this.puzzle = puzzle;
    this.engine = new ChessEngine();
    this.renderer = new ChessBoardRenderer(canvas);
    this.validator = new PuzzleValidator(puzzle);
    this.onBack = onBack;
    this.onNextPuzzle = onNextPuzzle;

    // Initialize UI elements
    this.puzzleTitle = document.getElementById('puzzle-title')!;
    this.puzzleDescription = document.getElementById('puzzle-description')!;
    this.puzzleObjective = document.getElementById('puzzle-objective')!;
    this.puzzleFeedback = document.getElementById('puzzle-feedback')!;
    this.puzzleHints = document.getElementById('puzzle-hints')!;
    this.moveList = document.getElementById('move-list')!;
    this.hintButton = document.getElementById('hint-button') as HTMLButtonElement;
    this.resetButton = document.getElementById('reset-button') as HTMLButtonElement;
    this.backButton = document.getElementById('back-button') as HTMLButtonElement;
    this.nextPuzzleButton = document.getElementById('next-puzzle-button') as HTMLButtonElement;
    this.educational = document.getElementById('educational')!;

    this.initializePuzzle();
    this.setupEventListeners();
    this.updateUI();
  }

  /**
   * Initialize the puzzle position
   */
  private initializePuzzle(): void {
    this.engine.loadFEN(this.puzzle.fen);
    this.validator.reset();
    this.selectedSquare = null;
    this.hintsUsed = 0;
    this.attempts = 0;
    this.isComplete = false;
    this.nextPuzzleButton.style.display = 'none';
    this.render();
  }

  /**
   * Setup event listeners
   */
  private setupEventListeners(): void {
    // Canvas click for moves
    this.renderer.getCanvas().addEventListener('click', (e) => this.handleClick(e));

    // Hint button
    this.hintButton.addEventListener('click', () => this.showHint());

    // Reset button
    this.resetButton.addEventListener('click', () => this.resetPuzzle());

    // Back button
    this.backButton.addEventListener('click', () => {
      this.cleanup();
      this.onBack();
    });

    // Next puzzle button
    this.nextPuzzleButton.addEventListener('click', () => {
      if (this.onNextPuzzle) {
        this.cleanup();
        this.onNextPuzzle();
      }
    });
  }

  /**
   * Render the board
   */
  private render(): void {
    const board = this.engine.getBoard();
    this.renderer.render(board);
  }

  /**
   * Handle canvas click
   */
  private handleClick(event: MouseEvent): void {
    if (this.isComplete) {
      return; // No moves after completion
    }

    const canvas = this.renderer.getCanvas();
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    const position = this.renderer.getSquareFromClick(x, y);

    if (!position) {
      return;
    }

    // If this is the opponent's turn, don't allow moves
    const currentTurn = this.engine.getCurrentTurn();
    if (currentTurn !== this.puzzle.playerSide) {
      this.setFeedback('Wait for the opponent to move...', 'info');
      return;
    }

    if (!this.selectedSquare) {
      // Select a piece
      const piece = this.engine.getPieceAt(position);
      if (piece && piece.color === this.puzzle.playerSide) {
        this.selectedSquare = position;
        const legalMoves = this.engine.getLegalMoves(position);
        this.renderer.setHighlights(position, legalMoves);
        this.render();
      }
    } else {
      // Try to make a move
      this.attemptMove(this.selectedSquare, position);
      this.selectedSquare = null;
      this.renderer.clearHighlights();
      this.render();
    }
  }

  /**
   * Attempt to make a move
   */
  private attemptMove(from: Position, to: Position): void {
    // First, check if this is a legal move in the engine
    const legalMoves = this.engine.getLegalMoves(from);
    const isLegal = legalMoves.some(
      (move) => move.row === to.row && move.col === to.col
    );

    if (!isLegal) {
      this.setFeedback('Illegal move!', 'error');
      return;
    }

    // Make the move in the engine
    const success = this.engine.makeMove(from, to);
    if (!success) {
      this.setFeedback('Invalid move!', 'error');
      return;
    }

    // Get the move notation from history (last move)
    const moveHistory = this.engine.getMoveHistory();
    const lastMove = moveHistory[moveHistory.length - 1];
    if (!lastMove || !lastMove.notation) {
      this.setFeedback('Error: Could not get move notation', 'error');
      return;
    }

    this.attempts++;

    // Validate against puzzle solution
    const result = this.validator.validateMove(lastMove.notation);

    if (!result.isCorrect) {
      // Wrong move - undo it
      this.setFeedback(
        result.feedback || 'Not the right move. Try again!',
        'error'
      );
      this.resetPuzzle(); // Reset to starting position
      return;
    }

    // Correct move!
    this.setFeedback(result.feedback || 'Good move!', 'success');
    this.addMoveToList(lastMove.notation, this.puzzle.playerSide);
    this.render();

    if (result.isComplete) {
      this.handlePuzzleComplete(result.isDraw);
      return;
    }

    // Apply opponent's response
    if (result.nextOpponentMove) {
      setTimeout(() => {
        this.makeOpponentMove(result.nextOpponentMove!);
      }, 500); // Delay for better UX
    }
  }

  /**
   * Make the opponent's scripted move
   */
  private makeOpponentMove(san: string): void {
    try {
      this.engine.makeSANMove(san);
      this.validator.applyOpponentMove(san);

      const opponentColor = this.puzzle.playerSide === 'white' ? 'black' : 'white';
      this.addMoveToList(san, opponentColor);

      this.render();
      this.setFeedback('Your turn...', 'info');

      // Check if puzzle is complete after opponent move
      if (this.engine.isGameOver()) {
        this.handlePuzzleComplete(false);
      }
    } catch (error) {
      console.error('Error making opponent move:', error);
      this.setFeedback('Error: Could not make opponent move', 'error');
    }
  }

  /**
   * Show a hint
   */
  private showHint(): void {
    if (this.isComplete) {
      return;
    }

    const hint = this.validator.getHint();
    if (hint) {
      this.hintsUsed++;
      const hintText = `Hint ${this.hintsUsed}: Try ${hint}`;
      this.setFeedback(hintText, 'info');

      // Also show from puzzle hints if available
      if (this.puzzle.hints[this.hintsUsed - 1]) {
        this.addHintToList(this.puzzle.hints[this.hintsUsed - 1]);
      }
    } else {
      this.setFeedback('No hints available', 'info');
    }
  }

  /**
   * Reset the puzzle
   */
  private resetPuzzle(): void {
    this.initializePuzzle();
    this.updateUI();
    this.clearMoveList();
    this.setFeedback('Puzzle reset. Try again!', 'info');
  }

  /**
   * Handle puzzle completion
   */
  private handlePuzzleComplete(isDraw: boolean = false): void {
    this.isComplete = true;

    if (isDraw) {
      this.setFeedback(
        '🎉 Puzzle solved! You achieved the draw.',
        'success'
      );
    } else {
      this.setFeedback(
        '🎉 Congratulations! Puzzle solved!',
        'success'
      );
    }

    this.showEducationalInfo();
    this.hintButton.disabled = true;

    // Show next puzzle button if callback is provided
    if (this.onNextPuzzle) {
      this.nextPuzzleButton.style.display = 'inline-block';
    }
  }

  /**
   * Show educational information
   */
  private showEducationalInfo(): void {
    this.educational.style.display = 'block';
    this.educational.innerHTML = `
      <h3>What You Learned</h3>
      <p>${this.puzzle.educational.replace(/\n/g, '<br>')}</p>
      <p><strong>Moves taken:</strong> ${this.attempts}</p>
      <p><strong>Hints used:</strong> ${this.hintsUsed}</p>
    `;
  }

  /**
   * Update UI with puzzle information
   */
  private updateUI(): void {
    this.puzzleTitle.textContent = this.puzzle.title;
    this.puzzleDescription.textContent = this.puzzle.description;
    this.puzzleObjective.textContent = this.puzzle.objectiveDescription;
    this.puzzleFeedback.textContent = '';
    this.educational.style.display = 'none';
    this.hintButton.disabled = false;

    // Show difficulty stars
    const difficultyStars = '⭐'.repeat(this.puzzle.difficulty);
    this.puzzleTitle.textContent = `${this.puzzle.title} ${difficultyStars}`;
  }

  /**
   * Set feedback message
   */
  private setFeedback(message: string, type: 'success' | 'error' | 'info'): void {
    this.puzzleFeedback.textContent = message;
    this.puzzleFeedback.className = `feedback ${type}`;
  }

  /**
   * Add move to the move list
   */
  private addMoveToList(san: string, color: string): void {
    const moveElement = document.createElement('div');
    moveElement.className = `move ${color}`;
    moveElement.textContent = `${color === 'white' ? '♔' : '♚'} ${san}`;
    this.moveList.appendChild(moveElement);
    this.moveList.scrollTop = this.moveList.scrollHeight;
  }

  /**
   * Add hint to hints list
   */
  private addHintToList(hint: string): void {
    const hintElement = document.createElement('div');
    hintElement.className = 'hint-item';
    hintElement.textContent = `💡 ${hint}`;
    this.puzzleHints.appendChild(hintElement);
  }

  /**
   * Clear move list
   */
  private clearMoveList(): void {
    this.moveList.innerHTML = '';
    this.puzzleHints.innerHTML = '';
  }

  /**
   * Cleanup
   */
  private cleanup(): void {
    // Remove event listeners
    this.renderer.getCanvas().removeEventListener('click', this.handleClick);
  }
}
