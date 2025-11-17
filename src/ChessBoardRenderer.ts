import type { Board, Piece, Position } from './types';
import {
  BOARD_CONFIG,
  BOARD_COLORS,
  HIGHLIGHT_COLORS,
  PIECE_COLORS,
  PIECE_RENDERING,
  TEXT_RENDERING,
  CANVAS_SETTINGS,
} from './constants';

export class ChessBoardRenderer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private squareSize: number = BOARD_CONFIG.DEFAULT_SQUARE_SIZE;
  private selectedSquare: Position | null = null;
  private highlightedSquares: Position[] = [];
  private currentBoard: Board | null = null;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;

    const ctx = canvas.getContext('2d', { alpha: CANVAS_SETTINGS.ALPHA });
    if (!ctx) throw new Error('Could not get canvas context');

    // Enable anti-aliasing and smoothing for high-quality rendering
    ctx.imageSmoothingEnabled = CANVAS_SETTINGS.IMAGE_SMOOTHING_ENABLED;
    ctx.imageSmoothingQuality = CANVAS_SETTINGS.IMAGE_SMOOTHING_QUALITY;

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
    for (let row = 0; row < BOARD_CONFIG.BOARD_SIZE; row++) {
      for (let col = 0; col < BOARD_CONFIG.BOARD_SIZE; col++) {
        const isLight = (row + col) % 2 === 0;
        this.ctx.fillStyle = isLight ? BOARD_COLORS.LIGHT_SQUARE : BOARD_COLORS.DARK_SQUARE;
        this.ctx.fillRect(
          col * this.squareSize,
          row * this.squareSize,
          this.squareSize,
          this.squareSize
        );
      }
    }

    // Draw coordinates
    this.ctx.font = `${TEXT_RENDERING.COORDINATE_FONT_SIZE}px ${TEXT_RENDERING.FONT_FAMILY}`;
    this.ctx.fillStyle = '#000';

    // Column labels (a-h)
    for (let col = 0; col < BOARD_CONFIG.BOARD_SIZE; col++) {
      const isLight = col % 2 === 0;
      this.ctx.fillStyle = isLight ? BOARD_COLORS.DARK_SQUARE : BOARD_COLORS.LIGHT_SQUARE;
      const letter = String.fromCharCode(97 + col);
      this.ctx.fillText(
        letter,
        col * this.squareSize + this.squareSize - TEXT_RENDERING.COLUMN_OFFSET,
        (BOARD_CONFIG.BOARD_SIZE - 1) * this.squareSize + this.squareSize - TEXT_RENDERING.COORDINATE_OFFSET
      );
    }

    // Row labels (1-8)
    for (let row = 0; row < BOARD_CONFIG.BOARD_SIZE; row++) {
      const isLight = row % 2 === 0;
      this.ctx.fillStyle = isLight ? BOARD_COLORS.LIGHT_SQUARE : BOARD_COLORS.DARK_SQUARE;
      this.ctx.fillText(
        String(BOARD_CONFIG.BOARD_SIZE - row),
        TEXT_RENDERING.COORDINATE_OFFSET,
        row * this.squareSize + TEXT_RENDERING.ROW_OFFSET
      );
    }
  }

  private drawHighlights(): void {
    // Highlight selected square
    if (this.selectedSquare) {
      this.ctx.fillStyle = HIGHLIGHT_COLORS.SELECTED_SQUARE;
      this.ctx.fillRect(
        this.selectedSquare.col * this.squareSize,
        this.selectedSquare.row * this.squareSize,
        this.squareSize,
        this.squareSize
      );
    }

    // Highlight legal move squares
    this.ctx.fillStyle = HIGHLIGHT_COLORS.LEGAL_MOVE;
    for (const square of this.highlightedSquares) {
      this.ctx.beginPath();
      this.ctx.arc(
        square.col * this.squareSize + this.squareSize / 2,
        square.row * this.squareSize + this.squareSize / 2,
        this.squareSize * PIECE_RENDERING.MOVE_INDICATOR_RATIO,
        0,
        Math.PI * 2
      );
      this.ctx.fill();
    }
  }

  private drawPieces(board: Board): void {
    for (let row = 0; row < BOARD_CONFIG.BOARD_SIZE; row++) {
      for (let col = 0; col < BOARD_CONFIG.BOARD_SIZE; col++) {
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
    const size = this.squareSize * PIECE_RENDERING.SIZE_RATIO;

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
      gradient.addColorStop(0, PIECE_COLORS.WHITE_START);
      gradient.addColorStop(1, PIECE_COLORS.WHITE_END);
    } else {
      gradient.addColorStop(0, PIECE_COLORS.BLACK_START);
      gradient.addColorStop(1, PIECE_COLORS.BLACK_END);
    }
    return gradient;
  }

  private getOutlineColor(isWhite: boolean): string {
    return isWhite ? PIECE_COLORS.WHITE_OUTLINE : PIECE_COLORS.BLACK_OUTLINE;
  }

  /**
   * Setup common drawing properties for piece rendering
   * Reduces code duplication across all piece drawing methods
   */
  private setupPieceDrawing(size: number, isWhite: boolean): void {
    const gradient = this.createGradient(size, isWhite);
    const outlineColor = this.getOutlineColor(isWhite);

    this.ctx.fillStyle = gradient;
    this.ctx.strokeStyle = outlineColor;
    this.ctx.lineWidth = PIECE_RENDERING.LINE_WIDTH;
    this.ctx.lineCap = 'round';
    this.ctx.lineJoin = 'round';
  }

  /**
   * Draw a common pedestal base for pieces
   * Most pieces share a similar elliptical base
   */
  private drawPedestal(size: number, widthRatio: number = PIECE_RENDERING.PEDESTAL_WIDTH_RATIO): void {
    this.ctx.beginPath();
    this.ctx.ellipse(
      0,
      size * 0.5,
      size * widthRatio,
      size * PIECE_RENDERING.PEDESTAL_HEIGHT_RATIO,
      0,
      0,
      Math.PI * 2
    );
    this.ctx.fill();
    this.ctx.stroke();
  }

  private drawKing(size: number, isWhite: boolean): void {
    this.setupPieceDrawing(size, isWhite);

    // Base pedestal
    this.drawPedestal(size);

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
    this.ctx.lineWidth = PIECE_RENDERING.THICK_LINE_WIDTH;
    this.ctx.beginPath();
    this.ctx.moveTo(0, -size * 0.7);
    this.ctx.lineTo(0, -size * 0.5);
    this.ctx.moveTo(-size * 0.12, -size * 0.6);
    this.ctx.lineTo(size * 0.12, -size * 0.6);
    this.ctx.stroke();

    // Small circle at cross center
    this.ctx.beginPath();
    this.ctx.arc(0, -size * 0.6, size * 0.06, 0, Math.PI * 2);
    this.ctx.fill();
    this.ctx.stroke();
  }

  private drawQueen(size: number, isWhite: boolean): void {
    this.setupPieceDrawing(size, isWhite);

    // Base pedestal (wider than default)
    this.drawPedestal(size, 0.6);

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
    this.setupPieceDrawing(size, isWhite);

    // Base pedestal
    this.drawPedestal(size);

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
    this.setupPieceDrawing(size, isWhite);

    // Base pedestal (slightly narrower)
    this.drawPedestal(size, 0.5);

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
    this.ctx.lineWidth = PIECE_RENDERING.THIN_LINE_WIDTH;
    this.ctx.beginPath();
    this.ctx.moveTo(-size * 0.15, -size * 0.35);
    this.ctx.quadraticCurveTo(0, -size * 0.5, size * 0.15, -size * 0.35);
    this.ctx.stroke();

    // Ball on top
    this.ctx.lineWidth = PIECE_RENDERING.LINE_WIDTH;
    this.ctx.beginPath();
    this.ctx.arc(0, -size * 0.75, size * 0.12, 0, Math.PI * 2);
    this.ctx.fill();
    this.ctx.stroke();

    // Small cross on ball
    this.ctx.lineWidth = PIECE_RENDERING.THIN_LINE_WIDTH;
    this.ctx.beginPath();
    this.ctx.moveTo(0, -size * 0.83);
    this.ctx.lineTo(0, -size * 0.67);
    this.ctx.moveTo(-size * 0.08, -size * 0.75);
    this.ctx.lineTo(size * 0.08, -size * 0.75);
    this.ctx.stroke();
  }

  private drawKnight(size: number, isWhite: boolean): void {
    this.setupPieceDrawing(size, isWhite);

    // Base pedestal (slightly narrower)
    this.drawPedestal(size, 0.5);

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
    this.setupPieceDrawing(size, isWhite);

    // Base pedestal (narrower, shorter)
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
      this.resizeToSize(BOARD_CONFIG.DEFAULT_CANVAS_SIZE);
      return;
    }

    // Calculate the maximum size the canvas can be
    const containerWidth = container.clientWidth;
    const maxSize = Math.min(containerWidth, BOARD_CONFIG.MAX_CANVAS_SIZE);

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
    this.ctx.imageSmoothingEnabled = CANVAS_SETTINGS.IMAGE_SMOOTHING_ENABLED;
    this.ctx.imageSmoothingQuality = CANVAS_SETTINGS.IMAGE_SMOOTHING_QUALITY;

    // Update square size
    this.squareSize = size / BOARD_CONFIG.BOARD_SIZE;
  }
}
