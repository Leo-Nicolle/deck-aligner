// Web Worker for image processing to avoid blocking the main thread
import cv from 'opencv-ts'
import {
  preprocessImage,
  detectCards,
  extractCards,
  type PreprocessingOptions,
  type CardDetectionOptions
} from '@/lib/imageProcessor'

// Worker message types
interface ProcessImageMessage {
  type: 'process'
  imageData: ImageData
  preprocessingOptions: PreprocessingOptions
  detectionOptions: CardDetectionOptions
  imageIndex: number
  imageName: string
}

interface WorkerResponse {
  type: 'progress' | 'complete' | 'error'
  imageIndex?: number
  imageName?: string
  cards?: any[]
  error?: string
  progress?: number
}

// Handle messages from main thread
self.onmessage = async (event: MessageEvent<ProcessImageMessage>) => {
  const { type, imageData, preprocessingOptions, detectionOptions, imageIndex, imageName } = event.data

  if (type === 'process') {
    try {
      // Post progress update
      postMessage({
        type: 'progress',
        imageIndex,
        imageName,
        progress: 0
      } as WorkerResponse)

      // Convert ImageData to cv.Mat
      const mat = cv.matFromImageData(imageData)

      // Preprocess image
      const preprocessed = preprocessImage(mat, preprocessingOptions)
      postMessage({
        type: 'progress',
        imageIndex,
        imageName,
        progress: 33
      } as WorkerResponse)

      // Detect cards
      const detected = detectCards(preprocessed.processed, mat, detectionOptions)
      postMessage({
        type: 'progress',
        imageIndex,
        imageName,
        progress: 66
      } as WorkerResponse)

      // Extract cards
      const cards = extractCards(mat, detected.cards, {
        outputWidth: 750,
        outputHeight: 1050,
        maintainAspectRatio: true
      })
      postMessage({
        type: 'progress',
        imageIndex,
        imageName,
        progress: 100
      } as WorkerResponse)

      // Clean up mats
      mat.delete()
      preprocessed.grayscale?.delete()
      preprocessed.blurred?.delete()
      preprocessed.binary?.delete()
      preprocessed.processed?.delete()

      // Post result
      postMessage({
        type: 'complete',
        imageIndex,
        imageName,
        cards: cards.map(card => ({
          // Convert cv.Mat to ImageData for transfer
          width: card.image.cols,
          height: card.image.rows,
          data: card.image.data
        }))
      } as WorkerResponse)
    } catch (error) {
      postMessage({
        type: 'error',
        imageIndex,
        imageName,
        error: error instanceof Error ? error.message : 'Unknown error'
      } as WorkerResponse)
    }
  }
}

export {}
