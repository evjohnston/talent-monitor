# Claude Code Scope: Six Deferred Global Talent Monitor Features

## decision and execution instructions

**Merge PR #1 into `main` once its existing review checks pass.** Treat that merge as the baseline for the next work. Do not fold the six deferred features into PR #1.

Proceed directly into the six features below. They are now fully scoped and should not remain blocked on broad design questions. Build them as separate tracked issues and separate reviewable pull requests in the order given here.

Do not open one large PR containing all six features.

Recommended sequence:

1. Component gallery
2. Annotation system
3. Data review sheet
4. Lighthouse budgets
5. Explorer route
6. Country profiles

The first four establish shared infrastructure and quality checks. The explorer and country profiles depend on that foundation.

---

# common rules for all six issues

## source hierarchy

Use:

1. The current repository and merged PR #1 as the implementation baseline
2. `docs/CLAUDE_CODE_GLOBAL_TALENT_MONITOR_OVERHAUL.md` as the product brief
3. The report manuscript as the source of truth for claims, data definitions, titles, figures, tables, and caveats
4. The Hoover style guide as the source of truth for editorial form and institutional naming
5. The old MacroPolo digital projects as interaction reference only

Do not change report findings or data definitions while implementing these features.

## required issue format

Create one GitHub issue for each deferred feature using the exact issue structure below:

- Objective
- User need
- Locked design decisions
- Dependencies
- Data requirements
- Implementation tasks
- Accessibility requirements
- Tests
- Acceptance criteria
- Non-goals
- Deliverables
- Open questions requiring author input

The "open questions" section should be empty unless a question is genuinely impossible to resolve from the repository and source documents. Do not put ordinary implementation choices there.

## pull request rules

Each PR must include:

- Link to its issue
- Short implementation summary
- Files added, changed, and removed
- Screenshots at desktop and mobile widths
- Test results
- Accessibility notes
- Performance notes
- Known limitations
- A checklist copied from the issue's acceptance criteria

Each PR should leave the site deployable.

---

# issue 1: build the component gallery

## proposed issue title

`Build internal component gallery for Global Talent Monitor UI and chart patterns`

## objective

Create a development-only component gallery that documents the shared visual, interface, chart, source, methodology, and download components used across the site.

The gallery exists to stop future pages from inventing new versions of controls, legends, chart frames, source notes, drawers, and empty states.

## user need

This is primarily an internal authoring and QA tool. It should let developers and reviewers see every reusable component, state, and responsive variation in one place before those components are used across the explorer and country profiles.

## locked design decisions

- Use the current framework. Do not add Storybook if it would require a second build system or materially expand the dependency footprint.
- Preferred implementation: an internal route such as `/talent-monitor/dev/components/`.
- Exclude the route from the sitemap and production navigation.
- It may be included in production builds if it is unlinked and protected by an environment flag, but the preferred behavior is to disable it in production.
- The gallery must use real project tokens and components, not mocked visual replicas.
- Include both desktop and constrained-width examples.
- Include interaction states, not only default appearance.
- Do not add a new design system package.
- Do not redesign existing components inside this issue unless a bug prevents them from being documented.

## dependencies

- Merged PR #1
- Existing design tokens
- Existing shared chart frame
- Existing methodology and download UI, where already implemented

No dependency on the explorer or country profiles.

## implementation tasks

### route and structure

- [ ] Add a development-only component gallery route.
- [ ] Add a simple local navigation or table of contents.
- [ ] Group examples under:
  - Foundations
  - Typography
  - Colors
  - Spacing
  - Navigation
  - Filters and controls
  - Chart framing
  - Legends and annotations
  - Sources and methods
  - Downloads
  - Tables
  - Feedback states
  - Responsive patterns
- [ ] Add a route-level note stating that this is an internal development page.

### foundations

Document:

- [ ] Brand color tokens
- [ ] Neutral scale
- [ ] Sequential and diverging data scales
- [ ] Typography scale
- [ ] Spacing scale
- [ ] Border, radius, and shadow tokens
- [ ] Focus ring
- [ ] Breakpoints
- [ ] Motion durations
- [ ] Reduced-motion behavior

### interface components

Render at least:

- [ ] `SiteHeader`
- [ ] `PublicationMasthead`
- [ ] `StageNav`
- [ ] `StatBlock`
- [ ] `FilterGroup`
- [ ] `SegmentedControl`
- [ ] Search input
- [ ] Select or combobox
- [ ] Checkbox group
- [ ] Radio group
- [ ] Range control
- [ ] `CompareTray`
- [ ] `StageNextPrev`
- [ ] Buttons in all supported variants
- [ ] Links in body, chart, and navigation contexts

### chart components

Render at least:

- [ ] `ChartFrame`
- [ ] `ChartToolbar`
- [ ] Legend with two, four, six, and twelve available series
- [ ] Direct labels
- [ ] Tooltip
- [ ] Selection state
- [ ] Muted context state
- [ ] Projection styling
- [ ] Missing-data styling
- [ ] Annotation
- [ ] Static fallback
- [ ] Table alternative
- [ ] Small chart
- [ ] Full-width hero chart

