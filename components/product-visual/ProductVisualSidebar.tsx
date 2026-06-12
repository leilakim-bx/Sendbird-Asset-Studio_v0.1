"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown, Upload, RefreshCw, Trash2, Check, Plus, Lightbulb, Copy, ExternalLink } from "lucide-react";
import { Menu } from "@base-ui/react/menu";
import { ZodError } from "zod";
import { useEditorStore } from "@/lib/store";
import {
  PRODUCT_VISUAL_BG_HEX,
  FORMAT_FIXED_BG,
  isImageBgFormat,
  type ProductVisualFormat,
  type ProductVisualBg,
} from "@/lib/types/product-visual";
import { BACKGROUNDS } from "@/lib/backgrounds";
import { MAX_UPLOAD_MB, uploadProductVisualScreenshot, UPLOAD_ACCEPT } from "@/lib/product-visual/upload-image";
import { Section } from "./Section";
import { CropSelector } from "./CropSelector";
import { BackgroundPickerModal } from "@/components/editor/BackgroundPickerModal";
import { SceneRenderer } from "@/components/concept-ui/SceneRenderer";
import {
  conceptSceneToProductScreenshot,
  exportConceptSceneElement,
  type FramingPreset,
} from "@/lib/concept-ui/export-scene";
import { ruleBasedSpecProvider } from "@/lib/concept-ui/provider";
import { parseSceneSpec, type SceneSpec } from "@/lib/concept-ui/scene-spec";
import { buildAiChatPrompt } from "@/lib/concept-ui/promptTemplates";
import { parseLlmSceneSpecResponse } from "@/lib/concept-ui/llm-response";

const DISPLAY_MODES: { id: "crop" | "highlight"; label: string }[] = [
  { id: "crop", label: "Crop" },
  { id: "highlight", label: "Highlight" },
];

const DEFAULT_PANEL_W = 320;
const MIN_PANEL_W = 240;
const MAX_PANEL_W = 520;
const CONCEPT_UI_PLACEHOLDER = "Example: AI suggests the next best reply using customer memory and recent conversation history.";
const CONCEPT_UI_TEXT_LANGUAGE = "en" as const;
const SOURCE_OPTIONS = [
  { id: "screenshot", label: "Screenshot" },
  { id: "concept", label: "Concept UI" },
] as const;
const FRAMING_PRESETS: { id: FramingPreset; label: string; description: string }[] = [
  { id: "hero-crop", label: "Hero crop", description: "Manually crop the generated scene" },
  { id: "floating-panel", label: "Floating panel", description: "Panel only, transparent" },
];

function prettySpec(spec: SceneSpec): string {
  return JSON.stringify(spec, null, 2);
}

function formatSpecError(error: unknown): string {
  if (error instanceof ZodError) {
    return error.issues.map((issue) => `${issue.path.join(".") || "spec"}: ${issue.message}`).join("\n");
  }
  if (error instanceof SyntaxError) return "Invalid JSON syntax.";
  if (error instanceof Error) return error.message;
  return String(error);
}

async function copyTextToClipboard(text: string): Promise<"clipboard" | "legacy" | "manual"> {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return "clipboard";
    }
  } catch {
    // Fall through to the legacy path for embedded browser contexts.
  }

  try {
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.setAttribute("readonly", "");
    textarea.style.position = "fixed";
    textarea.style.left = "-9999px";
    textarea.style.top = "0";
    textarea.style.opacity = "0";
    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();
    textarea.setSelectionRange(0, text.length);
    const copied = document.execCommand("copy");
    document.body.removeChild(textarea);
    if (copied) return "legacy";
  } catch {
    // Manual copy UI below is the final fallback.
  }

  return "manual";
}

function IconTooltip({ label }: { label: string }) {
  return (
    <span className="pointer-events-none absolute bottom-full right-0 z-30 mb-1.5 rounded-md border border-studio-border bg-studio-bg px-2 py-1 text-[10px] font-medium text-studio-text opacity-0 shadow-xl transition-opacity duration-150 group-hover/action:opacity-100 group-focus-within/action:opacity-100">
      {label}
    </span>
  );
}

