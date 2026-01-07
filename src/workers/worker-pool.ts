/**
 * Worker Pool - Manages bounded worker threads
 * Uses Node.js worker_threads for Node.js environments
 */

import { existsSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { Worker } from 'node:worker_threads'

export interface WorkerPoolOptions {
  size: number
  scriptPath: string
}

export class WorkerPool {
  private workers: Worker[] = []
  private availableWorkers: Worker[] = []
  private pendingTasks: {
    data: any
    resolve: (value: any) => void
    reject: (error: Error) => void
  }[] = []

  constructor(private options: WorkerPoolOptions) {
    // Resolve worker path based on environment
    const workerUrl = this.resolveWorkerPath(options.scriptPath)

    // Create workers
    for (let i = 0; i < options.size; i++) {
      const worker = new Worker(workerUrl)
      this.workers.push(worker)
      this.availableWorkers.push(worker)
    }
  }

  /**
   * Resolve worker path for both dev (.ts) and production (.js) environments
   */
  private resolveWorkerPath(scriptPath: string): URL | string {
    const currentDir = dirname(fileURLToPath(import.meta.url))

    // Try .js version first (production/CI)
    const jsPath = resolve(currentDir, scriptPath.replace(/\.ts$/, '.js'))
    if (existsSync(jsPath)) {
      return jsPath
    }

    // Fall back to .ts with tsx (development with vitest)
    // This works when vitest runs the tests
    return new URL(scriptPath, import.meta.url)
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
    const onMessage = (result: any) => {
      worker.off('message', onMessage)
      worker.off('error', onError)

      // Return worker to pool
      this.returnWorker(worker)

      // Resolve with result
      if (result.error) {
        reject(new Error(result.error))
      } else {
        resolve(result)
      }
    }

    const onError = (error: Error) => {
      worker.off('message', onMessage)
      worker.off('error', onError)

      // Return worker to pool
      this.returnWorker(worker)

      reject(error)
    }

    worker.on('message', onMessage)
    worker.on('error', onError)
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
      await worker.terminate()
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
