import {
  type ProductUiComposition,
  type ProductUiContent,
  type ProductUiItem,
  type ProductUiNode,
  type ProductUiScene,
  type ProductUiStatus,
} from "@/lib/types/product-ui";
import { cloneProductUiContent, getProductUiPreset } from "@/lib/product-ui-presets";

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
