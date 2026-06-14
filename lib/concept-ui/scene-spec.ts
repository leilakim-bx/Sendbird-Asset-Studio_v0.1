import { z } from "zod";

export type ConceptUiArchetype = "inbox" | "dashboard" | "builder" | "table" | "modal" | "workspace";

const slotId = z.string().trim().min(1).max(48);
const shortText = z.string().trim().min(1).max(24);
const mediumText = z.string().trim().min(1).max(40);
const titleText = z.string().trim().min(1).max(56);
const bodyText = z.string().trim().min(1).max(160);
const longBodyText = z.string().trim().min(1).max(220);
const conditionText = z.string().trim().min(1).max(72);
const blockToneSchema = z.enum(["neutral", "good", "warn", "ai"]);

const aiCalloutSchema = z
  .object({
    targetSlotId: slotId,
    label: shortText,
    description: bodyText,
  })
  .strict();

const modifiersSchema = z
  .object({
    aiCallout: aiCalloutSchema.optional(),
    cursor: z
      .object({
        targetSlotId: slotId,
      })
      .strict()
      .optional(),
    highlightedSlotId: slotId.optional(),
  })
  .strict()
  .default({});

const logicOutcomeSchema = z
  .object({
    label: shortText,
    action: bodyText,
    tone: blockToneSchema.default("neutral"),
  })
  .strict();

const logicBlockSchema = z
  .object({
    slotId,
    title: mediumText,
    conditionLabel: shortText.default("IF"),
    condition: conditionText,
    description: bodyText.optional(),
    outcomes: z.array(logicOutcomeSchema).min(2).max(3),
  })
  .strict();

const logicBlocksSchema = z.array(logicBlockSchema).min(1).max(2).optional();

const instructionSectionSchema = z
  .object({
    slotId,
    title: mediumText,
    eyebrow: shortText.optional(),
    body: bodyText,
    items: z
      .array(
        z
          .object({
            label: shortText,
            text: bodyText,
            tone: blockToneSchema.default("neutral"),
          })
          .strict(),
      )
      .min(2)
      .max(4),
    tags: z.array(shortText).min(1).max(3).optional(),
  })
  .strict();

const reviewQueueSchema = z
  .object({
    slotId,
    title: mediumText,
    summary: bodyText,
    items: z
      .array(
        z
          .object({
            label: mediumText,
            detail: bodyText,
            status: shortText,
            tone: blockToneSchema.default("neutral"),
          })
          .strict(),
      )
      .min(2)
      .max(4),
  })
  .strict();

const toolCallListSchema = z
  .object({
    slotId,
    title: mediumText,
    summary: bodyText.optional(),
    calls: z
      .array(
        z
          .object({
            name: shortText,
            detail: bodyText,
            status: shortText,
            tone: blockToneSchema.default("neutral"),
          })
          .strict(),
      )
      .min(2)
      .max(4),
  })
  .strict();

const actionTrailStepSchema = z
  .object({
    label: mediumText,
    detail: bodyText.optional(),
    duration: z.string().trim().min(1).max(12).optional(),
    status: shortText,
    tone: blockToneSchema.default("neutral"),
  })
  .strict();

const actionTrailSchema = z
  .object({
    slotId,
    title: mediumText,
    summary: bodyText.optional(),
    steps: z.array(actionTrailStepSchema).min(2).max(4),
    gate: z
      .object({
        title: mediumText,
        detail: bodyText,
        primaryAction: shortText,
        secondaryAction: shortText,
      })
      .strict()
      .optional(),
  })
  .strict();

const improvementSignalSchema = z
  .object({
    slotId,
    title: mediumText,
    signal: mediumText,
    proposal: bodyText,
    impact: bodyText,
    confidence: z.string().trim().min(1).max(12),
    status: shortText,
    tone: blockToneSchema.default("ai"),
  })
  .strict();

const validationLoopSchema = z
  .object({
    slotId,
    title: mediumText,
    summary: bodyText,
    iterationCount: z.string().trim().min(1).max(12),
    passRate: z.string().trim().min(1).max(12),
    status: shortText,
    steps: z
      .array(
        z
          .object({
            label: shortText,
            detail: bodyText,
            status: shortText,
            tone: blockToneSchema.default("neutral"),
          })
          .strict(),
      )
      .min(2)
      .max(4),
  })
  .strict();

const controlPanelItemSchema = z
  .object({
    label: shortText,
    value: mediumText,
    detail: bodyText,
    status: shortText,
    tone: blockToneSchema.default("neutral"),
  })
  .strict();

