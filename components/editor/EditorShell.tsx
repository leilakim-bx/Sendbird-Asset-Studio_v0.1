"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Home } from "lucide-react";
import { useEditorStore } from "@/lib/store";
import { FormPanel } from "./FormPanel";
import { FeatureMockup } from "@/components/templates/FeatureMockup";
import { getBackground } from "@/lib/backgrounds";
import { exportImage, captureThumbnail } from "@/lib/export";
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
      setMessages(d.messages);
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
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved">("idle");
  const [isOverflowing, setIsOverflowing] = useState(false);

  // Tracks the last messages state that did NOT overflow, used for rollback
  const lastSafeMessagesRef = useRef(messages);
  const messagesRef = useRef(messages);
  useEffect(() => { messagesRef.current = messages; }, [messages]);

  function handleOverflowChange(overflowing: boolean) {
    if (overflowing) {
      const safe    = lastSafeMessagesRef.current;
      const current = messagesRef.current;
      if (current.length > safe.length) {
        // A message was just added and caused overflow → silently roll back
        setMessages(safe);
        // isOverflowing stays false — rollback will resolve the overflow
      } else {
        // Overflow from another cause (e.g. canvas resize) → show warning
        setIsOverflowing(true);
      }
    } else {
      setIsOverflowing(false);
      // Snapshot the current safe state
      lastSafeMessagesRef.current = messagesRef.current;
    }
  }

  const bg = getBackground(backgroundId) ?? customBackgrounds.find((b) => b.id === backgroundId);
  const backgroundUrl = bg?.url ?? "/background/bg-100.png";

  const desktopSize = EXPORT_SIZES.desktop;
  const mobileSize  = EXPORT_SIZES.mobile;

  async function handleExport() {
    const isDesktop = exportSize === "desktop";
    const ref = isDesktop ? desktopRef.current : mobileRef.current;
    if (!ref) return;
    setExporting(true);
    setExportError(null);
    try {
      const { width, height } = isDesktop ? desktopSize : mobileSize;
      await exportImage(ref, width, height, `sendbird-asset-${exportSize}.png`);
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
      </div>

      {/* Editor body */}
      <div className="flex flex-1 min-h-0">
        {/* Left: Preview Canvas */}
        <div className="flex-1 flex flex-col items-center justify-center gap-6 bg-studio-bg overflow-auto py-8">
        <p className="text-studio-muted text-xs uppercase tracking-wider">
          Preview — {exportSize === "desktop"
            ? `Desktop ${desktopSize.width}×${desktopSize.height}`
            : `Mobile ${mobileSize.width}×${mobileSize.height}`}
        </p>

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
            <button
              onClick={handleExport}
              disabled={exporting}
              className="bg-studio-accent text-studio-accent-fg font-semibold text-sm px-6 py-2.5 rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {exporting ? "Exporting…" : `Export ${exportSize === "desktop" ? "Desktop" : "Mobile"} PNG`}
            </button>
          </div>
          {exportError && (
            <p className="text-red-400 text-xs">{exportError}</p>
          )}
        </div>

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
              height={mobileSize.height}
            />
          </div>
        </div>
      </div>

        {/* Right: Form Panel */}
        <FormPanel isOverflowing={isOverflowing} />
      </div>
    </div>
  );
}
