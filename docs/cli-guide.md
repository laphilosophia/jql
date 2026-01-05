# JQL CLI Guide

The JQL command-line interface provides a zero-configuration way to query JSON data directly from your terminal. Perfect for data exploration, shell pipelines, and quick transformations.

---

## Installation

### Global Installation

```bash
npm install -g jql
```

### One-Time Usage (npx)

```bash
npx jql data.json "{ name, email }"
```

### Verify Installation

```bash
jql --version
jql --help
```

---

## Basic Usage

### Syntax

```bash
jql [options] <input> <schema>
```

- **`<input>`**: File path or `-` for stdin
- **`<schema>`**: JQL query schema (must be quoted)
- **`[options]`**: Optional flags (see below)

---

## Examples

### 1. Query a JSON File

```bash
jql users.json "{ id, name, email }"
```

**Input** (`users.json`):

```json
[
  { "id": 1, "name": "Alice", "email": "alice@example.com", "password": "secret" },
  { "id": 2, "name": "Bob", "email": "bob@example.com", "password": "secret" }
]
```

**Output**:

```json
[
  { "id": 1, "name": "Alice", "email": "alice@example.com" },
  { "id": 2, "name": "Bob", "email": "bob@example.com" }
]
```

---

### 2. Read from stdin

```bash
cat data.json | jql - "{ name }"
```

Or omit the `-`:

```bash
cat data.json | jql "{ name }"
```

---

### 3. Nested Field Extraction

```bash
jql order.json "{ orderId, customer { name, address { city } } }"
```

**Input**:

```json
{
  "orderId": "ORD-123",
  "customer": {
    "name": "Alice",
    "address": { "city": "SF", "country": "USA" }
  }
}
```

**Output**:

```json
{
  "orderId": "ORD-123",
  "customer": {
    "name": "Alice",
    "address": { "city": "SF" }
  }
}
```

---

### 4. Process NDJSON (Newline-Delimited JSON)

```bash
jql --ndjson logs.log "{ timestamp, level, message }"
```

**Input** (`logs.log`):

```
{"timestamp": "2026-01-05T10:00:00Z", "level": "info", "message": "Server started", "pid": 1234}
{"timestamp": "2026-01-05T10:01:00Z", "level": "error", "message": "Connection failed", "pid": 1234}
```

**Output**:

```json
{"timestamp":"2026-01-05T10:00:00Z","level":"info","message":"Server started"}
{"timestamp":"2026-01-05T10:01:00Z","level":"error","message":"Connection failed"}
```

---

## Options

### `--ndjson`

Process input as NDJSON (one JSON object per line).

```bash
tail -f app.log | jql --ndjson "{ userId, action }"
```

---

### `--skip-errors`

Continue processing even if some lines are malformed.

```bash
jql --ndjson --skip-errors messy.log "{ id, name }"
```

**Use Case**: Real-world logs with occasional corruption.

---

### `--pretty`

Pretty-print output (formatted JSON).

```bash
jql --pretty data.json "{ name, email }"
```

**Output**:

```json
[
  {
    "name": "Alice",
    "email": "alice@example.com"
  },
  {
    "name": "Bob",
    "email": "bob@example.com"
  }
]
```

---

### `--compact`

Compact output (no whitespace). **Default behavior**.

```bash
jql --compact data.json "{ name }"
```

**Output**:

```json
[{ "name": "Alice" }, { "name": "Bob" }]
```

---

### `--max-line-length <bytes>`

Set maximum line length for DoS protection (default: 10MB).

```bash
jql --ndjson --max-line-length 1048576 huge.log "{ id }"
```

---

### `--version`

Show JQL version.

```bash
jql --version
```

---

### `--help`

Show help message.

```bash
jql --help
```

---

## Real-World Use Cases

### 1. Extract GitHub API Data

```bash
curl -s https://api.github.com/users/octocat/repos | jql "{ name, stargazers_count, language }"
```

---

### 2. Monitor Live Logs

```bash
tail -f /var/log/app.log | jql --ndjson "{ timestamp, level, message }"
```

---

### 3. Filter JSON Arrays

```bash
jql products.json "{ name, price }"
```

---

### 4. Extract Nested API Responses

```bash
curl -s https://api.example.com/orders | jql "{ order { id, customer { name } } }"
```

---

### 5. Process Large NDJSON Files

