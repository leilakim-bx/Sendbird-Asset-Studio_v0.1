"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  X,
  MessageSquare,
  LayoutDashboard,
  BarChart3,
  BookOpen,
  Plus,
  Download,
  Check,
  Wrench,
} from "lucide-react";
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

function SolidSparklesIcon({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className={className}
      fill="currentColor"
    >
      <path d="M12.1 2.8c.22-.58 1.04-.58 1.26 0l1.62 4.22c.07.18.21.32.39.39l4.22 1.62c.58.22.58 1.04 0 1.26l-4.22 1.62a.68.68 0 0 0-.39.39l-1.62 4.22c-.22.58-1.04.58-1.26 0l-1.62-4.22a.68.68 0 0 0-.39-.39L5.87 10.3c-.58-.22-.58-1.04 0-1.26l4.22-1.62a.68.68 0 0 0 .39-.39L12.1 2.8Z" />
      <path d="M5.25 13.9c.17-.44.79-.44.96 0l.72 1.86c.05.13.15.23.28.28l1.86.72c.44.17.44.79 0 .96l-1.86.72a.5.5 0 0 0-.28.28l-.72 1.86c-.17.44-.79.44-.96 0l-.72-1.86a.5.5 0 0 0-.28-.28l-1.86-.72c-.44-.17-.44-.79 0-.96l1.86-.72a.5.5 0 0 0 .28-.28l.72-1.86Z" />
      <path d="M18.35 15.25c.13-.34.61-.34.74 0l.46 1.18c.04.1.12.18.22.22l1.18.46c.34.13.34.61 0 .74l-1.18.46a.4.4 0 0 0-.22.22l-.46 1.18c-.13.34-.61.34-.74 0l-.46-1.18a.4.4 0 0 0-.22-.22l-1.18-.46c-.34-.13-.34-.61 0-.74l1.18-.46a.4.4 0 0 0 .22-.22l.46-1.18Z" />
    </svg>
  );
}

function SolidFolderIcon({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className={className}
      fill="currentColor"
    >
      <path d="M3.75 5.25A2.25 2.25 0 0 1 6 3h3.08c.67 0 1.3.3 1.73.81l1.22 1.44H18A2.25 2.25 0 0 1 20.25 7.5v.75H7.8a3 3 0 0 0-2.84 2.05l-2.01 6.04V6.05c0-.44.36-.8.8-.8Z" />
      <path d="M7.8 9.75h12.57c.99 0 1.68.98 1.37 1.92l-2.27 6.8A2.25 2.25 0 0 1 17.34 20H4.63c-.99 0-1.68-.98-1.37-1.92l2.27-6.8A2.25 2.25 0 0 1 7.8 9.75Z" />
    </svg>
  );
}

async function copyToClipboard(text: string) {
  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return;
    } catch {
      // Fall through to the textarea fallback for restricted browser contexts.
    }
  }

  const textArea = document.createElement("textarea");
  textArea.value = text;
  textArea.setAttribute("readonly", "true");
  textArea.style.position = "fixed";
  textArea.style.opacity = "0";
  textArea.style.pointerEvents = "none";
  document.body.appendChild(textArea);
  textArea.focus();
  textArea.select();
  const copied = document.execCommand("copy");
  document.body.removeChild(textArea);
  if (!copied) {
    throw new Error("Clipboard copy failed");
  }
}

type PlannedVisual = {
  id: string;
  template: "Product Visual" | "Infographic" | "Chat UI";
  title: string;
  use: string;
  brief: string;
};

