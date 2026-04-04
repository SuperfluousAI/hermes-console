export type SkillParseStatus = "valid" | "malformed";
export type SkillLinkedFileKind = "reference" | "template" | "script" | "asset";

export type SkillLinkedFileSummary = {
  id: string;
  kind: SkillLinkedFileKind;
  relativePath: string;
  absolutePath: string;
};

export type SkillSummary = {
  id: string;
  slug: string;
  name: string;
  description: string;
  category: string;
  skillPath: string;
  parseStatus: SkillParseStatus;
  linkedFiles: SkillLinkedFileSummary[];
};

export type SkillsIndexResult = {
  skillsRoot: string;
  skills: SkillSummary[];
};

export type SkillDetail = {
  summary: SkillSummary;
  rawContent: string;
  body: string;
  frontmatter: Record<string, string>;
  selectedLinkedFile: SkillLinkedFileSummary | null;
  selectedLinkedFileContent: string | null;
};
