# Claude Code Task List: Global Talent Monitor Overhaul

## project objective

Completely redesign the current Global Talent Monitor as an interactive web publication based on *The Great Talent Competition Index*. The existing site should no longer read as a long dashboard made from equal-sized cards and static line charts. It should become a guided data story with large interactive views, clear editorial pacing, country and topic exploration, transparent methods, and a strong Hoover Institution identity.

Use the old MacroPolo digital projects, especially the Global AI Talent Tracker, as the main product and interaction reference. Use the Hoover materials as the authority for brand, editorial style, names, citations, figure notes, and institutional presentation.

The finished site must work as a static deployment. It may use client-side JavaScript, but it must not require a server or database to display the core report.

---

## source hierarchy

Use these sources in this order:

1. **The report manuscript:** `Talent Report V2 - 20260710 - Draft Copy for Caroline.docx`
   - Source of truth for findings, values, chapter structure, qualifications, figure titles, table titles, notes, and source language.
   - Do not silently rewrite claims or alter data.
   - Preserve distinctions among foreign-born people, noncitizens, temporary visa holders, and international students.
2. **The Hoover style guide:** `Hoover Style Guide April 2026.pdf`
   - Source of truth for editorial form, capitalization, abbreviations, numbers, punctuation, titles, citations, notes, and official program names.
3. **The current Global Talent Monitor implementation and supplied screenshots**
   - Source of reusable code, data, chart logic, and existing page state.
   - Do not preserve weak layout choices merely because they already exist.
4. **Old MacroPolo digital projects**
   - Reference for editorial pacing, interactive exploration, flow diagrams, country profiles, methods, and transitions between headline findings and deeper analysis.
   - Do not copy MacroPolo branding or reproduce its exact layout.
5. **Previously supplied project palette**
   - Hoover red: `#98002E`
   - Warm neutral: `#887E6F`
   - Light gray: `#A7A9AC`
   - Dark gray: `#777575`
   - Add white, near-black, and derived tints only as needed for contrast and chart scales.

When sources conflict, keep the report’s data and wording, then apply the Hoover guide’s editorial rules. Document unresolved conflicts instead of guessing.

---

## non-negotiable product rules

- Do not rebuild the current three-column card wall with new colors.
- Do not give every chart the same size or weight.
- Do not place dozens of small line charts on one page without narrative grouping.
- Do not use animation as decoration.
- Do not auto-scroll, auto-play, or move content without user action.
- Do not hard-code chart values inside components.
- Do not invent missing data, fill gaps, or smooth series without a documented rule.
- Do not use red and green alone to distinguish positive and negative values.
- Do not hide sources, caveats, definitions, or units.
- Do not require hover to access essential information.
- Do not remove the ability to view exact values.
- Do not change the report’s substantive claims during design work.
- Do not download or bundle unapproved font files.
- Do not add a backend unless a documented requirement cannot be met by a static build.
- Do not ship a page that fails with JavaScript disabled. At minimum, provide titles, findings, source notes, and static chart fallbacks.

---

## definition of done

The overhaul is complete when:

- The site has a clear overview and six report stages:
  1. Foundation
  2. Degree Production
  3. Graduate and Postdoctoral Training
  4. Workforce Entry
  5. Retention and Immigration
  6. Research Output and Competitiveness
- Each stage opens with one large finding and one large interactive visual.
- Supporting material follows in an editorial sequence, not an undifferentiated grid.
- Every report figure and table has a documented web disposition: hero visual, supporting visual, integrated comparison, data table, methodology-only item, or excluded with reason.
- Charts update from structured data files rather than values embedded in markup.
- Filters, selections, time ranges, and compare states work through keyboard and touch.
- The URL stores the active stage and meaningful explorer state.
- Each visual has a source, date range, unit, population definition, caveat link, data download, and accessible text summary.
- The site has responsive layouts for large desktop, laptop, tablet, and mobile.
- The site has print and no-JavaScript fallbacks.
- Automated tests cover data parsing, key calculations, routing, filters, keyboard use, and visual regressions.
- Lighthouse or equivalent checks meet the targets listed below.
- The deployed build contains no console errors, broken links, clipped labels, inaccessible controls, or empty chart containers.

---

# phase 0: audit before changing code

## 0.1 create a safe working branch

- [ ] Create a dedicated overhaul branch.
- [ ] Record the current build command, deployment command, framework, chart libraries, data locations, and route structure.
- [ ] Run the current build and tests before editing.
- [ ] Capture baseline screenshots at:
  - 1440 × 1000
  - 1024 × 768
  - 768 × 1024
  - 390 × 844
- [ ] Save the baseline Lighthouse or equivalent report.
- [ ] Note all existing warnings, broken charts, missing assets, and console errors.

## 0.2 inventory the repository

Create `docs/current-state-audit.md` with:

- [ ] Framework and version
- [ ] Build system
- [ ] Hosting assumptions
- [ ] Source directories
- [ ] Data directories
- [ ] Existing chart components
- [ ] Existing map components
- [ ] Existing typography and color tokens
- [ ] Existing routing and URL-state behavior
- [ ] Existing analytics
- [ ] Existing accessibility support
- [ ] Existing tests
- [ ] Existing data update scripts
- [ ] Existing report-to-chart mapping
- [ ] Code that should be reused
- [ ] Code that should be replaced
- [ ] Major technical risks

