import type { Board, GameState, Move, Piece, PieceColor, PieceType, Position } from './types';

export class ChessEngine {
  private state: GameState;

  constructor() {
    this.state = this.initializeGame();
  }

  private initializeGame(): GameState {
    const board = this.createInitialBoard();
    return {
      board,
      currentTurn: 'white',
      moveHistory: [],
      isCheck: false,
      isCheckmate: false,
      isStalemate: false,
      canCastleKingside: { white: true, black: true },
      canCastleQueenside: { white: true, black: true },
      enPassantTarget: null,
    };
  }

  private createInitialBoard(): Board {
    const board: Board = Array(8).fill(null).map(() => Array(8).fill(null));

    // Setup pieces
    const backRank: PieceType[] = ['rook', 'knight', 'bishop', 'queen', 'king', 'bishop', 'knight', 'rook'];

    // Black pieces
    for (let col = 0; col < 8; col++) {
      board[0][col] = { type: backRank[col], color: 'black' };
      board[1][col] = { type: 'pawn', color: 'black' };
    }

    // White pieces
    for (let col = 0; col < 8; col++) {
      board[6][col] = { type: 'pawn', color: 'white' };
      board[7][col] = { type: backRank[col], color: 'white' };
    }

    return board;
  }

  public getState(): GameState {
    return { ...this.state };
  }

  public getBoard(): Board {
    return this.state.board.map(row => [...row]);
  }

  public getPieceAt(pos: Position): Piece | null {
    if (!this.isValidPosition(pos)) return null;
    return this.state.board[pos.row][pos.col];
  }

  private isValidPosition(pos: Position): boolean {
    return pos.row >= 0 && pos.row < 8 && pos.col >= 0 && pos.col < 8;
  }

  public getLegalMoves(from: Position): Position[] {
    const piece = this.getPieceAt(from);
    if (!piece || piece.color !== this.state.currentTurn) return [];

    const pseudoLegalMoves = this.getPseudoLegalMoves(from, piece);

    // Filter out moves that leave king in check
    return pseudoLegalMoves.filter(to => {
      const move: Move = { from, to, piece };
      return !this.wouldBeInCheck(move);
    });
  }

  private getPseudoLegalMoves(from: Position, piece: Piece): Position[] {
    switch (piece.type) {
      case 'pawn':
        return this.getPawnMoves(from, piece.color);
      case 'knight':
        return this.getKnightMoves(from, piece.color);
      case 'bishop':
        return this.getBishopMoves(from, piece.color);
      case 'rook':
        return this.getRookMoves(from, piece.color);
      case 'queen':
        return this.getQueenMoves(from, piece.color);
      case 'king':
        return this.getKingMoves(from, piece.color);
      default:
        return [];
    }
  }

  private getPawnMoves(from: Position, color: PieceColor): Position[] {
    const moves: Position[] = [];
    const direction = color === 'white' ? -1 : 1;
    const startRow = color === 'white' ? 6 : 1;

    // Forward move
    const forward = { row: from.row + direction, col: from.col };
    if (this.isValidPosition(forward) && !this.getPieceAt(forward)) {
      moves.push(forward);

      // Double forward from starting position
      if (from.row === startRow) {
        const doubleForward = { row: from.row + 2 * direction, col: from.col };
        if (!this.getPieceAt(doubleForward)) {
          moves.push(doubleForward);
        }
      }
    }

    // Captures
    for (const colOffset of [-1, 1]) {
      const capture = { row: from.row + direction, col: from.col + colOffset };
      if (this.isValidPosition(capture)) {
        const targetPiece = this.getPieceAt(capture);
        if (targetPiece && targetPiece.color !== color) {
          moves.push(capture);
        }
        // En passant
        if (this.state.enPassantTarget &&
            capture.row === this.state.enPassantTarget.row &&
            capture.col === this.state.enPassantTarget.col) {
          moves.push(capture);
        }
      }
    }

    return moves;
  }

  private getKnightMoves(from: Position, color: PieceColor): Position[] {
    const moves: Position[] = [];
    const offsets = [
      [-2, -1], [-2, 1], [-1, -2], [-1, 2],
      [1, -2], [1, 2], [2, -1], [2, 1]
    ];

    for (const [rowOffset, colOffset] of offsets) {
      const to = { row: from.row + rowOffset, col: from.col + colOffset };
      if (this.isValidPosition(to)) {
        const targetPiece = this.getPieceAt(to);
        if (!targetPiece || targetPiece.color !== color) {
          moves.push(to);
        }
      }
    }

    return moves;
  }

