"use client";

import { longestStringFixtures } from "@/lib/concept-ui/longest-fixtures";
import { conceptUiSamples } from "@/lib/concept-ui/samples";
import { CONCEPT_UI_CANVAS_HEIGHT, CONCEPT_UI_CANVAS_WIDTH } from "@/lib/concept-ui/scene-tokens";
import { SceneRenderer } from "../SceneRenderer";

export function ConceptUiRenderGrid() {
  const samples = conceptUiSamples;
  const fixtures = longestStringFixtures;

  return (
    <main className="min-h-screen bg-studio-bg p-8 text-studio-text">
      <div className="mb-6 flex items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Concept UI render grid</h1>
          <p className="mt-1 text-sm text-studio-muted">
            {samples.length} sample specs plus {fixtures.length} max-length Korean fixtures.
          </p>
        </div>
        <a href="/dev/concept-ui" className="text-sm font-semibold text-studio-accent underline underline-offset-4">
          Open single-spec harness
        </a>
      </div>

      <section>
        <h2 className="mb-3 text-sm font-bold uppercase tracking-widest text-studio-muted">Samples</h2>
        <div className="grid grid-cols-2 gap-5">
          {samples.map((sample) => (
            <article key={sample.id} className="rounded-xl border border-studio-border bg-studio-sidebar p-3">
              <div className="mb-2 flex items-center justify-between gap-3">
                <h3 className="truncate text-sm font-semibold">{sample.label}</h3>
                <span className="rounded-full border border-studio-border px-2 py-0.5 text-[10px] uppercase text-studio-muted">
                  {sample.spec.archetype}
                </span>
              </div>
              <div
                className="overflow-hidden rounded-lg bg-[#F7F5F0]"
                style={{ width: CONCEPT_UI_CANVAS_WIDTH * 0.32, height: CONCEPT_UI_CANVAS_HEIGHT * 0.32 }}
              >
                <div style={{ transform: "scale(0.32)", transformOrigin: "top left" }}>
                  <SceneRenderer spec={sample.spec} />
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="mt-8">
        <h2 className="mb-3 text-sm font-bold uppercase tracking-widest text-studio-muted">Max-length Korean fixtures</h2>
        <div className="grid grid-cols-2 gap-5">
          {fixtures.map((fixture) => (
            <article key={fixture.id} className="rounded-xl border border-studio-border bg-studio-sidebar p-3">
              <div className="mb-2 flex items-center justify-between gap-3">
                <h3 className="truncate text-sm font-semibold">{fixture.label}</h3>
                <span className="rounded-full border border-studio-border px-2 py-0.5 text-[10px] uppercase text-studio-muted">
                  {fixture.spec.archetype}
                </span>
              </div>
              <div
                className="overflow-hidden rounded-lg bg-[#F7F5F0]"
                style={{ width: CONCEPT_UI_CANVAS_WIDTH * 0.32, height: CONCEPT_UI_CANVAS_HEIGHT * 0.32 }}
              >
                <div style={{ transform: "scale(0.32)", transformOrigin: "top left" }}>
                  <SceneRenderer spec={fixture.spec} />
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
