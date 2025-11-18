import './style.css';
import { ChessEngine } from './ChessEngine';
import { ChessBoardRenderer } from './ChessBoardRenderer';
import { StockfishAI } from './StockfishAI';
import { OpeningApp } from './OpeningApp';
import { PuzzleMode } from './PuzzleMode';
import { PuzzleSelector } from './PuzzleSelector';
import { ENDGAME_PUZZLES } from './PuzzleDatabase';
import { TacticalPuzzleSelector } from './TacticalPuzzleSelector';
import { TACTICAL_PUZZLES } from './TacticalPuzzleDatabase';
import type { Position, PieceColor } from './types';
import type { EndgamePuzzle } from './EndgameTypes';
import type { TacticalPuzzle } from './TacticalPuzzleTypes';

class ChessApp {
  private engine: ChessEngine;
  private renderer: ChessBoardRenderer | null = null;
  private selectedSquare: Position | null = null;
  private canvas: HTMLCanvasElement;

  // AI mode components
  private ai: StockfishAI | null = null;
  private isAIMode: boolean = false;
  private playerColor: PieceColor = 'white';
  private isAIThinking: boolean = false;
  private moveHistoryUCI: string[] = []; // UCI move history for Stockfish

  // Move navigation
  private currentMoveIndex: number = -1; // -1 means current position (end of game)
  private isReviewMode: boolean = false; // True when viewing move history

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
    // Note: renderer is created later in startChessGame() when container is visible

    this.setupSetupPanelListeners();
    this.setupNavigationListeners();
    this.setupBoardControlListeners();
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
   * Setup move navigation listeners
   */
  private setupNavigationListeners(): void {
    const navStart = document.getElementById('nav-start');
    const navPrev = document.getElementById('nav-prev');
    const navNext = document.getElementById('nav-next');
    const navEnd = document.getElementById('nav-end');

    if (navStart) {
      navStart.addEventListener('click', () => this.navigateToStart());
    }
    if (navPrev) {
      navPrev.addEventListener('click', () => this.navigateToPrevious());
    }
    if (navNext) {
      navNext.addEventListener('click', () => this.navigateToNext());
    }
    if (navEnd) {
      navEnd.addEventListener('click', () => this.navigateToEnd());
    }
  }

