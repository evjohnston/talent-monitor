import { useState } from "react";
import { Leaderboard, type LeaderboardRow } from "./Leaderboard.tsx";

export interface YearsRow {
  name: string;
  country?: string | null;
  valuesByYear: Record<string, number | null>;
}

// An entity × year grid (H-1B employers by fiscal year, patent leaders by
// snapshot year) rendered as a real leaderboard for one selected year at a
// time, rather than a table wide enough to need horizontal scrolling for
// every year at once. Reuses Leaderboard.tsx for the actual row rendering.
export function LeaderboardYears({
  years,
  rows,
  unit = "records",
  nameLabel = "Name",
  topN = 12,
}: {
  years: string[];
  rows: YearsRow[];
  unit?: string;
  nameLabel?: string;
  topN?: number;
}) {
  const [year, setYear] = useState(years[years.length - 1]);
  const ranked: LeaderboardRow[] = rows
    .map((r) => ({ name: r.name, country: r.country, value: r.valuesByYear[year] ?? 0 }))
    .filter((r) => r.value > 0)
    .sort((a, b) => b.value - a.value)
    .slice(0, topN);

  return (
    <div>
      <div className="tab-bar" style={{ marginBottom: 8 }}>
        {years.map((y) => (
          <button key={y} className="chip" aria-pressed={y === year} onClick={() => setYear(y)}>{y}</button>
        ))}
      </div>
      <Leaderboard rows={ranked} unit={unit} nameLabel={nameLabel} />
    </div>
  );
}
