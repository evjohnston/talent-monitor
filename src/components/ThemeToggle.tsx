import { useState } from "react";

// The actual light/dark toggle click handler — the initial, no-flash
// theme value itself is set by a small blocking inline script in
// BaseLayout.astro's <head>, which runs before this island ever
// hydrates (see that file's comment for why). This component just reads
// whatever data-theme is already on <html> for its initial icon state,
// so it never has to guess ahead of the blocking script.
export function ThemeToggle() {
  // Guarded for SSR (Astro renders this island's static markup at build
  // time, when `document` doesn't exist) — the blocking inline script in
  // BaseLayout.astro's <head> has already set the real value by the time
  // this hydrates in the browser, so the SSR fallback of "light" here is
  // only ever visible for one un-hydrated frame at most.
  const [dark, setDark] = useState(() => typeof document !== "undefined" && document.documentElement.dataset.theme === "dark");
  function toggle() {
    const next = !dark;
    setDark(next);
    document.documentElement.dataset.theme = next ? "dark" : "light";
    localStorage.setItem("gtm-theme", next ? "dark" : "light");
  }
  return (
    <button className="theme-toggle" onClick={toggle} aria-label={dark ? "Switch to light mode" : "Switch to dark mode"} title={dark ? "Switch to light mode" : "Switch to dark mode"}>
      {dark ? "☀" : "☾"}
    </button>
  );
}
