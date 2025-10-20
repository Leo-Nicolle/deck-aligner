<script setup lang="ts">
import { ref, computed } from 'vue'
import {
  NLayout, NLayoutHeader, NLayoutContent,
  NSpace, NButton, NH1, NP, NTabs, NTabPane, NAlert, NStatistic, NGrid, NGridItem
} from 'naive-ui'
import { useRouter } from 'vue-router'
import { useMessage, useDialog, useLoadingBar, useNotification } from 'naive-ui'

import { useBatchProcessor } from '@/composables/useBatchProcessor'
import { useCardManager } from '@/composables/useCardManager'
import { useCompositeGenerator } from '@/composables/useCompositeGenerator'
import { useKeyboardShortcuts } from '@/composables/useKeyboardShortcuts'

import BatchUploader from '@/components/batch/BatchUploader.vue'
import BatchProgress from '@/components/batch/BatchProgress.vue'
import CardManager from '@/components/batch/CardManager.vue'
import CompositeControls from '@/components/batch/CompositeControls.vue'
import CompositePreview from '@/components/batch/CompositePreview.vue'
import ProcessingOverlay from '@/components/common/ProcessingOverlay.vue'
import type { CompositeOptions } from '@/lib/compositeGenerator'

const router = useRouter()
const message = useMessage()
const dialog = useDialog()
const loadingBar = useLoadingBar()
const notification = useNotification()

// Initialize composables
const batchProcessor = useBatchProcessor()
const cardManager = useCardManager()
const compositeGenerator = useCompositeGenerator()

// UI state
const activeTab = ref('upload')

// Handle files selected
async function handleFilesSelected(files: File[]) {
  activeTab.value = 'progress'
  loadingBar.start()

  await batchProcessor.processAll(files, {
    onProgress: (current, total, imageName) => {
      console.log(`Processing ${current}/${total}: ${imageName}`)
    },
    onImageComplete: (processedImage) => {
      console.log(`Completed: ${processedImage.fileName}`)
    },
    onError: (imageName, error) => {
      notification.error({
        title: 'Processing Error',
        content: `Failed to process ${imageName}: ${error.message}`,
        duration: 5000
      })
    }
  })

  if (batchProcessor.error.value) {
    loadingBar.error()
    notification.error({
      title: 'Batch Processing Failed',
      content: batchProcessor.error.value,
      duration: 5000
    })
  } else if (batchProcessor.isComplete.value) {
    loadingBar.finish()

    const failedCount = batchProcessor.failedImages.value
    if (failedCount > 0) {
      notification.warning({
        title: 'Batch Processing Complete with Errors',
        content: `Extracted ${batchProcessor.totalCards.value} cards from ${batchProcessor.completedImages.value} images. ${failedCount} image(s) failed.`,
        duration: 5000
      })
    } else {
      notification.success({
        title: 'Batch Processing Complete',
        content: `Successfully extracted ${batchProcessor.totalCards.value} cards from ${batchProcessor.completedImages.value} images`,
        duration: 4000
      })
    }

    // Load cards into card manager
    cardManager.loadFromImages(batchProcessor.images.value)

    // Switch to card management tab
    activeTab.value = 'cards'
  }
}

// Handle card selection toggle
function handleSelectCard(cardId: string, selected: boolean) {
  if (selected) {
    cardManager.selectCards([cardId])
  } else {
    cardManager.deselectCards([cardId])
  }
}

// Handle discard cards
function handleDiscardCards(cardIds: string[]) {
  dialog.warning({
    title: 'Discard Cards',
    content: `Are you sure you want to discard ${cardIds.length} card(s)? You can restore them later from the card manager.`,
    positiveText: 'Discard',
    negativeText: 'Cancel',
    onPositiveClick: () => {
      cardManager.discardCards(cardIds)
      message.success(`Discarded ${cardIds.length} cards`)
    }
  })
}

// Handle restore cards
function handleRestoreCards(cardIds: string[]) {
  cardManager.restoreCards(cardIds)
  message.success(`Restored ${cardIds.length} cards`)
}

// Handle select all
function handleSelectAll() {
  cardManager.selectAll()
  message.info('Selected all cards')
}

// Handle select none
function handleSelectNone() {
  cardManager.deselectAll()
  message.info('Deselected all cards')
}

// Handle generate composite
async function handleGenerateComposite(options: CompositeOptions) {
  const selectedCards = cardManager.getSelectedCards()

  if (selectedCards.length === 0) {
    message.warning('Please select at least one card to generate composite')
    return
  }

  loadingBar.start()

  await compositeGenerator.generate(selectedCards, options)

  if (compositeGenerator.error.value) {
    loadingBar.error()
    notification.error({
      title: 'Composite Generation Failed',
      content: compositeGenerator.error.value,
      duration: 5000
    })
  } else {
    loadingBar.finish()
    notification.success({
      title: 'Composite Generated',
      content: `Successfully created composite image with ${selectedCards.length} cards in ${options.cardsPerRow} columns`,
      duration: 3000
    })
    activeTab.value = 'composite'
  }
}

// Handle download composite
function handleDownloadComposite() {
  const timestamp = new Date().toISOString().split('T')[0]
  compositeGenerator.download(`composite_${timestamp}.png`)
  message.success('Composite downloaded')
}

// Track overall processing state
const isProcessing = computed(() =>
  batchProcessor.isProcessing.value || compositeGenerator.isGenerating.value
)

