import type { Exhibit } from "./types.ts";

// A pure-data version of the old TrackShell.tsx's own real hero/section/
// leftover partitioning logic (that component and all 6 of its
// Track*.tsx callers were deleted as confirmed dead code once every
// stage page migrated to this architecture — see git history for the
// original React-tree version if ever needed) — callable from an
// `.astro` page's own frontmatter (plain build-time JS/TS, no React)
// rather than only from inside a React component tree. Needed once a
// stage page's exhibit panels became independent Astro islands (issue
// #23's real TBT fix, see CLAUDE.md's "Chart-page performance" section)
// — `client:visible` is a template-level directive that only works on
// components an `.astro` file mounts directly, so the "which exhibit
// goes in which section, in what order" decision has to happen at that
// same level now, not inside a nested React component. Behavior is
// unchanged from the original logic — same real editorial section
// configs, same exclusion rules — just computed as plain data instead
// of JSX.
export interface TrackSection {
  title: string;
  ids: string[];
}

export interface TrackLayoutConfig {
  heroId?: string;
  // Exhibits that feed a custom hero's own numbers directly (e.g. a
  // Sankey built from two exhibits) and would otherwise duplicate as
  // their own standalone panel — same real rule TrackShell.tsx's own
  // `excludeIds` prop already established.
  excludeIds?: string[];
  sections?: TrackSection[];
}

export interface TrackLayoutSection {
  title: string;
  exhibits: Exhibit[];
}

export interface TrackLayoutResult {
  hero: Exhibit | undefined;
  sections: TrackLayoutSection[];
  // Every real exhibit not claimed by the hero or a named section —
  // rendered in a flat grid after them. Not pre-chunked into rows here;
  // the flat-grid CSS (`.row3`) already wraps naturally, so a caller can
  // group these into rows of 3 for markup purposes without this function
  // needing to know about that presentation detail.
  leftover: Exhibit[];
}

export function computeTrackLayout(exhibits: Exhibit[], config: TrackLayoutConfig): TrackLayoutResult {
  const hero = config.heroId ? exhibits.find((e) => e.id === config.heroId) : undefined;
  const excluded = new Set([...(config.excludeIds ?? []), ...(hero ? [hero.id] : [])]);
  const rest = exhibits.filter((e) => !excluded.has(e.id));

  if (!config.sections) {
    return { hero, sections: [], leftover: rest };
  }

  const byId = Object.fromEntries(rest.map((e) => [e.id, e]));
  const seen = new Set<string>();
  const sections: TrackLayoutSection[] = [];
  for (const s of config.sections) {
    const items = s.ids.map((id) => byId[id]).filter((e): e is Exhibit => !!e);
    items.forEach((e) => seen.add(e.id));
    if (items.length > 0) sections.push({ title: s.title, exhibits: items });
  }
  const leftover = rest.filter((e) => !seen.has(e.id));
  return { hero, sections, leftover };
}

// Chunks a flat exhibit list into rows of 3 — the same real grid grouping
// TrackShell.tsx's own toRows() already did, extracted here so both the
// old and new (per-panel-island) rendering paths share one implementation
// during the pilot migration.
export function toExhibitRows(list: Exhibit[]): Exhibit[][] {
  const rows: Exhibit[][] = [];
  for (let i = 0; i < list.length; i += 3) rows.push(list.slice(i, i + 3));
  return rows;
}
