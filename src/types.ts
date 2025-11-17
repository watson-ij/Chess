export type PieceColor = 'white' | 'black';
export type PieceType = 'king' | 'queen' | 'rook' | 'bishop' | 'knight' | 'pawn';

export interface Piece {
  type: PieceType;
  color: PieceColor;
}

export interface Position {
  row: number;
  col: number;
}

export interface Move {
  from: Position;
  to: Position;
  piece: Piece;
  capturedPiece?: Piece;
  isEnPassant?: boolean;
  isCastling?: boolean;
  promotionPiece?: PieceType;
  notation?: string;
}

export type Board = (Piece | null)[][];

export interface GameState {
  board: Board;
  currentTurn: PieceColor;
  moveHistory: Move[];
  isCheck: boolean;
  isCheckmate: boolean;
  isStalemate: boolean;
  canCastleKingside: { white: boolean; black: boolean };
  canCastleQueenside: { white: boolean; black: boolean };
  enPassantTarget: Position | null;
}
