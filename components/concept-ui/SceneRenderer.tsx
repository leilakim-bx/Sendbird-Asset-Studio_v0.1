"use client";

import type { SceneSpec } from "@/lib/concept-ui/scene-spec";
import { CONCEPT_UI_CANVAS_HEIGHT, CONCEPT_UI_CANVAS_WIDTH, conceptSceneTokens as t } from "@/lib/concept-ui/scene-tokens";
import { BuilderScene } from "./archetypes/BuilderScene";
import { DashboardScene } from "./archetypes/DashboardScene";
import { InboxScene } from "./archetypes/InboxScene";
import { ModalScene } from "./archetypes/ModalScene";
import { TableScene } from "./archetypes/TableScene";

function renderScene(spec: SceneSpec) {
  if (spec.archetype === "inbox") return <InboxScene spec={spec} />;
  if (spec.archetype === "dashboard") return <DashboardScene spec={spec} />;
  if (spec.archetype === "builder") return <BuilderScene spec={spec} />;
  if (spec.archetype === "table") return <TableScene spec={spec} />;
  return <ModalScene spec={spec} />;
}

export function SceneRenderer({ spec }: { spec: SceneSpec }) {
  return (
    <div
      style={{
        width: CONCEPT_UI_CANVAS_WIDTH,
        height: CONCEPT_UI_CANVAS_HEIGHT,
        background: t.color.page,
        color: t.color.text,
        fontFamily: t.font.sans,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
        letterSpacing: 0,
      }}
      data-concept-ui-canvas="true"
    >
      <div
        style={{
          width: 1450,
          height: 870,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {renderScene(spec)}
      </div>
    </div>
  );
}
