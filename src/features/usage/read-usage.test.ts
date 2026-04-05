import { describe, expect, it, vi } from "vitest";

vi.mock("@/features/inventory/read-installation", () => ({
  readHermesInstallation: vi.fn(),
}));

vi.mock("@/features/sessions/node-session-sources", () => ({
  readStateDbSessions: vi.fn(),
}));

import { readHermesInstallation } from "@/features/inventory/read-installation";
import { readStateDbSessions } from "@/features/sessions/node-session-sources";
import { readHermesUsage } from "@/features/usage/read-usage";

function createStateSession(overrides: Record<string, unknown> = {}) {
  return {
    id: "session-1",
    source: "discord",
    userId: "user-1",
    model: "gpt-5.4",
    parentSessionId: null,
    startedAt: "2026-04-05T10:00:00.000Z",
    endedAt: "2026-04-05T10:05:00.000Z",
    endReason: "completed",
    messageCount: 12,
    toolCallCount: 3,
    inputTokens: 1000,
    outputTokens: 200,
    cacheReadTokens: 300,
    cacheWriteTokens: 0,
    reasoningTokens: 50,
    estimatedCostUsd: 0.42,
    actualCostUsd: null,
    costStatus: "estimated",
    title: "hello",
    ...overrides,
  };
}

describe("readHermesUsage", () => {
  it("aggregates token and estimated-cost windows by model and agent", () => {
    vi.mocked(readHermesInstallation).mockReturnValue({
      agents: [
        { id: "default", label: "Default", rootPath: "/tmp/default", presence: { stateDb: true } },
        { id: "nigel", label: "Nigel", rootPath: "/tmp/nigel", presence: { stateDb: true } },
      ],
    } as never);

    vi.mocked(readStateDbSessions).mockImplementation((rootPath: string) => {
      if (rootPath === "/tmp/default") {
        return [
          createStateSession({ id: "recent-1", model: "gpt-5.4", startedAt: "2026-04-05T08:00:00.000Z", inputTokens: 1000, outputTokens: 100, cacheReadTokens: 50, reasoningTokens: 10, estimatedCostUsd: 0.25 }),
          createStateSession({ id: "week-1", model: "gpt-4.1", startedAt: "2026-04-02T08:00:00.000Z", inputTokens: 2000, outputTokens: 200, cacheReadTokens: 0, reasoningTokens: 20, estimatedCostUsd: 0.75 }),
        ] as never;
      }

      return [
        createStateSession({ id: "month-1", model: "gpt-5.4", startedAt: "2026-03-15T08:00:00.000Z", inputTokens: 500, outputTokens: 50, cacheReadTokens: 25, reasoningTokens: 5, estimatedCostUsd: 0.1 }),
      ] as never;
    });

    const usage = readHermesUsage(new Date("2026-04-05T12:00:00.000Z"));
    const oneDay = usage.windows.find((window) => window.id === "1d");
    const sevenDay = usage.windows.find((window) => window.id === "7d");
    const thirtyDay = usage.windows.find((window) => window.id === "30d");

    expect(oneDay).toMatchObject({
      sessionCount: 1,
      totalTokens: 1160,
      estimatedCostUsd: 0.25,
      topModel: { label: "gpt-5.4", totalTokens: 1160 },
      topAgent: { label: "Default", totalTokens: 1160 },
    });

    expect(sevenDay).toMatchObject({
      sessionCount: 2,
      totalTokens: 3380,
      estimatedCostUsd: 1,
    });

    expect(thirtyDay).toMatchObject({
      sessionCount: 3,
      totalTokens: 3960,
      estimatedCostUsd: 1.1,
    });

    expect(thirtyDay?.byModel[0]).toMatchObject({ label: "gpt-4.1", totalTokens: 2220 });
    expect(thirtyDay?.byModel[1]).toMatchObject({ label: "gpt-5.4", totalTokens: 1740 });
  });

  it("returns zeroed windows when no state db sessions exist", () => {
    vi.mocked(readHermesInstallation).mockReturnValue({ agents: [] } as never);
    vi.mocked(readStateDbSessions).mockReturnValue([] as never);

    const usage = readHermesUsage(new Date("2026-04-05T12:00:00.000Z"));

    expect(usage.windows.every((window) => window.totalTokens === 0 && window.estimatedCostUsd === 0)).toBe(true);
  });
});
