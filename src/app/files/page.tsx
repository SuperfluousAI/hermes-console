import { KeyFilePreview } from "@/features/key-files/components/key-file-preview";
import { KeyFilesIndex } from "@/features/key-files/components/key-files-index";
import { readKeyFileContent } from "@/features/key-files/read-key-file-content";
import { readKeyFiles } from "@/features/key-files/read-key-files";
import { readHermesMemory } from "@/features/memory/read-memory";
import { InventorySummaryGrid } from "@/features/inventory/components/inventory-summary-grid";
import { createSectionMetadata } from "@/lib/create-section-metadata";

export const metadata = createSectionMetadata(
  "Files",
  "High-signal context and configuration files.",
);

export default async function FilesPage({
  searchParams,
}: {
  searchParams?: Promise<{ file?: string }>;
}) {
  const params = (await searchParams) ?? {};
  const keyFiles = readKeyFiles();
  const memory = readHermesMemory();
  const selected = readKeyFileContent(params.file ?? "");

  const summaryItems = [
    {
      label: "files discovered",
      value: String(keyFiles.files.length),
      tone: "default" as const,
    },
    {
      label: "hermes-root files",
      value: String(keyFiles.files.filter((file) => file.scope === "hermes_root").length),
      tone: "default" as const,
    },
    {
      label: "workspace files",
      value: String(keyFiles.files.filter((file) => file.scope === "workspace_root").length),
      tone: "default" as const,
    },
    {
      label: "roots",
      value: `${keyFiles.roots.hermesRoot} · ${keyFiles.roots.workspaceRoot}`,
      tone: "muted" as const,
    },
  ];

  return (
    <div className="space-y-8">
      <section className="max-w-3xl">
        <div className="flex flex-wrap items-center gap-3">
          <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-accent">
            Files
          </p>
        </div>
        <h2 className="mt-3 font-[family-name:var(--font-bricolage)] text-xl font-semibold tracking-tight text-fg-strong sm:text-2xl">
          Show the files that shape Hermes, not the whole damned filesystem
        </h2>
        <p className="mt-3 text-sm leading-7 text-fg-muted">
          This surface stays deliberately narrow: Hermes-root identity files, memory files,
          and high-signal instruction files from a bounded workspace scan. No fake file
          manager nonsense.
        </p>
      </section>

      <InventorySummaryGrid items={summaryItems} />

      <section className="rounded-lg border border-border bg-surface/70 p-4">
        <h3 className="font-[family-name:var(--font-bricolage)] text-base font-semibold text-fg-strong">
          Discovery posture
        </h3>
        <ul className="mt-3 space-y-2 text-sm leading-6 text-fg-muted">
          <li>- Hermes-root discovery is explicit and allowlisted.</li>
          <li>- Workspace discovery is bounded to the workspace root plus two directory levels.</li>
          <li>- Memory pressure badges are reused here for <span className="font-mono text-xs text-fg">MEMORY.md</span> and <span className="font-mono text-xs text-fg">USER.md</span>.</li>
        </ul>
      </section>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,0.95fr)_minmax(0,1.25fr)]">
        <KeyFilesIndex files={keyFiles.files} selectedFileId={selected?.file.id ?? null} memory={memory} />
        <KeyFilePreview file={selected?.file ?? null} content={selected?.content ?? null} memory={memory} />
      </div>
    </div>
  );
}
