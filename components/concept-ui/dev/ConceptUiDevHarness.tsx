"use client";

import { useMemo, useRef, useState } from "react";
import { Download, RefreshCw } from "lucide-react";
import { ZodError } from "zod";
import { exportConceptSceneElement } from "@/lib/concept-ui/export-scene";
import { conceptUiSamples } from "@/lib/concept-ui/samples";
import { parseSceneSpec, type SceneSpec } from "@/lib/concept-ui/scene-spec";
import { CONCEPT_UI_CANVAS_HEIGHT, CONCEPT_UI_CANVAS_WIDTH } from "@/lib/concept-ui/scene-tokens";
import { SceneRenderer } from "../SceneRenderer";

function prettySpec(spec: SceneSpec): string {
  return JSON.stringify(spec, null, 2);
}

function formatError(error: unknown): string {
  if (error instanceof ZodError) {
    return error.issues.map((issue) => `${issue.path.join(".") || "spec"}: ${issue.message}`).join("\n");
  }
  if (error instanceof Error) return error.message;
  return String(error);
}

export function ConceptUiDevHarness() {
  const [sampleId, setSampleId] = useState(conceptUiSamples[0].id);
  const [json, setJson] = useState(prettySpec(conceptUiSamples[0].spec));
  const [exportHref, setExportHref] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);
  const [clipboardNote, setClipboardNote] = useState<string | null>(null);
  const canvasRef = useRef<HTMLDivElement>(null);

  const parsed = useMemo(() => {
    try {
      return { spec: parseSceneSpec(JSON.parse(json)), error: null };
    } catch (err) {
      return { spec: null, error: formatError(err) };
    }
  }, [json]);

  function loadSample(id: string) {
    setSampleId(id);
    const sample = conceptUiSamples.find((item) => item.id === id) ?? conceptUiSamples[0];
    setJson(prettySpec(sample.spec));
    setExportHref(null);
  }

  async function handleExport() {
    if (!canvasRef.current || !parsed.spec || exporting) return;
    setExporting(true);
    setExportHref(null);
    try {
      const image = await exportConceptSceneElement(canvasRef.current);
      setExportHref(image.url);
    } finally {
      setExporting(false);
    }
  }

  async function copySpecJson() {
    try {
      await navigator.clipboard.writeText(json);
      setClipboardNote("Spec JSON copied.");
    } catch {
      setClipboardNote("Could not copy spec JSON.");
    }
  }

  async function pasteSpecJson() {
    try {
      const text = await navigator.clipboard.readText();
      setJson(text);
      setExportHref(null);
      setClipboardNote("Pasted from clipboard.");
    } catch {
      setClipboardNote("Could not read clipboard.");
    }
  }

  return (
    <main className="min-h-screen bg-studio-bg text-studio-text">
      <div className="border-b border-studio-border bg-studio-sidebar px-6 py-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-semibold">Concept UI dev harness</h1>
            <p className="mt-1 text-xs text-studio-muted">
              Fixed {CONCEPT_UI_CANVAS_WIDTH}x{CONCEPT_UI_CANVAS_HEIGHT} renderer / zod validated / deterministic export.
            </p>
          </div>
          <a href="/dev/concept-ui/render" className="text-xs font-semibold text-studio-accent underline underline-offset-4">
            Render grid
          </a>
          <button
            type="button"
            onClick={handleExport}
            disabled={!parsed.spec || exporting}
            className="inline-flex items-center gap-2 rounded-lg bg-studio-accent px-4 py-2 text-sm font-semibold text-studio-accent-fg disabled:opacity-40"
          >
            {exporting ? <RefreshCw size={16} className="animate-spin" /> : <Download size={16} />}
            Export image
          </button>
        </div>
      </div>

      <div className="grid min-h-[calc(100vh-73px)] grid-cols-[420px_1fr]">
        <aside className="border-r border-studio-border bg-studio-sidebar p-5">
          <label className="block text-[11px] font-bold uppercase tracking-widest text-studio-muted">
            Sample
          </label>
          <select
            value={sampleId}
            onChange={(e) => loadSample(e.currentTarget.value)}
            className="mt-2 w-full rounded-lg border border-studio-border bg-[#0E0E0E] px-3 py-2 text-sm outline-none"
          >
            {conceptUiSamples.map((sample) => (
              <option key={sample.id} value={sample.id}>
                {sample.label}
              </option>
            ))}
          </select>

          <label className="mt-5 block text-[11px] font-bold uppercase tracking-widest text-studio-muted">
            SceneSpec JSON
          </label>
          <div className="mt-2 flex gap-2">
            <button
              type="button"
              onClick={copySpecJson}
              className="rounded-md border border-studio-border px-2.5 py-1.5 text-xs font-semibold text-studio-muted hover:text-studio-text"
            >
              Copy spec JSON
            </button>
            <button
              type="button"
              onClick={pasteSpecJson}
              className="rounded-md border border-studio-border px-2.5 py-1.5 text-xs font-semibold text-studio-muted hover:text-studio-text"
            >
              Paste spec JSON
            </button>
          </div>
          {clipboardNote ? <p className="mt-2 text-[11px] text-studio-muted">{clipboardNote}</p> : null}
          <textarea
            value={json}
            onChange={(e) => {
              setJson(e.currentTarget.value);
              setExportHref(null);
            }}
            spellCheck={false}
            className="mt-2 h-[610px] w-full resize-none rounded-lg border border-studio-border bg-[#0E0E0E] p-3 font-mono text-[11px] leading-relaxed text-studio-text outline-none"
          />

          {parsed.error ? (
            <pre className="mt-3 max-h-40 overflow-auto whitespace-pre-wrap rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-[11px] leading-relaxed text-red-200">
              {parsed.error}
            </pre>
          ) : (
            <p className="mt-3 rounded-lg border border-emerald-500/25 bg-emerald-500/10 p-3 text-[11px] text-emerald-200">
              Valid SceneSpec
            </p>
          )}

          {exportHref ? (
            <a
              href={exportHref}
              download={`concept-ui-${sampleId}.svg`}
              className="mt-3 inline-flex text-xs font-semibold text-studio-accent underline underline-offset-4"
            >
              Download exported image
            </a>
          ) : null}
        </aside>

        <section className="overflow-auto p-8">
          <div className="mx-auto w-fit rounded-xl border border-studio-border bg-studio-sidebar p-4 shadow-2xl">
            <div style={{ width: CONCEPT_UI_CANVAS_WIDTH * 0.5, height: CONCEPT_UI_CANVAS_HEIGHT * 0.5 }}>
              <div style={{ transform: "scale(0.5)", transformOrigin: "top left" }}>
                {parsed.spec ? (
                  <SceneRenderer spec={parsed.spec} />
                ) : (
                  <div
                    style={{
                      width: CONCEPT_UI_CANVAS_WIDTH,
                      height: CONCEPT_UI_CANVAS_HEIGHT,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    Invalid JSON
                  </div>
                )}
              </div>
            </div>
          </div>
          {parsed.spec ? (
            <div aria-hidden style={{ position: "fixed", left: "-10000px", top: 0, pointerEvents: "none" }}>
              <div ref={canvasRef}>
                <SceneRenderer spec={parsed.spec} />
              </div>
            </div>
          ) : null}
        </section>
      </div>
    </main>
  );
}
