// Product Visual template — data model (STEP 1).
//
// Workflow: marketer uploads a real product screenshot, selects a region, and
// the tool polishes it for releases/blogs. Canvas rendering, image upload, and
// region selection land in STEP 2~5; this file is the type foundation only.

import type { SceneSpec } from "@/lib/concept-ui/scene-spec";
import { brand } from "@/lib/tokens/brand";
import { WORK_DATA_SCHEMA_VERSION } from "@/lib/work-data-schema";

export type ProductVisualFormat =
  | "feature-desktop"
  | "feature-mobile"
  | "release-thumbnail"
  | "release-insert"
  | "blog";

export type ProductVisualLayout =
  | "center"
  | "side-by-side"
  | "text-top-fill";

export type ProductVisualBg =
  | "white"
  | "sky"
  | "stone"
  | "warmgray"
  | "dark";

export type ProductVisualSourceMode = "screenshot" | "concept" | "reference";

/**
 * Reference Rebuild is archived for now: the code path stays available for
 * later quality work, but the marketer-facing Product Visual UI hides it.
 */
export const PRODUCT_VISUAL_REFERENCE_REBUILD_ARCHIVED = true;

export type ProductVisualScreenshot = {
  /** Browser-local data URL for uploaded screenshots, or a built-in preview URL. */
  url: string;
  crop?: {
    /** 0~1 ratios relative to the source image */
    x: number;
    y: number;
    width: number;
    height: number;
  };
  /** "crop" = cut out the region; "highlight" = dim the surroundings */
  displayMode: "crop" | "highlight";
  /** Source image pixel dimensions, captured at upload. Used to map normalized
   *  crop ratios to the correct aspect without object-fit letterbox guesswork.
   *  Absent → crop/highlight fall back to showing the full image. */
  naturalWidth?: number;
  naturalHeight?: number;
};

export type ProductVisualConceptKind =
  | "deployment"
  | "conversation"
  | "evaluation"
  | "analytics"
  | "settings"
  | "workspace";

export type ProductVisualTone = "neutral" | "good" | "warn" | "accent";

export type ProductVisualConcept = {
  /** Marketer's source description. Kept so it can be edited and regenerated. */
  prompt: string;
  kind: ProductVisualConceptKind;
  title: string;
  subtitle: string;
  badge: string;
  primaryLabel: string;
  primaryValue: string;
  metrics: {
    label: string;
    value: string;
    delta?: string;
    tone?: ProductVisualTone;
  }[];
  chips: {
    label: string;
    tone?: ProductVisualTone;
  }[];
  rows: {
    label: string;
    value: string;
    tone?: ProductVisualTone;
  }[];
};

export type ProductVisualReferenceLayout =
  | "auto"
  | "workspace"
  | "dashboard"
  | "builder"
  | "inbox"
  | "table"
  | "modal";

export type ProductVisualReferenceRebuild = {
  /** User-written description of what to rebuild from the temporary reference image. */
  brief: string;
  /** Optional structure override. The original reference image is not persisted. */
  layout: ProductVisualReferenceLayout;
};

export type ProductVisualContent = {
  schemaVersion: number;
  format: ProductVisualFormat;
  layout: ProductVisualLayout;
  bg: ProductVisualBg;
  sourceMode?: ProductVisualSourceMode;
  /** Background image URL — only for image-bg formats (Product Feature). Stored
   *  as the resolved URL (built-in `/background/*` path or a custom data URL) so
   *  the canvas renders it as a plain `<img>` with no store lookup. Ignored by
   *  swatch/fixed-bg formats. */
  bgImage?: string;
  screenshot?: ProductVisualScreenshot;
  concept?: ProductVisualConcept;
  reference?: ProductVisualReferenceRebuild;
  /** New deterministic Concept UI renderer spec. Used for starter/sample scenes. */
  conceptScene?: SceneSpec;
  title: string;
  subtitle?: string;
};

export function withProductVisualSchema(content: Omit<ProductVisualContent, "schemaVersion">): ProductVisualContent {
  return {
    schemaVersion: WORK_DATA_SCHEMA_VERSION,
    ...content,
  };
}

/** Allowed layouts per format. `defaultContent` must satisfy this matrix. */
export const FORMAT_LAYOUTS: Record<ProductVisualFormat, ProductVisualLayout[]> = {
  "feature-desktop":   ["center", "side-by-side"],
  "feature-mobile":    ["text-top-fill"],
  "release-thumbnail": ["side-by-side"],
  "release-insert":    ["center", "side-by-side"],
  "blog":              ["center"],
};

/** Canvas size per format. `"auto"` height = content-driven (variable). */
export const FORMAT_SIZES: Record<ProductVisualFormat, { w: number; h: number | "auto" }> = {
  "feature-desktop":   { w: 866, h: 660 },
  "feature-mobile":    { w: 343, h: "auto" },
  "release-thumbnail": { w: 667, h: 316 },
  "release-insert":    { w: 840, h: "auto" },
  "blog":              { w: 664, h: "auto" },
};

