/**
 * Application Types
 * Type definitions for the Card Extractor application
 */

import type {
  PreprocessingResult,
  PreprocessingOptions,
} from "../lib/imageProcessor";

import type {
  CardDetectionResult,
  CardDetectionOptions,
} from "../lib/cardDetector";

import type {
  ExtractedCard,
  CardExtractionOptions,
} from "../lib/cardExtractor";

/**
 * Main application state
 */
export interface AppState {
  currentImageMat: any | null;
  preprocessingResult: PreprocessingResult | null;
  detectionResult: CardDetectionResult | null;
  extractedCards: ExtractedCard[];
  isProcessing: boolean;
}

/**
 * Processing result from image loading
 */
export interface ProcessingResult {
  imageMat: any;
  preprocessingResult: PreprocessingResult;
}

/**
 * UI Section identifiers
 */
export type UISection = "controls" | "preview" | "detection" | "gallery";

/**
 * Error levels
 */
export type ErrorLevel = "info" | "warning" | "error" | "fatal";

/**
 * Export all the lib types for convenience
 */
export type {
  PreprocessingResult,
  PreprocessingOptions,
  CardDetectionResult,
  CardDetectionOptions,
  ExtractedCard,
  CardExtractionOptions,
};
