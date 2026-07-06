"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown, Upload, RefreshCw, Trash2, Check, Plus, Lightbulb, Sparkles, Info } from "lucide-react";
import { Menu } from "@base-ui/react/menu";
import { ZodError } from "zod";
import { useEditorStore } from "@/lib/store";
import {
  PRODUCT_VISUAL_BG_HEX,
  FORMAT_FIXED_BG,
  PRODUCT_VISUAL_REFERENCE_REBUILD_ARCHIVED,
  isImageBgFormat,
  type ProductVisualContent,
  type ProductVisualFormat,
  type ProductVisualBg,
  type ProductVisualReferenceLayout,
  type ProductVisualSourceMode,
} from "@/lib/types/product-visual";
import { BACKGROUNDS } from "@/lib/backgrounds";
import { MAX_UPLOAD_MB, uploadProductVisualScreenshot, UPLOAD_ACCEPT } from "@/lib/product-visual/upload-image";
import { Section } from "./Section";
import { CropSelector } from "./CropSelector";
import { BackgroundPickerModal } from "@/components/editor/BackgroundPickerModal";
import { CoachmarkBubble } from "@/components/ui/coachmark-bubble";
import { AiMagicButton } from "@/components/ui/ai-magic-button";
import { SceneRenderer } from "@/components/concept-ui/SceneRenderer";
import {
  conceptSceneToProductScreenshot,
  exportConceptSceneElement,
  type FramingPreset,
} from "@/lib/concept-ui/export-scene";
import {
  recommendProductVisualRecipes,
  ruleBasedSpecProvider,
  type ProductVisualRecipe,
  type ProductVisualRecipeId,
} from "@/lib/concept-ui/provider";
import {
  parseSceneSpec,
  type ConceptUiArchetype,
  type ModalSceneSpec,
  type SceneSpec,
  type TableSceneSpec,
} from "@/lib/concept-ui/scene-spec";
import { useOnceFlag } from "@/lib/use-once-flag";
import { logBriefEvent } from "@/lib/brief-log";

const DISPLAY_MODES: { id: "crop" | "highlight"; label: string }[] = [
  { id: "crop", label: "Crop" },
  { id: "highlight", label: "Highlight" },
];

const DEFAULT_PANEL_W = 320;
const MIN_PANEL_W = 240;
const MAX_PANEL_W = 520;
const CONCEPT_UI_PLACEHOLDER = "Example: AI suggests the next best reply using customer memory and recent conversation history.";
const CONCEPT_UI_COACHMARK_COPY = "Describe the product screen you need, then generate a polished visual with Delight.ai components.";
const CONCEPT_UI_TEXT_LANGUAGE = "en" as const;
const CONCEPT_GUIDANCE_TEMPLATE = [
  "Feature: ",
  "User: ",
  "Product surface: ",
  "Key proof: ",
  "Avoid: ",
].join("\n");
const CONCEPT_GUIDANCE_APPEND_TEMPLATE = [
  "Feature: ",
  "Product surface: ",
  "Key proof: ",
  "Avoid: ",
].join("\n");
const PRODUCT_FEATURE_SCREENSHOT_RESTRICTION = "This format is restricted to maintain quality.";
const SOURCE_OPTIONS: { id: ProductVisualSourceMode; label: string }[] = [
  { id: "concept", label: "Concept UI" },
  ...(PRODUCT_VISUAL_REFERENCE_REBUILD_ARCHIVED ? [] : [{ id: "reference" as const, label: "Rebuild" }]),
  { id: "screenshot", label: "Screenshot" },
];
const LEGACY_APPROVAL_CAPTURE = { width: 1600, height: 840 } as const;
const REFERENCE_LAYOUT_OPTIONS: { id: ProductVisualReferenceLayout; label: string; archetype?: ConceptUiArchetype }[] = [
  { id: "auto", label: "Auto" },
  { id: "workspace", label: "Workspace", archetype: "workspace" },
  { id: "dashboard", label: "Dashboard", archetype: "dashboard" },
  { id: "builder", label: "Builder", archetype: "builder" },
  { id: "inbox", label: "Inbox", archetype: "inbox" },
  { id: "table", label: "Table", archetype: "table" },
  { id: "modal", label: "Modal", archetype: "modal" },
];
function prettySpec(spec: SceneSpec): string {
  return JSON.stringify(spec, null, 2);
}

function formatSpecError(error: unknown): string {
  if (error instanceof ZodError) {
    return error.issues.map((issue) => `${issue.path.join(".") || "spec"}: ${issue.message}`).join("\n");
  }
  if (error instanceof SyntaxError) return "Invalid spec syntax.";
  if (error instanceof Error) return error.message;
  return String(error);
}

function IconTooltip({ label }: { label: string }) {
  return (
    <span className="pointer-events-none absolute bottom-full right-0 z-30 mb-1.5 rounded-md border border-studio-border bg-studio-bg px-2 py-1 text-[10px] font-medium text-studio-text opacity-0 shadow-xl transition-opacity duration-150 group-hover/action:opacity-100 group-focus-within/action:opacity-100">
      {label}
    </span>
  );
}

function FormatInfoTooltip() {
  return (
    <span className="group relative inline-flex items-center" tabIndex={0}>
      <Info size={13} className="cursor-help text-studio-muted transition-colors hover:text-studio-text" />
      <span className="pointer-events-none absolute left-0 top-full z-50 mt-1.5 w-64 rounded-md border border-studio-border bg-studio-bg px-2.5 py-2 text-[11px] font-normal normal-case leading-snug tracking-normal text-studio-text opacity-0 shadow-xl transition-opacity duration-150 group-hover:opacity-100 group-focus:opacity-100">
        Screenshot-based images can&apos;t use Product Feature formats. Use Concept UI to keep Product Feature visuals polished and consistent.
      </span>
    </span>
  );
}

type ReferenceImage = {
  url: string;
  name: string;
  naturalWidth: number;
  naturalHeight: number;
};

function StepLabel({
  number,
  title,
  description,
}: {
  number: number;
  title: string;
  description?: string;
}) {
  return (
    <div className="flex items-start gap-2">
      <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-studio-border text-[10px] font-bold text-studio-text">
        {number}
      </span>
      <span>
        <span className="block text-xs font-semibold text-studio-text">{title}</span>
        {description ? <span className="mt-0.5 block text-[11px] leading-snug text-studio-muted">{description}</span> : null}
      </span>
    </div>
  );
}

function RecipePreviewThumb({
  id,
  className = "w-full",
}: {
  id: ProductVisualRecipeId;
  className?: string;
}) {
  const isFloating = id === "approval-modal";
  const src = isFloating ? "/preview/productvisual_floatingmodal.png" : "/preview/productvisual_card.png";

  return (
    <span
      className={`relative block h-[84px] overflow-hidden rounded-md bg-studio-preview-surface ${className}`}
      aria-hidden="true"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt=""
        className="absolute inset-0 size-full object-contain"
        draggable={false}
      />
    </span>
  );
}

type ProductMomentDraft = Record<string, string>;

const BLOCK_COPY_PANEL_CLASS = "mt-4 rounded-lg bg-studio-hover p-2.5";
const BLOCK_COPY_LABEL_CLASS = "mb-1 block text-[10px] font-medium uppercase tracking-[0.12em] text-studio-muted";
const BLOCK_COPY_FIELD_LABEL_CLASS = "mb-1 block text-[10px] font-medium text-studio-muted";
const BLOCK_COPY_INPUT_CLASS =
  "w-full rounded-md border border-studio-border bg-studio-sidebar px-3 py-2 text-xs text-studio-text outline-none placeholder:text-studio-muted/60 focus:ring-1 focus:ring-studio-accent";
const BLOCK_COPY_TEXTAREA_CLASS = `${BLOCK_COPY_INPUT_CLASS} resize-none leading-relaxed`;

const RESPONSE_CARD_COPY_LIMITS = {
  title: 34,
  reviewer: 24,
  response: 150,
  source1: 36,
  source2: 36,
  source1Match: 10,
  source2Match: 10,
  primaryAction: 12,
  secondaryAction: 12,
} as const satisfies Record<string, number>;

const RESPONSE_SOURCE_ICON_OPTIONS = [
  { id: "document", label: "Document" },
  { id: "knowledge", label: "Knowledge" },
  { id: "customer", label: "Customer" },
  { id: "data", label: "Data" },
  { id: "conversation", label: "Conversation" },
] as const;

type ResponseSourceIconId = (typeof RESPONSE_SOURCE_ICON_OPTIONS)[number]["id"];

function responseSourceIconValue(value?: string): ResponseSourceIconId {
  return RESPONSE_SOURCE_ICON_OPTIONS.some((option) => option.id === value)
    ? (value as ResponseSourceIconId)
    : "document";
}

const DETAILS_PANEL_COPY_LIMITS = {
  title: 40,
  detailType: 42,
  detailName: 36,
  detailStatus: 14,
  detailTime: 16,
  activity1Tag: 24,
  activity1Text: 64,
  activity2Tag: 24,
  activity2Text: 64,
  activity3Tag: 24,
  activity3Text: 64,
} as const satisfies Record<string, number>;

const DETAILS_PANEL_ACTIVITY_ROWS = [1, 2, 3] as const;

function detailsPanelShowInformation(draft: ProductMomentDraft): boolean {
  return draft.showInformation !== "false";
}

function responseCardShowReviewer(draft: ProductMomentDraft): boolean {
  return draft.showReviewer !== "false";
}

function responseCardShowSources(draft: ProductMomentDraft): boolean {
  return draft.showSources !== "false";
}

function responseCardShowButtons(draft: ProductMomentDraft): boolean {
  return draft.showButtons !== "false";
}

function isResponseMomentSpec(spec: SceneSpec | null): boolean {
  return spec?.archetype === "modal" && spec.content.modal.slotId === "moment-ai-response";
}

function isApprovalMomentSpec(spec: SceneSpec | null): boolean {
  return spec?.archetype === "modal" && spec.content.modal.slotId === "moment-approval";
}

function isSearchMomentSpec(spec: SceneSpec | null): spec is TableSceneSpec {
  return spec?.archetype === "table" && /conversation search|delight\.ai search/i.test(`${spec.content.productName} ${spec.content.title}`);
}

