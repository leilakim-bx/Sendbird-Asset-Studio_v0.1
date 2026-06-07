import { type NextRequest } from "next/server";
import { env } from "@/lib/env";
import { validateScenario } from "@/lib/ai/validate-scenario";

/**
 * POST /api/generate-scenario
 * Body: { prompt: string }
 *
 * Calls Anthropic Claude to generate a realistic AI-agent conversation built
 * from the Sendbird chat UI's bubble types (text / actions / products /
 * checklist / status / voice). The model returns a flat JSON array; everything
 * is run through `validateScenario`, which enforces the schema + role rules and
 * converts it into editor-ready ChatMessage[] (drops anything malformed).
 *
 * Requires ANTHROPIC_API_KEY in .env.local (set to "mock" for the canned path).
 */

const SYSTEM_PROMPT = `
You are a scenario writer for Sendbird's AI agent product marketing.
Generate a realistic, concise chat conversation that demonstrates the described AI agent capability,
composed from the building blocks below.

Return ONLY a valid JSON array — no markdown, no explanation, no code fences.

Each element must be exactly one of these shapes:

1. Text message (the only shape a user may send):
{ "type": "text", "role": "user" | "bot", "sender": "First name or bot", "text": "message content",
  "verifications": ["optional bot-only activity log lines"],
  "buttons": ["optional bot-only action buttons, 1-3"] }
  → PREFERRED way to offer buttons: attach them to the bot's text so the reply and
    its options render as ONE bubble. (Ignored on a user message.)

2. Action buttons — standalone, buttons only (bot only, 1-3 buttons):
{ "type": "actions", "buttons": ["Label A", "Label B"] }
  → Use ONLY when buttons follow a non-text block (e.g. after "products"). For a
    bot reply with text + buttons, use shape 1's "buttons" instead.

3. Product cards (bot only, 1-2 items):
{ "type": "products", "items": [{ "name": "Product name", "sub": "Price or subtitle", "cta": "Button label", "imageQuery": "2-3 word photo search term" }] }

4. Checklist (bot only — multi-step task progress, 2-5 items):
{ "type": "checklist", "items": [{ "label": "Step description", "status": "done" | "in-progress" | "pending", "badge": "optional short tag e.g. API/SMS" }] }

5. Status pill (bot only — a single outcome):
{ "type": "status", "label": "Order confirmed", "variant": "success" | "warning" }

6. Voice card (bot only — a spoken line). A voice card is a STANDALONE hero: if you use it, return it as the ONLY element in the array (no text/actions around it):
{ "type": "voice", "style": "quote" | "player", "transcript": "the spoken line", "caption": "optional caption", "eyebrow": "optional bold label" }

7. Itinerary (bot only — a grouped schedule/agenda: day-grouped rows + optional footer button). Best for travel plans, trip itineraries, multi-day agendas. 1-4 groups, 1-5 rows each. "icon" MUST be one of: lodging, dining, activity, sightseeing, flight, transport, place, time:
{ "type": "itinerary", "groups": [{ "label": "MON" (or "Day 1"/"Morning"), "items": [{ "icon": "lodging", "title": "Check in at 4pm", "sub": "InterContinental Thalasso" }] }], "cta": "optional footer button e.g. Start booking" }
  → The itinerary card is tall. Keep this scenario compact: just the user's question followed directly by the itinerary card — do NOT add a separate bot intro line (e.g. "Here is your itinerary") before it.

Interpreting the marketer's prompt:
- The prompt may be short, vague, or just a few keywords. Treat it as the INTENT, not a script to copy.
- Infer a concrete, credible scenario that best showcases the capability: invent specific names, products, prices, numbers, and steps that fit. Do NOT echo the prompt verbatim and never ask for clarification — always produce a finished scenario.
- Proactively choose the bubble types that make the strongest demo for that intent (checklist, status, products, voice, actions, itinerary) — don't fall back to plain text when a richer card would land better.
- Stay within the domain the marketer implied and respect any explicit detail they gave; fill in everything else with realistic specifics.

Rules:
- 3 to 5 messages total.
- Start with a user "text" message.
- Only "text" messages may have "role": "user". Every other shape is the bot — omit "role" for them.
- Use a realistic first name for the user's "sender"; use "bot" for bot messages.
- Keep copy short and punchy — this is marketing.
- Pick the blocks that best fit the scenario (e.g. checklist for multi-step automation, status for a confirmation, voice for a voice-AI demo, products for shopping).
- Never invent an "img" URL — provide "imageQuery" instead so the app can fetch a photo.
`.trim();

type AnthropicResponse = {
  content?: Array<{ type: string; text: string }>;
  error?: { message: string };
};

// ── Mock mode ─────────────────────────────────────────────
// Set ANTHROPIC_API_KEY=mock in .env.local to test the UI without a real key.
// The mock exercises ALL SEVEN bubble types across its keyword flavors so the
// render path for every block can be verified end-to-end without a live key.

