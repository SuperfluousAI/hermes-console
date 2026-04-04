export const DEFAULT_MEMORY_CHAR_LIMIT = 2200;
export const DEFAULT_USER_CHAR_LIMIT = 1375;

export type MemoryScope = "memory" | "user";
export type MemoryLimitSource = "config" | "default";
export type MemoryReadStatus = "ready" | "partial" | "missing";
export type MemoryPressureLevel =
  | "healthy"
  | "approaching_limit"
  | "near_limit"
  | "at_limit";

export type MemoryEntry = {
  id: string;
  content: string;
  charCount: number;
};

export type MemoryLimitSummary = {
  value: number;
  source: MemoryLimitSource;
};

export type MemoryFileSummary = {
  scope: MemoryScope;
  label: string;
  filePath: string;
  exists: boolean;
  rawContent: string;
  preamble: string;
  entries: MemoryEntry[];
  charCount: number;
  limit: number;
  usageRatio: number;
  usagePercentage: number;
  pressureLevel: MemoryPressureLevel;
};

export type MemoryReadResult = {
  status: MemoryReadStatus;
  rootPath: string;
  configPath: string;
  limits: {
    memory: MemoryLimitSummary;
    user: MemoryLimitSummary;
  };
  files: {
    memory: MemoryFileSummary;
    user: MemoryFileSummary;
  };
};
