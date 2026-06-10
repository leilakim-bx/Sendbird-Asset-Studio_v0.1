import type { CSSProperties } from "react";
import type { ProductVisualContent } from "@/lib/types/product-visual";
import {
  FORMAT_SIZES,
  FORMAT_MIN_HEIGHT,
  PRODUCT_VISUAL_BG_HEX,
  PRODUCT_VISUAL_SERIF,
  PRODUCT_VISUAL_SANS,
  PRODUCT_VISUAL_INK,
  PRODUCT_VISUAL_INK_MUTED,
} from "@/lib/types/product-visual";
import { ScreenshotDisplay } from "./ScreenshotDisplay";

type Props = {
  content: ProductVisualContent;
  className?: string;
  /** For export/thumbnail: absolute pixel size, no preview chrome (radius/shadow). */
  exportMode?: boolean;
};

/** Per-format inner padding. */
function paddingFor(format: ProductVisualContent["format"]): number {
  if (format === "release-thumbnail") return 32;
  if (format === "feature-mobile") return 28;
  if (format === "feature-desktop") return 56;
  return 48;
}

/** Per-format title size (px). */
function titleSizeFor(format: ProductVisualContent["format"]): number {
  switch (format) {
    case "feature-desktop": return 30;
    case "release-thumbnail": return 22;
    case "feature-mobile": return 22;
    default: return 28;
  }
}

/**
 * Product Visual canvas. Renders at full pixel size (the shell applies
 * transform:scale to the preview). Background + colors are resolved hex so the
 * html-to-image export clone never depends on :root CSS variables.
 *
 * STEP 2: original screenshot shown as-is (no crop/highlight) with automatic
 * polish (12px radius + soft shadow on the image; rounded canvas in preview).
 */
export function ProductVisualCanvas({ content, className, exportMode }: Props) {
  const { format, layout, bg, title, subtitle, screenshot } = content;

  const size = FORMAT_SIZES[format];
  const W = size.w;
  const fixedH = typeof size.h === "number" ? size.h : null;
  const minH = FORMAT_MIN_HEIGHT[format];
  const isDark = bg === "dark";

  const pad = paddingFor(format);
  const innerW = W - pad * 2;
  // Vertical budget for content (image is capped to this so an auto-height
  // canvas stays bounded/predictable).
  const contentH = (fixedH ?? minH) - pad * 2;

  const inkTitle = isDark ? "#FFFFFF" : PRODUCT_VISUAL_INK;
  const inkSub = isDark ? "rgba(255,255,255,0.72)" : PRODUCT_VISUAL_INK_MUTED;

  const rootStyle: CSSProperties = {
    boxSizing: "border-box",
    width: W,
    ...(fixedH ? { height: fixedH } : { minHeight: minH }),
    background: PRODUCT_VISUAL_BG_HEX[bg],
    padding: pad,
    display: "flex",
    overflow: "hidden",
    fontFamily: PRODUCT_VISUAL_SANS,
    borderRadius: exportMode ? 0 : 12,
    boxShadow: exportMode ? undefined : "0 1px 2px rgba(0,0,0,0.06), 0 8px 32px rgba(0,0,0,0.10)",
  };

  const titleStyle: CSSProperties = {
    fontFamily: PRODUCT_VISUAL_SERIF,
    fontSize: titleSizeFor(format),
    lineHeight: 1.12,
    fontWeight: 500,
    letterSpacing: "-0.01em",
    color: inkTitle,
    margin: 0,
  };
  const subtitleStyle: CSSProperties = {
    fontFamily: PRODUCT_VISUAL_SANS,
    fontSize: format === "release-thumbnail" || format === "feature-mobile" ? 13 : 15,
    lineHeight: 1.45,
    fontWeight: 400,
    color: inkSub,
    margin: 0,
    marginTop: 10,
  };

  // ── side-by-side: text left, screenshot right ─────────────
  if (layout === "side-by-side") {
    const gap = 28;
    const textW = Math.round(innerW * 0.42);
    const shotW = innerW - textW - gap;
    return (
      <div
        className={className}
        style={{ ...rootStyle, flexDirection: "row", alignItems: "center", gap }}
        data-export={exportMode ? "1" : undefined}
      >
        <div style={{ width: textW, flexShrink: 0 }}>
          <h1 style={titleStyle}>{title}</h1>
          {subtitle ? <p style={subtitleStyle}>{subtitle}</p> : null}
        </div>
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", minWidth: 0 }}>
          <ScreenshotDisplay screenshot={screenshot} maxWidth={shotW} maxHeight={contentH} dark={isDark} exportMode={exportMode} />
        </div>
      </div>
    );
  }

  // ── text-top-fill: text top, screenshot fills width below ──
  if (layout === "text-top-fill") {
    return (
      <div
        className={className}
        style={{ ...rootStyle, flexDirection: "column" }}
        data-export={exportMode ? "1" : undefined}
      >
        <div style={{ flexShrink: 0 }}>
          <h1 style={titleStyle}>{title}</h1>
          {subtitle ? <p style={subtitleStyle}>{subtitle}</p> : null}
        </div>
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", marginTop: 20, minHeight: 0 }}>
          <ScreenshotDisplay screenshot={screenshot} maxWidth={innerW} maxHeight={contentH * 0.7} dark={isDark} exportMode={exportMode} />
        </div>
      </div>
    );
  }

  // ── center: text on top, screenshot below, all centered ───
  return (
    <div
      className={className}
      style={{ ...rootStyle, flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 28 }}
      data-export={exportMode ? "1" : undefined}
    >
      <div style={{ maxWidth: Math.min(innerW, 620), textAlign: "center" }}>
        <h1 style={{ ...titleStyle, textAlign: "center" }}>{title}</h1>
        {subtitle ? <p style={{ ...subtitleStyle, textAlign: "center" }}>{subtitle}</p> : null}
      </div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", maxWidth: "100%" }}>
        <ScreenshotDisplay screenshot={screenshot} maxWidth={innerW} maxHeight={contentH * 0.62} dark={isDark} exportMode={exportMode} />
      </div>
    </div>
  );
}
