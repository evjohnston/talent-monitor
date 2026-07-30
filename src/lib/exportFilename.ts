import type { Exhibit } from "./types.ts";
import { realDateRange } from "./dateRange.ts";

// A stable, human-readable download filename — no hand-authored slug
// field exists per exhibit yet (91 exhibits, real content-authoring work,
// not something to invent here), so this mechanically slugifies the
// exhibit's own real title instead of falling back to its opaque id
// ("FIG101"). Matches the redesign brief's own example shape
// (degree-production_international-share_by-field_1995-2024.csv) closely
// enough to be genuinely useful, even though the exact wording differs
// per exhibit since it's derived, not hand-picked.
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/'/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80)
    .replace(/-+$/g, "");
}

export function buildExportFilename(exhibit: Exhibit, ext: string): string {
  const range = realDateRange(exhibit);
  const parts = [exhibit.stage, slugify(exhibit.title)];
  if (range) parts.push(range.replace("–", "-"));
  return `${parts.join("_")}.${ext}`;
}
