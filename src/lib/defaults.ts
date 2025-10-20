import type {
  CardDetectionOptions,
  CardExtractionOptions,
  CompositeOptions,
  PreprocessingOptions,
} from "./types";

export const preprocessingOptions: Required<PreprocessingOptions> = {
  blurKernelSize: 5,
  thresholdValue: 0.1,
  useAdaptiveThreshold: false,
  morphologyKernelSize: 5,
};

export const defaultCardDetectionOptions: Required<CardDetectionOptions> = {
  minAreaRatio: 0.01,
  maxAreaRatio: 0.5,
  minAspectRatio: 1.2,
  maxAspectRatio: 1.8,
  minSolidity: 0.85,
  approxEpsilon: 0.02,
};

export const cardExtractionOptions: Required<CardExtractionOptions> = {
  outputHeight: 1050,
  outputWidth: 750,
};

export const compositeOptions: Required<CompositeOptions> = {
  scaleMode: "fit",
  backgroundColor: "white",
  spacing: 10,
  cardsPerRow: 5,
  maxCardWidth: 300,
  maxCardHeight: 420,
};
