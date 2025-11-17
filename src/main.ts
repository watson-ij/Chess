import './style.css';
import { ChessEngine } from './ChessEngine';
import { ChessBoardRenderer } from './ChessBoardRenderer';
import { StockfishAI } from './StockfishAI';
import { OpeningApp } from './OpeningApp';
import { PuzzleMode } from './PuzzleMode';
import { PuzzleSelector } from './PuzzleSelector';
import type { Position, PieceColor } from './types';
import type { EndgamePuzzle } from './EndgameTypes';

class ChessApp {
  private engine: ChessEngine;
  private renderer: ChessBoardRenderer;
  private selectedSquare: Position | null = null;
  private canvas: HTMLCanvasElement;

  // AI mode components
  private ai: StockfishAI | null = null;
  private isAIMode: boolean = false;
  private playerColor: PieceColor = 'white';
  private isAIThinking: boolean = false;
  private moveHistoryUCI: string[] = []; // UCI move history for Stockfish

  // DOM elements
  private setupPanel: HTMLElement;
  private chessGame: HTMLElement;

  constructor() {
    // Get DOM elements
    this.setupPanel = document.getElementById('setup-panel')!;
    this.chessGame = document.getElementById('game-container')!;

    // Initialize chess components
    this.engine = new ChessEngine();
    const canvas = document.getElementById('chess-board') as HTMLCanvasElement;
    if (!canvas) throw new Error('Canvas not found');
    this.canvas = canvas;
    this.renderer = new ChessBoardRenderer(canvas);

    this.setupSetupPanelListeners();
  }


  /**
   * Setup AI setup panel listeners
   */
  private setupSetupPanelListeners(): void {
    // Game mode selection (PvP vs AI)
    const gameModeRadios = document.querySelectorAll<HTMLInputElement>('input[name="game-mode"]');
    gameModeRadios.forEach(radio => {
      radio.addEventListener('change', () => {
        const aiSettings = document.getElementById('ai-settings');
        if (aiSettings) {
          aiSettings.style.display = radio.value === 'ai' ? 'block' : 'none';
        }
      });
    });

    // Position mode selection
    const positionModeRadios = document.querySelectorAll<HTMLInputElement>('input[name="position-mode"]');
    positionModeRadios.forEach(radio => {
      radio.addEventListener('change', () => {
        const fenInputGroup = document.getElementById('fen-input-group');
        const pgnInputGroup = document.getElementById('pgn-input-group');

        if (fenInputGroup) fenInputGroup.style.display = radio.value === 'fen' ? 'block' : 'none';
        if (pgnInputGroup) pgnInputGroup.style.display = radio.value === 'pgn' ? 'block' : 'none';
      });
    });

    // Start game button
    const startButton = document.getElementById('start-game');
    if (startButton) {
      startButton.addEventListener('click', () => this.startGameFromSetup());
    }

    // Reset game button
    const resetButton = document.getElementById('reset-game');
    if (resetButton) {
      resetButton.addEventListener('click', () => this.resetGame());
    }
  }


  /**
   * Cleanup resources
   */
  private cleanup(): void {
    // Cleanup AI
    if (this.ai) {
      this.ai.destroy();
      this.ai = null;
    }

    // Reset state
    this.isAIMode = false;
    this.isAIThinking = false;
    this.moveHistoryUCI = [];
    this.selectedSquare = null;
  }

  /**
   * Start chess game (PvP or AI mode)
   */
  private startChessGame(withAI: boolean): void {
    this.isAIMode = withAI;

    // Hide setup panel and show game container
    this.setupPanel.style.display = 'none';
    this.chessGame.style.display = 'block';

    // Show reset button, hide start button
    const startButton = document.getElementById('start-game');
    const resetButton = document.getElementById('reset-game');
    if (startButton) startButton.style.display = 'none';
    if (resetButton) resetButton.style.display = 'inline-block';

    // Reset the game (keep current position if loaded from FEN/PGN)
    this.selectedSquare = null;
    this.moveHistoryUCI = [];
    this.renderer.clearHighlights();

    // Setup event listeners
    this.setupChessEventListeners();
    this.render();
    this.updateUI();
  }

