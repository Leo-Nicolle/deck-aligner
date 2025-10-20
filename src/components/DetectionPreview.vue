<script setup lang="ts">
import { ref } from "vue";
import { NCard, NText } from "naive-ui";

const detectionCanvas = ref<HTMLCanvasElement>();
defineExpose({
  detectionCanvas,
});
</script>

<template>
  <n-card title="Detection Pipeline">
    <n-text strong>Detection</n-text>
    <canvas
      ref="detectionCanvas"
      style="width: 100%; border: 1px solid #333; margin-top: 8px"
    ></canvas>
  </n-card>
</template>
