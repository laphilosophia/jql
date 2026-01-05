# JQL Capability Matrix (V2)

This document defines the hard limits and supported scope of the JQL V2 Streaming Engine. Adherence to these limits ensures $O(1)$ memory overhead and maximum throughput.

## 1. Streaming Mode (Default)

Streaming mode processes data in a single, forward-only pass.

| Feature | Support Status | Rationale |
| :--- | :--- | :--- |
| **Forward-Only** | ✅ Supported | Allows processing of infinite streams. |
| **Backtracking** | ❌ Not Supported | Requires buffer retention; breaks memory guarantees. |
| **Aggregation** | ❌ Not Supported | `@sum` or `@count` requires multi-node context/storage. |
| **Parent-Context** | ❌ Not Supported | Forward-only walker does not retain parent values. |
| **Path Selective** | ✅ Supported | Byte-level skipping of unrequested subtrees. |
| **Emit Order** | 🚚 Deterministic | Matches the byte-order of the source JSON. |

## 2. Indexed Mode

Triggered on repeat queries of static buffers (`Uint8Array`).

| Feature | Support Status | Rationale |
| :--- | :--- | :--- |
| **Root-Key Random Access** | ✅ Supported | Offset-based jumps for top-level keys. |
| **Amortized Speedup** | ✅ Supported | Multi-query overhead is reduced by skipping to offsets. |
| **Deep Aggregation** | ❌ Not Supported | Remains a projection engine, not a compute engine. |

## 3. Directives Contract

Directives MUST be "Safe Operators":

1. **O(1) Time**: No loops proportional to total JSON size.
2. **Local Context Only**: Operates only on the immediate node value.
3. **Bounded Allocation**: No arbitrary string growth or deep cloning.

---

## ❌ Out-of-Scope (Non-Goals)

To prevent "DSL Creep", the following features are explicitly rejected for the JQL core:

- User-defined callback functions during execution.
- Cross-node references (e.g., `total: items@sum`).
- Deep-hop index generation for streaming sources.
- Schema mutation (JQL is for projection/preparation, not transformation).
