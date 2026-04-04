import { nodeKeyFilesFileSystem } from "@/features/key-files/node-key-files-file-system";
import { discoverKeyFiles } from "@/features/key-files/discover-key-files";
import { resolveInventoryPathConfigFromEnv } from "@/features/inventory/resolve-path-config";

export function readKeyFiles() {
  const paths = resolveInventoryPathConfigFromEnv();

  return discoverKeyFiles({
    hermesRoot: paths.hermesRoot.path,
    workspaceRoot: paths.workspaceRoot.path,
    fileSystem: nodeKeyFilesFileSystem,
  });
}
