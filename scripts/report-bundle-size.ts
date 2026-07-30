// Real bundle-size reporting (issue #17) — run after `astro build`, reads
// the actual dist/_astro/*.js chunks and public/data/talent.json's real
// size, prints them sorted descending, and flags anything past a real,
// already-established threshold. Deliberately a visibility report, not a
// historical byte-diffing budget system — the issue's own "prevent
// unexplained growth above N%" requirement needs a committed baseline to
// diff against, which is real, larger follow-up work (tracked in the
// Lighthouse budgets follow-up issue), not invented here as a half-built
// mechanism with no real baseline behind it yet.
//
// Run: npx tsx scripts/report-bundle-size.ts (after `npm run build`)
import { readdirSync, statSync, existsSync } from "node:fs";
import { join } from "node:path";

const ROOT = join(import.meta.dirname, "..");
const ASTRO_DIR = join(ROOT, "dist", "_astro");
const TALENT_JSON = join(ROOT, "public", "data", "talent.json");

// Matches astro.config.mjs's own chunkSizeWarningLimit (800) — the same
// real, already-checked-by-hand threshold (see CLAUDE.md's "Build
// chunking" section), not a new number invented for this report.
const CHUNK_WARNING_KB = 800;

function main() {
  if (!existsSync(ASTRO_DIR)) {
    console.error("dist/_astro/ doesn't exist — run `npm run build` first.");
    process.exit(1);
  }

  const jsFiles = readdirSync(ASTRO_DIR)
    .filter((f) => f.endsWith(".js"))
    .map((f) => ({ name: f, kb: statSync(join(ASTRO_DIR, f)).size / 1024 }))
    .sort((a, b) => b.kb - a.kb);

  console.log("Real JS chunk sizes (dist/_astro/*.js), largest first:");
  for (const f of jsFiles) {
    const flag = f.kb > CHUNK_WARNING_KB ? "  <-- over the 800KB warning threshold" : "";
    console.log(`  ${f.kb.toFixed(0).padStart(6)} KB  ${f.name}${flag}`);
  }
  const totalKb = jsFiles.reduce((sum, f) => sum + f.kb, 0);
  console.log(`Total: ${jsFiles.length} chunks, ${(totalKb / 1024).toFixed(2)} MB`);

  if (existsSync(TALENT_JSON)) {
    const dataKb = statSync(TALENT_JSON).size / 1024;
    console.log(`\npublic/data/talent.json: ${(dataKb / 1024).toFixed(2)} MB — the real, full corpus. As of issue #23's per-route hydration-payload fix (2026-07-30), only Overview/Methodology/Downloads/Explorer/country profiles genuinely need this whole file in their own hydration payload; each of the 6 single-stage Track pages now ships only its own ~10-20 exhibits (buildTrackContext() in buildContext.ts) — confirmed by hand at roughly 120-300KB of escaped JSON per stage, not the full ~2.5MB every Track page used to carry. See CLAUDE.md's "Chart-page performance" section for the real before/after Lighthouse numbers.`);
  }
}

main();
