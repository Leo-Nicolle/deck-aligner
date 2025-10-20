import { ref, computed } from 'vue'
import { onUnmounted } from 'vue'
import {
  generateComposite,
  type CompositeOptions,
  type CompositeResult
} from '@/lib/compositeGenerator'
import type { ManagedCard } from '@/lib/cardManager'
import cv from 'opencv-ts'

export function useCompositeGenerator() {
  const composite = ref<any>(null)
  const layout = ref<CompositeResult['layout'] | null>(null)
  const isGenerating = ref(false)
  const error = ref<string | null>(null)

  const hasComposite = computed(() => composite.value !== null)

  async function generate(cards: ManagedCard[], options: CompositeOptions) {
    if (cards.length === 0) {
      error.value = 'No cards selected for composite'
      return
    }

    isGenerating.value = true
    error.value = null

    try {
      // Clean up previous composite
      cleanup()

      const result = generateComposite(cards, options)
      composite.value = result.composite
      layout.value = result.layout
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to generate composite'
      console.error('Error generating composite:', err)
    } finally {
      isGenerating.value = false
    }
  }

  function download(filename: string = 'composite.png') {
    if (!composite.value) {
      error.value = 'No composite to download'
      return
    }

    try {
      // Create canvas and convert to image
      const canvas = document.createElement('canvas')
      canvas.width = composite.value.cols
      canvas.height = composite.value.rows
      cv.imshow(canvas, composite.value)

      // Trigger download
      canvas.toBlob((blob) => {
        if (!blob) {
          error.value = 'Failed to create image blob'
          return
        }

        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = filename
        link.click()
        URL.revokeObjectURL(url)
      })
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to download composite'
      console.error('Error downloading composite:', err)
    }
  }

  function cleanup() {
    if (composite.value) {
      composite.value.delete()
      composite.value = null
    }
    layout.value = null
    error.value = null
  }

  // Auto cleanup on unmount
  onUnmounted(() => {
    cleanup()
  })

  return {
    composite,
    layout,
    isGenerating,
    error,
    hasComposite,
    generate,
    download,
    cleanup
  }
}
