import { ZodError } from "zod";
import { parseSceneSpec, sceneSpecSchema, type SceneSpec } from "./scene-spec";

type JsonPath = Array<string | number>;

export type LlmSceneSpecParseResult =
  | {
      ok: true;
      spec: SceneSpec;
      notice?: string;
      shortened: boolean;
    }
  | {
      ok: false;
      errorType: "not-found" | "invalid-json" | "structural";
      message: string;
      details?: string;
    };

function extractFirstBalancedObject(raw: string): string | null {
  const text = raw.trim();
  let start = -1;
  let depth = 0;
  let inString = false;
  let escaped = false;

  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];

    if (inString) {
      if (escaped) {
        escaped = false;
      } else if (char === "\\") {
        escaped = true;
      } else if (char === '"') {
        inString = false;
      }
      continue;
    }

    if (char === '"') {
      inString = true;
      continue;
    }

    if (char === "{") {
      if (depth === 0) start = i;
      depth += 1;
      continue;
    }

    if (char === "}") {
      if (depth === 0) continue;
      depth -= 1;
      if (depth === 0 && start >= 0) return text.slice(start, i + 1);
    }
  }

  return null;
}

function getAtPath(input: unknown, path: JsonPath): unknown {
  let current = input;
  for (const segment of path) {
    if (current === null || typeof current !== "object") return undefined;
    current = (current as Record<string | number, unknown>)[segment];
  }
  return current;
}

function setAtPath(input: unknown, path: JsonPath, value: unknown): void {
  let current = input;
  for (let i = 0; i < path.length - 1; i += 1) {
    const segment = path[i];
    if (current === null || typeof current !== "object") return;
    current = (current as Record<string | number, unknown>)[segment];
  }

  const last = path[path.length - 1];
  if (current === null || typeof current !== "object" || last === undefined) return;
  (current as Record<string | number, unknown>)[last] = value;
}

function truncateWithEllipsis(value: string, max: number): string {
  const trimmed = value.trim();
  if (trimmed.length <= max) return trimmed;
  if (max <= 3) return trimmed.slice(0, max);
  return `${trimmed.slice(0, max - 3).trimEnd()}...`;
}

function maxLengthIssue(issue: ZodError["issues"][number]): { path: JsonPath; max: number } | null {
  if (issue.code !== "too_big") return null;
  if (typeof issue.maximum !== "number") return null;
  if (issue.path.length === 0) return null;
  const actual = issue.path.filter((segment): segment is string | number =>
    typeof segment === "string" || typeof segment === "number",
  );
  if (actual.length !== issue.path.length) return null;
  return { path: actual, max: issue.maximum };
}

function shortenOverlongStrings(input: unknown, error: ZodError): boolean {
  let changed = false;
  for (const issue of error.issues) {
    const maxLength = maxLengthIssue(issue);
    if (!maxLength) continue;
    const value = getAtPath(input, maxLength.path);
    if (typeof value !== "string") continue;
    setAtPath(input, maxLength.path, truncateWithEllipsis(value, maxLength.max));
    changed = true;
  }
  return changed;
}

function structuralErrorMessage(error: ZodError): string {
  const first = error.issues[0];
  if (!first) {
    return "The AI reply is not a valid scene. Copy the prompt again and paste the full AI response.";
  }

  const path = first.path.join(".");
  if (path === "archetype" || first.code === "invalid_union" || first.code === "invalid_value") {
    return "The AI reply used an unsupported layout. Copy the prompt again and paste the full AI response.";
  }
  if (first.code === "invalid_type") {
    return "The AI reply is missing required scene data. Copy the prompt again and paste the full AI response.";
  }
  if (first.code === "unrecognized_keys") {
    return "The AI reply added fields Studio cannot read. Copy the prompt again and paste the full AI response.";
  }
  return "The AI reply is not structured correctly. Copy the prompt again and paste the full AI response.";
}

export function extractSceneSpecJson(raw: string): string | null {
  return extractFirstBalancedObject(raw);
}

export function parseLlmSceneSpecResponse(raw: string): LlmSceneSpecParseResult {
  const json = extractFirstBalancedObject(raw);
  if (!json) {
    return {
      ok: false,
      errorType: "not-found",
      message: "Couldn't find valid data in the reply. Make sure you copied the AI's entire response.",
    };
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(json);
  } catch {
    return {
      ok: false,
      errorType: "invalid-json",
      message: "Couldn't read the AI reply. Make sure you copied the full response, not a partial selection.",
    };
  }

  const result = sceneSpecSchema.safeParse(parsed);
  if (result.success) {
    return { ok: true, spec: result.data, shortened: false };
  }

  const changed = shortenOverlongStrings(parsed, result.error);
  if (changed) {
    try {
      return {
        ok: true,
        spec: parseSceneSpec(parsed),
        shortened: true,
        notice: "Some text was shortened to fit.",
      };
    } catch (err) {
      if (err instanceof ZodError) {
        return {
          ok: false,
          errorType: "structural",
          message: structuralErrorMessage(err),
          details: err.issues.map((issue) => issue.path.join(".") || issue.code).slice(0, 3).join(", "),
        };
      }
    }
  }

  return {
    ok: false,
    errorType: "structural",
    message: structuralErrorMessage(result.error),
    details: result.error.issues.map((issue) => issue.path.join(".") || issue.code).slice(0, 3).join(", "),
  };
}
