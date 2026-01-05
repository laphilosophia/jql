# JQL Mental Model

"JQL does not parse JSON; it moves through it."

## 1. The Power of Untouched Data

Most JSON parsers convert bytes to objects immediately. JQL treats JSON as a raw byte stream. If you don't ask for a field, JQL **does not see it**. It simply counts braces until it finds something you requested.

## 2. Bytes Over Objects

- **Traditional**: `Bytes → Token → JS Object → Filter → Result`
- **JQL**: `Bytes → (FSM Matcher) → Result`
The conversion to JS Objects (materialization) only happens at the "edges" where a match is confirmed.

## 3. Streaming vs. Indexed Mode

- **Streaming Mode**: A forward-only marathon. You have one chance to see each byte. Ideal for massive files from network/disk.
- **Indexed Mode**: A series of targeted sprints. Once the first pass is done, JQL "knows the shortcuts" (offsets) to reach your data faster next time.

## 4. Directives are Filters, Not Transforms

Think of directives as **Pipeable Guards**. They prepare the data just before it leaves the engine. They cannot look back or sideways; they only look at what is currently in their "hands".
