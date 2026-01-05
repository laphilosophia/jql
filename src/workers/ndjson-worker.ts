/**
 * NDJSON Worker - Processes single NDJSON lines in parallel
 *
 * Worker contract:
 * - Receives: { id, line, query }
 * - Returns: { id, result, error? }
 *
 * Worker does NOT:
 * - See the stream
 * - Know about backpressure
 * - Handle ordering
 */

import { Engine } from '../core/engine'
import { JQLParser } from '../core/parser'

interface WorkerMessage {
  id: number
  line: Uint8Array
  query: string
  emitMode?: 'object' | 'raw'
}

interface WorkerResponse {
  id: number
  result?: any
  raw?: Uint8Array
  error?: string
}

self.onmessage = (e: MessageEvent<WorkerMessage>) => {
  const { id, line, query, emitMode = 'object' } = e.data

  try {
    // Parse query
    const parser = new JQLParser(query)
    const map = parser.parse()

    // Create engine
    let result: any
    let raw: Uint8Array | undefined

    const engine = new Engine(map, {
      emitMode,
      sink:
        emitMode === 'raw'
          ? {
              onRawMatch: (chunk) => {
                raw = chunk
              },
            }
          : {
              onMatch: (data) => {
                result = data
              },
            },
    })

    // Execute
    engine.execute(line)

    // Send result
    const response: WorkerResponse = {
      id,
      result: emitMode === 'object' ? result : undefined,
      raw: emitMode === 'raw' ? raw : undefined,
    }

    // Transfer raw buffer if present
    if (raw && raw.buffer) {
      self.postMessage(response, { transfer: [raw.buffer] })
    } else {
      self.postMessage(response)
    }
  } catch (error) {
    self.postMessage({
      id,
      error: error instanceof Error ? error.message : String(error),
    })
  }
}
