import { STAGES } from "../lib/types.ts";
import type { Dashboard } from "../lib/urlState.ts";

const DASHBOARDS: { key: Dashboard; label: string }[] = [
  { key: "overview", label: "Overview" },
  ...STAGES.map((s) => ({ key: s.id as Dashboard, label: s.label })),
];

// The 7 persistent dashboard tabs (Overview + the 6 real pipeline stages,
// see types.ts's STAGES) — one consistent label set used everywhere.
export function DashboardNavigation({ active, onNavigate }: { active: Dashboard; onNavigate: (d: Dashboard) => void }) {
  return (
    <>
      <div className="dashboard-nav-heading">Track</div>
      <nav className="dashboard-nav" aria-label="Dashboards">
        {DASHBOARDS.map((d) => (
          <button
            key={d.key}
            className="dashboard-nav-btn"
            aria-pressed={active === d.key}
            aria-current={active === d.key ? "page" : undefined}
            onClick={() => onNavigate(d.key)}
          >
            {d.label}
          </button>
        ))}
      </nav>
    </>
  );
}
