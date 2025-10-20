<script setup lang="ts">
import { ref, computed } from 'vue'
import cv from 'opencv-ts'
import {
  NCard, NGrid, NGridItem, NImage, NCheckbox,
  NButton, NSpace, NTag, NSelect, NButtonGroup, NText
} from 'naive-ui'
import type { ManagedCard } from '@/lib/cardManager'

const props = defineProps<{
  cards: ManagedCard[]
  canUndo?: boolean
  canRedo?: boolean
}>()

const emit = defineEmits<{
  selectCard: [cardId: string, selected: boolean]
  discardCards: [cardIds: string[]]
  restoreCards: [cardIds: string[]]
  selectAll: []
  selectNone: []
  undo: []
  redo: []
}>()

const filterSource = ref<string | null>(null)
const showDiscarded = ref(false)

const sourceImages = computed(() => {
  const sources = new Set(props.cards.map(c => c.sourceImageName))
  return Array.from(sources).map(name => ({ label: name, value: name }))
})

const selectedCards = computed(() =>
  props.cards.filter(c => c.isSelected)
)

const filteredCards = computed(() => {
  let result = props.cards

  // Filter by source
  if (filterSource.value) {
    result = result.filter(c => c.sourceImageName === filterSource.value)
  }

  // Filter discarded
  if (!showDiscarded.value) {
    result = result.filter(c => !c.isDiscarded)
  }

  return result
})

function getCardImageUrl(card: ManagedCard): string {
  const canvas = document.createElement('canvas')
  canvas.width = card.image.cols
  canvas.height = card.image.rows
  cv.imshow(canvas, card.image)
  return canvas.toDataURL()
}

function handleDiscardSelected() {
  const ids = selectedCards.value.map(c => c.globalId)
  emit('discardCards', ids)
}

function handleRestoreSelected() {
  const ids = selectedCards.value.filter(c => c.isDiscarded).map(c => c.globalId)
  emit('restoreCards', ids)
}
</script>

<template>
  <n-card title="Card Gallery">
    <template #header-extra>
      <n-space>
        <n-select
          v-model:value="filterSource"
          :options="sourceImages"
          placeholder="Filter by source"
          clearable
          style="width: 200px"
        />
        <n-checkbox v-model:checked="showDiscarded">
          Show Discarded
        </n-checkbox>
      </n-space>
    </template>

    <n-space vertical>
      <n-space>
        <n-button-group>
          <n-button @click="emit('selectAll')">Select All</n-button>
          <n-button @click="emit('selectNone')">Select None</n-button>
        </n-button-group>

        <n-button
          type="warning"
          :disabled="selectedCards.length === 0"
          @click="handleDiscardSelected"
        >
          Discard Selected ({{ selectedCards.length }})
        </n-button>

        <n-button
          v-if="showDiscarded"
          type="success"
          :disabled="selectedCards.filter(c => c.isDiscarded).length === 0"
          @click="handleRestoreSelected"
        >
          Restore Selected
        </n-button>

        <n-button-group>
          <n-button
            :disabled="!canUndo"
            @click="emit('undo')"
            title="Undo (Ctrl+Z)"
          >
            Undo
          </n-button>
          <n-button
            :disabled="!canRedo"
            @click="emit('redo')"
            title="Redo (Ctrl+Shift+Z)"
          >
            Redo
          </n-button>
        </n-button-group>
      </n-space>

      <n-text v-if="filteredCards.length === 0" depth="3">
        No cards to display. Try adjusting filters or uploading images.
      </n-text>

      <n-grid v-else :x-gap="16" :y-gap="16" :cols="4">
        <n-grid-item
          v-for="card in filteredCards"
          :key="card.globalId"
          :class="{
            'card-selected': card.isSelected,
            'card-discarded': card.isDiscarded
          }"
        >
          <n-card size="small">
            <template #header>
              <n-space justify="space-between" align="center">
                <n-checkbox
                  :checked="card.isSelected"
                  @update:checked="(val) => emit('selectCard', card.globalId, val)"
                />
                <n-tag v-if="card.isDiscarded" type="error" size="small">
                  Discarded
                </n-tag>
              </n-space>
            </template>

            <n-image
              :src="getCardImageUrl(card)"
              object-fit="contain"
              style="max-width: 100%"
            />

            <template #footer>
              <n-text depth="3" style="font-size: 11px; display: block">
                {{ card.globalId }}
              </n-text>
              <n-text depth="3" style="font-size: 11px; display: block">
                {{ card.sourceImageName }}
              </n-text>
            </template>
          </n-card>
        </n-grid-item>
      </n-grid>
    </n-space>
  </n-card>
</template>

<style scoped>
.card-selected {
  outline: 2px solid #18a058;
  outline-offset: 2px;
  border-radius: 4px;
}

.card-discarded {
  opacity: 0.4;
  filter: grayscale(80%);
}
</style>
