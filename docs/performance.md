# JQL Performance Contract

This document provides ironclad guarantees regarding the computational and memory efficiency of the JQL engine.

## 1. Complexity Guarantees

- **Time Complexity**:
  - **Streaming Mode**: $O(N)$ where $N$ is the total number of bytes in the JSON source. Every byte is touched exactly once in a forward-only pass. Skipped subtrees are traversed at the byte level with minimal branching.
  - **Indexed Mode**: $O(K + S)$ where $K$ is the number of requested root-level keys and $S$ is the size of the selected subtrees.
- **Memory Complexity**:
  - **Constant Overhead**: $O(D)$ where $D$ is the maximum nesting depth of the JSON. Memory usage is **independent** of the total payload size (1MB or 1GB uses the same baseline).

## 2. Directive Execution Budget

JQL enforces a rigid execution budget for directives to prevent resource exhaustion:

- **String Clamping**: `@substring` is capped at 10,000 characters per node.
- **Precision Clamping**: `@formatNumber` is capped at 20 decimal places.
- **O(1) Locality**: All default directives are guaranteed to be $O(1)$ relative to the node value.

## 3. V2.2.0 Battle-Tested Guarantees

As of V2.2.0, JQL provides the following hardware-aligned performance guarantees:

- **GC-free Steady State**: The engine uses pre-allocated `Uint8Array` buffers and object recycling. Once the stream starts, zero garbage is generated for tokenization, ensuring no "Stop-the-world" GC pauses in long-running FinTech or telemetry streams.
- **Byte-level NDJSON Path**: The NDJSON adapter operates directly on binary chunks. No intermediate string decoding/splitting occurs until a field is explicitly matched, maximizing IO-to-CPU efficiency.
- **Allocation-free Hot Loop**: During the primary FSM traversal, no new objects are allocated. Tokens and results are reused or mutated in-place where possible, putting JQL in the performance bracket usually reserved for WASM/Native implementations.

## 4. Golden Benchmark Set (Regression Shield)

Every release must pass the following "Golden Set" with zero performance regression:

| Benchmark | Target | Goal |
| :--- | :--- | :--- |
| **1M NDJSON** | < 4.5s | Throughput stability (220k+ match/s) |
| **Skip-Heavy JSON** | O(N) Linear | Verification of counting mode efficiency |
| **Deep Nesting (1k)** | < 2ms | Stack-safety & recursion-free stability |
| **Small Payload Latency** | < 0.1ms | Cold-start performance for serverless |

---

> [!IMPORTANT]
> Failure to meet these metrics in a PR constitutes a regression and will block the release.
