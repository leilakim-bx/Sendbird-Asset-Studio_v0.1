import { ZodError } from "zod";
import { conceptUiSamples } from "./samples";
import { parseSceneSpec, sceneSpecSchema, type ConceptUiArchetype, type SceneSpec } from "./scene-spec";

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

function isRecord(input: unknown): input is Record<string, unknown> {
  return input !== null && typeof input === "object" && !Array.isArray(input);
}

function normalizeArchetypeName(value: unknown): SceneSpec["archetype"] | null {
  if (typeof value !== "string") return null;
  const normalized = value.trim().toLowerCase().replace(/[_\s]+/g, "-");
  if (normalized === "inbox") return "inbox";
  if (normalized === "dashboard") return "dashboard";
  if (normalized === "builder") return "builder";
  if (normalized === "table") return "table";
  if (normalized === "modal") return "modal";

  if (/(conversation|chat|ticket|support|inbox|message|messenger)/.test(normalized)) return "inbox";
  if (/(dashboard|metric|analytics|monitor|quality|scorecard|report|kpi)/.test(normalized)) return "dashboard";
  if (/(builder|workflow|automation|canvas|actionbook|rule|flow)/.test(normalized)) return "builder";
  if (/(table|grid|list|record|queue|log|review|management)/.test(normalized)) return "table";
  if (/(modal|dialog|form|confirm|confirmation|settings|result|reveal)/.test(normalized)) return "modal";
  return null;
}

function inferArchetypeFromMalformedSpec(input: unknown): ConceptUiArchetype | null {
  if (isRecord(input)) {
    const directKeys = [
      "archetype",
      "layout",
      "sceneType",
      "screenType",
      "templateType",
      "type",
      "kind",
      "view",
    ];

    for (const key of directKeys) {
      const archetype = normalizeArchetypeName(input[key]);
      if (archetype) return archetype;
    }

    for (const nestedKey of ["metadata", "meta", "scene", "spec", "data", "content"]) {
      const nested = input[nestedKey];
      if (!isRecord(nested)) continue;
      for (const key of directKeys) {
        const archetype = normalizeArchetypeName(nested[key]);
        if (archetype) return archetype;
      }
    }
  }

  try {
    const corpus = JSON.stringify(input).slice(0, 12000);
    return normalizeArchetypeName(corpus);
  } catch {
    return null;
  }
}

function findStringByKey(input: unknown, keys: string[], depth = 0): string | null {
  if (depth > 4 || !isRecord(input)) return null;

  for (const key of keys) {
    const value = input[key];
    if (typeof value === "string" && value.trim()) return value;
  }

  for (const value of Object.values(input)) {
    if (!isRecord(value) && !Array.isArray(value)) continue;
    const result = findStringByKey(value, keys, depth + 1);
    if (result) return result;
  }

  return null;
}

function fallbackSpecFromMalformedInput(input: unknown): SceneSpec | null {
  const archetype = inferArchetypeFromMalformedSpec(input);
  if (!archetype) return null;

  const sample = conceptUiSamples.find((item) => item.spec.archetype === archetype && item.language === "en")
    ?? conceptUiSamples.find((item) => item.spec.archetype === archetype);
  if (!sample) return null;

  const next = structuredClone(sample.spec);
  const title = findStringByKey(input, ["title", "screenTitle", "headline", "name"]);
  if (title) next.content.title = truncateWithEllipsis(title, 56);

  return parseSceneSpec(next);
}

function normalizeTone(value: unknown, allowed: string[], fallback: string): string {
  return typeof value === "string" && allowed.includes(value) ? value : fallback;
}

function inferTableCellKind(
  cell: unknown,
  column: unknown,
): Record<string, unknown> | unknown {
  if (!isRecord(cell) || typeof cell.kind === "string") return cell;

  const columnHint = isRecord(column)
    ? `${typeof column.key === "string" ? column.key : ""} ${typeof column.label === "string" ? column.label : ""}`.toLowerCase()
    : "";

  if (typeof cell.name === "string" && cell.name.trim()) {
    return {
      kind: "person",
      name: cell.name,
      ...(typeof cell.detail === "string" && cell.detail.trim() ? { detail: cell.detail } : {}),
    };
  }

  const value = typeof cell.value === "string" && cell.value.trim()
    ? cell.value
    : typeof cell.label === "string" && cell.label.trim()
      ? cell.label
      : "Item";

  if (/(status|state|risk|priority|approval|review)/.test(columnHint) || typeof cell.tone === "string") {
    return {
      kind: "badge",
      value,
      tone: normalizeTone(cell.tone, ["neutral", "good", "warn", "ai"], "neutral"),
    };
  }

  if (/(time|date|created|updated|when)/.test(columnHint)) {
    return { kind: "date", value };
  }

  if (/(count|score|rate|amount|volume|metric|value|delta|csat|number)/.test(columnHint)) {
    return {
      kind: "number",
      value,
      ...(typeof cell.delta === "string" && cell.delta.trim() ? { delta: cell.delta } : {}),
      tone: normalizeTone(cell.tone, ["neutral", "good", "warn"], "neutral"),
    };
  }

  return { kind: "text", value };
}

