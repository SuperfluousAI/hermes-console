import { buildCronJobDetail } from '@/features/cron/read-cron';
import { readCronOutputHistoryResult } from '@/features/cron/node-cron-sources';
import { buildObservedRunsByJobId, readHermesCronResult } from '@/features/cron/read-hermes-cron';
import { readStateDbSessionsResult } from '@/features/sessions/node-session-sources';
import { createReadResult, type ReadResult } from '@/lib/read-result';
import type { HermesCronJobDetail } from '@hermes-console/runtime';

export function readHermesCronDetail({
  agentId,
  jobId
}: {
  agentId: string;
  jobId: string;
}): ReadResult<HermesCronJobDetail> | null {
  const index = readHermesCronResult();
  const job = index.data.jobs.find((entry) => entry.agentId === agentId && entry.jobId === jobId);

  if (!job) {
    return null;
  }

  const outputs = readCronOutputHistoryResult(job.agentRootPath);
  const stateSessions = readStateDbSessionsResult(job.agentRootPath);
  const observedRuns = buildObservedRunsByJobId(stateSessions.data);

  return createReadResult({
    data: buildCronJobDetail({
      job,
      outputs: outputs.data.get(jobId) ?? [],
      observedRuns: observedRuns.get(jobId) ?? []
    }),
    issues: [...index.issues, ...outputs.issues, ...stateSessions.issues]
  });
}
