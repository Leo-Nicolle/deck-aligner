import { type Mat } from "opencv-ts";

/**
 * Represents a complete processing state for an uploaded image containing trading cards.
 * This interface tracks the entire lifecycle of an image through the card detection,
 * preprocessing, and extraction pipeline.
 */
export interface ProcessedImage {
  id: string;
  fileName: string;
  fileSize: number;
  originalMat: Mat | null;
  preprocessingResult: PreprocessingResult | null;
  detectionResult: CardDetectionResult | null;
  extractedCards: ExtractedCard[];
  timestamp: Date;
  status: "pending" | "processing" | "completed" | "error";
  error?: string;
}

/**
 * Configuration options for batch processing multiple images containing trading cards.
 * Provides control over the processing pipeline and callback functions for progress tracking.
 */
export interface ProcessingOptions {
  preprocessingOptions?: PreprocessingOptions;
  detectionOptions?: CardDetectionOptions;
  extractionOptions?: CardExtractionOptions;
}
export interface ProcessorEvents {
  done: CustomEvent<{ successCount: number }>;
  "image-processed": CustomEvent<{ image: ProcessedImage }>;
  error: CustomEvent<{ message: string }>;
}

export interface BatchProcessorEvents {
  progress: CustomEvent<{ current: number; total: number }>;
  done: CustomEvent<{ successCount: number }>;
  "image-processed": CustomEvent<{ image: ProcessedImage }>;
  error: CustomEvent<{ message: string }>;
}
/**
 * Represents a single detected trading card within an image.
 * Contains geometric information about the card's location, shape, and properties
 * needed for extraction and validation.
 */
export interface DetectedCard {
  contour: Mat; // cv.Mat
  corners: Array<{ x: number; y: number }>; // 4 corners of the card
  boundingRect: { x: number; y: number; width: number; height: number };
  area: number;
  aspectRatio: number;
}

/**
 * Configuration parameters for the card detection algorithm.
 * These options control how the computer vision system identifies and validates
 * potential trading cards within an image based on size, shape, and quality criteria.
 */
export interface CardDetectionOptions {
  minAreaRatio?: number; // Minimum card area as ratio of image (default: 0.01 = 1%)
  maxAreaRatio?: number; // Maximum card area as ratio of image (default: 0.5 = 50%)
  minAspectRatio?: number; // Minimum height/width ratio (default: 1.2)
  maxAspectRatio?: number; // Maximum height/width ratio (default: 1.8)
  minSolidity?: number; // Minimum solidity (area/convexHullArea) (default: 0.85)
  approxEpsilon?: number; // Polygon approximation accuracy (default: 0.02)
}

/**
 * Result data from the card detection process.
 * Contains all detected cards and statistics about the detection process
 * for debugging and quality assessment.
 */
export interface CardDetectionResult {
  cards: DetectedCard[];
  totalContours: number;
  filteredCount: number;
}

/**
 * Represents a single trading card that has been extracted and rectified from an image.
 * Contains the processed card image in a standardized format along with metadata
 * about its original position and processing order.
 */
export interface ExtractedCard {
  image: Mat; // cv.Mat - extracted and standardized card image
  originalCorners: Array<{ x: number; y: number }>; // Original corner positions
  cardNumber: number; // Sequential card number
}

/**
 * Configuration options for the card extraction process.
 * Controls the output dimensions of extracted cards to ensure consistent sizing
 * across all processed trading cards.
 */
export interface CardExtractionOptions {
  outputWidth?: number; // Default: 750
  outputHeight?: number; // Default: 1050
}

/**
 * Extended card interface that includes management metadata for organizing and
 * manipulating collections of extracted cards. Adds selection, organization,
 * and identification capabilities to the base extracted card data.
 */
export interface ManagedCard extends ExtractedCard {
  globalId: string; // "img_001_card_03"
  sourceImageId: string;
  sourceImageName: string;
  isSelected: boolean;
  isDiscarded: boolean;
  customPosition: number; // For manual reordering
}

/**
 * State management interface for collections of trading cards.
 * Tracks the current selection and discard states across all managed cards
 * in the application, enabling bulk operations and UI state persistence.
 */
export interface CardCollectionState {
  cards: ManagedCard[];
  selectedIds: Set<string>;
  discardedIds: Set<string>;
}

/**
 * Configuration options for generating composite images from multiple trading cards.
 * Controls the layout, spacing, scaling, and visual appearance of the final
 * composite output containing multiple cards arranged in a grid format.
 */
export interface CompositeOptions {
  cardsPerRow: number;
  spacing: number; // px between cards
  backgroundColor: string; // hex color
  scaleMode: "fit" | "original";
  maxCardWidth?: number; // for fit mode
  maxCardHeight?: number; // for fit mode
}

/**
 * Result of the composite generation process.
 * Contains the final composite image along with detailed layout information
 * about how cards were positioned within the composite.
 */
export interface CompositeResult {
  composite: Mat; // cv.Mat
  layout: LayoutInfo;
}

/**
 * Detailed layout information for a composite image.
 * Provides dimensions, grid structure, and individual card positioning data
 * for the generated composite layout.
 */
export interface LayoutInfo {
  totalWidth: number;
  totalHeight: number;
  rows: number;
  cols: number;
  cardPositions: CardPosition[];
}

/**
 * Positioning information for a single card within a composite layout.
 * Contains both pixel coordinates and grid position data for precise
 * card placement and reference within the composite image.
 */
export interface CardPosition {
  cardId: string;
  x: number;
  y: number;
  width: number;
  height: number;
  row: number;
  col: number;
}

/**
 * Result of the image preprocessing pipeline.
 * Contains all intermediate processing steps from the original image through
 * various computer vision transformations used to prepare images for card detection.
 */
export interface PreprocessingResult {
  original: Mat; // cv.Mat
  grayscale: Mat; // cv.Mat
  blurred: Mat; // cv.Mat
  binary: Mat; // cv.Mat
  processed: Mat; // cv.Mat (after morphological operations)
}

/**
 * Configuration parameters for the image preprocessing pipeline.
 * Controls various computer vision operations applied to prepare images
 * for optimal card detection and extraction results.
 */
export interface PreprocessingOptions {
  blurKernelSize?: number;
  thresholdValue?: number;
  useAdaptiveThreshold?: boolean;
  morphologyKernelSize?: number;
}
