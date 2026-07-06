import { mapDescriptionToArchetype, type ArchetypeChoice, type UiTextLanguage } from "./provider";
import { conceptUiSamples } from "./samples";
import type { ConceptUiArchetype, SceneSpec } from "./scene-spec";
import { conceptUiArchetypes } from "./slots";

const PIN_CONFIDENCE = 0.75;

export const archetypeDescriptions: Record<ConceptUiArchetype, string> = {
  inbox: "A support workspace with conversation list, message thread, and customer context panel.",
  dashboard: "KPI cards, chart grid, and small data table for metrics or monitoring.",
  builder: "Workflow/canvas editor with connected trigger, condition, action, and AI nodes.",
  table: "Data grid for records, queues, lists, reviews, or management workflows.",
  modal: "Focused form, confirmation, or AI-result modal over a dimmed app background.",
  workspace: "Three-column workspace with an editor panel, preview area, and AI agent tester.",
};

export const readableSceneSpecSchema = {
  commonTextLimits: {
    slotId: "string, 1-48 chars",
    shortText: "string, 1-24 chars",
    mediumText: "string, 1-40 chars",
    titleText: "string, 1-56 chars",
    bodyText: "string, 1-160 chars",
    longBodyText: "string, 1-220 chars",
  },
  reusableBlocks: {
    logicBlocks: {
      optional: true,
      appliesTo: "dashboard | builder | modal | workspace",
      description: "Use when a feature includes if/else, conditions, rules, branching, outcomes, or editable logic.",
      item: {
        slotId: "slotId",
        title: "mediumText",
        conditionLabel: "optional shortText, defaults to IF",
        condition: "string, 1-72 chars",
        description: "optional bodyText",
        outcomes: "array, min 2, max 3, each { label: shortText, action: bodyText, tone: neutral | good | warn | ai }",
      },
    },
    instructionSections: {
      optional: true,
      appliesTo: "dashboard | builder | modal | workspace",
      description: "Use for policies, playbooks, instructions, key points, when-to-use guidance, variables, or anchors.",
      item: {
        slotId: "slotId",
        title: "mediumText",
        eyebrow: "optional shortText",
        body: "bodyText",
        items: "array, min 2, max 4, each { label: shortText, text: bodyText, tone: neutral | good | warn | ai }",
        tags: "optional array of shortText, min 1, max 3",
      },
    },
    reviewQueues: {
      optional: true,
      appliesTo: "dashboard | builder | modal | workspace",
      description: "Use for approval, review, audit, human loop, escalation, or manager queue views.",
      item: {
        slotId: "slotId",
        title: "mediumText",
        summary: "bodyText",
        items: "array, min 2, max 4, each { label: mediumText, detail: bodyText, status: shortText, tone: neutral | good | warn | ai }",
      },
    },
    toolCallLists: {
      optional: true,
      appliesTo: "dashboard | builder | modal | workspace",
      description: "Use for tool calls, function calls, API lookups, webhooks, integrations, or action anchors.",
      item: {
        slotId: "slotId",
        title: "mediumText",
        summary: "optional bodyText",
        calls: "array, min 2, max 4, each { name: shortText, detail: bodyText, status: shortText, tone: neutral | good | warn | ai }",
      },
    },
    actionTrails: {
      optional: true,
      appliesTo: "dashboard | builder | modal | workspace",
      description: "Use for AI action trails, action logs, audit trails, visible agent steps, approval gates, or paused actions requiring human approval.",
      item: {
        slotId: "slotId",
        title: "mediumText",
        summary: "optional bodyText",
        steps: "array, min 2, max 4, each { label: mediumText, detail: optional bodyText, duration: optional string 1-12 chars, status: shortText, tone: neutral | good | warn | ai }",
        gate: "optional { title: mediumText, detail: bodyText, primaryAction: shortText, secondaryAction: shortText }",
      },
    },
    improvementSignals: {
      optional: true,
      appliesTo: "dashboard | builder | modal | workspace",
      description: "Use for production signals that become proposed agent updates or automated improvement suggestions.",
      item: {
        slotId: "slotId",
        title: "mediumText",
        signal: "mediumText",
        proposal: "bodyText",
        impact: "bodyText",
        confidence: "string, 1-12 chars",
        status: "shortText",
        tone: "neutral | good | warn | ai",
      },
    },
    validationLoops: {
      optional: true,
      appliesTo: "dashboard | builder | modal | workspace",
      description: "Use for self-validation, testing loops, simulations, and proposed updates that iterate until tests pass.",
      item: {
        slotId: "slotId",
        title: "mediumText",
        summary: "bodyText",
        iterationCount: "string, 1-12 chars",
        passRate: "string, 1-12 chars",
        status: "shortText",
        steps: "array, min 2, max 4, each { label: shortText, detail: bodyText, status: shortText, tone: neutral | good | warn | ai }",
      },
    },
    controlPanels: {
      optional: true,
      appliesTo: "dashboard | builder | modal | workspace",
      description: "Use for self-service configuration, no-code control, tone, behavior, knowledge, rollout, or experimentation settings.",
      item: {
        slotId: "slotId",
        title: "mediumText",
        summary: "bodyText",
        items: "array, min 2, max 4, each { label: shortText, value: mediumText, detail: bodyText, status: shortText, tone: neutral | good | warn | ai }",
        footer: "optional bodyText",
      },
    },
    autonomyMatrices: {
      optional: true,
      appliesTo: "dashboard | builder | modal | workspace",
      description: "Use for agent autonomy, permission levels, action scope, human gates, and approval boundaries.",
      item: {
        slotId: "slotId",
        title: "mediumText",
        summary: "bodyText",
        levels: "array, min 2, max 4, each { label: shortText, scope: mediumText, detail: bodyText, status: shortText, tone: neutral | good | warn | ai }",
        guardrail: "optional bodyText",
      },
    },
    knowledgeCoverages: {
      optional: true,
      appliesTo: "dashboard | builder | modal | workspace",
      description: "Use for knowledge coverage, source health, stale sources, missing articles, unanswered topics, or content gaps.",
      item: {
        slotId: "slotId",
        title: "mediumText",
        summary: "bodyText",
        topics: "array, min 2, max 4, each { label: shortText, coverage: string 1-12 chars, detail: bodyText, status: shortText, tone: neutral | good | warn | ai }",
        freshness: "optional bodyText",
      },
    },
    evaluationScorecards: {
      optional: true,
      appliesTo: "dashboard | builder | modal | workspace",
      description: "Use for evaluation scorecards, scenario pass rate, hallucination checks, policy checks, QA, or response quality.",
      item: {
        slotId: "slotId",
        title: "mediumText",
        summary: "bodyText",
        checks: "array, min 2, max 4, each { label: shortText, score: string 1-12 chars, detail: bodyText, status: shortText, tone: neutral | good | warn | ai }",
        verdict: "optional bodyText",
      },
    },
    integrationHealths: {
      optional: true,
      appliesTo: "dashboard | builder | modal | workspace",
      description: "Use for integration health, connector status, CRM/Zendesk/Salesforce/Shopify sync, API reliability, or data sync.",
      item: {
        slotId: "slotId",
        title: "mediumText",
        summary: "bodyText",
        systems: "array, min 2, max 4, each { name: shortText, metric: string 1-16 chars, detail: bodyText, status: shortText, tone: neutral | good | warn | ai }",
        lastSync: "optional shortText",
      },
    },
    channelMatrices: {
      optional: true,
      appliesTo: "dashboard | builder | modal | workspace",
      description: "Use for omnichannel or multi-channel performance across Voice, Chat, Email, Slack, Social, WhatsApp, and similar channels.",
      item: {
        slotId: "slotId",
        title: "mediumText",
        summary: "bodyText",
        channels: "array, min 2, max 4, each { channel: shortText, volume: string 1-16 chars, resolution: string 1-16 chars, latency: string 1-16 chars, tone: neutral | good | warn | ai }",
      },
    },
  },
  topLevel: {
    archetype: "one of: inbox, dashboard, builder, table, modal, workspace",
    theme: "must be light",
    content: "archetype-specific object",
    modifiers: {
      aiCallout: {
        optional: true,
        targetSlotId: "slotId matching an existing slotId",
        label: "shortText",
        description: "bodyText",
      },
      cursor: {
        optional: true,
        targetSlotId: "slotId matching an existing slotId",
      },
      highlightedSlotId: "optional slotId matching an existing slotId, most useful for table rows",
    },
  },
  archetypes: {
    inbox: {
      content: {
        productName: "mediumText",
        title: "titleText",
        subtitle: "bodyText",
        conversations: {
          type: "array",
          min: 3,
          max: 6,
          item: {
            slotId: "slotId",
            customer: "mediumText",
            title: "mediumText",
            preview: "bodyText",
            status: "shortText",
            time: "shortText",
            score: "optional string, 1-8 chars",
          },
        },
        thread: {
          customerName: "mediumText",
          statusLabel: "shortText",
          messages: {
            type: "array",
            min: 3,
            max: 6,
            item: {
              slotId: "optional slotId",
              author: "customer | agent | ai",
              name: "mediumText",
              text: "longBodyText",
              timestamp: "shortText",
            },
          },
        },
        context: {
          customerName: "mediumText",
          summary: "bodyText",
          sections: {
            type: "array",
            min: 2,
            max: 4,
            item: {
              slotId: "slotId",
              title: "mediumText",
              items: {
                type: "array",
                min: 2,
                max: 5,
                item: {
                  label: "shortText",
                  value: "mediumText",
                },
              },
            },
          },
        },
      },
    },
    dashboard: {
      content: {
        productName: "mediumText",
        title: "titleText",
        subtitle: "bodyText",
        filters: "array of shortText, min 1, max 4",
        kpis: {
          type: "array",
          min: 3,
          max: 4,
          item: {
            slotId: "slotId",
            label: "shortText",
            value: "string, 1-16 chars",
            delta: "optional string, 1-16 chars",
            tone: "neutral | good | warn",
          },
        },
        lineChart: {
          slotId: "slotId",
          title: "mediumText",
          seriesName: "shortText",
          points: "array, min 5, max 8, each { label: string 1-12 chars, value: number 0-1000000 }",
        },
        barChart: {
          slotId: "slotId",
          title: "mediumText",
          seriesName: "shortText",
          bars: "array, min 4, max 7, each { label: string 1-18 chars, value: number 0-1000000 }",
        },
        table: {
          slotId: "slotId",
          title: "mediumText",
          rows: "array, min 3, max 6, each { slotId, name: mediumText, volume: string 1-16 chars, status: shortText, trend: string 1-16 chars }",
        },
        logicBlocks: "optional reusableBlocks.logicBlocks",
        instructionSections: "optional reusableBlocks.instructionSections",
        reviewQueues: "optional reusableBlocks.reviewQueues",
        toolCallLists: "optional reusableBlocks.toolCallLists",
        actionTrails: "optional reusableBlocks.actionTrails",
        improvementSignals: "optional reusableBlocks.improvementSignals",
        validationLoops: "optional reusableBlocks.validationLoops",
        controlPanels: "optional reusableBlocks.controlPanels",
        autonomyMatrices: "optional reusableBlocks.autonomyMatrices",
        knowledgeCoverages: "optional reusableBlocks.knowledgeCoverages",
        evaluationScorecards: "optional reusableBlocks.evaluationScorecards",
        integrationHealths: "optional reusableBlocks.integrationHealths",
        channelMatrices: "optional reusableBlocks.channelMatrices",
      },
    },
    builder: {
      content: {
        productName: "mediumText",
        title: "titleText",
        subtitle: "bodyText",
        paletteTitle: "shortText",
        paletteItems: "array, min 3, max 6, each { type: trigger | condition | action | ai, label: shortText, description: string 1-56 chars }",
        canvas: {
          title: "mediumText",
          nodes: "array, min 3, max 6, each { slotId, id: string 1-32 chars, type: trigger | condition | action | ai, title: mediumText, description: string 1-80 chars, status: string 1-20 chars, x: number 0-1000, y: number 0-640 }",
          edges: "array, min 2, max 7, each { from: node id, to: node id, label: optional shortText }",
        },
        selectedNode: {
          nodeId: "node id matching an existing canvas node",
          panelTitle: "mediumText",
          fields: "array, min 3, max 6, each { label: shortText, value: string 1-80 chars }",
          actions: "array, min 1, max 2, each { label: shortText, tone: primary | secondary }",
        },
        logicBlocks: "optional reusableBlocks.logicBlocks",
        instructionSections: "optional reusableBlocks.instructionSections",
        reviewQueues: "optional reusableBlocks.reviewQueues",
        toolCallLists: "optional reusableBlocks.toolCallLists",
        actionTrails: "optional reusableBlocks.actionTrails",
        improvementSignals: "optional reusableBlocks.improvementSignals",
        validationLoops: "optional reusableBlocks.validationLoops",
        controlPanels: "optional reusableBlocks.controlPanels",
        autonomyMatrices: "optional reusableBlocks.autonomyMatrices",
        knowledgeCoverages: "optional reusableBlocks.knowledgeCoverages",
        evaluationScorecards: "optional reusableBlocks.evaluationScorecards",
        integrationHealths: "optional reusableBlocks.integrationHealths",
        channelMatrices: "optional reusableBlocks.channelMatrices",
      },
    },
    table: {
      content: {
        productName: "mediumText",
        title: "titleText",
        subtitle: "bodyText",
        toolbar: {
          searchPlaceholder: "mediumText",
          filters: "array of shortText, min 2, max 5",
          bulkSelect: "optional boolean",
        },
        columns: "array, min 4, max 6, each { key: string 1-24 chars, label: shortText, width: optional number 90-280 }",
        rows: {
          type: "array",
          min: 6,
          max: 8,
          item: {
            slotId: "slotId",
            cells: "array, min 4, max 6, cell kinds: text { value: string 1-56 chars }, badge { value: shortText, tone: neutral | good | warn | ai }, person { name: mediumText, detail: optional string 1-48 chars }, number { value: string 1-16 chars, delta: optional string 1-16 chars, tone: neutral | good | warn }, date { value: string 1-18 chars }",
          },
        },
      },
    },
    modal: {
      content: {
        productName: "mediumText",
        title: "titleText",
        subtitle: "bodyText",
        background: {
          type: "inbox | dashboard | builder | table",
          title: "mediumText",
          items: "array of mediumText, min 3, max 6",
        },
        modal: {
          slotId: "slotId",
          kind: "form | confirmation | ai-result",
          eyebrow: "shortText",
          title: "mediumText",
          description: "bodyText",
          fields: "array, min 2, max 5, each { slotId, label: shortText, value: string 1-180 chars }",
          actions: "array, min 1, max 2, each { label: shortText, tone: primary | secondary }",
        },
        logicBlocks: "optional reusableBlocks.logicBlocks",
        instructionSections: "optional reusableBlocks.instructionSections",
        reviewQueues: "optional reusableBlocks.reviewQueues",
        toolCallLists: "optional reusableBlocks.toolCallLists",
        actionTrails: "optional reusableBlocks.actionTrails",
        improvementSignals: "optional reusableBlocks.improvementSignals",
        validationLoops: "optional reusableBlocks.validationLoops",
        controlPanels: "optional reusableBlocks.controlPanels",
        autonomyMatrices: "optional reusableBlocks.autonomyMatrices",
        knowledgeCoverages: "optional reusableBlocks.knowledgeCoverages",
        evaluationScorecards: "optional reusableBlocks.evaluationScorecards",
        integrationHealths: "optional reusableBlocks.integrationHealths",
        channelMatrices: "optional reusableBlocks.channelMatrices",
      },
    },
    workspace: {
      content: {
        productName: "mediumText",
        title: "titleText",
        subtitle: "bodyText",
        filters: "array of shortText, min 1, max 4",
        editor: {
          slotId: "slotId",
          eyebrow: "shortText",
          title: "mediumText",
          body: "longBodyText",
          keyPoints: "array of bodyText, min 2, max 5",
          tags: "array of shortText, min 1, max 4",
        },
        preview: {
          slotId: "slotId",
          title: "mediumText",
          emptyLabel: "shortText",
          cards: "array of mediumText, min 2, max 4",
        },
        tester: {
          slotId: "slotId",
          agentName: "mediumText",
          status: "shortText",
          messages: "array, min 1, max 4, each { author: user | ai, text: bodyText }",
          replies: "array of mediumText, min 2, max 4",
        },
        logicBlocks: "optional reusableBlocks.logicBlocks",
        instructionSections: "optional reusableBlocks.instructionSections",
        reviewQueues: "optional reusableBlocks.reviewQueues",
        toolCallLists: "optional reusableBlocks.toolCallLists",
        actionTrails: "optional reusableBlocks.actionTrails",
        improvementSignals: "optional reusableBlocks.improvementSignals",
        validationLoops: "optional reusableBlocks.validationLoops",
        controlPanels: "optional reusableBlocks.controlPanels",
        autonomyMatrices: "optional reusableBlocks.autonomyMatrices",
        knowledgeCoverages: "optional reusableBlocks.knowledgeCoverages",
        evaluationScorecards: "optional reusableBlocks.evaluationScorecards",
        integrationHealths: "optional reusableBlocks.integrationHealths",
        channelMatrices: "optional reusableBlocks.channelMatrices",
      },
    },
  },
};

