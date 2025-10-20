<template>
  <canvas ref="canvas"></canvas>
</template>

<script setup lang="ts">
import { ref, watch, onBeforeUnmount } from "vue";
import { Mat } from "opencv-ts";
import { imshow } from "opencv-ts";

const canvas = ref<HTMLCanvasElement | null>(null);
const mat = ref<Mat | null>(null);

watch(
  mat,
  (newMat, oldMat) => {
    if (!canvas.value || !newMat) return;

    imshow(canvas.value, newMat);

    // Free the old Mat to prevent WASM memory leaks
    if (oldMat && oldMat !== newMat) oldMat.delete();
  },
  { immediate: true }
);

onBeforeUnmount(() => {
  if (mat.value) mat.value.delete();
});
</script>
