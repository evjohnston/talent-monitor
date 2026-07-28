import type { StageNote } from "../../src/lib/types.ts";

// One analyst note per stage, the "so what" layer above the raw exhibit
// data — same house pattern as the old quantum/AI verticals'
// data/<vertical>/notes.ts. Every number here is read straight off an
// imported exhibit (see public/data/talent.json), not computed fresh.
export const NOTES: StageNote[] = [
  {
    stage: "foundation",
    date: "2026-07-28",
    author: "Staff",
    headline: "American math scores still haven't recovered to 2012 levels",
    body:
      "PISA math scores sat 7 points below the 2012 baseline as of the 2022 assessment, even as reading and science both improved over the same stretch. The foundation the rest of this pipeline builds on is not flat; it is improving on two of three fronts and still recovering on the third.",
  },
  {
    stage: "degree-production",
    date: "2026-07-28",
    author: "Staff",
    headline: "U.S. research doctorates keep growing, slowly",
    body:
      "American universities awarded 58,131 research doctorates in 2024, up from 250 in 1900 and roughly flat with the 57,439-57,806 range of the two prior years. STEM's share of bachelor's degrees has climbed from 18.9% in 1995 to 24.9% in 2024 — real growth, but degree production is not accelerating the way headline PhD counts alone suggest.",
  },
  {
    stage: "graduate-training",
    date: "2026-07-28",
    author: "Staff",
    headline: "International students are the majority of engineering postdocs",
    body:
      "68.0% of engineering postdoctoral researchers in 2024 were international students, alongside 57.3% in science and 55.7% in health. Whoever trains at the postdoc level in engineering specifically is, on the numbers, more often foreign-born than not.",
  },
  {
    stage: "workforce-entry",
    date: "2026-07-28",
    author: "Staff",
    headline: "H-1B approvals stay concentrated in a handful of employers",
    body:
      "The top 10 H-1B employers took 78.2% of approvals in fiscal 2024, 74.2% in 2025, and 75.5% in 2026 — concentration that has held in the mid-70s to high-70s range across the past three fiscal years rather than dispersing across more employers over time.",
  },
  {
    stage: "retention-immigration",
    date: "2026-07-28",
    author: "Staff",
    headline: "STEM OPT volume is rising, and so is its denial rate",
    body:
      "STEM Optional Practical Training receipts grew from 12,605 in 2023 to 22,285 in 2025, but the approval rate slipped from 98.7% to 95.9% over the same two years. The 10-year stay rate of international STEM PhDs, meanwhile, sat at 67.8% in 2023 — down from 72% in 2017.",
  },
  {
    stage: "research-output",
    date: "2026-07-28",
    author: "Staff",
    headline: "Patent leadership in critical technologies has already shifted",
    body:
      "Google/Alphabet's U.S. utility patents fell from 3,195 in 2015 to 2,249 in 2025, even as China's BOE Technology Group rose from 21 patents in 2005 to 2,374 in 2025 and South Korea's Samsung Display rose from 2 to 2,925 over the same span. The patent-count leaderboard for critical technologies is not static, and the American incumbent's own count went down, not just relatively but in absolute terms.",
  },
];
