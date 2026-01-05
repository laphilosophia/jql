import { Engine } from '../core/engine';
import { JQLParser } from '../core/parser';

export interface SubscriptionOptions {
  onMatch: (data: any) => void;
  onComplete?: () => void;
  onError?: (err: Error) => void;
  debug?: boolean;
}

export interface JQLSubscription {
  unsubscribe: () => void;
}

/**
 * JQL Subscription
 * Connects a stream directly to a callback-based projection.
 * Ideal for real-time telemetry and high-intensity monitoring.
 */
export function subscribe(
  stream: ReadableStream<Uint8Array>,
  schema: string,
  options: SubscriptionOptions
): JQLSubscription {
  const parser = new JQLParser(schema);
  const map = parser.parse();

  const engine = new Engine(map, {
    debug: options.debug,
    onMatch: options.onMatch
  });

  const reader = stream.getReader();
  let active = true;

  const process = async () => {
    try {
      while (active) {
        const { done, value } = await reader.read();
        if (done) {
          options.onComplete?.();
          break;
        }

        engine.processChunk(value);
      }
    } catch (err: any) {
      if (active) options.onError?.(err);
    } finally {
      reader.releaseLock();
    }
  };

  process();

  return {
    unsubscribe: () => {
      active = false;
      reader.cancel();
    }
  };
}
