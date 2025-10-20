import { ref, computed } from 'vue'
import { onUnmounted } from 'vue'
import {
  BatchProcessor,
  type ProcessedImage,
  type BatchProcessingOptions
} from '@/lib/batchProcessor'

export function useBatchProcessor() {
  const processor = new BatchProcessor()

  const images = ref<ProcessedImage[]>([])
  const isProcessing = ref(false)
  const currentIndex = ref(0)
  const error = ref<string | null>(null)

  const totalImages = computed(() => images.value.length)
  const completedImages = computed(() =>
    images.value.filter(img => img.status === 'completed').length
  )
  const failedImages = computed(() =>
    images.value.filter(img => img.status === 'error').length
  )
  const totalCards = computed(() =>
    images.value.reduce((sum, img) => sum + (img.extractedCards?.length || 0), 0)
  )
  const isComplete = computed(() =>
    !isProcessing.value && completedImages.value + failedImages.value === totalImages.value
  )

  async function processAll(
    files: File[],
    options: BatchProcessingOptions = {}
  ) {
    isProcessing.value = true
    currentIndex.value = 0
    error.value = null

    try {
      // Add images to processor
      processor.addImages(files)
      images.value = processor.getImages()

      // Process with callbacks
      await processor.processAll(files, {
        ...options,
        onProgress: (current, total, imageName) => {
          currentIndex.value = current
          if (options.onProgress) {
            options.onProgress(current, total, imageName)
          }
        },
        onImageComplete: (processedImage) => {
          // Update images ref
          images.value = processor.getImages()
          if (options.onImageComplete) {
            options.onImageComplete(processedImage)
          }
        },
        onError: (imageName, err) => {
          console.error(`Error processing ${imageName}:`, err)
          if (options.onError) {
            options.onError(imageName, err)
          }
        }
      })
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Batch processing failed'
      console.error('Batch processing error:', err)
    } finally {
      isProcessing.value = false
    }
  }

  function getStats() {
    return processor.getStats()
  }

  function getImage(id: string) {
    return images.value.find(img => img.id === id)
  }

  function cleanup() {
    processor.clear()
    images.value = []
    currentIndex.value = 0
    error.value = null
    isProcessing.value = false
  }

  // Auto cleanup on unmount
  onUnmounted(() => {
    cleanup()
  })

  return {
    images,
    isProcessing,
    currentIndex,
    error,
    totalImages,
    completedImages,
    failedImages,
    totalCards,
    isComplete,
    processAll,
    getStats,
    getImage,
    cleanup
  }
}
