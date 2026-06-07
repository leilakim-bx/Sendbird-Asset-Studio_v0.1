// ── AI Magic (chat): scenario validation (the safety layer) ────
// Chat "Generate with AI" *invents* a fictional demo conversation, so — unlike
// the infographic Analyze flow, which extracts claims from a real article —
// there is no ground truth to check against. This validator's job is therefore
// PURELY STRUCTURAL: parse each message the model emits against a zod schema
// that mirrors our store Block shapes, enforce the role rule (only text may be
// a `user` message; every other block is the bot), convert the flat AI output
// into proper `ChatMessage[]` with a nested `block`, and drop anything
// malformed before it can reach the canvas.
//
// The model returns a FLAT shape ({ type, role?, text?/buttons?/items?/… }).
// The editor store consumes a NESTED shape ({ id, role, sender, block:{…} }).
// Bridging that gap is the reason the feature was previously disabled.

import { z } from "zod";
import type { ChatMessage, TextBlock } from "@/lib/store";

/** Hard cap so a runaway response can't flood the canvas. */
const MAX_MESSAGES = 6;

// ── Per-type flat schemas ─────────────────────────────────
// Each equals a store Block variant MINUS the `type` discriminant wrapping
// (re-added via z.literal) and MINUS runtime-only fields (ChecklistItem.id is
// generated here). `toMessage` below builds the ChatMessage with NO `as` casts,
// so tsc enforces the schema↔block match — if a schema drifts, the build breaks.

const textMsg = z.object({
  type: z.literal("text"),
  role: z.enum(["user", "bot"]).optional(),
  sender: z.string().optional(),
  text: z.string().min(1),
  verifications: z.array(z.string().min(1)).optional(),
  // Action buttons attached to a bot text bubble (add-on). Dropped for users.
  buttons: z.array(z.string().min(1)).min(1).max(6).optional(),
});

const actionsMsg = z.object({
  type: z.literal("actions"),
  buttons: z.array(z.string().min(1)).min(1).max(6),
});

const productItem = z.object({
  img: z.string().optional(),
  name: z.string().min(1),
  sub: z.string().min(1),
  cta: z.string().min(1),
  imageQuery: z.string().optional(),
});
const productsMsg = z.object({
  type: z.literal("products"),
  items: z.array(productItem).min(1).max(3),
});

const checklistItem = z.object({
  label: z.string().min(1),
  status: z.enum(["done", "in-progress", "pending"]),
  badge: z.string().optional(),
});
const checklistMsg = z.object({
  type: z.literal("checklist"),
  items: z.array(checklistItem).min(1).max(6),
});

const statusMsg = z.object({
  type: z.literal("status"),
  label: z.string().min(1),
  variant: z.enum(["success", "warning"]),
});

const voiceMsg = z.object({
  type: z.literal("voice"),
  style: z.enum(["quote", "player"]),
  transcript: z.string().min(1),
  caption: z.string().optional(),
  eyebrow: z.string().optional(),
});

const itineraryItem = z.object({
  icon: z.enum(["lodging", "dining", "activity", "sightseeing", "flight", "transport", "place", "time"]),
  title: z.string().min(1),
  sub: z.string().optional(),
});
const itineraryGroup = z.object({
  label: z.string().min(1),
  items: z.array(itineraryItem).min(1).max(5),
});
const itineraryMsg = z.object({
  type: z.literal("itinerary"),
  groups: z.array(itineraryGroup).min(1).max(4),
  cta: z.string().optional(),
});

const scenarioMsg = z.discriminatedUnion("type", [
  textMsg,
  actionsMsg,
  productsMsg,
  checklistMsg,
  statusMsg,
  voiceMsg,
  itineraryMsg,
]);

export type ScenarioMsg = z.infer<typeof scenarioMsg>;

// ── Flat → ChatMessage conversion ─────────────────────────
// Role rule (mirrors store.convertMessage): only a `text` block may belong to a
// `user`; every other block is forced to the bot with sender "bot". Returning a
// fully-typed ChatMessage per branch lets tsc narrow each block to the right
// variant without casts.