export type BuildAiChatPromptInput = {
  description: string;
  uiTextLanguage: UiTextLanguage;
  choice?: ArchetypeChoice;
};

function archetypeList(): string {
  return conceptUiArchetypes
    .map((archetype) => `- ${archetype}: ${archetypeDescriptions[archetype]}`)
    .join("\n");
}

function selectExampleArchetype(choice: ArchetypeChoice): ConceptUiArchetype {
  if (choice.kind === "resolved") return choice.archetype;
  return choice.options[0] ?? "inbox";
}

function sampleForArchetype(archetype: ConceptUiArchetype): SceneSpec {
  return conceptUiSamples.find((sample) => sample.spec.archetype === archetype && sample.language === "en")?.spec
    ?? conceptUiSamples.find((sample) => sample.spec.archetype === archetype)?.spec
    ?? conceptUiSamples[0].spec;
}

function archetypeHint(choice: ArchetypeChoice): string {
  if (choice.kind === "resolved" && choice.confidence >= PIN_CONFIDENCE) {
    return [
      "The keyword mapper is confident.",
      `Use archetype: "${choice.archetype}".`,
      "Do not choose another archetype.",
      `Confidence: ${choice.confidence.toFixed(2)}.`,
    ].join("\n");
  }

  if (choice.kind === "resolved") {
    return [
      "The keyword mapper has a weak hint but is not confident enough to pin the layout.",
      `Weak hint: "${choice.archetype}" with confidence ${choice.confidence.toFixed(2)}.`,
      "Choose the single best archetype from the available archetypes.",
      archetypeList(),
    ].join("\n");
  }

  return [
    "The keyword mapper is not confident.",
    "Choose the single best archetype from the available archetypes.",
    archetypeList(),
  ].join("\n");
}

