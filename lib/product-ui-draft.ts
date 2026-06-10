import {
  type ProductUiComposition,
  type ProductUiContent,
  type ProductUiItem,
  type ProductUiNode,
  type ProductUiScene,
  type ProductUiStatus,
} from "@/lib/types/product-ui";
import { cloneProductUiContent, getProductUiPreset } from "@/lib/product-ui-presets";

const SCENES: ProductUiScene[] = [
  "ai-response",
  "review-queue",
  "test-results",
  "traffic-allocation",
  "workflow",
  "version-history",
  "steward-detail",
  "ab-test",
];

const COMPOSITIONS: ProductUiComposition[] = ["photo-card", "plain-stage", "wide-system"];
const STATUSES: ProductUiStatus[] = ["success", "warning", "danger", "neutral", "accent", "live"];

type DraftJson = Partial<Omit<ProductUiContent, "format" | "releasePurpose">>;

function compactWhitespace(value: string) {
  return value.trim().replace(/\s+/g, " ");
}

function clamp(value: string, max: number) {
  const clean = compactWhitespace(value);
  return clean.length > max ? `${clean.slice(0, max - 1).trim()}…` : clean;
}

function stripListPrefix(value: string) {
  return value.replace(/^[-*•\d.)\s]+/, "").trim();
}

function extractTitle(input: string) {
  const firstUsefulLine = input
    .split(/\r?\n/)
    .map((line) => stripListPrefix(line))
    .find((line) => line.length > 8 && !line.includes("http"));

  if (!firstUsefulLine) return "";
  return clamp(firstUsefulLine.replace(/[:.]\s*$/, ""), 58);
}

function extractNumbers(input: string) {
  const matches = input.match(/\b\d+(?:\.\d+)?\s?%|\b\d{1,3}(?:,\d{3})+\b|\b\d+(?:\.\d+)?x\b/gi) ?? [];
  return Array.from(new Set(matches.map((match) => match.replace(/\s+/g, "")))).slice(0, 4);
}

function extractVersionLabels(input: string) {
  const matches = input.match(/\bversion\s+[a-z0-9._-]+\b/gi) ?? [];
  return Array.from(new Set(matches.map((match) => clamp(match, 24)))).slice(0, 3);
}

function extractCandidateLines(input: string) {
  const explicitLines = input
    .split(/\r?\n/)
    .map((line) => stripListPrefix(line))
    .filter((line) => line.length >= 8 && !line.includes("http"));

  if (explicitLines.length >= 2) return explicitLines.slice(0, 6).map((line) => clamp(line, 72));

  return input
    .split(/[.!?]\s+/)
    .map((line) => stripListPrefix(line))
    .filter((line) => line.length >= 12 && !line.includes("http"))
    .slice(0, 6)
    .map((line) => clamp(line, 72));
}

function sceneFromText(input: string, current: ProductUiContent): ProductUiScene {
  const lower = input.toLowerCase();

  if (/(traffic|rollout|allocation|candidate|pause rollout|version\s+\w+)/.test(lower)) return "traffic-allocation";
  if (/(environment|deployment|staging|production|development|a\/b|ab test|experiment)/.test(lower)) return "ab-test";
  if (/(test|evaluate|evaluation|validation|passed|failed|csat|quality|outcome|hallucination)/.test(lower)) {
    return current.releasePurpose === "insert" ? "test-results" : "review-queue";
  }
  if (/(workflow|trigger|action|proactive|email|sequence|channel|automation)/.test(lower)) return "workflow";
  if (/(compare|before|after|version history|prompt|translation|language|locale|glossary)/.test(lower)) {
    return "version-history";
  }
  if (/(urgent|notice|approval|refund|safeguard|actionbook|form|request)/.test(lower)) return "steward-detail";
  if (/(citation|source|knowledge|memory|context|generated|response|reply|answer)/.test(lower)) return "ai-response";
  if (/(flagged|message|conversation|dashboard|monitor|analytics|analysis)/.test(lower)) return "review-queue";

  return current.scene;
}

function compositionFor(scene: ProductUiScene, current: ProductUiContent): ProductUiComposition {
  if (current.format === "release" && current.releasePurpose === "insert") return "plain-stage";
  if (scene === "ab-test") return "wide-system";
  if (scene === "traffic-allocation" || scene === "workflow" || scene === "review-queue") return "plain-stage";
  return "photo-card";
}

