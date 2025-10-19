import "./style.css";
import {
  loadImageFromFile,
  loadImageFromURL,
  preprocessImage,
  cleanupMats,
  type PreprocessingOptions,
} from "./lib/imageProcessor";
import {
  detectCards,
  cleanupDetectedCards,
  type CardDetectionOptions,
  type CardDetectionResult,
} from "./lib/cardDetector";
import {
  extractAllCards,
  cleanupExtractedCards,
  downloadAllCardsAsZip,
  type ExtractedCard,
} from "./lib/cardExtractor";
import { ImageUploader } from "./components/ImageUploader";
import { PreprocessingPreview } from "./components/PreprocessingPreview";
import { DetectionPreview } from "./components/DetectionPreview";
import { CardGallery } from "./components/CardGallery";

// Application State
let currentImageMat: any = null;
let preprocessingResult: any = null;
let detectionResult: CardDetectionResult | null = null;
let extractedCards: ExtractedCard[] = [];

// Initialize the app
async function init() {
  const app = document.querySelector<HTMLDivElement>("#app")!;

  // Show loading state
  app.innerHTML = `
    <div class="loading">
      <div class="spinner"></div>
      <p>Loading OpenCV.js...</p>
    </div>
  `;

  try {
    // Load OpenCV.js

    // Setup UI
    app.innerHTML = `
      <div class="container">
        <header>
          <h1>Card Extractor</h1>
          <p>Upload a scanned image of multiple cards to detect, extract, and download them</p>
          <div class="mode-switch">
            <a href="/batch.html" class="upload-btn">Batch Mode (Multiple Images)</a>
          </div>
        </header>

        <section id="upload-section"></section>

        <section id="controls-section" style="display: none;">
          <div class="controls">
            <h2 class="collapsible">Detection Options <span class="toggle-icon">▼</span></h2>
            <div class="collapsible-content">
              <div class="control-group">
                <label for="min-area">Min Card Area (%): <span id="min-area-value">1</span></label>
                <input type="range" id="min-area" min="0.1" max="10" step="0.1" value="1">
              </div>
              <div class="control-group">
                <label for="max-area">Max Card Area (%): <span id="max-area-value">50</span></label>
                <input type="range" id="max-area" min="10" max="80" step="1" value="50">
              </div>
              <div class="control-group">
                <label for="min-aspect">Min Aspect Ratio: <span id="min-aspect-value">1.2</span></label>
                <input type="range" id="min-aspect" min="0.5" max="2.0" step="0.1" value="0.6">
              </div>
              <div class="control-group">
                <label for="max-aspect">Max Aspect Ratio: <span id="max-aspect-value">1.8</span></label>
                <input type="range" id="max-aspect" min="1.0" max="3.0" step="0.1" value="2.6">
              </div>
              <div class="control-group">
                <label for="min-solidity">Min Solidity: <span id="min-solidity-value">0.85</span></label>
                <input type="range" id="min-solidity" min="0.5" max="1.0" step="0.01" value="0.71">
              </div>
              <button id="detect-btn" class="upload-btn">Detect Cards</button>
            </div>

            <h2 class="collapsible">Extraction Options <span class="toggle-icon">▼</span></h2>
            <div class="collapsible-content">
              <div class="control-group">
                <label for="output-width">Output Width (px): <span id="output-width-value">750</span></label>
                <input type="number" id="output-width" min="100" max="3000" step="10" value="750">
              </div>
              <div class="control-group">
                <label for="output-height">Output Height (px): <span id="output-height-value">1050</span></label>
                <input type="number" id="output-height" min="100" max="3000" step="10" value="1050">
              </div>
              <div class="aspect-ratio-display">
                <strong>Aspect Ratio:</strong> <span id="aspect-ratio-value">1.40 (5:7)</span>
              </div>
              <button id="extract-btn" class="upload-btn" disabled>Extract Cards</button>
            </div>

            <h2 class="collapsible collapsed">Preprocessing Options <span class="toggle-icon">▶</span></h2>
            <div class="collapsible-content" style="display: none;">
              <div class="control-group">
                <label for="blur-kernel">Blur Kernel Size: <span id="blur-value">5</span></label>
                <input type="range" id="blur-kernel" min="3" max="15" step="2" value="5">
              </div>
              <div class="control-group">
                <label for="morph-kernel">Morphology Kernel Size: <span id="morph-value">3</span></label>
                <input type="range" id="morph-kernel" min="1" max="11" step="2" value="3">
              </div>
              <div class="control-group">
                <label>
                  <input type="checkbox" id="adaptive-threshold">
                  Use Adaptive Threshold (better for uneven lighting)
                </label>
              </div>
            </div>

            <button id="reset-btn" class="upload-btn" style="background-color: #666; margin-top: 1rem;">Upload New Image</button>
          </div>
        </section>

        <section id="detection-section" style="display: none;"></section>

        <section id="gallery-section" style="display: none;"></section>

        <section id="preview-section" style="display: none;"></section>

        <div id="processing-feedback" class="processing-feedback" style="display: none;">
          <div class="spinner"></div>
          <p id="processing-message">Processing...</p>
        </div>

        <div id="error-feedback" class="error-feedback" style="display: none;">
          <h3 id="error-title">Error</h3>
          <p id="error-message"></p>
          <button id="dismiss-error" class="upload-btn">Dismiss</button>
        </div>

        <section id="test-images-section">
          <h2>Or Try Test Images</h2>
          <div style="display: flex; gap: 1rem; flex-wrap: wrap; justify-content: center;">
            <button class="upload-btn test-img-btn" data-img="scan.png">scan.png</button>
            <button class="upload-btn test-img-btn" data-img="scan-1.png">scan-1.png</button>
            <button class="upload-btn test-img-btn" data-img="scan-2.png">scan-2.png</button>
            <button class="upload-btn test-img-btn" data-img="scan-3.png">scan-3.png</button>
          </div>
        </section>
      </div>
    `;

    // Initialize components
    const uploadSection = document.querySelector("#upload-section")!;
    const previewSection = document.querySelector("#preview-section")!;
    const detectionSection = document.querySelector("#detection-section")!;
    const gallerySection = document.querySelector("#gallery-section")!;
    const controlsSection = document.querySelector(
      "#controls-section"
    )! as HTMLElement;

    const uploader = new ImageUploader(uploadSection as HTMLElement, {
      onImageSelected: handleImageSelected,
    });

    const preview = new PreprocessingPreview(previewSection as HTMLElement);
    const detectionPreview = new DetectionPreview(
      detectionSection as HTMLElement
    );
    const cardGallery = new CardGallery(gallerySection as HTMLElement, {
      onDownloadAll: handleDownloadAllCards,
    });

    // Setup event listeners
    const detectBtn = document.querySelector("#detect-btn")!;
    detectBtn.addEventListener("click", () => {
      if (currentImageMat && preprocessingResult) {
        detectAndDisplayCards();
      }
    });

    const extractBtn = document.querySelector("#extract-btn")!;
    extractBtn.addEventListener("click", () => {
      if (detectionResult && detectionResult.cards.length > 0) {
        extractAndDisplayCards();
      }
    });

    const resetBtn = document.querySelector("#reset-btn")!;
    resetBtn.addEventListener("click", () => {
      uploader.reset();
      preview.clear();
      detectionPreview.clear();
      cardGallery.clear();
      if (preprocessingResult) {
        cleanupMats(preprocessingResult);
        preprocessingResult = null;
      }
      if (detectionResult) {
        cleanupDetectedCards(detectionResult.cards);
        detectionResult = null;
      }
      if (extractedCards.length > 0) {
        cleanupExtractedCards(extractedCards);
        extractedCards = [];
      }
      if (currentImageMat) {
        currentImageMat.delete();
        currentImageMat = null;
      }
      (controlsSection as HTMLElement).style.display = "none";
      (previewSection as HTMLElement).style.display = "none";
      (detectionSection as HTMLElement).style.display = "none";
      (gallerySection as HTMLElement).style.display = "none";
    });

    // Update slider value displays for preprocessing
    const blurKernel = document.querySelector(
      "#blur-kernel"
    ) as HTMLInputElement;
    const blurValue = document.querySelector("#blur-value")!;
    blurKernel.addEventListener("input", (e) => {
      blurValue.textContent = (e.target as HTMLInputElement).value;
    });

    const morphKernel = document.querySelector(
      "#morph-kernel"
    ) as HTMLInputElement;
    const morphValue = document.querySelector("#morph-value")!;
    morphKernel.addEventListener("input", (e) => {
      morphValue.textContent = (e.target as HTMLInputElement).value;
    });

    // Debounce function for real-time updates
    let detectionDebounceTimer: number | null = null;
    const debounceDetection = () => {
      if (detectionDebounceTimer) {
        clearTimeout(detectionDebounceTimer);
      }
      detectionDebounceTimer = window.setTimeout(() => {
        if (preprocessingResult && currentImageMat) {
          detectAndDisplayCards();
        }
      }, 500);
    };

    // Update slider value displays for detection with real-time preview
    const minArea = document.querySelector("#min-area") as HTMLInputElement;
    const minAreaValue = document.querySelector("#min-area-value")!;
    minArea.addEventListener("input", (e) => {
      minAreaValue.textContent = (e.target as HTMLInputElement).value;
      debounceDetection();
    });

    const maxArea = document.querySelector("#max-area") as HTMLInputElement;
    const maxAreaValue = document.querySelector("#max-area-value")!;
    maxArea.addEventListener("input", (e) => {
      maxAreaValue.textContent = (e.target as HTMLInputElement).value;
      debounceDetection();
    });

    const minAspect = document.querySelector("#min-aspect") as HTMLInputElement;
    const minAspectValue = document.querySelector("#min-aspect-value")!;
    minAspect.addEventListener("input", (e) => {
      minAspectValue.textContent = (e.target as HTMLInputElement).value;
      debounceDetection();
    });

    const maxAspect = document.querySelector("#max-aspect") as HTMLInputElement;
    const maxAspectValue = document.querySelector("#max-aspect-value")!;
    maxAspect.addEventListener("input", (e) => {
      maxAspectValue.textContent = (e.target as HTMLInputElement).value;
      debounceDetection();
    });

    const minSolidity = document.querySelector(
      "#min-solidity"
    ) as HTMLInputElement;
    const minSolidityValue = document.querySelector("#min-solidity-value")!;
    minSolidity.addEventListener("input", (e) => {
      minSolidityValue.textContent = (e.target as HTMLInputElement).value;
      debounceDetection();
    });

    // Update output dimensions and aspect ratio
    const outputWidth = document.querySelector("#output-width") as HTMLInputElement;
    const outputHeight = document.querySelector("#output-height") as HTMLInputElement;
    const outputWidthValue = document.querySelector("#output-width-value")!;
    const outputHeightValue = document.querySelector("#output-height-value")!;
    const aspectRatioValue = document.querySelector("#aspect-ratio-value")!;

    const updateAspectRatio = () => {
      const width = parseInt(outputWidth.value);
      const height = parseInt(outputHeight.value);
      outputWidthValue.textContent = width.toString();
      outputHeightValue.textContent = height.toString();

      const ratio = height / width;

      // Find common ratios
      let ratioDisplay = ratio.toFixed(2);

      // Check for common card ratios
      if (Math.abs(ratio - 1.4) < 0.01) {
        ratioDisplay += " (5:7)";
      } else if (Math.abs(ratio - 1.5) < 0.01) {
        ratioDisplay += " (2:3)";
      } else if (Math.abs(ratio - 1.414) < 0.01) {
        ratioDisplay += " (√2:1, A-series)";
      } else if (Math.abs(ratio - 1.6) < 0.01) {
        ratioDisplay += " (5:8)";
      } else if (Math.abs(ratio - 1.618) < 0.01) {
        ratioDisplay += " (Golden Ratio)";
      } else {
        // Calculate GCD for simplest ratio
        const gcd = (a: number, b: number): number => b === 0 ? a : gcd(b, a % b);
        const divisor = gcd(width, height);
        ratioDisplay += ` (${width / divisor}:${height / divisor})`;
      }

      aspectRatioValue.textContent = ratioDisplay;
    };

    outputWidth.addEventListener("input", updateAspectRatio);
    outputHeight.addEventListener("input", updateAspectRatio);

    // Initialize aspect ratio display
    updateAspectRatio();

    // Collapsible sections
    const setupCollapsible = () => {
      const collapsibleHeaders = document.querySelectorAll(".collapsible");
      collapsibleHeaders.forEach((header) => {
        header.addEventListener("click", () => {
          const content = header.nextElementSibling as HTMLElement;
          const icon = header.querySelector(".toggle-icon");

          if (content && content.classList.contains("collapsible-content")) {
            const isCollapsed = header.classList.contains("collapsed");

            if (isCollapsed) {
              // Expand
              header.classList.remove("collapsed");
              content.style.display = "";
              if (icon) icon.textContent = "▼";
            } else {
              // Collapse
              header.classList.add("collapsed");
              content.style.display = "none";
              if (icon) icon.textContent = "▶";
            }
          }
        });
      });
    };

    // Setup collapsible sections initially
    setupCollapsible();

    // Error dismiss handler
    const dismissErrorBtn = document.querySelector("#dismiss-error");
    dismissErrorBtn?.addEventListener("click", () => {
      const errorFeedback = document.querySelector("#error-feedback") as HTMLElement;
      if (errorFeedback) {
        errorFeedback.style.display = "none";
      }
    });

    // Processing feedback functions
    function showProcessingFeedback(message: string) {
      const feedback = document.querySelector("#processing-feedback") as HTMLElement;
      const messageEl = document.querySelector("#processing-message");
      if (feedback && messageEl) {
        messageEl.textContent = message;
        feedback.style.display = "flex";
      }
    }

    function hideProcessingFeedback() {
      const feedback = document.querySelector("#processing-feedback") as HTMLElement;
      if (feedback) {
        feedback.style.display = "none";
      }
    }

    function showError(title: string, message: string) {
      const errorFeedback = document.querySelector("#error-feedback") as HTMLElement;
      const errorTitle = document.querySelector("#error-title");
      const errorMessage = document.querySelector("#error-message");

      if (errorFeedback && errorTitle && errorMessage) {
        errorTitle.textContent = title;
        errorMessage.textContent = message;
        errorFeedback.style.display = "block";
      }
    }

    // Test image buttons
    const testImgButtons = document.querySelectorAll(".test-img-btn");
    testImgButtons.forEach((btn) => {
      btn.addEventListener("click", async () => {
        const imgName = (btn as HTMLElement).dataset.img!;
        await handleTestImage(imgName, preview);
      });
    });

    // Handler for image selection
    async function handleImageSelected(file: File) {
      try {
        // Clean up previous image
        if (currentImageMat) {
          currentImageMat.delete();
        }
        if (preprocessingResult) {
          cleanupMats(preprocessingResult);
        }

        // Load new image
        currentImageMat = await loadImageFromFile(file);
        await processImage(currentImageMat, preview);
      } catch (error) {
        console.error("Error processing image:", error);
        alert("Error processing image. Please try again.");
      }
    }

    // Handler for test images
    async function handleTestImage(
      imageName: string,
      preview: PreprocessingPreview
    ) {
      try {
        // Clean up previous image
        if (currentImageMat) {
          currentImageMat.delete();
        }
        if (preprocessingResult) {
          cleanupMats(preprocessingResult);
        }

        // Load test image
        currentImageMat = await loadImageFromURL(`/${imageName}`);
        await processImage(currentImageMat, preview);
      } catch (error) {
        console.error("Error loading test image:", error);
        alert("Error loading test image. Please try again.");
      }
    }

    // Process image and show results
    function processImage(imageMat: any, preview: PreprocessingPreview) {
      try {
        showProcessingFeedback("Preprocessing image...");

        // Clean up previous preprocessing result
        if (preprocessingResult) {
          cleanupMats(preprocessingResult, false);
        }

        // Get preprocessing options from UI
        const options: PreprocessingOptions = {
          blurKernelSize: parseInt(
            (document.querySelector("#blur-kernel") as HTMLInputElement).value
          ),
          morphologyKernelSize: parseInt(
            (document.querySelector("#morph-kernel") as HTMLInputElement).value
          ),
          useAdaptiveThreshold: (
            document.querySelector("#adaptive-threshold") as HTMLInputElement
          ).checked,
        };

        // Run preprocessing pipeline
        preprocessingResult = preprocessImage(imageMat, options);

        // Update preview
        preview.update(preprocessingResult);

        // Show controls and preview sections
        (controlsSection as HTMLElement).style.display = "block";
        (previewSection as HTMLElement).style.display = "block";

        hideProcessingFeedback();

        // Automatically detect cards after preprocessing
        detectAndDisplayCards();
      } catch (error) {
        console.error("Error during preprocessing:", error);
        hideProcessingFeedback();
        showError("Preprocessing Failed", "Error during image preprocessing. Please try again with a different image.");
      }
    }

    // Detect and display cards
    function detectAndDisplayCards() {
      try {
        showProcessingFeedback("Detecting cards...");

        if (!preprocessingResult || !currentImageMat) {
          console.error("No preprocessed image available");
          hideProcessingFeedback();
          return;
        }

        // Clean up previous detection result
        if (detectionResult) {
          cleanupDetectedCards(detectionResult.cards);
        }

        // Get detection options from UI
        const options: CardDetectionOptions = {
          minAreaRatio:
            parseFloat(
              (document.querySelector("#min-area") as HTMLInputElement).value
            ) / 100,
          maxAreaRatio:
            parseFloat(
              (document.querySelector("#max-area") as HTMLInputElement).value
            ) / 100,
          minAspectRatio: parseFloat(
            (document.querySelector("#min-aspect") as HTMLInputElement).value
          ),
          maxAspectRatio: parseFloat(
            (document.querySelector("#max-aspect") as HTMLInputElement).value
          ),
          minSolidity: parseFloat(
            (document.querySelector("#min-solidity") as HTMLInputElement).value
          ),
        };

        // Run card detection on the processed binary image
        detectionResult = detectCards(
          preprocessingResult.processed,
          currentImageMat,
          options
        );

        // Update detection preview
        detectionPreview.update(currentImageMat, detectionResult);

        // Show detection section
        (detectionSection as HTMLElement).style.display = "block";

        hideProcessingFeedback();

        // Enable extract button if cards were detected
        const extractBtn = document.querySelector("#extract-btn") as HTMLButtonElement;
        if (detectionResult.cards.length > 0) {
          extractBtn.disabled = false;
          // Automatically extract cards after detection
          extractAndDisplayCards();
        } else {
          extractBtn.disabled = true;
          showError(
            "No Cards Detected",
            `Found ${detectionResult.totalContours} contours but none matched the card criteria. Try:\n\n` +
            "• Adjusting the Min/Max Card Area sliders\n" +
            "• Changing the Aspect Ratio range\n" +
            "• Reducing the Min Solidity value\n" +
            "• Using Adaptive Threshold for uneven lighting\n" +
            "• Ensuring cards are on a contrasting background"
          );
        }
      } catch (error) {
        console.error("Error during card detection:", error);
        hideProcessingFeedback();
        showError("Detection Failed", "Error during card detection. Please try uploading a clearer image.");
      }
    }

    // Extract and display cards
    function extractAndDisplayCards() {
      try {
        showProcessingFeedback(`Extracting ${detectionResult?.cards.length || 0} cards...`);

        if (!currentImageMat || !detectionResult) {
          console.error("No image or detection result available");
          hideProcessingFeedback();
          return;
        }

        // Clean up previous extracted cards
        if (extractedCards.length > 0) {
          cleanupExtractedCards(extractedCards);
        }

        // Get extraction options from UI
        const outputWidth = parseInt(
          (document.querySelector("#output-width") as HTMLInputElement).value
        );
        const outputHeight = parseInt(
          (document.querySelector("#output-height") as HTMLInputElement).value
        );

        // Extract all detected cards with custom dimensions
        extractedCards = extractAllCards(
          currentImageMat,
          detectionResult.cards,
          { outputWidth, outputHeight }
        );

        // Update gallery
        cardGallery.update(extractedCards);

        // Show gallery section
        (gallerySection as HTMLElement).style.display = "block";

        hideProcessingFeedback();
      } catch (error) {
        console.error("Error during card extraction:", error);
        hideProcessingFeedback();
        showError("Extraction Failed", "Error extracting cards. The detected corners may be invalid. Try adjusting detection parameters.");
      }
    }

    // Download all cards as ZIP
    async function handleDownloadAllCards() {
      try {
        if (extractedCards.length === 0) {
          alert("No cards to download!");
          return;
        }

        await downloadAllCardsAsZip(extractedCards);
      } catch (error) {
        console.error("Error downloading cards:", error);
        alert("Error downloading cards. Please try again.");
      }
    }
  } catch (error) {
    console.error("Failed to initialize:", error);
    app.innerHTML = `
      <div class="error">
        <h2>Failed to load OpenCV.js</h2>
        <p>Please refresh the page and try again.</p>
        <p>Error: ${
          error instanceof Error ? error.message : "Unknown error"
        }</p>
      </div>
    `;
  }
}

// Start the application
init();
