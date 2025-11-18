import { describe, it, expect, beforeEach, vi } from 'vitest';
import { StockfishAI } from './StockfishAI';

describe('StockfishAI', () => {
  describe('UCI Move Parsing', () => {
    it('should parse UCI move from e2 to e4', () => {
      const result = StockfishAI.parseUCIMove('e2e4');

      expect(result.from).toEqual({ row: 6, col: 4 }); // e2
      expect(result.to).toEqual({ row: 4, col: 4 });   // e4
    });

    it('should parse UCI move from a1 to h8', () => {
      const result = StockfishAI.parseUCIMove('a1h8');

      expect(result.from).toEqual({ row: 7, col: 0 }); // a1
      expect(result.to).toEqual({ row: 0, col: 7 });   // h8
    });

    it('should parse UCI move from d7 to d8 (promotion)', () => {
      const result = StockfishAI.parseUCIMove('d7d8q');

      expect(result.from).toEqual({ row: 1, col: 3 }); // d7
      expect(result.to).toEqual({ row: 0, col: 3 });   // d8
    });

    it('should handle castling kingside (e1g1)', () => {
      const result = StockfishAI.parseUCIMove('e1g1');

      expect(result.from).toEqual({ row: 7, col: 4 }); // e1
      expect(result.to).toEqual({ row: 7, col: 6 });   // g1
    });

    it('should handle castling queenside (e1c1)', () => {
      const result = StockfishAI.parseUCIMove('e1c1');

      expect(result.from).toEqual({ row: 7, col: 4 }); // e1
      expect(result.to).toEqual({ row: 7, col: 2 });   // c1
    });
  });

  describe('UCI Move Generation', () => {
    it('should convert position to UCI format for e2e4', () => {
      const from = { row: 6, col: 4 }; // e2
      const to = { row: 4, col: 4 };   // e4

      const uci = StockfishAI.toUCIMove(from, to);

      expect(uci).toBe('e2e4');
    });

    it('should convert position to UCI format for a1h8', () => {
      const from = { row: 7, col: 0 }; // a1
      const to = { row: 0, col: 7 };   // h8

      const uci = StockfishAI.toUCIMove(from, to);

      expect(uci).toBe('a1h8');
    });

    it('should handle all board corners', () => {
      const corners = [
        { from: { row: 0, col: 0 }, to: { row: 7, col: 7 }, expected: 'a8h1' },
        { from: { row: 0, col: 7 }, to: { row: 7, col: 0 }, expected: 'h8a1' },
        { from: { row: 7, col: 0 }, to: { row: 0, col: 7 }, expected: 'a1h8' },
        { from: { row: 7, col: 7 }, to: { row: 0, col: 0 }, expected: 'h1a8' },
      ];

      corners.forEach(({ from, to, expected }) => {
        expect(StockfishAI.toUCIMove(from, to)).toBe(expected);
      });
    });
  });

  describe('UCI Move Roundtrip', () => {
    it('should successfully roundtrip parse and generate', () => {
      const originalUCI = 'e2e4';
      const parsed = StockfishAI.parseUCIMove(originalUCI);
      const regenerated = StockfishAI.toUCIMove(parsed.from, parsed.to);

      expect(regenerated).toBe(originalUCI);
    });

    it('should handle all standard opening moves', () => {
      const standardMoves = ['e2e4', 'd2d4', 'c2c4', 'g1f3', 'b1c3'];

      standardMoves.forEach(move => {
        const parsed = StockfishAI.parseUCIMove(move);
        const regenerated = StockfishAI.toUCIMove(parsed.from, parsed.to);
        expect(regenerated).toBe(move);
      });
    });
  });

  describe('Skill Level Configuration', () => {
    let ai: StockfishAI;
    let mockWorker: any;
    let postMessageSpy: any;

    beforeEach(() => {
      // Mock Worker
      mockWorker = {
        postMessage: vi.fn(),
        onmessage: null,
        onerror: null,
        terminate: vi.fn(),
      };

      postMessageSpy = mockWorker.postMessage;

      // Mock global Worker constructor
      (global as any).Worker = vi.fn(() => mockWorker);

      // Mock import.meta.env
      vi.stubGlobal('import', {
        meta: {
          env: {
            BASE_URL: '/'
          }
        }
      });

      ai = new StockfishAI();

      // Simulate UCI initialization
      if (mockWorker.onmessage) {
        mockWorker.onmessage({ data: 'uciok' });
      }
    });

    it('should set skill level within valid range (0-20)', () => {
      ai.setSkillLevel(15);

      const calls = postMessageSpy.mock.calls.map((call: any[]) => call[0]);
      expect(calls.some((call: string) => call.includes('Skill Level value 15'))).toBe(true);
    });

    it('should clamp skill level to minimum 0', () => {
      ai.setSkillLevel(-5);

      const calls = postMessageSpy.mock.calls.map((call: any[]) => call[0]);
      expect(calls.some((call: string) => call.includes('Skill Level value 0'))).toBe(true);
    });

    it('should clamp skill level to maximum 20', () => {
      ai.setSkillLevel(25);

      const calls = postMessageSpy.mock.calls.map((call: any[]) => call[0]);
      expect(calls.some((call: string) => call.includes('Skill Level value 20'))).toBe(true);
    });

    it('should configure additional randomness for lower skill levels', () => {
      ai.setSkillLevel(5);

      const calls = postMessageSpy.mock.calls.map((call: any[]) => call[0]);
      expect(calls.some((call: string) => call.includes('Maximum Error'))).toBe(true);
      expect(calls.some((call: string) => call.includes('Probability'))).toBe(true);
    });
  });

  describe('Position Validation', () => {
    it('should correctly map chess board coordinates', () => {
      // Test that row 0 = rank 8, row 7 = rank 1
      const a8 = { row: 0, col: 0 };
      const a1 = { row: 7, col: 0 };
      const h8 = { row: 0, col: 7 };
      const h1 = { row: 7, col: 7 };

      expect(StockfishAI.toUCIMove(a8, a1)).toBe('a8a1');
      expect(StockfishAI.toUCIMove(h8, h1)).toBe('h8h1');
    });

    it('should handle middle board positions', () => {
      // e4 is row 4, col 4
      const e4 = { row: 4, col: 4 };
      // d5 is row 3, col 3
      const d5 = { row: 3, col: 3 };

      expect(StockfishAI.toUCIMove(e4, d5)).toBe('e4d5');
    });
  });

  describe('Edge Cases', () => {
    it('should handle same square move (invalid but parseable)', () => {
      const result = StockfishAI.parseUCIMove('e4e4');

      expect(result.from).toEqual(result.to);
    });

    it('should parse moves with promotion suffix', () => {
      // Promotion moves have an extra character (q, r, b, n)
      const result = StockfishAI.parseUCIMove('e7e8q');

      expect(result.from).toEqual({ row: 1, col: 4 });
      expect(result.to).toEqual({ row: 0, col: 4 });
    });
  });

  describe('Worker Lifecycle', () => {
    it('should create worker on initialization', () => {
      const mockWorker = {
        postMessage: vi.fn(),
        onmessage: null,
        onerror: null,
        terminate: vi.fn(),
      };

      (global as any).Worker = vi.fn(() => mockWorker);

      const ai = new StockfishAI();

      expect((global as any).Worker).toHaveBeenCalled();
    });

    it('should terminate worker on destroy', () => {
      const mockWorker = {
        postMessage: vi.fn(),
        onmessage: null,
        onerror: null,
        terminate: vi.fn(),
      };

      (global as any).Worker = vi.fn(() => mockWorker);

      const ai = new StockfishAI();

      // Simulate ready
      if (mockWorker.onmessage) {
        mockWorker.onmessage({ data: 'uciok' });
      }

      ai.destroy();

      expect(mockWorker.terminate).toHaveBeenCalled();
    });
  });
});