const PLANNER_FALLBACKS: PlannedVisual[] = [
  {
    id: "product-card",
    template: "Product Visual",
    title: "Compact feature card",
    use: "Use near the top of the page",
    brief: "Show the feature outcome as a compact product moment.",
  },
  {
    id: "product-details-panel",
    template: "Product Visual",
    title: "Details panel visual",
    use: "Use for governance, review, or object-detail sections",
    brief: "Show status, evidence, and review context.",
  },
  {
    id: "infographic-workflow",
    template: "Infographic",
    title: "Workflow explanation",
    use: "Use in the how-it-works section",
    brief: "Explain the workflow in simple steps or a loop.",
  },
  {
    id: "infographic-comparison",
    template: "Infographic",
    title: "Before and after explanation",
    use: "Use after the hero to explain the improvement",
    brief: "Show what changed before and after.",
  },
  {
    id: "chat-proof",
    template: "Chat UI",
    title: "Customer conversation example",
    use: "Use as proof of the customer-facing outcome",
    brief: "Show a realistic request and AI response.",
  },
  {
    id: "chat-resolution",
    template: "Chat UI",
    title: "Resolution moment",
    use: "Use when the page needs a short outcome proof",
    brief: "Show the problem, AI action, and outcome.",
  },
];

function buildPageVisualPlan(source: string): PlannedVisual[] {
  const normalized = source.toLowerCase();
  const plans: PlannedVisual[] = [];

  const hasDashboard =
    /dashboard|analytics|metric|monitoring|insight|score|quality|report|대시보드|지표|분석|모니터링|품질/.test(normalized);
  const hasWorkflow =
    /workflow|automation|step|process|loop|rule|actionbook|flow|approval|워크플로우|자동화|단계|흐름|룰|승인/.test(normalized);
  const hasConversation =
    /chat|conversation|message|reply|customer|support|ticket|inbox|agent|대화|메시지|상담|문의|티켓|고객/.test(normalized);
  const hasComparison =
    /before|after|compare|old|new|without|with|versus|비교|전후|기존|개선/.test(normalized);

  if (hasDashboard || hasWorkflow || hasConversation || hasComparison) {
    plans.push({
      id: "primary-product-visual",
      template: "Product Visual",
      title: "Main product visual",
      use: "Use as the main page or release visual",
      brief: "Show the core feature as a polished product moment.",
    });
  }

  if (hasDashboard || hasWorkflow) {
    plans.push({
      id: "details-product-visual",
      template: "Product Visual",
      title: "Details panel visual",
      use: "Use for approval, audit, or governance sections",
      brief: "Show status, evidence, and review context.",
    });
  }

  if (hasWorkflow || hasComparison || hasDashboard) {
    plans.push({
      id: "supporting-infographic",
      template: "Infographic",
      title: hasComparison ? "Before and after explanation" : "System or workflow explanation",
      use: "Use after the hero to explain the idea",
      brief: hasComparison
        ? "Show what changed before and after."
        : "Explain how the feature works.",
    });
  }

  if (hasConversation) {
    plans.push({
      id: "conversation-example",
      template: "Chat UI",
      title: "Conversation proof example",
      use: "Use where the customer outcome needs proof",
      brief: "Show the customer problem, AI action, and outcome.",
    });
  }

  for (const fallback of PLANNER_FALLBACKS) {
    if (plans.length >= 6) break;
    if (!plans.some((plan) => plan.id === fallback.id)) {
      plans.push(fallback);
    }
  }

  return plans.slice(0, 6);
}

