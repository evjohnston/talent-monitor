import type { Exhibit } from "../lib/types.ts";

// A real, generic table alternative for any exhibit shape (issue #18's
// own "Table alternatives are available" requirement) — the exhibit's
// own real columns/rows, unreshaped, same raw data every chart component
// already reads. Deliberately capped in the DOM (not virtualized): the
// largest real exhibit (TAB501, 454 rows) is still small enough to
// render as a plain table without a performance concern, confirmed by
// hand.
export function ExhibitTable({ exhibit }: { exhibit: Exhibit }) {
  return (
    <div className="exhibit-table-wrap">
      <table className="downloads-table exhibit-table">
        <thead>
          <tr>
            {exhibit.columns.map((c) => (
              <th key={c}>{c}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {exhibit.rows.map((row, i) => (
            <tr key={i}>
              {exhibit.columns.map((c) => (
                <td key={c}>{row[c] == null ? "—" : String(row[c])}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
