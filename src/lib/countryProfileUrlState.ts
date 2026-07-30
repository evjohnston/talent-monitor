// A country profile's own compare state (issue #19's "preserve
// comparison state in the URL" rule) — up to 3 additional real profile
// countries, shareable via ?compare=DE,KR,JP. Same SSR-safe
// read-on-mount, ordinary-filter-tweak (replaceState) pattern already
// established for explorer filters/pinned countries — there's no
// separate "view" here (unlike the explorer's own compare mode): the
// comparison renders inline on the same page via extended chart
// emphasis, not a distinct route/state.
export const MAX_COMPARE_COUNTRIES = 3;

export function readCompareCountriesFromUrl(): string[] {
  if (typeof window === "undefined") return [];
  const params = new URLSearchParams(window.location.search);
  return (params.get("compare") ?? "")
    .split(",")
    .map((s) => s.trim().toUpperCase())
    .filter((s) => /^[A-Z]{2}$/.test(s))
    .slice(0, MAX_COMPARE_COUNTRIES);
}

export function writeCompareCountriesToUrl(codes: string[]) {
  if (typeof window === "undefined") return;
  const params = new URLSearchParams(window.location.search);
  if (codes.length > 0) params.set("compare", codes.join(","));
  else params.delete("compare");
  const query = params.toString();
  window.history.replaceState(null, "", `${window.location.pathname}${query ? `?${query}` : ""}`);
}
