import { ref, watch, type Ref } from 'vue'
import { onUnmounted } from 'vue'
import {
  detectCards,
  cleanupDetectedCards,
  type CardDetectionResult,
  type CardDetectionOptions
} from '@/lib/cardDetector'
import { useLocalStorage } from './useLocalStorage'

export function useCardDetector(
  preprocessedMat: Ref<any>,
  originalMat: Ref<any>
) {
  const detectionResult = ref<CardDetectionResult | null>(null)
  const isDetecting = ref(false)
  const error = ref<string | null>(null)

  // Persist detection options to localStorage
  const detectionOptions = useLocalStorage<CardDetectionOptions>('detection-options', {
    minAreaRatio: 0.01,
    maxAreaRatio: 0.5,
    minAspectRatio: 1.2,
    maxAspectRatio: 1.8,
    minSolidity: 0.85
  })

  // Auto-detect when preprocessed mat or options change
  watch(
    [preprocessedMat, detectionOptions],
    () => {
      detectCardsNow()
    },
    { deep: true }
  )

  function detectCardsNow() {
    if (!preprocessedMat.value || !originalMat.value) {
      detectionResult.value = null
      return
    }

    isDetecting.value = true
    error.value = null

    try {
      detectionResult.value = detectCards(
        preprocessedMat.value,
        originalMat.value,
        detectionOptions.value
      )
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to detect cards'
      console.error('Error detecting cards:', err)
      detectionResult.value = null
    } finally {
      isDetecting.value = false
    }
  }

  function cleanup() {
    if (detectionResult.value) {
      cleanupDetectedCards(detectionResult.value.cards)
    }
    detectionResult.value = null
    error.value = null
  }

  // Auto cleanup on unmount
  onUnmounted(() => {
    cleanup()
  })

  return {
    detectionResult,
    detectionOptions,
    isDetecting,
    error,
    detectCardsNow,
    cleanup
  }
}
