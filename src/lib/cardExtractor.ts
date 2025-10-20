/**
 * Card Extractor Module
 * Extracts individual cards from detected contours using perspective transform
 */

import cv from "opencv-ts";
import JSZip from "jszip";
import { orderCorners } from "./cardDetector";
import type {
  CardExtractionOptions,
  DetectedCard,
  ExtractedCard,
} from "./types";
import { cardExtractionOptions } from "./defaults";

// Re-export types for convenience
export type { CardExtractionOptions, DetectedCard, ExtractedCard };

/**
 * Extract a single card using perspective transform
 */
export function extractCard(
  sourceImage: any,
  detectedCard: DetectedCard,
  options: CardExtractionOptions = {}
): any {
  const { outputWidth = 750, outputHeight = 1050 } = {
    ...cardExtractionOptions,
    ...options,
  };

  // Order corners: top-left, top-right, bottom-right, bottom-left
  const orderedCorners = orderCorners(detectedCard.corners);

  // Calculate the width and height of the detected card
  const topWidth = Math.sqrt(
    Math.pow(orderedCorners[1].x - orderedCorners[0].x, 2) +
      Math.pow(orderedCorners[1].y - orderedCorners[0].y, 2)
  );
  const bottomWidth = Math.sqrt(
    Math.pow(orderedCorners[2].x - orderedCorners[3].x, 2) +
      Math.pow(orderedCorners[2].y - orderedCorners[3].y, 2)
  );
  const leftHeight = Math.sqrt(
    Math.pow(orderedCorners[3].x - orderedCorners[0].x, 2) +
      Math.pow(orderedCorners[3].y - orderedCorners[0].y, 2)
  );
  const rightHeight = Math.sqrt(
    Math.pow(orderedCorners[2].x - orderedCorners[1].x, 2) +
      Math.pow(orderedCorners[2].y - orderedCorners[1].y, 2)
  );

  // Average width and height
  const cardWidth = (topWidth + bottomWidth) / 2;
  const cardHeight = (leftHeight + rightHeight) / 2;

  // Determine if card is in portrait or landscape based on detected dimensions
  const isPortrait = cardHeight > cardWidth;

  // Set output dimensions based on card orientation
  let finalOutputWidth: number;
  let finalOutputHeight: number;

  if (isPortrait) {
    // Card is portrait, use portrait output (750x1050)
    finalOutputWidth = outputWidth;
    finalOutputHeight = outputHeight;
  } else {
    // Card is landscape, swap dimensions (1050x750)
    finalOutputWidth = outputHeight;
    finalOutputHeight = outputWidth;
  }

  // Source points (detected card corners)
  const srcPoints = new cv.Mat(4, 1, cv.CV_32FC2);
  for (let i = 0; i < 4; i++) {
    srcPoints.data32F[i * 2] = orderedCorners[i].x;
    srcPoints.data32F[i * 2 + 1] = orderedCorners[i].y;
  }

  // Destination points (standardized rectangle with correct orientation)
  const dstPoints = new cv.Mat(4, 1, cv.CV_32FC2);
  const dstCorners = [
    { x: 0, y: 0 }, // Top-left
    { x: finalOutputWidth, y: 0 }, // Top-right
    { x: finalOutputWidth, y: finalOutputHeight }, // Bottom-right
    { x: 0, y: finalOutputHeight }, // Bottom-left
  ];

  for (let i = 0; i < 4; i++) {
    dstPoints.data32F[i * 2] = dstCorners[i].x;
    dstPoints.data32F[i * 2 + 1] = dstCorners[i].y;
  }

  // Calculate perspective transform matrix
  const transformMatrix = cv.getPerspectiveTransform(srcPoints, dstPoints);

  // Apply perspective warp
  const extractedCard = new cv.Mat();
  const dsize = new cv.Size(finalOutputWidth, finalOutputHeight);
  cv.warpPerspective(
    sourceImage,
    extractedCard,
    transformMatrix,
    dsize,
    cv.INTER_LINEAR,
    cv.BORDER_CONSTANT,
    new cv.Scalar()
  );

  // Clean up
  srcPoints.delete();
  dstPoints.delete();
  transformMatrix.delete();

  return extractedCard;
}

/**
 * Extract all detected cards
 */
export function extractAllCards(
  sourceImage: any,
  detectedCards: DetectedCard[],
  options: CardExtractionOptions = {}
): ExtractedCard[] {
  const extractedCards: ExtractedCard[] = [];

  detectedCards.forEach((detectedCard, index) => {
    const extractedImage = extractCard(sourceImage, detectedCard, options);

    extractedCards.push({
      image: extractedImage,
      originalCorners: detectedCard.corners,
      cardNumber: index + 1,
    });
  });

  return extractedCards;
}

/**
 * Convert cv.Mat to data URL for download/preview
 */
export function matToDataURL(mat: any, format: string = "image/png"): string {
  const canvas = document.createElement("canvas");
  canvas.width = mat.cols;
  canvas.height = mat.rows;
  cv.imshow(canvas, mat);
  return canvas.toDataURL(format);
}

/**
 * Download a single card as an image file
 */
export function downloadCard(
  extractedCard: ExtractedCard,
  filename?: string
): void {
  const dataURL = matToDataURL(extractedCard.image);
  const defaultFilename = `card_${String(extractedCard.cardNumber).padStart(
    3,
    "0"
  )}.png`;

  const link = document.createElement("a");
  link.href = dataURL;
  link.download = filename || defaultFilename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Download all cards as a ZIP file
 */
export async function downloadAllCardsAsZip(
  extractedCards: ExtractedCard[],
  zipFilename: string = "extracted_cards.zip"
): Promise<void> {
  const zip = new JSZip();

  // Add each card to the ZIP
  extractedCards.forEach((card) => {
    const dataURL = matToDataURL(card.image);
    // Remove the data URL prefix to get base64 data
    const base64Data = dataURL.split(",")[1];
    const filename = `card_${String(card.cardNumber).padStart(3, "0")}.png`;
    zip.file(filename, base64Data, { base64: true });
  });

  // Generate ZIP file
  const blob = await zip.generateAsync({ type: "blob" });

  // Download ZIP
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = zipFilename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(link.href);
}

/**
 * Clean up extracted card resources
 */
export function cleanupExtractedCards(cards: ExtractedCard[]): void {
  cards.forEach((card) => {
    if (card.image) {
      card.image.delete();
    }
  });
}
