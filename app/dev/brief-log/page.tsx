"use client";

import { useEffect, useMemo, useState } from "react";
import {
  readLocalBriefLog,
  type BriefLogEvent,
} from "@/lib/brief-log";

/**
 * Internal viewer for brief usage events (/dev/** is not token-enforced).
 * Merges remote events (Vercel Blob via /api/brief-log) with this browser's
 * localStorage ring buffer so the page is useful even without Blob credentials.
 */

type RemoteResponse = {
  enabled?: boolean;
  events?: BriefLogEvent[];
};

function eventKey(event: BriefLogEvent) {
  return `${event.ts}:${event.clientId ?? "anon"}:${event.template}:${event.event}`;
}

function formatTime(ts: number) {
  try {
    return new Date(ts).toLocaleString();
  } catch {
    return String(ts);
  }
}

function formatMeta(meta: BriefLogEvent["meta"]) {
  if (!meta) return "";
  return Object.entries(meta)
    .map(([key, value]) => `${key}=${String(value)}`)
    .join(" · ");
}

export default function BriefLogDevPage() {
  const [remoteEnabled, setRemoteEnabled] = useState<boolean | null>(null);
  const [remoteEvents, setRemoteEvents] = useState<BriefLogEvent[]>([]);
  const [localEvents, setLocalEvents] = useState<BriefLogEvent[]>([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const local = readLocalBriefLog();
      if (!cancelled) setLocalEvents(local);
      try {
        const response = await fetch("/api/brief-log?limit=200");
        if (!response.ok) throw new Error();
        const payload = await response.json() as RemoteResponse;
        if (cancelled) return;
        setRemoteEnabled(Boolean(payload.enabled));
        setRemoteEvents(Array.isArray(payload.events) ? payload.events : []);
      } catch {
        if (!cancelled) setRemoteEnabled(false);
      }
    })();

    return () => { cancelled = true; };
  }, []);

  const events = useMemo(() => {
    const merged = new Map<string, BriefLogEvent>();
    for (const event of [...remoteEvents, ...localEvents]) {
      merged.set(eventKey(event), event);
    }
    return [...merged.values()].sort((a, b) => b.ts - a.ts);
  }, [remoteEvents, localEvents]);

  return (
    <main style={{ padding: 32, fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace", fontSize: 13, lineHeight: 1.5 }}>
      <h1 style={{ fontSize: 18, fontWeight: 700, marginBottom: 4 }}>Brief usage log</h1>
      <p style={{ marginBottom: 16, opacity: 0.7 }}>
        {remoteEnabled === null && "Loading remote events…"}
        {remoteEnabled === false && "Blob not connected — showing this browser's local events only."}
        {remoteEnabled === true && `Remote events: ${remoteEvents.length} · Local events: ${localEvents.length}`}
      </p>

      {events.length === 0 ? (
        <p style={{ opacity: 0.7 }}>
          No events yet. Submit a brief, pick a block, or export an image in the editors.
        </p>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table style={{ borderCollapse: "collapse", width: "100%", minWidth: 960 }}>
            <thead>
              <tr>
                {["Time", "Template", "Event", "Text", "Meta"].map((heading) => (
                  <th
                    key={heading}
                    style={{ textAlign: "left", padding: "6px 12px", borderBottom: "2px solid currentColor", whiteSpace: "nowrap" }}
                  >
                    {heading}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {events.map((event) => (
                <tr key={eventKey(event)}>
                  <td style={{ padding: "6px 12px", borderBottom: "1px solid rgba(128,128,128,0.3)", whiteSpace: "nowrap", verticalAlign: "top" }}>
                    {formatTime(event.ts)}
                  </td>
                  <td style={{ padding: "6px 12px", borderBottom: "1px solid rgba(128,128,128,0.3)", whiteSpace: "nowrap", verticalAlign: "top" }}>
                    {event.template}
                  </td>
                  <td style={{ padding: "6px 12px", borderBottom: "1px solid rgba(128,128,128,0.3)", whiteSpace: "nowrap", verticalAlign: "top" }}>
                    {event.event}
                  </td>
                  <td style={{ padding: "6px 12px", borderBottom: "1px solid rgba(128,128,128,0.3)", minWidth: 320, maxWidth: 480, verticalAlign: "top" }}>
                    {event.text ?? ""}
                  </td>
                  <td style={{ padding: "6px 12px", borderBottom: "1px solid rgba(128,128,128,0.3)", whiteSpace: "nowrap", verticalAlign: "top" }}>
                    {formatMeta(event.meta)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}
