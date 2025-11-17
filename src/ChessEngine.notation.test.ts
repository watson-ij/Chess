import { describe, it, expect, beforeEach } from 'vitest';
import { ChessEngine } from './ChessEngine';

describe('ChessEngine - Notation Support', () => {
  let engine: ChessEngine;

  beforeEach(() => {
    engine = new ChessEngine();
  });

  describe('FEN Import/Export', () => {
    it('should export starting position to correct FEN', () => {
      const fen = engine.toFEN();
      expect(fen).toBe('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1');
    });

    it('should load and export FEN correctly', () => {
      const testFen = 'rnbqkbnr/pp1ppppp/8/2p5/4P3/8/PPPP1PPP/RNBQKBNR w KQkq c6 0 2';
      engine.loadFEN(testFen);

      const exportedFen = engine.toFEN();
      // Compare without move counters (we don't track those)
      const withoutCounters = (fen: string) => fen.split(' ').slice(0, 4).join(' ');
      expect(withoutCounters(exportedFen)).toBe(withoutCounters(testFen));
    });

    it('should correctly parse piece positions from FEN', () => {
      engine.loadFEN('rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1');

      const board = engine.getBoard();
      expect(board[4][4]?.type).toBe('pawn');
      expect(board[4][4]?.color).toBe('white');
      expect(board[6][4]).toBeNull();
    });

    it('should correctly parse turn from FEN', () => {
      engine.loadFEN('rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1');
      expect(engine.getCurrentTurn()).toBe('black');
    });

    it('should correctly parse castling rights from FEN', () => {
      engine.loadFEN('r3k2r/8/8/8/8/8/8/R3K2R w KQkq - 0 1');
      const state = engine.getState();

      expect(state.canCastleKingside.white).toBe(true);
      expect(state.canCastleQueenside.white).toBe(true);
      expect(state.canCastleKingside.black).toBe(true);
      expect(state.canCastleQueenside.black).toBe(true);
    });

    it('should correctly parse partial castling rights from FEN', () => {
      engine.loadFEN('r3k2r/8/8/8/8/8/8/R3K2R w Kq - 0 1');
      const state = engine.getState();

      expect(state.canCastleKingside.white).toBe(true);
      expect(state.canCastleQueenside.white).toBe(false);
      expect(state.canCastleKingside.black).toBe(false);
      expect(state.canCastleQueenside.black).toBe(true);
    });

    it('should correctly parse en passant target from FEN', () => {
      engine.loadFEN('rnbqkbnr/pppp1ppp/8/4pP2/8/8/PPPPP1PP/RNBQKBNR w KQkq e6 0 1');
      const state = engine.getState();

      expect(state.enPassantTarget).toEqual({ row: 2, col: 4 });
    });

    it('should handle FEN with no castling rights', () => {
      engine.loadFEN('4k3/8/8/8/8/8/8/4K3 w - - 0 1');
      const state = engine.getState();

      expect(state.canCastleKingside.white).toBe(false);
      expect(state.canCastleQueenside.white).toBe(false);
      expect(state.canCastleKingside.black).toBe(false);
      expect(state.canCastleQueenside.black).toBe(false);
    });
  });

  describe('SAN Move Parsing', () => {
    it('should parse simple pawn moves', () => {
      expect(engine.makeSANMove('e4')).toBe(true);

      const board = engine.getBoard();
      expect(board[4][4]?.type).toBe('pawn');
      expect(board[4][4]?.color).toBe('white');
    });

    it('should parse knight moves', () => {
      engine.makeSANMove('e4');
      expect(engine.makeSANMove('Nf6')).toBe(true);

      const board = engine.getBoard();
      expect(board[2][5]?.type).toBe('knight');
      expect(board[2][5]?.color).toBe('black');
    });

    it('should parse bishop moves', () => {
      engine.makeSANMove('e4');
      engine.makeSANMove('e5');
      expect(engine.makeSANMove('Bc4')).toBe(true);

      const board = engine.getBoard();
      expect(board[4][2]?.type).toBe('bishop');
      expect(board[4][2]?.color).toBe('white');
    });

    it('should parse queen moves', () => {
      engine.makeSANMove('e4');
      engine.makeSANMove('e5');
      expect(engine.makeSANMove('Qh5')).toBe(true);

      const board = engine.getBoard();
      expect(board[3][7]?.type).toBe('queen');
      expect(board[3][7]?.color).toBe('white');
    });

    it('should parse kingside castling', () => {
      engine.loadFEN('r3k2r/8/8/8/8/8/8/R3K2R w KQkq - 0 1');

      expect(engine.makeSANMove('O-O')).toBe(true);

      const board = engine.getBoard();
      expect(board[7][6]?.type).toBe('king');
      expect(board[7][5]?.type).toBe('rook');
    });

    it('should parse queenside castling', () => {
      engine.loadFEN('r3k2r/8/8/8/8/8/8/R3K2R w KQkq - 0 1');

      expect(engine.makeSANMove('O-O-O')).toBe(true);

      const board = engine.getBoard();
      expect(board[7][2]?.type).toBe('king');
      expect(board[7][3]?.type).toBe('rook');
    });

    it('should parse pawn captures', () => {
      engine.makeSANMove('e4');
      engine.makeSANMove('d5');
      expect(engine.makeSANMove('exd5')).toBe(true);

      const board = engine.getBoard();
      expect(board[3][3]?.type).toBe('pawn');
      expect(board[3][3]?.color).toBe('white');
    });

    it('should parse piece captures', () => {
      engine.loadFEN('rnbqkbnr/pppp1ppp/8/4p3/4P3/8/PPPP1PPP/RNBQKBNR w KQkq - 0 1');
      engine.makeSANMove('Bc4');
      engine.makeSANMove('Nf6');

      expect(engine.makeSANMove('Bxf7+')).toBe(true);

      const board = engine.getBoard();
      expect(board[1][5]?.type).toBe('bishop');
      expect(board[1][5]?.color).toBe('white');
    });

    it('should parse pawn promotion', () => {
      engine.loadFEN('4k3/P7/8/8/8/8/8/4K3 w - - 0 1');

      expect(engine.makeSANMove('a8=Q')).toBe(true);

      const board = engine.getBoard();
      expect(board[0][0]?.type).toBe('queen');
      expect(board[0][0]?.color).toBe('white');
    });

    it('should parse pawn promotion with capture', () => {
      engine.loadFEN('1r2k3/P7/8/8/8/8/8/4K3 w - - 0 1');

      expect(engine.makeSANMove('axb8=Q')).toBe(true);

      const board = engine.getBoard();
      expect(board[0][1]?.type).toBe('queen');
      expect(board[0][1]?.color).toBe('white');
    });

    it('should ignore check and checkmate symbols', () => {
      engine.makeSANMove('e4');
      engine.makeSANMove('e5');
      engine.makeSANMove('Bc4');
      engine.makeSANMove('Nf6');

      expect(engine.makeSANMove('Bxf7+')).toBe(true); // With check symbol
    });

    it('should handle disambiguation by file', () => {
      // Two rooks on a1 and h1, kings on e8 and e2
      engine.loadFEN('4k3/8/8/8/8/8/4K3/R6R w - - 0 1');

      expect(engine.makeSANMove('Rae1')).toBe(true);

      const board = engine.getBoard();
      expect(board[7][4]?.type).toBe('rook');
      expect(board[7][0]).toBeNull();
      expect(board[7][7]?.type).toBe('rook'); // h1 rook still there
    });

    it('should handle disambiguation by rank', () => {
      engine.loadFEN('4k3/8/8/8/8/8/R7/R3K3 w - - 0 1');

      expect(engine.makeSANMove('R2e2')).toBe(true);

      const board = engine.getBoard();
      expect(board[6][4]?.type).toBe('rook');
    });

    it('should reject invalid SAN moves', () => {
      expect(engine.makeSANMove('e5')).toBe(false); // Pawn can't move 2 squares to e5
      expect(engine.makeSANMove('Nf3')).toBe(true);  // Valid
      expect(engine.makeSANMove('Nf3')).toBe(false); // Knight already there
    });
  });

  describe('PGN Import/Export', () => {
    it('should export a game to PGN format', () => {
      engine.makeSANMove('e4');
      engine.makeSANMove('e5');
      engine.makeSANMove('Nf3');
      engine.makeSANMove('Nc6');

      const pgn = engine.toPGN();

      expect(pgn).toContain('[Event');
      expect(pgn).toContain('1. e4 e5');
      expect(pgn).toContain('2. Nf3 Nc6');
      expect(pgn).toContain('*'); // Game in progress
    });

    it('should export with custom headers', () => {
      engine.makeSANMove('e4');

      const pgn = engine.toPGN({
        'White': 'Carlsen',
        'Black': 'Kasparov',
        'Event': 'World Championship'
      });

      expect(pgn).toContain('[White "Carlsen"]');
      expect(pgn).toContain('[Black "Kasparov"]');
      expect(pgn).toContain('[Event "World Championship"]');
    });

    it('should export checkmate result', () => {
      // Fool's mate
      engine.makeSANMove('f3');
      engine.makeSANMove('e5');
      engine.makeSANMove('g4');
      engine.makeSANMove('Qh4+');

      const pgn = engine.toPGN();
      expect(pgn).toContain('0-1'); // Black wins
    });

    it('should import a simple PGN game', () => {
      const pgn = `
[Event "Test"]
[White "Player1"]
[Black "Player2"]

1. e4 e5 2. Nf3 Nc6 3. Bc4 Bc5
`;

      expect(engine.loadPGN(pgn)).toBe(true);

      const board = engine.getBoard();
      expect(board[5][5]?.type).toBe('knight');  // Nf3 is at row 5 (8-3), col 5 (f)
      expect(board[4][2]?.type).toBe('bishop');  // Bc4 is at row 4 (8-4), col 2 (c)
      expect(board[4][2]?.color).toBe('white');  // Bc4 is white's bishop
    });

    it('should import PGN with move numbers embedded in moves', () => {
      const pgn = '1.e4 e5 2.Nf3 Nc6 3.Bb5';

      expect(engine.loadPGN(pgn)).toBe(true);

      const board = engine.getBoard();
      expect(board[3][1]?.type).toBe('bishop');  // Bb5
    });

    it('should import PGN and replay correctly', () => {
      const pgn = '1. e4 e5 2. Nf3 Nc6 3. Bc4 Bc5 4. Bxf7+';

      expect(engine.loadPGN(pgn)).toBe(true);

      const state = engine.getState();
      expect(state.isCheck).toBe(true);

      const board = engine.getBoard();
      expect(board[1][5]?.type).toBe('bishop');
      expect(board[1][5]?.color).toBe('white');
    });

    it('should handle PGN with game result', () => {
      const pgn = '1. e4 e5 2. Nf3 Nc6 1-0';

      expect(engine.loadPGN(pgn)).toBe(true);

      const history = engine.getMoveHistory();
      expect(history.length).toBe(4);
    });

    it('should import and re-export PGN maintaining moves', () => {
      const originalPgn = '1. e4 e5 2. Nf3 Nc6 3. Bc4 Nf6';

      engine.loadPGN(originalPgn);
      const exportedPgn = engine.toPGN();

      expect(exportedPgn).toContain('1. e4 e5');
      expect(exportedPgn).toContain('2. Nf3 Nc6');
      expect(exportedPgn).toContain('3. Bc4 Nf6');
    });

    it('should fail on invalid PGN moves', () => {
      const invalidPgn = '1. e4 e5 2. Nf9'; // Invalid square

      expect(engine.loadPGN(invalidPgn)).toBe(false);
    });

    it('should import a complete game (Scholar\'s Mate)', () => {
      const pgn = '1. e4 e5 2. Bc4 Nc6 3. Qh5 Nf6 4. Qxf7#';

      expect(engine.loadPGN(pgn)).toBe(true);

      const state = engine.getState();
      expect(state.isCheckmate).toBe(true);
      expect(engine.getGameStatus()).toContain('White wins');
    });
  });

  describe('Integration: FEN + SAN + PGN', () => {
    it('should load FEN, make SAN moves, and export to PGN', () => {
      // Start from a position after 1.e4 e5
      engine.loadFEN('rnbqkbnr/pppp1ppp/8/4p3/4P3/8/PPPP1PPP/RNBQKBNR w KQkq e6 0 2');

      engine.makeSANMove('Nf3');
      engine.makeSANMove('Nc6');

      const pgn = engine.toPGN();
      expect(pgn).toContain('1. Nf3 Nc6'); // Moves from the FEN position
    });

    it('should roundtrip: export to FEN and reimport', () => {
      engine.makeSANMove('e4');
      engine.makeSANMove('c5');
      engine.makeSANMove('Nf3');

      const fen = engine.toFEN();
      const newEngine = new ChessEngine();
      newEngine.loadFEN(fen);

      expect(newEngine.toFEN()).toBe(fen);
      expect(newEngine.getCurrentTurn()).toBe(engine.getCurrentTurn());
    });

    it('should roundtrip: export to PGN and reimport', () => {
      engine.makeSANMove('e4');
      engine.makeSANMove('e5');
      engine.makeSANMove('Nf3');
      engine.makeSANMove('Nc6');

      const pgn = engine.toPGN();
      const newEngine = new ChessEngine();
      newEngine.loadPGN(pgn);

      expect(newEngine.getMoveHistory().length).toBe(4);
      expect(newEngine.getCurrentTurn()).toBe('white');
    });
  });
});
