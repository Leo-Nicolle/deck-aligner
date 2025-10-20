<script setup lang="ts">
import { computed, watch } from "vue";
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

import { useImageProcessor } from "@/composables/useImageProcessor";
import { useCardDetector } from "@/composables/useCardDetector";
import { useCardExtractor } from "@/composables/useCardExtractor";
import { useKeyboardShortcuts } from "@/composables/useKeyboardShortcuts";

import ImageUploader from "@/components/common/ImageUploader.vue";
import ProcessingOverlay from "@/components/common/ProcessingOverlay.vue";
import PreprocessingControls from "@/components/single/PreprocessingControls.vue";
import PreprocessingPreview from "@/components/single/PreprocessingPreview.vue";
import DetectionPreview from "@/components/single/DetectionPreview.vue";
import ExtractionControls from "@/components/single/ExtractionControls.vue";
import CardGallery from "@/components/single/CardGallery.vue";

const router = useRouter();
const message = useMessage();
const loadingBar = useLoadingBar();
const notification = useNotification();

// Initialize composables
const imageProcessor = useImageProcessor();
const cardDetector = useCardDetector(
  computed(() => imageProcessor.preprocessingResult?.processed),
  imageProcessor.currentImage
);
const cardExtractor = useCardExtractor();

// Track overall processing state
const isProcessing = computed(
  () =>
    imageProcessor.isProcessing.value ||
    cardDetector.isDetecting.value ||
    cardExtractor.isExtracting.value
);

// Handle image upload
async function handleImageUpload(file: File) {
  loadingBar.start();
  await imageProcessor.loadImage(file);
  if (imageProcessor.error.value) {
    loadingBar.error();
    message.error(`Failed to load image: ${imageProcessor.error.value}`);
  } else {
    loadingBar.finish();
    message.success("Image loaded and preprocessed successfully");

    // Show detection result notification if cards were detected
    if (
      cardDetector.detectionResult.value &&
      cardDetector.detectionResult.value.filteredCount > 0
    ) {
      notification.success({
        title: "Cards Detected",
        content: `Found ${cardDetector.detectionResult.value.filteredCount} card(s) in the image`,
        duration: 3000,
      });
    }
  }
}

// Watch for preprocessing options changes and reprocess
watch(
  () => imageProcessor.preprocessingOptions.value,
  () => {
    if (imageProcessor.currentImage) {
      imageProcessor.processImage();
    }
  },
  { deep: true }
);

// Handle card extraction
async function handleExtractCards(options: {
  outputWidth: number;
  outputHeight: number;
}) {
  if (!cardDetector.detectionResult.value || !imageProcessor.currentImage) {
    message.error("No cards detected");
    return;
  }

  loadingBar.start();

  // Update extraction options
  cardExtractor.extractionOptions.value = {
    outputWidth: options.outputWidth,
    outputHeight: options.outputHeight,
  };

  await cardExtractor.extractCards(
    imageProcessor.currentImage,
    cardDetector.detectionResult.value.cards
  );

  if (cardExtractor.error.value) {
    loadingBar.error();
    notification.error({
      title: "Extraction Failed",
      content: cardExtractor.error.value,
      duration: 5000,
    });
  } else {
    loadingBar.finish();
    notification.success({
      title: "Extraction Complete",
      content: `Successfully extracted ${cardExtractor.cardCount.value} cards at ${options.outputWidth}×${options.outputHeight}px`,
      duration: 3000,
    });
  }
}

// Handle card download
function handleDownloadCard(card: any) {
  cardExtractor.downloadCard(card);
  message.success("Card downloaded");
}

// Handle download all cards
async function handleDownloadAll() {
  await cardExtractor.downloadAll();
  if (cardExtractor.error.value) {
    message.error(`Failed to download cards: ${cardExtractor.error.value}`);
  } else {
    message.success("All cards downloaded as ZIP");
  }
}

// Keyboard shortcuts
useKeyboardShortcuts([
  {
    key: "b",
    ctrl: true,
    description: "Switch to Batch Mode",
    handler: () => router.push("/batch"),
  },
  {
    key: "e",
    ctrl: true,
    description: "Extract cards (if detected)",
    handler: () => {
      if (
        cardDetector.detectionResult.value &&
        cardDetector.detectionResult.value.filteredCount > 0
      ) {
        handleExtractCards({ outputWidth: 750, outputHeight: 1050 });
      }
    },
  },
  {
    key: "s",
    ctrl: true,
    description: "Download all cards as ZIP",
    handler: () => {
      if (cardExtractor.hasCards.value) {
        handleDownloadAll();
      }
    },
  },
]);
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
        <n-grid
          v-if="imageProcessor.currentImage"
          :x-gap="12"
          :y-gap="12"
          :cols="4"
        >
          <n-grid-item>
            <n-statistic
              label="Cards Detected"
              :value="cardDetector.detectionResult.value?.filteredCount || 0"
            />
          </n-grid-item>
          <n-grid-item>
            <n-statistic
              label="Total Contours"
              :value="cardDetector.detectionResult.value?.totalContours || 0"
            />
          </n-grid-item>
          <n-grid-item>
            <n-statistic
              label="Cards Extracted"
              :value="cardExtractor.cardCount.value"
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
          v-if="imageProcessor.error.value"
          type="error"
          title="Image Processing Error"
          closable
          @close="imageProcessor.error.value = null"
        >
          {{ imageProcessor.error.value }}
        </n-alert>

        <n-alert
          v-if="cardDetector.error.value"
          type="error"
          title="Card Detection Error"
          closable
          @close="cardDetector.error.value = null"
        >
          {{ cardDetector.error.value }}
        </n-alert>

        <n-alert
          v-if="cardExtractor.error.value"
          type="error"
          title="Card Extraction Error"
          closable
          @close="cardExtractor.error.value = null"
        >
          {{ cardExtractor.error.value }}
        </n-alert>

        <!-- Preprocessing Controls & Preview -->
        <preprocessing-controls
          v-if="imageProcessor.currentImage"
          v-model:options="imageProcessor.preprocessingOptions.value"
        />

        <preprocessing-preview
          v-if="imageProcessor.preprocessingResult"
          :result="imageProcessor.preprocessingResult"
        />

        <!-- Detection Preview -->
        <detection-preview
          v-if="
            cardDetector.detectionResult.value && imageProcessor.currentImage
          "
          :result="cardDetector.detectionResult.value"
          :original-image="imageProcessor.currentImage"
          :options="cardDetector.detectionOptions.value"
          @update:options="cardDetector.detectionOptions.value = $event"
        />

        <!-- Extraction Controls -->
        <extraction-controls
          v-if="
            cardDetector.detectionResult.value &&
            cardDetector.detectionResult.value.filteredCount > 0
          "
          @extract="handleExtractCards"
        />

        <!-- Card Gallery -->
        <card-gallery
          v-if="cardExtractor.hasCards.value"
          :cards="cardExtractor.extractedCards.value"
          @download="handleDownloadCard"
          @download-all="handleDownloadAll"
        />
      </n-space>
    </n-layout-content>

    <!-- Processing Overlay -->
    <processing-overlay
      :show="isProcessing"
      :message="
        imageProcessor.isProcessing.value
          ? 'Processing image...'
          : cardDetector.isDetecting.value
          ? 'Detecting cards...'
          : cardExtractor.isExtracting.value
          ? 'Extracting cards...'
          : 'Processing...'
      "
    />
  </n-layout>
</template>
