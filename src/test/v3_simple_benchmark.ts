import { readFileSync } from 'fs'
import { query } from '../runtime/index'

async function simpleBenchmark() {
  console.log('Simple Buffer-Based Benchmark (No Streaming)')
  console.log('='.repeat(60))

  const buffer = readFileSync('data/1GB.json')
  console.log(`File size: ${(buffer.length / 1024 / 1024).toFixed(2)} MB`)
  console.log('')

  // Warmup
  console.log('Warmup run...')
  await query(buffer, '{ id }')

  // Actual benchmark - 3 runs
  const times: number[] = []
  for (let i = 0; i < 3; i++) {
    console.log(`Run ${i + 1}/3...`)
    const start = performance.now()
    await query(buffer, '{ id }')
    const duration = performance.now() - start
    times.push(duration)
    console.log(`  ${(duration / 1000).toFixed(2)}s`)
  }

  const median = times.sort((a, b) => a - b)[1]
  const throughput = (buffer.length * 8) / (median * 1000)

  console.log('')
  console.log('Results:')
  console.log(`  Median: ${(median / 1000).toFixed(2)}s`)
  console.log(`  Throughput: ${throughput.toFixed(2)} Mbps`)
  console.log(`  Baseline: 4.38s`)

  const regression = ((median / 1000 - 4.38) / 4.38) * 100
  if (regression > 5) {
    console.log(`  ⚠️  REGRESSION: +${regression.toFixed(1)}%`)
  } else if (regression > 0) {
    console.log(`  ✓  Variance: +${regression.toFixed(1)}% (acceptable)`)
  } else {
    console.log(`  ✓  IMPROVED: ${Math.abs(regression).toFixed(1)}% faster`)
  }
}

simpleBenchmark().catch(console.error)
