/**
 * Tactical Puzzle Selector - Browse and select tactical puzzles
 */

import { TacticalPuzzle } from './TacticalPuzzleTypes';
import {
  TACTICAL_PUZZLES,
  getAllThemes,
  getPuzzlesByTheme,
  getPuzzlesByDifficulty,
  getThemeDisplayName,
  getThemeIcon,
} from './TacticalPuzzleDatabase';

export class TacticalPuzzleSelector {
  private container: HTMLElement;
  private onPuzzleSelected: (puzzle: TacticalPuzzle) => void;

  constructor(container: HTMLElement, onPuzzleSelected: (puzzle: TacticalPuzzle) => void) {
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
        <h1>Tactical Puzzles</h1>
        <p class="subtitle">Sharpen your tactical vision with chess puzzles</p>

        <div class="filter-section">
          <h3>Filter Puzzles</h3>
          <div class="filter-buttons">
            <button id="tactical-filter-all" class="filter-btn active">All Puzzles</button>
            <button id="tactical-filter-theme" class="filter-btn">By Theme</button>
            <button id="tactical-filter-difficulty" class="filter-btn">By Difficulty</button>
          </div>
          <div id="tactical-filter-options" class="filter-options"></div>
        </div>

        <div id="tactical-puzzle-grid" class="puzzle-grid"></div>
      </div>
    `;

    this.setupEventListeners();
    this.renderPuzzles(TACTICAL_PUZZLES);
  }

  /**
   * Setup event listeners
   */
  private setupEventListeners(): void {
    // Filter buttons
    document.getElementById('tactical-filter-all')?.addEventListener('click', () => {
      this.setActiveFilter('all');
      this.renderPuzzles(TACTICAL_PUZZLES);
    });

    document.getElementById('tactical-filter-theme')?.addEventListener('click', () => {
      this.setActiveFilter('theme');
      this.showThemeFilter();
    });

    document.getElementById('tactical-filter-difficulty')?.addEventListener('click', () => {
      this.setActiveFilter('difficulty');
      this.showDifficultyFilter();
    });
  }

  /**
   * Set active filter button
   */
  private setActiveFilter(filter: 'all' | 'theme' | 'difficulty'): void {
    document.querySelectorAll('.filter-btn').forEach((btn) => {
      btn.classList.remove('active');
    });
    document.getElementById(`tactical-filter-${filter}`)?.classList.add('active');
  }

  /**
   * Show theme filter options
   */
  private showThemeFilter(): void {
    const themes = getAllThemes();
    const optionsContainer = document.getElementById('tactical-filter-options')!;

    optionsContainer.innerHTML = '<h4>Select Theme:</h4>';

    // Sort themes alphabetically by display name
    const sortedThemes = themes.sort((a, b) =>
      getThemeDisplayName(a).localeCompare(getThemeDisplayName(b))
    );

    sortedThemes.forEach((theme) => {
      const btn = document.createElement('button');
      btn.className = 'category-option';
      btn.textContent = `${getThemeIcon(theme)} ${getThemeDisplayName(theme)}`;
      btn.addEventListener('click', () => {
        this.renderPuzzles(getPuzzlesByTheme(theme));
        this.highlightSelectedOption(btn);
      });
      optionsContainer.appendChild(btn);
    });
  }

  /**
   * Show difficulty filter options
   */
  private showDifficultyFilter(): void {
    const optionsContainer = document.getElementById('tactical-filter-options')!;

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
        this.renderPuzzles(getPuzzlesByDifficulty(diff.level as any));
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
  private renderPuzzles(puzzles: TacticalPuzzle[]): void {
    const grid = document.getElementById('tactical-puzzle-grid')!;

    if (puzzles.length === 0) {
      grid.innerHTML = '<p class="no-puzzles">No puzzles found in this theme.</p>';
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
  private createPuzzleCard(puzzle: TacticalPuzzle): HTMLElement {
    const card = document.createElement('div');
    card.className = 'puzzle-card';

    const difficulty = '⭐'.repeat(puzzle.difficulty);
    const themeIcon = getThemeIcon(puzzle.theme);
    const themeName = getThemeDisplayName(puzzle.theme);

    card.innerHTML = `
      <div class="puzzle-card-header">
        <h3>${puzzle.title}</h3>
        <span class="difficulty">${difficulty}</span>
      </div>
      <div class="puzzle-card-body">
        <p class="category">${themeIcon} ${themeName}</p>
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
   * Clear the selector
   */
  clear(): void {
    this.container.innerHTML = '';
  }
}
