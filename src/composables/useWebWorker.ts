import { ref, onUnmounted } from 'vue'
import { useThrottleFn } from '@vueuse/core'

export interface WorkerOptions {
  /**
   * Maximum number of concurrent workers
   * Default: navigator.hardwareConcurrency or 4
   */
  maxWorkers?: number

  /**
   * Throttle progress updates (ms)
   * Default: 100
   */
  progressThrottle?: number
}

export interface WorkerTask<T = any, R = any> {
  id: string | number
  data: T
  resolve: (value: R) => void
  reject: (error: Error) => void
}

export function useWebWorker<T = any, R = any>(
  workerFactory: () => Worker,
  options: WorkerOptions = {}
) {
  const {
    maxWorkers = navigator.hardwareConcurrency || 4,
    progressThrottle = 100
  } = options

  const workers = ref<Worker[]>([])
  const taskQueue = ref<WorkerTask<T, R>[]>([])
  const activeTasks = ref(0)
  const totalTasks = ref(0)
  const completedTasks = ref(0)
  const failedTasks = ref(0)
  const isProcessing = ref(false)
  const currentProgress = ref<Map<string | number, number>>(new Map())

  // Progress callback
  let onProgressCallback: ((progress: number, taskId: string | number) => void) | null = null

  // Throttled progress update
  const updateProgress = useThrottleFn((taskId: string | number, progress: number) => {
    currentProgress.value.set(taskId, progress)
    if (onProgressCallback) {
      const totalProgress = Array.from(currentProgress.value.values())
        .reduce((sum, p) => sum + p, 0) / totalTasks.value
      onProgressCallback(totalProgress, taskId)
    }
  }, progressThrottle)

  function initWorkers() {
    for (let i = 0; i < maxWorkers; i++) {
      const worker = workerFactory()
      workers.value.push(worker)
    }
  }

  function getFreeWorker(): Worker | null {
    // Simple round-robin assignment
    // In a more advanced implementation, track worker availability
    return workers.value.length > 0 ? workers.value[activeTasks.value % workers.value.length] : null
  }

  function executeTask(task: WorkerTask<T, R>) {
    const worker = getFreeWorker()
    if (!worker) {
      console.error('No workers available')
      task.reject(new Error('No workers available'))
      return
    }

    activeTasks.value++
    currentProgress.value.set(task.id, 0)

    const handleMessage = (event: MessageEvent) => {
      const { type, ...data } = event.data

      if (type === 'progress') {
        updateProgress(task.id, data.progress || 0)
      } else if (type === 'complete') {
        currentProgress.value.delete(task.id)
        completedTasks.value++
        activeTasks.value--
        task.resolve(data as R)
        processNextTask()

        // Clean up listener
        worker.removeEventListener('message', handleMessage)
        worker.removeEventListener('error', handleError)
      } else if (type === 'error') {
        currentProgress.value.delete(task.id)
        failedTasks.value++
        activeTasks.value--
        task.reject(new Error(data.error || 'Worker error'))
        processNextTask()

        // Clean up listener
        worker.removeEventListener('message', handleMessage)
        worker.removeEventListener('error', handleError)
      }
    }

    const handleError = (error: ErrorEvent) => {
      currentProgress.value.delete(task.id)
      failedTasks.value++
      activeTasks.value--
      task.reject(new Error(error.message || 'Worker error'))
      processNextTask()

      // Clean up listener
      worker.removeEventListener('message', handleMessage)
      worker.removeEventListener('error', handleError)
    }

    worker.addEventListener('message', handleMessage)
    worker.addEventListener('error', handleError)

    // Send task to worker
    worker.postMessage(task.data)
  }

  function processNextTask() {
    if (taskQueue.value.length > 0 && activeTasks.value < maxWorkers) {
      const task = taskQueue.value.shift()
      if (task) {
        executeTask(task)
      }
    }

    if (taskQueue.value.length === 0 && activeTasks.value === 0) {
      isProcessing.value = false
    }
  }

  function runTask(id: string | number, data: T): Promise<R> {
    return new Promise((resolve, reject) => {
      const task: WorkerTask<T, R> = {
        id,
        data,
        resolve,
        reject
      }

      taskQueue.value.push(task)
      totalTasks.value++

      if (!isProcessing.value) {
        isProcessing.value = true
        if (workers.value.length === 0) {
          initWorkers()
        }
      }

      processNextTask()
    })
  }

  function runBatch(tasks: Array<{ id: string | number; data: T }>): Promise<R[]> {
    const promises = tasks.map(task => runTask(task.id, task.data))
    return Promise.all(promises)
  }

  function onProgress(callback: (progress: number, taskId: string | number) => void) {
    onProgressCallback = callback
  }

  function reset() {
    taskQueue.value = []
    activeTasks.value = 0
    totalTasks.value = 0
    completedTasks.value = 0
    failedTasks.value = 0
    isProcessing.value = false
    currentProgress.value.clear()
  }

  function terminate() {
    workers.value.forEach(worker => worker.terminate())
    workers.value = []
    reset()
  }

  // Auto cleanup on unmount
  onUnmounted(() => {
    terminate()
  })

  return {
    isProcessing,
    activeTasks,
    totalTasks,
    completedTasks,
    failedTasks,
    currentProgress,
    runTask,
    runBatch,
    onProgress,
    reset,
    terminate
  }
}
