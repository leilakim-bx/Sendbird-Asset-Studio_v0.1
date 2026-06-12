"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { X, MessageSquare, LayoutDashboard, BarChart3, Sparkles, BookOpen } from "lucide-react";
import { useEditorStore } from "@/lib/store";

// ── Nav ───────────────────────────────────────────────────

const NAV_ITEMS = [
  { label: "Home",          href: "/" },
  { label: "Recent Assets", href: "/recent" },
];

function NavItem({ label, href, badge }: { label: string; href: string; badge?: number }) {
  const pathname = usePathname();
  const active = pathname === href;
  return (
    <Link
      href={href}
      className={[
        "flex items-center justify-between px-3 py-1.5 rounded-md text-sm transition-colors",
        active
          ? "text-studio-text bg-studio-hover"
          : "text-studio-muted hover:text-studio-text hover:bg-studio-hover",
      ].join(" ")}
    >
      <span>{label}</span>
      {badge != null && badge > 0 && (
        <span className="text-[10px] tabular-nums bg-studio-hover border border-studio-border text-studio-muted rounded-full px-1.5 py-0.5 leading-none">
          {badge}
        </span>
      )}
    </Link>
  );
}

// ── Guide Modal ───────────────────────────────────────────

type GuideSection = {
  id: string;
  label: string;
  icon: React.ElementType;
  soon?: boolean;
  steps?: { title: string; desc: string }[];
  comingSoon?: boolean;
};

const GUIDE_SECTIONS: GuideSection[] = [
  {
    id: "getting-started",
    label: "Getting started",
    icon: BookOpen,
    steps: [
      {
        title: "Choose the right template",
        desc: "Use Chat UI for conversation mockups, Infographic for article or data visuals, and Product Visual when you already have a product screenshot to polish.",
      },
      {
        title: "Start with source material",
        desc: "Begin from a scenario, a full article, or an uploaded dashboard screenshot. The editor gives you a clean first draft, then you only adjust the details.",
      },
      {
        title: "Polish in the right sidebar",
        desc: "Most edits live in the right panel: format, background, layout, title, text, blocks, and image selection. Advanced controls are optional.",
      },
      {
        title: "Save or export",
        desc: "Save keeps the asset in this browser's Recent Assets/Open asset list. Export downloads a clean PNG, usually at @2x for website-ready output.",
      },
      {
        title: "Local files are personal",
        desc: "Saved assets are stored locally per browser and per device. They are meant as each marketer's personal working files; use Export PNG for the final file to share or publish.",
      },
    ],
  },
  {
    id: "mobile-chat",
    label: "Chat UI",
    icon: MessageSquare,
    steps: [
      {
        title: "Pick a scenario",
        desc: "Start from a scenario card, open the full scenario library with +, or write a short prompt in Create with AI to generate a draft conversation.",
      },
      {
        title: "Edit the conversation",
        desc: "Use Messages to revise each bubble. Add text, activity logs, product cards, action buttons, checklists, status chips, or itinerary blocks when needed.",
      },
      {
        title: "Set the scene",
        desc: "Choose one of the six visible backgrounds or open the background library with +. Use Split for people photos and Center for simple scenery.",
      },
      {
        title: "Finish the frame",
        desc: "Adjust the user profile, app name, and export size. Export Desktop or Mobile from the top export menu, or Save to keep it in this browser's Recent Assets.",
      },
    ],
  },
  {
    id: "infographic",
    label: "Infographic",
    icon: BarChart3,
    steps: [
      {
        title: "Choose a format first",
        desc: "Use Product feature for product, capabilities, and industry pages. Use Blog/Perspective for article images with a 664px-wide flexible height.",
      },
      {
        title: "Create from article",
        desc: "Paste the article text, chart data, or image notes and click Generate images from source. Asset Studio will suggest 2-5 infographic images from the pasted content.",
      },
      {
        title: "Keep sources pasted",
        desc: "URL import is disabled by security policy. Copy readable text from protected pages or internal docs into the source field instead.",
      },
      {
        title: "Review each suggested image",
        desc: "Open Article images, click an image to edit it, and use the checkbox to decide which images should be exported.",
      },
      {
        title: "Keep advanced edits optional",
        desc: "Use Advanced settings only when you need to change presets, colors, backgrounds, chart variants, or detailed block values.",
      },
      {
        title: "Export the set",
        desc: "Save keeps the editable infographic locally in this browser. Export the current image, selected images, or all article images as PNG files at @2x.",
      },
    ],
  },
  {
    id: "product-visual",
    label: "Product Visual",
    icon: LayoutDashboard,
    steps: [
      {
        title: "Pick where the image will be used",
        desc: "Choose Product Feature, Product Release, or Blog from Format. Release thumbnail is fixed at 667×316; insert, blog, and mobile formats use flexible height.",
      },
      {
        title: "Choose Screenshot or Concept UI",
        desc: "Screenshot starts from a real product capture. Concept UI creates a clean mock UI from a feature description when no finished screenshot exists yet.",
      },
      {
        title: "If using Screenshot, upload and crop",
        desc: "Upload a PNG, JPG, or WebP, then use Select key area to choose the feature area. Crop is best for thumbnails; Highlight is only for formats that support it.",
      },
      {
        title: "If using Concept UI, generate the scene",
        desc: "Describe the feature, copy the prompt into Claude or Gemini, paste the AI reply back, then choose Hero crop for manual cropping or Floating panel for the main panel.",
      },
      {
        title: "Save or export",
        desc: "Check the preview, then Save the editable setup locally or Export PNG at the selected format size.",
      },
    ],
  },
];

