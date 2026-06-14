import type { ConceptUiArchetype, SceneSpec } from "./scene-spec";

export type ConceptSlot = {
  id: string;
  label: string;
};

export const conceptUiArchetypes: ConceptUiArchetype[] = ["inbox", "dashboard", "builder", "table", "modal", "workspace"];

function reusableBlockSlots(spec: SceneSpec): ConceptSlot[] {
  if (
    spec.archetype === "dashboard" ||
    spec.archetype === "builder" ||
    spec.archetype === "modal" ||
    spec.archetype === "workspace"
  ) {
    return [
      ...(spec.content.logicBlocks?.map((block) => ({ id: block.slotId, label: block.title })) ?? []),
      ...(spec.content.autonomyMatrices?.map((block) => ({ id: block.slotId, label: block.title })) ?? []),
      ...(spec.content.controlPanels?.map((block) => ({ id: block.slotId, label: block.title })) ?? []),
      ...(spec.content.knowledgeCoverages?.map((block) => ({ id: block.slotId, label: block.title })) ?? []),
      ...(spec.content.evaluationScorecards?.map((block) => ({ id: block.slotId, label: block.title })) ?? []),
      ...(spec.content.integrationHealths?.map((block) => ({ id: block.slotId, label: block.title })) ?? []),
      ...(spec.content.channelMatrices?.map((block) => ({ id: block.slotId, label: block.title })) ?? []),
      ...(spec.content.actionTrails?.map((block) => ({ id: block.slotId, label: block.title })) ?? []),
      ...(spec.content.improvementSignals?.map((block) => ({ id: block.slotId, label: block.title })) ?? []),
      ...(spec.content.validationLoops?.map((block) => ({ id: block.slotId, label: block.title })) ?? []),
      ...(spec.content.reviewQueues?.map((block) => ({ id: block.slotId, label: block.title })) ?? []),
      ...(spec.content.toolCallLists?.map((block) => ({ id: block.slotId, label: block.title })) ?? []),
      ...(spec.content.instructionSections?.map((block) => ({ id: block.slotId, label: block.title })) ?? []),
    ];
  }
  return [];
}

export function getPrimarySlotId(spec: SceneSpec): string {
  const firstReusableBlock = reusableBlockSlots(spec)[0];
  if (firstReusableBlock) return firstReusableBlock.id;
  if (spec.archetype === "workspace") return spec.content.tester.slotId;
  if (spec.archetype === "modal") return spec.content.modal.slotId;
  if (spec.archetype === "builder") {
    return spec.content.canvas.nodes.find((node) => node.id === spec.content.selectedNode.nodeId)?.slotId
      ?? spec.content.canvas.nodes[0]?.slotId
      ?? "builder";
  }
  if (spec.archetype === "table") return spec.content.rows[0]?.slotId ?? "table";
  if (spec.archetype === "dashboard") return spec.content.kpis[0]?.slotId ?? spec.content.lineChart.slotId;
  return spec.content.thread.messages.find((message) => message.slotId)?.slotId ?? spec.content.conversations[0]?.slotId ?? "inbox";
}

export function getAiCalloutTargetSlots(spec: SceneSpec): ConceptSlot[] {
  if (spec.archetype === "inbox") {
    return [
      ...spec.content.conversations.map((item) => ({ id: item.slotId, label: item.title })),
      ...spec.content.thread.messages
        .filter((item) => item.slotId)
        .map((item) => ({ id: item.slotId as string, label: item.name })),
      ...spec.content.context.sections.map((item) => ({ id: item.slotId, label: item.title })),
    ];
  }

  if (spec.archetype === "dashboard") {
    return [
      ...reusableBlockSlots(spec),
      ...spec.content.kpis.map((item) => ({ id: item.slotId, label: item.label })),
      { id: spec.content.lineChart.slotId, label: spec.content.lineChart.title },
      { id: spec.content.barChart.slotId, label: spec.content.barChart.title },
      { id: spec.content.table.slotId, label: spec.content.table.title },
      ...spec.content.table.rows.map((item) => ({ id: item.slotId, label: item.name })),
    ];
  }

  if (spec.archetype === "builder") {
    return [
      ...reusableBlockSlots(spec),
      ...spec.content.canvas.nodes.map((node) => ({ id: node.slotId, label: node.title })),
    ];
  }

  if (spec.archetype === "table") {
    return spec.content.rows.map((row, index) => {
      const firstCell = row.cells[0];
      const label = firstCell?.kind === "text" ? firstCell.value : `Row ${index + 1}`;
      return { id: row.slotId, label };
    });
  }

  if (spec.archetype === "workspace") {
    return [
      ...reusableBlockSlots(spec),
      { id: spec.content.editor.slotId, label: spec.content.editor.title },
      { id: spec.content.preview.slotId, label: spec.content.preview.title },
      { id: spec.content.tester.slotId, label: spec.content.tester.agentName },
    ];
  }

  return [
    ...reusableBlockSlots(spec),
    { id: spec.content.modal.slotId, label: spec.content.modal.title },
    ...spec.content.modal.fields.map((field) => ({ id: field.slotId, label: field.label })),
  ];
}
