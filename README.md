# JQL (JSON Query Language) 🚀

**JQL is one of the fastest streaming JSON projection engines in pure JavaScript — and the only one designed to run safely at the edge**

JQL is a byte-level, zero-allocation streaming engine designed for the high-performance requirements of FinTech, telemetry, and edge runtimes. It projects specific fields from massive JSON streams with **constant memory overhead** and **near-native speeds**.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Build: Battle-Tested](https://img.shields.io/badge/Build-Battle--Tested-blue.svg)](docs/performance.md)

---

## � Performance at a Glance

JQL is optimized for **throughput** and **resource isolation**.

- **1,000,000 Rows**: Processed in **4.22s** (~230k matches/s).
- **Constant Memory**: Stable $O(Depth)$ heap usage, regardless of payload size (1MB or 10GB).
- **Zero Allocation**: Allocation-free hot loop and GC-free steady state.

---

## �️ CLI Usage

JQL provides a high-speed terminal tool for data analysis.

```bash
# 1. Simple file projection
jql data.json "{ name, meta { type } }"

# 2. Piping from stdin
cat massive.json | jql "{ actor.login }"

# 3. High-performance NDJSON / JSONL (Line-delimited) processing
tail -f telemetery.log | jql --jsonl "{ lat, lon }"
```

> [!TIP]
> Use the `--ndjson` flag for line-delimited files to enable FSM recycling, which significantly reduces GC pressure on massive streams.

---

## � Programmatic Usage

### Pull-Mode (Standard)

```typescript
import { read } from 'jql';

const result = await read(stream, '{ id, name }');
```

### Push-Mode (Real-time)

```typescript
import { subscribe } from 'jql';

subscribe(telemetryStream, '{ lat, lon }', {
  onMatch: (data) => console.log('Match!', data),
  onComplete: () => console.log('Done.')
});
```

---

## 📚 Documentation

Dive deeper into the details:

- [**Documentation Index**](docs/README.md) - The starting point for all guides.
- [**Query Language Guide**](docs/query-language.md) - Syntax and Directives.
- [**API Reference**](docs/api-reference.md) - Runtimes and Adapters.
- [**Internals Deep-Dive**](docs/internals.md) - How we achieved near-native speed.
- [**Performance Contract**](docs/performance.md) - Our ironclad guarantees.

---

## ⚖️ License

MIT © 2026 laphilosophia
