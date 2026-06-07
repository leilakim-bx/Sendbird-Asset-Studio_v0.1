import { type NextRequest } from "next/server";
import { env } from "@/lib/env";
import {
  ANALYZE_ARTICLE_SYSTEM_PROMPT,
  buildAnalyzeUserPrompt,
} from "@/lib/ai/analyze-article-prompt";
import { validateSuggestions } from "@/lib/ai/validate-suggestions";

/**
 * POST /api/analyze-article
 * Body: { article: string }
 *
 * Sends the article to Claude, then runs the response through
 * validate-suggestions so the route ONLY ever emits suggestions that pass our
 * schema + confidence floor. Mirrors generate-scenario (mock mode, env check,
 * status-coded errors). An empty `suggestions` array is a valid response.
 *
 * Requires ANTHROPIC_API_KEY in .env.local (defaults to "mock").
 */

// Swap to a stronger model here if extraction accuracy needs it — the
// validator is the correctness guarantee regardless.
const MODEL = "claude-3-5-haiku-20241022";

type AnthropicResponse = {
  content?: Array<{ type: string; text: string }>;
  error?: { message: string };
};

// ── Mock mode ─────────────────────────────────────────────
// Default key is "mock", so without a real key Analyze hits this. The data is
// shaped to PASS validate-suggestions (valid blockType + content + confidence),
// and a no-digits / keyword article returns [] to exercise the empty case.

function mockRawSuggestions(article: string): unknown[] {
  const hasData = /\d/.test(article);
  const forceEmpty = /\bno data\b|\blorem\b/i.test(article);
  if (!hasData || forceEmpty) return [];

  return [
    {
      blockType: "stat",
      confidence: 0.92,
      sourceQuote: "83% of consumers credit the brand for using AI.",
      suggestedTitle: "AI is brand equity now.",
      suggestedContent: {
        type: "stat",
        eyebrow: "RETAIL",
        number: "83%",
        highlightNumber: true,
        label: "link AI to brand trust",
      },
    },
    {
      blockType: "bar-group",
      confidence: 0.86,
      sourceQuote:
        "For checking order status, 49% prefer AI versus 34% for human agents; for refunds the preference flips to 50% human.",
      suggestedTitle: "Shopper preference by task",
      suggestedContent: {
        type: "bar-group",
        labelA: "prefer AI",
        labelB: "prefer human",
        unit: "%",
        items: [
          { label: "Check order status", valueA: 49, valueB: 34, highlight: true },
          { label: "Process a refund", valueA: 32, valueB: 50 },
          { label: "Dispute a price", valueA: 30, valueB: 54 },
        ],
      },
    },
    {
      blockType: "step",
      confidence: 0.81,
      sourceQuote:
        "The system detects a signal, evaluates rules, places an outbound call, and resolves the issue before escalation.",
      suggestedTitle: "How Proactive Voice works",
      suggestedContent: {
        type: "step",
        items: [
          { title: "Signal detected", desc: "Order delayed, ticket stalled, payment failed" },
          { title: "Rule evaluated", desc: "Priority, timing, and channel logic applied" },
          { title: "AI calls out", desc: "Outbound call placed with full context" },
          { title: "Resolved", desc: "Issue closed before the customer reached out" },
        ],
      },
    },
  ];
}

export async function POST(request: NextRequest) {
  const apiKey = env.anthropicApiKey;

  if (!apiKey) {
    return Response.json(
      { error: "ANTHROPIC_API_KEY not configured in .env.local" },
      { status: 503 },
    );
  }

  let article: string;
  try {
    const body = (await request.json()) as { article?: string };
    article = body.article?.trim() ?? "";
  } catch {
    return Response.json({ error: "Invalid request body" }, { status: 400 });
  }

  if (!article) {
    return Response.json({ error: "article is required" }, { status: 400 });
  }

  // Mock mode — no real API call. Still validated, so the UI path is identical.
  if (apiKey === "mock") {
    await new Promise((r) => setTimeout(r, 800)); // simulate latency
    const suggestions = validateSuggestions({ suggestions: mockRawSuggestions(article) }, article);
    return Response.json({ suggestions });
  }

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 2048,
      system: ANALYZE_ARTICLE_SYSTEM_PROMPT,
      messages: [{ role: "user", content: buildAnalyzeUserPrompt(article) }],
    }),
  });

  if (!res.ok) {
    const err = (await res.json().catch(() => ({}))) as { error?: { message: string } };
    return Response.json(
      { error: err.error?.message ?? `Anthropic API error: ${res.status}` },
      { status: res.status },
    );
  }

  const data = (await res.json()) as AnthropicResponse;
  const text = data.content?.[0]?.text ?? "";

  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    return Response.json(
      { error: "Model returned invalid JSON — try again or shorten the article." },
      { status: 502 },
    );
  }

  // Validation is the guard: only schema-valid, confident suggestions escape.
  const suggestions = validateSuggestions(parsed, article);
  return Response.json({ suggestions });
}
