import { type NextRequest } from "next/server";

/**
 * POST /api/generate-scenario
 * Body: { prompt: string }
 *
 * Calls Anthropic Claude to generate a realistic AI-agent conversation
 * matching the Sendbird chat UI schema (text / actions / products messages).
 *
 * Requires ANTHROPIC_API_KEY in .env.local
 * Get a free key at https://console.anthropic.com
 */

const SYSTEM_PROMPT = `
You are a scenario writer for Sendbird's AI agent product marketing.
Generate a realistic, concise chat conversation that demonstrates the described AI agent capability.

Return ONLY a valid JSON array — no markdown, no explanation, no code fences.

Each element must be one of these three shapes:

Text message:
{ "type": "text", "role": "user" | "bot", "sender": "First name or bot", "text": "message content" }

Action buttons (max 3 buttons):
{ "type": "actions", "buttons": ["Label A", "Label B"] }

Product cards (max 2 items):
{ "type": "products", "items": [{ "img": "", "name": "Product name", "sub": "Price or subtitle", "cta": "Button label" }] }

Rules:
- 3 to 5 messages total
- Start with a user message
- Keep messages short and punchy — this is marketing copy
- Show the AI agent's capability clearly and positively
- Use a realistic first name for the user sender
- Use "bot" as the sender value for bot messages
- Include product cards or action buttons where it makes sense for the scenario
- img is always an empty string ""
`.trim();

type AnthropicMessage = {
  content: Array<{ type: string; text: string }>;
};

type AnthropicResponse = {
  content: AnthropicMessage["content"];
  error?: { message: string };
};

// ── Mock mode ─────────────────────────────────────────────
// Set ANTHROPIC_API_KEY=mock in .env.local to test the UI without a real key.

function mockMessages(prompt: string) {
  const t = Date.now();
  const lower = prompt.toLowerCase();

  // Pick a flavour based on keywords in the prompt
  const hasProduct  = /hotel|flight|book|shop|product|buy|order|item/i.test(lower);
  const hasHandoff  = /human|agent|escalat|support|handoff/i.test(lower);

  if (hasHandoff) {
    return [
      { id: `gen-${t}-0`, type: "text", role: "user",  sender: "Morgan", text: "I have an issue with my recent purchase that needs urgent attention." },
      { id: `gen-${t}-1`, type: "text", role: "bot",   sender: "bot",    text: "I understand this is urgent. Let me connect you with a specialist right away — typical wait is under 2 minutes." },
      { id: `gen-${t}-2`, type: "actions", buttons: ["Connect to agent", "Schedule callback", "Continue with AI"] },
    ];
  }

  if (hasProduct) {
    return [
      { id: `gen-${t}-0`, type: "text",  role: "user",  sender: "Taylor", text: prompt.length < 80 ? prompt : "Can you help me find the best option?" },
      { id: `gen-${t}-1`, type: "text",  role: "bot",   sender: "bot",    text: "Absolutely! Here are the top picks based on your request." },
      { id: `gen-${t}-2`, type: "products", items: [
        { img: "", name: "Premium Option",  sub: "$129 / night", cta: "Book now" },
        { img: "", name: "Budget-friendly", sub: "$79 / night",  cta: "Book now" },
      ]},
      { id: `gen-${t}-3`, type: "actions", buttons: ["See more options", "Compare"] },
    ];
  }

  // Generic fallback
  return [
    { id: `gen-${t}-0`, type: "text",    role: "user",  sender: "Sam",  text: prompt.length < 80 ? prompt : "Can you help me with this?" },
    { id: `gen-${t}-1`, type: "text",    role: "bot",   sender: "bot",  text: "Of course! I've got everything handled. Here's what I recommend." },
    { id: `gen-${t}-2`, type: "actions", buttons: ["Get started", "Learn more"] },
  ];
}

export async function POST(request: NextRequest) {
  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    return Response.json(
      { error: "ANTHROPIC_API_KEY not configured in .env.local" },
      { status: 503 },
    );
  }

  let prompt: string;
  try {
    const body = await request.json() as { prompt?: string };
    prompt = body.prompt?.trim() ?? "";
  } catch {
    return Response.json({ error: "Invalid request body" }, { status: 400 });
  }

  if (!prompt) {
    return Response.json({ error: "prompt is required" }, { status: 400 });
  }

  // Mock mode — no real API call
  if (apiKey === "mock") {
    await new Promise((r) => setTimeout(r, 800)); // simulate latency
    return Response.json({ messages: mockMessages(prompt) });
  }

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key":         apiKey,
      "anthropic-version": "2023-06-01",
      "content-type":      "application/json",
    },
    body: JSON.stringify({
      model:      "claude-3-5-haiku-20241022",
      max_tokens: 1024,
      system:     SYSTEM_PROMPT,
      messages: [
        { role: "user", content: prompt },
      ],
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({})) as { error?: { message: string } };
    return Response.json(
      { error: err.error?.message ?? `Anthropic API error: ${res.status}` },
      { status: res.status },
    );
  }

  const data = await res.json() as AnthropicResponse;
  const text = data.content?.[0]?.text ?? "";

  try {
    const messages = JSON.parse(text);
    // Stamp unique IDs so React keys work correctly
    const stamped = (messages as Array<Record<string, unknown>>).map((m, i) => ({
      ...m,
      id: `gen-${Date.now()}-${i}`,
    }));
    return Response.json({ messages: stamped });
  } catch {
    return Response.json(
      { error: "Model returned invalid JSON — try rephrasing your prompt." },
      { status: 500 },
    );
  }
}
