import { conceptUiSamples } from "./samples";
import { parseSceneSpec, type ConceptUiArchetype, type SceneSpec } from "./scene-spec";
import { conceptUiArchetypes } from "./slots";

export type SpecProviderMode = "rules" | "llm";
export type UiTextLanguage = "en" | "ko";

export type ArchetypeChoice =
  | {
      kind: "resolved";
      archetype: ConceptUiArchetype;
      confidence: number;
    }
  | {
      kind: "needs-choice";
      options: ConceptUiArchetype[];
      confidence: 0;
    };

export type GenerateSpecInput = {
  description: string;
  uiTextLanguage: UiTextLanguage;
  forcedArchetype?: ConceptUiArchetype;
  previousSpec?: SceneSpec;
};

export type GenerateSpecResult = {
  spec: SceneSpec;
  source: "sample" | "pasted" | "llm";
  provider: SpecProviderMode;
  notice?: string;
};

export interface SpecProvider {
  analyze(input: { description: string }): ArchetypeChoice;
  generate(input: GenerateSpecInput): Promise<GenerateSpecResult>;
  regenerate(input: {
    description: string;
    uiTextLanguage: UiTextLanguage;
    archetype: ConceptUiArchetype;
    previousSpec?: SceneSpec;
  }): Promise<GenerateSpecResult>;
  switchArchetype(input: {
    description: string;
    uiTextLanguage: UiTextLanguage;
    targetArchetype: ConceptUiArchetype;
    previousSpec: SceneSpec;
  }): Promise<GenerateSpecResult>;
}

const KEYWORDS: Record<ConceptUiArchetype, RegExp[]> = {
  inbox: [
    /ticket/i,
    /conversation/i,
    /chat/i,
    /inbox/i,
    /support/i,
    /reply/i,
    /handoff/i,
    /상담/,
    /티켓/,
    /문의/,
    /대화/,
    /채팅/,
    /응답/,
  ],
  dashboard: [
    /dashboard/i,
    /analytics/i,
    /metric/i,
    /monitoring/i,
    /quality/i,
    /csat/i,
    /score/i,
    /report/i,
    /지표/,
    /대시보드/,
    /모니터링/,
    /분석/,
    /품질/,
    /성과/,
  ],
  builder: [
    /workflow/i,
    /automation/i,
    /canvas/i,
    /\brule/i,
    /actionbook/i,
    /\bflow/i,
    /워크플로우/,
    /자동화/,
    /룰/,
    /플로우/,
  ],
  table: [
    /\blist/i,
    /manage/i,
    /management/i,
    /records?/i,
    /grid/i,
    /queue/i,
    /목록/,
    /관리/,
    /내역/,
  ],
  modal: [
    /create/i,
    /settings?/i,
    /confirm/i,
    /modal/i,
    /result/i,
    /생성/,
    /설정/,
    /결과/,
  ],
};

const sampleCursor = Object.fromEntries(
  conceptUiArchetypes.map((archetype) => [archetype, { en: 0, ko: 0 }]),
) as Record<ConceptUiArchetype, Record<UiTextLanguage, number>>;

function countMatches(text: string, patterns: RegExp[]): number {
  return patterns.reduce((count, pattern) => count + (pattern.test(text) ? 1 : 0), 0);
}

function confidenceFromHits(primaryHits: number, secondaryHits: number): number {
  const diff = primaryHits - secondaryHits;
  return Math.min(0.95, 0.55 + primaryHits * 0.12 + diff * 0.08);
}

function cleanDescriptionTitle(description: string): string {
  const cleaned = description
    .replace(/\s+/g, " ")
    .replace(/[<>`{}[\]]/g, "")
    .trim();
  if (!cleaned) return "AI support workspace";
  return cleaned.length <= 56 ? cleaned : `${cleaned.slice(0, 53)}...`;
}

function cloneSpec(spec: SceneSpec): SceneSpec {
  return structuredClone(spec);
}

function applyDescriptionToTitle(spec: SceneSpec, description: string): SceneSpec {
  const next = cloneSpec(spec);
  next.content.title = cleanDescriptionTitle(description);
  return parseSceneSpec(next);
}

function nextSample(archetype: ConceptUiArchetype, description: string, language: UiTextLanguage): SceneSpec {
  const preferredSamples = conceptUiSamples.filter(
    (sample) => sample.spec.archetype === archetype && sample.language === language,
  );
  const samples = preferredSamples.length > 0
    ? preferredSamples
    : conceptUiSamples.filter((sample) => sample.spec.archetype === archetype);
  const index = sampleCursor[archetype][language] % samples.length;
  sampleCursor[archetype][language] += 1;
  return applyDescriptionToTitle(samples[index]?.spec ?? conceptUiSamples[0].spec, description);
}

export function mapDescriptionToArchetype(text: string): ArchetypeChoice {
  const description = text.trim();
  const scores = conceptUiArchetypes.map((archetype) => ({
    archetype,
    hits: countMatches(description, KEYWORDS[archetype]),
  }));
  const ranked = [...scores].sort((a, b) => b.hits - a.hits);
  const top = ranked[0];
  const second = ranked[1];

  if (!top || top.hits === 0) {
    return { kind: "needs-choice", options: conceptUiArchetypes, confidence: 0 };
  }
  const tied = ranked.filter((item) => item.hits === top.hits);
  if (tied.length > 1) {
    return { kind: "needs-choice", options: tied.map((item) => item.archetype), confidence: 0 };
  }

  return {
    kind: "resolved",
    archetype: top.archetype,
    confidence: confidenceFromHits(top.hits, second?.hits ?? 0),
  };
}

export const ruleBasedSpecProvider: SpecProvider = {
  analyze(input) {
    return mapDescriptionToArchetype(input.description);
  },

  async generate(input) {
    const choice = input.forcedArchetype
      ? { kind: "resolved" as const, archetype: input.forcedArchetype, confidence: 1 }
      : mapDescriptionToArchetype(input.description);
    const archetype = choice.kind === "resolved" ? choice.archetype : "inbox";
    return {
      spec: nextSample(archetype, input.description, input.uiTextLanguage),
      source: "sample",
      provider: "rules",
      notice: "Generated from a base template. Edit text as needed.",
    };
  },

  async regenerate(input) {
    return {
      spec: nextSample(input.archetype, input.description, input.uiTextLanguage),
      source: "sample",
      provider: "rules",
      notice: "Generated from a base template. Edit text as needed.",
    };
  },

  async switchArchetype(input) {
    return {
      spec: nextSample(input.targetArchetype, input.description, input.uiTextLanguage),
      source: "sample",
      provider: "rules",
      notice: "Generated from a base template. Edit text as needed.",
    };
  },
};
