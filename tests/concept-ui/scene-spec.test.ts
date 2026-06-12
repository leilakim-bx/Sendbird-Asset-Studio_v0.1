import { describe, expect, it } from "vitest";
import { longestStringFixtures } from "@/lib/concept-ui/longest-fixtures";
import { conceptUiSamples } from "@/lib/concept-ui/samples";
import { parseSceneSpec, sceneSpecSchema } from "@/lib/concept-ui/scene-spec";

describe("SceneSpec", () => {
  it("bundles 15 concept UI samples across five archetypes", () => {
    expect(conceptUiSamples).toHaveLength(15);
    expect(new Set(conceptUiSamples.map((sample) => sample.spec.archetype))).toEqual(
      new Set(["inbox", "dashboard", "builder", "table", "modal"]),
    );
  });

  it("parses all bundled concept UI samples", () => {
    for (const sample of conceptUiSamples) {
      expect(() => parseSceneSpec(sample.spec)).not.toThrow();
    }
  });

  it("parses max-length Korean fixtures for every archetype", () => {
    expect(longestStringFixtures).toHaveLength(5);
    for (const fixture of longestStringFixtures) {
      expect(() => parseSceneSpec(fixture.spec)).not.toThrow();
    }
  });

  it("keeps builder sample node bodies from overlapping", () => {
    const stageW = 700;
    const stageH = 560;
    const nodeW = 150;
    const nodeH = 92;
    for (const sample of conceptUiSamples.filter((item) => item.spec.archetype === "builder")) {
      if (sample.spec.archetype !== "builder") continue;
      const rects = sample.spec.content.canvas.nodes.map((node) => ({
        id: node.id,
        left: (node.x / 1000) * (stageW - nodeW),
        top: (node.y / 640) * (stageH - nodeH),
        right: (node.x / 1000) * (stageW - nodeW) + nodeW,
        bottom: (node.y / 640) * (stageH - nodeH) + nodeH,
      }));
      for (let i = 0; i < rects.length; i += 1) {
        for (let j = i + 1; j < rects.length; j += 1) {
          const a = rects[i];
          const b = rects[j];
          const overlaps = a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top;
          expect(overlaps, `${sample.id}: ${a.id} overlaps ${b.id}`).toBe(false);
        }
      }
    }
  });

  it("rejects overlong text fields with a zod error", () => {
    const spec = structuredClone(conceptUiSamples[0].spec);
    if (spec.archetype !== "inbox") throw new Error("Expected inbox sample");
    spec.content.conversations[0].title = "x".repeat(41);

    const result = sceneSpecSchema.safeParse(spec);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.path.join(".")).toBe("content.conversations.0.title");
    }
  });
});
