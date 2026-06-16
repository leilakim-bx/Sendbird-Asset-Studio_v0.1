import { conceptUiSamples } from "./samples";
import {
  parseSceneSpec,
  type ActionTrailSpec,
  type AutonomyMatrixSpec,
  type ChannelMatrixSpec,
  type ConceptUiArchetype,
  type ControlPanelSpec,
  type EvaluationScorecardSpec,
  type ImprovementSignalSpec,
  type InstructionSectionSpec,
  type IntegrationHealthSpec,
  type KnowledgeCoverageSpec,
  type LogicBlockSpec,
  type ReviewQueueSpec,
  type SceneSpec,
  type ToolCallListSpec,
  type ValidationLoopSpec,
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

export type ProductVisualRecipeId = "response-card" | "approval-modal";

export type ProductVisualRecipe = {
  id: ProductVisualRecipeId;
  label: string;
  description: string;
  reason: string;
  archetype: ConceptUiArchetype;
  confidence: number;
};

export type GenerateSpecInput = {
  description: string;
  uiTextLanguage: UiTextLanguage;
  forcedArchetype?: ConceptUiArchetype;
  recipeId?: ProductVisualRecipeId;
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
    /workflow builder/i,
    /workflow/i,
    /automation/i,
    /canvas/i,
    /\brule/i,
    /actionbook/i,
    /flow editor/i,
    /node palette/i,
    /trigger node/i,
    /condition node/i,
    /워크플로우/,
    /자동화/,
    /룰/,
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
  /governance/i,
  /enterprise governance/i,
  /full visibility/i,
  /visibility into outcomes/i,
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
  /거버넌스/,
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

const ACTION_TRAIL_PATTERNS = [
  /ai action trails?/i,
  /action trails?/i,
  /action logs?/i,
  /agent activity/i,
  /activity trails?/i,
  /audit trails?/i,
  /resolution flow/i,
  /support resolution/i,
  /agent flow/i,
  /agent steps?/i,
  /visible agent steps?/i,
  /procedure[-\s]?trained/i,
  /trained agent/i,
  /triage flow/i,
  /handoff flow/i,
  /approval flow/i,
  /looked up/i,
  /drafted .*approval/i,
  /paused.*approval/i,
  /requires agent approval/i,
  /approval gate/i,
  /행동 로그/,
  /액션 로그/,
  /작업 내역/,
  /승인 게이트/,
];

const IMPROVEMENT_SIGNAL_PATTERNS = [
  /automated agent improvement/i,
  /agent improvement/i,
  /continuous(?:ly)? turning/i,
  /production signals?/i,
  /production insight/i,
  /informed updates?/i,
  /proposed updates?/i,
  /suggested updates?/i,
  /update suggestions?/i,
  /detected issue/i,
  /quality drift/i,
  /handoff spike/i,
  /failure rate/i,
  /개선/,
  /운영 신호/,
  /업데이트 제안/,
];

const VALIDATION_LOOP_PATTERNS = [
  /self[-\s]?validation/i,
  /validation loop/i,
  /testing loop/i,
  /iterate(?:s|d|ion)? until tests pass/i,
  /tests? pass/i,
  /run tests?/i,
  /proposed updates?.*tests?/i,
  /simulation loop/i,
  /검증/,
  /테스트 통과/,
  /반복 테스트/,
];

const CONTROL_PANEL_PATTERNS = [
  /full confidence/i,
  /you(?:'|’)re in control/i,
  /\bin control\b/i,
  /fully manage/i,
  /manage yourself/i,
  /self[-\s]?service/i,
  /configure|configuring|configuration/i,
  /customi[sz](?:e|ing|ation)/i,
  /tone/i,
  /behaviou?r/i,
  /without engineering/i,
  /no[-\s]?code/i,
  /engineering resources/i,
  /experiment and learn/i,
  /never need to contact/i,
  /직접 관리/,
  /셀프서비스/,
  /설정/,
  /톤/,
  /행동/,
  /엔지니어/,
];

const AUTONOMY_MATRIX_PATTERNS = [
  /autonomy/i,
  /autonomous/i,
  /agent permissions?/i,
  /permission level/i,
  /human gate/i,
  /act with approval/i,
  /where .*agent .*act/i,
  /scope of action/i,
  /observe .*advise .*act/i,
  /자율/,
  /권한/,
  /승인 단계/,
];

const KNOWLEDGE_COVERAGE_PATTERNS = [
  /knowledge coverage/i,
  /coverage gaps?/i,
  /missing (?:article|source|knowledge)/i,
  /stale (?:source|article|knowledge)/i,
  /source health/i,
  /unanswered topics?/i,
  /content gaps?/i,
  /지식 커버리지/,
  /누락된 지식/,
  /오래된 문서/,
];

const EVALUATION_SCORECARD_PATTERNS = [
  /evaluation scorecard/i,
  /eval(?:uation)?s?/i,
  /quality scorecard/i,
  /hallucination/i,
  /policy check/i,
  /scenario pass/i,
  /pass rate/i,
  /response quality/i,
  /평가/,
  /스코어카드/,
  /환각/,
];

const INTEGRATION_HEALTH_PATTERNS = [
  /integration health/i,
  /connector health/i,
  /sync status/i,
  /last synced/i,
  /crm/i,
  /zendesk/i,
  /salesforce/i,
  /shopify/i,
  /data sync/i,
  /연동 상태/,
  /동기화/,
];

const CHANNEL_MATRIX_PATTERNS = [
  /channel matrix/i,
  /all channels/i,
  /every customer channel/i,
  /omnichannel/i,
  /voice.*chat|chat.*voice/i,
  /chat.*email|email.*chat/i,
  /voice.*email|email.*voice/i,
  /slack.*email|email.*slack/i,
  /social.*chat|chat.*social/i,
  /whatsapp.*chat|chat.*whatsapp/i,
  /채널/,
  /보이스.*채팅|채팅.*보이스/,
  /이메일.*채팅|채팅.*이메일/,
];

const EXPLICIT_BUILDER_PATTERNS = [
  /workflow builder/i,
  /workflow editor/i,
  /flow editor/i,
  /canvas/i,
  /node palette/i,
  /trigger node/i,
  /condition node/i,
  /actionbook/i,
  /rule editor/i,
  /rule editing/i,
  /branching logic/i,
  /drag(?:-| )and(?:-| )drop/i,
  /no[-\s]?code workflow/i,
  /워크플로우 빌더/,
  /캔버스/,
  /노드/,
  /액션북/,
];

const DASHBOARD_KIT_FLOW_PATTERNS = [
  /resolution flow/i,
  /support resolution/i,
  /customer resolution/i,
  /agent flow/i,
  /agent steps?/i,
  /visible agent steps?/i,
  /procedure[-\s]?trained/i,
  /trained agent/i,
  /procedure flow/i,
  /triage flow/i,
  /handoff flow/i,
  /approval flow/i,
  /review flow/i,
  /outcome flow/i,
  /플로우/,
  /절차/,
];

const CONVERSATION_SEARCH_PATTERNS = [
  /conversation search/i,
  /search(?:es|ing)? conversations?/i,
  /find conversations?/i,
  /conversation filters?/i,
  /filter(?:ing|s)? .*conversations?/i,
  /keywords?/i,
  /customer attributes?/i,
  /what customers said/i,
  /who they are/i,
  /buried insights?/i,
  /검색/,
  /필터/,
  /고객 속성/,
];

const RESPONSE_CARD_PATTERNS = [
  /prepared response/i,
  /ai[-\s]?prepared/i,
  /draft(?:ed)? repl(?:y|ies)/i,
  /draft(?:ed)? response/i,
  /suggest(?:ed)? response/i,
  /reply draft/i,
  /send as[-\s]?is/i,
  /knowledge sources?/i,
  /sources? used/i,
  /reviewer/i,
  /응답/,
  /답변/,
  /초안/,
  /지식 소스/,
];

const APPROVAL_MOMENT_PATTERNS = [
  /approval/i,
  /approve/i,
  /gate/i,
  /paused/i,
  /requires agent approval/i,
  /action trails?/i,
  /looked up/i,
  /billing dispute/i,
  /refund/i,
  /승인/,
  /게이트/,
  /보류/,
  /환불/,
];

function clampText(value: string, max: number): string {
  const cleaned = value.replace(/\s+/g, " ").trim();
  if (cleaned.length <= max) return cleaned;
  return `${cleaned.slice(0, max - 3).trimEnd()}...`;
}

const RESPONSE_CARD_COPY_LIMITS = {
  title: 34,
  reviewer: 24,
  response: 150,
  source: 36,
  match: 10,
  action: 12,
} as const;

const DETAILS_PANEL_COPY_LIMITS = {
  detailType: 42,
  detailName: 36,
  detailStatus: 14,
  detailTime: 16,
  activityTag: 24,
  activityText: 64,
} as const;

function needsLogicBlock(description: string): boolean {
  return LOGIC_PATTERNS.some((pattern) => pattern.test(description));
}

function matchesAny(description: string, patterns: RegExp[]): boolean {
  return patterns.some((pattern) => pattern.test(description));
}

function prefersDashboardKitFlow(description: string): boolean {
  return matchesAny(description, DASHBOARD_KIT_FLOW_PATTERNS) && !matchesAny(description, EXPLICIT_BUILDER_PATTERNS);
}

function prefersConversationSearch(description: string): boolean {
  return matchesAny(description, CONVERSATION_SEARCH_PATTERNS);
}

function prefersResponseCard(description: string): boolean {
  return matchesAny(description, RESPONSE_CARD_PATTERNS);
}

function prefersApprovalMoment(description: string): boolean {
  return matchesAny(description, APPROVAL_MOMENT_PATTERNS) || matchesAny(description, ACTION_TRAIL_PATTERNS);
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
  const mentionsGovernance = /governance|enterprise|full visibility|visibility into outcomes|거버넌스/i.test(description);
  const mentionsQuality = /testing|regression|simulation|\bqa\b|quality assurance|observability|alert|experiment|manual inspection|reliability|테스트|품질|알림|실험/i.test(description);
  if (mentionsGovernance) {
    return {
      slotId: "review-governance-approval",
      title: "Governance review",
      summary: "Human approvals keep proposed agent updates visible before they affect production behavior.",
      items: [
        {
          label: "Approval gate",
          detail: "A manager reviews the proposed update, test evidence, and expected customer impact.",
          status: "Needs approval",
          tone: "warn",
        },
        {
          label: "Outcome log",
          detail: "Approved, rejected, and published outcomes stay visible for enterprise governance.",
          status: "Visible",
          tone: "good",
        },
      ],
    };
  }
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

function buildImprovementSignal(description: string): ImprovementSignalSpec {
  const mentionsHandoff = /handoff|escalat|human loop|상담|이관/i.test(description);
  const mentionsFailure = /fail|error|drop|regression|quality drift|실패|오류/i.test(description);
  const signal = mentionsHandoff
    ? "Handoff volume increased 18%"
    : mentionsFailure
      ? "Resolution quality drift detected"
      : "Production signal found a behavior gap";

  return {
    slotId: "improvement-production-signal",
    title: "Improvement signal",
    signal,
    proposal: "Propose a targeted update to the affected policy, workflow, or response path.",
    impact: "Expected to reduce repeat contacts while keeping the change reviewable before publish.",
    confidence: "82%",
    status: "Suggested",
    tone: "ai",
  };
}

function buildValidationLoop(description: string): ValidationLoopSpec {
  const mentionsRegression = /regression|saved scenarios?|test suite|qa|회귀|시나리오/i.test(description);
  return {
    slotId: "validation-test-loop",
    title: "Validation loop",
    summary: "Proposed updates iterate through test scenarios until the change is safe to approve.",
    iterationCount: "3 runs",
    passRate: "96% pass",
    status: "Ready",
    steps: [
      {
        label: "Draft update",
        detail: "Create a proposed change from the production signal.",
        status: "Done",
        tone: "good",
      },
      {
        label: mentionsRegression ? "Run regression" : "Run tests",
        detail: mentionsRegression
          ? "Replay saved scenarios against the proposed workflow update."
          : "Validate the update against the relevant test loop.",
        status: "Pass",
        tone: "good",
      },
      {
        label: "Send for review",
        detail: "Package test evidence and expected impact for approval.",
        status: "Next",
        tone: "ai",
      },
    ],
  };
}

function buildControlPanel(description: string): ControlPanelSpec {
  const mentionsExperiment = /experiment|learn|test|실험|학습/i.test(description);
  return {
    slotId: "control-self-service",
    title: "Self-service controls",
    summary: "Teams can manage tone, behavior, knowledge, and rollout settings without engineering support.",
    items: [
      {
        label: "Tone",
        value: "Brand voice",
        detail: "Adjust how the agent sounds across customer conversations.",
        status: "Editable",
        tone: "ai",
      },
      {
        label: "Behavior",
        value: "Live rules",
        detail: "Change escalation, handoff, and response behavior from the UI.",
        status: "No code",
        tone: "good",
      },
      {
        label: "Knowledge",
        value: "Trusted sources",
        detail: "Choose which policies and articles the agent can use.",
        status: "Managed",
        tone: "neutral",
      },
      {
        label: mentionsExperiment ? "Learning" : "Rollout",
        value: mentionsExperiment ? "Fast tests" : "Controlled publish",
        detail: mentionsExperiment
          ? "Experiment with changes and learn from outcomes quickly."
          : "Publish controlled changes without waiting on engineering.",
        status: "Ready",
        tone: "good",
      },
    ],
    footer: "Every configurable area stays visible, owned, and reversible for the CX team.",
  };
}

function buildAutonomyMatrix(description: string): AutonomyMatrixSpec {
  const mentionsApproval = /approval|human gate|review|승인|검토/i.test(description);
  return {
    slotId: "autonomy-action-scope",
    title: "Autonomy matrix",
    summary: "Shows which actions the agent can observe, suggest, approve, or run on its own.",
    levels: [
      {
        label: "Observe",
        scope: "Read customer context",
        detail: "Agent can summarize data without changing customer state.",
        status: "Safe",
        tone: "neutral",
      },
      {
        label: "Advise",
        scope: "Draft next action",
        detail: "Agent recommends a response or workflow step for review.",
        status: "Draft",
        tone: "ai",
      },
      {
        label: "Approve",
        scope: "Human-gated action",
        detail: "Refunds, changes, or account actions pause for approval.",
        status: mentionsApproval ? "Gate" : "Review",
        tone: "warn",
      },
      {
        label: "Autonomous",
        scope: "Low-risk updates",
        detail: "Agent completes safe, reversible actions inside policy.",
        status: "Live",
        tone: "good",
      },
    ],
    guardrail: "Risky or irreversible actions always route through a visible approval gate.",
  };
}

function buildKnowledgeCoverage(description: string): KnowledgeCoverageSpec {
  const mentionsStale = /stale|old|오래된/i.test(description);
  return {
    slotId: "knowledge-coverage-map",
    title: "Knowledge coverage",
    summary: "Track which topics are ready for automation and where source gaps still need work.",
    topics: [
      {
        label: "Billing",
        coverage: "94%",
        detail: "Refund and dispute policies are mapped to agent answers.",
        status: "Ready",
        tone: "good",
      },
      {
        label: "Shipping",
        coverage: "82%",
        detail: "Carrier delay edge cases need a source update.",
        status: mentionsStale ? "Stale" : "Watch",
        tone: "warn",
      },
      {
        label: "Account",
        coverage: "76%",
        detail: "Password and identity flows have partial coverage.",
        status: "Gap",
        tone: "ai",
      },
    ],
    freshness: "Missing and stale sources become reviewable tasks instead of hidden prompt risk.",
  };
}

function buildEvaluationScorecard(description: string): EvaluationScorecardSpec {
  const mentionsVoice = /voice|latency|보이스/i.test(description);
  return {
    slotId: "evaluation-quality-scorecard",
    title: "Evaluation scorecard",
    summary: "Summarizes saved scenario tests, policy checks, and quality signals before launch.",
    checks: [
      {
        label: "Policy fit",
        score: "98%",
        detail: "Responses match approved refund and escalation rules.",
        status: "Pass",
        tone: "good",
      },
      {
        label: "Grounding",
        score: "96%",
        detail: "Claims are supported by trusted knowledge sources.",
        status: "Pass",
        tone: "good",
      },
      {
        label: mentionsVoice ? "Voice latency" : "Regression",
        score: mentionsVoice ? "780ms" : "92%",
        detail: mentionsVoice
          ? "Voice responses stay below the live interaction target."
          : "Saved scenarios pass after the proposed update.",
        status: mentionsVoice ? "Live" : "Ready",
        tone: "ai",
      },
    ],
    verdict: "Only passing checks can move from draft to production rollout.",
  };
}

function buildIntegrationHealth(description: string): IntegrationHealthSpec {
  const mentionsMcp = /mcp/i.test(description);
  return {
    slotId: "integration-health-status",
    title: "Integration health",
    summary: "Monitor the systems the agent depends on before it reads data or takes action.",
    systems: [
      {
        name: "CRM",
        metric: "99.9%",
        detail: "Customer profile and account fields are syncing normally.",
        status: "Live",
        tone: "good",
      },
      {
        name: mentionsMcp ? "MCP" : "Orders",
        metric: "1.1s",
        detail: mentionsMcp ? "Tool bridge latency is inside the action target." : "Lookup latency is inside the action target.",
        status: "Ready",
        tone: "ai",
      },
      {
        name: "Billing",
        metric: "2 alerts",
        detail: "Payment action failures are routed to review.",
        status: "Watch",
        tone: "warn",
      },
    ],
    lastSync: "Synced 4m ago",
  };
}

function buildChannelMatrix(description: string): ChannelMatrixSpec {
  const includesSlack = /slack/i.test(description);
  return {
    slotId: "channel-performance-matrix",
    title: "Channel matrix",
    summary: "Compare agent performance across customer channels from one operational view.",
    channels: [
      {
        channel: "Voice",
        volume: "1.8k convos",
        resolution: "71% solved",
        latency: "0.8s",
        tone: "ai",
      },
      {
        channel: "Chat",
        volume: "4.2k convos",
        resolution: "84% solved",
        latency: "1.4s",
        tone: "good",
      },
      {
        channel: "Email",
        volume: "920 cases",
        resolution: "68% solved",
        latency: "12m",
        tone: "neutral",
      },
      {
        channel: includesSlack ? "Slack" : "Social",
        volume: includesSlack ? "340 threads" : "510 mentions",
        resolution: includesSlack ? "76% solved" : "62% solved",
        latency: includesSlack ? "2.1s" : "5m",
        tone: includesSlack ? "good" : "warn",
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

function buildActionTrail(description: string): ActionTrailSpec {
  const mentionsRefund = /refund|billing dispute|charge|payment|환불|결제/i.test(description);
  const mentionsBooking = /booking|flight|rebook|reservation|예약|항공/i.test(description);
  const objectLabel = mentionsBooking ? "booking #FL-4821" : mentionsRefund ? "billing case #1052" : "customer context";
  const policyLabel = mentionsBooking ? "rebooking policy" : mentionsRefund ? "refund policy" : "policy guardrail";
  const draftedLabel = mentionsBooking ? "Drafted rebooking option" : mentionsRefund ? "Drafted refund outcome" : "Prepared next action";

  return {
    slotId: "action-trail-agent-steps",
    title: "AI action trail",
    summary: "Every agent step is visible before a gated customer-impacting action is approved.",
    steps: [
      {
        label: `Looked up ${objectLabel}`,
        detail: "System context loaded for this customer.",
        duration: "0.8s",
        status: "Done",
        tone: "good",
      },
      {
        label: `Checked ${policyLabel}`,
        detail: "Relevant rule matched the active case.",
        duration: "1.2s",
        status: "Done",
        tone: "good",
      },
      {
        label: draftedLabel,
        detail: "Proposed action is ready for review.",
        duration: "2.1s",
        status: "Done",
        tone: "good",
      },
      {
        label: "Paused for approval",
        detail: "Customer-impacting action requires an agent gate.",
        status: "Gate",
        tone: "warn",
      },
    ],
    gate: {
      title: mentionsRefund ? "Approve refund of $89.00?" : mentionsBooking ? "Approve rebooking change?" : "Approve proposed action?",
      detail: mentionsRefund ? "To Visa ending 4242" : mentionsBooking ? "Customer itinerary will update" : "Human approval required before publish",
      primaryAction: "Approve",
      secondaryAction: "Modify",
    },
  };
}

function applyReusableBlocks(spec: SceneSpec, description: string): SceneSpec {
  const addLogic = needsLogicBlock(description);
  const addActionTrail = matchesAny(description, ACTION_TRAIL_PATTERNS);
  const addImprovement = matchesAny(description, IMPROVEMENT_SIGNAL_PATTERNS);
  const addValidation = matchesAny(description, VALIDATION_LOOP_PATTERNS);
  const addControlPanel = matchesAny(description, CONTROL_PANEL_PATTERNS);
  const addAutonomyMatrix = matchesAny(description, AUTONOMY_MATRIX_PATTERNS);
  const addKnowledgeCoverage = matchesAny(description, KNOWLEDGE_COVERAGE_PATTERNS);
  const addEvaluationScorecard = matchesAny(description, EVALUATION_SCORECARD_PATTERNS);
  const addIntegrationHealth = matchesAny(description, INTEGRATION_HEALTH_PATTERNS);
  const addChannelMatrix = matchesAny(description, CHANNEL_MATRIX_PATTERNS);
  const addInstruction = matchesAny(description, INSTRUCTION_PATTERNS);
  const addReview = matchesAny(description, REVIEW_PATTERNS);
  const addToolCalls = matchesAny(description, TOOL_CALL_PATTERNS);

  if (
    !addLogic &&
    !addActionTrail &&
    !addImprovement &&
    !addValidation &&
    !addControlPanel &&
    !addAutonomyMatrix &&
    !addKnowledgeCoverage &&
    !addEvaluationScorecard &&
    !addIntegrationHealth &&
    !addChannelMatrix &&
    !addInstruction &&
    !addReview &&
    !addToolCalls
  ) return spec;

  const next = cloneSpec(spec);
  if (
    next.archetype === "dashboard" ||
    next.archetype === "builder" ||
    next.archetype === "modal" ||
    next.archetype === "workspace"
  ) {
    if (addLogic) next.content.logicBlocks = [buildLogicBlock(description)];
    if (addActionTrail) next.content.actionTrails = [buildActionTrail(description)];
    if (addImprovement) next.content.improvementSignals = [buildImprovementSignal(description)];
    if (addValidation) next.content.validationLoops = [buildValidationLoop(description)];
    if (addControlPanel) next.content.controlPanels = [buildControlPanel(description)];
    if (addAutonomyMatrix) next.content.autonomyMatrices = [buildAutonomyMatrix(description)];
    if (addKnowledgeCoverage) next.content.knowledgeCoverages = [buildKnowledgeCoverage(description)];
    if (addEvaluationScorecard) next.content.evaluationScorecards = [buildEvaluationScorecard(description)];
    if (addIntegrationHealth) next.content.integrationHealths = [buildIntegrationHealth(description)];
    if (addChannelMatrix) next.content.channelMatrices = [buildChannelMatrix(description)];
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

function conversationSearchTitle(description: string): string {
  const titleMatch = description.match(/^\s*([A-Z][A-Za-z0-9 ]{3,32}?)\s+(?:brings|lets|adds|helps|enables)\b/);
  if (titleMatch?.[1]) return clampText(titleMatch[1], 56);
  return "Conversation Search";
}

function conversationSearchSpec(description: string): SceneSpec {
  return parseSceneSpec({
    archetype: "table",
    theme: "light",
    content: {
      productName: "delight.ai Search",
      title: conversationSearchTitle(description),
      subtitle: "Search what customers said and who they are, then turn the right conversations into action.",
      toolbar: {
        searchPlaceholder: "Search keywords or customer attributes",
        filters: ["Keyword match", "Customer plan", "Segment", "Last 30 days"],
        bulkSelect: true,
      },
      columns: [
        { key: "conversation", label: "Conversation", width: 280 },
        { key: "customer", label: "Customer", width: 210 },
        { key: "attribute", label: "Attribute", width: 150 },
        { key: "signal", label: "Signal", width: 190 },
        { key: "updated", label: "Updated", width: 130 },
      ],
      rows: [
        {
          slotId: "conversation-search-1",
          cells: [
            { kind: "text", value: "Asked about refund timeline" },
            { kind: "person", name: "Maya Chen", detail: "Enterprise plan" },
            { kind: "badge", value: "VIP", tone: "ai" },
            { kind: "text", value: "High-intent match" },
            { kind: "date", value: "2m ago" },
          ],
        },
        {
          slotId: "conversation-search-2",
          cells: [
            { kind: "text", value: "Mentions renewal concern" },
            { kind: "person", name: "Ava Brooks", detail: "At-risk segment" },
            { kind: "badge", value: "At risk", tone: "warn" },
            { kind: "text", value: "Retention signal" },
            { kind: "date", value: "Today" },
          ],
        },
        {
          slotId: "conversation-search-3",
          cells: [
            { kind: "text", value: "Repeated login issue" },
            { kind: "person", name: "Luis Easton", detail: "Admin user" },
            { kind: "badge", value: "Admin", tone: "neutral" },
            { kind: "text", value: "Support trend" },
            { kind: "date", value: "Today" },
          ],
        },
        {
          slotId: "conversation-search-4",
          cells: [
            { kind: "text", value: "Compared competitor pricing" },
            { kind: "person", name: "Nora Patel", detail: "Premium account" },
            { kind: "badge", value: "Premium", tone: "good" },
            { kind: "text", value: "Expansion cue" },
            { kind: "date", value: "Yesterday" },
          ],
        },
        {
          slotId: "conversation-search-5",
          cells: [
            { kind: "text", value: "Positive onboarding feedback" },
            { kind: "person", name: "Theo Park", detail: "Starter plan" },
            { kind: "badge", value: "Starter", tone: "neutral" },
            { kind: "text", value: "Advocacy lead" },
            { kind: "date", value: "Jun 12" },
          ],
        },
        {
          slotId: "conversation-search-6",
          cells: [
            { kind: "text", value: "Shipping delay thread" },
            { kind: "person", name: "Amara Stone", detail: "Loyalty member" },
            { kind: "badge", value: "Loyalty", tone: "good" },
            { kind: "text", value: "Escalation ready" },
            { kind: "date", value: "Jun 11" },
          ],
        },
      ],
    },
    modifiers: {
      aiCallout: {
        targetSlotId: "conversation-search-1",
        label: "Matched result",
        description: "Keyword and customer attributes combine to surface the exact conversation.",
      },
      highlightedSlotId: "conversation-search-1",
    },
  });
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function extractBriefField(description: string, labels: string[]): string | null {
  for (const label of labels) {
    const pattern = new RegExp(`(?:^|\\n)\\s*${escapeRegExp(label)}\\s*:\\s*(.+)`, "i");
    const match = description.match(pattern);
    const value = match?.[1]?.trim();
    if (value) return value;
  }
  return null;
}

function extractSourceFields(description: string): string[] {
  return Array.from(description.matchAll(/(?:^|\n)\s*Source(?:\s*\d+)?\s*:\s*(.+)/gi))
    .map((match) => match[1]?.trim())
    .filter((value): value is string => !!value)
    .slice(0, 2);
}

function firstBriefSentence(description: string): string {
  const guidanceCleaned = description
    .replace(/^\s*(Feature|User|Product surface|Key proof|Avoid)\s*:\s*/gim, "")
    .replace(/\s+/g, " ")
    .trim();
  const firstSentence = guidanceCleaned.split(/(?<=[.!?])\s+/)[0]?.trim() || guidanceCleaned;
  return clampText(firstSentence, 130);
}

function sourceValue(label: string, index: number): string {
  if (label.includes("|")) {
    const [sourceLabel, match] = label.split("|").map((part) => part.trim());
    return `${clampText(sourceLabel || label, RESPONSE_CARD_COPY_LIMITS.source)}|${clampText(match || `${index === 0 ? "98" : "95"}% match`, RESPONSE_CARD_COPY_LIMITS.match)}`;
  }
  return `${clampText(label, RESPONSE_CARD_COPY_LIMITS.source)}|${index === 0 ? "98" : "95"}% match`;
}

function responseCardSources(description: string): string[] {
  const explicitSources = extractSourceFields(description);
  if (explicitSources.length > 0) {
    const normalized = explicitSources.map((source, index) => sourceValue(source, index));
    return normalized.length === 1 ? [normalized[0], sourceValue("Customer context", 1)] : normalized;
  }

  if (prefersConversationSearch(description)) {
    return ["Conversation filters|98% match", "Customer attributes|95% match"];
  }

  if (/booking|flight|rebook|reservation|itinerary|loyalty|예약|항공/i.test(description)) {
    return ["Rebooking policy v3.2|98% match", "Loyalty tier benefits|95% match"];
  }

  if (/refund|billing dispute|charge|payment|invoice|환불|결제/i.test(description)) {
    return ["Refund policy|98% match", "Billing dispute history|95% match"];
  }

  if (/cancel|membership|subscription|plan|해지|구독/i.test(description)) {
    return ["Cancellation policy|98% match", "Customer subscription profile|95% match"];
  }

  if (/resolve needs|single interaction|handoff|follow[-\s]?ups?|repeated calls?/i.test(description)) {
    return ["Resolution procedure|98% match", "Conversation context|95% match"];
  }

  if (/procedure|knowledge|source|training|guardrail|policy|지식|절차|정책/i.test(description)) {
    return ["Knowledge source|98% match", "Policy guardrails|95% match"];
  }

  return ["Knowledge base article|98% match", "Customer context|95% match"];
}

function responseCardBody(description: string): string {
  const explicitResponse = extractBriefField(description, ["Response", "Reply", "Message", "Draft", "Main content"]);
  if (explicitResponse) return clampText(explicitResponse, RESPONSE_CARD_COPY_LIMITS.response);

  const keyProof = extractBriefField(description, ["Key proof", "Proof point", "Outcome"]);
  if (keyProof) {
    return clampText(`I checked the relevant customer context and source evidence. ${keyProof}`, RESPONSE_CARD_COPY_LIMITS.response);
  }

  if (prefersConversationSearch(description)) {
    return "I found the right conversations by matching what customers said with who they are, so the buried insight is ready for action.";
  }

  if (/booking|flight|rebook|reservation|itinerary|loyalty|예약|항공/i.test(description)) {
    return "Hi Maria, great news. I've found a flight to LAX on March 18 at your preferred time. Since you're a Gold loyalty member, the change fee is waived.";
  }

  if (/refund|billing dispute|charge|payment|invoice|환불|결제/i.test(description)) {
    return "I checked the refund policy and billing history, then prepared the safest next step for agent review before any customer-impacting action.";
  }

  if (/cancel|membership|subscription|plan|해지|구독/i.test(description)) {
    return "I checked the cancellation policy and customer plan details, then prepared a response the agent can review before sending.";
  }

  if (/resolve needs|single interaction|handoff|follow[-\s]?ups?|repeated calls?/i.test(description)) {
    return "I gathered the customer context, policy, and next action in one pass so the agent can resolve the request without another handoff.";
  }

  const summary = firstBriefSentence(description);
  return clampText(`I reviewed the request and source evidence, then prepared a response for: ${summary}`, RESPONSE_CARD_COPY_LIMITS.response);
}

function responseCardTitle(description: string): string {
  const explicitTitle = extractBriefField(description, ["Title", "Card title"]);
  if (explicitTitle) return clampText(explicitTitle, RESPONSE_CARD_COPY_LIMITS.title);
  if (/prepared response|draft(?:ed)? response|reply draft|suggest(?:ed)? response/i.test(description)) {
    return "AI-prepared response";
  }
  const titleMatch = description.match(/^\s*([A-Z][A-Za-z0-9 -]{3,32}?)\s+(?:brings|lets|adds|helps|enables|uses)\b/);
  if (titleMatch?.[1]) return clampText(`${titleMatch[1]} response`, RESPONSE_CARD_COPY_LIMITS.title);
  return "AI-prepared response";
}

function aiResponseCardSpec(description: string): SceneSpec {
  const title = responseCardTitle(description);
  const responseText = responseCardBody(description);
  const sources = responseCardSources(description);
  const reviewer = extractBriefField(description, ["Reviewer", "Owner"]) ?? "Emily Choi";
  const primaryCta = extractBriefField(description, ["Primary CTA", "Primary action"]) ?? "Send as-is";
  const secondaryCta = extractBriefField(description, ["Secondary CTA", "Secondary action"]) ?? "Edit first";

  return parseSceneSpec({
    archetype: "modal",
    theme: "light",
    content: {
      productName: "delight.ai",
      title,
      subtitle: "A compact review card with the generated answer, evidence, and final send action.",
      background: {
        type: "inbox",
        title: "Conversation",
        items: [
          "Customer request",
          "AI draft",
          "Source check",
          "Reviewer approval",
        ],
      },
      modal: {
        slotId: "moment-ai-response",
        kind: "ai-result",
        eyebrow: "Generated draft",
        title,
        description: "Review the generated response and source evidence before sending.",
        fields: [
          { slotId: "moment-reviewer", label: "Reviewer", value: clampText(reviewer, RESPONSE_CARD_COPY_LIMITS.reviewer) },
          { slotId: "moment-response", label: "Response", value: clampText(responseText, RESPONSE_CARD_COPY_LIMITS.response) },
          { slotId: "moment-source-1", label: "Source", value: sourceValue(sources[0] ?? "Knowledge base article", 0) },
          { slotId: "moment-source-2", label: "Source", value: sourceValue(sources[1] ?? "Customer context", 1) },
        ],
        actions: [
          { label: clampText(secondaryCta, RESPONSE_CARD_COPY_LIMITS.action), tone: "secondary" },
          { label: clampText(primaryCta, RESPONSE_CARD_COPY_LIMITS.action), tone: "primary" },
        ],
      },
    },
    modifiers: {
      aiCallout: {
        targetSlotId: "moment-response",
        label: "Ready to review",
        description: "The card keeps only the generated response and source proof visible.",
      },
    },
  });
}

function approvalMomentSpec(description: string): SceneSpec {
  const trail = buildActionTrail(description);
  const mentionsBooking = /booking|flight|rebook|예약|항공/i.test(description);
  const mentionsBilling = /billing|refund|payment|charge|dispute|환불|결제/i.test(description);
  const info = {
    type: mentionsBooking
      ? "Flight cancellation — multi-step"
      : mentionsBilling
        ? "Billing dispute — review"
        : "Customer request — multi-step",
    name: mentionsBooking || mentionsBilling ? "Refund Approval Request" : "Resolution Review Request",
    status: "RESOLUTION",
    time: mentionsBooking ? "12 minutes" : "8 minutes",
  };
  const activityRows = mentionsBooking
    ? [
        { tag: "Steward triggered", text: "Flight cancellation workflow initiated" },
        { tag: "API call", text: "Booking system — reservation pulled, policy check..." },
        { tag: "Voice call", text: "United Airlines rebooking desk — call duration 3:42" },
        { tag: "Email sent", text: "Marriott Denver — extension confirmed for Jun 5" },
      ]
    : [
        { tag: "Steward triggered", text: "Customer resolution workflow initiated" },
        { tag: "Policy check", text: trail.steps[0]?.label ?? "Customer context and policy evidence reviewed" },
        { tag: "AI prepared", text: trail.steps[1]?.label ?? "Next action prepared for review" },
        { tag: "Agent review", text: "Final decision queued for a teammate" },
      ];
  return parseSceneSpec({
    archetype: "modal",
    theme: "light",
    content: {
      productName: "delight.ai Actions",
      title: trail.gate?.title ?? "Approve proposed action?",
      subtitle: "A compact approval moment with visible AI steps and a human gate.",
      background: {
        type: "inbox",
        title: "Case context",
        items: [
          "Customer request",
          "Tool lookup",
          "Policy check",
          "Drafted action",
        ],
      },
      modal: {
        slotId: "moment-approval",
        kind: "confirmation",
        eyebrow: "Steward details",
        title: "Steward details",
        description: "A cropped operational detail panel with information and activity history.",
        fields: [
          { slotId: "moment-show-information", label: "Show information", value: "true" },
          { slotId: "moment-detail-type", label: "Detail type", value: clampText(info.type, DETAILS_PANEL_COPY_LIMITS.detailType) },
          { slotId: "moment-detail-name", label: "Detail name", value: clampText(info.name, DETAILS_PANEL_COPY_LIMITS.detailName) },
          { slotId: "moment-detail-status", label: "Detail status", value: clampText(info.status, DETAILS_PANEL_COPY_LIMITS.detailStatus) },
          { slotId: "moment-detail-time", label: "Detail time", value: clampText(info.time, DETAILS_PANEL_COPY_LIMITS.detailTime) },
          ...activityRows.slice(0, 3).flatMap((row, index) => [
            { slotId: `moment-activity-${index + 1}-tag`, label: `Activity ${index + 1} tag`, value: clampText(row.tag, DETAILS_PANEL_COPY_LIMITS.activityTag) },
            { slotId: `moment-activity-${index + 1}-text`, label: `Activity ${index + 1} text`, value: clampText(row.text, DETAILS_PANEL_COPY_LIMITS.activityText) },
          ]),
        ],
        actions: [
          { label: trail.gate?.primaryAction ?? "Approve", tone: "primary" },
          { label: trail.gate?.secondaryAction ?? "Modify", tone: "secondary" },
        ],
      },
      actionTrails: [trail],
    },
    modifiers: {
      aiCallout: {
        targetSlotId: trail.slotId,
        label: "Human gate",
        description: "Visible steps make the approval decision clear without showing a full dashboard.",
      },
    },
  });
}

export function mapDescriptionToArchetype(text: string): ArchetypeChoice {
  const description = text.trim();
  if (prefersConversationSearch(description)) {
    return { kind: "resolved", archetype: "table", confidence: 0.9 };
  }

  if (prefersDashboardKitFlow(description)) {
    return { kind: "resolved", archetype: "dashboard", confidence: 0.82 };
  }

  const scores = conceptUiArchetypes.map((archetype) => ({
    archetype,
    hits: countMatches(description, KEYWORDS[archetype]),
  }));
  const ranked = [...scores].sort((a, b) => b.hits - a.hits);
  const top = ranked[0];
  const second = ranked[1];
  const controlPanelOnly = matchesAny(description, CONTROL_PANEL_PATTERNS);
  const operationalDashboardOnly =
    matchesAny(description, AUTONOMY_MATRIX_PATTERNS) ||
    matchesAny(description, KNOWLEDGE_COVERAGE_PATTERNS) ||
    matchesAny(description, EVALUATION_SCORECARD_PATTERNS) ||
    matchesAny(description, INTEGRATION_HEALTH_PATTERNS) ||
    matchesAny(description, CHANNEL_MATRIX_PATTERNS);

  if ((controlPanelOnly || operationalDashboardOnly) && (!top || top.hits <= 1)) {
    return { kind: "resolved", archetype: "dashboard", confidence: 0.66 };
  }

  if (!top || top.hits === 0) {
    if (needsLogicBlock(description)) {
      return { kind: "resolved", archetype: "builder", confidence: 0.66 };
    }
    if (matchesAny(description, ACTION_TRAIL_PATTERNS)) {
      return { kind: "resolved", archetype: "dashboard", confidence: 0.66 };
    }
    if (matchesAny(description, IMPROVEMENT_SIGNAL_PATTERNS) || matchesAny(description, VALIDATION_LOOP_PATTERNS)) {
      return { kind: "resolved", archetype: "dashboard", confidence: 0.66 };
    }
    if (operationalDashboardOnly) {
      return { kind: "resolved", archetype: "dashboard", confidence: 0.66 };
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

const PRODUCT_VISUAL_RECIPE_COPY: Record<ProductVisualRecipeId, Omit<ProductVisualRecipe, "confidence">> = {
  "response-card": {
    id: "response-card",
    label: "Card",
    description: "A single polished product card.",
    reason: "Use for an AI answer, search result, or evidence-backed summary.",
    archetype: "modal",
  },
  "approval-modal": {
    id: "approval-modal",
    label: "Details panel",
    description: "A cropped dashboard detail view.",
    reason: "Use for task history, approvals, gates, or operational details.",
    archetype: "modal",
  },
};

function recipeConfidence(score: number): number {
  return Math.min(0.95, Math.max(0.42, Number((score / 100).toFixed(2))));
}

export function recommendProductVisualRecipes(text: string): ProductVisualRecipe[] {
  const description = text.trim();
  if (!description) {
    return (["response-card", "approval-modal"] as ProductVisualRecipeId[]).map((id, index) => ({
      ...PRODUCT_VISUAL_RECIPE_COPY[id],
      confidence: recipeConfidence(index === 0 ? 54 : 22),
    }));
  }

  const scores: Record<ProductVisualRecipeId, number> = {
    "response-card": 54,
    "approval-modal": 22,
  };

  if (prefersConversationSearch(description)) {
    scores["response-card"] += 38;
  }

  if (prefersResponseCard(description)) {
    scores["response-card"] += 58;
  }

  if (prefersApprovalMoment(description) || prefersDashboardKitFlow(description) || matchesAny(description, REVIEW_PATTERNS)) {
    scores["approval-modal"] += 68;
    scores["response-card"] -= 8;
  }

  if (
    matchesAny(description, INSTRUCTION_PATTERNS) ||
    matchesAny(description, TOOL_CALL_PATTERNS) ||
    matchesAny(description, KNOWLEDGE_COVERAGE_PATTERNS) ||
    /\b(reply|response|draft|source|knowledge|review)\b/i.test(description)
  ) {
    scores["response-card"] += 18;
  }

  if (matchesAny(description, EXPLICIT_BUILDER_PATTERNS)) {
    scores["approval-modal"] += 58;
  }

  return (Object.keys(scores) as ProductVisualRecipeId[])
    .map((id) => ({
      ...PRODUCT_VISUAL_RECIPE_COPY[id],
      confidence: recipeConfidence(scores[id]),
    }))
    .sort((a, b) => b.confidence - a.confidence);
}

export const ruleBasedSpecProvider: SpecProvider = {
  analyze(input) {
    return mapDescriptionToArchetype(input.description);
  },

  async generate(input) {
    if (input.recipeId === "response-card") {
      return {
        spec: aiResponseCardSpec(input.description),
        source: "sample",
        provider: "rules",
        notice: "Rendered a compact response card.",
      };
    }
    if (input.recipeId === "approval-modal") {
      return {
        spec: approvalMomentSpec(input.description),
        source: "sample",
        provider: "rules",
        notice: "Rendered a compact details panel.",
      };
    }

    const choice = input.forcedArchetype
      ? { kind: "resolved" as const, archetype: input.forcedArchetype, confidence: 1 }
      : mapDescriptionToArchetype(input.description);
    const archetype = choice.kind === "resolved" ? choice.archetype : "inbox";
    if (archetype === "table" && prefersConversationSearch(input.description)) {
      return {
        spec: conversationSearchSpec(input.description),
        source: "sample",
        provider: "rules",
        notice: "Rendered a search results recipe.",
      };
    }
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
