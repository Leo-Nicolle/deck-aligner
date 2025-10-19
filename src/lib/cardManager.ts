/**
 * Card Manager Module
 * Manages unified collection of cards from multiple images
 */

import type { ExtractedCard } from "./cardExtractor";
import type { ProcessedImage } from "./batchProcessor";

export interface ManagedCard extends ExtractedCard {
  globalId: string; // "img_001_card_03"
  sourceImageId: string;
  sourceImageName: string;
  isSelected: boolean;
  isDiscarded: boolean;
  customPosition: number; // For manual reordering
}

export interface CardCollectionState {
  cards: ManagedCard[];
  selectedIds: Set<string>;
  discardedIds: Set<string>;
}

export class CardManager {
  private cards: ManagedCard[] = [];
  private selectedIds: Set<string> = new Set();
  private discardedIds: Set<string> = new Set();
  private history: CardCollectionState[] = [];
  private historyIndex: number = -1;

  /**
   * Load cards from processed images
   */
  loadFromImages(images: ProcessedImage[]): void {
    this.cards = [];
    let position = 0;

    images.forEach((image) => {
      image.extractedCards.forEach((card, cardIndex) => {
        const managedCard: ManagedCard = {
          ...card,
          globalId: `${image.id}_card_${String(cardIndex + 1).padStart(2, "0")}`,
          sourceImageId: image.id,
          sourceImageName: image.fileName,
          isSelected: false,
          isDiscarded: false,
          customPosition: position++,
        };
        this.cards.push(managedCard);
      });
    });

    // Save initial state
    this.saveState();
  }

  /**
   * Get all cards (excluding discarded if specified)
   */
  getCards(includeDiscarded: boolean = false): ManagedCard[] {
    if (includeDiscarded) {
      return [...this.cards];
    }
    return this.cards.filter((card) => !card.isDiscarded);
  }

  /**
   * Get selected cards
   */
  getSelectedCards(): ManagedCard[] {
    return this.cards.filter(
      (card) => card.isSelected && !card.isDiscarded
    );
  }

  /**
   * Get cards by source image
   */
  getCardsByImage(imageId: string): ManagedCard[] {
    return this.cards.filter(
      (card) => card.sourceImageId === imageId && !card.isDiscarded
    );
  }

  /**
   * Select card(s)
   */
  selectCards(cardIds: string[]): void {
    cardIds.forEach((id) => {
      const card = this.cards.find((c) => c.globalId === id);
      if (card && !card.isDiscarded) {
        card.isSelected = true;
        this.selectedIds.add(id);
      }
    });
    this.saveState();
  }

  /**
   * Deselect card(s)
   */
  deselectCards(cardIds: string[]): void {
    cardIds.forEach((id) => {
      const card = this.cards.find((c) => c.globalId === id);
      if (card) {
        card.isSelected = false;
        this.selectedIds.delete(id);
      }
    });
    this.saveState();
  }

  /**
   * Select all cards
   */
  selectAll(): void {
    this.cards.forEach((card) => {
      if (!card.isDiscarded) {
        card.isSelected = true;
        this.selectedIds.add(card.globalId);
      }
    });
    this.saveState();
  }

  /**
   * Deselect all cards
   */
  deselectAll(): void {
    this.cards.forEach((card) => {
      card.isSelected = false;
    });
    this.selectedIds.clear();
    this.saveState();
  }

  /**
   * Discard card(s)
   */
  discardCards(cardIds: string[]): void {
    cardIds.forEach((id) => {
      const card = this.cards.find((c) => c.globalId === id);
      if (card) {
        card.isDiscarded = true;
        card.isSelected = false;
        this.discardedIds.add(id);
        this.selectedIds.delete(id);
      }
    });
    this.saveState();
  }

  /**
   * Restore discarded card(s)
   */
  restoreCards(cardIds: string[]): void {
    cardIds.forEach((id) => {
      const card = this.cards.find((c) => c.globalId === id);
      if (card) {
        card.isDiscarded = false;
        this.discardedIds.delete(id);
      }
    });
    this.saveState();
  }

