/**
 * Puzzle Selector - Browse and select endgame puzzles
 */

import { EndgamePuzzle, PuzzleCategory } from './EndgameTypes';
import {
  ENDGAME_PUZZLES,
  getAllCategories,
  getPuzzlesByCategory,
  getPuzzlesByDifficulty,
} from './PuzzleDatabase';

export class PuzzleSelector {
  private container: HTMLElement;
  private onPuzzleSelected: (puzzle: EndgamePuzzle) => void;

  constructor(container: HTMLElement, onPuzzleSelected: (puzzle: EndgamePuzzle) => void) {
    this.container = container;
    this.onPuzzleSelected = onPuzzleSelected;
    this.render();
  }

  /**
   * Render the puzzle selector
   */
  render(): void {
    this.container.innerHTML = `
      <div class="puzzle-selector">
        <h1>Endgame Training</h1>
        <p class="subtitle">Master classic endgame positions and techniques</p>

        <div class="filter-section">
          <h3>Filter Puzzles</h3>
          <div class="filter-buttons">
            <button id="filter-all" class="filter-btn active">All Puzzles</button>
            <button id="filter-category" class="filter-btn">By Category</button>
            <button id="filter-difficulty" class="filter-btn">By Difficulty</button>
          </div>
          <div id="filter-options" class="filter-options"></div>
        </div>

        <div id="puzzle-grid" class="puzzle-grid"></div>
      </div>
    `;

    this.setupEventListeners();
    this.renderPuzzles(ENDGAME_PUZZLES);
  }

  /**
   * Setup event listeners
   */
  private setupEventListeners(): void {
    // Filter buttons
    document.getElementById('filter-all')?.addEventListener('click', () => {
      this.setActiveFilter('all');
      this.renderPuzzles(ENDGAME_PUZZLES);
    });

    document.getElementById('filter-category')?.addEventListener('click', () => {
      this.setActiveFilter('category');
      this.showCategoryFilter();
    });

    document.getElementById('filter-difficulty')?.addEventListener('click', () => {
      this.setActiveFilter('difficulty');
      this.showDifficultyFilter();
    });
  }

  /**
   * Set active filter button
   */
  private setActiveFilter(filter: 'all' | 'category' | 'difficulty'): void {
    document.querySelectorAll('.filter-btn').forEach((btn) => {
      btn.classList.remove('active');
    });
    document.getElementById(`filter-${filter}`)?.classList.add('active');
  }

  /**
   * Show category filter options
   */
  private showCategoryFilter(): void {
    const categories = getAllCategories();
    const optionsContainer = document.getElementById('filter-options')!;

    optionsContainer.innerHTML = '<h4>Select Category:</h4>';

    const categoryNames: Record<string, string> = {
      'basic-checkmates': '♔ Basic Checkmates',
      'pawn-endgames': '♙ Pawn Endgames',
      'rook-endgames': '♜ Rook Endgames',
      'queen-endgames': '♛ Queen Endgames',
      'minor-piece-endgames': '♝ Minor Piece Endgames',
      'theoretical-positions': '📚 Theoretical Positions',
    };

    categories.forEach((category) => {
      const btn = document.createElement('button');
      btn.className = 'category-option';
      btn.textContent = categoryNames[category] || category;
      btn.addEventListener('click', () => {
        this.renderPuzzles(getPuzzlesByCategory(category));
        this.highlightSelectedOption(btn);
      });
      optionsContainer.appendChild(btn);
    });
  }

  /**
   * Show difficulty filter options
   */
  private showDifficultyFilter(): void {
    const optionsContainer = document.getElementById('filter-options')!;

    optionsContainer.innerHTML = '<h4>Select Difficulty:</h4>';

    const difficulties = [
      { level: 1, name: 'Beginner', icon: '⭐' },
      { level: 2, name: 'Intermediate', icon: '⭐⭐' },
      { level: 3, name: 'Advanced', icon: '⭐⭐⭐' },
      { level: 4, name: 'Expert', icon: '⭐⭐⭐⭐' },
      { level: 5, name: 'Master', icon: '⭐⭐⭐⭐⭐' },
    ];

    difficulties.forEach((diff) => {
      const btn = document.createElement('button');
      btn.className = 'difficulty-option';
      btn.innerHTML = `${diff.icon} ${diff.name}`;
      btn.addEventListener('click', () => {
        this.renderPuzzles(getPuzzlesByDifficulty(diff.level));
        this.highlightSelectedOption(btn);
      });
      optionsContainer.appendChild(btn);
    });
  }

  /**
   * Highlight selected option
   */
  private highlightSelectedOption(element: HTMLElement): void {
    element.parentElement?.querySelectorAll('button').forEach((btn) => {
      btn.classList.remove('selected');
    });
    element.classList.add('selected');
  }

  /**
   * Render puzzle cards
   */
  private renderPuzzles(puzzles: EndgamePuzzle[]): void {
    const grid = document.getElementById('puzzle-grid')!;

    if (puzzles.length === 0) {
      grid.innerHTML = '<p class="no-puzzles">No puzzles found in this category.</p>';
      return;
    }

    grid.innerHTML = '';

    puzzles.forEach((puzzle) => {
      const card = this.createPuzzleCard(puzzle);
      grid.appendChild(card);
    });
  }

  /**
   * Create a puzzle card
   */
  private createPuzzleCard(puzzle: EndgamePuzzle): HTMLElement {
    const card = document.createElement('div');
    card.className = 'puzzle-card';

    const difficulty = '⭐'.repeat(puzzle.difficulty);
    const categoryIcon = this.getCategoryIcon(puzzle.category);

    card.innerHTML = `
      <div class="puzzle-card-header">
        <h3>${puzzle.title}</h3>
        <span class="difficulty">${difficulty}</span>
      </div>
      <div class="puzzle-card-body">
        <p class="category">${categoryIcon} ${this.formatCategory(puzzle.category)}</p>
        <p class="description">${puzzle.description}</p>
        <p class="objective"><strong>Goal:</strong> ${puzzle.objectiveDescription}</p>
      </div>
      <button class="start-puzzle-btn">Start Puzzle →</button>
    `;

    card.querySelector('.start-puzzle-btn')?.addEventListener('click', () => {
      this.onPuzzleSelected(puzzle);
    });

    return card;
  }

  /**
   * Get category icon
   */
  private getCategoryIcon(category: PuzzleCategory): string {
    const icons: Record<PuzzleCategory, string> = {
      'basic-checkmates': '♔',
      'pawn-endgames': '♙',
      'rook-endgames': '♜',
      'queen-endgames': '♛',
      'minor-piece-endgames': '♝',
      'theoretical-positions': '📚',
    };
    return icons[category] || '♟';
  }

  /**
   * Format category name
   */
  private formatCategory(category: string): string {
    return category
      .split('-')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  /**
   * Clear the selector
   */
  clear(): void {
    this.container.innerHTML = '';
  }
}
