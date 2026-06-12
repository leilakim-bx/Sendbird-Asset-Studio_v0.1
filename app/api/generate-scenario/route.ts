import { type NextRequest } from "next/server";
import { validateScenario } from "@/lib/ai/validate-scenario";

/**
 * POST /api/generate-scenario
 * Body: { prompt: string }
 *
 * Builds a local preset-based conversation from the marketer's prompt. No
 * external LLM calls are allowed in this studio; the generated blocks still run
 * through `validateScenario` before reaching the editor.
 */

function localPresetMessages(prompt: string): unknown[] {
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
      { type: "itinerary", intro: "I found a simple plan that keeps the trip relaxed and easy to book.", cta: "Start booking", groups: [
        { label: "MON", items: [
          { icon: "lodging", title: "Check in at 4pm", sub: "InterContinental Thalasso", badge: "Best match", badgeTone: "accent" },
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

  const messages = validateScenario(localPresetMessages(prompt));
  if (messages.length === 0) {
    return Response.json(
      { error: "No usable local scenario preset matched this prompt." },
      { status: 500 },
    );
  }

  return Response.json({ messages });
}
