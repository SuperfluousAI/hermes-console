import { MemoryFilePanel } from "@/features/memory/components/memory-file-panel";
import { MemoryPressureBadge } from "@/features/memory/components/memory-pressure-badge";
import { readHermesMemory } from "@/features/memory/read-memory";
import { InventorySummaryGrid } from "@/features/inventory/components/inventory-summary-grid";
import { createSectionMetadata } from "@/lib/create-section-metadata";

export const metadata = createSectionMetadata(
  "Memory",
  "USER and MEMORY surfaces with usage indicators.",
);

export default function MemoryPage() {
  const memory = readHermesMemory();

  const summaryItems = [
    {
      label: "memory status",
      value:
        memory.status === "ready"
          ? "Both memory files were found and parsed."
          : memory.status === "partial"
            ? "One memory surface exists, but the other is missing."
            : "No memory files were found under the resolved Hermes root.",
      tone: "muted" as const,
    },
    {
      label: "memory usage",
      value: `${memory.files.memory.charCount}/${memory.files.memory.limit} · ${memory.files.memory.usagePercentage}%`,
      tone: "default" as const,
    },
    {
      label: "user usage",
      value: `${memory.files.user.charCount}/${memory.files.user.limit} · ${memory.files.user.usagePercentage}%`,
      tone: "default" as const,
    },
    {
      label: "resolved root",
      value: memory.rootPath,
      tone: "default" as const,
    },
  ];

  return (
    <div className="space-y-8">
      <section className="max-w-3xl">
        <div className="flex flex-wrap items-center gap-3">
          <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-accent">
            Memory
          </p>
          <MemoryPressureBadge
            level={
              memory.files.memory.pressureLevel === "at_limit" ||
              memory.files.user.pressureLevel === "at_limit"
                ? "at_limit"
                : memory.files.memory.pressureLevel === "near_limit" ||
                    memory.files.user.pressureLevel === "near_limit"
                  ? "near_limit"
                  : memory.files.memory.pressureLevel === "approaching_limit" ||
                      memory.files.user.pressureLevel === "approaching_limit"
                    ? "approaching_limit"
                    : "healthy"
            }
          />
        </div>
        <h2 className="mt-3 font-[family-name:var(--font-bricolage)] text-xl font-semibold tracking-tight text-fg-strong sm:text-2xl">
          See what is shaping Hermes before the context gets weird
        </h2>
        <p className="mt-3 text-sm leading-7 text-fg-muted">
          This page now reads the real <span className="font-mono text-xs text-fg">MEMORY.md</span>{" "}
          and <span className="font-mono text-xs text-fg">USER.md</span> files, resolves their
          configured limits from <span className="font-mono text-xs text-fg">config.yaml</span>,
          and flags pressure before the memory budget quietly turns to mush.
        </p>
      </section>

      <InventorySummaryGrid items={summaryItems} />

      <section className="rounded-lg border border-border bg-surface/70 p-4">
        <h3 className="font-[family-name:var(--font-bricolage)] text-base font-semibold text-fg-strong">
          Limit resolution
        </h3>
        <ul className="mt-3 space-y-2 text-sm leading-6 text-fg-muted">
          <li>
            - MEMORY limit: {memory.limits.memory.value} ({memory.limits.memory.source})
          </li>
          <li>
            - USER limit: {memory.limits.user.value} ({memory.limits.user.source})
          </li>
          <li>
            - Current parser treats <span className="font-mono text-xs text-fg">§</span>-separated
            blocks as individual entries and preserves the memory preamble separately.
          </li>
        </ul>
      </section>

      <div className="grid gap-6 xl:grid-cols-2">
        <MemoryFilePanel file={memory.files.memory} limitSource={memory.limits.memory.source} />
        <MemoryFilePanel file={memory.files.user} limitSource={memory.limits.user.source} />
      </div>
    </div>
  );
}
