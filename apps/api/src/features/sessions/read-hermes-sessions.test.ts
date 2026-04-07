import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const {
  readCronJobIndexResultMock,
  readHermesInstallationMock,
  readMessagingSessionsResultMock,
  readStateDbSessionsResultMock,
} = vi.hoisted(() => ({
  readCronJobIndexResultMock: vi.fn(),
  readHermesInstallationMock: vi.fn(),
  readMessagingSessionsResultMock: vi.fn(),
  readStateDbSessionsResultMock: vi.fn(),
}));

vi.mock("@/features/inventory/read-installation", () => ({
  readHermesInstallation: readHermesInstallationMock,
}));

vi.mock("@/features/sessions/node-session-sources", () => ({
  readMessagingSessionsResult: readMessagingSessionsResultMock,
  readStateDbSessionsResult: readStateDbSessionsResultMock,
}));

vi.mock("@/features/sessions/read-cron-job-index", () => ({
  readCronJobIndexResult: readCronJobIndexResultMock,
}));

import { readHermesSessionsResult } from "@/features/sessions/read-hermes-sessions";

const createPresence = ({
  sessions = false,
  stateDb = false,
}: {
  sessions?: boolean;
  stateDb?: boolean;
}) => ({
  config: false,
  memory: false,
  sessions,
  cron: false,
  skills: false,
  stateDb,
});

describe("readHermesSessionsResult", () => {
  beforeEach(() => {
    readCronJobIndexResultMock.mockReturnValue({
      data: [],
      issues: [],
    });
    readStateDbSessionsResultMock.mockReturnValue({
      data: [],
      issues: [],
    });
    readMessagingSessionsResultMock.mockReturnValue({
      data: [],
      issues: [],
    });
  });

  afterEach(() => {
    readCronJobIndexResultMock.mockReset();
    readHermesInstallationMock.mockReset();
    readMessagingSessionsResultMock.mockReset();
    readStateDbSessionsResultMock.mockReset();
  });

  it("includes messaging-only sessions for agents without state.db", () => {
    readHermesInstallationMock.mockReturnValue({
      agents: [
        {
          id: "discord",
          label: "Discord",
          rootPath: "/tmp/hermes/profiles/discord",
          source: "profile",
          presence: createPresence({
            sessions: true,
            stateDb: false,
          }),
          isAvailable: true,
        },
      ],
    });
    readMessagingSessionsResultMock.mockReturnValue({
      data: [
        {
          sessionKey: "discord:thread-1",
          sessionId: "session-1",
          createdAt: "2026-04-07T09:00:00.000Z",
          updatedAt: "2026-04-07T09:30:00.000Z",
          displayName: "Ops thread",
          platform: "discord",
          chatType: "thread",
          totalTokens: 42,
          estimatedCostUsd: 0.12,
          costStatus: "estimated",
          memoryFlushed: false,
          origin: null,
        },
      ],
      issues: [],
    });

    const result = readHermesSessionsResult();

    expect(result.issues).toEqual([]);
    expect(result.data.agentCount).toBe(1);
    expect(result.data.agentsWithSessions).toBe(1);
    expect(result.data.sessions).toEqual([
      expect.objectContaining({
        agentId: "discord",
        title: "Ops thread",
        source: null,
        sourceLabel: "discord thread",
        startedAt: "2026-04-07T09:00:00.000Z",
        lastActivityAt: "2026-04-07T09:30:00.000Z",
        totalTokens: 42,
        hasStateTranscript: false,
        hasMessagingMetadata: true,
      }),
    ]);
  });

  it("reports messaging-only sessions that do not include timestamps", () => {
    readHermesInstallationMock.mockReturnValue({
      agents: [
        {
          id: "telegram",
          label: "Telegram",
          rootPath: "/tmp/hermes/profiles/telegram",
          source: "profile",
          presence: createPresence({
            sessions: true,
            stateDb: false,
          }),
          isAvailable: true,
        },
      ],
    });
    readMessagingSessionsResultMock.mockReturnValue({
      data: [
        {
          sessionKey: "telegram:chat-1",
          sessionId: "session-2",
          createdAt: null,
          updatedAt: null,
          displayName: "No timestamps",
          platform: "telegram",
          chatType: "dm",
          totalTokens: 0,
          estimatedCostUsd: null,
          costStatus: null,
          memoryFlushed: null,
          origin: null,
        },
      ],
      issues: [],
    });

    const result = readHermesSessionsResult();

    expect(result.data.sessions).toEqual([]);
    expect(result.issues).toEqual([
      expect.objectContaining({
        code: "parse_failed",
        id: "sessions-messaging-timeline-missing-telegram",
      }),
    ]);
  });
});