## 0.3 audit the current user experience

Document the current problems with screenshots and exact page locations:

- [ ] Too many equal-weight cards
- [ ] Excessive use of small line charts
- [ ] Tiny labels and legends
- [ ] Large blank areas inside cards
- [ ] Weak visual distinction between headline findings and secondary evidence
- [ ] Long scroll with little change in rhythm
- [ ] Too many visible series at once
- [ ] Repeated methodology links consuming space
- [ ] Tables used where a chart, flow, or comparison would communicate faster
- [ ] Charts that are technically interactive but do not change the user’s understanding
- [ ] Controls that are unclear, duplicated, or too small
- [ ] Maps with low contrast or no clear interactive purpose
- [ ] Mobile problems
- [ ] Keyboard problems
- [ ] Missing or weak empty, loading, and error states

Do not begin the redesign until this audit exists.

---

# phase 1: build a report-to-web crosswalk

## 1.1 create a full content inventory

Create `content/report-crosswalk.csv` or an equivalent structured file with one row for every report figure, table, box, and major finding.

Required fields:

- `report_id`
- `report_type`
- `report_chapter`
- `report_page`
- `report_title`
- `stage`
- `data_source`
- `source_year`
- `unit`
- `population_definition`
- `current_web_component`
- `current_data_file`
- `proposed_web_role`
- `proposed_chart_type`
- `proposed_interactions`
- `proposed_filters`
- `priority`
- `status`
- `caveat`
- `download_file`
- `notes`

## 1.2 assign every report item a disposition

Use only these values for `proposed_web_role`:

- `stage_hero`
- `supporting_visual`
- `integrated_into_other_visual`
- `interactive_table`
- `methodology_only`
- `download_only`
- `exclude_with_reason`

No item may remain unclassified.

## 1.3 identify repeated datasets

- [ ] Group figures that use the same source and can share one data adapter.
- [ ] Combine related charts where one explorer can replace several nearly identical cards.
- [ ] Keep the ability to reproduce every report view through presets or controls.
- [ ] Record any calculations performed in the current code but not documented in the report.
- [ ] Flag inconsistent labels, units, populations, years, or denominators.
- [ ] Do not repair substantive inconsistencies without author review.

## 1.4 create a metric registry

Create a typed metric registry, for example `src/data/metrics.ts`, with:

- Metric ID
- Display name
- Short label
- Definition
- Unit
- Format function
- Source
- Source URL
- First year
- Latest year
- Update frequency
- Geographic level
- Population
- Caveats
- Related report figure or table
- Recommended chart forms

All chart components must read titles, units, source labels, and number formats from this registry where practical.

---

# phase 2: replace the information architecture

## 2.1 use an editorial publication model

Build the site around three layers:

### layer A: guided overview

A concise landing experience that explains the two talent streams and the six stages. It should answer:

- What is the report measuring?
- Where is the United States most dependent on international talent?
- Where does the domestic pipeline lose people?
- Where does the immigration pipeline lose people?
- Where has research leadership shifted?
- Which stage should the reader explore next?

### layer B: stage narratives

Each stage should have:

1. A stage thesis in one or two sentences
2. A large hero visual
3. Two to four supporting sections
4. A compact set of related indicators
5. A definitions and methods drawer
6. Links to related stages
7. A data download area

### layer C: full data explorer

Create a separate explorer for readers who want to browse all indicators. This may use a denser layout, but it must have:

- Search
- Stage filter
- Topic filter
- Geography filter
- Unit filter
- Chart/table toggle where useful
- Sort
- Saved URL state
- Data download
- Clear result count

The explorer is where the comprehensive chart collection belongs. It must not dictate the stage-page layout.

## 2.2 routes and URL state

Use stable, readable URLs such as:

- `/talent-monitor/`
- `/talent-monitor/foundation/`
- `/talent-monitor/degree-production/`
- `/talent-monitor/graduate-training/`
- `/talent-monitor/workforce-entry/`
- `/talent-monitor/retention-immigration/`
- `/talent-monitor/research-output/`
- `/talent-monitor/explorer/`
- `/talent-monitor/methodology/`
- `/talent-monitor/downloads/`

Store meaningful state in query parameters, for example:

- `?country=india`
- `?field=computer-science`
- `?degree=masters`
- `?metric=share`
- `?year=2024`
- `?compare=us,china`
- `?view=flow`

Back and forward navigation must restore state.

## 2.3 navigation

Replace the wide tab strip with a system that works at all widths:

- Desktop: sticky stage rail or compact horizontal navigation
- Tablet: scrollable stage tabs with clear active state
- Mobile: stage menu plus previous/next stage controls

Keep stage names readable. Do not abbreviate them merely to fit.

## 2.4 news ribbon

The current news ribbon is optional and secondary.

- [ ] Do not auto-scroll it.
- [ ] Add pause only if any movement remains.
- [ ] Make it collapsible.
- [ ] Do not let it push the report title below the fold.
- [ ] Hide it when there is no current feed.
- [ ] Separate live news from fixed report findings.
- [ ] Label publication and date for every item.

---

# phase 3: build the Hoover design system

## 3.1 create design tokens

Create a central token file and CSS custom properties.

