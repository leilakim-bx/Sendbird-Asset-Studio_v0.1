"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { BookOpen, Home } from "lucide-react";
import { useEditorStore, type SavedAsset } from "@/lib/store";
import { ConfirmLeaveDialog } from "@/components/layout/ConfirmLeaveDialog";
import { GuideModal } from "@/components/layout/Sidebar";
import { captureThumbnail, type ExportedImage } from "@/lib/export";
import { logBriefEvent } from "@/lib/brief-log";
import { useWorkAutosnapshot } from "@/lib/use-work-autosnapshot";
import { WORK_DATA_SCHEMA_VERSION } from "@/lib/work-data-schema";
import { exportProductVisual, productVisualFilename } from "@/lib/product-visual/export";
import { ProductVisualCanvas } from "./ProductVisualCanvas";
import { ProductVisualSidebar } from "./ProductVisualSidebar";
import { WorkPreservationMenu } from "@/components/editor/WorkPreservationMenu";
import type { ProductVisualTemplate } from "@/lib/template-registry";
import { FORMAT_SIZES, FORMAT_MIN_HEIGHT } from "@/lib/types/product-visual";

const MAX_PREVIEW_W = 620;

export function ProductVisualShell({ template }: { template: ProductVisualTemplate }) {
  const {
    productVisualContent, setProductVisualContent,
    saveAsset, setPendingAssetRestore,
  } = useEditorStore();

  const [ready, setReady] = useState(false);

  // On mount: restore a saved asset, else seed the template default.
  // No freshStart/autosave for PV.
  // Guard so this seeds exactly once: StrictMode (dev) double-invokes the effect,
  // and a second run — after `pending` was consumed below — would otherwise fall
  // through to the else-branch and clobber the restored content with defaults.
  const didInit = useRef(false);
  useEffect(() => {
    if (didInit.current) return;
    didInit.current = true;
    const { pendingAssetRestore: pending } = useEditorStore.getState();
    if (pending && pending.templateId === template.id && pending.productVisual) {
      setProductVisualContent(pending.productVisual);
      setPendingAssetRestore(null);
    } else {
      setProductVisualContent(template.defaultContent);
    }
    setReady(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [template.id]);

  const content = productVisualContent ?? template.defaultContent;
  const { format } = content;
  useWorkAutosnapshot("product-visual", template.id, content, ready);

  // ── Unsaved-changes guard (logo → home) ─────────────────
  const router = useRouter();
  const [leaveOpen, setLeaveOpen] = useState(false);
  const savedBaselineRef = useRef<string>("");
  const contentRef = useRef(content);
  useEffect(() => {
    contentRef.current = content;
  }, [content]);
  useEffect(() => {
    if (ready) savedBaselineRef.current = JSON.stringify(contentRef.current);
  }, [ready]);
  const isDirty = () => JSON.stringify(contentRef.current) !== savedBaselineRef.current;

  function handleLeaveHome() {
    if (isDirty()) setLeaveOpen(true);
    else router.push("/");
  }
  async function handleSaveAndLeave() {
    await handleSave();
    setLeaveOpen(false);
    router.push("/");
  }

  // ── Off-screen full-size canvas: measured for the preview footprint and
  //    captured for the Save thumbnail. (Multi-size export lands in STEP 4.)
  const canvasRef = useRef<HTMLDivElement>(null);
  const size = FORMAT_SIZES[format];
  const fixedH = typeof size.h === "number" ? size.h : null;
  const [measuredH, setMeasuredH] = useState(FORMAT_MIN_HEIGHT[format]);
  useEffect(() => {
    const el = canvasRef.current;
    if (!el) return;
    const update = () => setMeasuredH(Math.round(el.offsetHeight));
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved">("idle");
  const [saveError, setSaveError] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);
  const [exportNote, setExportNote] = useState<string | null>(null);
  const [exportError, setExportError] = useState<string | null>(null);
  const [exportDownloads, setExportDownloads] = useState<ExportedImage[]>([]);
  const [guideOpen, setGuideOpen] = useState(false);
  const exportDownloadsRef = useRef<ExportedImage[]>([]);

  useEffect(() => {
    return () => {
      exportDownloadsRef.current.forEach((download) => download.revoke());
    };
  }, []);

  function replaceExportDownloads(downloads: ExportedImage[]) {
    exportDownloadsRef.current.forEach((download) => download.revoke());
    exportDownloadsRef.current = downloads;
    setExportDownloads(downloads);
  }

  async function handleExport() {
    const el = canvasRef.current;
    if (!el || exporting) return;
    setExporting(true);
    setExportError(null);
    setExportNote(null);
    replaceExportDownloads([]);
    const downloads: ExportedImage[] = [];
    try {
      const ts = Date.now();
      const download = await exportProductVisual(el, format, ts);
      if (!download) return;
      downloads.push(download);
      replaceExportDownloads(downloads);
      setExportNote(`${download.method === "save-picker" ? "Saved" : "Downloaded"} as ${productVisualFilename(format, ts)}`);
      setTimeout(() => setExportNote(null), 4000);
      logBriefEvent({
        template: "product-visual",
        event: "export_completed",
        meta: { format },
      });
    } catch (err) {
      downloads.forEach((download) => download.revoke());
      const msg = err instanceof Error ? err.message : String(err);
      console.error("Export failed:", err);
      setExportError(`Export failed — ${msg || "unknown error"}`);
    } finally {
      setExporting(false);
    }
  }

  async function handleSave() {
    const el = canvasRef.current;
    if (!el || saveState !== "idle") return;
    setSaveState("saving");
    setSaveError(null);
    try {
      const previewDataUrl = await captureThumbnail(el);
      const now = Date.now();
      const dateStr = new Date(now).toLocaleDateString("en-US", { month: "short", day: "numeric" });
      const appName = content.title?.trim() || "Product Visual";
      const asset: SavedAsset = {
        schemaVersion: WORK_DATA_SCHEMA_VERSION,
        id:             `asset-${now}`,
        templateId:     template.id,
        appName,
        name:           `${appName} · ${dateStr}`,
        previewDataUrl,
        savedAt:        now,
        productVisual:  content,
      };
      saveAsset(asset);
      savedBaselineRef.current = JSON.stringify(contentRef.current);
      setSaveState("saved");
      setTimeout(() => setSaveState("idle"), 2000);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error("Save failed:", err);
      setSaveError(`Save failed — ${msg || "unknown error"}`);
      setSaveState("idle");
    }
  }

  const previewW = size.w;
  const previewH = fixedH ?? measuredH;
  const scale = Math.min(1, MAX_PREVIEW_W / previewW);
  const dims = fixedH ? `${size.w}×${fixedH}` : `${size.w}×var`;

  return (
    <div className="flex flex-col h-full">
      {/* Top bar */}
      <div className="flex items-center gap-3 px-4 py-2.5 border-b border-studio-border bg-studio-sidebar shrink-0">
        <button
          onClick={handleLeaveHome}
          className="flex items-center gap-1.5 text-studio-muted hover:text-studio-text transition-colors"
        >
          <Image src="/Logo_Das.svg" alt="Logo" width={20} height={20} />
          <Home size={14} />
        </button>
        <span className="text-studio-border select-none">/</span>
        <span className="text-studio-text text-xs font-medium">{template.name}</span>
        <div className="ml-auto flex items-center gap-1">
          <WorkPreservationMenu
            kind="product-visual"
            templateId={template.id}
            currentData={content}
            onRestore={setProductVisualContent}
          />
          <button
            onClick={() => setGuideOpen(true)}
            title="Open guide"
            className="p-1.5 rounded-md text-studio-muted hover:text-studio-text hover:bg-studio-hover transition-colors"
          >
            <BookOpen size={15} />
          </button>
        </div>
      </div>

      {/* Editor body */}
      <div className="flex flex-1 min-h-0">
        {/* Left: preview */}
        <div className="flex-1 overflow-auto bg-studio-bg">
          <div className="min-h-full flex flex-col items-center justify-center gap-6 py-8">
            <p className="text-studio-muted text-xs uppercase tracking-wider">
              Preview — {dims}
            </p>

            <div style={{ width: previewW * scale, height: previewH * scale }}>
              <div style={{ transform: `scale(${scale})`, transformOrigin: "top left" }}>
                <ProductVisualCanvas content={content} />
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex flex-col items-center gap-2">
              <div className="flex items-center gap-2">
                <button
                  onClick={handleSave}
                  disabled={saveState !== "idle"}
                  className="font-semibold text-sm px-5 py-2.5 rounded-[10px] border border-studio-border text-studio-muted hover:text-studio-text hover:bg-studio-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saveState === "saving" ? "Saving…" : saveState === "saved" ? "Saved ✓" : "Save"}
                </button>
                <button
                  onClick={handleExport}
                  disabled={exporting}
                  className="bg-studio-accent text-studio-accent-fg font-semibold text-sm px-5 py-2.5 rounded-[10px] hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {exporting ? "Exporting…" : "Export PNG"}
                </button>
              </div>
              {exportError ? (
                <p className="text-red-400 text-xs">{exportError}</p>
              ) : saveError ? (
                <p className="text-red-400 text-xs">{saveError}</p>
              ) : exportDownloads.length > 0 ? (
                <div className="flex flex-wrap items-center justify-center gap-2 text-xs text-studio-muted">
                  <span>{exportDownloads.some((download) => download.method === "download") ? "Download ready:" : "Saved:"}</span>
                  {exportDownloads.map((download, index) => (
                    download.href ? (
                      <a
                        key={download.href}
                        href={download.href}
                        download={download.filename}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-studio-accent underline underline-offset-2"
                      >
                        {download.filename}
                      </a>
                    ) : (
                      <span key={`${download.filename}-${index}`} className="text-studio-text">
                        {download.filename}
                      </span>
                    )
                  ))}
                </div>
              ) : exportNote ? (
                <p className="text-studio-muted text-xs">{exportNote}</p>
              ) : null}
            </div>

            {/* Off-screen full-size canvas — measured + captured for Save. */}
            <div aria-hidden style={{ position: "fixed", left: "-9999px", top: 0, pointerEvents: "none" }}>
              <div ref={canvasRef}>
                <ProductVisualCanvas content={content} exportMode />
              </div>
            </div>
          </div>
        </div>

        {/* Right: editing sidebar */}
        <ProductVisualSidebar content={content} />
      </div>

      {leaveOpen && (
        <ConfirmLeaveDialog
          saving={saveState !== "idle"}
          onSaveAndLeave={handleSaveAndLeave}
          onLeave={() => router.push("/")}
          onCancel={() => setLeaveOpen(false)}
        />
      )}
      {guideOpen && (
        <GuideModal onClose={() => setGuideOpen(false)} initialSection="product-visual" />
      )}
    </div>
  );
}