function modalFieldValue(spec: ModalSceneSpec, label: string): string {
  return spec.content.modal.fields.find((field) => field.label.toLowerCase() === label.toLowerCase())?.value ?? "";
}

function modalSlotValue(spec: ModalSceneSpec, slotId: string): string {
  return spec.content.modal.fields.find((field) => field.slotId === slotId)?.value ?? "";
}

function splitSourceValue(value: string): { label: string; match: string } {
  const [label, match] = value.split("|").map((part) => part.trim());
  return { label: label || value, match: match || "" };
}

function combineSourceValue(label: string, match: string): string {
  return match.trim() ? `${label.trim()}|${match.trim()}` : label.trim();
}

function draftText(draft: ProductMomentDraft, key: string, fallback: string, max: number): string {
  const cleaned = (draft[key] ?? "").replace(/\s+/g, " ").trim();
  const value = cleaned || fallback;
  return value.length <= max ? value : `${value.slice(0, max - 3).trimEnd()}...`;
}

function responseCardLimit(key: string): number | undefined {
  return RESPONSE_CARD_COPY_LIMITS[key as keyof typeof RESPONSE_CARD_COPY_LIMITS];
}

function responseCardDraftText(draft: ProductMomentDraft, key: keyof typeof RESPONSE_CARD_COPY_LIMITS, fallback: string): string {
  return draftText(draft, key, fallback, RESPONSE_CARD_COPY_LIMITS[key]);
}

function detailsPanelLimit(key: string): number | undefined {
  return DETAILS_PANEL_COPY_LIMITS[key as keyof typeof DETAILS_PANEL_COPY_LIMITS];
}

function detailsPanelDraftText(draft: ProductMomentDraft, key: keyof typeof DETAILS_PANEL_COPY_LIMITS, fallback: string): string {
  return draftText(draft, key, fallback, DETAILS_PANEL_COPY_LIMITS[key]);
}

function approvalMomentDefaults(spec: ModalSceneSpec): ProductMomentDraft {
  const actionTrail = spec.content.actionTrails?.[0];
  const signal = [
    spec.content.title,
    spec.content.modal.title,
    spec.content.modal.description,
    actionTrail?.steps.map((step) => step.label).join(" "),
    actionTrail?.gate?.title,
  ].filter(Boolean).join(" ");
  const isBooking = /booking|flight|rebook|reservation|itinerary|항공|예약/i.test(signal);
  const isBilling = /billing|refund|payment|charge|dispute|환불|결제/i.test(signal);
  const activityRows = isBooking
    ? [
        { tag: "Steward triggered", text: "Flight cancellation workflow initiated" },
        { tag: "API call", text: "Booking system — reservation pulled, policy check..." },
        { tag: "Voice call", text: "United Airlines rebooking desk — call duration 3:42" },
        { tag: "Email sent", text: "Marriott Denver — extension confirmed for Jun 5" },
      ]
    : [
        { tag: "Steward triggered", text: "Customer resolution workflow initiated" },
        { tag: "Policy check", text: actionTrail?.steps[0]?.label ?? "Customer context and policy evidence reviewed" },
        { tag: "AI prepared", text: actionTrail?.steps[1]?.label ?? "Next action prepared for review" },
        { tag: "Agent review", text: "Final decision queued for a teammate" },
      ];

  return {
    title: spec.content.modal.title,
    detailType: isBooking ? "Flight cancellation — multi-step" : isBilling ? "Billing dispute — review" : "Customer request — multi-step",
    detailName: isBooking || isBilling ? "Refund Approval Request" : "Resolution Review Request",
    detailStatus: "RESOLUTION",
    detailTime: isBooking ? "12 minutes" : "8 minutes",
    activity1Tag: activityRows[0]?.tag ?? "",
    activity1Text: activityRows[0]?.text ?? "",
    activity2Tag: activityRows[1]?.tag ?? "",
    activity2Text: activityRows[1]?.text ?? "",
    activity3Tag: activityRows[2]?.tag ?? "",
    activity3Text: activityRows[2]?.text ?? "",
  };
}

/** Activity values never resurrect defaults for cleared ("") drafts — only a
 *  missing key falls back, so clearing both inputs removes the row. */
function detailsPanelActivityValue(draft: ProductMomentDraft, key: string, defaults: ProductMomentDraft): string {
  const raw = draft[key] === undefined ? (defaults[key] ?? "") : draft[key];
  const cleaned = raw.replace(/\s+/g, " ").trim();
  const max = detailsPanelLimit(key) ?? 64;
  return cleaned.length <= max ? cleaned : `${cleaned.slice(0, max - 3).trimEnd()}...`;
}

function detailsPanelFields(draft: ProductMomentDraft, defaults: ProductMomentDraft): ModalSceneSpec["content"]["modal"]["fields"] {
  const activityFields = DETAILS_PANEL_ACTIVITY_ROWS.flatMap((index) => {
    const tag = detailsPanelActivityValue(draft, `activity${index}Tag`, defaults);
    const text = detailsPanelActivityValue(draft, `activity${index}Text`, defaults);
    // A fully cleared row is omitted from the spec, so the rendered image
    // drops it (zod also rejects empty field values).
    if (!tag && !text) return [];
    return [
      ...(tag ? [{ slotId: `moment-activity-${index}-tag`, label: `Activity ${index} tag`, value: tag }] : []),
      ...(text ? [{ slotId: `moment-activity-${index}-text`, label: `Activity ${index} text`, value: text }] : []),
    ];
  });

  return [
    {
      slotId: "moment-show-information",
      label: "Show information",
      value: detailsPanelShowInformation(draft) ? "true" : "false",
    },
    // When every activity row is cleared, this sentinel keeps the renderer
    // from falling back to the default trail (which is reserved for older
    // specs that never carried activity slots).
    ...(activityFields.length === 0
      ? [{ slotId: "moment-show-activity", label: "Show activity", value: "false" }]
      : []),
    { slotId: "moment-detail-type", label: "Detail type", value: detailsPanelDraftText(draft, "detailType", defaults.detailType ?? "") },
    { slotId: "moment-detail-name", label: "Detail name", value: detailsPanelDraftText(draft, "detailName", defaults.detailName ?? "") },
    { slotId: "moment-detail-status", label: "Detail status", value: detailsPanelDraftText(draft, "detailStatus", defaults.detailStatus ?? "") },
    { slotId: "moment-detail-time", label: "Detail time", value: detailsPanelDraftText(draft, "detailTime", defaults.detailTime ?? "") },
    ...activityFields,
  ];
}

function textCellValue(row: TableSceneSpec["content"]["rows"][number] | undefined): string {
  const cell = row?.cells[0];
  if (!cell) return "";
  if (cell.kind === "person") return cell.name;
  if (cell.kind === "number") return cell.value;
  return cell.value;
}

function buildProductMomentDraft(spec: SceneSpec | null): ProductMomentDraft {
  if (spec?.archetype === "modal" && isResponseMomentSpec(spec)) {
    const sources = spec.content.modal.fields
      .filter((field) => field.label.toLowerCase() === "source")
      .map((field) => splitSourceValue(field.value));
    const primaryAction = spec.content.modal.actions.find((action) => action.tone === "primary") ?? spec.content.modal.actions.at(-1);
    const secondaryAction = spec.content.modal.actions.find((action) => action.tone === "secondary") ?? spec.content.modal.actions[0];
    return {
      title: spec.content.modal.title,
      showReviewer: modalSlotValue(spec, "moment-show-reviewer") === "false" ? "false" : "true",
      showSources: modalSlotValue(spec, "moment-show-sources") === "false" ? "false" : "true",
      showButtons: modalSlotValue(spec, "moment-show-buttons") === "false" ? "false" : "true",
      reviewer: modalFieldValue(spec, "Reviewer"),
      response: modalFieldValue(spec, "Response"),
      source1: sources[0]?.label ?? "",
      source1Match: sources[0]?.match ?? "",
      source1Icon: responseSourceIconValue(modalSlotValue(spec, "moment-source-1-icon")),
      source2: sources[1]?.label ?? "",
      source2Match: sources[1]?.match ?? "",
      source2Icon: responseSourceIconValue(modalSlotValue(spec, "moment-source-2-icon")),
      secondaryAction: secondaryAction?.label ?? "",
      primaryAction: primaryAction?.label ?? "",
    };
  }

  if (isSearchMomentSpec(spec)) {
    return {
      title: spec.content.title,
      search: spec.content.toolbar.searchPlaceholder,
      filter1: spec.content.toolbar.filters[0] ?? "",
      filter2: spec.content.toolbar.filters[1] ?? "",
      filter3: spec.content.toolbar.filters[2] ?? "",
      result1: textCellValue(spec.content.rows[0]),
      result2: textCellValue(spec.content.rows[1]),
      result3: textCellValue(spec.content.rows[2]),
    };
  }

  if (spec?.archetype === "modal" && isApprovalMomentSpec(spec)) {
    const defaults = approvalMomentDefaults(spec);
    return {
      title: spec.content.modal.title,
      showInformation: modalSlotValue(spec, "moment-show-information") === "false" ? "false" : "true",
      detailType: modalSlotValue(spec, "moment-detail-type") || defaults.detailType,
      detailName: modalSlotValue(spec, "moment-detail-name") || defaults.detailName,
      detailStatus: modalSlotValue(spec, "moment-detail-status") || defaults.detailStatus,
      detailTime: modalSlotValue(spec, "moment-detail-time") || defaults.detailTime,
      // Activity rows read raw slot values so a cleared row stays cleared
      // (and disappears from the rendered image) instead of resurrecting
      // the default copy.
      activity1Tag: modalSlotValue(spec, "moment-activity-1-tag"),
      activity1Text: modalSlotValue(spec, "moment-activity-1-text"),
      activity2Tag: modalSlotValue(spec, "moment-activity-2-tag"),
      activity2Text: modalSlotValue(spec, "moment-activity-2-text"),
      activity3Tag: modalSlotValue(spec, "moment-activity-3-tag"),
      activity3Text: modalSlotValue(spec, "moment-activity-3-text"),
    };
  }

  return {};
}

// ── Static option tables ──────────────────────────────────

