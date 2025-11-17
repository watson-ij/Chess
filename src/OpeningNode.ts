// Types for Opening Node structure

/**
 * SRS (Spaced Repetition System) data for tracking learning progress
 * Uses SuperMemo SM-2 algorithm
 */
export interface SRSData {
  /** Ease factor (difficulty multiplier, typically 1.3 - 2.5) */
  easeFactor: number;
  /** Current interval in days */
  interval: number;
  /** Number of consecutive correct repetitions */
  repetitions: number;
  /** Last review date (timestamp) */
  lastReviewed: number | null;
  /** Next scheduled review date (timestamp) */
  nextReview: number | null;
  /** Total times this position has been practiced */
  totalReviews: number;
  /** Number of times answered correctly */
  correctCount: number;
}

/**
 * Represents a single node in the opening tree
 * Each node is a position after a specific move
 */
export class OpeningNode {
  /** The move that led to this position (null for root) */
  move: string | null;

  /** FEN notation of the position */
  fen: string;

  /** Comment or annotation for this position */
  comment: string;

  /** Child variations from this position */
  children: OpeningNode[];

  /** SRS data for practicing this position */
  srsData: SRSData;

  /** Whether this is a critical position to practice */
  isKeyPosition: boolean;

  /** Tags for categorization (e.g., "tactical", "positional", "endgame") */
  tags: string[];

  constructor(
    fen: string,
    move: string | null = null,
    comment: string = ''
  ) {
    this.move = move;
    this.fen = fen;
    this.comment = comment;
    this.children = [];
    this.isKeyPosition = false;
    this.tags = [];

    // Initialize SRS data with default values (SM-2 algorithm)
    this.srsData = {
      easeFactor: 2.5,
      interval: 0,
      repetitions: 0,
      lastReviewed: null,
      nextReview: null,
      totalReviews: 0,
      correctCount: 0
    };
  }

  /**
   * Add a child variation to this node
   */
  addChild(node: OpeningNode): void {
    this.children.push(node);
  }

  /**
   * Find a child node by move
   */
  findChild(move: string): OpeningNode | null {
    return this.children.find(child => child.move === move) || null;
  }

  /**
   * Get all moves available from this position
   */
  getMoves(): string[] {
    return this.children.map(child => child.move!).filter(Boolean);
  }

  /**
   * Check if this position is due for review
   */
  isDueForReview(currentDate: number = Date.now()): boolean {
    if (this.srsData.nextReview === null) {
      return true; // Never reviewed, always due
    }
    return currentDate >= this.srsData.nextReview;
  }

  /**
   * Get depth from root (number of moves)
   */
  getDepth(): number {
    return this.move === null ? 0 : 1; // Depth is tracked during traversal
  }

  /**
   * Convert to JSON for storage
   */
  toJSON(): any {
    return {
      move: this.move,
      fen: this.fen,
      comment: this.comment,
      isKeyPosition: this.isKeyPosition,
      tags: this.tags,
      srsData: this.srsData,
      children: this.children.map(child => child.toJSON())
    };
  }

  /**
   * Create from JSON data
   */
  static fromJSON(data: any): OpeningNode {
    const node = new OpeningNode(data.fen, data.move, data.comment || '');
    node.isKeyPosition = data.isKeyPosition || false;
    node.tags = data.tags || [];
    node.srsData = data.srsData || node.srsData;
    node.children = (data.children || []).map((child: any) =>
      OpeningNode.fromJSON(child)
    );
    return node;
  }

  /**
   * Count total positions in this subtree
   */
  countPositions(): number {
    return 1 + this.children.reduce((sum, child) => sum + child.countPositions(), 0);
  }

  /**
   * Get all leaf nodes (end positions) in this subtree
   */
  getLeafNodes(): OpeningNode[] {
    if (this.children.length === 0) {
      return [this];
    }
    return this.children.flatMap(child => child.getLeafNodes());
  }

  /**
   * Get all nodes that are due for review
   */
  getDueNodes(currentDate: number = Date.now()): OpeningNode[] {
    const dueNodes: OpeningNode[] = [];

    // Check this node
    if (this.isKeyPosition && this.isDueForReview(currentDate)) {
      dueNodes.push(this);
    }

    // Check children recursively
    for (const child of this.children) {
      dueNodes.push(...child.getDueNodes(currentDate));
    }

    return dueNodes;
  }

  /**
   * Get the path from root to this node as a list of moves
   * Note: This requires traversal from root with parent tracking
   */
  getMovePath(rootNode: OpeningNode, currentPath: string[] = []): string[] | null {
    if (rootNode === this) {
      return currentPath;
    }

    for (const child of rootNode.children) {
      const path = this.getMovePath(child, [...currentPath, child.move!]);
      if (path !== null) {
        return path;
      }
    }

    return null;
  }
}
