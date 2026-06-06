"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { BookOpen, Home, ChevronDown, Images, Clipboard, Blocks, Monitor, Smartphone } from "lucide-react";
import { Menu } from "@base-ui/react/menu";
import { GuideModal } from "@/components/layout/Sidebar";
import { useEditorStore } from "@/lib/store";
import { SCENARIOS } from "@/lib/scenarios";
import { FormPanel } from "./FormPanel";
import { FeatureMockup } from "@/components/templates/FeatureMockup";
import { getBackground } from "@/lib/backgrounds";
import { exportImage, exportSvgToClipboard, captureThumbnail } from "@/lib/export";
import type { SavedAsset } from "@/lib/store";
import type { Template } from "@/lib/template-registry";
import { EXPORT_SIZES } from "@/lib/template-registry";

export function EditorShell({ template }: { template: Template }) {
  const {
    layout, exportSize, backgroundId, appName, messages,
    setMessages, setLayout, setBackgroundId, setAppName, setExportSize,
    customBackgrounds, saveAsset,
    pendingAssetRestore, setPendingAssetRestore,
    userName, userAvatarUrl,
    shuffleUserProfile, setUserName,
    migrationSkipCount, clearMigrationWarning,
    activeScenarioId,
    setCanvasIsFull,
  } = useEditorStore();

  // Seed default content on mount — or restore a saved asset if one is pending
  useEffect(() => {
    const pending = pendingAssetRestore;
    if (pending && pending.templateId === template.id) {
      setAppName(pending.appName);
      if (pending.messages)     setMessages(pending.messages);
      if (pending.backgroundId) setBackgroundId(pending.backgroundId);
      if (pending.layout)       setLayout(pending.layout);
      if (pending.exportSize)   setExportSize(pending.exportSize);
      // Restore saved user profile (case D) — or randomise if not saved
      if (pending.userName) {
        setUserName(pending.userName);
      } else {
        shuffleUserProfile();
      }
      setPendingAssetRestore(null);
    } else {
      const d = template.defaultContent;
      // Fresh session → load the first scenario as default (hotel concierge)
      setMessages(SCENARIOS[0].messages);
      setLayout(template.defaultLayout);
      setBackgroundId(d.backgroundId);
      setAppName(d.appName);
      // Fresh session → new random user profile (case A)
      shuffleUserProfile();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [template.id]);

  const desktopRef = useRef<HTMLDivElement>(null);
  const mobileRef  = useRef<HTMLDivElement>(null);
  const [guideOpen, setGuideOpen] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved">("idle");
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [isOverflowing, setIsOverflowing] = useState(false);
  // Live height of the off-screen mobile export canvas — this IS the exported
  // PNG height (mobile export passes no height, so html-to-image captures the
  // element's natural height). Seeded with the min so the first dropdown-open
  // never flashes an undefined value.
  const [mobileHeight, setMobileHeight] = useState(EXPORT_SIZES.mobile.height);
  useEffect(() => {
    const el = mobileRef.current;
    if (!el) return;
    const update = () => setMobileHeight(Math.round(el.offsetHeight));
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Tracks the last messages state that did NOT overflow, used for rollback
  const lastSafeMessagesRef = useRef(messages);
  const messagesRef = useRef(messages);
  useEffect(() => { messagesRef.current = messages; }, [messages]);

  function handleOverflowChange(overflowing: boolean) {
    if (overflowing) {
      const safe    = lastSafeMessagesRef.current;
      const current = messagesRef.current;
      // Only roll back when exactly ONE message was appended at the end
      // (i.e. the user clicked "Add Text/Action/Product").
      // Scenario switches replace ALL messages at once — those must NOT roll back,
      // they should just show the overflow warning.
      const isOneAppend =
        current.length === safe.length + 1 &&
        safe.every((m, i) => m.id === current[i].id);
      if (isOneAppend) {
        // A single message was added and caused overflow → silently roll back
        setMessages(safe);
        // isOverflowing stays false — rollback will resolve the overflow
      } else {
        // Overflow from another cause (resize, scenario switch, content change)
        setIsOverflowing(true);
      }
    } else {
      setIsOverflowing(false);
      // Snapshot the current safe state
      lastSafeMessagesRef.current = messagesRef.current;
    }
  }

  function handleCapacityChange(isFull: boolean) {
    setCanvasIsFull(isFull);
  }

  const bg = getBackground(backgroundId) ?? customBackgrounds.find((b) => b.id === backgroundId);
  const backgroundUrl = bg?.url ?? "/background/bg-200.png";

  const desktopSize = EXPORT_SIZES.desktop;
  const mobileSize  = EXPORT_SIZES.mobile;

  function showToast(msg: string) {
    setToastMsg(msg);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToastMsg(null), 3000);
  }

  function exportFilename(size: "desktop" | "mobile", ext: string) {
    const scenarioSlug = activeScenarioId
      ?? appName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    return `${scenarioSlug}-${size}.${ext}`;
  }

  // Capture one size from its dedicated off-screen canvas. Mobile passes
  // height=undefined so the PNG is variable-height (matches the live preview);
  // never hardcode a mobile height here.
  async function exportOne(size: "desktop" | "mobile") {
    const isDesktop = size === "desktop";
    const ref = isDesktop ? desktopRef.current : mobileRef.current;
    if (!ref) return;
    const { width, height } = isDesktop ? desktopSize : mobileSize;
    await exportImage(ref, width, isDesktop ? height : undefined, exportFilename(size, "png"));
  }

  async function handleExport(mode: "desktop" | "mobile" | "both") {
    setExporting(true);
    setExportError(null);
    try {
      if (mode === "both") {
        await exportOne("desktop");
        // Brief gap so the browser treats these as two distinct downloads.
        await new Promise((r) => setTimeout(r, 400));
        await exportOne("mobile");
      } else {
        await exportOne(mode);
      }
    } catch (err) {
      const msg = err instanceof Error
        ? err.message
        : (err as { message?: string })?.message ?? String(err);
      console.error("Export failed:", err);
      setExportError(`Export failed — ${msg || "unknown error"}`);
    } finally {
      setExporting(false);
    }
  }

  async function handleCopyFigma() {
    const isDesktop = exportSize === "desktop";
    const ref = isDesktop ? desktopRef.current : mobileRef.current;
    if (!ref) return;
    setExporting(true);
    setExportError(null);
    try {
      const { width, height } = isDesktop ? desktopSize : mobileSize;
      await exportSvgToClipboard(ref, width, isDesktop ? height : undefined);
      showToast("SVG copied. Paste with Cmd+V in Figma.");
    } catch (err) {
      const msg = err instanceof Error
        ? err.message
        : (err as { message?: string })?.message ?? String(err);
      console.error("Copy for Figma failed:", err);
      setExportError(`Copy failed — ${msg || "unknown error"}`);
    } finally {
      setExporting(false);
    }
  }

  async function handleSave() {
    if (!desktopRef.current || saveState !== "idle") return;
    setSaveState("saving");
    try {
      const previewDataUrl = await captureThumbnail(desktopRef.current);
      const now = Date.now();
      const dateStr = new Date(now).toLocaleDateString("en-US", { month: "short", day: "numeric" });
      const asset: SavedAsset = {
        id:            `asset-${now}`,
        templateId:    template.id,
        appName,
        name:          `${appName} · ${dateStr}`,
        previewDataUrl,
        savedAt:       now,
        messages,
        backgroundId,
        layout,
        exportSize,
        userName,
        userAvatarUrl,
      };
      saveAsset(asset);
      setSaveState("saved");
      setTimeout(() => setSaveState("idle"), 2000);
    } catch {
      setSaveState("idle");
    }
  }

  const previewSize = exportSize === "desktop" ? desktopSize : mobileSize;
  // Scale preview to fit screen (max ~580px wide)
  const maxPreviewW = 580;
  const scale = Math.min(1, maxPreviewW / previewSize.width);

  return (
    <div className="flex flex-col h-full">

      {/* Migration warning banner */}
      {migrationSkipCount > 0 && (
        <div className="flex items-center justify-between gap-3 px-4 py-2 bg-amber-50 border-b border-amber-200 shrink-0">
          <p className="text-xs text-amber-700">
            이전 형식의 저장된 에셋 {migrationSkipCount}개를 불러올 수 없었습니다.
          </p>
          <button
            onClick={clearMigrationWarning}
            className="text-amber-500 hover:text-amber-700 text-xs shrink-0 transition-colors"
          >
            닫기 ✕
          </button>
        </div>
      )}

      {/* Top bar */}
      <div className="flex items-center gap-3 px-4 py-2.5 border-b border-studio-border bg-studio-sidebar shrink-0">
        <Link href="/" className="flex items-center gap-1.5 text-studio-muted hover:text-studio-text transition-colors">
          <Image src="/Logo_Das.svg" alt="Logo" width={20} height={20} />
          <Home size={14} />
        </Link>
        <span className="text-studio-border select-none">/</span>
        <span className="text-studio-text text-xs font-medium">{template.name}</span>
        <div className="ml-auto">
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
        {/* Left: Preview Canvas */}
        <div className="flex-1 flex flex-col items-center justify-center gap-6 bg-studio-bg overflow-auto py-8">
        {/* Desktop / Mobile preview toggle */}
        <div className="flex flex-col items-center gap-2">
          <div className="flex items-center gap-1 p-1 rounded-xl border border-studio-border bg-studio-sidebar">
            {([
              { size: "desktop" as const, label: "Desktop", Icon: Monitor },
              { size: "mobile"  as const, label: "Mobile",  Icon: Smartphone },
            ]).map(({ size, label, Icon }) => (
              <button
                key={size}
                onClick={() => setExportSize(size)}
                aria-pressed={exportSize === size}
                className={[
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors",
                  exportSize === size
                    ? "bg-studio-hover text-studio-text"
                    : "text-studio-muted hover:text-studio-text",
                ].join(" ")}
              >
                <Icon size={14} />
                {label}
              </button>
            ))}
          </div>
          <p className="text-studio-muted text-[11px] uppercase tracking-wider">
            {exportSize === "desktop"
              ? `${desktopSize.width}×${desktopSize.height}`
              : `${mobileSize.width}×${mobileSize.height}`}
          </p>
        </div>

        {/* Visible preview (scaled) */}
        <div
          style={{
            transform: `scale(${scale})`,
            transformOrigin: "top center",
            marginBottom: `${previewSize.height * scale - previewSize.height}px`,
          }}
        >
          <FeatureMockup
            layout={layout}
            exportSize={exportSize}
            backgroundUrl={backgroundUrl}
            appName={appName}
            messages={messages}
            userName={userName}
            userAvatarUrl={userAvatarUrl}
            onOverflowChange={handleOverflowChange}
            onCapacityChange={handleCapacityChange}
          />
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
                  <Menu.Popup className="z-50 min-w-[220px] rounded-xl border border-studio-border bg-studio-sidebar shadow-xl py-2 outline-none origin-bottom data-[ending-style]:animate-out data-[ending-style]:fade-out-0 data-[ending-style]:zoom-out-95 data-[starting-style]:animate-in data-[starting-style]:fade-in-0 data-[starting-style]:zoom-in-95 duration-100">
                    {/* Header — non-interactive label */}
                    <div className="flex items-center gap-1 px-3 pt-1 pb-2 text-[11px] font-bold uppercase tracking-wider text-studio-text select-none">
                      Export as PNG
                      <span className="text-studio-muted font-semibold">· @2x</span>
                    </div>
                    <Menu.Separator className="h-px bg-studio-border mx-1 my-1.5" />

                    {/* Desktop */}
                    <Menu.Item
                      onClick={() => handleExport("desktop")}
                      className="flex items-center gap-3 px-3 py-2.5 text-sm text-studio-text hover:bg-studio-hover cursor-default outline-none rounded-lg mx-1"
                    >
                      <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-studio-muted/20 shrink-0">
                        <Monitor size={16} className="text-studio-text" />
                      </span>
                      <span className="flex-1">Desktop</span>
                      <span className="text-[11px] text-studio-muted tabular-nums">{desktopSize.width}×{desktopSize.height}</span>
                    </Menu.Item>
                    {/* Mobile — height tracks the live mobile canvas */}
                    <Menu.Item
                      onClick={() => handleExport("mobile")}
                      className="flex items-center gap-3 px-3 py-2.5 text-sm text-studio-text hover:bg-studio-hover cursor-default outline-none rounded-lg mx-1"
                    >
                      <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-studio-muted/20 shrink-0">
                        <Smartphone size={16} className="text-studio-text" />
                      </span>
                      <span className="flex-1">Mobile</span>
                      <span className="text-[11px] text-studio-muted tabular-nums">{mobileSize.width}×{mobileHeight}</span>
                    </Menu.Item>
                    {/* Both */}
                    <Menu.Item
                      onClick={() => handleExport("both")}
                      className="flex items-center gap-3 px-3 py-2.5 text-sm text-studio-text hover:bg-studio-hover cursor-default outline-none rounded-lg mx-1"
                    >
                      <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-studio-muted/20 shrink-0">
                        <Images size={16} className="text-studio-text" />
                      </span>
                      <span className="flex-1">Both</span>
                      <span className="text-[11px] text-studio-muted">2 files</span>
                    </Menu.Item>

                    <Menu.Separator className="h-px bg-studio-border mx-1 my-1.5" />

                    {/* Copy for Figma — coming soon */}
                    <Menu.Item
                      disabled
                      className="flex items-center gap-3 px-3 py-2.5 text-sm text-studio-text outline-none rounded-lg mx-1 opacity-50 cursor-not-allowed data-[disabled]:pointer-events-none"
                    >
                      <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-studio-muted/20 shrink-0">
                        <Clipboard size={16} className="text-studio-text" />
                      </span>
                      <span className="flex-1">Copy for Figma</span>
                      <span className="text-[10px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded-full bg-studio-accent/20 text-studio-accent">
                        Soon
                      </span>
                    </Menu.Item>
                    {/* Export to AI builder — coming soon */}
                    <Menu.Item
                      disabled
                      className="flex items-center gap-3 px-3 py-2.5 text-sm text-studio-text outline-none rounded-lg mx-1 opacity-50 cursor-not-allowed data-[disabled]:pointer-events-none"
                    >
                      <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-studio-muted/20 shrink-0">
                        <Blocks size={16} className="text-studio-text" />
                      </span>
                      <span className="flex-1">Export to AI builder</span>
                      <span className="text-[10px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded-full bg-studio-accent/20 text-studio-accent">
                        Soon
                      </span>
                    </Menu.Item>
                  </Menu.Popup>
                </Menu.Positioner>
              </Menu.Portal>
            </Menu.Root>
          </div>
          {exportError && (
            <p className="text-red-400 text-xs">{exportError}</p>
          )}
        </div>

        {/* Toast */}
        {toastMsg && (
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] px-4 py-2.5 rounded-xl bg-studio-sidebar border border-studio-border shadow-xl text-sm text-studio-text pointer-events-none">
            {toastMsg}
          </div>
        )}

        {/* Hidden full-size export targets — positioned off-screen, NOT sr-only */}
        <div
          aria-hidden
          style={{ position: "fixed", left: "-9999px", top: 0, pointerEvents: "none" }}
        >
          <div ref={desktopRef}>
            <FeatureMockup
              layout={layout}
              exportSize="desktop"
              backgroundUrl={backgroundUrl}
              appName={appName}
              messages={messages}
              userName={userName}
              userAvatarUrl={userAvatarUrl}
              width={desktopSize.width}
              height={desktopSize.height}
            />
          </div>
          {/* height 미전달 → 가변 높이, min 385px */}
          <div ref={mobileRef}>
            <FeatureMockup
              layout={layout}
              exportSize="mobile"
              backgroundUrl={backgroundUrl}
              appName={appName}
              messages={messages}
              userName={userName}
              userAvatarUrl={userAvatarUrl}
              width={mobileSize.width}
            />
          </div>
        </div>
      </div>

        {/* Right: Form Panel */}
        <FormPanel isOverflowing={isOverflowing} />
      </div>

      {guideOpen && (
        <GuideModal onClose={() => setGuideOpen(false)} initialSection="mobile-chat" />
      )}
    </div>
  );
}
