import { useEffect, useRef } from "react";
import { preserveWorkSnapshot } from "@/lib/work-preservation";
import { saveRemoteWorkSnapshot } from "@/lib/work-remote-backup";
import type { WorkDataKind } from "@/lib/work-data-schema";

export function useWorkAutosnapshot<T extends object>(
  kind: WorkDataKind,
  templateId: string,
  value: T,
  ready: boolean,
  delay = 1500,
) {
  const latest = useRef(value);
  const latestSerialized = useRef("");
  const preservedSerialized = useRef<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    latest.current = value;
    try {
      latestSerialized.current = JSON.stringify(value);
    } catch {
      latestSerialized.current = "";
    }
  }, [value]);

  useEffect(() => {
    if (!ready) return;
    if (preservedSerialized.current === null) {
      preservedSerialized.current = latestSerialized.current;
      return;
    }
    if (latestSerialized.current === preservedSerialized.current) return;
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      timer.current = null;
      const snapshot = preserveWorkSnapshot(kind, templateId, latest.current);
      if (snapshot) void saveRemoteWorkSnapshot(snapshot);
      preservedSerialized.current = latestSerialized.current;
    }, delay);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [kind, templateId, value, ready, delay]);

  useEffect(() => {
    if (!ready) return;
    const flush = () => {
      if (timer.current) {
        clearTimeout(timer.current);
        timer.current = null;
      }
      if (latestSerialized.current === preservedSerialized.current) return;
      const snapshot = preserveWorkSnapshot(kind, templateId, latest.current);
      if (snapshot) void saveRemoteWorkSnapshot(snapshot);
      preservedSerialized.current = latestSerialized.current;
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
  }, [kind, templateId, ready]);
}
