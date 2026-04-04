import path from "node:path";

import { nodeSkillsFileSystem } from "@/features/skills/node-skills-file-system";
import { readSkillsIndex } from "@/features/skills/read-skills-index";
import type { SkillDetail } from "@/features/skills/types";
import { resolveInventoryPathConfigFromEnv } from "@/features/inventory/resolve-path-config";

function normalizeText(value: string) {
  return value.replace(/\r\n/g, "\n");
}

function stripQuotes(value: string) {
  return value.replace(/^['"]|['"]$/g, "").trim();
}

function parseFrontmatter(rawContent: string) {
  const normalized = normalizeText(rawContent);

  if (!normalized.startsWith("---\n")) {
    return {
      frontmatter: {} as Record<string, string>,
      body: normalized.trim(),
    };
  }

  const closingIndex = normalized.indexOf("\n---\n", 4);

  if (closingIndex === -1) {
    return {
      frontmatter: {} as Record<string, string>,
      body: normalized.trim(),
    };
  }

  const frontmatter: Record<string, string> = {};

  for (const line of normalized.slice(4, closingIndex).split("\n")) {
    const match = line.match(/^([A-Za-z0-9_-]+):\s*(.+)$/);

    if (!match) {
      continue;
    }

    frontmatter[match[1]] = stripQuotes(match[2]);
  }

  return {
    frontmatter,
    body: normalized.slice(closingIndex + 5).trim(),
  };
}

export function readSkillDetail({
  skillId,
  linkedFileId,
}: {
  skillId: string | null;
  linkedFileId?: string | null;
}): SkillDetail | null {
  const paths = resolveInventoryPathConfigFromEnv();
  const skillsRoot = path.join(paths.hermesRoot.path, "skills");
  const index = readSkillsIndex({
    skillsRoot,
    fileSystem: nodeSkillsFileSystem,
  });

  const summary = index.skills.find((skill) => skill.id === skillId) ?? index.skills[0] ?? null;

  if (!summary) {
    return null;
  }

  const skillAbsolutePath = path.join(skillsRoot, summary.skillPath);
  const rawContent = nodeSkillsFileSystem.readTextFile(skillAbsolutePath) ?? "";
  const parsed = parseFrontmatter(rawContent);
  const selectedLinkedFile =
    summary.linkedFiles.find((linkedFile) => linkedFile.id === linkedFileId) ??
    summary.linkedFiles[0] ??
    null;

  return {
    summary,
    rawContent,
    body: parsed.body,
    frontmatter: parsed.frontmatter,
    selectedLinkedFile,
    selectedLinkedFileContent: selectedLinkedFile
      ? nodeSkillsFileSystem.readTextFile(selectedLinkedFile.absolutePath)
      : null,
  };
}
