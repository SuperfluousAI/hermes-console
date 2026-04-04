import { describe, expect, it } from "vitest";

import { discoverKeyFiles, type KeyFilesFileSystem } from "@/features/key-files/discover-key-files";

function createFileSystem({
  files,
  directories = {},
}: {
  files: Record<string, { size?: number; mtimeMs?: number }>;
  directories?: Record<string, string[]>;
}): KeyFilesFileSystem {
  return {
    pathExists(targetPath) {
      return targetPath in directories || targetPath in files;
    },
    listDirectories(targetPath) {
      return directories[targetPath] ?? [];
    },
    statFile(targetPath) {
      if (!(targetPath in files)) {
        return null;
      }

      return {
        size: files[targetPath].size ?? 100,
        mtimeMs: files[targetPath].mtimeMs ?? 123,
      };
    },
    readTextFile(targetPath) {
      return targetPath in files ? "example" : null;
    },
  };
}

describe("discoverKeyFiles", () => {
  it("discovers explicit Hermes-root files and bounded workspace files", () => {
    const result = discoverKeyFiles({
      hermesRoot: "/home/shan/.hermes",
      workspaceRoot: "/home/shan",
      fileSystem: createFileSystem({
        files: {
          "/home/shan/.hermes/SOUL.md": {},
          "/home/shan/.hermes/memories/MEMORY.md": {},
          "/home/shan/.hermes/memories/USER.md": {},
          "/home/shan/giles/hermes-console/AGENTS.md": {},
          "/home/shan/shan/check-in-v2/CLAUDE.md": {},
        },
        directories: {
          "/home/shan": ["giles", "shan", "go"],
          "/home/shan/.hermes": ["memories"],
          "/home/shan/.hermes/memories": [],
          "/home/shan/giles": ["hermes-console"],
          "/home/shan/giles/hermes-console": [],
          "/home/shan/shan": ["check-in-v2"],
          "/home/shan/shan/check-in-v2": [],
          "/home/shan/go": ["pkg"],
        },
      }),
    });

    expect(result.files.map((file) => file.path)).toEqual([
      "/home/shan/.hermes/memories/MEMORY.md",
      "/home/shan/.hermes/memories/USER.md",
      "/home/shan/.hermes/SOUL.md",
      "/home/shan/giles/hermes-console/AGENTS.md",
      "/home/shan/shan/check-in-v2/CLAUDE.md",
    ]);
    expect(result.files.find((file) => file.path.endsWith("AGENTS.md"))).toMatchObject({
      scope: "workspace_root",
      relativePath: "giles/hermes-console/AGENTS.md",
      kind: "instruction",
    });
  });

  it("dedupes repeated discoveries and ignores missing roots", () => {
    const result = discoverKeyFiles({
      hermesRoot: "/missing/.hermes",
      workspaceRoot: "/home/shan",
      fileSystem: createFileSystem({
        files: {
          "/home/shan/AGENTS.md": {},
        },
        directories: {
          "/home/shan": [".", "project"],
          "/home/shan/project": [],
        },
      }),
    });

    expect(result.files).toHaveLength(1);
    expect(result.files[0]).toMatchObject({
      path: "/home/shan/AGENTS.md",
      scope: "workspace_root",
    });
  });

  it("keeps workspace discovery bounded to two directory levels", () => {
    const result = discoverKeyFiles({
      hermesRoot: "/home/shan/.hermes",
      workspaceRoot: "/home/shan",
      fileSystem: createFileSystem({
        files: {
          "/home/shan/giles/nested/deeper/AGENTS.md": {},
          "/home/shan/giles/nested/AGENTS.md": {},
        },
        directories: {
          "/home/shan": ["giles"],
          "/home/shan/giles": ["nested"],
          "/home/shan/giles/nested": ["deeper"],
        },
      }),
    });

    expect(result.files.map((file) => file.path)).toEqual([
      "/home/shan/giles/nested/AGENTS.md",
    ]);
  });
});
