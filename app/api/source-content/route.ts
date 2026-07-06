import { type NextRequest } from "next/server";

type SourceSuccess = {
  ok: true;
  sourceType: "text";
  text: string;
};

type SourceFailure = {
  ok: false;
  code: "url_not_supported" | "not_readable";
  message: string;
};

const MAX_TEXT_LENGTH = 50_000;

export async function POST(request: NextRequest) {
  let source: string;
  try {
    const body = (await request.json()) as { source?: string };
    source = body.source?.trim() ?? "";
  } catch {
    return Response.json(
      { ok: false, code: "not_readable", message: "Invalid request body." } satisfies SourceFailure,
      { status: 400 },
    );
  }

  if (!source) {
    return Response.json(
      { ok: false, code: "not_readable", message: "Source is required." } satisfies SourceFailure,
      { status: 400 },
    );
  }

  if (isUrlOnly(source)) {
    return Response.json(
      {
        ok: false,
        code: "url_not_supported",
        message: "URL import is disabled by security policy. Paste article text, chart data, or source guidance instead.",
      } satisfies SourceFailure,
      { status: 400 },
    );
  }

  return Response.json({
    ok: true,
    sourceType: "text",
    text: cleanText(source).slice(0, MAX_TEXT_LENGTH),
  } satisfies SourceSuccess);
}

function isUrlOnly(source: string) {
  if (!/^https?:\/\/\S+$/i.test(source)) return false;
  try {
    new URL(source);
    return true;
  } catch {
    return false;
  }
}

function cleanText(value: string) {
  return value
    .split(/\n+/)
    .map((line) => line.replace(/\s+/g, " ").trim())
    .filter(Boolean)
    .join("\n");
}
