<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { NCard, NButton, NSpace, NText, NStatistic, NGrid, NGridItem } from 'naive-ui'
import cv from 'opencv-ts'
import type { CompositeResult } from '@/lib/compositeGenerator'

const props = defineProps<{
  composite: any
  layout: CompositeResult['layout']
}>()

const emit = defineEmits<{
  download: []
}>()

const compositeCanvas = ref<HTMLCanvasElement>()

function updateCanvas() {
  if (!compositeCanvas.value || !props.composite) return
  cv.imshow(compositeCanvas.value, props.composite)
}

onMounted(() => {
  updateCanvas()
})

watch(() => props.composite, () => {
  updateCanvas()
}, { deep: true })
</script>

<template>
  <n-card title="Composite Preview">
    <template #header-extra>
      <n-button type="primary" @click="emit('download')">
        Download Composite
      </n-button>
    </template>

    <n-space vertical>
      <n-grid :x-gap="12" :y-gap="12" :cols="4">
        <n-grid-item>
          <n-statistic label="Total Cards" :value="layout.cardPositions.length" />
        </n-grid-item>
        <n-grid-item>
          <n-statistic label="Rows" :value="layout.rows" />
        </n-grid-item>
        <n-grid-item>
          <n-statistic label="Columns" :value="layout.cols" />
        </n-grid-item>
        <n-grid-item>
          <n-statistic label="Dimensions">
            <template #default>
              <n-text>{{ layout.totalWidth }} × {{ layout.totalHeight }}</n-text>
            </template>
          </n-statistic>
        </n-grid-item>
      </n-grid>

      <div style="overflow: auto; max-height: 70vh; border: 1px solid #333">
        <canvas
          ref="compositeCanvas"
          style="max-width: 100%; display: block"
        ></canvas>
      </div>
    </n-space>
  </n-card>
</template>
