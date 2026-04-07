import { readHermesInstallation } from '@/features/inventory/read-installation';
import { createParseFailedIssue } from '@/lib/query-issue-factories';
import {
  applyCronJobNames,
  combineAgentSessions,
  type SessionAgentRef,
  type HermesSessionsIndex
} from '@/features/sessions/read-sessions';
import { readMessagingSessionsResult, readStateDbSessionsResult } from '@/features/sessions/node-session-sources';
import { readCronJobIndexResult } from '@/features/sessions/read-cron-job-index';
import { createReadResult, type ReadResult } from '@/lib/read-result';
import type { HermesQueryIssue } from '@hermes-console/runtime';

function compareByLastActivity(left: { lastActivityAt: string }, right: { lastActivityAt: string }) {
  return new Date(right.lastActivityAt).getTime() - new Date(left.lastActivityAt).getTime();
}

export function readHermesSessionsResult(): ReadResult<HermesSessionsIndex> {
  const installation = readHermesInstallation();
  const agents = installation.agents.filter((agent) => agent.presence.stateDb || agent.presence.sessions);
  const issues: HermesQueryIssue[] = [];

  const sessions = agents
    .flatMap((agent) => {
      const agentRef: SessionAgentRef = {
        id: agent.id,
        label: agent.label,
        rootPath: agent.rootPath,
        source: agent.source
      };

      const stateSessions = readStateDbSessionsResult(agent.rootPath);
      const messagingSessions = readMessagingSessionsResult(agent.rootPath);
      const cronJobs = readCronJobIndexResult(agent.rootPath);
      const stateSessionIds = new Set(stateSessions.data.map((session) => session.id));
      const messagingOnlySessionsWithoutTimeline = messagingSessions.data.filter(
        (session) => !stateSessionIds.has(session.sessionId) && session.createdAt == null && session.updatedAt == null
      );

      issues.push(...stateSessions.issues, ...messagingSessions.issues, ...cronJobs.issues);
      if (messagingOnlySessionsWithoutTimeline.length > 0) {
        issues.push(
          createParseFailedIssue({
            id: `sessions-messaging-timeline-missing-${agent.id}`,
            summary: 'Dropped messaging sessions without timestamps',
            detail: `Dropped ${messagingOnlySessionsWithoutTimeline.length} messaging-only session${messagingOnlySessionsWithoutTimeline.length === 1 ? '' : 's'} because neither created_at nor updated_at was available.`,
            path: `${agent.rootPath}/sessions/sessions.json`
          })
        );
      }

      return applyCronJobNames({
        sessions: combineAgentSessions({
          agent: agentRef,
          stateSessions: stateSessions.data,
          messagingSessions: messagingSessions.data
        }),
        cronJobs: cronJobs.data
      });
    })
    .sort(compareByLastActivity);

  return createReadResult({
    data: {
      sessions,
      agentCount: installation.agents.length,
      agentsWithSessions: new Set(sessions.map((session) => session.agentId)).size
    },
    issues
  });
}
