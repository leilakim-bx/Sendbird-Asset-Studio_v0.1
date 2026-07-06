"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AssetLibrary } from "@/components/assets/AssetLibrary";
import { useEditorStore } from "@/lib/store";

export type OpenAssetTabId = "chat" | "infographic" | "product-visual";

type OpenAssetTab = {
  id: OpenAssetTabId;
  label: string;
  templateIds: string[];
};

const TABS: OpenAssetTab[] = [
  { id: "chat",           label: "Chat UI",        templateIds: ["feature-mockup"] },
  { id: "infographic",    label: "Infographic",    templateIds: ["infographic"] },
  { id: "product-visual", label: "Product Visual", templateIds: ["product-visual"] },
];

export function OpenAssetClient({ initialTab }: { initialTab: OpenAssetTabId }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    const frame = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(frame);
  }, []);

  const savedAssets = useEditorStore((s) => s.savedAssets);
  const activeTab = TABS.find((t) => t.id === initialTab) ?? TABS[0];

  return (
    <div className="p-8 flex flex-col h-full min-h-0">
      {/* Tab bar */}
      <div className="flex items-center gap-1 mb-6 shrink-0 -ml-3">
        {TABS.map((t) => {
          const active = activeTab.id === t.id;
          const count = savedAssets.filter((a) => t.templateIds.includes(a.templateId)).length;
          return (
            <Link
              key={t.id}
              href={`/open?type=${t.id}`}
              className={[
                "flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors",
                active
                  ? "bg-studio-hover text-studio-text"
                  : "text-studio-muted hover:text-studio-text",
              ].join(" ")}
            >
              {t.label}
              {mounted && count > 0 && (
                <span className="text-[10px] tabular-nums bg-studio-bg border border-studio-border text-studio-muted rounded-full px-1.5 py-0.5 leading-none">
                  {count}
                </span>
              )}
            </Link>
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