  private getBishopMoves(from: Position, color: PieceColor): Position[] {
    return this.getSlidingMoves(from, color, [
      [-1, -1], [-1, 1], [1, -1], [1, 1]
    ]);
  }

  private getRookMoves(from: Position, color: PieceColor): Position[] {
    return this.getSlidingMoves(from, color, [
      [-1, 0], [1, 0], [0, -1], [0, 1]
    ]);
  }

  private getQueenMoves(from: Position, color: PieceColor): Position[] {
    return this.getSlidingMoves(from, color, [
      [-1, -1], [-1, 0], [-1, 1],
      [0, -1], [0, 1],
      [1, -1], [1, 0], [1, 1]
    ]);
  }

  private getSlidingMoves(from: Position, color: PieceColor, directions: number[][]): Position[] {
    const moves: Position[] = [];

    for (const [rowDir, colDir] of directions) {
      let row = from.row + rowDir;
      let col = from.col + colDir;

      while (row >= 0 && row < 8 && col >= 0 && col < 8) {
        const targetPiece = this.getPieceAt({ row, col });

        if (!targetPiece) {
          moves.push({ row, col });
        } else {
          if (targetPiece.color !== color) {
            moves.push({ row, col });
          }
          break;
        }

        row += rowDir;
        col += colDir;
      }
    }

    return moves;
  }

  private getKingMoves(from: Position, color: PieceColor): Position[] {
    const moves: Position[] = [];
    const offsets = [
      [-1, -1], [-1, 0], [-1, 1],
      [0, -1], [0, 1],
      [1, -1], [1, 0], [1, 1]
    ];

    for (const [rowOffset, colOffset] of offsets) {
      const to = { row: from.row + rowOffset, col: from.col + colOffset };
      if (this.isValidPosition(to)) {
        const targetPiece = this.getPieceAt(to);
        if (!targetPiece || targetPiece.color !== color) {
          moves.push(to);
        }
      }
    }

    // Castling
    const row = color === 'white' ? 7 : 0;
    if (from.row === row && from.col === 4 && !this.state.isCheck) {
      // Kingside
      if (this.state.canCastleKingside[color]) {
        if (!this.getPieceAt({ row, col: 5 }) &&
            !this.getPieceAt({ row, col: 6 }) &&
            !this.isSquareUnderAttack({ row, col: 5 }, color) &&
            !this.isSquareUnderAttack({ row, col: 6 }, color)) {
          moves.push({ row, col: 6 });
        }
      }
      // Queenside
      if (this.state.canCastleQueenside[color]) {
        if (!this.getPieceAt({ row, col: 3 }) &&
            !this.getPieceAt({ row, col: 2 }) &&
            !this.getPieceAt({ row, col: 1 }) &&
            !this.isSquareUnderAttack({ row, col: 3 }, color) &&
            !this.isSquareUnderAttack({ row, col: 2 }, color)) {
          moves.push({ row, col: 2 });
        }
      }
    }

    return moves;
  }

  private wouldBeInCheck(move: Move): boolean {
    // Make a temporary copy of the board
    const originalBoard = this.state.board;
    const tempBoard = originalBoard.map(row => [...row]);

    // Apply the move
    tempBoard[move.to.row][move.to.col] = tempBoard[move.from.row][move.from.col];
    tempBoard[move.from.row][move.from.col] = null;

    // Temporarily update the board
    this.state.board = tempBoard;

    // Find king position
    const kingPos = this.findKing(move.piece.color);
    const inCheck = kingPos ? this.isSquareUnderAttack(kingPos, move.piece.color) : false;

    // Restore original board
    this.state.board = originalBoard;

    return inCheck;
  }

