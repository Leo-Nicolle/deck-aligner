/**
 * Image Processor Module
 * Handles image preprocessing pipeline for card detection
 */

import cv from "opencv-ts";

export interface PreprocessingResult {
  original: any; // cv.Mat
  grayscale: any; // cv.Mat
  blurred: any; // cv.Mat
  binary: any; // cv.Mat
  processed: any; // cv.Mat (after morphological operations)
}

export interface PreprocessingOptions {
  blurKernelSize?: number;
  thresholdValue?: number;
  useAdaptiveThreshold?: boolean;
  morphologyKernelSize?: number;
}

/**
 * Load an image from a File object and convert to cv.Mat
 */
export async function loadImageFromFile(file: File): Promise<any> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        try {
          // Create canvas to draw image
          const canvas = document.createElement("canvas");
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext("2d");

          if (!ctx) {
            reject(new Error("Failed to get canvas context"));
            return;
          }

          ctx.drawImage(img, 0, 0);

          // Convert canvas to cv.Mat
          const mat = cv.imread(canvas);
          resolve(mat);
        } catch (error) {
          reject(error);
        }
      };

      img.onerror = () => {
        reject(new Error("Failed to load image"));
      };

      img.src = event.target?.result as string;
    };

    reader.onerror = () => {
      reject(new Error("Failed to read file"));
    };

    reader.readAsDataURL(file);
  });
}

/**
 * Load an image from a URL/path and convert to cv.Mat
 */
export async function loadImageFromURL(url: string): Promise<any> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";

    img.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext("2d");

        if (!ctx) {
          reject(new Error("Failed to get canvas context"));
          return;
        }

        ctx.drawImage(img, 0, 0);
        const mat = cv.imread(canvas);
        resolve(mat);
      } catch (error) {
        reject(error);
      }
    };

    img.onerror = () => {
      reject(new Error(`Failed to load image from URL: ${url}`));
    };

    img.src = url;
  });
}

/**
 * Convert cv.Mat to canvas for display
 */
export function matToCanvas(mat: any, canvas: HTMLCanvasElement): void {
  cv.imshow(canvas, mat);
}

/**
 * Preprocess image for card detection
 * Pipeline: Grayscale → Blur → Threshold → Morphological Operations
 */
export function preprocessImage(
  src: any,
  options: PreprocessingOptions = {}
): PreprocessingResult {
  const {
    blurKernelSize = 5,
    thresholdValue = 127,
    useAdaptiveThreshold = false,
    morphologyKernelSize = 3,
  } = options;

  // Step 1: Convert to grayscale
  const gray = new cv.Mat();
  if (src.channels() === 4) {
    cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY);
  } else if (src.channels() === 3) {
    cv.cvtColor(src, gray, cv.COLOR_RGB2GRAY);
  } else {
    src.copyTo(gray);
  }

  // Step 2: Apply Gaussian blur to reduce noise
  const blurred = new cv.Mat();
  const ksize = new cv.Size(blurKernelSize, blurKernelSize);
  cv.GaussianBlur(gray, blurred, ksize, 0, 0, cv.BORDER_DEFAULT);

  // Step 3: Threshold to binary image
  // White background becomes 255, darker cards become 0
  const binary = new cv.Mat();
  if (useAdaptiveThreshold) {
    // Adaptive thresholding for uneven lighting
    cv.adaptiveThreshold(
      blurred,
      binary,
      255,
      cv.ADAPTIVE_THRESH_GAUSSIAN_C,
      cv.THRESH_BINARY_INV,
      11,
      2
    );
  } else {
    // Otsu's method for automatic threshold calculation
    cv.threshold(
      blurred,
      binary,
      thresholdValue,
      255,
      cv.THRESH_BINARY_INV + cv.THRESH_OTSU
    );
  }

  // Step 4: Morphological operations to clean up binary image
  // Closing operation (dilation followed by erosion) to fill small holes in cards
  const processed = new cv.Mat();
  const kernel = cv.getStructuringElement(
    cv.MORPH_RECT,
    new cv.Size(morphologyKernelSize, morphologyKernelSize),
    new cv.Point(-1, -1)
  );
  cv.morphologyEx(
    binary,
    processed,
    cv.MORPH_CLOSE,
    kernel,
    new cv.Point(-1, -1),
    1,
    cv.BORDER_CONSTANT,
    new cv.Scalar()
  );
  kernel.delete();

  return {
    original: src,
    grayscale: gray,
    blurred,
    binary,
    processed,
  };
}

/**
 * Clean up cv.Mat objects to free memory
 */
export function cleanupMats(
  result: PreprocessingResult,
  keepOriginal = true
): void {
  if (!keepOriginal && result.original) {
    result.original.delete();
  }
  if (result.grayscale) result.grayscale.delete();
  if (result.blurred) result.blurred.delete();
  if (result.binary) result.binary.delete();
  if (result.processed) result.processed.delete();
}

/**
 * Get image dimensions from cv.Mat
 */
export function getImageSize(mat: any): { width: number; height: number } {
  return {
    width: mat.cols,
    height: mat.rows,
  };
}