function buildPlannerPrompt(source: string, plans: PlannedVisual[], alternatives: PlannedVisual[]) {
  const planLines = plans
    .map(
      (plan, index) =>
        `${index + 1}. ${plan.template} — ${plan.title}\n   Placement: ${plan.use}\n   Brief: ${plan.brief}`,
    )
    .join("\n\n");
  const alternativeLines = alternatives
    .map(
      (plan, index) =>
        `${index + 1}. ${plan.template} — ${plan.title}\n   Placement: ${plan.use}\n   Brief: ${plan.brief}`,
    )
    .join("\n\n");

  return [
    "Use the delight-asset-studio Codex skill in this repository.",
    "",
    "Create a small page visual set using only existing Asset Studio templates and blocks.",
    "Do not create a separate design system. Render each asset through the real Studio canvas and run QA for clipping, overlap, and text overflow.",
    "",
    "Studio reachability rule:",
    "Every generated asset must be reproducible from marketer-facing Studio controls.",
    "Do not create arbitrary Studio JSON or renderer-only state.",
    "Do not use customBackgrounds, data URLs, hidden developer tools, pasted raw SceneSpec, localStorage injection, arbitrary bgImage values, or post-render image edits.",
    "Only use visible Studio templates, formats, blocks, built-in background ids, Product Visual recipes, and exposed copy slots.",
    "For blog/article Product Visual and Infographic assets, use Studio blog format with the warmgray/F7F5F0 background.",
    "If the requested visual cannot be created through Studio UI, choose the closest supported Studio template/block or say it is unsupported.",
    "",
    "Important Product Visual rule:",
    "The current Product Visual tool no longer uses the old full-dashboard/workspace mock as the default output.",
    "For Product Visual assets, use the current compact Feature Moment blocks:",
    "- Card: best for AI answers, generated replies, source/evidence proof, search results, and concise feature moments.",
    "- Details panel: best for approvals, governance, audit/activity history, human review, and object detail views.",
    "Use Product Visual productMoment recipe/slot inputs only. Do not output raw conceptScene for normal marketing assets.",
    "Keep Product Visual copy short and slot-based. Do not create full dashboards, builder canvases, tables, or workspace scenes.",
    "",
    "Recommended asset set:",
    planLines,
    "",
    "Optional alternatives:",
    alternativeLines || "None. If the page needs a different angle, propose up to 3 alternatives that still use existing Studio templates.",
    "",
    "When you respond, make the recommended 3 assets first. Then include optional alternatives separately so the marketer can ask to swap if needed.",
    "",
    "Page copy:",
    source.trim(),
  ].join("\n");
}

function getPlannerThumbnailSrc(plan: PlannedVisual) {
  if (plan.template === "Product Visual") {
    return plan.id.includes("details") || plan.title.toLowerCase().includes("details")
      ? "/preview/productvisual_floatingmodal.png"
      : "/preview/productvisual_card.png";
  }

  if (plan.template === "Infographic") {
    return "/preview/diagram.png";
  }

  return "/preview/mobile_mockup.png";
}

function PlannerTemplateThumbnail({ plan }: { plan: PlannedVisual }) {
  return (
    <Image
      src={getPlannerThumbnailSrc(plan)}
      alt=""
      fill
      sizes="112px"
      className="object-cover"
      aria-hidden="true"
    />
  );
}

