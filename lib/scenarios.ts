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

  // 2. Voice AI
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

  // 3. Proactive Outreach
  {
    id: "proactive-outreach",
    name: "Proactive Chat",
    tagline: "AI that anticipates",
    messages: [
      {
        id: "s2-1",
        role: "bot",
        sender: "bot",
        block: {
          type: "text",
          text: "Your NYC flight tomorrow may be delayed. Want to rebook?",
          buttons: ["Rebook morning", "Keep current", "Refund"],
        },
      },
    ],
  },

  // 4. Omnichannel Pickup
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

  // 5. Agent Steward
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

  // 6. Trust & Governance
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

  // 7. Travel Itinerary
  {
    id: "travel-itinerary",
    name: "Travel Planner",
    tagline: "AI that plans your trip",
    messages: [
      {
        id: "s6-1",
        role: "user",
        sender: "Eloy",
        block: { type: "text", text: "What is there to do in Bora Bora?" },
      },
      {
        id: "s6-3",
        role: "bot",
        sender: "bot",
        block: {
          type: "itinerary",
          cta: "Start booking",
          groups: [
            {
              id: "s6-g1",
              label: "MON",
              items: [
                { id: "s6-g1-i1", icon: "lodging", title: "Check in at 4pm", sub: "InterContinental Thalasso" },
                { id: "s6-g1-i2", icon: "dining",  title: "Dinner",          sub: "Bora Bora Beach Club Restaurant" },
              ],
            },
            {
              id: "s6-g2",
              label: "TUE",
              items: [
                { id: "s6-g2-i1", icon: "activity", title: "Snorkeling", sub: "Matira Lagoon · 9:00 AM" },
              ],
            },
          ],
        },
      },
    ],
  },

];

/** Scenario shown by default when first entering the chat editor. */
export const DEFAULT_SCENARIO_ID = "omnichannel-pickup";
export const DEFAULT_SCENARIO =
  SCENARIOS.find((s) => s.id === DEFAULT_SCENARIO_ID) ?? SCENARIOS[0];
