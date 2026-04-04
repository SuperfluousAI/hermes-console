import Link from "next/link";

import { SkillParseBadge } from "@/features/skills/components/skill-parse-badge";
import { compareSkillCategories } from "@/features/skills/read-skills-index";
import type { SkillSummary } from "@/features/skills/types";

export function SkillsIndex({
  skills,
}: {
  skills: SkillSummary[];
}) {
  if (skills.length === 0) {
    return (
      <section className="rounded-lg border border-border bg-surface/70 p-4">
        <div className="rounded-md border border-dashed border-border/80 p-4 text-sm leading-6 text-fg-muted">
          No skills matched the current filter.
        </div>
      </section>
    );
  }

  const grouped = Object.entries(
    skills.reduce<Record<string, SkillSummary[]>>((accumulator, skill) => {
      accumulator[skill.category] ??= [];
      accumulator[skill.category].push(skill);
      return accumulator;
    }, {}),
  ).sort((left, right) => compareSkillCategories(left[0], right[0]));

  return (
    <div className="space-y-6 xl:max-h-[52rem] xl:overflow-auto xl:pr-1">
      {grouped.map(([category, categorySkills]) => (
        <section key={category} className="rounded-lg border border-border bg-surface/70 p-4">
          <div className="mb-4">
            <h3 className="font-[family-name:var(--font-bricolage)] text-base font-semibold text-fg-strong">
              {category}
            </h3>
            <p className="mt-2 text-sm leading-6 text-fg-muted">
              {categorySkills.length} skill{categorySkills.length === 1 ? "" : "s"}
            </p>
          </div>

          <div className="space-y-3">
            {categorySkills.map((skill) => (
              <Link
                key={skill.id}
                href={`/skills/${skill.id}`}
                className="block rounded-md border border-border/70 bg-bg/40 p-3 transition-colors hover:border-border"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-medium text-fg-strong">{skill.name}</p>
                      <SkillParseBadge status={skill.parseStatus} />
                    </div>
                    <p className="mt-2 text-sm leading-6 text-fg-muted">{skill.description}</p>
                  </div>
                  <div className="text-right text-xs text-fg-muted">
                    <p>{skill.linkedFiles.length} linked</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
