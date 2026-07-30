// One generic SVG export for every chart kind, not per-component code —
// WorldMap/BoxPlotRow/BarRow/LeaderboardYears/Sankey are all hand-rolled
// real <svg> elements, and Nivo's ResponsiveLine (SeriesChart) also
// renders a real <svg role="img"> (confirmed directly against @nivo/core's
// source during the accessibility pass) — serializing whichever real
// <svg> is actually in the DOM works the same way regardless of which
// chart component put it there.
export function downloadChartSvg(filename: string, container: HTMLElement | null) {
  const svg = container?.querySelector("svg");
  if (!svg) return;
  const clone = svg.cloneNode(true) as SVGSVGElement;
  // A serialized <svg> needs its own xmlns to be a valid standalone
  // document when opened outside a browser tab (e.g. double-clicked from
  // Finder) — none of this app's chart components set one, since it's
  // implied by being embedded in an HTML page already.
  if (!clone.getAttribute("xmlns")) clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
  const svgText = new XMLSerializer().serializeToString(clone);
  const blob = new Blob([svgText], { type: "image/svg+xml;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
