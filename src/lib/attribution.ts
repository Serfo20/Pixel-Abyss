import type { MediaMeta } from "@/types";
export function getAttribution(meta?: MediaMeta) {
  if (!meta || !meta.license || meta.license === "NONE") return null;
  return {
    author: meta.author ?? null,
    licenseName: meta.license,
    licenseUrl: meta.licenseUrl ?? null,
    sourceUrl: meta.sourceUrl ?? null,
  };
}
