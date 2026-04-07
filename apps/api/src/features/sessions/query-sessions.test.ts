import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { InventoryInstallation } from '@hermes-console/runtime';
import type { HermesSessionsIndex } from '@hermes-console/runtime';

const { readHermesInstallationResultMock, readHermesSessionsResultMock } = vi.hoisted(() => ({
  readHermesInstallationResultMock: vi.fn(),
  readHermesSessionsResultMock: vi.fn()
}));

vi.mock('@/features/inventory/read-installation', () => ({
  readHermesInstallationResult: readHermesInstallationResultMock
}));

vi.mock('@/features/sessions/read-hermes-sessions', () => ({
  readHermesSessionsResult: readHermesSessionsResultMock
}));

import { readHermesSessionsQuery } from '@/features/sessions/query-sessions';

const createInstallation = ({
  agents,
  hermesRootExists = true,
  status = 'ready'
}: {
  agents: InventoryInstallation['agents'];
  hermesRootExists?: boolean;
  status?: InventoryInstallation['status'];
}): InventoryInstallation => ({
  paths: {
    hermesRoot: {
      label: 'hermes_root',
      path: '/tmp/hermes',
      kind: 'default',
      envKey: 'HERMES_CONSOLE_HERMES_DIR'
    },
    workspaceRoot: {
      label: 'workspace_root',
      path: '/tmp/workspace',
      kind: 'default',
      envKey: 'HERMES_CONSOLE_WORKSPACE_DIR'
    }
  },
  hermesRootExists,
  profilesRootPath: '/tmp/hermes/profiles',
  profilesRootExists: true,
  agents,
  availableAgentCount: agents.filter((agent) => agent.isAvailable).length,
  status
});

const createAgent = ({
  id,
  rootPath,
  sessions = false,
  stateDb = false
}: {
  id: string;
  rootPath: string;
  sessions?: boolean;
  stateDb?: boolean;
}): InventoryInstallation['agents'][number] => ({
  id,
  label: id,
  rootPath,
  source: 'profile',
  presence: {
    config: false,
    memory: false,
    sessions,
    cron: false,
    skills: false,
    stateDb
  },
  isAvailable: sessions || stateDb
});

const createSessionsIndex = (overrides: Partial<HermesSessionsIndex> = {}): HermesSessionsIndex => ({
  sessions: [],
  agentCount: 0,
  agentsWithSessions: 0,
  ...overrides
});

describe('readHermesSessionsQuery', () => {
  beforeEach(() => {
    readHermesInstallationResultMock.mockReturnValue({
      data: createInstallation({
        agents: [],
        status: 'partial'
      }),
      issues: []
    });
    readHermesSessionsResultMock.mockReturnValue({
      data: createSessionsIndex(),
      issues: []
    });
  });

  afterEach(() => {
    readHermesInstallationResultMock.mockReset();
    readHermesSessionsResultMock.mockReset();
  });

  it('treats messaging-only session sources as partial instead of missing', () => {
    readHermesInstallationResultMock.mockReturnValue({
      data: createInstallation({
        agents: [
          createAgent({
            id: 'discord',
            rootPath: '/tmp/hermes/profiles/discord',
            sessions: true,
            stateDb: false
          })
        ]
      }),
      issues: []
    });
    readHermesSessionsResultMock.mockReturnValue({
      data: createSessionsIndex({
        agentCount: 1,
        agentsWithSessions: 1
      }),
      issues: []
    });

    const result = readHermesSessionsQuery();

    expect(result.status).toBe('partial');
    expect(result.issues).toEqual([
      expect.objectContaining({
        id: 'sessions-state-db-missing',
        code: 'missing_path',
        severity: 'info',
        lookedFor: ['/tmp/hermes/profiles/discord/state.db']
      })
    ]);
  });

  it('reports both expected source paths when no session sources are present', () => {
    readHermesInstallationResultMock.mockReturnValue({
      data: createInstallation({
        agents: [
          createAgent({
            id: 'default',
            rootPath: '/tmp/hermes'
          }),
          createAgent({
            id: 'discord',
            rootPath: '/tmp/hermes/profiles/discord'
          })
        ],
        status: 'partial'
      }),
      issues: []
    });

    const result = readHermesSessionsQuery();

    expect(result.status).toBe('missing');
    expect(result.issues).toEqual([
      expect.objectContaining({
        id: 'sessions-sources-missing',
        code: 'missing_path',
        severity: 'warning',
        lookedFor: [
          '/tmp/hermes/state.db',
          '/tmp/hermes/sessions/sessions.json',
          '/tmp/hermes/profiles/discord/state.db',
          '/tmp/hermes/profiles/discord/sessions/sessions.json'
        ]
      })
    ]);
  });

  it('surfaces a missing hermes root as an error while staying in missing status', () => {
    readHermesInstallationResultMock.mockReturnValue({
      data: createInstallation({
        agents: [
          createAgent({
            id: 'default',
            rootPath: '/tmp/hermes'
          })
        ],
        hermesRootExists: false,
        status: 'missing'
      }),
      issues: []
    });

    const result = readHermesSessionsQuery();

    expect(result.status).toBe('missing');
    expect(result.issues).toEqual([
      expect.objectContaining({
        id: 'sessions-hermes-root-missing',
        code: 'missing_path',
        severity: 'error',
        path: '/tmp/hermes'
      }),
      expect.objectContaining({
        id: 'sessions-sources-missing',
        code: 'missing_path',
        severity: 'error'
      })
    ]);
  });
});