function StepLabel({
  number,
  title,
  description,
}: {
  number: number;
  title: string;
  description?: string;
}) {
  return (
    <div className="flex items-start gap-2">
      <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-studio-hover text-[10px] font-bold text-studio-text">
        {number}
      </span>
      <span>
        <span className="block text-xs font-semibold text-studio-text">{title}</span>
        {description ? <span className="mt-0.5 block text-[11px] leading-snug text-studio-muted">{description}</span> : null}
      </span>
    </div>
  );
}

// ── Static option tables ──────────────────────────────────

const FORMAT_GROUPS: { group: string; items: { id: ProductVisualFormat; label: string; size: string }[] }[] = [
  {
    group: "Product Feature",
    items: [
      { id: "feature-desktop", label: "Desktop", size: "866×660" },
      { id: "feature-mobile", label: "Mobile", size: "343×var" },
    ],
  },
  {
    group: "Product Release",
    items: [
      { id: "release-thumbnail", label: "Thumbnail", size: "667×316" },
      { id: "release-insert", label: "Insert", size: "840×var" },
    ],
  },
  {
    group: "Blog",
    items: [{ id: "blog", label: "Default", size: "664×var" }],
  },
];

const FORMAT_FLAT = FORMAT_GROUPS.flatMap((g) => g.items);

const BG_OPTIONS: { id: ProductVisualBg; name: string }[] = [
  { id: "white", name: "White" },
  { id: "sky", name: "Sky" },
  { id: "stone", name: "Stone" },
  { id: "warmgray", name: "Warm gray" },
  { id: "dark", name: "Dark" },
];

