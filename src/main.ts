import './style.css';
import { ChessEngine } from './ChessEngine';
import { ChessBoardRenderer } from './ChessBoardRenderer';
import { StockfishAI } from './StockfishAI';
import { OpeningApp } from './OpeningApp';
import type { Position, PieceColor } from './types';

class ChessApp {
  private engine: ChessEngine;
  private renderer: ChessBoardRenderer;
  private selectedSquare: Position | null = null;
  private canvas: HTMLCanvasElement;
  private ai: StockfishAI | null = null;
  private isAIMode: boolean = false;
  private playerColor: PieceColor = 'white';
  private isAIThinking: boolean = false;
  private moveHistoryUCI: string[] = []; // UCI move history for Stockfish

  constructor() {
    this.engine = new ChessEngine();

    const canvas = document.getElementById('chess-board') as HTMLCanvasElement;
    if (!canvas) throw new Error('Canvas not found');

    this.canvas = canvas;
    // Renderer will be initialized when game starts (when canvas is visible)
    this.renderer = null as any;

    this.setupSetupPanelListeners();
  }

  private setupSetupPanelListeners(): void {
    // Game mode selection
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
      startButton.addEventListener('click', () => this.startGame());
    }

    // Reset game button
    const resetButton = document.getElementById('reset-game');
    if (resetButton) {
      resetButton.addEventListener('click', () => this.resetGame());
    }
  }

  private setupEventListeners(): void {
    this.canvas.addEventListener('click', (e) => this.handleClick(e));
  }

  private async startGame(): Promise<void> {
    try {
      // Get game mode
      const gameModeRadio = document.querySelector<HTMLInputElement>('input[name="game-mode"]:checked');
      this.isAIMode = gameModeRadio?.value === 'ai';

      if (this.isAIMode) {
        // Get AI settings
        const playerColorSelect = document.getElementById('player-color') as HTMLSelectElement;
        this.playerColor = playerColorSelect?.value as PieceColor || 'white';

        const aiDifficultySelect = document.getElementById('ai-difficulty') as HTMLSelectElement;
        const difficulty = parseInt(aiDifficultySelect?.value || '20');

        // Initialize AI
        this.ai = new StockfishAI();
        this.ai.setSkillLevel(difficulty);
      }

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
            // Build UCI move history from PGN
            this.buildUCIHistoryFromMoves();
          } catch (error) {
            alert('Error loading PGN. Please check and try again.');
            return;
          }
        }
      }

      // Show game, hide setup
      const setupPanel = document.getElementById('setup-panel');
      const gameContainer = document.getElementById('game-container');
      const resetButton = document.getElementById('reset-game');

      if (setupPanel) setupPanel.style.display = 'none';
      if (gameContainer) gameContainer.style.display = 'flex';
      if (resetButton) resetButton.style.display = 'inline-block';

      // Now that canvas is visible, initialize the renderer
      if (!this.renderer) {
        this.renderer = new ChessBoardRenderer(this.canvas);
      }

      // Setup game event listeners
      this.setupEventListeners();
      this.render();
      this.updateUI();

      // If AI plays first (player is black), make AI move
      if (this.isAIMode && this.playerColor === 'black' && !this.engine.isGameOver()) {
        await this.makeAIMove();
      }
    } catch (error) {
      console.error('Error starting game:', error);
      alert('Error starting game. Please try again.');
    }
  }

  private buildUCIHistoryFromMoves(): void {
    // This builds the UCI move history from the current move history
    // For simplicity, we'll track UCI moves as we make moves during gameplay
    // For loaded PGN, we won't have perfect UCI history, but Stockfish can work with FEN
    this.moveHistoryUCI = [];
  }

  private resetGame(): void {
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

    // Show setup, hide game
    const setupPanel = document.getElementById('setup-panel');
    const gameContainer = document.getElementById('game-container');
    const resetButton = document.getElementById('reset-game');

    if (setupPanel) setupPanel.style.display = 'block';
    if (gameContainer) gameContainer.style.display = 'none';
    if (resetButton) resetButton.style.display = 'none';

    // Reset inputs
    const fenInput = document.getElementById('fen-input') as HTMLInputElement;
    const pgnInput = document.getElementById('pgn-input') as HTMLTextAreaElement;
    if (fenInput) fenInput.value = '';
    if (pgnInput) pgnInput.value = '';

    // Initialize new game engine
    this.engine = new ChessEngine();
  }

  private async handleClick(event: MouseEvent): Promise<void> {
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
        const uciMove = StockfishAI.toUCIMove(this.selectedSquare, clickedSquare);
        this.moveHistoryUCI.push(uciMove);

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

class AppManager {
  private chessApp: ChessApp | null = null;
  private openingApp: OpeningApp | null = null;

  constructor() {
    this.setupNavigationButtons();
    this.showLandingPage();
  }

  private setupNavigationButtons(): void {
    // Mode selection buttons on landing page
    const selectPlayBtn = document.getElementById('select-play');
    const selectOpeningsBtn = document.getElementById('select-openings');

    selectPlayBtn?.addEventListener('click', () => this.showPlayMode());
    selectOpeningsBtn?.addEventListener('click', () => this.showOpeningsMode());

    // Back buttons
    const backFromPlayBtn = document.getElementById('back-from-play');
    const backFromOpeningsBtn = document.getElementById('back-from-openings');

    backFromPlayBtn?.addEventListener('click', () => this.showLandingPage());
    backFromOpeningsBtn?.addEventListener('click', () => this.showLandingPage());
  }

  private showLandingPage(): void {
    const landingPage = document.getElementById('landing-page');
    const playContainer = document.getElementById('play-container');
    const openingsContainer = document.getElementById('openings-container');

    landingPage?.classList.remove('hidden');
    playContainer?.classList.add('hidden');
    openingsContainer?.classList.add('hidden');
  }

  private showPlayMode(): void {
    const landingPage = document.getElementById('landing-page');
    const playContainer = document.getElementById('play-container');
    const openingsContainer = document.getElementById('openings-container');

    landingPage?.classList.add('hidden');
    playContainer?.classList.remove('hidden');
    openingsContainer?.classList.add('hidden');

    // Initialize chess app if not already done
    if (!this.chessApp) {
      this.chessApp = new ChessApp();
    }
  }

  private showOpeningsMode(): void {
    const landingPage = document.getElementById('landing-page');
    const playContainer = document.getElementById('play-container');
    const openingsContainer = document.getElementById('openings-container');

    landingPage?.classList.add('hidden');
    playContainer?.classList.add('hidden');
    openingsContainer?.classList.remove('hidden');

    // Initialize opening app if not already done
    if (!this.openingApp) {
      const canvas = document.getElementById('opening-board') as HTMLCanvasElement;
      if (canvas) {
        this.openingApp = new OpeningApp(canvas);
      }
    }
  }
}

// Initialize the app manager
new AppManager();
