import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { SceneRenderer } from "@/components/concept-ui/SceneRenderer";
import { CONCEPT_UI_CANVAS_HEIGHT, CONCEPT_UI_CANVAS_WIDTH } from "@/lib/concept-ui/scene-tokens";
import { longestStringFixtures } from "@/lib/concept-ui/longest-fixtures";
import { conceptUiSamples } from "@/lib/concept-ui/samples";
import type { SceneSpec } from "@/lib/concept-ui/scene-spec";

function renderScene(spec: SceneSpec) {
  return renderToStaticMarkup(React.createElement(SceneRenderer, { spec }));
}

function expectRenderableScene(html: string) {
  expect(html).toContain('data-concept-ui-canvas="true"');
  expect(html).toContain('data-concept-primary-panel="true"');
  expect(html).toContain(`width:${CONCEPT_UI_CANVAS_WIDTH}px`);
  expect(html).toContain(`height:${CONCEPT_UI_CANVAS_HEIGHT}px`);
  expect(html).not.toContain("NaN");
  expect(html).not.toContain("Infinity");
  expect(html).not.toContain("undefined");
  expect(html).not.toContain("Lorem ipsum");
  expect(html).not.toContain("AI pre-filled");
  expect(html.length).toBeGreaterThan(8_000);
}

describe("Concept UI render quality smoke", () => {
  it.each(conceptUiSamples.map((sample) => [sample.id, sample.spec] as const))(
    "renders bundled sample %s as a non-empty deterministic scene",
    (_id, spec) => {
      expectRenderableScene(renderScene(spec));
    },
  );

  it.each(longestStringFixtures.map((fixture) => [fixture.id, fixture.spec] as const))(
    "renders max-length English fixture %s without unstable markup",
    (_id, spec) => {
      expectRenderableScene(renderScene(spec));
    },
  );
});