At minimum include:

- Brand colors
- Neutral scale
- Data-series scale
- Diverging scale
- Sequential scale
- Backgrounds
- Borders
- Text colors
- Focus ring
- Spacing
- Type sizes
- Line heights
- Measure widths
- Breakpoints
- Border radii
- Shadows
- Transition durations
- Chart stroke widths
- Chart point sizes
- Annotation styles
- Z-index layers

Start from:

```css
--hoover-red: #98002E;
--hoover-warm: #887E6F;
--hoover-gray-light: #A7A9AC;
--hoover-gray: #777575;
```

Add derived tints through documented calculations. Do not make every chart red. Hoover red should mark selection, emphasis, active navigation, and the main institutional accent.

## 3.2 typography

- [ ] Use approved project or institutional web fonts already available in the repository or through an authorized web source.
- [ ] Do not add local font files without approval.
- [ ] Create a clear distinction among:
  - Publication title
  - Stage title
  - Finding headline
  - Chart title
  - Chart annotation
  - Body text
  - Source and method text
  - Interface labels
- [ ] Keep body copy within a readable line length.
- [ ] Increase chart-title and axis-label sizes relative to the current site.
- [ ] Do not use monospaced text for body copy or long labels.
- [ ] Use tabular numbers in metrics and tables.

## 3.3 visual character

The site should feel like a Hoover research publication translated to the web:

- White or warm-white reading field
- Strong black or near-black text
- Hoover red used with restraint
- Warm neutral panels
- Thin, precise rules
- Large margins around major findings
- No glossy gradients
- No glassmorphism
- No neon or science-fiction effects
- No excessive rounded cards
- No ornamental icons where text is clearer
- No generic “dashboard blue”

## 3.4 component library

Build and document reusable components:

- `SiteHeader`
- `PublicationMasthead`
- `StageNav`
- `FindingHero`
- `StatBlock`
- `ChartFrame`
- `ChartToolbar`
- `Legend`
- `FilterGroup`
- `SegmentedControl`
- `RangeSlider`
- `CompareTray`
- `Annotation`
- `SourceNote`
- `MethodologyDrawer`
- `DefinitionPopover`
- `DataTable`
- `DownloadMenu`
- `RelatedFinding`
- `StageNextPrev`
- `NoDataState`
- `ErrorState`
- `StaticFallback`

Create a component gallery or Storybook equivalent if the stack supports it.

---

# phase 4: rebuild the data and chart architecture

## 4.1 normalized data model

Move all chart data into a documented structure such as:

```text
data/
  raw/
  processed/
  metadata/
  downloads/
  snapshots/
```

Each processed dataset should include:

- Stable IDs
- Clear column names
- ISO country codes where relevant
- Display labels separate from IDs
- Units
- Years
- Missing-value flags
- Projection flags
- Source identifiers
- Revision date

## 4.2 build scripts

- [ ] Create repeatable scripts that transform raw files into browser-ready CSV or JSON.
- [ ] Validate schemas at build time.
- [ ] Fail the build on duplicate IDs, invalid years, impossible percentages, missing source metadata, or unknown category values.
- [ ] Write tests for every derived metric used in a headline.
- [ ] Preserve raw input files.
- [ ] Add a data changelog.
- [ ] Add `last_updated` metadata to every dataset.
- [ ] Document how to update each source.

## 4.3 chart library strategy

Inspect the current stack before choosing tools.

Preferred approach:

- Use a declarative library for standard line, area, bar, dot, scatter, and heatmap charts.
- Use D3 or equivalent only for custom flows, Sankey diagrams, force layouts, and complex transitions.
- Use semantic HTML for tables.
- Use SVG for most charts so text remains sharp and accessible.
- Use Canvas only when the data volume requires it.
- Avoid multiple chart libraries that solve the same problem.

Record the decision in `docs/chart-architecture.md`.

## 4.4 shared chart behavior

Every chart must support:

- Responsive resizing
- Keyboard-accessible series controls
- Touch-friendly controls
- Exact-value access
- Clear units
- Source link
- Data download
- Static fallback
- Accessible summary
- Empty state
- Error state
- Reduced-motion mode

Time-series charts should also support:

- End labels where possible
- Direct series selection
- Focus mode
- Year-range selection when meaningful
- Annotation markers
- Projection styling
- Missing-data styling

## 4.5 avoid overloaded legends

When more than six series are available:

- Default to a small authored selection.
- Put the rest in a searchable series picker.
- Allow “show all,” but do not make it the default.
- Highlight one selected series while muting others.
- Keep selection state in the URL.
- Use direct labels for the main series where possible.

---

# phase 5: redesign the global shell

## 5.1 masthead

Create a publication masthead that includes:

- Hoover Institution or approved project lockup
- Technology Policy Accelerator name
- Report title
- Authors
- Publication date
- One-sentence description
- Report/download link
- Methodology link
- “Last data update” label

Do not let the project logo float alone without clear publication identity.

## 5.2 opening sequence

The first screen should contain:

- Report title
- One clear sentence about the two talent streams
- One strong visual or animated-but-user-controlled diagram
- A prompt to explore the pipeline
- No more than four headline numbers

The opening should not begin with six small KPI cards.

## 5.3 sticky context

While scrolling a stage:

