import {
  listBriefLogEvents,
  saveBriefLogEvent,
  validateBriefLogEvent,
} from "@/lib/server/brief-log-storage";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/brief-log — store a single usage event (Vercel Blob, private).
 * GET  /api/brief-log?limit=200 — list recent events for /dev/brief-log.
 *
 * Both are best-effort: without Blob credentials they respond with
 * `enabled: false` and the client keeps its localStorage copy.
 */

export async function POST(request: Request) {
  let body: { event?: unknown };
  try {
    body = await request.json() as { event?: unknown };
  } catch {
    return Response.json({ error: "Invalid log request." }, { status: 400 });
  }

  const event = validateBriefLogEvent(body.event);
  if (!event) {
    return Response.json({ error: "Invalid log request." }, { status: 400 });
  }

  try {
    return Response.json(await saveBriefLogEvent(event));
  } catch {
    return Response.json({ error: "Could not save log event." }, { status: 500 });
  }
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const limitParam = Number(url.searchParams.get("limit") ?? "");
  const limit = Number.isFinite(limitParam) && limitParam > 0 ? limitParam : undefined;

  try {
    return Response.json(await listBriefLogEvents(limit));
  } catch {
    return Response.json({ error: "Could not load log events." }, { status: 500 });
  }
}
