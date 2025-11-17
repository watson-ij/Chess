import type { Board, Piece, Position } from './types';

export class ChessBoardRenderer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private squareSize: number = 80; // Default, will be updated by resize()
  private selectedSquare: Position | null = null;
  private highlightedSquares: Position[] = [];
  private currentBoard: Board | null = null;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;

    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) throw new Error('Could not get canvas context');

    // Enable anti-aliasing and smoothing for high-quality rendering
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    this.ctx = ctx;

    // Initialize canvas size
    this.resize();

    // Listen for custom resize events
    this.canvas.addEventListener('canvasResize', () => {
      this.resize();
      if (this.currentBoard) {
        this.render(this.currentBoard);
      }
    });
  }

  public render(board: Board): void {
    this.currentBoard = board;
    this.drawBoard();
    this.drawHighlights();
    this.drawPieces(board);
  }

  private drawBoard(): void {
    const lightColor = '#f0d9b5';
    const darkColor = '#b58863';

    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const isLight = (row + col) % 2 === 0;
        this.ctx.fillStyle = isLight ? lightColor : darkColor;
        this.ctx.fillRect(
          col * this.squareSize,
          row * this.squareSize,
          this.squareSize,
          this.squareSize
        );
      }
    }

    // Draw coordinates
    this.ctx.font = '12px sans-serif';
    this.ctx.fillStyle = '#000';

    // Column labels (a-h)
    for (let col = 0; col < 8; col++) {
      const isLight = col % 2 === 0;
      this.ctx.fillStyle = isLight ? darkColor : lightColor;
      const letter = String.fromCharCode(97 + col);
      this.ctx.fillText(
        letter,
        col * this.squareSize + this.squareSize - 15,
        7 * this.squareSize + this.squareSize - 5
      );
    }

    // Row labels (1-8)
    for (let row = 0; row < 8; row++) {
      const isLight = row % 2 === 0;
      this.ctx.fillStyle = isLight ? lightColor : darkColor;
      this.ctx.fillText(
        String(8 - row),
        5,
        row * this.squareSize + 15
      );
    }
  }

  private drawHighlights(): void {
    // Highlight selected square
    if (this.selectedSquare) {
      this.ctx.fillStyle = 'rgba(255, 255, 0, 0.4)';
      this.ctx.fillRect(
        this.selectedSquare.col * this.squareSize,
        this.selectedSquare.row * this.squareSize,
        this.squareSize,
        this.squareSize
      );
    }

    // Highlight legal move squares
    this.ctx.fillStyle = 'rgba(0, 255, 0, 0.3)';
    for (const square of this.highlightedSquares) {
      this.ctx.beginPath();
      this.ctx.arc(
        square.col * this.squareSize + this.squareSize / 2,
        square.row * this.squareSize + this.squareSize / 2,
        this.squareSize / 6,
        0,
        Math.PI * 2
      );
      this.ctx.fill();
    }
  }

  private drawPieces(board: Board): void {
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const piece = board[row][col];
        if (piece) {
          this.drawPiece(piece, { row, col });
        }
      }
    }
  }

  private drawPiece(piece: Piece, pos: Position): void {
    const x = pos.col * this.squareSize + this.squareSize / 2;
    const y = pos.row * this.squareSize + this.squareSize / 2;
    const size = this.squareSize * 0.4;

    this.ctx.save();
    this.ctx.translate(x, y);

    // Create gradients and colors based on piece color
    const isWhite = piece.color === 'white';

    switch (piece.type) {
      case 'king':
        this.drawKing(size, isWhite);
        break;
      case 'queen':
        this.drawQueen(size, isWhite);
        break;
      case 'rook':
        this.drawRook(size, isWhite);
        break;
      case 'bishop':
        this.drawBishop(size, isWhite);
        break;
      case 'knight':
        this.drawKnight(size, isWhite);
        break;
      case 'pawn':
        this.drawPawn(size, isWhite);
        break;
    }

    this.ctx.restore();
  }

  private createGradient(size: number, isWhite: boolean): CanvasGradient {
    const gradient = this.ctx.createLinearGradient(-size, -size, size, size);
    if (isWhite) {
      gradient.addColorStop(0, '#ffffff');
      gradient.addColorStop(1, '#c9b899');
    } else {
      gradient.addColorStop(0, '#4a4a4a');
      gradient.addColorStop(1, '#1a1a1a');
    }
    return gradient;
  }

  private getOutlineColor(isWhite: boolean): string {
    return isWhite ? '#323232' : '#666666';
  }

  private drawKing(size: number, isWhite: boolean): void {
    const gradient = this.createGradient(size, isWhite);
    const outlineColor = this.getOutlineColor(isWhite);

    this.ctx.lineWidth = 2;
    this.ctx.lineCap = 'round';
    this.ctx.lineJoin = 'round';

    // Base pedestal
    this.ctx.fillStyle = gradient;
    this.ctx.strokeStyle = outlineColor;
    this.ctx.beginPath();
    this.ctx.ellipse(0, size * 0.5, size * 0.55, size * 0.15, 0, 0, Math.PI * 2);
    this.ctx.fill();
    this.ctx.stroke();

    // Lower body
    this.ctx.beginPath();
    this.ctx.moveTo(-size * 0.4, size * 0.5);
    this.ctx.lineTo(-size * 0.35, size * 0.1);
    this.ctx.quadraticCurveTo(-size * 0.35, -size * 0.05, -size * 0.3, -size * 0.15);
    this.ctx.lineTo(size * 0.3, -size * 0.15);
    this.ctx.quadraticCurveTo(size * 0.35, -size * 0.05, size * 0.35, size * 0.1);
    this.ctx.lineTo(size * 0.4, size * 0.5);
    this.ctx.closePath();
    this.ctx.fill();
    this.ctx.stroke();

    // Crown with five points
    this.ctx.beginPath();
    this.ctx.moveTo(-size * 0.5, -size * 0.15);
    this.ctx.lineTo(-size * 0.4, -size * 0.45);
    this.ctx.lineTo(-size * 0.25, -size * 0.25);
    this.ctx.lineTo(-size * 0.1, -size * 0.5);
    this.ctx.lineTo(0, -size * 0.3);
    this.ctx.lineTo(size * 0.1, -size * 0.5);
    this.ctx.lineTo(size * 0.25, -size * 0.25);
    this.ctx.lineTo(size * 0.4, -size * 0.45);
    this.ctx.lineTo(size * 0.5, -size * 0.15);
    this.ctx.closePath();
    this.ctx.fill();
    this.ctx.stroke();

    // Cross on top
    this.ctx.lineWidth = 2.5;
    this.ctx.beginPath();
    this.ctx.moveTo(0, -size * 0.7);
    this.ctx.lineTo(0, -size * 0.5);
    this.ctx.moveTo(-size * 0.12, -size * 0.6);
    this.ctx.lineTo(size * 0.12, -size * 0.6);
    this.ctx.stroke();

    // Small circle at cross center
    this.ctx.fillStyle = gradient;
    this.ctx.beginPath();
    this.ctx.arc(0, -size * 0.6, size * 0.06, 0, Math.PI * 2);
    this.ctx.fill();
    this.ctx.stroke();
  }

  private drawQueen(size: number, isWhite: boolean): void {
    const gradient = this.createGradient(size, isWhite);
    const outlineColor = this.getOutlineColor(isWhite);

    this.ctx.lineWidth = 2;
    this.ctx.lineCap = 'round';
    this.ctx.lineJoin = 'round';

    // Base pedestal
    this.ctx.fillStyle = gradient;
    this.ctx.strokeStyle = outlineColor;
    this.ctx.beginPath();
    this.ctx.ellipse(0, size * 0.5, size * 0.6, size * 0.15, 0, 0, Math.PI * 2);
    this.ctx.fill();
    this.ctx.stroke();

    // Body with elegant curves
    this.ctx.beginPath();
    this.ctx.moveTo(-size * 0.45, size * 0.5);
    this.ctx.lineTo(-size * 0.4, size * 0.1);
    this.ctx.quadraticCurveTo(-size * 0.4, -size * 0.1, -size * 0.35, -size * 0.2);
    this.ctx.lineTo(size * 0.35, -size * 0.2);
    this.ctx.quadraticCurveTo(size * 0.4, -size * 0.1, size * 0.4, size * 0.1);
    this.ctx.lineTo(size * 0.45, size * 0.5);
    this.ctx.closePath();
    this.ctx.fill();
    this.ctx.stroke();

    // Crown with sophisticated pointed design
    this.ctx.beginPath();
    this.ctx.moveTo(-size * 0.55, -size * 0.2);
    this.ctx.lineTo(-size * 0.45, -size * 0.55);
    this.ctx.quadraticCurveTo(-size * 0.4, -size * 0.6, -size * 0.35, -size * 0.55);
    this.ctx.lineTo(-size * 0.25, -size * 0.3);
    this.ctx.lineTo(-size * 0.15, -size * 0.65);
    this.ctx.quadraticCurveTo(-size * 0.1, -size * 0.7, -size * 0.05, -size * 0.65);
    this.ctx.lineTo(0, -size * 0.35);
    this.ctx.lineTo(size * 0.05, -size * 0.65);
    this.ctx.quadraticCurveTo(size * 0.1, -size * 0.7, size * 0.15, -size * 0.65);
    this.ctx.lineTo(size * 0.25, -size * 0.3);
    this.ctx.lineTo(size * 0.35, -size * 0.55);
    this.ctx.quadraticCurveTo(size * 0.4, -size * 0.6, size * 0.45, -size * 0.55);
    this.ctx.lineTo(size * 0.55, -size * 0.2);
    this.ctx.closePath();
    this.ctx.fill();
    this.ctx.stroke();

    // Decorative orbs on crown points
    const orbPositions = [
      { x: -size * 0.45, y: -size * 0.6 },
      { x: -size * 0.15, y: -size * 0.72 },
      { x: 0, y: -size * 0.35 },
      { x: size * 0.15, y: -size * 0.72 },
      { x: size * 0.45, y: -size * 0.6 }
    ];

    orbPositions.forEach(pos => {
      this.ctx.beginPath();
      this.ctx.arc(pos.x, pos.y, size * 0.08, 0, Math.PI * 2);
      this.ctx.fill();
      this.ctx.stroke();
    });
  }

  private drawRook(size: number, isWhite: boolean): void {
    const gradient = this.createGradient(size, isWhite);
    const outlineColor = this.getOutlineColor(isWhite);

    this.ctx.lineWidth = 2;
    this.ctx.lineCap = 'round';
    this.ctx.lineJoin = 'round';

    // Base pedestal
    this.ctx.fillStyle = gradient;
    this.ctx.strokeStyle = outlineColor;
    this.ctx.beginPath();
    this.ctx.ellipse(0, size * 0.5, size * 0.55, size * 0.15, 0, 0, Math.PI * 2);
    this.ctx.fill();
    this.ctx.stroke();

    // Tower body with slight taper
    this.ctx.beginPath();
    this.ctx.moveTo(-size * 0.4, size * 0.5);
    this.ctx.lineTo(-size * 0.35, -size * 0.15);
    this.ctx.lineTo(-size * 0.45, -size * 0.3);
    this.ctx.lineTo(size * 0.45, -size * 0.3);
    this.ctx.lineTo(size * 0.35, -size * 0.15);
    this.ctx.lineTo(size * 0.4, size * 0.5);
    this.ctx.closePath();
    this.ctx.fill();
    this.ctx.stroke();

    // Battlements (crenellations) - three towers
    const battlement = (x: number) => {
      this.ctx.beginPath();
      this.ctx.rect(x - size * 0.12, -size * 0.65, size * 0.24, size * 0.35);
      this.ctx.fill();
      this.ctx.stroke();
    };

    battlement(-size * 0.35);  // Left tower
    battlement(0);              // Center tower
    battlement(size * 0.35);    // Right tower

    // Top rim
    this.ctx.beginPath();
    this.ctx.rect(-size * 0.5, -size * 0.35, size, size * 0.08);
    this.ctx.fill();
    this.ctx.stroke();
  }

  private drawBishop(size: number, isWhite: boolean): void {
    const gradient = this.createGradient(size, isWhite);
    const outlineColor = this.getOutlineColor(isWhite);

    this.ctx.lineWidth = 2;
    this.ctx.lineCap = 'round';
    this.ctx.lineJoin = 'round';

    // Base pedestal
    this.ctx.fillStyle = gradient;
    this.ctx.strokeStyle = outlineColor;
    this.ctx.beginPath();
    this.ctx.ellipse(0, size * 0.5, size * 0.5, size * 0.15, 0, 0, Math.PI * 2);
    this.ctx.fill();
    this.ctx.stroke();

    // Lower body - bulbous base
    this.ctx.beginPath();
    this.ctx.moveTo(-size * 0.35, size * 0.5);
    this.ctx.quadraticCurveTo(-size * 0.4, size * 0.2, -size * 0.35, 0);
    this.ctx.lineTo(-size * 0.3, -size * 0.05);
    this.ctx.quadraticCurveTo(-size * 0.3, -size * 0.15, -size * 0.25, -size * 0.2);
    this.ctx.lineTo(size * 0.25, -size * 0.2);
    this.ctx.quadraticCurveTo(size * 0.3, -size * 0.15, size * 0.3, -size * 0.05);
    this.ctx.lineTo(size * 0.35, 0);
    this.ctx.quadraticCurveTo(size * 0.4, size * 0.2, size * 0.35, size * 0.5);
    this.ctx.closePath();
    this.ctx.fill();
    this.ctx.stroke();

    // Mitre (bishop's hat) - elegant pointed shape
    this.ctx.beginPath();
    this.ctx.moveTo(-size * 0.35, -size * 0.2);
    this.ctx.quadraticCurveTo(-size * 0.3, -size * 0.35, -size * 0.2, -size * 0.5);
    this.ctx.quadraticCurveTo(-size * 0.1, -size * 0.65, 0, -size * 0.7);
    this.ctx.quadraticCurveTo(size * 0.1, -size * 0.65, size * 0.2, -size * 0.5);
    this.ctx.quadraticCurveTo(size * 0.3, -size * 0.35, size * 0.35, -size * 0.2);
    this.ctx.closePath();
    this.ctx.fill();
    this.ctx.stroke();

    // Decorative slit in mitre
    this.ctx.strokeStyle = outlineColor;
    this.ctx.lineWidth = 1.5;
    this.ctx.beginPath();
    this.ctx.moveTo(-size * 0.15, -size * 0.35);
    this.ctx.quadraticCurveTo(0, -size * 0.5, size * 0.15, -size * 0.35);
    this.ctx.stroke();

    // Ball on top
    this.ctx.fillStyle = gradient;
    this.ctx.strokeStyle = outlineColor;
    this.ctx.lineWidth = 2;
    this.ctx.beginPath();
    this.ctx.arc(0, -size * 0.75, size * 0.12, 0, Math.PI * 2);
    this.ctx.fill();
    this.ctx.stroke();

    // Small cross on ball
    this.ctx.lineWidth = 1.5;
    this.ctx.beginPath();
    this.ctx.moveTo(0, -size * 0.83);
    this.ctx.lineTo(0, -size * 0.67);
    this.ctx.moveTo(-size * 0.08, -size * 0.75);
    this.ctx.lineTo(size * 0.08, -size * 0.75);
    this.ctx.stroke();
  }

  private drawKnight(size: number, isWhite: boolean): void {
    const gradient = this.createGradient(size, isWhite);
    const outlineColor = this.getOutlineColor(isWhite);

    this.ctx.lineWidth = 2;
    this.ctx.lineCap = 'round';
    this.ctx.lineJoin = 'round';

    // Base pedestal
    this.ctx.fillStyle = gradient;
    this.ctx.strokeStyle = outlineColor;
    this.ctx.beginPath();
    this.ctx.ellipse(0, size * 0.5, size * 0.5, size * 0.15, 0, 0, Math.PI * 2);
    this.ctx.fill();
    this.ctx.stroke();

    // Neck base
    this.ctx.beginPath();
    this.ctx.moveTo(-size * 0.35, size * 0.5);
    this.ctx.lineTo(-size * 0.3, size * 0.1);
    this.ctx.lineTo(size * 0.2, size * 0.1);
    this.ctx.lineTo(size * 0.25, size * 0.5);
    this.ctx.closePath();
    this.ctx.fill();
    this.ctx.stroke();

    // Horse head - abstract elegant silhouette
    this.ctx.beginPath();
    // Start at neck
    this.ctx.moveTo(-size * 0.3, size * 0.1);
    // Back of neck with curve
    this.ctx.quadraticCurveTo(-size * 0.4, -size * 0.05, -size * 0.35, -size * 0.3);
    // Top of head/poll
    this.ctx.quadraticCurveTo(-size * 0.25, -size * 0.5, -size * 0.05, -size * 0.65);
    // Ear
    this.ctx.quadraticCurveTo(0, -size * 0.72, size * 0.05, -size * 0.65);
    // Forehead
    this.ctx.quadraticCurveTo(size * 0.15, -size * 0.55, size * 0.25, -size * 0.45);
    // Front of face/nose
    this.ctx.quadraticCurveTo(size * 0.4, -size * 0.35, size * 0.48, -size * 0.15);
    // Muzzle
    this.ctx.quadraticCurveTo(size * 0.5, -size * 0.05, size * 0.45, 0.05);
    // Jaw
    this.ctx.quadraticCurveTo(size * 0.35, size * 0.1, size * 0.2, size * 0.1);
    this.ctx.closePath();
    this.ctx.fill();
    this.ctx.stroke();
  }

  private drawPawn(size: number, isWhite: boolean): void {
    const gradient = this.createGradient(size, isWhite);
    const outlineColor = this.getOutlineColor(isWhite);

    this.ctx.lineWidth = 2;
    this.ctx.lineCap = 'round';
    this.ctx.lineJoin = 'round';

    // Base pedestal
    this.ctx.fillStyle = gradient;
    this.ctx.strokeStyle = outlineColor;
    this.ctx.beginPath();
    this.ctx.ellipse(0, size * 0.5, size * 0.45, size * 0.12, 0, 0, Math.PI * 2);
    this.ctx.fill();
    this.ctx.stroke();

    // Lower body - tapered column
    this.ctx.beginPath();
    this.ctx.moveTo(-size * 0.3, size * 0.5);
    this.ctx.lineTo(-size * 0.25, size * 0.1);
    this.ctx.quadraticCurveTo(-size * 0.25, -size * 0.05, -size * 0.2, -size * 0.1);
    this.ctx.lineTo(size * 0.2, -size * 0.1);
    this.ctx.quadraticCurveTo(size * 0.25, -size * 0.05, size * 0.25, size * 0.1);
    this.ctx.lineTo(size * 0.3, size * 0.5);
    this.ctx.closePath();
    this.ctx.fill();
    this.ctx.stroke();

    // Neck collar
    this.ctx.beginPath();
    this.ctx.ellipse(0, -size * 0.15, size * 0.25, size * 0.08, 0, 0, Math.PI * 2);
    this.ctx.fill();
    this.ctx.stroke();

    // Head - rounded ball
    this.ctx.beginPath();
    this.ctx.arc(0, -size * 0.4, size * 0.25, 0, Math.PI * 2);
    this.ctx.fill();
    this.ctx.stroke();

    // Top finial (small decorative ball)
    this.ctx.beginPath();
    this.ctx.arc(0, -size * 0.68, size * 0.08, 0, Math.PI * 2);
    this.ctx.fill();
    this.ctx.stroke();
  }

  public setSelectedSquare(square: Position | null): void {
    this.selectedSquare = square;
  }

  public setHighlightedSquares(squares: Position[]): void {
    this.highlightedSquares = squares;
  }

  public getSquareFromClick(x: number, y: number): Position {
    return {
      row: Math.floor(y / this.squareSize),
      col: Math.floor(x / this.squareSize)
    };
  }

  public getCanvas(): HTMLCanvasElement {
    return this.canvas;
  }

  public clearHighlights(): void {
    this.selectedSquare = null;
    this.highlightedSquares = [];
  }

  public setHighlights(selected: Position, legalMoves: Position[]): void {
    this.selectedSquare = selected;
    this.highlightedSquares = legalMoves;
  }

  /**
   * Resize the canvas based on its container size
   * This should be called when the window is resized or when the canvas is first created
   */
  public resize(): void {
    // Get the container size
    const container = this.canvas.parentElement;
    if (!container) {
      // Fallback to default size if no container
      this.resizeToSize(640);
      return;
    }

    // Calculate the maximum size the canvas can be
    const containerWidth = container.clientWidth;
    const maxSize = Math.min(containerWidth, 640); // Cap at 640px for large screens

    this.resizeToSize(maxSize);
  }

  /**
   * Resize the canvas to a specific size
   */
  private resizeToSize(size: number): void {
    const dpr = window.devicePixelRatio || 1;

    // Set the canvas CSS size
    this.canvas.style.width = size + 'px';
    this.canvas.style.height = size + 'px';

    // Set the canvas backing store size (scaled by DPR for high-DPI displays)
    this.canvas.width = size * dpr;
    this.canvas.height = size * dpr;

    // Scale the context to match the device pixel ratio
    this.ctx.scale(dpr, dpr);

    // Re-enable smoothing after scaling
    this.ctx.imageSmoothingEnabled = true;
    this.ctx.imageSmoothingQuality = 'high';

    // Update square size
    this.squareSize = size / 8;
  }
}
