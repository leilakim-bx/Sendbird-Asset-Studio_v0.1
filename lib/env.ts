import { z } from "zod";

// ── Schemas ───────────────────────────────────────────────

const baseSchema = z.object({
  NODE_ENV:       z.enum(["development", "test", "production"]).default("development"),
  PEXELS_API_KEY: z.string().optional(),
});

// ── Parse ─────────────────────────────────────────────────

const _base  = baseSchema.parse(process.env);
const isProd = _base.NODE_ENV === "production";

// ── Export ────────────────────────────────────────────────

export const env = {
  isProd,
  pexelsApiKey: _base.PEXELS_API_KEY,
} as const;
