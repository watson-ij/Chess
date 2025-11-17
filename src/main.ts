import './style.css';
import { ChessEngine } from './ChessEngine';
import { ChessBoardRenderer } from './ChessBoardRenderer';
import { StockfishAI } from './StockfishAI';
import { OpeningApp } from './OpeningApp';
import { PuzzleMode } from './PuzzleMode';
import { PuzzleSelector } from './PuzzleSelector';
import type { Position, PieceColor } from './types';
import type { EndgamePuzzle } from './EndgameTypes';
import { TIMING, GAME_STATUS_COLORS } from './constants';
import { Logger } from './Logger';

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
      const gameMode = this.getSelectedGameMode();
      const positionMode = this.getSelectedPositionMode();

      // Setup position based on user selection
      if (!this.loadGamePosition(positionMode)) {
        return; // Invalid position, error already shown to user
      }

      // Start game based on mode (AI or PvP)
      if (gameMode === 'ai') {
        await this.startAIGame();
      } else {
        this.startChessGame(false);
      }
    } catch (error) {
      Logger.error('Error starting game', error);
      alert('Error starting game. Please try again.');
    }
  }

  /**
   * Get the selected game mode (AI or PvP)
   */
  private getSelectedGameMode(): string {
    const gameModeRadio = document.querySelector<HTMLInputElement>('input[name="game-mode"]:checked');
    return gameModeRadio?.value || 'pvp';
  }

  /**
   * Get the selected position mode (standard, FEN, or PGN)
   */
  private getSelectedPositionMode(): string {
    const positionModeRadio = document.querySelector<HTMLInputElement>('input[name="position-mode"]:checked');
    return positionModeRadio?.value || 'standard';
  }

  /**
   * Load game position based on selected mode
   * @returns true if position loaded successfully, false otherwise
   */
  private loadGamePosition(positionMode: string): boolean {
    if (positionMode === 'fen') {
      return this.loadFENPosition();
    } else if (positionMode === 'pgn') {
      return this.loadPGNPosition();
    } else {
      // Standard position
      this.engine = new ChessEngine();
      return true;
    }
  }

  /**
   * Load position from FEN input
   * @returns true if loaded successfully, false otherwise
   */
  private loadFENPosition(): boolean {
    const fenInput = document.getElementById('fen-input') as HTMLInputElement;
    const fen = fenInput?.value.trim();
    if (fen) {
      try {
        this.engine.loadFEN(fen);
        return true;
      } catch (error) {
        Logger.warn('Invalid FEN string', error);
        alert('Invalid FEN string. Please check and try again.');
        return false;
      }
    }
    return true;
  }

  /**
   * Load position from PGN input
   * @returns true if loaded successfully, false otherwise
   */
  private loadPGNPosition(): boolean {
    const pgnInput = document.getElementById('pgn-input') as HTMLTextAreaElement;
    const pgn = pgnInput?.value.trim();
    if (pgn) {
      try {
        const success = this.engine.loadPGN(pgn);
        if (!success) {
          alert('Invalid PGN. Please check and try again.');
          return false;
        }
        return true;
      } catch (error) {
        Logger.warn('Error loading PGN', error);
        alert('Error loading PGN. Please check and try again.');
        return false;
      }
    }
    return true;
  }

  /**
   * Start an AI game with configured settings
   */
  private async startAIGame(): Promise<void> {
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
      await new Promise(resolve => setTimeout(resolve, TIMING.AI_MOVE_DELAY_MS));

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
      Logger.error('AI move error', error);
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
      turnIndicator.style.color = currentTurn === 'white' ? GAME_STATUS_COLORS.WHITE_TURN : GAME_STATUS_COLORS.BLACK_TURN;
    }

    // Update game status
    const gameStatus = document.getElementById('game-status');
    if (gameStatus) {
      const status = this.engine.getGameStatus();
      gameStatus.textContent = status;
      if (status.includes('Checkmate')) {
        gameStatus.style.color = GAME_STATUS_COLORS.CHECKMATE;
        gameStatus.style.fontWeight = 'bold';
      } else if (status.includes('Check')) {
        gameStatus.style.color = GAME_STATUS_COLORS.CHECK;
        gameStatus.style.fontWeight = 'bold';
      } else if (status.includes('Stalemate')) {
        gameStatus.style.color = GAME_STATUS_COLORS.STALEMATE;
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
    this.navigateToMoveIndex(-1);
  }

  /**
   * Navigate to previous move
   */
  private navigateToPrevious(): void {
    if (this.currentMoveIndex > -1) {
      this.navigateToMoveIndex(this.currentMoveIndex - 1);
    }
  }

  /**
   * Navigate to next move
   */
  private navigateToNext(): void {
    const moves = this.engine.getMoveHistory();
    if (this.currentMoveIndex < moves.length - 1) {
      this.navigateToMoveIndex(this.currentMoveIndex + 1);
    }
  }

  /**
   * Navigate to end position (current game state)
   */
  private navigateToEnd(): void {
    const moves = this.engine.getMoveHistory();
    const lastMoveIndex = moves.length - 1;
    this.navigateToMoveIndex(lastMoveIndex, false); // Not review mode, show current state
  }

  /**
   * Navigate to specific move (public for click handlers)
   */
  private navigateToMove(moveIndex: number): void {
    const moves = this.engine.getMoveHistory();
    if (moveIndex >= -1 && moveIndex < moves.length) {
      this.navigateToMoveIndex(moveIndex);
    }
  }

  /**
   * Core navigation logic - navigate to a specific move index
   * Consolidates duplicate code from all navigation methods
   * @param moveIndex - The move index to navigate to (-1 for start position)
   * @param autoDetectReviewMode - If true, automatically determine if in review mode
   */
  private navigateToMoveIndex(moveIndex: number, autoDetectReviewMode: boolean = true): void {
    const moves = this.engine.getMoveHistory();
    this.currentMoveIndex = moveIndex;

    // Determine if we're in review mode
    if (autoDetectReviewMode) {
      this.isReviewMode = moveIndex < moves.length - 1;
    } else {
      this.isReviewMode = false;
    }

    // Render board at the specified move
    if (moveIndex === moves.length - 1 && !this.isReviewMode) {
      // At the end and not in review mode, show current state
      this.render();
    } else {
      // Show board at specific move
      this.renderBoardAtMove(moveIndex);
    }

    // Update UI
    this.updateMoveHistory();
    this.updateNavigationButtons();
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
   * Update move history display
   */
  private updateMoveHistory(): void {
    const movesList = document.getElementById('moves-list');
    if (!movesList) return;

    const moves = this.engine.getMoveHistory();
    movesList.innerHTML = '';

    // Build move pairs (each pair contains move number + white move + black move)
    for (let i = 0; i < moves.length; i += 2) {
      const moveNumber = Math.floor(i / 2) + 1;
      const whiteMove = moves[i];
      const blackMove = moves[i + 1];

      const movePair = this.createMovePairElement(moveNumber, whiteMove, blackMove, i);
      movesList.appendChild(movePair);
    }

    // Update navigation buttons
    this.updateNavigationButtons();

    // Scroll to active move
    this.scrollToActiveMove(movesList);
  }

  /**
   * Create a move pair element (move number + white move + optional black move)
   * @param moveNumber - The move number (1, 2, 3, ...)
   * @param whiteMove - White's move
   * @param blackMove - Black's move (optional)
   * @param whiteIndex - Index of white's move in history
   * @returns The move pair DOM element
   */
  private createMovePairElement(
    moveNumber: number,
    whiteMove: { notation?: string },
    blackMove: { notation?: string } | undefined,
    whiteIndex: number
  ): HTMLElement {
    const movePair = document.createElement('div');
    movePair.className = 'move-pair';

    // Move number
    movePair.appendChild(this.createMoveNumberElement(moveNumber));

    // White's move
    movePair.appendChild(this.createMoveElement(whiteMove, whiteIndex, 'white'));

    // Black's move (if exists)
    if (blackMove) {
      movePair.appendChild(this.createMoveElement(blackMove, whiteIndex + 1, 'black'));
    }

    return movePair;
  }

  /**
   * Create a move number element
   */
  private createMoveNumberElement(moveNumber: number): HTMLElement {
    const numberSpan = document.createElement('span');
    numberSpan.className = 'move-number';
    numberSpan.textContent = `${moveNumber}.`;
    return numberSpan;
  }

  /**
   * Create a clickable move element
   * @param move - The move object
   * @param moveIndex - Index in move history
   * @param color - 'white' or 'black'
   * @returns The move DOM element
   */
  private createMoveElement(
    move: { notation?: string },
    moveIndex: number,
    color: 'white' | 'black'
  ): HTMLElement {
    const moveSpan = document.createElement('span');
    moveSpan.className = `move ${color}`;
    moveSpan.textContent = move.notation || '?';
    moveSpan.dataset.moveIndex = String(moveIndex);

    // Highlight if this is the current move
    if (this.currentMoveIndex === moveIndex) {
      moveSpan.classList.add('active');
    }

    // Make clickable to navigate to this move
    moveSpan.addEventListener('click', () => this.navigateToMove(moveIndex));

    return moveSpan;
  }

  /**
   * Scroll to the active move in the move list
   */
  private scrollToActiveMove(movesList: HTMLElement): void {
    if (this.currentMoveIndex >= 0) {
      const activeMove = movesList.querySelector('.move.active');
      if (activeMove) {
        activeMove.scrollIntoView({ block: 'nearest', behavior: TIMING.SCROLL_BEHAVIOR });
      }
    } else {
      // Scroll to bottom if at start position
      movesList.scrollTop = movesList.scrollHeight;
    }
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
      document.getElementById('puzzle-board') as HTMLCanvasElement
    ];

    canvases.forEach(canvas => {
      if (canvas && canvas.offsetParent !== null) { // Check if canvas is visible
        // Trigger a custom resize event that the renderer can listen to
        const event = new CustomEvent('canvasResize');
        canvas.dispatchEvent(event);
      }
    });
  }, TIMING.RESIZE_DEBOUNCE_MS);
});