  private findKing(color: PieceColor): Position | null {
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const piece = this.state.board[row][col];
        if (piece && piece.type === 'king' && piece.color === color) {
          return { row, col };
        }
      }
    }
    return null;
  }

  private isSquareUnderAttack(pos: Position, defenderColor: PieceColor): boolean {
    const attackerColor = defenderColor === 'white' ? 'black' : 'white';

    // Check all opponent pieces
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const piece = this.state.board[row][col];
        if (piece && piece.color === attackerColor) {
          const attacks = this.getPieceAttacks({ row, col }, piece);
          if (attacks.some(attack => attack.row === pos.row && attack.col === pos.col)) {
            return true;
          }
        }
      }
    }

    return false;
  }

  private getPieceAttacks(from: Position, piece: Piece): Position[] {
    // Similar to getPseudoLegalMoves but for attacks (pawns attack diagonally)
    // Kings don't attack via castling, so we handle them specially
    if (piece.type === 'pawn') {
      const attacks: Position[] = [];
      const direction = piece.color === 'white' ? -1 : 1;
      for (const colOffset of [-1, 1]) {
        const attack = { row: from.row + direction, col: from.col + colOffset };
        if (this.isValidPosition(attack)) {
          attacks.push(attack);
        }
      }
      return attacks;
    }

    if (piece.type === 'king') {
      // King attacks only adjacent squares, not castling
      const attacks: Position[] = [];
      const offsets = [
        [-1, -1], [-1, 0], [-1, 1],
        [0, -1], [0, 1],
        [1, -1], [1, 0], [1, 1]
      ];

      for (const [rowOffset, colOffset] of offsets) {
        const to = { row: from.row + rowOffset, col: from.col + colOffset };
        if (this.isValidPosition(to)) {
          attacks.push(to);
        }
      }
      return attacks;
    }

    return this.getPseudoLegalMoves(from, piece);
  }

  public makeMove(from: Position, to: Position, promotionPiece?: PieceType): boolean {
    const piece = this.getPieceAt(from);
    if (!piece || piece.color !== this.state.currentTurn) return false;

    const legalMoves = this.getLegalMoves(from);
    if (!legalMoves.some(move => move.row === to.row && move.col === to.col)) {
      return false;
    }

    const capturedPiece = this.getPieceAt(to);
    const move: Move = {
      from,
      to,
      piece,
      capturedPiece: capturedPiece || undefined,
    };

    // Check for en passant
    if (piece.type === 'pawn' && to.col !== from.col && !capturedPiece) {
      move.isEnPassant = true;
      const capturedPawnRow = piece.color === 'white' ? to.row + 1 : to.row - 1;
      move.capturedPiece = this.state.board[capturedPawnRow][to.col] || undefined;
      this.state.board[capturedPawnRow][to.col] = null;
    }

    // Check for castling
    if (piece.type === 'king' && Math.abs(to.col - from.col) === 2) {
      move.isCastling = true;
      const row = from.row;
      if (to.col === 6) {
        // Kingside
        this.state.board[row][5] = this.state.board[row][7];
        this.state.board[row][7] = null;
      } else if (to.col === 2) {
        // Queenside
        this.state.board[row][3] = this.state.board[row][0];
        this.state.board[row][0] = null;
      }
    }

    // Update castling rights
    if (piece.type === 'king') {
      this.state.canCastleKingside[piece.color] = false;
      this.state.canCastleQueenside[piece.color] = false;
    }
    if (piece.type === 'rook') {
      if (from.col === 0) this.state.canCastleQueenside[piece.color] = false;
      if (from.col === 7) this.state.canCastleKingside[piece.color] = false;
    }

    // Update en passant target
    if (piece.type === 'pawn' && Math.abs(to.row - from.row) === 2) {
      this.state.enPassantTarget = {
        row: (from.row + to.row) / 2,
        col: from.col
      };
    } else {
      this.state.enPassantTarget = null;
    }

    // Make the move
    this.state.board[to.row][to.col] = this.state.board[from.row][from.col];
    this.state.board[from.row][from.col] = null;

    // Handle pawn promotion
    if (piece.type === 'pawn' && (to.row === 0 || to.row === 7)) {
      const promoteTo = promotionPiece || 'queen';
      this.state.board[to.row][to.col] = { type: promoteTo, color: piece.color };
      move.promotionPiece = promoteTo;
    }

    // Generate move notation
    move.notation = this.generateMoveNotation(move);

    // Add to history
    this.state.moveHistory.push(move);

    // Switch turn
    this.state.currentTurn = this.state.currentTurn === 'white' ? 'black' : 'white';

    // Update game state
    this.updateGameState();

    return true;
  }

  private generateMoveNotation(move: Move): string {
    if (move.isCastling) {
      return move.to.col === 6 ? 'O-O' : 'O-O-O';
    }

    let notation = '';

    // Piece letter (except for pawns)
    if (move.piece.type !== 'pawn') {
      const pieceNotation: Record<PieceType, string> = {
        'king': 'K',
        'queen': 'Q',
        'rook': 'R',
        'bishop': 'B',
        'knight': 'N',
        'pawn': ''
      };
      notation += pieceNotation[move.piece.type];
    }

    // Capture
    if (move.capturedPiece) {
      if (move.piece.type === 'pawn') {
        notation += String.fromCharCode(97 + move.from.col);
      }
      notation += 'x';
    }

    // Destination
    notation += String.fromCharCode(97 + move.to.col) + (8 - move.to.row);

    // Promotion
    if (move.promotionPiece) {
      const pieceNotation: Record<PieceType, string> = {
        'queen': 'Q',
        'rook': 'R',
        'bishop': 'B',
        'knight': 'N',
        'king': 'K',
        'pawn': ''
      };
      notation += '=' + pieceNotation[move.promotionPiece];
    }

    // Check and checkmate symbols
    // We need to check the resulting position after this move
    const opponentColor = this.state.currentTurn === 'white' ? 'black' : 'white';
    const kingPos = this.findKing(opponentColor);

    if (kingPos) {
      const wouldBeCheck = this.isSquareUnderAttack(kingPos, opponentColor);

      if (wouldBeCheck) {
        // Temporarily switch turn to check if opponent has legal moves
        const originalTurn = this.state.currentTurn;
        this.state.currentTurn = opponentColor;

        const hasLegalMoves = this.hasAnyLegalMoves(opponentColor);

        // Switch turn back
        this.state.currentTurn = originalTurn;

        if (!hasLegalMoves) {
          notation += '#';
        } else {
          notation += '+';
        }
      }
    }

    return notation;
  }

  private updateGameState(): void {
    const opponentColor = this.state.currentTurn;
    const kingPos = this.findKing(opponentColor);

    if (kingPos) {
      this.state.isCheck = this.isSquareUnderAttack(kingPos, opponentColor);

      // Check for checkmate or stalemate
      const hasLegalMoves = this.hasAnyLegalMoves(opponentColor);

      if (!hasLegalMoves) {
        if (this.state.isCheck) {
          this.state.isCheckmate = true;
        } else {
          this.state.isStalemate = true;
        }
      }
    }
  }

  private hasAnyLegalMoves(color: PieceColor): boolean {
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const piece = this.state.board[row][col];
        if (piece && piece.color === color) {
          const legalMoves = this.getLegalMoves({ row, col });
          if (legalMoves.length > 0) {
            return true;
          }
        }
      }
    }
    return false;
  }

  public getMoveHistory(): Move[] {
    return [...this.state.moveHistory];
  }

  public getCurrentTurn(): PieceColor {
    return this.state.currentTurn;
  }

  public isGameOver(): boolean {
    return this.state.isCheckmate || this.state.isStalemate;
  }

  public getGameStatus(): string {
    if (this.state.isCheckmate) {
      const winner = this.state.currentTurn === 'white' ? 'Black' : 'White';
      return `Checkmate! ${winner} wins!`;
    }
    if (this.state.isStalemate) {
      return 'Stalemate! Draw.';
    }
    if (this.state.isCheck) {
      return 'Check!';
    }
    return '';
  }

  /**
   * Load a position from FEN (Forsyth-Edwards Notation)
   * Example: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1"
   */
  public loadFEN(fen: string): void {
    const parts = fen.split(' ');
    if (parts.length < 4) {
      throw new Error('Invalid FEN string');
    }

    const [position, turn, castling, enPassant] = parts;

    // Parse board position
    const board: Board = Array(8).fill(null).map(() => Array(8).fill(null));
    const ranks = position.split('/');

    if (ranks.length !== 8) {
      throw new Error('Invalid FEN: must have 8 ranks');
    }

    for (let row = 0; row < 8; row++) {
      let col = 0;
      for (const char of ranks[row]) {
        if (char >= '1' && char <= '8') {
          col += parseInt(char);
        } else {
          const piece = this.fenCharToPiece(char);
          if (piece) {
            board[row][col] = piece;
            col++;
          }
        }
      }
    }

    // Parse turn
    const currentTurn: PieceColor = turn === 'w' ? 'white' : 'black';

    // Parse castling rights
    const canCastleKingside = {
      white: castling.includes('K'),
      black: castling.includes('k')
    };
    const canCastleQueenside = {
      white: castling.includes('Q'),
      black: castling.includes('q')
    };

    // Parse en passant target
    let enPassantTarget: Position | null = null;
    if (enPassant !== '-') {
      const col = enPassant.charCodeAt(0) - 97; // 'a' = 0
      const row = 8 - parseInt(enPassant[1]);
      enPassantTarget = { row, col };
    }

    // Update state
    this.state = {
      board,
      currentTurn,
      moveHistory: [],
      isCheck: false,
      isCheckmate: false,
      isStalemate: false,
      canCastleKingside,
      canCastleQueenside,
      enPassantTarget,
    };

    // Update game state (check/checkmate/stalemate)
    this.updateGameState();
  }

  private fenCharToPiece(char: string): Piece | null {
    const color: PieceColor = char === char.toUpperCase() ? 'white' : 'black';
    const lowerChar = char.toLowerCase();

    const typeMap: Record<string, PieceType> = {
      'p': 'pawn',
      'n': 'knight',
      'b': 'bishop',
      'r': 'rook',
      'q': 'queen',
      'k': 'king'
    };

    const type = typeMap[lowerChar];
    return type ? { type, color } : null;
  }

  /**
   * Export current position to FEN notation
   */
  public toFEN(): string {
    let fen = '';

    // Board position
    for (let row = 0; row < 8; row++) {
      let emptyCount = 0;
      for (let col = 0; col < 8; col++) {
        const piece = this.state.board[row][col];
        if (piece) {
          if (emptyCount > 0) {
            fen += emptyCount;
            emptyCount = 0;
          }
          fen += this.pieceToFenChar(piece);
        } else {
          emptyCount++;
        }
      }
      if (emptyCount > 0) {
        fen += emptyCount;
      }
      if (row < 7) {
        fen += '/';
      }
    }

    // Turn
    fen += ' ' + (this.state.currentTurn === 'white' ? 'w' : 'b');

    // Castling rights
    let castling = '';
    if (this.state.canCastleKingside.white) castling += 'K';
    if (this.state.canCastleQueenside.white) castling += 'Q';
    if (this.state.canCastleKingside.black) castling += 'k';
    if (this.state.canCastleQueenside.black) castling += 'q';
    fen += ' ' + (castling || '-');

    // En passant
    if (this.state.enPassantTarget) {
      const col = String.fromCharCode(97 + this.state.enPassantTarget.col);
      const row = 8 - this.state.enPassantTarget.row;
      fen += ' ' + col + row;
    } else {
      fen += ' -';
    }

    // Halfmove and fullmove (not tracked, so default to 0 and 1)
    fen += ' 0 1';

    return fen;
  }

  private pieceToFenChar(piece: Piece): string {
    const charMap: Record<PieceType, string> = {
      'pawn': 'p',
      'knight': 'n',
      'bishop': 'b',
      'rook': 'r',
      'queen': 'q',
      'king': 'k'
    };

    const char = charMap[piece.type];
    return piece.color === 'white' ? char.toUpperCase() : char;
  }

  /**
   * Make a move using SAN (Standard Algebraic Notation)
   * Examples: "e4", "Nf3", "O-O", "Bxf7+", "exd8=Q#"
   */
  public makeSANMove(san: string): boolean {
    // Remove check/checkmate markers
    san = san.replace(/[+#]$/, '');

    // Handle castling
    if (san === 'O-O' || san === 'O-O-O') {
      const row = this.state.currentTurn === 'white' ? 7 : 0;
      const kingCol = 4;
      const targetCol = san === 'O-O' ? 6 : 2;
      return this.makeMove({ row, col: kingCol }, { row, col: targetCol });
    }

    // Parse the move
    let pieceType: PieceType = 'pawn';
    let fromFile: number | null = null;
    let fromRank: number | null = null;
    let promotionPiece: PieceType | undefined;

    // Check for piece type
    const firstChar = san[0];
    let index = 0;
    if (['K', 'Q', 'R', 'B', 'N'].includes(firstChar)) {
      const pieceMap: Record<string, PieceType> = {
        'K': 'king',
        'Q': 'queen',
        'R': 'rook',
        'B': 'bishop',
        'N': 'knight'
      };
      pieceType = pieceMap[firstChar];
      index = 1;
    }

    // Parse the rest
    let remainingStr = san.substring(index);

    // Check for capture
    if (remainingStr.includes('x')) {
      const parts = remainingStr.split('x');

      // Part before 'x' might be disambiguation or pawn file
      if (parts[0].length > 0) {
        if (parts[0].length === 2) {
          // Full square disambiguation (rare)
          fromFile = parts[0].charCodeAt(0) - 97;
          fromRank = 8 - parseInt(parts[0][1]);
        } else if (parts[0][0] >= 'a' && parts[0][0] <= 'h') {
          fromFile = parts[0].charCodeAt(0) - 97;
        } else {
          fromRank = 8 - parseInt(parts[0]);
        }
      }

      remainingStr = parts[1];
    } else {
      // Check for disambiguation (no capture)
      // Only disambiguate for non-pawn pieces, or check if we have more than a destination (e.g., Nbd7, R1a3)
      if (pieceType !== 'pawn' && remainingStr.length > 2) {
        const char = remainingStr[0];
        // Check if first char is a file (for file disambiguation)
        if (char >= 'a' && char <= 'h' && remainingStr[1] >= 'a' && remainingStr[1] <= 'h') {
          // File disambiguation (e.g., Nbd7)
          fromFile = char.charCodeAt(0) - 97;
          remainingStr = remainingStr.substring(1);
        } else if (char >= '1' && char <= '8') {
          // Rank disambiguation (e.g., R1a3)
          fromRank = 8 - parseInt(char);
          remainingStr = remainingStr.substring(1);
        }
      }
    }

    // Check for promotion before parsing destination
    if (remainingStr.includes('=')) {
      const promoPiece = remainingStr[remainingStr.indexOf('=') + 1];
      const promoMap: Record<string, PieceType> = {
        'Q': 'queen',
        'R': 'rook',
        'B': 'bishop',
        'N': 'knight'
      };
      promotionPiece = promoMap[promoPiece];
    }

    // Parse destination (first 2 characters of remainingStr)
    const destFile = remainingStr.charCodeAt(0) - 97;
    const destRank = 8 - parseInt(remainingStr[1]);
    const to: Position = { row: destRank, col: destFile };

    // Find the matching piece
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const piece = this.state.board[row][col];
        if (!piece || piece.type !== pieceType || piece.color !== this.state.currentTurn) {
          continue;
        }

        // Check disambiguation
        if (fromFile !== null && col !== fromFile) continue;
        if (fromRank !== null && row !== fromRank) continue;

        // Check if this piece can legally move to the destination
        const legalMoves = this.getLegalMoves({ row, col });
        if (legalMoves.some(move => move.row === to.row && move.col === to.col)) {
          return this.makeMove({ row, col }, to, promotionPiece);
        }
      }
    }

    return false;
  }

  /**
   * Import a game from PGN (Portable Game Notation)
   */
  public loadPGN(pgn: string): boolean {
    // Parse PGN headers (optional)
    const lines = pgn.split('\n');
    const moves: string[] = [];

    for (const line of lines) {
      // Skip headers and empty lines
      if (line.startsWith('[') || line.trim() === '') continue;

      // Extract moves from the line
      const tokens = line.trim().split(/\s+/);
      for (const token of tokens) {
        // Skip results
        if (token === '1-0' || token === '0-1' || token === '1/2-1/2' || token === '*') {
          continue;
        }

        // Remove move number prefixes from tokens like "1.e4" or "1."
        const cleanToken = token.replace(/^\d+\.+/, '');
        if (cleanToken) {
          moves.push(cleanToken);
        }
      }
    }

    // Reset to starting position
    this.state = this.initializeGame();

    // Play through all moves
    for (const move of moves) {
      if (!this.makeSANMove(move)) {
        console.error(`Failed to parse move: ${move}`);
        return false;
      }
    }

    return true;
  }

  /**
   * Export the game to PGN (Portable Game Notation)
   */
  public toPGN(headers: Record<string, string> = {}): string {
    let pgn = '';

    // Add headers
    const defaultHeaders = {
      'Event': '?',
      'Site': '?',
      'Date': new Date().toISOString().split('T')[0].replace(/-/g, '.'),
      'Round': '?',
      'White': '?',
      'Black': '?',
      'Result': '*',
      ...headers
    };

    for (const [key, value] of Object.entries(defaultHeaders)) {
      pgn += `[${key} "${value}"]\n`;
    }

    pgn += '\n';

    // Add moves
    const moves = this.getMoveHistory();
    for (let i = 0; i < moves.length; i++) {
      if (i % 2 === 0) {
        pgn += `${Math.floor(i / 2) + 1}. `;
      }
      pgn += moves[i].notation + ' ';

      // Line break every few moves for readability
      if (i % 8 === 7) {
        pgn += '\n';
      }
    }

    // Add result
    if (this.state.isCheckmate) {
      const result = this.state.currentTurn === 'white' ? '0-1' : '1-0';
      pgn += result;
    } else if (this.state.isStalemate) {
      pgn += '1/2-1/2';
    } else {
      pgn += '*';
    }

    return pgn.trim();
  }
}
