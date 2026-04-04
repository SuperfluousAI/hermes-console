import { notFound } from "next/navigation";

import { SkillFileViewer } from "@/features/skills/components/skill-file-viewer";
import { readSkillDetail } from "@/features/skills/read-skill-detail";
import { createSectionMetadata } from "@/lib/create-section-metadata";

export const metadata = createSectionMetadata(
  "Skill detail",
  "Inspect a single skill and its linked files.",
);

export default async function SkillDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ skillPath: string[] }>;
  searchParams?: Promise<{ file?: string }>;
}) {
  const resolvedParams = await params;
  const resolvedSearchParams = (await searchParams) ?? {};
  const skillId = resolvedParams.skillPath.join("/");
  const selectedFileId = resolvedSearchParams.file ?? "skill";
  const detail = readSkillDetail({
    skillId,
    linkedFileId: selectedFileId === "skill" ? null : selectedFileId,
  });

  if (!detail) {
    notFound();
  }

  return <SkillFileViewer detail={detail} selectedFileId={selectedFileId} />;
}
