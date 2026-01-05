# Quick Start Guide

Get up and running with JQL in under 5 minutes. This guide walks you through installation, basic queries, streaming operations, and common patterns.

---

## Prerequisites

- **Node.js** 16+ or any modern JavaScript runtime (Deno, Bun, Cloudflare Workers)
- **npm** or **yarn** or **pnpm**

---

## Installation

### As a Library

```bash
npm install jql
```

### As a CLI Tool

```bash
# Install globally
npm install -g jql

# Or use npx (no installation)
npx jql --help
```

---

## Your First Query

### 1. Basic Object Projection

```typescript
import { query } from 'jql'

const user = {
  id: 1,
  name: 'Alice',
  email: 'alice@example.com',
  password: 'secret123',
  metadata: {
    role: 'admin',
    lastLogin: '2026-01-05',
  },
}

// Extract only what you need
const result = await query(user, '{ id, name, metadata { role } }')

console.log(result)
// Output: { id: 1, name: 'Alice', metadata: { role: 'admin' } }
```

**Key Takeaway**: JQL lets you specify exactly which fields to extract, ignoring everything else.

---

### 2. Array Projection

```typescript
const users = [
  { id: 1, name: 'Alice', email: 'alice@example.com' },
  { id: 2, name: 'Bob', email: 'bob@example.com' },
  { id: 3, name: 'Charlie', email: 'charlie@example.com' },
]

const result = await query(users, '{ name, email }')

console.log(result)
// Output: [
//   { name: 'Alice', email: 'alice@example.com' },
//   { name: 'Bob', email: 'bob@example.com' },
//   { name: 'Charlie', email: 'charlie@example.com' }
// ]
```

---

### 3. Nested Object Extraction

```typescript
const order = {
  orderId: 'ORD-12345',
  customer: {
    id: 42,
    name: 'Alice',
    address: {
      street: '123 Main St',
      city: 'San Francisco',
      country: 'USA',
    },
  },
  items: [
    { sku: 'ITEM-1', price: 29.99, quantity: 2 },
    { sku: 'ITEM-2', price: 49.99, quantity: 1 },
  ],
}

const result = await query(
  order,
  `{
  orderId,
  customer { name, address { city } },
  items { sku, price }
}`
)

console.log(result)
// Output: {
//   orderId: 'ORD-12345',
//   customer: { name: 'Alice', address: { city: 'San Francisco' } },
//   items: [
//     { sku: 'ITEM-1', price: 29.99 },
//     { sku: 'ITEM-2', price: 49.99 }
//   ]
// }
```

---

## Streaming Large Datasets

JQL's real power is **streaming**. Process millions of rows without loading everything into memory.

### NDJSON Streaming

```typescript
import { ndjsonStream } from 'jql'
import { createReadStream } from 'fs'

const stream = createReadStream('telemetry.log') // Each line is a JSON object

for await (const event of ndjsonStream(stream, '{ timestamp, userId, action }')) {
  console.log(event)
  // Process each row as it arrives
}
```

**Use Case**: Log processing, telemetry, real-time analytics.

---

### Fault-Tolerant Streaming

Real-world data is messy. JQL can skip malformed lines and continue processing.

```typescript
import { ndjsonStream } from 'jql'
import { createReadStream } from 'fs'

const stream = createReadStream('messy-data.log')

for await (const row of ndjsonStream(stream, '{ id, name }', {
  skipErrors: true,
  onError: (info) => {
    console.error(`[Line ${info.lineNumber}] ${info.error.message}`)
  },
})) {
  console.log(row)
}
```

**Output Example**:

```
[Line 42] Unexpected token at position 15
[Line 103] Missing closing brace
{ id: 1, name: 'Alice' }
{ id: 2, name: 'Bob' }
...
```

---

## CLI Usage

The JQL CLI is perfect for quick data exploration and shell pipelines.

### Query a File

```bash
jql data.json "{ name, email }"
```

### Pipe from stdin

```bash
curl https://api.github.com/users/octocat | jql "{ login, public_repos }"
```

### Process NDJSON Logs

```bash
tail -f /var/log/app.log | jql --ndjson "{ timestamp, level, message }"
```

### Extract Nested Fields

```bash
jql users.json "{ user { profile { name, bio } } }"
```

---

## Error Handling

JQL provides **type-safe error handling** with detailed position tracking.

