<script setup lang="ts">
import { ref } from "vue";
import {
  NLayout,
  NLayoutHeader,
  NLayoutContent,
  NSpace,
  NButton,
  NH1,
  NP,
  NAlert,
  NStatistic,
  NGrid,
  NGridItem,
} from "naive-ui";
import { useRouter } from "vue-router";
import { useMessage, useLoadingBar, useNotification } from "naive-ui";

import { run } from "@/lib/index";
import type { Options } from "@/lib/types";
import {
  cardExtractionOptions,
  compositeOptions,
  defaultCardDetectionOptions,
  preprocessingOptions,
} from "@/lib/defaults";
// import { useImageProcessor } from "@/composables/useImageProcessor";
// import { useCardDetector } from "@/composables/useCardDetector";
// import { useCardExtractor } from "@/composables/useCardExtractor";

import ImageUploader from "@/components/common/ImageUploader.vue";
import ProcessingOverlay from "@/components/common/ProcessingOverlay.vue";
import PreprocessingControls from "@/components/single/PreprocessingControls.vue";
// import PreprocessingPreview from "@/components/single/PreprocessingPreview.vue";
import DetectionPreview from "@/components/single/DetectionPreview.vue";
import ExtractionControls from "@/components/single/ExtractionControls.vue";
import CardGallery from "@/components/single/CardGallery.vue";
import type { ProcessedImage } from "@/lib/types";
import { matToCanvas } from "@/lib/imageProcessor";

const router = useRouter();
const message = useMessage();
const loadingBar = useLoadingBar();
const notification = useNotification();

const isProcessing = ref(false);
const stats = ref<{
  filtered: number;
  totalContours: number;
  extracted: number;
} | null>(null);
const options = ref<Options>({
  preprocessing: { ...preprocessingOptions },
  detection: { ...defaultCardDetectionOptions },
  extraction: { ...cardExtractionOptions },
});
const originalCanvas = ref<HTMLCanvasElement>(document.createElement("canvas"));
const grayscaleCanvas = ref<HTMLCanvasElement>(
  document.createElement("canvas")
);
const blurredCanvas = ref<HTMLCanvasElement>(document.createElement("canvas"));
const binaryCanvas = ref<HTMLCanvasElement>(document.createElement("canvas"));
const processedCanvas = ref<HTMLCanvasElement>(
  document.createElement("canvas")
);

const error = ref<string | null>(null);
// Handle image upload
async function handleImageUpload(file: File) {
  loadingBar.start();
  isProcessing.value = true;
  const result = await run(
    {
      /* processing options */
    },
    file
  );
  stats.value = {
    filtered: result.detectionResult?.filteredCount || 0,
    totalContours: result.detectionResult?.totalContours || 0,
    extracted: result.extractedCards.length,
  };
  matToCanvas(result.preprocessingResult?.original, originalCanvas.value);
  matToCanvas(result.preprocessingResult?.grayscale, grayscaleCanvas.value);
  matToCanvas(result.preprocessingResult?.blurred, blurredCanvas.value);
  matToCanvas(result.preprocessingResult?.binary, binaryCanvas.value);
  matToCanvas(result.preprocessingResult?.processed, processedCanvas.value);

  if (result.error) {
    loadingBar.error();
    message.error(`Failed to load image: ${result.error}`);
    error.value = result.error;
  } else {
    loadingBar.finish();
    message.success("Image loaded and preprocessed successfully");

    // Show detection result notification if cards were detected
    if (result.detectionResult && result.detectionResult.filteredCount > 0) {
      notification.success({
        title: "Cards Detected",
        content: `Found ${result.detectionResult.filteredCount} card(s) in the image`,
        duration: 3000,
      });
    }
  }
}
</script>

<template>
  <n-layout style="min-height: 100vh">
    <n-layout-header bordered style="padding: 1rem">
      <n-space justify="space-between" align="center">
        <div>
          <n-h1 style="margin: 0">Card Extractor - Single Image Mode</n-h1>
          <n-p style="margin: 0.5rem 0 0 0" depth="3">
            Upload a scanned image and extract individual cards
          </n-p>
        </div>
        <n-button type="primary" @click="router.push('/batch')">
          Batch Mode
        </n-button>
      </n-space>
    </n-layout-header>

    <n-layout-content style="padding: 2rem">
      <n-space vertical size="large">
        <!-- Image Upload -->
        <image-uploader @file-selected="handleImageUpload" />

        <!-- Statistics -->
        <n-grid v-if="stats" :x-gap="12" :y-gap="12" :cols="4">
          <n-grid-item>
            <n-statistic label="Cards Detected" :value="stats.filtered || 0" />
          </n-grid-item>
          <n-grid-item>
            <n-statistic
              label="Total Contours"
              :value="stats.totalContours || 0"
            />
          </n-grid-item>
          <n-grid-item>
            <n-statistic
              label="Cards Extracted"
              :value="stats.extracted || 0"
            />
          </n-grid-item>
          <n-grid-item>
            <n-statistic label="Status">
              <template #default>
                <p :type="isProcessing ? 'info' : 'success'">
                  {{ isProcessing ? "Processing..." : "Ready" }}
                </p>
              </template>
            </n-statistic>
          </n-grid-item>
        </n-grid>

        <!-- Show errors if any -->
        <n-alert
          v-if="error"
          type="error"
          title="Image Processing Error"
          closable
          @close="error = null"
        >
          {{ error }}
        </n-alert>

        <!-- Preprocessing Controls & Preview -->
        <preprocessing-controls v-model:options="options" />

        <detection-preview
          :original-image="originalCanvas"
          :grayscale-image="grayscaleCanvas"
          :blurred-image="blurredCanvas"
          :binary-image="binaryCanvas"
          :processed-image="processedCanvas"
          :options="options.preprocessing"
          :filteredCount="stats ? stats.filtered : 0"
          :totalContours="stats ? stats.totalContours : 0"
        />

        <!-- Detection Preview -->
      </n-space>
    </n-layout-content>

    <!-- Processing Overlay -->
  </n-layout>
</template>
