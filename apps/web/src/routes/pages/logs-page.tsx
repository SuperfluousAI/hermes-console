import { useSuspenseQuery } from '@tanstack/react-query';

import { QueryStatusCard } from '@/components/ui/query-status-card';
import { LogsBrowser } from '@/features/logs/components/logs-browser';
import { apiQueryKeys, logsQueryOptions } from '@/lib/api';

export const LogsPage = () => {
  const query = useSuspenseQuery(logsQueryOptions());

  return (
    <div className="space-y-6">
      <QueryStatusCard title="Log discovery quality" status={query.data.meta.dataStatus} issues={query.data.issues} />
      <LogsBrowser
        logs={query.data.data.logs}
        loadedAt={query.data.meta.capturedAt ?? new Date().toISOString()}
        refreshQueryKeys={[apiQueryKeys.logs]}
      />
    </div>
  );
};
