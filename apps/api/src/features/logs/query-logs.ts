import path from 'node:path';

import { readHermesInstallationResult } from '@/features/inventory/read-installation';
import { readHermesLogDetailResult, readHermesLogsResult } from '@/features/logs/read-logs';
import { createHermesQueryResult } from '@hermes-console/runtime';
import type { HermesLogDetail, HermesLogsIndex, HermesQueryIssue, HermesQueryResult } from '@hermes-console/runtime';

export function readHermesLogsQuery(): HermesQueryResult<HermesLogsIndex> {
  const installation = readHermesInstallationResult();
  const logs = readHermesLogsResult();
  const issues: HermesQueryIssue[] = [...installation.issues, ...logs.issues];
  const logsRoot = path.join(installation.data.paths.hermesRoot.path, 'logs');

  if (!installation.data.hermesRootExists) {
    issues.push({
      id: 'logs-hermes-root-missing',
      code: 'missing_path',
      severity: 'error',
      summary: 'Hermes root not found',
      detail: 'Log files could not be aggregated because the configured Hermes root does not exist.',
      path: installation.data.paths.hermesRoot.path
    });
  } else if (logs.data.logs.length === 0) {
    issues.push({
      id: 'logs-sources-missing',
      code: 'missing_path',
      severity: 'warning',
      summary: 'No log files found',
      detail: 'Hermes Console did not find any `.log` files under the Hermes logs directory.',
      path: logsRoot
    });
  }

  return createHermesQueryResult({
    data: logs.data,
    capturedAt: new Date().toISOString(),
    status:
      !installation.data.hermesRootExists || logs.data.logs.length === 0
        ? 'missing'
        : issues.length > 0 || installation.data.status === 'partial'
          ? 'partial'
          : 'ready',
    issues
  });
}

export function readHermesLogDetailQuery({
  lines,
  logId
}: {
  lines: number;
  logId: string;
}): HermesQueryResult<HermesLogDetail> | null {
  const detail = readHermesLogDetailResult({
    lines,
    logId
  });

  if (!detail) {
    return null;
  }

  return createHermesQueryResult({
    data: detail.data,
    capturedAt: new Date().toISOString(),
    status: detail.issues.length > 0 ? 'partial' : 'ready',
    issues: detail.issues
  });
}
