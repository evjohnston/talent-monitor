import { countryColor, countryName } from "../lib/countries.ts";

export interface LeaderboardRow {
  name: string;
  country?: string | null; // omit when the row has no real country dimension
  value: number;
}

export function Leaderboard({
  rows,
  unit = "records",
  nameLabel = "Name",
  onSelect,
  activeName,
}: {
  rows: LeaderboardRow[];
  unit?: string;
  nameLabel?: string;
  onSelect?: (name: string) => void;
  activeName?: string | null;
}) {
  if (rows.length === 0) {
    return <div className="trend-empty">No data for this exhibit.</div>;
  }
  const hasCountry = rows.some((r) => r.country);
  return (
    <table className="lb">
      <thead>
        <tr>
          <th className="rank">#</th>
          <th>{nameLabel}</th>
          {hasCountry && <th>Country</th>}
          <th className="right">{unit}</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((r, i) => (
          <tr
            key={r.name}
            className={`${onSelect ? "clickable" : ""}${activeName === r.name ? " active" : ""}`}
            onClick={() => onSelect?.(r.name)}
          >
            <td className="rank">{i + 1}</td>
            <td className="org-name" style={{ maxWidth: 220, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.name}</td>
            {hasCountry && (
              <td style={{ whiteSpace: "nowrap" }}>
                {r.country && (
                  <span className="actor-tag" style={{ background: countryColor(r.country) }}>
                    {countryName(r.country)}
                  </span>
                )}
              </td>
            )}
            <td className="right count">{r.value.toLocaleString()}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
