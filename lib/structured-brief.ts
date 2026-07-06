export type StructuredBrief = {
  isStructured: boolean;
  fields: Record<string, string>;
  looseText: string;
};

function normalizeFieldName(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function cleanBriefLine(value: string): string {
  return value
    .replace(/^\s*[-*•]\s+/, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function parseStructuredBrief(input: string): StructuredBrief {
  const fields: Record<string, string[]> = {};
  const loose: string[] = [];
  let currentField: string | null = null;

  for (const rawLine of input.replace(/\r/g, "").split("\n")) {
    const line = rawLine.trim();
    if (!line) continue;

    const fieldMatch = line.match(/^([A-Za-z][A-Za-z0-9 /-]{1,42}):\s*(.*)$/);
    if (fieldMatch) {
      const fieldName = normalizeFieldName(fieldMatch[1]);
      currentField = fieldName === "structured brief" ? null : fieldName;
      if (currentField) {
        fields[currentField] ??= [];
        const value = cleanBriefLine(fieldMatch[2]);
        if (value) fields[currentField].push(value);
      }
      continue;
    }

    const cleaned = cleanBriefLine(line);
    if (!cleaned) continue;
    if (currentField) fields[currentField].push(cleaned);
    else loose.push(cleaned);
  }

  const flatFields = Object.fromEntries(
    Object.entries(fields).map(([key, values]) => [key, values.join("\n").trim()]),
  );

  return {
    isStructured: /^structured brief:/im.test(input) || Object.keys(flatFields).length >= 2,
    fields: flatFields,
    looseText: loose.join("\n"),
  };
}

export function structuredFieldValue(brief: StructuredBrief, names: string[]): string {
  return names
    .map((name) => brief.fields[normalizeFieldName(name)] ?? "")
    .filter(Boolean)
    .join("\n")
    .trim();
}

export function structuredFieldLines(brief: StructuredBrief, names: string[]): string[] {
  return structuredFieldValue(brief, names)
    .split(/\n+/)
    .map(cleanBriefLine)
    .filter(Boolean);
}

export function structuredTerms(value: string): string[] {
  return value
    .split(/[,\n;]+/)
    .map(cleanBriefLine)
    .map((item) => item.replace(/\bexamples?\b/gi, "").trim())
    .filter((item) => item.length >= 3);
}
