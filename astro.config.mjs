import { defineConfig } from "astro/config";
import react from "@astrojs/react";

// Same base-path convention the old vite.config.ts used: unset for local
// dev / a root domain, "/<repo>/" for GitHub Pages (set by
// build-and-deploy.yml's Build step via GTM_BASE — unchanged by this
// migration).
const base = process.env.GTM_BASE ?? "/";

export default defineConfig({
  base,
  output: "static",
  integrations: [react()],
  vite: {
    build: {
      // One legitimate chunk still exceeds the 500kB default after the
      // manualChunks split below: world-atlas's countries-50m.json
      // (740kB), WorldMap.tsx's hi-res country geometry for its
      // "expand map" fullscreen view. Confirmed by hand this chunk is
      // genuinely lazy (a real `import()` inside the expand handler,
      // never part of any page's initial JS) and its content hash is
      // unchanged from before this whole chunking pass — it isn't part
      // of the problem the default warning exists to catch (a chunk
      // that blocks first render), so raising the threshold here
      // documents that as a real, checked trade-off rather than
      // papering over an actual regression.
      chunkSizeWarningLimit: 800,
      rollupOptions: {
        output: {
          // Default chunking bundled every Track page's real chart
          // dependencies (Nivo + react-spring's animation engine, react-
          // simple-maps + d3-geo + world-atlas's country geometry) into
          // one 500kB+ chunk alongside TrackShell's own small component
          // code — confirmed by hand (`du -h dist/_astro/*.js`) before
          // picking this fix, not guessed from the generic Vite warning
          // alone. Splitting these rarely-changing vendor libraries into
          // their own chunks doesn't reduce total bytes a chart-heavy
          // page downloads, but lets the browser fetch them in parallel
          // instead of one serial blob, and lets them stay cached across
          // deploys that only touch this app's own component code.
          //
          // Deliberately `world-atlas/countries-110m` (the low-res file
          // WorldMap.tsx imports eagerly), NOT a bare `world-atlas` match
          // — a real regression caught by hand on the first attempt: a
          // broad match also swallowed `countries-50m.json`, which
          // WorldMap.tsx loads via a genuinely lazy `import()` only when
          // a reader clicks "expand map." Grouping it into this eager
          // vendor chunk defeated that lazy-load entirely (confirmed:
          // `dist/_astro/countries-50m.*.js` stopped existing as its own
          // chunk once this match was too broad).
          manualChunks(id) {
            if (!id.includes("node_modules")) return undefined;
            if (id.includes("@nivo") || id.includes("@react-spring")) return "vendor-nivo";
            if (id.includes("d3-geo") || id.includes("react-simple-maps") || id.includes("topojson") || id.includes("world-atlas/countries-110m")) return "vendor-map";
            if (id.includes("d3-sankey")) return "vendor-sankey";
            return undefined;
          },
        },
      },
    },
  },
});