// Keyboard shortcuts
useKeyboardShortcuts([
  {
    key: 's',
    ctrl: true,
    description: 'Switch to Single Mode',
    handler: () => router.push('/')
  },
  {
    key: 'a',
    ctrl: true,
    description: 'Select all cards',
    handler: () => handleSelectAll()
  },
  {
    key: 'd',
    ctrl: true,
    shift: true,
    description: 'Discard selected cards',
    handler: () => {
      const selectedCards = cardManager.getSelectedCards()
      if (selectedCards.length > 0) {
        handleDiscardCards(selectedCards.map(c => c.globalId))
      }
    }
  },
  {
    key: 'g',
    ctrl: true,
    description: 'Generate composite',
    handler: () => {
      if (cardManager.stats.value.selected > 0) {
        activeTab.value = 'composite'
      }
    }
  },
  {
    key: 'z',
    ctrl: true,
    description: 'Undo',
    handler: () => {
      if (cardManager.canUndo.value) {
        cardManager.undo()
        message.info('Undo')
      }
    }
  },
  {
    key: 'z',
    ctrl: true,
    shift: true,
    description: 'Redo',
    handler: () => {
      if (cardManager.canRedo.value) {
        cardManager.redo()
        message.info('Redo')
      }
    }
  }
])
</script>

<template>
  <n-layout style="min-height: 100vh">
    <n-layout-header bordered style="padding: 1rem">
      <n-space justify="space-between" align="center">
        <div>
          <n-h1 style="margin: 0">Card Extractor - Batch Mode</n-h1>
          <n-p style="margin: 0.5rem 0 0 0" depth="3">
            Process multiple scanned images and manage all extracted cards
          </n-p>
        </div>
        <n-button type="primary" @click="router.push('/')">
          Single Image Mode
        </n-button>
      </n-space>
    </n-layout-header>

    <n-layout-content style="padding: 2rem">
      <n-space vertical size="large">
        <!-- Statistics -->
        <n-grid v-if="batchProcessor.totalImages.value > 0" :x-gap="12" :y-gap="12" :cols="5">
          <n-grid-item>
            <n-statistic label="Total Images" :value="batchProcessor.totalImages.value" />
          </n-grid-item>
          <n-grid-item>
            <n-statistic label="Completed" :value="batchProcessor.completedImages.value" />
          </n-grid-item>
          <n-grid-item>
            <n-statistic label="Failed" :value="batchProcessor.failedImages.value" />
          </n-grid-item>
          <n-grid-item>
            <n-statistic label="Total Cards" :value="cardManager.stats.value.total" />
          </n-grid-item>
          <n-grid-item>
            <n-statistic label="Selected" :value="cardManager.stats.value.selected" />
          </n-grid-item>
        </n-grid>

        <!-- Show errors if any -->
        <n-alert
          v-if="batchProcessor.error.value"
          type="error"
          title="Batch Processing Error"
          closable
          @close="batchProcessor.error.value = null"
        >
          {{ batchProcessor.error.value }}
        </n-alert>

        <n-alert
          v-if="compositeGenerator.error.value"
          type="error"
          title="Composite Generation Error"
          closable
          @close="compositeGenerator.error.value = null"
        >
          {{ compositeGenerator.error.value }}
        </n-alert>

        <!-- Tabs for different stages -->
        <n-tabs v-model:value="activeTab" type="line" animated>
          <n-tab-pane name="upload" tab="Upload Images">
            <batch-uploader @files-selected="handleFilesSelected" />
          </n-tab-pane>

          <n-tab-pane
            name="progress"
            tab="Processing Progress"
            :disabled="batchProcessor.totalImages.value === 0"
          >
            <batch-progress
              :current="batchProcessor.currentIndex.value"
              :total="batchProcessor.totalImages.value"
              :images="batchProcessor.images.value"
            />
          </n-tab-pane>

          <n-tab-pane
            name="cards"
            tab="Card Management"
            :disabled="cardManager.cards.value.length === 0"
          >
            <card-manager
              :cards="cardManager.cards.value"
              :can-undo="cardManager.canUndo.value"
              :can-redo="cardManager.canRedo.value"
              @select-card="handleSelectCard"
              @discard-cards="handleDiscardCards"
              @restore-cards="handleRestoreCards"
              @undo="cardManager.undo"
              @redo="cardManager.redo"
              @select-all="handleSelectAll"
              @select-none="handleSelectNone"
            />
          </n-tab-pane>

          <n-tab-pane name="composite" tab="Composite Generation">
            <n-space vertical>
              <composite-controls @generate="handleGenerateComposite" />

              <composite-preview
                v-if="compositeGenerator.hasComposite.value && compositeGenerator.layout.value"
                :composite="compositeGenerator.composite.value"
                :layout="compositeGenerator.layout.value"
                @download="handleDownloadComposite"
              />
            </n-space>
          </n-tab-pane>
        </n-tabs>
      </n-space>
    </n-layout-content>

    <!-- Processing Overlay -->
    <processing-overlay
      :show="isProcessing"
      :message="
        batchProcessor.isProcessing.value
          ? `Processing images... ${batchProcessor.currentIndex.value}/${batchProcessor.totalImages.value}`
          : compositeGenerator.isGenerating.value
          ? 'Generating composite...'
          : 'Processing...'
      "
    />
  </n-layout>
</template>
