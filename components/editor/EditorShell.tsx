"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Home } from "lucide-react";
import { useEditorStore } from "@/lib/store";
import { FormPanel } from "./FormPanel";
import { FeatureMockup } from "@/components/templates/FeatureMockup";
import { getBackground } from "@/lib/backgrounds";
import { exportImage } from "@/lib/export";
import type { Template } from "@/lib/template-registry";
import { EXPORT_SIZES } from "@/lib/template-registry";

export function EditorShell({ template }: { template: Template }) {
  const {
    layout, exportSize, backgroundId, appName, messages,
    setMessages, setLayout, setBackgroundId, setAppName,
    customBackgrounds,
  } = useEditorStore();

  // Seed default content on mount
  useEffect(() => {
    const d = template.defaultContent;
    setMessages(d.messages);
    setLayout(template.defaultLayout);
    setBackgroundId(d.backgroundId);
    setAppName(d.appName);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [template.id]);

  const desktopRef = useRef<HTMLDivElement>(null);
  const mobileRef  = useRef<HTMLDivElement>(null);
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);

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

  const previewSize = exportSize === "desktop" ? desktopSize : mobileSize;
  // Scale preview to fit screen (max ~580px wide)
  const maxPreviewW = 580;
  const scale = Math.min(1, maxPreviewW / previewSize.width);

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
          />
        </div>

        {/* Export button */}
        <div className="flex flex-col items-center gap-2">
          <button
            onClick={handleExport}
            disabled={exporting}
            className="bg-studio-accent text-studio-accent-fg font-semibold text-sm px-6 py-2.5 rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {exporting ? "Exporting…" : `Export ${exportSize === "desktop" ? "Desktop" : "Mobile"} PNG`}
          </button>
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
              width={mobileSize.width}
              height={mobileSize.height}
            />
          </div>
        </div>
      </div>

        {/* Right: Form Panel */}
        <FormPanel />
      </div>
    </div>
  );
}
