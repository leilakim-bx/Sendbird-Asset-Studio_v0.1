import { z } from "zod";

export type ConceptUiArchetype = "inbox" | "dashboard" | "builder" | "table" | "modal";

const slotId = z.string().trim().min(1).max(48);
const shortText = z.string().trim().min(1).max(24);
const mediumText = z.string().trim().min(1).max(40);
const titleText = z.string().trim().min(1).max(56);
const bodyText = z.string().trim().min(1).max(160);
const longBodyText = z.string().trim().min(1).max(220);

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
]);

export type InboxSceneSpec = z.infer<typeof inboxSceneSpecSchema>;
export type DashboardSceneSpec = z.infer<typeof dashboardSceneSpecSchema>;
export type BuilderSceneSpec = z.infer<typeof builderSceneSpecSchema>;
export type TableSceneSpec = z.infer<typeof tableSceneSpecSchema>;
export type ModalSceneSpec = z.infer<typeof modalSceneSpecSchema>;
export type SceneSpec = z.infer<typeof sceneSpecSchema>;

export function parseSceneSpec(input: unknown): SceneSpec {
  return sceneSpecSchema.parse(input);
}