  /**
   * Setup board control listeners (flip, resize)
   */
  private setupBoardControlListeners(): void {
    // Flip board button
    const flipButton = document.getElementById('flip-board-btn');
    if (flipButton) {
      flipButton.addEventListener('click', () => {
        if (this.renderer) {
          this.renderer.flipBoard();
        }
      });
    }

    // Board size slider
    const sizeSlider = document.getElementById('board-size-slider') as HTMLInputElement;
    const sizeDisplay = document.getElementById('board-size-display');

    if (sizeSlider) {
      sizeSlider.addEventListener('input', () => {
        const size = parseInt(sizeSlider.value);
        if (sizeDisplay) {
          sizeDisplay.textContent = `${size}px`;
        }
        if (this.renderer) {
          this.renderer.setBoardSize(size);
        }
      });
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
    this.currentMoveIndex = -1;
    this.isReviewMode = false;
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

    // Create renderer now that container is visible (ensures proper canvas dimensions)
    if (!this.renderer) {
      this.renderer = new ChessBoardRenderer(this.canvas);
    }

    // Reset the game (keep current position if loaded from FEN/PGN)
    this.selectedSquare = null;
    this.moveHistoryUCI = [];
    this.renderer.clearHighlights();

    // Reset navigation state
    const moves = this.engine.getMoveHistory();
    this.currentMoveIndex = moves.length > 0 ? moves.length - 1 : -1;
    this.isReviewMode = false;

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
    if (this.engine.isGameOver() || this.isAIThinking || !this.renderer) return;

    // Don't allow moves when in review mode
    if (this.isReviewMode) {
      return;
    }

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

        // Update current move index to the latest move
        const moves = this.engine.getMoveHistory();
        this.currentMoveIndex = moves.length - 1;
        this.isReviewMode = false;

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

        // Update current move index to the latest move
        const moves = this.engine.getMoveHistory();
        this.currentMoveIndex = moves.length - 1;
        this.isReviewMode = false;

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
    if (!this.renderer) return;

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
    if (!this.renderer) return;
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
   * Navigate to start position
   */
  private navigateToStart(): void {
    this.currentMoveIndex = -1;
    this.isReviewMode = true;
    this.renderBoardAtMove(this.currentMoveIndex);
    this.updateMoveHistory();
    this.updateNavigationButtons();
  }

  /**
   * Navigate to previous move
   */
  private navigateToPrevious(): void {
    if (this.currentMoveIndex > -1) {
      this.currentMoveIndex--;
      this.isReviewMode = true;
      this.renderBoardAtMove(this.currentMoveIndex);
      this.updateMoveHistory();
      this.updateNavigationButtons();
    }
  }

  /**
   * Navigate to next move
   */
  private navigateToNext(): void {
    const moves = this.engine.getMoveHistory();
    if (this.currentMoveIndex < moves.length - 1) {
      this.currentMoveIndex++;
      this.isReviewMode = this.currentMoveIndex < moves.length - 1;
      this.renderBoardAtMove(this.currentMoveIndex);
      this.updateMoveHistory();
      this.updateNavigationButtons();
    }
  }

  /**
   * Navigate to end position (current game state)
   */
  private navigateToEnd(): void {
    const moves = this.engine.getMoveHistory();
    this.currentMoveIndex = moves.length - 1;
    this.isReviewMode = false;
    this.render();
    this.updateMoveHistory();
    this.updateNavigationButtons();
  }

  /**
   * Navigate to specific move
   */
  private navigateToMove(moveIndex: number): void {
    const moves = this.engine.getMoveHistory();
    if (moveIndex >= -1 && moveIndex < moves.length) {
      this.currentMoveIndex = moveIndex;
      this.isReviewMode = moveIndex < moves.length - 1;
      this.renderBoardAtMove(moveIndex);
      this.updateMoveHistory();
      this.updateNavigationButtons();
    }
  }

  /**
   * Render board at specific move index
   */
  private renderBoardAtMove(moveIndex: number): void {
    if (!this.renderer) return;
    const board = this.engine.getBoardAtMove(moveIndex);
    this.renderer.render(board);
  }

  /**
   * Update navigation button states
   */
  private updateNavigationButtons(): void {
    const moves = this.engine.getMoveHistory();
    const navStart = document.getElementById('nav-start') as HTMLButtonElement;
    const navPrev = document.getElementById('nav-prev') as HTMLButtonElement;
    const navNext = document.getElementById('nav-next') as HTMLButtonElement;
    const navEnd = document.getElementById('nav-end') as HTMLButtonElement;

    if (navStart) navStart.disabled = this.currentMoveIndex === -1;
    if (navPrev) navPrev.disabled = this.currentMoveIndex === -1;
    if (navNext) navNext.disabled = this.currentMoveIndex === moves.length - 1;
    if (navEnd) navEnd.disabled = this.currentMoveIndex === moves.length - 1;
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
      whiteSpan.dataset.moveIndex = String(i);
      if (this.currentMoveIndex === i) {
        whiteSpan.classList.add('active');
      }
      whiteSpan.addEventListener('click', () => this.navigateToMove(i));
      movePair.appendChild(whiteSpan);

      if (blackMove) {
        const blackSpan = document.createElement('span');
        blackSpan.className = 'move black';
        blackSpan.textContent = blackMove.notation || '?';
        blackSpan.dataset.moveIndex = String(i + 1);
        if (this.currentMoveIndex === i + 1) {
          blackSpan.classList.add('active');
        }
        blackSpan.addEventListener('click', () => this.navigateToMove(i + 1));
        movePair.appendChild(blackSpan);
      }

      movesList.appendChild(movePair);
    }

    // Update navigation buttons
    this.updateNavigationButtons();

    // Scroll to active move or bottom
    if (this.currentMoveIndex >= 0) {
      const activeMove = movesList.querySelector('.move.active');
      if (activeMove) {
        activeMove.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }
    } else {
      movesList.scrollTop = movesList.scrollHeight;
    }
  }

}

class AppManager {
  private chessApp: ChessApp | null = null;
  private openingApp: OpeningApp | null = null;
  private puzzleSelector: PuzzleSelector | null = null;
  private currentPuzzleIndex: number = 0;
  private tacticalPuzzleSelector: TacticalPuzzleSelector | null = null;
  private currentTacticalPuzzleIndex: number = 0;

