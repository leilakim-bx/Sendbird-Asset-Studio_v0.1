import { conceptUiSamples } from "./samples";
import { parseSceneSpec, type ConceptUiArchetype, type SceneSpec } from "./scene-spec";
import { conceptUiArchetypes } from "./slots";

function ko(length: number): string {
  return "가".repeat(length);
}

function firstSample(archetype: ConceptUiArchetype): SceneSpec {
  const sample = conceptUiSamples.find((item) => item.spec.archetype === archetype);
  if (!sample) throw new Error(`Missing sample for ${archetype}`);
  return structuredClone(sample.spec);
}

function fillCommon(spec: SceneSpec) {
  spec.content.productName = ko(40);
  spec.content.title = ko(56);
  spec.content.subtitle = ko(160);
  if (spec.modifiers.aiCallout) {
    spec.modifiers.aiCallout.label = ko(24);
    spec.modifiers.aiCallout.description = ko(160);
  }
}

function longestInbox(): SceneSpec {
  const spec = firstSample("inbox");
  if (spec.archetype !== "inbox") throw new Error("Expected inbox");
  fillCommon(spec);
  spec.content.conversations.forEach((item) => {
    item.customer = ko(40);
    item.title = ko(40);
    item.preview = ko(160);
    item.status = ko(24);
    item.time = ko(24);
    item.score = ko(8);
  });
  spec.content.thread.customerName = ko(40);
  spec.content.thread.statusLabel = ko(24);
  spec.content.thread.messages.forEach((item) => {
    item.name = ko(40);
    item.text = ko(220);
    item.timestamp = ko(24);
  });
  spec.content.context.customerName = ko(40);
  spec.content.context.summary = ko(160);
  spec.content.context.sections.forEach((section) => {
    section.title = ko(40);
    section.items.forEach((item) => {
      item.label = ko(24);
      item.value = ko(40);
    });
  });
  return parseSceneSpec(spec);
}

function longestDashboard(): SceneSpec {
  const spec = firstSample("dashboard");
  if (spec.archetype !== "dashboard") throw new Error("Expected dashboard");
  fillCommon(spec);
  spec.content.filters = spec.content.filters.map(() => ko(24));
  spec.content.kpis.forEach((item) => {
    item.label = ko(24);
    item.value = ko(16);
    item.delta = ko(16);
  });
  spec.content.lineChart.title = ko(40);
  spec.content.lineChart.seriesName = ko(24);
  spec.content.lineChart.points.forEach((point) => {
    point.label = ko(12);
  });
  spec.content.barChart.title = ko(40);
  spec.content.barChart.seriesName = ko(24);
  spec.content.barChart.bars.forEach((bar) => {
    bar.label = ko(18);
  });
  spec.content.table.title = ko(40);
  spec.content.table.rows.forEach((row) => {
    row.name = ko(40);
    row.volume = ko(16);
    row.status = ko(24);
    row.trend = ko(16);
  });
  return parseSceneSpec(spec);
}

function longestBuilder(): SceneSpec {
  const spec = firstSample("builder");
  if (spec.archetype !== "builder") throw new Error("Expected builder");
  fillCommon(spec);
  spec.content.paletteTitle = ko(24);
  spec.content.paletteItems.forEach((item) => {
    item.label = ko(24);
    item.description = ko(56);
  });
  spec.content.canvas.title = ko(40);
  spec.content.canvas.nodes.forEach((node) => {
    node.title = ko(40);
    node.description = ko(80);
    node.status = ko(20);
  });
  spec.content.canvas.edges.forEach((edge) => {
    edge.label = ko(24);
  });
  spec.content.selectedNode.panelTitle = ko(40);
  spec.content.selectedNode.fields.forEach((field) => {
    field.label = ko(24);
    field.value = ko(80);
  });
  spec.content.selectedNode.actions.forEach((action) => {
    action.label = ko(24);
  });
  return parseSceneSpec(spec);
}

function longestTable(): SceneSpec {
  const spec = firstSample("table");
  if (spec.archetype !== "table") throw new Error("Expected table");
  fillCommon(spec);
  spec.content.toolbar.searchPlaceholder = ko(40);
  spec.content.toolbar.filters = spec.content.toolbar.filters.map(() => ko(24));
  spec.content.columns.forEach((column) => {
    column.label = ko(24);
  });
  spec.content.rows.forEach((row) => {
    row.cells.forEach((cell) => {
      if (cell.kind === "text") cell.value = ko(56);
      if (cell.kind === "badge") cell.value = ko(24);
      if (cell.kind === "person") {
        cell.name = ko(40);
        cell.detail = ko(48);
      }
      if (cell.kind === "number") {
        cell.value = ko(16);
        cell.delta = ko(16);
      }
      if (cell.kind === "date") cell.value = ko(18);
    });
  });
  return parseSceneSpec(spec);
}

function longestModal(): SceneSpec {
  const spec = firstSample("modal");
  if (spec.archetype !== "modal") throw new Error("Expected modal");
  fillCommon(spec);
  spec.content.background.title = ko(40);
  spec.content.background.items = spec.content.background.items.map(() => ko(40));
  spec.content.modal.eyebrow = ko(24);
  spec.content.modal.title = ko(40);
  spec.content.modal.description = ko(160);
  spec.content.modal.fields.forEach((field) => {
    field.label = ko(24);
    field.value = ko(80);
  });
  spec.content.modal.actions.forEach((action) => {
    action.label = ko(24);
  });
  return parseSceneSpec(spec);
}

export const longestStringFixtures: { id: string; label: string; spec: SceneSpec }[] = conceptUiArchetypes.map((archetype) => {
  const specByArchetype = {
    inbox: longestInbox,
    dashboard: longestDashboard,
    builder: longestBuilder,
    table: longestTable,
    modal: longestModal,
  } satisfies Record<ConceptUiArchetype, () => SceneSpec>;
  return {
    id: `${archetype}-longest-ko`,
    label: `${archetype} longest Korean`,
    spec: specByArchetype[archetype](),
  };
});
