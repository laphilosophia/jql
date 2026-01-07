import { query } from '../runtime/index.js'

// Exact benchmark structure
const json = {
  users: [
    {
      id: 0,
      name: 'User 0',
      email: 'user0@example.com',
      metadata: {
        tags: ['a', 'b', 'c'],
        details: {
          lastLogin: '2026-01-07T00:00:00.000Z',
          score: 42.5,
        },
      },
    },
    {
      id: 1,
      name: 'User 1',
      email: 'user1@example.com',
      metadata: {
        tags: ['x', 'y', 'z'],
        details: {
          lastLogin: '2026-01-07T00:00:00.000Z',
          score: 88.2,
        },
      },
    },
  ],
}

console.log('Testing benchmark structure...')
;(async () => {
  try {
    const result = await query(json, '{ users { id, name } }', { debug: true })
    console.log('Result:', JSON.stringify(result, null, 2))
    console.log('✅ Benchmark structure test passed!')
  } catch (e: any) {
    console.error('❌ Benchmark structure test failed:', e.message)
    console.error(e.stack)
    process.exit(1)
  }
})()
