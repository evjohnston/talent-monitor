import { useMemo, useState } from "react";
import type { DashboardContext } from "./types.ts";
import type { CrosswalkRow } from "../lib/loadCrosswalk.ts";
import { SectionHeader } from "../components/ChartFrame.tsx";
import { buildDataSourceCatalog } from "../lib/dataSourceCatalog.ts";

// Real, standard definitions used across the federal data sources this
// site draws on (NCES, NCSES/NSF, USCIS, DOL, the State Department,
// IIE) — general statistical/legal categories, not a direct quotation of
// the report's own manuscript (writing/*.docx is deliberately gitignored,
// unpublished draft content — see CLAUDE.md). Framed that way explicitly
// rather than claimed as the report's own exact wording, which would be
// a real, unverifiable claim this app has no way to check.
const DEFINITIONS: { term: string; definition: string }[] = [
  {
    term: "Foreign-born",
    definition: "Born outside the United States and its territories to parents who were not U.S. citizens — a Census Bureau/demographic category based on place of birth, not current legal or citizenship status. A foreign-born person can be a naturalized U.S. citizen, a permanent resident, or a temporary visa holder.",
  },
  {
    term: "Noncitizen",
    definition: "Not a U.S. citizen, regardless of place of birth or how long someone has lived in the United States. Includes permanent residents (green-card holders) and temporary visa holders alike, unless a specific source narrows the category further.",
  },
  {
    term: "Temporary visa holder",
    definition: "A noncitizen present in the United States on a non-immigrant visa (e.g., F-1 student, J-1 exchange visitor, H-1B specialty-occupation worker) rather than as a permanent resident or citizen — a real subset of \"noncitizen,\" not a synonym for it.",
  },
  {
    term: "International student",
    definition: "A student enrolled in a U.S. academic program who is not a U.S. citizen or permanent resident, typically present on an F-1 or J-1 visa. An enrollment-status term (IIE's Open Doors survey population), distinct from a person's broader immigration status once they leave school.",
  },
  {
    term: "U.S. citizen and permanent resident",
    definition: "Often grouped together in NSF/NCES workforce data as the population not facing visa-sponsorship constraints — citizens by birth or naturalization, plus green-card holders (lawful permanent residents, who are not citizens but face no visa-status limits on where or how long they can work).",
  },
  {
    term: "Country of origin",
    definition: "Used inconsistently across real federal sources to mean country of birth, country of citizenship, or country of last residence before coming to the United States — this site follows each cited source's own real usage rather than assuming one fixed meaning; see that exhibit's own methodology drawer for the specific source.",
  },
  {
    term: "Nationality",
    definition: "A person's legal citizenship — similar to country of citizenship, and distinct from country of birth (foreign-born) or country of chargeability (a specific immigration-processing category, see below).",
  },
  {
    term: "Country of chargeability",
    definition: "A specific U.S. immigration-processing term (used in green-card wait-time data, e.g. the State Department's Visa Bulletin): the country an immigrant petition is counted against for that country's annual per-country visa cap. Usually the applicant's country of birth, not current citizenship — real cross-chargeability rules can assign a married couple born in different countries to one spouse's country instead. This is exactly why green-card wait times vary so sharply \"by country\" in this site's own retention-and-immigration exhibits.",
  },
  {
    term: "Current affiliation",
    definition: "In bibliometric/citation data (e.g. OpenAlex-derived exhibits), an author's institutional affiliation at the time of the citation record, not necessarily the institution where the cited research was originally performed.",
  },
  {
    term: "Undergraduate training location",
    definition: "Where a person earned their bachelor's degree — which can differ from where they earned a later degree or currently live or work, relevant to this site's own talent-flow framing (e.g., someone trained abroad at the undergraduate level who now works in the U.S. STEM workforce).",
  },
];

