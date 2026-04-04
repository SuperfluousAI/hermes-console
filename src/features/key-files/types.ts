export type KeyFileScope = "hermes_root" | "workspace_root";
export type KeyFileKind = "memory" | "identity" | "instruction";

export type KeyFileSummary = {
  id: string;
  path: string;
  name: string;
  scope: KeyFileScope;
  relativePath: string;
  kind: KeyFileKind;
  fileSize: number;
  lastModifiedMs: number;
};

export type KeyFilesDiscoveryResult = {
  roots: {
    hermesRoot: string;
    workspaceRoot: string;
  };
  files: KeyFileSummary[];
};
