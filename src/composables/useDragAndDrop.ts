import { ref, computed, onMounted, onUnmounted } from 'vue'

export interface DragOptions {
  /**
   * CSS selector or HTMLElement for the draggable container
   */
  container: string | HTMLElement

  /**
   * CSS selector for draggable items within the container
   */
  itemSelector: string

  /**
   * CSS class to apply to dragged element
   * Default: 'dragging'
   */
  draggingClass?: string

  /**
   * CSS class to apply to drop target
   * Default: 'drag-over'
   */
  dragOverClass?: string

  /**
   * Enable/disable drag and drop
   * Default: true
   */
  enabled?: boolean

  /**
   * Callback when item is reordered
   */
  onReorder?: (fromIndex: number, toIndex: number) => void
}

export function useDragAndDrop(options: DragOptions) {
  const {
    container,
    itemSelector,
    draggingClass = 'dragging',
    dragOverClass = 'drag-over',
    enabled = true,
    onReorder
  } = options

  const isDragging = ref(false)
  const draggedIndex = ref<number | null>(null)
  const dropTargetIndex = ref<number | null>(null)

  let containerElement: HTMLElement | null = null
  let draggedElement: HTMLElement | null = null

  function getContainerElement(): HTMLElement | null {
    if (typeof container === 'string') {
      return document.querySelector(container)
    }
    return container
  }

  function getItemIndex(element: HTMLElement): number {
    const items = containerElement?.querySelectorAll(itemSelector)
    if (!items) return -1
    return Array.from(items).indexOf(element)
  }

  function handleDragStart(event: DragEvent) {
    if (!enabled) return

    const target = event.target as HTMLElement
    if (!target.matches(itemSelector)) return

    draggedElement = target
    draggedIndex.value = getItemIndex(target)
    isDragging.value = true

    target.classList.add(draggingClass)

    if (event.dataTransfer) {
      event.dataTransfer.effectAllowed = 'move'
      event.dataTransfer.setData('text/html', target.innerHTML)
    }
  }

  function handleDragEnd(event: DragEvent) {
    if (!enabled) return

    const target = event.target as HTMLElement
    target.classList.remove(draggingClass)

    // Remove drag-over class from all items
    const items = containerElement?.querySelectorAll(itemSelector)
    items?.forEach(item => item.classList.remove(dragOverClass))

    isDragging.value = false
    draggedElement = null
    draggedIndex.value = null
    dropTargetIndex.value = null
  }

  function handleDragOver(event: DragEvent) {
    if (!enabled) return
    event.preventDefault()

    const target = event.target as HTMLElement
    const item = target.closest(itemSelector) as HTMLElement
    if (!item || item === draggedElement) return

    if (event.dataTransfer) {
      event.dataTransfer.dropEffect = 'move'
    }

    // Remove drag-over class from all items
    const items = containerElement?.querySelectorAll(itemSelector)
    items?.forEach(i => i.classList.remove(dragOverClass))

    // Add drag-over class to current target
    item.classList.add(dragOverClass)
    dropTargetIndex.value = getItemIndex(item)
  }

  function handleDragEnter(event: DragEvent) {
    if (!enabled) return

    const target = event.target as HTMLElement
    const item = target.closest(itemSelector) as HTMLElement
    if (!item || item === draggedElement) return

    item.classList.add(dragOverClass)
  }

  function handleDragLeave(event: DragEvent) {
    if (!enabled) return

    const target = event.target as HTMLElement
    const item = target.closest(itemSelector) as HTMLElement
    if (!item) return

    item.classList.remove(dragOverClass)
  }

  function handleDrop(event: DragEvent) {
    if (!enabled) return
    event.preventDefault()
    event.stopPropagation()

    const target = event.target as HTMLElement
    const item = target.closest(itemSelector) as HTMLElement
    if (!item || !draggedElement || item === draggedElement) return

    const fromIndex = draggedIndex.value
    const toIndex = getItemIndex(item)

    if (fromIndex !== null && fromIndex !== toIndex) {
      onReorder?.(fromIndex, toIndex)
    }

    item.classList.remove(dragOverClass)
  }

  function attachListeners() {
    containerElement = getContainerElement()
    if (!containerElement) {
      console.warn('Drag and drop container not found')
      return
    }

    containerElement.addEventListener('dragstart', handleDragStart as EventListener)
    containerElement.addEventListener('dragend', handleDragEnd as EventListener)
    containerElement.addEventListener('dragover', handleDragOver as EventListener)
    containerElement.addEventListener('dragenter', handleDragEnter as EventListener)
    containerElement.addEventListener('dragleave', handleDragLeave as EventListener)
    containerElement.addEventListener('drop', handleDrop as EventListener)

    // Make items draggable
    const items = containerElement.querySelectorAll(itemSelector)
    items.forEach(item => {
      (item as HTMLElement).setAttribute('draggable', 'true')
    })
  }

  function detachListeners() {
    if (!containerElement) return

    containerElement.removeEventListener('dragstart', handleDragStart as EventListener)
    containerElement.removeEventListener('dragend', handleDragEnd as EventListener)
    containerElement.removeEventListener('dragover', handleDragOver as EventListener)
    containerElement.removeEventListener('dragenter', handleDragEnter as EventListener)
    containerElement.removeEventListener('dragleave', handleDragLeave as EventListener)
    containerElement.removeEventListener('drop', handleDrop as EventListener)

    // Remove draggable attribute
    const items = containerElement.querySelectorAll(itemSelector)
    items.forEach(item => {
      (item as HTMLElement).removeAttribute('draggable')
      item.classList.remove(draggingClass, dragOverClass)
    })
  }

  function refresh() {
    detachListeners()
    attachListeners()
  }

  onMounted(() => {
    if (enabled) {
      attachListeners()
    }
  })

  onUnmounted(() => {
    detachListeners()
  })

  return {
    isDragging: computed(() => isDragging.value),
    draggedIndex: computed(() => draggedIndex.value),
    dropTargetIndex: computed(() => dropTargetIndex.value),
    refresh,
    enable: attachListeners,
    disable: detachListeners
  }
}
