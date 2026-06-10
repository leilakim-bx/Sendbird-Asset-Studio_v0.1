import type { CSSProperties } from "react";
import { ImageUp } from "lucide-react";
import type { ProductVisualScreenshot } from "@/lib/types/product-visual";
import { PRODUCT_VISUAL_SANS } from "@/lib/types/product-visual";

type Props = {
  screenshot: ProductVisualScreenshot | undefined;
  maxWidth: number;
  maxHeight: number;
  /** Dark canvas background → lighten the empty-state placeholder. */
  dark?: boolean;
  /** Export/thumbnail: suppress the dashed upload placeholder (clean output). */
  exportMode?: boolean;
};

const RADIUS = 12;
const SHADOW = "0 4px 24px rgba(0,0,0,0.08)";

/** Fit an aspect ratio (w/h) into a box with object-fit: contain semantics. */
function fitContain(aspect: number, maxW: number, maxH: number): { w: number; h: number } {
  let w = maxW;
  let h = w / aspect;
  if (h > maxH) {
    h = maxH;
    w = h * aspect;
  }
  return { w, h };
}

/**
 * Renders the uploaded screenshot inside the canvas with automatic polish
 * (12px rounded corners + soft shadow). Honors crop + displayMode:
 *  - no crop (or missing natural dims) → full image, object-fit contain
 *  - crop + "crop"      → only the selected region (overflow + offset <img>)
 *  - crop + "highlight" → full image, region outside dimmed by plain divs
 *
 * All masking is plain CSS (overflow / positioned divs) — no clip-path or SVG
 * mask — so html-to-image's foreignObject clone reproduces it faithfully.
 */
export function ScreenshotDisplay({ screenshot, maxWidth, maxHeight, dark, exportMode }: Props) {
  if (!screenshot?.url) {
    if (exportMode) return null; // clean text-only export, no dashed box
    const fg = dark ? "rgba(255,255,255,0.55)" : "rgba(28,25,23,0.40)";
    const border = dark ? "rgba(255,255,255,0.25)" : "rgba(28,25,23,0.20)";
    const placeholderStyle: CSSProperties = {
      width: maxWidth,
      height: maxHeight,
      maxWidth: "100%",
      borderRadius: RADIUS,
      border: `2px dashed ${border}`,
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      color: fg,
      fontFamily: PRODUCT_VISUAL_SANS,
      fontSize: 13,
      fontWeight: 500,
    };
    return (
      <div style={placeholderStyle}>
        <ImageUp size={26} strokeWidth={1.75} />
        <span>Upload screenshot</span>
      </div>
    );
  }

  const { url, crop, displayMode, naturalWidth, naturalHeight } = screenshot;
  const hasCrop =
    !!crop &&
    crop.width > 0 &&
    crop.height > 0 &&
    !!naturalWidth &&
    !!naturalHeight;

  // ── Full image (no crop / missing dims) — STEP 2 behavior ──
  if (!hasCrop) {
    return (
      /* eslint-disable-next-line @next/next/no-img-element */
      <img
        src={url}
        alt="Product screenshot"
        style={{
          maxWidth,
          maxHeight,
          width: "auto",
          height: "auto",
          objectFit: "contain",
          borderRadius: RADIUS,
          boxShadow: SHADOW,
          display: "block",
        }}
      />
    );
  }

  // crop is guaranteed defined here (hasCrop)
  const c = crop!;
  const natW = naturalWidth!;
  const natH = naturalHeight!;

  // ── Crop mode: show only the selected region ──────────────
  if (displayMode === "crop") {
    const cropAspect = (c.width * natW) / (c.height * natH);
    const box = fitContain(cropAspect, maxWidth, maxHeight);
    const imgW = box.w / c.width;
    const imgH = box.h / c.height;
    return (
      <div
        style={{
          position: "relative",
          width: box.w,
          height: box.h,
          overflow: "hidden",
          borderRadius: RADIUS,
          boxShadow: SHADOW,
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={url}
          alt="Product screenshot"
          style={{
            position: "absolute",
            left: -c.x * imgW,
            top: -c.y * imgH,
            width: imgW,
            height: imgH,
            maxWidth: "none",
            display: "block",
          }}
        />
      </div>
    );
  }

  // ── Highlight mode: full image, region outside dimmed ─────
  const imgAspect = natW / natH;
  const box = fitContain(imgAspect, maxWidth, maxHeight);
  const dim = "rgba(0,0,0,0.4)";
  const pct = (v: number) => `${v * 100}%`;
  return (
    <div
      style={{
        position: "relative",
        width: box.w,
        height: box.h,
        overflow: "hidden",
        borderRadius: RADIUS,
        boxShadow: SHADOW,
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={url} alt="Product screenshot" style={{ width: box.w, height: box.h, display: "block" }} />
      {/* Dim everything outside the crop rect (4 plain divs) */}
      {[
        { left: 0, top: 0, width: "100%", height: pct(c.y) },
        { left: 0, top: pct(c.y + c.height), width: "100%", height: pct(1 - c.y - c.height) },
        { left: 0, top: pct(c.y), width: pct(c.x), height: pct(c.height) },
        { left: pct(c.x + c.width), top: pct(c.y), width: pct(1 - c.x - c.width), height: pct(c.height) },
      ].map((s, i) => (
        <div key={i} style={{ position: "absolute", background: dim, ...s }} />
      ))}
      {/* Subtle highlight outline */}
      <div
        style={{
          position: "absolute",
          left: pct(c.x),
          top: pct(c.y),
          width: pct(c.width),
          height: pct(c.height),
          border: "1px solid rgba(203,255,77,0.8)",
          boxSizing: "border-box",
        }}
      />
    </div>
  );
}
