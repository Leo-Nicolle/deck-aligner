<script setup lang="ts">
import { NCard, NButton, NSpace, NInputNumber, NText } from 'naive-ui'
import { ref } from 'vue'

const emit = defineEmits<{
  extract: [{ outputWidth: number; outputHeight: number }]
}>()

const outputWidth = ref(750)
const outputHeight = ref(1050)

function handleExtract() {
  emit('extract', {
    outputWidth: outputWidth.value,
    outputHeight: outputHeight.value
  })
}
</script>

<template>
  <n-card title="Card Extraction">
    <n-space vertical>
      <n-space align="center">
        <n-text>Output Width:</n-text>
        <n-input-number
          v-model:value="outputWidth"
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
          v-model:value="outputHeight"
          :min="100"
          :max="2000"
          :step="50"
          style="width: 150px"
        />
        <n-text>px</n-text>
      </n-space>

      <n-button
        type="primary"
        size="large"
        block
        @click="handleExtract"
      >
        Extract Cards
      </n-button>
    </n-space>
  </n-card>
</template>
