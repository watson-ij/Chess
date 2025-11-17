import { describe, it, expect, beforeEach } from 'vitest';
import { OpeningNode } from './OpeningNode';

describe('OpeningNode', () => {
  const initialFEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';

  describe('constructor', () => {
    it('should create a root node with no move', () => {
      const node = new OpeningNode(initialFEN);

      expect(node.move).toBeNull();
      expect(node.fen).toBe(initialFEN);
      expect(node.comment).toBe('');
      expect(node.children).toEqual([]);
      expect(node.isKeyPosition).toBe(false);
      expect(node.tags).toEqual([]);
    });

    it('should create a node with move and comment', () => {
      const node = new OpeningNode(initialFEN, 'e4', 'King pawn opening');

      expect(node.move).toBe('e4');
      expect(node.comment).toBe('King pawn opening');
    });

    it('should initialize SRS data with default values', () => {
      const node = new OpeningNode(initialFEN);

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

  describe('addChild', () => {
    it('should add a child node', () => {
      const root = new OpeningNode(initialFEN);
      const child = new OpeningNode('fen-after-e4', 'e4');

      root.addChild(child);

      expect(root.children).toHaveLength(1);
      expect(root.children[0]).toBe(child);
    });

    it('should add multiple children', () => {
      const root = new OpeningNode(initialFEN);
      const child1 = new OpeningNode('fen1', 'e4');
      const child2 = new OpeningNode('fen2', 'd4');

      root.addChild(child1);
      root.addChild(child2);

      expect(root.children).toHaveLength(2);
      expect(root.children[0]).toBe(child1);
      expect(root.children[1]).toBe(child2);
    });
  });

  describe('findChild', () => {
    it('should find a child by move', () => {
      const root = new OpeningNode(initialFEN);
      const child1 = new OpeningNode('fen1', 'e4');
      const child2 = new OpeningNode('fen2', 'd4');

      root.addChild(child1);
      root.addChild(child2);

      expect(root.findChild('e4')).toBe(child1);
      expect(root.findChild('d4')).toBe(child2);
    });

    it('should return null if child not found', () => {
      const root = new OpeningNode(initialFEN);

      expect(root.findChild('e4')).toBeNull();
    });
  });

  describe('getMoves', () => {
    it('should return all available moves', () => {
      const root = new OpeningNode(initialFEN);
      root.addChild(new OpeningNode('fen1', 'e4'));
      root.addChild(new OpeningNode('fen2', 'd4'));
      root.addChild(new OpeningNode('fen3', 'Nf3'));

      const moves = root.getMoves();

      expect(moves).toEqual(['e4', 'd4', 'Nf3']);
    });

    it('should return empty array for leaf node', () => {
      const node = new OpeningNode(initialFEN);

      expect(node.getMoves()).toEqual([]);
    });
  });

  describe('isDueForReview', () => {
    it('should return true if never reviewed', () => {
      const node = new OpeningNode(initialFEN);

      expect(node.isDueForReview()).toBe(true);
    });

    it('should return true if review date has passed', () => {
      const node = new OpeningNode(initialFEN);
      const yesterday = Date.now() - 24 * 60 * 60 * 1000;
      node.srsData.nextReview = yesterday;

      expect(node.isDueForReview()).toBe(true);
    });

    it('should return false if review date is in the future', () => {
      const node = new OpeningNode(initialFEN);
      const tomorrow = Date.now() + 24 * 60 * 60 * 1000;
      node.srsData.nextReview = tomorrow;

      expect(node.isDueForReview()).toBe(false);
    });
  });

  describe('countPositions', () => {
    it('should count a single node', () => {
      const node = new OpeningNode(initialFEN);

      expect(node.countPositions()).toBe(1);
    });

    it('should count all positions in tree', () => {
      const root = new OpeningNode(initialFEN);
      const child1 = new OpeningNode('fen1', 'e4');
      const child2 = new OpeningNode('fen2', 'd4');
      const grandchild = new OpeningNode('fen3', 'e5');

      root.addChild(child1);
      root.addChild(child2);
      child1.addChild(grandchild);

      // root + 2 children + 1 grandchild = 4
      expect(root.countPositions()).toBe(4);
    });
  });

  describe('getLeafNodes', () => {
    it('should return self if no children', () => {
      const node = new OpeningNode(initialFEN);

      const leaves = node.getLeafNodes();

      expect(leaves).toHaveLength(1);
      expect(leaves[0]).toBe(node);
    });

    it('should return all leaf nodes', () => {
      const root = new OpeningNode(initialFEN);
      const child1 = new OpeningNode('fen1', 'e4');
      const child2 = new OpeningNode('fen2', 'd4');
      const grandchild1 = new OpeningNode('fen3', 'e5');
      const grandchild2 = new OpeningNode('fen4', 'd5');

      root.addChild(child1);
      root.addChild(child2);
      child1.addChild(grandchild1);
      child1.addChild(grandchild2);

      const leaves = root.getLeafNodes();

      // d4 branch (child2), e4-e5 branch (grandchild1), e4-d5 branch (grandchild2)
      expect(leaves).toHaveLength(3);
      expect(leaves).toContain(child2);
      expect(leaves).toContain(grandchild1);
      expect(leaves).toContain(grandchild2);
    });
  });

  describe('getDueNodes', () => {
    it('should return only key positions that are due', () => {
      const root = new OpeningNode(initialFEN);
      const child1 = new OpeningNode('fen1', 'e4');
      const child2 = new OpeningNode('fen2', 'd4');

      root.addChild(child1);
      root.addChild(child2);

      // Mark child1 as key position
      child1.isKeyPosition = true;

      const dueNodes = root.getDueNodes();

      expect(dueNodes).toHaveLength(1);
      expect(dueNodes[0]).toBe(child1);
    });

    it('should exclude nodes not due for review', () => {
      const root = new OpeningNode(initialFEN);
      const child1 = new OpeningNode('fen1', 'e4');
      const child2 = new OpeningNode('fen2', 'd4');

      root.addChild(child1);
      root.addChild(child2);

      child1.isKeyPosition = true;
      child2.isKeyPosition = true;

      // Set child1 to future review
      child1.srsData.nextReview = Date.now() + 24 * 60 * 60 * 1000;

      const dueNodes = root.getDueNodes();

      expect(dueNodes).toHaveLength(1);
      expect(dueNodes[0]).toBe(child2);
    });

    it('should exclude non-key positions', () => {
      const root = new OpeningNode(initialFEN);
      const child = new OpeningNode('fen1', 'e4');

      root.addChild(child);
      child.isKeyPosition = false;

      const dueNodes = root.getDueNodes();

      expect(dueNodes).toHaveLength(0);
    });
  });

  describe('serialization', () => {
    it('should serialize to JSON', () => {
      const node = new OpeningNode(initialFEN, 'e4', 'Test comment');
      node.isKeyPosition = true;
      node.tags = ['tactical', 'sharp'];

      const json = node.toJSON();

      expect(json).toEqual({
        move: 'e4',
        fen: initialFEN,
        comment: 'Test comment',
        isKeyPosition: true,
        tags: ['tactical', 'sharp'],
        srsData: {
          easeFactor: 2.5,
          interval: 0,
          repetitions: 0,
          lastReviewed: null,
          nextReview: null,
          totalReviews: 0,
          correctCount: 0
        },
        children: []
      });
    });

    it('should serialize tree structure', () => {
      const root = new OpeningNode(initialFEN);
      const child = new OpeningNode('fen1', 'e4');
      root.addChild(child);

      const json = root.toJSON();

      expect(json.children).toHaveLength(1);
      expect(json.children[0].move).toBe('e4');
    });

    it('should deserialize from JSON', () => {
      const data = {
        move: 'e4',
        fen: initialFEN,
        comment: 'Test',
        isKeyPosition: true,
        tags: ['test'],
        srsData: {
          easeFactor: 2.0,
          interval: 5,
          repetitions: 2,
          lastReviewed: 123456,
          nextReview: 789012,
          totalReviews: 10,
          correctCount: 8
        },
        children: [
          {
            move: 'e5',
            fen: 'fen2',
            comment: '',
            isKeyPosition: false,
            tags: [],
            srsData: {
              easeFactor: 2.5,
              interval: 0,
              repetitions: 0,
              lastReviewed: null,
              nextReview: null,
              totalReviews: 0,
              correctCount: 0
            },
            children: []
          }
        ]
      };

      const node = OpeningNode.fromJSON(data);

      expect(node.move).toBe('e4');
      expect(node.fen).toBe(initialFEN);
      expect(node.comment).toBe('Test');
      expect(node.isKeyPosition).toBe(true);
      expect(node.tags).toEqual(['test']);
      expect(node.srsData.easeFactor).toBe(2.0);
      expect(node.srsData.interval).toBe(5);
      expect(node.children).toHaveLength(1);
      expect(node.children[0].move).toBe('e5');
    });

    it('should handle missing fields in deserialization', () => {
      const data = {
        move: 'e4',
        fen: initialFEN
      };

      const node = OpeningNode.fromJSON(data);

      expect(node.comment).toBe('');
      expect(node.isKeyPosition).toBe(false);
      expect(node.tags).toEqual([]);
      expect(node.children).toEqual([]);
    });
  });
});