```bash
jql --ndjson --skip-errors transactions.log "{ id, amount, currency }" > filtered.json
```

---

### 6. Combine with `grep` and `jq`

```bash
# Extract error logs, then query with JQL
grep "ERROR" app.log | jql --ndjson "{ timestamp, message }"
```

---

### 7. Quick Data Exploration

```bash
# See what fields are available
jql data.json "{ }"  # Returns empty projection

# Extract top-level keys
jql data.json "{ id, name, email, createdAt }"
```

---

## Shell Pipelines

JQL integrates seamlessly with Unix pipelines.

### Example 1: Filter → Transform → Save

```bash
cat users.json | jql "{ id, email }" > emails.json
```

---

### Example 2: API → Extract → Count

```bash
curl -s https://api.github.com/users/octocat/repos \
  | jql "{ name }" \
  | wc -l
```

---

### Example 3: Logs → Filter → Analyze

```bash
tail -n 1000 app.log \
  | jql --ndjson "{ userId, action }" \
  | grep "purchase" \
  | wc -l
```

---

## Error Handling

### Malformed JSON

```bash
$ echo '{"broken": json}' | jql "{ broken }"
Error: Unexpected token at position 15
```

---

### Missing Fields

JQL silently omits missing fields (no error).

```bash
$ echo '{"name": "Alice"}' | jql "{ name, email }"
{"name":"Alice"}
```

---

### Skip Errors in NDJSON

```bash
jql --ndjson --skip-errors messy.log "{ id, name }"
```

**Behavior**: Malformed lines are skipped, valid lines are processed.

---

## Performance

### Benchmarks

```bash
# 1M rows, 1.65 GB file
time jql --ndjson huge.log "{ id, timestamp }"

# Result: ~4.3 seconds (233k rows/sec)
```

---

### Memory Usage

JQL uses **constant memory** regardless of file size.

```bash
# 10 GB file, ~37 MB memory
jql --ndjson massive.log "{ id }"
```

---

## Tips & Tricks

### 1. Combine with `head` for Quick Sampling

```bash
jql data.json "{ name, email }" | head -n 10
```

---

### 2. Use `tee` to Save and Display

```bash
jql data.json "{ id, name }" | tee output.json
```

---

### 3. Chain Multiple Queries

```bash
jql data.json "{ user { profile } }" | jql "{ profile { name } }"
```

---

### 4. Redirect Errors

```bash
jql --ndjson messy.log "{ id }" 2> errors.log
```

---

### 5. Process Compressed Files

```bash
zcat logs.gz | jql --ndjson "{ timestamp, message }"
```

---

## Comparison with `jq`

| Feature       | JQL                        | jq                      |
| ------------- | -------------------------- | ----------------------- |
| **Speed**     | 10-50x faster              | Slower                  |
| **Memory**    | O(1) constant              | O(N) grows with input   |
| **Syntax**    | GraphQL-like               | Custom DSL              |
| **Streaming** | Native                     | Limited                 |
| **NDJSON**    | First-class                | Requires `-c` flag      |
| **Use Case**  | High-performance pipelines | Complex transformations |

**When to use JQL**: Large files, streaming, performance-critical pipelines.
**When to use jq**: Complex transformations, filtering, arithmetic.

---

## Troubleshooting

### Command Not Found

```bash
jql: command not found
```

**Solution**: Install globally or use `npx`:

```bash
npm install -g jql
# or
npx jql data.json "{ name }"
```

---

### Schema Syntax Error

```bash
Error: Invalid schema syntax
```

**Solution**: Ensure schema is properly quoted:

```bash
# ❌ Wrong
jql data.json { name }

# ✅ Correct
jql data.json "{ name }"
```

---

### Large File Timeout

```bash
Error: Maximum line length exceeded
```

**Solution**: Increase `--max-line-length`:

```bash
jql --ndjson --max-line-length 52428800 huge.log "{ id }"
```

---

## Next Steps

- [**Quick Start**](quick-start.md) - Library usage examples
- [**Query Language**](query-language.md) - Advanced schema syntax
- [**API Reference**](api-reference.md) - Programmatic usage
- [**Performance**](performance.md) - Benchmarks and guarantees

---

## Examples Repository

More CLI examples: [github.com/laphilosophia/jql/examples](https://github.com/laphilosophia/jql/tree/main/examples)

---

**Master the CLI, automate your workflows.**