export function GuideModal({ onClose, initialSection = "getting-started" }: { onClose: () => void; initialSection?: string }) {
  const [active, setActive] = useState(initialSection);
  const section = GUIDE_SECTIONS.find((s) => s.id === active)!;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-6"
      style={{ backgroundColor: "var(--app-overlay-modal)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-studio-sidebar border border-studio-border rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col" style={{ height: 480 }}>

        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-4 shrink-0">
          <div>
            <p className="text-studio-text font-semibold text-sm">Guides</p>
            <p className="text-studio-muted text-xs mt-0.5">How to use Asset Studio.</p>
          </div>
          <button
            onClick={onClose}
            className="text-studio-muted hover:text-studio-text transition-colors p-1 rounded-md hover:bg-studio-hover"
          >
            <X size={15} />
          </button>
        </div>

        {/* Top tab bar */}
        <div className="flex items-center gap-1 px-5 pb-4 shrink-0">
          {GUIDE_SECTIONS.map((s) => (
            <button
              key={s.id}
              onClick={() => setActive(s.id)}
              className={[
                "flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors",
                active === s.id
                  ? "bg-studio-hover text-studio-text"
                  : "text-studio-muted hover:text-studio-text",
              ].join(" ")}
            >
              {s.label}
              {s.soon && (
                <span className="text-[9px] border border-studio-border rounded-full px-1.5 py-0.5 leading-none">
                  Soon
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-5 py-5">
          {section.comingSoon ? (
            <div className="flex flex-col items-center justify-center h-full text-center gap-3">
              <section.icon size={24} className="text-studio-border" />
              <p className="text-studio-text text-sm font-medium">{section.label}</p>
              <p className="text-studio-muted text-xs">Guide coming soon.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {section.steps!.map((step, i) => (
                <div key={i} className="bg-studio-hover rounded-xl p-4">
                  <p className="text-studio-text text-xs font-semibold mb-1">{step.title}</p>
                  <p className="text-studio-muted text-xs leading-relaxed">{step.desc}</p>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}

// ── New Asset Modal ───────────────────────────────────────

type AssetType = {
  id: string;
  icon: typeof MessageSquare;
  title: string;
  description: string;
  /** Clickable + navigable. */
  ready: boolean;
  /** Usable but still being developed → shows an "In progress" badge. */
  inProgress?: boolean;
};

const ASSET_TYPES: AssetType[] = [
  {
    id: "feature-mockup",
    icon: MessageSquare,
    title: "Chat UI",
    description: "Floating glass chat UI over atmospheric scene photos. Perfect for product landing pages and feature sections.",
    ready: true,
  },
  {
    id: "infographic",
    icon: BarChart3,
    title: "Infographic",
    description: "Data-driven infographics and visual summaries for reports, overviews, and marketing decks.",
    ready: true,
    inProgress: true,
  },
  {
    id: "product-visual",
    icon: LayoutDashboard,
    title: "Product Visual",
    description: "Polish product screenshots for releases and blogs.",
    ready: true,
    inProgress: true,
  },
];

function NewAssetModal({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const setFreshStart = useEditorStore((s) => s.setFreshStart);

  return (
    /* Backdrop */
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-6"
      style={{ backgroundColor: "var(--app-overlay-modal)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      {/* Panel */}
      <div className="bg-studio-sidebar border border-studio-border rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-studio-border">
          <div>
            <p className="text-studio-text font-semibold text-sm">Create asset</p>
            <p className="text-studio-muted text-xs mt-0.5">Choose a template to get started</p>
          </div>
          <button
            onClick={onClose}
            className="text-studio-muted hover:text-studio-text transition-colors p-1 rounded-md hover:bg-studio-hover"
          >
            <X size={16} />
          </button>
        </div>

        {/* Template list */}
        <div className="p-4 flex flex-col gap-3">
          {ASSET_TYPES.map((type) => {
            const Icon = type.icon;
            return (
              <div
                key={type.id}
                className={[
                  "flex items-start gap-4 p-4 rounded-xl border transition-colors",
                  type.ready
                    ? "border-studio-border bg-studio-hover hover:border-studio-muted cursor-pointer"
                    : "border-studio-border opacity-50 cursor-not-allowed",
                ].join(" ")}
                onClick={() => {
                  if (!type.ready) return;
                  // "Create asset" → seed fresh, not resume. Scoped to the two
                  // templates that consume the flag (product-visual out of scope).
                  if (type.id === "feature-mockup" || type.id === "infographic") {
                    setFreshStart(true);
                  }
                  onClose();
                  router.push(`/editor/${type.id}`);
                }}
              >
                {/* Icon */}
                <div className="w-9 h-9 rounded-lg bg-studio-bg border border-studio-border flex items-center justify-center shrink-0">
                  <Icon size={16} className="text-studio-muted" />
                </div>

                {/* Text */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-studio-text text-sm font-medium">{type.title}</p>
                    {!type.ready ? (
                      <span className="text-[10px] text-studio-muted border border-studio-border rounded-full px-2 py-0.5">
                        Soon
                      </span>
                    ) : type.inProgress ? (
                      <span className="text-[10px] bg-studio-accent/[0.12] border border-studio-accent/30 text-studio-accent rounded-full px-2 py-0.5 font-medium">
                        In progress
                      </span>
                    ) : (
                      <span className="text-[10px] bg-studio-accent text-studio-accent-fg rounded-full px-2 py-0.5 font-medium">
                        Ready
                      </span>
                    )}
                  </div>
                  <p className="text-studio-muted text-xs leading-relaxed">{type.description}</p>
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </div>
  );
}

// ── Sidebar ───────────────────────────────────────────────

export function Sidebar() {
  const router = useRouter();
  const [modalOpen, setModalOpen] = useState(false);
  const [guideOpen, setGuideOpen] = useState(false);

  return (
    <>
      <aside className="w-[260px] shrink-0 flex flex-col h-screen bg-studio-sidebar border-r border-studio-border">
        {/* Logo */}
        <div className="px-4 pt-8 pb-5">
          <div className="flex items-center gap-3">
            <Image
              src="/Logo_Das.svg"
              alt="Delight.ai Asset Studio"
              width={36}
              height={36}
              className="shrink-0"
            />
            <div className="min-w-0">
              <p className="text-studio-text font-semibold text-[15px] leading-tight truncate">
                Delight.ai Asset Studio
              </p>
              <p className="text-studio-muted text-xs mt-0.5">v1.0.0</p>
            </div>
          </div>
        </div>

        <div className="border-t border-studio-border" />

        {/* Main nav */}
        <nav className="px-3 py-4 flex flex-col gap-0.5">
          {NAV_ITEMS.map((item) => (
            <NavItem key={item.href} {...item} />
          ))}
        </nav>

        <div className="border-t border-studio-border" />

        {/* Action buttons */}
        <div className="px-4 py-5 flex flex-col gap-2">
          {/* Create asset */}
          <button
            onClick={() => setModalOpen(true)}
            className="flex items-center justify-center gap-2 w-full py-3 rounded-[10px] bg-studio-accent text-studio-accent-fg font-bold text-sm hover:opacity-90 transition-opacity"
          >
            Create asset
          </button>

          {/* Create with AI — coming soon */}
          <button
            disabled
            className="flex items-center justify-center gap-2 w-full py-3 rounded-[10px] border border-studio-border text-studio-muted font-semibold text-sm opacity-50 cursor-not-allowed"
          >
            <Sparkles size={15} />
            Create with AI
            <span className="text-[10px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded-full bg-studio-accent/20 text-studio-accent">
              Soon
            </span>
          </button>

          {/* Open asset */}
          <button
            onClick={() => router.push("/open")}
            className="flex items-center justify-center gap-2 w-full py-3 rounded-[10px] border border-studio-border text-studio-muted font-semibold text-sm hover:text-studio-text hover:border-studio-muted transition-colors"
          >
            Open asset
          </button>
        </div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Guides */}
        <div className="px-4 pb-6">
          <button
            onClick={() => setGuideOpen(true)}
            className="flex items-center justify-center gap-2 w-full py-2.5 rounded-[10px] border border-studio-border text-studio-muted text-sm hover:text-studio-text hover:border-studio-muted transition-colors"
          >
            <BookOpen size={14} />
            Guides
          </button>
        </div>
      </aside>

      {modalOpen  && <NewAssetModal  onClose={() => setModalOpen(false)} />}
      {guideOpen  && <GuideModal     onClose={() => setGuideOpen(false)} />}
    </>
  );
}
