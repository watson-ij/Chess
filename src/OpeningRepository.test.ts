import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { OpeningRepository, OpeningColor } from './OpeningRepository';

describe('OpeningRepository', () => {
  let repository: OpeningRepository;

  // Mock localStorage
  const localStorageMock = (() => {
    let store: { [key: string]: string } = {};

    return {
      getItem: (key: string) => store[key] || null,
      setItem: (key: string, value: string) => {
        store[key] = value;
      },
      removeItem: (key: string) => {
        delete store[key];
      },
      clear: () => {
        store = {};
      }
    };
  })();

  beforeEach(() => {
    // Reset localStorage before each test
    localStorageMock.clear();
    global.localStorage = localStorageMock as any;

    repository = new OpeningRepository();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('createOpening', () => {
    it('should create a new opening with default values', () => {
      const opening = repository.createOpening('Italian Game', 'white');

      expect(opening.name).toBe('Italian Game');
      expect(opening.color).toBe('white');
      expect(opening.description).toBe('');
      expect(opening.tags).toEqual([]);
      expect(opening.id).toBeTruthy();
      expect(opening.createdAt).toBeTruthy();
      expect(opening.updatedAt).toBeTruthy();
      expect(opening.rootNode).toBeTruthy();
    });

    it('should create an opening with description and tags', () => {
      const opening = repository.createOpening(
        'Sicilian Defense',
        'black',
        'Sharp and aggressive',
        ['tactical', 'complex']
      );

      expect(opening.description).toBe('Sharp and aggressive');
      expect(opening.tags).toEqual(['tactical', 'complex']);
    });

    it('should save to localStorage', () => {
      repository.createOpening('Test Opening', 'both');

      const stored = JSON.parse(localStorage.getItem('chess_opening_repository')!);
      expect(stored.openings).toHaveLength(1);
      expect(stored.openings[0].name).toBe('Test Opening');
    });

    it('should generate unique IDs', () => {
      const opening1 = repository.createOpening('Opening 1', 'white');
      const opening2 = repository.createOpening('Opening 2', 'white');

      expect(opening1.id).not.toBe(opening2.id);
    });
  });

  describe('getOpening', () => {
    it('should retrieve an opening by ID', () => {
      const created = repository.createOpening('Test', 'white');
      const retrieved = repository.getOpening(created.id);

      expect(retrieved).toBeTruthy();
      expect(retrieved!.id).toBe(created.id);
      expect(retrieved!.name).toBe('Test');
    });

    it('should return null for non-existent ID', () => {
      const retrieved = repository.getOpening('non-existent-id');

      expect(retrieved).toBeNull();
    });
  });

  describe('getAllOpenings', () => {
    it('should return empty array when no openings', () => {
      const openings = repository.getAllOpenings();

      expect(openings).toEqual([]);
    });

    it('should return all openings', () => {
      repository.createOpening('Opening 1', 'white');
      repository.createOpening('Opening 2', 'black');
      repository.createOpening('Opening 3', 'both');

      const openings = repository.getAllOpenings();

      expect(openings).toHaveLength(3);
    });
  });

  describe('getOpeningsByColor', () => {
    beforeEach(() => {
      repository.createOpening('White Opening', 'white');
      repository.createOpening('Black Opening', 'black');
      repository.createOpening('Universal Opening', 'both');
    });

    it('should get white openings', () => {
      const openings = repository.getOpeningsByColor('white');

      expect(openings).toHaveLength(2); // white + both
      expect(openings.every(o => o.color === 'white' || o.color === 'both')).toBe(true);
    });

    it('should get black openings', () => {
      const openings = repository.getOpeningsByColor('black');

      expect(openings).toHaveLength(2); // black + both
      expect(openings.every(o => o.color === 'black' || o.color === 'both')).toBe(true);
    });

    it('should get both-color openings', () => {
      const openings = repository.getOpeningsByColor('both');

      expect(openings).toHaveLength(1);
      expect(openings[0].color).toBe('both');
    });
  });

  describe('updateOpening', () => {
    it('should update opening name', () => {
      const opening = repository.createOpening('Old Name', 'white');

      const success = repository.updateOpening(opening.id, { name: 'New Name' });

      expect(success).toBe(true);

      const updated = repository.getOpening(opening.id);
      expect(updated!.name).toBe('New Name');
    });

    it('should update description and tags', () => {
      const opening = repository.createOpening('Test', 'white');

      repository.updateOpening(opening.id, {
        description: 'New desc',
        tags: ['new', 'tags']
      });

      const updated = repository.getOpening(opening.id);
      expect(updated!.description).toBe('New desc');
      expect(updated!.tags).toEqual(['new', 'tags']);
    });

    it('should update updatedAt timestamp', () => {
      const opening = repository.createOpening('Test', 'white');
      const originalUpdatedAt = opening.updatedAt;

      // Wait a bit to ensure timestamp difference
      vi.useFakeTimers();
      vi.advanceTimersByTime(1000);

      repository.updateOpening(opening.id, { name: 'Updated' });

      const updated = repository.getOpening(opening.id);
      expect(updated!.updatedAt).toBeGreaterThan(originalUpdatedAt);

      vi.useRealTimers();
    });

    it('should return false for non-existent opening', () => {
      const success = repository.updateOpening('fake-id', { name: 'Test' });

      expect(success).toBe(false);
    });
  });

  describe('deleteOpening', () => {
    it('should delete an opening', () => {
      const opening = repository.createOpening('Test', 'white');

      const success = repository.deleteOpening(opening.id);

      expect(success).toBe(true);
      expect(repository.getOpening(opening.id)).toBeNull();
    });

    it('should return false for non-existent opening', () => {
      const success = repository.deleteOpening('fake-id');

      expect(success).toBe(false);
    });
  });

  describe('searchOpenings', () => {
    beforeEach(() => {
      repository.createOpening('Sicilian Defense', 'black', 'Sharp opening');
      repository.createOpening('Italian Game', 'white', 'Classical opening', ['classical']);
      repository.createOpening('French Defense', 'black');
    });

    it('should search by name', () => {
      const results = repository.searchOpenings('sicilian');

      expect(results).toHaveLength(1);
      expect(results[0].name).toBe('Sicilian Defense');
    });

    it('should search by description', () => {
      const results = repository.searchOpenings('sharp');

      expect(results).toHaveLength(1);
      expect(results[0].name).toBe('Sicilian Defense');
    });

    it('should search by tags', () => {
      const results = repository.searchOpenings('classical');

      expect(results).toHaveLength(1);
      expect(results[0].name).toBe('Italian Game');
    });

    it('should be case-insensitive', () => {
      const results = repository.searchOpenings('SICILIAN');

      expect(results).toHaveLength(1);
    });

    it('should return empty array for no matches', () => {
      const results = repository.searchOpenings('xyz123');

      expect(results).toEqual([]);
    });
  });

  describe('addMove', () => {
    it('should add a move to opening', () => {
      const opening = repository.createOpening('Test', 'white');
      const rootNode = opening.rootNode;

      const childNode = repository.addMove(opening, rootNode, 'e4', 'fen-after-e4');

      expect(rootNode.children).toHaveLength(1);
      expect(childNode.move).toBe('e4');
      expect(childNode.fen).toBe('fen-after-e4');
    });

    it('should add comment to move', () => {
      const opening = repository.createOpening('Test', 'white');

      const childNode = repository.addMove(
        opening,
        opening.rootNode,
        'e4',
        'fen',
        'Best by test'
      );

      expect(childNode.comment).toBe('Best by test');
    });

    it('should reuse existing move node', () => {
      const opening = repository.createOpening('Test', 'white');

      const first = repository.addMove(opening, opening.rootNode, 'e4', 'fen');
      const second = repository.addMove(opening, opening.rootNode, 'e4', 'fen');

      expect(first).toBe(second);
      expect(opening.rootNode.children).toHaveLength(1);
    });

    it('should update comment on existing node', () => {
      const opening = repository.createOpening('Test', 'white');

      repository.addMove(opening, opening.rootNode, 'e4', 'fen', 'First comment');
      repository.addMove(opening, opening.rootNode, 'e4', 'fen', 'Updated comment');

      const child = opening.rootNode.children[0];
      expect(child.comment).toBe('Updated comment');
    });
  });

  describe('markKeyPosition', () => {
    it('should mark position as key', () => {
      const opening = repository.createOpening('Test', 'white');
      const node = repository.addMove(opening, opening.rootNode, 'e4', 'fen');

      repository.markKeyPosition(opening, node, true);

      expect(node.isKeyPosition).toBe(true);
    });

    it('should unmark key position', () => {
      const opening = repository.createOpening('Test', 'white');
      const node = repository.addMove(opening, opening.rootNode, 'e4', 'fen');

      repository.markKeyPosition(opening, node, true);
      repository.markKeyPosition(opening, node, false);

      expect(node.isKeyPosition).toBe(false);
    });
  });

  describe('getKeyPositions', () => {
    it('should get all key positions', () => {
      const opening = repository.createOpening('Test', 'white');
      const child1 = repository.addMove(opening, opening.rootNode, 'e4', 'fen1');
      const child2 = repository.addMove(opening, opening.rootNode, 'd4', 'fen2');

      repository.markKeyPosition(opening, child1, true);

      const keyPositions = repository.getKeyPositions(opening);

      expect(keyPositions).toHaveLength(1);
      expect(keyPositions[0]).toBe(child1);
    });

    it('should return empty array when no key positions', () => {
      const opening = repository.createOpening('Test', 'white');

      const keyPositions = repository.getKeyPositions(opening);

      expect(keyPositions).toEqual([]);
    });
  });

  describe('persistence', () => {
    it('should load openings from localStorage', () => {
      // Create and save an opening
      const opening = repository.createOpening('Test', 'white');

      // Create a new repository instance (simulating page reload)
      const newRepository = new OpeningRepository();

      const loaded = newRepository.getOpening(opening.id);
      expect(loaded).toBeTruthy();
      expect(loaded!.name).toBe('Test');
    });

    it('should preserve opening tree structure', () => {
      const opening = repository.createOpening('Test', 'white');
      repository.addMove(opening, opening.rootNode, 'e4', 'fen1');

      const newRepository = new OpeningRepository();
      const loaded = newRepository.getOpening(opening.id);

      expect(loaded!.rootNode.children).toHaveLength(1);
      expect(loaded!.rootNode.children[0].move).toBe('e4');
    });
  });

  describe('export/import JSON', () => {
    beforeEach(() => {
      repository.createOpening('Opening 1', 'white', 'Test 1');
      repository.createOpening('Opening 2', 'black', 'Test 2');
    });

    it('should export to JSON', () => {
      const json = repository.exportToJSON();
      const data = JSON.parse(json);

      expect(data.version).toBe('1.0');
      expect(data.exportDate).toBeTruthy();
      expect(data.openings).toHaveLength(2);
    });

    it('should import from JSON', () => {
      const exported = repository.exportToJSON();

      // Clear and re-import
      repository.clearAll();
      expect(repository.getAllOpenings()).toHaveLength(0);

      const result = repository.importFromJSON(exported);

      expect(result.success).toBe(true);
      expect(result.count).toBe(2);
      expect(repository.getAllOpenings()).toHaveLength(2);
    });

    it('should handle invalid JSON', () => {
      const result = repository.importFromJSON('invalid json');

      expect(result.success).toBe(false);
      expect(result.errors).toHaveLength(1);
    });

    it('should generate new IDs on import', () => {
      // Clear existing openings first
      repository.clearAll();

      const opening1 = repository.createOpening('Test', 'white');
      const exported = repository.exportToJSON();

      const result = repository.importFromJSON(exported);

      expect(result.success).toBe(true);

      const openings = repository.getAllOpenings();
      // After import, we should have 2 openings total (original + imported)
      expect(openings).toHaveLength(2);

      const importedOpening = openings.find(o => o.id !== opening1.id);
      expect(importedOpening).toBeTruthy();
      expect(importedOpening!.name).toBe('Test');
      expect(importedOpening!.id).not.toBe(opening1.id);
    });
  });

  describe('importFromPGN', () => {
    it('should import opening from PGN', () => {
      const pgn = '1. e4 e5 2. Nf3 Nc6 3. Bc4';

      const result = repository.importFromPGN(pgn, 'Italian Game', 'white');

      expect(result.success).toBe(true);
      expect(result.opening).toBeTruthy();
      expect(result.opening!.name).toBe('Italian Game');
    });

    it('should build move tree from PGN', () => {
      const pgn = '1. e4 e5 2. Nf3';

      const result = repository.importFromPGN(pgn, 'Test', 'white');

      const opening = result.opening!;
      expect(opening.rootNode.children).toHaveLength(1);

      const e4Node = opening.rootNode.children[0];
      expect(e4Node.move).toBe('e4');
      expect(e4Node.children).toHaveLength(1);

      const e5Node = e4Node.children[0];
      expect(e5Node.move).toBe('e5');
    });

    it('should handle invalid PGN', () => {
      const result = repository.importFromPGN('invalid pgn', 'Test', 'white');

      expect(result.success).toBe(false);
      expect(result.error).toBeTruthy();
    });
  });

  describe('exportToPGN', () => {
    it('should export opening to PGN', () => {
      const opening = repository.createOpening('Italian Game', 'white');
      repository.addMove(opening, opening.rootNode, 'e4', 'fen1');
      const e4Node = opening.rootNode.children[0];
      repository.addMove(opening, e4Node, 'e5', 'fen2');

      const pgn = repository.exportToPGN(opening);

      expect(pgn).toContain('[Event "Italian Game"]');
      expect(pgn).toContain('1. e4 e5');
    });

    it('should export without headers', () => {
      const opening = repository.createOpening('Test', 'white');
      repository.addMove(opening, opening.rootNode, 'e4', 'fen');

      const pgn = repository.exportToPGN(opening, false);

      expect(pgn).not.toContain('[Event');
      expect(pgn).toContain('1. e4');
    });
  });

  describe('getGlobalStatistics', () => {
    it('should calculate global statistics', () => {
      const opening1 = repository.createOpening('Opening 1', 'white');
      const opening2 = repository.createOpening('Opening 2', 'black');

      repository.addMove(opening1, opening1.rootNode, 'e4', 'fen1');
      repository.addMove(opening2, opening2.rootNode, 'd4', 'fen2');

      const stats = repository.getGlobalStatistics();

      expect(stats.totalOpenings).toBe(2);
      expect(stats.totalPositions).toBe(4); // 2 roots + 2 children
    });
  });

  describe('clearAll', () => {
    it('should clear all openings', () => {
      repository.createOpening('Opening 1', 'white');
      repository.createOpening('Opening 2', 'black');

      repository.clearAll();

      expect(repository.getAllOpenings()).toEqual([]);
    });
  });
});