  constructor() {
    this.setupNavigationButtons();
    this.showLandingPage();
  }

  private setupNavigationButtons(): void {
    // Mode selection buttons on landing page
    const selectPlayBtn = document.getElementById('select-play');
    const selectOpeningsBtn = document.getElementById('select-openings');
    const selectEndgamesBtn = document.getElementById('select-endgames');
    const selectTacticalBtn = document.getElementById('select-tactical');

    selectPlayBtn?.addEventListener('click', () => this.showPlayMode());
    selectOpeningsBtn?.addEventListener('click', () => this.showOpeningsMode());
    selectEndgamesBtn?.addEventListener('click', () => this.showEndgamesMode());
    selectTacticalBtn?.addEventListener('click', () => this.showTacticalMode());

    // Back buttons
    const backFromPlayBtn = document.getElementById('back-from-play');
    const backFromOpeningsBtn = document.getElementById('back-from-openings');
    const backFromEndgamesBtn = document.getElementById('back-from-endgames');
    const backFromTacticalBtn = document.getElementById('back-from-tactical');

    backFromPlayBtn?.addEventListener('click', () => this.showLandingPage());
    backFromOpeningsBtn?.addEventListener('click', () => this.showLandingPage());
    backFromEndgamesBtn?.addEventListener('click', () => this.showLandingPage());
    backFromTacticalBtn?.addEventListener('click', () => this.showLandingPage());
  }

  private showLandingPage(): void {
    const landingPage = document.getElementById('landing-page');
    const playContainer = document.getElementById('play-container');
    const openingsContainer = document.getElementById('openings-container');
    const endgamesContainer = document.getElementById('endgames-container');
    const tacticalContainer = document.getElementById('tactical-container');

    landingPage?.classList.remove('hidden');
    playContainer?.classList.add('hidden');
    openingsContainer?.classList.add('hidden');
    endgamesContainer?.classList.add('hidden');
    tacticalContainer?.classList.add('hidden');
  }