function backgroundFor(scene: ProductUiScene, current: ProductUiContent) {
  if (current.format === "release" && current.releasePurpose === "insert") return "bg-300";
  if (scene === "ab-test") return "bg-504";
  if (scene === "workflow") return "bg-500";
  if (scene === "review-queue") return "bg-302";
  if (scene === "test-results") return "bg-201";
  return current.backgroundId || "bg-101";
}

function statusForLine(line: string): ProductUiStatus {
  const lower = line.toLowerCase();
  if (/(fail|flag|drop|risk|urgent|error|hallucination)/.test(lower)) return "danger";
  if (/(review|candidate|pending|pause|warning)/.test(lower)) return "warning";
  if (/(approve|active|live|deploy|success|pass|resolved)/.test(lower)) return "success";
  if (/(new|ai|auto|generated|memory|source)/.test(lower)) return "accent";
  return "neutral";
}

function buildItems(lines: string[], numbers: string[], scene: ProductUiScene, preset: ProductUiContent): ProductUiItem[] {
  if (scene === "traffic-allocation") return preset.items;

  const source = lines.length ? lines : [preset.title, preset.primaryText, preset.secondaryText].filter(Boolean) as string[];
  return source.slice(0, scene === "test-results" ? 5 : 4).map((line, index) => ({
    id: `i${index + 1}`,
    label: clamp(line, 46),
    detail: index === 0 ? "From release note" : undefined,
    status: statusForLine(line),
    value: numbers[index] ?? undefined,
  }));
}

function buildNodes(lines: string[], scene: ProductUiScene, preset: ProductUiContent): ProductUiNode[] {
  if (!["test-results", "version-history", "steward-detail", "ab-test"].includes(scene)) {
    return preset.nodes;
  }

  const source = lines.slice(0, 3);
  if (!source.length) return preset.nodes;

  return source.slice(0, scene === "ab-test" ? 2 : 3).map((line, index) => ({
    id: `n${index + 1}`,
    title: clamp(line, 86),
    detail: index === 0 ? "Primary release detail" : "Supporting detail",
    status: statusForLine(line),
    value: scene === "ab-test" ? (index === 0 ? "68%" : "84%") : undefined,
  }));
}

function trafficDraft(input: string, current: ProductUiContent, preset: ProductUiContent): ProductUiContent {
  const versions = extractVersionLabels(input);
  const numbers = extractNumbers(input).filter((value) => value.includes("%"));
  const title = extractTitle(input) || "Traffic allocation";

  return {
    ...preset,
    format: current.format,
    releasePurpose: current.releasePurpose,
    composition: current.format === "release" && current.releasePurpose === "insert" ? "plain-stage" : preset.composition,
    backgroundId: backgroundFor("traffic-allocation", current),
    title,
    primaryText: versions[0] ?? "Version A",
    secondaryText: versions[1] ? `${versions[1]} (Candidate)` : "Version B (Candidate)",
    metricA: numbers[0] ?? "70%",
    metricB: numbers[1] ?? "30%",
  };
}

export function draftProductUiFromText(input: string, current: ProductUiContent): ProductUiContent {
  const clean = compactWhitespace(input);
  const scene = sceneFromText(clean, current);
  const preset = cloneProductUiContent(getProductUiPreset(scene).content);

  if (scene === "traffic-allocation") {
    return trafficDraft(clean, current, preset);
  }

  const lines = extractCandidateLines(input);
  const numbers = extractNumbers(input);
  const title = extractTitle(input) || preset.title;
  const items = buildItems(lines, numbers, scene, preset);
  const nodes = buildNodes(lines, scene, preset);

  return {
    ...preset,
    format: current.format,
    releasePurpose: current.releasePurpose,
    composition: compositionFor(scene, current),
    backgroundId: backgroundFor(scene, current),
    title,
    eyebrow: preset.eyebrow,
    primaryText: lines[0] ? clamp(lines[0], 150) : preset.primaryText,
    secondaryText: lines[1] ? clamp(lines[1], 70) : "Generated from release note",
    metricA: numbers[0] ?? preset.metricA,
    metricB: numbers[1] ?? preset.metricB,
    items,
    nodes,
  };
}

