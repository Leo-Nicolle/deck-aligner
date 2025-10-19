import "./style.css";
import { BatchProcessor } from "./lib/batchProcessor";
import { CardManager } from "./lib/cardManager";
import { BatchUploader } from "./components/BatchUploader";
import { BatchProgress } from "./components/BatchProgress";
import { BatchCardGallery } from "./components/BatchCardGallery";
import { CompositePreview } from "./components/CompositePreview";
import { downloadAllCardsAsZip } from "./lib/cardExtractor";
import {
  generateComposite,
  downloadComposite,
  calculateOptimalCardsPerRow,
  type CompositeOptions,
} from "./lib/compositeGenerator";

// Application State
const batchProcessor = new BatchProcessor();
const cardManager = new CardManager();

// Initialize the app
async function init() {
  const app = document.querySelector<HTMLDivElement>("#app")!;

  // Setup UI
  app.innerHTML = `
    <div class="container">
      <header>
        <h1>Card Extractor - Batch Mode</h1>
        <p>Process multiple scanned images and manage all extracted cards</p>
        <div class="mode-switch">
          <a href="/" class="upload-btn">Single Image Mode</a>
        </div>
      </header>

      <section id="batch-upload-section"></section>

      <section id="batch-progress-section" style="display: none;"></section>

      <section id="batch-gallery-section" style="display: none;"></section>

      <section id="batch-controls" style="display: none;">
        <div class="controls">
          <h2>Card Management</h2>
          <div class="button-group">
            <button id="select-all-btn" class="upload-btn">Select All</button>
            <button id="deselect-all-btn" class="upload-btn">Deselect All</button>
            <button id="discard-selected-btn" class="upload-btn" style="background-color: #ff6b6b;">Discard Selected</button>
            <button id="restore-selected-btn" class="upload-btn" style="background-color: #4caf50;">Restore Selected</button>
            <button id="download-all-btn" class="upload-btn">Download All as ZIP</button>
          </div>
          <div class="history-controls">
            <button id="undo-btn" class="upload-btn" disabled>↶ Undo</button>
            <button id="redo-btn" class="upload-btn" disabled>↷ Redo</button>
            <span class="history-state" id="history-state"></span>
          </div>
          <div class="stats-display" id="card-stats"></div>
          <div class="shortcuts-info">
            <h3>Keyboard Shortcuts</h3>
            <ul class="shortcuts-list">
              <li><kbd>Ctrl+A</kbd><span>Select All</span></li>
              <li><kbd>Escape</kbd><span>Deselect All</span></li>
              <li><kbd>Delete</kbd><span>Discard Selected</span></li>
              <li><kbd>Ctrl+Z</kbd><span>Undo</span></li>
              <li><kbd>Ctrl+Y</kbd><span>Redo</span></li>
            </ul>
          </div>
          <button id="reset-batch-btn" class="upload-btn" style="background-color: #666; margin-top: 1rem;">Start Over</button>
        </div>
      </section>

      <section id="composite-section" class="composite-section" style="display: none;">
        <div class="controls composite-controls">
          <h3>Composite Layout</h3>

          <div class="control-group">
            <label for="cards-per-row">Cards Per Row</label>
            <div class="control-row">
              <input type="range" id="cards-per-row" min="1" max="10" value="3" />
              <span class="control-value" id="cards-per-row-value">3</span>
            </div>
          </div>

          <div class="control-group">
            <label for="spacing">Spacing (px)</label>
            <div class="control-row">
              <input type="range" id="spacing" min="0" max="100" value="20" step="5" />
              <span class="control-value" id="spacing-value">20px</span>
            </div>
          </div>

          <div class="control-group">
            <label for="background-color">Background Color</label>
            <div class="control-row">
              <input type="color" id="background-color" value="#1a1a1a" />
              <span class="control-value" id="background-color-value">#1a1a1a</span>
            </div>
          </div>

          <div class="control-group">
            <label for="scale-mode">Scale Mode</label>
            <div class="control-row">
              <select id="scale-mode">
                <option value="original">Original Size</option>
                <option value="fit" selected>Fit to Grid</option>
              </select>
            </div>
          </div>

          <button id="generate-composite-btn" class="upload-btn generate-btn">Generate Composite</button>
        </div>
      </section>

      <section id="composite-preview-section" style="display: none;"></section>
    </div>
  `;

  // Initialize components
  const uploadSection = document.querySelector("#batch-upload-section")!;
  const progressSection = document.querySelector("#batch-progress-section")!;
  const gallerySection = document.querySelector("#batch-gallery-section")!;
  const controlsSection = document.querySelector("#batch-controls") as HTMLElement;
  const compositeSection = document.querySelector("#composite-section") as HTMLElement;
  const compositePreviewSection = document.querySelector("#composite-preview-section") as HTMLElement;

  const uploader = new BatchUploader(uploadSection as HTMLElement, {
    onFilesSelected: handleBatchUpload,
    maxFiles: 50,
  });

  const progressTracker = new BatchProgress(progressSection as HTMLElement);

  const cardGallery = new BatchCardGallery(gallerySection as HTMLElement, {
    onDownloadAll: handleDownloadAll,
    onCardSelect: (cardId, isSelected) => {
      if (isSelected) {
        cardManager.selectCards([cardId]);
      } else {
        cardManager.deselectCards([cardId]);
      }
      updateCardGallery();
      updateStats();
      updateHistoryControls();
    },
    onCardReorder: (fromIndex, toIndex) => {
      cardManager.reorderCards(fromIndex, toIndex);
      updateCardGallery();
      updateHistoryControls();
    },
  });

  const compositePreview = new CompositePreview(compositePreviewSection, {
    onDownload: handleDownloadComposite,
  });

  // Event listeners
  const selectAllBtn = document.querySelector("#select-all-btn");
  selectAllBtn?.addEventListener("click", () => {
    cardManager.selectAll();
    updateCardGallery();
    updateStats();
    updateHistoryControls();
  });

  const deselectAllBtn = document.querySelector("#deselect-all-btn");
  deselectAllBtn?.addEventListener("click", () => {
    cardManager.deselectAll();
    updateCardGallery();
    updateStats();
    updateHistoryControls();
  });

  const discardSelectedBtn = document.querySelector("#discard-selected-btn");
  discardSelectedBtn?.addEventListener("click", () => {
    const selectedCards = cardManager.getSelectedCards();
    if (selectedCards.length === 0) {
      alert("No cards selected!");
      return;
    }

    if (confirm(`Discard ${selectedCards.length} selected card(s)?`)) {
      const ids = selectedCards.map((c) => c.globalId);
      cardManager.discardCards(ids);
      updateCardGallery();
      updateStats();
      updateHistoryControls();
    }
  });

  const restoreSelectedBtn = document.querySelector("#restore-selected-btn");
  restoreSelectedBtn?.addEventListener("click", () => {
    const selectedCards = cardManager.getSelectedCards();
    if (selectedCards.length === 0) {
      alert("No cards selected!");
      return;
    }

    const ids = selectedCards.map((c) => c.globalId);
    cardManager.restoreCards(ids);
    updateCardGallery();
    updateStats();
    updateHistoryControls();
  });

  const downloadAllBtn = document.querySelector("#download-all-btn");
  downloadAllBtn?.addEventListener("click", handleDownloadAll);

  const undoBtn = document.querySelector("#undo-btn") as HTMLButtonElement;
  undoBtn?.addEventListener("click", () => {
    if (cardManager.undo()) {
      updateCardGallery();
      updateStats();
      updateHistoryControls();
    }
  });

  const redoBtn = document.querySelector("#redo-btn") as HTMLButtonElement;
  redoBtn?.addEventListener("click", () => {
    if (cardManager.redo()) {
      updateCardGallery();
      updateStats();
      updateHistoryControls();
    }
  });

  const resetBtn = document.querySelector("#reset-batch-btn");
  resetBtn?.addEventListener("click", () => {
    if (confirm("Reset and start over? All progress will be lost.")) {
      resetBatch();
    }
  });

  // Composite controls
  const cardsPerRowInput = document.querySelector("#cards-per-row") as HTMLInputElement;
  const cardsPerRowValue = document.querySelector("#cards-per-row-value");
  const spacingInput = document.querySelector("#spacing") as HTMLInputElement;
  const spacingValue = document.querySelector("#spacing-value");
  const backgroundColorInput = document.querySelector("#background-color") as HTMLInputElement;
  const backgroundColorValue = document.querySelector("#background-color-value");
  const scaleModeSelect = document.querySelector("#scale-mode") as HTMLSelectElement;
  const generateCompositeBtn = document.querySelector("#generate-composite-btn");

  cardsPerRowInput?.addEventListener("input", () => {
    if (cardsPerRowValue) {
      cardsPerRowValue.textContent = cardsPerRowInput.value;
    }
  });

  spacingInput?.addEventListener("input", () => {
    if (spacingValue) {
      spacingValue.textContent = `${spacingInput.value}px`;
    }
  });

  backgroundColorInput?.addEventListener("input", () => {
    if (backgroundColorValue) {
      backgroundColorValue.textContent = backgroundColorInput.value;
    }
  });

  generateCompositeBtn?.addEventListener("click", handleGenerateComposite);

  // Keyboard shortcuts
  document.addEventListener("keydown", (e) => {
    // Ctrl+A - Select all
    if (e.ctrlKey && e.key === "a") {
      e.preventDefault();
      cardManager.selectAll();
      updateCardGallery();
      updateStats();
      updateHistoryControls();
    }

    // Escape - Deselect all
    if (e.key === "Escape") {
      cardManager.deselectAll();
      updateCardGallery();
      updateStats();
      updateHistoryControls();
    }

    // Delete - Discard selected
    if (e.key === "Delete") {
      const selectedCards = cardManager.getSelectedCards();
      if (selectedCards.length > 0) {
        const ids = selectedCards.map((c) => c.globalId);
        cardManager.discardCards(ids);
        updateCardGallery();
        updateStats();
        updateHistoryControls();
      }
    }

    // Ctrl+Z - Undo
    if (e.ctrlKey && e.key === "z" && !e.shiftKey) {
      e.preventDefault();
      if (cardManager.undo()) {
        updateCardGallery();
        updateStats();
        updateHistoryControls();
      }
    }

    // Ctrl+Y or Ctrl+Shift+Z - Redo
    if ((e.ctrlKey && e.key === "y") || (e.ctrlKey && e.shiftKey && e.key === "z")) {
      e.preventDefault();
      if (cardManager.redo()) {
        updateCardGallery();
        updateStats();
        updateHistoryControls();
      }
    }
  });

  // Handle batch upload
  async function handleBatchUpload(files: File[]) {
    try {
      uploader.hide();

      // Show progress section
      (progressSection as HTMLElement).style.display = "block";

      // Clear previous batch
      batchProcessor.clear();
      cardManager.cleanup();

      // Add images to processor
      batchProcessor.addImages(files);

      // Update queue display
      progressTracker.updateQueue(batchProcessor.getImages());

      // Process all images
      await batchProcessor.processAll(files, {
        onProgress: (current, total, imageName) => {
          progressTracker.updateProgress(current, total, imageName);
        },
        onImageComplete: () => {
          const stats = batchProcessor.getStats();
          progressTracker.updateStats(stats.completed, stats.total, stats.totalCards);
          progressTracker.updateQueue(batchProcessor.getImages());
        },
        onError: (imageName, error) => {
          console.error(`Error processing ${imageName}:`, error);
        },
      });

      // Processing complete
      progressTracker.setComplete();

      // Load cards into manager
      cardManager.loadFromImages(batchProcessor.getImages());

      // Update gallery
      updateCardGallery();

      // Show controls
      (controlsSection as HTMLElement).style.display = "block";
      (gallerySection as HTMLElement).style.display = "block";
      (compositeSection as HTMLElement).style.display = "block";

      // Set optimal cards per row
      const optimalCardsPerRow = calculateOptimalCardsPerRow(cardManager.getCards(false));
      if (cardsPerRowInput && cardsPerRowValue) {
        cardsPerRowInput.value = optimalCardsPerRow.toString();
        cardsPerRowValue.textContent = optimalCardsPerRow.toString();
      }

      // Update stats
      updateStats();
      updateHistoryControls();
    } catch (error) {
      console.error("Batch processing error:", error);
      alert("Error during batch processing. Please try again.");
    }
  }

  function updateCardGallery() {
    const cards = cardManager.getCards(false);
    cardGallery.update(cards);
  }

  function updateHistoryControls() {
    const undoBtn = document.querySelector("#undo-btn") as HTMLButtonElement;
    const redoBtn = document.querySelector("#redo-btn") as HTMLButtonElement;
    const historyState = document.querySelector("#history-state");

    if (undoBtn) {
      undoBtn.disabled = !cardManager.canUndo();
    }

    if (redoBtn) {
      redoBtn.disabled = !cardManager.canRedo();
    }

    if (historyState) {
      const historyIndex = cardManager.getHistoryIndex();
      const historyLength = cardManager.getHistoryLength();
      historyState.textContent = `History: ${historyIndex + 1}/${historyLength}`;
    }
  }

  function updateStats() {
    const stats = cardManager.getStats();
    const statsDisplay = document.querySelector("#card-stats");

    if (statsDisplay) {
      statsDisplay.innerHTML = `
        <div class="stats-grid">
          <div class="stat-item">
            <span class="stat-label">Total Cards:</span>
            <span class="stat-value">${stats.total}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">Active:</span>
            <span class="stat-value">${stats.active}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">Selected:</span>
            <span class="stat-value">${stats.selected}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">Discarded:</span>
            <span class="stat-value">${stats.discarded}</span>
          </div>
        </div>
      `;
    }
  }

  async function handleDownloadAll() {
    const cards = cardManager.getCards(false);
    if (cards.length === 0) {
      alert("No cards to download!");
      return;
    }

    try {
      await downloadAllCardsAsZip(cards, "batch_extracted_cards.zip");
    } catch (error) {
      console.error("Error downloading cards:", error);
      alert("Error downloading cards. Please try again.");
    }
  }

  function handleGenerateComposite() {
    const cards = cardManager.getCards(false);
    if (cards.length === 0) {
      alert("No cards to generate composite!");
      return;
    }

    try {
      // Get composite options from UI
      const options: CompositeOptions = {
        cardsPerRow: parseInt(cardsPerRowInput.value),
        spacing: parseInt(spacingInput.value),
        backgroundColor: backgroundColorInput.value,
        scaleMode: scaleModeSelect.value as "fit" | "original",
        maxCardWidth: 750,
        maxCardHeight: 1050,
      };

      // Generate composite
      const { composite, layout } = generateComposite(cards, options);

      // Update preview
      compositePreview.update(composite, layout);

      // Show preview section
      (compositePreviewSection as HTMLElement).style.display = "block";

      // Scroll to preview
      compositePreviewSection.scrollIntoView({ behavior: "smooth", block: "start" });
    } catch (error) {
      console.error("Error generating composite:", error);
      alert("Error generating composite. Please try again.");
    }
  }

  async function handleDownloadComposite() {
    const composite = compositePreview.getComposite();
    if (!composite) {
      alert("No composite to download!");
      return;
    }

    try {
      await downloadComposite(composite, "composite.png");
    } catch (error) {
      console.error("Error downloading composite:", error);
      alert("Error downloading composite. Please try again.");
    }
  }

  function resetBatch() {
    batchProcessor.clear();
    cardManager.cleanup();
    progressTracker.clear();
    cardGallery.clear();
    compositePreview.clear();

    (progressSection as HTMLElement).style.display = "none";
    (gallerySection as HTMLElement).style.display = "none";
    (controlsSection as HTMLElement).style.display = "none";
    (compositeSection as HTMLElement).style.display = "none";
    (compositePreviewSection as HTMLElement).style.display = "none";

    uploader.show();
    uploader.reset();
  }
}

// Start the application
init();