  private showPlayMode(): void {
    const landingPage = document.getElementById('landing-page');
    const playContainer = document.getElementById('play-container');
    const openingsContainer = document.getElementById('openings-container');
    const endgamesContainer = document.getElementById('endgames-container');
    const tacticalContainer = document.getElementById('tactical-container');

    landingPage?.classList.add('hidden');
    playContainer?.classList.remove('hidden');
    openingsContainer?.classList.add('hidden');
    endgamesContainer?.classList.add('hidden');
    tacticalContainer?.classList.add('hidden');

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
    const tacticalContainer = document.getElementById('tactical-container');

    landingPage?.classList.add('hidden');
    playContainer?.classList.add('hidden');
    openingsContainer?.classList.remove('hidden');
    endgamesContainer?.classList.add('hidden');
    tacticalContainer?.classList.add('hidden');

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
    const tacticalContainer = document.getElementById('tactical-container');

    landingPage?.classList.add('hidden');
    playContainer?.classList.add('hidden');
    openingsContainer?.classList.add('hidden');
    endgamesContainer?.classList.remove('hidden');
    tacticalContainer?.classList.add('hidden');

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
    // Find the index of the current puzzle
    this.currentPuzzleIndex = ENDGAME_PUZZLES.findIndex(p => p.id === puzzle.id);

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
      }, () => {
        this.loadNextPuzzle();
      });
    }
  }

  private loadNextPuzzle(): void {
    // Get the next puzzle (wrap around to the beginning if at the end)
    const nextIndex = (this.currentPuzzleIndex + 1) % ENDGAME_PUZZLES.length;
    const nextPuzzle = ENDGAME_PUZZLES[nextIndex];
    this.startPuzzle(nextPuzzle);
  }

  private showTacticalMode(): void {
    const landingPage = document.getElementById('landing-page');
    const playContainer = document.getElementById('play-container');
    const openingsContainer = document.getElementById('openings-container');
    const endgamesContainer = document.getElementById('endgames-container');
    const tacticalContainer = document.getElementById('tactical-container');

    landingPage?.classList.add('hidden');
    playContainer?.classList.add('hidden');
    openingsContainer?.classList.add('hidden');
    endgamesContainer?.classList.add('hidden');
    tacticalContainer?.classList.remove('hidden');

    // Show puzzle selection, hide puzzle game
    const puzzleSelection = document.getElementById('tactical-puzzle-selection');
    const puzzleGame = document.getElementById('tactical-puzzle-game');
    if (puzzleSelection) puzzleSelection.classList.remove('hidden');
    if (puzzleGame) puzzleGame.classList.add('hidden');

    // Initialize tactical puzzle selector if not already done
    if (!this.tacticalPuzzleSelector) {
      const container = document.getElementById('tactical-puzzle-selector-container');
      if (container) {
        this.tacticalPuzzleSelector = new TacticalPuzzleSelector(container, (puzzle) => {
          this.startTacticalPuzzle(puzzle);
        });
      }
    }
  }

  private startTacticalPuzzle(puzzle: TacticalPuzzle): void {
    // Find the index of the current puzzle
    this.currentTacticalPuzzleIndex = TACTICAL_PUZZLES.findIndex(p => p.id === puzzle.id);

    // Hide puzzle selection, show puzzle game
    const puzzleSelection = document.getElementById('tactical-puzzle-selection');
    const puzzleGame = document.getElementById('tactical-puzzle-game');
    if (puzzleSelection) puzzleSelection.classList.add('hidden');
    if (puzzleGame) puzzleGame.classList.remove('hidden');

    // Setup back to puzzles button
    const backToPuzzlesBtn = document.getElementById('tactical-back-to-puzzles');
    if (backToPuzzlesBtn) {
      // Remove old listeners
      const newBtn = backToPuzzlesBtn.cloneNode(true) as HTMLElement;
      backToPuzzlesBtn.parentNode?.replaceChild(newBtn, backToPuzzlesBtn);

      newBtn.addEventListener('click', () => {
        this.showTacticalMode();
      });
    }

    // Create puzzle mode (reusing PuzzleMode but with tactical puzzle data)
    const puzzleCanvas = document.getElementById('tactical-puzzle-board') as HTMLCanvasElement;
    if (puzzleCanvas) {
      // Convert TacticalPuzzle to EndgamePuzzle format for PuzzleMode
      const endgamePuzzle: EndgamePuzzle = {
        id: puzzle.id,
        category: 'basic-checkmates', // Not used for tactical puzzles
        title: puzzle.title,
        description: puzzle.description,
        fen: puzzle.fen,
        playerSide: puzzle.playerSide,
        objective: puzzle.objective,
        objectiveDescription: puzzle.objectiveDescription,
        difficulty: puzzle.difficulty,
        solution: puzzle.solution,
        hints: puzzle.hints,
        educational: puzzle.educational,
        tags: puzzle.tags
      };

      new PuzzleMode(
        puzzleCanvas,
        endgamePuzzle,
        () => {
          this.showTacticalMode();
        },
        () => {
          this.loadNextTacticalPuzzle();
        },
        'tactical' // Pass a prefix for element IDs
      );
    }
  }

  private loadNextTacticalPuzzle(): void {
    // Get the next puzzle (wrap around to the beginning if at the end)
    const nextIndex = (this.currentTacticalPuzzleIndex + 1) % TACTICAL_PUZZLES.length;
    const nextPuzzle = TACTICAL_PUZZLES[nextIndex];
    this.startTacticalPuzzle(nextPuzzle);
  }
}

// Initialize the app manager
new AppManager();

// Global resize handler for responsive canvas boards
let resizeTimeout: number | null = null;

window.addEventListener('resize', () => {
  // Debounce resize events
  if (resizeTimeout !== null) {
    clearTimeout(resizeTimeout);
  }

  resizeTimeout = window.setTimeout(() => {
    // Resize all visible canvas boards
    const canvases = [
      document.getElementById('chess-board') as HTMLCanvasElement,
      document.getElementById('opening-board') as HTMLCanvasElement,
      document.getElementById('puzzle-board') as HTMLCanvasElement,
      document.getElementById('tactical-puzzle-board') as HTMLCanvasElement
    ];

    canvases.forEach(canvas => {
      if (canvas && canvas.offsetParent !== null) { // Check if canvas is visible
        // Trigger a custom resize event that the renderer can listen to
        const event = new CustomEvent('canvasResize');
        canvas.dispatchEvent(event);
      }
    });
  }, 250);
});
