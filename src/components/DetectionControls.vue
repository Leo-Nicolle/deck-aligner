<script setup lang="ts">
import {
  NCard,
  NSpace,
  NText,
  NSlider,
  NGrid,
  NGridItem,
} from "naive-ui";
import type { CardDetectionOptions } from "@/lib/types";

const props = defineProps<{
  options: CardDetectionOptions;
}>();
const emit = defineEmits<{
  "update:options": [CardDetectionOptions];
}>();

function updateOption<K extends keyof CardDetectionOptions>(
  key: K,
  value: CardDetectionOptions[K]
) {
  emit("update:options", { ...props.options, [key]: value });
}
</script>

<template>
  <n-card title="Card Detection">
    <n-space vertical>
      <n-card title="Detection Parameters" size="small">
        <n-grid :x-gap="12" :y-gap="12" :cols="2">
          <n-grid-item>
            <n-text
              >Min Area Ratio:
              {{ (options.minAreaRatio || 0.01).toFixed(3) }}</n-text
            >
            <n-slider
              :value="options.minAreaRatio || 0.01"
              :min="0.001"
              :max="0.1"
              :step="0.001"
              @update:value="(v) => updateOption('minAreaRatio', v)"
            />
          </n-grid-item>

          <n-grid-item>
            <n-text
              >Max Area Ratio:
              {{ (options.maxAreaRatio || 0.5).toFixed(3) }}</n-text
            >
            <n-slider
              :value="options.maxAreaRatio || 0.5"
              :min="0.1"
              :max="1.0"
              :step="0.01"
              @update:value="(v) => updateOption('maxAreaRatio', v)"
            />
          </n-grid-item>

          <n-grid-item>
            <n-text
              >Min Aspect Ratio:
              {{ (options.minAspectRatio || 1.2).toFixed(2) }}</n-text
            >
            <n-slider
              :value="options.minAspectRatio || 1.2"
              :min="0.5"
              :max="2.0"
              :step="0.1"
              @update:value="(v) => updateOption('minAspectRatio', v)"
            />
          </n-grid-item>

          <n-grid-item>
            <n-text
              >Max Aspect Ratio:
              {{ (options.maxAspectRatio || 1.8).toFixed(2) }}</n-text
            >
            <n-slider
              :value="options.maxAspectRatio || 1.8"
              :min="1.0"
              :max="3.0"
              :step="0.1"
              @update:value="(v) => updateOption('maxAspectRatio', v)"
            />
          </n-grid-item>

          <n-grid-item>
            <n-text
              >Min Solidity:
              {{ (options.minSolidity || 0.85).toFixed(2) }}</n-text
            >
            <n-slider
              :value="options.minSolidity || 0.85"
              :min="0.5"
              :max="1.0"
              :step="0.05"
              @update:value="(v) => updateOption('minSolidity', v)"
            />
          </n-grid-item>
        </n-grid>
      </n-card>
    </n-space>
  </n-card>
</template>
