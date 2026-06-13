import {
  type InfographicAccent,
  type InfographicBg,
  type InfographicBlock,
  type InfographicBlockType,
  type InfographicContent,
  type InfographicFormat,
} from "@/lib/types/infographic";
import { newBlockId } from "@/lib/infographic-presets";
import { generatedTrendAxisLabel } from "@/lib/infographic-labels";
import { WORK_DATA_SCHEMA_VERSION } from "@/lib/work-data-schema";

export type ArticleImageStatus = "draft" | "ready";

export type ArticleImageCandidate = {
  id: string;
  selected: boolean;
  status: ArticleImageStatus;
  title: string;
  sourceSnippet: string;
  blockType: InfographicBlockType;
  content: InfographicContent;
};

type BaseContent = {
  format: InfographicFormat;
  bg: InfographicBg;
  accent: InfographicAccent;
};

type DraftCandidate = Omit<ArticleImageCandidate, "id" | "selected" | "content"> & {
  block: InfographicBlock;
};

const MAX_CANDIDATES = 5;
const NUMBER_RE =
  /(?:[$€£])?\d[\d,]*(?:\.\d+)?\s?(?:%|x|X|k|K|m|M|b|B|ms|sec|secs|s|min|mins|minutes|hr|hrs|hours)?/g;
const MONTH_RE =
  /\b(?:Jan|January|Feb|February|Mar|March|Apr|April|May|Jun|June|Jul|July|Aug|August|Sep|Sept|September|Oct|October|Nov|November|Dec|December|Q[1-4]|20\d{2})\b/gi;

export function extractInfographicCandidates(
  article: string,
  base: BaseContent,
): ArticleImageCandidate[] {
  const text = article.trim();
  if (!text) return [];

  const sentences = splitSentences(text);
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  const drafts: DraftCandidate[] = [];
  const stat = makeStatCandidate(sentences);
  if (stat) drafts.push(stat);

  const metrics = makeMetricsCandidate(sentences);
  if (metrics) drafts.push(metrics);

  const compare = makeCompareCandidate(lines, sentences);
  if (compare) drafts.push(compare);

  const steps = makeStepsCandidate(lines, sentences);
  if (steps) drafts.push(steps);

  const trend = makeTrendCandidate(text);
  if (trend) drafts.push(trend);

  return drafts.slice(0, MAX_CANDIDATES).map((draft, index) => ({
    id: `article-img-${Date.now().toString(36)}-${index + 1}`,
    selected: draft.status === "ready" && index < 3,
    status: draft.status,
    title: draft.title,
    sourceSnippet: draft.sourceSnippet,
    blockType: draft.blockType,
    content: {
      schemaVersion: WORK_DATA_SCHEMA_VERSION,
      format: base.format,
      bg: base.bg,
      accent: base.accent,
      title: draft.title,
      footnote: "",
      showTitle: true,
      blocks: [draft.block],
    },
  }));
}

function splitSentences(text: string): string[] {
  return text
    .replace(/\r/g, "")
    .split(/(?<=[.!?])\s+|\n+/)
    .map((sentence) => clean(sentence))
    .filter((sentence) => sentence.length > 12);
}

function clean(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

function truncate(value: string, max = 120): string {
  const cleaned = clean(value);
  return cleaned.length > max ? `${cleaned.slice(0, max - 1).trim()}...` : cleaned;
}

function titleFromSnippet(snippet: string, fallback: string): string {
  const words = clean(snippet)
    .replace(NUMBER_RE, "")
    .replace(/^[^\w]+|[^\w]+$/g, "")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 7);
  if (words.length >= 3) {
    return sentenceCase(words.join(" "));
  }
  return fallback;
}

function sentenceCase(value: string): string {
  const lower = value.toLowerCase();
  return lower.charAt(0).toUpperCase() + lower.slice(1);
}

function firstNumber(value: string): string | null {
  const match = value.match(NUMBER_RE);
  return match?.[0].replace(/\s+/g, "") ?? null;
}

function numericValue(value: string): number {
  const cleaned = value.replace(/[$€£,%xX\s]/g, "").replace(/,/g, "");
  const parsed = Number(cleaned);
  return Number.isFinite(parsed) ? parsed : 0;
}

function labelFromNumberSentence(sentence: string, number: string): string {
  const withoutNumber = clean(sentence.replace(number, ""));
  return truncate(withoutNumber.replace(/^[^\w]+|[^\w]+$/g, ""), 72) || "Key data point";
}

function numberFacts(sentences: string[]) {
  const out: Array<{ number: string; sentence: string; label: string }> = [];
  const seen = new Set<string>();
  for (const sentence of sentences) {
    const numbers = sentence.match(NUMBER_RE) ?? [];
    for (const number of numbers) {
      const normalized = number.replace(/\s+/g, "");
      if (seen.has(normalized)) continue;
      seen.add(normalized);
      out.push({
        number: normalized,
        sentence,
        label: labelFromNumberSentence(sentence, number),
      });
    }
    if (out.length >= 6) break;
  }
  return out;
}