export function buildAiChatPrompt(input: BuildAiChatPromptInput): string {
  const description = input.description.trim();
  const choice = input.choice ?? mapDescriptionToArchetype(description);
  const exampleArchetype = selectExampleArchetype(choice);
  const example = sampleForArchetype(exampleArchetype);

  return [
    "You generate scene specs for a UI mockup tool.",
    "",
    "Respond with ONLY a single JSON object.",
    "Do not use markdown fences.",
    "Do not add commentary before or after the JSON.",
    "Do not explain your choices.",
    "",
    "The JSON must match the SceneSpec schema below exactly.",
    'The top-level object MUST use the key "archetype". Do not use "layout", "type", or "sceneType".',
    'The top-level "archetype" value MUST be exactly one of: "inbox", "dashboard", "builder", "table", "modal", "workspace".',
    'The top-level object MUST be { "archetype": ..., "theme": "light", "content": ..., "modifiers": ... }.',
    "Use only fake, plausible delight.ai-style SaaS content.",
    "Never use real customer data.",
    'Theme must always be "light".',
    "",
    "Quality guardrails:",
    "- Treat the marketer description as a feature brief, not as UI copy to paste directly.",
    "- Convert long paragraphs into compact SaaS UI labels, values, statuses, and one-sentence descriptions.",
    "- Prefer 1-5 word labels and short body copy under 14 words when the schema allows longer text.",
    "- Use delight.ai domain context: AI agents, CX ops, conversations, tickets, actionbooks, policies, knowledge, approvals, evaluation, metrics, and integrations.",
    "- Do not repeat the same sentence in multiple cards, rows, or callouts.",
    "- Do not fill the scene with abstract marketing claims. Show the actual product state, action, queue, metric, rule, or approval moment.",
    "- If the feature is broad or ambiguous, choose the most concrete operational screen that a marketer could screenshot.",
    "- If unsure between layouts, prefer dashboard or table over builder. Use builder only for explicit canvas, workflow editor, node editor, rule authoring, or actionbook editing experiences.",
    "- Modal backgrounds must be reduced-detail context only. The modal itself is the product moment.",
    "",
    `UI copy language: ${input.uiTextLanguage.toUpperCase()}`,
    "",
    "Marketer feature description:",
    '"""',
    description,
    '"""',
    "",
    "Archetype guidance:",
    archetypeHint(choice),
    "",
    "Available archetypes:",
    archetypeList(),
    "",
    "SceneSpec schema:",
    JSON.stringify(readableSceneSpecSchema, null, 2),
    "",
    "Important constraints:",
    "- Return exactly one JSON object.",
    '- Return the SceneSpec object directly. Do not wrap it in "scene", "spec", "data", or any other outer object.',
    "- Every required field must be present.",
    "- Do not include extra fields.",
    "- All string max lengths are strict. Stay under the listed max length.",
    "- Every slotId must be stable, lowercase, and unique within the scene.",
    "- If modifiers.aiCallout is used, its targetSlotId must match an existing slotId in the same scene.",
    "- If modifiers.cursor is used, its targetSlotId must match an existing slotId.",
    "- If modifiers.highlightedSlotId is used, it must match an existing slotId.",
    "- Use short product UI copy, not marketing paragraphs.",
    "- Prefer compact labels, realistic fake names, and plausible operational data.",
    '- Do not create placeholder text like "Lorem ipsum".',
    "- Do not create random unsupported archetypes.",
    "- Do not use dark theme.",
    "- Keep labels distinct. Do not reuse generic labels such as Item, Value, Step, Status, or Card unless they are the actual UI concept.",
    "",
    "Content quality rules:",
    "- Make the UI look like a real SaaS product screen, not a wireframe.",
    "- The scene should visualize the feature, not describe it abstractly.",
    "- Include one clear AI moment when relevant.",
    "- If the feature includes if/else, conditions, branching, rules, or outcomes, include logicBlocks inside the best matching dashboard, builder, modal, or workspace scene.",
    "- If the feature includes AI action trails, action logs, visible agent steps, approval gates, or paused actions requiring human approval, include actionTrails.",
    "- If the feature includes production signals, proposed updates, automated agent improvement, or continuous improvement, include improvementSignals.",
    "- If the feature includes self-validation, testing loops, simulations, or iterating until tests pass, include validationLoops.",
    "- If the feature includes self-service configuration, control, tone, behavior, knowledge settings, no-code changes, or no engineering resources, include controlPanels.",
    "- If the feature includes autonomy, permissions, action scope, approval boundaries, or what the agent can do alone, include autonomyMatrices.",
    "- If the feature includes knowledge coverage, stale sources, missing articles, unanswered topics, or content gaps, include knowledgeCoverages.",
    "- If the feature includes evaluation scorecards, scenario pass rates, hallucination checks, policy checks, or QA results, include evaluationScorecards.",
    "- If the feature includes integration health, connector status, CRM/Zendesk/Salesforce/Shopify sync, API reliability, or data sync, include integrationHealths.",
    "- If the feature compares performance across multiple customer channels such as Voice, Chat, Email, Slack, Social, or WhatsApp, include channelMatrices.",
    "- If the feature includes policies, instructions, key points, variables, anchors, tool calls, review, approval, or human loops, include the matching reusable block inside the best supported scene instead of inventing a new archetype.",
    "- If the feature involves conversations, tickets, replies, customer context, or support handoff, prefer inbox.",
    "- If it involves metrics, quality monitoring, analytics, scorecards, reports, or performance, prefer dashboard.",
    "- Prefer builder only when the feature is specifically an editor, canvas, workflow-builder, actionbook, rule-authoring, or node-based automation experience.",
    "- For generic resolution flows, procedure-trained agent flows, visible agent steps, approvals, or support triage flows, prefer dashboard with reusable blocks such as actionTrails, instructionSections, reviewQueues, or toolCallLists instead of builder.",
    "- If it involves managing records, queues, lists, logs, reviews, or bulk operations, prefer table.",
    "- If it involves creating, confirming, revealing a result, settings, or a focused single action, prefer modal.",
    "- Numbers must be internally consistent. Example: if a KPI says improvement, the chart should trend upward or improve.",
    "- Keep chart data deterministic literal numbers. No randomness.",
    "",
    `Few-shot example for ${exampleArchetype}:`,
    JSON.stringify(example, null, 2),
    "",
    "Now generate the best SceneSpec JSON for the marketer feature description.",
  ].join("\n");
}
