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
import {
  parseStructuredBrief,
  structuredFieldLines,
  structuredFieldValue,
  structuredTerms,
} from "@/lib/structured-brief";

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
  score: number;
};

type SourceIntent =
  | "single-interaction"
  | "comparison"
  | "process"
  | "metrics"
  | "distribution"
  | "trend"
  | "system-map"
  | "summary";

type SourceAnalysis = {
  text: string;
  sentences: string[];
  lines: string[];
  scores: Record<SourceIntent, number>;
  controls: SourceControls;
};

type SourceControls = {
  isStructured: boolean;
  contentText: string;
  mainClaim: string;
  proofPoints: string[];
  sourceNotes: string;
  structureBlockTypes: InfographicBlockType[];
  preferredBlockTypes: InfographicBlockType[];
  excludedTerms: string[];
};

const MAX_CANDIDATES = 5;
const NUMBER_RE =
  /(?:[$€£])?\d[\d,]*(?:\.\d+)?\s?(?:%|x|X|k|K|m|M|b|B|ms|sec|secs|s|min|mins|minutes|hr|hrs|hours)?/g;
const MONTH_RE =
  /\b(?:Jan|January|Feb|February|Mar|March|Apr|April|May|Jun|June|Jul|July|Aug|August|Sep|Sept|September|Oct|October|Nov|November|Dec|December|Q[1-4]|20\d{2})\b/gi;

const STRUCTURE_PLACEHOLDER = "comparison / process / metrics / stack / checklist";

const BLOCK_TYPE_ALIASES: Array<{ blockType: InfographicBlockType; patterns: RegExp[] }> = [
  { blockType: "compare", patterns: [/\bcomparison\b/i, /\bcompare\b/i, /\bbefore\b.*\bafter\b/i, /\bversus\b/i, /\bvs\b/i] },
  { blockType: "step", patterns: [/\bprocess\b/i, /\bsteps?\b/i, /\bflow\b/i, /\bchecklist\b/i, /\bsequence\b/i] },
  { blockType: "process-loop", patterns: [/\bprocess[-\s]?loop\b/i, /\bfeedback loop\b/i, /\bcycle\b/i, /\bloop\b/i] },
  { blockType: "kpi-group", patterns: [/\bmetrics?\b/i, /\bkpis?\b/i, /\bnumbers?\b/i] },
  { blockType: "stat", patterns: [/\bbig number\b/i, /\bstat\b/i, /\bprimary metric\b/i] },
  { blockType: "bar-group", patterns: [/\bbar\b/i, /\branking\b/i, /\branked\b/i] },
  { blockType: "stacked-bar", patterns: [/\bstacked\b/i, /\bdistribution\b/i, /\bbreakdown\b/i, /\bshare\b/i] },
  { blockType: "line-chart", patterns: [/\btrend\b/i, /\bover time\b/i, /\bline chart\b/i] },
  { blockType: "stack", patterns: [/\bstack\b/i, /\blayer\b/i, /\barchitecture\b/i] },
  { blockType: "node-list", patterns: [/\bhub map\b/i, /\bnode\b/i, /\bmap\b/i] },
  { blockType: "orbit", patterns: [/\borbit\b/i, /\bcycle diagram\b/i] },
  { blockType: "card-grid", patterns: [/\bcard\b/i, /\bsingle card\b/i, /\bsummary\b/i, /\bbenefits?\b/i] },
];

function meaningfulStructuredText(value: string): string {
  const cleaned = clean(value);
  const normalized = cleaned.toLowerCase();
  if (!cleaned || /^\[.*\]$/.test(cleaned)) return "";
  if (normalized === STRUCTURE_PLACEHOLDER) return "";
  return cleaned;
}

function blockTypesFromStructuredText(value: string): InfographicBlockType[] {
  const meaningful = meaningfulStructuredText(value);
  if (!meaningful) return [];
  const blockTypes: InfographicBlockType[] = [];
  for (const alias of BLOCK_TYPE_ALIASES) {
    if (alias.patterns.some((pattern) => pattern.test(meaningful)) && !blockTypes.includes(alias.blockType)) {
      blockTypes.push(alias.blockType);
    }
  }
  return blockTypes;
}

