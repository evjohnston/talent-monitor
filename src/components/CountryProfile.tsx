import { useEffect, useState } from "react";
import type { Exhibit } from "../lib/types.ts";
import {
  buildCountryProfile,
  formatIndicatorValue,
  countryLatestValue,
  isSafeAsCountryChart,
  sectionCoversCountry,
  relatedCountries,
  representativeTopic,
  buildProfileDownloadRows,
  enabledProfileCountries,
  type ProfileCountry,
  type ProfileSectionData,
} from "../lib/countryProfiles.ts";
import { readCompareCountriesFromUrl, writeCompareCountriesToUrl, MAX_COMPARE_COUNTRIES } from "../lib/countryProfileUrlState.ts";
import { continentOf } from "../lib/countries.ts";
import { toLatestValue } from "../lib/exhibitData.ts";
import { downloadCsv, downloadJson } from "../lib/csvExport.ts";
import { slugify } from "../lib/exportFilename.ts";
import { SectionHeader } from "./ChartFrame.tsx";
import { ExhibitPanel } from "./ExhibitPanel.tsx";

const CONTINENT_LABEL: Record<string, string> = {
  "north-america": "North America",
  "south-america": "South America",
  europe: "Europe",
  asia: "Asia",
  africa: "Africa",
  oceania: "Oceania",
  "middle-east": "Middle East",
};

// One supporting exhibit beyond a section's own primary chart — a
// compact real stat (latest value + year), not a second full chart, per
// the issue's own "not a dashboard card wall" rule. Links out to the
// exhibit's own real stage-page methodology drawer (the same
// ?methods=<id> deep link the explorer catalog already uses), so the
// full chart is always one click away without duplicating it here.
function SupportingMetric({ exhibit, base, code }: { exhibit: Exhibit; base: string; code: string }) {
  // countryLatestValue() picks the column/rows that actually belong to
  // THIS country — plain toLatestValue(exhibit) has no country context
  // and silently grabs whichever column is numerically first, which is
  // wrong the moment this exhibit covers more than one country (a real,
  // confirmed bug this fix caught — see countryProfiles.ts's own note).
  const latest = countryLatestValue(exhibit, code) ?? toLatestValue(exhibit);
  return (
    <a className="supporting-metric" href={`${base}${exhibit.stage}/?methods=${exhibit.id}`}>
      <div className="trend-note">{exhibit.title}</div>
      {latest ? (
        <div className="supporting-metric-value">
          {typeof latest.value === "number" ? formatIndicatorValue(exhibit, latest.value) : latest.value}
          <span className="trend-note"> ({latest.x})</span>
        </div>
      ) : (
        <div className="trend-note">See full indicator →</div>
      )}
    </a>
  );
}

