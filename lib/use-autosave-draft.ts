import { useEffect, useRef } from "react";

/**
 * Debounced write-through autosave for an in-progress editor draft.
 *
 * Why debounce: the Zustand persist middleware re-serializes the *entire*
 * partialized blob (incl. every saved asset's base64 thumbnail) on each `set`.
 * Saving on every keystroke would stringify ~1MB synchronously per character.
 * So we coalesce writes (default 500ms).
 *
 * Why flush on teardown: a pending debounced write is dropped if the user
 * navigates away or closes the tab inside the window — which would reintroduce
 * the exact data loss autosave exists to prevent. We flush on unmount and on
 * `pagehide` / `visibilitychange → hidden` (the tab-close / crash path).
 *
 * `ready` gates everything: it must stay false until the caller's mount/restore
 * effect has run once, so we never persist seed/default state over a draft, and
 * never add listeners before restore completes.
 */
export function useAutosaveDraft<T>(
  value: T,
  save: (value: T) => void,
  ready: boolean,
  delay = 500,
) {
  const latest = useRef(value);
  latest.current = value;

  const saveRef = useRef(save);
  saveRef.current = save;

  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Schedule a debounced save whenever the value changes (after ready).
  useEffect(() => {
    if (!ready) return;
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      timer.current = null;
      saveRef.current(latest.current);
    }, delay);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [value, ready, delay]);

  // Flush the latest value immediately on teardown (navigation away) and on the
  // tab-hide / close path, so the last edits inside the debounce window survive.
  useEffect(() => {
    if (!ready) return;
    const flush = () => {
      if (timer.current) {
        clearTimeout(timer.current);
        timer.current = null;
      }
      saveRef.current(latest.current);
    };
    const onVisibility = () => {
      if (document.visibilityState === "hidden") flush();
    };
    window.addEventListener("pagehide", flush);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      window.removeEventListener("pagehide", flush);
      document.removeEventListener("visibilitychange", onVisibility);
      flush();
    };
  }, [ready]);
}
