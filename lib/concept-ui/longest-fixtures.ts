import { conceptUiSamples } from "./samples";
import { parseSceneSpec, type ConceptUiArchetype, type SceneSpec } from "./scene-spec";
import { conceptUiArchetypes } from "./slots";

function maxText(length: number): string {
  return "AI action review signal keeps teams aligned across every visible workflow. ".repeat(20).slice(0, length);
}

function firstSample(archetype: ConceptUiArchetype): SceneSpec {
  const sample = conceptUiSamples.find((item) => item.spec.archetype === archetype);
  if (!sample) throw new Error(`Missing sample for ${archetype}`);
  return structuredClone(sample.spec);
}

function fillCommon(spec: SceneSpec) {
  spec.content.productName = maxText(40);
  spec.content.title = maxText(56);
  spec.content.subtitle = maxText(160);
  if (spec.modifiers.aiCallout) {
    spec.modifiers.aiCallout.label = maxText(24);
    spec.modifiers.aiCallout.description = maxText(160);
  }
}

function longestInbox(): SceneSpec {
  const spec = firstSample("inbox");
  if (spec.archetype !== "inbox") throw new Error("Expected inbox");
  fillCommon(spec);
  spec.content.conversations.forEach((item) => {
    item.customer = maxText(40);
    item.title = maxText(40);
    item.preview = maxText(160);
    item.status = maxText(24);
    item.time = maxText(24);
    item.score = maxText(8);
  });
  spec.content.thread.customerName = maxText(40);
  spec.content.thread.statusLabel = maxText(24);
  spec.content.thread.messages.forEach((item) => {
    item.name = maxText(40);
    item.text = maxText(220);
    item.timestamp = maxText(24);
  });
  spec.content.context.customerName = maxText(40);
  spec.content.context.summary = maxText(160);
  spec.content.context.sections.forEach((section) => {
    section.title = maxText(40);
    section.items.forEach((item) => {
      item.label = maxText(24);
      item.value = maxText(40);
    });
  });
  return parseSceneSpec(spec);
}

function longestDashboard(): SceneSpec {
  const spec = firstSample("dashboard");
  if (spec.archetype !== "dashboard") throw new Error("Expected dashboard");
  fillCommon(spec);
  spec.content.filters = spec.content.filters.map(() => maxText(24));
  spec.content.kpis.forEach((item) => {
    item.label = maxText(24);
    item.value = maxText(16);
    item.delta = maxText(16);
  });
  spec.content.lineChart.title = maxText(40);
  spec.content.lineChart.seriesName = maxText(24);
  spec.content.lineChart.points.forEach((point) => {
    point.label = maxText(12);
  });
  spec.content.barChart.title = maxText(40);
  spec.content.barChart.seriesName = maxText(24);
  spec.content.barChart.bars.forEach((bar) => {
    bar.label = maxText(18);
  });
  spec.content.table.title = maxText(40);
  spec.content.table.rows.forEach((row) => {
    row.name = maxText(40);
    row.volume = maxText(16);
    row.status = maxText(24);
    row.trend = maxText(16);
  });
  return parseSceneSpec(spec);
}

function longestBuilder(): SceneSpec {
  const spec = firstSample("builder");
  if (spec.archetype !== "builder") throw new Error("Expected builder");
  fillCommon(spec);
  spec.content.paletteTitle = maxText(24);
  spec.content.paletteItems.forEach((item) => {
    item.label = maxText(24);
    item.description = maxText(56);
  });
  spec.content.canvas.title = maxText(40);
  spec.content.canvas.nodes.forEach((node) => {
    node.title = maxText(40);
    node.description = maxText(80);
    node.status = maxText(20);
  });
  spec.content.canvas.edges.forEach((edge) => {
    edge.label = maxText(24);
  });
  spec.content.selectedNode.panelTitle = maxText(40);
  spec.content.selectedNode.fields.forEach((field) => {
    field.label = maxText(24);
    field.value = maxText(80);
  });
  spec.content.selectedNode.actions.forEach((action) => {
    action.label = maxText(24);
  });
  return parseSceneSpec(spec);
}

function longestTable(): SceneSpec {
  const spec = firstSample("table");
  if (spec.archetype !== "table") throw new Error("Expected table");
  fillCommon(spec);
  spec.content.toolbar.searchPlaceholder = maxText(40);
  spec.content.toolbar.filters = spec.content.toolbar.filters.map(() => maxText(24));
  spec.content.columns.forEach((column) => {
    column.label = maxText(24);
  });
  spec.content.rows.forEach((row) => {
    row.cells.forEach((cell) => {
      if (cell.kind === "text") cell.value = maxText(56);
      if (cell.kind === "badge") cell.value = maxText(24);
      if (cell.kind === "person") {
        cell.name = maxText(40);
        cell.detail = maxText(48);
      }
      if (cell.kind === "number") {
        cell.value = maxText(16);
        cell.delta = maxText(16);
      }
      if (cell.kind === "date") cell.value = maxText(18);
    });
  });
  return parseSceneSpec(spec);
}

function longestModal(): SceneSpec {
  const spec = firstSample("modal");
  if (spec.archetype !== "modal") throw new Error("Expected modal");
  fillCommon(spec);
  spec.content.background.title = maxText(40);
  spec.content.background.items = spec.content.background.items.map(() => maxText(40));
  spec.content.modal.eyebrow = maxText(24);
  spec.content.modal.title = maxText(40);
  spec.content.modal.description = maxText(160);
  spec.content.modal.fields.forEach((field) => {
    field.label = maxText(24);
    field.value = maxText(80);
  });
  spec.content.modal.actions.forEach((action) => {
    action.label = maxText(24);
  });
  return parseSceneSpec(spec);
}

function longestWorkspace(): SceneSpec {
  const spec = firstSample("workspace");
  if (spec.archetype !== "workspace") throw new Error("Expected workspace");
  fillCommon(spec);
  spec.content.filters = spec.content.filters.map(() => maxText(24));
  spec.content.editor.eyebrow = maxText(24);
  spec.content.editor.title = maxText(40);
  spec.content.editor.body = maxText(220);
  spec.content.editor.keyPoints = spec.content.editor.keyPoints.map(() => maxText(160));
  spec.content.editor.tags = spec.content.editor.tags.map(() => maxText(24));
  spec.content.preview.title = maxText(40);
  spec.content.preview.emptyLabel = maxText(24);
  spec.content.preview.cards = spec.content.preview.cards.map(() => maxText(40));
  spec.content.tester.agentName = maxText(40);
  spec.content.tester.status = maxText(24);
  spec.content.tester.messages.forEach((message) => {
    message.text = maxText(160);
  });
  spec.content.tester.replies = spec.content.tester.replies.map(() => maxText(40));
  return parseSceneSpec(spec);
}

export const longestStringFixtures: { id: string; label: string; spec: SceneSpec }[] = conceptUiArchetypes.map((archetype) => {
  const specByArchetype = {
    inbox: longestInbox,
    dashboard: longestDashboard,
    builder: longestBuilder,
    table: longestTable,
    modal: longestModal,
    workspace: longestWorkspace,
  } satisfies Record<ConceptUiArchetype, () => SceneSpec>;
  return {
    id: `${archetype}-longest-en`,
    label: `${archetype} longest English`,
    spec: specByArchetype[archetype](),
  };
});
