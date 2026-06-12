import { type NextRequest } from "next/server";
import { validateSuggestions } from "@/lib/ai/validate-suggestions";

/**
 * POST /api/analyze-article
 * Body: { article: string }
 *
 * Uses a local deterministic suggestion set, then runs it through
 * validate-suggestions so the route ONLY ever emits suggestions that pass our
 * schema + confidence floor. No external LLM calls are allowed in this studio.
 * An empty `suggestions` array is a valid response.
 */

function localRawSuggestions(article: string): unknown[] {
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

  const suggestions = validateSuggestions({ suggestions: localRawSuggestions(article) }, article);
  return Response.json({ suggestions });
}
