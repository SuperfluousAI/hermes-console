import { describe, expect, it } from "vitest";

import { readMemoryFiles, type MemoryFileSystem } from "@/features/memory/read-memory-files";

function createFileSystem(files: Record<string, string>): MemoryFileSystem {
  return {
    pathExists(targetPath) {
      return targetPath in files;
    },
    readTextFile(targetPath) {
      return files[targetPath] ?? null;
    },
  };
}

describe("readMemoryFiles", () => {
  it("reads MEMORY and USER files, preserving preamble and parsed entries", () => {
    const result = readMemoryFiles({
      hermesRoot: "/home/shan/.hermes",
      fileSystem: createFileSystem({
        "/home/shan/.hermes/config.yaml": [
          "model:",
          "  default: gpt-5.4",
          "memory:",
          "  memory_char_limit: 2400",
          "  user_char_limit: 1500",
        ].join("\n"),
        "/home/shan/.hermes/memories/MEMORY.md": [
          "# MEMORY.md - durable only",
          "",
          "Use this file only for durable truths.",
          "§",
          "First durable memory.",
          "§",
          "Second durable memory.",
        ].join("\n"),
        "/home/shan/.hermes/memories/USER.md": [
          "First user preference.",
          "§",
          "Second user preference.",
        ].join("\n"),
      }),
    });

    expect(result.status).toBe("ready");
    expect(result.limits.memory).toEqual({ value: 2400, source: "config" });
    expect(result.limits.user).toEqual({ value: 1500, source: "config" });
    expect(result.files.memory.preamble).toContain("durable truths");
    expect(result.files.memory.entries.map((entry) => entry.content)).toEqual([
      "First durable memory.",
      "Second durable memory.",
    ]);
    expect(result.files.user.entries.map((entry) => entry.content)).toEqual([
      "First user preference.",
      "Second user preference.",
    ]);
  });

  it("falls back to default limits when config values are missing", () => {
    const result = readMemoryFiles({
      hermesRoot: "/home/shan/.hermes",
      fileSystem: createFileSystem({
        "/home/shan/.hermes/config.yaml": "model:\n  default: gpt-5.4\n",
      }),
    });

    expect(result.status).toBe("missing");
    expect(result.limits.memory).toEqual({ value: 2200, source: "default" });
    expect(result.limits.user).toEqual({ value: 1375, source: "default" });
    expect(result.files.memory.entries).toEqual([]);
    expect(result.files.user.entries).toEqual([]);
  });

  it("marks pressure levels using stable warning thresholds", () => {
    const approachingContent = "a".repeat(1700);
    const nearLimitContent = "b".repeat(2050);
    const overLimitContent = "c".repeat(1400);

    const result = readMemoryFiles({
      hermesRoot: "/home/shan/.hermes",
      fileSystem: createFileSystem({
        "/home/shan/.hermes/memories/MEMORY.md": approachingContent,
        "/home/shan/.hermes/memories/USER.md": nearLimitContent,
        "/home/shan/.hermes/config.yaml": [
          "memory:",
          "  memory_char_limit: 2200",
          "  user_char_limit: 1300",
        ].join("\n"),
      }),
    });

    expect(result.files.memory.pressureLevel).toBe("approaching_limit");
    expect(result.files.user.pressureLevel).toBe("at_limit");
    expect(result.files.memory.usagePercentage).toBe(77);
    expect(result.files.user.usagePercentage).toBe(158);

    const nearLimitResult = readMemoryFiles({
      hermesRoot: "/home/shan/.hermes",
      fileSystem: createFileSystem({
        "/home/shan/.hermes/memories/MEMORY.md": nearLimitContent,
        "/home/shan/.hermes/memories/USER.md": overLimitContent,
      }),
    });

    expect(nearLimitResult.files.memory.pressureLevel).toBe("near_limit");
    expect(nearLimitResult.files.user.pressureLevel).toBe("at_limit");
  });

  it("marks the read as partial when only one memory surface exists", () => {
    const result = readMemoryFiles({
      hermesRoot: "/home/shan/.hermes",
      fileSystem: createFileSystem({
        "/home/shan/.hermes/memories/USER.md": "Only the user profile exists.",
      }),
    });

    expect(result.status).toBe("partial");
    expect(result.files.memory.exists).toBe(false);
    expect(result.files.user.exists).toBe(true);
  });
});