function toMessage(p: ScenarioMsg, id: string): ChatMessage {
  switch (p.type) {
    case "text": {
      const role = p.role === "user" ? "user" : "bot";
      const sender = p.sender?.trim() || (role === "user" ? "User" : "bot");
      const block: TextBlock = {
        type: "text",
        text: p.text,
        ...(p.verifications?.length ? { verifications: p.verifications } : {}),
        // buttons are bot-only — drop them on a user message
        ...(role === "bot" && p.buttons?.length ? { buttons: p.buttons } : {}),
      };
      return role === "user"
        ? { id, role: "user", sender, block }
        : { id, role: "bot", sender, block };
    }
    case "actions":
      return {
        id,
        role: "bot",
        sender: "bot",
        block: { type: "actions", buttons: p.buttons },
      };
    case "products":
      return {
        id,
        role: "bot",
        sender: "bot",
        block: {
          type: "products",
          items: p.items.map((it) => ({
            img: it.img ?? "",
            name: it.name,
            sub: it.sub,
            cta: it.cta,
            ...(it.imageQuery ? { imageQuery: it.imageQuery } : {}),
          })),
        },
      };
    case "checklist":
      return {
        id,
        role: "bot",
        sender: "bot",
        block: {
          type: "checklist",
          items: p.items.map((it, j) => ({
            id: `${id}-c${j}`,
            label: it.label,
            status: it.status,
            ...(it.badge ? { badge: it.badge } : {}),
          })),
        },
      };
    case "status":
      return { id, role: "bot", sender: "bot", block: { type: "status", label: p.label, variant: p.variant } };
    case "itinerary":
      return {
        id,
        role: "bot",
        sender: "bot",
        block: {
          type: "itinerary",
          groups: p.groups.map((g, gi) => ({
            id: `${id}-g${gi}`,
            label: g.label,
            items: g.items.map((it, j) => ({
              id: `${id}-g${gi}-i${j}`,
              icon: it.icon,
              title: it.title,
              ...(it.sub ? { sub: it.sub } : {}),
            })),
          })),
          ...(p.cta ? { cta: p.cta } : {}),
        },
      };
    case "voice":
      return {
        id,
        role: "bot",
        sender: "bot",
        block: {
          type: "voice",
          style: p.style,
          transcript: p.transcript,
          ...(p.caption ? { caption: p.caption } : {}),
          ...(p.eyebrow ? { eyebrow: p.eyebrow } : {}),
        },
      };
  }
}

/** Accept a bare array or `{ messages: [...] }`. */
function extractList(raw: unknown): unknown[] {
  if (Array.isArray(raw)) return raw;
  if (raw && typeof raw === "object" && Array.isArray((raw as { messages?: unknown[] }).messages)) {
    return (raw as { messages: unknown[] }).messages;
  }
  return [];
}

/**
 * Validate the model's flat scenario output and convert it into editor-ready
 * `ChatMessage[]`. Malformed messages are dropped (warn-only); the result is
 * capped at MAX_MESSAGES. Returns [] if nothing usable came back.
 */
export function validateScenario(raw: unknown): ChatMessage[] {
  const stamp = Date.now();
  const out: ChatMessage[] = [];

  extractList(raw).forEach((item, i) => {
    const parsed = scenarioMsg.safeParse(item);
    if (!parsed.success) {
      console.warn("[validate-scenario] dropped malformed message:", parsed.error.issues);
      return;
    }
    out.push(toMessage(parsed.data, `gen-${stamp}-${i}`));
  });

  // Render coupling: the canvas renders a voice block ONLY as a standalone hero
  // card, and only when it is messages[0] — a voice bubble mixed into a
  // conversation is silently dropped by FeatureMockup. So if the model emits a
  // voice card, collapse the scenario to just that one message (matching the
  // built-in voice-ai preset, which is a single voice message).
  const voice = out.find((m) => m.block.type === "voice");
  if (voice) {
    if (out.length > 1) {
      console.warn("[validate-scenario] voice present — collapsing to a standalone voice card");
    }
    return [voice];
  }

  if (out.length > MAX_MESSAGES) {
    console.warn(`[validate-scenario] capping ${out.length} messages to ${MAX_MESSAGES}`);
    return out.slice(0, MAX_MESSAGES);
  }
  return out;
}
