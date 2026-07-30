import { KpiCard } from "../components/KpiCard.tsx";
import { Sparkline } from "../components/Sparkline.tsx";
import { Sankey } from "../components/Sankey.tsx";
import { ExhibitPanel } from "../components/ExhibitPanel.tsx";
import { SectionHeader, PolicyTakeaway, ExpandableMethods } from "../components/ChartFrame.tsx";
import {
  GALLERY_EXHIBITS,
  galleryTimeseriesSmall,
  galleryTimeseriesManySeries,
  galleryTimeseriesMissingData,
  galleryShareTimeseries,
  galleryLeaderboardYears,
  galleryRankedBar,
  galleryCountryMapCount,
  galleryCountryMapRange,
  galleryLongTitleAndCitation,
  galleryDerivedExhibit,
  gallerySankeyFixture,
  galleryAnnotations,
  galleryTimeseriesForAnnotations,
} from "../dev/fixtures/galleryExhibits.ts";

// Internal, real-component gallery — every example below renders the
// ACTUAL production component (ExhibitPanel, KpiCard, Sankey, the shared
// button/chip classes) against small local fixture data (src/dev/
// fixtures/galleryExhibits.ts), never a mocked visual replica. Gated to
// only ever render in a build with PUBLIC_ENABLE_DEV_GALLERY=true — see
// src/pages/dev/components.astro's own comment for why an env flag was
// chosen over import.meta.env.DEV (testability: a flagged production
// build is what Playwright's existing astro-preview-based test harness
// can actually exercise; a DEV-only route couldn't be tested by the same
// harness at all).
//
// This is a real, useful v1, not an exhaustive tick-through of every
// component this app owns — grow it the same way CLAUDE.md's "Known
// gaps" section already asks every other part of this codebase to grow:
// file by file, as new shared components get built or a real gap is
// found, not as a one-time complete inventory.
const TOKEN_GROUPS: { title: string; tokens: { name: string; value: string }[] }[] = [
  {
    title: "Brand and accent",
    tokens: [
      { name: "--red", value: "#98002e" },
      { name: "--hoover-warm", value: "#887e6f" },
      { name: "--hoover-gray-light", value: "#a7a9ac" },
    ],
  },
  {
    title: "Country identity (named actors only — everyone else is --country-other)",
    tokens: [
      { name: "--country-us", value: "#1f3a5f" },
      { name: "--country-cn", value: "#a8394a" },
      { name: "--country-in", value: "#b3652e" },
      { name: "--country-eu", value: "#b08343" },
      { name: "--country-other", value: "#8a93a3" },
    ],
  },
  {
    title: "Continent tones (non-country categorical series only)",
    tokens: [
      { name: "--cont-na", value: "#2f4b6e" },
      { name: "--cont-sa", value: "#4d8a7a" },
      { name: "--cont-eu", value: "#b08343" },
      { name: "--cont-as", value: "#ab4a41" },
      { name: "--cont-af", value: "#c2762e" },
      { name: "--cont-oc", value: "#7a6a9e" },
      { name: "--cont-me", value: "#8f8a3a" },
    ],
  },
  {
    title: "Surface, text, and border",
    tokens: [
      { name: "--ink", value: "#14181d" },
      { name: "--ink-2", value: "#3a434e" },
      { name: "--slate", value: "#43555f" },
      { name: "--mist", value: "#718d9b" },
      { name: "--line", value: "#dfe2e5" },
      { name: "--line-2", value: "#adbec7" },
      { name: "--panel", value: "#f8f8f8" },
      { name: "--panel-2", value: "#e8e8e8" },
      { name: "--paper", value: "#ffffff" },
    ],
  },
  {
    title: "Status",
    tokens: [{ name: "--status-uncertain", value: "#b3862e" }],
  },
];

const SPACING = ["--sp-1", "--sp-2", "--sp-3", "--sp-4", "--sp-5", "--sp-6"];
const TYPE_SCALE = ["--fs-hero", "--fs-page-title", "--fs-section-title", "--fs-card-value", "--fs-card-label", "--fs-body", "--fs-methods"];
const BREAKPOINTS = ["480px (mobile)", "620px", "768px (tablet)", "900px (scrollytelling sticky disable)", "1023px", "1100px"];

