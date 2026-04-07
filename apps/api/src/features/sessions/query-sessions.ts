import path from 'node:path';

import { readHermesInstallationResult } from '@/features/inventory/read-installation';
import { readHermesSessionsResult } from '@/features/sessions/read-hermes-sessions';
import { createHermesQueryResult } from '@hermes-console/runtime';
import type { HermesQueryIssue, HermesQueryResult } from '@hermes-console/runtime';
import type { HermesSessionsIndex } from '@hermes-console/runtime';

export function readHermesSessionsQuery(): HermesQueryResult<HermesSessionsIndex> {
  const capturedAt = new Date().toISOString();
  const installation = readHermesInstallationResult();
  const sessions = readHermesSessionsResult();
  const issues: HermesQueryIssue[] = [...installation.issues, ...sessions.issues];
  const agentsWithSessionSources = installation.data.agents.filter(
    (agent) => agent.presence.stateDb || agent.presence.sessions
  );
  const agentsWithStateDb = installation.data.agents.filter((agent) => agent.presence.stateDb);

  if (!installation.data.hermesRootExists) {
    issues.push({
      id: 'sessions-hermes-root-missing',
      code: 'missing_path',
      severity: 'error',
      summary: 'Hermes root not found',
      detail: 'Session history cannot be read because the configured Hermes root does not exist.',
      path: installation.data.paths.hermesRoot.path
    });
  }

  if (agentsWithSessionSources.length === 0) {
    issues.push({
      id: 'sessions-sources-missing',
      code: 'missing_path',
      severity: installation.data.hermesRootExists ? 'warning' : 'error',
      summary: 'No session sources found',
      detail:
        'Hermes Console did not find any session databases or messaging session indexes under the detected agent roots.',
      lookedFor: installation.data.agents.flatMap((agent) => [
        path.join(agent.rootPath, 'state.db'),
        path.join(agent.rootPath, 'sessions', 'sessions.json')
      ])
    });
  } else if (agentsWithStateDb.length === 0) {
    issues.push({
      id: 'sessions-state-db-missing',
      code: 'missing_path',
      severity: 'info',
      summary: 'No state.db files found',
      detail:
        'Hermes Console found messaging session indexes, but transcript-backed state.db files were not available under the detected agent roots.',
      lookedFor: installation.data.agents.map((agent) => path.join(agent.rootPath, 'state.db'))
    });
  }

  return createHermesQueryResult({
    data: sessions.data,
    capturedAt,
    status:
      !installation.data.hermesRootExists || agentsWithSessionSources.length === 0
        ? 'missing'
        : issues.length > 0 || installation.data.status === 'partial'
          ? 'partial'
          : 'ready',
    issues
  });
}
