"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Home, ChevronDown, AppWindow, FileText } from "lucide-react";
import { Menu } from "@base-ui/react/menu";
import { useEditorStore, type SavedAsset } from "@/lib/store";
import { ConfirmLeaveDialog } from "@/components/layout/ConfirmLeaveDialog";
import { useAutosaveDraft } from "@/lib/use-autosave-draft";
import { exportImage, captureThumbnail, type ExportedImage } from "@/lib/export";
import { InfographicCanvas } from "./InfographicCanvas";
import { InfographicSidebar } from "./InfographicSidebar";
import type { InfographicTemplate } from "@/lib/template-registry";
import type { InfographicContent, InfographicFormat } from "@/lib/types/infographic";
import {
  extractInfographicCandidates,
  type ArticleImageCandidate,
} from "@/lib/infographic-article-extractor";

const PRODUCT_W = 866;
const PRODUCT_H = 660;
const BLOG_W = 664;
const BLOG_MIN_H = 360;
const MAX_PREVIEW_W = 580;

type SourceContentResponse =
  | {
      ok: true;
      sourceType: "text" | "url";
      text: string;
      title?: string;
      imageCount?: number;
    }
  | {
      ok: false;
      message: string;
    };

type SourceSuggestionResult = {
  count: number;
  notice: string;
};

