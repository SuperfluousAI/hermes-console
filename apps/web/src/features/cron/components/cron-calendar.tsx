import { Link } from '@tanstack/react-router';

import { EmptyState } from '@/components/ui/empty-state';
import type { HermesCronJobSummary } from '@hermes-console/runtime';

type CalendarOccurrence = {
  job: HermesCronJobSummary;
  scheduledAt: Date;
};

type CalendarOccurrenceGroup = {
  job: HermesCronJobSummary;
  times: Date[];
};

type DayColumn = {
  date: Date;
  groups: CalendarOccurrenceGroup[];
  label: string;
  occurrenceCount: number;
};

const DAYS_TO_SHOW = 7;

function isSameDay(left: Date, right: Date): boolean {
  return (
    left.getFullYear() === right.getFullYear() &&
    left.getMonth() === right.getMonth() &&
    left.getDate() === right.getDate()
  );
}

function formatDayLabel(date: Date): string {
  return `${date.toLocaleDateString(undefined, { weekday: 'short' })} ${date.getDate()}`;
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString(undefined, {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });
}

function formatRunWindow(times: Date[]): string {
  if (times.length === 0) {
    return '—';
  }

  if (times.length === 1) {
    return formatTime(times[0]!);
  }

  return `${formatTime(times[0]!)}–${formatTime(times.at(-1)!)} · ${times.length} runs`;
}

function formatCadenceHint(times: Date[]): string | null {
  if (times.length < 2) {
    return null;
  }

  const firstDeltaMinutes = Math.round((times[1]!.getTime() - times[0]!.getTime()) / 60_000);

  if (firstDeltaMinutes <= 0) {
    return null;
  }

  const isStableCadence = times.slice(1).every((time, index) => {
    const previous = times[index];

    if (!previous) {
      return true;
    }

    return Math.round((time.getTime() - previous.getTime()) / 60_000) === firstDeltaMinutes;
  });

  if (!isStableCadence) {
    return null;
  }

  if (firstDeltaMinutes < 60) {
    return `every ${firstDeltaMinutes}m`;
  }

  if (firstDeltaMinutes % 60 === 0) {
    return `every ${firstDeltaMinutes / 60}h`;
  }

  return `every ${firstDeltaMinutes}m`;
}

function buildDayColumns(jobs: HermesCronJobSummary[]): DayColumn[] {
  const now = new Date();
  const startOfToday = new Date(now);
  startOfToday.setHours(0, 0, 0, 0);

  const occurrences: CalendarOccurrence[] = jobs
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

    const dayOccurrences = occurrences.filter((occurrence) => isSameDay(occurrence.scheduledAt, date));
    const grouped = dayOccurrences.reduce<Map<string, CalendarOccurrenceGroup>>((groups, occurrence) => {
      const existingGroup = groups.get(occurrence.job.summaryId);

      if (!existingGroup) {
        groups.set(occurrence.job.summaryId, {
          job: occurrence.job,
          times: [occurrence.scheduledAt]
        });
        return groups;
      }

      existingGroup.times.push(occurrence.scheduledAt);
      return groups;
    }, new Map());

    return {
      date,
      groups: Array.from(grouped.values()),
      label: formatDayLabel(date),
      occurrenceCount: dayOccurrences.length
    } satisfies DayColumn;
  });
}

function DayGroupCard({ group }: { group: CalendarOccurrenceGroup }) {
  const cadenceHint = formatCadenceHint(group.times);

  return (
    <Link
      params={{
        agentId: group.job.agentId,
        jobId: group.job.jobId
      }}
      to="/cron/$agentId/$jobId"
      className="rounded-md border border-border/70 bg-surface/80 p-2 transition-colors hover:border-accent/35 hover:bg-accent/5"
    >
      <p className="font-mono text-[10px] text-fg-faint">{formatRunWindow(group.times)}</p>
      <p className="mt-1 text-xs text-fg-strong">{group.job.name}</p>
      <p className="mt-1 text-[11px] text-fg-muted">
        {cadenceHint ? `${cadenceHint} · ` : ''}
        {group.job.agentLabel}
      </p>
    </Link>
  );
}

export function CronCalendar({ jobs }: { jobs: HermesCronJobSummary[] }) {
  const columns = buildDayColumns(jobs);
  const totalOccurrences = columns.reduce((sum, column) => sum + column.occurrenceCount, 0);

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
        <p className="mt-2 text-sm leading-6 text-fg-muted">
          The next 7 days of cron activity, grouped by job within each day so repeated schedules stay legible.
        </p>
      </div>

      <div className="hidden overflow-x-auto pb-1 lg:block">
        <div className="grid min-w-[88rem] gap-3 lg:grid-cols-7">
          {columns.map((column) => {
            const isToday = isSameDay(column.date, new Date());

            return (
              <div
                key={column.date.toISOString()}
                className={[
                  'flex min-h-[36rem] flex-col rounded-lg border p-3',
                  isToday ? 'border-accent/35 bg-accent/6' : 'border-border/70 bg-bg/30'
                ].join(' ')}
              >
                <div className="border-b border-border/50 pb-2">
                  <p
                    className={['text-center text-xs font-medium', isToday ? 'text-accent' : 'text-fg-muted'].join(' ')}
                  >
                    {column.label}
                  </p>
                  <p className="mt-1 text-center font-mono text-[10px] text-fg-faint">
                    {column.occurrenceCount} occurrence{column.occurrenceCount === 1 ? '' : 's'}
                  </p>
                </div>
                <div className="mt-3 flex flex-1 flex-col gap-2 overflow-auto pr-1">
                  {column.groups.length === 0 ? (
                    <p className="py-6 text-center text-[11px] text-fg-faint">No runs</p>
                  ) : (
                    column.groups.map((group) => (
                      <DayGroupCard key={`${group.job.summaryId}:${column.date.toISOString()}`} group={group} />
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="space-y-3 lg:hidden">
        {columns.map((column) => (
          <div key={column.date.toISOString()} className="rounded-lg border border-border/70 bg-bg/30 p-3">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-medium text-fg-strong">{column.label}</p>
              <p className="font-mono text-[10px] text-fg-faint">
                {column.occurrenceCount} occurrence{column.occurrenceCount === 1 ? '' : 's'}
              </p>
            </div>
            <div className="mt-3 space-y-2">
              {column.groups.length === 0 ? (
                <p className="text-xs text-fg-faint">No runs</p>
              ) : (
                column.groups.map((group) => (
                  <DayGroupCard key={`${group.job.summaryId}:${column.date.toISOString()}`} group={group} />
                ))
              )}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
