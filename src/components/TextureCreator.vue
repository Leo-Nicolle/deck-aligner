<script setup lang="ts">
import { ref } from "vue";
import { NCard, NGrid, NGridItem, NText } from "naive-ui";

const blobs = ref<Blob[]>([]);
import { computed } from "vue";

const grid = computed(() => {
  const W = Math.ceil(Math.sqrt(blobs.value.length));
  const H = Math.ceil(blobs.value.length / W);
  return { W, H };
});
const urls = computed(() =>
  blobs.value.map((blob) => URL.createObjectURL(blob))
);
</script>

<template>
  <n-card title="Preprocessing Pipeline">
    <n-grid :x-gap="12" :y-gap="12" :cols="grid.W" :rows="grid.H">
      <n-grid-item v-for="(url, index) in urls">
        <n-text strong>Card {{ index }}</n-text>
        <img :src="url" alt="Card" />
      </n-grid-item>
    </n-grid>
  </n-card>
</template>