const controlPanelSchema = z
  .object({
    slotId,
    title: mediumText,
    summary: bodyText,
    items: z.array(controlPanelItemSchema).min(2).max(4),
    footer: bodyText.optional(),
  })
  .strict();

const autonomyLevelSchema = z
  .object({
    label: shortText,
    scope: mediumText,
    detail: bodyText,
    status: shortText,
    tone: blockToneSchema.default("neutral"),
  })
  .strict();

const autonomyMatrixSchema = z
  .object({
    slotId,
    title: mediumText,
    summary: bodyText,
    levels: z.array(autonomyLevelSchema).min(2).max(4),
    guardrail: bodyText.optional(),
  })
  .strict();

const knowledgeCoverageTopicSchema = z
  .object({
    label: shortText,
    coverage: z.string().trim().min(1).max(12),
    detail: bodyText,
    status: shortText,
    tone: blockToneSchema.default("neutral"),
  })
  .strict();

const knowledgeCoverageSchema = z
  .object({
    slotId,
    title: mediumText,
    summary: bodyText,
    topics: z.array(knowledgeCoverageTopicSchema).min(2).max(4),
    freshness: bodyText.optional(),
  })
  .strict();

const evaluationCheckSchema = z
  .object({
    label: shortText,
    score: z.string().trim().min(1).max(12),
    detail: bodyText,
    status: shortText,
    tone: blockToneSchema.default("neutral"),
  })
  .strict();

const evaluationScorecardSchema = z
  .object({
    slotId,
    title: mediumText,
    summary: bodyText,
    checks: z.array(evaluationCheckSchema).min(2).max(4),
    verdict: bodyText.optional(),
  })
  .strict();

const integrationSystemSchema = z
  .object({
    name: shortText,
    metric: z.string().trim().min(1).max(16),
    detail: bodyText,
    status: shortText,
    tone: blockToneSchema.default("neutral"),
  })
  .strict();

const integrationHealthSchema = z
  .object({
    slotId,
    title: mediumText,
    summary: bodyText,
    systems: z.array(integrationSystemSchema).min(2).max(4),
    lastSync: shortText.optional(),
  })
  .strict();

const channelMatrixRowSchema = z
  .object({
    channel: shortText,
    volume: z.string().trim().min(1).max(16),
    resolution: z.string().trim().min(1).max(16),
    latency: z.string().trim().min(1).max(16),
    tone: blockToneSchema.default("neutral"),
  })
  .strict();

const channelMatrixSchema = z
  .object({
    slotId,
    title: mediumText,
    summary: bodyText,
    channels: z.array(channelMatrixRowSchema).min(2).max(4),
  })
  .strict();

const instructionSectionsSchema = z.array(instructionSectionSchema).min(1).max(2).optional();
const reviewQueuesSchema = z.array(reviewQueueSchema).min(1).max(2).optional();
const toolCallListsSchema = z.array(toolCallListSchema).min(1).max(2).optional();
const actionTrailsSchema = z.array(actionTrailSchema).min(1).max(2).optional();
const improvementSignalsSchema = z.array(improvementSignalSchema).min(1).max(2).optional();
const validationLoopsSchema = z.array(validationLoopSchema).min(1).max(2).optional();
const controlPanelsSchema = z.array(controlPanelSchema).min(1).max(2).optional();
const autonomyMatricesSchema = z.array(autonomyMatrixSchema).min(1).max(2).optional();
const knowledgeCoveragesSchema = z.array(knowledgeCoverageSchema).min(1).max(2).optional();
const evaluationScorecardsSchema = z.array(evaluationScorecardSchema).min(1).max(2).optional();
const integrationHealthsSchema = z.array(integrationHealthSchema).min(1).max(2).optional();
const channelMatricesSchema = z.array(channelMatrixSchema).min(1).max(2).optional();

const inboxConversationSchema = z
  .object({
    slotId,
    customer: mediumText,
    title: mediumText,
    preview: bodyText,
    status: shortText,
    time: shortText,
    score: z.string().trim().min(1).max(8).optional(),
  })
  .strict();

const inboxMessageSchema = z
  .object({
    slotId: slotId.optional(),
    author: z.enum(["customer", "agent", "ai"]),
    name: mediumText,
    text: longBodyText,
    timestamp: shortText,
  })
  .strict();

const inboxContextSectionSchema = z
  .object({
    slotId,
    title: mediumText,
    items: z
      .array(
        z
          .object({
            label: shortText,
            value: mediumText,
          })
          .strict(),
      )
      .min(2)
      .max(5),
  })
  .strict();

