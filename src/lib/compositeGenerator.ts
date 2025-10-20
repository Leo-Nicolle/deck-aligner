/**
 * Composite Generator Module
 * Generates composite images from multiple cards in grid layouts
 */

import cv from "opencv-ts";
import type {
  CardPosition,
  CompositeOptions,
  CompositeResult,
  LayoutInfo,
  ManagedCard,
} from "./types";
import { compositeOptions } from "./defaults";

/**
 * Generate composite image from cards
 */
export function generateComposite(
  cards: ManagedCard[],
  options: CompositeOptions
): CompositeResult {
  options = {
    ...compositeOptions,
    ...options,
  };
  if (cards.length === 0) {
    throw new Error("No cards to composite");
  }

  // Calculate layout dimensions
  const layout = calculateLayout(cards, options);

  // Create canvas
  const composite = createCanvas(
    layout.totalWidth,
    layout.totalHeight,
    options.backgroundColor
  );

  // Place cards on canvas
  layout.cardPositions.forEach((pos) => {
    const card = cards.find((c) => c.globalId === pos.cardId);
    if (!card) return;

    // Resize card if needed
    let cardImage = card.image;
    if (
      options.scaleMode === "fit" &&
      (pos.width !== card.image.cols || pos.height !== card.image.rows)
    ) {
      cardImage = new cv.Mat();
      const dsize = new cv.Size(pos.width, pos.height);
      cv.resize(card.image, cardImage, dsize, 0, 0, cv.INTER_LINEAR);
    }

    // Copy card to composite at position
    try {
      const roi = composite.roi(
        new cv.Rect(pos.x, pos.y, pos.width, pos.height)
      );
      cardImage.copyTo(roi);
      roi.delete();

      // Clean up resized image
      if (cardImage !== card.image) {
        cardImage.delete();
      }
    } catch (error) {
      console.error(`Error placing card ${pos.cardId}:`, error);
      if (cardImage !== card.image) {
        cardImage.delete();
      }
    }
  });

  return { composite, layout };
}

/**
 * Calculate layout dimensions and card positions
 */
function calculateLayout(
  cards: ManagedCard[],
  options: CompositeOptions
): LayoutInfo {
  const { cardsPerRow, spacing, scaleMode, maxCardWidth, maxCardHeight } =
    options;

  // Determine card dimensions based on scale mode
  let cardWidth: number;
  let cardHeight: number;

  if (scaleMode === "fit" && maxCardWidth && maxCardHeight) {
    // Find the maximum dimensions among all cards
    const maxOriginalWidth = Math.max(...cards.map((c) => c.image.cols));
    const maxOriginalHeight = Math.max(...cards.map((c) => c.image.rows));

    // Calculate scale factor to fit within max dimensions
    const scaleX = maxCardWidth / maxOriginalWidth;
    const scaleY = maxCardHeight / maxOriginalHeight;
    const scale = Math.min(scaleX, scaleY, 1); // Don't upscale

    cardWidth = Math.round(maxOriginalWidth * scale);
    cardHeight = Math.round(maxOriginalHeight * scale);
  } else {
    // Use original dimensions (use first card as reference)
    cardWidth = cards[0].image.cols;
    cardHeight = cards[0].image.rows;
  }

  // Calculate grid dimensions
  const cols = Math.min(cardsPerRow, cards.length);
  const rows = Math.ceil(cards.length / cols);

  // Calculate total dimensions
  const totalWidth = cols * cardWidth + (cols + 1) * spacing;
  const totalHeight = rows * cardHeight + (rows + 1) * spacing;

  // Calculate card positions
  const cardPositions: CardPosition[] = [];

  cards.forEach((card, index) => {
    const row = Math.floor(index / cols);
    const col = index % cols;

    const x = spacing + col * (cardWidth + spacing);
    const y = spacing + row * (cardHeight + spacing);

    // Scale individual card if needed
    let width = cardWidth;
    let height = cardHeight;

    if (scaleMode === "fit") {
      // Maintain aspect ratio for each card
      const aspectRatio = card.image.rows / card.image.cols;
      const targetAspectRatio = cardHeight / cardWidth;

      if (aspectRatio > targetAspectRatio) {
        // Card is taller, fit to height
        height = cardHeight;
        width = Math.round(cardHeight / aspectRatio);
      } else {
        // Card is wider, fit to width
        width = cardWidth;
        height = Math.round(cardWidth * aspectRatio);
      }
    }

    cardPositions.push({
      cardId: card.globalId,
      x,
      y,
      width,
      height,
      row,
      col,
    });
  });

  return {
    totalWidth,
    totalHeight,
    rows,
    cols,
    cardPositions,
  };
}

/**
 * Create blank canvas with background color
 */
function createCanvas(
  width: number,
  height: number,
  backgroundColor: string
): any {
  const canvas = new cv.Mat(height, width, cv.CV_8UC4);

  // Parse hex color to RGBA
  const [r, g, b, a] = hexToRgba(backgroundColor);

  // Fill with background color
  canvas.setTo(new cv.Scalar(r, g, b, a));

  return canvas;
}

/**
 * Convert hex color to RGBA array
 */
function hexToRgba(hex: string): number[] {
  // Remove # if present
  hex = hex.replace("#", "");

  // Parse RGB
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  const a = hex.length === 8 ? parseInt(hex.substring(6, 8), 16) : 255;

  return [r, g, b, a];
}

/**
 * Calculate optimal cards per row based on card dimensions
 */
export function calculateOptimalCardsPerRow(
  cards: ManagedCard[],
  maxWidth: number = 1920
): number {
  if (cards.length === 0) return 3;

  const avgCardWidth =
    cards.reduce((sum, card) => sum + card.image.cols, 0) / cards.length;

  const optimalCardsPerRow = Math.floor(maxWidth / avgCardWidth);

  return Math.max(1, Math.min(optimalCardsPerRow, 10));
}

/**
 * Export composite as PNG blob
 */
export function compositeToBlob(composite: any): Promise<Blob> {
  return new Promise((resolve, reject) => {
    try {
      // Create canvas element
      const canvas = document.createElement("canvas");
      canvas.width = composite.cols;
      canvas.height = composite.rows;

      // Draw composite to canvas
      cv.imshow(canvas, composite);

      // Convert to blob
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error("Failed to create blob"));
          }
        },
        "image/png",
        1.0
      );
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * Download composite image
 */
export async function downloadComposite(
  composite: any,
  fileName: string = "composite.png"
): Promise<void> {
  const blob = await compositeToBlob(composite);

  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
