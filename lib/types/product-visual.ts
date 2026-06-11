// Product Visual template — data model (STEP 1).
//
// Workflow: marketer uploads a real product screenshot, selects a region, and
// the tool polishes it for releases/blogs. Canvas rendering, image upload, and
// region selection land in STEP 2~5; this file is the type foundation only.

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

export type ProductVisualScreenshot = {
  /** Uploaded image (R2 or temporary base64) */
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
   *  Absent → crop/highlight fall back to showing the full image. Stripped on
   *  save alongside `url`. */
  naturalWidth?: number;
  naturalHeight?: number;
};

export type ProductVisualContent = {
  format: ProductVisualFormat;
  layout: ProductVisualLayout;
  bg: ProductVisualBg;
  /** Background image URL — only for image-bg formats (Product Feature). Stored
   *  as the resolved URL (built-in `/background/*` path or a custom data URL) so
   *  the canvas renders it as a plain `<img>` with no store lookup. Ignored by
   *  swatch/fixed-bg formats. */
  bgImage?: string;
  screenshot?: ProductVisualScreenshot;
  title: string;
  subtitle?: string;
};

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
  white:    "#FFFFFF",
  sky:      "#D8F0FF",
  stone:    "#D9D6D2",
  warmgray: "#E5E3DF",
  dark:     "#1C1917",
};

/** Formats with a single fixed (non-selectable) background. The canvas renders
 *  this hex regardless of `bg`, and the sidebar hides the Background picker. */
export const FORMAT_FIXED_BG: Partial<Record<ProductVisualFormat, string>> = {
  "release-thumbnail": "#E5E3DF",
  "release-insert":    "#F7F5F0",
  "blog":              "#F7F5F0",
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
  url: "/preview/dashboard.png",
  displayMode: "crop",
  naturalWidth: 1056,
  naturalHeight: 744,
};

// Fonts — same brand stacks the rest of the studio uses (mirrors infographic;
// declared locally to keep Product Visual decoupled from infographic types).
/** Serif display stack (brand "Serrif") — titles. */
export const PRODUCT_VISUAL_SERIF = '"Serrif", Georgia, "Times New Roman", serif';
/** Sans body stack (Helvetica Now Text) — subtitle + UI. */
export const PRODUCT_VISUAL_SANS = '"Helvetica Now Text", "Helvetica Neue", Helvetica, Arial, sans-serif';

/** Ink colors for non-dark backgrounds (dark bg flips text to white). */
export const PRODUCT_VISUAL_INK = "#1C1917";
export const PRODUCT_VISUAL_INK_MUTED = "#6B6660";

/** Per-format starter content. Used as the seed when entering a format (and on
 *  format switch — see store.setProductVisualFormat). `screenshot` is always
 *  left undefined: the marketer uploads their own. */
export const FORMAT_DEFAULTS: Record<ProductVisualFormat, Omit<ProductVisualContent, "screenshot">> = {
  "feature-desktop": {
    format: "feature-desktop",
    layout: "center",
    bg: "warmgray",
    bgImage: PRODUCT_VISUAL_DEFAULT_BG_IMAGE,
    title: "Now you can manage agent versions in one place",
    subtitle: "Compare versions, roll back instantly, and ship with confidence.",
  },
  "feature-mobile": {
    format: "feature-mobile",
    layout: "text-top-fill",
    bg: "white",
    bgImage: PRODUCT_VISUAL_DEFAULT_BG_IMAGE,
    title: "Built for marketers, ready in minutes",
    subtitle: "Create polished assets on the go.",
  },
  "release-thumbnail": {
    format: "release-thumbnail",
    layout: "side-by-side",
    bg: "warmgray",
    title: "Introducing AI agent workspace",
    subtitle: "Manage all your AI agents in one workspace.",
  },
  "release-insert": {
    format: "release-insert",
    layout: "center",
    bg: "white",
    title: "Conversation insights at a glance",
    subtitle: "Track resolution, sentiment, and CSAT in real time.",
  },
  "blog": {
    format: "blog",
    layout: "center",
    bg: "stone",
    title: "Why we built AI agent workspace",
    subtitle: "The thinking behind our latest release.",
  },
};