Use small fixture datasets stored under a clear test or fixture directory. Do not depend on remote data.

### methodology and download components

Render:

- [ ] Short source note
- [ ] Long source note
- [ ] Methodology drawer
- [ ] Definition popover
- [ ] Download menu
- [ ] Copy-citation confirmation
- [ ] Copy-link confirmation
- [ ] Data-as-of label
- [ ] Report figure/table reference

### states

Render:

- [ ] Loading
- [ ] No data
- [ ] Partial data
- [ ] Error
- [ ] Disabled
- [ ] Keyboard focus
- [ ] Hover
- [ ] Selected
- [ ] Mobile filter sheet
- [ ] Open drawer
- [ ] Long title
- [ ] Long source citation
- [ ] Long country and institution names

### documentation

For every component, show:

- Component name
- Purpose
- Main props
- Allowed variants
- Accessibility behavior
- Usage note
- Known constraints

Keep documentation concise and inside the repository.

## accessibility requirements

- [ ] The gallery itself must meet the same accessibility rules as production pages.
- [ ] All controls must be keyboard operable.
- [ ] Visible focus states must be shown.
- [ ] Color tokens must show contrast results against intended backgrounds.
- [ ] Examples of reduced-motion behavior must be included.
- [ ] Components that use dialogs or drawers must demonstrate correct focus return.

## tests

- [ ] Route renders in development.
- [ ] Route is absent or inaccessible in production according to the chosen environment rule.
- [ ] Visual regression screenshots at:
  - 1440 x 1000
  - 1024 x 768
  - 390 x 844
- [ ] Keyboard interaction test for drawers, menus, and controls.
- [ ] No console errors.
- [ ] No fixture fetches to third-party services.

## acceptance criteria

- [ ] Every shared component currently used by two or more routes appears in the gallery.
- [ ] Every component has at least one default and one edge-state example.
- [ ] Design tokens are visible and labeled.
- [ ] Long labels and mobile states are represented.
- [ ] The route does not appear in public navigation or the sitemap.
- [ ] The gallery uses the actual production components.
- [ ] Tests and screenshots are included in the PR.

## non-goals

- Redesigning all components
- Adding a new UI framework
- Adding Storybook unless it is already present
- Building a public brand-guidelines page
- Writing end-user documentation

## deliverables

- Development-only component gallery route
- Fixture data
- Component usage notes
- Visual-regression coverage
- Updated developer README

## open questions requiring author input

None.

---

# issue 2: build the annotation system

## proposed issue title

`Create data-driven annotation system for report charts`

## objective

Replace chart-specific annotation code with one reusable, typed annotation system. The system should support historical events, policy changes, source breaks, projection boundaries, peak or crossing points, and authored explanatory notes.

## user need

Readers need help understanding why a series changes and where source definitions or policy conditions shift. Developers need annotations to be consistent, responsive, accessible, and maintainable.

## locked design decisions

- Store annotations as data, not JSX or chart-specific hard-coded labels.
- Use a shared annotation schema.
- Support both point-in-time and range annotations.
- Support one annotation source across multiple compatible charts.
- Annotations must be optional and filterable by priority.
- Default views should show only high-priority annotations.
- Do not add annotations that are not supported by the report or cited source material.
- Do not create a general-purpose editorial CMS.
- Annotation transitions must respect reduced motion.
- Essential annotation text must be accessible without hover.

## dependencies

- Merged PR #1
- Existing chart frame and chart adapters
- Component gallery should land first so annotation states can be documented there

## data schema

Create a typed schema similar to:

```ts
type ChartAnnotation = {
  id: string;
  metricIds: string[];
  stage: string;
  type:
    | "event"
    | "policy"
    | "source_break"
    | "projection_start"
    | "peak"
    | "crossing"
    | "definition_change"
    | "custom";
  start: string | number;
  end?: string | number;
  label: string;
  shortLabel?: string;
  detail: string;
  sourceLabel?: string;
  sourceUrl?: string;
  priority: 1 | 2 | 3;
  desktopPlacement?: "top" | "bottom" | "auto";
  mobileBehavior?: "inline" | "list" | "hidden";
  showByDefault: boolean;
};
```

Adapt names to the repository's conventions.

## implementation tasks

### data model

- [ ] Add annotation schema and validation.
- [ ] Add a central annotation registry.
- [ ] Add stable IDs.
- [ ] Add source fields.
- [ ] Add priority and default-visibility fields.
- [ ] Add optional metric-specific overrides only if required.
- [ ] Validate that every referenced metric ID exists.
- [ ] Validate dates or years against the compatible metric range.

### rendering

Support:

- [ ] Vertical event line
- [ ] Shaded range
- [ ] Projection boundary
- [ ] Source-break marker
- [ ] Point callout
- [ ] Crossing marker
- [ ] Inline text note
- [ ] Mobile annotation list below the chart

### interaction

- [ ] Annotation markers receive keyboard focus when interactive.
- [ ] Selecting an annotation reveals its full detail.
- [ ] Add "Annotations" control when more than one annotation is available.
- [ ] Allow users to hide annotations.
- [ ] Keep the selected annotation in local chart state.
- [ ] Do not add every annotation to the URL.
- [ ] Deep links may use an annotation ID only when a chart is opened from a methodology or editorial link.

