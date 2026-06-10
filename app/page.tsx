"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AssetLibrary } from "@/components/assets/AssetLibrary";
import { useEditorStore } from "@/lib/store";

// ── Template gallery ──────────────────────────────────────

const TEMPLATES = [
  {
    id: "feature-mockup",
    title: "Chat UI",
    preview: "/preview/mobile_mockup.png",
    ready: true,
  },
  {
    id: "infographic",
    title: "Infographic",
    preview: "/preview/diagram.png",
    ready: true,
  },
  {
    id: "product-ui",
    title: "Product UI",
    preview: "/preview/snippet.png",
    ready: true,
  },
];

function TemplateGallery() {
  const router = useRouter();
  const setFreshStart = useEditorStore((s) => s.setFreshStart);
  return (
    <div className="mb-8">
      <div className="flex gap-4 overflow-x-auto pb-1 -mx-8 px-8">
        {TEMPLATES.map((t) => (
          <button
            key={t.id}
            onClick={() => {
              if (!t.ready) return;
              // "Create asset" → seed fresh, not resume. Only chat + infographic
              // consume this flag on mount (product-ui autosave is out of scope),
              // so scope it to them to avoid a lingering flag.
              if (t.id === "feature-mockup" || t.id === "infographic") {
                setFreshStart(true);
              }
              router.push(`/editor/${t.id}`);
            }}
            className={[
              "relative shrink-0 w-56 h-36 rounded-xl overflow-hidden group",
              t.ready ? "cursor-pointer" : "cursor-default",
            ].join(" ")}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={t.preview} alt={t.title} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
            {t.ready && (
              <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity" />
            )}
            <div className="absolute bottom-0 inset-x-0 px-3 py-2.5 flex items-end justify-between">
              <span className="text-white text-xs font-medium">{t.title}</span>
              {!t.ready && (
                <span className="text-[10px] text-white/60 border border-white/30 rounded-full px-2 py-0.5">
                  Soon
                </span>
              )}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────

export default function Home() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    const frame = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(frame);
  }, []);

  return (
    <div className="p-8 flex flex-col h-full min-h-0">
      <TemplateGallery />
      <AssetLibrary title="My files" mounted={mounted} />
    </div>
  );
}