function PlannerSuggestionCard({
  plan,
}: {
  plan: PlannedVisual;
}) {
  return (
    <div className="group rounded-[var(--app-sidebar-action-radius)] border border-studio-border bg-studio-hover p-3 transition-colors hover:border-studio-muted">
      <div className="mb-2 flex items-center gap-2">
        <span className="inline-flex items-center rounded-[var(--app-sidebar-action-radius)] bg-studio-bg px-3 py-1 text-[11px] font-semibold leading-none text-studio-text">
          {plan.template}
        </span>
      </div>

      <div className="flex gap-3 rounded-[var(--app-sidebar-action-radius)] bg-studio-bg p-3">
        <div className="relative h-20 w-28 shrink-0 overflow-hidden rounded-[var(--app-sidebar-action-radius)] border border-studio-border bg-studio-sidebar">
          <PlannerTemplateThumbnail plan={plan} />
        </div>

        <div className="min-w-0 flex-1 py-0.5">
          <p className="line-clamp-1 text-sm font-semibold leading-tight text-studio-text">
            {plan.title}
          </p>
          <div className="mt-3 flex items-baseline gap-1.5 text-xs leading-relaxed">
            <span className="shrink-0 font-semibold text-studio-text">Use:</span>
            <p className="line-clamp-2 text-studio-muted">{plan.use}</p>
          </div>
        </div>
      </div>
    </div>
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
        desc: "Use Chat UI for conversation screenshots, Infographic for data or diagram images, and Product Visual for product screenshots or generated Concept UI mocks.",
      },
      {
        title: "Start from the fastest input",
        desc: "Pick a scenario, paste article/source text, upload a screenshot, or describe a product feature. Asset Studio gives you a draft you can polish.",
      },
      {
        title: "Edit from the right panel",
        desc: "Use the sidebar to change format, source, background, copy, blocks, crop, and export options. Start at the top and move down.",
      },
      {
        title: "Save or export",
        desc: "Save keeps an editable version in this browser. Export PNG downloads the final image for the website, blog, release note, or social post.",
      },
      {
        title: "Saved work is local",
        desc: "Saved assets stay in this browser on this device. Use Export PNG when you need the file to share, review, or publish.",
      },
      {
        title: "Ask design for missing pieces",
        desc: "If you need a background image or a block that is not available in Asset Studio, please ask the design team.",
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
        desc: "Choose a ready-made scenario, open the full library with +, or use Create from brief to turn structured notes into message blocks.",
      },
      {
        title: "Edit the conversation",
        desc: "Use Messages to revise each bubble. Add text, activity logs, product cards, buttons, checklists, status chips, or itinerary blocks when the story needs them.",
      },
      {
        title: "Choose the background",
        desc: "Pick a visible background or open the library with +. Use General, Brand themes, Industry, or Everyday depending on the story.",
      },
      {
        title: "Finish and export",
        desc: "Adjust the profile, app name, layout, and export size. Export Desktop or Mobile from the top menu, or Save if you want to keep editing later.",
      },
    ],
  },
  {
    id: "infographic",
    label: "Infographic",
    icon: BarChart3,
    steps: [
      {
        title: "Start with the default orbit",
        desc: "Infographic opens with an Orbit diagram because it works well for loops, systems, and product concepts. Use it as-is or change the block type.",
      },
      {
        title: "Choose the image format",
        desc: "Use Product for fixed-size feature images. Use Blog when the image should fit into an article with flexible height.",
      },
      {
        title: "Change the block when needed",
        desc: "Use the Block list to switch between Orbit diagram, Big number, cards, charts, comparisons, steps, and other layouts. The fields below update to match the block.",
      },
      {
        title: "Create from source text",
        desc: "For blog or article work, paste the article text, chart data, or notes and click Generate images from source. Review the suggested images before exporting.",
      },
      {
        title: "Polish only what matters",
        desc: "Edit the title, footnote, labels, numbers, and block details in the sidebar. Use Advanced settings only for less common styling controls.",
      },
      {
        title: "Export one or many",
        desc: "Export the current image, selected article images, or all generated article images as PNG files. Save keeps the editable version in this browser.",
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
        desc: "Choose the Format first: thumbnail, insert, blog, product feature, or mobile. This controls the preview size and export size.",
      },
      {
        title: "Choose Screenshot or Concept UI",
        desc: "Use Concept UI for Product Feature formats. Use Screenshot for real product captures in release, insert, and blog formats.",
      },
      {
        title: "For Screenshot, crop the key area",
        desc: "Upload a PNG, JPG, or WebP, then select the important area. Crop works best for thumbnails; Highlight is only available in supported formats.",
      },
      {
        title: "For Concept UI, use AI chat",
        desc: "Describe the feature, copy the prompt for Claude or Gemini, paste the reply back into Asset Studio, then render the mock UI.",
      },
      {
        title: "Choose the frame",
        desc: "Use Hero crop when you want to choose the visible area yourself. Use Floating panel when the main product panel should sit cleanly on the background.",
      },
      {
        title: "Use Settings only for recovery",
        desc: "Open Settings when you need to restore a previous version, save a backup file, or load a backup. For normal editing and exporting, you can ignore it.",
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

// ── Create with Codex Modal ─────────────────────────────

function PageVisualPlannerModal({ onClose }: { onClose: () => void }) {
  const [source, setSource] = useState("");
  const [copyState, setCopyState] = useState<"idle" | "copied" | "failed">("idle");
  const [hasSuggestions, setHasSuggestions] = useState(false);
  const plans = useMemo(() => buildPageVisualPlan(source), [source]);
  const selectedPlans = useMemo(() => plans.slice(0, 3), [plans]);
  const alternativePlans = useMemo(() => plans.slice(3, 6), [plans]);
  const plannerPrompt = useMemo(
    () => buildPlannerPrompt(source, selectedPlans, alternativePlans),
    [source, selectedPlans, alternativePlans],
  );
  const canSuggest = source.trim().length > 0;

  function handleShowSuggestions() {
    if (!canSuggest) return;
    setHasSuggestions(true);
    setCopyState("idle");
  }

  async function handleCopyPrompt() {
    if (!canSuggest || !hasSuggestions) return;

    try {
      await copyToClipboard(plannerPrompt);
      setCopyState("copied");
      window.setTimeout(() => setCopyState("idle"), 1800);
    } catch {
      setCopyState("failed");
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-6"
      style={{ backgroundColor: "var(--app-overlay-modal)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-studio-sidebar border border-studio-border rounded-2xl w-full max-w-5xl shadow-2xl overflow-hidden flex flex-col" style={{ maxHeight: "min(760px, calc(100vh - 48px))" }}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-studio-border shrink-0">
          <div>
            <p className="text-studio-text font-semibold text-sm">Create with Codex</p>
            <p className="text-studio-muted text-xs mt-0.5">Paste page copy and get a focused asset set for Codex.</p>
          </div>
          <button
            onClick={onClose}
            className="text-studio-muted hover:text-studio-text transition-colors p-1 rounded-md hover:bg-studio-hover"
          >
            <X size={16} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-5">
          <div>
            <label className="block text-[10px] font-semibold uppercase tracking-wider text-studio-muted mb-2">
              Page copy
            </label>
            <div className="relative">
              <textarea
                value={source}
                onChange={(e) => {
                  setSource(e.target.value);
                  setHasSuggestions(false);
                  setCopyState("idle");
                }}
                placeholder="Paste a landing page section, release notes, blog draft, or feature description..."
                className="w-full h-44 resize-none rounded-xl bg-studio-bg border border-studio-border text-studio-text placeholder:text-studio-muted px-4 py-3 pb-16 text-sm leading-relaxed focus:outline-none focus:ring-1 focus:ring-studio-accent"
              />
              <button
                onClick={handleShowSuggestions}
                disabled={!canSuggest}
                style={canSuggest ? { background: "var(--studio-codex-cta-border)" } : undefined}
                className={[
                  "absolute bottom-4 right-4 flex items-center justify-center gap-2 px-4 py-2.5 rounded-[var(--app-sidebar-action-radius)] font-bold text-xs transition-all",
                  canSuggest
                    ? "text-studio-accent-fg hover:opacity-90"
                    : "bg-studio-hover border border-studio-border text-studio-muted disabled:opacity-40 disabled:cursor-not-allowed",
                ].join(" ")}
              >
                <SolidSparklesIcon className="h-3.5 w-3.5 shrink-0" />
                Get image suggestions
              </button>
            </div>
          </div>

          {hasSuggestions ? (
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-studio-muted">
                Suggested image set
              </p>
              <span className="text-[10px] text-studio-muted">
                {selectedPlans.length} assets
              </span>
            </div>

            <div className="grid max-h-[360px] grid-cols-2 gap-3 overflow-y-auto pr-1">
              {selectedPlans.map((plan, index) => (
                <PlannerSuggestionCard key={`${index}-${plan.id}`} plan={plan} />
              ))}
            </div>
            <p className="mt-2 text-[11px] leading-relaxed text-studio-muted">
              Extra alternatives are included in the Codex prompt, not shown here.
            </p>
          </div>
          ) : (
            <div className="rounded-xl border border-studio-border bg-studio-hover/40 p-4">
              <p className="text-studio-text text-xs font-semibold">Next step</p>
              <p className="text-studio-muted text-xs leading-relaxed mt-1">
                Paste page copy, then click Get image suggestions to see the recommended asset set.
              </p>
            </div>
          )}
        </div>

        {hasSuggestions && (
        <div className="border-t border-studio-border p-4 shrink-0">
          <button
            onClick={handleCopyPrompt}
            disabled={!canSuggest}
            className="flex items-center justify-center w-full py-3 rounded-[10px] bg-studio-accent text-studio-accent-fg font-bold text-sm hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {copyState === "copied" ? "Prompt copied" : "Copy Codex planning prompt"}
          </button>
          <p className="mt-2 text-center text-[11px] leading-relaxed text-studio-muted">
            Full asset sets can take 10-20 minutes in Codex. Keep Codex open while it renders.
          </p>
          {copyState === "failed" && (
            <div className="mt-3 rounded-xl border border-red-400/50 bg-red-400/10 p-3">
              <p className="text-red-300 text-xs font-semibold">
                Copy failed. Select and copy this prompt manually.
              </p>
              <textarea
                readOnly
                value={plannerPrompt}
                onFocus={(e) => e.currentTarget.select()}
                className="mt-2 h-24 w-full resize-none rounded-lg bg-studio-bg border border-studio-border px-3 py-2 text-[11px] leading-relaxed text-studio-text focus:outline-none focus:ring-1 focus:ring-studio-accent"
              />
            </div>
          )}
        </div>
        )}
      </div>
    </div>
  );
}

function CodexSkillGuideModal({ onClose }: { onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-6"
      style={{ backgroundColor: "var(--app-overlay-modal)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-studio-sidebar border border-studio-border rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-studio-border">
          <div>
            <p className="text-studio-text font-semibold text-sm">Skill setup guide</p>
            <p className="text-studio-muted text-xs mt-0.5">For Codex users who want batch asset generation.</p>
          </div>
          <button
            onClick={onClose}
            className="text-studio-muted hover:text-studio-text transition-colors p-1 rounded-md hover:bg-studio-hover"
          >
            <X size={16} />
          </button>
        </div>

        <div className="p-5 flex flex-col gap-3">
          {[
            {
              title: "Download the skill package",
              desc: "Use Download Codex Skill, then unzip it inside this project folder.",
            },
            {
              title: "Run the installer",
              desc: "Open the downloaded folder and run install-delight-asset-studio.command, or copy the skill folder into ~/.codex/skills.",
            },
            {
              title: "Restart Codex",
              desc: "Reopen Codex, open this project, then ask Codex to use delight-asset-studio for a page or launch asset set.",
            },
          ].map((step, index) => (
            <div key={step.title} className="rounded-xl bg-studio-hover p-4">
              <div className="flex items-center gap-2 mb-1">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-studio-bg border border-studio-border text-[10px] text-studio-text">
                  {index + 1}
                </span>
                <p className="text-studio-text text-xs font-semibold">{step.title}</p>
              </div>
              <p className="text-studio-muted text-xs leading-relaxed pl-7">{step.desc}</p>
            </div>
          ))}
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
    description: "Data-driven infographics and visual summaries, mainly used for blogs and Perspective.",
    ready: true,
  },
  {
    id: "product-visual",
    icon: LayoutDashboard,
    title: "Product Visual",
    description: "Polish real dashboard screenshots, mainly for product release pages.",
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
  const [modalOpen, setModalOpen] = useState(false);
  const [guideOpen, setGuideOpen] = useState(false);
  const [plannerOpen, setPlannerOpen] = useState(false);
  const [skillGuideOpen, setSkillGuideOpen] = useState(false);
  const [skillDownloadState, setSkillDownloadState] = useState<"idle" | "downloading" | "downloaded" | "failed">("idle");

  async function handleDownloadCodexSkill() {
    setSkillDownloadState("downloading");

    try {
      const response = await fetch("/codex/delight-asset-studio-skill.zip");
      if (!response.ok) {
        throw new Error("Skill package not found");
      }

      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = objectUrl;
      link.download = "delight-asset-studio-skill.zip";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
      setSkillDownloadState("downloaded");
      window.setTimeout(() => setSkillDownloadState("idle"), 1800);
    } catch {
      setSkillDownloadState("failed");
    }
  }

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
            title="Create one asset manually in Studio."
            className="flex items-center justify-center gap-2 w-full py-3 rounded-[var(--app-sidebar-action-radius)] bg-studio-accent text-studio-accent-fg font-bold text-sm hover:opacity-90 transition-opacity"
          >
            <Plus size={15} strokeWidth={2.4} />
            Create asset
          </button>

          {/* Create with Codex */}
          <div className="rounded-[var(--app-sidebar-action-radius)] p-px" style={{ background: "var(--studio-codex-cta-border)" }}>
            <button
              onClick={() => setPlannerOpen(true)}
              title="Paste page copy and get a recommended image set for Codex generation."
              className="codex-gradient-cta flex items-center justify-center gap-2 w-full py-3 rounded-[var(--app-sidebar-action-radius)] bg-studio-sidebar text-studio-text font-semibold text-sm transition-all"
            >
              <SolidSparklesIcon className="h-4 w-4 shrink-0" />
              Create with Codex
            </button>
          </div>

          {/* Asset finder */}
          <Link
            href="/open"
            title="Open saved assets across Chat UI, Infographic, and Product Visual."
            className="flex items-center justify-center gap-3 w-full py-3.5 rounded-[var(--app-sidebar-action-radius)] bg-studio-hover text-studio-text font-semibold text-sm hover:bg-studio-border transition-colors"
          >
            <SolidFolderIcon className="h-[18px] w-[18px] shrink-0" />
            Asset finder
          </Link>
        </div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Bottom utility links */}
        <div className="px-5 pb-6 flex flex-col gap-3">
          <button
            onClick={() => void handleDownloadCodexSkill()}
            disabled={skillDownloadState === "downloading"}
            title="Download the local Codex skill package for fast batch asset generation."
            className="flex items-center gap-3 text-studio-muted hover:text-studio-text transition-colors text-sm font-semibold text-left disabled:cursor-wait disabled:opacity-60"
          >
            {skillDownloadState === "downloaded" ? (
              <Check size={18} strokeWidth={2.2} className="shrink-0" />
            ) : (
              <Download size={18} strokeWidth={2.2} className="shrink-0" />
            )}
            {skillDownloadState === "downloading"
              ? "Preparing download"
              : skillDownloadState === "downloaded"
                ? "Skill downloaded"
                : "Download Codex Skill"}
          </button>
          {skillDownloadState === "failed" && (
            <p className="-mt-2 pl-8 text-[11px] leading-relaxed text-studio-muted">
              Download failed. Try again after the local server refreshes.
            </p>
          )}
          <button
            onClick={() => setSkillGuideOpen(true)}
            title="Learn how to install and use the Codex skill."
            className="flex items-center gap-3 text-studio-muted hover:text-studio-text transition-colors text-sm font-semibold text-left"
          >
            <Wrench size={18} strokeWidth={2.2} className="shrink-0" />
            Skill setup guide
          </button>
          <button
            onClick={() => setGuideOpen(true)}
            title="Open the Asset Studio guide."
            className="flex items-center gap-3 text-studio-muted hover:text-studio-text transition-colors text-sm font-semibold text-left"
          >
            <BookOpen size={18} strokeWidth={2.2} className="shrink-0" />
            Guides
          </button>
        </div>
      </aside>

      {plannerOpen && <PageVisualPlannerModal onClose={() => setPlannerOpen(false)} />}
      {modalOpen  && <NewAssetModal  onClose={() => setModalOpen(false)} />}
      {guideOpen  && <GuideModal     onClose={() => setGuideOpen(false)} />}
      {skillGuideOpen && <CodexSkillGuideModal onClose={() => setSkillGuideOpen(false)} />}
    </>
  );
}
