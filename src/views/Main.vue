<script setup lang="ts">
import { ref, toRaw, watch } from "vue";
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
  NTabs,
  NTabPane,
} from "naive-ui";
import { useRouter } from "vue-router";
import { useMessage, useLoadingBar, useNotification } from "naive-ui";

import { run } from "@/lib/index";
import type { ProcessingOptions } from "@/lib/types";
import {
  cardExtractionOptions,
  defaultCardDetectionOptions,
  preprocessingOptions,
} from "@/lib/defaults";

import ImageUploader from "@/components/common/ImageUploader.vue";
import PreprocessingControls from "@/components/single/PreprocessingControls.vue";
import PreprocessingPreview from "@/components/single/PreprocessingPreview.vue";
import DetectionControls from "@/components/single/DetectionControls.vue";
import DetectionPreview from "@/components/single/DetectionPreview.vue";
import ExtractionControls from "@/components/single/ExtractionControls.vue";
import ExtractionPreview from "@/components/single/ExtractionPreview.vue";
import TextureCreator from "@/components/TextureCreator.vue";

import { matToBlob, matToCanvas } from "@/lib/imageProcessor";
import { drawDetectedCards } from "@/lib/cardDetector";

const message = useMessage();
const loadingBar = useLoadingBar();
const notification = useNotification();

const isProcessing = ref(false);
const file = ref<File | null>(null);
const extractedBlobs = ref<Blob[]>([]);
const allBlobs = ref<Blob[]>([]);
const stats = ref<{
  filtered: number;
  totalContours: number;
  extracted: number;
} | null>(null);
const options = ref<ProcessingOptions>({
  preprocessingOptions: { ...preprocessingOptions },
  detectionOptions: { ...defaultCardDetectionOptions },
  extractionOptions: { ...cardExtractionOptions },
});
const detectionPreview = ref<typeof DetectionPreview | null>(null);
const preprocessingPreview = ref<typeof PreprocessingPreview | null>(null);
const textureCreator = ref<typeof TextureCreator | null>(null);
const error = ref<string | null>(null);
// Handle image upload
async function handleImageUpload(f: File) {
  file.value = f;
  await update();
}
async function update() {
  if (!file.value) return;
  loadingBar.start();
  isProcessing.value = true;
  const result = await run(toRaw(options.value), file.value);
  stats.value = {
    filtered: result.detectionResult?.filteredCount || 0,
    totalContours: result.detectionResult?.totalContours || 0,
    extracted: result.extractedCards.length,
  };
  if (preprocessingPreview.value) {
    if (result.preprocessingResult?.original)
      matToCanvas(
        result.preprocessingResult?.original,
        preprocessingPreview.value.originalCanvas
      );
    if (result.preprocessingResult?.grayscale)
      matToCanvas(
        result.preprocessingResult?.grayscale,
        preprocessingPreview.value.grayscaleCanvas
      );
    if (result.preprocessingResult?.blurred)
      matToCanvas(
        result.preprocessingResult?.blurred,
        preprocessingPreview.value.blurredCanvas
      );
    if (result.preprocessingResult?.binary)
      matToCanvas(
        result.preprocessingResult?.binary,
        preprocessingPreview.value.binaryCanvas
      );
    if (result.preprocessingResult?.processed)
      matToCanvas(
        result.preprocessingResult?.processed,
        preprocessingPreview.value.processedCanvas
      );
  }
  if (detectionPreview.value && result.originalMat) {
    matToCanvas(result.originalMat, detectionPreview.value.detectionCanvas);
    drawDetectedCards(
      detectionPreview.value.detectionCanvas.getContext("2d")!,
      result.detectionResult!
    );
  }
  Promise.all(result.extractedCards.map((card) => matToBlob(card.image))).then(
    (blobs) => (extractedBlobs.value = blobs)
  );
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

function addToTexture() {
  allBlobs.value.push(...extractedBlobs.value);
}
watch(
  options,
  async () => {
    if (!file.value) return;
    await update();
  },
  { deep: true }
);
</script>

<template>
  <n-layout style="min-height: 100vh">
    <n-layout-header bordered style="padding: 1rem">
      <n-space justify="space-between" align="center">
        <div>
          <n-h1 style="margin: 0">Card Extractor</n-h1>
          <n-p style="margin: 0.5rem 0 0 0" depth="3">
            Upload a scanned image and extract individual cards
          </n-p>
        </div>
      </n-space>
    </n-layout-header>

    <n-layout-content style="padding: 2rem">
      <n-tabs type="line" animated>
        <n-tab-pane name="scan" tab="Scan & Extract Cards">
          <n-space vertical size="large">
            <!-- Image Upload -->
            <image-uploader @file-selected="handleImageUpload" />
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
            <preprocessing-controls
              v-model:options="options.preprocessingOptions"
            />
            <preprocessing-preview ref="preprocessingPreview" />
            <!-- Statistics -->
            <n-grid v-if="stats" :x-gap="12" :y-gap="12" :cols="4">
              <n-grid-item>
                <n-statistic
                  label="Cards Detected"
                  :value="stats.filtered || 0"
                />
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

            <detection-controls v-model:options="options.detectionOptions" />
            <detection-preview ref="detectionPreview" />
            <extraction-controls v-model:options="options.extractionOptions" />
            <extraction-preview :blobs="extractedBlobs" />
          </n-space>
          <n-button
            v-if="extractedBlobs.length > 0"
            type="primary"
            size="large"
            block
            @click="addToTexture"
          >
            Add to Texture Creator
          </n-button>
        </n-tab-pane>

        <n-tab-pane name="texture" tab="Create Texture">
          <texture-creator ref="textureCreator" :blobs="allBlobs" />
        </n-tab-pane>
      </n-tabs>
    </n-layout-content>

    <!-- Processing Overlay -->
  </n-layout>
</template>
