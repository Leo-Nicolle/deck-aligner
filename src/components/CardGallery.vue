<script setup lang="ts">
import { NCard, NGrid, NGridItem, NButton, NImage, NSpace, NText } from 'naive-ui'
import { computed } from 'vue'
import cv from 'opencv-ts'
import type { ExtractedCard } from '@/lib/cardExtractor'

const props = defineProps<{
  cards: ExtractedCard[]
}>()

const emit = defineEmits<{
  download: [card: ExtractedCard]
  downloadAll: []
}>()

function getCardImageUrl(card: ExtractedCard): string {
  const canvas = document.createElement('canvas')
  canvas.width = card.image.cols
  canvas.height = card.image.rows
  cv.imshow(canvas, card.image)
  return canvas.toDataURL()
}

const hasCards = computed(() => props.cards.length > 0)
</script>

<template>
  <n-card title="Extracted Cards">
    <template #header-extra>
      <n-button
        type="primary"
        :disabled="!hasCards"
        @click="emit('downloadAll')"
      >
        Download All as ZIP
      </n-button>
    </template>

    <n-space v-if="!hasCards" justify="center" style="padding: 2rem">
      <n-text depth="3">No cards extracted yet. Use the extraction controls above to extract cards.</n-text>
    </n-space>

    <n-grid v-else :x-gap="16" :y-gap="16" :cols="3">
      <n-grid-item v-for="card in cards" :key="card.cardNumber">
        <n-card :title="`Card ${card.cardNumber}`" size="small">
          <n-space vertical align="center">
            <n-image
              :src="getCardImageUrl(card)"
              :alt="`Card ${card.cardNumber}`"
              object-fit="contain"
              style="max-width: 100%"
            />
            <n-button
              type="primary"
              size="small"
              block
              @click="emit('download', card)"
            >
              Download PNG
            </n-button>
          </n-space>
        </n-card>
      </n-grid-item>
    </n-grid>
  </n-card>
</template>
