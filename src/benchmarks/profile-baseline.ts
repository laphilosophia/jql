import { readFileSync } from 'fs'
import { query } from '../runtime/index'

/**
 * V8 Profiling Benchmark
 *
 * Run with: node --prof --prof-process dist/benchmarks/profile-baseline.js
 *
 * This will generate:
 * - isolate-*.log (raw profile data)
 * - processed-*.txt (human-readable analysis)
 */

async function profileBaseline() {
  console.log('='.repeat(70))
  console.log('V8 Profiling Benchmark')
  console.log('='.repeat(70))

  const file = 'data/1gb_5lvl_nested_formatted.json'
  const buffer = readFileSync(file)

  console.log(`\nFile: ${file}`)
  console.log(`Size: ${(buffer.length / 1024 / 1024).toFixed(2)} MB`)

  // Warm-up (let V8 optimize)
  console.log('\nWarming up...')
  await query(buffer.subarray(0, 1024 * 1024), '{ employee { id, name } }')

  // Profile run
  console.log('Profiling...')
  const start = performance.now()

  await query(buffer, '{ employee { id, name } }', {
    sink: {
      onMatch: () => {
        // Collect results
      },
    },
  })

  const duration = performance.now() - start
  const throughput = (buffer.length * 8) / (duration * 1000)

  console.log(`\nDuration: ${(duration / 1000).toFixed(2)}s`)
  console.log(`Throughput: ${throughput.toFixed(2)} Mbps`)
  console.log('\nProfile data saved to isolate-*.log')
  console.log('Process with: node --prof-process isolate-*.log > profile.txt')
}

profileBaseline().catch(console.error)
