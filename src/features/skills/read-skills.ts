import path from "node:path";

import { nodeSkillsFileSystem } from "@/features/skills/node-skills-file-system";
import { readSkillsIndex } from "@/features/skills/read-skills-index";
import { resolveInventoryPathConfigFromEnv } from "@/features/inventory/resolve-path-config";

export function readHermesSkills() {
  const paths = resolveInventoryPathConfigFromEnv();

  return readSkillsIndex({
    skillsRoot: path.join(paths.hermesRoot.path, "skills"),
    fileSystem: nodeSkillsFileSystem,
  });
}