  /**
   * Start game from setup panel
   */
  private async startGameFromSetup(): Promise<void> {
    try {
      // Check which game mode is selected
      const gameModeRadio = document.querySelector<HTMLInputElement>('input[name="game-mode"]:checked');
      const gameMode = gameModeRadio?.value || 'pvp';

      // Get position mode
      const positionModeRadio = document.querySelector<HTMLInputElement>('input[name="position-mode"]:checked');
      const positionMode = positionModeRadio?.value || 'standard';

      // Setup position
      if (positionMode === 'fen') {
        const fenInput = document.getElementById('fen-input') as HTMLInputElement;
        const fen = fenInput?.value.trim();
        if (fen) {
          try {
            this.engine.loadFEN(fen);
          } catch (error) {
            alert('Invalid FEN string. Please check and try again.');
            return;
          }
        }
      } else if (positionMode === 'pgn') {
        const pgnInput = document.getElementById('pgn-input') as HTMLTextAreaElement;
        const pgn = pgnInput?.value.trim();
        if (pgn) {
          try {
            const success = this.engine.loadPGN(pgn);
            if (!success) {
              alert('Invalid PGN. Please check and try again.');
              return;
            }
          } catch (error) {
            alert('Error loading PGN. Please check and try again.');
            return;
          }
        }
      } else {
        // Standard position
        this.engine = new ChessEngine();
      }

      // Start game based on mode
      if (gameMode === 'ai') {
        // Get AI settings
        const playerColorSelect = document.getElementById('player-color') as HTMLSelectElement;
        this.playerColor = playerColorSelect?.value as PieceColor || 'white';

        const aiDifficultySelect = document.getElementById('ai-difficulty') as HTMLSelectElement;
        const difficulty = parseInt(aiDifficultySelect?.value || '20');

        // Initialize AI
        this.ai = new StockfishAI();
        this.ai.setSkillLevel(difficulty);

        // Start AI game
        this.startChessGame(true);

        // If AI plays first (player is black), make AI move
        if (this.playerColor === 'black' && !this.engine.isGameOver()) {
          await this.makeAIMove();
        }
      } else {
        // Start PvP game
        this.startChessGame(false);
      }
    } catch (error) {
      console.error('Error starting game:', error);
      alert('Error starting game. Please try again.');
    }
  }

  /**
   * Reset game and return to setup
   */
  private resetGame(): void {
    this.cleanup();

    // Show setup panel, hide game container
    this.setupPanel.style.display = 'block';
    this.chessGame.style.display = 'none';

    // Show start button, hide reset button
    const startButton = document.getElementById('start-game');
    const resetButton = document.getElementById('reset-game');
    if (startButton) startButton.style.display = 'inline-block';
    if (resetButton) resetButton.style.display = 'none';

    // Reset inputs
    const fenInput = document.getElementById('fen-input') as HTMLInputElement;
    const pgnInput = document.getElementById('pgn-input') as HTMLTextAreaElement;
    if (fenInput) fenInput.value = '';
    if (pgnInput) pgnInput.value = '';

    // Reset engine to standard position
    this.engine = new ChessEngine();
  }

  /**
   * Setup chess game event listeners
   */
  private setupChessEventListeners(): void {
    // Remove old listeners by cloning the canvas
    const oldCanvas = this.canvas;
    const newCanvas = oldCanvas.cloneNode(true) as HTMLCanvasElement;
    oldCanvas.parentNode?.replaceChild(newCanvas, oldCanvas);
    this.canvas = newCanvas;
    this.renderer = new ChessBoardRenderer(newCanvas);

    this.canvas.addEventListener('click', (e) => this.handleChessClick(e));
  }

