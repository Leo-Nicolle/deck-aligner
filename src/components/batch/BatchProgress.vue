<script setup lang="ts">
import { computed } from 'vue'
import { NCard, NProgress, NSpace, NText, NList, NListItem, NTag, NSpin } from 'naive-ui'
import type { ProcessedImage } from '@/lib/batchProcessor'

const props = defineProps<{
  current: number
  total: number
  images: ProcessedImage[]
}>()

const percentage = computed(() => {
  if (props.total === 0) return 0
  return Math.round((props.current / props.total) * 100)
})

function getStatusType(status: ProcessedImage['status']) {
  switch (status) {
    case 'completed':
      return 'success'
    case 'error':
      return 'error'
    case 'processing':
      return 'info'
    default:
      return 'default'
  }
}

function getStatusText(status: ProcessedImage['status']) {
  switch (status) {
    case 'completed':
      return 'Completed'
    case 'error':
      return 'Error'
    case 'processing':
      return 'Processing'
    default:
      return 'Pending'
  }
}
</script>

<template>
  <n-card title="Batch Processing Progress">
    <n-space vertical>
      <div>
        <n-text>Processing {{ current }} of {{ total }} images</n-text>
        <n-progress
          type="line"
          :percentage="percentage"
          :status="current === total ? 'success' : 'default'"
          :show-indicator="true"
        />
      </div>

      <n-list bordered>
        <n-list-item v-for="image in images" :key="image.id">
          <template #prefix>
            <n-spin v-if="image.status === 'processing'" size="small" />
          </template>

          <n-space justify="space-between" align="center" style="width: 100%">
            <div>
              <n-text strong>{{ image.fileName }}</n-text>
              <n-text v-if="image.extractedCards.length > 0" depth="3" style="font-size: 12px; display: block">
                {{ image.extractedCards.length }} cards extracted
              </n-text>
              <n-text v-if="image.error" type="error" style="font-size: 12px; display: block">
                {{ image.error }}
              </n-text>
            </div>

            <n-tag :type="getStatusType(image.status)" size="small">
              {{ getStatusText(image.status) }}
            </n-tag>
          </n-space>
        </n-list-item>
      </n-list>
    </n-space>
  </n-card>
</template>
