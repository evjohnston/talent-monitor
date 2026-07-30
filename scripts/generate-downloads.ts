// Build-time generation of the two "generate real files" download formats
// the user asked for explicitly (2026-07-30): PNG chart images and
// combined per-stage ZIP bundles — both build-time-generated rather than
// client-side, matching this app's own static/no-runtime-compute
// philosophy already established for talent.json itself.
//
// Must run AFTER `astro build` (needs a real dist/ to screenshot and to
// write into) and BEFORE the deploy workflow's upload-pages-artifact step
// — see .github/workflows/build-and-deploy.yml. Writes into
// dist/downloads/, never public/downloads/ — these are derived build
// output, not committed source data, the same distinction CLAUDE.md
// already draws between public/data/talent.json (real, committed) and
// dist/ (regenerated every build, never committed).
//
// Run: npx tsx scripts/generate-downloads.ts
import { readFileSync, mkdirSync, existsSync, createWriteStream } from "node:fs";
import { join } from "node:path";
import { spawn, type ChildProcess } from "node:child_process";
import { chromium } from "@playwright/test";
import { ZipArchive } from "archiver";
import type { DataFile, Exhibit } from "../src/lib/types.ts";
import { rowsToCsv } from "../src/lib/csv.ts";
import { buildExportFilename } from "../src/lib/exportFilename.ts";

const ROOT = join(import.meta.dirname, "..");
const DIST = join(ROOT, "dist");
const DATA_PATH = join(ROOT, "public", "data", "talent.json");
const PORT = 4322; // deliberately not 4321 — avoids colliding with a real dev/preview/test server already using the default port
const BASE = process.env.GTM_BASE ?? "/";

function loadExhibits(): Exhibit[] {
  const data: DataFile = JSON.parse(readFileSync(DATA_PATH, "utf-8"));
  return data.exhibits;
}

async function waitForServer(url: string, timeoutMs = 30_000): Promise<void> {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(url);
      if (res.ok) return;
    } catch {
      // not up yet
    }
    await new Promise((r) => setTimeout(r, 300));
  }
  throw new Error(`Server at ${url} did not respond within ${timeoutMs}ms`);
}

async function generatePngs(exhibits: Exhibit[]) {
  const outDir = join(DIST, "downloads", "png");
  mkdirSync(outDir, { recursive: true });

  const preview: ChildProcess = spawn("npx", ["astro", "preview", "--port", String(PORT)], {
    cwd: ROOT,
    env: { ...process.env, GTM_BASE: BASE },
    stdio: "ignore",
  });

  try {
    await waitForServer(`http://localhost:${PORT}${BASE}`);
    const browser = await chromium.launch();
    const page = await browser.newPage({ viewport: { width: 900, height: 900 } });

    // One pass per real stage page — an exhibit only needs visiting once,
    // even though every panel on that page has its own chart.
    const stages = [...new Set(exhibits.map((e) => e.stage))];
    const stageRoutes: Record<string, string> = {
      foundation: "foundation",
      "degree-production": "degree-production",
      "graduate-training": "graduate-training",
      "workforce-entry": "workforce-entry",
      "retention-immigration": "retention-immigration",
      "research-output": "research-output",
    };

    let generated = 0;
    for (const stage of stages) {
      const route = stageRoutes[stage];
      if (!route) continue;
      await page.goto(`http://localhost:${PORT}${BASE}${route}/`, { waitUntil: "networkidle" });
      await page.waitForTimeout(500); // let Nivo/react-simple-maps finish their own post-hydration measurement pass

      // Interactive chrome (WorldMap's expand corner button, the >6-series
      // legend's toggle buttons) sits visually on top of the chart itself,
      // not inside its own separate box — a real, confirmed issue caught
      // by hand reviewing the first PNGs this script produced (the expand
      // icon's own corner square was baked into the exported image).
      // Hiding it for the screenshot only, not the real page, since a
      // downloadable static image shouldn't carry a control that does
      // nothing once it's a flat PNG.
      await page.addStyleTag({ content: ".map-expand { display: none !important; }" });

      const panels = page.locator(".panel");
      const count = await panels.count();
      for (let i = 0; i < count; i++) {
        const panel = panels.nth(i);
        const heading = await panel.locator("h2, h3").first().textContent().catch(() => null);
        const exhibit = exhibits.find((e) => e.title === heading?.trim());
        // exhibit.stage !== stage is a safety net for a real (if unlikely)
        // title collision between two exhibits on different stages —
        // never actually observed, but cheap to guard against.
        if (!exhibit || exhibit.stage !== stage) continue;
        const svg = panel.locator("svg").first();
        if ((await svg.count()) === 0) continue;
        const filename = buildExportFilename(exhibit, "png");
        await svg.screenshot({ path: join(outDir, filename) });
        generated++;
      }
    }

    await browser.close();
    console.log(`Generated ${generated} chart PNGs -> ${outDir}`);
  } finally {
    preview.kill();
  }
}

async function generateZips(exhibits: Exhibit[]) {
  const outDir = join(DIST, "downloads", "zip");
  mkdirSync(outDir, { recursive: true });

  const byStage = new Map<string, Exhibit[]>();
  for (const e of exhibits) {
    if (!byStage.has(e.stage)) byStage.set(e.stage, []);
    byStage.get(e.stage)!.push(e);
  }

  for (const [stage, stageExhibits] of byStage) {
    const zipPath = join(outDir, `${stage}.zip`);
    await new Promise<void>((resolve, reject) => {
      const output = createWriteStream(zipPath);
      const archive = new ZipArchive({ zlib: { level: 9 } });
      output.on("close", resolve);
      archive.on("error", reject);
      archive.pipe(output);
      for (const e of stageExhibits) {
        const csv = rowsToCsv(e.rows);
        if (csv) archive.append(csv, { name: buildExportFilename(e, "csv") });
      }
      archive.finalize();
    });
  }
  console.log(`Generated ${byStage.size} per-stage ZIP bundles -> ${outDir}`);
}

async function main() {
  if (!existsSync(DIST)) {
    console.error("dist/ doesn't exist — run `npm run build` first.");
    process.exit(1);
  }
  const exhibits = loadExhibits();
  await generateZips(exhibits);
  await generatePngs(exhibits);
}

main();
