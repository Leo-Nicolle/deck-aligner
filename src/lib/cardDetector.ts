/**
 * Card Detector Module
 * Detects playing cards in preprocessed images using contour detection
 */

import cv, { type Mat } from "opencv-ts";
import type {
  CardDetectionOptions,
  CardDetectionResult,
  DetectedCard,
} from "./types";
import { defaultCardDetectionOptions } from "./defaults";

/**
 * Detect cards in a preprocessed binary image
 */
export function detectCards(
  binaryImage: any,
  _originalImage: any,
  options: CardDetectionOptions = {}
): CardDetectionResult {
  const {
    minAreaRatio,
    maxAreaRatio,
    minAspectRatio,
    maxAspectRatio,
    minSolidity,
  } = {
    ...defaultCardDetectionOptions,
    ...options,
  };
  // Calculate image area for filtering
  const imageArea = binaryImage.rows * binaryImage.cols;
  const minArea = imageArea * minAreaRatio;
  const maxArea = imageArea * maxAreaRatio;

  // Find all contours in the binary image
  const contours = new cv.MatVector();
  const hierarchy = new cv.Mat();
  cv.findContours(
    binaryImage,
    contours,
    hierarchy,
    cv.RETR_EXTERNAL,
    cv.CHAIN_APPROX_SIMPLE
  );

  const totalContours = contours.size();
  const detectedCards: DetectedCard[] = [];

  // Process each contour
  for (let i = 0; i < totalContours; i++) {
    const contour = contours.get(i);

    // Filter 1: Area
    const area = cv.contourArea(contour);
    if (area < minArea || area > maxArea) {
      continue;
    }

    // Filter 2: Aspect ratio
    const rect = cv.boundingRect(contour);
    const aspectRatio = rect.height / rect.width;
    if (aspectRatio < minAspectRatio || aspectRatio > maxAspectRatio) {
      console.log("filter aspect ratio", aspectRatio);
      continue;
    }

    // Filter 3: Solidity (how "filled" the shape is)
    const hull = new cv.Mat();
    cv.convexHull(contour, hull);
    const hullArea = cv.contourArea(hull);
    const solidity = area / hullArea;
    hull.delete();

    if (solidity < minSolidity) {
      console.log("filter solidity", solidity);
      continue;
    }

    // Use minAreaRect to find the minimum bounding rectangle
    // This gives us the 4 corners that define the card edges, ignoring rounded corners
    const rotatedRect = cv.minAreaRect(contour);
    const corners = extractCornersFromRotatedRect(rotatedRect);

    // Validate that we got 4 corners
    if (corners.length === 4) {
      detectedCards.push({
        contour: contour.clone(),
        corners,
        boundingRect: rect,
        area,
        aspectRatio,
      });
    }
  }

  // Clean up
  contours.delete();
  hierarchy.delete();

  return {
    cards: detectedCards,
    totalContours,
    filteredCount: detectedCards.length,
  };
}

/**
 * Extract corner points from a rotated rectangle
 * minAreaRect returns a rectangle that fits the contour, ignoring rounded corners
 */
function extractCornersFromRotatedRect(
  rotatedRect: any
): Array<{ x: number; y: number }> {
  // RotatedRect has center, size (width, height), and angle
  const center = rotatedRect.center;
  const size = rotatedRect.size;
  const angle = (rotatedRect.angle * Math.PI) / 180; // Convert to radians

  // Calculate half dimensions
  const halfWidth = size.width / 2;
  const halfHeight = size.height / 2;

  // Calculate the 4 corners of the rotated rectangle
  // Start with corners relative to center, then rotate and translate
  const corners: Array<{ x: number; y: number }> = [];

  // Define corners in local coordinate system (before rotation)
  const localCorners = [
    { x: -halfWidth, y: -halfHeight }, // Top-left
    { x: halfWidth, y: -halfHeight }, // Top-right
    { x: halfWidth, y: halfHeight }, // Bottom-right
    { x: -halfWidth, y: halfHeight }, // Bottom-left
  ];

  // Rotate each corner and translate to world coordinates
  for (const local of localCorners) {
    const rotatedX = local.x * Math.cos(angle) - local.y * Math.sin(angle);
    const rotatedY = local.x * Math.sin(angle) + local.y * Math.cos(angle);
    corners.push({
      x: center.x + rotatedX,
      y: center.y + rotatedY,
    });
  }

  return corners;
}

/**
 * Order corners in clockwise order starting from top-left
 * Returns: [top-left, top-right, bottom-right, bottom-left]
 */
export function orderCorners(
  corners: Array<{ x: number; y: number }>
): Array<{ x: number; y: number }> {
  if (corners.length !== 4) {
    throw new Error("Expected exactly 4 corners");
  }

  // Calculate center point
  const centerX = corners.reduce((sum, p) => sum + p.x, 0) / 4;
  const centerY = corners.reduce((sum, p) => sum + p.y, 0) / 4;

  // Sort by angle from center
  const cornersWithAngle = corners.map((point) => {
    const angle = Math.atan2(point.y - centerY, point.x - centerX);
    return { point, angle };
  });

  cornersWithAngle.sort((a, b) => a.angle - b.angle);

  // Find the top-left corner (smallest x + y)
  let minSumIdx = 0;
  let minSum = cornersWithAngle[0].point.x + cornersWithAngle[0].point.y;

  for (let i = 1; i < 4; i++) {
    const sum = cornersWithAngle[i].point.x + cornersWithAngle[i].point.y;
    if (sum < minSum) {
      minSum = sum;
      minSumIdx = i;
    }
  }

  // Rotate array to start from top-left
  const ordered = [
    cornersWithAngle[minSumIdx].point,
    cornersWithAngle[(minSumIdx + 1) % 4].point,
    cornersWithAngle[(minSumIdx + 2) % 4].point,
    cornersWithAngle[(minSumIdx + 3) % 4].point,
  ];

  return ordered;
}

/**
 * Draw detected cards on an image for visualization
 */
export function drawDetectedCards(
  ctx: CanvasRenderingContext2D,
  detectionResult: CardDetectionResult
): void {
  detectionResult.cards.forEach((card) => {
    const orderedCorners = orderCorners(card.corners);
    orderedCorners.forEach((corner, i) => {
      // Draw corner circle
      ctx.beginPath();
      ctx.arc(corner.x, corner.y, 8, 0, 2 * Math.PI);
      ctx.fillStyle = "red";
      ctx.fill();
      ctx.closePath();

      // Draw line to next corner
      const nextCorner = orderedCorners[(i + 1) % 4];
      ctx.beginPath();
      ctx.moveTo(corner.x, corner.y);
      ctx.lineTo(nextCorner.x, nextCorner.y);
      ctx.strokeStyle = "green";
      ctx.lineWidth = 6;
      ctx.stroke();
    });
  });
}

/**
 * Clean up detected card resources
 */
export function cleanupDetectedCards(cards: DetectedCard[]): void {
  cards.forEach((card) => {
    if (card.contour) {
      card.contour.delete();
    }
  });
}
