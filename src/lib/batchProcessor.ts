/**
 * Batch Processor Module
 * Handles processing multiple images and extracting all cards
 */

import {
  loadImageFromFile,
  preprocessImage,
  cleanupMats,
  type PreprocessingOptions,
  type PreprocessingResult,
} from "./imageProcessor";
import {
  detectCards,
  cleanupDetectedCards,
  type CardDetectionOptions,
  type CardDetectionResult,
} from "./cardDetector";
import {
  extractAllCards,
  type ExtractedCard,
  type CardExtractionOptions,
} from "./cardExtractor";

export interface ProcessedImage {
  id: string;
  fileName: string;
  fileSize: number;
  originalMat: any; // cv.Mat
  preprocessingResult: PreprocessingResult | null;
  detectionResult: CardDetectionResult | null;
  extractedCards: ExtractedCard[];
  timestamp: Date;
  status: "pending" | "processing" | "completed" | "error";
  error?: string;
}

export interface BatchProcessingOptions {
  preprocessingOptions?: PreprocessingOptions;
  detectionOptions?: CardDetectionOptions;
  extractionOptions?: CardExtractionOptions;
  onProgress?: (current: number, total: number, imageName: string) => void;
  onImageComplete?: (processedImage: ProcessedImage) => void;
  onError?: (imageName: string, error: Error) => void;
}

export class BatchProcessor {
  private images: ProcessedImage[] = [];
  private isProcessing: boolean = false;

  /**
   * Add images to the processing queue
   */
  addImages(files: File[]): void {
    const newImages = files.map((file, index) => ({
      id: `img_${String(this.images.length + index + 1).padStart(3, "0")}`,
      fileName: file.name,
      fileSize: file.size,
      originalMat: null,
      preprocessingResult: null,
      detectionResult: null,
      extractedCards: [],
      timestamp: new Date(),
      status: "pending" as const,
    }));

    this.images.push(...newImages);
  }

  /**
   * Get all images in the queue
   */
  getImages(): ProcessedImage[] {
    return this.images;
  }

  /**
   * Get total number of extracted cards across all images
   */
  getTotalCardCount(): number {
    return this.images.reduce(
      (sum, img) => sum + img.extractedCards.length,
      0
    );
  }

  /**
   * Clear all images and reset
   */
  clear(): void {
    // Cleanup OpenCV mats
    this.images.forEach((img) => {
      if (img.originalMat) img.originalMat.delete();
      if (img.preprocessingResult) {
        cleanupMats(img.preprocessingResult);
      }
      if (img.detectionResult) {
        cleanupDetectedCards(img.detectionResult.cards);
      }
    });

    this.images = [];
    this.isProcessing = false;
  }

  /**
   * Process all images in the queue
   */
  async processAll(
    files: File[],
    options: BatchProcessingOptions = {}
  ): Promise<void> {
    if (this.isProcessing) {
      throw new Error("Batch processing already in progress");
    }

    this.isProcessing = true;
    const total = this.images.length;

    try {
      for (let i = 0; i < this.images.length; i++) {
        const image = this.images[i];
        const file = files[i];

        // Update progress
        if (options.onProgress) {
          options.onProgress(i + 1, total, image.fileName);
        }

        try {
          // Update status
          image.status = "processing";

          // Load image
          image.originalMat = await loadImageFromFile(file);

          // Preprocess
          image.preprocessingResult = preprocessImage(
            image.originalMat,
            options.preprocessingOptions
          );

          // Detect cards
          image.detectionResult = detectCards(
            image.preprocessingResult.processed,
            image.originalMat,
            options.detectionOptions
          );

          // Extract cards
          if (image.detectionResult.cards.length > 0) {
            const extractedCards = extractAllCards(
              image.originalMat,
              image.detectionResult.cards,
              options.extractionOptions
            );

            // Add global IDs to cards
            image.extractedCards = extractedCards.map((card, cardIndex) => ({
              ...card,
              cardNumber: cardIndex + 1,
            }));
          }

          // Update status
          image.status = "completed";

          // Notify completion
          if (options.onImageComplete) {
            options.onImageComplete(image);
          }
        } catch (error) {
          image.status = "error";
          image.error =
            error instanceof Error ? error.message : "Unknown error";

          if (options.onError) {
            options.onError(
              image.fileName,
              error instanceof Error ? error : new Error("Unknown error")
            );
          }
        }
      }
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Get processing statistics
   */
  getStats() {
    const completed = this.images.filter((img) => img.status === "completed")
      .length;
    const errors = this.images.filter((img) => img.status === "error").length;
    const pending = this.images.filter((img) => img.status === "pending")
      .length;
    const totalCards = this.getTotalCardCount();

    return {
      total: this.images.length,
      completed,
      errors,
      pending,
      totalCards,
      isProcessing: this.isProcessing,
    };
  }
}
