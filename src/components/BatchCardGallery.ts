/**
 * Batch Card Gallery Component
 * Interactive card gallery with drag-drop reordering, selection, and filtering
 */

import { matToCanvas } from "../lib/imageProcessor";
import { downloadCard } from "../lib/cardExtractor";
import type { ManagedCard } from "../lib/cardManager";

export interface BatchCardGalleryOptions {
  onDownloadAll?: () => void;
  onCardSelect?: (cardId: string, isSelected: boolean) => void;
  onCardReorder?: (fromIndex: number, toIndex: number) => void;
  onFilterChange?: (filters: FilterOptions) => void;
}

export interface FilterOptions {
  sourceImage?: string;
  minWidth?: number;
  maxWidth?: number;
  minHeight?: number;
  maxHeight?: number;
  showDiscarded?: boolean;
}

export class BatchCardGallery {
  private container: HTMLElement;
  private options: BatchCardGalleryOptions;
  private cards: ManagedCard[] = [];
  private draggedIndex: number | null = null;
  private filters: FilterOptions = { showDiscarded: false };

  constructor(container: HTMLElement, options: BatchCardGalleryOptions = {}) {
    this.container = container;
    this.options = options;
    this.render();
  }

  private render(): void {
    this.container.innerHTML = `
      <div class="card-gallery">
        <div class="gallery-header">
          <h2 class="collapsible">Card Gallery <span class="toggle-icon">▼</span></h2>
        </div>
        <div class="collapsible-content">
          <div id="gallery-filters" class="gallery-filters"></div>
          <div id="gallery-grid" class="gallery-grid batch-gallery-grid"></div>
        </div>
      </div>
    `;
  }

  public update(cards: ManagedCard[]): void {
    this.cards = cards;
    this.renderFilters();
    this.renderGrid();
    this.attachCollapsibleListener();
  }

  private renderFilters(): void {
    const filtersContainer = this.container.querySelector("#gallery-filters");
    if (!filtersContainer) return;

    // Get unique source images
    const sourceImages = Array.from(
      new Set(this.cards.map((c) => c.sourceImageName))
    );

    filtersContainer.innerHTML = `
      <div class="filter-row">
        <label>
          <span>Source Image:</span>
          <select id="filter-source">
            <option value="">All Images</option>
            ${sourceImages.map((name) => `<option value="${name}">${name}</option>`).join("")}
          </select>
        </label>

        <label>
          <input type="checkbox" id="filter-show-discarded" ${this.filters.showDiscarded ? "checked" : ""}>
          <span>Show Discarded</span>
        </label>

        <button id="clear-filters-btn" class="upload-btn" style="padding: 0.25rem 0.75rem; font-size: 0.875rem;">
          Clear Filters
        </button>
      </div>
    `;

    // Attach filter event listeners
    const sourceFilter = filtersContainer.querySelector("#filter-source") as HTMLSelectElement;
    const discardedFilter = filtersContainer.querySelector("#filter-show-discarded") as HTMLInputElement;
    const clearBtn = filtersContainer.querySelector("#clear-filters-btn");

    sourceFilter?.addEventListener("change", () => {
      this.filters.sourceImage = sourceFilter.value || undefined;
      this.renderGrid();
      if (this.options.onFilterChange) {
        this.options.onFilterChange(this.filters);
      }
    });

    discardedFilter?.addEventListener("change", () => {
      this.filters.showDiscarded = discardedFilter.checked;
      this.renderGrid();
      if (this.options.onFilterChange) {
        this.options.onFilterChange(this.filters);
      }
    });

    clearBtn?.addEventListener("click", () => {
      this.filters = { showDiscarded: false };
      this.renderFilters();
      this.renderGrid();
      if (this.options.onFilterChange) {
        this.options.onFilterChange(this.filters);
      }
    });
  }