const inboxSceneSpecSchema = z
  .object({
    archetype: z.literal("inbox"),
    theme: z.literal("light"),
    content: z
      .object({
        productName: mediumText,
        title: titleText,
        subtitle: bodyText,
        conversations: z.array(inboxConversationSchema).min(3).max(6),
        thread: z
          .object({
            customerName: mediumText,
            statusLabel: shortText,
            messages: z.array(inboxMessageSchema).min(3).max(6),
          })
          .strict(),
        context: z
          .object({
            customerName: mediumText,
            summary: bodyText,
            sections: z.array(inboxContextSectionSchema).min(2).max(4),
          })
          .strict(),
      })
      .strict(),
    modifiers: modifiersSchema,
  })
  .strict();

const kpiSchema = z
  .object({
    slotId,
    label: shortText,
    value: z.string().trim().min(1).max(16),
    delta: z.string().trim().min(1).max(16).optional(),
    tone: z.enum(["neutral", "good", "warn"]).default("neutral"),
  })
  .strict();

const chartPointSchema = z
  .object({
    label: z.string().trim().min(1).max(12),
    value: z.number().finite().min(0).max(1000000),
  })
  .strict();

const barSeriesSchema = z
  .object({
    label: z.string().trim().min(1).max(18),
    value: z.number().finite().min(0).max(1000000),
  })
  .strict();

const tableRowSchema = z
  .object({
    slotId,
    name: mediumText,
    volume: z.string().trim().min(1).max(16),
    status: shortText,
    trend: z.string().trim().min(1).max(16),
  })
  .strict();

const dashboardSceneSpecSchema = z
  .object({
    archetype: z.literal("dashboard"),
    theme: z.literal("light"),
    content: z
      .object({
        productName: mediumText,
        title: titleText,
        subtitle: bodyText,
        filters: z.array(shortText).min(1).max(4),
        kpis: z.array(kpiSchema).min(3).max(4),
        lineChart: z
          .object({
            slotId,
            title: mediumText,
            seriesName: shortText,
            points: z.array(chartPointSchema).min(5).max(8),
          })
          .strict(),
        barChart: z
          .object({
            slotId,
            title: mediumText,
            seriesName: shortText,
            bars: z.array(barSeriesSchema).min(4).max(7),
          })
          .strict(),
        table: z
          .object({
            slotId,
            title: mediumText,
            rows: z.array(tableRowSchema).min(3).max(6),
          })
          .strict(),
        logicBlocks: logicBlocksSchema,
        instructionSections: instructionSectionsSchema,
        reviewQueues: reviewQueuesSchema,
        toolCallLists: toolCallListsSchema,
        actionTrails: actionTrailsSchema,
        improvementSignals: improvementSignalsSchema,
        validationLoops: validationLoopsSchema,
        controlPanels: controlPanelsSchema,
        autonomyMatrices: autonomyMatricesSchema,
        knowledgeCoverages: knowledgeCoveragesSchema,
        evaluationScorecards: evaluationScorecardsSchema,
        integrationHealths: integrationHealthsSchema,
        channelMatrices: channelMatricesSchema,
      })
      .strict(),
    modifiers: modifiersSchema,
  })
  .strict();

const builderNodeTypeSchema = z.enum(["trigger", "condition", "action", "ai"]);

