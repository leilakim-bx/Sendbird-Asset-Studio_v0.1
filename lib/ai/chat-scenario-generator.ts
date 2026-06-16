import type { ScenarioMsg } from "@/lib/ai/validate-scenario";
import {
  parseStructuredBrief,
  structuredFieldValue,
  structuredTerms,
  type StructuredBrief,
} from "@/lib/structured-brief";

type IntentId =
  | "single-interaction"
  | "voice"
  | "itinerary"
  | "task"
  | "status"
  | "product"
  | "handoff"
  | "generic";

type WeightedPattern = {
  re: RegExp;
  weight: number;
};

type IntentDefinition = {
  id: Exclude<IntentId, "generic">;
  priority: number;
  threshold: number;
  patterns: WeightedPattern[];
};

const INTENTS: IntentDefinition[] = [
  {
    id: "single-interaction",
    priority: 100,
    threshold: 7,
    patterns: [
      { re: /\bsingle[-\s]?interaction\b/i, weight: 8 },
      { re: /\b(one|single)\s+(touch|reply|response|conversation|interaction)\b/i, weight: 7 },
      { re: /\b(resolve|complete|handle|finish)\s+(needs?|requests?|issues?|cases?|tasks?)\b/i, weight: 4 },
      { re: /\b(without|no|avoid(?:s|ing)?|eliminat(?:e|es|ing)|reduce(?:s|ing)?)\b.{0,36}\b(transfers?|handoffs?|follow[-\s]?ups?|repeated calls?)\b/i, weight: 8 },
      { re: /\b(repeated calls?|repeat(?:ing)? themselves|fragmented handoffs?|fragmented transfers?)\b/i, weight: 6 },
      { re: /\b(end[-\s]?to[-\s]?end|owned outcome|full resolution|first[-\s]?contact resolution)\b/i, weight: 5 },
    ],
  },
  {
    id: "voice",
    priority: 80,
    threshold: 5,
    patterns: [
      { re: /\bvoice\b/i, weight: 6 },
      { re: /\b(phone|hotline)\b/i, weight: 5 },
      { re: /\b(speak|spoke|spoken|talk)\b/i, weight: 4 },
      { re: /\b(outbound|inbound|automated|proactive)\s+(phone\s+)?calls?\b/i, weight: 6 },
      { re: /\b(phone\s+calls?|callback|call\s+back|call\s+the\s+customer)\b/i, weight: 5 },
    ],
  },
  {
    id: "itinerary",
    priority: 70,
    threshold: 4,
    patterns: [
      { re: /\b(itinerary|trip|travel|vacation|tour|things to do|agenda)\b/i, weight: 5 },
      { re: /\bplan\s+(a|my|the)?\s*(trip|day|week|visit)\b/i, weight: 5 },
    ],
  },
  {
    id: "task",
    priority: 60,
    threshold: 4,
    patterns: [
      { re: /\b(task|workflow|automat(?:e|ed|ion)|multi[-\s]?step|step[-\s]?by[-\s]?step|onboard|provision|migrat(?:e|ion))\b/i, weight: 4 },
      { re: /\b(set\s*up|configure|process)\b/i, weight: 3 },
    ],
  },
  {
    id: "status",
    priority: 50,
    threshold: 4,
    patterns: [
      { re: /\b(order|track|status|deliver(?:y|ed)?|refund|confirm|payment|booking)\b/i, weight: 4 },
      { re: /\b(where'?s|where is|eta|arriving)\b/i, weight: 3 },
    ],
  },
  {
    id: "product",
    priority: 40,
    threshold: 4,
    patterns: [
      { re: /\b(hotel|flight|book|shop|product|buy|item|recommend|store|cart)\b/i, weight: 4 },
      { re: /\b(best option|compare|top picks?)\b/i, weight: 3 },
    ],
  },
  {
    id: "handoff",
    priority: 30,
    threshold: 4,
    patterns: [
      { re: /\b(human|agent|escalat(?:e|ion)|support|handoffs?|transfers?)\b/i, weight: 4 },
      { re: /\b(connect|route|specialist|live agent)\b/i, weight: 3 },
    ],
  },
];

function cleanPrompt(prompt: string): string {
  return prompt.replace(/\s+/g, " ").trim();
}

function meaningfulStructuredValue(value: string): string {
  const cleaned = cleanPrompt(value);
  const normalized = cleaned.toLowerCase();
  if (!cleaned || /^\[.*\]$/.test(cleaned)) return "";
  if (normalized === "customer support / voice ai / ecommerce / escalation") return "";
  return cleaned;
}

function chatBriefScoringText(brief: StructuredBrief, fallback: string): string {
  if (!brief.isStructured) return cleanPrompt(fallback);
  return [
    brief.looseText,
    structuredFieldValue(brief, ["scenario"]),
    structuredFieldValue(brief, ["user goal", "customer goal", "goal"]),
    structuredFieldValue(brief, ["agent action"]),
    structuredFieldValue(brief, ["outcome"]),
    structuredFieldValue(brief, ["must show"]),
    structuredFieldValue(brief, ["tone"]),
  ]
    .map(meaningfulStructuredValue)
    .filter(Boolean)
    .join(" ");
}

function chatBriefExcludedText(brief: StructuredBrief): string {
  return structuredTerms(structuredFieldValue(brief, ["do not show", "avoid", "exclude"])).join(" ");
}

function structuredBoosts(brief: StructuredBrief): Partial<Record<Exclude<IntentId, "generic">, number>> {
  if (!brief.isStructured) return {};

  const scenario = meaningfulStructuredValue(structuredFieldValue(brief, ["scenario"]));
  const userGoal = meaningfulStructuredValue(structuredFieldValue(brief, ["user goal", "customer goal", "goal"]));
  const agentAction = meaningfulStructuredValue(structuredFieldValue(brief, ["agent action"]));
  const outcome = meaningfulStructuredValue(structuredFieldValue(brief, ["outcome"]));
  const mustShow = meaningfulStructuredValue(structuredFieldValue(brief, ["must show"]));
  const focusedText = [userGoal, agentAction, outcome, mustShow].filter(Boolean).join(" ");
  const boosts: Partial<Record<Exclude<IntentId, "generic">, number>> = {};

  if (/\b(single[-\s]?interaction|one[-\s]?touch|one\s+conversation|without\s+(?:a\s+)?transfer|no\s+follow|no\s+handoff|repeated calls?|fragmented handoffs?)\b/i.test(focusedText)) {
    boosts["single-interaction"] = 14;
  }
  if (/\b(voice|phone|outbound call|inbound call|spoken|audio)\b/i.test([scenario, agentAction, mustShow].join(" "))) {
    boosts.voice = 10;
  }
  if (/\b(workflow|task|setup|configure|onboard|provision|automation|multi[-\s]?step)\b/i.test([scenario, agentAction, outcome].join(" "))) {
    boosts.task = 7;
  }
  if (/\b(status|track|delivery|refund|confirm|payment|order)\b/i.test([scenario, agentAction, outcome].join(" "))) {
    boosts.status = 7;
  }
  if (/\b(ecommerce|commerce|shop|product|recommend|hotel|flight|booking|reservation)\b/i.test([scenario, userGoal, agentAction].join(" "))) {
    boosts.product = 7;
  }
  if (/\b(handoff|transfer|human|specialist|escalat|live agent)\b/i.test([scenario, userGoal, agentAction, outcome].join(" "))) {
    boosts.handoff = 7;
  }

  return boosts;
}

function intentBlockedByExclusions(intent: IntentId, excludedText: string): boolean {
  if (!excludedText || intent === "generic") return false;
  switch (intent) {
    case "voice":
      return /\b(voice|phone|call|audio|reservation|booking|restaurant)\b/i.test(excludedText);
    case "itinerary":
      return /\b(itinerary|trip|travel|hotel|flight|restaurant|booking|reservation)\b/i.test(excludedText);
    case "product":
      return /\b(product|shop|cart|hotel|flight|restaurant|booking|reservation|recommendation)\b/i.test(excludedText);
    case "status":
      return /\b(status|track|delivery|refund|payment|order|booking|reservation)\b/i.test(excludedText);
    case "handoff":
      return /\b(handoff|transfer|human|agent|escalation|specialist)\b/i.test(excludedText);
    case "task":
      return /\b(task|workflow|automation|setup|checklist)\b/i.test(excludedText);
    case "single-interaction":
      return /\b(single interaction|one touch|resolution|confirmation)\b/i.test(excludedText);
  }
}

function scoreIntent(text: string, patterns: WeightedPattern[]): number {
  return patterns.reduce((score, pattern) => score + (pattern.re.test(text) ? pattern.weight : 0), 0);
}

function selectIntent(prompt: string): IntentId {
  const brief = parseStructuredBrief(prompt);
  const text = chatBriefScoringText(brief, prompt);
  const boosts = structuredBoosts(brief);
  const excludedText = chatBriefExcludedText(brief);
  const [best] = INTENTS
    .map((intent) => ({
      id: intent.id,
      priority: intent.priority,
      score: intentBlockedByExclusions(intent.id, excludedText)
        ? Number.NEGATIVE_INFINITY
        : scoreIntent(text, intent.patterns) + (boosts[intent.id] ?? 0),
      threshold: intent.threshold,
    }))
    .filter((intent) => intent.score >= intent.threshold)
    .sort((a, b) => b.score - a.score || b.priority - a.priority);

  return best?.id ?? "generic";
}

function shortPromptOr(prompt: string, fallback: string): string {
  const cleaned = cleanPrompt(prompt);
  return cleaned.length > 0 && cleaned.length <= 82 ? cleaned : fallback;
}

function singleInteractionMessages(prompt: string): ScenarioMsg[] {
  return [
    {
      type: "text",
      role: "user",
      sender: "Jordan",
      text: shortPromptOr(prompt, "Can you resolve this without another transfer?"),
    },
    {
      type: "text",
      sender: "bot",
      text: "Yes. I can keep the context together, complete the eligible steps here, and send one clear confirmation.",
      verifications: ["Reviewed full conversation context", "Checked policy and account state", "Confirmed no handoff is needed"],
    },
    {
      type: "checklist",
      items: [
        { label: "Understand the full request", status: "done", badge: "Context" },
        { label: "Resolve eligible actions", status: "done", badge: "AI" },
        { label: "Remove duplicate follow-up", status: "done" },
        { label: "Send final confirmation", status: "in-progress" },
      ],
    },
    {
      type: "status",
      label: "Resolved in one interaction",
      variant: "success",
    },
  ];
}

function voiceMessages(): ScenarioMsg[] {
  return [
    {
      type: "voice",
      style: "player",
      eyebrow: "Voice AI",
      transcript: "Your reservation is confirmed for Friday at 7 PM. I've texted you the details.",
      caption: "Spoken in a natural, on-brand voice",
    },
  ];
}

function itineraryMessages(prompt: string): ScenarioMsg[] {
  return [
    { type: "text", role: "user", sender: "Eloy", text: shortPromptOr(prompt, "What is there to do in Bora Bora?") },
    {
      type: "itinerary",
      intro: "I found a simple plan that keeps the trip relaxed and easy to book.",
      cta: "Start booking",
      groups: [
        {
          label: "MON",
          items: [{ icon: "dining", title: "Dinner", sub: "Bora Bora Beach Club Restaurant", badge: "Best match", badgeTone: "accent" }],
        },
        {
          label: "TUE",
          items: [{ icon: "activity", title: "Snorkeling", sub: "Matira Lagoon - 9:00 AM" }],
        },
      ],
    },
  ];
}

function taskMessages(prompt: string): ScenarioMsg[] {
  return [
    { type: "text", role: "user", sender: "Priya", text: shortPromptOr(prompt, "Can you get my new workspace set up?") },
    {
      type: "text",
      sender: "bot",
      text: "On it - I'll handle the whole setup and keep you posted.",
      verifications: ["Verified account permissions", "Checked seat availability"],
    },
    {
      type: "checklist",
      items: [
        { label: "Create workspace", status: "done", badge: "API" },
        { label: "Invite teammates", status: "done", badge: "SMS" },
        { label: "Configure billing", status: "in-progress" },
        { label: "Enable SSO", status: "pending" },
      ],
    },
    { type: "status", label: "Setup nearly complete", variant: "success" },
  ];
}

function statusMessages(prompt: string): ScenarioMsg[] {
  return [
    { type: "text", role: "user", sender: "Alex", text: shortPromptOr(prompt, "Where's my order right now?") },
    { type: "text", sender: "bot", text: "Let me check that for you in real time." },
    { type: "status", label: "Out for delivery - arriving today", variant: "success" },
    { type: "actions", buttons: ["Track live", "Change address"] },
  ];
}

function handoffMessages(prompt: string): ScenarioMsg[] {
  return [
    { type: "text", role: "user", sender: "Morgan", text: shortPromptOr(prompt, "I have an urgent issue with my recent purchase.") },
    {
      type: "text",
      sender: "bot",
      text: "I understand this is urgent. I'll gather the right context before connecting you with a specialist.",
      buttons: ["Connect to agent", "Schedule callback", "Continue with AI"],
    },
    { type: "status", label: "Specialist context prepared", variant: "warning" },
  ];
}

function productMessages(prompt: string): ScenarioMsg[] {
  return [
    { type: "text", role: "user", sender: "Taylor", text: shortPromptOr(prompt, "Can you help me find the best option?") },
    { type: "text", sender: "bot", text: "Absolutely. Here are the top picks based on your request." },
    {
      type: "products",
      items: [
        { name: "Premium Suite", sub: "$129 / night", cta: "Book now", imageQuery: "luxury hotel room" },
        { name: "Budget-friendly", sub: "$79 / night", cta: "Book now", imageQuery: "cozy hotel room" },
      ],
    },
    { type: "actions", buttons: ["See more options", "Compare"] },
  ];
}

function genericMessages(prompt: string): ScenarioMsg[] {
  return [
    { type: "text", role: "user", sender: "Sam", text: shortPromptOr(prompt, "Can you help me with this?") },
    {
      type: "text",
      sender: "bot",
      text: "Of course. I'll keep the answer focused and give you a clear next step.",
      buttons: ["Get started", "Learn more"],
    },
  ];
}

export function generateChatScenarioMessages(prompt: string): ScenarioMsg[] {
  const intent = selectIntent(prompt);

  switch (intent) {
    case "single-interaction":
      return singleInteractionMessages(prompt);
    case "voice":
      return voiceMessages();
    case "itinerary":
      return itineraryMessages(prompt);
    case "task":
      return taskMessages(prompt);
    case "status":
      return statusMessages(prompt);
    case "handoff":
      return handoffMessages(prompt);
    case "product":
      return productMessages(prompt);
    case "generic":
      return genericMessages(prompt);
  }
}

export const chatScenarioGeneratorInternals = {
  selectIntent,
};
