export type UsageWindowId = "1d" | "7d" | "30d";

export type UsageSessionRecord = {
  id: string;
  agentId: string;
  agentLabel: string;
  model: string | null;
  startedAt: string;
  endedAt: string | null;
  inputTokens: number;
  outputTokens: number;
  cacheReadTokens: number;
  cacheWriteTokens: number;
  reasoningTokens: number;
  totalTokens: number;
  estimatedCostUsd: number | null;
  costStatus: string | null;
};

export type UsageBreakdownRow = {
  key: string;
  label: string;
  sessions: number;
  inputTokens: number;
  outputTokens: number;
  cacheReadTokens: number;
  cacheWriteTokens: number;
  reasoningTokens: number;
  totalTokens: number;
  estimatedCostUsd: number;
};

export type UsageWindowSummary = {
  id: UsageWindowId;
  label: string;
  days: number;
  sessionCount: number;
  inputTokens: number;
  outputTokens: number;
  cacheReadTokens: number;
  cacheWriteTokens: number;
  reasoningTokens: number;
  totalTokens: number;
  estimatedCostUsd: number;
  topModel: UsageBreakdownRow | null;
  topAgent: UsageBreakdownRow | null;
  byModel: UsageBreakdownRow[];
  byAgent: UsageBreakdownRow[];
};

export type HermesUsageSummary = {
  loadedAt: string;
  windows: UsageWindowSummary[];
  availableWindows: UsageWindowId[];
};
