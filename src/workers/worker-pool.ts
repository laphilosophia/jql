/**
 * Worker Pool - Manages bounded worker threads
 */

export interface WorkerPoolOptions {
  size: number
  scriptPath: string
}

export class WorkerPool {
  private workers: Worker[] = []
  private availableWorkers: Worker[] = []
  private pendingTasks: Array<{
    data: any
    resolve: (value: any) => void
    reject: (error: Error) => void
  }> = []

  constructor(private options: WorkerPoolOptions) {
    // Create workers
    for (let i = 0; i < options.size; i++) {
      const worker = new Worker(new URL(options.scriptPath, import.meta.url), {
        type: 'module',
      })
      this.workers.push(worker)
      this.availableWorkers.push(worker)
    }
  }

  async execute<T = any>(data: any): Promise<T> {
    return new Promise((resolve, reject) => {
      const worker = this.availableWorkers.pop()

      if (worker) {
        // Worker available - execute immediately
        this.runTask(worker, data, resolve, reject)
      } else {
        // No workers available - queue task
        this.pendingTasks.push({ data, resolve, reject })
      }
    })
  }

  private runTask(
    worker: Worker,
    data: any,
    resolve: (value: any) => void,
    reject: (error: Error) => void
  ) {
    const onMessage = (e: MessageEvent) => {
      worker.removeEventListener('message', onMessage)
      worker.removeEventListener('error', onError)

      // Return worker to pool
      this.returnWorker(worker)

      // Resolve with result
      if (e.data.error) {
        reject(new Error(e.data.error))
      } else {
        resolve(e.data)
      }
    }

    const onError = (error: ErrorEvent) => {
      worker.removeEventListener('message', onMessage)
      worker.removeEventListener('error', onError)

      // Return worker to pool
      this.returnWorker(worker)

      reject(new Error(error.message))
    }

    worker.addEventListener('message', onMessage)
    worker.addEventListener('error', onError)
    worker.postMessage(data)
  }

  private returnWorker(worker: Worker) {
    // Check if there are pending tasks
    const pending = this.pendingTasks.shift()

    if (pending) {
      // Execute pending task
      this.runTask(worker, pending.data, pending.resolve, pending.reject)
    } else {
      // Return to available pool
      this.availableWorkers.push(worker)
    }
  }

  async terminate() {
    // Wait for all pending tasks
    await Promise.all(
      this.pendingTasks.map(
        (task) =>
          new Promise((resolve) => {
            task.reject(new Error('Worker pool terminated'))
            resolve(undefined)
          })
      )
    )

    // Terminate all workers
    for (const worker of this.workers) {
      worker.terminate()
    }

    this.workers = []
    this.availableWorkers = []
    this.pendingTasks = []
  }

  get queueSize(): number {
    return this.pendingTasks.length
  }

  get activeWorkers(): number {
    return this.options.size - this.availableWorkers.length
  }
}
