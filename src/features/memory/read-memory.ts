import { nodeMemoryFileSystem } from "@/features/memory/node-memory-file-system";
import { readMemoryFiles } from "@/features/memory/read-memory-files";
import { resolveInventoryPathConfigFromEnv } from "@/features/inventory/resolve-path-config";

export function readHermesMemory() {
  const paths = resolveInventoryPathConfigFromEnv();

  return readMemoryFiles({
    hermesRoot: paths.hermesRoot.path,
    fileSystem: nodeMemoryFileSystem,
  });
}
