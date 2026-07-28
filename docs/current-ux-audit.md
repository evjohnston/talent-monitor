# Current UX audit — Phase 0.3

Concrete problems, with exact page locations and the baseline screenshot
that shows each one. Screenshots are in `docs/baseline-screenshots/`
(captured at `overhaul/publication-redesign`'s branch point). This exists
so redesign work has a real "before" to check against, per the task doc's
"Do not begin the redesign until this audit exists."

## Too many equal-weight cards

**`research-output__desktop-1440x1000.png`** — 19 panels below the one
hero, all `.panel` with identical border/padding/type treatment, laid out
3-per-row with no size variation regardless of how much real signal a
given exhibit carries. Same pattern on every stage page (`Foundation`: 14,
`Graduate & Postdoctoral Training`: 20, `Retention & Immigration`: 13). This
is the literal "card wall" the task doc's non-negotiable rules name first.

## Excessive small line charts / too many visible series at once

Same screenshot, row 2 ("Who Presents at Machine Learning's Most Selective
Venue?" through "Who Are America's Nobel Laureates?"): 6 line charts in
~260px-wide panels, several with 3-5 series each. Worse cases elsewhere:

- **`graduate-training` page**, "Which Countries Send the Most
  International STEM Students?" (FIG206) — 18 country lines in one small
  panel, no series picker, legend wraps across 6+ rows below a chart
  that's already hard to read at that width.
- **`research-output` page**, "How Intensely Does Each Country Invest in
  R&D?" (FIG509) and the three "Who Patents in Critical Technologies?"
  panels (FIG-TAB505 a/b/c) — 6-8 country lines each, same problem.

This is exactly the Phase 4.5 threshold ("when more than six series are
available, default to a small authored selection") — nothing in the
current app enforces or even approaches that rule.

## Tiny labels and illegible generic-fallback charts

**`research-output__desktop-1440x1000.png`**, "When Did China Catch Up at
Each AI Conference?" (TAB501) — labels read "colt · colt", "corl · corl",
"siggraphasia · sigg...". Real, not a screenshot artifact: this exhibit's
real shape (conference × year × country panel data) has no bespoke chart
yet, so it falls through to the app's generic ranked-bar fallback, which
picks the wrong dimension to rank by for this specific shape. A concrete
Phase-1 crosswalk item, not a cosmetic fix.

## Large blank areas inside cards

**`research-output__desktop-1440x1000.png`**, "Who Are America's Nobel
Laureates?" (2 bars: Born Citizen 217, Immigrant 108) sits in a grid row
next to "Where Do the World's Most-Cited Researchers Work?" (a full line
chart) — the grid row's height is set by its tallest cell, so the 2-bar
panel carries a large empty lower half. Same problem, **`workforce-entry`
page**, "How Does Founder Origin Vary Across AI Startup Valuations?" (2
bars) next to a 12-row H-1B employer table.

## Weak distinction between headline findings and secondary evidence

Every stage page has exactly one visually distinct element (the hero panel
— either a full-width exhibit or, on Overview/Retention & Immigration, a
Sankey) and then an undifferentiated list. There is no second tier
("supporting section" in the task doc's language) — a reader can't tell,
from layout alone, which of the 10-20 remaining panels matter more than
the others. `TrackShell.tsx`'s own render order is just `exhibits` sorted
by their original report order, not an editorial priority.

## Long scroll with little change in rhythm

**`overview__mobile-390x844.png`** — full page height 4130px at a 390px
viewport. **`retention-immigration__mobile-390x844.png`** — 5767px. Every
section is the same panel shape at the same width; nothing marks a
transition between "the hero finding," "supporting evidence," and "the
full exhibit list" the way varying visual weight would.

## Controls that are unclear or too small

**News ticker** (`docs/baseline-screenshots/*` topbar, any route) — the
prev/‹/›/pause controls are 13px-font glyphs with no visible text label
(only an `aria-label`), in a 30px-tall bar. Functional for a mouse, easy to
miss entirely on a first look, and their exact hit target is smaller than
the 44×44px touch-target floor the task doc's accessibility section sets.

## Maps with no clear interactive purpose

**`WorldMap.tsx`, every country-map exhibit** (e.g. "Where Do Immigrant AI
Founders Come From?" on `workforce-entry`, "Do Immigrants Work at Higher
Rates Than the Native-Born?" on `retention-immigration`) — hovering shows a
tooltip; **clicking does nothing**. `onSelect` (the prop that would make a
click filter/navigate) is defined on the component but never passed by
any current caller. The map reads as "hover for a number," not as a real
navigation/filter surface — no linked ranking, no drill-down, nothing the
task doc's Phase 6/7 map modules ask for.

## Mobile-specific problems

- **`DashboardNavigation.tsx`** wraps into 3 rows of buttons on a 390px
  viewport (`overview__mobile-390x844.png`, top of page) — the exact
  "wide tab strip" Phase 2.3 asks to replace with a stage menu or
  scrollable tabs.
- **Sankeys compress illegibly.** Both `Sankey.tsx` instances render at a
  fixed SVG width with `maxWidth: "100%"` — on a 390px viewport, "Two
  Streams of Talent" and "The Retention Gap" scale down to roughly 40% of
  their designed size, node labels overlapping the panel edge in the
  Retention Gap's case (its `labelMargin={190}` was tuned for an 820px-wide
  desktop render, not a compressed mobile one).
- **11-item legends wrap across many lines** below an already-tiny chart
  (see FIG607 "How Far Has China's Share of J-1 Scholars Fallen?" on
  `retention-immigration__mobile-390x844.png`) — consumes more vertical
  space than the chart itself.

## Keyboard problems

- Chart series have no keyboard-specific interaction (no arrow-key
  stepping between lines/bars).
- Map countries are only keyboard-operable when `onSelect` is passed
  (currently: never — see above), so **no map anywhere in the app is
  currently keyboard-reachable at all**, not even to hear its tooltip
  content via a screen reader.
- The news ticker's continuously-animating marquee pauses on `:focus`
  (confirmed in `NewsTicker.tsx`), which is correct, but individual story
  links inside the moving track are real tab stops while the track is
  animating — a keyboard user tabbing through a still-moving ticker before
  it registers focus-pause could have the visual target shift under them
  for one frame.

## Missing or weak empty/loading/error states

- **No top-level error state.** `App.tsx`'s `talent.json` fetch:
  `.catch(() => {})` — a failed fetch (network issue, bad deploy) leaves
  the reader looking at a permanently empty shell with the topbar's status
  dot stuck on "loading" and zero explanation. This is the one clearly
  *missing* state, not just a weak one — every individual chart component
  already has a real "No data for this exhibit" fallback.
- News ticker's loading/empty states exist and read fine
  (`NewsTicker.tsx`'s "Loading real-time coverage…" / "No matching
  stories..." branches).

## Existing strengths worth preserving (not everything needs replacing)

- Real per-exhibit citations, always visible via one consistent
  `ExpandableMethods` control — the task doc's "do not hide sources" rule
  is already met structurally; it just needs to survive the redesign.
- Cross-highlight (hover a country, see it emphasized elsewhere on the
  page) is real, working, and exactly the kind of "linked interaction"
  Phase 8.3 asks for — a foundation to build on, not replace.
- `prefers-reduced-motion` is already respected everywhere motion exists.
- The Sankeys' particle animation is user-toggleable ("Particles on/off")
  and off by default would satisfy Phase 6.1's "optional particles off by
  default" — currently defaults to **on**, a one-line fix once decided.
