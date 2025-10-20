import { ref, computed } from 'vue'
import { onUnmounted } from 'vue'
import {
  extractAllCards,
  downloadCard,
  downloadAllCardsAsZip,
  cleanupExtractedCards,
  type ExtractedCard,
  type CardExtractionOptions
} from '@/lib/cardExtractor'
import type { DetectedCard } from '@/lib/cardDetector'

export function useCardExtractor() {
  const extractedCards = ref<ExtractedCard[]>([])
  const isExtracting = ref(false)
  const error = ref<string | null>(null)

  const extractionOptions = ref<CardExtractionOptions>({
    outputWidth: 750,
    outputHeight: 1050
  })

  const cardCount = computed(() => extractedCards.value.length)
  const hasCards = computed(() => cardCount.value > 0)

  async function extractCards(
    originalMat: any,
    detectedCards: DetectedCard[]
  ) {
    if (!originalMat || !detectedCards || detectedCards.length === 0) {
      return
    }

    isExtracting.value = true
    error.value = null

    try {
      // Clean up previous cards
      cleanup()

      extractedCards.value = extractAllCards(
        originalMat,
        detectedCards,
        extractionOptions.value
      )
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to extract cards'
      console.error('Error extracting cards:', err)
    } finally {
      isExtracting.value = false
    }
  }

  async function handleDownloadCard(card: ExtractedCard) {
    try {
      downloadCard(card)
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to download card'
      console.error('Error downloading card:', err)
    }
  }

  async function handleDownloadAll() {
    if (extractedCards.value.length === 0) {
      error.value = 'No cards to download'
      return
    }

    try {
      await downloadAllCardsAsZip(extractedCards.value)
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to download cards'
      console.error('Error downloading all cards:', err)
    }
  }

  function cleanup() {
    if (extractedCards.value.length > 0) {
      cleanupExtractedCards(extractedCards.value)
      extractedCards.value = []
    }
    error.value = null
  }

  // Auto cleanup on unmount
  onUnmounted(() => {
    cleanup()
  })

  return {
    extractedCards,
    extractionOptions,
    isExtracting,
    error,
    cardCount,
    hasCards,
    extractCards,
    downloadCard: handleDownloadCard,
    downloadAll: handleDownloadAll,
    cleanup
  }
}