function parseSourceControls(article: string): SourceControls {
  const fallback = article.trim();
  const brief = parseStructuredBrief(fallback);
  if (!brief.isStructured) {
    return {
      isStructured: false,
      contentText: fallback,
      mainClaim: "",
      proofPoints: [],
      sourceNotes: "",
      structureBlockTypes: [],
      preferredBlockTypes: [],
      excludedTerms: [],
    };
  }

  const mainClaim = meaningfulStructuredText(structuredFieldValue(brief, ["main claim", "claim", "main message", "message"]));
  const proofPoints = structuredFieldLines(brief, ["proof points", "proof", "must show"])
    .map(meaningfulStructuredText)
    .filter(Boolean);
  const sourceNotes = meaningfulStructuredText(structuredFieldValue(brief, ["source notes", "article", "source"]));
  const looseText = meaningfulStructuredText(brief.looseText);
  const structureText = structuredFieldValue(brief, ["structure"]);
  const preferredText = structuredFieldValue(brief, ["preferred block", "block"]);

  return {
    isStructured: true,
    contentText: [looseText, mainClaim, ...proofPoints, sourceNotes].filter(Boolean).join("\n"),
    mainClaim,
    proofPoints,
    sourceNotes,
    structureBlockTypes: blockTypesFromStructuredText(structureText),
    preferredBlockTypes: blockTypesFromStructuredText(preferredText),
    excludedTerms: structuredTerms(structuredFieldValue(brief, ["do not show", "avoid", "exclude"])),
  };
}

