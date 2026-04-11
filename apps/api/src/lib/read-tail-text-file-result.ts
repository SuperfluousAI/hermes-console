import fs from 'node:fs';

export type TailTextFileReadResult =
  | {
      status: 'ready';
      content: string;
    }
  | {
      status: 'missing';
      content: null;
    }
  | {
      status: 'unreadable';
      content: null;
      detail: string;
    };

const DEFAULT_CHUNK_SIZE = 64 * 1024;

export function readTailTextFileResult(targetPath: string, lineCount: number): TailTextFileReadResult {
  try {
    if (!fs.existsSync(targetPath)) {
      return {
        status: 'missing',
        content: null
      };
    }

    const normalizedLineCount = Math.max(1, lineCount);
    const stat = fs.statSync(targetPath);

    if (stat.size === 0) {
      return {
        status: 'ready',
        content: ''
      };
    }

    const fileDescriptor = fs.openSync(targetPath, 'r');

    try {
      let position = stat.size;
      let collected = '';
      let newlineCount = 0;

      while (position > 0 && newlineCount <= normalizedLineCount) {
        const start = Math.max(0, position - DEFAULT_CHUNK_SIZE);
        const length = position - start;
        const buffer = Buffer.alloc(length);

        fs.readSync(fileDescriptor, buffer, 0, length, start);

        collected = buffer.toString('utf8') + collected;
        newlineCount = collected.split(/\r?\n/).length - 1;
        position = start;
      }

      const lines = collected.split(/\r?\n/);

      if (lines.at(-1) === '') {
        lines.pop();
      }

      return {
        status: 'ready',
        content: lines.slice(-normalizedLineCount).join('\n')
      };
    } finally {
      fs.closeSync(fileDescriptor);
    }
  } catch (error) {
    return {
      status: 'unreadable',
      content: null,
      detail: error instanceof Error ? error.message : 'Hermes Console could not read the requested log file.'
    };
  }
}