### responsive rules

- [ ] On wide screens, use callouts where space permits.
- [ ] On narrow screens, move long annotations into a numbered list below the chart.
- [ ] Prevent annotation labels from covering end labels or controls.
- [ ] Limit default visible annotations by priority.
- [ ] Use short labels on mobile.

### initial implementation set

Implement annotations for at least:

- [ ] Degree-production long-run doctorate chart
- [ ] Research-output projection boundaries
- [ ] H-1B policy or source changes documented in the report
- [ ] US-China crossing points at AI conferences
- [ ] Any documented methodology break in stay-rate data

Do not invent event explanations from visual inference alone.

### component gallery

- [ ] Add gallery examples for every annotation type.
- [ ] Include crowded, mobile, reduced-motion, and screen-reader states.

## accessibility requirements

- [ ] Annotation meaning cannot depend on line color alone.
- [ ] Interactive annotations are reachable by keyboard.
- [ ] Full annotation text is available to screen readers.
- [ ] Long annotation lists use semantic list markup.
- [ ] Annotation controls have clear labels.
- [ ] Reduced-motion mode removes animated drawing or movement.

## tests

- [ ] Schema validation tests
- [ ] Unknown metric ID fails validation
- [ ] Invalid date or year fails validation
- [ ] Priority filtering
- [ ] Mobile list rendering
- [ ] Keyboard selection
- [ ] Reduced-motion rendering
- [ ] No collision with chart controls in tested fixtures
- [ ] Visual regression for one point, one range, and one projection boundary

## acceptance criteria

- [ ] No new chart-specific annotation markup is required for supported chart types.
- [ ] Annotation content is stored in a shared registry.
- [ ] At least five real report-supported annotations are implemented.
- [ ] Mobile views show readable annotation lists.
- [ ] Annotations can be hidden.
- [ ] Projection and source-break annotations use distinct styles.
- [ ] Sources are included where required.
- [ ] Component gallery examples are complete.

## non-goals

- Automated event detection
- AI-generated annotations
- A web-based annotation editor
- General editorial publishing tools
- Adding annotations to every chart in the first PR

## deliverables

- Typed annotation schema
- Annotation registry
- Shared renderer
- Shared controls
- Initial report annotations
- Tests
- Component gallery entries
- Documentation for adding annotations

## open questions requiring author input

None. Only use annotations already supported by the report and its sources.

---

# issue 3: generate the data review sheet

## proposed issue title

`Generate automated data review sheet for every chart and table`

## objective

Build an automated review artifact that lets the authors verify the values, definitions, sources, date ranges, missing data, and report references behind every web visual before release.

## user need

The current project contains many datasets, calculations, and chart views. A review sheet should make it possible to identify data errors without opening every route and manually checking every tooltip.

## locked design decisions

- Generate the review sheet from the same processed data and metric registry used by the site.
- Do not maintain a separate hand-edited spreadsheet as the source.
- Produce both machine-readable and human-readable outputs.
- Preferred outputs:
  - CSV
  - JSON
  - HTML review page
- XLSX may be added only if the repository already has a stable generation path.
- The review sheet must be generated during a dedicated script, not on every local development render.
- The review sheet is an internal QA artifact, not a public data product.
- A chart with multiple user-selectable metrics should have one row per metric/view combination needed for review.

## dependencies

- Merged PR #1
- Metric registry
- Normalized data
- Report crosswalk
- Annotation system is helpful but not required

## review-record schema

Each record should contain:

- `review_id`
- `route`
- `stage`
- `component_id`
- `metric_id`
- `report_reference`
- `title`
- `subtitle`
- `population`
- `unit`
- `denominator`
- `source`
- `source_url`
- `source_date`
- `first_period`
- `last_period`
- `first_value`
- `last_value`
- `absolute_change`
- `relative_change`
- `percentage_point_change`
- `minimum_value`
- `minimum_period`
- `maximum_value`
- `maximum_period`
- `row_count`
- `series_count`
- `missing_value_count`
- `estimated_value_count`
- `projected_value_count`
- `duplicate_key_count`
- `latest_data_update`
- `calculation_note`
- `caveat`
- `download_path`
- `screenshot_path`
- `review_status`
- `review_comment`

Use blank fields where a calculation does not apply. Do not place misleading zeroes in nonapplicable fields.

## implementation tasks

### generation script

- [ ] Add a script such as `npm run review:data`.
- [ ] Load the metric registry, report crosswalk, and processed datasets.
- [ ] Generate one record per reviewable visual state.
- [ ] Compute change measures only when valid.
- [ ] Flag incompatible or missing metadata.
- [ ] Fail the command on:
  - Missing metric IDs
  - Missing sources
  - Missing units
  - Duplicate primary keys
  - Invalid percentages
  - Missing report references for report-derived visuals
  - Broken download paths

### human-readable review page

Create an internal static HTML review page with:

- [ ] Search
- [ ] Stage filter
- [ ] Status filter
- [ ] Error/warning filter
- [ ] Sort
- [ ] Table of review records
- [ ] Expandable calculation and caveat details
- [ ] Link to live route
- [ ] Link to dataset download
- [ ] Link to screenshot where available
- [ ] Print-friendly layout

This page may live under `/talent-monitor/dev/data-review/` and follow the same production visibility rules as the component gallery.

### warnings

Add nonblocking warning categories:

- Missing values
- Short time series
- Mixed source years
- Projection present
- Estimate present
- Source break present
- Large relative change from small base
- More than six default series
- Stale update date
- Report title mismatch
- Web title mismatch
- Missing static fallback

### author review fields

- [ ] Permit review status and comments through a separate small JSON or CSV file committed to the repository.
- [ ] Do not overwrite review comments when regenerating calculated fields.
- [ ] Supported statuses:
  - `not_reviewed`
  - `verified`
  - `needs_revision`
  - `approved_with_caveat`

## accessibility requirements

- [ ] Review table uses semantic table markup.
- [ ] Filters are keyboard accessible.
- [ ] Warnings are not conveyed by color alone.
- [ ] Expanded details are accessible disclosures.
- [ ] Print view keeps headers and identifiers visible.

## tests

- [ ] Calculation tests for count, percentage, and percentage-point metrics
- [ ] Nonapplicable calculations remain blank
- [ ] Duplicate-key detection
- [ ] Invalid-percentage detection
- [ ] Missing metadata causes failure
- [ ] Review comments survive regeneration
- [ ] Generated CSV and JSON schemas match
- [ ] Internal review page renders without console errors

## acceptance criteria

- [ ] Every public visual appears in the review artifact.
- [ ] Every record includes a source, unit, date range, and report reference where applicable.
- [ ] Calculated changes match the site.
- [ ] Missing and projected values are counted.
- [ ] Broken metadata fails the review command.
- [ ] Authors can mark and retain review status.
- [ ] CSV, JSON, and internal HTML outputs are generated.
- [ ] Generation is documented.

## non-goals

- Replacing source datasets
- Editing data from the review page
- Public user accounts
- A database-backed review workflow
- Automating author approval
- Recreating every tooltip value as a separate row

## deliverables

- Review-generation script
- CSV output
- JSON output
- Internal HTML review page
- Persistent review-status file
- Tests
- Documentation

## open questions requiring author input

None.

---

# issue 4: enforce Lighthouse and performance budgets

## proposed issue title

`Add route-level Lighthouse CI and performance budgets`

## objective

Turn the performance and accessibility targets in the overhaul document into automated checks for the main public routes.

## user need

The site contains many interactive charts and maps. Performance can degrade gradually as new features are added. Automated budgets should catch regressions before merge.

## locked design decisions

- Use Lighthouse CI or the repository's existing equivalent.
- Run a representative set of routes, not every possible filter state.
- Accessibility violations that indicate a clear regression should block merge.
- Performance scoring should use both score thresholds and specific metric budgets.
- Use a production build for audits.
- Test desktop and mobile configurations where the tooling permits.
- Start with realistic thresholds. Do not create a permanently failing CI job.
- Document temporary exceptions with an owner and expiration issue.
- Do not optimize by removing essential accessibility, source, or data features.

## dependencies

- Merged PR #1
- Stable production build
- Stable routes
- Component gallery and data review sheet are useful but not required

## audited routes

At minimum:

- `/talent-monitor/`
- `/talent-monitor/foundation/`
- `/talent-monitor/degree-production/`
- `/talent-monitor/graduate-training/`
- `/talent-monitor/workforce-entry/`
- `/talent-monitor/retention-immigration/`
- `/talent-monitor/research-output/`
- `/talent-monitor/explorer/` once implemented
- `/talent-monitor/methodology/`
- `/talent-monitor/downloads/`

Until the explorer exists, omit it without failing CI.

## initial budgets

### Lighthouse category thresholds

- Performance: `>= 0.85` in CI at introduction
- Accessibility: `>= 0.95`
- Best Practices: `>= 0.95`
- SEO: `>= 0.90`

Target after optimization:

- Performance: `>= 0.90`
- Accessibility: `1.00` where feasible, never below `0.95`
- Best Practices: `>= 0.95`
- SEO: `>= 0.95`

### metric budgets

- Largest Contentful Paint: `<= 2.5 s`
- Cumulative Layout Shift: `<= 0.10`
- Total Blocking Time: `<= 300 ms` in Lighthouse CI
- Interaction to Next Paint: assess with field or supported lab tooling; target `<= 200 ms`
- Initial transferred JavaScript: set baseline from PR #1, then allow no more than 10 percent growth without documented approval
- Initial route data payload: set route-specific baselines and prevent unexplained growth above 15 percent
- No unused third-party requests for core data
- No console errors

If the CI environment makes a metric unstable, use a median of three runs rather than removing the check.

## implementation tasks

### baseline

- [ ] Run audits against merged PR #1.
- [ ] Record route-by-route baseline.
- [ ] Identify unstable metrics.
- [ ] Set initial budgets that catch regression without failing the untouched baseline.
- [ ] Add a follow-up optimization issue for routes below the target values.

### CI configuration

