import path from 'node:path';

import { resolveInventoryPathConfigFromEnv } from '@/features/inventory/resolve-path-config';
import { readTextFileResult } from '@/lib/read-text-file-result';
import type { HermesConfigEntry, HermesConfigIndex } from '@hermes-console/runtime';

function parseYamlEntries(raw: string): HermesConfigEntry[] {
  const entries: HermesConfigEntry[] = [];
  let currentSection: string | null = null;
  const stack: string[] = [];

  for (const rawLine of raw.replace(/\r\n/g, '\n').split('\n')) {
    const line = rawLine.replace(/\t/g, '    ');
    const trimmed = line.trim();

    if (!trimmed || trimmed.startsWith('#')) continue;

    const indent = line.match(/^\s*/)?.[0].length ?? 0;
    const depth = Math.floor(indent / 2);
    const match = trimmed.match(/^([A-Za-z0-9_.-]+):\s*(.*)$/);

    if (!match) continue;

    const key = match[1];
    if (!key) continue;

    stack.length = depth;
    stack[depth] = key;

    // Track top-level sections
    if (depth === 0) {
      currentSection = key;
    }

    if (match[2]) {
      const fullKey = stack.slice(0, depth + 1).join('.');
      let value = match[2].trim().replace(/^['"]|['"]$/g, '');

      // Handle inline arrays: [a, b, c]
      if (value.startsWith('[')) {
        value = match[2].trim(); // keep brackets
      }

      entries.push({
        key: fullKey,
        value,
        section: currentSection
      });
    }
  }

  return entries;
}

export function readHermesConfig(): HermesConfigIndex {
  const paths = resolveInventoryPathConfigFromEnv();
  const hermesRoot = paths.hermesRoot.path;
  const configPath = path.join(hermesRoot, 'config.yaml');

  const configResult = readTextFileResult(configPath);
  const rawConfig = configResult.content ?? null;
  const configEntries = rawConfig ? parseYamlEntries(rawConfig) : [];

  return {
    entries: configEntries,
    rawConfig,
    configPath
  };
}
