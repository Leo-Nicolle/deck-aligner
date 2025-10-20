import { ref, watch, onUnmounted, type Ref } from 'vue'
import { useElementSize, useThrottleFn } from '@vueuse/core'
import cv from 'opencv-ts'

export interface CanvasRendererOptions {
  /**
   * Enable auto-resize based on container element
   * Default: false
   */
  autoResize?: boolean

  /**
   * Throttle render calls (ms)
   * Default: 16 (60fps)
   */
  renderThrottle?: number

  /**
   * Enable scaling to fit canvas
   * Default: true
   */
  scaleToFit?: boolean

  /**
   * Maintain aspect ratio when scaling
   * Default: true
   */
  maintainAspectRatio?: boolean

  /**
   * Background color for letterboxing
   * Default: '#000000'
   */
  backgroundColor?: string
}

export function useCanvasRenderer(
  canvasRef: Ref<HTMLCanvasElement | undefined>,
  matRef: Ref<cv.Mat | null>,
  options: CanvasRendererOptions = {}
) {
  const {
    autoResize = false,
    renderThrottle = 16,
    scaleToFit = true,
    maintainAspectRatio = true,
    backgroundColor = '#000000'
  } = options

  const isRendering = ref(false)
  const lastRenderTime = ref<number>(0)
  const renderCount = ref(0)

  // Get element size if auto-resize is enabled
  const { width: containerWidth, height: containerHeight } = autoResize
    ? useElementSize(canvasRef)
    : { width: ref(0), height: ref(0) }

  function renderToCanvas() {
    if (!canvasRef.value || !matRef.value) return
    if (!matRef.value.cols || !matRef.value.rows) return

    isRendering.value = true
    const startTime = performance.now()

    try {
      const canvas = canvasRef.value
      const mat = matRef.value

      if (scaleToFit && autoResize && containerWidth.value && containerHeight.value) {
        // Calculate scaled dimensions
        let targetWidth = containerWidth.value
        let targetHeight = containerHeight.value

        if (maintainAspectRatio) {
          const aspectRatio = mat.cols / mat.rows
          const containerAspect = containerWidth.value / containerHeight.value

          if (aspectRatio > containerAspect) {
            // Image is wider than container
            targetHeight = targetWidth / aspectRatio
          } else {
            // Image is taller than container
            targetWidth = targetHeight * aspectRatio
          }
        }

        // Set canvas size
        canvas.width = Math.floor(targetWidth)
        canvas.height = Math.floor(targetHeight)

        // Scale mat to fit
        const scaledMat = new cv.Mat()
        const dsize = new cv.Size(canvas.width, canvas.height)
        cv.resize(mat, scaledMat, dsize, 0, 0, cv.INTER_LINEAR)

        // Render scaled mat
        cv.imshow(canvas, scaledMat)
        scaledMat.delete()
      } else {
        // Render at original size
        canvas.width = mat.cols
        canvas.height = mat.rows
        cv.imshow(canvas, mat)
      }

      // Fill background if canvas is larger than image
      if (backgroundColor && maintainAspectRatio) {
        const ctx = canvas.getContext('2d')
        if (ctx) {
          ctx.globalCompositeOperation = 'destination-over'
          ctx.fillStyle = backgroundColor
          ctx.fillRect(0, 0, canvas.width, canvas.height)
          ctx.globalCompositeOperation = 'source-over'
        }
      }

      renderCount.value++
      lastRenderTime.value = performance.now() - startTime
    } catch (error) {
      console.error('Canvas rendering error:', error)
    } finally {
      isRendering.value = false
    }
  }

  // Throttled render function
  const throttledRender = useThrottleFn(renderToCanvas, renderThrottle)

  // Watch mat changes and render
  const stopWatch = watch(matRef, () => {
    throttledRender()
  }, { immediate: true })

  // Watch container size changes if auto-resize is enabled
  let stopSizeWatch: (() => void) | null = null
  if (autoResize) {
    stopSizeWatch = watch([containerWidth, containerHeight], () => {
      throttledRender()
    })
  }

  function clear() {
    if (!canvasRef.value) return

    const canvas = canvasRef.value
    const ctx = canvas.getContext('2d')
    if (ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
    }
  }

  function exportToDataURL(format: 'image/png' | 'image/jpeg' = 'image/png', quality = 0.92): string | null {
    if (!canvasRef.value) return null
    return canvasRef.value.toDataURL(format, quality)
  }

  function exportToBlob(format: 'image/png' | 'image/jpeg' = 'image/png', quality = 0.92): Promise<Blob | null> {
    return new Promise((resolve) => {
      if (!canvasRef.value) {
        resolve(null)
        return
      }

      canvasRef.value.toBlob(
        (blob) => resolve(blob),
        format,
        quality
      )
    })
  }

  function getImageData(): ImageData | null {
    if (!canvasRef.value) return null

    const ctx = canvasRef.value.getContext('2d')
    if (!ctx) return null

    return ctx.getImageData(0, 0, canvasRef.value.width, canvasRef.value.height)
  }

  // Cleanup on unmount
  onUnmounted(() => {
    stopWatch()
    stopSizeWatch?.()
    clear()
  })

  return {
    isRendering,
    lastRenderTime,
    renderCount,
    render: renderToCanvas,
    renderThrottled: throttledRender,
    clear,
    exportToDataURL,
    exportToBlob,
    getImageData
  }
}