- [ ] Add Lighthouse CI configuration.
- [ ] Build and serve the production site inside CI.
- [ ] Run at least three samples per route where practical.
- [ ] Upload HTML and JSON reports as CI artifacts.
- [ ] Add a concise PR summary.
- [ ] Fail on threshold breaches.
- [ ] Allow documented temporary exceptions in one configuration file.

### bundle and payload budgets

- [ ] Add bundle-size reporting.
- [ ] Track route-level JavaScript chunks.
- [ ] Track major data payloads.
- [ ] Prevent chart libraries from loading on routes that do not use them.
- [ ] Flag duplicate copies of the same chart or utility library.

### optimization pass

Address obvious problems found during baseline work:

- [ ] Lazy-load below-the-fold charts.
- [ ] Split large geography files.
- [ ] Use simplified map geometry.
- [ ] Avoid rerendering unrelated charts on filter changes.
- [ ] Defer nonessential development or analytics scripts.
- [ ] Reserve chart height to prevent layout shifts.
- [ ] Preload only the next stage's essential data.
- [ ] Verify fonts do not block first render unnecessarily.

Do not undertake a full chart-library migration under this issue.

## accessibility requirements

The accessibility score is part of this issue, but automated checks do not replace manual testing.

- [ ] Add axe or equivalent automated accessibility tests if absent.
- [ ] Keep a manual keyboard checklist for each release.
- [ ] Treat a drop below the baseline as a regression even if the score remains above threshold.

## tests

- [ ] CI job runs on pull requests.
- [ ] CI job runs against production build.
- [ ] Reports are uploaded.
- [ ] Intentional budget breach fails a test branch.
- [ ] Temporary exception format is tested.
- [ ] Routes with missing optional features are skipped explicitly, not silently.
- [ ] No production route emits console errors during audit.

## acceptance criteria

- [ ] Route-level baseline is committed.
- [ ] Lighthouse CI runs automatically.
- [ ] Reports are available as artifacts.
- [ ] Performance, accessibility, best-practice, and SEO thresholds are enforced.
- [ ] JavaScript and data payload budgets are tracked.
- [ ] Temporary exceptions require an explanation and follow-up issue.
- [ ] PR documentation explains the baseline and any routes below final targets.
- [ ] The site remains functionally unchanged except for safe optimizations.

## non-goals

- Replacing all chart libraries
- Achieving perfect scores by removing functionality
- Field-performance monitoring infrastructure
- A full analytics redesign
- Auditing every possible filter state

## deliverables

- Lighthouse CI configuration
- Baseline report
- CI workflow
- Bundle and payload report
- Performance documentation
- Follow-up optimization issues where needed

## open questions requiring author input

None.

---

# issue 5: build the full `/explorer/` route

## proposed issue title

`Build searchable full-data explorer for all Global Talent Monitor indicators`

## objective

Create a dedicated route for browsing the complete indicator collection. The explorer should contain the comprehensive chart catalog that no longer belongs on the narrative stage pages.

## user need

Some readers want to search, filter, compare, inspect, and download the full set of indicators rather than follow the authored narrative. The explorer should support that work without turning every stage page back into a dense dashboard.

## locked design decisions

- Route: `/talent-monitor/explorer/`
- The explorer is separate from stage pages.
- It uses the shared metric registry and report crosswalk.
- It must not render every chart on initial load.
- Default state shows a searchable catalog, not a wall of fully rendered charts.
- Results may use summary rows or compact preview cards.
- Selecting a result opens a focused detail view in the same route.
- The detail view may use a side panel on wide screens and a full-page section on mobile.
- URL query parameters store all meaningful state.
- Maximum comparison set: four compatible series, countries, or categories.
- Do not permit comparisons across incompatible units.
- Do not create an invented composite index.
- Do not add user accounts or cloud-saved views.
- Local recent views are optional and out of scope for the first release.
- Data downloads must come from normalized datasets, not scraped visuals.

## dependencies

Required:

- Merged PR #1
- Metric registry
- Report crosswalk
- Shared chart frame
- Methodology and download components
- Component gallery
- Data review sheet
- Lighthouse budgets

Helpful:

- Annotation system

Country profiles may be built after the explorer and can reuse its state and detail components.

## information architecture

### default explorer view

Show:

- Search
- Result count
- Stage filter
- Topic filter
- Geography availability filter
- Measure type filter
- Time coverage filter
- Data source filter
- Sort
- Active-filter chips
- Results list
- Clear-all action

### result item

Each item should show:

- Indicator title
- One-sentence description
- Stage
- Unit
- Date range
- Geographic coverage
- Latest data update
- Report figure/table reference
- Small static preview or sparkline where inexpensive
- Open action
- Download action

Do not load the full chart library for every result item.

### focused indicator view

Show:

- Full chart
- Chart controls
- Series search
- Compare tray
- Methodology drawer
- Source note
- Data download
- Table view
- Related indicators
- Report reference
- Shareable URL

## filter taxonomy

Use controlled values from the metric registry.

### stage

- Foundation
- Degree Production
- Graduate and Postdoctoral Training
- Workforce Entry
- Retention and Immigration
- Research Output and Competitiveness