  /**
   * Handle chess game click
   */
  private async handleChessClick(event: MouseEvent): Promise<void> {
    if (this.engine.isGameOver() || this.isAIThinking) return;

    // In AI mode, only allow player to move their pieces
    if (this.isAIMode && this.engine.getCurrentTurn() !== this.playerColor) {
      return;
    }

    const rect = this.canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    const clickedSquare = this.renderer.getSquareFromClick(x, y);

    if (this.selectedSquare) {
      // Try to make a move
      const success = this.engine.makeMove(this.selectedSquare, clickedSquare);

      if (success) {
        // Track UCI move for AI
        if (this.isAIMode) {
          const uciMove = StockfishAI.toUCIMove(this.selectedSquare, clickedSquare);
          this.moveHistoryUCI.push(uciMove);
        }

        this.selectedSquare = null;
        this.renderer.setSelectedSquare(null);
        this.renderer.setHighlightedSquares([]);
        this.render();
        this.updateUI();

        // Make AI move if in AI mode and game not over
        if (this.isAIMode && !this.engine.isGameOver()) {
          await this.makeAIMove();
        }
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

  /**
   * Make AI move
   */
  private async makeAIMove(): Promise<void> {
    if (!this.ai || this.isAIThinking) return;

    this.isAIThinking = true;
    const aiThinkingEl = document.getElementById('ai-thinking');
    if (aiThinkingEl) aiThinkingEl.style.display = 'flex';

    try {
      // Small delay for better UX
      await new Promise(resolve => setTimeout(resolve, 300));

      const fen = this.engine.toFEN();
      const bestMove = await this.ai.getBestMove(fen, this.moveHistoryUCI);

      // Parse and make the move
      const { from, to } = StockfishAI.parseUCIMove(bestMove);
      const success = this.engine.makeMove(from, to);

      if (success) {
        this.moveHistoryUCI.push(bestMove);
        this.render();
        this.updateUI();
      }
    } catch (error) {
      console.error('AI move error:', error);
    } finally {
      this.isAIThinking = false;
      if (aiThinkingEl) aiThinkingEl.style.display = 'none';
    }
  }

  /**
   * Select a square
   */
  private selectSquare(square: Position): void {
    this.selectedSquare = square;
    this.renderer.setSelectedSquare(square);

    const legalMoves = this.engine.getLegalMoves(square);
    this.renderer.setHighlightedSquares(legalMoves);

    this.render();
  }

  /**
   * Render the board
   */
  private render(): void {
    const board = this.engine.getBoard();
    this.renderer.render(board);
  }

  /**
   * Update UI for chess game
   */
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

  /**
   * Update move history
   */
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

class AppManager {
  private chessApp: ChessApp | null = null;
  private openingApp: OpeningApp | null = null;
  private puzzleSelector: PuzzleSelector | null = null;

  constructor() {
    this.setupNavigationButtons();
    this.showLandingPage();
  }

  private setupNavigationButtons(): void {
    // Mode selection buttons on landing page
    const selectPlayBtn = document.getElementById('select-play');
    const selectOpeningsBtn = document.getElementById('select-openings');
    const selectEndgamesBtn = document.getElementById('select-endgames');

    selectPlayBtn?.addEventListener('click', () => this.showPlayMode());
    selectOpeningsBtn?.addEventListener('click', () => this.showOpeningsMode());
    selectEndgamesBtn?.addEventListener('click', () => this.showEndgamesMode());

    // Back buttons
    const backFromPlayBtn = document.getElementById('back-from-play');
    const backFromOpeningsBtn = document.getElementById('back-from-openings');
    const backFromEndgamesBtn = document.getElementById('back-from-endgames');

    backFromPlayBtn?.addEventListener('click', () => this.showLandingPage());
    backFromOpeningsBtn?.addEventListener('click', () => this.showLandingPage());
    backFromEndgamesBtn?.addEventListener('click', () => this.showLandingPage());
  }

  private showLandingPage(): void {
    const landingPage = document.getElementById('landing-page');
    const playContainer = document.getElementById('play-container');
    const openingsContainer = document.getElementById('openings-container');
    const endgamesContainer = document.getElementById('endgames-container');

    landingPage?.classList.remove('hidden');
    playContainer?.classList.add('hidden');
    openingsContainer?.classList.add('hidden');
    endgamesContainer?.classList.add('hidden');
  }

  private showPlayMode(): void {
    const landingPage = document.getElementById('landing-page');
    const playContainer = document.getElementById('play-container');
    const openingsContainer = document.getElementById('openings-container');
    const endgamesContainer = document.getElementById('endgames-container');

    landingPage?.classList.add('hidden');
    playContainer?.classList.remove('hidden');
    openingsContainer?.classList.add('hidden');
    endgamesContainer?.classList.add('hidden');

    // Initialize chess app if not already done
    if (!this.chessApp) {
      this.chessApp = new ChessApp();
    }
  }

  private showOpeningsMode(): void {
    const landingPage = document.getElementById('landing-page');
    const playContainer = document.getElementById('play-container');
    const openingsContainer = document.getElementById('openings-container');
    const endgamesContainer = document.getElementById('endgames-container');

    landingPage?.classList.add('hidden');
    playContainer?.classList.add('hidden');
    openingsContainer?.classList.remove('hidden');
    endgamesContainer?.classList.add('hidden');

    // Initialize opening app if not already done
    if (!this.openingApp) {
      const canvas = document.getElementById('opening-board') as HTMLCanvasElement;
      if (canvas) {
        this.openingApp = new OpeningApp(canvas);
      }
    }
  }

  private showEndgamesMode(): void {
    const landingPage = document.getElementById('landing-page');
    const playContainer = document.getElementById('play-container');
    const openingsContainer = document.getElementById('openings-container');
    const endgamesContainer = document.getElementById('endgames-container');

    landingPage?.classList.add('hidden');
    playContainer?.classList.add('hidden');
    openingsContainer?.classList.add('hidden');
    endgamesContainer?.classList.remove('hidden');

    // Show puzzle selection, hide puzzle game
    const puzzleSelection = document.getElementById('puzzle-selection');
    const puzzleGame = document.getElementById('puzzle-game');
    if (puzzleSelection) puzzleSelection.classList.remove('hidden');
    if (puzzleGame) puzzleGame.classList.add('hidden');

    // Initialize puzzle selector if not already done
    if (!this.puzzleSelector) {
      const container = document.getElementById('puzzle-selector-container');
      if (container) {
        this.puzzleSelector = new PuzzleSelector(container, (puzzle) => {
          this.startPuzzle(puzzle);
        });
      }
    }
  }

  private startPuzzle(puzzle: EndgamePuzzle): void {
    // Hide puzzle selection, show puzzle game
    const puzzleSelection = document.getElementById('puzzle-selection');
    const puzzleGame = document.getElementById('puzzle-game');
    if (puzzleSelection) puzzleSelection.classList.add('hidden');
    if (puzzleGame) puzzleGame.classList.remove('hidden');

    // Setup back to puzzles button
    const backToPuzzlesBtn = document.getElementById('back-to-puzzles');
    if (backToPuzzlesBtn) {
      // Remove old listeners
      const newBtn = backToPuzzlesBtn.cloneNode(true) as HTMLElement;
      backToPuzzlesBtn.parentNode?.replaceChild(newBtn, backToPuzzlesBtn);

      newBtn.addEventListener('click', () => {
        this.showEndgamesMode();
      });
    }

    // Create puzzle mode
    const puzzleCanvas = document.getElementById('puzzle-board') as HTMLCanvasElement;
    if (puzzleCanvas) {
      new PuzzleMode(puzzleCanvas, puzzle, () => {
        this.showEndgamesMode();
      });
    }
  }
}

// Initialize the app manager
new AppManager();