const builderSceneSpecSchema = z
  .object({
    archetype: z.literal("builder"),
    theme: z.literal("light"),
    content: z
      .object({
        productName: mediumText,
        title: titleText,
        subtitle: bodyText,
        paletteTitle: shortText,
        paletteItems: z
          .array(
            z
              .object({
                type: builderNodeTypeSchema,
                label: shortText,
                description: z.string().trim().min(1).max(56),
              })
              .strict(),
          )
          .min(3)
          .max(6),
        canvas: z
          .object({
            title: mediumText,
            nodes: z
              .array(
                z
                  .object({
                    slotId,
                    id: z.string().trim().min(1).max(32),
                    type: builderNodeTypeSchema,
                    title: mediumText,
                    description: z.string().trim().min(1).max(80),
                    status: z.string().trim().min(1).max(20),
                    x: z.number().finite().min(0).max(1000),
                    y: z.number().finite().min(0).max(640),
                  })
                  .strict(),
              )
              .min(3)
              .max(6),
            edges: z
              .array(
                z
                  .object({
                    from: z.string().trim().min(1).max(32),
                    to: z.string().trim().min(1).max(32),
                    label: shortText.optional(),
                  })
                  .strict(),
              )
              .min(2)
              .max(7),
          })
          .strict(),
        selectedNode: z
          .object({
            nodeId: z.string().trim().min(1).max(32),
            panelTitle: mediumText,
            fields: z
              .array(
                z
                  .object({
                    label: shortText,
                    value: z.string().trim().min(1).max(80),
                  })
                  .strict(),
              )
              .min(3)
              .max(6),
            actions: z
              .array(
                z
                  .object({
                    label: shortText,
                    tone: z.enum(["primary", "secondary"]),
                  })
                  .strict(),
              )
              .min(1)
              .max(2),
          })
          .strict(),
        logicBlocks: logicBlocksSchema,
        instructionSections: instructionSectionsSchema,
        reviewQueues: reviewQueuesSchema,
        toolCallLists: toolCallListsSchema,
        actionTrails: actionTrailsSchema,
        improvementSignals: improvementSignalsSchema,
        validationLoops: validationLoopsSchema,
        controlPanels: controlPanelsSchema,
        autonomyMatrices: autonomyMatricesSchema,
        knowledgeCoverages: knowledgeCoveragesSchema,
        evaluationScorecards: evaluationScorecardsSchema,
        integrationHealths: integrationHealthsSchema,
        channelMatrices: channelMatricesSchema,
      })
      .strict(),
    modifiers: modifiersSchema,
  })
  .strict();

const tableCellSchema = z.discriminatedUnion("kind", [
  z
    .object({
      kind: z.literal("text"),
      value: z.string().trim().min(1).max(56),
    })
    .strict(),
  z
    .object({
      kind: z.literal("badge"),
      value: shortText,
      tone: z.enum(["neutral", "good", "warn", "ai"]),
    })
    .strict(),
  z
    .object({
      kind: z.literal("person"),
      name: mediumText,
      detail: z.string().trim().min(1).max(48).optional(),
    })
    .strict(),
  z
    .object({
      kind: z.literal("number"),
      value: z.string().trim().min(1).max(16),
      delta: z.string().trim().min(1).max(16).optional(),
      tone: z.enum(["neutral", "good", "warn"]).default("neutral"),
    })
    .strict(),
  z
    .object({
      kind: z.literal("date"),
      value: z.string().trim().min(1).max(18),
    })
    .strict(),
]);

const tableSceneSpecSchema = z
  .object({
    archetype: z.literal("table"),
    theme: z.literal("light"),
    content: z
      .object({
        productName: mediumText,
        title: titleText,
        subtitle: bodyText,
        toolbar: z
          .object({
            searchPlaceholder: mediumText,
            filters: z.array(shortText).min(2).max(5),
            bulkSelect: z.boolean().optional(),
          })
          .strict(),
        columns: z
          .array(
            z
              .object({
                key: z.string().trim().min(1).max(24),
                label: shortText,
                width: z.number().finite().min(90).max(280).optional(),
              })
              .strict(),
          )
          .min(4)
          .max(6),
        rows: z
          .array(
            z
              .object({
                slotId,
                cells: z.array(tableCellSchema).min(4).max(6),
              })
              .strict(),
          )
          .min(6)
          .max(8),
      })
      .strict(),
    modifiers: modifiersSchema,
  })
  .strict();

const modalSceneSpecSchema = z
  .object({
    archetype: z.literal("modal"),
    theme: z.literal("light"),
    content: z
      .object({
        productName: mediumText,
        title: titleText,
        subtitle: bodyText,
        background: z
          .object({
            type: z.enum(["inbox", "dashboard", "builder", "table"]),
            title: mediumText,
            items: z.array(mediumText).min(3).max(6),
          })
          .strict(),
        modal: z
          .object({
            slotId,
            kind: z.enum(["form", "confirmation", "ai-result"]),
            eyebrow: shortText,
            title: mediumText,
            description: bodyText,
            fields: z
              .array(
                z
                  .object({
                    slotId,
                    label: shortText,
                    value: z.string().trim().min(1).max(80),
                  })
                  .strict(),
              )
              .min(2)
              .max(5),
            actions: z
              .array(
                z
                  .object({
                    label: shortText,
                    tone: z.enum(["primary", "secondary"]),
                  })
                  .strict(),
              )
              .min(1)
              .max(2),
          })
          .strict(),
        logicBlocks: logicBlocksSchema,
        instructionSections: instructionSectionsSchema,
        reviewQueues: reviewQueuesSchema,
        toolCallLists: toolCallListsSchema,
        actionTrails: actionTrailsSchema,
        improvementSignals: improvementSignalsSchema,
        validationLoops: validationLoopsSchema,
        controlPanels: controlPanelsSchema,
        autonomyMatrices: autonomyMatricesSchema,
        knowledgeCoverages: knowledgeCoveragesSchema,
        evaluationScorecards: evaluationScorecardsSchema,
        integrationHealths: integrationHealthsSchema,
        channelMatrices: channelMatricesSchema,
      })
      .strict(),
    modifiers: modifiersSchema,
  })
  .strict();

