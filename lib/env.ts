import { z } from "zod";

// ── Schemas ───────────────────────────────────────────────

const baseSchema = z.object({
  NODE_ENV:          z.enum(["development", "test", "production"]).default("development"),
  ANTHROPIC_API_KEY: z.string().default("mock"),
  PEXELS_API_KEY:    z.string().optional(),
});

const r2Schema = z.object({
  R2_ACCOUNT_ID:        z.string().min(1),
  R2_ACCESS_KEY_ID:     z.string().min(1),
  R2_SECRET_ACCESS_KEY: z.string().min(1),
  R2_BUCKET_NAME:       z.string().min(1),
  R2_PUBLIC_URL:        z.string().url(),
});

// ── Parse ─────────────────────────────────────────────────

const _base  = baseSchema.parse(process.env);
const isProd = _base.NODE_ENV === "production";
const hasR2  = Boolean(process.env.R2_ACCOUNT_ID);

// 프로덕션에서 R2 없으면 서버 시작 즉시 중단
if (isProd && !hasR2) {
  throw new Error(
    "[env] R2 환경변수가 production에 필요합니다.\n" +
    "누락: R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, " +
    "R2_BUCKET_NAME, R2_PUBLIC_URL",
  );
}

// 개발 환경: R2 없으면 null → filesystem fallback
// R2 변수가 있는데 형식이 틀렸으면 여기서 throw
const _r2 = hasR2 ? r2Schema.parse(process.env) : null;

// ── Export ────────────────────────────────────────────────

export const env = {
  isProd,
  anthropicApiKey: _base.ANTHROPIC_API_KEY,
  pexelsApiKey:    _base.PEXELS_API_KEY,
  r2: _r2
    ? {
        accountId:       _r2.R2_ACCOUNT_ID,
        accessKeyId:     _r2.R2_ACCESS_KEY_ID,
        secretAccessKey: _r2.R2_SECRET_ACCESS_KEY,
        bucketName:      _r2.R2_BUCKET_NAME,
        publicUrl:       _r2.R2_PUBLIC_URL.replace(/\/$/, ""), // trailing slash 제거
      }
    : null,
} as const;

export type R2Config = NonNullable<typeof env.r2>;
