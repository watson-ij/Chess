import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SRSManager, ResponseQuality } from './SRSManager';
import { OpeningNode } from './OpeningNode';

describe('SRSManager', () => {
  const initialFEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';

  beforeEach(() => {
    // Reset Date.now() mock if needed
    vi.restoreAllMocks();
  });

  describe('review', () => {
    it('should update SRS data after perfect response', () => {
      const node = new OpeningNode(initialFEN);
      const now = Date.now();

      const srs = SRSManager.review(node, ResponseQuality.PERFECT);

      expect(srs.lastReviewed).toBeCloseTo(now, -2);
      expect(srs.totalReviews).toBe(1);
      expect(srs.correctCount).toBe(1);
      expect(srs.repetitions).toBe(1);
      expect(srs.interval).toBe(1); // First repetition
    });

    it('should increase ease factor on high quality response', () => {
      const node = new OpeningNode(initialFEN);
      const initialEase = node.srsData.easeFactor;

      SRSManager.review(node, ResponseQuality.PERFECT);

      expect(node.srsData.easeFactor).toBeGreaterThan(initialEase);
    });

    it('should decrease ease factor on low quality response', () => {
      const node = new OpeningNode(initialFEN);
      const initialEase = node.srsData.easeFactor;

      SRSManager.review(node, ResponseQuality.INCORRECT_BUT_FAMILIAR);

      expect(node.srsData.easeFactor).toBeLessThan(initialEase);
    });

    it('should enforce minimum ease factor of 1.3', () => {
      const node = new OpeningNode(initialFEN);
      node.srsData.easeFactor = 1.4;

      // Multiple bad responses
      SRSManager.review(node, ResponseQuality.COMPLETE_BLACKOUT);
      SRSManager.review(node, ResponseQuality.COMPLETE_BLACKOUT);
      SRSManager.review(node, ResponseQuality.COMPLETE_BLACKOUT);

      expect(node.srsData.easeFactor).toBeGreaterThanOrEqual(1.3);
    });

    it('should reset repetitions on incorrect response', () => {
      const node = new OpeningNode(initialFEN);

      // Build up some repetitions
      SRSManager.review(node, ResponseQuality.PERFECT);
      SRSManager.review(node, ResponseQuality.PERFECT);
      expect(node.srsData.repetitions).toBe(2);

      // Fail
      SRSManager.review(node, ResponseQuality.INCORRECT_BUT_FAMILIAR);

      expect(node.srsData.repetitions).toBe(0);
      expect(node.srsData.interval).toBe(1);
    });

    it('should follow SM-2 interval progression', () => {
      const node = new OpeningNode(initialFEN);

      // First review
      SRSManager.review(node, ResponseQuality.CORRECT_HESITATION);
      expect(node.srsData.interval).toBe(1);

      // Second review
      SRSManager.review(node, ResponseQuality.CORRECT_HESITATION);
      expect(node.srsData.interval).toBe(6);

      // Third review - should multiply by ease factor
      SRSManager.review(node, ResponseQuality.CORRECT_HESITATION);
      expect(node.srsData.interval).toBeGreaterThan(6);
    });

    it('should set next review date', () => {
      const node = new OpeningNode(initialFEN);
      const now = Date.now();

      SRSManager.review(node, ResponseQuality.PERFECT);

      expect(node.srsData.nextReview).toBeGreaterThan(now);

      // Should be about 1 day later (with some tolerance)
      const oneDayMs = 24 * 60 * 60 * 1000;
      const expectedNext = now + oneDayMs;
      expect(node.srsData.nextReview).toBeCloseTo(expectedNext, -5);
    });

    it('should track total reviews and correct count', () => {
      const node = new OpeningNode(initialFEN);

      SRSManager.review(node, ResponseQuality.PERFECT);
      SRSManager.review(node, ResponseQuality.CORRECT_HESITATION);
      SRSManager.review(node, ResponseQuality.INCORRECT_BUT_FAMILIAR);
      SRSManager.review(node, ResponseQuality.PERFECT);

      expect(node.srsData.totalReviews).toBe(4);
      expect(node.srsData.correctCount).toBe(3); // 3 correct responses
    });
  });

  describe('getDuePositions', () => {
    it('should return positions due for review', () => {
      const node1 = new OpeningNode('fen1', 'e4');
      const node2 = new OpeningNode('fen2', 'd4');
      const node3 = new OpeningNode('fen3', 'Nf3');

      node1.isKeyPosition = true;
      node2.isKeyPosition = true;
      node3.isKeyPosition = true;

      // node1: never reviewed (due)
      // node2: reviewed, not due yet
      node2.srsData.nextReview = Date.now() + 1000000;
      // node3: reviewed, overdue
      node3.srsData.nextReview = Date.now() - 1000000;

      const duePositions = SRSManager.getDuePositions([node1, node2, node3]);

      expect(duePositions).toHaveLength(2);
      expect(duePositions).toContain(node1);
      expect(duePositions).toContain(node3);
    });

    it('should exclude non-key positions', () => {
      const node1 = new OpeningNode('fen1', 'e4');
      const node2 = new OpeningNode('fen2', 'd4');

      node1.isKeyPosition = true;
      node2.isKeyPosition = false;

      const duePositions = SRSManager.getDuePositions([node1, node2]);

      expect(duePositions).toHaveLength(1);
      expect(duePositions[0]).toBe(node1);
    });

    it('should limit results to specified count', () => {
      const nodes = Array.from({ length: 10 }, (_, i) => {
        const node = new OpeningNode(`fen${i}`, `move${i}`);
        node.isKeyPosition = true;
        return node;
      });

      const duePositions = SRSManager.getDuePositions(nodes, 5);

      expect(duePositions).toHaveLength(5);
    });

    it('should prioritize never-reviewed positions', () => {
      const reviewed = new OpeningNode('fen1', 'e4');
      const neverReviewed = new OpeningNode('fen2', 'd4');

      reviewed.isKeyPosition = true;
      neverReviewed.isKeyPosition = true;

      reviewed.srsData.nextReview = Date.now() - 1000000;

      const duePositions = SRSManager.getDuePositions([reviewed, neverReviewed], 1);

      expect(duePositions[0]).toBe(neverReviewed);
    });

    it('should sort by most overdue when all reviewed', () => {
      const lessOverdue = new OpeningNode('fen1', 'e4');
      const moreOverdue = new OpeningNode('fen2', 'd4');

      lessOverdue.isKeyPosition = true;
      moreOverdue.isKeyPosition = true;

      lessOverdue.srsData.nextReview = Date.now() - 1000;
      moreOverdue.srsData.nextReview = Date.now() - 10000;

      const duePositions = SRSManager.getDuePositions([lessOverdue, moreOverdue], 1);

      expect(duePositions[0]).toBe(moreOverdue);
    });
  });

  describe('getStatistics', () => {
    it('should calculate statistics for an opening', () => {
      const root = new OpeningNode(initialFEN);
      const child1 = new OpeningNode('fen1', 'e4');
      const child2 = new OpeningNode('fen2', 'd4');

      root.addChild(child1);
      root.addChild(child2);

      child1.isKeyPosition = true;
      child2.isKeyPosition = true;

      const stats = SRSManager.getStatistics(root);

      expect(stats.totalPositions).toBe(3); // root + 2 children
      expect(stats.keyPositions).toBe(2);
      expect(stats.dueForReview).toBe(2); // Both never reviewed
    });

    it('should identify mastered positions', () => {
      const root = new OpeningNode(initialFEN);
      const mastered = new OpeningNode('fen1', 'e4');
      const notMastered = new OpeningNode('fen2', 'd4');

      root.addChild(mastered);
      root.addChild(notMastered);

      mastered.isKeyPosition = true;
      notMastered.isKeyPosition = true;

      // Mastered: ease >= 2.5 and interval >= 21 days
      mastered.srsData.easeFactor = 2.6;
      mastered.srsData.interval = 30;

      notMastered.srsData.easeFactor = 2.0;
      notMastered.srsData.interval = 5;

      const stats = SRSManager.getStatistics(root);

      expect(stats.masteredPositions).toBe(1);
    });

    it('should calculate average ease factor', () => {
      const root = new OpeningNode(initialFEN);
      const child1 = new OpeningNode('fen1', 'e4');
      const child2 = new OpeningNode('fen2', 'd4');

      root.addChild(child1);
      root.addChild(child2);

      child1.isKeyPosition = true;
      child2.isKeyPosition = true;

      child1.srsData.easeFactor = 2.0;
      child2.srsData.easeFactor = 3.0;

      const stats = SRSManager.getStatistics(root);

      expect(stats.averageEaseFactor).toBe(2.5); // (2.0 + 3.0) / 2
    });

    it('should calculate accuracy', () => {
      const root = new OpeningNode(initialFEN);
      const child = new OpeningNode('fen1', 'e4');

      root.addChild(child);
      child.isKeyPosition = true;

      child.srsData.totalReviews = 10;
      child.srsData.correctCount = 7;

      const stats = SRSManager.getStatistics(root);

      expect(stats.totalReviews).toBe(10);
      expect(stats.accuracy).toBe(0.7);
    });

    it('should handle no key positions', () => {
      const root = new OpeningNode(initialFEN);

      const stats = SRSManager.getStatistics(root);

      expect(stats.keyPositions).toBe(0);
      expect(stats.averageEaseFactor).toBe(2.5); // Default
      expect(stats.accuracy).toBe(0);
    });
  });

  describe('reset', () => {
    it('should reset SRS data to defaults', () => {
      const node = new OpeningNode(initialFEN);

      // Modify SRS data
      node.srsData.easeFactor = 3.0;
      node.srsData.interval = 30;
      node.srsData.repetitions = 5;
      node.srsData.lastReviewed = Date.now();
      node.srsData.nextReview = Date.now() + 1000000;
      node.srsData.totalReviews = 20;
      node.srsData.correctCount = 15;

      SRSManager.reset(node);

      expect(node.srsData).toEqual({
        easeFactor: 2.5,
        interval: 0,
        repetitions: 0,
        lastReviewed: null,
        nextReview: null,
        totalReviews: 0,
        correctCount: 0
      });
    });
  });

  describe('formatInterval', () => {
    it('should format 0 days as "New"', () => {
      expect(SRSManager.formatInterval(0)).toBe('New');
    });

    it('should format 1 day', () => {
      expect(SRSManager.formatInterval(1)).toBe('1 day');
    });

    it('should format days', () => {
      expect(SRSManager.formatInterval(5)).toBe('5 days');
    });

    it('should format months', () => {
      expect(SRSManager.formatInterval(60)).toBe('2 months');
    });

    it('should format years', () => {
      expect(SRSManager.formatInterval(400)).toBe('1 year');
      expect(SRSManager.formatInterval(800)).toBe('2 years');
    });
  });

  describe('formatNextReview', () => {
    it('should format null as "Not scheduled"', () => {
      expect(SRSManager.formatNextReview(null)).toBe('Not scheduled');
    });

    it('should format due now or today for current time', () => {
      const now = Date.now();
      const result = SRSManager.formatNextReview(now);
      // Could be "Due now" or "Due today" depending on rounding
      expect(['Due now', 'Due today']).toContain(result);
    });

    it('should format due today or tomorrow for near future', () => {
      const soon = Date.now() + 1000; // 1 second from now
      const result = SRSManager.formatNextReview(soon);
      // Could round to today or tomorrow
      expect(['Due today', 'Due tomorrow']).toContain(result);
    });

    it('should format due tomorrow', () => {
      const tomorrow = Date.now() + 24 * 60 * 60 * 1000;
      expect(SRSManager.formatNextReview(tomorrow)).toBe('Due tomorrow');
    });

    it('should format future days', () => {
      const future = Date.now() + 5 * 24 * 60 * 60 * 1000;
      expect(SRSManager.formatNextReview(future)).toBe('Due in 5 days');
    });

    it('should format overdue', () => {
      const past = Date.now() - 3 * 24 * 60 * 60 * 1000;
      expect(SRSManager.formatNextReview(past)).toBe('Overdue by 3 days');
    });
  });
});