const FORMAT_GROUPS: { group: string; items: { id: ProductVisualFormat; label: string; size: string }[] }[] = [
  {
    group: "Product Feature",
    items: [
      { id: "feature-desktop", label: "Desktop", size: "866×660" },
      { id: "feature-mobile", label: "Mobile", size: "343×var" },
    ],
  },
  {
    group: "Product Release",
    items: [
      { id: "release-thumbnail", label: "Thumbnail", size: "667×316" },
      { id: "release-insert", label: "Insert", size: "840×var" },
    ],
  },
  {
    group: "Blog",
    items: [{ id: "blog", label: "Default", size: "664×var" }],
  },
];

const FORMAT_FLAT = FORMAT_GROUPS.flatMap((g) => g.items);

const BG_OPTIONS: { id: ProductVisualBg; name: string }[] = [
  { id: "white", name: "White" },
  { id: "sky", name: "Sky" },
  { id: "stone", name: "Stone" },
  { id: "warmgray", name: "Warm gray" },
  { id: "dark", name: "Dark" },
];

export function ProductVisualSidebar({ content: fallbackContent }: { content: ProductVisualContent }) {
  const {
    productVisualContent: storeContent,
    setProductVisualContent,
    setProductVisualFormat,
    customBackgrounds,
    addCustomBackground,
  } = useEditorStore();
  const content = storeContent ?? fallbackContent;

  const fileInputRef = useRef<HTMLInputElement>(null);
  const referenceInputRef = useRef<HTMLInputElement>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [referenceImage, setReferenceImage] = useState<ReferenceImage | null>(null);
  const [referenceError, setReferenceError] = useState<string | null>(null);
  const [referenceUploading, setReferenceUploading] = useState(false);
  const [referenceDragging, setReferenceDragging] = useState(false);
  const [referenceBrief, setReferenceBrief] = useState("");
  const [referenceLayout, setReferenceLayout] = useState<ProductVisualReferenceLayout>("auto");
  const [cropOpen, setCropOpen] = useState(false);
  const [bgModalOpen, setBgModalOpen] = useState(false);
  const [panelWidth, setPanelWidth] = useState(DEFAULT_PANEL_W);
  const [conceptPrompt, setConceptPrompt] = useState("");
  const [conceptScene, setConceptScene] = useState<SceneSpec | null>(null);
  const [conceptGenerating, setConceptGenerating] = useState(false);
  const [conceptError, setConceptError] = useState<string | null>(null);
  const [selectedRecipeId, setSelectedRecipeId] = useState<ProductVisualRecipeId | null>(null);
  const [conceptBlockPickerOpen, setConceptBlockPickerOpen] = useState(true);
  const [conceptCaptureId, setConceptCaptureId] = useState(0);
  const [conceptCapturePreset, setConceptCapturePreset] = useState<FramingPreset>("floating-panel");
  const [lastConceptSpec, setLastConceptSpec] = useState<SceneSpec | null>(null);
  const [specJsonDraft, setSpecJsonDraft] = useState("");
  const [blockCopyDraft, setBlockCopyDraft] = useState<ProductMomentDraft>(() => buildProductMomentDraft(content.conceptScene ?? null));
  const [specPasteError, setSpecPasteError] = useState<string | null>(null);
  const [specNotice, setSpecNotice] = useState<string | null>(null);
  const [developerToolsOpen, setDeveloperToolsOpen] = useState(false);
  const [showConceptCoach, dismissConceptCoach] = useOnceFlag("coach-product-visual-concept-v2");
  const conceptCaptureRef = useRef<HTMLDivElement>(null);
  const momentCaptureRefreshRef = useRef(new Set<string>());
  const pendingBlockDraftRef = useRef<ProductMomentDraft | null>(null);
  const blockDraftApplyTimerRef = useRef<number | null>(null);

  useEffect(() => {
    if (!content?.screenshot || !isImageBgFormat(content.format) || content.screenshot.displayMode === "crop") return;
    setProductVisualContent({
      ...content,
      screenshot: { ...content.screenshot, displayMode: "crop" },
    });
  }, [content, setProductVisualContent]);

  useEffect(() => {
    if (!content || content.sourceMode !== "screenshot" || !isImageBgFormat(content.format)) return;
    setProductVisualFormat("release-thumbnail");
  }, [content, setProductVisualFormat]);

  useEffect(() => {
    return () => {
      if (referenceImage) URL.revokeObjectURL(referenceImage.url);
    };
  }, [referenceImage]);

  useEffect(() => {
    return () => {
      if (blockDraftApplyTimerRef.current) window.clearTimeout(blockDraftApplyTimerRef.current);
    };
  }, []);

  useEffect(() => {
    if (!conceptGenerating || !conceptScene) return;
    const scene = conceptScene;
    let cancelled = false;

    async function captureConceptScene() {
      try {
        console.info("[concept-ui] capture start", {
          preset: conceptCapturePreset,
          archetype: scene.archetype,
        });
        if ("fonts" in document) {
          await Promise.race([
            document.fonts.ready,
            new Promise<void>((resolve) => window.setTimeout(resolve, 1000)),
          ]);
        }
        await new Promise<void>((resolve) => window.setTimeout(resolve, 50));
        const el = conceptCaptureRef.current;
        if (!el || cancelled) return;
        console.info("[concept-ui] export start", { preset: conceptCapturePreset });
        const exported = await exportConceptSceneElement(el, conceptCapturePreset);
        console.info("[concept-ui] export complete", {
          preset: conceptCapturePreset,
          naturalWidth: exported.naturalWidth,
          naturalHeight: exported.naturalHeight,
        });
        if (cancelled) return;
        const latest = useEditorStore.getState().productVisualContent;
        if (!latest) return;
        const latestSourceMode =
          latest.sourceMode === "reference" && !PRODUCT_VISUAL_REFERENCE_REBUILD_ARCHIVED
            ? "reference"
            : "concept";
        setProductVisualContent({
          ...latest,
          sourceMode: latestSourceMode,
          conceptScene: scene,
          screenshot: conceptSceneToProductScreenshot(exported),
        });
        if (conceptCapturePreset === "hero-crop") setCropOpen(true);
        setConceptScene(null);
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        setConceptError(msg || "Could not generate Concept UI.");
      } finally {
        if (!cancelled) setConceptGenerating(false);
      }
    }

    captureConceptScene();
    return () => {
      cancelled = true;
    };
  }, [conceptCaptureId, conceptCapturePreset, conceptGenerating, conceptScene, setProductVisualContent]);

  useEffect(() => {
    if (conceptGenerating || conceptScene) return;
    const storedSpec = content.conceptScene ?? null;
    const screenshot = content.screenshot;
    const storedSourceMode = content.sourceMode ?? (storedSpec ? "concept" : "screenshot");
    if (storedSpec?.archetype !== "modal") return;
    const refreshableMoment = isApprovalMomentSpec(storedSpec) || isResponseMomentSpec(storedSpec);
    if (storedSourceMode !== "concept" || !refreshableMoment || !screenshot?.url) return;
    const legacyCapture =
      screenshot.naturalWidth === LEGACY_APPROVAL_CAPTURE.width &&
      screenshot.naturalHeight === LEGACY_APPROVAL_CAPTURE.height;
    const currentApprovalCapture =
      isApprovalMomentSpec(storedSpec) &&
      screenshot.naturalWidth === 1600 &&
      screenshot.naturalHeight === 1000;
    const staleDetailsPanelCapture =
      isApprovalMomentSpec(storedSpec) &&
      screenshot.naturalWidth === 980 &&
      screenshot.naturalHeight !== 720;
    const staleDetailsPanelWidth =
      isApprovalMomentSpec(storedSpec) &&
      screenshot.naturalWidth === 980 &&
      screenshot.naturalHeight === 720;
    const staleDetailsPanelSpacing =
      isApprovalMomentSpec(storedSpec) &&
      screenshot.naturalWidth === 980 &&
      screenshot.naturalHeight === 720 &&
      (screenshot.url.includes("margin-top%3A38px") || screenshot.url.includes("margin-top:38px"));
    const staleDetailsPanelLabelWeight =
      isApprovalMomentSpec(storedSpec) &&
      screenshot.naturalWidth === 980 &&
      screenshot.naturalHeight === 720 &&
      (
        screenshot.url.includes("font-size%3A18px%3Bfont-weight%3A600") ||
        screenshot.url.includes("font-size:18px;font-weight:600")
      );
    const currentResponseCapture =
      isResponseMomentSpec(storedSpec) &&
      screenshot.naturalWidth === 1000 &&
      screenshot.naturalHeight === 920;
    if (!legacyCapture && !currentApprovalCapture && !staleDetailsPanelCapture && !staleDetailsPanelWidth && !staleDetailsPanelSpacing && !staleDetailsPanelLabelWeight && !currentResponseCapture) {
      return;
    }
    const refreshKey = `${storedSpec.content.modal.slotId}:${screenshot.naturalWidth ?? 0}x${screenshot.naturalHeight ?? 0}`;
    if (momentCaptureRefreshRef.current.has(refreshKey)) return;
    momentCaptureRefreshRef.current.add(refreshKey);
    const timer = window.setTimeout(() => {
      setConceptError(null);
      setConceptCapturePreset("floating-panel");
      setConceptScene(storedSpec);
      setConceptGenerating(true);
      setConceptCaptureId((id) => id + 1);
    }, 0);
    return () => window.clearTimeout(timer);
  }, [
    content.conceptScene,
    content.screenshot,
    content.sourceMode,
    conceptGenerating,
    conceptScene,
  ]);

  function update(patch: Partial<NonNullable<typeof content>>) {
    setProductVisualContent({ ...content, ...patch });
  }

  function switchSourceMode(sourceMode: ProductVisualSourceMode) {
    if (!content) return;
    if (sourceMode === "screenshot" && isImageBgFormat(content.format)) return;
    if (sourceMode === "reference" && PRODUCT_VISUAL_REFERENCE_REBUILD_ARCHIVED) return;
    if (sourceMode === "concept") {
      setConceptPrompt((prompt) => prompt || content.concept?.prompt || content.title || "AI support workspace");
      update({ sourceMode });
      return;
    }
    if (sourceMode === "reference") {
      const brief = content.reference?.brief || content.title || "Workspace settings with an editor, preview, and AI agent tester";
      setReferenceBrief((currentBrief) => currentBrief || brief);
      setReferenceLayout(content.reference?.layout ?? "auto");
      update({ sourceMode, reference: { brief, layout: content.reference?.layout ?? "auto" } });
      return;
    }
    update({ sourceMode });
  }

  function updateConceptPrompt(prompt: string) {
    dismissConceptCoach();
    setConceptPrompt(prompt);
    setSelectedRecipeId(null);
    setConceptBlockPickerOpen(true);
    setSpecNotice(null);
  }

  function handleAddConceptGuidance() {
    dismissConceptCoach();
    setConceptPrompt((current) => {
      const trimmed = (current || content.concept?.prompt || content.title || "").trim();
      if (!trimmed) return CONCEPT_GUIDANCE_TEMPLATE;
      if (/(^|\n)\s*(Feature:|Product surface:|Key proof:|Avoid:)/i.test(trimmed)) return current;
      return `${trimmed}\n\n${CONCEPT_GUIDANCE_APPEND_TEMPLATE}`;
    });
    setConceptBlockPickerOpen(true);
    setConceptError(null);
    setSpecNotice(null);
  }

  function revealConceptBlocks() {
    const prompt = effectiveConceptPrompt.trim();
    if (!prompt || conceptGenerating) return;
    dismissConceptCoach();
    setConceptBlockPickerOpen(true);
    setConceptError(null);
    setSpecNotice(null);
    logBriefEvent({ template: "product-visual", event: "brief_submitted", text: prompt });
  }

  function startConceptSpec(spec: SceneSpec, notice?: string) {
    setConceptCapturePreset("floating-panel");
    setLastConceptSpec(spec);
    if (blockDraftApplyTimerRef.current) window.clearTimeout(blockDraftApplyTimerRef.current);
    pendingBlockDraftRef.current = null;
    setBlockCopyDraft(buildProductMomentDraft(spec));
    setSpecJsonDraft(prettySpec(spec));
    setSpecNotice(notice ?? null);
    setConceptError(null);
    setConceptScene(spec);
    setConceptGenerating(true);
    setConceptCaptureId((id) => id + 1);
  }

  async function generateConceptFromRecipe(recipe: ProductVisualRecipe) {
    const prompt = effectiveConceptPrompt.trim();
    if (!prompt || conceptGenerating) return;
    dismissConceptCoach();
    setSelectedRecipeId(recipe.id);
    setConceptGenerating(true);
    setConceptError(null);
    setSpecNotice(null);
    try {
      const result = await ruleBasedSpecProvider.generate({
        description: prompt,
        uiTextLanguage: CONCEPT_UI_TEXT_LANGUAGE,
        forcedArchetype: recipe.archetype,
        recipeId: recipe.id,
      });
      startConceptSpec(result.spec, `Rendered ${recipe.label.toLowerCase()} recipe.`);
      logBriefEvent({
        template: "product-visual",
        event: "recipe_selected",
        text: prompt,
        meta: { recipeId: recipe.id },
      });
    } catch (err) {
      setConceptGenerating(false);
      setConceptError(err instanceof Error ? err.message : "Could not generate Concept UI.");
    }
  }

  async function copySpecJson() {
    const spec = activeConceptSpec;
    if (!spec) return;
    const text = prettySpec(spec);
    try {
      await navigator.clipboard.writeText(text);
      setSpecNotice("Scene spec copied.");
    } catch {
      setSpecJsonDraft(text);
      setSpecNotice("Copy failed. Scene spec is shown below.");
    }
  }

  function pasteSpecJson() {
    try {
      const parsed = parseSceneSpec(JSON.parse(specJsonDraft));
      setSpecPasteError(null);
      startConceptSpec(parsed, "Pasted spec validated.");
    } catch (err) {
      setSpecPasteError(formatSpecError(err));
    }
  }

  async function handleFile(file: File | undefined) {
    if (!file || uploading) return;
    setUploadError(null);
    setUploading(true);
    try {
      const res = await uploadProductVisualScreenshot(file);
      if (!res.ok) {
        setUploadError(res.error);
        return;
      }
      const latest = useEditorStore.getState().productVisualContent;
      if (!latest) return;
      if (isImageBgFormat(latest.format)) {
        setUploadError("Screenshot is not available for Product Feature formats. Use Concept UI instead.");
        return;
      }
      // New/replaced image → fresh screenshot (crop reset; natural dims captured).
      setProductVisualContent({
        ...latest,
        sourceMode: "screenshot",
        screenshot: {
          url: res.url,
          displayMode: "crop",
          naturalWidth: res.naturalWidth,
          naturalHeight: res.naturalHeight,
        },
      });
    } finally {
      setUploading(false);
    }
  }

  async function handleReferenceFile(file: File | undefined) {
    if (!file || referenceUploading) return;
    setReferenceError(null);
    if (!UPLOAD_ACCEPT.split(",").includes(file.type)) {
      setReferenceError("Unsupported format — use PNG, JPG, or WebP.");
      return;
    }
    if (file.size > MAX_UPLOAD_MB * 1024 * 1024) {
      setReferenceError(`Image is too large — keep it under ${MAX_UPLOAD_MB} MB.`);
      return;
    }

    setReferenceUploading(true);
    const objectUrl = URL.createObjectURL(file);
    try {
      const img = new Image();
      img.src = objectUrl;
      await img.decode();
      if (!img.naturalWidth || !img.naturalHeight) {
        URL.revokeObjectURL(objectUrl);
        setReferenceError("Could not read the image — please try again.");
        return;
      }
      setReferenceImage({
        url: objectUrl,
        name: file.name,
        naturalWidth: img.naturalWidth,
        naturalHeight: img.naturalHeight,
      });
      setReferenceBrief((brief) => brief || content.reference?.brief || "Workspace settings with an editor, preview, and AI agent tester");
    } catch {
      URL.revokeObjectURL(objectUrl);
      setReferenceError("Could not read the image — please try again.");
    } finally {
      setReferenceUploading(false);
    }
  }

  function clearReferenceImage() {
    setReferenceImage(null);
  }

  async function rebuildFromReference() {
    const brief = (referenceBrief || content.reference?.brief || content.title || "").trim()
      || "Workspace settings with an editor, preview, and AI agent tester";
    const layout = referenceLayout;
    const forcedArchetype = REFERENCE_LAYOUT_OPTIONS.find((option) => option.id === layout)?.archetype;
    setConceptError(null);
    setSpecNotice(null);
    setReferenceError(null);
    try {
      const result = await ruleBasedSpecProvider.generate({
        description: brief,
        uiTextLanguage: CONCEPT_UI_TEXT_LANGUAGE,
        forcedArchetype,
      });
      const latest = useEditorStore.getState().productVisualContent;
      if (!latest) return;
      setProductVisualContent({
        ...latest,
        sourceMode: "reference",
        reference: { brief, layout },
        conceptScene: result.spec,
      });
      startConceptSpec(result.spec, result.notice ?? "Rebuilt with design system components.");
    } catch (err) {
      setReferenceError(err instanceof Error ? err.message : "Could not rebuild from reference.");
    }
  }

  // Product Feature formats use a full-bleed background image (same library as
  // the Chat editor); other formats use a solid/fixed color. No title/subtitle
  // or layout chrome on any format — just background + screenshot.
  const imageBg = isImageBgFormat(content.format);
  const cropOnly = imageBg;
  const rawSourceMode = content.sourceMode ?? (imageBg ? "concept" : "screenshot");
  const activeRawSourceMode =
    rawSourceMode === "reference" && PRODUCT_VISUAL_REFERENCE_REBUILD_ARCHIVED ? "concept" : rawSourceMode;
  const sourceMode = imageBg && activeRawSourceMode === "screenshot" ? "concept" : activeRawSourceMode;
  const screenshotSourceDisabled = imageBg;
  const effectiveConceptPrompt = conceptPrompt || content.concept?.prompt || content.title || "";
  const effectiveReferenceBrief = referenceBrief || content.reference?.brief || content.title || "";
  const conceptRecipes = recommendProductVisualRecipes(effectiveConceptPrompt);
  const activeConceptSpec = lastConceptSpec ?? content.conceptScene ?? null;
  const displayModes = cropOnly ? DISPLAY_MODES.filter((m) => m.id === "crop") : DISPLAY_MODES;
  // Solid-color swatches: hidden for image-bg formats and for formats whose
  // background is locked to a fixed hex (canvas ignores `bg` there).
  const showSolidBg = !imageBg && !FORMAT_FIXED_BG[content.format];
  const bgList = [...BACKGROUNDS, ...customBackgrounds];
  const selectedBgId = bgList.find((b) => b.url === content.bgImage)?.id ?? "";
  const current = FORMAT_FLAT.find((f) => f.id === content.format);
  const sceneSourceMode = sourceMode === "concept" || sourceMode === "reference";
  const editableMomentKind = activeConceptSpec?.archetype === "modal" && isResponseMomentSpec(activeConceptSpec)
    ? "response"
    : isSearchMomentSpec(activeConceptSpec)
      ? "search"
      : activeConceptSpec?.archetype === "modal" && isApprovalMomentSpec(activeConceptSpec)
        ? "approval"
        : null;

  function recaptureConceptSpec(spec: SceneSpec | null = activeConceptSpec, preset: FramingPreset = "floating-panel") {
    const nextSpec = spec ?? activeConceptSpec;
    if (!sceneSourceMode || !nextSpec) return;
    setConceptError(null);
    setConceptCapturePreset(preset);
    setConceptScene(nextSpec);
    setConceptGenerating(true);
    setConceptCaptureId((id) => id + 1);
  }

  function buildProductMomentSpecFromDraft(
    spec: SceneSpec,
    kind: "response" | "search" | "approval",
    draft: ProductMomentDraft,
  ) {
    const next = structuredClone(spec) as SceneSpec;

    if (kind === "response" && next.archetype === "modal" && isResponseMomentSpec(next)) {
      const title = responseCardDraftText(draft, "title", next.content.modal.title);
      const showReviewer = responseCardShowReviewer(draft);
      const showSources = responseCardShowSources(draft);
      const showButtons = responseCardShowButtons(draft);
      let hasShowReviewerField = false;
      let hasShowSourcesField = false;
      let hasShowButtonsField = false;
      let hasSource1IconField = false;
      let hasSource2IconField = false;
      next.content.title = title;
      next.content.modal.title = title;
      next.content.modal.fields = next.content.modal.fields.map((field) => {
        if (field.slotId === "moment-show-reviewer" || field.label === "Show reviewer") {
          hasShowReviewerField = true;
          return {
            ...field,
            slotId: "moment-show-reviewer",
            label: "Show reviewer",
            value: showReviewer ? "true" : "false",
          };
        }
        if (field.slotId === "moment-show-sources" || field.label === "Show sources") {
          hasShowSourcesField = true;
          return {
            ...field,
            slotId: "moment-show-sources",
            label: "Show sources",
            value: showSources ? "true" : "false",
          };
        }
        if (field.slotId === "moment-show-buttons" || field.label === "Show buttons") {
          hasShowButtonsField = true;
          return {
            ...field,
            slotId: "moment-show-buttons",
            label: "Show buttons",
            value: showButtons ? "true" : "false",
          };
        }
        if (field.label === "Reviewer") {
          return { ...field, value: responseCardDraftText(draft, "reviewer", field.value) };
        }
        if (field.label === "Response") {
          return { ...field, value: responseCardDraftText(draft, "response", field.value) };
        }
        if (field.slotId === "moment-source-1") {
          return {
            ...field,
            value: combineSourceValue(
              responseCardDraftText(draft, "source1", splitSourceValue(field.value).label),
              responseCardDraftText(draft, "source1Match", splitSourceValue(field.value).match),
            ),
          };
        }
        if (field.slotId === "moment-source-1-icon") {
          hasSource1IconField = true;
          return { ...field, value: responseSourceIconValue(draft.source1Icon) };
        }
        if (field.slotId === "moment-source-2") {
          return {
            ...field,
            value: combineSourceValue(
              responseCardDraftText(draft, "source2", splitSourceValue(field.value).label),
              responseCardDraftText(draft, "source2Match", splitSourceValue(field.value).match),
            ),
          };
        }
        if (field.slotId === "moment-source-2-icon") {
          hasSource2IconField = true;
          return { ...field, value: responseSourceIconValue(draft.source2Icon) };
        }
        return field;
      });
      if (!hasShowReviewerField) {
        next.content.modal.fields = [
          { slotId: "moment-show-reviewer", label: "Show reviewer", value: showReviewer ? "true" : "false" },
          ...next.content.modal.fields,
        ];
      }
      if (!hasShowSourcesField) {
        next.content.modal.fields = [
          { slotId: "moment-show-sources", label: "Show sources", value: showSources ? "true" : "false" },
          ...next.content.modal.fields,
        ];
      }
      if (!hasShowButtonsField) {
        next.content.modal.fields = [
          { slotId: "moment-show-buttons", label: "Show buttons", value: showButtons ? "true" : "false" },
          ...next.content.modal.fields,
        ];
      }
      if (!hasSource1IconField) {
        next.content.modal.fields.push({
          slotId: "moment-source-1-icon",
          label: "Source 1 icon",
          value: responseSourceIconValue(draft.source1Icon),
        });
      }
      if (!hasSource2IconField) {
        next.content.modal.fields.push({
          slotId: "moment-source-2-icon",
          label: "Source 2 icon",
          value: responseSourceIconValue(draft.source2Icon),
        });
      }
      next.content.modal.actions = next.content.modal.actions.map((action) => {
        if (action.tone === "primary") {
          return { ...action, label: responseCardDraftText(draft, "primaryAction", action.label) };
        }
        return { ...action, label: responseCardDraftText(draft, "secondaryAction", action.label) };
      });
    } else if (kind === "search" && isSearchMomentSpec(next)) {
      next.content.title = draftText(draft, "title", next.content.title, 56);
      next.content.toolbar.searchPlaceholder = draftText(draft, "search", next.content.toolbar.searchPlaceholder, 40);
      next.content.toolbar.filters = next.content.toolbar.filters.map((filter, index) =>
        draftText(draft, `filter${index + 1}`, filter, 24),
      );
      next.content.rows = next.content.rows.map((row, index) => {
        if (index > 2) return row;
        const firstCell = row.cells[0];
        if (!firstCell || firstCell.kind !== "text") return row;
        return {
          ...row,
          cells: [
            { ...firstCell, value: draftText(draft, `result${index + 1}`, firstCell.value, 56) },
            ...row.cells.slice(1),
          ],
        };
      });
    } else if (kind === "approval" && next.archetype === "modal" && isApprovalMomentSpec(next)) {
      const defaults = approvalMomentDefaults(next);
      const title = detailsPanelDraftText(draft, "title", next.content.modal.title);
      next.content.title = title;
      next.content.modal.title = title;
      next.content.modal.fields = detailsPanelFields(draft, defaults);
    }

    return parseSceneSpec(next);
  }

  function applyProductMomentDraftFrom(draft: ProductMomentDraft, notice = "Preview updated.") {
    if (!activeConceptSpec || !editableMomentKind) return;
    try {
      const parsed = buildProductMomentSpecFromDraft(activeConceptSpec, editableMomentKind, draft);
      setLastConceptSpec(parsed);
      setBlockCopyDraft(buildProductMomentDraft(parsed));
      setSpecJsonDraft(prettySpec(parsed));
      setSpecPasteError(null);
      setConceptError(null);
      const latest = useEditorStore.getState().productVisualContent;
      if (latest) {
        setProductVisualContent({
          ...latest,
          sourceMode: sourceMode === "reference" && !PRODUCT_VISUAL_REFERENCE_REBUILD_ARCHIVED ? "reference" : "concept",
          conceptScene: parsed,
        });
      }
      recaptureConceptSpec(parsed);
      setSpecNotice(notice);
    } catch (err) {
      setConceptError(formatSpecError(err));
    }
  }

  function updateBlockDraft(key: string, value: string, options?: { immediate?: boolean }) {
    const nextDraft = { ...blockCopyDraft, [key]: value };
    setBlockCopyDraft(nextDraft);
    setConceptError(null);
    pendingBlockDraftRef.current = nextDraft;
    if (options?.immediate) {
      if (blockDraftApplyTimerRef.current) window.clearTimeout(blockDraftApplyTimerRef.current);
      pendingBlockDraftRef.current = null;
      applyProductMomentDraftFrom(nextDraft, "Preview updated.");
      return;
    }
    setSpecNotice("Updating preview...");
    if (blockDraftApplyTimerRef.current) window.clearTimeout(blockDraftApplyTimerRef.current);
    blockDraftApplyTimerRef.current = window.setTimeout(() => {
      const draft = pendingBlockDraftRef.current;
      pendingBlockDraftRef.current = null;
      blockDraftApplyTimerRef.current = null;
      if (draft) applyProductMomentDraftFrom(draft, "Preview updated.");
    }, 450);
  }

  function handleResizeStart(e: React.MouseEvent) {
    e.preventDefault();
    const startX = e.clientX;
    const startW = panelWidth;
    function onMove(ev: MouseEvent) {
      const delta = startX - ev.clientX;
      setPanelWidth(Math.min(MAX_PANEL_W, Math.max(MIN_PANEL_W, startW + delta)));
    }
    function onUp() {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    }
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  }

  return (
    <div
      style={{ width: panelWidth }}
      className="relative shrink-0 h-full flex flex-col bg-studio-sidebar border-l border-studio-border"
    >
      <div
        onMouseDown={handleResizeStart}
        className="absolute left-0 top-0 h-full w-px cursor-ew-resize z-10 bg-transparent hover:bg-studio-accent transition-colors"
        title="Drag to resize panel"
      />

      <div className="flex-1 overflow-y-auto">
        {/* FORMAT — grouped dropdown */}
        <Section title="Format" info={<FormatInfoTooltip />}>
          <Menu.Root>
            <Menu.Trigger className="flex w-full items-center justify-between gap-2 rounded-md border border-studio-border bg-studio-sidebar px-2.5 py-2 text-xs text-studio-text hover:bg-studio-hover transition-colors outline-none">
              <span className="flex items-center gap-1.5">
                <span className="font-medium">{current?.label ?? "Select"}</span>
                <span className="text-studio-muted tabular-nums">{current?.size}</span>
              </span>
              <ChevronDown size={14} className="text-studio-muted" />
            </Menu.Trigger>
            <Menu.Portal>
              <Menu.Positioner side="bottom" align="start" sideOffset={6} className="z-50">
                <Menu.Popup className="z-50 min-w-[260px] rounded-xl border border-studio-border bg-studio-sidebar shadow-xl py-2 outline-none origin-top data-[ending-style]:animate-out data-[ending-style]:fade-out-0 data-[ending-style]:zoom-out-95 data-[starting-style]:animate-in data-[starting-style]:fade-in-0 data-[starting-style]:zoom-in-95 duration-100">
                  {FORMAT_GROUPS.map((g, gi) => (
                    <div key={g.group}>
                      {gi > 0 && <Menu.Separator className="h-px bg-studio-border mx-1 my-1.5" />}
                      <div className="px-3 pt-1 pb-1.5 text-[10px] font-bold uppercase tracking-wider text-studio-muted select-none">
                        {g.group}
                      </div>
                      {g.items.map((it) => {
                        const active = content.format === it.id;
                        const disabled = sourceMode === "screenshot" && isImageBgFormat(it.id);
                        const disabledReason = disabled ? PRODUCT_FEATURE_SCREENSHOT_RESTRICTION : undefined;
                        return (
                          <Menu.Item
                            key={it.id}
                            onClick={(event) => {
                              if (disabled) {
                                event.preventDefault();
                                return;
                              }
                              setProductVisualFormat(it.id);
                            }}
                            aria-disabled={disabled}
                            title={disabledReason}
                            className={[
                              "group/format-item relative flex items-center gap-2 px-3 py-2 text-sm outline-none rounded-lg mx-1",
                              disabled
                                ? "cursor-not-allowed text-studio-muted/35"
                                : "cursor-default text-studio-text hover:bg-studio-hover",
                            ].join(" ")}
                          >
                            <span className="w-4 shrink-0">
                              {active && <Check size={14} className="text-studio-accent" />}
                            </span>
                            <span className="flex-1">{it.label}</span>
                            <span className="text-[11px] text-studio-muted tabular-nums">{it.size}</span>
                            {disabledReason ? (
                              <span className="pointer-events-none absolute left-full top-1/2 z-50 ml-2 w-52 -translate-y-1/2 rounded-md border border-studio-border bg-studio-bg px-2.5 py-2 text-[11px] font-normal leading-snug text-studio-text opacity-0 shadow-xl transition-opacity duration-150 group-hover/format-item:opacity-100 group-focus/format-item:opacity-100">
                                {disabledReason}
                              </span>
                            ) : null}
                          </Menu.Item>
                        );
                      })}
                    </div>
                  ))}
                </Menu.Popup>
              </Menu.Positioner>
            </Menu.Portal>
          </Menu.Root>
        </Section>

        {/* BACKGROUND — image picker for Product Feature (same library as Chat),
            solid swatches for other formats, hidden when the bg is fixed. */}
        {imageBg && (
          <Section
            title="Background"
            action={
              <button
                onClick={() => setBgModalOpen(true)}
                title="Background Library"
                aria-label="Background Library"
                className="flex items-center justify-center w-6 h-6 rounded-md text-studio-muted hover:text-studio-text hover:bg-white/[0.06] transition-colors"
              >
                <Plus size={15} />
              </button>
            }
          >
            <div className="grid grid-cols-3 gap-2">
              {bgList.slice(0, 6).map((bg) => (
                <button
                  key={bg.id}
                  onClick={() => update({ bgImage: bg.url })}
                  title={bg.label}
                  className={[
                    "relative rounded-lg overflow-hidden aspect-video border-2 transition-colors",
                    content.bgImage === bg.url
                      ? "border-studio-accent"
                      : "border-transparent hover:border-studio-muted",
                  ].join(" ")}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={bg.url} alt={bg.label} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          </Section>
        )}

        {showSolidBg && (
          <Section title="Background">
            <div className="flex gap-1.5 flex-wrap">
              {BG_OPTIONS.map((bg) => (
                <button
                  key={bg.id}
                  onClick={() => update({ bg: bg.id })}
                  title={bg.name}
                  className={[
                    "w-8 h-8 rounded-md border-2 transition-transform hover:scale-110",
                    content.bg === bg.id ? "border-studio-accent" : "border-studio-border",
                  ].join(" ")}
                  style={{
                    background: PRODUCT_VISUAL_BG_HEX[bg.id],
                    boxShadow: content.bg === bg.id ? "0 0 0 1px var(--studio-sidebar)" : undefined,
                  }}
                />
              ))}
            </div>
          </Section>
        )}

        <Section title="Source">
          <div className="flex items-center gap-1 p-1 rounded-lg bg-studio-input">
            {SOURCE_OPTIONS.map((item) => {
              const disabled = item.id === "screenshot" && screenshotSourceDisabled;
              const active = sourceMode === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  disabled={disabled}
                  onClick={() => switchSourceMode(item.id)}
                  aria-pressed={active}
                  title={disabled ? "Screenshot is not available for Product Feature formats." : undefined}
                  className={[
                    "flex-1 px-2 py-1.5 rounded-md text-[11px] font-medium transition-colors",
                    disabled
                      ? "cursor-not-allowed text-studio-muted/35"
                      : active
                      ? "bg-studio-hover text-studio-text"
                      : "text-studio-muted hover:text-studio-text",
                  ].join(" ")}
                >
                  {item.label}
                </button>
              );
            })}
          </div>
          {sourceMode === "screenshot" ? (
            <div className="mt-3 rounded-lg border border-studio-border bg-studio-input px-3 py-2">
              <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-studio-muted">Guide</p>
              <p className="mt-1 text-[11px] leading-snug text-studio-muted">
                When using screenshots, use real product data rather than placeholder or dummy text.
              </p>
            </div>
          ) : null}
        </Section>

        {/* SCREENSHOT */}
        {sourceMode === "screenshot" && (
        <Section title="Screenshot">
          <input
            ref={fileInputRef}
            type="file"
            accept={UPLOAD_ACCEPT}
            className="hidden"
            onChange={(e) => {
              handleFile(e.target.files?.[0]);
              if (fileInputRef.current) fileInputRef.current.value = "";
            }}
          />
          {content.screenshot?.url ? (
            <div className="flex flex-col gap-3">
              {/* Preview — hover reveals a Replace overlay */}
              <div className="group relative rounded-lg overflow-hidden border border-studio-border bg-studio-input">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={content.screenshot.url} alt="Uploaded screenshot" className="w-full h-28 object-contain" />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  aria-label="Replace screenshot"
                  disabled={uploading}
                  className="absolute inset-0 flex items-center justify-center bg-black/55 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/15 border border-white/25 text-xs font-medium text-white">
                    <RefreshCw size={13} /> {uploading ? "Uploading…" : "Replace"}
                  </span>
                </button>
              </div>

              {/* Actions — Select key area (button) + delete icon */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCropOpen(true)}
                  className="text-xs font-semibold px-3 py-2 rounded-lg bg-studio-accent text-studio-accent-fg hover:opacity-90 transition-opacity"
                >
                  {content.screenshot.crop ? "Edit crop" : "Select key area"}
                </button>
                <div className="ml-auto flex items-center gap-1">
                  <span className="group/action relative inline-flex">
                    <button
                      type="button"
                      onClick={() => update({ screenshot: undefined })}
                      aria-label="Delete screenshot"
                      className="flex items-center justify-center w-7 h-7 rounded-md text-studio-muted hover:text-red-400 hover:bg-white/[0.06] transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                    <IconTooltip label="Delete" />
                  </span>
                </div>
              </div>

            </div>
          ) : (
            <button
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragging(false);
                handleFile(e.dataTransfer.files?.[0]);
              }}
              disabled={uploading}
              className={[
                "flex flex-col items-center justify-center gap-2 w-full py-7 rounded-lg border-[1.6px] border-dashed transition-colors",
                uploading ? "opacity-60 cursor-wait" : "",
                dragging
                  ? "border-studio-accent bg-studio-accent/[0.06] text-studio-text"
                  : "border-studio-border text-studio-muted hover:text-studio-text hover:border-studio-muted",
              ].join(" ")}
            >
              <Upload size={20} />
              <span className="text-xs font-medium">{uploading ? "Uploading…" : "Click or drag to upload"}</span>
            </button>
          )}
          {uploadError ? (
            <p className="mt-1.5 text-[11px] text-red-400 leading-snug">{uploadError}</p>
          ) : (
            <p className="mt-1.5 text-[11px] text-studio-muted leading-snug">
              PNG · JPG · WebP · max {MAX_UPLOAD_MB} MB
            </p>
          )}
          {content.format === "release-thumbnail" && (
            <div className="mt-1.5 flex items-start gap-1.5 text-[11px] text-studio-accent leading-snug">
              <Lightbulb size={12} className="mt-[1px] shrink-0" />
              <p>Tip: For thumbnails, crop to the key UI instead of showing the full dashboard.</p>
            </div>
          )}
        </Section>
        )}

        {sourceMode === "reference" && (
          <Section title="Rebuild from reference">
            <input
              ref={referenceInputRef}
              type="file"
              accept={UPLOAD_ACCEPT}
              className="hidden"
              onChange={(e) => {
                handleReferenceFile(e.target.files?.[0]);
                if (referenceInputRef.current) referenceInputRef.current.value = "";
              }}
            />

            {referenceImage ? (
              <div className="flex flex-col gap-3">
                <div className="group relative overflow-hidden rounded-lg border border-studio-border bg-studio-input">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={referenceImage.url} alt="Reference screenshot" className="h-28 w-full object-contain" />
                  <button
                    onClick={() => referenceInputRef.current?.click()}
                    aria-label="Replace reference"
                    disabled={referenceUploading}
                    className="absolute inset-0 flex items-center justify-center bg-black/55 opacity-0 transition-opacity group-hover:opacity-100"
                  >
                    <span className="flex items-center gap-1.5 rounded-lg border border-white/25 bg-white/15 px-3 py-1.5 text-xs font-medium text-white">
                      <RefreshCw size={13} /> {referenceUploading ? "Uploading..." : "Replace"}
                    </span>
                  </button>
                </div>
                <div className="flex items-center gap-2 text-[11px] text-studio-muted">
                  <span className="min-w-0 flex-1 truncate">{referenceImage.name}</span>
                  <span className="tabular-nums">{referenceImage.naturalWidth}×{referenceImage.naturalHeight}</span>
                  <button
                    type="button"
                    onClick={clearReferenceImage}
                    aria-label="Remove reference"
                    className="flex size-7 items-center justify-center rounded-md text-studio-muted transition-colors hover:bg-white/[0.06] hover:text-red-400"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => referenceInputRef.current?.click()}
                onDragOver={(e) => { e.preventDefault(); setReferenceDragging(true); }}
                onDragLeave={() => setReferenceDragging(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setReferenceDragging(false);
                  handleReferenceFile(e.dataTransfer.files?.[0]);
                }}
                disabled={referenceUploading}
                className={[
                  "flex w-full flex-col items-center justify-center gap-2 rounded-lg border-[1.6px] border-dashed py-7 transition-colors",
                  referenceUploading ? "cursor-wait opacity-60" : "",
                  referenceDragging
                    ? "border-studio-accent bg-studio-accent/[0.06] text-studio-text"
                    : "border-studio-border text-studio-muted hover:border-studio-muted hover:text-studio-text",
                ].join(" ")}
              >
                <Upload size={20} />
                <span className="text-xs font-medium">{referenceUploading ? "Uploading..." : "Upload reference image"}</span>
              </button>
            )}

            <p className="mt-2 text-[11px] leading-snug text-studio-muted">
              Reference images stay in this session only. Saved files keep the rebuilt scene, not the original image.
            </p>

            <div className="mt-4 space-y-2">
              <StepLabel
                number={1}
                title="Describe the screen"
                description="Use the reference as a guide, then rebuild with Delight.ai components."
              />
              <textarea
                value={effectiveReferenceBrief}
                onChange={(e) => {
                  const brief = e.currentTarget.value;
                  setReferenceBrief(brief);
                  update({ sourceMode: "reference", reference: { brief, layout: referenceLayout } });
                }}
                placeholder="e.g. Workspace settings with editor, preview, and AI agent tester"
                rows={4}
                className="w-full resize-none rounded-lg border border-studio-border bg-studio-input px-3 py-2 text-xs leading-relaxed text-studio-text outline-none placeholder:text-studio-muted/70 focus:border-studio-muted"
              />
            </div>

            <div className="mt-4 space-y-2">
              <StepLabel
                number={2}
                title="Structure"
                description="Auto works for most references; switch only when the result is wrong."
              />
              <div className="grid grid-cols-2 gap-1.5">
                {REFERENCE_LAYOUT_OPTIONS.map((option) => {
                  const active = referenceLayout === option.id;
                  return (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() => {
                        setReferenceLayout(option.id);
                        update({
                          sourceMode: "reference",
                          reference: { brief: effectiveReferenceBrief, layout: option.id },
                        });
                      }}
                      className={[
                        "rounded-md border px-2 py-1.5 text-[11px] font-semibold transition-colors",
                        active
                          ? "border-studio-accent bg-studio-accent/[0.08] text-studio-text"
                          : "border-studio-border text-studio-muted hover:bg-white/[0.04] hover:text-studio-text",
                      ].join(" ")}
                    >
                      {option.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <button
              type="button"
              onClick={rebuildFromReference}
              disabled={conceptGenerating || (!referenceImage && !effectiveReferenceBrief.trim())}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg bg-studio-accent px-3 py-2.5 text-xs font-semibold text-studio-accent-fg transition-opacity hover:opacity-90 disabled:opacity-40"
            >
              {conceptGenerating ? <RefreshCw size={14} className="animate-spin" /> : <Sparkles size={14} />}
              {conceptGenerating ? "Rendering..." : "Rebuild with design system"}
            </button>

            {referenceError ? (
              <p className="mt-2 text-[11px] leading-snug text-red-400">{referenceError}</p>
            ) : conceptError ? (
              <p className="mt-2 text-[11px] leading-snug text-red-400">{conceptError}</p>
            ) : specNotice ? (
              <p className="mt-2 text-[11px] leading-snug text-studio-muted">{specNotice}</p>
            ) : content.sourceMode === "reference" && content.conceptScene ? (
              <p className="mt-2 text-[11px] leading-snug text-studio-muted">Rebuilt scene is ready in the preview.</p>
            ) : null}
          </Section>
        )}

        {sourceMode === "concept" && (<>
          <Section title="Create from brief">
            <div className="relative space-y-3">
              {showConceptCoach && (
                <CoachmarkBubble
                  text={CONCEPT_UI_COACHMARK_COPY}
                  onDismiss={dismissConceptCoach}
                />
              )}
              <StepLabel
                number={1}
                title="Describe the product surface"
                description="Keep it to the feature, user, proof point, and anything to avoid."
              />
              <div className="rounded-lg border border-studio-border bg-studio-input p-3 transition-colors focus-within:border-studio-muted">
                <textarea
                  value={effectiveConceptPrompt}
                  onFocus={dismissConceptCoach}
                  onChange={(e) => updateConceptPrompt(e.currentTarget.value)}
                  placeholder={CONCEPT_UI_PLACEHOLDER}
                  rows={5}
                  className="w-full min-h-[104px] resize-none border-0 bg-transparent p-0 text-xs leading-relaxed text-studio-text outline-none placeholder:text-studio-muted/70 disabled:cursor-not-allowed disabled:opacity-60"
                />
                <div className="mt-2 flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={handleAddConceptGuidance}
                    disabled={conceptGenerating}
                    className="text-[11px] font-medium text-studio-muted transition-colors hover:text-studio-text disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Add guidance
                  </button>
                  <AiMagicButton
                    label="Show Product Visual blocks"
                    loading={false}
                    disabled={conceptGenerating || !effectiveConceptPrompt.trim()}
                    onClick={revealConceptBlocks}
                  />
                </div>
              </div>
            </div>

            {conceptBlockPickerOpen ? (<div className="mt-4 space-y-3">
              <StepLabel
                number={2}
                title="Choose a block"
                description="Studio keeps Product Visuals to compact, editable UI moments."
              />
              {conceptRecipes.length > 0 ? (
                <div className="space-y-2 rounded-xl border border-studio-border bg-studio-sidebar p-2">
                  {conceptRecipes.map((recipe) => {
                    const active = selectedRecipeId === recipe.id;
                    const loading = active && conceptGenerating;
                    return (
                      <button
                        key={recipe.id}
                        type="button"
                        onClick={() => generateConceptFromRecipe(recipe)}
                        disabled={conceptGenerating || !effectiveConceptPrompt.trim()}
                        aria-pressed={active}
                        className={[
                          "flex w-full items-center gap-2 rounded-lg border p-1.5 text-left transition-colors focus:outline-none focus:ring-1 focus:ring-studio-accent disabled:cursor-not-allowed disabled:opacity-55",
                          active
                            ? "border-2 border-studio-accent bg-studio-accent/[0.06]"
                            : "border-studio-border bg-studio-bg hover:border-studio-muted hover:bg-white/[0.04]",
                        ].join(" ")}
                      >
                        <RecipePreviewThumb id={recipe.id} className="w-[112px] shrink-0" />
                        <span className="min-w-0 flex-1">
                          <span className="flex items-center gap-1.5">
                            <span className="truncate text-[12px] font-semibold text-studio-text">{recipe.label}</span>
                            {loading ? <RefreshCw size={13} className="animate-spin text-studio-muted" /> : null}
                          </span>
                          <span className="mt-0.5 line-clamp-2 block text-[10.5px] leading-snug text-studio-muted">{recipe.description}</span>
                        </span>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <p className="rounded-lg border border-studio-border bg-studio-input px-3 py-2 text-[11px] leading-snug text-studio-muted">
                  Add a short feature brief to see two stable blocks.
                </p>
              )}
            </div>) : null}

            {conceptError ? (
              <p className="mt-2 text-[11px] leading-snug text-red-400">{conceptError}</p>
            ) : null}
            {specNotice ? (
              <p className="mt-2 text-[11px] leading-snug text-studio-muted">{specNotice}</p>
            ) : null}
            {editableMomentKind ? (
              <div className={BLOCK_COPY_PANEL_CLASS}>
                <StepLabel
                  number={3}
                  title="Edit block copy"
                  description="Keep the layout fixed; change only the high-signal text slots."
                />
                <div className="mt-3 space-y-2">
                  <label className="block">
                    <span className={BLOCK_COPY_LABEL_CLASS}>Title</span>
                    <input
                      value={blockCopyDraft.title ?? ""}
                      maxLength={
                        editableMomentKind === "response"
                          ? responseCardLimit("title")
                          : editableMomentKind === "approval"
                            ? detailsPanelLimit("title")
                            : undefined
                      }
                      onChange={(e) => updateBlockDraft("title", e.currentTarget.value)}
                      className={BLOCK_COPY_INPUT_CLASS}
                    />
                  </label>

                  {editableMomentKind === "response" ? (
                    <>
                      <label className="flex cursor-pointer items-center gap-2 py-1">
                        <input
                          type="checkbox"
                          checked={responseCardShowReviewer(blockCopyDraft)}
                          onChange={(e) =>
                            updateBlockDraft("showReviewer", e.currentTarget.checked ? "true" : "false", { immediate: true })
                          }
                          className="sb-checkbox"
                        />
                        <span className="text-xs font-medium text-studio-text">Show reviewer</span>
                      </label>
                      <label className="flex cursor-pointer items-center gap-2 py-1">
                        <input
                          type="checkbox"
                          checked={responseCardShowSources(blockCopyDraft)}
                          onChange={(e) =>
                            updateBlockDraft("showSources", e.currentTarget.checked ? "true" : "false", { immediate: true })
                          }
                          className="sb-checkbox"
                        />
                        <span className="text-xs font-medium text-studio-text">Show sources</span>
                      </label>
                      <label className="flex cursor-pointer items-center gap-2 py-1">
                        <input
                          type="checkbox"
                          checked={responseCardShowButtons(blockCopyDraft)}
                          onChange={(e) =>
                            updateBlockDraft("showButtons", e.currentTarget.checked ? "true" : "false", { immediate: true })
                          }
                          className="sb-checkbox"
                        />
                        <span className="text-xs font-medium text-studio-text">Show buttons</span>
                      </label>
                      {responseCardShowReviewer(blockCopyDraft) ? (
                        <label className="block">
                          <span className={BLOCK_COPY_LABEL_CLASS}>Reviewer</span>
                          <input
                            value={blockCopyDraft.reviewer ?? ""}
                            maxLength={responseCardLimit("reviewer")}
                            onChange={(e) => updateBlockDraft("reviewer", e.currentTarget.value)}
                            className={BLOCK_COPY_INPUT_CLASS}
                          />
                        </label>
                      ) : null}
                      <label className="block">
                        <span className={BLOCK_COPY_LABEL_CLASS}>Response</span>
                        <textarea
                          value={blockCopyDraft.response ?? ""}
                          maxLength={responseCardLimit("response")}
                          onChange={(e) => updateBlockDraft("response", e.currentTarget.value)}
                          rows={4}
                          className={BLOCK_COPY_TEXTAREA_CLASS}
                        />
                      </label>
                      {responseCardShowSources(blockCopyDraft) ? [1, 2].map((index) => (
                        <div key={index} className="space-y-1.5">
                          <div className="grid grid-cols-[minmax(0,1fr)_76px] gap-1.5">
                            <label className="block">
                              <span className={BLOCK_COPY_LABEL_CLASS}>Source {index}</span>
                              <input
                                value={blockCopyDraft[`source${index}`] ?? ""}
                                maxLength={responseCardLimit(`source${index}`)}
                                onChange={(e) => updateBlockDraft(`source${index}`, e.currentTarget.value)}
                                className={BLOCK_COPY_INPUT_CLASS}
                              />
                            </label>
                            <label className="block">
                              <span className={BLOCK_COPY_LABEL_CLASS}>Match</span>
                              <input
                                value={blockCopyDraft[`source${index}Match`] ?? ""}
                                maxLength={responseCardLimit(`source${index}Match`)}
                                onChange={(e) => updateBlockDraft(`source${index}Match`, e.currentTarget.value)}
                                className={BLOCK_COPY_INPUT_CLASS}
                              />
                            </label>
                          </div>
                          <label className="block">
                            <span className={BLOCK_COPY_LABEL_CLASS}>Icon</span>
                            <select
                              value={responseSourceIconValue(blockCopyDraft[`source${index}Icon`])}
                              onChange={(e) => updateBlockDraft(`source${index}Icon`, e.currentTarget.value, { immediate: true })}
                              className={BLOCK_COPY_INPUT_CLASS}
                            >
                              {RESPONSE_SOURCE_ICON_OPTIONS.map((option) => (
                                <option key={option.id} value={option.id}>
                                  {option.label}
                                </option>
                              ))}
                            </select>
                          </label>
                        </div>
                      )) : null}
                      {responseCardShowButtons(blockCopyDraft) ? (
                      <div className="grid grid-cols-2 gap-1.5">
                        <label className="block">
                          <span className={BLOCK_COPY_LABEL_CLASS}>Secondary CTA</span>
                          <input
                            value={blockCopyDraft.secondaryAction ?? ""}
                            maxLength={responseCardLimit("secondaryAction")}
                            onChange={(e) => updateBlockDraft("secondaryAction", e.currentTarget.value)}
                            className={BLOCK_COPY_INPUT_CLASS}
                          />
                        </label>
                        <label className="block">
                          <span className={BLOCK_COPY_LABEL_CLASS}>Primary CTA</span>
                          <input
                            value={blockCopyDraft.primaryAction ?? ""}
                            maxLength={responseCardLimit("primaryAction")}
                            onChange={(e) => updateBlockDraft("primaryAction", e.currentTarget.value)}
                            className={BLOCK_COPY_INPUT_CLASS}
                          />
                        </label>
                      </div>
                      ) : null}
                    </>
                  ) : null}

                  {editableMomentKind === "approval" ? (
                    <>
                      <label className="flex cursor-pointer items-center gap-2 py-1">
                        <input
                          type="checkbox"
                          checked={detailsPanelShowInformation(blockCopyDraft)}
                          onChange={(e) =>
                            updateBlockDraft(
                              "showInformation",
                              e.currentTarget.checked ? "true" : "false",
                              { immediate: true },
                            )
                          }
                          className="sb-checkbox"
                        />
                        <span className="text-xs font-medium text-studio-text">Show information</span>
                      </label>
                      {detailsPanelShowInformation(blockCopyDraft) ? (
                        <div>
                          <span className={BLOCK_COPY_LABEL_CLASS}>Information</span>
                          <div className="grid grid-cols-2 gap-1.5">
                            {[
                              ["detailType", "Type"],
                              ["detailName", "Name"],
                              ["detailStatus", "Status"],
                              ["detailTime", "Time"],
                            ].map(([key, label]) => (
                              <label key={key} className="block">
                                <span className={BLOCK_COPY_FIELD_LABEL_CLASS}>{label}</span>
                                <input
                                  value={blockCopyDraft[key] ?? ""}
                                  maxLength={detailsPanelLimit(key)}
                                  onChange={(e) => updateBlockDraft(key, e.currentTarget.value)}
                                  className={BLOCK_COPY_INPUT_CLASS}
                                />
                              </label>
                            ))}
                          </div>
                        </div>
                      ) : null}
                      <div>
                        <span className={BLOCK_COPY_LABEL_CLASS}>Activity</span>
                        <div className="space-y-2">
                          {DETAILS_PANEL_ACTIVITY_ROWS.map((index) => (
                            <div key={index} className="grid grid-cols-[90px_minmax(0,1fr)] gap-1.5">
                              <label className="block">
                                <span className={BLOCK_COPY_FIELD_LABEL_CLASS}>Tag {index}</span>
                                <input
                                  value={blockCopyDraft[`activity${index}Tag`] ?? ""}
                                  maxLength={detailsPanelLimit(`activity${index}Tag`)}
                                  onChange={(e) => updateBlockDraft(`activity${index}Tag`, e.currentTarget.value)}
                                  className={BLOCK_COPY_INPUT_CLASS}
                                />
                              </label>
                              <label className="block">
                                <span className={BLOCK_COPY_FIELD_LABEL_CLASS}>Text {index}</span>
                                <input
                                  value={blockCopyDraft[`activity${index}Text`] ?? ""}
                                  maxLength={detailsPanelLimit(`activity${index}Text`)}
                                  onChange={(e) => updateBlockDraft(`activity${index}Text`, e.currentTarget.value)}
                                  className={BLOCK_COPY_INPUT_CLASS}
                                />
                              </label>
                            </div>
                          ))}
                        </div>
                      </div>
                    </>
                  ) : null}

                  {editableMomentKind === "search" ? (
                    <>
                      <label className="block">
                        <span className={BLOCK_COPY_LABEL_CLASS}>Search field</span>
                        <input
                          value={blockCopyDraft.search ?? ""}
                          onChange={(e) => updateBlockDraft("search", e.currentTarget.value)}
                          className={BLOCK_COPY_INPUT_CLASS}
                        />
                      </label>
                      <div className="grid grid-cols-3 gap-1.5">
                        {[1, 2, 3].map((index) => (
                          <label key={index} className="block">
                            <span className={BLOCK_COPY_LABEL_CLASS}>Filter</span>
                            <input
                              value={blockCopyDraft[`filter${index}`] ?? ""}
                              onChange={(e) => updateBlockDraft(`filter${index}`, e.currentTarget.value)}
                              className={BLOCK_COPY_INPUT_CLASS}
                            />
                          </label>
                        ))}
                      </div>
                      {[1, 2, 3].map((index) => (
                        <label key={index} className="block">
                          <span className={BLOCK_COPY_LABEL_CLASS}>Result {index}</span>
                          <input
                            value={blockCopyDraft[`result${index}`] ?? ""}
                            onChange={(e) => updateBlockDraft(`result${index}`, e.currentTarget.value)}
                            className={BLOCK_COPY_INPUT_CLASS}
                          />
                        </label>
                      ))}
                    </>
                  ) : null}
                </div>
              </div>
            ) : null}
          </Section>

          <Section
            title="Developer tools"
            action={
              <button
                type="button"
                onClick={() => setDeveloperToolsOpen(!developerToolsOpen)}
                className="flex items-center justify-center w-6 h-6 rounded-md text-studio-muted hover:text-studio-text hover:bg-white/[0.06] transition-colors"
                aria-label="Toggle developer tools"
              >
                <ChevronDown size={15} className={developerToolsOpen ? "rotate-180 transition-transform" : "transition-transform"} />
              </button>
            }
          >
            {!developerToolsOpen ? (
              <p className="text-[11px] text-studio-muted leading-relaxed">
                Scene spec import and export tools are hidden by default.
              </p>
            ) : (
              <div>
                <div className="mb-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-studio-muted">Scene spec</div>
                <div className="flex gap-1.5">
                <button
                  type="button"
                  onClick={copySpecJson}
                  disabled={!activeConceptSpec}
                  className="rounded-md border border-studio-border px-2 py-1 text-[11px] font-semibold text-studio-muted hover:text-studio-text disabled:opacity-40"
                >
                  Copy scene spec
                </button>
                <button
                  type="button"
                  onClick={pasteSpecJson}
                  disabled={!specJsonDraft.trim()}
                  className="rounded-md bg-studio-accent px-2 py-1 text-[11px] font-semibold text-studio-accent-fg disabled:opacity-40"
                >
                  Paste scene spec
                </button>
              </div>
              <textarea
                value={specJsonDraft}
                onChange={(e) => {
                  setSpecJsonDraft(e.currentTarget.value);
                  setSpecPasteError(null);
                }}
                placeholder="Paste SceneSpec"
                spellCheck={false}
                rows={5}
                className="mt-2 w-full resize-none rounded-md border border-studio-border bg-black/30 p-2 font-mono text-[10px] leading-relaxed text-studio-text outline-none placeholder:text-studio-muted/60"
              />
              {specPasteError ? (
                <p className="mt-1.5 whitespace-pre-wrap text-[10px] leading-relaxed text-red-400">{specPasteError}</p>
              ) : null}
              </div>
            )}
          </Section>
        </>)}

        {sourceMode === "screenshot" && content.screenshot?.url && (
          <Section title="Settings">
            {!content.screenshot.crop && (
              <p className="mb-2 text-[11px] text-studio-muted leading-snug">
                {cropOnly ? "Select a key area first to crop." : "Select a key area first to crop or highlight."}
              </p>
            )}
            <div className="flex items-center gap-1 p-1 rounded-lg bg-studio-input">
              {displayModes.map((m) => {
                const enabled = !!content.screenshot?.crop;
                const active = cropOnly ? m.id === "crop" : content.screenshot?.displayMode === m.id;
                return (
                  <button
                    key={m.id}
                    disabled={!enabled}
                    onClick={() =>
                      content.screenshot &&
                      update({ screenshot: { ...content.screenshot, displayMode: cropOnly ? "crop" : m.id } })
                    }
                    aria-pressed={active}
                    className={[
                      "flex-1 px-2 py-1.5 rounded-md text-[11px] font-medium transition-colors",
                      !enabled
                        ? "text-studio-muted/40 cursor-not-allowed"
                        : active
                          ? "bg-studio-hover text-studio-text"
                          : "text-studio-muted hover:text-studio-text",
                    ].join(" ")}
                  >
                    {m.label}
                  </button>
                );
              })}
            </div>
          </Section>
        )}

      </div>

      {conceptScene ? (
        <div aria-hidden style={{ position: "fixed", left: "-10000px", top: 0, pointerEvents: "none" }}>
          <div ref={conceptCaptureRef}>
            <SceneRenderer spec={conceptScene} />
          </div>
        </div>
      ) : null}

      {bgModalOpen && (
        <BackgroundPickerModal
          currentId={selectedBgId}
          customBackgrounds={customBackgrounds}
          hiddenGroups={["industry", "everyday"]}
          onSelect={(bg) => update({ bgImage: bg.url })}
          onUpload={(bg) => { addCustomBackground(bg); update({ bgImage: bg.url }); }}
          onClose={() => setBgModalOpen(false)}
        />
      )}

      {cropOpen && content.screenshot?.url && (
        <CropSelector
          imageUrl={content.screenshot.url}
          crop={content.screenshot.crop}
          onApply={(crop) => {
            if (content.screenshot) {
              update({
                screenshot: {
                  ...content.screenshot,
                  crop,
                  displayMode: sourceMode === "concept" || cropOnly ? "crop" : content.screenshot.displayMode,
                },
              });
            }
            setCropOpen(false);
          }}
          onCancel={() => setCropOpen(false)}
        />
      )}

    </div>
  );
}