  /**
   * Reorder cards (drag and drop)
   */
  reorderCards(fromIndex: number, toIndex: number): void {
    const activeCards = this.getCards(false);
    const [movedCard] = activeCards.splice(fromIndex, 1);
    activeCards.splice(toIndex, 0, movedCard);

    // Update custom positions
    activeCards.forEach((card, index) => {
      card.customPosition = index;
    });

    this.saveState();
  }

  /**
   * Sort cards by criteria
   */
  sortCards(
    criteria: "position" | "source" | "size" | "aspectRatio"
  ): void {
    const activeCards = this.getCards(false);

    switch (criteria) {
      case "position":
        activeCards.sort((a, b) => a.customPosition - b.customPosition);
        break;
      case "source":
        activeCards.sort((a, b) =>
          a.sourceImageId.localeCompare(b.sourceImageId)
        );
        break;
      case "size":
        activeCards.sort(
          (a, b) =>
            a.image.cols * a.image.rows - b.image.cols * b.image.rows
        );
        break;
      case "aspectRatio":
        activeCards.sort(
          (a, b) => a.image.rows / a.image.cols - b.image.rows / b.image.cols
        );
        break;
    }

    // Update positions
    activeCards.forEach((card, index) => {
      card.customPosition = index;
    });

    this.saveState();
  }

  /**
   * Get statistics
   */
  getStats() {
    return {
      total: this.cards.length,
      active: this.cards.filter((c) => !c.isDiscarded).length,
      selected: this.selectedIds.size,
      discarded: this.discardedIds.size,
      canUndo: this.historyIndex > 0,
      canRedo: this.historyIndex < this.history.length - 1,
    };
  }

  /**
   * Save current state to history
   */
  private saveState(): void {
    // Remove future states if we're not at the end
    if (this.historyIndex < this.history.length - 1) {
      this.history.splice(this.historyIndex + 1);
    }

    // Save state
    const state: CardCollectionState = {
      cards: this.cards.map((card) => ({ ...card })),
      selectedIds: new Set(this.selectedIds),
      discardedIds: new Set(this.discardedIds),
    };

    this.history.push(state);
    this.historyIndex++;

    // Limit history to 50 states
    if (this.history.length > 50) {
      this.history.shift();
      this.historyIndex--;
    }
  }

  /**
   * Undo last action
   */
  undo(): boolean {
    if (this.historyIndex > 0) {
      this.historyIndex--;
      this.restoreState(this.history[this.historyIndex]);
      return true;
    }
    return false;
  }

  /**
   * Redo last undone action
   */
  redo(): boolean {
    if (this.historyIndex < this.history.length - 1) {
      this.historyIndex++;
      this.restoreState(this.history[this.historyIndex]);
      return true;
    }
    return false;
  }

  /**
   * Restore state from history
   */
  private restoreState(state: CardCollectionState): void {
    this.cards = state.cards.map((card) => ({ ...card }));
    this.selectedIds = new Set(state.selectedIds);
    this.discardedIds = new Set(state.discardedIds);
  }

  /**
   * Check if can undo
   */
  canUndo(): boolean {
    return this.historyIndex > 0;
  }

  /**
   * Check if can redo
   */
  canRedo(): boolean {
    return this.historyIndex < this.history.length - 1;
  }

  /**
   * Get current history index
   */
  getHistoryIndex(): number {
    return this.historyIndex;
  }

  /**
   * Get history length
   */
  getHistoryLength(): number {
    return this.history.length;
  }

  /**
   * Clean up resources
   */
  cleanup(): void {
    // Clean up all card images
    this.cards.forEach((card) => {
      if (card.image) {
        card.image.delete();
      }
    });

    this.cards = [];
    this.selectedIds.clear();
    this.discardedIds.clear();
    this.history = [];
    this.historyIndex = -1;
  }
}
