export function inferCronJobId(sessionId: string) {
  const match = sessionId.match(/^cron_([a-f0-9]+)_/i);
  return match?.[1] ?? null;
}
