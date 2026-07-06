import { getWorkBackupClientId } from "@/lib/work-remote-backup";

/**
 * Invisible usage logging for create-from-brief / create-from-source flows.
 *
 * Every event is kept in a small localStorage ring buffer (so the /dev/brief-log
 * page works without any backend) and mirrored to /api/brief-log as a
 * best-effort fire-and-forget POST (stored in Vercel Blob when credentials are
 * connected). Logging must never interrupt the main editing flow: all failures
 * are swallowed silently.
 */

export const BRIEF_LOG_STORAGE_KEY = "asset-studio-brief-log-v1";
export const BRIEF_LOG_LOCAL_LIMIT = 200;
export const BRIEF_LOG_TEXT_LIMIT = 600;

export type BriefLogTemplate = "product-visual" | "infographic" | "chat";

export type BriefLogEventName =
  | "brief_submitted"
  | "recipe_selected"
  | "candidate_selected"
  | "export_completed";

export type BriefLogMeta = Record<string, string | number | boolean>;

export type BriefLogEvent = {
  v: 1;
  ts: number;
  clientId: string | null;
  template: BriefLogTemplate;
  event: BriefLogEventName;
  text?: string;
  meta?: BriefLogMeta;
};

export type BriefLogInput = {
  template: BriefLogTemplate;
  event: BriefLogEventName;
  text?: string;
  meta?: BriefLogMeta;
};

type FetchLike = (input: string | URL, init?: RequestInit) => Promise<Response>;

function truncateText(text: string | undefined): string | undefined {
  const trimmed = text?.trim();
  if (!trimmed) return undefined;
  return trimmed.length > BRIEF_LOG_TEXT_LIMIT
    ? `${trimmed.slice(0, BRIEF_LOG_TEXT_LIMIT)}…`
    : trimmed;
}

function isBriefLogEvent(value: unknown): value is BriefLogEvent {
  if (typeof value !== "object" || value === null) return false;
  const event = value as Partial<BriefLogEvent>;
  return (
    event.v === 1 &&
    typeof event.ts === "number" &&
    typeof event.template === "string" &&
    typeof event.event === "string"
  );
}

/** Read the local ring buffer (newest first). Returns [] on any failure. */
export function readLocalBriefLog(): BriefLogEvent[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(BRIEF_LOG_STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isBriefLogEvent);
  } catch {
    return [];
  }
}

function appendLocalBriefLog(event: BriefLogEvent) {
  if (typeof window === "undefined") return;
  try {
    const next = [event, ...readLocalBriefLog()].slice(0, BRIEF_LOG_LOCAL_LIMIT);
    window.localStorage.setItem(BRIEF_LOG_STORAGE_KEY, JSON.stringify(next));
  } catch {
    // localStorage 쿼터 초과 등 — 로깅은 메인 흐름을 방해하지 않는다
  }
}

function postBriefLog(event: BriefLogEvent, fetcher: FetchLike) {
  try {
    void fetcher(new URL("/api/brief-log", window.location.origin), {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ event }),
      keepalive: true,
    }).catch(() => {});
  } catch {
    // fire-and-forget — 실패는 조용히 무시
  }
}

/**
 * Record a usage event. Fire-and-forget: call as `logBriefEvent({...})` from
 * success paths only, never await it, and never let it affect the caller.
 */
export function logBriefEvent(input: BriefLogInput, fetcher: FetchLike = fetch) {
  if (typeof window === "undefined") return;

  const event: BriefLogEvent = {
    v: 1,
    ts: Date.now(),
    clientId: getWorkBackupClientId(),
    template: input.template,
    event: input.event,
    ...(truncateText(input.text) !== undefined ? { text: truncateText(input.text) } : {}),
    ...(input.meta && Object.keys(input.meta).length > 0 ? { meta: input.meta } : {}),
  };

  appendLocalBriefLog(event);
  postBriefLog(event, fetcher);
}