/** Min height (px) for the `"auto"` (variable-height) formats. */
export const FORMAT_MIN_HEIGHT: Record<ProductVisualFormat, number> = {
  "feature-desktop":   660,
  "feature-mobile":    480,
  "release-thumbnail": 316,
  "release-insert":    400,
  "blog":              400,
};

/** Resolved background hex. Written as literal hex (not CSS vars) so the
 *  html-to-image export clone never depends on :root variables resolving. */
export const PRODUCT_VISUAL_BG_HEX: Record<ProductVisualBg, string> = {
  white:    brand.color.productVisual.bg.white,
  sky:      brand.color.productVisual.bg.sky,
  stone:    brand.color.productVisual.bg.stone,
  warmgray: brand.color.productVisual.bg.warmgray,
  dark:     brand.color.productVisual.bg.dark,
};

/** Formats with a single fixed (non-selectable) background. The canvas renders
 *  this hex regardless of `bg`, and the sidebar hides the Background picker. */
export const FORMAT_FIXED_BG: Partial<Record<ProductVisualFormat, string>> = {
  "release-thumbnail": brand.color.productVisual.fixedBg.releaseThumbnail,
  "release-insert":    brand.color.productVisual.fixedBg.releaseInsert,
  "blog":              brand.color.productVisual.fixedBg.blog,
};

/** Formats that use a full-bleed background IMAGE (same library as the Chat
 *  editor) instead of a solid color. These show only the screenshot on the
 *  photo — no title/subtitle/layout chrome. */
export const FORMAT_IMAGE_BG: ProductVisualFormat[] = ["feature-desktop", "feature-mobile"];
export const isImageBgFormat = (f: ProductVisualFormat): boolean =>
  FORMAT_IMAGE_BG.includes(f);

/** Seed background image for image-bg formats (mirrors the Chat default). */
export const PRODUCT_VISUAL_DEFAULT_BG_IMAGE = "/background/bg-200.png";

/** Example dashboard shown when a marketer first opens Product Visual. */
export const PRODUCT_VISUAL_EXAMPLE_SCREENSHOT: ProductVisualScreenshot = {
  url: "/preview/dashboard.png?v=20260611-2306",
  displayMode: "crop",
  naturalWidth: 1440,
  naturalHeight: 1320,
};

// Fonts — same brand stacks the rest of the studio uses (mirrors infographic;
// declared locally to keep Product Visual decoupled from infographic types).
/** Serif display stack (brand "Serrif") — titles. */
export const PRODUCT_VISUAL_SERIF = brand.font.serif;
/** Sans body stack (Helvetica Now Text) — subtitle + UI. */
export const PRODUCT_VISUAL_SANS = brand.font.sans;

/** Ink colors for non-dark backgrounds (dark bg flips text to white). */
export const PRODUCT_VISUAL_INK = brand.color.productVisual.ink;
export const PRODUCT_VISUAL_INK_MUTED = brand.color.productVisual.inkMuted;

/** Per-format starter content. Used as the seed when entering a format (and on
 *  format switch — see store.setProductVisualFormat). `screenshot` is always
 *  left undefined: the marketer uploads their own. */
export const FORMAT_DEFAULTS: Record<ProductVisualFormat, Omit<ProductVisualContent, "screenshot">> = {
  "feature-desktop": {
    schemaVersion: WORK_DATA_SCHEMA_VERSION,
    format: "feature-desktop",
    layout: "center",
    bg: "warmgray",
    bgImage: PRODUCT_VISUAL_DEFAULT_BG_IMAGE,
    title: "Now you can manage agent versions in one place",
    subtitle: "Compare versions, roll back instantly, and ship with confidence.",
  },
  "feature-mobile": {
    schemaVersion: WORK_DATA_SCHEMA_VERSION,
    format: "feature-mobile",
    layout: "text-top-fill",
    bg: "white",
    bgImage: PRODUCT_VISUAL_DEFAULT_BG_IMAGE,
    title: "Built for marketers, ready in minutes",
    subtitle: "Create polished assets on the go.",
  },
  "release-thumbnail": {
    schemaVersion: WORK_DATA_SCHEMA_VERSION,
    format: "release-thumbnail",
    layout: "side-by-side",
    bg: "warmgray",
    title: "Introducing AI agent workspace",
    subtitle: "Manage all your AI agents in one workspace.",
  },
  "release-insert": {
    schemaVersion: WORK_DATA_SCHEMA_VERSION,
    format: "release-insert",
    layout: "center",
    bg: "white",
    title: "Conversation insights at a glance",
    subtitle: "Track resolution, sentiment, and CSAT in real time.",
  },
  "blog": {
    schemaVersion: WORK_DATA_SCHEMA_VERSION,
    format: "blog",
    layout: "center",
    bg: "stone",
    title: "Why we built AI agent workspace",
    subtitle: "The thinking behind our latest release.",
  },
};
