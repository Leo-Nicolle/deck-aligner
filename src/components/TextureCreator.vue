<script setup lang="ts">
import { NCard, NGrid, NGridItem, NButton, NCheckbox, NSpace, NButtonGroup, NIcon } from "naive-ui";
import { ArrowBackOutline, ArrowForwardOutline, DownloadOutline, RefreshOutline } from "@vicons/ionicons5";
import { computed, ref, watch, TransitionGroup } from "vue";

const props = defineProps<{
  blobs: Blob[];
}>();
const selected = ref<boolean[]>(props.blobs.map(() => true));
const indexes = ref<number[]>(props.blobs.map((_, i) => i));
const rotations = ref<number[]>(props.blobs.map(() => 0));
const draggedIndex = ref<number | null>(null);
const dragOverIndex = ref<number | null>(null);

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
    rotations.value = [...rotations.value, ...Array(diff).fill(0)];
  }
);

const objs = computed(() =>
  props.blobs
    .map((blob, i) => ({
      url: URL.createObjectURL(blob),
      blob,
      index: i,
      selected: selected.value[i],
      rotation: rotations.value[i],
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

function rotateCard(index: number) {
  rotations.value[index] = (rotations.value[index] + 90) % 360;
}

function handleDragStart(index: number) {
  draggedIndex.value = index;
}

function handleDragOver(e: DragEvent, targetIndex: number) {
  e.preventDefault();
  if (draggedIndex.value !== null && draggedIndex.value !== targetIndex) {
    dragOverIndex.value = targetIndex;
  }
}

function handleDragLeave() {
  dragOverIndex.value = null;
}

function handleDragEnd() {
  draggedIndex.value = null;
  dragOverIndex.value = null;
}

function handleDrop(targetIndex: number) {
  if (draggedIndex.value === null || draggedIndex.value === targetIndex) {
    handleDragEnd();
    return;
  }

  const draggedPos = indexes.value[draggedIndex.value];
  const targetPos = indexes.value[targetIndex];

  indexes.value[draggedIndex.value] = targetPos;
  indexes.value[targetIndex] = draggedPos;

  handleDragEnd();
}

function selectAll() {
  selected.value = selected.value.map(() => true);
}

function deselectAll() {
  selected.value = selected.value.map(() => false);
}

async function create() {
  const canvas = document.createElement("canvas");
  const selectedObjs = objs.value.filter((o) => o.selected);

  if (selectedObjs.length === 0) {
    alert("Please select at least one card to create a texture");
    return;
  }

  const cols = Math.ceil(Math.sqrt(selectedObjs.length));
  const rows = Math.ceil(selectedObjs.length / cols);

  const promises = Promise.all(
    selectedObjs.map(async (o) => {
      const img = new Image();
      img.src = o.url;
      await new Promise<void>((resolve) => {
        img.onload = () => resolve();
      });
      return { img, rotation: o.rotation };
    })
  );
  const imageData = await promises;

  // Calculate cell size considering rotations
  const firstImg = imageData[0].img;
  const cellWidth = firstImg.width;
  const cellHeight = firstImg.height;

  const W = cols * cellWidth;
  const H = rows * cellHeight;
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  imageData.forEach(({ img, rotation }, i) => {
    const col = i % cols;
    const row = Math.floor(i / cols);
    const x = col * cellWidth;
    const y = row * cellHeight;

    ctx.save();

    // Move to the center of the cell
    ctx.translate(x + cellWidth / 2, y + cellHeight / 2);

    // Apply rotation
    ctx.rotate((rotation * Math.PI) / 180);

    // Draw image centered
    ctx.drawImage(img, -img.width / 2, -img.height / 2);

    ctx.restore();
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
    <template #header-extra>
      <n-space>
        <n-button secondary @click="selectAll">Select All</n-button>
        <n-button secondary @click="deselectAll">Deselect All</n-button>
        <n-button type="primary" @click="create">
          <template #icon>
            <n-icon><DownloadOutline /></n-icon>
          </template>
          Create & Download Texture
        </n-button>
      </n-space>
    </template>

    <TransitionGroup name="card-list" tag="div" class="grid-wrapper">
      <n-grid :x-gap="16" :y-gap="16" :cols="4">
        <n-grid-item v-for="{ url, index } in objs" :key="index">
          <div
            class="card-container"
            :class="{
              'dragging': draggedIndex === index,
              'drag-over': dragOverIndex === index,
              'selected': selected[index]
            }"
            draggable="true"
            @dragstart="handleDragStart(index)"
            @dragover="(e) => handleDragOver(e, index)"
            @dragleave="handleDragLeave"
            @dragend="handleDragEnd"
            @drop="handleDrop(index)"
          >
            <div class="card-image-wrapper">
              <img
                :src="url"
                alt="Card"
                class="card-image"
                :style="{ transform: `rotate(${rotations[index]}deg)` }"
              />
              <div class="drag-indicator">Drag to reorder</div>
            </div>

            <div class="card-controls">
              <n-checkbox
                v-model:checked="selected[index]"
                size="large"
              >
                Include
              </n-checkbox>

              <n-button-group size="small">
                <n-button
                  @click="moveLeft(index)"
                  :disabled="indexes[index] === 0"
                  secondary
                >
                  <template #icon>
                    <n-icon><ArrowBackOutline /></n-icon>
                  </template>
                </n-button>
                <n-button
                  @click="moveRight(index)"
                  :disabled="indexes[index] === indexes.length - 1"
                  secondary
                >
                  <template #icon>
                    <n-icon><ArrowForwardOutline /></n-icon>
                  </template>
                </n-button>
                <n-button
                  @click="rotateCard(index)"
                  secondary
                >
                  <template #icon>
                    <n-icon><RefreshOutline /></n-icon>
                  </template>
                </n-button>
              </n-button-group>
            </div>
          </div>
        </n-grid-item>
      </n-grid>
    </TransitionGroup>
  </n-card>
</template>

<style scoped>
.grid-wrapper {
  width: 100%;
}

/* Card list transition animations */
.card-list-move {
  transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);
}

.card-list-enter-active,
.card-list-leave-active {
  transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);
}

.card-list-enter-from,
.card-list-leave-to {
  opacity: 0;
  transform: scale(0.8);
}

.card-list-leave-active {
  position: absolute;
}

.card-container {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 12px;
  border: 2px solid transparent;
  border-radius: 8px;
  background: var(--n-color);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  cursor: grab;
  position: relative;
}

.card-container:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1);
}

.card-container.dragging {
  opacity: 0.4;
  cursor: grabbing;
  transform: scale(0.95) rotate(2deg);
  z-index: 1000;
}

.card-container.drag-over {
  border-color: #18a058;
  background: rgba(24, 160, 88, 0.1);
  transform: scale(1.05);
  box-shadow: 0 0 20px rgba(24, 160, 88, 0.3);
  animation: pulse 0.6s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% {
    box-shadow: 0 0 20px rgba(24, 160, 88, 0.3);
  }
  50% {
    box-shadow: 0 0 30px rgba(24, 160, 88, 0.5);
  }
}

.card-container.selected {
  border-color: var(--n-color-target);
  background: var(--n-color-hover);
}

.card-image-wrapper {
  position: relative;
  border-radius: 6px;
  overflow: hidden;
  background: #f5f5f5;
}

.card-image {
  width: 100%;
  height: auto;
  object-fit: contain;
  display: block;
  transition: transform 0.5s cubic-bezier(0.4, 0, 0.2, 1);
}

.drag-indicator {
  position: absolute;
  top: 8px;
  right: 8px;
  padding: 4px 8px;
  background: rgba(0, 0, 0, 0.7);
  color: white;
  border-radius: 4px;
  font-size: 12px;
  opacity: 0;
  transition: opacity 0.3s ease;
  pointer-events: none;
}

.card-container:hover .drag-indicator {
  opacity: 1;
}

.card-controls {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
  padding-top: 8px;
  border-top: 1px solid var(--n-border-color);
}
</style>
