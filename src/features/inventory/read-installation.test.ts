import { describe, expect, it, vi } from "vitest";

vi.mock("@/features/inventory/resolve-path-config", () => ({
  resolveInventoryPathConfigFromEnv: vi.fn(() => ({
    hermesRoot: {
      label: "hermes_root",
      path: "/tmp/hermes",
      kind: "default",
      envKey: "HERMES_CONSOLE_HERMES_DIR",
    },
    workspaceRoot: {
      label: "workspace_root",
      path: "/tmp/workspace",
      kind: "default",
      envKey: "HERMES_CONSOLE_WORKSPACE_DIR",
    },
  })),
}));

vi.mock("@/features/inventory/node-file-system", () => ({
  nodeInventoryFileSystem: {
    pathExists: (targetPath: string) =>
      ["/tmp/hermes", "/tmp/hermes/config.yaml"].includes(targetPath),
    listDirectories: () => [],
  },
}));

import { readHermesInstallation } from "@/features/inventory/read-installation";

describe("readHermesInstallation", () => {
  it("wires env path resolution into install discovery", () => {
    expect(readHermesInstallation()).toMatchObject({
      hermesRootExists: true,
      status: "ready",
      paths: {
        hermesRoot: {
          path: "/tmp/hermes",
        },
      },
    });
  });
});