export function ProductVisualSidebar() {
  const {
    productVisualContent: content,
    setProductVisualContent,
    setProductVisualFormat,
    customBackgrounds,
    addCustomBackground,
  } = useEditorStore();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [cropOpen, setCropOpen] = useState(false);
  const [bgModalOpen, setBgModalOpen] = useState(false);
  const [panelWidth, setPanelWidth] = useState(DEFAULT_PANEL_W);
  const [conceptPrompt, setConceptPrompt] = useState("");
  const [conceptScene, setConceptScene] = useState<SceneSpec | null>(null);
  const [conceptGenerating, setConceptGenerating] = useState(false);
  const [conceptError, setConceptError] = useState<string | null>(null);
  const [conceptCaptureId, setConceptCaptureId] = useState(0);
  const [framingPreset, setFramingPreset] = useState<FramingPreset>("floating-panel");
  const [lastConceptSpec, setLastConceptSpec] = useState<SceneSpec | null>(null);
  const [specJsonDraft, setSpecJsonDraft] = useState("");
  const [specPasteError, setSpecPasteError] = useState<string | null>(null);
  const [specNotice, setSpecNotice] = useState<string | null>(null);
  const [aiChatPromptCopied, setAiChatPromptCopied] = useState(false);
  const [aiChatPromptDraft, setAiChatPromptDraft] = useState("");
  const [aiChatReplyDraft, setAiChatReplyDraft] = useState("");
  const [aiChatError, setAiChatError] = useState<string | null>(null);
  const [aiChatNotice, setAiChatNotice] = useState<string | null>(null);
  const conceptCaptureRef = useRef<HTMLDivElement>(null);
  const manualPromptRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!content?.screenshot || !isImageBgFormat(content.format) || content.screenshot.displayMode === "crop") return;
    setProductVisualContent({
      ...content,
      screenshot: { ...content.screenshot, displayMode: "crop" },
    });
  }, [content, setProductVisualContent]);

  useEffect(() => {
    if (!aiChatError?.startsWith("Copy is blocked") || !aiChatPromptDraft) return;
    const timer = window.setTimeout(() => {
      manualPromptRef.current?.focus();
      manualPromptRef.current?.select();
    }, 80);
    return () => window.clearTimeout(timer);
  }, [aiChatError, aiChatPromptDraft]);

  useEffect(() => {
    if (!conceptGenerating || !conceptScene) return;
    const scene = conceptScene;
    let cancelled = false;

    async function captureConceptScene() {
      try {
        console.info("[concept-ui] capture start", {
          preset: framingPreset,
          archetype: scene.archetype,
        });
        if ("fonts" in document) {
          await Promise.race([
            document.fonts.ready,
            new Promise<void>((resolve) => window.setTimeout(resolve, 1000)),
          ]);
        }
        await new Promise<void>((resolve) => window.setTimeout(resolve, 50));
        const el = conceptCaptureRef.current;
        if (!el || cancelled) return;
        console.info("[concept-ui] export start", { preset: framingPreset });
        const exported = await exportConceptSceneElement(el, framingPreset);
        console.info("[concept-ui] export complete", {
          preset: framingPreset,
          naturalWidth: exported.naturalWidth,
          naturalHeight: exported.naturalHeight,
        });
        if (cancelled) return;
        const latest = useEditorStore.getState().productVisualContent;
        if (!latest) return;
        setProductVisualContent({
          ...latest,
          sourceMode: "concept",
          conceptScene: scene,
          screenshot: conceptSceneToProductScreenshot(exported),
        });
        if (framingPreset === "hero-crop") setCropOpen(true);
        setConceptScene(null);
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        setConceptError(msg || "Could not generate Concept UI.");
      } finally {
        if (!cancelled) setConceptGenerating(false);
      }
    }

    captureConceptScene();
    return () => {
      cancelled = true;
    };
  }, [conceptCaptureId, conceptGenerating, conceptScene, framingPreset, setProductVisualContent]);

  if (!content) return null;

  function update(patch: Partial<NonNullable<typeof content>>) {
    if (!content) return;
    setProductVisualContent({ ...content, ...patch });
  }

  function switchSourceMode(sourceMode: "screenshot" | "concept") {
    if (!content) return;
    if (sourceMode === "concept") {
      setConceptPrompt((prompt) => prompt || content.concept?.prompt || content.title || "AI support workspace");
      update({ sourceMode });
      return;
    }
    update({ sourceMode });
  }

  function updateConceptPrompt(prompt: string) {
    setConceptPrompt(prompt);
    setSpecNotice(null);
    setAiChatPromptCopied(false);
    setAiChatPromptDraft("");
    setAiChatError(null);
    setAiChatNotice(null);
  }

  function startConceptSpec(spec: SceneSpec, notice?: string) {
    setLastConceptSpec(spec);
    setSpecJsonDraft(prettySpec(spec));
    setSpecNotice(notice ?? null);
    setConceptError(null);
    setConceptScene(spec);
    setConceptGenerating(true);
    setConceptCaptureId((id) => id + 1);
  }

  async function copyPromptForAiChat() {
    const prompt = effectiveConceptPrompt.trim();
    if (!prompt) return;
    const text = buildAiChatPrompt({
      description: prompt,
      uiTextLanguage: CONCEPT_UI_TEXT_LANGUAGE,
      choice: analyzedChoice,
    });
    setAiChatPromptDraft(text);
    setAiChatError(null);
    setAiChatNotice(null);
    const copyResult = await copyTextToClipboard(text);
    if (copyResult === "manual") {
      setAiChatPromptCopied(false);
      setAiChatError("Copy is blocked in this browser. The prompt below is selected; press Cmd+C to copy it.");
      window.setTimeout(() => {
        manualPromptRef.current?.focus();
        manualPromptRef.current?.select();
      }, 120);
    } else {
      setAiChatPromptCopied(true);
      setSpecNotice("Prompt copied. Paste it into Claude or Gemini.");
    }
  }

  function useAiChatReply() {
    const result = parseLlmSceneSpecResponse(aiChatReplyDraft);
    if (!result.ok) {
      console.info("[concept-ui] AI chat reply parse failed", {
        rawLength: aiChatReplyDraft.length,
        errorType: result.errorType,
      });
      setAiChatError(result.message);
      setAiChatNotice(null);
      return;
    }

    setAiChatError(null);
    setAiChatNotice(result.notice ?? "AI reply imported.");
    startConceptSpec(result.spec, result.notice ?? "AI reply imported.");
  }

  async function copySpecJson() {
    const spec = activeConceptSpec;
    if (!spec) return;
    const text = prettySpec(spec);
    try {
      await navigator.clipboard.writeText(text);
      setSpecNotice("Spec JSON copied.");
    } catch {
      setSpecJsonDraft(text);
      setSpecNotice("Copy failed. JSON is shown below.");
    }
  }

  function pasteSpecJson() {
    try {
      const parsed = parseSceneSpec(JSON.parse(specJsonDraft));
      setSpecPasteError(null);
      startConceptSpec(parsed, "Pasted spec validated.");
    } catch (err) {
      setSpecPasteError(formatSpecError(err));
    }
  }

  async function handleFile(file: File | undefined) {
    if (!file || uploading) return;
    setUploadError(null);
    setUploading(true);
    try {
      const res = await uploadProductVisualScreenshot(file);
      if (!res.ok) {
        setUploadError(res.error);
        return;
      }
      const latest = useEditorStore.getState().productVisualContent;
      if (!latest) return;
      // New/replaced image → fresh screenshot (crop reset; natural dims captured).
      setProductVisualContent({
        ...latest,
        sourceMode: "screenshot",
        screenshot: {
          url: res.url,
          displayMode: "crop",
          naturalWidth: res.naturalWidth,
          naturalHeight: res.naturalHeight,
        },
      });
    } finally {
      setUploading(false);
    }
  }

  // Product Feature formats use a full-bleed background image (same library as
  // the Chat editor); other formats use a solid/fixed color. No title/subtitle
  // or layout chrome on any format — just background + screenshot.
  const imageBg = isImageBgFormat(content.format);
  const cropOnly = imageBg;
  const sourceMode = content.sourceMode ?? "screenshot";
  const effectiveConceptPrompt = conceptPrompt || content.concept?.prompt || content.title || "";
  const analyzedChoice = ruleBasedSpecProvider.analyze({ description: effectiveConceptPrompt });
  const activeConceptSpec = lastConceptSpec ?? content.conceptScene ?? null;
  const displayModes = cropOnly ? DISPLAY_MODES.filter((m) => m.id === "crop") : DISPLAY_MODES;
  // Solid-color swatches: hidden for image-bg formats and for formats whose
  // background is locked to a fixed hex (canvas ignores `bg` there).
  const showSolidBg = !imageBg && !FORMAT_FIXED_BG[content.format];
  const bgList = [...BACKGROUNDS, ...customBackgrounds];
  const selectedBgId = bgList.find((b) => b.url === content.bgImage)?.id ?? "";
  const current = FORMAT_FLAT.find((f) => f.id === content.format);

  function recaptureConceptSpec(spec: SceneSpec | null = activeConceptSpec) {
    const nextSpec = spec ?? activeConceptSpec;
    if (sourceMode !== "concept" || !nextSpec) return;
    setConceptError(null);
    setConceptScene(nextSpec);
    setConceptGenerating(true);
    setConceptCaptureId((id) => id + 1);
  }

  function handleFramingPresetChange(preset: FramingPreset) {
    setFramingPreset(preset);
    recaptureConceptSpec();
  }

  function handleResizeStart(e: React.MouseEvent) {
    e.preventDefault();
    const startX = e.clientX;
    const startW = panelWidth;
    function onMove(ev: MouseEvent) {
      const delta = startX - ev.clientX;
      setPanelWidth(Math.min(MAX_PANEL_W, Math.max(MIN_PANEL_W, startW + delta)));
    }
    function onUp() {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    }
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  }

  return (
    <div
      style={{ width: panelWidth }}
      className="relative shrink-0 h-full flex flex-col bg-studio-sidebar border-l border-studio-border"
    >
      <div
        onMouseDown={handleResizeStart}
        className="absolute left-0 top-0 h-full w-px cursor-ew-resize z-10 bg-transparent hover:bg-studio-accent transition-colors"
        title="Drag to resize panel"
      />

      <div className="flex-1 overflow-y-auto">
        {/* FORMAT — grouped dropdown */}
        <Section title="Format">
          <Menu.Root>
            <Menu.Trigger className="flex w-full items-center justify-between gap-2 rounded-md border border-studio-border bg-studio-sidebar px-2.5 py-2 text-xs text-studio-text hover:bg-studio-hover transition-colors outline-none">
              <span className="flex items-center gap-1.5">
                <span className="font-medium">{current?.label ?? "Select"}</span>
                <span className="text-studio-muted tabular-nums">{current?.size}</span>
              </span>
              <ChevronDown size={14} className="text-studio-muted" />
            </Menu.Trigger>
            <Menu.Portal>
              <Menu.Positioner side="bottom" align="start" sideOffset={6} className="z-50">
                <Menu.Popup className="z-50 min-w-[260px] rounded-xl border border-studio-border bg-studio-sidebar shadow-xl py-2 outline-none origin-top data-[ending-style]:animate-out data-[ending-style]:fade-out-0 data-[ending-style]:zoom-out-95 data-[starting-style]:animate-in data-[starting-style]:fade-in-0 data-[starting-style]:zoom-in-95 duration-100">
                  {FORMAT_GROUPS.map((g, gi) => (
                    <div key={g.group}>
                      {gi > 0 && <Menu.Separator className="h-px bg-studio-border mx-1 my-1.5" />}
                      <div className="px-3 pt-1 pb-1.5 text-[10px] font-bold uppercase tracking-wider text-studio-muted select-none">
                        {g.group}
                      </div>
                      {g.items.map((it) => {
                        const active = content.format === it.id;
                        return (
                          <Menu.Item
                            key={it.id}
                            onClick={() => setProductVisualFormat(it.id)}
                            className="flex items-center gap-2 px-3 py-2 text-sm text-studio-text hover:bg-studio-hover cursor-default outline-none rounded-lg mx-1"
                          >
                            <span className="w-4 shrink-0">
                              {active && <Check size={14} className="text-studio-accent" />}
                            </span>
                            <span className="flex-1">{it.label}</span>
                            <span className="text-[11px] text-studio-muted tabular-nums">{it.size}</span>
                          </Menu.Item>
                        );
                      })}
                    </div>
                  ))}
                </Menu.Popup>
              </Menu.Positioner>
            </Menu.Portal>
          </Menu.Root>
        </Section>

        {/* BACKGROUND — image picker for Product Feature (same library as Chat),
            solid swatches for other formats, hidden when the bg is fixed. */}
        {imageBg && (
          <Section
            title="Background"
            action={
              <button
                onClick={() => setBgModalOpen(true)}
                title="Background Library"
                aria-label="Background Library"
                className="flex items-center justify-center w-6 h-6 rounded-md text-studio-muted hover:text-studio-text hover:bg-white/[0.06] transition-colors"
              >
                <Plus size={15} />
              </button>
            }
          >
            <div className="grid grid-cols-3 gap-2">
              {bgList.slice(0, 6).map((bg) => (
                <button
                  key={bg.id}
                  onClick={() => update({ bgImage: bg.url })}
                  title={bg.label}
                  className={[
                    "relative rounded-lg overflow-hidden aspect-video border-2 transition-colors",
                    content.bgImage === bg.url
                      ? "border-studio-accent"
                      : "border-transparent hover:border-studio-muted",
                  ].join(" ")}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={bg.url} alt={bg.label} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          </Section>
        )}

        {showSolidBg && (
          <Section title="Background">
            <div className="flex gap-1.5 flex-wrap">
              {BG_OPTIONS.map((bg) => (
                <button
                  key={bg.id}
                  onClick={() => update({ bg: bg.id })}
                  title={bg.name}
                  className={[
                    "w-8 h-8 rounded-md border-2 transition-transform hover:scale-110",
                    content.bg === bg.id ? "border-studio-accent" : "border-studio-border",
                  ].join(" ")}
                  style={{
                    background: PRODUCT_VISUAL_BG_HEX[bg.id],
                    boxShadow: content.bg === bg.id ? "0 0 0 1px var(--studio-sidebar)" : undefined,
                  }}
                />
              ))}
            </div>
          </Section>
        )}

        <Section title="Source">
          <div className="flex items-center gap-1 p-1 rounded-lg bg-studio-input">
            {SOURCE_OPTIONS.map((item) => {
              const active = sourceMode === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => switchSourceMode(item.id)}
                  aria-pressed={active}
                  className={[
                    "flex-1 px-2 py-1.5 rounded-md text-[11px] font-medium transition-colors",
                    active
                      ? "bg-studio-hover text-studio-text"
                      : "text-studio-muted hover:text-studio-text",
                  ].join(" ")}
                >
                  {item.label}
                </button>
              );
            })}
          </div>
        </Section>

        {/* SCREENSHOT */}
        {sourceMode === "screenshot" && (
        <Section title="Screenshot">
          <input
            ref={fileInputRef}
            type="file"
            accept={UPLOAD_ACCEPT}
            className="hidden"
            onChange={(e) => {
              handleFile(e.target.files?.[0]);
              if (fileInputRef.current) fileInputRef.current.value = "";
            }}
          />
          {content.screenshot?.url ? (
            <div className="flex flex-col gap-3">
              {/* Preview — hover reveals a Replace overlay */}
              <div className="group relative rounded-lg overflow-hidden border border-studio-border bg-studio-input">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={content.screenshot.url} alt="Uploaded screenshot" className="w-full h-28 object-contain" />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  aria-label="Replace screenshot"
                  disabled={uploading}
                  className="absolute inset-0 flex items-center justify-center bg-black/55 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/15 border border-white/25 text-xs font-medium text-white">
                    <RefreshCw size={13} /> {uploading ? "Uploading…" : "Replace"}
                  </span>
                </button>
              </div>

              {/* Actions — Select key area (button) + delete icon */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCropOpen(true)}
                  className="text-xs font-semibold px-3 py-2 rounded-lg bg-studio-accent text-studio-accent-fg hover:opacity-90 transition-opacity"
                >
                  {content.screenshot.crop ? "Edit crop" : "Select key area"}
                </button>
                <div className="ml-auto flex items-center gap-1">
                  <span className="group/action relative inline-flex">
                    <button
                      type="button"
                      onClick={() => update({ screenshot: undefined })}
                      aria-label="Delete screenshot"
                      className="flex items-center justify-center w-7 h-7 rounded-md text-studio-muted hover:text-red-400 hover:bg-white/[0.06] transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                    <IconTooltip label="Delete" />
                  </span>
                </div>
              </div>

            </div>
          ) : (
            <button
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragging(false);
                handleFile(e.dataTransfer.files?.[0]);
              }}
              disabled={uploading}
              className={[
                "flex flex-col items-center justify-center gap-2 w-full py-7 rounded-lg border-[1.6px] border-dashed transition-colors",
                uploading ? "opacity-60 cursor-wait" : "",
                dragging
                  ? "border-studio-accent bg-studio-accent/[0.06] text-studio-text"
                  : "border-studio-border text-studio-muted hover:text-studio-text hover:border-studio-muted",
              ].join(" ")}
            >
              <Upload size={20} />
              <span className="text-xs font-medium">{uploading ? "Uploading…" : "Click or drag to upload"}</span>
            </button>
          )}
          {uploadError ? (
            <p className="mt-1.5 text-[11px] text-red-400 leading-snug">{uploadError}</p>
          ) : (
            <p className="mt-1.5 text-[11px] text-studio-muted leading-snug">
              PNG · JPG · WebP · max {MAX_UPLOAD_MB} MB
            </p>
          )}
          {content.format === "release-thumbnail" && (
            <div className="mt-1.5 flex items-start gap-1.5 text-[11px] text-studio-accent leading-snug">
              <Lightbulb size={12} className="mt-[1px] shrink-0" />
              <p>Tip: For thumbnails, crop to the key UI instead of showing the full dashboard.</p>
            </div>
          )}
        </Section>
        )}

        {sourceMode === "concept" && (
          <Section title="Concept UI">
            <div className="space-y-3">
              <StepLabel
                number={1}
                title="Describe the feature"
                description="This becomes the brief for the product UI mock."
              />
              <textarea
                value={effectiveConceptPrompt}
                onChange={(e) => updateConceptPrompt(e.currentTarget.value)}
                placeholder={CONCEPT_UI_PLACEHOLDER}
                rows={5}
                className="w-full resize-none rounded-lg border border-studio-border bg-studio-input px-3 py-2 text-xs leading-relaxed text-studio-text outline-none placeholder:text-studio-muted/70 focus:border-studio-muted"
              />
            </div>

            <div className="mt-4 space-y-3">
              <StepLabel
                number={2}
                title="Create the UI"
                description="Copy the prompt, run it in Claude or Gemini, then paste the reply back here."
              />
              <button
                type="button"
                onClick={copyPromptForAiChat}
                disabled={!effectiveConceptPrompt.trim()}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-studio-accent px-3 py-2.5 text-xs font-semibold text-studio-accent-fg transition-opacity hover:opacity-90 disabled:opacity-40"
              >
                <Copy size={14} />
                Copy prompt for Claude / Gemini
              </button>
            </div>

            {conceptError ? (
              <p className="mt-2 text-[11px] leading-snug text-red-400">{conceptError}</p>
            ) : null}
            {specNotice ? (
              <p className="mt-2 text-[11px] leading-snug text-studio-muted">{specNotice}</p>
            ) : null}
            {aiChatError ? (
              <div className="mt-2 rounded-lg border border-red-400/30 bg-red-400/10 p-2">
                <p className="text-[11px] leading-snug text-red-300">{aiChatError}</p>
                {aiChatPromptDraft ? (
                  <textarea
                    ref={manualPromptRef}
                    value={aiChatPromptDraft}
                    readOnly
                    rows={6}
                    onFocus={(event) => event.currentTarget.select()}
                    className="mt-2 w-full resize-none rounded-md border border-red-300/30 bg-black/30 p-2 font-mono text-[10px] leading-relaxed text-red-50 outline-none"
                  />
                ) : null}
                <button
                  type="button"
                  onClick={copyPromptForAiChat}
                  className="mt-2 rounded-md border border-red-300/40 px-2 py-1 text-[10px] font-semibold text-red-200 hover:bg-red-300/10"
                >
                  Copy prompt again
                </button>
              </div>
            ) : null}
            {aiChatNotice ? (
              <p className="mt-2 text-[11px] leading-snug text-studio-muted">{aiChatNotice}</p>
            ) : null}
            {(aiChatPromptCopied || aiChatPromptDraft) ? (
              <div className="mt-4 rounded-xl border border-studio-border bg-studio-input p-3">
                <StepLabel
                  number={3}
                  title="Paste the AI reply"
                  description="Copy the full chat response and paste it here."
                />
                <div className="mt-3 flex gap-1.5">
                  <a
                    href="https://claude.ai/new"
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-md border border-studio-border px-2 py-1.5 text-[11px] font-semibold text-studio-muted hover:text-studio-text"
                  >
                    Claude <ExternalLink size={11} />
                  </a>
                  <a
                    href="https://gemini.google.com/app"
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-md border border-studio-border px-2 py-1.5 text-[11px] font-semibold text-studio-muted hover:text-studio-text"
                  >
                    Gemini <ExternalLink size={11} />
                  </a>
                </div>
                {aiChatPromptDraft && !aiChatPromptCopied ? (
                  <textarea
                    value={aiChatPromptDraft}
                    readOnly
                    rows={4}
                    className="mt-3 w-full resize-none rounded-md border border-studio-border bg-black/30 p-2 font-mono text-[10px] leading-relaxed text-studio-text outline-none"
                  />
                ) : null}
                <textarea
                  value={aiChatReplyDraft}
                  onChange={(e) => {
                    setAiChatReplyDraft(e.currentTarget.value);
                    setAiChatError(null);
                    setAiChatNotice(null);
                  }}
                  placeholder="Paste the AI reply here"
                  rows={6}
                  spellCheck={false}
                  className="mt-3 w-full resize-none rounded-lg border border-studio-border bg-black/30 p-2 text-xs leading-relaxed text-studio-text outline-none placeholder:text-studio-muted/60 focus:border-studio-muted"
                />
                <button
                  type="button"
                  onClick={useAiChatReply}
                  disabled={!aiChatReplyDraft.trim() || conceptGenerating}
                  className="mt-2 flex w-full items-center justify-center gap-2 rounded-lg bg-studio-accent px-3 py-2 text-xs font-semibold text-studio-accent-fg disabled:opacity-40"
                >
                  {conceptGenerating ? <RefreshCw size={14} className="animate-spin" /> : <Check size={14} />}
                  Render AI reply
                </button>
              </div>
            ) : null}
            <div className="mt-4 space-y-3">
              <StepLabel
                number={4}
                title="Choose the frame"
                description="This controls what part of the mock becomes the image."
              />
              <div className="grid grid-cols-2 gap-1.5">
                {FRAMING_PRESETS.map((preset) => {
                  const active = framingPreset === preset.id;
                  return (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => handleFramingPresetChange(preset.id)}
                      title={preset.description}
                      className={[
                        "rounded-lg border p-1.5 text-left transition-colors",
                        active
                          ? "border-studio-accent bg-studio-accent/[0.08] text-studio-text"
                          : "border-studio-border text-studio-muted hover:text-studio-text hover:bg-white/[0.04]",
                      ].join(" ")}
                    >
                      <span className="block h-9 rounded-md border border-current/20 bg-studio-input p-1">
                        <span
                          className={[
                            "block bg-current/70",
                            preset.id === "hero-crop"
                                ? "h-full w-2/3 rounded-sm"
                                : "mx-auto mt-1 h-5 w-8 rounded-sm shadow-sm",
                          ].join(" ")}
                        />
                      </span>
                      <span className="mt-1 block truncate text-[10px] font-semibold">{preset.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <details className="mt-4 rounded-lg border border-studio-border bg-studio-input p-2">
              <summary className="cursor-pointer text-[11px] font-semibold text-studio-muted hover:text-studio-text">
                Advanced: import / export spec JSON
              </summary>
              <div className="mt-2 flex gap-1.5">
                <button
                  type="button"
                  onClick={copySpecJson}
                  disabled={!activeConceptSpec}
                  className="rounded-md border border-studio-border px-2 py-1 text-[11px] font-semibold text-studio-muted hover:text-studio-text disabled:opacity-40"
                >
                  Copy spec JSON
                </button>
                <button
                  type="button"
                  onClick={pasteSpecJson}
                  disabled={!specJsonDraft.trim()}
                  className="rounded-md bg-studio-accent px-2 py-1 text-[11px] font-semibold text-studio-accent-fg disabled:opacity-40"
                >
                  Paste spec JSON
                </button>
              </div>
              <textarea
                value={specJsonDraft}
                onChange={(e) => {
                  setSpecJsonDraft(e.currentTarget.value);
                  setSpecPasteError(null);
                }}
                placeholder="Paste SceneSpec JSON"
                spellCheck={false}
                rows={5}
                className="mt-2 w-full resize-none rounded-md border border-studio-border bg-black/30 p-2 font-mono text-[10px] leading-relaxed text-studio-text outline-none placeholder:text-studio-muted/60"
              />
              {specPasteError ? (
                <p className="mt-1.5 whitespace-pre-wrap text-[10px] leading-relaxed text-red-400">{specPasteError}</p>
              ) : null}
            </details>
          </Section>
        )}

        {sourceMode === "screenshot" && content.screenshot?.url && (
          <Section title="Settings">
            {!content.screenshot.crop && (
              <p className="mb-2 text-[11px] text-studio-muted leading-snug">
                {cropOnly ? "Select a key area first to crop." : "Select a key area first to crop or highlight."}
              </p>
            )}
            <div className="flex items-center gap-1 p-1 rounded-lg bg-studio-input">
              {displayModes.map((m) => {
                const enabled = !!content.screenshot?.crop;
                const active = cropOnly ? m.id === "crop" : content.screenshot?.displayMode === m.id;
                return (
                  <button
                    key={m.id}
                    disabled={!enabled}
                    onClick={() =>
                      content.screenshot &&
                      update({ screenshot: { ...content.screenshot, displayMode: cropOnly ? "crop" : m.id } })
                    }
                    aria-pressed={active}
                    className={[
                      "flex-1 px-2 py-1.5 rounded-md text-[11px] font-medium transition-colors",
                      !enabled
                        ? "text-studio-muted/40 cursor-not-allowed"
                        : active
                          ? "bg-studio-hover text-studio-text"
                          : "text-studio-muted hover:text-studio-text",
                    ].join(" ")}
                  >
                    {m.label}
                  </button>
                );
              })}
            </div>
          </Section>
        )}

      </div>

      {conceptScene ? (
        <div aria-hidden style={{ position: "fixed", left: "-10000px", top: 0, pointerEvents: "none" }}>
          <div ref={conceptCaptureRef}>
            <SceneRenderer spec={conceptScene} />
          </div>
        </div>
      ) : null}

      {bgModalOpen && (
        <BackgroundPickerModal
          currentId={selectedBgId}
          customBackgrounds={customBackgrounds}
          hiddenGroups={["industry"]}
          onSelect={(bg) => update({ bgImage: bg.url })}
          onUpload={(bg) => { addCustomBackground(bg); update({ bgImage: bg.url }); }}
          onClose={() => setBgModalOpen(false)}
        />
      )}

      {cropOpen && content.screenshot?.url && (
        <CropSelector
          imageUrl={content.screenshot.url}
          crop={content.screenshot.crop}
          onApply={(crop) => {
            if (content.screenshot) {
              update({
                screenshot: {
                  ...content.screenshot,
                  crop,
                  displayMode: sourceMode === "concept" || cropOnly ? "crop" : content.screenshot.displayMode,
                },
              });
            }
            setCropOpen(false);
          }}
          onCancel={() => setCropOpen(false)}
        />
      )}
    </div>
  );
}
