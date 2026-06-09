"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Home, ChevronDown, AppWindow, FileText } from "lucide-react";
import { Menu } from "@base-ui/react/menu";
import { useEditorStore, type SavedAsset } from "@/lib/store";
import { exportImage, captureThumbnail } from "@/lib/export";
import { InfographicCanvas } from "./InfographicCanvas";
import { InfographicSidebar } from "./InfographicSidebar";
import type { InfographicTemplate } from "@/lib/template-registry";
import type { InfographicFormat } from "@/lib/types/infographic";

const PRODUCT_W = 866;
const PRODUCT_H = 660;
const BLOG_W = 664;
const BLOG_MIN_H = 360;
const MAX_PREVIEW_W = 580;

export function InfographicShell({ template }: { template: InfographicTemplate }) {
  const {
    infographicContent, setInfographicContent,
    saveAsset, pendingAssetRestore, setPendingAssetRestore,
  } = useEditorStore();

  // On mount: restore a saved infographic asset if one is pending (opened from
  // "My files"), otherwise seed session content from the template default.
  useEffect(() => {
    const pending = pendingAssetRestore;
    if (pending && pending.templateId === template.id && pending.infographic) {
      setInfographicContent(pending.infographic);
      setPendingAssetRestore(null);
    } else {
      setInfographicContent(template.defaultContent);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [template.id]);

  const content = infographicContent ?? template.defaultContent;
  const format = content.format;

  const productRef = useRef<HTMLDivElement>(null);
  const blogRef = useRef<HTMLDivElement>(null);
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved">("idle");

  async function handleSave() {
    const ref = format === "product" ? productRef.current : blogRef.current;
    if (!ref || saveState !== "idle") return;
    setSaveState("saving");
    try {
      const previewDataUrl = await captureThumbnail(ref);
      const now = Date.now();
      const dateStr = new Date(now).toLocaleDateString("en-US", { month: "short", day: "numeric" });
      const appName = content.title?.trim() || "Infographic";
      const asset: SavedAsset = {
        id:             `asset-${now}`,
        templateId:     template.id,
        appName,
        name:           `${appName} · ${dateStr}`,
        previewDataUrl,
        savedAt:        now,
        infographic:    content,
      };
      saveAsset(asset);
      setSaveState("saved");
      setTimeout(() => setSaveState("idle"), 2000);
    } catch {
      setSaveState("idle");
    }
  }

  // Live height of the off-screen blog canvas — this IS the exported blog PNG
  // height (blog export passes no height). Seeded with the min so the first
  // dropdown-open never flashes a bad value.
  const [blogHeight, setBlogHeight] = useState(BLOG_MIN_H);
  useEffect(() => {
    const el = blogRef.current;
    if (!el) return;
    const update = () => setBlogHeight(Math.round(el.offsetHeight));
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  function filename(fmt: InfographicFormat) {
    const slug = (content.title ?? "infographic")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 40) || "infographic";
    return `${slug}-${fmt}.png`;
  }

  async function exportOne(fmt: InfographicFormat) {
    const ref = fmt === "product" ? productRef.current : blogRef.current;
    if (!ref) return;
    if (fmt === "product") {
      await exportImage(ref, PRODUCT_W, PRODUCT_H, filename("product"));
    } else {
      // height undefined → variable height (captures natural element height)
      await exportImage(ref, BLOG_W, undefined, filename("blog"));
    }
  }

  async function handleExport(fmt: InfographicFormat) {
    setExporting(true);
    setExportError(null);
    try {
      await exportOne(fmt);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error("Export failed:", err);
      setExportError(`Export failed — ${msg || "unknown error"}`);
    } finally {
      setExporting(false);
    }
  }

  const previewW = format === "product" ? PRODUCT_W : BLOG_W;
  const previewH = format === "product" ? PRODUCT_H : blogHeight;
  const scale = Math.min(1, MAX_PREVIEW_W / previewW);

  return (
    <div className="flex flex-col h-full">
      {/* Top bar */}
      <div className="flex items-center gap-3 px-4 py-2.5 border-b border-studio-border bg-studio-sidebar shrink-0">
        <Link href="/" className="flex items-center gap-1.5 text-studio-muted hover:text-studio-text transition-colors">
          <Image src="/Logo_Das.svg" alt="Logo" width={20} height={20} />
          <Home size={14} />
        </Link>
        <span className="text-studio-border select-none">/</span>
        <span className="text-studio-text text-xs font-medium">{template.name}</span>
      </div>

      {/* Editor body */}
      <div className="flex flex-1 min-h-0">
        {/* Left: preview. Outer scrolls; inner centers within at least the full
            height. Centering directly on the scroll container would push the
            content's top out of reach once it overflows (justify-center clip). */}
        <div className="flex-1 overflow-auto bg-studio-bg">
          <div className="min-h-full flex flex-col items-center justify-center gap-6 py-8">
          {/* Preview label — format + dimensions (toggle lives in the sidebar) */}
          <p className="text-studio-muted text-xs uppercase tracking-wider">
            Preview — {format === "product"
              ? `Product feature ${PRODUCT_W}×${PRODUCT_H}`
              : `Blog/Perspective ${BLOG_W}×${blogHeight}`}
          </p>

          {/* Scaled preview. The outer box reserves the *scaled* footprint on
              both axes — transform:scale alone doesn't shrink layout size, so
              without this the wrapper keeps the canvas's full 866px width and a
              pane narrower than that clips the left edge under items-center. */}
          <div style={{ width: previewW * scale, height: previewH * scale }}>
            <div style={{ transform: `scale(${scale})`, transformOrigin: "top left" }}>
              <InfographicCanvas content={content} />
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex flex-col items-center gap-2">
            <div className="flex items-center gap-2">
              <button
                onClick={handleSave}
                disabled={saveState !== "idle"}
                className="font-semibold text-sm px-5 py-2.5 rounded-xl border border-studio-border text-studio-muted hover:text-studio-text hover:bg-studio-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saveState === "saving" ? "Saving…" : saveState === "saved" ? "Saved ✓" : "Save"}
              </button>

              {/* Export dropdown */}
              <Menu.Root>
                <Menu.Trigger
                  disabled={exporting}
                  className="flex items-center gap-2 bg-studio-accent text-studio-accent-fg font-semibold text-sm px-5 py-2.5 rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {exporting ? "Exporting…" : "Export"}
                  <ChevronDown size={14} />
                </Menu.Trigger>
                <Menu.Portal>
                  <Menu.Positioner side="top" align="end" sideOffset={8}>
                    <Menu.Popup className="z-50 min-w-[240px] rounded-xl border border-studio-border bg-studio-sidebar shadow-xl py-2 outline-none origin-bottom data-[ending-style]:animate-out data-[ending-style]:fade-out-0 data-[ending-style]:zoom-out-95 data-[starting-style]:animate-in data-[starting-style]:fade-in-0 data-[starting-style]:zoom-in-95 duration-100">
                      <div className="flex items-center gap-1 px-3 pt-1 pb-2 text-[11px] font-bold uppercase tracking-wider text-studio-text select-none">
                        Export as PNG
                        <span className="text-studio-muted font-semibold">· @2x</span>
                      </div>
                      <Menu.Separator className="h-px bg-studio-border mx-1 my-1.5" />

                      <Menu.Item
                        onClick={() => handleExport("product")}
                        className="flex items-center gap-3 px-3 py-2.5 text-sm text-studio-text hover:bg-studio-hover cursor-default outline-none rounded-lg mx-1"
                      >
                        <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-studio-muted/20 shrink-0">
                          <AppWindow size={16} className="text-studio-text" />
                        </span>
                        <span className="flex-1">Product feature</span>
                        <span className="text-[11px] text-studio-muted tabular-nums">{PRODUCT_W}×{PRODUCT_H}</span>
                      </Menu.Item>

                      <Menu.Item
                        onClick={() => handleExport("blog")}
                        className="flex items-center gap-3 px-3 py-2.5 text-sm text-studio-text hover:bg-studio-hover cursor-default outline-none rounded-lg mx-1"
                      >
                        <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-studio-muted/20 shrink-0">
                          <FileText size={16} className="text-studio-text" />
                        </span>
                        <span className="flex-1">Blog/Perspective</span>
                        <span className="text-[11px] text-studio-muted tabular-nums">{BLOG_W}×{blogHeight}</span>
                      </Menu.Item>
                    </Menu.Popup>
                  </Menu.Positioner>
                </Menu.Portal>
              </Menu.Root>
            </div>
            {exportError && <p className="text-red-400 text-xs">{exportError}</p>}
          </div>

          {/* Hidden full-size export targets — off-screen */}
          <div
            aria-hidden
            style={{ position: "fixed", left: "-9999px", top: 0, pointerEvents: "none" }}
          >
            <div ref={productRef}>
              <InfographicCanvas content={{ ...content, format: "product" }} exportMode />
            </div>
            <div ref={blogRef}>
              <InfographicCanvas content={{ ...content, format: "blog" }} exportMode />
            </div>
          </div>
          </div>
        </div>

        {/* Right: editing sidebar */}
        <InfographicSidebar />
      </div>
    </div>
  );
}
