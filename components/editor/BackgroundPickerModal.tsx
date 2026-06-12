"use client";

import { useEffect, useRef, useState } from "react";
import { TriangleAlert, ImageIcon } from "lucide-react";
import { BACKGROUNDS, type Background, type BackgroundGroup } from "@/lib/backgrounds";

const TABS: { key: "all" | BackgroundGroup; label: string }[] = [
  { key: "all",      label: "All" },
  { key: "general",  label: "General" },
  { key: "brand",    label: "Brand themes" },
  { key: "industry", label: "Industry" },
];

type Props = {
  currentId: string;
  customBackgrounds: Background[];
  hiddenGroups?: BackgroundGroup[];
  onSelect: (bg: Background) => void;
  onUpload: (bg: Background) => void;
  onClose: () => void;
};

export function BackgroundPickerModal({
  currentId,
  customBackgrounds,
  hiddenGroups = [],
  onSelect,
  onUpload,
  onClose,
}: Props) {
  const [uploading, setUploading]     = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [tab, setTab] = useState<"all" | BackgroundGroup>("all");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Close on ESC
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setUploadError(null);

    try {
      const fd = new FormData();
      fd.append("file", file);

      const res = await fetch("/api/upload-background", { method: "POST", body: fd });
      const data = await res.json() as { id?: string; label?: string; url?: string; error?: string };

      if (!res.ok) {
        setUploadError(data.error ?? "Upload failed");
        return;
      }

      const bg: Background = {
        id:       data.id!,
        label:    data.label!,
        url:      data.url!,
        category: "custom",
      };

      onUpload(bg);   // persist to store
      onSelect(bg);   // set as active background
      onClose();
    } catch {
      setUploadError("Upload failed — please try again");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  const hiddenGroupSet = new Set(hiddenGroups);
  const tabs = TABS.filter((t) => t.key === "all" || !hiddenGroupSet.has(t.key));
  const allBackgrounds = [...BACKGROUNDS, ...customBackgrounds].filter((bg) => !bg.group || !hiddenGroupSet.has(bg.group));
  const visibleBackgrounds = tab === "all"
    ? allBackgrounds
    : allBackgrounds.filter((bg) => bg.group === tab);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-studio-sidebar border border-studio-border rounded-2xl w-[540px] max-h-[80vh] flex flex-col shadow-2xl">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-studio-border shrink-0">
          <span className="text-sm font-semibold text-studio-text">Select Background</span>
          <button
            onClick={onClose}
            className="text-studio-muted hover:text-studio-text hover:bg-studio-border rounded-[4px] w-6 h-6 flex items-center justify-center text-xs transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-1 px-5 pt-4 pb-3 shrink-0">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={[
                "text-xs font-medium px-3 py-1.5 rounded-lg transition-colors",
                tab === t.key
                  ? "bg-studio-hover text-studio-text"
                  : "text-studio-muted hover:text-studio-text",
              ].join(" ")}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Grid — fixed ~3.5 rows tall (탭별 개수와 무관하게 동일 높이), scrolls beyond */}
        <div className="overflow-y-auto p-5 h-[348px]">
          {visibleBackgrounds.length === 0 ? (
            <p className="text-xs text-studio-muted text-center py-10">No backgrounds in this category yet.</p>
          ) : (
          <div className="grid grid-cols-3 gap-3">
            {visibleBackgrounds.map((bg) => (
              <button
                key={bg.id}
                onClick={() => { onSelect(bg); onClose(); }}
                className={[
                  "relative rounded-xl overflow-hidden border-2 transition-all group",
                  "aspect-video",
                  currentId === bg.id
                    ? "border-studio-accent"
                    : "border-transparent hover:border-studio-accent",
                ].join(" ")}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={bg.url} alt={bg.label} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/15 transition-colors" />
                <span className="absolute bottom-0 inset-x-0 text-[10px] text-white font-medium px-2 py-1.5 bg-gradient-to-t from-black/60 to-transparent truncate text-left">
                  {bg.label}
                </span>
                {currentId === bg.id && (
                  <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-studio-accent rounded-full flex items-center justify-center text-[9px] text-studio-accent-fg font-bold leading-none">
                    ✓
                  </span>
                )}
              </button>
            ))}
          </div>
          )}
        </div>

        {/* Footer: Upload */}
        <div className="px-5 py-4 border-t border-studio-border shrink-0 flex items-start gap-3">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileChange}
          />
          <div className="flex flex-col gap-1">
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="flex items-center gap-1.5 text-xs font-medium px-4 py-2 rounded-lg border border-studio-border text-studio-muted hover:text-studio-text hover:bg-studio-hover transition-colors disabled:opacity-50 self-start"
            >
              <span className="text-sm leading-none">↑</span>
              {uploading ? "Uploading…" : "Upload Image"}
            </button>
            {uploadError ? (
              <span className="text-xs text-red-400 pl-1">{uploadError}</span>
            ) : (
              <div className="flex flex-col gap-0.5 pl-1">
                <span className="flex items-center gap-1 text-[11px] text-studio-muted">
                  <TriangleAlert size={11} className="shrink-0" />
                  To add new backgrounds, please contact the design team
                </span>
                <span className="flex items-center gap-1 text-[11px] text-studio-muted">
                  <ImageIcon size={11} className="shrink-0" />
                  JPEG · PNG · WebP · max 5 MB
                </span>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