// The site's own real, confirmed comparability/methodology issues —
// pulled from docs/report-crosswalk-notes.md's own documented cases
// (2026-07-28/29), not re-derived or guessed here. Two of the four have
// already been fixed in the app itself (noted inline); the other two are
// genuine, permanent definitional distinctions, not bugs to fix.
const KNOWN_BREAKS: { title: string; detail: string }[] = [
  {
    title: "Stay intentions vs. observed stay (FIG601 vs. FIG602)",
    detail: "FIG601 measures international PhD recipients' own stated intent to stay, from a near-graduation survey. FIG602 measures a tracked cohort's actual observed location 5 and 10 years later. Different populations, different measures — the two are shown side by side on the Retention & Immigration page, never chained into one flow as if they described the same cohort.",
  },
  {
    title: "Count and rate sharing an axis (fixed)",
    detail: "FIG603 originally mixed real approval/denial counts (in the thousands) with a 0-1 approval-rate column on one shared chart axis. Fixed by detecting rate-shaped columns structurally (src/lib/exhibitData.ts's isRateShapedSeries) and rendering them as a separate chart with its own axis whenever an exhibit mixes both shapes.",
  },
  {
    title: "Repeated country labels in a generic table (fixed)",
    detail: "TAB604 (unused PERM certifications) originally rendered every row's label as a repeated \"India\" with no year or status visible, because the generic ranked-bar fallback only used the first column for a label. Fixed generically (not just for this exhibit) by joining every leading non-numeric column into one composite label and deduping adjacent identical parts.",
  },
  {
    title: "Country-name inconsistency (fixed)",
    detail: "The report's own real data spells the same country differently across exhibits — \"South Korea,\" \"Republic of Korea,\" and bare \"Korea\" all appear. A test written against this claim (src/lib/countries.test.ts) found the bare word \"Korea\" (FIG608's own real usage) silently failed to resolve, dropping South Korea from that exhibit's world map entirely. Fixed with a real alias table (countries.ts's EXTRA_NAME_ALIASES).",
  },
];

