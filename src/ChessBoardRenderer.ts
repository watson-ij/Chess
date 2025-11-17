import type { Board, Piece, Position } from './types';

export class ChessBoardRenderer {
  private ctx: CanvasRenderingContext2D;
  private squareSize: number;
  private selectedSquare: Position | null = null;
  private highlightedSquares: Position[] = [];

  constructor(canvas: HTMLCanvasElement) {
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Could not get canvas context');
    this.ctx = ctx;
    this.squareSize = canvas.width / 8;
  }

  public render(board: Board): void {
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
    const size = this.squareSize * 0.35;

    // Set colors
    const fillColor = piece.color === 'white' ? '#ffffff' : '#1a1a1a';
    const strokeColor = piece.color === 'white' ? '#000000' : '#ffffff';

    this.ctx.save();
    this.ctx.translate(x, y);

    switch (piece.type) {
      case 'king':
        this.drawKing(size, fillColor, strokeColor);
        break;
      case 'queen':
        this.drawQueen(size, fillColor, strokeColor);
        break;
      case 'rook':
        this.drawRook(size, fillColor, strokeColor);
        break;
      case 'bishop':
        this.drawBishop(size, fillColor, strokeColor);
        break;
      case 'knight':
        this.drawKnight(size, fillColor, strokeColor);
        break;
      case 'pawn':
        this.drawPawn(size, fillColor, strokeColor);
        break;
    }

    this.ctx.restore();
  }

  private drawKing(size: number, fill: string, stroke: string): void {
    // Crown base
    this.ctx.fillStyle = fill;
    this.ctx.strokeStyle = stroke;
    this.ctx.lineWidth = 2;

    this.ctx.beginPath();
    this.ctx.moveTo(-size * 0.6, size * 0.4);
    this.ctx.lineTo(-size * 0.6, -size * 0.2);
    this.ctx.lineTo(-size * 0.3, -size * 0.5);
    this.ctx.lineTo(0, -size * 0.3);
    this.ctx.lineTo(size * 0.3, -size * 0.5);
    this.ctx.lineTo(size * 0.6, -size * 0.2);
    this.ctx.lineTo(size * 0.6, size * 0.4);
    this.ctx.closePath();
    this.ctx.fill();
    this.ctx.stroke();

    // Cross on top
    this.ctx.lineWidth = 3;
    this.ctx.beginPath();
    this.ctx.moveTo(0, -size * 0.8);
    this.ctx.lineTo(0, -size * 0.5);
    this.ctx.moveTo(-size * 0.15, -size * 0.65);
    this.ctx.lineTo(size * 0.15, -size * 0.65);
    this.ctx.stroke();
  }

  private drawQueen(size: number, fill: string, stroke: string): void {
    this.ctx.fillStyle = fill;
    this.ctx.strokeStyle = stroke;
    this.ctx.lineWidth = 2;

    // Crown with points
    this.ctx.beginPath();
    this.ctx.moveTo(-size * 0.6, size * 0.4);
    this.ctx.lineTo(-size * 0.6, 0);
    this.ctx.lineTo(-size * 0.4, -size * 0.6);
    this.ctx.lineTo(-size * 0.2, -size * 0.2);
    this.ctx.lineTo(0, -size * 0.7);
    this.ctx.lineTo(size * 0.2, -size * 0.2);
    this.ctx.lineTo(size * 0.4, -size * 0.6);
    this.ctx.lineTo(size * 0.6, 0);
    this.ctx.lineTo(size * 0.6, size * 0.4);
    this.ctx.closePath();
    this.ctx.fill();
    this.ctx.stroke();
  }

  private drawRook(size: number, fill: string, stroke: string): void {
    this.ctx.fillStyle = fill;
    this.ctx.strokeStyle = stroke;
    this.ctx.lineWidth = 2;

    // Castle tower
    this.ctx.fillRect(-size * 0.5, -size * 0.3, size, size * 0.7);
    this.ctx.strokeRect(-size * 0.5, -size * 0.3, size, size * 0.7);

    // Battlements
    this.ctx.fillRect(-size * 0.5, -size * 0.6, size * 0.3, size * 0.3);
    this.ctx.strokeRect(-size * 0.5, -size * 0.6, size * 0.3, size * 0.3);
    this.ctx.fillRect(-size * 0.1, -size * 0.6, size * 0.2, size * 0.3);
    this.ctx.strokeRect(-size * 0.1, -size * 0.6, size * 0.2, size * 0.3);
    this.ctx.fillRect(size * 0.2, -size * 0.6, size * 0.3, size * 0.3);
    this.ctx.strokeRect(size * 0.2, -size * 0.6, size * 0.3, size * 0.3);
  }

  private drawBishop(size: number, fill: string, stroke: string): void {
    this.ctx.fillStyle = fill;
    this.ctx.strokeStyle = stroke;
    this.ctx.lineWidth = 2;

    // Mitre shape
    this.ctx.beginPath();
    this.ctx.moveTo(-size * 0.4, size * 0.4);
    this.ctx.lineTo(-size * 0.3, -size * 0.2);
    this.ctx.lineTo(0, -size * 0.7);
    this.ctx.lineTo(size * 0.3, -size * 0.2);
    this.ctx.lineTo(size * 0.4, size * 0.4);
    this.ctx.closePath();
    this.ctx.fill();
    this.ctx.stroke();

    // Circle on top
    this.ctx.beginPath();
    this.ctx.arc(0, -size * 0.7, size * 0.1, 0, Math.PI * 2);
    this.ctx.fill();
    this.ctx.stroke();
  }

  private drawKnight(size: number, fill: string, stroke: string): void {
    this.ctx.fillStyle = fill;
    this.ctx.strokeStyle = stroke;
    this.ctx.lineWidth = 2;

    // Horse head approximation
    this.ctx.beginPath();
    this.ctx.moveTo(-size * 0.3, size * 0.4);
    this.ctx.lineTo(-size * 0.3, 0);
    this.ctx.lineTo(-size * 0.1, -size * 0.5);
    this.ctx.lineTo(size * 0.3, -size * 0.6);
    this.ctx.lineTo(size * 0.5, -size * 0.3);
    this.ctx.lineTo(size * 0.4, 0);
    this.ctx.lineTo(size * 0.3, size * 0.4);
    this.ctx.closePath();
    this.ctx.fill();
    this.ctx.stroke();

    // Eye
    this.ctx.fillStyle = stroke;
    this.ctx.beginPath();
    this.ctx.arc(size * 0.2, -size * 0.3, size * 0.08, 0, Math.PI * 2);
    this.ctx.fill();
  }

  private drawPawn(size: number, fill: string, stroke: string): void {
    this.ctx.fillStyle = fill;
    this.ctx.strokeStyle = stroke;
    this.ctx.lineWidth = 2;

    // Base
    this.ctx.beginPath();
    this.ctx.moveTo(-size * 0.4, size * 0.4);
    this.ctx.lineTo(-size * 0.3, 0);
    this.ctx.lineTo(size * 0.3, 0);
    this.ctx.lineTo(size * 0.4, size * 0.4);
    this.ctx.closePath();
    this.ctx.fill();
    this.ctx.stroke();

    // Head
    this.ctx.beginPath();
    this.ctx.arc(0, -size * 0.3, size * 0.3, 0, Math.PI * 2);
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
}
