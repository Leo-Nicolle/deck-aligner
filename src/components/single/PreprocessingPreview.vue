<script setup lang="ts">
import { ref, onMounted, watch } from "vue";
import { NCard, NGrid, NGridItem, NText } from "naive-ui";
import type { PreprocessingResult } from "@/lib/types";

const props = defineProps<{
  result: PreprocessingResult;
}>();

const originalCanvas = ref<HTMLCanvasElement>();
const grayscaleCanvas = ref<HTMLCanvasElement>();
const blurredCanvas = ref<HTMLCanvasElement>();
const binaryCanvas = ref<HTMLCanvasElement>();
const processedCanvas = ref<HTMLCanvasElement>();

function updateCanvases() {}

onMounted(() => {
  updateCanvases();
});

watch(
  () => props.result,
  () => {
    updateCanvases();
  },
  { deep: true }
);
</script>

<template>
  <n-card title="Preprocessing Pipeline">
    <n-grid :x-gap="12" :y-gap="12" :cols="3">
      <n-grid-item>
        <n-text strong>Original</n-text>
        <canvas
          ref="originalCanvas"
          style="width: 100%; border: 1px solid #333; margin-top: 8px"
        ></canvas>
      </n-grid-item>

      <n-grid-item>
        <n-text strong>Grayscale</n-text>
        <canvas
          ref="grayscaleCanvas"
          style="width: 100%; border: 1px solid #333; margin-top: 8px"
        ></canvas>
      </n-grid-item>

      <n-grid-item>
        <n-text strong>Blurred</n-text>
        <canvas
          ref="blurredCanvas"
          style="width: 100%; border: 1px solid #333; margin-top: 8px"
        ></canvas>
      </n-grid-item>

      <n-grid-item>
        <n-text strong>Binary</n-text>
        <canvas
          ref="binaryCanvas"
          style="width: 100%; border: 1px solid #333; margin-top: 8px"
        ></canvas>
      </n-grid-item>

      <n-grid-item>
        <n-text strong>Processed (Morphology)</n-text>
        <canvas
          ref="processedCanvas"
          style="width: 100%; border: 1px solid #333; margin-top: 8px"
        ></canvas>
      </n-grid-item>
    </n-grid>
  </n-card>
</template>