function mockMessages(prompt: string): unknown[] {
  const lower = prompt.toLowerCase();
  const short = prompt.length < 80 ? prompt : "";

  const hasVoice     = /voice|call|phone|speak|spoke|talk|hotline/i.test(lower);
  const hasItinerary = /itinerary|trip|travel|vacation|tour|things to do|agenda|plan (a|my|the)?\s*(trip|day|week|visit)/i.test(lower);
  const hasTask      = /task|workflow|automat|multi-step|step|onboard|provision|migrat/i.test(lower);
  const hasStatus    = /order|track|status|deliver|refund|confirm|payment|booking/i.test(lower);
  const hasProduct   = /hotel|flight|book|shop|product|buy|item|recommend|store|cart/i.test(lower);
  const hasHandoff   = /human|agent|escalat|support|handoff/i.test(lower);

  if (hasVoice) {
    // Voice renders as a standalone hero card — a single voice message only.
    return [
      { type: "voice", style: "player", eyebrow: "Voice AI", transcript: "Your reservation is confirmed for Friday at 7 PM. I've texted you the details.", caption: "Spoken in a natural, on-brand voice" },
    ];
  }

  if (hasItinerary) {
    return [
      { type: "text", role: "user", sender: "Eloy", text: short || "What is there to do in Bora Bora?" },
      { type: "itinerary", cta: "Start booking", groups: [
        { label: "MON", items: [
          { icon: "lodging", title: "Check in at 4pm", sub: "InterContinental Thalasso" },
          { icon: "dining",  title: "Dinner",          sub: "Bora Bora Beach Club Restaurant" },
        ]},
        { label: "TUE", items: [
          { icon: "activity", title: "Snorkeling", sub: "Matira Lagoon · 9:00 AM" },
        ]},
      ]},
    ];
  }

  if (hasTask) {
    return [
      { type: "text", role: "user", sender: "Priya", text: short || "Can you get my new workspace set up?" },
      { type: "text", sender: "bot", text: "On it — I'll handle the whole setup and keep you posted.", verifications: ["Verified account permissions", "Checked seat availability"] },
      { type: "checklist", items: [
        { label: "Create workspace", status: "done", badge: "API" },
        { label: "Invite teammates", status: "done", badge: "SMS" },
        { label: "Configure billing", status: "in-progress" },
        { label: "Enable SSO", status: "pending" },
      ]},
      { type: "status", label: "Setup nearly complete", variant: "success" },
    ];
  }

  if (hasStatus) {
    return [
      { type: "text", role: "user", sender: "Alex", text: short || "Where's my order right now?" },
      { type: "text", sender: "bot", text: "Let me check that for you in real time." },
      { type: "status", label: "Out for delivery — arriving today", variant: "success" },
      { type: "actions", buttons: ["Track live", "Change address"] },
    ];
  }

  if (hasHandoff) {
    return [
      { type: "text", role: "user", sender: "Morgan", text: short || "I have an urgent issue with my recent purchase." },
      { type: "text", sender: "bot", text: "I understand this is urgent. Let me connect you with a specialist — typical wait is under 2 minutes.", buttons: ["Connect to agent", "Schedule callback", "Continue with AI"] },
      { type: "status", label: "Connecting you to a live agent", variant: "warning" },
    ];
  }

  if (hasProduct) {
    return [
      { type: "text", role: "user", sender: "Taylor", text: short || "Can you help me find the best option?" },
      { type: "text", sender: "bot", text: "Absolutely! Here are the top picks based on your request." },
      { type: "products", items: [
        { name: "Premium Suite",     sub: "$129 / night", cta: "Book now", imageQuery: "luxury hotel room" },
        { name: "Budget-friendly",   sub: "$79 / night",  cta: "Book now", imageQuery: "cozy hotel room" },
      ]},
      { type: "actions", buttons: ["See more options", "Compare"] },
    ];
  }

  // Generic fallback
  return [
    { type: "text", role: "user", sender: "Sam", text: short || "Can you help me with this?" },
    { type: "text", sender: "bot", text: "Of course! I've got everything handled. Here's what I recommend.", buttons: ["Get started", "Learn more"] },
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

  // Mock mode — no real API call
  if (apiKey === "mock") {
    await new Promise((r) => setTimeout(r, 800)); // simulate latency
    const messages = validateScenario(mockMessages(prompt));
    return Response.json({ messages });
  }

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: "claude-3-5-haiku-20241022",
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: prompt }],
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
      { error: "Model returned invalid JSON — try rephrasing your prompt." },
      { status: 500 },
    );
  }

  // Structural safety layer: drops malformed messages, enforces role rules, and
  // converts the flat model output into editor-ready ChatMessage[].
  const messages = validateScenario(parsed);
  if (messages.length === 0) {
    return Response.json(
      { error: "The model didn't return a usable scenario — try rephrasing your prompt." },
      { status: 500 },
    );
  }

  return Response.json({ messages });
}
