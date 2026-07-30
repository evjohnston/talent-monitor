// Canonicalizes a raw H-1B employer name (FIG302's own "Company" column)
// into a stable id/display name, so a derived metric like FIG303's top-10
// concentration groups the same real company together instead of splitting
// it across legal-entity-name variants ("HP Enterprise Svcs LLC" vs.
// "Hewlett Packard Enterprise Company" — the same company, filing under a
// subsidiary name in some years). Same two-layer pattern as the old
// pre-rebuild app's entityResolution.ts (recoverable via
// `git show 5329bf1^:src/lib/entityResolution.ts`): mechanical suffix
// stripping first, then a small hand-verified alias table — adapted here
// for the real, confirmed cases found in FIG302's own 252-row employer
// list (talent_charts/data/FIG302.csv), not reused from the old
// quantum/AI-specific table, which doesn't apply to this data at all.
//
// Deliberately does NOT touch FIG302's own exported rows — those stay
// exactly as USCIS reported them (the "raw file actually used," per the
// downloads work). This only feeds FIG303/TAB303's own already-derived,
// already-disclosed-as-computed aggregation, grouping CONTEMPORANEOUS
// same-parent subsidiary names, never a historical merger/acquisition
// (confirmed with the user 2026-07-30 — a real historical merger, e.g.
// Satyam Computer Services -> Tech Mahindra or Larsen & Toubro Infotech +
// Mindtree -> LTIMindtree, keeps its pre-merger years attributed to the
// entity that actually filed them; see CORPORATE_LINEAGE below for how
// that real relationship is disclosed instead of silently merged).
const LEGAL_SUFFIX = /,?\s*(?:INC\.?|INCORPORATED|LLC\.?|L\.L\.C\.?|LTD\.?|LIMITED|CORP(?:ORATION)?\.?|LLP\.?|PLC\.?|CO\.,?\s*LTD\.?|AND SUBSIDIARIES|AND SUBIDIARIES)\.?$/i;

// Keys are the POST-normalization form (i.e. what normalizeKey() produces
// after LEGAL_SUFFIX already stripped a trailing suffix) — confirmed by
// hand against every one of FIG302's 252 real raw names (2026-07-30), not
// guessed. Only a real, contemporaneous same-parent case belongs here; see
// this file's own top comment for why a historical merger doesn't.
const ALIASES: Record<string, string> = {
  // "HP Enterprise Svcs LLC" (FIG302's own real string, truncated by the
  // report's export at "A HEWLETT P") is Hewlett Packard Enterprise's own
  // services subsidiary, not a separate company or an acquisition target —
  // confirmed against FIG302's real column data (both variants recur across
  // the 2009-2026 span).
  "hp enterprise svcs llc a hewlett p": "Hewlett Packard Enterprise",
  "hewlett packard enterprise company": "Hewlett Packard Enterprise",
};

function normalizeKey(raw: string): string {
  const stripped = raw.replace(LEGAL_SUFFIX, "");
  return stripped.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, " ").trim();
}

export function canonicalizeCompany(raw: string): { id: string; name: string } {
  const key = normalizeKey(raw);
  if (!key) return { id: raw, name: raw };
  // Object.hasOwn, not a bare ALIASES[key] lookup — see the old app's own
  // real, confirmed bug (a company literally named "Constructor" collided
  // with Object.prototype.constructor via a plain lookup) documented in
  // the recovered file this pattern is adapted from. No exact repeat
  // confirmed in FIG302's real data, but the defense is free and the prior
  // bug was real, not hypothetical.
  const aliasedName = Object.hasOwn(ALIASES, key) ? ALIASES[key] : undefined;
  if (aliasedName) return { id: normalizeKey(aliasedName), name: aliasedName };
  const displayName = raw.replace(LEGAL_SUFFIX, "").trim() || raw;
  return { id: key, name: displayName };
}

// Real, confirmed historical mergers/acquisitions among FIG302's own
// employer names (2026-07-30 research) — disclosed, never silently
// merged into one grouping (see this file's own top comment for why).
// `predecessor`/`successor` are FIG302's own raw strings, so a caller can
// match them exactly against real row data if it wants to annotate both
// sides of the relationship.
export interface CorporateLineageNote {
  predecessor: string;
  successor: string;
  year: number;
  note: string;
}

export const CORPORATE_LINEAGE: CorporateLineageNote[] = [
  {
    predecessor: "SATYAM COMPUTER SERVICES LIMITED",
    successor: "TECH MAHINDRA AMERICAS INC",
    year: 2013,
    note: "Satyam Computer Services was acquired by Tech Mahindra's parent (Mahindra Group) starting in 2009, formally merging into Tech Mahindra in 2013. Filing years before the merger stay attributed to Satyam, not retroactively counted as Tech Mahindra.",
  },
  {
    predecessor: "LARSEN & TOUBRO INFOTECH LIMITED",
    successor: "LTIMINDTREE LIMITED",
    year: 2022,
    note: "Larsen & Toubro Infotech and Mindtree Limited merged into LTIMindtree in 2022. Filing years before the merger stay attributed to each original company, not retroactively counted as LTIMindtree.",
  },
  {
    predecessor: "MINDTREE LIMITED",
    successor: "LTIMINDTREE LIMITED",
    year: 2022,
    note: "Mindtree Limited merged with Larsen & Toubro Infotech into LTIMindtree in 2022. Filing years before the merger stay attributed to Mindtree, not retroactively counted as LTIMindtree.",
  },
];