// "Compare with" (issue #19's own country-comparison spec) — a real,
// plain fieldset of checkboxes, not a map: every OTHER enabled country,
// capped at MAX_COMPARE_COUNTRIES. Extends every section's chart
// `emphasize` array (already real, array-based cross-highlighting —
// see TrackShell's own multi-country pin/compare feature) rather than
// building a second comparison mechanism.
function CompareControl({ current, compareCodes, onToggle }: { current: string; compareCodes: string[]; onToggle: (code: string) => void }) {
  const others = enabledProfileCountries().filter((c) => c.code !== current);
  return (
    <fieldset className="compare-control">
      <legend className="trend-note">Compare with (up to {MAX_COMPARE_COUNTRIES}):</legend>
      <div className="tab-bar">
        {others.map((c) => {
          const checked = compareCodes.includes(c.code);
          const disabled = !checked && compareCodes.length >= MAX_COMPARE_COUNTRIES;
          return (
            <label key={c.code} className={`chip${disabled ? " chip-disabled" : ""}`} title={disabled ? `Comparisons are limited to ${MAX_COMPARE_COUNTRIES} additional countries` : undefined}>
              <input type="checkbox" checked={checked} disabled={disabled} onChange={() => onToggle(c.code)} style={{ marginRight: 4 }} />
              {c.name}
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}

// One real point of coverage for a section's compare countries — "warn
// where one country lacks data" (issue #19's own rule), checked against
// this section's own already-rendered exhibits, not a fabricated guess.
function CompareCoverageNote({ section, compareCountries }: { section: ProfileSectionData; compareCountries: ProfileCountry[] }) {
  const uncovered = compareCountries.filter((c) => !sectionCoversCountry(section, c.code));
  if (uncovered.length === 0) return null;
  return (
    <p className="trend-note" style={{ marginTop: 8 }}>
      No data in this section for {uncovered.map((c) => c.name).join(", ")}.
    </p>
  );
}

// One real country profile (issue #19) — assembled entirely from
// buildCountryProfile()'s own mechanical, data-derived config; this
// component only lays it out. Reuses ExhibitPanel directly for every
// section's primary chart (its real controls, citation, and
// MethodologyDrawer come for free, same reuse discipline the explorer's
// indicator detail view already established) with that country (and any
// real compare countries) emphasized via the existing cross-highlight
// prop, not a new visual language.
export function CountryProfile({ code, exhibits }: { code: string; exhibits: Exhibit[] }) {
  const profile = buildCountryProfile(code, exhibits);
  const base = import.meta.env.BASE_URL;

  // Starts empty on both server and first client render — no hydration
  // mismatch — then a mount effect reads the real URL, same SSR-safe
  // pattern pinned countries/explorer filters already established.
  const [compareCodes, setCompareCodes] = useState<string[]>([]);
  useEffect(() => {
    setCompareCodes(readCompareCountriesFromUrl());
  }, []);

  function toggleCompare(compareCode: string) {
    const next = compareCodes.includes(compareCode)
      ? compareCodes.filter((c) => c !== compareCode)
      : compareCodes.length < MAX_COMPARE_COUNTRIES
        ? [...compareCodes, compareCode]
        : compareCodes;
    setCompareCodes(next);
    writeCompareCountriesToUrl(next);
  }

  if (!profile) {
    return (
      <div className="panel">
        <div className="trend-empty">This is not one of the report's initial 9 profile countries.</div>
      </div>
    );
  }
  const continent = continentOf(profile.country.code);
  const compareCountries = enabledProfileCountries().filter((c) => compareCodes.includes(c.code));
  const emphasize = [profile.country.code, ...compareCodes];
  const related = relatedCountries(code, exhibits);

  function downloadProfileCsv() {
    downloadCsv(`country-profile_${slugify(profile!.country.name)}.csv`, buildProfileDownloadRows(profile!) as unknown as Record<string, unknown>[]);
  }
  function downloadProfileJson() {
    downloadJson(`country-profile_${slugify(profile!.country.name)}.json`, {
      country: profile!.country,
      generatedFrom: "public/data/talent.json",
      indicators: buildProfileDownloadRows(profile!),
    });
  }

  return (
    <div className="track-enter">
      <div className="panel">
        <SectionHeader title={profile.country.name} level={2} note={continent ? <span className="trend-note"> · {CONTINENT_LABEL[continent] ?? continent}</span> : undefined} />
        <p className="trend-note">{profile.summary}</p>
        <div className="trend-note" style={{ marginBottom: 8 }}>
          {profile.indicatorCount} real indicator{profile.indicatorCount === 1 ? "" : "s"} from this report reference {profile.country.name}.
        </div>
        {profile.sections.length > 0 && (
          <nav aria-label={`${profile.country.name} profile sections`} className="tab-bar" style={{ marginBottom: 8 }}>
            {profile.sections.map((s) => (
              <a key={s.id} href={`#profile-section-${s.id}`} className="chip">
                {s.label}
              </a>
            ))}
          </nav>
        )}
        <div className="tab-bar" style={{ marginBottom: 8 }}>
          <button type="button" className="ghost-btn" onClick={downloadProfileCsv}>
            Download profile summary (CSV)
          </button>
          <button type="button" className="ghost-btn" onClick={downloadProfileJson}>
            Download profile summary (JSON)
          </button>
        </div>
        <CompareControl current={code} compareCodes={compareCodes} onToggle={toggleCompare} />
        {related.length > 0 && (
          <p className="trend-note" style={{ marginTop: 8 }}>
            Related, by shared real data: {related.map((c, i) => (
              <span key={c.code}>
                {i > 0 ? ", " : ""}
                <a href={`${base}countries/${c.slug}/`}>{c.name}</a>
              </span>
            ))}
            .
          </p>
        )}
      </div>

      {profile.sections.map((section) => {
        // The section's own real chapter/id ordering is untouched, EXCEPT
        // a full chart never comes from an exhibit ExhibitChart can't
        // actually highlight for this specific country — see
        // isSafeAsCountryChart's own note (FIG508-style wide-format
        // ranked-bar exhibits silently rank by whichever country's
        // column happens to be last, which is wrong for every OTHER
        // country's profile). buildCountryProfile() already sorts
        // chart-safe exhibits first, so [0] is always the right pick
        // when one exists.
        const hasSafePrimary = section.exhibits.length > 0 && isSafeAsCountryChart(section.exhibits[0]);
        const primary = hasSafePrimary ? section.exhibits[0] : undefined;
        const rest = hasSafePrimary ? section.exhibits.slice(1) : section.exhibits;
        const supporting = rest.slice(0, hasSafePrimary ? 2 : 3);
        const remaining = rest.length - supporting.length;
        const topic = representativeTopic(section.id);
        return (
          <div key={section.id} className="panel" id={`profile-section-${section.id}`}>
            <SectionHeader title={section.label} level={2} />
            {section.isMissing || section.exhibits.length === 0 ? (
              <div className="trend-empty">
                The report does not contain a comparable indicator for {profile.country.name} in this section.
              </div>
            ) : (
              <>
                {primary && <ExhibitPanel exhibit={primary} emphasize={emphasize} headingLevel={3} />}
                {supporting.length > 0 && (
                  <div className="row3" style={{ marginTop: 8 }}>
                    {supporting.map((exhibit) => (
                      <SupportingMetric key={exhibit.id} exhibit={exhibit} base={base} code={profile.country.code} />
                    ))}
                  </div>
                )}
                {compareCountries.length > 0 && <CompareCoverageNote section={section} compareCountries={compareCountries} />}
                {remaining > 0 && (
                  <p className="trend-note" style={{ marginTop: 8 }}>
                    +{remaining} more real indicator{remaining === 1 ? "" : "s"} in this section — see{" "}
                    <a href={`${base}explorer/?topic=${encodeURIComponent(topic)}`}>{topic}</a> in the full explorer.
                  </p>
                )}
              </>
            )}
          </div>
        );
      })}
    </div>
  );
}
