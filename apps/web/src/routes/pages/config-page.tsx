import { useState } from 'react';
import { useSuspenseQuery } from '@tanstack/react-query';

import { QueryStatusCard } from '@/components/ui/query-status-card';
import { configQueryOptions } from '@/lib/api';

type ViewMode = 'pretty' | 'raw';

export function ConfigPage() {
  const query = useSuspenseQuery(configQueryOptions());
  const [view, setView] = useState<ViewMode>('pretty');
  const data = query.data.data;

  const configEntries = data.entries.filter((e) => e.source === 'config.yaml');
  const envEntries = data.entries.filter((e) => e.source === '.env');

  // Group config entries by section
  const sections = new Map<string, typeof configEntries>();
  for (const entry of configEntries) {
    const section = entry.section ?? 'root';
    if (!sections.has(section)) sections.set(section, []);
    sections.get(section)!.push(entry);
  }

  return (
    <div className="space-y-6">
      <QueryStatusCard title="Config read quality" status={query.data.meta.dataStatus} issues={query.data.issues} />

      {/* Header with view toggle */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-[family-name:var(--font-bricolage)] text-lg font-semibold text-fg-strong">
            Configuration
          </h2>
          <p className="mt-1 text-sm text-fg-muted">
            Hermes runtime config and environment variables. Env values are always masked.
          </p>
        </div>
        <div className="flex rounded-lg border border-border bg-bg/40 p-0.5">
          <button
            onClick={() => setView('pretty')}
            className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
              view === 'pretty' ? 'bg-surface text-fg-strong shadow-sm' : 'text-fg-muted hover:text-fg-strong'
            }`}
          >
            Pretty
          </button>
          <button
            onClick={() => setView('raw')}
            className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
              view === 'raw' ? 'bg-surface text-fg-strong shadow-sm' : 'text-fg-muted hover:text-fg-strong'
            }`}
          >
            Raw
          </button>
        </div>
      </div>

      {view === 'pretty' ? (
        <div className="space-y-6">
          {/* Config sections */}
          {Array.from(sections.entries()).map(([section, entries]) => (
            <section key={section} className="rounded-xl border border-border bg-surface/70 p-4">
              <h3 className="mb-3 font-mono text-[11px] uppercase tracking-[0.18em] text-fg-faint">{section}</h3>
              <div className="space-y-1">
                {entries.map((entry) => (
                  <div key={entry.key} className="flex items-start gap-3 rounded-lg px-3 py-2 hover:bg-bg/40">
                    <code className="min-w-0 shrink-0 text-xs text-fg-muted">{entry.key}</code>
                    <code className="min-w-0 break-all text-xs text-fg-strong">{entry.value}</code>
                  </div>
                ))}
              </div>
            </section>
          ))}

          {/* Env vars */}
          {envEntries.length > 0 && (
            <section className="rounded-xl border border-border bg-surface/70 p-4">
              <h3 className="mb-3 font-mono text-[11px] uppercase tracking-[0.18em] text-fg-faint">.env</h3>
              <div className="space-y-1">
                {envEntries.map((entry) => (
                  <div key={entry.key} className="flex items-start gap-3 rounded-lg px-3 py-2 hover:bg-bg/40">
                    <code className="min-w-0 shrink-0 text-xs text-fg-muted">{entry.key}</code>
                    <code className="min-w-0 text-xs text-fg-faint">{entry.value}</code>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          {/* Raw config.yaml */}
          <section className="rounded-xl border border-border bg-surface/70 p-4">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="font-mono text-[11px] uppercase tracking-[0.18em] text-fg-faint">config.yaml</h3>
              <span className="text-xs text-fg-faint">{data.configPath}</span>
            </div>
            <pre className="max-h-[600px] overflow-auto rounded-lg bg-bg/60 p-4 font-mono text-xs leading-5 text-fg-strong">
              {data.rawConfig ?? 'File not found'}
            </pre>
          </section>

          {/* Raw .env (masked) */}
          <section className="rounded-xl border border-border bg-surface/70 p-4">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="font-mono text-[11px] uppercase tracking-[0.18em] text-fg-faint">.env</h3>
              <span className="text-xs text-fg-faint">{data.envPath}</span>
            </div>
            <pre className="max-h-[600px] overflow-auto rounded-lg bg-bg/60 p-4 font-mono text-xs leading-5 text-fg-strong">
              {data.rawEnv ?? 'File not found'}
            </pre>
          </section>
        </div>
      )}
    </div>
  );
}
