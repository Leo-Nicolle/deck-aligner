<script setup lang="ts">
import { computed } from "vue";
import { NCard, NText, NCarousel } from "naive-ui";

const props = defineProps<{
  blobs: Blob[];
}>();
const urls = computed(() =>
  props.blobs.map((blob) => URL.createObjectURL(blob))
);
</script>

<template>
  <n-card title="Extraction Preview">
    <n-text strong>Extraction</n-text>
    <n-carousel
      :slides-per-view="3"
      :space-between="20"
      :loop="false"
      show-arrow
      draggable
    >
      <img v-for="url in urls" :key="url" :src="url" class="carousel-img" />
    </n-carousel>
  </n-card>
</template>

<style scoped>
.carousel-img {
  width: 100%;
  height: 240px;
  object-fit: contain;
}
</style>