- Keep the stage name visible.
- Show progress within the stage.
- Let the reader jump among major findings.
- Do not cover chart titles or tooltips.
- Disable sticky behavior when it harms small screens.

## 5.4 footer

Include:

- Authors
- Institutional credits
- Full program names on first reference
- Report citation
- Data license where known
- Source and methods links
- Accessibility statement
- Contact
- Version and build date

---

# phase 6: rebuild the overview

## 6.1 “two streams of talent” visual

Replace the small current Sankey with a full-width visual that explains domestic and international talent flows.

Required behavior:

- Domestic and international starting groups
- Degree-level destinations
- Toggle between count and within-level share
- Optional particles off by default
- Hover, focus, and tap details
- Text explanation that changes with the selected view
- Clear note when levels are normalized rather than weighted by total volume
- Mobile layout that becomes stacked steps rather than a compressed Sankey

## 6.2 pipeline navigator

Create an interactive pipeline from foundation through research output.

Each stage should show:

- One headline metric
- One sentence
- Direction of change
- Main bottleneck or dependency
- Link to the stage page

Selecting a stage should update the central diagram and URL.

## 6.3 top findings

Turn the report’s top findings into an authored sequence, not a row of identical cards.

Use a mix of:

- Large number plus sparkline
- Before/after comparison
- Mini slopegraph
- Small flow
- Ranked bars
- Short annotation

Do not show more than five at once. Add a “show all findings” action.

## 6.4 overview scrollytelling

Create a short scroll-led sequence with a sticky visual and changing text:

1. The United States trains domestic talent.
2. It also imports talent.
3. Dependence rises at graduate levels.
4. Entry and retention add gates.
5. Research output is shifting.
6. The two streams compound each other.

The visual must remain understandable without scrolling animation. In reduced-motion mode, show static steps.

---

# phase 7: rebuild each stage

## 7.1 foundation

### stage thesis

American math performance has not returned to its 2012 level, while spending alone does not explain outcomes and many students leave the STEM path before completing a degree.

### hero visual

Build an interactive PISA performance chart:

- Math, reading, and science
- Indexed to the report’s comparison baseline
- Direct end labels
- Hover and keyboard values
- Toggle between indexed change and reported score
- Benchmark lines
- Major assessment annotations
- Short written takeaway that updates with the selected subject

### supporting modules

- [ ] **OECD comparison map and rank**
  - Link map selection to a ranked dot plot.
  - Selecting a country should show score, rank, proficiency share, spending, and difference from the United States.
  - Provide a map-free table view.
- [ ] **Spending versus results**
  - Scatterplot with country search, OECD average reference lines, and a US callout.
  - Toggle among math, reading, and science.
- [ ] **STEM completion path**
  - Replace separate attrition cards with a cohort flow from STEM entry to STEM degree, major switching, continued enrollment, and college exit.
  - Toggle between cohorts.
- [ ] **When students leave**
  - Use a step or survival-style chart instead of many small lines.
- [ ] **Study abroad**
  - Treat as a secondary expandable section with origin/destination flow and field filters.

### foundation acceptance criteria

- No default chart has more than six visible series.
- Map and rank stay synchronized.
- Completion percentages and denominators are explicit.
- The user can distinguish leaving STEM from leaving college.

---

## 7.2 degree production

### stage thesis

US degree production has grown, with master’s degrees becoming the main advanced STEM credential and international students accounting for a large share in several fields.

### hero visual

Build a long-run doctorate timeline:

- 1900 through the latest year in the report
- Historical annotations drawn from the chapter narrative
- Toggle among all research doctorates, science and engineering, and non-science fields
- Brush or range selection
- Presets for major periods
- Exact values and source notes
- Projection styling kept separate from observed data

### supporting modules

- [ ] **Degree production composition**
  - Replace several similar line charts with one explorer.
  - Toggle count, share, and change.
  - Filter by degree level and field.
- [ ] **Domestic versus international**
  - Use 100 percent stacked bars, slopegraphs, or a matrix to show international share by degree and field.
  - Let users switch between the latest year and time trend.
- [ ] **Field dependence**
  - Create a searchable ranked chart showing how much US STEM training goes to international students.
  - Toggle count, share, and change.
- [ ] **2050 production race**
  - Use a clear observed-to-projected chart with a projection boundary.
  - Toggle total output and per-capita output.
  - Provide projection assumptions in the methodology drawer.
- [ ] **Definitions**
  - Add an accessible comparison of IPEDS and Survey of Earned Doctorates populations.

### degree-production acceptance criteria

- Observed and projected values cannot be mistaken for each other.
- Degree counts and shares never share an axis.
- Users can reproduce all report figures through presets.
- International status definitions are visible at point of use.

---

## 7.3 graduate and postdoctoral training

### stage thesis

International students make up much of US graduate and postdoctoral training, with major differences by degree, field, and country of origin.

### hero visual

Build an international training explorer:

- Default view: degree level over time
- Toggle between count and share
- Filter by country, region, degree level, and field
- Select up to four comparison series
- Clear endpoint labels
- Highlight recent changes
- Allow a country profile to open from any selected series

### supporting modules

- [ ] **Origin map with time slider**
  - Show where international undergraduates, graduate students, and STEM students come from.
  - Toggle level and measure.
  - Link map to ranked list.