### topic

Initial controlled topics:

- K-12 preparation
- College completion
- Study abroad
- Degree production
- International enrollment
- Graduate training
- Postdoctoral training
- STEM workforce
- H-1B
- OPT
- PERM
- Green cards
- Founders
- Research publications
- Citations
- Conferences
- R&D
- Patents
- Universities
- Prizes

Use repository terminology and merge duplicate concepts.

### measure type

- Count
- Share
- Rate
- Rank
- Index
- Currency
- Duration
- Flow
- Distribution
- Projection
- Survey response

### geographic coverage

- United States only
- Country comparison
- World
- Region
- Institution
- Company
- Employer
- Field
- No geography

## URL state

Use query parameters such as:

- `q`
- `stage`
- `topic`
- `measure`
- `geography`
- `source`
- `sort`
- `metric`
- `country`
- `field`
- `degree`
- `year`
- `compare`
- `view`

Requirements:

- [ ] Refresh preserves state.
- [ ] Back and forward restore state.
- [ ] Shared URL opens the same indicator and filters.
- [ ] Default parameters are omitted from the URL.
- [ ] Invalid values fail safely and show a clear message.

## implementation tasks

### registry and search index

- [ ] Confirm every explorer metric has complete registry metadata.
- [ ] Build a client-side search index at build time.
- [ ] Search titles, short descriptions, aliases, report IDs, sources, fields, and countries.
- [ ] Support common abbreviations such as H-1B, OPT, R&D, and PhD.
- [ ] Keep the search index small and inspectable.

### catalog view

- [ ] Build filter controls.
- [ ] Add active-filter chips.
- [ ] Add result count.
- [ ] Add empty state with filter-reset action.
- [ ] Add sort options:
  - Report order
  - Alphabetical
  - Most recently updated
  - Longest time series
- [ ] Paginate or virtualize if result count requires it.
- [ ] Do not infinite-scroll without a visible result count and accessible loading state.

### indicator detail

- [ ] Reuse existing chart components and data adapters.
- [ ] Add table view.
- [ ] Add methodology and download actions.
- [ ] Add related indicators based on registry tags and report stage.
- [ ] Add report presets so users can recreate the report figure or table view.
- [ ] Add compatible comparison controls.
- [ ] Prevent incompatible comparisons.

### mobile

- [ ] Filters open in an accessible bottom sheet or full-screen panel.
- [ ] Result items remain compact.
- [ ] Indicator detail becomes a normal document flow.
- [ ] Compare tray does not cover chart controls.
- [ ] No horizontal page scrolling.
- [ ] Table view remains usable.

### no-JavaScript behavior

- [ ] Render a server- or build-generated catalog list.
- [ ] Provide titles, descriptions, stages, report references, and download links.
- [ ] Do not leave an empty explorer shell.

## accessibility requirements

- [ ] Search has a visible label.
- [ ] Filter groups use semantic fieldsets where appropriate.
- [ ] Result count updates are announced without excessive live-region noise.
- [ ] Active filters are keyboard removable.
- [ ] Focus moves predictably when opening and closing indicator detail.
- [ ] Table alternatives are available.
- [ ] Essential data is not hover-only.
- [ ] Comparison colors use labels and line styles in addition to hue.

## tests

### unit

- [ ] Search indexing
- [ ] Filter combinations
- [ ] Sort
- [ ] URL parsing and serialization
- [ ] Invalid state handling
- [ ] Comparison compatibility
- [ ] Report preset state

### interaction

- [ ] Search and open indicator
- [ ] Apply and clear filters
- [ ] Browser back and forward
- [ ] Open shared URL
- [ ] Add and remove comparisons
- [ ] Switch chart and table
- [ ] Download displayed and full data
- [ ] Open methodology
- [ ] Mobile filter panel
- [ ] Keyboard-only use
- [ ] No-results state

### visual regression

Capture:

- Default catalog
- Filtered catalog
- Search results
- Indicator detail
- Four-item comparison
- No-results state
- Mobile filters
- Mobile detail
- Long-label state

## acceptance criteria

- [ ] All public report indicators are discoverable.
- [ ] Initial route does not render all full charts.
- [ ] Search and filters operate from registry metadata.
- [ ] Meaningful state is shareable by URL.
- [ ] Back and forward navigation work.
- [ ] Indicator detail includes chart, table, methods, sources, and downloads.
- [ ] Incompatible comparisons are blocked with a clear reason.
- [ ] Mobile and keyboard workflows are complete.
- [ ] No-JavaScript catalog is useful.
- [ ] Lighthouse and bundle budgets pass.
- [ ] Data review sheet contains every explorer indicator.

## non-goals

- User accounts
- Cloud-saved views
- Comments or collaboration
- A public API
- Editing source data
- An invented overall talent score
- Loading every chart at once
- Replacing stage narratives

## deliverables

- `/explorer/` route
- Build-time search index
- Filter system
- Indicator catalog
- Indicator detail view
- URL state
- Compare mode
- Table alternatives
- Tests
- Documentation

## open questions requiring author input

None. Use the controlled taxonomy above and repository metadata.

---

# issue 6: build country profiles

## proposed issue title

