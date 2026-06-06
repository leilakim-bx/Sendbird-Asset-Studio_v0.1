import type { ChatMessage } from "./store";

/** Wrap an external image URL through our same-origin proxy */
function p(url: string) {
  return `/api/proxy-image?url=${encodeURIComponent(url)}`;
}

export type Scenario = {
  id: string;
  name: string;
  tagline: string;
  /** Default Pexels search term for product card images in this scenario */
  imageCategory?: string;
  messages: ChatMessage[];
};

export const SCENARIOS: Scenario[] = [
  // 1. Memory Recall
  {
    id: "memory-recall",
    name: "Memory Recall",
    tagline: "AI that remembers",
    imageCategory: "running shoes",
    messages: [
      {
        id: "s1-1",
        role: "user",
        sender: "Maya",
        block: { type: "text", text: "I need new running shoes." },
      },
      {
        id: "s1-2",
        role: "bot",
        sender: "bot",
        block: { type: "text", text: "Based on your last purchase — Pegasus 40, size 9.5 — these should fit." },
      },
      {
        id: "s1-3",
        role: "bot",
        sender: "bot",
        block: {
          type: "products",
          items: [
            { img: p("https://images.pexels.com/photos/2529148/pexels-photo-2529148.jpeg?auto=compress&cs=tinysrgb&h=350"), name: "Pegasus 41",  sub: "$130", cta: "Buy now", imageQuery: "running shoes" },
            { img: p("https://images.pexels.com/photos/9777229/pexels-photo-9777229.jpeg?auto=compress&cs=tinysrgb&h=350"), name: "Vomero 17",   sub: "$150", cta: "Buy now", imageQuery: "running shoes" },
          ],
        },
      },
    ],
  },

  // 2. Proactive Outreach
  {
    id: "proactive-outreach",
    name: "Proactive Chat",
    tagline: "AI that anticipates",
    messages: [
      {
        id: "s2-1",
        role: "bot",
        sender: "bot",
        block: { type: "text", text: "Your NYC flight tomorrow may be delayed. Want to rebook?" },
      },
      {
        id: "s2-2",
        role: "user",
        sender: "James",
        block: { type: "text", text: "Yes please." },
      },
      {
        id: "s2-3",
        role: "bot",
        sender: "bot",
        block: { type: "actions", buttons: ["Rebook morning", "Keep current", "Refund"] },
      },
    ],
  },

  // 3. Omnichannel Pickup
  {
    id: "omnichannel-pickup",
    name: "Omnipresence",
    tagline: "Continuous across channels",
    messages: [
      {
        id: "s3-1",
        role: "user",
        sender: "Sarah",
        block: { type: "text", text: "Continuing from my email yesterday..." },
      },
      {
        id: "s3-2",
        role: "bot",
        sender: "bot",
        block: { type: "text", text: "Order #4821 delay — I already escalated it. Refund on the way." },
      },
      {
        id: "s3-3",
        role: "bot",
        sender: "bot",
        block: { type: "status", label: "Refund initiated · ETA 3 days", variant: "success" },
      },
    ],
  },

  // 4. Agent Steward
  {
    id: "agent-steward",
    name: "Agent Steward",
    tagline: "AI that owns the outcome",
    messages: [
      {
        id: "s4-1",
        role: "user",
        sender: "Chris",
        block: { type: "text", text: "Cancel my flight, refund, extend hotel by 1 night." },
      },
      {
        id: "s4-2",
        role: "bot",
        sender: "bot",
        block: { type: "text", text: "I'll handle it all." },
      },
      {
        id: "s4-3",
        role: "bot",
        sender: "bot",
        block: {
          type: "checklist",
          items: [
            { id: "s4-c1", label: "Flight canceled",         status: "done" },
            { id: "s4-c2", label: "Refund $340 processed",   status: "done" },
            { id: "s4-c3", label: "Extending hotel stay",    status: "in-progress" },
          ],
        },
      },
    ],
  },

  // 5. Trust & Governance
  {
    id: "trust-governance",
    name: "Trust & Governance",
    tagline: "Transparent and safe",
    messages: [
      {
        id: "s5-1",
        role: "user",
        sender: "Alex",
        block: { type: "text", text: "What's my account balance?" },
      },
      {
        id: "s5-2",
        role: "bot",
        sender: "bot",
        block: {
          type: "text",
          text: "$2,847.32 as of 2 minutes ago.",
          verifications: [
            "Identity verified",
            "PII redacted from logs",
            "Source: live banking API",
          ],
        },
      },
    ],
  },

  // 6. Personalization
  {
    id: "personalization",
    name: "Personalization",
    tagline: "Knows your taste",
    imageCategory: "fashion clothing",
    messages: [
      {
        id: "s6-1",
        role: "user",
        sender: "Emma",
        block: { type: "text", text: "Anything new in stock?" },
      },
      {
        id: "s6-2",
        role: "bot",
        sender: "bot",
        block: { type: "text", text: "You like minimal beige tones. These just arrived:" },
      },
      {
        id: "s6-3",
        role: "bot",
        sender: "bot",
        block: {
          type: "products",
          items: [
            { img: "", name: "Linen Coat",    sub: "$189", cta: "Buy now", imageQuery: "linen coat" },
            { img: "", name: "Oversized Tee", sub: "$54",  cta: "Buy now", imageQuery: "oversized t-shirt" },
          ],
        },
      },
    ],
  },

  // 7. Voice AI
  {
    id: "voice-ai",
    name: "Voice AI",
    tagline: "AI that speaks",
    messages: [
      {
        id: "v1-1",
        role: "bot",
        sender: "bot",
        block: {
          type: "voice",
          style: "quote",
          transcript: "Your order is ready for pickup. Use code 7291 to skip the line — we're holding it until 8pm.",
          caption: "Order notification",
          eyebrow: "Voice AI agents:",
        },
      },
    ],
  },

  // 8. None — background only (no chat frame)
  {
    id: "none",
    name: "None",
    tagline: "Background only — no chat frame",
    messages: [],
  },
];
