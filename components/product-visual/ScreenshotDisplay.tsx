import type { ProductVisualScreenshot } from "@/lib/types/product-visual";
import { brand } from "@/lib/tokens/brand";

type Props = {
  screenshot: ProductVisualScreenshot | undefined;
  maxWidth: number;
  maxHeight: number;
};

const RADIUS = brand.radius[8];
const HIGHLIGHT_RADIUS = brand.spacing[6];
const SHADOW = brand.elevation.productScreenshot;

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
export function ScreenshotDisplay({ screenshot, maxWidth, maxHeight }: Props) {
  // No screenshot → render nothing, leaving a clean background-only preview.
  // (The upload affordance lives in the sidebar.)
  if (!screenshot?.url) return null;

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
      {/* Spotlight: a rounded rect over the crop region whose oversized
          box-shadow dims everything outside it. The shadow follows the
          border-radius, so the highlighted area has real rounded corners.
          Plain CSS paint (no clip-path / SVG mask) — reproduced faithfully by
          the html-to-image clone, clipped by the parent's overflow:hidden. */}
      <div
        style={{
          position: "absolute",
          left: pct(c.x),
          top: pct(c.y),
          width: pct(c.width),
          height: pct(c.height),
          borderRadius: HIGHLIGHT_RADIUS,
          boxShadow: brand.elevation.productHighlightMask,
          boxSizing: "border-box",
        }}
      />
    </div>
  );
}
