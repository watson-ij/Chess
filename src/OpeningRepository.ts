import { OpeningNode } from './OpeningNode';
import { ChessEngine } from './ChessEngine';

export type OpeningColor = 'white' | 'black' | 'both';

/**
 * Represents a collection of opening variations
 */
export interface Opening {
  id: string;
  name: string;
  description: string;
  color: OpeningColor;
  rootNode: OpeningNode;
  createdAt: number;
  updatedAt: number;
  tags: string[];
}

/**
 * Manages multiple opening repositories
 */
export class OpeningRepository {
  private openings: Map<string, Opening>;
  private static readonly STORAGE_KEY = 'chess_opening_repository';

  constructor() {
    this.openings = new Map();
    this.load();
  }

  /**
   * Create a new opening
   */
  createOpening(
    name: string,
    color: OpeningColor,
    description: string = '',
    tags: string[] = []
  ): Opening {
    const id = this.generateId();
    const initialFEN = this.getInitialFEN();

    const opening: Opening = {
      id,
      name,
      description,
      color,
      rootNode: new OpeningNode(initialFEN, null, 'Starting position'),
      createdAt: Date.now(),
      updatedAt: Date.now(),
      tags
    };

    this.openings.set(id, opening);
    this.save();
    return opening;
  }

  /**
   * Get an opening by ID
   */
  getOpening(id: string): Opening | null {
    return this.openings.get(id) || null;
  }

  /**
   * Get all openings
   */
  getAllOpenings(): Opening[] {
    return Array.from(this.openings.values());
  }

  /**
   * Get openings filtered by color
   */
  getOpeningsByColor(color: OpeningColor): Opening[] {
    return this.getAllOpenings().filter(
      opening => opening.color === color || opening.color === 'both'
    );
  }

  /**
   * Update an opening
   */
  updateOpening(id: string, updates: Partial<Opening>): boolean {
    const opening = this.openings.get(id);
    if (!opening) return false;

    // Update fields
    if (updates.name !== undefined) opening.name = updates.name;
    if (updates.description !== undefined) opening.description = updates.description;
    if (updates.color !== undefined) opening.color = updates.color;
    if (updates.tags !== undefined) opening.tags = updates.tags;
    if (updates.rootNode !== undefined) opening.rootNode = updates.rootNode;

    opening.updatedAt = Date.now();

    this.save();
    return true;
  }

  /**
   * Delete an opening
   */
  deleteOpening(id: string): boolean {
    const deleted = this.openings.delete(id);
    if (deleted) {
      this.save();
    }
    return deleted;
  }

  /**
   * Search openings by name or tags
   */
  searchOpenings(query: string): Opening[] {
    const lowerQuery = query.toLowerCase();
    return this.getAllOpenings().filter(opening =>
      opening.name.toLowerCase().includes(lowerQuery) ||
      opening.description.toLowerCase().includes(lowerQuery) ||
      opening.tags.some(tag => tag.toLowerCase().includes(lowerQuery))
    );
  }

  /**
   * Add a move to an opening variation
   */
  addMove(
    opening: Opening,
    parentNode: OpeningNode,
    move: string,
    fen: string,
    comment: string = ''
  ): OpeningNode {
    // Check if this move already exists
    let childNode = parentNode.findChild(move);

    if (!childNode) {
      // Create new node
      childNode = new OpeningNode(fen, move, comment);
      parentNode.addChild(childNode);
    } else if (comment) {
      // Update existing node's comment
      childNode.comment = comment;
    }

    opening.updatedAt = Date.now();
    this.save();

    return childNode;
  }

  /**
   * Mark a position as a key position for practice
   */
  markKeyPosition(opening: Opening, node: OpeningNode, isKey: boolean): void {
    node.isKeyPosition = isKey;
    opening.updatedAt = Date.now();
    this.save();
  }

  /**
   * Get all key positions from an opening
   */
  getKeyPositions(opening: Opening): OpeningNode[] {
    const keyPositions: OpeningNode[] = [];

    const traverse = (node: OpeningNode) => {
      if (node.isKeyPosition) {
        keyPositions.push(node);
      }
      node.children.forEach(traverse);
    };

    traverse(opening.rootNode);
    return keyPositions;
  }

