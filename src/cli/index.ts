#!/usr/bin/env node
import { createReadStream } from 'fs';

async function main() {
  const args = process.argv.slice(2);
  let schema: string | undefined;
  let filePath: string | undefined;
  let isNDJSON = false;

  // Simple arg parsing: jql [--ndjson] [file] <schema>
  const flags = args.filter(a => a.startsWith('--'));
  const params = args.filter(a => !a.startsWith('--'));

  if (flags.includes('--ndjson')) isNDJSON = true;

  if (params.length === 1) {
    schema = params[0];
  } else if (params.length === 2) {
    filePath = params[0];
    schema = params[1];
  }

  if (!schema) {
    console.error('Usage: jql [file] <schema>');
    console.error('Example: cat data.json | jql "{ id, name }"');
    process.exit(1);
  }

  try {
    let source: any;

    if (filePath) {
      source = new ReadableStream({
        start(controller) {
          const stream = createReadStream(filePath!);
          stream.on('data', (chunk) => controller.enqueue(new Uint8Array(chunk as Buffer)));
          stream.on('end', () => controller.close());
          stream.on('error', (err) => controller.error(err));
        }
      });
    } else {
      // Stdin
      source = new ReadableStream({
        start(controller) {
          process.stdin.on('data', (chunk) => controller.enqueue(new Uint8Array(chunk as Buffer)));
          process.stdin.on('end', () => controller.close());
          process.stdin.on('error', (err) => controller.error(err));
        }
      });
    }

    if (isNDJSON) {
      const results = [];
      const { ndjsonStream } = await import('../adapters/ndjson');
      for await (const result of ndjsonStream(source, schema!)) {
        console.log(JSON.stringify(result));
      }
    } else {
      const { build } = await import('../runtime/index');
      const { read } = build(source);
      const result = await read(schema!);
      console.log(JSON.stringify(result, null, 2));
    }
  } catch (err: any) {
    if (err.code === 'EPIPE') process.exit(0);
    console.error(`Error: ${err.message}`);
    process.exit(1);
  }
}

main();
