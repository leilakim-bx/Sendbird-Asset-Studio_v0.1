"use client";

import { useEffect, useState } from "react";
import { BarChart3, LayoutDashboard } from "lucide-react";
import { AssetLibrary } from "@/components/assets/AssetLibrary";
import { useEditorStore } from "@/lib/store";

// ── Tabs ──────────────────────────────────────────────────

type TabId = "chat" | "infographic" | "product-ui";

const TABS: { id: TabId; label: string; soon?: boolean }[] = [
  { id: "chat",        label: "Chat conversation" },
  { id: "infographic", label: "Infographic", soon: true },
  { id: "product-ui",  label: "Product UI",  soon: true },
];

// ── Coming-soon panel ─────────────────────────────────────

function ComingSoon({ icon: Icon, title, desc }: { icon: React.ElementType; title: string; desc: string }) {
  return (
    <div className="flex items-center justify-center h-full min-h-[420px] p-8">
      <div className="flex flex-col items-center text-center max-w-xs">
        <div className="w-14 h-14 rounded-2xl bg-studio-sidebar border border-studio-border flex items-center justify-center mb-5">
          <Icon size={22} className="text-studio-muted" />
        </div>
        <h2 className="text-studio-text font-semibold text-base mb-2">{title}</h2>
        <p className="text-studio-muted text-sm leading-relaxed">{desc}</p>
        <span className="mt-5 inline-block text-[11px] text-studio-muted border border-studio-border rounded-full px-3 py-1">
          Coming soon
        </span>
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────

export default function OpenAssetPage() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const [tab, setTab] = useState<TabId>("chat");
  const savedCount = useEditorStore((s) => s.savedAssets.length);

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
              {t.id === "chat" && mounted && savedCount > 0 && (
                <span className="text-[10px] tabular-nums bg-studio-bg border border-studio-border text-studio-muted rounded-full px-1.5 py-0.5 leading-none">
                  {savedCount}
                </span>
              )}
              {t.soon && (
                <span className="text-[9px] border border-studio-border rounded-full px-1.5 py-0.5 leading-none">
                  Soon
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Content */}
      {tab === "chat" && <AssetLibrary title="My files" mounted={mounted} />}
      {tab === "infographic" && (
        <ComingSoon
          icon={BarChart3}
          title="Infographic"
          desc="Data-driven infographics and visual summaries are on the way. This section will let you browse and export report and overview assets."
        />
      )}
      {tab === "product-ui" && (
        <ComingSoon
          icon={LayoutDashboard}
          title="Product UI"
          desc="Product interface snippets and dashboards are on the way. This section will let you browse and export real product feature assets."
        />
      )}
    </div>
  );
}
