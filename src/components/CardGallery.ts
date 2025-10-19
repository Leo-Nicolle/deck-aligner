/**
 * Card Gallery Component
 * Displays extracted cards in a grid with download options
 */

import { matToCanvas } from "../lib/imageProcessor";
import {
  downloadCard,
  type ExtractedCard,
} from "../lib/cardExtractor";

export interface CardGalleryOptions {
  onDownloadAll?: () => void;
}

export class CardGallery {
  private container: HTMLElement;
  private options: CardGalleryOptions;
  private extractedCards: ExtractedCard[] = [];

  constructor(container: HTMLElement, options: CardGalleryOptions = {}) {
    this.container = container;
    this.options = options;
    this.render();
  }

  private render(): void {
    this.container.innerHTML = `
      <div class="card-gallery">
        <div class="gallery-header">
          <h2 class="collapsible">Extracted Cards <span class="toggle-icon">▼</span></h2>
        </div>
        <div class="collapsible-content">
          <div class="gallery-actions">
            <button id="download-all-btn" class="upload-btn" disabled>
              Download All as ZIP
            </button>
          </div>
          <div id="gallery-grid" class="gallery-grid"></div>
        </div>
      </div>
    `;
  }

  public update(extractedCards: ExtractedCard[]): void {
    this.extractedCards = extractedCards;
    const grid = this.container.querySelector("#gallery-grid");
    const downloadAllBtn = this.container.querySelector(
      "#download-all-btn"
    ) as HTMLButtonElement;

    if (!grid) return;

    // Clear previous content
    grid.innerHTML = "";

    if (extractedCards.length === 0) {
      grid.innerHTML = `
        <div class="empty-state">
          <p>No cards extracted yet. Detect cards first!</p>
        </div>
      `;
      downloadAllBtn.disabled = true;
      return;
    }

    // Enable download all button
    downloadAllBtn.disabled = false;
    downloadAllBtn.onclick = () => {
      if (this.options.onDownloadAll) {
        this.options.onDownloadAll();
      }
    };

    // Create gallery items
    extractedCards.forEach((card) => {
      const item = document.createElement("div");
      item.className = "gallery-item";

      // Create canvas for card preview
      const canvas = document.createElement("canvas");
      canvas.className = "gallery-canvas";
      matToCanvas(card.image, canvas);

      // Create card info and actions
      const info = document.createElement("div");
      info.className = "gallery-item-info";
      info.innerHTML = `
        <div class="card-number">Card ${card.cardNumber}</div>
        <div class="card-dimensions">${card.image.cols}x${card.image.rows}px</div>
        <button class="download-card-btn upload-btn">Download</button>
      `;

      // Add download button event
      const downloadBtn = info.querySelector(".download-card-btn");
      downloadBtn?.addEventListener("click", () => {
        downloadCard(card);
      });

      item.appendChild(canvas);
      item.appendChild(info);
      grid.appendChild(item);
    });

    // Re-attach collapsible event listener
    this.attachCollapsibleListener();
  }

  private attachCollapsibleListener(): void {
    const header = this.container.querySelector(".collapsible");
    if (!header) return;

    // Remove existing listener to avoid duplicates
    const newHeader = header.cloneNode(true) as HTMLElement;
    header.parentNode?.replaceChild(newHeader, header);

    // Get the content div (next sibling after gallery-header)
    const galleryHeader = newHeader.parentElement;
    const content = galleryHeader?.nextElementSibling as HTMLElement;

    // Add new listener
    newHeader.addEventListener("click", () => {
      const icon = newHeader.querySelector(".toggle-icon");

      if (content && content.classList.contains("collapsible-content")) {
        const isCollapsed = newHeader.classList.contains("collapsed");

        if (isCollapsed) {
          // Expand
          newHeader.classList.remove("collapsed");
          content.style.display = "";
          if (icon) icon.textContent = "▼";
        } else {
          // Collapse
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

    const downloadAllBtn = this.container.querySelector(
      "#download-all-btn"
    ) as HTMLButtonElement;
    if (downloadAllBtn) {
      downloadAllBtn.disabled = true;
    }

    this.extractedCards = [];
  }

  public getExtractedCards(): ExtractedCard[] {
    return this.extractedCards;
  }
}
