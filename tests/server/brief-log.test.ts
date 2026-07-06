import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  hasBriefLogBlobCredentials,
  listBriefLogEvents,
  saveBriefLogEvent,
  validateBriefLogEvent,
} from "@/lib/server/brief-log-storage";
import type { BriefLogEvent } from "@/lib/brief-log";

vi.mock("@vercel/blob", () => ({
  put: vi.fn(async () => ({ url: "https://blob.example/x" })),
  list: vi.fn(async () => ({ blobs: [] })),
  get: vi.fn(),
}));

const { put, list } = await import("@vercel/blob");

const BLOB_ENV_KEYS = ["BLOB_READ_WRITE_TOKEN", "VERCEL_OIDC_TOKEN", "BLOB_STORE_ID"] as const;
const savedEnv: Partial<Record<(typeof BLOB_ENV_KEYS)[number], string | undefined>> = {};

function makeEvent(overrides: Partial<BriefLogEvent> = {}): BriefLogEvent {
  return {
    v: 1,
    ts: 1_720_000_000_000,
    clientId: "client-12345678",
    template: "product-visual",
    event: "brief_submitted",
    text: "AI suggests the next best reply",
    ...overrides,
  };
}

beforeEach(() => {
  for (const key of BLOB_ENV_KEYS) {
    savedEnv[key] = process.env[key];
    delete process.env[key];
  }
});

afterEach(() => {
  for (const key of BLOB_ENV_KEYS) {
    if (savedEnv[key] === undefined) delete process.env[key];
    else process.env[key] = savedEnv[key];
  }
  vi.clearAllMocks();
});

describe("validateBriefLogEvent", () => {
  it("accepts a well-formed event", () => {
    const event = makeEvent({ meta: { recipeId: "response-card" } });
    expect(validateBriefLogEvent(event)).toMatchObject({
      template: "product-visual",
      event: "brief_submitted",
      meta: { recipeId: "response-card" },
    });
  });

  it("rejects unknown templates and events", () => {
    expect(validateBriefLogEvent(makeEvent({ template: "banner" as BriefLogEvent["template"] }))).toBeNull();
    expect(validateBriefLogEvent(makeEvent({ event: "clicked" as BriefLogEvent["event"] }))).toBeNull();
    expect(validateBriefLogEvent(null)).toBeNull();
    expect(validateBriefLogEvent("nope")).toBeNull();
  });

  it("rejects meta with non-primitive values and caps text length", () => {
    expect(
      validateBriefLogEvent(makeEvent({ meta: { nested: { a: 1 } } as unknown as BriefLogEvent["meta"] })),
    ).toBeNull();

    const long = validateBriefLogEvent(makeEvent({ text: "x".repeat(2_000) }));
    expect(long?.text?.length).toBeLessThanOrEqual(700);
  });
});

describe("saveBriefLogEvent", () => {
  it("skips silently without Blob credentials", async () => {
    expect(hasBriefLogBlobCredentials()).toBe(false);

    const result = await saveBriefLogEvent(makeEvent());

    expect(result).toEqual({ enabled: false, saved: false });
    expect(put).not.toHaveBeenCalled();
  });

  it("stores the event as a private Blob object when credentials exist", async () => {
    process.env.BLOB_READ_WRITE_TOKEN = "token";

    const result = await saveBriefLogEvent(makeEvent());

    expect(result).toEqual({ enabled: true, saved: true });
    expect(put).toHaveBeenCalledOnce();
    const call = vi.mocked(put).mock.calls[0];
    expect(String(call?.[0])).toMatch(/^telemetry\/brief-log\/\d{4}-\d{2}-\d{2}\//);
    expect(call?.[2]).toMatchObject({ access: "private", contentType: "application/json" });
  });
});

describe("listBriefLogEvents", () => {
  it("reports disabled without Blob credentials", async () => {
    const result = await listBriefLogEvents();

    expect(result).toEqual({ enabled: false, events: [] });
    expect(list).not.toHaveBeenCalled();
  });

  it("lists from the telemetry prefix when credentials exist", async () => {
    process.env.BLOB_READ_WRITE_TOKEN = "token";

    const result = await listBriefLogEvents(50);

    expect(result).toEqual({ enabled: true, events: [] });
    expect(list).toHaveBeenCalledWith({ prefix: "telemetry/brief-log/", limit: 100 });
  });
});
