import { type NextRequest } from "next/server";
import { generateChatScenarioMessages } from "@/lib/ai/chat-scenario-generator";
import { validateScenario } from "@/lib/ai/validate-scenario";
import { saveBriefLogEvent } from "@/lib/server/brief-log-storage";

/**
 * POST /api/generate-scenario
 * Body: { prompt: string }
 *
 * Builds a local deterministic conversation from the marketer's prompt. No
 * external LLM calls are allowed in this studio; the generated blocks still run
 * through `validateScenario` before reaching the editor.
 */

export async function POST(request: NextRequest) {
  let prompt: string;
  try {
    const body = (await request.json()) as { prompt?: string };
    prompt = body.prompt?.trim() ?? "";
  } catch {
    return Response.json({ error: "Invalid request body" }, { status: 400 });
  }

  if (!prompt) {
    return Response.json({ error: "prompt is required" }, { status: 400 });
  }

  // Best-effort usage logging (Vercel Blob when connected) — never blocks the
  // response and never fails the request.
  void saveBriefLogEvent({
    v: 1,
    ts: Date.now(),
    clientId: null,
    template: "chat",
    event: "brief_submitted",
    text: prompt.slice(0, 600),
  }).catch(() => {});

  const messages = validateScenario(generateChatScenarioMessages(prompt));
  if (messages.length === 0) {
    return Response.json(
      { error: "No usable local scenario preset matched this prompt." },
      { status: 500 },
    );
  }

  return Response.json({ messages });
}
