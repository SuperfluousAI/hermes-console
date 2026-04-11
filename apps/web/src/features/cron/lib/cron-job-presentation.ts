import type { HermesCronJobSummary } from '@hermes-console/runtime';

type CronJobBadge = {
  className: string;
  label: string;
};

export function getCronJobDisplayState(job: HermesCronJobSummary): string {
  if (!job.enabled) {
    return 'disabled';
  }

  if (job.state === 'paused' || job.pausedAt || job.pausedReason) {
    return 'paused';
  }

  return job.lastStatus ?? job.state ?? 'unknown';
}

export function getCronJobStateBadge(job: HermesCronJobSummary): CronJobBadge | null {
  const displayState = getCronJobDisplayState(job);

  if (displayState === 'paused') {
    return {
      label: 'paused',
      className: 'border-amber-500/30 bg-amber-500/10 text-amber-200'
    };
  }

  if (displayState === 'disabled') {
    return {
      label: 'disabled',
      className: 'border-border/80 bg-bg/40 text-fg-muted'
    };
  }

  if (job.attentionLevel === 'critical' || job.statusTone === 'error') {
    return {
      label: 'failing',
      className: 'border-red-500/30 bg-red-500/10 text-red-200'
    };
  }

  if (job.attentionLevel === 'warning' || job.statusTone === 'warning') {
    return {
      label: 'attention',
      className: 'border-amber-500/30 bg-amber-500/10 text-amber-200'
    };
  }

  if (displayState === 'running' || displayState === 'pending') {
    return {
      label: displayState,
      className: 'border-amber-500/30 bg-amber-500/10 text-amber-200'
    };
  }

  return null;
}

export function getCronOutputBadge(job: HermesCronJobSummary): CronJobBadge | null {
  if (job.latestOutputState === 'silent') {
    return {
      label: 'silent',
      className: 'border-border/80 bg-bg/40 text-fg-muted'
    };
  }

  if (job.latestOutputState === 'missing') {
    return {
      label: 'no output',
      className: 'border-amber-500/30 bg-amber-500/10 text-amber-200'
    };
  }

  return null;
}
