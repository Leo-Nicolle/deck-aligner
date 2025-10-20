import { detectCards } from "./cardDetector";
import { extractAllCards } from "./cardExtractor";
import { loadImageFromFile, preprocessImage } from "./imageProcessor";
import { v4 as uuid } from "uuid";
import type { ProcessedImage, ProcessingOptions } from "./types";

// export class Worker extends TypedEventTarget<ProcessorEvents> {
//   private options: ProcessingOptions;
//   constructor(options: ProcessingOptions) {
//     super();
//     this.options = options;
//   }

export async function run(options: ProcessingOptions, file: File) {
  const image: ProcessedImage = {
    id: uuid(),
    fileName: file.name,
    fileSize: file.size,
    timestamp: new Date(Date.now()),
    originalMat: null,
    preprocessingResult: null,
    detectionResult: null,
    extractedCards: [],
    status: "pending" as const,
  };
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
  } catch (error) {
    image.status = "error";
    image.error = error instanceof Error ? error.message : "Unknown error";
  }
  return image;
}

export async function batchRun(options: ProcessingOptions, file: File[]) {
  const results: ProcessedImage[] = [];
  for (const f of file) {
    const result = await run(options, f);
    results.push(result);
  }
  return results;
}