export function ComponentGallery() {
  return (
    <div className="gallery">
      <ExpandableMethods summary="About this page">
        <p>
          This is an internal, development-only page. It documents the real, shared UI and chart components this
          site is built from — every example on this page renders the actual production component against small
          local fixture data, not a mocked replica. It is not linked from the public site navigation and does not
          render in a normal production build (see this route's own build note). Part of{" "}
          <a href="https://github.com/evjohnston/talent-monitor/issues/14" target="_blank" rel="noreferrer">
            issue #14
          </a>
          .
        </p>
      </ExpandableMethods>

      <SectionHeader level={2} title="Foundations" />

      <h3>Color tokens</h3>
      <div className="gallery-swatch-grid">
        {TOKEN_GROUPS.map((group) => (
          <div key={group.title} className="gallery-token-group">
            <div className="trend-note">{group.title}</div>
            {group.tokens.map((t) => (
              <div className="gallery-swatch-row" key={t.name}>
                <span className="gallery-swatch" style={{ background: `var(${t.name})` }} />
                <code>{t.name}</code>
                <span className="trend-note">{t.value}</span>
              </div>
            ))}
          </div>
        ))}
      </div>

      <h3>Spacing scale (8pt grid)</h3>
      <div className="gallery-spacing-row">
        {SPACING.map((s) => (
          <div key={s} className="gallery-spacing-item">
            <div className="gallery-spacing-box" style={{ width: `var(${s})`, height: `var(${s})` }} />
            <code>{s}</code>
          </div>
        ))}
      </div>

      <h3>Type scale</h3>
      <div>
        {TYPE_SCALE.map((f) => (
          <div key={f} style={{ fontSize: `var(${f})`, marginBottom: 4 }}>
            <code style={{ fontSize: 11, color: "var(--slate)" }}>{f}</code> — The quick brown fox
          </div>
        ))}
      </div>

      <h3>Focus ring</h3>
      <p className="trend-note">
        <code>--focus-ring</code> — Hoover red in light mode, a light blue in dark mode (readable against the dark
        panel background). Tab to the button below to see it.
      </p>
      <button type="button" className="ghost-btn">
        Tab to me
      </button>

      <h3>Breakpoints</h3>
      <ul>
        {BREAKPOINTS.map((b) => (
          <li key={b}>{b}</li>
        ))}
      </ul>

      <h3>Motion durations and reduced motion</h3>
      <p className="trend-note">
        Real durations read from <code>src/styles/index.css</code>: theme-color transition 0.2s, ticker live-pulse
        1.8s, track-enter fade-in 0.35s, Sankey particle motion (duration computed per-link). Every one of these is
        gated on <code>prefers-reduced-motion: reduce</code> already — see <code>usePrefersReducedMotion</code> and
        the global <code>scroll-behavior: auto !important</code> override. This page doesn't duplicate that
        verification; <code>tests/interaction.spec.ts</code>/manual browser emulation already cover it for the real
        pages that use motion (the news ticker, the Sankeys).
      </p>

      <SectionHeader level={2} title="Interface components" />

      <h3>Stage navigation</h3>
      <p className="trend-note">
        The real <code>DashboardNav.astro</code> — see this page itself, right below the masthead, for a live
        example (it's the same nav every page uses; not duplicated here to avoid two different "active" states on
        one page).
      </p>

      <h3>Buttons, chips, and pills</h3>
      <div className="tab-bar" style={{ marginBottom: 8 }}>
        <button type="button" className="chip" aria-pressed="true">
          Chip — pressed
        </button>
        <button type="button" className="chip">
          Chip — default
        </button>
        <button type="button" className="chip" disabled>
          Chip — disabled
        </button>
        <span className="pill">Pill (static badge)</span>
        <button type="button" className="ghost-btn">
          Ghost button
        </button>
      </div>
      <p className="trend-note">
        Real 24px+ tall (fixed 2026-07-30 for WCAG 2.5.8 — see <code>CLAUDE.md</code>'s "Responsive and
        reduced-motion sweep").
      </p>

      <h3>Links in context</h3>
      <p>
        A body link reads like <a href="#">this one</a>. A chart-context link (e.g. a methodology deep link) looks
        the same — this app doesn't style links differently by context beyond the one real exception,{" "}
        <code>.pill</code> anchors on the Overview page.
      </p>

      <h3>KPI cards</h3>
      <div className="kpirow">
        <KpiCard label="Static value" value="58,131" caption="No count-up, no sparkline" />
        <KpiCard label="Animated + sparkline" value="42%" numeric={42} formatValue={(n) => `${n.toFixed(0)}%`} caption="Count-up on mount" sparkline={[10, 14, 12, 18, 22, 30, 42]} />
        <KpiCard label="Highlighted" value="149 years" caption="highlight variant" highlight />
        <KpiCard label="Long institution name" value="1,528" caption="span2 variant for long labels" span2 />
      </div>

      <SectionHeader level={2} title="Chart components" />
      <p className="trend-note">
        Every chart below is a real <code>ExhibitPanel</code> rendering a small local fixture <code>Exhibit</code>{" "}
        through the exact same <code>ExhibitChart</code> dispatch every real Track page uses — including its own
        real methodology drawer and download buttons.
      </p>

      <div className="row3">
        <ExhibitPanel exhibit={galleryTimeseriesSmall} />
        <ExhibitPanel exhibit={galleryShareTimeseries} />
        <ExhibitPanel exhibit={galleryTimeseriesMissingData} />
      </div>

      <h3>Series picker (more than 6 series)</h3>
      <div className="panel">
        <ExhibitPanel exhibit={galleryTimeseriesManySeries} />
      </div>

      <h3>Legends and annotations</h3>
      <p className="trend-note">
        Real annotations (issue #15) — a priority-1 event marker (shown by default) and a priority-2 custom marker
        (hidden until "Annotations" is clicked). Same real mechanism as FIG409's COVID marker and FIG606's PERM
        annotation on the live site: a decorative dashed line + label on the chart itself, plus a real, always-present
        list of buttons below it (the actual accessible interface — reachable by keyboard and screen reader
        regardless of hover).
      </p>
      <div className="panel">
        <ExhibitPanel exhibit={galleryTimeseriesForAnnotations} annotations={galleryAnnotations} />
      </div>

      <h3>Leaderboard-years, ranked-bar, and country-map (count vs. range)</h3>
      <div className="row3">
        <ExhibitPanel exhibit={galleryLeaderboardYears} />
        <ExhibitPanel exhibit={galleryRankedBar} />
        <ExhibitPanel exhibit={galleryCountryMapCount} />
      </div>
      <div className="row3">
        <ExhibitPanel exhibit={galleryCountryMapRange} />
        <ExhibitPanel exhibit={galleryLongTitleAndCitation} />
        <ExhibitPanel exhibit={galleryDerivedExhibit} />
      </div>

      <h3>Sankey</h3>
      <div className="panel">
        <Sankey nodes={gallerySankeyFixture.nodes} links={gallerySankeyFixture.links} ariaLabel="Fixture Sankey for the component gallery" width={600} height={220} />
      </div>

      <h3>Sparkline (standalone)</h3>
      <Sparkline values={[4, 6, 5, 8, 12, 11, 15]} />

      <h3>Projection styling — a real, disclosed gap</h3>
      <p className="trend-note">
        There is currently no distinct visual treatment (e.g. a dashed line) for a projected series — FIG109/FIG110
        render their own "(projected)" columns identically to an observed series, distinguished only by the column's
        own label text. Not fabricated here as if it existed; flagged as real follow-up work for the annotation
        system (issue #15)'s own "projection_start" annotation type, not fixed in this gallery issue per its own
        non-goal against redesigning existing chart rendering.
      </p>

      <SectionHeader level={2} title="Methodology and download components" />
      <p className="trend-note">
        Every <code>ExhibitPanel</code> above already renders its own real <code>MethodologyDrawer</code> — short
        source note in the closed <code>&lt;summary&gt;</code>, long citation + source URLs + date range once
        opened, CSV/JSON/SVG download buttons, copy-citation, and copy-link. Open one above (e.g. the
        "long title" fixture) to see the full real methodology surface, including how it handles a genuinely long
        citation. The "Computed by this site" derivation row is visible on the last fixture in the grid above
        (<code>GAL-DERIVED</code>).
      </p>

      <SectionHeader level={2} title="States" />

      <h3>Empty and no-data</h3>
      <div className="trend-empty">No data for this exhibit.</div>

      <h3>Policy takeaway (default and warning tone)</h3>
      <PolicyTakeaway>A default-tone finding sentence, generated from real current data at its call site.</PolicyTakeaway>
      <PolicyTakeaway tone="warning">A warning-tone finding sentence — reduced/uncertain confidence.</PolicyTakeaway>

      <h3>Disabled control</h3>
      <button type="button" className="chip" disabled>
        Disabled chip
      </button>

      <h3>Keyboard focus</h3>
      <p className="trend-note">Tab through this page — every interactive control above shows a real, visible focus ring.</p>

      <SectionHeader level={2} title="Responsive patterns" />
      <p className="trend-note">
        This page uses the same real <code>.grid3</code>/<code>.kpirow</code> responsive classes as every Track
        page — resize the window or check the committed visual-regression snapshots at 1440×1000, 1024×768, and
        390×844 (<code>tests/visual-regression.spec.ts</code>) rather than a separate, gallery-only breakpoint
        system.
      </p>
    </div>
  );
}

// Exported for tests / future gallery growth — the real fixture list this
// page's chart section renders, without re-importing the fixtures module
// twice.
export const GALLERY_FIXTURE_COUNT = GALLERY_EXHIBITS.length;
