/**
 * Card Detector Module
 * Detects playing cards in preprocessed images using contour detection
 */

import cv from "opencv-ts";

export interface DetectedCard {
  contour: any; // cv.Mat
  corners: Array<{ x: number; y: number }>; // 4 corners of the card
  boundingRect: { x: number; y: number; width: number; height: number };
  area: number;
  aspectRatio: number;
}

export interface CardDetectionOptions {
  minAreaRatio?: number; // Minimum card area as ratio of image (default: 0.01 = 1%)
  maxAreaRatio?: number; // Maximum card area as ratio of image (default: 0.5 = 50%)
  minAspectRatio?: number; // Minimum height/width ratio (default: 1.2)
  maxAspectRatio?: number; // Maximum height/width ratio (default: 1.8)
  minSolidity?: number; // Minimum solidity (area/convexHullArea) (default: 0.85)
  approxEpsilon?: number; // Polygon approximation accuracy (default: 0.02)
}

export interface CardDetectionResult {
  cards: DetectedCard[];
  totalContours: number;
  filteredCount: number;
}

/**
 * Detect cards in a preprocessed binary image
 */
export function detectCards(
  binaryImage: any,
  _originalImage: any,
  options: CardDetectionOptions = {}
): CardDetectionResult {
  const {
    minAreaRatio = 0.01,
    maxAreaRatio = 0.5,
    minAspectRatio = 1.2,
    maxAspectRatio = 1.8,
    minSolidity = 0.85,
  } = options;

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
      continue;
    }

    // Filter 3: Solidity (how "filled" the shape is)
    const hull = new cv.Mat();
    cv.convexHull(contour, hull);
    const hullArea = cv.contourArea(hull);
    const solidity = area / hullArea;
    hull.delete();

    if (solidity < minSolidity) {
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
function extractCornersFromRotatedRect(rotatedRect: any): Array<{ x: number; y: number }> {
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
    { x: halfWidth, y: -halfHeight },  // Top-right
    { x: halfWidth, y: halfHeight },   // Bottom-right
    { x: -halfWidth, y: halfHeight },  // Bottom-left
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
export function orderCorners(corners: Array<{ x: number; y: number }>): Array<{ x: number; y: number }> {
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
  image: any,
  detectionResult: CardDetectionResult,
  color = new cv.Scalar(0, 255, 0, 255),
  thickness: number = 3
): void {
  detectionResult.cards.forEach((card, index) => {
    // Draw contour
    const contours = new cv.MatVector();
    contours.push_back(card.contour);
    cv.drawContours(image, contours, 0, color, thickness);
    contours.delete();

    // Draw corners
    const orderedCorners = orderCorners(card.corners);
    orderedCorners.forEach((corner, i) => {
      // Draw corner circle
      const cornerPoint = new cv.Point(corner.x, corner.y);
      cv.circle(image, cornerPoint, 8, new cv.Scalar(255, 0, 0, 255), -1);

      // Draw line to next corner
      const nextCorner = orderedCorners[(i + 1) % 4];
      const nextPoint = new cv.Point(nextCorner.x, nextCorner.y);
      cv.line(image, cornerPoint, nextPoint, new cv.Scalar(255, 255, 0, 255), 2);
    });

    // Draw card number at center
    const centerX = Math.floor(
      card.corners.reduce((sum, p) => sum + p.x, 0) / 4
    );
    const centerY = Math.floor(
      card.corners.reduce((sum, p) => sum + p.y, 0) / 4
    );
    cv.putText(
      image,
      `Card ${index + 1}`,
      new cv.Point(centerX - 30, centerY),
      cv.FONT_HERSHEY_SIMPLEX,
      0.8,
      new cv.Scalar(255, 255, 255, 255),
      2
    );
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
