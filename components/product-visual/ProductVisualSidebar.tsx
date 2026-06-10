"use client";

import { useRef, useState } from "react";
import { ChevronDown, Upload, RefreshCw, Trash2, Check, Crop } from "lucide-react";
import { Menu } from "@base-ui/react/menu";
import { useEditorStore } from "@/lib/store";
import {
  FORMAT_LAYOUTS,
  PRODUCT_VISUAL_BG_HEX,
  type ProductVisualFormat,
  type ProductVisualLayout,
  type ProductVisualBg,
} from "@/lib/types/product-visual";
import { readImageAsDataUrl, UPLOAD_ACCEPT } from "@/lib/product-visual/upload-image";
import { Section } from "./Section";
import { CropSelector } from "./CropSelector";

const DISPLAY_MODES: { id: "crop" | "highlight"; label: string }[] = [
  { id: "crop", label: "Crop" },
  { id: "highlight", label: "Highlight" },
];

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

const LAYOUT_LABELS: Record<ProductVisualLayout, string> = {
  "center": "Center",
  "side-by-side": "Side by side",
  "text-top-fill": "Text top",
};

const BG_OPTIONS: { id: ProductVisualBg; name: string }[] = [
  { id: "white", name: "White" },
  { id: "sky", name: "Sky" },
  { id: "stone", name: "Stone" },
  { id: "warmgray", name: "Warm gray" },
  { id: "dark", name: "Dark" },
];

// Same field style as the chat / infographic sidebars.
const inputCls =
  "w-full bg-studio-sidebar border border-studio-border rounded-md px-2.5 py-1.5 text-xs text-studio-text placeholder:text-studio-muted focus:outline-none focus:ring-1 focus:ring-studio-accent transition-colors";

export function ProductVisualSidebar() {
  const {
    productVisualContent: content,
    setProductVisualContent,
    setProductVisualFormat,
  } = useEditorStore();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const [cropOpen, setCropOpen] = useState(false);

  if (!content) return null;

  function update(patch: Partial<NonNullable<typeof content>>) {
    if (!content) return;
    setProductVisualContent({ ...content, ...patch });
  }

  async function handleFile(file: File | undefined) {
    if (!file) return;
    setUploadError(null);
    const res = await readImageAsDataUrl(file);
    if (!res.ok) {
      setUploadError(res.error);
      return;
    }
    // New/replaced image → fresh screenshot (crop reset; natural dims captured).
    update({
      screenshot: {
        url: res.dataUrl,
        displayMode: "crop",
        naturalWidth: res.naturalWidth,
        naturalHeight: res.naturalHeight,
      },
    });
  }

  const layouts = FORMAT_LAYOUTS[content.format];
  const showLayout = layouts.length > 1;
  const current = FORMAT_FLAT.find((f) => f.id === content.format);

  return (
    <div className="relative shrink-0 w-80 h-full flex flex-col bg-studio-sidebar border-l border-studio-border">
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

        {/* LAYOUT — only when the format allows more than one */}
        {showLayout && (
          <Section title="Layout">
            <div className="flex items-center gap-1 p-1 rounded-lg bg-[#0E0E0E]">
              {layouts.map((l) => (
                <button
                  key={l}
                  onClick={() => update({ layout: l })}
                  aria-pressed={content.layout === l}
                  className={[
                    "flex-1 px-2 py-1.5 rounded-md text-[11px] font-medium transition-colors whitespace-nowrap",
                    content.layout === l
                      ? "bg-studio-hover text-studio-text"
                      : "text-studio-muted hover:text-studio-text",
                  ].join(" ")}
                >
                  {LAYOUT_LABELS[l]}
                </button>
              ))}
            </div>
          </Section>
        )}

        {/* BACKGROUND */}
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

        {/* SCREENSHOT */}
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
            <div className="flex flex-col gap-2">
              <div className="rounded-lg overflow-hidden border border-studio-border bg-[#0E0E0E]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={content.screenshot.url} alt="Uploaded screenshot" className="w-full h-28 object-contain" />
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-1.5 flex-1 justify-center text-xs font-medium px-3 py-2 rounded-lg border border-studio-border text-studio-muted hover:text-studio-text hover:bg-studio-hover transition-colors"
                >
                  <RefreshCw size={13} /> Replace
                </button>
                <button
                  onClick={() => update({ screenshot: undefined })}
                  className="flex items-center gap-1.5 text-xs font-medium px-3 py-2 rounded-lg border border-studio-border text-studio-muted hover:text-red-400 hover:border-red-400/40 transition-colors"
                >
                  <Trash2 size={13} /> Remove
                </button>
              </div>

              {/* Select / edit crop region */}
              <button
                onClick={() => setCropOpen(true)}
                className="flex items-center gap-1.5 justify-center text-xs font-medium px-3 py-2 rounded-lg border border-studio-border text-studio-muted hover:text-studio-text hover:bg-studio-hover transition-colors"
              >
                <Crop size={13} /> {content.screenshot.crop ? "Edit crop" : "Select area"}
              </button>

              {/* Display mode — enabled once a crop region exists */}
              <div>
                <div className="flex items-center gap-1 p-1 rounded-lg bg-[#0E0E0E]">
                  {DISPLAY_MODES.map((m) => {
                    const enabled = !!content.screenshot?.crop;
                    const active = content.screenshot?.displayMode === m.id;
                    return (
                      <button
                        key={m.id}
                        disabled={!enabled}
                        onClick={() => content.screenshot && update({ screenshot: { ...content.screenshot, displayMode: m.id } })}
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
                {!content.screenshot.crop && (
                  <p className="mt-1.5 text-[11px] text-studio-muted leading-snug">Select an area first to crop or highlight.</p>
                )}
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
              className={[
                "flex flex-col items-center justify-center gap-2 w-full py-7 rounded-lg border-2 border-dashed transition-colors",
                dragging
                  ? "border-studio-accent bg-studio-accent/[0.06] text-studio-text"
                  : "border-studio-border text-studio-muted hover:text-studio-text hover:border-studio-muted",
              ].join(" ")}
            >
              <Upload size={20} />
              <span className="text-xs font-medium">Click or drag to upload</span>
            </button>
          )}
          {uploadError ? (
            <p className="mt-1.5 text-[11px] text-red-400 leading-snug">{uploadError}</p>
          ) : (
            <p className="mt-1.5 text-[11px] text-studio-muted leading-snug">PNG · JPG · WebP · max 10 MB</p>
          )}
        </Section>

        {/* TITLE & SUBTITLE */}
        <Section title="Title & subtitle">
          <div className="mb-2.5">
            <label className="block text-[10px] text-studio-muted mb-1">Title</label>
            <input
              className={inputCls}
              value={content.title}
              onChange={(e) => update({ title: e.target.value })}
              placeholder="Add a headline"
            />
          </div>
          <div>
            <label className="block text-[10px] text-studio-muted mb-1">Subtitle</label>
            <textarea
              className={inputCls + " resize-none min-h-12"}
              value={content.subtitle ?? ""}
              onChange={(e) => update({ subtitle: e.target.value })}
              placeholder="Optional supporting line"
            />
          </div>
        </Section>
      </div>

      {cropOpen && content.screenshot?.url && (
        <CropSelector
          imageUrl={content.screenshot.url}
          crop={content.screenshot.crop}
          onApply={(crop) => {
            if (content.screenshot) update({ screenshot: { ...content.screenshot, crop } });
            setCropOpen(false);
          }}
          onCancel={() => setCropOpen(false)}
        />
      )}
    </div>
  );
}