- [ ] **Country × field concentration matrix**
  - Replace three crowded line-card charts with one interactive heatmap.
  - Rows: source countries
  - Columns: engineering, math and computer science, physical and life sciences, and other report categories
  - Toggle year and count/share
  - Click a cell to open its time trend
- [ ] **Postdoctoral composition**
  - Large line or area chart for engineering, science, and health.
  - Toggle count and international share when data permits.
- [ ] **Federally funded centers**
  - Compare temporary visa holders with US citizens and permanent residents.
  - Include institution or field detail only where the source supports it.
- [ ] **Recruitment and enrollment change**
  - Use compact ranked bars with question wording retained.
  - Group survey results separately from administrative time series.
- [ ] **Economic contribution**
  - Use one large annotated line with inflation/nominal caveat as required by the source.

### graduate-training acceptance criteria

- Country and field filters update all linked views.
- Crowded multi-country charts are replaced by focus-plus-context interactions.
- Survey responses are not presented as population counts.
- Country names and official labels are consistent.

---

## 7.4 workforce entry

### stage thesis

Entry into the US STEM workforce depends heavily on international talent, while H-1B approvals remain concentrated among a limited set of employers and many leading AI companies have immigrant founders.

### hero visual

Build an H-1B employer concentration explorer:

- Top-10 employer share over time
- Toggle top 5, top 10, and top 25
- Show employer mix for the selected year
- Distinguish new and renewal approvals when the data supports it
- Search employers
- Show rank change
- Annotate major policy or data-definition changes only when documented

### supporting modules

- [ ] **Employer ranking**
  - Interactive ranked table with year selector, search, sort, and downloadable CSV.
  - Normalize employer names and document parent/subsidiary treatment.
- [ ] **STEM employment after STEM degree**
  - Use a grouped dot plot or small multiples by degree and nativity.
  - Avoid eight undifferentiated lines.
- [ ] **AI founder origins**
  - Build an origin-to-company flow or map.
  - Provide company list and valuation view.
  - Keep founder-origin categories exactly as defined in the report.
- [ ] **Company valuation**
  - Show companies in a ranked chart with founder-origin filters.
  - Do not imply causation between founder origin and valuation.
- [ ] **Where research staff work**
  - Compare domestic and global research staffing in one coordinated view.
- [ ] **Temporary visa concentration by occupation**
  - Use a field selector and direct comparison rather than one overloaded line chart.

### workforce-entry acceptance criteria

- Employer name normalization is documented.
- The selected year appears in the URL.
- Company valuations state the valuation date and source.
- Maps have a ranked-list alternative.
- Charts distinguish share, count, and concentration.

---

## 7.5 retention and immigration

### stage thesis

High intent to stay does not guarantee long-term retention. International graduates pass through separate immigration gates, and delays differ sharply by visa category and nationality.

### hero visual

Rebuild “The Retention Gap” as a full-width cohort flow:

- Intent to stay
- In the United States at five years
- In the United States at ten years
- Left within five years
- Left between five and ten years
- Toggle field where the report supports it
- Explain that the intent and outcome series may come from different populations
- Do not animate particles by default

### supporting modules

- [ ] **Immigration pathway**
  - Create an interactive sequence:
    - F-1 or J-1
    - OPT
    - STEM OPT
    - H-1B
    - PERM
    - EB-1, EB-2, or EB-3
  - Selecting a stage should show its cap, clock, dependency, failure point, and relevant report data.
  - Make this a plain step diagram on mobile.
- [ ] **Stay intentions versus observed stay**
  - Show the series side by side with a warning against treating them as one cohort.
- [ ] **STEM OPT**
  - Separate received, approved, denied, and approval rate using small multiples or count/rate tabs.
  - Do not put rates and counts on one axis.
- [ ] **H-1B approvals and denials**
  - Build a linked policy timeline.
  - Separate new and renewal petitions.
- [ ] **PERM outcomes**
  - Use a flow or stacked outcome view.
  - Add filters for year and nationality where available.
- [ ] **Unused PERM certifications**
  - Create a ranked view with used, expired, share expired, and change.
  - Fix repeated labels and verify country grouping.
- [ ] **Green card wait explorer**
  - Build a country and category selector for EB-1, EB-2, and EB-3.
  - Show current wait and historical change.
  - Explain that dates and waits derive from Visa Bulletin cutoffs.
  - Add a visible data-as-of date.
- [ ] **J-1 scholars**
  - Use focus mode and a country selector rather than many default lines.
- [ ] **Immigrant employment rates**
  - Map plus ranked comparison, with population definition beside the title.
- [ ] **Train and lose**
  - Ranked field view for ten-year loss rates.

### retention acceptance criteria

- No mixed count/rate axis.
- Every immigration chart has an as-of date.
- Nationality is not presented as citizenship when the source measures country of chargeability or another category.
- The user can trace the entire path from student status to permanent residence.
- The site states where series are not directly comparable.

---

## 7.6 research output and competitiveness

### stage thesis

The United States retains large research assets, but China has gained ground in publications, citations, AI conferences, patents, and R&D.

### hero visual

Build a US–China research competition explorer.

Allow the user to switch among:

- Top conference participation
- Most-cited emerging technology research
- Authors on top papers
- Highly cited researchers
- R&D spending
- R&D intensity
- Patents
- Company research impact

For each metric:

- Use a chart form suited to the metric.
- Keep definitions and years visible.
- Show who leads, the size of the gap, and the direction of change.
- Do not combine unrelated measures into an invented composite score unless the report contains one.

### supporting modules

- [ ] **AI conference catch-up**
  - Replace the long static table with searchable conference small multiples or a crossing timeline.
  - Show the year China overtook the United States.
  - Filter by field.
  - Keep “not yet” explicit.
- [ ] **Most-cited work**
  - Use direct US–China comparison with selected technology fields.
- [ ] **Highly cited researchers**
  - Toggle count and global share.
  - Keep scales separate.
- [ ] **Prizes and laureates**
  - Use rolling-average chart plus immigrant/born-citizen breakdown.
  - Keep prize definitions and windows visible.
- [ ] **R&D spending**
  - Separate spending level, growth, intensity, type, and performer.
  - Use tabs rather than putting all metrics in one chart.
- [ ] **R&D today versus tomorrow**
  - Use grouped bars or a slope/stack view for basic research, applied research, and experimental development.
  - Toggle United States and China.
- [ ] **R&D by performer**
  - Use a normalized and absolute view for business, government, higher education, and private nonprofit sectors.
- [ ] **Patent leadership over time**
  - Replace the heatmapped table with an animated-on-demand bar-chart race, bump chart, or slopegraph for 2005, 2015, and 2025.
  - Keep a table view for exact counts.
  - Allow filter by country and company.
  - Do not auto-play.
- [ ] **Critical technology patents**
  - Use one coordinated explorer with biotechnology, semiconductors, and computer technology tabs.
  - Highlight selected countries and mute the rest.
- [ ] **Company research impact**
  - Add company, country, and metric filters.
  - State the citation measure and time window.
- [ ] **University rankings**
  - Use field selector and clear indication that rankings are source-specific.

### research-output acceptance criteria

- No invented overall competition score.
- Every metric keeps its own unit and denominator.
- Patent data documents differences in corporate consolidation across sources.
- Conference overtaking logic is tested.
- Projected, rolling-average, and observed series are clearly labeled.

---

# phase 8: add cross-site exploration

## 8.1 country profiles

Create reusable country profile pages or drawers for at least:

- United States
- China
- India
- United Kingdom
- Germany
- South Korea
- Japan
- Canada
- Australia

Each profile should use available report data only and contain:

- Role in talent production
- Role in US enrollment
- Degree or field concentration
- Workforce or founder links
- Retention or immigration data where applicable
- Research output
- Source list
- Missing-data notice

Do not write generic country essays.

## 8.2 compare mode

Allow users to compare up to four countries or categories across compatible metrics.

- [ ] Keep comparisons only among compatible units.
- [ ] Warn when years differ.
- [ ] Provide a “clear comparison” action.
- [ ] Save comparison in the URL.
- [ ] Make selected colors consistent across the current session.
- [ ] Preserve Hoover red for the main selected or US series rather than using it for every country.

## 8.3 linked interactions

Use coordinated views where they add clear value:

- Map selection updates ranking and trend
- Heatmap cell opens time series
- Year slider updates map, rank, and text
- Country selection updates stage-level summary
- Degree and field selections update all compatible charts
- Selected series remain selected while moving among related views

Do not link unrelated charts merely because the framework allows it.

## 8.4 annotations

Create an annotation system driven by data rather than chart-specific code.

Required fields:

- `metric_id`
- `date_or_year`
- `label`
- `detail`
- `source`
- `priority`
- `mobile_label`
- `show_in_default_view`

Annotations should appear only where they help explain a visible change.

---

# phase 9: methodology, citations, and downloads

## 9.1 source notes

Every visual must include:

- Source organization
- Dataset or publication name
- Data years
- Latest update
- Calculation note
- Link to full methodology
- Download action

Keep the short source line under the visual. Put the full explanation in a drawer or dedicated page.

## 9.2 figure and table notes

Follow the Hoover guide:

- Keep notes directly with the figure or table.
- Use nonnumbered symbols for figure-specific notes where needed.
- Do not mix figure notes into the report’s main endnote sequence.
- Keep titles, captions, sources, and data files together in the content model.

## 9.3 report citation

Provide:

- Full report citation
- Short citation
- Copy citation button
- Download report button
- Authors and institutions
- Publication date
- Version date

## 9.4 methodology page

Build one searchable methodology page with:

- Definitions
- Data-source catalog
- Report-to-web crosswalk
- Calculation methods
- Missing-data conventions
- Projection methods
- Geographic definitions
- Employer normalization
- Company-parent aggregation
- Known source breaks
- Revision history
- Download links

Deep links from charts should open the relevant methodology section.

## 9.5 data downloads

Provide:

- CSV for each chart
- Combined stage CSV or ZIP
- Metadata dictionary
- Source list
- License or reuse note where known
- Version and update date
- Machine-readable JSON where useful

Downloaded files should use stable, descriptive names.

---

# phase 10: editorial implementation

## 10.1 apply Hoover style rules

Create an editorial QA checklist and automated checks where possible.

At minimum:

