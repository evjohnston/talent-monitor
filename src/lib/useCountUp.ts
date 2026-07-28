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
  const [value, setValue] = useState(reducedMotion ? target : 0);
  const startRef = useRef<number | null>(null);
  const fromRef = useRef(0);

  useEffect(() => {
    if (reducedMotion) { setValue(target); return; }
    fromRef.current = 0;
    startRef.current = null;
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
