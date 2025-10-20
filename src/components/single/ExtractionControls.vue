<script setup lang="ts">
import { NCard, NButton, NSpace, NInputNumber, NText } from "naive-ui";
import type { CardExtractionOptions } from "@/lib/types";

const props = defineProps<{
  options: CardExtractionOptions;
}>();
const emit = defineEmits<{
  "update:options": [CardExtractionOptions];
  extract: [];
}>();

function updateOption<K extends keyof CardExtractionOptions>(
  key: K,
  value: CardExtractionOptions[K]
) {
  emit("update:options", { ...props.options, [key]: value });
}
</script>

<template>
  <n-card title="Card Extraction">
    <n-space vertical>
      <n-space align="center">
        <n-text>Output Width:</n-text>
        <n-input-number
          :value="props.options.outputWidth || 400"
          @update:value="(v) => updateOption('outputWidth', v)"
          :min="100"
          :max="2000"
          :step="50"
          style="width: 150px"
        />
        <n-text>px</n-text>
      </n-space>

      <n-space align="center">
        <n-text>Output Height:</n-text>
        <n-input-number
          :value="props.options.outputHeight || 150"
          @update:value="(v) => updateOption('outputHeight', v)"
          :min="100"
          :max="2000"
          :step="50"
          style="width: 150px"
        />
        <n-text>px</n-text>
      </n-space>

      <n-button type="primary" size="large" block @click="emit('extract')">
        Extract Cards
      </n-button>
    </n-space>
  </n-card>
</template>
