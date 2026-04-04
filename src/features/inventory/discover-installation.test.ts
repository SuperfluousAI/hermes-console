import { describe, expect, it } from "vitest";

import { discoverHermesInstallation, type InventoryFileSystem } from "@/features/inventory/discover-installation";
import { HERMES_ROOT_ENV_KEY, WORKSPACE_ROOT_ENV_KEY } from "@/features/inventory/types";

function createFileSystem(paths: string[], directories: Record<string, string[]> = {}): InventoryFileSystem {
  const normalizedPaths = new Set(paths);

  return {
    pathExists(targetPath) {
      return normalizedPaths.has(targetPath) || targetPath in directories;
    },
    listDirectories(targetPath) {
      return directories[targetPath] ?? [];
    },
  };
}

const paths = {
  hermesRoot: {
    label: "hermes_root" as const,
    path: "/home/shan/.hermes",
    kind: "default" as const,
    envKey: HERMES_ROOT_ENV_KEY,
  },
  workspaceRoot: {
    label: "workspace_root" as const,
    path: "/home/shan",
    kind: "default" as const,
    envKey: WORKSPACE_ROOT_ENV_KEY,
  },
};

describe("discoverHermesInstallation", () => {
  it("marks the install missing when the Hermes root does not exist", () => {
    const installation = discoverHermesInstallation({
      paths,
      fileSystem: createFileSystem([]),
    });

    expect(installation.status).toBe("missing");
    expect(installation.hermesRootExists).toBe(false);
    expect(installation.availableAgentCount).toBe(0);
    expect(installation.agents).toHaveLength(1);
    expect(installation.agents[0]).toMatchObject({
      id: "default",
      source: "root",
      isAvailable: false,
    });
  });

  it("discovers the default agent and profile agents with presence checks", () => {
    const installation = discoverHermesInstallation({
      paths,
      fileSystem: createFileSystem(
        [
          "/home/shan/.hermes",
          "/home/shan/.hermes/config.yaml",
          "/home/shan/.hermes/state.db",
          "/home/shan/.hermes/profiles",
          "/home/shan/.hermes/profiles/nigel",
          "/home/shan/.hermes/profiles/nigel/config.yaml",
          "/home/shan/.hermes/profiles/nigel/sessions",
          "/home/shan/.hermes/profiles/nigel/skills",
        ],
        {
          "/home/shan/.hermes/profiles": ["nigel"],
        },
      ),
    });

    expect(installation.status).toBe("ready");
    expect(installation.profilesRootExists).toBe(true);
    expect(installation.availableAgentCount).toBe(2);
    expect(installation.agents).toEqual([
      expect.objectContaining({
        id: "default",
        source: "root",
        isAvailable: true,
        presence: expect.objectContaining({
          config: true,
          stateDb: true,
        }),
      }),
      expect.objectContaining({
        id: "nigel",
        label: "nigel",
        source: "profile",
        isAvailable: true,
        presence: expect.objectContaining({
          config: true,
          sessions: true,
          skills: true,
        }),
      }),
    ]);
  });

  it("marks an existing but empty install as partial", () => {
    const installation = discoverHermesInstallation({
      paths,
      fileSystem: createFileSystem(["/home/shan/.hermes"]),
    });

    expect(installation.status).toBe("partial");
    expect(installation.hermesRootExists).toBe(true);
    expect(installation.availableAgentCount).toBe(0);
  });
});