const workspaceMessageSchema = z
  .object({
    author: z.enum(["user", "ai"]),
    text: bodyText,
  })
  .strict();

const workspaceSceneSpecSchema = z
  .object({
    archetype: z.literal("workspace"),
    theme: z.literal("light"),
    content: z
      .object({
        productName: mediumText,
        title: titleText,
        subtitle: bodyText,
        filters: z.array(shortText).min(1).max(4),
        editor: z
          .object({
            slotId,
            eyebrow: shortText,
            title: mediumText,
            body: longBodyText,
            keyPoints: z.array(bodyText).min(2).max(5),
            tags: z.array(shortText).min(1).max(4),
          })
          .strict(),
        preview: z
          .object({
            slotId,
            title: mediumText,
            emptyLabel: shortText,
            cards: z.array(mediumText).min(2).max(4),
          })
          .strict(),
        tester: z
          .object({
            slotId,
            agentName: mediumText,
            status: shortText,
            messages: z.array(workspaceMessageSchema).min(1).max(4),
            replies: z.array(mediumText).min(2).max(4),
          })
          .strict(),
        logicBlocks: logicBlocksSchema,
        instructionSections: instructionSectionsSchema,
        reviewQueues: reviewQueuesSchema,
        toolCallLists: toolCallListsSchema,
        actionTrails: actionTrailsSchema,
        improvementSignals: improvementSignalsSchema,
        validationLoops: validationLoopsSchema,
        controlPanels: controlPanelsSchema,
        autonomyMatrices: autonomyMatricesSchema,
        knowledgeCoverages: knowledgeCoveragesSchema,
        evaluationScorecards: evaluationScorecardsSchema,
        integrationHealths: integrationHealthsSchema,
        channelMatrices: channelMatricesSchema,
      })
      .strict(),
    modifiers: modifiersSchema,
  })
  .strict();

export const sceneSpecSchema = z.discriminatedUnion("archetype", [
  inboxSceneSpecSchema,
  dashboardSceneSpecSchema,
  builderSceneSpecSchema,
  tableSceneSpecSchema,
  modalSceneSpecSchema,
  workspaceSceneSpecSchema,
]);

export type InboxSceneSpec = z.infer<typeof inboxSceneSpecSchema>;
export type DashboardSceneSpec = z.infer<typeof dashboardSceneSpecSchema>;
export type BuilderSceneSpec = z.infer<typeof builderSceneSpecSchema>;
export type TableSceneSpec = z.infer<typeof tableSceneSpecSchema>;
export type ModalSceneSpec = z.infer<typeof modalSceneSpecSchema>;
export type WorkspaceSceneSpec = z.infer<typeof workspaceSceneSpecSchema>;
export type SceneSpec = z.infer<typeof sceneSpecSchema>;
export type LogicBlockSpec = z.infer<typeof logicBlockSchema>;
export type InstructionSectionSpec = z.infer<typeof instructionSectionSchema>;
export type ReviewQueueSpec = z.infer<typeof reviewQueueSchema>;
export type ToolCallListSpec = z.infer<typeof toolCallListSchema>;
export type ActionTrailSpec = z.infer<typeof actionTrailSchema>;
export type ImprovementSignalSpec = z.infer<typeof improvementSignalSchema>;
export type ValidationLoopSpec = z.infer<typeof validationLoopSchema>;
export type ControlPanelSpec = z.infer<typeof controlPanelSchema>;
export type AutonomyMatrixSpec = z.infer<typeof autonomyMatrixSchema>;
export type KnowledgeCoverageSpec = z.infer<typeof knowledgeCoverageSchema>;
export type EvaluationScorecardSpec = z.infer<typeof evaluationScorecardSchema>;
export type IntegrationHealthSpec = z.infer<typeof integrationHealthSchema>;
export type ChannelMatrixSpec = z.infer<typeof channelMatrixSchema>;

export function parseSceneSpec(input: unknown): SceneSpec {
  return sceneSpecSchema.parse(input);
}
