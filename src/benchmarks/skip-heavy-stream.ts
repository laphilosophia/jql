import { readFileSync } from 'fs'
import { query } from '../runtime/index'

/**
 * Skip-Heavy Benchmark
 * Compares skip-heavy vs full selection to measure skip optimization
 */

async function skipHeavyBenchmark() {
  console.log('='.repeat(70))
  console.log('Skip-Heavy vs Full Selection Benchmark')
  console.log('='.repeat(70))

  const file = 'data/1gb_5lvl_nested_formatted.json'
  const buffer = readFileSync(file)

  console.log(`\nFile: ${file}`)
  console.log(`Size: ${(buffer.length / 1024 / 1024).toFixed(2)} MB`)

  // Warmup
  console.log('\nWarming up...')
  await query(
    buffer.subarray(0, 1024 * 1024),
    '{ employee { id, name, department, salary, hireDate, isActive, skills, projects, reviews, contact, address, emergencyContact, benefits, performance } }'
  )

  // Full selection
  console.log('\nFull Selection (all fields)...')
  const fullStart = performance.now()
  await query(
    buffer,
    '{ employee { id, name, department, salary, hireDate, isActive, skills, projects, reviews, contact, address, emergencyContact, benefits, performance } }',
    {
      sink: { onMatch: () => {} },
    }
  )
  const fullDuration = performance.now() - fullStart
  const fullThroughput = (buffer.length * 8) / (fullDuration * 1000)

  // Skip-heavy selection (only id)
  console.log('Skip-Heavy Selection (id only)...')
  const skipStart = performance.now()
  await query(buffer, '{ employee { id } }', {
    sink: { onMatch: () => {} },
  })
  const skipDuration = performance.now() - skipStart
  const skipThroughput = (buffer.length * 8) / (skipDuration * 1000)

  console.log('\n' + '='.repeat(70))
  console.log('RESULTS')
  console.log('='.repeat(70))
  console.log(
    `Full Selection:  ${(fullDuration / 1000).toFixed(2)}s @ ${fullThroughput.toFixed(2)} Mbps`
  )
  console.log(
    `Skip-Heavy:      ${(skipDuration / 1000).toFixed(2)}s @ ${skipThroughput.toFixed(2)} Mbps`
  )
  console.log(`Speedup:         ${((fullDuration / skipDuration - 1) * 100).toFixed(1)}%`)
}

skipHeavyBenchmark().catch(console.error)
