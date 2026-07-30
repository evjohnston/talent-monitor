import { useEffect, useRef, useState } from "react";
import { usePrefersReducedMotion } from "./useReducedMotion.ts";

// Animates a displayed number from 0 up to a real target value on mount
// or whenever the target changes — used by KpiCard so the Overview's
// headline numbers feel alive without becoming a fabricated "loading"
// state (the target itself is always the real, already-computed value;
// this only animates *how it's revealed*). Skips straight to the target
// under prefers-reduced-motion.
export function useCountUp(target: number, durationMs = 900): number {
  const reducedMotion = usePrefersReducedMotion();
  // Starts at the real target, not 0 — this is what renders during
  // Astro's static build and what a reader sees before hydration (the
  // Astro migration's no-JS floor requires a real number, never a
  // placeholder). The mount effect below then resets to 0 and animates
  // back up, so the count-up reveal still happens, just as a JS-only
  // flourish layered on top of an always-true initial value rather than
  // something the real number depends on.
  const [value, setValue] = useState(target);
  const startRef = useRef<number | null>(null);
  const fromRef = useRef(0);

  useEffect(() => {
    if (reducedMotion) { setValue(target); return; }
    fromRef.current = 0;
    startRef.current = null;
    setValue(0);
    let raf = 0;
    const step = (now: number) => {
      if (startRef.current == null) startRef.current = now;
      const t = Math.min(1, (now - startRef.current) / durationMs);
      const eased = 1 - Math.pow(1 - t, 3); // ease-out cubic
      setValue(fromRef.current + (target - fromRef.current) * eased);
      if (t < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target, reducedMotion]);

  return value;
}
