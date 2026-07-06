import { useEffect, useState } from "react";

/**
 * One-time UI flag backed by a standalone localStorage key (NOT the persisted
 * Zustand blob, so it needs no store migration). Used for first-run coachmarks.
 *
 * Returns `[active, dismiss]`. `active` starts false (SSR-safe) and flips true
 * after mount only if the key has never been set. `dismiss()` sets the key and
 * hides it for good.
 */
export function useOnceFlag(key: string): [boolean, () => void] {
  const [active, setActive] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      try {
        if (!localStorage.getItem(key)) setActive(true);
      } catch {
        // localStorage unavailable (private mode / quota) — just don't show it.
      }
    }, 0);
    return () => window.clearTimeout(timer);
  }, [key]);

  const dismiss = () => {
    try {
      localStorage.setItem(key, "1");
    } catch {
      // ignore write failures
    }
    setActive(false);
  };

  return [active, dismiss];
}
