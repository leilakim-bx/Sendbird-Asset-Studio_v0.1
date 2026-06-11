"use client";

import { useEffect, useState } from "react";
import { AssetLibrary } from "@/components/assets/AssetLibrary";
import { useEditorStore } from "@/lib/store";

// ── Tabs ──────────────────────────────────────────────────

type TabId = "chat" | "infographic" | "product-visual";

const TABS: { id: TabId; label: string; templateIds: string[] }[] = [
  { id: "chat",           label: "Chat UI",        templateIds: ["feature-mockup"] },
  { id: "infographic",    label: "Infographic",    templateIds: ["infographic"] },
  { id: "product-visual", label: "Product Visual", templateIds: ["product-visual"] },
];

// ── Page ──────────────────────────────────────────────────

export default function OpenAssetPage() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    const frame = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(frame);
  }, []);

  const [tab, setTab] = useState<TabId>("chat");
  const savedAssets = useEditorStore((s) => s.savedAssets);
  const activeTab = TABS.find((t) => t.id === tab) ?? TABS[0];

  return (
    <div className="p-8 flex flex-col h-full min-h-0">
      {/* Tab bar */}
      <div className="flex items-center gap-1 mb-6 shrink-0 -ml-3">
        {TABS.map((t) => {
          const active = tab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={[
                "flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors",
                active
                  ? "bg-studio-hover text-studio-text"
                  : "text-studio-muted hover:text-studio-text",
              ].join(" ")}
            >
              {t.label}
              {mounted && savedAssets.filter((a) => t.templateIds.includes(a.templateId)).length > 0 && (
                <span className="text-[10px] tabular-nums bg-studio-bg border border-studio-border text-studio-muted rounded-full px-1.5 py-0.5 leading-none">
                  {savedAssets.filter((a) => t.templateIds.includes(a.templateId)).length}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Content */}
      <AssetLibrary
        title={`${activeTab.label} files`}
        mounted={mounted}
        templateIds={activeTab.templateIds}
        emptyTitle={`No saved ${activeTab.label} files yet`}
        emptyDescription="Open this template and hit Save to add it here."
      />
    </div>
  );
}