```typescript
import { query, JQLError, TokenizationError, StructuralMismatchError } from 'jql'

try {
  const result = await query(data, schema)
} catch (error) {
  if (error instanceof TokenizationError) {
    console.error(`Invalid JSON at position ${error.position}: ${error.message}`)
  } else if (error instanceof StructuralMismatchError) {
    console.error(`Schema mismatch: ${error.message}`)
  } else if (error instanceof JQLError) {
    console.error(`JQL Error: ${error.message}`)
  }
}
```

---

## Real-World Examples

### 1. Extract GitHub Event Data

```typescript
import { query } from 'jql'

const githubEvent = await fetch('https://api.github.com/events').then((r) => r.json())

const simplified = await query(
  githubEvent,
  `{
  id,
  type,
  actor { login, avatar_url },
  repo { name }
}`
)
```

---

### 2. Process Financial Transactions

```typescript
import { ndjsonStream } from 'jql'
import { createReadStream } from 'fs'

const stream = createReadStream('transactions.ndjson')

let totalVolume = 0

for await (const tx of ndjsonStream(stream, '{ amount, currency, status }')) {
  if (tx.status === 'completed' && tx.currency === 'USD') {
    totalVolume += tx.amount
  }
}

console.log(`Total USD volume: $${totalVolume.toFixed(2)}`)
```

---

### 3. Real-Time Telemetry Monitoring

```typescript
import { subscribe } from 'jql'
import { createReadStream } from 'fs'

const telemetryStream = createReadStream('/var/log/telemetry.log')

subscribe(telemetryStream, '{ deviceId, temperature, humidity }', {
  onMatch: (data) => {
    if (data.temperature > 80) {
      console.warn(`⚠️  Device ${data.deviceId} overheating: ${data.temperature}°C`)
    }
  },
  onComplete: () => console.log('Monitoring complete'),
})
```

---

## Advanced: Custom Tokenizer

For maximum performance, use the low-level tokenizer API.

```typescript
import { Tokenizer } from 'jql'

const tokenizer = new Tokenizer()
const buffer = new TextEncoder().encode('{"key": "value"}')

// Zero-allocation callback mode
tokenizer.processChunk(buffer, (token) => {
  console.log(token.type, token.value)
})

// Or use iterator mode (more convenient)
for (const token of tokenizer.tokenize(buffer)) {
  console.log(token.type, token.value)
}
```

---

## Performance Tips

1. **Use streaming for large files**: `ndjsonStream` processes data incrementally, keeping memory constant.
2. **Enable fault tolerance only when needed**: `skipErrors: true` adds overhead.
3. **Narrow your schema**: Only select fields you need. JQL skips unused data at the byte level.
4. **Use the CLI for exploration**: Quickly test queries before integrating into code.

---

## Next Steps

Now that you've mastered the basics, dive deeper:

- [**Mental Model**](mental-model.md) - Understand JQL's architecture
- [**Query Language Guide**](query-language.md) - Learn advanced syntax (aliasing, directives)
- [**API Reference**](api-reference.md) - Full API documentation
- [**Performance Contract**](performance.md) - JQL's guarantees
- [**Internals**](internals.md) - How JQL achieves zero-allocation streaming

---

## Common Pitfalls

### ❌ Don't: Load entire file into memory

```typescript
const data = JSON.parse(fs.readFileSync('huge.json', 'utf-8'))
const result = await query(data, schema) // Memory spike!
```

### ✅ Do: Stream it

```typescript
const stream = fs.createReadStream('huge.json')
for await (const row of ndjsonStream(stream, schema)) {
  // Process incrementally
}
```

---

### ❌ Don't: Ignore errors silently

```typescript
for await (const row of ndjsonStream(stream, schema, { skipErrors: true })) {
  // Silent failures!
}
```

### ✅ Do: Log errors

```typescript
for await (const row of ndjsonStream(stream, schema, {
  skipErrors: true,
  onError: (info) => logger.error(`Line ${info.lineNumber}: ${info.error.message}`),
})) {
  // Errors are tracked
}
```

---

## Questions?

- **GitHub Issues**: [laphilosophia/jql](https://github.com/laphilosophia/jql/issues)
- **Documentation**: [docs/README.md](README.md)

---

**You're ready to build.** Start with simple queries, then scale to streaming when you need it.
