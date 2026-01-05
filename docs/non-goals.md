# JQL Project Non-Goals (Boundaries)

To maintain a lean, high-performance projection engine, the following features are explicitly **out of scope** for JQL V2 and V3.

## 1. Data Aggregation

JQL is NOT an aggregation engine.

- ❌ **No `@sum`, `@avg`, `@count`**: Aggregation requires cross-node context and accumulates state, breaking the forward-only streaming model.
- ❌ **No Group-By**: JQL does not re-order or bucket data.

## 2. Scripting & User-Defined Code

JQL is a declarative DSL, not a execution runtime.

- ❌ **No Custom Logic**: Usage of user-provided callbacks or scripts during traversal is forbidden to maintain predictability and performance isolation.
- ❌ **No Conditionals**: complex if/else logic inside schema is not supported.

## 3. Parent/Global Context

JQL directives are strictly node-local.

- ❌ **No `../` or Root Access**: Directives cannot reach outside their immediate primitive/object value.

## 4. Dynamic Schema Mutation

JQL is for projection (selection and preparation), not transformation into new shapes.

- ❌ **No Shape Transformation**: You cannot map an object into a completely different structure (e.g., mapping an object to an array).

## 5. Persistent Indexing

JQL is an ephemeral engine.

- ❌ **No Disk-Bound Indexes**: Indexes are tied to memory buffer identity and are lost when the instance is GC'd.
