import { describe, expect, it } from 'vitest'
import { OutputSink } from '../core/sink'
import { query } from '../runtime/index'

describe('Async Sink', () => {
  it('should handle async onMatch callback', async () => {
    const data = JSON.stringify({ id: 1, name: 'Alice' })
    const buffer = new TextEncoder().encode(data)

    const matches: any[] = []
    let asyncCallCompleted = false

    const sink: OutputSink = {
      async onMatch(data) {
        await new Promise((resolve) => setTimeout(resolve, 10))
        matches.push(data)
        asyncCallCompleted = true
      },
    }

    await query(buffer, '{ id, name }', { sink })

    expect(matches.length).toBeGreaterThan(0)
    expect(asyncCallCompleted).toBe(true)
  })

  it('should handle async onRawMatch callback', async () => {
    const data = JSON.stringify({ id: 1, name: 'Alice' })
    const buffer = new TextEncoder().encode(data)

    const rawChunks: Uint8Array[] = []
    let asyncCallCompleted = false

    const sink: OutputSink = {
      async onRawMatch(chunk) {
        await new Promise((resolve) => setTimeout(resolve, 10))
        rawChunks.push(chunk)
        asyncCallCompleted = true
      },
    }

    await query(buffer, '{ id, name }', { sink, emitMode: 'raw' })

    expect(rawChunks.length).toBeGreaterThan(0)
    expect(asyncCallCompleted).toBe(true)
  })

  it('should wait for all async operations before returning', async () => {
    const data = JSON.stringify([{ id: 1 }, { id: 2 }, { id: 3 }])
    const buffer = new TextEncoder().encode(data)

    const processingOrder: number[] = []

    const sink: OutputSink = {
      async onMatch(data) {
        const delay = Math.random() * 20
        await new Promise((resolve) => setTimeout(resolve, delay))
        processingOrder.push(data.id)
      },
    }

    await query(buffer, '{ id }', { sink })

    expect(processingOrder).toHaveLength(3)
    expect(processingOrder).toContain(1)
    expect(processingOrder).toContain(2)
    expect(processingOrder).toContain(3)
  })

  it('should call onDrain after all processing', async () => {
    const data = JSON.stringify({ id: 1, name: 'Alice' })
    const buffer = new TextEncoder().encode(data)

    let drainCalled = false
    let matchCalled = false

    const sink: OutputSink = {
      async onMatch(data) {
        await new Promise((resolve) => setTimeout(resolve, 10))
        matchCalled = true
      },
      async onDrain() {
        expect(matchCalled).toBe(true)
        drainCalled = true
      },
    }

    await query(buffer, '{ id, name }', { sink })

    expect(drainCalled).toBe(true)
  })

  it('should collect all async promises', async () => {
    const items = Array.from({ length: 100 }, (_, i) => ({ id: i }))
    const data = JSON.stringify(items)
    const buffer = new TextEncoder().encode(data)

    const processed: number[] = []

    const sink: OutputSink = {
      async onMatch(data) {
        await new Promise((resolve) => setTimeout(resolve, 5))
        processed.push(data.id)
      },
    }

    await query(buffer, '{ id }', { sink })

    expect(processed).toHaveLength(100)
  })
})
