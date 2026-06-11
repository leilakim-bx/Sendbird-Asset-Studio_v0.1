"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown, Upload, RefreshCw, Trash2, Check, Plus, Lightbulb } from "lucide-react";
import { Menu } from "@base-ui/react/menu";
import { useEditorStore } from "@/lib/store";
import {
  PRODUCT_VISUAL_BG_HEX,
  FORMAT_FIXED_BG,
  isImageBgFormat,
  type ProductVisualFormat,
  type ProductVisualBg,
} from "@/lib/types/product-visual";
import { BACKGROUNDS } from "@/lib/backgrounds";
import { buildProductVisualConcept } from "@/lib/product-visual/concept-ui";
import { MAX_UPLOAD_MB, uploadProductVisualScreenshot, UPLOAD_ACCEPT } from "@/lib/product-visual/upload-image";
import { AiMagicButton } from "@/components/ui/ai-magic-button";
import { Section } from "./Section";
import { CropSelector } from "./CropSelector";
import { BackgroundPickerModal } from "@/components/editor/BackgroundPickerModal";

const DISPLAY_MODES: { id: "crop" | "highlight"; label: string }[] = [
  { id: "crop", label: "Crop" },
  { id: "highlight", label: "Highlight" },
];

const DEFAULT_PANEL_W = 320;
const MIN_PANEL_W = 240;
const MAX_PANEL_W = 520;
const CONCEPT_UI_PLACEHOLDER = "Example: AI suggests the next best reply using customer memory and recent conversation history.";
const CONCEPT_UI_HELPER =
  "Describe what the feature does, what context it uses, and what result it shows.";

function IconTooltip({ label }: { label: string }) {
  return (
    <span className="pointer-events-none absolute bottom-full right-0 z-30 mb-1.5 rounded-md border border-studio-border bg-studio-bg px-2 py-1 text-[10px] font-medium text-studio-text opacity-0 shadow-xl transition-opacity duration-150 group-hover/action:opacity-100 group-focus-within/action:opacity-100">
      {label}
    </span>
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

  useEffect(() => {
    if (!content?.screenshot || !isImageBgFormat(content.format) || content.screenshot.displayMode === "crop") return;
    setProductVisualContent({
      ...content,
      screenshot: { ...content.screenshot, displayMode: "crop" },
    });
  }, [content, setProductVisualContent]);

  if (!content) return null;

  function update(patch: Partial<NonNullable<typeof content>>) {
    if (!content) return;
    setProductVisualContent({ ...content, ...patch });
  }

  function switchSourceMode(sourceMode: "screenshot" | "concept") {
    if (!content) return;
    if (sourceMode === "concept") {
      const prompt = content.concept?.prompt || content.title || "A/B test production traffic between agent versions";
      update({
        sourceMode,
        concept: content.concept ?? buildProductVisualConcept(prompt),
      });
      return;
    }
    update({ sourceMode });
  }

  function updateConceptPrompt(prompt: string) {
    const currentConcept = content!.concept ?? buildProductVisualConcept(prompt);
    update({
      sourceMode: "concept",
      concept: { ...currentConcept, prompt },
    });
  }

  function regenerateConcept() {
    const prompt = content!.concept?.prompt || content!.title || "A/B test production traffic between agent versions";
    update({
      sourceMode: "concept",
      concept: buildProductVisualConcept(prompt),
    });
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
  const conceptPrompt = content.concept?.prompt ?? "";
  const displayModes = cropOnly ? DISPLAY_MODES.filter((m) => m.id === "crop") : DISPLAY_MODES;
  // Solid-color swatches: hidden for image-bg formats and for formats whose
  // background is locked to a fixed hex (canvas ignores `bg` there).
  const showSolidBg = !imageBg && !FORMAT_FIXED_BG[content.format];
  const bgList = [...BACKGROUNDS, ...customBackgrounds];
  const selectedBgId = bgList.find((b) => b.url === content.bgImage)?.id ?? "";
  const current = FORMAT_FLAT.find((f) => f.id === content.format);

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
        className="absolute left-0 top-0 h-full w-px cursor-ew-resize z-10 bg-transparent hover:[background:#F2FF66] transition-colors"
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
          <div className="flex items-center gap-1 p-1 rounded-lg bg-[#0E0E0E]">
            {([
              { id: "screenshot", label: "Screenshot" },
              { id: "concept", label: "Concept UI" },
            ] as const).map((item) => {
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
              <div className="group relative rounded-lg overflow-hidden border border-studio-border bg-[#0E0E0E]">
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
            <div className="relative">
              <textarea
                value={conceptPrompt}
                onChange={(e) => updateConceptPrompt(e.currentTarget.value)}
                placeholder={CONCEPT_UI_PLACEHOLDER}
                rows={5}
                className="w-full resize-none rounded-lg border border-studio-border bg-[#0E0E0E] px-3 py-2 pb-14 pr-14 text-xs leading-relaxed text-studio-text outline-none placeholder:text-studio-muted/70 focus:border-studio-muted"
              />
              <div className="absolute bottom-4 right-3">
                <AiMagicButton
                  label="Generate UI"
                  loading={false}
                  disabled={false}
                  onClick={regenerateConcept}
                />
              </div>
            </div>
            <p className="mt-1.5 text-[11px] leading-snug text-studio-muted">{CONCEPT_UI_HELPER}</p>
            {content.concept && (
              <div className="mt-2 flex items-center justify-between gap-2 text-[11px] text-studio-muted">
                <span className="truncate">{content.concept.title}</span>
                <span className="shrink-0 rounded-full border border-studio-border px-2 py-0.5 uppercase tracking-wide">
                  {content.concept.kind}
                </span>
              </div>
            )}
          </Section>
        )}

        {sourceMode === "screenshot" && content.screenshot?.url && (
          <Section title="Settings">
            {!content.screenshot.crop && (
              <p className="mb-2 text-[11px] text-studio-muted leading-snug">
                {cropOnly ? "Select a key area first to crop." : "Select a key area first to crop or highlight."}
              </p>
            )}
            <div className="flex items-center gap-1 p-1 rounded-lg bg-[#0E0E0E]">
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

      {sourceMode === "screenshot" && cropOpen && content.screenshot?.url && (
        <CropSelector
          imageUrl={content.screenshot.url}
          crop={content.screenshot.crop}
          onApply={(crop) => {
            if (content.screenshot) {
              update({
                screenshot: {
                  ...content.screenshot,
                  crop,
                  displayMode: cropOnly ? "crop" : content.screenshot.displayMode,
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
