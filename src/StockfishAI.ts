export class StockfishAI {
  private worker: Worker | null = null;
  private ready: boolean = false;
  private pendingCallback: ((move: string) => void) | null = null;
  private skillLevel: number = 10; // 0-20, where 20 is strongest

  constructor() {
    this.initializeEngine();
  }

  private async initializeEngine(): Promise<void> {
    try {
      // Use local worker file to avoid CORS issues
      // Use base URL from Vite config to work with GitHub Pages subdirectory
      const base = import.meta.env.BASE_URL || '/';
      const workerPath = `${base}stockfish-worker.js`;
      this.worker = new Worker(workerPath);

      this.worker.onmessage = (event) => {
        const message = event.data;

        if (message === 'uciok') {
          this.ready = true;
          console.log('Stockfish engine ready');
        } else if (message.startsWith('bestmove')) {
          const parts = message.split(' ');
          const move = parts[1];
          if (this.pendingCallback) {
            this.pendingCallback(move);
            this.pendingCallback = null;
          }
        } else if (message.startsWith('error:')) {
          console.error('Stockfish error:', message);
        }
      };

      this.worker.onerror = (error) => {
        console.error('Stockfish worker error:', error);
      };

      // Initialize UCI protocol
      this.send('uci');

      // Wait for ready signal with timeout
      await this.waitForReady();

      // Set initial skill level
      this.setSkillLevel(this.skillLevel);

    } catch (error) {
      console.error('Failed to initialize Stockfish:', error);
      throw error;
    }
  }

  private waitForReady(): Promise<void> {
    return new Promise((resolve) => {
      const checkReady = () => {
        if (this.ready) {
          resolve();
        } else {
          setTimeout(checkReady, 100);
        }
      };
      checkReady();
    });
  }

  private send(command: string): void {
    if (this.worker) {
      this.worker.postMessage(command);
    }
  }

  public setSkillLevel(level: number): void {
    this.skillLevel = Math.max(0, Math.min(20, level));

    // Configure Stockfish skill level
    this.send('setoption name Skill Level value ' + this.skillLevel);

    // For lower skill levels, also limit depth and add randomness
    if (this.skillLevel < 20) {
      this.send('setoption name Skill Level Maximum Error value ' + (320 - this.skillLevel * 10));
      this.send('setoption name Skill Level Probability value ' + (10 + this.skillLevel * 2));
    }
  }

  public setDepth(depth: number): void {
    this.searchDepth = depth;
  }

  private searchDepth: number = 15; // Default search depth

  public async getBestMove(fen: string, moveHistory: string[] = []): Promise<string> {
    if (!this.ready || !this.worker) {
      throw new Error('Stockfish engine not ready');
    }

    return new Promise((resolve) => {
      this.pendingCallback = resolve;

      // Start a new game
      this.send('ucinewgame');
      this.send('isready');

      // Set position
      if (moveHistory.length > 0) {
        const moves = moveHistory.join(' ');
        this.send(`position startpos moves ${moves}`);
      } else {
        this.send(`position fen ${fen}`);
      }

      // Request best move with depth limit
      if (this.skillLevel < 10) {
        // For lower skill levels, use shorter search time
        const timeMs = 100 + this.skillLevel * 50;
        this.send(`go movetime ${timeMs}`);
      } else {
        // For higher skill levels, use depth-based search
        this.send(`go depth ${this.searchDepth}`);
      }
    });
  }

  /**
   * Convert UCI move format (e.g., "e2e4") to position objects
   */
  public static parseUCIMove(uciMove: string): { from: { row: number; col: number }; to: { row: number; col: number } } {
    const fromCol = uciMove.charCodeAt(0) - 97; // 'a' = 0
    const fromRow = 8 - parseInt(uciMove[1]);
    const toCol = uciMove.charCodeAt(2) - 97;
    const toRow = 8 - parseInt(uciMove[3]);

    return {
      from: { row: fromRow, col: fromCol },
      to: { row: toRow, col: toCol }
    };
  }

  /**
   * Convert position objects to UCI move format
   */
  public static toUCIMove(from: { row: number; col: number }, to: { row: number; col: number }): string {
    const fromFile = String.fromCharCode(97 + from.col);
    const fromRank = 8 - from.row;
    const toFile = String.fromCharCode(97 + to.col);
    const toRank = 8 - to.row;
    return `${fromFile}${fromRank}${toFile}${toRank}`;
  }

  public destroy(): void {
    if (this.worker) {
      this.send('quit');
      this.worker.terminate();
      this.worker = null;
    }
  }
}