export function InfographicShell({ template }: { template: InfographicTemplate }) {
  const {
    infographicContent, setInfographicContent,
    saveAsset, setPendingAssetRestore,
    saveInfographicDraft, clearDraft, setFreshStart,
  } = useEditorStore();

  // Gates the autosave write-through until the mount effect below has run once.
  const [ready, setReady] = useState(false);

  // On mount: restore a saved asset (priority), start fresh (explicit "Create
  // asset"), resume the autosaved draft, or seed the template default.
  // drafts/freshStart/pending read via getState() to avoid stale closures.
  useEffect(() => {
    const { pendingAssetRestore: pending, freshStart, drafts } =
      useEditorStore.getState();

    if (pending && pending.templateId === template.id && pending.infographic) {
      setInfographicContent(pending.infographic);
      setPendingAssetRestore(null);
    } else if (freshStart || !drafts.infographic) {
      setInfographicContent(template.defaultContent);
      clearDraft("infographic");
    } else {
      setInfographicContent(drafts.infographic);
    }

    setFreshStart(false); // consume unconditionally
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setReady(true);       // MUST be last (opens the autosave gate)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [template.id]);

  // Write-through autosave (debounced + flushed on teardown/tab-hide). Skip null
  // (pre-seed) content so we never persist a null draft.
  useAutosaveDraft(
    infographicContent,
    (c) => { if (c) saveInfographicDraft(c); },
    ready,
  );

  // ── Unsaved-changes guard (logo → home) ─────────────────
  const router = useRouter();
  const [leaveOpen, setLeaveOpen] = useState(false);
  const savedBaselineRef = useRef<string>("");
  const contentRef = useRef(infographicContent);
  useEffect(() => {
    contentRef.current = infographicContent;
  }, [infographicContent]);
  useEffect(() => {
    if (ready) savedBaselineRef.current = JSON.stringify(contentRef.current);
  }, [ready]);
  const isDirty = () =>
    JSON.stringify(contentRef.current) !== savedBaselineRef.current;

  function handleLeaveHome() {
    if (isDirty()) setLeaveOpen(true);
    else router.push("/");
  }
  async function handleSaveAndLeave() {
    await handleSave();
    setLeaveOpen(false);
    router.push("/");
  }

  const content = infographicContent ?? template.defaultContent;
  const format = content.format;

  const productRef = useRef<HTMLDivElement>(null);
  const blogRef = useRef<HTMLDivElement>(null);
  const articleImageRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);
  const [exportDownloads, setExportDownloads] = useState<ExportedImage[]>([]);
  const exportDownloadsRef = useRef<ExportedImage[]>([]);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved">("idle");
  const [articleImages, setArticleImages] = useState<ArticleImageCandidate[]>([]);
  const [activeArticleImageId, setActiveArticleImageId] = useState<string | null>(null);

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

  async function handleSave() {
    const ref = format === "product" ? productRef.current : blogRef.current;
    if (!ref || saveState !== "idle") return;
    setSaveState("saving");
    setSaveError(null);
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

  function filenameFor(c: InfographicContent, fmt: InfographicFormat, suffix?: string) {
    const slug = (c.title ?? "infographic")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 40) || "infographic";
    return `${slug}${suffix ? `-${suffix}` : ""}-${fmt}.png`;
  }

  function filename(fmt: InfographicFormat) {
    return filenameFor(content, fmt);
  }

  async function exportOne(fmt: InfographicFormat) {
    const ref = fmt === "product" ? productRef.current : blogRef.current;
    if (!ref) throw new Error("Export canvas is not ready");
    if (fmt === "product") {
      return await exportImage(ref, PRODUCT_W, PRODUCT_H, filename("product"));
    } else {
      // height undefined → variable height (captures natural element height)
      return await exportImage(ref, BLOG_W, undefined, filename("blog"));
    }
  }

  async function handleExport(fmt: InfographicFormat) {
    setExporting(true);
    setExportError(null);
    replaceExportDownloads([]);
    const downloads: ExportedImage[] = [];
    try {
      const download = await exportOne(fmt);
      if (!download) return;
      downloads.push(download);
      replaceExportDownloads(downloads);
    } catch (err) {
      downloads.forEach((download) => download.revoke());
      const msg = err instanceof Error ? err.message : String(err);
      console.error("Export failed:", err);
      setExportError(`Export failed — ${msg || "unknown error"}`);
    } finally {
      setExporting(false);
    }
  }

  async function exportArticleCandidate(candidate: ArticleImageCandidate) {
    const ref = articleImageRefs.current[candidate.id];
    if (!ref) throw new Error("Export canvas is not ready");
    const candidateContent = candidate.id === activeArticleImageId ? content : candidate.content;
    const fmt = candidateContent.format;
    return await exportImage(
      ref,
      fmt === "product" ? PRODUCT_W : BLOG_W,
      fmt === "product" ? PRODUCT_H : undefined,
      filenameFor(candidateContent, fmt, candidate.id),
    );
  }

  async function handleExportSelected() {
    const selected = articleImages.filter((candidate) => candidate.selected);
    if (selected.length === 0) {
      await handleExport(format);
      return;
    }
    setExporting(true);
    setExportError(null);
    replaceExportDownloads([]);
    const downloads: ExportedImage[] = [];
    try {
      for (const candidate of selected) {
        const download = await exportArticleCandidate(candidate);
        if (!download) return;
        downloads.push(download);
        await new Promise((resolve) => setTimeout(resolve, 250));
      }
      replaceExportDownloads(downloads);
    } catch (err) {
      downloads.forEach((download) => download.revoke());
      const msg = err instanceof Error ? err.message : String(err);
      console.error("Export failed:", err);
      setExportError(`Export failed — ${msg || "unknown error"}`);
    } finally {
      setExporting(false);
    }
  }

  async function handleExportAll() {
    if (articleImages.length === 0) {
      await handleExport(format);
      return;
    }
    setExporting(true);
    setExportError(null);
    replaceExportDownloads([]);
    const downloads: ExportedImage[] = [];
    try {
      for (const candidate of articleImages) {
        const download = await exportArticleCandidate(candidate);
        if (!download) return;
        downloads.push(download);
        await new Promise((resolve) => setTimeout(resolve, 250));
      }
      replaceExportDownloads(downloads);
    } catch (err) {
      downloads.forEach((download) => download.revoke());
      const msg = err instanceof Error ? err.message : String(err);
      console.error("Export failed:", err);
      setExportError(`Export failed — ${msg || "unknown error"}`);
    } finally {
      setExporting(false);
    }
  }

  function applySourceText(sourceText: string) {
    const next = extractInfographicCandidates(sourceText, {
      format: content.format,
      bg: content.bg,
      accent: content.accent,
    });
    setArticleImages(next);
    const first = next[0];
    if (first) {
      setActiveArticleImageId(first.id);
      setInfographicContent(first.content);
    } else {
      setActiveArticleImageId(null);
    }
    return next.length;
  }

  async function handleSuggestArticleImages(source: string): Promise<SourceSuggestionResult> {
    let data: SourceContentResponse;
    try {
      const response = await fetch("/api/source-content", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ source }),
      });
      data = (await response.json()) as SourceContentResponse;
      if (!response.ok && data.ok) {
        return { count: 0, notice: "Could not read this source. Paste the article text or use an AI-accessible share link." };
      }
    } catch {
      return { count: 0, notice: "Could not read this source. Paste the article text or use an AI-accessible share link." };
    }

    if (!data.ok) {
      setArticleImages([]);
      setActiveArticleImageId(null);
      return { count: 0, notice: data.message };
    }

    const count = applySourceText(data.text);
    const sourceName = data.sourceType === "url" ? "URL" : "source";
    const imageNote =
      data.sourceType === "url" && data.imageCount
        ? ` Found ${data.imageCount} reference image${data.imageCount === 1 ? "" : "s"}.`
        : "";
    const titleNote = data.sourceType === "url" && data.title ? `Read "${data.title}". ` : "";

    return {
      count,
      notice:
        count > 0
          ? `${titleNote}Suggested ${count} image${count === 1 ? "" : "s"} from this ${sourceName}.${imageNote}`
          : `${titleNote}No strong image candidates found. Paste chart data, image notes, or try a preset in Advanced settings.${imageNote}`,
    };
  }

  function handleSelectArticleImage(id: string) {
    const candidate = articleImages.find((item) => item.id === id);
    if (!candidate) return;
    if (activeArticleImageId && infographicContent) {
      setArticleImages((items) =>
        items.map((item) =>
          item.id === activeArticleImageId
            ? {
                ...item,
                title: infographicContent.title?.trim() || item.title,
                blockType: infographicContent.blocks[0]?.type ?? item.blockType,
                content: infographicContent,
              }
            : item,
        ),
      );
    }
    setActiveArticleImageId(id);
    setInfographicContent(candidate.content);
  }

  function handleToggleArticleImage(id: string) {
    setArticleImages((items) =>
      items.map((item) =>
        item.id === id ? { ...item, selected: !item.selected } : item,
      ),
    );
  }

  const previewW = format === "product" ? PRODUCT_W : BLOG_W;
  const previewH = format === "product" ? PRODUCT_H : blogHeight;
  const scale = Math.min(1, MAX_PREVIEW_W / previewW);
  const activeArticleImageIndex = articleImages.findIndex((candidate) => candidate.id === activeArticleImageId);
  const selectedArticleImageCount = articleImages.filter((candidate) => candidate.selected).length;
  const previewPrefix = activeArticleImageIndex >= 0
    ? `Image ${activeArticleImageIndex + 1} of ${articleImages.length} · `
    : "";

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
            Preview — {previewPrefix}{format === "product"
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
                className="font-semibold text-sm px-5 py-2.5 rounded-[10px] border border-studio-border text-studio-muted hover:text-studio-text hover:bg-studio-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saveState === "saving" ? "Saving…" : saveState === "saved" ? "Saved ✓" : "Save"}
              </button>

              {/* Export dropdown */}
              <Menu.Root>
                <Menu.Trigger
                  disabled={exporting}
                  className="flex items-center gap-2 bg-studio-accent text-studio-accent-fg font-semibold text-sm px-5 py-2.5 rounded-[10px] hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
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
                        onClick={() => handleExport(format)}
                        className="flex items-center gap-3 px-3 py-2.5 text-sm text-studio-text hover:bg-studio-hover cursor-default outline-none rounded-lg mx-1"
                      >
                        <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-studio-muted/20 shrink-0">
                          {format === "product"
                            ? <AppWindow size={16} className="text-studio-text" />
                            : <FileText size={16} className="text-studio-text" />}
                        </span>
                        <span className="flex-1">Current image</span>
                        <span className="text-[11px] text-studio-muted tabular-nums">
                          {format === "product" ? `${PRODUCT_W}×${PRODUCT_H}` : `${BLOG_W}×${blogHeight}`}
                        </span>
                      </Menu.Item>

                      <Menu.Item
                        onClick={handleExportSelected}
                        disabled={articleImages.length === 0}
                        className="flex items-center gap-3 px-3 py-2.5 text-sm text-studio-text hover:bg-studio-hover cursor-default outline-none rounded-lg mx-1"
                      >
                        <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-studio-muted/20 shrink-0">
                          <FileText size={16} className="text-studio-text" />
                        </span>
                        <span className="flex-1">Selected images</span>
                        <span className="text-[11px] text-studio-muted tabular-nums">
                          {selectedArticleImageCount || 0}
                        </span>
                      </Menu.Item>

                      <Menu.Item
                        onClick={handleExportAll}
                        disabled={articleImages.length === 0}
                        className="flex items-center gap-3 px-3 py-2.5 text-sm text-studio-text hover:bg-studio-hover cursor-default outline-none rounded-lg mx-1"
                      >
                        <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-studio-muted/20 shrink-0">
                          <FileText size={16} className="text-studio-text" />
                        </span>
                        <span className="flex-1">All article images</span>
                        <span className="text-[11px] text-studio-muted tabular-nums">
                          {articleImages.length || 0}
                        </span>
                      </Menu.Item>
                    </Menu.Popup>
                  </Menu.Positioner>
                </Menu.Portal>
              </Menu.Root>
            </div>
            {exportError && <p className="text-red-400 text-xs">{exportError}</p>}
            {saveError && <p className="text-red-400 text-xs">{saveError}</p>}
            {!exportError && exportDownloads.length > 0 && (
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
            )}
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
            {articleImages.map((candidate) => {
              const candidateContent = candidate.id === activeArticleImageId ? content : candidate.content;
              return (
                <div
                  key={candidate.id}
                  ref={(node) => {
                    articleImageRefs.current[candidate.id] = node;
                  }}
                >
                  <InfographicCanvas content={candidateContent} exportMode />
                </div>
              );
            })}
            </div>
          </div>
          </div>

        {/* Right: editing sidebar */}
        <InfographicSidebar
          articleImages={articleImages}
          activeArticleImageId={activeArticleImageId}
          onSuggestArticleImages={handleSuggestArticleImages}
          onSelectArticleImage={handleSelectArticleImage}
          onToggleArticleImage={handleToggleArticleImage}
        />
      </div>

      {leaveOpen && (
        <ConfirmLeaveDialog
          saving={saveState !== "idle"}
          onSaveAndLeave={handleSaveAndLeave}
          onLeave={() => router.push("/")}
          onCancel={() => setLeaveOpen(false)}
        />
      )}
    </div>
  );
}