export function Methodology({ ctx, crosswalk }: { ctx: DashboardContext; crosswalk: CrosswalkRow[] }) {
  const [query, setQuery] = useState("");
  const catalog = useMemo(() => buildDataSourceCatalog(ctx.exhibits), [ctx.exhibits]);
  const derivedExhibits = useMemo(() => ctx.exhibits.filter((e) => e.derivedFrom && e.derivedFrom.length > 0), [ctx.exhibits]);
  const dataNoteExhibits = useMemo(() => ctx.exhibits.filter((e) => e.dataNote), [ctx.exhibits]);

  const q = query.trim().toLowerCase();
  const filteredDefinitions = q ? DEFINITIONS.filter((d) => d.term.toLowerCase().includes(q) || d.definition.toLowerCase().includes(q)) : DEFINITIONS;
  const filteredCrosswalk = q
    ? crosswalk.filter((r) => `${r.reportId} ${r.reportTitle} ${r.stage} ${r.dataSource}`.toLowerCase().includes(q))
    : crosswalk;

  return (
    <div className="track-enter">
      <div className="panel">
        <SectionHeader
          level={2}
          title="Methodology"
          takeaway="Every number on this site traces to a specific source, a specific real calculation, and a specific real limitation. This page is the full reference; each exhibit's own methodology drawer links back to the relevant section here."
        />
        <div className="search-field" style={{ marginTop: 12 }}>
          <input
            type="search"
            className="search-input"
            placeholder="Search definitions, sources, and exhibits…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="Search methodology"
          />
        </div>
      </div>

      <div className="panel" id="definitions">
        <SectionHeader level={2} title="Definitions" />
        {filteredDefinitions.length === 0 ? (
          <div className="trend-empty">No definitions match "{query}."</div>
        ) : (
          <dl className="definitions-list">
            {filteredDefinitions.map((d) => (
              <div key={d.term}>
                <dt>{d.term}</dt>
                <dd>{d.definition}</dd>
              </div>
            ))}
          </dl>
        )}
      </div>

      <div className="panel" id="data-sources">
        <SectionHeader level={2} title="Data-source catalog" takeaway={`${catalog.length} real organizations, cited across ${ctx.exhibits.length} exhibits.`} />
        <table className="lb">
          <thead>
            <tr>
              <th>Organization</th>
              <th>Datasets cited</th>
              <th className="right">Exhibits</th>
            </tr>
          </thead>
          <tbody>
            {catalog.map((c) => (
              <tr key={c.organization}>
                <td className="org-name">{c.organization}</td>
                <td>{c.datasets.join("; ")}</td>
                <td className="right count">{c.exhibitIds.length}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="panel" id="calculation-methods">
        <SectionHeader
          level={2}
          title="Calculation methods"
          takeaway="Every number here traces to a standalone source file, except these — computed by this site from other exhibits' own already-real data."
        />
        {derivedExhibits.map((e) => (
          <div key={e.id} className="methodology-calc-row">
            <strong>{e.title}</strong> ({e.id})
            <div>Derived from {e.derivedFrom!.join(", ")}. {e.calculationNote}</div>
          </div>
        ))}
      </div>

      <div className="panel" id="employer-normalization">
        <SectionHeader level={2} title="Employer-name normalization and corporate-parent aggregation" />
        <p>
          H-1B employer names (FIG302 and the exhibits derived from it) appear in the report's own source data exactly
          as USCIS reported them — different legal-entity-name spellings for the same real company are never
          rewritten in that raw exhibit. FIG303's top-10 concentration and TAB303's per-company comparison, both
          already disclosed above as computed by this site, group employer names using{" "}
          <code>src/lib/entityResolution.ts</code>: mechanical legal-suffix stripping, plus a small alias table built
          only from real, hand-confirmed cases — currently one, "Hewlett Packard Enterprise" (its own services
          subsidiary files under a different legal name in some years).
        </p>
        <p>
          A real historical merger or acquisition between two once-separate companies is deliberately{" "}
          <strong>not</strong> grouped this way — Satyam Computer Services (acquired by Tech Mahindra, 2013) and
          Larsen & Toubro Infotech plus Mindtree (merged into LTIMindtree, 2022) each keep their own pre-merger years
          attributed to the entity that actually filed them. Merging a historical acquisition into one combined total
          would misattribute economic activity to a company before it existed in that form.
        </p>
      </div>

      <div className="panel" id="missing-data">
        <SectionHeader level={2} title="Missing-data and messy-export conventions" />
        <ul className="methodology-list">
          <li>A pivot export's own "Grand Total" footer row (confirmed real in several source CSVs) is dropped at import time — kept, it would outrank every real entity on every leaderboard as the sum of all of them.</li>
          <li>A blank-headed column with no real column name is dropped even if a stray value ends up in it, rather than treated as a legitimate ranking metric.</li>
          <li>Thousands-comma-formatted numbers ("2,302.00") are parsed as real numbers, not left as unparsed strings — confirmed by hand this affects exactly one exhibit's own dollar-figure columns (FIG404), not guessed at more broadly.</li>
          {dataNoteExhibits.map((e) => (
            <li key={e.id}><strong>{e.title}</strong> ({e.id}): {e.dataNote}</li>
          ))}
        </ul>
      </div>

      <div className="panel" id="projection-methods">
        <SectionHeader level={2} title="Projection methods" />
        <p>
          Two exhibits (FIG109, FIG110 — international doctorate-production comparisons) contain the report's own
          author-generated projections beyond the years each source organization actually reported. Each country's
          real projected values are stored in that country's own separate "(Country) (projected)" column, kept apart
          from its observed values rather than mixed into the same series. Every other exhibit on this site is an
          observed historical statistic, not a forecast.
        </p>
      </div>

      <div className="panel" id="geographic-definitions">
        <SectionHeader level={2} title="Geographic and country definitions" />
        <p>
          Every real country gets the same named-actor color treatment (<code>src/lib/countries.ts</code>): the
          United States, China, India, and the European Union bloc each keep one consistent identity color across
          every chart on the site; every other real country shares one restrained neutral tone rather than a
          decorative per-country palette. Country names are resolved to a real ISO code through a real alias table
          before coloring or map-matching — confirmed necessary by hand: the bare word "Korea" (FIG608's own real
          data) does not resolve through this site's underlying country-name library on its own; see "Known source
          and methodology breaks" below.
        </p>
      </div>

      <div className="panel" id="known-breaks">
        <SectionHeader level={2} title="Known source and methodology breaks" />
        {KNOWN_BREAKS.map((b) => (
          <div key={b.title} className="methodology-calc-row">
            <strong>{b.title}</strong>
            <div>{b.detail}</div>
          </div>
        ))}
      </div>

      <div className="panel" id="crosswalk">
        <SectionHeader
          level={2}
          title="Report-to-web crosswalk"
          takeaway={`Every one of the report's own ${crosswalk.length} figures, tables, and boxes, and this site's own real disposition for each.`}
        />
        {filteredCrosswalk.length === 0 ? (
          <div className="trend-empty">No report items match "{query}."</div>
        ) : (
          <table className="lb crosswalk-table">
            <thead>
              <tr>
                <th>Report ID</th>
                <th>Title</th>
                <th>Stage</th>
                <th>Web role</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredCrosswalk.map((r) => (
                <tr key={r.reportId} id={`crosswalk-${r.reportId}`}>
                  <td className="count">{r.reportId}</td>
                  <td>{r.reportTitle}</td>
                  <td>{r.stage}</td>
                  <td>{r.proposedWebRole.replace(/_/g, " ")}</td>
                  <td>{r.status.replace(/_/g, " ")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="panel" id="revision-history">
        <SectionHeader level={2} title="Revision history and data update dates" />
        <p>
          Data last imported: <strong>{ctx.generatedAt ? new Date(ctx.generatedAt).toLocaleString("en-US", { month: "long", day: "numeric", year: "numeric" }) : "unknown"}</strong>.
          There is no live source behind this site's data — every exhibit is re-imported by hand from the report's
          own finished exports, not fetched on a schedule (see this project's own <code>CLAUDE.md</code> for the full,
          dated history of every real change made while building this site).
        </p>
      </div>

      <div className="panel" id="downloads-link">
        <SectionHeader level={2} title="Downloads" takeaway="Every exhibit's own data, plus combined per-stage bundles." />
        <a className="pill" href={`${import.meta.env.BASE_URL}downloads/`}>Open the downloads page →</a>
      </div>
    </div>
  );
}
