import { ChessEngine } from './ChessEngine';
import { ChessBoardRenderer } from './ChessBoardRenderer';
import { OpeningRepository, Opening, OpeningColor } from './OpeningRepository';
import { OpeningNode } from './OpeningNode';
import { SRSManager, ResponseQuality } from './SRSManager';
import type { Position } from './types';

type AppMode = 'repository' | 'input' | 'view' | 'practice';

/**
 * Main application for managing and practicing chess openings
 */
export class OpeningApp {
  private canvas: HTMLCanvasElement;
  private renderer: ChessBoardRenderer;
  private repository: OpeningRepository;
  private engine: ChessEngine;

  private currentMode: AppMode = 'repository';
  private currentOpening: Opening | null = null;
  private currentNode: OpeningNode | null = null;

  // Practice mode state
  private practiceNodes: OpeningNode[] = [];
  private currentPracticeIndex: number = 0;
  private practiceEngine: ChessEngine | null = null;
  private awaitingUserMove: boolean = false;
  private selectedSquare: Position | null = null;

  // Input mode state
  private inputMoveHistory: string[] = [];

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.renderer = new ChessBoardRenderer(canvas);
    this.repository = new OpeningRepository();
    this.engine = new ChessEngine();

    this.setupEventListeners();
    this.showRepositoryMode();
  }

  private setupEventListeners(): void {
    // Canvas click for move input
    this.canvas.addEventListener('click', (e) => this.handleCanvasClick(e));

    // Mode buttons
    document.getElementById('btn-repository')?.addEventListener('click', () => {
      this.setMode('repository');
    });

    document.getElementById('btn-new-opening')?.addEventListener('click', () => {
      this.showCreateOpeningDialog();
    });

    document.getElementById('btn-import-pgn')?.addEventListener('click', () => {
      this.showImportPGNDialog();
    });

    document.getElementById('btn-export-json')?.addEventListener('click', () => {
      this.exportAllToJSON();
    });

    document.getElementById('btn-import-json')?.addEventListener('click', () => {
      this.showImportJSONDialog();
    });

    // Practice mode buttons
    document.getElementById('btn-practice')?.addEventListener('click', () => {
      this.startPracticeMode();
    });

    document.getElementById('btn-next-position')?.addEventListener('click', () => {
      this.nextPracticePosition();
    });

    document.getElementById('btn-show-answer')?.addEventListener('click', () => {
      this.showPracticeAnswer();
    });

    // Response quality buttons
    for (let q = 0; q <= 5; q++) {
      document.getElementById(`btn-quality-${q}`)?.addEventListener('click', () => {
        this.submitPracticeResponse(q as ResponseQuality);
      });
    }

    // Input mode buttons
    document.getElementById('btn-input-mode')?.addEventListener('click', () => {
      if (this.currentOpening) {
        this.setMode('input');
      }
    });

    document.getElementById('btn-view-mode')?.addEventListener('click', () => {
      if (this.currentOpening) {
        this.setMode('view');
      }
    });

    document.getElementById('btn-mark-key-position')?.addEventListener('click', () => {
      this.toggleKeyPosition();
    });

    document.getElementById('btn-reset-input')?.addEventListener('click', () => {
      this.resetInputMode();
    });
  }

  private handleCanvasClick(event: MouseEvent): void {
    const rect = this.canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    const square = this.renderer.getSquareFromClick(x, y);
    if (!square) return;

    if (this.currentMode === 'input') {
      this.handleInputModeClick(square);
    } else if (this.currentMode === 'practice' && this.awaitingUserMove) {
      this.handlePracticeModeClick(square);
    } else if (this.currentMode === 'view') {
      // View mode is read-only, but we could add click to show variations
    }
  }

  private handleInputModeClick(square: Position): void {
    if (!this.selectedSquare) {
      // Select this square if it has a piece of the current turn
      const piece = this.engine.getPieceAt(square);
      if (piece && piece.color === this.engine.getCurrentTurn()) {
        this.selectedSquare = square;
        this.renderer.setSelectedSquare(square);
        const legalMoves = this.engine.getLegalMoves(square);
        this.renderer.setHighlightedSquares(legalMoves);
        this.renderer.render(this.engine.getBoard());
      }
    } else {
      // Try to make a move
      const success = this.engine.makeMove(this.selectedSquare, square);

      if (success) {
        // Get the move notation
        const moveHistory = this.engine.getMoveHistory();
        const lastMove = moveHistory[moveHistory.length - 1];
        const moveNotation = lastMove.notation || '';

        // Add to opening tree
        if (this.currentOpening && this.currentNode) {
          const fen = this.engine.toFEN();
          this.currentNode = this.repository.addMove(
            this.currentOpening,
            this.currentNode,
            moveNotation,
            fen
          );
          this.inputMoveHistory.push(moveNotation);
          this.updateInputModeUI();
        }

        this.selectedSquare = null;
        this.renderer.setSelectedSquare(null);
        this.renderer.setHighlightedSquares([]);
        this.renderer.render(this.engine.getBoard());
      } else {
        // Invalid move, clear selection
        this.selectedSquare = null;
        this.renderer.setSelectedSquare(null);
        this.renderer.setHighlightedSquares([]);
        this.renderer.render(this.engine.getBoard());
      }
    }
  }

  private handlePracticeModeClick(square: Position): void {
    if (!this.practiceEngine) return;

    if (!this.selectedSquare) {
      // Select this square if it has a piece of the current turn
      const piece = this.practiceEngine.getPieceAt(square);
      if (piece && piece.color === this.practiceEngine.getCurrentTurn()) {
        this.selectedSquare = square;
        this.renderer.setSelectedSquare(square);
        const legalMoves = this.practiceEngine.getLegalMoves(square);
        this.renderer.setHighlightedSquares(legalMoves);
        this.renderer.render(this.practiceEngine.getBoard());
      }
    } else {
      // Try to make a move
      const success = this.practiceEngine.makeMove(this.selectedSquare, square);

      if (success) {
        const moveHistory = this.practiceEngine.getMoveHistory();
        const lastMove = moveHistory[moveHistory.length - 1];
        const userMove = lastMove.notation || '';

        // Check if this is the correct move
        this.checkPracticeMove(userMove);

        this.selectedSquare = null;
        this.renderer.setSelectedSquare(null);
        this.renderer.setHighlightedSquares([]);
        this.renderer.render(this.practiceEngine.getBoard());
      } else {
        this.selectedSquare = null;
        this.renderer.setSelectedSquare(null);
        this.renderer.setHighlightedSquares([]);
        this.renderer.render(this.practiceEngine.getBoard());
      }
    }
  }

  private setMode(mode: AppMode): void {
    this.currentMode = mode;

    // Hide all mode containers
    document.getElementById('repository-container')?.classList.add('hidden');
    document.getElementById('input-container')?.classList.add('hidden');
    document.getElementById('view-container')?.classList.add('hidden');
    document.getElementById('practice-container')?.classList.add('hidden');

    // Show the current mode container
    switch (mode) {
      case 'repository':
        this.showRepositoryMode();
        break;
      case 'input':
        this.showInputMode();
        break;
      case 'view':
        this.showViewMode();
        break;
      case 'practice':
        this.showPracticeMode();
        break;
    }
  }

  private showRepositoryMode(): void {
    document.getElementById('repository-container')?.classList.remove('hidden');
    this.updateRepositoryList();

    // Show initial board
    this.engine = new ChessEngine();
    this.renderer.render(this.engine.getBoard());
  }

  private updateRepositoryList(): void {
    const container = document.getElementById('opening-list');
    if (!container) return;

    const openings = this.repository.getAllOpenings();
    container.innerHTML = '';

    if (openings.length === 0) {
      container.innerHTML = '<div class="empty-state">No openings yet. Create one to get started!</div>';
      return;
    }

    openings.forEach(opening => {
      const stats = SRSManager.getStatistics(opening.rootNode);

      const item = document.createElement('div');
      item.className = 'opening-item';
      item.innerHTML = `
        <div class="opening-header">
          <h3>${this.escapeHtml(opening.name)}</h3>
          <span class="opening-color badge-${opening.color}">${opening.color}</span>
        </div>
        ${opening.description ? `<p class="opening-description">${this.escapeHtml(opening.description)}</p>` : ''}
        <div class="opening-stats">
          <span>${stats.totalPositions} positions</span>
          <span>${stats.keyPositions} key</span>
          <span>${stats.dueForReview} due</span>
        </div>
        <div class="opening-actions">
          <button class="btn-small btn-input" data-id="${opening.id}">Input</button>
          <button class="btn-small btn-view" data-id="${opening.id}">View</button>
          <button class="btn-small btn-export-pgn" data-id="${opening.id}">Export PGN</button>
          <button class="btn-small btn-delete" data-id="${opening.id}">Delete</button>
        </div>
      `;

      // Add event listeners
      item.querySelector('.btn-input')?.addEventListener('click', () => {
        this.selectOpening(opening.id);
        this.setMode('input');
      });

      item.querySelector('.btn-view')?.addEventListener('click', () => {
        this.selectOpening(opening.id);
        this.setMode('view');
      });

      item.querySelector('.btn-export-pgn')?.addEventListener('click', () => {
        this.exportOpeningToPGN(opening.id);
      });

      item.querySelector('.btn-delete')?.addEventListener('click', () => {
        if (confirm(`Delete opening "${opening.name}"?`)) {
          this.repository.deleteOpening(opening.id);
          this.updateRepositoryList();
        }
      });

      container.appendChild(item);
    });
  }

  private selectOpening(id: string): void {
    this.currentOpening = this.repository.getOpening(id);
    if (this.currentOpening) {
      this.currentNode = this.currentOpening.rootNode;
    }
  }

  private showCreateOpeningDialog(): void {
    const name = prompt('Opening name:');
    if (!name) return;

    const description = prompt('Description (optional):') || '';

    const colorInput = prompt('Color (white/black/both):', 'both');
    const color: OpeningColor = colorInput === 'white' || colorInput === 'black' ? colorInput : 'both';

    const opening = this.repository.createOpening(name, color, description);
    this.updateRepositoryList();

    // Automatically switch to input mode
    this.selectOpening(opening.id);
    this.setMode('input');
  }

  private showImportPGNDialog(): void {
    const pgn = prompt('Paste PGN:');
    if (!pgn) return;

    const name = prompt('Opening name:');
    if (!name) return;

    const colorInput = prompt('Color (white/black/both):', 'both');
    const color: OpeningColor = colorInput === 'white' || colorInput === 'black' ? colorInput : 'both';

    const result = this.repository.importFromPGN(pgn, name, color);

    if (result.success) {
      alert('Opening imported successfully!');
      this.updateRepositoryList();
    } else {
      alert(`Failed to import: ${result.error}`);
    }
  }

  private exportAllToJSON(): void {
    const json = this.repository.exportToJSON();
    this.downloadFile(json, 'openings.json', 'application/json');
  }

  private showImportJSONDialog(): void {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';

    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (event) => {
        const json = event.target?.result as string;
        const result = this.repository.importFromJSON(json);

        if (result.success) {
          alert(`Imported ${result.count} opening(s) successfully!`);
          this.updateRepositoryList();
        } else {
          alert(`Import failed:\n${result.errors.join('\n')}`);
        }
      };
      reader.readAsText(file);
    };

    input.click();
  }

  private exportOpeningToPGN(id: string): void {
    const opening = this.repository.getOpening(id);
    if (!opening) return;

    const pgn = this.repository.exportToPGN(opening);
    this.downloadFile(pgn, `${opening.name}.pgn`, 'text/plain');
  }

  private downloadFile(content: string, filename: string, mimeType: string): void {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  }

  private showInputMode(): void {
    if (!this.currentOpening) return;

    document.getElementById('input-container')?.classList.remove('hidden');

    // Reset engine and navigate to current node
    this.resetInputMode();
    this.updateInputModeUI();
  }

  private resetInputMode(): void {
    if (!this.currentOpening) return;

    this.engine = new ChessEngine();
    this.currentNode = this.currentOpening.rootNode;
    this.inputMoveHistory = [];

    this.renderer.setSelectedSquare(null);
    this.renderer.setHighlightedSquares([]);
    this.renderer.render(this.engine.getBoard());
  }

  private updateInputModeUI(): void {
    const openingName = document.getElementById('input-opening-name');
    const moveList = document.getElementById('input-move-list');
    const keyButton = document.getElementById('btn-mark-key-position') as HTMLButtonElement;

    if (openingName && this.currentOpening) {
      openingName.textContent = this.currentOpening.name;
    }

    if (moveList) {
      moveList.textContent = this.inputMoveHistory.join(' ');
    }

    if (keyButton && this.currentNode) {
      keyButton.textContent = this.currentNode.isKeyPosition
        ? '★ Key Position'
        : '☆ Mark as Key';
      keyButton.classList.toggle('active', this.currentNode.isKeyPosition);
    }
  }

  private toggleKeyPosition(): void {
    if (!this.currentOpening || !this.currentNode) return;

    const newValue = !this.currentNode.isKeyPosition;
    this.repository.markKeyPosition(this.currentOpening, this.currentNode, newValue);
    this.updateInputModeUI();
  }

  private showViewMode(): void {
    if (!this.currentOpening) return;

    document.getElementById('view-container')?.classList.remove('hidden');

    // Build tree view
    this.buildTreeView();

    // Show initial position
    this.engine = new ChessEngine();
    this.renderer.render(this.engine.getBoard());
  }

  private buildTreeView(): void {
    const container = document.getElementById('tree-view');
    if (!container || !this.currentOpening) return;

    container.innerHTML = '';

    const title = document.createElement('h2');
    title.textContent = this.currentOpening.name;
    container.appendChild(title);

    // Build tree recursively
    const treeElement = this.buildTreeNode(this.currentOpening.rootNode, 0);
    container.appendChild(treeElement);
  }

  private buildTreeNode(node: OpeningNode, depth: number): HTMLElement {
    const div = document.createElement('div');
    div.className = 'tree-node';
    div.style.marginLeft = `${depth * 20}px`;

    const label = document.createElement('div');
    label.className = 'tree-node-label';

    const moveText = node.move || 'Start';
    label.textContent = moveText;

    if (node.isKeyPosition) {
      const star = document.createElement('span');
      star.textContent = ' ★';
      star.className = 'key-marker';
      label.appendChild(star);
    }

    if (node.comment) {
      const comment = document.createElement('span');
      comment.textContent = ` - ${node.comment}`;
      comment.className = 'tree-comment';
      label.appendChild(comment);
    }

    // Click to show position
    label.addEventListener('click', () => {
      this.showPositionFromNode(node);
    });

    div.appendChild(label);

    // Add children
    if (node.children.length > 0) {
      const children = document.createElement('div');
      children.className = 'tree-children';

      node.children.forEach(child => {
        children.appendChild(this.buildTreeNode(child, depth + 1));
      });

      div.appendChild(children);
    }

    return div;
  }

  private showPositionFromNode(node: OpeningNode): void {
    // Load the FEN
    try {
      this.engine = new ChessEngine();
      this.engine.loadFEN(node.fen);
      this.renderer.render(this.engine.getBoard());
    } catch (error) {
      console.error('Failed to load position:', error);
    }
  }

  private startPracticeMode(): void {
    // Get all due positions from all openings
    const allOpenings = this.repository.getAllOpenings();
    const allKeyPositions: OpeningNode[] = [];

    allOpenings.forEach(opening => {
      const keyPositions = this.repository.getKeyPositions(opening);
      allKeyPositions.push(...keyPositions);
    });

    this.practiceNodes = SRSManager.getDuePositions(allKeyPositions, 20);

    if (this.practiceNodes.length === 0) {
      alert('No positions due for review! Mark some positions as key positions first.');
      return;
    }

    this.currentPracticeIndex = 0;
    this.setMode('practice');
  }

  private showPracticeMode(): void {
    document.getElementById('practice-container')?.classList.remove('hidden');

    if (this.practiceNodes.length === 0) {
      return;
    }

    this.showCurrentPracticePosition();
  }

  private showCurrentPracticePosition(): void {
    if (this.currentPracticeIndex >= this.practiceNodes.length) {
      this.showPracticeComplete();
      return;
    }

    const node = this.practiceNodes[this.currentPracticeIndex];

    // Find the path to this node (list of moves)
    // For now, we'll use a simple approach: play through from the start
    // In a full implementation, you'd store the path in the node

    // Load the FEN up to the position before the one we need to practice
    this.practiceEngine = new ChessEngine();

    // Load the position to practice
    // In a full implementation, we would play through moves leading to this position
    this.practiceEngine.loadFEN(node.fen);
    this.awaitingUserMove = true;

    // Hide the board initially (ChessTempo style - play through first)
    this.updatePracticeUI();

    // Show "Show Position" button
    document.getElementById('practice-question')!.textContent =
      `Position ${this.currentPracticeIndex + 1} of ${this.practiceNodes.length}`;
  }

  private checkPracticeMove(userMove: string): void {
    const node = this.practiceNodes[this.currentPracticeIndex];

    // Check if the move matches any of the children
    const correctMoves = node.getMoves();

    if (correctMoves.includes(userMove)) {
      // Correct!
      this.showPracticeResult(true, userMove);
    } else {
      // Incorrect
      this.showPracticeResult(false, userMove);
    }
  }

  private showPracticeResult(correct: boolean, userMove: string): void {
    const resultDiv = document.getElementById('practice-result')!;
    resultDiv.innerHTML = correct
      ? `<div class="result-correct">✓ Correct! ${userMove}</div>`
      : `<div class="result-incorrect">✗ Incorrect. The correct moves are: ${this.practiceNodes[this.currentPracticeIndex].getMoves().join(', ')}</div>`;

    // Show quality buttons
    document.getElementById('quality-buttons')?.classList.remove('hidden');
  }

  private showPracticeAnswer(): void {
    const node = this.practiceNodes[this.currentPracticeIndex];
    const correctMoves = node.getMoves();

    alert(`Correct moves: ${correctMoves.join(', ')}`);
  }

  private submitPracticeResponse(quality: ResponseQuality): void {
    const node = this.practiceNodes[this.currentPracticeIndex];

    // Update SRS data
    SRSManager.review(node, quality);
    this.repository.save();

    // Move to next position
    this.nextPracticePosition();
  }

  private nextPracticePosition(): void {
    this.currentPracticeIndex++;

    // Hide quality buttons
    document.getElementById('quality-buttons')?.classList.add('hidden');
    document.getElementById('practice-result')!.innerHTML = '';

    this.awaitingUserMove = false;
    this.showCurrentPracticePosition();
  }

  private showPracticeComplete(): void {
    const container = document.getElementById('practice-container')!;
    container.innerHTML = `
      <div class="practice-complete">
        <h2>Practice Complete!</h2>
        <p>You've reviewed all due positions.</p>
        <button id="btn-back-to-repository">Back to Repository</button>
      </div>
    `;

    document.getElementById('btn-back-to-repository')?.addEventListener('click', () => {
      this.setMode('repository');
    });
  }

  private updatePracticeUI(): void {
    if (!this.practiceEngine) return;
    this.renderer.render(this.practiceEngine.getBoard());
  }

  private escapeHtml(text: string): string {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}
