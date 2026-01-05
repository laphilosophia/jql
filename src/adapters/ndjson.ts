import { Engine } from '../core/engine';
import { JQLParser } from '../core/parser';

export interface NDJSONOptions {
  debug?: boolean;
}

/**
 * NDJSON Adapter
 * Processes a stream of newline-delimited JSON objects.
 */
export async function* ndjsonStream(
  stream: ReadableStream<Uint8Array>,
  schema: string,
  options: NDJSONOptions = {}
): AsyncGenerator<any> {
  const parser = new JQLParser(schema);
  const map = parser.parse();
  const engine = new Engine(map, { debug: options.debug });

  const reader = stream.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');

      // Last element might be an incomplete line
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (!line.trim()) continue;
        const lineBuffer = new TextEncoder().encode(line);
        engine.reset();
        const result = engine.execute(lineBuffer);
        yield result;
      }
    }

    // Process remainder
    if (buffer.trim()) {
      engine.reset();
      yield engine.execute(new TextEncoder().encode(buffer));
    }
  } finally {
    reader.releaseLock();
  }
}