export function extractInfographicCandidates(
  article: string,
  base: BaseContent,
): ArticleImageCandidate[] {
  const controls = parseSourceControls(article);
  const text = controls.contentText.trim();
  if (!text) return [];

  const sentences = splitSentences(text);
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  const analysis = analyzeSource(text, sentences, lines, controls);

  const drafts: DraftCandidate[] = [];
  const candidates = [
    makeSingleInteractionCompareCandidate(analysis),
    makeSingleInteractionStepsCandidate(analysis),
    makeBenefitCardsCandidate(analysis),
    makeStatCandidate(sentences),
    makeMetricsCandidate(sentences),
    makeRankedBarCandidate(sentences),
    makeStackedBarCandidate(lines, sentences),
    makeCompareCandidate(lines, sentences, analysis),
    makeProcessLoopCandidate(lines, sentences, analysis),
    makeStepsCandidate(lines, sentences, analysis),
    makeTrendCandidate(text),
    makeCardGridCandidate(sentences),
    makeSingleCardCandidate(sentences),
    makeLayerCandidate(text, sentences, analysis),
    makeNodeListCandidate(text, sentences, analysis),
    makeOrbitCandidate(text, sentences, analysis),
  ];

  for (const candidate of candidates) {
    if (candidate) drafts.push(candidate);
  }

  return selectCandidates(drafts, analysis)
    .sort((a, b) => b.score - a.score)
    .slice(0, MAX_CANDIDATES)
    .map((draft, index) => ({
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

function scoreText(text: string, patterns: Array<{ re: RegExp; weight: number }>) {
  return patterns.reduce((score, pattern) => {
    pattern.re.lastIndex = 0;
    return score + (pattern.re.test(text) ? pattern.weight : 0);
  }, 0);
}

function structureScoreBoosts(controls: SourceControls): Partial<Record<SourceIntent, number>> {
  const blockTypes = [...controls.structureBlockTypes, ...controls.preferredBlockTypes];
  const boosts: Partial<Record<SourceIntent, number>> = {};
  const add = (intent: SourceIntent, amount: number) => {
    boosts[intent] = (boosts[intent] ?? 0) + amount;
  };

  for (const blockType of blockTypes) {
    const amount = controls.preferredBlockTypes.includes(blockType) ? 12 : 7;
    if (blockType === "compare") add("comparison", amount);
    if (blockType === "step" || blockType === "process-loop") add("process", amount);
    if (blockType === "kpi-group" || blockType === "stat" || blockType === "bar-group") add("metrics", amount);
    if (blockType === "stacked-bar") add("distribution", amount);
    if (blockType === "line-chart") add("trend", amount);
    if (blockType === "stack" || blockType === "node-list" || blockType === "orbit") add("system-map", amount);
    if (blockType === "card-grid") add("summary", amount);
  }

  return boosts;
}

function analyzeSource(text: string, sentences: string[], lines: string[], controls: SourceControls): SourceAnalysis {
  const boosts = structureScoreBoosts(controls);
  return {
    text,
    sentences,
    lines,
    controls,
    scores: {
      "single-interaction": scoreText(text, [
        { re: /\bsingle[-\s]?interaction\b/i, weight: 9 },
        { re: /\b(one|single)\s+(touch|reply|response|conversation|interaction)\b/i, weight: 7 },
        { re: /\b(resolve|complete|handle|finish)\s+(needs?|requests?|issues?|cases?|tasks?)\b/i, weight: 5 },
        { re: /\b(without|no|avoid(?:s|ing)?|eliminat(?:e|es|ing)|reduce(?:s|ing)?)\b.{0,42}\b(transfers?|handoffs?|follow[-\s]?ups?|repeated calls?)\b/i, weight: 8 },
        { re: /\b(repeated calls?|fragmented handoffs?|fragmented transfers?|first[-\s]?contact resolution)\b/i, weight: 6 },
      ]),
      comparison: scoreText(text, [
        { re: /\b(before|after|old|new|manual|automated|without|with|instead of|rather than|versus| vs )\b/i, weight: 5 },
        { re: /(?:->|→)/, weight: 7 },
      ]) + (boosts.comparison ?? 0),
      process: scoreText(text, [
        { re: /\b(first|second|third|finally|then|next|step|flow|loop|cycle|detects|evaluates|creates|resolves|complete|save)\b/i, weight: 4 },
        { re: /^\s*(?:[-*•]|\d+[.)])\s+/m, weight: 6 },
      ]) + (boosts.process ?? 0),
      metrics: scoreText(text, [
        { re: NUMBER_RE, weight: 4 },
        { re: /\b(metric|kpi|rate|score|percent|revenue|cost|volume|growth|conversion)\b/i, weight: 4 },
      ]) + (boosts.metrics ?? 0),
      distribution: scoreText(text, [
        { re: /\b(distribution|mix|share|segment|breakdown|resolved|assisted|manual)\b/i, weight: 5 },
        { re: /\d+\s?%.*\d+\s?%.*\d+\s?%/, weight: 7 },
      ]) + (boosts.distribution ?? 0),
      trend: scoreText(text, [
        { re: MONTH_RE, weight: 5 },
        { re: /\b(trend|over time|month|quarter|q[1-4]|growth|decline)\b/i, weight: 4 },
      ]) + (boosts.trend ?? 0),
      "system-map": scoreText(text, [
        { re: /\b(map|hub|orchestrat|workflow|branch|intent|condition|channel|agent|actionbook|openbook|architecture|layer|stack)\b/i, weight: 5 },
      ]) + (boosts["system-map"] ?? 0),
      summary: Math.max(1, Math.min(6, sentences.length + lines.length)) + (boosts.summary ?? 0),
    },
  };
}

function preferredBlockBoost(blockType: InfographicBlockType, controls: SourceControls): number {
  if (controls.preferredBlockTypes.includes(blockType)) return 120;
  if (controls.structureBlockTypes.includes(blockType)) return 55;
  return 0;
}

function matchesExcludedTerm(value: string, term: string): boolean {
  const normalized = term.trim().toLowerCase();
  if (!normalized) return false;
  if (/\s/.test(normalized)) return value.includes(normalized);
  return new RegExp(`\\b${normalized.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i").test(value);
}

function draftViolatesExclusions(draft: DraftCandidate, controls: SourceControls): boolean {
  if (controls.excludedTerms.length === 0) return false;
  const visibleText = JSON.stringify({
    title: draft.title,
    sourceSnippet: draft.sourceSnippet,
    block: draft.block,
  }).toLowerCase();
  return controls.excludedTerms.some((term) => matchesExcludedTerm(visibleText, term));
}

function selectCandidates(drafts: DraftCandidate[], analysis: SourceAnalysis): DraftCandidate[] {
  const sorted = drafts
    .filter((draft) => !draftViolatesExclusions(draft, analysis.controls))
    .map((draft) => ({
      ...draft,
      score: draft.score + preferredBlockBoost(draft.blockType, analysis.controls),
    }))
    .sort((a, b) => b.score - a.score);
  const selected: DraftCandidate[] = [];
  const seenTypes = new Set<InfographicBlockType>();

  for (const draft of sorted) {
    if (seenTypes.has(draft.blockType)) continue;
    selected.push(draft);
    seenTypes.add(draft.blockType);
    if (selected.length >= MAX_CANDIDATES) return selected;
  }

  for (const draft of sorted) {
    if (selected.includes(draft)) continue;
    selected.push(draft);
    if (selected.length >= MAX_CANDIDATES) break;
  }

  return selected;
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

function truncateWords(value: string, maxWords: number, maxChars: number): string {
  const words = clean(value)
    .replace(NUMBER_RE, "")
    .replace(/^[^\w]+|[^\w]+$/g, "")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, maxWords);
  return truncate(words.join(" "), maxChars);
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

function boundedPercentValue(value: string): number | null {
  const parsed = numericValue(value);
  if (!Number.isFinite(parsed) || parsed <= 0 || parsed > 100) return null;
  return Math.round(parsed);
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

function sourceSnippetFor(analysis: SourceAnalysis, max = 150): string {
  return truncate((analysis.sentences.length ? analysis.sentences : analysis.lines).slice(0, 3).join(" "), max);
}

function prefersBlock(analysis: SourceAnalysis, blockType: InfographicBlockType): boolean {
  return analysis.controls.preferredBlockTypes.includes(blockType) || analysis.controls.structureBlockTypes.includes(blockType);
}

function structuredProofPoints(analysis: SourceAnalysis): string[] {
  return analysis.controls.proofPoints.length
    ? analysis.controls.proofPoints
    : analysis.sentences.slice(0, 4);
}

function meaningfulClauses(analysis: SourceAnalysis): string[] {
  const fromLines = analysis.lines.flatMap((line) => line.split(/\s*[.;]\s+/));
  const fromSentences = analysis.sentences.flatMap((sentence) => sentence.split(/\s*,\s+|\s+and\s+/i));
  const clauses = [...fromLines, ...fromSentences]
    .map((value) => clean(value).replace(/^[^\w]+|[^\w]+$/g, ""))
    .filter((value) => value.length >= 18)
    .filter((value, index, list) => list.findIndex((item) => item.toLowerCase() === value.toLowerCase()) === index);
  return clauses.slice(0, 4);
}

function makeSingleInteractionCompareCandidate(analysis: SourceAnalysis): DraftCandidate | null {
  if (analysis.scores["single-interaction"] < 9) return null;

  return {
    status: "ready",
    score: 96,
    title: "One interaction resolution",
    sourceSnippet: sourceSnippetFor(analysis),
    blockType: "compare",
    block: {
      id: newBlockId(),
      type: "compare",
      layout: "cards",
      columnA: "Fragmented",
      columnB: "Resolved",
      highlightB: true,
      rows: [
        { a: "Repeated calls", b: "One complete answer" },
        { a: "Transfers reset context", b: "Context stays intact" },
        { a: "Follow-ups multiply", b: "Final confirmation lands once" },
      ],
    },
  };
}

function makeSingleInteractionStepsCandidate(analysis: SourceAnalysis): DraftCandidate | null {
  if (analysis.scores["single-interaction"] < 9) return null;
  const proofItems = prefersBlock(analysis, "step")
    ? structuredProofPoints(analysis).slice(0, 5).map((point) => ({
      title: truncate(point.split(/[:.-]/)[0] || point, 32),
      desc: truncate(point, 86),
    }))
    : [];
  const items = proofItems.length >= 2
    ? proofItems
    : [
      { title: "Understand the need", desc: "Keep customer context in one thread." },
      { title: "Complete the request", desc: "Resolve eligible actions without a transfer." },
      { title: "Confirm once", desc: "Close the loop with a clear final answer." },
    ];

  return {
    status: "ready",
    score: 88,
    title: analysis.controls.mainClaim || "How one-touch resolution works",
    sourceSnippet: sourceSnippetFor(analysis),
    blockType: "step",
    block: {
      id: newBlockId(),
      type: "step",
      items,
    },
  };
}

function makeProcessLoopCandidate(lines: string[], sentences: string[], analysis: SourceAnalysis): DraftCandidate | null {
  const sourceText = analysis.text;
  if (
    analysis.scores.process < 6 &&
    !prefersBlock(analysis, "process-loop") &&
    !/\b(loop|feedback|cycle|steer|steers|research|hypothesize|deploy)\b/i.test(sourceText)
  ) {
    return null;
  }

  const bulletSteps = lines
    .map((line) => line.match(/^\s*(?:[-*•]|\d+[.)])\s+(.+)/)?.[1])
    .filter((line): line is string => !!line)
    .map((line) => truncateWords(line, 2, 18));
  const sequenceSentences = sentences.filter((sentence) =>
    /\b(research|hypothes|human|steer|test|deploy|plan|review|learn|feedback|loop|then|next|finally)\b/i.test(sentence),
  );
  const sentenceSteps = sequenceSentences.map((sentence) => truncateWords(sentence, 2, 18));
  const proofSteps = structuredProofPoints(analysis).map((point) => truncateWords(point, 2, 18));
  const steps = (bulletSteps.length >= 3 ? bulletSteps : sentenceSteps.length >= 3 ? sentenceSteps : proofSteps)
    .filter(Boolean)
    .slice(0, 5);
  const finalSteps = steps.length >= 3
    ? steps
    : ["Research", "Hypothesize", "Human Steer", "Test", "Deploy"];
  const activeStepIndex = finalSteps.findIndex((step) => /\b(human|steer|ai|agent)\b/i.test(step));

  return {
    status: "ready",
    score: analysis.scores.process >= 8 ? 86 : 73,
    title: /\blevel\s*\d|human steer/i.test(sourceText) ? "Level 2: Human steers" : "Process loop",
    sourceSnippet: truncate((sequenceSentences.length ? sequenceSentences : sentences).slice(0, 3).join(" ")),
    blockType: "process-loop",
    block: {
      id: newBlockId(),
      type: "process-loop",
      title: /\blevel\s*\d|human steer/i.test(sourceText) ? "Level 2: Human steers" : "How the loop works",
      steps: finalSteps.map((label) => ({ label })),
      activeStepIndex: activeStepIndex >= 0 ? activeStepIndex : Math.min(2, finalSteps.length - 1),
      loopLabel: /\bfeedback\b/i.test(sourceText)
        ? "Feedback loop: failures feed back into research"
        : "Loop output feeds the next iteration",
    },
  };
}

function makeBenefitCardsCandidate(analysis: SourceAnalysis): DraftCandidate | null {
  if (analysis.scores.metrics >= 4 || analysis.scores.summary < 2) return null;
  if (
    !prefersBlock(analysis, "card-grid") &&
    analysis.scores["single-interaction"] < 5 &&
    analysis.scores.process < 4 &&
    analysis.scores.comparison < 4
  ) {
    return null;
  }

  const clauses = prefersBlock(analysis, "card-grid") ? structuredProofPoints(analysis) : meaningfulClauses(analysis);
  if (clauses.length < 2) return null;

  return {
    status: "ready",
    score: analysis.scores["single-interaction"] >= 9 ? 80 : 72,
    title: analysis.scores["single-interaction"] >= 9 ? "Resolution benefits" : "Key ideas from the source",
    sourceSnippet: sourceSnippetFor(analysis),
    blockType: "card-grid",
    block: {
      id: newBlockId(),
      type: "card-grid",
      cards: clauses.slice(0, 4).map((clause, index) => ({
        badge: String(index + 1).padStart(2, "0"),
        title: cardTitle(clause, `Point ${index + 1}`),
        body: truncate(clause, 96),
      })),
    },
  };
}

function makeStatCandidate(sentences: string[]): DraftCandidate | null {
  const fact = numberFacts(sentences)[0];
  if (!fact) return null;
  const title = titleFromSnippet(fact.sentence, "Key impact metric");
  return {
    status: "ready",
    score: 72,
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
    score: facts.length >= 3 ? 86 : 64,
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

function makeRankedBarCandidate(sentences: string[]): DraftCandidate | null {
  const facts = numberFacts(sentences)
    .map((fact) => ({ ...fact, value: boundedPercentValue(fact.number) }))
    .filter((fact): fact is typeof fact & { value: number } => fact.value !== null)
    .slice(0, 4);

  if (facts.length < 3) return null;

  return {
    status: "ready",
    score: 84,
    title: "Ranked impact areas",
    sourceSnippet: truncate(facts.map((fact) => fact.sentence).join(" ")),
    blockType: "bar-group",
    block: {
      id: newBlockId(),
      type: "bar-group",
      variant: "ranked",
      labelA: "Area",
      labelB: "Value",
      unit: "%",
      items: facts.map((fact, index) => ({
        label: truncate(fact.label, 28),
        valueA: fact.value,
        highlight: index === 0,
      })),
    },
  };
}

function makeStackedBarCandidate(lines: string[], sentences: string[]): DraftCandidate | null {
  const chunks = [...lines, ...sentences];
  const rows: Array<{ label: string; values: number[] }> = [];
  const source: string[] = [];
  const seenRows = new Set<string>();

  for (const chunk of chunks) {
    const numbers = (chunk.match(NUMBER_RE) ?? [])
      .map((number) => boundedPercentValue(number))
      .filter((value): value is number => value !== null);
    if (numbers.length < 3) continue;

    const label = truncate(
      clean(chunk)
        .split(NUMBER_RE)[0]
        .replace(/[:\-–—|,]+$/g, "")
        .trim() || `Row ${rows.length + 1}`,
      22,
    );
    const values = numbers.slice(0, 3);
    const rowKey = `${label.toLowerCase()}|${values.join(",")}`;
    if (seenRows.has(rowKey)) continue;
    seenRows.add(rowKey);
    rows.push({ label, values });
    source.push(chunk);
    if (rows.length >= 4) break;
  }

  if (rows.length < 2) return null;

  return {
    status: "ready",
    score: 88,
    title: "Distribution by workflow",
    sourceSnippet: truncate(source.join(" ")),
    blockType: "stacked-bar",
    block: {
      id: newBlockId(),
      type: "stacked-bar",
      series: ["Resolved", "Assisted", "Manual"],
      unit: "%",
      accentIndex: 0,
      normalize: true,
      rows,
    },
  };
}

function makeCompareCandidate(lines: string[], sentences: string[], analysis: SourceAnalysis): DraftCandidate | null {
  if (analysis.scores["single-interaction"] >= 9 && !prefersBlock(analysis, "compare")) return null;

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
      /\b(before|after|old|new|manual|automated|automation|without|with|instead of|rather than|wall of|map|source view|flow view| vs | versus )\b/i.test(sentence),
    );
    if (compareSentences.length > 0) {
      source.push(...compareSentences.slice(0, 2));
      if (/\b(actionbook|openbook|flow view|source view|wall of|map)\b/i.test(compareSentences.join(" "))) {
        rows.push(
          { a: "Source view hides structure", b: "Flow view shows the map" },
          { a: "Scroll to hunt for rules", b: "Click a node to jump there" },
          { a: "Policy logic drifts", b: "Updates land where they belong" },
        );
      } else {
        rows.push(
          { a: "Manual workflow", b: "Automated workflow" },
          { a: "Slow triage", b: "Instant classification" },
          { a: "Fragmented notes", b: "Source-linked summary" },
        );
      }
    }
  }

  if (rows.length === 0 && prefersBlock(analysis, "compare")) {
    const proofPoints = structuredProofPoints(analysis).slice(0, 4);
    rows.push(...proofPoints.map((point) => ({
      a: "Unstructured ask",
      b: truncate(point, 48),
    })));
    source.push(...proofPoints);
  }

  if (rows.length === 0) return null;

  return {
    status: rows.length >= 2 ? "ready" : "draft",
    score: 81,
    title: /\b(actionbook|openbook|flow view|source view)\b/i.test(source.join(" "))
      ? "Source view vs Flow view"
      : "Manual QA vs AI evaluation",
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

function makeStepsCandidate(lines: string[], sentences: string[], analysis: SourceAnalysis): DraftCandidate | null {
  const bulletSteps = lines
    .map((line) => line.match(/^\s*(?:[-*•]|\d+[.)])\s+(.+)/)?.[1])
    .filter((line): line is string => !!line)
    .map((line) => truncate(line, 74));

  const sequenceSentences = sentences.filter((sentence) =>
    /\b(first|second|third|finally|then|next|step|click|open|toggle|jump|edit|save|find|detects|evaluates|creates|resolves)\b/i.test(sentence),
  );

  const fallbackSteps = prefersBlock(analysis, "step") ? structuredProofPoints(analysis) : [];
  const steps = (bulletSteps.length >= 2 ? bulletSteps : sequenceSentences.length >= 2 ? sequenceSentences : fallbackSteps)
    .slice(0, 5)
    .map((step) => ({
      title: truncate(step.split(/[:.-]/)[0] || step, 32),
      desc: truncate(step, 86),
    }));

  if (steps.length < 2) return null;

  return {
    status: steps.length >= 3 ? "ready" : "draft",
    score: steps.length >= 3 ? 82 : 62,
    title: /\b(actionbook|openbook|flow view|source view)\b/i.test(sequenceSentences.join(" "))
      ? "How Openbook navigation works"
      : "How automated review works",
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
    score: 83,
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

function makeCardGridCandidate(sentences: string[]): DraftCandidate | null {
  const usable = sentences
    .filter((sentence) => sentence.length >= 36)
    .filter((sentence) => (sentence.match(NUMBER_RE) ?? []).length <= 1)
    .slice(0, 4);

  if (usable.length < 3) return null;

  return {
    status: "ready",
    score: 76,
    title: "Key ideas from the source",
    sourceSnippet: truncate(usable.join(" ")),
    blockType: "card-grid",
    block: {
      id: newBlockId(),
      type: "card-grid",
      cards: usable.slice(0, 4).map((sentence, index) => ({
        badge: String(index + 1).padStart(2, "0"),
        title: cardTitle(sentence, `Point ${index + 1}`),
        body: truncate(sentence, 96),
      })),
    },
  };
}

function makeSingleCardCandidate(sentences: string[]): DraftCandidate | null {
  const sentence = sentences.find((item) => item.length >= 42) ?? sentences[0];
  if (!sentence) return null;

  return {
    status: "ready",
    score: 58,
    title: "Single message card",
    sourceSnippet: truncate(sentence),
    blockType: "card-grid",
    block: {
      id: newBlockId(),
      type: "card-grid",
      cards: [
        {
          title: cardTitle(sentence, "Key message"),
          body: truncate(sentence, 132),
        },
      ],
    },
  };
}

function makeLayerCandidate(text: string, sentences: string[], analysis: SourceAnalysis): DraftCandidate | null {
  if (!prefersBlock(analysis, "stack") && !/\b(layer|stack|architecture|system|policy|rule|logic|source|editor|flow|workspace|actionbook|openbook)\b/i.test(text)) {
    return null;
  }

  if (/\b(actionbook|openbook|flow view|source view)\b/i.test(text)) {
    return {
      status: "ready",
      score: 90,
      title: "Openbook navigation layers",
      sourceSnippet: truncate(sentences.slice(0, 3).join(" ")),
      blockType: "stack",
      block: {
        id: newBlockId(),
        type: "stack",
        layers: [
          {
            title: "FLOW VIEW",
            highlight: true,
            caption: "The actionbook map",
            cells: [{ title: "Visible structure", desc: "Sections, intents, conditions, and content cards" }],
          },
          {
            title: "ACTIONBOOK LOGIC",
            caption: "The governed rules",
            cells: [{ title: "Policy branches", desc: "Return windows, escalation paths, and thresholds" }],
          },
          {
            title: "SOURCE EDITOR",
            caption: "The exact section",
            cells: [{ title: "Precise update", desc: "Click a node, edit the rule, save the actionbook" }],
          },
        ],
      },
    };
  }

  const layerSource = prefersBlock(analysis, "stack") ? structuredProofPoints(analysis) : sentences;
  const layers = layerSource.slice(0, 3).map((sentence, index) => ({
    title: truncateWords(sentence, 3, 26).toUpperCase() || `LAYER ${index + 1}`,
    highlight: index === 0,
    cells: [{ title: cardTitle(sentence, `Layer ${index + 1}`), desc: truncate(sentence, 72) }],
  }));

  if (layers.length < 2) return null;

  return {
    status: "ready",
    score: 70,
    title: "Layer diagram",
    sourceSnippet: truncate(sentences.slice(0, 3).join(" ")),
    blockType: "stack",
    block: {
      id: newBlockId(),
      type: "stack",
      layers,
    },
  };
}

function makeNodeListCandidate(text: string, sentences: string[], analysis: SourceAnalysis): DraftCandidate | null {
  if (!prefersBlock(analysis, "node-list") && !/\b(map|hub|orchestrat|workflow|branch|intent|condition|channel|agent|actionbook|openbook)\b/i.test(text)) {
    return null;
  }

  if (/\b(actionbook|openbook|flow view|source view)\b/i.test(text)) {
    return {
      status: "ready",
      score: 89,
      title: "Actionbook map",
      sourceSnippet: truncate(sentences.slice(0, 4).join(" ")),
      blockType: "node-list",
      block: {
        id: newBlockId(),
        type: "node-list",
        hubTitle: "Openbook",
        hubSub: "AI logic map",
        items: [
          { label: "Sections", tag: "Header", desc: "Top-level actionbook areas" },
          { label: "Intents", tag: "Branch", desc: "Where new cases fit" },
          { label: "Conditions", tag: "IF", desc: "Return windows, limits, and thresholds" },
          { label: "Content cards", tag: "Copy", desc: "Approved replies and actions" },
        ],
      },
    };
  }

  const itemSource = prefersBlock(analysis, "node-list") ? structuredProofPoints(analysis) : sentences;
  const items = itemSource.slice(0, 4).map((sentence, index) => ({
    label: cardTitle(sentence, `Node ${index + 1}`),
    tag: String(index + 1).padStart(2, "0"),
    desc: truncate(sentence, 70),
  }));

  if (items.length < 3) return null;

  return {
    status: "ready",
    score: 68,
    title: "Hub map",
    sourceSnippet: truncate(sentences.slice(0, 4).join(" ")),
    blockType: "node-list",
    block: {
      id: newBlockId(),
      type: "node-list",
      hubTitle: "AI orchestration",
      items,
    },
  };
}

function makeOrbitCandidate(text: string, sentences: string[], analysis: SourceAnalysis): DraftCandidate | null {
  if (!prefersBlock(analysis, "orbit") && !/\b(loop|cycle|flow|navigate|click|zoom|move|branch|actionbook|openbook)\b/i.test(text)) {
    return null;
  }

  const isActionbook = /\b(actionbook|openbook|flow view|source view)\b/i.test(text);

  return {
    status: "ready",
    score: isActionbook ? 87 : 66,
    title: isActionbook ? "Navigate the actionbook" : "Operating loop",
    sourceSnippet: truncate(sentences.slice(0, 3).join(" ")),
    blockType: "orbit",
    block: {
      id: newBlockId(),
      type: "orbit",
      variant: "cycle",
      center: isActionbook ? "Openbook" : "delight",
      nodes: (isActionbook
        ? ["Zoom out", "Find branch", "Click node", "Edit rule", "Save change"]
        : ["Detect", "Prioritize", "Act", "Learn", "Resolve"]
      ).map((label, index) => ({
        label,
        highlight: isActionbook ? index === 2 || index === 3 : index === 0 || index === 2,
      })),
    },
  };
}

function cardTitle(sentence: string, fallback: string): string {
  const cleaned = clean(sentence)
    .replace(/^(when|once|because|but|and|the)\s+/i, "")
    .replace(NUMBER_RE, "");
  const beforeBreak = cleaned.split(/\s+[—–-]\s+|:\s+/)[0];
  const title = truncateWords(beforeBreak, 4, 34);
  return title ? sentenceCase(title) : fallback;
}
