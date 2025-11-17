import './style.css';
import { ChessEngine } from './ChessEngine';
import { ChessBoardRenderer } from './ChessBoardRenderer';
import type { Position } from './types';

class ChessApp {
  private engine: ChessEngine;
  private renderer: ChessBoardRenderer;
  private selectedSquare: Position | null = null;
  private canvas: HTMLCanvasElement;

  constructor() {
    this.engine = new ChessEngine();

    const canvas = document.getElementById('chess-board') as HTMLCanvasElement;
    if (!canvas) throw new Error('Canvas not found');

    this.canvas = canvas;
    this.renderer = new ChessBoardRenderer(canvas);

    this.setupEventListeners();
    this.render();
    this.updateUI();
  }

  private setupEventListeners(): void {
    this.canvas.addEventListener('click', (e) => this.handleClick(e));
  }

  private handleClick(event: MouseEvent): void {
    if (this.engine.isGameOver()) return;

    const rect = this.canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    const clickedSquare = this.renderer.getSquareFromClick(x, y);

    if (this.selectedSquare) {
      // Try to make a move
      const success = this.engine.makeMove(this.selectedSquare, clickedSquare);

      if (success) {
        this.selectedSquare = null;
        this.renderer.setSelectedSquare(null);
        this.renderer.setHighlightedSquares([]);
        this.render();
        this.updateUI();
      } else {
        // Check if clicking on own piece to select it
        const clickedPiece = this.engine.getPieceAt(clickedSquare);
        if (clickedPiece && clickedPiece.color === this.engine.getCurrentTurn()) {
          this.selectSquare(clickedSquare);
        } else {
          // Deselect
          this.selectedSquare = null;
          this.renderer.setSelectedSquare(null);
          this.renderer.setHighlightedSquares([]);
          this.render();
        }
      }
    } else {
      // Select a piece
      const piece = this.engine.getPieceAt(clickedSquare);
      if (piece && piece.color === this.engine.getCurrentTurn()) {
        this.selectSquare(clickedSquare);
      }
    }
  }

  private selectSquare(square: Position): void {
    this.selectedSquare = square;
    this.renderer.setSelectedSquare(square);

    const legalMoves = this.engine.getLegalMoves(square);
    this.renderer.setHighlightedSquares(legalMoves);

    this.render();
  }

  private render(): void {
    const board = this.engine.getBoard();
    this.renderer.render(board);
  }

  private updateUI(): void {
    // Update turn indicator
    const turnIndicator = document.getElementById('turn-indicator');
    if (turnIndicator) {
      const currentTurn = this.engine.getCurrentTurn();
      turnIndicator.textContent = `${currentTurn.charAt(0).toUpperCase() + currentTurn.slice(1)} to move`;
      turnIndicator.style.color = currentTurn === 'white' ? '#333' : '#666';
    }

    // Update game status
    const gameStatus = document.getElementById('game-status');
    if (gameStatus) {
      const status = this.engine.getGameStatus();
      gameStatus.textContent = status;
      if (status.includes('Checkmate')) {
        gameStatus.style.color = '#d32f2f';
        gameStatus.style.fontWeight = 'bold';
      } else if (status.includes('Check')) {
        gameStatus.style.color = '#f57c00';
        gameStatus.style.fontWeight = 'bold';
      } else if (status.includes('Stalemate')) {
        gameStatus.style.color = '#1976d2';
        gameStatus.style.fontWeight = 'bold';
      }
    }

    // Update move history
    this.updateMoveHistory();
  }

  private updateMoveHistory(): void {
    const movesList = document.getElementById('moves-list');
    if (!movesList) return;

    const moves = this.engine.getMoveHistory();
    movesList.innerHTML = '';

    for (let i = 0; i < moves.length; i += 2) {
      const moveNumber = Math.floor(i / 2) + 1;
      const whiteMove = moves[i];
      const blackMove = moves[i + 1];

      const movePair = document.createElement('div');
      movePair.className = 'move-pair';

      const numberSpan = document.createElement('span');
      numberSpan.className = 'move-number';
      numberSpan.textContent = `${moveNumber}.`;
      movePair.appendChild(numberSpan);

      const whiteSpan = document.createElement('span');
      whiteSpan.className = 'move white';
      whiteSpan.textContent = whiteMove.notation || '?';
      movePair.appendChild(whiteSpan);

      if (blackMove) {
        const blackSpan = document.createElement('span');
        blackSpan.className = 'move black';
        blackSpan.textContent = blackMove.notation || '?';
        movePair.appendChild(blackSpan);
      }

      movesList.appendChild(movePair);
    }

    // Scroll to bottom
    movesList.scrollTop = movesList.scrollHeight;
  }
}

// Initialize the app
new ChessApp();