function normalizeTableCells(input: Record<string, unknown>): boolean {
  if (input.archetype !== "table" || !isRecord(input.content)) return false;
  const { content } = input;
  if (!Array.isArray(content.columns) || !Array.isArray(content.rows)) return false;
  const columns = content.columns;

  let changed = false;
  content.rows = content.rows.map((row) => {
    if (!isRecord(row) || !Array.isArray(row.cells)) return row;
    const cells = row.cells.map((cell, index) => {
      const nextCell = inferTableCellKind(cell, columns[index]);
      if (nextCell !== cell) changed = true;
      return nextCell;
    });
    return { ...row, cells };
  });
  return changed;
}

function unwrapPossibleSceneSpec(input: unknown): unknown {
  if (!isRecord(input)) return input;
  for (const key of ["sceneSpec", "scene", "spec", "data", "result", "output"]) {
    const value = input[key];
    if (isRecord(value) && ("content" in value || "archetype" in value || "layout" in value || "type" in value)) {
      return value;
    }
  }
  return input;
}

function normalizeLlmSceneSpec(input: unknown): { value: unknown; changed: boolean } {
  const unwrapped = unwrapPossibleSceneSpec(input);
  if (!isRecord(unwrapped)) return { value: input, changed: unwrapped !== input };

  const next: Record<string, unknown> = { ...unwrapped };
  let changed = unwrapped !== input;

  const archetype = normalizeArchetypeName(next.archetype)
    ?? normalizeArchetypeName(next.layout)
    ?? normalizeArchetypeName(next.sceneType)
    ?? normalizeArchetypeName(next.type)
    ?? normalizeArchetypeName(next.kind);

  if (archetype && next.archetype !== archetype) {
    next.archetype = archetype;
    changed = true;
  }

  for (const extraTopLevelKey of ["layout", "sceneType", "type", "kind"]) {
    if (extraTopLevelKey in next) {
      delete next[extraTopLevelKey];
      changed = true;
    }
  }

  if (!("modifiers" in next)) {
    next.modifiers = {};
    changed = true;
  }

  if (normalizeTableCells(next)) {
    changed = true;
  }

  return { value: next, changed };
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

  const normalized = normalizeLlmSceneSpec(parsed);
  parsed = normalized.value;

  const result = sceneSpecSchema.safeParse(parsed);
  if (result.success) {
    return {
      ok: true,
      spec: result.data,
      shortened: false,
      notice: normalized.changed ? "AI reply adjusted to fit Studio." : undefined,
    };
  }

  const changed = shortenOverlongStrings(parsed, result.error);
  if (changed) {
    try {
      return {
        ok: true,
        spec: parseSceneSpec(parsed),
        shortened: true,
        notice: normalized.changed
          ? "AI reply adjusted to fit Studio. Some text was shortened to fit."
          : "Some text was shortened to fit.",
      };
    } catch (err) {
      if (err instanceof ZodError) {
        const fallbackSpec = fallbackSpecFromMalformedInput(parsed);
        if (fallbackSpec) {
          return {
            ok: true,
            spec: fallbackSpec,
            shortened: true,
            notice: "AI reply was converted to the closest Studio layout. Some text was shortened to fit.",
          };
        }
        return {
          ok: false,
          errorType: "structural",
          message: structuralErrorMessage(err),
          details: err.issues.map((issue) => issue.path.join(".") || issue.code).slice(0, 3).join(", "),
        };
      }
    }
  }

  const fallbackSpec = fallbackSpecFromMalformedInput(parsed);
  if (fallbackSpec) {
    return {
      ok: true,
      spec: fallbackSpec,
      shortened: false,
      notice: "AI reply was converted to the closest Studio layout.",
    };
  }

  return {
    ok: false,
    errorType: "structural",
    message: structuralErrorMessage(result.error),
    details: result.error.issues.map((issue) => issue.path.join(".") || issue.code).slice(0, 3).join(", "),
  };
}
