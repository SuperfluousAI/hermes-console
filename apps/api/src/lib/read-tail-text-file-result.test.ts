import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { describe, expect, it } from 'vitest';

import { readTailTextFileResult } from '@/lib/read-tail-text-file-result';

describe('readTailTextFileResult', () => {
  it('returns the requested number of trailing lines from a text file', () => {
    const rootPath = fs.mkdtempSync(path.join(os.tmpdir(), 'hermes-console-tail-'));
    const targetPath = path.join(rootPath, 'runtime.log');

    fs.writeFileSync(targetPath, ['line 1', 'line 2', 'line 3', 'line 4', 'line 5'].join('\n'));

    expect(readTailTextFileResult(targetPath, 2)).toEqual({
      status: 'ready',
      content: ['line 4', 'line 5'].join('\n')
    });
  });

  it('normalizes invalid requested line counts to at least one line', () => {
    const rootPath = fs.mkdtempSync(path.join(os.tmpdir(), 'hermes-console-tail-'));
    const targetPath = path.join(rootPath, 'runtime.log');

    fs.writeFileSync(targetPath, ['alpha', 'beta', 'gamma'].join('\n'));

    expect(readTailTextFileResult(targetPath, 0)).toEqual({
      status: 'ready',
      content: 'gamma'
    });
  });
});