  /**
   * Save to localStorage
   */
  save(): void {
    const data = {
      openings: Array.from(this.openings.entries()).map(([id, opening]) => ({
        id,
        name: opening.name,
        description: opening.description,
        color: opening.color,
        createdAt: opening.createdAt,
        updatedAt: opening.updatedAt,
        tags: opening.tags,
        rootNode: opening.rootNode.toJSON()
      }))
    };

    try {
      localStorage.setItem(OpeningRepository.STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
      console.error('Failed to save opening repository:', error);
    }
  }

  /**
   * Load from localStorage
   */
  private load(): void {
    try {
      const data = localStorage.getItem(OpeningRepository.STORAGE_KEY);
      if (!data) return;

      const parsed = JSON.parse(data);
      if (parsed.openings) {
        parsed.openings.forEach((item: any) => {
          const opening: Opening = {
            id: item.id,
            name: item.name,
            description: item.description || '',
            color: item.color,
            rootNode: OpeningNode.fromJSON(item.rootNode),
            createdAt: item.createdAt,
            updatedAt: item.updatedAt,
            tags: item.tags || []
          };
          this.openings.set(opening.id, opening);
        });
      }
    } catch (error) {
      console.error('Failed to load opening repository:', error);
    }
  }

  /**
   * Generate a unique ID
   */
  private generateId(): string {
    return `opening_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get initial position FEN
   */
  private getInitialFEN(): string {
    const engine = new ChessEngine();
    return engine.toFEN();
  }

  /**
   * Export all openings to JSON
   */
  exportToJSON(): string {
    const data = {
      version: '1.0',
      exportDate: new Date().toISOString(),
      openings: Array.from(this.openings.values()).map(opening => ({
        id: opening.id,
        name: opening.name,
        description: opening.description,
        color: opening.color,
        createdAt: opening.createdAt,
        updatedAt: opening.updatedAt,
        tags: opening.tags,
        rootNode: opening.rootNode.toJSON()
      }))
    };

    return JSON.stringify(data, null, 2);
  }

  /**
   * Import openings from JSON
   */
  importFromJSON(jsonString: string): { success: boolean; count: number; errors: string[] } {
    const errors: string[] = [];
    let count = 0;

    try {
      const data = JSON.parse(jsonString);

      if (!data.openings || !Array.isArray(data.openings)) {
        throw new Error('Invalid format: missing openings array');
      }

      data.openings.forEach((item: any, index: number) => {
        try {
          // Generate new ID to avoid conflicts
          const newId = this.generateId();

          const opening: Opening = {
            id: newId,
            name: item.name || `Imported Opening ${index + 1}`,
            description: item.description || '',
            color: item.color || 'both',
            rootNode: OpeningNode.fromJSON(item.rootNode),
            createdAt: item.createdAt || Date.now(),
            updatedAt: Date.now(),
            tags: item.tags || []
          };

          this.openings.set(opening.id, opening);
          count++;
        } catch (error) {
          errors.push(`Opening ${index + 1}: ${(error as Error).message}`);
        }
      });

      this.save();

      return { success: errors.length === 0, count, errors };
    } catch (error) {
      return {
        success: false,
        count: 0,
        errors: [`Failed to parse JSON: ${(error as Error).message}`]
      };
    }
  }

  /**
   * Import an opening from PGN
   * Creates a new opening from a PGN string
   */
  importFromPGN(
    pgnString: string,
    name: string,
    color: OpeningColor,
    description: string = '',
    tags: string[] = []
  ): { success: boolean; opening?: Opening; error?: string } {
    try {
      const engine = new ChessEngine();

      // Parse PGN to get the moves
      if (!engine.loadPGN(pgnString)) {
        return { success: false, error: 'Failed to parse PGN' };
      }

      // Create the opening
      const opening = this.createOpening(name, color, description, tags);

      // Build the opening tree from the move history
      let currentNode = opening.rootNode;
      const moveHistory = engine.getMoveHistory();

      // Reset engine to play through moves and capture FEN after each move
      const replayEngine = new ChessEngine();

      for (const move of moveHistory) {
        // Make the move
        replayEngine.makeMove(move.from, move.to, move.promotionPiece);

        // Get the FEN after this move
        const fen = replayEngine.toFEN();

        // Add to tree (using SAN notation from the move)
        const moveNotation = move.notation || '';
        currentNode = this.addMove(opening, currentNode, moveNotation, fen);
      }

      return { success: true, opening };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  }

  /**
   * Export an opening to PGN
   * Returns a PGN string representing the main line of the opening
   */
  exportToPGN(opening: Opening, includeHeaders: boolean = true): string {
    // Traverse the tree to get the main line (follow first child)
    const moves: string[] = [];
    let currentNode: OpeningNode | null = opening.rootNode;

    while (currentNode && currentNode.children.length > 0) {
      currentNode = currentNode.children[0];
      if (currentNode.move) {
        moves.push(currentNode.move);
      }
    }

    let pgn = '';

    if (includeHeaders) {
      // Add PGN headers
      pgn += `[Event "${opening.name}"]\n`;
      pgn += `[Site "Opening Repository"]\n`;
      pgn += `[Date "${new Date(opening.createdAt).toISOString().split('T')[0].replace(/-/g, '.')}"]\n`;
      pgn += `[Round "?"]\n`;
      pgn += `[White "${opening.color === 'white' || opening.color === 'both' ? 'Opening' : '?'}"]\n`;
      pgn += `[Black "${opening.color === 'black' || opening.color === 'both' ? 'Opening' : '?'}"]\n`;
      pgn += `[Result "*"]\n`;
      if (opening.description) {
        pgn += `[Opening "${opening.description}"]\n`;
      }
      pgn += '\n';
    }

    // Add moves in PGN format
    for (let i = 0; i < moves.length; i++) {
      if (i % 2 === 0) {
        pgn += `${Math.floor(i / 2) + 1}. `;
      }
      pgn += moves[i] + ' ';

      // Line break every 8 moves for readability
      if (i % 8 === 7) {
        pgn += '\n';
      }
    }

    pgn += '*';

    return pgn.trim();
  }

  /**
   * Clear all openings (use with caution!)
   */
  clearAll(): void {
    this.openings.clear();
    this.save();
  }

  /**
   * Get statistics across all openings
   */
  getGlobalStatistics(): {
    totalOpenings: number;
    totalPositions: number;
    totalKeyPositions: number;
    dueForReview: number;
  } {
    let totalPositions = 0;
    let totalKeyPositions = 0;
    let dueForReview = 0;

    this.getAllOpenings().forEach(opening => {
      totalPositions += opening.rootNode.countPositions();
      const keyPositions = this.getKeyPositions(opening);
      totalKeyPositions += keyPositions.length;
      dueForReview += opening.rootNode.getDueNodes().length;
    });

    return {
      totalOpenings: this.openings.size,
      totalPositions,
      totalKeyPositions,
      dueForReview
    };
  }
}
