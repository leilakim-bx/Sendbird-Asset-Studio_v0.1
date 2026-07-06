// ── AI Magic: suggestion validation (the safety layer) ────
// The principle "검증 실패한 추천은 절대 모달에 노출 금지" lives here. Every
// suggestion from the model is parsed against a zod schema that mirrors our
// InfographicBlock shapes (minus `id`); anything that fails — wrong blockType,
// malformed content, confidence below the floor — is dropped before it can
// reach the UI. A lenient, warn-only sourceQuote check adds anti-hallucination
// signal without over-rejecting paraphrase/whitespace differences.

import { z } from "zod";
import type { InfographicBlock } from "@/lib/types/infographic";
import { newBlockId } from "@/lib/infographic-presets";

/** Suggestions below this confidence are discarded. */
export const CONFIDENCE_MIN = 0.7;

/** Hard cap on suggestions surfaced, so a runaway response can't flood the modal. */
const MAX_SUGGESTIONS = 8;

// ── Per-type content schemas ──────────────────────────────
// These equal each InfographicBlock variant MINUS `id`. `suggestionToBlock`
// (below) returns InfographicBlock without casts, so tsc enforces the match —
// if a schema drifts from the block shape, the build breaks.
// Numeric fields use z.coerce.number() so a model returning "49" isn't dropped.

const statContent = z.object({
  type: z.literal("stat"),
  eyebrow: z.string().optional(),
  number: z.string().min(1),
  highlightNumber: z.boolean().optional(),
  label: z.string().optional(),
});

const kpiGroupContent = z.object({
  type: z.literal("kpi-group"),
  items: z
    .array(z.object({ number: z.string().min(1), label: z.string().min(1) }))
    .min(1),
});

const barGroupContent = z.object({
  type: z.literal("bar-group"),
  labelA: z.string().optional(),
  labelB: z.string().optional(),
  unit: z.string().optional(),
  items: z
    .array(
      z.object({
        label: z.string().min(1),
        valueA: z.coerce.number(),
        valueB: z.coerce.number().optional(),
        highlight: z.boolean().optional(),
      }),
    )
    .min(1),
});

const stepContent = z.object({
  type: z.literal("step"),
  items: z
    .array(
      z.object({
        title: z.string().min(1),
        desc: z.string().optional(),
        badge: z.string().optional(),
      }),
    )
    .min(1),
});

const nodeListContent = z.object({
  type: z.literal("node-list"),
  hubTitle: z.string().min(1),
  hubSub: z.string().optional(),
  items: z
    .array(
      z.object({
        label: z.string().min(1),
        tag: z.string().optional(),
        desc: z.string().optional(),
      }),
    )
    .min(1),
});

const suggestedContent = z.discriminatedUnion("type", [
  statContent,
  kpiGroupContent,
  barGroupContent,
  stepContent,
  nodeListContent,
]);

export const BLOCK_TYPES = [
  "stat",
  "kpi-group",
  "bar-group",
  "step",
  "node-list",
] as const;

// ── Suggestion schema ─────────────────────────────────────

const suggestionSchema = z
  .object({
    blockType: z.enum(BLOCK_TYPES),
    confidence: z.coerce.number().min(0).max(1),
    sourceQuote: z.string().min(1),
    suggestedTitle: z.string().optional(),
    suggestedContent,
  })
  // blockType must agree with the content's discriminator — a mismatch means
  // the model contradicted itself; drop it.
  .refine((s) => s.blockType === s.suggestedContent.type, {
    message: "blockType does not match suggestedContent.type",
  });

export type Suggestion = z.infer<typeof suggestionSchema>;
export type SuggestionContent = z.infer<typeof suggestedContent>;

// ── Convert a validated suggestion into a real block ──────
// No `as` casts: each case spreads the narrowed content + a fresh id and must
// structurally equal the matching InfographicBlock variant, so tsc guarantees
// the zod schemas stay in lockstep with the block model.
export function suggestionToBlock(s: Suggestion): InfographicBlock {
  const id = newBlockId();
  const c = s.suggestedContent;
  switch (c.type) {
    case "stat":
      return { id, ...c };
    case "kpi-group":
      return { id, ...c };
    case "bar-group":
      return { id, ...c };
    case "step":
      return { id, ...c };
    case "node-list":
      return { id, ...c };
  }
}

// ── Validation entry point ────────────────────────────────

/** Normalize for the lenient substring check: lowercase, collapse whitespace. */
function normalize(s: string): string {
  return s.toLowerCase().replace(/\s+/g, " ").trim();
}

/**
 * Validate a raw model response into a clean Suggestion[]. Accepts either
 * `{ suggestions: [...] }` or a bare array. Drops anything that fails the
 * schema, the confidence floor, or the blockType/content agreement. An empty
 * result is valid (means "nothing worth suggesting"). `article`, when given,
 * powers a warn-only hallucination check — it never rejects.
 */
export function validateSuggestions(raw: unknown, article?: string): Suggestion[] {
  const list = extractList(raw);
  const out: Suggestion[] = [];

  for (const item of list) {
    const parsed = suggestionSchema.safeParse(item);
    if (!parsed.success) {
      console.warn("[analyze] dropped invalid suggestion:", parsed.error.issues.map((i) => i.message).join("; "));
      continue;
    }
    const s = parsed.data;

    if (s.confidence < CONFIDENCE_MIN) {
      console.warn(`[analyze] dropped low-confidence suggestion (${s.confidence} < ${CONFIDENCE_MIN}):`, s.blockType);
      continue;
    }

    // Warn-only anti-hallucination checks (never reject — paraphrase/whitespace
    // would cause false negatives).
    if (article) {
      const hay = normalize(article);
      if (!hay.includes(normalize(s.sourceQuote))) {
        console.warn("[analyze] sourceQuote not found verbatim in article (kept, flagged):", s.sourceQuote.slice(0, 60));
      }
      if (s.suggestedContent.type === "stat") {
        const num = normalize(s.suggestedContent.number);
        if (num && !normalize(s.sourceQuote).includes(num)) {
          console.warn("[analyze] stat number not present in its sourceQuote (kept, flagged):", s.suggestedContent.number);
        }
      }
    }

    out.push(s);
    if (out.length >= MAX_SUGGESTIONS) break;
  }

  return out;
}

function extractList(raw: unknown): unknown[] {
  if (Array.isArray(raw)) return raw;
  if (raw && typeof raw === "object" && Array.isArray((raw as { suggestions?: unknown }).suggestions)) {
    return (raw as { suggestions: unknown[] }).suggestions;
  }
  return [];
}
