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
  let leftover: Uint8Array | null = null;

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      let chunk = value;
      if (leftover) {
        const combined = new Uint8Array(leftover.length + value.length);
        combined.set(leftover);
        combined.set(value, leftover.length);
        chunk = combined;
        leftover = null;
      }

      let start = 0;
      while (start < chunk.length) {
        const newlineIndex = chunk.indexOf(10, start); // 10 is \n
        if (newlineIndex === -1) {
          leftover = chunk.slice(start);
          break;
        }

        const line = chunk.subarray(start, newlineIndex);
        if (line.length > 0) {
          engine.reset();
          yield engine.execute(line);
        }
        start = newlineIndex + 1;
      }
    }

    if (leftover && leftover.length > 0) {
      engine.reset();
      yield engine.execute(leftover);
    }
  } finally {
    reader.releaseLock();
  }
}
