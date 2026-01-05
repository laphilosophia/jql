# JQL Query Language

JQL uses a structural selection syntax inspired by GraphQL's projection but optimized for high-speed binary streaming.

## 🧱 Selection Syntax

### Basic Objects

Select specific keys from an object:

```jql
{ id, name, email }
```

### Nested Objects

Project deep structures:

```jql
{
  id,
  user {
    name,
    metadata { type }
  }
}
```

### Arrays

JQL automatically iterates over arrays. The selection inside `{ }` is applied to every item in the array.

```jql
{
  title,
  tags { name }
}
```

---

## 🏷️ Aliasing

Rename fields in the output:

```jql
{ username: account.login, status: user_status }
```

---

## ⚡ Directives

Directives allow field manipulation during the projection phase with **Zero Allocation**.

### `@default(value)`

Provides a fallback if the key is missing.

```jql
{ status @default("unknown") }
```

### `@substring(pos, len?)`

Clamps strings directly at the byte level.

```jql
{ bio @substring(0, 100) }
```

### `@formatNumber(decimals)`

Formats numbers during materialization.

```jql
{ price @formatNumber(2) }
```

### `@uppercase` / `@lowercase`

Transforms string case.

```jql
{ category @uppercase }
```

---

## 🛡️ Error Tolerance

- **Missing Keys**: Keys not found in the source are silently omitted unless a `@default` is provided.
- **Malformed JSON**: JQL implements **Resilient Skip**. If it encounters structural corruption (e.g., a missing colon), it will attempt to resynchronize at the next structural token (`{`, `}`, `[`, `]`).
- **Binary Corruption**: Corrupted literals (e.g., `truX` instead of `true`) trigger a **Hard Abort** to prevent state desynchronization.
