<script setup lang="ts">
import { NCard, NSlider, NSpace, NText, NCheckbox, NInputNumber } from 'naive-ui'
import type { PreprocessingOptions } from '@/lib/imageProcessor'

const props = defineProps<{
  options: PreprocessingOptions
}>()

const emit = defineEmits<{
  'update:options': [PreprocessingOptions]
}>()

function updateOption<K extends keyof PreprocessingOptions>(
  key: K,
  value: PreprocessingOptions[K]
) {
  emit('update:options', { ...props.options, [key]: value })
}
</script>

<template>
  <n-card title="Preprocessing Options">
    <n-space vertical>
      <div>
        <n-text>Blur Kernel Size: {{ options.blurKernelSize || 5 }}</n-text>
        <n-slider
          :value="options.blurKernelSize || 5"
          :min="1"
          :max="21"
          :step="2"
          @update:value="(v) => updateOption('blurKernelSize', v)"
        />
        <n-text depth="3" style="font-size: 12px">
          Larger values reduce noise but may blur card edges
        </n-text>
      </div>

      <div>
        <n-text>Morphology Kernel Size: {{ options.morphologyKernelSize || 3 }}</n-text>
        <n-slider
          :value="options.morphologyKernelSize || 3"
          :min="1"
          :max="15"
          :step="2"
          @update:value="(v) => updateOption('morphologyKernelSize', v)"
        />
        <n-text depth="3" style="font-size: 12px">
          Fills small holes in cards during detection
        </n-text>
      </div>

      <div>
        <n-checkbox
          :checked="options.useAdaptiveThreshold || false"
          @update:checked="(v) => updateOption('useAdaptiveThreshold', v)"
        >
          Use Adaptive Threshold
        </n-checkbox>
        <n-text depth="3" style="font-size: 12px; display: block; margin-top: 4px">
          Better for images with uneven lighting
        </n-text>
      </div>

      <div v-if="!options.useAdaptiveThreshold">
        <n-text>Threshold Value: {{ options.thresholdValue || 127 }}</n-text>
        <n-input-number
          :value="options.thresholdValue || 127"
          :min="0"
          :max="255"
          @update:value="(v) => updateOption('thresholdValue', v || 127)"
          style="width: 100%"
        />
        <n-text depth="3" style="font-size: 12px">
          Used with Otsu's method for automatic thresholding
        </n-text>
      </div>
    </n-space>
  </n-card>
</template>