- [ ] Use Chicago Manual of Style, 18th edition.
- [ ] Use official program names.
- [ ] Spell out organizations on first reference before abbreviations.
- [ ] Use `PhD`, not `Ph.D.`
- [ ] Use headline-style capitalization for titles.
- [ ] Use curly quotation marks and apostrophes in authored copy.
- [ ] Use serial commas.
- [ ] Use one space after punctuation.
- [ ] Use en dashes for ranges.
- [ ] Follow the guide’s online-number rules in interface copy.
- [ ] Express percentages as numerals.
- [ ] Name websites in prose rather than exposing raw URLs.
- [ ] Keep source citations complete even when links are present.

## 10.2 preserve report distinctions

Add lintable definitions for:

- Foreign-born
- Noncitizen
- Temporary visa holder
- International student
- US citizen and permanent resident
- Country of origin
- Nationality
- Country of chargeability
- Current affiliation
- Undergraduate training location

Flag charts that use one term in the title but another in the data.

## 10.3 rewrite interface copy only

Claude Code may edit:

- Button labels
- Filter labels
- Tooltips
- Navigation
- Short chart summaries
- Error messages
- Empty states
- Method labels

Claude Code must not independently rewrite:

- Main report claims
- Policy analysis
- Chapter conclusions
- Historical narrative
- Source qualifications

Place proposed substantive edits in `docs/editorial-questions.md`.

---

# phase 11: accessibility and responsive behavior

## 11.1 accessibility target

Meet WCAG 2.2 AA.

Required work:

- [ ] Logical heading order
- [ ] Skip link
- [ ] Visible focus
- [ ] Keyboard navigation for all controls
- [ ] Touch targets of at least 44 × 44 CSS pixels where practical
- [ ] Color contrast checks
- [ ] Patterns, labels, or line styles in addition to color
- [ ] Reduced-motion support
- [ ] Screen-reader chart summaries
- [ ] Data-table alternatives
- [ ] No content available only on hover
- [ ] Tooltip dismissal
- [ ] Accessible names for SVG elements where used
- [ ] Live-region updates only when needed
- [ ] No focus traps in drawers
- [ ] Correct dialog behavior
- [ ] Accessible download menus

## 11.2 mobile redesign

Do not merely shrink desktop charts.

On mobile:

- Convert wide Sankeys to vertical step flows.
- Convert large tables to focused rows or cards with a table option.
- Use bottom sheets for filters where appropriate.
- Limit default visible series.
- Stack related controls.
- Keep chart titles above controls.
- Avoid horizontal page scrolling.
- Preserve exact values through tap or table view.
- Disable sticky elements that consume too much height.

## 11.3 print and static fallback

Create:

- Print stylesheet
- Static SVG or PNG fallback per major chart
- Plain-language summary per chart
- Page-break rules
- Source notes that remain visible in print
- No clipped charts
- No hidden footnotes
- A static report-summary route suitable for PDF capture

The interactive site supplements the report. It should not replace access to the report itself.

---

# phase 12: performance and resilience

## 12.1 performance budgets

Targets on a representative mobile connection:

- Lighthouse performance: at least 90 for key routes
- Accessibility: 100 where feasible, never below 95
- Best practices: at least 95
- SEO: at least 95
- Largest Contentful Paint: under 2.5 seconds
- Cumulative Layout Shift: under 0.1
- Interaction to Next Paint: under 200 ms for common controls
- Initial JavaScript: keep as small as the existing stack allows; document the final size
- No chart library loaded on routes that do not use it

## 12.2 lazy loading

- [ ] Load below-the-fold charts when near the viewport.
- [ ] Preload the next stage’s essential data only.
- [ ] Split large geography files.
- [ ] Use simplified map geometry.
- [ ] Cache processed datasets.
- [ ] Avoid rerendering every chart when one filter changes.
- [ ] Memoize expensive transforms.
- [ ] Cancel stale async work.

## 12.3 resilience

- [ ] The page should show a useful message if a dataset fails to load.
- [ ] One failed chart must not blank the stage.
- [ ] Log data errors with enough context to debug.
- [ ] Provide static fallback content.
- [ ] Validate external links during build.
- [ ] Do not fetch core data from third-party sites at runtime.

---

# phase 13: testing and review

## 13.1 unit tests

Write tests for:

- Data schemas
- Percentage-point calculations
- Relative-change calculations
- Rank calculations
- “China overtook” year logic
- Top-N employer concentration
- Cohort-flow arithmetic
- Projection labels
- Number formatting
- Missing values
- Country-name normalization
- Employer-name normalization
- URL-state parsing

## 13.2 interaction tests

Use Playwright, Cypress, or the current test framework.

Test:

- Stage navigation
- Browser back and forward
- Filter selection
- Series search
- Compare mode
- Map and ranking linkage
- Heatmap-to-trend linkage
- Methodology drawer
- Data download
- Keyboard navigation
- Mobile filter sheet
- No-data states
- Reduced-motion mode
- JavaScript-disabled fallback

## 13.3 visual regression tests

Capture the following routes at desktop, tablet, and mobile:

- Overview
- Each of six stages
- Explorer
- Methodology
- A country profile
- A compare state
- A no-data state
- A long-label state
- Print view

Review for:

