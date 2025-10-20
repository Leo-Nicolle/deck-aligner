<script setup lang="ts">
import { NCard, NGrid, NGridItem, NButton, NCheckbox } from "naive-ui";
import { computed, ref, watch } from "vue";

const props = defineProps<{
  blobs: Blob[];
}>();
const selected = ref<boolean[]>(props.blobs.map(() => true));
const indexes = ref<number[]>(props.blobs.map((_, i) => i));

watch(
  () => props.blobs,
  (newBlobs, oldBlobs) => {
    if (newBlobs.length <= oldBlobs.length) return;
    const diff = newBlobs.length - oldBlobs.length;
    selected.value = [...selected.value, ...Array(diff).fill(true)];
    indexes.value = [
      ...indexes.value,
      ...Array.from({ length: diff }, (_, i) => oldBlobs.length + i),
    ];
  }
);

const objs = computed(() =>
  props.blobs
    .map((blob, i) => ({
      url: URL.createObjectURL(blob),
      blob,
      index: i,
      selected: selected.value[i],
    }))
    .sort((a, b) => indexes.value[a.index] - indexes.value[b.index])
);
function moveLeft(index: number) {
  const currentPos = indexes.value[index];
  if (currentPos === 0) return;
  const swapIndex = indexes.value.indexOf(currentPos - 1);
  indexes.value[index] = currentPos - 1;
  indexes.value[swapIndex] = currentPos;
}
function moveRight(index: number) {
  const currentPos = indexes.value[index];
  if (currentPos === indexes.value.length - 1) return;
  const swapIndex = indexes.value.indexOf(currentPos + 1);
  indexes.value[index] = currentPos + 1;
  indexes.value[swapIndex] = currentPos;
}
async function create() {
  console.log("create texture");
  const canvas = document.createElement("canvas");
  const selected = objs.value.filter((o) => o.selected);
  const cols = Math.ceil(Math.sqrt(selected.length));
  const rows = Math.ceil(selected.length / cols);

  const promises = Promise.all(
    selected.map(async (o) => {
      const img = new Image();
      img.src = o.url;
      await new Promise<void>((resolve) => {
        img.onload = () => resolve();
      });
      return img;
    })
  );
  const images = await promises;
  const W = cols * images[0].width;
  const H = rows * images[0].height;
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  images.forEach((img, i) => {
    const x = (i % cols) * img.width;
    const y = Math.floor(i / cols) * img.height;
    ctx.drawImage(img, x, y);
  });
  canvas.toBlob((blob) => {
    if (blob) {
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = "texture.png";
      link.click();
    }
  });
}
</script>

<template>
  <n-card title="Texture Creator">
    <n-button type="primary" @click="create"> Create Texture </n-button>
    <n-grid :x-gap="12" :y-gap="12" :cols="4">
      <n-grid-item v-for="{ url, index } in objs">
        <div class="card">
          <div class="header">
            <n-button @click="moveLeft(index)">prev</n-button>
            <n-button @click="moveRight(index)">next</n-button>
            <n-checkbox v-model:checked="selected[index]">Include</n-checkbox>
          </div>
          <img :src="url" alt="Card" />
        </div>
      </n-grid-item>
    </n-grid>
  </n-card>
</template>

<style scoped>
img {
  width: 100%;
  height: auto;
  object-fit: contain;
}
.card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}
</style>