  private renderGrid(): void {
    const grid = this.container.querySelector("#gallery-grid");
    if (!grid) return;

    // Apply filters
    let filteredCards = this.cards;

    if (!this.filters.showDiscarded) {
      filteredCards = filteredCards.filter((c) => !c.isDiscarded);
    }

    if (this.filters.sourceImage) {
      filteredCards = filteredCards.filter(
        (c) => c.sourceImageName === this.filters.sourceImage
      );
    }

    // Clear grid
    grid.innerHTML = "";

    if (filteredCards.length === 0) {
      grid.innerHTML = `
        <div class="empty-state">
          <p>No cards match the current filters.</p>
        </div>
      `;
      return;
    }

    // Create gallery items
    filteredCards.forEach((card, index) => {
      const item = document.createElement("div");
      item.className = "gallery-item batch-gallery-item";
      item.dataset.cardId = card.globalId;
      item.dataset.index = index.toString();
      item.draggable = true;

      // Add state classes
      if (card.isSelected) item.classList.add("selected");
      if (card.isDiscarded) item.classList.add("discarded");

      // Create selection checkbox
      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.className = "card-checkbox";
      checkbox.checked = card.isSelected;
      checkbox.addEventListener("click", (e) => {
        e.stopPropagation();
        if (this.options.onCardSelect) {
          this.options.onCardSelect(card.globalId, checkbox.checked);
        }
      });

      // Create canvas for card preview
      const canvas = document.createElement("canvas");
      canvas.className = "gallery-canvas";
      matToCanvas(card.image, canvas);

      // Create card info overlay
      const overlay = document.createElement("div");
      overlay.className = "card-overlay";
      overlay.innerHTML = `
        <div class="card-info">
          <div class="card-id">${card.globalId}</div>
          <div class="card-source">${card.sourceImageName}</div>
          <div class="card-dimensions">${card.image.cols}x${card.image.rows}px</div>
        </div>
        <div class="card-actions">
          <button class="download-card-btn icon-btn" title="Download">💾</button>
        </div>
      `;

      // Add download button event
      const downloadBtn = overlay.querySelector(".download-card-btn");
      downloadBtn?.addEventListener("click", (e) => {
        e.stopPropagation();
        downloadCard(card);
      });

      // Card selection on click
      item.addEventListener("click", () => {
        checkbox.checked = !checkbox.checked;
        if (this.options.onCardSelect) {
          this.options.onCardSelect(card.globalId, checkbox.checked);
        }
      });

      // Drag and drop events
      item.addEventListener("dragstart", (e) => {
        this.draggedIndex = index;
        item.classList.add("dragging");
        if (e.dataTransfer) {
          e.dataTransfer.effectAllowed = "move";
        }
      });

      item.addEventListener("dragend", () => {
        item.classList.remove("dragging");
        this.draggedIndex = null;
      });

      item.addEventListener("dragover", (e) => {
        e.preventDefault();
        if (e.dataTransfer) {
          e.dataTransfer.dropEffect = "move";
        }

        const targetIndex = parseInt(item.dataset.index || "0");
        if (this.draggedIndex !== null && this.draggedIndex !== targetIndex) {
          item.classList.add("drag-over");
        }
      });

      item.addEventListener("dragleave", () => {
        item.classList.remove("drag-over");
      });

      item.addEventListener("drop", (e) => {
        e.preventDefault();
        item.classList.remove("drag-over");

        const targetIndex = parseInt(item.dataset.index || "0");
        if (this.draggedIndex !== null && this.draggedIndex !== targetIndex) {
          if (this.options.onCardReorder) {
            this.options.onCardReorder(this.draggedIndex, targetIndex);
          }
        }
      });

      item.appendChild(checkbox);
      item.appendChild(canvas);
      item.appendChild(overlay);
      grid.appendChild(item);
    });
  }

  private attachCollapsibleListener(): void {
    const header = this.container.querySelector(".collapsible");
    if (!header) return;

    // Remove existing listener to avoid duplicates
    const newHeader = header.cloneNode(true) as HTMLElement;
    header.parentNode?.replaceChild(newHeader, header);

    // Get the content div
    const galleryHeader = newHeader.parentElement;
    const content = galleryHeader?.nextElementSibling as HTMLElement;

    newHeader.addEventListener("click", () => {
      const icon = newHeader.querySelector(".toggle-icon");

      if (content && content.classList.contains("collapsible-content")) {
        const isCollapsed = newHeader.classList.contains("collapsed");

        if (isCollapsed) {
          newHeader.classList.remove("collapsed");
          content.style.display = "";
          if (icon) icon.textContent = "▼";
        } else {
          newHeader.classList.add("collapsed");
          content.style.display = "none";
          if (icon) icon.textContent = "▶";
        }
      }
    });
  }

  public clear(): void {
    const grid = this.container.querySelector("#gallery-grid");
    if (grid) {
      grid.innerHTML = "";
    }
    this.cards = [];
    this.filters = { showDiscarded: false };
  }

  public getCards(): ManagedCard[] {
    return this.cards;
  }
}
