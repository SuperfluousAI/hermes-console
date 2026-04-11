import { Link } from '@tanstack/react-router';

import { EmptyState } from '@/components/ui/empty-state';
import type { HermesCronJobSummary } from '@hermes-console/runtime';

type CalendarOccurrence = {
  job: HermesCronJobSummary;
  scheduledAt: Date;
};

type DayColumn = {
  date: Date;
  label: string;
  occurrences: CalendarOccurrence[];
};

const DAYS_TO_SHOW = 7;

function isSameDay(left: Date, right: Date) {
  return (
    left.getFullYear() === right.getFullYear() &&
    left.getMonth() === right.getMonth() &&
    left.getDate() === right.getDate()
  );
}

function formatDayLabel(date: Date) {
  return `${date.toLocaleDateString(undefined, { weekday: 'short' })} ${date.getDate()}`;
}

function formatTime(date: Date) {
  return date.toLocaleTimeString(undefined, {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });
}

function buildDayColumns(jobs: HermesCronJobSummary[]) {
  const now = new Date();
  const startOfToday = new Date(now);
  startOfToday.setHours(0, 0, 0, 0);

  const occurrences = jobs
    .flatMap((job) =>
      job.upcomingRuns.map((run) => ({
        job,
        scheduledAt: new Date(run.scheduledAt)
      }))
    )
    .filter((occurrence) => !Number.isNaN(occurrence.scheduledAt.getTime()))
    .sort((left, right) => left.scheduledAt.getTime() - right.scheduledAt.getTime());

  return Array.from({ length: DAYS_TO_SHOW }).map((_, index) => {
    const date = new Date(startOfToday);
    date.setDate(startOfToday.getDate() + index);

    return {
      date,
      label: formatDayLabel(date),
      occurrences: occurrences.filter((occurrence) => isSameDay(occurrence.scheduledAt, date))
    } satisfies DayColumn;
  });
}

export function CronCalendar({ jobs }: { jobs: HermesCronJobSummary[] }) {
  const columns = buildDayColumns(jobs);
  const totalOccurrences = columns.reduce((sum, column) => sum + column.occurrences.length, 0);

  if (totalOccurrences === 0) {
    return (
      <EmptyState
        eyebrow="No runs"
        title="No upcoming runs in the next 7 days"
        description="The current filters may exclude enabled jobs, or the selected jobs do not have upcoming runs in the visible window."
      />
    );
  }

  return (
    <section className="rounded-lg border border-border bg-surface/70 p-4">
      <div className="mb-4">
        <h3 className="font-[family-name:var(--font-bricolage)] text-base font-semibold text-fg-strong">
          Scheduled calendar
        </h3>
        <p className="mt-2 text-sm leading-6 text-fg-muted">The next 7 days of upcoming cron occurrences.</p>
      </div>

      <div className="hidden gap-3 lg:grid lg:grid-cols-7">
        {columns.map((column) => {
          const isToday = isSameDay(column.date, new Date());

          return (
            <div
              key={column.date.toISOString()}
              className={[
                'flex min-h-[12rem] flex-col rounded-lg border p-3',
                isToday ? 'border-accent/35 bg-accent/6' : 'border-border/70 bg-bg/30'
              ].join(' ')}
            >
              <p className={['text-center text-xs font-medium', isToday ? 'text-accent' : 'text-fg-muted'].join(' ')}>
                {column.label}
              </p>
              <div className="mt-3 flex flex-col gap-2">
                {column.occurrences.length === 0 ? (
                  <p className="py-6 text-center text-[11px] text-fg-faint">No runs</p>
                ) : (
                  column.occurrences.map((occurrence) => (
                    <Link
                      key={`${occurrence.job.summaryId}:${occurrence.scheduledAt.toISOString()}`}
                      params={{
                        agentId: occurrence.job.agentId,
                        jobId: occurrence.job.jobId
                      }}
                      to="/cron/$agentId/$jobId"
                      className="rounded-md border border-border/70 bg-surface/80 p-2 transition-colors hover:border-accent/35 hover:bg-accent/5"
                    >
                      <p className="font-mono text-[10px] text-fg-faint">{formatTime(occurrence.scheduledAt)}</p>
                      <p className="mt-1 text-xs text-fg-strong">{occurrence.job.name}</p>
                      <p className="mt-1 text-[11px] text-fg-muted">{occurrence.job.agentLabel}</p>
                    </Link>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="space-y-3 lg:hidden">
        {columns.map((column) => (
          <div key={column.date.toISOString()} className="rounded-lg border border-border/70 bg-bg/30 p-3">
            <p className="text-sm font-medium text-fg-strong">{column.label}</p>
            <div className="mt-3 space-y-2">
              {column.occurrences.length === 0 ? (
                <p className="text-xs text-fg-faint">No runs</p>
              ) : (
                column.occurrences.map((occurrence) => (
                  <Link
                    key={`${occurrence.job.summaryId}:${occurrence.scheduledAt.toISOString()}`}
                    params={{
                      agentId: occurrence.job.agentId,
                      jobId: occurrence.job.jobId
                    }}
                    to="/cron/$agentId/$jobId"
                    className="flex items-start justify-between gap-3 rounded-md border border-border/70 bg-surface/80 p-2 transition-colors hover:border-accent/35 hover:bg-accent/5"
                  >
                    <div className="min-w-0">
                      <p className="text-sm text-fg-strong">{occurrence.job.name}</p>
                      <p className="mt-1 text-xs text-fg-muted">{occurrence.job.agentLabel}</p>
                    </div>
                    <span className="shrink-0 font-mono text-[11px] text-fg-faint">{formatTime(occurrence.scheduledAt)}</span>
                  </Link>
                ))
              )}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
