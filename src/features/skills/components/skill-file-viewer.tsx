import Link from "next/link";

import { LinkedFileKindBadge } from "@/features/skills/components/linked-file-kind-badge";
import { SkillParseBadge } from "@/features/skills/components/skill-parse-badge";
import type { SkillDetail } from "@/features/skills/types";

function createViewerLink({
  skillId,
  file,
}: {
  skillId: string;
  file: string;
}) {
  const params = new URLSearchParams();
  params.set("file", file);
  return `/skills/${skillId}?${params.toString()}`;
}

export function SkillFileViewer({
  detail,
  selectedFileId,
}: {
  detail: SkillDetail;
  selectedFileId: string;
}) {
  const files = [
    {
      id: "skill",
      title: "SKILL.md",
      subtitle: detail.summary.skillPath,
      badge: null,
    },
    ...detail.summary.linkedFiles.map((linkedFile) => ({
      id: linkedFile.id,
      title: linkedFile.relativePath,
      subtitle: linkedFile.absolutePath,
      badge: <LinkedFileKindBadge kind={linkedFile.kind} key={linkedFile.id} />,
    })),
  ];

  const previewTitle = selectedFileId === "skill" ? "SKILL.md" : detail.selectedLinkedFile?.relativePath ?? "Linked file";
  const previewContent =
    selectedFileId === "skill"
      ? detail.rawContent
      : detail.selectedLinkedFileContent ?? "This linked file could not be read as text.";

  return (
    <div className="space-y-8">
      <section className="max-w-3xl">
        <div className="mb-4">
          <Link
            href="/skills"
            className="inline-flex items-center gap-2 rounded-full border border-border/80 bg-bg/40 px-3 py-1.5 font-mono text-xs text-fg-muted transition-colors hover:border-accent/60 hover:text-fg"
          >
            <span aria-hidden="true">←</span>
            <span>Back to skills</span>
          </Link>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-accent">Skills</p>
          <SkillParseBadge status={detail.summary.parseStatus} />
        </div>
        <h2 className="mt-3 font-[family-name:var(--font-bricolage)] text-xl font-semibold tracking-tight text-fg-strong sm:text-2xl">
          {detail.summary.name}
        </h2>
        <p className="mt-3 text-sm leading-7 text-fg-muted">{detail.summary.description}</p>
        <div className="mt-4 flex flex-wrap gap-2 text-xs text-fg-muted">
          <span className="rounded-full border border-border/80 bg-bg/40 px-3 py-1 font-mono">
            category {detail.summary.category}
          </span>
          <span className="rounded-full border border-border/80 bg-bg/40 px-3 py-1 font-mono">
            {detail.summary.linkedFiles.length} linked files
          </span>
          <Link
            href="/skills"
            className="rounded-full border border-border/80 bg-bg/40 px-3 py-1 font-mono transition-colors hover:border-accent/60"
          >
            back to skills
          </Link>
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,0.72fr)_minmax(0,1.28fr)]">
        <section className="rounded-lg border border-border bg-surface/70 p-4 xl:max-h-[50rem] xl:overflow-auto">
          <div className="mb-4">
            <h3 className="font-[family-name:var(--font-bricolage)] text-base font-semibold text-fg-strong">
              Skill files
            </h3>
            <p className="mt-2 text-sm leading-6 text-fg-muted">
              Select the main skill file or any linked reference/template/script.
            </p>
          </div>

          <div className="space-y-3">
            {files.map((file) => {
              const isSelected = file.id === selectedFileId;

              return (
                <Link
                  key={file.id}
                  href={createViewerLink({ skillId: detail.summary.id, file: file.id })}
                  className={[
                    "block rounded-md border p-3 transition-colors",
                    isSelected
                      ? "border-accent/60 bg-accent/5"
                      : "border-border/70 bg-bg/40 hover:border-border",
                  ].join(" ")}
                >
                  <div className="flex items-start justify-between gap-3 min-w-0">
                    <div className="min-w-0 flex-1">
                      <div className="flex min-w-0 flex-wrap items-center gap-2">
                        <p className="min-w-0 break-all text-sm font-medium text-fg-strong">{file.title}</p>
                        {file.badge}
                      </div>
                      <p className="mt-2 break-all font-mono text-xs text-fg-muted">{file.subtitle}</p>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>

        <section className="rounded-lg border border-border bg-surface/70 p-4">
          <div className="flex min-w-0 flex-wrap items-center gap-2">
            <h3 className="min-w-0 break-all font-[family-name:var(--font-bricolage)] text-base font-semibold text-fg-strong">
              {previewTitle}
            </h3>
            {selectedFileId !== "skill" && detail.selectedLinkedFile ? (
              <LinkedFileKindBadge kind={detail.selectedLinkedFile.kind} />
            ) : null}
          </div>
          <pre className="mt-4 max-h-[56rem] overflow-auto whitespace-pre-wrap break-words text-sm leading-6 text-fg">
            {previewContent}
          </pre>
        </section>
      </div>
    </div>
  );
}
