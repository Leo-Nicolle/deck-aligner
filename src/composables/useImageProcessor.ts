import { ref, toRaw } from "vue";
import { onUnmounted } from "vue";
import {
  loadImageFromFile,
  preprocessImage,
  type PreprocessingOptions,
  type PreprocessingResult,
} from "@/lib/imageProcessor";
import { useLocalStorage } from "./useLocalStorage";
import type { Mat } from "opencv-ts";

export function useImageProcessor() {
  let currentImage: Mat | null = null;
  let preprocessingResult: PreprocessingResult | null = null;
  const isProcessing = ref(false);
  const error = ref<string | null>(null);

  // Persist preprocessing options to localStorage
  const preprocessingOptions = useLocalStorage<PreprocessingOptions>(
    "preprocessing-options",
    {
      blurKernelSize: 5,
      morphologyKernelSize: 3,
      thresholdValue: 127,
      useAdaptiveThreshold: false,
    }
  );

  async function loadImage(file: File) {
    isProcessing.value = true;
    error.value = null;

    try {
      currentImage = await loadImageFromFile(file);
      await processImage();
    } catch (err) {
      error.value = err instanceof Error ? err.message : "Failed to load image";
      console.error("Error loading image:", err);
    } finally {
      isProcessing.value = false;
    }
  }

  async function processImage() {
    if (!currentImage) return;

    isProcessing.value = true;
    error.value = null;

    try {
      preprocessingResult = preprocessImage(
        currentImage,
        toRaw(preprocessingOptions.value)
      );
    } catch (err) {
      error.value =
        err instanceof Error ? err.message : "Failed to process image";
      console.error("Error processing image:", err);
    } finally {
      isProcessing.value = false;
    }
  }

  function cleanup() {
    if (currentImage) {
      currentImage.value.delete();
      currentImage = null;
    }
    if (preprocessingResult) {
      // Clean up preprocessing mats
      if (preprocessingResult.grayscale) preprocessingResult.grayscale.delete();
      if (preprocessingResult.blurred) preprocessingResult.blurred.delete();
      if (preprocessingResult.binary) preprocessingResult.binary.delete();
      if (preprocessingResult.processed) preprocessingResult.processed.delete();
    }
    preprocessingResult = null;
    error.value = null;
  }

  // Auto cleanup on unmount
  onUnmounted(() => {
    cleanup();
  });

  return {
    currentImage,
    preprocessingResult,
    preprocessingOptions,
    isProcessing,
    error,
    loadImage,
    processImage,
    cleanup,
  };
}
