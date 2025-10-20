<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { NCard, NGrid, NGridItem, NText } from 'naive-ui'
import type { PreprocessingResult } from '@/lib/imageProcessor'
import { matToCanvas } from '@/lib/imageProcessor'

const props = defineProps<{
  result: PreprocessingResult
}>()

const originalCanvas = ref<HTMLCanvasElement>()
const grayscaleCanvas = ref<HTMLCanvasElement>()
const blurredCanvas = ref<HTMLCanvasElement>()
const binaryCanvas = ref<HTMLCanvasElement>()
const processedCanvas = ref<HTMLCanvasElement>()

function updateCanvases() {
  if (originalCanvas.value && props.result.original) {
    matToCanvas(props.result.original, originalCanvas.value)
  }
  if (grayscaleCanvas.value && props.result.grayscale) {
    matToCanvas(props.result.grayscale, grayscaleCanvas.value)
  }
  if (blurredCanvas.value && props.result.blurred) {
    matToCanvas(props.result.blurred, blurredCanvas.value)
  }
  if (binaryCanvas.value && props.result.binary) {
    matToCanvas(props.result.binary, binaryCanvas.value)
  }
  if (processedCanvas.value && props.result.processed) {
    matToCanvas(props.result.processed, processedCanvas.value)
  }
}

onMounted(() => {
  updateCanvases()
})

watch(() => props.result, () => {
  updateCanvases()
}, { deep: true })
</script>

<template>
  <n-card title="Preprocessing Pipeline">
    <n-grid :x-gap="12" :y-gap="12" :cols="3">
      <n-grid-item>
        <n-text strong>Original</n-text>
        <canvas ref="originalCanvas" style="width: 100%; border: 1px solid #333; margin-top: 8px"></canvas>
      </n-grid-item>

      <n-grid-item>
        <n-text strong>Grayscale</n-text>
        <canvas ref="grayscaleCanvas" style="width: 100%; border: 1px solid #333; margin-top: 8px"></canvas>
      </n-grid-item>

      <n-grid-item>
        <n-text strong>Blurred</n-text>
        <canvas ref="blurredCanvas" style="width: 100%; border: 1px solid #333; margin-top: 8px"></canvas>
      </n-grid-item>

      <n-grid-item>
        <n-text strong>Binary</n-text>
        <canvas ref="binaryCanvas" style="width: 100%; border: 1px solid #333; margin-top: 8px"></canvas>
      </n-grid-item>

      <n-grid-item>
        <n-text strong>Processed (Morphology)</n-text>
        <canvas ref="processedCanvas" style="width: 100%; border: 1px solid #333; margin-top: 8px"></canvas>
      </n-grid-item>
    </n-grid>
  </n-card>
</template>