`Build reusable country profiles from report-supported indicators`

## objective

Create country profile pages that assemble available report data into a clear, source-based view of each country's role in STEM talent production, international education, workforce flows, retention, and research output.

## user need

Readers should be able to move from a global or US-centered chart into a focused country view without manually finding the same country across many stages.

## locked design decisions

- Initial countries:
  - United States
  - China
  - India
  - United Kingdom
  - Germany
  - South Korea
  - Japan
  - Canada
  - Australia
- Route pattern: `/talent-monitor/countries/[country-slug]/`
- Profiles use report-supported data only.
- Do not write generic country essays.
- Do not infer policy performance from missing indicators.
- Missing sections should show a clear "not available in this report" state rather than disappear without explanation.
- Profiles must reuse explorer metrics and data adapters.
- Each profile opens with a concise factual summary generated from approved metric templates, not freeform AI text.
- The United States may have additional domestic-pipeline sections that are not available for other countries.
- Do not force all profiles into identical section counts.
- Country colors should not become permanent brand assignments across the entire site. Use stable session colors in comparisons, with the United States as the main dark or Hoover-red emphasis where appropriate.
- Country names and codes must come from one normalization table.
- Include territories or economies only where they are already represented in the source; do not silently convert them to sovereign states.

## dependencies

Required:

- Merged PR #1
- Metric registry
- Country normalization table
- Explorer route
- Shared chart frame
- Methodology and download UI
- Data review sheet
- Lighthouse budgets

Helpful:

- Annotation system
- Component gallery

## profile structure

### masthead

Show:

- Country name
- Region
- Profile data-as-of date
- One-sentence factual summary
- Number of available indicators
- Compare action
- Download profile data action

Do not add flags unless an approved asset source already exists. Country names are sufficient.

### profile navigation

Use anchored sections. Only show sections with data or an explicit missing-data notice.

Possible sections:

1. Talent production
2. International enrollment
3. Fields and degree levels
4. US workforce and founders
5. Retention and immigration
6. Research output
7. Patents and R&D
8. Related indicators
9. Sources and data gaps

### section format

Each section should have:

- Short factual heading
- One concise summary
- One primary chart
- Up to two supporting metrics
- Methodology link
- Related explorer link
- Missing-data notice where needed

Do not reproduce a dashboard card wall.

## profile metric mapping

Create a country-profile configuration file that maps each metric to:

- Eligible countries
- Profile section
- Default chart view
- Default comparison
- Summary-template eligibility
- Sort order
- Missing-data explanation
- Report reference

Do not determine profile content through scattered conditional checks in components.

## factual summary templates

Use controlled templates such as:

- `[Country] accounted for [value] of [population] in [year].`
- `[Country] ranked [rank] among [comparison group] in [metric] in [year].`
- `[Metric] changed from [start value] in [start year] to [end value] in [end year].`
- `[Country] was the [ordinal] largest source of [population] in [year].`
- `The report does not contain a comparable [metric] series for [Country].`

Rules:

- [ ] Generate only from reviewed metrics.
- [ ] Include year.
- [ ] Include unit.
- [ ] Do not use causal language.
- [ ] Do not use "leading" unless rank supports it.
- [ ] Do not compare nonmatching years.
- [ ] Do not create summaries from projected values without saying "projected."

## country comparison

Profiles should support "compare with" for up to three additional countries.

- [ ] Only show compatible metrics.
- [ ] Warn where one country lacks data.
- [ ] Preserve comparison state in the URL.
- [ ] Link to the explorer for wider comparison.
- [ ] Do not duplicate the entire explorer interface on the profile.

## implementation tasks

### country normalization

- [ ] Create one canonical country/economy registry.
- [ ] Include:
  - Stable ID
  - Display name
  - Slug
  - ISO code where applicable
  - Region
  - Source aliases
  - Notes for economies or territories
- [ ] Map source-specific names to canonical IDs.
- [ ] Test ambiguous labels such as Taiwan, Hong Kong, Turkiye, and country/economy variants according to source language and project editorial rules.
- [ ] Do not rewrite source labels in a way that changes what the source measured.

### profile configuration

- [ ] Create the country-profile metric mapping.
- [ ] Add section order.
- [ ] Add summary templates.
- [ ] Add default comparisons.
- [ ] Add missing-data messages.
- [ ] Validate that configured metrics exist.

### route generation

- [ ] Generate the nine initial country routes at build time.
- [ ] Add canonical metadata and social title.
- [ ] Add breadcrumb or return-to-explorer link.
- [ ] Add profile navigation.
- [ ] Add shareable compare state.
- [ ] Add no-JavaScript content.

### profile sections

Implement country-aware views for report-supported data in:

- [ ] Degree and PhD production
- [ ] International students in the United States
- [ ] Degree level and field concentration
- [ ] Postdoctoral or graduate participation
- [ ] Founders or workforce links where supported
- [ ] Stay intentions or immigration data where supported
- [ ] Publications and citations
- [ ] R&D
- [ ] Patents
- [ ] University rankings where supported

A country does not need data in every category.

### downloads

Provide:

- [ ] Profile CSV containing all displayed metrics
- [ ] Profile metadata JSON
- [ ] Links to underlying indicator datasets
- [ ] Data dictionary
- [ ] Data-as-of date

### related links

- [ ] Link each profile visual to the explorer with matching filters.
- [ ] Link related stage pages.
- [ ] Link related countries based on available comparisons, not generic geography alone.

## accessibility requirements

- [ ] Profile navigation is keyboard accessible.
- [ ] Missing-data notices are text, not empty chart space.
- [ ] Compare controls have clear labels.
- [ ] Charts retain table alternatives.
- [ ] Generated factual summaries are included in the page reading order.
- [ ] Country selection does not rely on a map.
- [ ] Long country and source names wrap correctly.

## tests

### unit

- [ ] Country alias normalization
- [ ] Slug generation
- [ ] Profile configuration validation
- [ ] Summary template formatting
- [ ] Year compatibility
- [ ] Missing-data logic
- [ ] Projection wording
- [ ] Comparison compatibility

### route

- [ ] All nine routes build.
- [ ] Unknown country slug returns a useful not-found state.
- [ ] Compare URL restores state.
- [ ] Profile download contains displayed metrics.
- [ ] Explorer links preserve country filter.

### visual regression

Capture at least:

- United States
- China
- India
- One profile with many missing sections
- Four-country compare state
- Mobile profile
- Long source note
- No-data section

## acceptance criteria

- [ ] Nine initial profiles are generated.
- [ ] Every statement is produced from reviewed report data or fixed editorial copy.
- [ ] No generic country essay text appears.
- [ ] Missing data is stated clearly.
- [ ] Profiles reuse explorer and chart infrastructure.
- [ ] Country aliases resolve consistently.
- [ ] Profile comparison works for compatible metrics.
- [ ] Profile downloads work.
- [ ] Each visual links to its explorer state.
- [ ] Mobile, keyboard, print, and no-JavaScript views work.
- [ ] Lighthouse budgets pass.
- [ ] Data review records exist for all profile visuals and summaries.

## non-goals

- Profiles for every country in the raw datasets
- New country research
- Country policy recommendations
- Freeform AI-generated narrative
- Flags or decorative country imagery
- A full international-relations encyclopedia
- Adding data not present in the report or approved project datasets

## deliverables

- Country registry
- Country alias normalization
- Profile configuration
- Nine country routes
- Summary templates
- Compare behavior
- Profile downloads
- Tests
- Documentation for adding another country

## open questions requiring author input

None.

---

# implementation roadmap

## milestone A: internal infrastructure

### PR 2: component gallery

Issue 1 only.

Exit condition:

- Shared production components are documented.
- Development route works.
- Visual-regression coverage exists.

### PR 3: annotation system

Issue 2 only.

Exit condition:

- Shared schema and renderer exist.
- At least five real annotations are implemented.
- Gallery examples exist.

### PR 4: data review sheet

Issue 3 only.

Exit condition:

- CSV, JSON, and HTML review outputs generate.
- Metadata failures are detected.
- Review statuses persist.

### PR 5: Lighthouse budgets

Issue 4 only.

Exit condition:

- CI audits public routes.
- Baseline and budgets are committed.
- Regressions fail CI.

## milestone B: public discovery

### PR 6: explorer foundation

Implement:

- Route
- Search index
- Catalog
- Filters
- URL state
- No-JavaScript list

Do not include compare mode in this PR if it makes the PR too large.

### PR 7: explorer indicator detail

Implement:

- Focused chart view
- Table view
- Methods
- Downloads
- Related indicators
- Report presets

### PR 8: explorer compare mode and polish

Implement:

- Up to four compatible comparisons
- Mobile behavior
- Final accessibility
- Performance
- Visual regression

Issue 5 is complete after PR 8.

## milestone C: country profiles

### PR 9: country registry and profile framework

Implement:

- Country normalization
- Alias mapping
- Profile configuration
- Route shell
- Missing-data states

### PR 10: initial profiles

Implement:

- United States
- China
- India

These three test the widest range of profile differences.

### PR 11: remaining profiles

Implement:

- United Kingdom
- Germany
- South Korea
- Japan
- Canada
- Australia

### PR 12: profile comparison, downloads, and polish

Implement:

- Compare state
- Downloads
- Explorer deep links
- Print and no-JavaScript views
- Accessibility and performance pass

Issue 6 is complete after PR 12.

---

# final completion criteria

The six-feature backlog is complete only when:

- [ ] All six tracked issues are closed.
- [ ] The component gallery documents shared production components.
- [ ] The annotation system is data-driven and used in real charts.
- [ ] The data review sheet covers every public visual.
- [ ] Lighthouse and bundle budgets run in CI.
- [ ] The explorer exposes every report indicator through search and filters.
- [ ] The explorer supports focused detail, methods, downloads, URL state, and compatible comparison.
- [ ] Nine country profiles are live.
- [ ] Country profiles use reviewed report data only.
- [ ] All new routes work on mobile, by keyboard, in print, and without JavaScript.
- [ ] No route exceeds its documented performance budget without a live follow-up issue.
- [ ] No new substantive claim has been introduced without author approval.
