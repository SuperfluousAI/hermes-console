import { discoverHermesInstallation } from "@/features/inventory/discover-installation";
import { nodeInventoryFileSystem } from "@/features/inventory/node-file-system";
import { resolveInventoryPathConfigFromEnv } from "@/features/inventory/resolve-path-config";

export function readHermesInstallation() {
  const paths = resolveInventoryPathConfigFromEnv();

  return discoverHermesInstallation({
    paths,
    fileSystem: nodeInventoryFileSystem,
  });
}
