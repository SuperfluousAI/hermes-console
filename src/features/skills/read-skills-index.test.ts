import path from "node:path";

import { describe, expect, it } from "vitest";

import {
  compareSkillCategories,
  readSkillsIndex,
  type SkillsFileSystem,
} from "@/features/skills/read-skills-index";

function createFileSystem(files: Record<string, string>): SkillsFileSystem {
  const directories = new Set<string>();

  for (const filePath of Object.keys(files)) {
    let current = path.dirname(filePath);

    while (current !== "." && current !== "/") {
      directories.add(current);
      const next = path.dirname(current);
      if (next === current) {
        break;
      }
      current = next;
    }
  }

  return {
    pathExists(targetPath) {
      return directories.has(targetPath) || targetPath in files;
    },
    listDirectories(targetPath) {
      return Array.from(directories)
        .filter((directory) => path.dirname(directory) === targetPath)
        .map((directory) => path.basename(directory))
        .sort((left, right) => left.localeCompare(right));
    },
    listFiles(targetPath) {
      return Object.keys(files)
        .filter((filePath) => path.dirname(filePath) === targetPath)
        .map((filePath) => path.basename(filePath))
        .sort((left, right) => left.localeCompare(right));
    },
    readTextFile(targetPath) {
      return files[targetPath] ?? null;
    },
  };
}

describe("readSkillsIndex", () => {
  it("reads skill summaries, categories, and linked files", () => {
    const skillsRoot = "/home/shan/.hermes/skills";
    const result = readSkillsIndex({
      skillsRoot,
      fileSystem: createFileSystem({
        "/home/shan/.hermes/skills/workflow/challenge-me/SKILL.md": [
          "---",
          "name: challenge-me",
          "description: Stress-test ideas.",
          "---",
          "",
          "# Challenge me",
        ].join("\n"),
        "/home/shan/.hermes/skills/workflow/challenge-me/references/guide.md": "guide",
        "/home/shan/.hermes/skills/workflow/challenge-me/scripts/check.py": "print('ok')",
        "/home/shan/.hermes/skills/software-development/hermes-console-surface-development/SKILL.md": [
          "---",
          "name: hermes-console-surface-development",
          "description: Build Hermes Console surfaces in slices.",
          "---",
          "",
          "# Hermes Console surface development",
        ].join("\n"),
      }),
    });

    expect(result.skills).toHaveLength(2);
    expect(result.skills.map((skill) => skill.id)).toEqual([
      "workflow/challenge-me",
      "software-development/hermes-console-surface-development",
    ]);
    expect(result.skills.find((skill) => skill.id === "software-development/hermes-console-surface-development")).toMatchObject({
      id: "software-development/hermes-console-surface-development",
      category: "software-development",
      name: "hermes-console-surface-development",
      parseStatus: "valid",
    });
    const workflowSkill = result.skills.find((skill) => skill.id === "workflow/challenge-me");
    expect(workflowSkill).toMatchObject({
      id: "workflow/challenge-me",
      category: "workflow",
      description: "Stress-test ideas.",
    });
    expect(workflowSkill?.linkedFiles).toEqual([
      expect.objectContaining({ kind: "reference", relativePath: "references/guide.md" }),
      expect.objectContaining({ kind: "script", relativePath: "scripts/check.py" }),
    ]);
  });

  it("marks malformed skills but still surfaces them", () => {
    const result = readSkillsIndex({
      skillsRoot: "/home/shan/.hermes/skills",
      fileSystem: createFileSystem({
        "/home/shan/.hermes/skills/workflow/bad-skill/SKILL.md": "# No frontmatter here",
      }),
    });

    expect(result.skills).toHaveLength(1);
    expect(result.skills[0]).toMatchObject({
      id: "workflow/bad-skill",
      name: "bad-skill",
      description: "No description found in SKILL.md.",
      parseStatus: "malformed",
    });
  });

  it("returns an empty list for missing skills roots", () => {
    const result = readSkillsIndex({
      skillsRoot: "/missing/skills",
      fileSystem: createFileSystem({}),
    });

    expect(result.skills).toEqual([]);
  });

  it("prioritises workspace and workflow when sorting categories", () => {
    expect(["workflow", "workspace", "software-development", "research"].sort(compareSkillCategories)).toEqual([
      "workspace",
      "workflow",
      "research",
      "software-development",
    ]);
  });
});
