import { useMemo, useState } from "react";
import { sankey, sankeyLinkHorizontal, type SankeyNode } from "d3-sankey";
import { usePrefersReducedMotion } from "../lib/useReducedMotion.ts";
import { scatterMotionDots } from "../lib/sankeyParticles.ts";
import { SankeyParticleDots } from "./SankeyParticleDots.tsx";
import { Tooltip } from "./Tooltip.tsx";

export interface SankeyNodeInput {
  id: string;
  label: string;
  detail?: string; // shown under the label and in its tooltip, e.g. "73.4% of the cohort"
  color?: string; // defaults to var(--red) for a "start"/positive node, var(--slate) otherwise
}
export interface SankeyLinkInput {
  source: string; // node id
  target: string; // node id
  value: number;
  detail?: string; // tooltip line for this link specifically
}

type Node = SankeyNodeInput;
type Link = { source: string; target: string; value: number; detail?: string };

// A small, generic Sankey primitive — plain {nodes, links} in, a real
// particle-animated flow diagram out. Reused by both of this app's real
// Sankeys (see sankeyData.ts) rather than each growing its own bespoke
// chart. Deliberately simpler than money/research-flow diagrams from an
// earlier version of this app: click-to-pin + hover-preview survive (the
// real interaction people used), the search box doesn't — these diagrams
// have 5-8 nodes, not 50, so a search input would be clutter, not a tool.
export function Sankey({
  nodes,
  links,
  width = 820,
  height = 300,
  labelMargin = 132,
  unitLabel = "% of cohort",
  ariaLabel,
}: {
  nodes: Node[];
  links: Link[];
  width?: number;
  height?: number;
  // Widen for diagrams with longer node labels — a source-side label is
  // right-anchored growing leftward from the node, so a label longer than
  // the default margin runs off the SVG's left edge rather than wrapping.
  labelMargin?: number;
  unitLabel?: string;
  ariaLabel: string;
}) {
  const reducedMotion = usePrefersReducedMotion();
  const [particlesOn, setParticlesOn] = useState(true);
  const [hoverNode, setHoverNode] = useState<string | null>(null);
  const [hoverLink, setHoverLink] = useState<number | null>(null);
  const [pinnedNode, setPinnedNode] = useState<string | null>(null);
  const [tip, setTip] = useState<{ x: number; y: number; content: React.ReactNode } | null>(null);

  const focusNode = hoverNode ?? pinnedNode;
  const anyHover = focusNode != null || hoverLink != null;

  const LABEL_MARGIN = labelMargin;
  const TOP_MARGIN = 8;

  const graph = useMemo(() => {
    if (nodes.length === 0 || links.length === 0) return null;
    const layout = sankey<Node, { value: number; detail?: string }>()
      .nodeId((d) => d.id)
      .nodeWidth(14)
      .nodePadding(18)
      .extent([[LABEL_MARGIN, TOP_MARGIN], [width - LABEL_MARGIN, height - 20]]);
    return layout({
      nodes: nodes.map((n) => ({ ...n })),
      links: links.map((l) => ({ source: l.source, target: l.target, value: l.value, detail: l.detail })),
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nodes, links, width, height]);

  const maxValue = useMemo(() => (graph ? Math.max(1, ...graph.links.map((l) => l.value)) : 1), [graph]);

  const dotsByLink = useMemo(() => {
    if (!graph || !particlesOn || reducedMotion) return [];
    return graph.links.map((l, i) => {
      const source = l.source as SankeyNode<Node, { value: number }>;
      const target = l.target as SankeyNode<Node, { value: number }>;
      const w = Math.max(1, l.width ?? 1);
      return scatterMotionDots(source.x1 ?? 0, l.y0 ?? 0, target.x0 ?? 0, l.y1 ?? 0, w, 4 + Math.sqrt(l.value / maxValue) * 14, i);
    });
  }, [graph, particlesOn, reducedMotion, maxValue]);

  if (!graph) return <div className="trend-empty">No data for this diagram.</div>;

  const linkPath = sankeyLinkHorizontal();

  function isLinkActive(i: number, sourceId: string, targetId: string): boolean {
    if (hoverLink != null) return hoverLink === i;
    if (focusNode) return sourceId === focusNode || targetId === focusNode;
    return false;
  }

  return (
    <div>
      <div className="tab-bar">
        <button className="chip" aria-pressed={particlesOn} onClick={() => setParticlesOn((p) => !p)}>Particles {particlesOn ? "on" : "off"}</button>
        {pinnedNode && <button className="chip" onClick={() => setPinnedNode(null)}>Reset</button>}
      </div>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        width={width}
        style={{ minWidth: Math.min(width, 320), maxWidth: "100%" }}
        height={height}
        role="img"
        aria-label={ariaLabel}
        onClick={() => setPinnedNode(null)}
      >
        {graph.links.map((l, i) => {
          const source = l.source as SankeyNode<Node, { value: number; detail?: string }>;
          const target = l.target as SankeyNode<Node, { value: number; detail?: string }>;
          const d = linkPath(l as never);
          if (!d) return null;
          const active = isLinkActive(i, source.id, target.id);
          const w = Math.max(1, l.width ?? 1);
          const color = active ? "var(--red)" : "var(--slate)";
          const dots = dotsByLink[i] ?? [];
          return (
            <g key={i}>
              <path
                d={d}
                fill="none"
                stroke={color}
                strokeOpacity={anyHover ? (active ? 0.85 : 0.07) : 0.32}
                strokeWidth={active ? w + 1.5 : w}
                style={{ transition: "stroke-opacity 0.15s, stroke-width 0.15s" }}
                onMouseEnter={() => setHoverLink(i)}
                onMouseLeave={() => { setHoverLink(null); setTip(null); }}
                onMouseMove={(e) =>
                  setTip({
                    x: e.clientX,
                    y: e.clientY,
                    content: (
                      <>
                        <div style={{ fontWeight: 600 }}>{source.label} → {target.label}</div>
                        <div>{l.detail ?? `${l.value.toFixed(1)} ${unitLabel}`}</div>
                      </>
                    ),
                  })
                }
              />
              <SankeyParticleDots dots={dots} color={color} active={active} anyHover={anyHover} baseOpacity={0.55} />
            </g>
          );
        })}
        {graph.nodes.map((n, i) => {
          const x0 = n.x0 ?? 0, x1 = n.x1 ?? 0, y0 = n.y0 ?? 0, y1 = n.y1 ?? 0;
          const isSource = x0 < width / 2;
          const isFocused = focusNode === n.id;
          const isPinned = pinnedNode === n.id;
          const faded = anyHover && !isFocused && hoverLink == null;
          const color = n.color ?? (isSource ? "var(--red)" : "var(--ink)");
          return (
            <g
              key={i}
              opacity={faded ? 0.35 : 1}
              style={{ cursor: "pointer", outline: isPinned ? "2px solid var(--red)" : "none", outlineOffset: 2 }}
              role="button"
              tabIndex={0}
              aria-label={`${n.label}${n.detail ? `, ${n.detail}` : ""}${isPinned ? " (isolated)" : ""}`}
              onMouseEnter={() => setHoverNode(n.id)}
              onMouseLeave={() => { setHoverNode(null); setTip(null); }}
              onMouseMove={(e) =>
                setTip({
                  x: e.clientX,
                  y: e.clientY,
                  content: (
                    <>
                      <div style={{ fontWeight: 600 }}>{n.label}</div>
                      {n.detail && <div>{n.detail}</div>}
                    </>
                  ),
                })
              }
              onClick={(e) => { e.stopPropagation(); setPinnedNode((p) => (p === n.id ? null : n.id)); }}
              onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setPinnedNode((p) => (p === n.id ? null : n.id)); } }}
            >
              <rect x={x0} y={y0} width={Math.max(1, x1 - x0)} height={Math.max(1, y1 - y0)} fill={color} />
              <text x={isSource ? x0 - 8 : x1 + 8} y={(y0 + y1) / 2 - 4} textAnchor={isSource ? "end" : "start"} fontSize={11.5} fontWeight={isFocused ? 700 : 600} fill="var(--ink)">
                {n.label}
              </text>
              {n.detail && (
                <text x={isSource ? x0 - 8 : x1 + 8} y={(y0 + y1) / 2 + 10} textAnchor={isSource ? "end" : "start"} fontSize={10} fill="var(--mist)">
                  {n.detail}
                </text>
              )}
            </g>
          );
        })}
      </svg>
      {tip && <Tooltip x={tip.x} y={tip.y}>{tip.content}</Tooltip>}
    </div>
  );
}
