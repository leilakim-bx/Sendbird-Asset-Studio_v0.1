import { type NextRequest } from "next/server";

type SourceSuccess = {
  ok: true;
  sourceType: "text" | "url";
  text: string;
  title?: string;
  imageCount?: number;
};

type SourceFailure = {
  ok: false;
  code: "auth_required" | "invalid_url" | "fetch_failed" | "not_readable";
  message: string;
};

const MAX_TEXT_LENGTH = 50_000;
const MIN_READABLE_LENGTH = 120;

export async function POST(request: NextRequest) {
  let source: string;
  try {
    const body = (await request.json()) as { source?: string };
    source = body.source?.trim() ?? "";
  } catch {
    return Response.json({ ok: false, code: "invalid_url", message: "Invalid request body." } satisfies SourceFailure, {
      status: 400,
    });
  }

  if (!source) {
    return Response.json({ ok: false, code: "not_readable", message: "Source is required." } satisfies SourceFailure, {
      status: 400,
    });
  }

  const url = parseSingleUrl(source);
  if (!url) {
    return Response.json({
      ok: true,
      sourceType: "text",
      text: source.slice(0, MAX_TEXT_LENGTH),
    } satisfies SourceSuccess);
  }

  if (isBlockedHostname(url.hostname)) {
    return Response.json(
      {
        ok: false,
        code: "invalid_url",
        message: "This URL cannot be imported. Paste the article text instead.",
      } satisfies SourceFailure,
      { status: 400 },
    );
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 12_000);
    const upstream = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0 Asset Studio" },
      signal: controller.signal,
    });
    clearTimeout(timeout);

    const contentType = upstream.headers.get("content-type") ?? "";
    const raw = await upstream.text();

    if (upstream.status === 401 || upstream.status === 403 || isAuthWall(raw)) {
      return Response.json({
        ok: false,
        code: "auth_required",
        message: "This link requires login. Paste the article text or page content instead.",
      } satisfies SourceFailure);
    }

    if (!upstream.ok) {
      return Response.json({
        ok: false,
        code: "fetch_failed",
        message: `Could not read this URL (${upstream.status}). Paste the article text instead.`,
      } satisfies SourceFailure);
    }

    const parsed = contentType.includes("html")
      ? extractFromHtml(raw)
      : { title: undefined, text: raw, imageCount: 0 };

    const text = cleanText(parsed.text).slice(0, MAX_TEXT_LENGTH);
    if (text.length < MIN_READABLE_LENGTH) {
      return Response.json({
        ok: false,
        code: "not_readable",
        message: "Could not find enough readable article text. Paste the article body instead.",
      } satisfies SourceFailure);
    }

    return Response.json({
      ok: true,
      sourceType: "url",
      title: parsed.title,
      text,
      imageCount: parsed.imageCount,
    } satisfies SourceSuccess);
  } catch {
    return Response.json({
      ok: false,
      code: "fetch_failed",
      message: "Could not read this URL. Paste the article text instead.",
    } satisfies SourceFailure);
  }
}

function parseSingleUrl(source: string): URL | null {
  if (/\s/.test(source)) return null;
  if (!/^https?:\/\//i.test(source)) return null;
  try {
    return new URL(source);
  } catch {
    return null;
  }
}

function isBlockedHostname(hostname: string) {
  const host = hostname.toLowerCase();
  return (
    host === "localhost" ||
    host === "127.0.0.1" ||
    host === "::1" ||
    host.startsWith("127.") ||
    host.startsWith("10.") ||
    host.startsWith("192.168.") ||
    /^172\.(1[6-9]|2\d|3[0-1])\./.test(host) ||
    host.startsWith("169.254.")
  );
}

function isAuthWall(html: string) {
  return /Authentication Required|Vercel Authentication|x-vercel-protection-bypass|sso-api/i.test(html);
}

function extractFromHtml(html: string) {
  const title = decodeEntities(html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] ?? "").trim() || undefined;
  const imageCount = (html.match(/<img\b/gi) ?? []).length;
  const body = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i)?.[1] ?? html;
  const text = body
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(/<(script|style|noscript|template|svg)[\s\S]*?<\/\1>/gi, " ")
    .replace(/<(h[1-6]|p|li|blockquote|tr|div|section|article|br)\b[^>]*>/gi, "\n")
    .replace(/<[^>]+>/g, " ");

  return { title, imageCount, text: decodeEntities(text) };
}

function decodeEntities(value: string) {
  return value
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, "\"")
    .replace(/&#39;/g, "'")
    .replace(/&#(\d+);/g, (_match, code: string) => String.fromCharCode(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_match, code: string) => String.fromCharCode(parseInt(code, 16)));
}

function cleanText(value: string) {
  return value
    .split(/\n+/)
    .map((line) => line.replace(/\s+/g, " ").trim())
    .filter(Boolean)
    .join("\n");
}