- Clipping
- Collisions
- Tiny labels
- Bad wrapping
- Empty space
- Legend overflow
- Tooltip cutoff
- Sticky-header overlap
- Incorrect color
- Inconsistent active states

## 13.4 data review sheet

Generate a machine-readable and human-readable review file listing, for every visual:

- Latest value
- Earliest value
- Change
- Units
- Source
- Date range
- Number of rows
- Missing values
- Report figure/table reference
- Screenshot path

This is for author verification before launch.

---

# phase 14: deployment and maintenance

## 14.1 deployment

- [ ] Preserve the current public URL or add redirects.
- [ ] Test static-host compatibility.
- [ ] Add cache headers or hashed assets.
- [ ] Generate sitemap and social metadata.
- [ ] Add share images for the overview and each stage.
- [ ] Verify canonical URLs.
- [ ] Preserve analytics only after privacy review.
- [ ] Add version and build date to the footer.

## 14.2 maintenance documentation

Create:

- `README.md`
- `docs/content-update-guide.md`
- `docs/data-update-guide.md`
- `docs/chart-authoring-guide.md`
- `docs/editorial-guide-summary.md`
- `docs/deployment-guide.md`
- `docs/accessibility-checklist.md`
- `docs/report-crosswalk.md`
- `CHANGELOG.md`

The data update guide must state exactly:

1. Where raw data goes
2. Which script to run
3. What validations occur
4. How to update metadata
5. How to review changes
6. How to regenerate downloads
7. How to regenerate static fallbacks
8. How to deploy

---

# prioritized implementation order

## release 1: structural overhaul

- [ ] Audit
- [ ] Report crosswalk
- [ ] New routes and navigation
- [ ] Design tokens
- [ ] Shared chart frame
- [ ] Overview redesign
- [ ] One fully rebuilt stage as the pattern
- [ ] Methodology drawer
- [ ] Responsive shell
- [ ] Baseline tests

Use **Retention and Immigration** or **Degree Production** as the first complete stage because each contains a clear hero visual, linked supporting charts, and enough complexity to test the system.

## release 2: all six stages

- [ ] Foundation
- [ ] Degree Production
- [ ] Graduate and Postdoctoral Training
- [ ] Workforce Entry
- [ ] Retention and Immigration
- [ ] Research Output and Competitiveness
- [ ] Full report crosswalk complete
- [ ] Downloads
- [ ] Country profiles
- [ ] Compare mode

## release 3: polish and launch

- [ ] Full accessibility pass
- [ ] Performance pass
- [ ] Visual regression pass
- [ ] Copyediting pass
- [ ] Data verification
- [ ] Print fallback
- [ ] Social cards
- [ ] Redirects
- [ ] Deployment
- [ ] Launch checklist

---

# optional stretch work

Do not begin these until the core site is complete.

- [ ] Saved custom views stored locally
- [ ] Embeddable chart mode
- [ ] Shareable chart image export
- [ ] Report figure preset menu
- [ ] Guided presentation mode
- [ ] State-level data when the planned data exists
- [ ] Institution-level profiles when the report data supports them
- [ ] New-data badges
- [ ] Version comparison between report editions
- [ ] Automated data-refresh pull requests
- [ ] Lightweight newsroom module tied to stage topics
- [ ] Public API or downloadable data package

---

# required Claude Code working method

For each phase:

1. Read the relevant source files and current code.
2. Write a short implementation plan.
3. List files to add, edit, or remove.
4. Make the smallest coherent set of changes.
5. Run formatting, linting, type checks, tests, and build.
6. Capture desktop and mobile screenshots.
7. Compare the result with the acceptance criteria.
8. Update this checklist.
9. Record unresolved questions.
10. Commit with a descriptive message.

Do not combine unrelated phases into one large unreviewable change.

---

# final launch checklist

## content

- [ ] Every figure and table has a web disposition.
- [ ] Every headline number matches the report.
- [ ] Every chart has a source and date range.
- [ ] Every chart names its population and unit.
- [ ] Every substantive caveat is retained.
- [ ] No placeholder copy remains.
- [ ] No repeated country labels or malformed table rows remain.
- [ ] Report and web titles are consistent.
- [ ] Official Hoover and program names are correct.

## design

- [ ] The site no longer reads as a card grid.
- [ ] Each stage has a clear visual hierarchy.
- [ ] Hoover red is used consistently and sparingly.
- [ ] Typography is readable on all breakpoints.
- [ ] Charts have enough height and label space.
- [ ] Long legends have been replaced by direct selection.
- [ ] Maps have useful linked views.
- [ ] No decorative movement distracts from reading.

## function

- [ ] All filters work.
- [ ] URL state works.
- [ ] Back and forward work.
- [ ] Downloads work.
- [ ] Methodology deep links work.
- [ ] Keyboard access works.
- [ ] Touch access works.
- [ ] Print view works.
- [ ] Static fallbacks work.
- [ ] No core data is fetched from third parties at runtime.

## quality

- [ ] Build passes.
- [ ] Tests pass.
- [ ] No console errors.
- [ ] No broken links.
- [ ] No inaccessible controls.
- [ ] No chart clipping.
- [ ] No mobile horizontal overflow.
- [ ] Performance targets are met or exceptions are documented.
- [ ] Author data review is complete.
- [ ] Editorial review is complete.
