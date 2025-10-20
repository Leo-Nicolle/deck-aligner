<script setup lang="ts">
import { ref } from 'vue'
import {
  NCard, NSpace, NSlider, NText, NColorPicker,
  NSelect, NButton, NInputNumber
} from 'naive-ui'
import type { CompositeOptions } from '@/lib/compositeGenerator'

const emit = defineEmits<{
  generate: [CompositeOptions]
}>()

const options = ref<CompositeOptions>({
  cardsPerRow: 3,
  spacing: 20,
  backgroundColor: '#1a1a1a',
  scaleMode: 'fit',
  maxCardWidth: 750,
  maxCardHeight: 1050
})

const scaleModeOptions = [
  { label: 'Original Size', value: 'original' },
  { label: 'Fit to Grid', value: 'fit' }
]

function handleGenerate() {
  emit('generate', options.value)
}
</script>

<template>
  <n-card title="Composite Layout Options">
    <n-space vertical>
      <div>
        <n-text>Cards Per Row: {{ options.cardsPerRow }}</n-text>
        <n-slider
          v-model:value="options.cardsPerRow"
          :min="1"
          :max="10"
        />
      </div>

      <div>
        <n-text>Spacing: {{ options.spacing }}px</n-text>
        <n-slider
          v-model:value="options.spacing"
          :min="0"
          :max="100"
          :step="5"
        />
      </div>

      <div>
        <n-text>Background Color</n-text>
        <n-color-picker v-model:value="options.backgroundColor" :show-alpha="false" />
      </div>

      <div>
        <n-text>Scale Mode</n-text>
        <n-select
          v-model:value="options.scaleMode"
          :options="scaleModeOptions"
        />
      </div>

      <div v-if="options.scaleMode === 'fit'">
        <n-space vertical>
          <n-space align="center">
            <n-text>Max Card Width:</n-text>
            <n-input-number
              v-model:value="options.maxCardWidth"
              :min="100"
              :max="2000"
              :step="50"
              style="width: 150px"
            />
            <n-text>px</n-text>
          </n-space>

          <n-space align="center">
            <n-text>Max Card Height:</n-text>
            <n-input-number
              v-model:value="options.maxCardHeight"
              :min="100"
              :max="2000"
              :step="50"
              style="width: 150px"
            />
            <n-text>px</n-text>
          </n-space>
        </n-space>
      </div>

      <n-button
        type="primary"
        size="large"
        block
        @click="handleGenerate"
      >
        Generate Composite Image
      </n-button>
    </n-space>
  </n-card>
</template>
