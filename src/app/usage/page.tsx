import { UsageBrowser } from "@/features/usage/components/usage-browser";
import { readHermesUsage } from "@/features/usage/read-usage";
import { createSectionMetadata } from "@/lib/create-section-metadata";

export const metadata = createSectionMetadata(
  "Usage",
  "Token usage and estimated cost across Hermes sessions.",
);

export default function UsagePage() {
  const usage = readHermesUsage();

  return <UsageBrowser usage={usage} />;
}