export function buildProductUiExternalPrompt(input: string, current: ProductUiContent) {
  const usage = current.format === "feature"
    ? "Product feature, exported as desktop and mobile"
    : `Product release ${current.releasePurpose === "insert" ? "insert image" : "thumbnail"}`;

  return [
    "Turn the release text below into a concise marketing product UI mockup draft.",
    "Return JSON only. Do not include markdown fences or explanation.",
    "",
    `Usage selected by marketer: ${usage}`,
    `Current scene: ${current.scene}`,
    "",
    "Allowed scene values:",
    SCENES.join(", "),
    "",
    "JSON schema:",
    JSON.stringify({
      scene: "workflow",
      composition: "plain-stage",
      title: "Short product UI title",
      eyebrow: "Short context label",
      primaryText: "Main sentence shown in the UI",
      secondaryText: "Supporting sentence or label",
      metricA: "Optional metric",
      metricB: "Optional metric",
      items: [
        { label: "Row label", detail: "Optional detail", status: "success", value: "Optional value" },
      ],
      nodes: [
        { title: "Card or node title", detail: "Optional detail", status: "neutral", value: "Optional value" },
      ],
    }, null, 2),
    "",
    "Rules:",
    "- Keep labels short enough for a compact product UI image.",
    "- Use 2-5 items and 0-3 nodes.",
    "- Allowed composition values: photo-card, plain-stage, wide-system.",
    "- Allowed status values: success, warning, danger, neutral, accent, live.",
    "- Do not decide the usage or export format. The marketer already selected it.",
    "",
    "Release text:",
    input.trim(),
  ].join("\n");
}

function parseJsonObject(input: string) {
  const trimmed = input.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "");
  return JSON.parse(trimmed) as unknown;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function stringValue(value: unknown) {
  return typeof value === "string" ? value : undefined;
}

function statusValue(value: unknown): ProductUiStatus | undefined {
  return typeof value === "string" && STATUSES.includes(value as ProductUiStatus)
    ? value as ProductUiStatus
    : undefined;
}

function itemFromJson(value: unknown, index: number): ProductUiItem | null {
  if (!isRecord(value)) return null;
  const label = stringValue(value.label);
  if (!label) return null;
  return {
    id: `i${index + 1}`,
    label: clamp(label, 52),
    detail: stringValue(value.detail),
    status: statusValue(value.status),
    value: stringValue(value.value),
  };
}

function nodeFromJson(value: unknown, index: number): ProductUiNode | null {
  if (!isRecord(value)) return null;
  const title = stringValue(value.title);
  if (!title) return null;
  return {
    id: `n${index + 1}`,
    title: clamp(title, 92),
    detail: stringValue(value.detail),
    status: statusValue(value.status),
    value: stringValue(value.value),
  };
}

export function productUiContentFromDraftJson(input: string, current: ProductUiContent) {
  try {
    const parsed = parseJsonObject(input);
    if (!isRecord(parsed)) return { error: "JSON must be an object." };

    const draft = parsed as DraftJson;
    const scene = typeof draft.scene === "string" && SCENES.includes(draft.scene as ProductUiScene)
      ? draft.scene as ProductUiScene
      : current.scene;
    const composition = typeof draft.composition === "string" && COMPOSITIONS.includes(draft.composition as ProductUiComposition)
      ? draft.composition as ProductUiComposition
      : current.composition;
    const items = Array.isArray(draft.items)
      ? draft.items.map(itemFromJson).filter((item): item is ProductUiItem => Boolean(item)).slice(0, 6)
      : current.items;
    const nodes = Array.isArray(draft.nodes)
      ? draft.nodes.map(nodeFromJson).filter((node): node is ProductUiNode => Boolean(node)).slice(0, 4)
      : current.nodes;

    return {
      content: {
        ...current,
        scene,
        composition,
        backgroundId: stringValue(draft.backgroundId) ?? current.backgroundId,
        title: stringValue(draft.title) ? clamp(String(draft.title), 58) : current.title,
        eyebrow: stringValue(draft.eyebrow) ?? current.eyebrow,
        primaryText: stringValue(draft.primaryText) ?? current.primaryText,
        secondaryText: stringValue(draft.secondaryText) ?? current.secondaryText,
        metricA: stringValue(draft.metricA) ?? current.metricA,
        metricB: stringValue(draft.metricB) ?? current.metricB,
        items,
        nodes,
      },
    };
  } catch {
    return { error: "Could not parse JSON. Paste the raw object from Claude." };
  }
}
