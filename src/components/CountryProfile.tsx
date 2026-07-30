import type { Exhibit } from "../lib/types.ts";
import { buildCountryProfile, formatIndicatorValue } from "../lib/countryProfiles.ts";
import { continentOf } from "../lib/countries.ts";
import { toLatestValue } from "../lib/exhibitData.ts";
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
function SupportingMetric({ exhibit, base }: { exhibit: Exhibit; base: string }) {
  const latest = toLatestValue(exhibit);
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

// One real country profile (issue #19) — assembled entirely from
// buildCountryProfile()'s own mechanical, data-derived config; this
// component only lays it out. Reuses ExhibitPanel directly for every
// section's primary chart (its real controls, citation, and
// MethodologyDrawer come for free, same reuse discipline the explorer's
// indicator detail view already established) with that country
// emphasized via the existing cross-highlight prop, not a new visual
// language.
export function CountryProfile({ code, exhibits }: { code: string; exhibits: Exhibit[] }) {
  const profile = buildCountryProfile(code, exhibits);
  const base = import.meta.env.BASE_URL;
  if (!profile) {
    return (
      <div className="panel">
        <div className="trend-empty">This is not one of the report's initial 9 profile countries.</div>
      </div>
    );
  }
  const continent = continentOf(profile.country.code);

  return (
    <div className="track-enter">
      <div className="panel">
        <SectionHeader title={profile.country.name} level={2} note={continent ? <span className="trend-note"> · {CONTINENT_LABEL[continent] ?? continent}</span> : undefined} />
        <p className="trend-note">{profile.summary}</p>
        <div className="trend-note" style={{ marginBottom: 8 }}>
          {profile.indicatorCount} real indicator{profile.indicatorCount === 1 ? "" : "s"} from this report reference {profile.country.name}.
        </div>
        {profile.sections.length > 0 && (
          <nav aria-label={`${profile.country.name} profile sections`} className="tab-bar">
            {profile.sections.map((s) => (
              <a key={s.id} href={`#profile-section-${s.id}`} className="chip">
                {s.label}
              </a>
            ))}
          </nav>
        )}
      </div>

      {profile.sections.map((section) => {
        const [primary, ...rest] = section.exhibits;
        const supporting = rest.slice(0, 2);
        const remaining = rest.length - supporting.length;
        return (
          <div key={section.id} className="panel" id={`profile-section-${section.id}`}>
            <SectionHeader title={section.label} level={2} />
            {section.isMissing || !primary ? (
              <div className="trend-empty">
                The report does not contain a comparable indicator for {profile.country.name} in this section.
              </div>
            ) : (
              <>
                <ExhibitPanel exhibit={primary} emphasize={[profile.country.code]} headingLevel={3} />
                {supporting.length > 0 && (
                  <div className="row3" style={{ marginTop: 8 }}>
                    {supporting.map((exhibit) => (
                      <SupportingMetric key={exhibit.id} exhibit={exhibit} base={base} />
                    ))}
                  </div>
                )}
                {remaining > 0 && (
                  <p className="trend-note" style={{ marginTop: 8 }}>
                    +{remaining} more real indicator{remaining === 1 ? "" : "s"} in this section — see the{" "}
                    {/* A plain, unfiltered link for now, not a guessed
                        query string: the explorer's own search text
                        matches exhibit titles/sources/topics, not this
                        page's own section labels, so a filtered deep
                        link here needs real, dedicated wiring — planned
                        for a later PR ("explorer deep links"), not
                        built as a half-working guess in this one. */}
                    <a href={`${base}explorer/`}>full explorer</a> for the complete list.
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
