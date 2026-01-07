/**
 * Micro-benchmark: String cache impact
 *
 * Tests whether string caching provides real benefit vs. raw TextDecoder
 * Simulates realistic JSON workload with repeated keys
 */

const ITERATIONS = 500_000
const WARMUP = 50_000

// Realistic JSON keys (repeated frequently)
const COMMON_KEYS = [
  'id',
  'name',
  'email',
  'created_at',
  'updated_at',
  'user_id',
  'status',
  'type',
  'value',
  'description',
]

// Convert to Uint8Array
const KEY_BUFFERS = COMMON_KEYS.map((key) => new Uint8Array([...key].map((c) => c.charCodeAt(0))))

// Strategy 1: With cache (current implementation)
class CachedDecoder {
  private decoder = new TextDecoder()
  private cache = new Map<string, string>()

  decode(buffer: Uint8Array): string {
    const len = buffer.length
    if (len === 0) return ''

    if (len < 32) {
      let cacheKey = ''
      for (let i = 0; i < len; i++) {
        cacheKey += String.fromCharCode(buffer[i])
      }
      const cached = this.cache.get(cacheKey)
      if (cached !== undefined) return cached
      if (this.cache.size < 500) {
        this.cache.set(cacheKey, cacheKey)
      }
      return cacheKey
    }

    return this.decoder.decode(buffer)
  }
}

// Strategy 2: No cache, pure TextDecoder
class NoCacheDecoder {
  private decoder = new TextDecoder()

  decode(buffer: Uint8Array): string {
    if (buffer.length === 0) return ''
    return this.decoder.decode(buffer)
  }
}

// Strategy 3: Hybrid (TextDecoder + cache)
class HybridDecoder {
  private decoder = new TextDecoder()
  private cache = new Map<string, string>()

  decode(buffer: Uint8Array): string {
    const len = buffer.length
    if (len === 0) return ''

    // Always use TextDecoder, but cache result
    const str = this.decoder.decode(buffer)

    if (len < 32) {
      const cached = this.cache.get(str)
      if (cached !== undefined) return cached
      if (this.cache.size < 500) {
        this.cache.set(str, str)
      }
    }

    return str
  }
}

function benchmark(
  name: string,
  decoder: CachedDecoder | NoCacheDecoder | HybridDecoder,
  iterations: number
): number {
  const start = performance.now()

  for (let i = 0; i < iterations; i++) {
    // Simulate realistic workload: 80% cache hits, 20% misses
    const idx = i % 10 < 8 ? i % KEY_BUFFERS.length : Math.floor(Math.random() * KEY_BUFFERS.length)
    decoder.decode(KEY_BUFFERS[idx])
  }

  const end = performance.now()
  return end - start
}

function warmup() {
  console.log('🔥 Warming up JIT...')
  const cached = new CachedDecoder()
  const noCache = new NoCacheDecoder()
  const hybrid = new HybridDecoder()

  benchmark('warmup-cached', cached, WARMUP)
  benchmark('warmup-nocache', noCache, WARMUP)
  benchmark('warmup-hybrid', hybrid, WARMUP)

  console.log('✅ Warmup complete\n')
}

function runBenchmarks() {
  console.log('📊 String Cache Impact Benchmark')
  console.log('='.repeat(80))
  console.log(`Iterations: ${ITERATIONS.toLocaleString()}`)
  console.log(`Workload: 80% cache hits, 20% misses (realistic JSON keys)`)
  console.log('='.repeat(80))
  console.log()

  const cached = new CachedDecoder()
  const noCache = new NoCacheDecoder()
  const hybrid = new HybridDecoder()

  const cachedTime = benchmark('cached', cached, ITERATIONS)
  const noCacheTime = benchmark('nocache', noCache, ITERATIONS)
  const hybridTime = benchmark('hybrid', hybrid, ITERATIONS)

  console.log(`With Cache (current):     ${cachedTime.toFixed(2)}ms`)
  console.log(`No Cache (pure decoder):  ${noCacheTime.toFixed(2)}ms`)
  console.log(`Hybrid (decoder + cache): ${hybridTime.toFixed(2)}ms`)
  console.log()

  const baseline = Math.min(cachedTime, noCacheTime, hybridTime)

  console.log('='.repeat(80))
  console.log('📈 Relative Performance')
  console.log('='.repeat(80))
  console.log()
  console.log(`With Cache:     ${(cachedTime / baseline).toFixed(2)}x`)
  console.log(`No Cache:       ${(noCacheTime / baseline).toFixed(2)}x`)
  console.log(`Hybrid:         ${(hybridTime / baseline).toFixed(2)}x`)
  console.log()

  let winner = ''
  if (cachedTime === baseline) winner = 'With Cache (current)'
  else if (noCacheTime === baseline) winner = 'No Cache (pure decoder)'
  else if (hybridTime === baseline) winner = 'Hybrid (decoder + cache)'

  console.log(`🏆 Winner: ${winner}`)
  console.log()

  console.log('='.repeat(80))
  console.log('🎯 Recommendation')
  console.log('='.repeat(80))
  console.log()

  if (noCacheTime < cachedTime) {
    const improvement = (((cachedTime - noCacheTime) / cachedTime) * 100).toFixed(1)
    console.log(`✅ Remove cache! Pure TextDecoder is ${improvement}% faster.`)
    console.log(`   Cache overhead (Map lookup + string concat) hurts performance.`)
  } else {
    const improvement = (((noCacheTime - cachedTime) / noCacheTime) * 100).toFixed(1)
    console.log(`✅ Keep cache! It provides ${improvement}% speedup on repeated keys.`)
  }
  console.log()
}

warmup()
runBenchmarks()
