import { get, list, put } from "@vercel/blob";
import type { BriefLogEvent } from "@/lib/brief-log";

/**
 * Server-side storage for brief usage events. Follows the work-backups Blob
 * pattern: when no Blob credentials are configured (local dev), operations are
 * skipped silently and the client keeps its localStorage copy.
 */

export const BRIEF_LOG_BLOB_PREFIX = "telemetry/brief-log/";
export const BRIEF_LOG_LIST_LIMIT = 200;

const TEMPLATES = new Set(["product-visual", "infographic", "chat"]);
const EVENTS = new Set([
  "brief_submitted",
  "recipe_selected",
  "candidate_selected",
  "export_completed",
]);
const MAX_TEXT_LENGTH = 700;
const MAX_META_ENTRIES = 12;

export function hasBriefLogBlobCredentials() {
  return Boolean(
    process.env.BLOB_READ_WRITE_TOKEN ||
    (process.env.VERCEL_OIDC_TOKEN && process.env.BLOB_STORE_ID),
  );
}

/** Validate an incoming event payload; returns null when malformed. */
export function validateBriefLogEvent(value: unknown): BriefLogEvent | null {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return null;
  const event = value as Partial<BriefLogEvent>;

  if (event.v !== 1) return null;
  if (typeof event.ts !== "number" || !Number.isFinite(event.ts)) return null;
  if (event.clientId !== null && typeof event.clientId !== "string") return null;
  if (typeof event.template !== "string" || !TEMPLATES.has(event.template)) return null;
  if (typeof event.event !== "string" || !EVENTS.has(event.event)) return null;
  if (event.text !== undefined && typeof event.text !== "string") return null;

  let meta: BriefLogEvent["meta"];
  if (event.meta !== undefined) {
    if (typeof event.meta !== "object" || event.meta === null || Array.isArray(event.meta)) return null;
    const entries = Object.entries(event.meta).slice(0, MAX_META_ENTRIES);
    if (entries.some(([, v]) => !["string", "number", "boolean"].includes(typeof v))) return null;
    meta = Object.fromEntries(entries) as BriefLogEvent["meta"];
  }

  return {
    v: 1,
    ts: event.ts,
    clientId: event.clientId ?? null,
    template: event.template,
    event: event.event,
    ...(event.text !== undefined ? { text: event.text.slice(0, MAX_TEXT_LENGTH) } : {}),
    ...(meta !== undefined ? { meta } : {}),
  };
}

function eventPath(event: BriefLogEvent) {
  const day = new Date(event.ts).toISOString().slice(0, 10);
  const rand = Math.random().toString(36).slice(2, 8);
  return `${BRIEF_LOG_BLOB_PREFIX}${day}/${event.ts}-${rand}.json`;
}

export async function saveBriefLogEvent(
  event: BriefLogEvent,
): Promise<{ enabled: boolean; saved: boolean }> {
  if (!hasBriefLogBlobCredentials()) {
    return { enabled: false, saved: false };
  }

  await put(eventPath(event), JSON.stringify(event), {
    access: "private",
    allowOverwrite: true,
    contentType: "application/json",
  });
  return { enabled: true, saved: true };
}

async function readEventBlob(pathname: string): Promise<BriefLogEvent | null> {
  try {
    const blob = await get(pathname, { access: "private", useCache: false });
    if (!blob || blob.statusCode !== 200) return null;
    const text = await new Response(blob.stream).text();
    return validateBriefLogEvent(JSON.parse(text));
  } catch {
    return null;
  }
}

/** List recent events, newest first. Empty when Blob is not connected. */
export async function listBriefLogEvents(
  limit = BRIEF_LOG_LIST_LIMIT,
): Promise<{ enabled: boolean; events: BriefLogEvent[] }> {
  if (!hasBriefLogBlobCredentials()) {
    return { enabled: false, events: [] };
  }

  const cappedLimit = Math.max(1, Math.min(limit, BRIEF_LOG_LIST_LIMIT));
  const result = await list({ prefix: BRIEF_LOG_BLOB_PREFIX, limit: cappedLimit * 2 });
  const sorted = result.blobs
    .sort((a, b) => b.uploadedAt.getTime() - a.uploadedAt.getTime())
    .slice(0, cappedLimit);

  const read = await Promise.all(sorted.map((blob) => readEventBlob(blob.pathname)));
  const events = read
    .filter((event): event is BriefLogEvent => event !== null)
    .sort((a, b) => b.ts - a.ts);

  return { enabled: true, events };
}
