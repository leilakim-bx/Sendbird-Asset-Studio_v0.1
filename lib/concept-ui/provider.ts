import { conceptUiSamples } from "./samples";
import {
  parseSceneSpec,
  type ConceptUiArchetype,
  type InstructionSectionSpec,
  type LogicBlockSpec,
  type ReviewQueueSpec,
  type SceneSpec,
  type ToolCallListSpec,
} from "./scene-spec";
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
  workspace: [
    /workspace/i,
    /settings?/i,
    /editor/i,
    /preview/i,
    /tester/i,
    /test agent/i,
    /actionbook/i,
    /cancel membership/i,
    /agent panel/i,
    /작업공간/,
    /설정/,
    /에디터/,
    /프리뷰/,
    /테스터/,
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

const LOGIC_PATTERNS = [
  /\bif\b/i,
  /\belse\b/i,
  /if\s*\/\s*else/i,
  /condition/i,
  /conditional/i,
  /outcomes?/i,
  /branch(?:ing)?/i,
  /\brule/i,
  /context_status/i,
  /조건/,
  /분기/,
];

const INSTRUCTION_PATTERNS = [
  /instruction/i,
  /policy/i,
  /guide/i,
  /key points?/i,
  /when to use/i,
  /global actions?/i,
  /template syntax/i,
  /playbook/i,
  /knowledge/i,
  /source/i,
  /train(?:ing|ed)?/i,
  /procedures?/i,
  /operating procedures?/i,
  /guardrails?/i,
  /\baops?\b/i,
  /지침/,
  /정책/,
  /가이드/,
  /핵심/,
  /지식/,
  /소스/,
  /학습/,
  /절차/,
  /가드레일/,
];

const REVIEW_PATTERNS = [
  /review/i,
  /approval/i,
  /approve/i,
  /human loop/i,
  /manager/i,
  /lead/i,
  /queue/i,
  /escalat/i,
  /audit/i,
  /testing/i,
  /regression/i,
  /simulation/i,
  /\bqa\b/i,
  /quality assurance/i,
  /observability/i,
  /alert/i,
  /experiment/i,
  /manual inspection/i,
  /compliance/i,
  /reliability/i,
  /검토/,
  /승인/,
  /매니저/,
  /에스컬/,
  /테스트/,
  /품질/,
  /알림/,
  /실험/,
  /컴플라이언스/,
];

const TOOL_CALL_PATTERNS = [
  /tool calls?/i,
  /function calls?/i,
  /api/i,
  /lookup/i,
  /webhook/i,
  /integration/i,
  /data connectors?/i,
  /mcp/i,
  /systems? of record/i,
  /data warehouses?/i,
  /customer data/i,
  /custom actions?/i,
  /actions? and integrations/i,
  /next best action/i,
  /proactive engagement/i,
  /recommendations?/i,
  /connect-to-agent/i,
  /#[a-z][\w-]+/i,
  /call\s+[a-z#][\w-]+/i,
  /툴/,
  /함수/,
  /조회/,
  /연동/,
  /데이터/,
  /추천/,
];

function clampText(value: string, max: number): string {
  const cleaned = value.replace(/\s+/g, " ").trim();
  if (cleaned.length <= max) return cleaned;
  return `${cleaned.slice(0, max - 3).trimEnd()}...`;
}

function needsLogicBlock(description: string): boolean {
  return LOGIC_PATTERNS.some((pattern) => pattern.test(description));
}

function matchesAny(description: string, patterns: RegExp[]): boolean {
  return patterns.some((pattern) => pattern.test(description));
}

function extractCondition(description: string): string {
  const operatorMatch = description.match(/\b[A-Za-z][\w.]*\s*(?:==|!=|>=|<=|>|<)\s*["']?[\w.-]+["']?/);
  if (operatorMatch?.[0]) return clampText(operatorMatch[0], 72);

  const ifMatch = description.match(/\bif\s+([^.—:\n]{4,72})/i);
  if (ifMatch?.[1]) {
    const candidate = ifMatch[1].trim();
    if (!/^\/?\s*else\b/i.test(candidate) && !/else\s+logic/i.test(candidate)) {
      return clampText(candidate, 72);
    }
  }

  if (/conditional|condition|branch|if\s*\/\s*else/i.test(description)) {
    return "Customer context matches the branch condition";
  }

  return "context_status == error";
}

function buildLogicBlock(description: string): LogicBlockSpec {
  const condition = extractCondition(description);
  const mentionsLookup = /lookup|order-lookup|order lookup|조회|검색/i.test(description);
  const mentionsManager = /manager|cx|lead|review|검토|매니저/i.test(description);

  return {
    slotId: "logic-conditional-path",
    title: "Conditional path",
    conditionLabel: "IF",
    condition,
    description: "Condition on top, outcomes below, and each branch stays editable in the UI.",
    outcomes: [
      {
        label: "When true",
        action: mentionsLookup
          ? "Ask for missing context, then call the lookup action before replying."
          : "Run the branch-specific action with the current customer context.",
        tone: "warn",
      },
      {
        label: "Otherwise",
        action: mentionsManager
          ? "Route the safe path to CX review with a readable reason."
          : "Continue the default intent flow without exposing template syntax.",
        tone: "good",
      },
    ],
  };
}

function buildInstructionSection(description: string): InstructionSectionSpec {
  const mentionsSyntax = /syntax|variable|template|anchor|inline|<[^>]+>|#[a-z][\w-]+/i.test(description);
  const mentionsKnowledge = /knowledge|source|train(?:ing|ed)?|procedure|operating procedure|guardrail|\baops?\b|지식|소스|학습|절차|가드레일/i.test(description);
  if (mentionsKnowledge) {
    return {
      slotId: "instruction-knowledge-procedures",
      title: "Knowledge and procedures",
      eyebrow: "Training",
      body: "Business rules, source coverage, and procedures stay visible as editable product UI instead of hidden prompt text.",
      items: [
        {
          label: "Sources",
          text: "Show which knowledge sources or policies are trusted for this workflow.",
          tone: "ai",
        },
        {
          label: "Procedure",
          text: "Keep the step-by-step agent behavior readable for non-engineering teams.",
          tone: "neutral",
        },
        {
          label: "Guardrail",
          text: "Pause or hand off when required evidence is missing or stale.",
          tone: "warn",
        },
      ],
      tags: ["Knowledge", "Editable"],
    };
  }
  return {
    slotId: "instruction-agent-guidance",
    title: "Agent instructions",
    eyebrow: "Guide",
    body: mentionsSyntax
      ? "Plain-language guidance keeps variables, anchors, and template syntax readable for CX managers."
      : "Operational instructions stay editable as structured guidance instead of hidden prompt text.",
    items: [
      {
        label: "When to use",
        text: "Apply this guidance only when the current customer context matches the active intent.",
        tone: "neutral",
      },
      {
        label: mentionsSyntax ? "Variables" : "Policy",
        text: mentionsSyntax
          ? "Inline variables and action anchors remain visible as editable product UI tokens."
          : "Policy notes are shown as short editable rows that keep agent behavior predictable.",
        tone: "ai",
      },
      {
        label: "Fallback",
        text: "If required context is missing, pause the automation and route to a safe recovery path.",
        tone: "warn",
      },
    ],
    tags: ["Editable", "Plain language"],
  };
}

function buildReviewQueue(description: string): ReviewQueueSpec {
  const mentionsRisk = /risk|policy|audit|compliance|source|citation|위험|정책/i.test(description);
  const mentionsQuality = /testing|regression|simulation|\bqa\b|quality assurance|observability|alert|experiment|manual inspection|reliability|테스트|품질|알림|실험/i.test(description);
  if (mentionsQuality) {
    return {
      slotId: "review-quality-monitor",
      title: "Quality monitor",
      summary: "Testing, QA, and observability checks show whether an agent change is ready for production.",
      items: [
        {
          label: "Regression check",
          detail: "Run saved scenarios before setting the updated workflow live.",
          status: "Queued",
          tone: "neutral",
        },
        {
          label: "Insight alert",
          detail: "Surface quality drift, missing knowledge, or unusual handoff volume for review.",
          status: "Open",
          tone: "warn",
        },
      ],
    };
  }
  return {
    slotId: "review-human-loop",
    title: "Human review queue",
    summary: "Review rows show why an AI action needs approval before it reaches the customer.",
    items: [
      {
        label: mentionsRisk ? "Policy risk" : "Needs approval",
        detail: mentionsRisk
          ? "Flagged because policy, source, or compliance context needs a lead review."
          : "A lead checks the proposed action before the agent continues.",
        status: "Review",
        tone: "warn",
      },
      {
        label: "Safe to continue",
        detail: "Low-risk actions keep their reason, owner, and next step visible in the queue.",
        status: "Ready",
        tone: "good",
      },
    ],
  };
}

function buildToolCallList(description: string): ToolCallListSpec {
  const mentionsOrder = /order|lookup|refund|booking|flight|조회|예약|환불/i.test(description);
  const mentionsAgentAction = /data connector|mcp|system of record|data warehouse|customer data|custom action|actions? and integrations|next best action|proactive|recommendation|데이터|추천/i.test(description);
  if (mentionsAgentAction && !mentionsOrder) {
    return {
      slotId: "tool-action-sequence",
      title: "Action sequence",
      summary: "Actions and integrations are shown as inspectable steps before the agent changes customer state.",
      calls: [
        {
          name: "fetch_customer_data",
          detail: "Read profile, account, or warehouse context from approved systems.",
          status: "Ready",
          tone: "ai",
        },
        {
          name: "recommend_next_action",
          detail: "Choose the safest next action from available strategy and policy context.",
          status: "Draft",
          tone: "neutral",
        },
        {
          name: "trigger_workflow",
          detail: "Run the approved workflow or hand off the exception for review.",
          status: "Next",
          tone: "good",
        },
      ],
    };
  }
  return {
    slotId: "tool-call-sequence",
    title: "Tool call sequence",
    summary: "Function calls are shown as readable steps with status, context, and expected output.",
    calls: [
      {
        name: mentionsOrder ? "order_lookup" : "context_lookup",
        detail: mentionsOrder
          ? "Fetch the order, booking, or account state before composing the reply."
          : "Fetch the current customer context before taking action.",
        status: "Ready",
        tone: "ai",
      },
      {
        name: "validate_policy",
        detail: "Check whether the proposed action is allowed for this customer state.",
        status: "Check",
        tone: "neutral",
      },
      {
        name: "route_result",
        detail: "Send the safe result to the agent or hand off the exception for review.",
        status: "Next",
        tone: "good",
      },
    ],
  };
}

function applyReusableBlocks(spec: SceneSpec, description: string): SceneSpec {
  const addLogic = needsLogicBlock(description);
  const addInstruction = matchesAny(description, INSTRUCTION_PATTERNS);
  const addReview = matchesAny(description, REVIEW_PATTERNS);
  const addToolCalls = matchesAny(description, TOOL_CALL_PATTERNS);

  if (!addLogic && !addInstruction && !addReview && !addToolCalls) return spec;

  const next = cloneSpec(spec);
  if (
    next.archetype === "dashboard" ||
    next.archetype === "builder" ||
    next.archetype === "modal" ||
    next.archetype === "workspace"
  ) {
    if (addLogic) next.content.logicBlocks = [buildLogicBlock(description)];
    if (addReview) next.content.reviewQueues = [buildReviewQueue(description)];
    if (addToolCalls) next.content.toolCallLists = [buildToolCallList(description)];
    if (addInstruction) next.content.instructionSections = [buildInstructionSection(description)];

    if (next.archetype === "modal" && addLogic) {
      const logicBlock = next.content.logicBlocks?.[0] ?? buildLogicBlock(description);
      next.content.title = "Conditional block editor";
      next.content.subtitle = "Review if/else logic before saving the rule.";
      next.content.background = {
        type: "builder",
        title: "Actionbook editor",
        items: [
          "Behavioral rules",
          "Conditional paths",
          "Outcome preview",
          "Test branch",
        ],
      };
      next.content.modal = {
        slotId: "modal-conditional-path",
        kind: "form",
        eyebrow: "Logic block",
        title: "Edit conditional path",
        description: "Review the condition and outcomes before saving the rule.",
        fields: [
          { slotId: "modal-condition-field", label: "Condition", value: logicBlock.condition },
          { slotId: "modal-true-field", label: "When true", value: clampText(logicBlock.outcomes[0]?.action ?? "Run the branch-specific action.", 80) },
          { slotId: "modal-else-field", label: "Otherwise", value: clampText(logicBlock.outcomes[1]?.action ?? "Continue the default intent flow.", 80) },
        ],
        actions: [
          { label: "Save changes", tone: "primary" },
          { label: "Test branch", tone: "secondary" },
        ],
      };
      next.modifiers = {
        ...next.modifiers,
        aiCallout: {
          targetSlotId: logicBlock.slotId,
          label: "Visual logic",
          description: "Shows the condition first, then the outcome for each branch.",
        },
      };
    }
  }
  return parseSceneSpec(next);
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
  return applyReusableBlocks(applyDescriptionToTitle(samples[index]?.spec ?? conceptUiSamples[0].spec, description), description);
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
    if (needsLogicBlock(description)) {
      return { kind: "resolved", archetype: "builder", confidence: 0.66 };
    }
    if (matchesAny(description, REVIEW_PATTERNS)) {
      return { kind: "resolved", archetype: "dashboard", confidence: 0.64 };
    }
    if (matchesAny(description, TOOL_CALL_PATTERNS)) {
      return { kind: "resolved", archetype: "builder", confidence: 0.64 };
    }
    if (matchesAny(description, INSTRUCTION_PATTERNS)) {
      return { kind: "resolved", archetype: "workspace", confidence: 0.62 };
    }
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