function makeStatCandidate(sentences: string[]): DraftCandidate | null {
  const fact = numberFacts(sentences)[0];
  if (!fact) return null;
  const title = titleFromSnippet(fact.sentence, "Key impact metric");
  return {
    status: "ready",
    title,
    sourceSnippet: truncate(fact.sentence),
    blockType: "stat",
    block: {
      id: newBlockId(),
      type: "stat",
      eyebrow: "Key metric",
      number: fact.number,
      highlightNumber: true,
      label: fact.label,
    },
  };
}

function makeMetricsCandidate(sentences: string[]): DraftCandidate | null {
  const facts = numberFacts(sentences).slice(0, 4);
  if (facts.length < 2) return null;
  return {
    status: facts.length >= 3 ? "ready" : "draft",
    title: "Support impact metrics",
    sourceSnippet: truncate(facts.map((fact) => fact.sentence).join(" ")),
    blockType: "kpi-group",
    block: {
      id: newBlockId(),
      type: "kpi-group",
      items: facts.map((fact) => ({
        number: fact.number,
        label: fact.label,
      })),
    },
  };
}

function makeCompareCandidate(lines: string[], sentences: string[]): DraftCandidate | null {
  const rows: Array<{ a: string; b: string }> = [];
  const source: string[] = [];

  for (const line of lines) {
    const arrow = line.match(/(.+?)\s*(?:->|→)\s*(.+)/);
    if (arrow) {
      rows.push({ a: truncate(arrow[1], 48), b: truncate(arrow[2], 48) });
      source.push(line);
    }
    if (rows.length >= 4) break;
  }

  if (rows.length === 0) {
    const compareSentences = sentences.filter((sentence) =>
      /\b(before|after|old|new|manual|automated|automation|without|with| vs | versus )\b/i.test(sentence),
    );
    if (compareSentences.length > 0) {
      source.push(...compareSentences.slice(0, 2));
      rows.push(
        { a: "Manual workflow", b: "Automated workflow" },
        { a: "Slow triage", b: "Instant classification" },
        { a: "Fragmented notes", b: "Source-linked summary" },
      );
    }
  }

  if (rows.length === 0) return null;

  return {
    status: rows.length >= 2 ? "ready" : "draft",
    title: "Manual QA vs AI evaluation",
    sourceSnippet: truncate(source.join(" ")),
    blockType: "compare",
    block: {
      id: newBlockId(),
      type: "compare",
      layout: "cards",
      columnA: "Before",
      columnB: "After",
      highlightB: true,
      rows: rows.slice(0, 5),
    },
  };
}

function makeStepsCandidate(lines: string[], sentences: string[]): DraftCandidate | null {
  const bulletSteps = lines
    .map((line) => line.match(/^\s*(?:[-*•]|\d+[.)])\s+(.+)/)?.[1])
    .filter((line): line is string => !!line)
    .map((line) => truncate(line, 74));

  const sequenceSentences = sentences.filter((sentence) =>
    /\b(first|second|third|finally|then|next|step|detects|evaluates|creates|resolves)\b/i.test(sentence),
  );

  const steps = (bulletSteps.length >= 2 ? bulletSteps : sequenceSentences)
    .slice(0, 5)
    .map((step) => ({
      title: truncate(step.split(/[:.-]/)[0] || step, 32),
      desc: truncate(step, 86),
    }));

  if (steps.length < 2) return null;

  return {
    status: steps.length >= 3 ? "ready" : "draft",
    title: "How automated review works",
    sourceSnippet: truncate((bulletSteps.length >= 2 ? bulletSteps : sequenceSentences).join(" ")),
    blockType: "step",
    block: {
      id: newBlockId(),
      type: "step",
      items: steps,
    },
  };
}

function makeTrendCandidate(text: string): DraftCandidate | null {
  const matches: Array<{ label: string; value: number; raw: string }> = [];
  const chunks = text.split(/[\n.;]+/).map(clean).filter(Boolean);

  for (const chunk of chunks) {
    const label = chunk.match(MONTH_RE)?.[0];
    const number = firstNumber(chunk);
    if (!label || !number) continue;
    matches.push({ label, value: numericValue(number), raw: chunk });
    if (matches.length >= 8) break;
  }

  if (matches.length < 3) return null;

  return {
    status: "ready",
    title: "Trend over time",
    sourceSnippet: truncate(matches.map((match) => match.raw).join(" ")),
    blockType: "line-chart",
    block: {
      id: newBlockId(),
      type: "line-chart",
      xLabels: matches.map((match, index) => generatedTrendAxisLabel(match.label, index)),
      seriesA: {
        label: "Metric",
        values: matches.map((match) => match.value),
      },
      fill: true,
    },
  };
}
