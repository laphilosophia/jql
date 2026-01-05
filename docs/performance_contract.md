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

## 3. Worst-Case Scenarios

- **Degenerate JSON**: Extremely deep nesting (e.g., 10,000+ levels) will increase stack memory linearly bit is guaranteed not to crash via iterative FSM.
- **Skip Behavior**: In "Counting Mode", the engine ignores all semantic content (escaped strings, numbers) unless they are structural characters (`{`, `}`, `[`, `]`).

## 4. Indexing Amortization

- **Rule**: Indexing is only triggered on repeat queries ($N \ge 2$) of the same buffer.
- **Cost**: The first query incurs a standard $O(N)$ cost; subsequent queries leverage the index to achieve sub-linear traversal for root-level access.
