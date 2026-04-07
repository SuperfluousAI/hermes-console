import fs from 'node:fs';

import type { InventoryFileSystem } from '@/features/inventory/discover-installation';

export const nodeInventoryFileSystem: InventoryFileSystem = {
  pathExists(targetPath) {
    try {
      return fs.existsSync(targetPath);
    } catch {
      return false;
    }
  },
  listDirectories(targetPath) {
    try {
      if (!fs.existsSync(targetPath)) {
        return [];
      }

      return fs
        .readdirSync(targetPath, { withFileTypes: true })
        .filter((entry) => entry.isDirectory())
        .map((entry) => entry.name)
        .sort((left, right) => left.localeCompare(right));
    } catch {
      return [];
    }
  }
};
