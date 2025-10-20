import { ref, computed } from 'vue'
import { onUnmounted } from 'vue'
import {
  CardManager,
  type ManagedCard
} from '@/lib/cardManager'
import type { ProcessedImage } from '@/lib/batchProcessor'

export function useCardManager() {
  const manager = new CardManager()

  const cards = ref<ManagedCard[]>([])
  const selectedIds = ref<Set<string>>(new Set())
  const discardedIds = ref<Set<string>>(new Set())

  const activeCards = computed(() =>
    cards.value.filter(c => !c.isDiscarded)
  )

  const selectedCards = computed(() =>
    cards.value.filter(c => c.isSelected)
  )

  const discardedCards = computed(() =>
    cards.value.filter(c => c.isDiscarded)
  )

  const stats = computed(() => ({
    total: cards.value.length,
    active: activeCards.value.length,
    selected: selectedCards.value.length,
    discarded: discardedCards.value.length
  }))

  const canUndo = computed(() => manager.canUndo())
  const canRedo = computed(() => manager.canRedo())
  const historyIndex = computed(() => manager.getHistoryIndex())
  const historyLength = computed(() => manager.getHistoryLength())

  function loadFromImages(images: ProcessedImage[]) {
    manager.loadFromImages(images)
    updateState()
  }

  function selectAll() {
    manager.selectAll()
    updateState()
  }

  function deselectAll() {
    manager.deselectAll()
    updateState()
  }

  function selectCards(cardIds: string[]) {
    manager.selectCards(cardIds)
    updateState()
  }

  function deselectCards(cardIds: string[]) {
    manager.deselectCards(cardIds)
    updateState()
  }

  function discardCards(cardIds: string[]) {
    manager.discardCards(cardIds)
    updateState()
  }

  function restoreCards(cardIds: string[]) {
    manager.restoreCards(cardIds)
    updateState()
  }

  function reorderCards(fromIndex: number, toIndex: number) {
    manager.reorderCards(fromIndex, toIndex)
    updateState()
  }

  function undo() {
    const success = manager.undo()
    if (success) {
      updateState()
    }
    return success
  }

  function redo() {
    const success = manager.redo()
    if (success) {
      updateState()
    }
    return success
  }

  function getCards(includeDiscarded = true) {
    return manager.getCards(includeDiscarded)
  }

  function getSelectedCards() {
    return manager.getSelectedCards()
  }

  function getStats() {
    return manager.getStats()
  }

  function updateState() {
    cards.value = manager.getCards(true)
    selectedIds.value = new Set(manager.getSelectedCards().map(c => c.globalId))
    discardedIds.value = new Set(cards.value.filter(c => c.isDiscarded).map(c => c.globalId))
  }

  function cleanup() {
    manager.cleanup()
    cards.value = []
    selectedIds.value.clear()
    discardedIds.value.clear()
  }

  // Auto cleanup on unmount
  onUnmounted(() => {
    cleanup()
  })

  return {
    cards,
    activeCards,
    selectedCards,
    discardedCards,
    stats,
    canUndo,
    canRedo,
    historyIndex,
    historyLength,
    loadFromImages,
    selectAll,
    deselectAll,
    selectCards,
    deselectCards,
    discardCards,
    restoreCards,
    reorderCards,
    undo,
    redo,
    getCards,
    getSelectedCards,
    getStats,
    cleanup
  }
}
