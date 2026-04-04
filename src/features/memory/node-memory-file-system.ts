import fs from "node:fs";

import type { MemoryFileSystem } from "@/features/memory/read-memory-files";

export const nodeMemoryFileSystem: MemoryFileSystem = {
  pathExists(targetPath) {
    return fs.existsSync(targetPath);
  },
  readTextFile(targetPath) {
    if (!fs.existsSync(targetPath)) {
      return null;
    }

    return fs.readFileSync(targetPath, "utf8");
  },
};
