// Product Visual PNG export (STEP 4). Thin wrapper over the shared
// `exportImage` (lib/export.ts) so PV stays on the same html-to-image pipeline
// as Chat/Infographic: pixelRatio 2 (@2x output) + in-place <img> inlining.

import { exportImage, type ExportedImage } from "@/lib/export";
import { FORMAT_SIZES, type ProductVisualFormat } from "@/lib/types/product-visual";

/** product-visual-{format}-{timestamp}.png */
export function productVisualFilename(format: ProductVisualFormat, ts: number): string {
  return `product-visual-${format}-${ts}.png`;
}

/**
 * Export the off-screen full-size canvas element as a PNG at the format's exact
 * pixel size × 2. Variable-height formats pass `height: undefined` so the
 * natural rendered height is captured (then doubled by pixelRatio 2).
 */
export async function exportProductVisual(
  element: HTMLElement,
  format: ProductVisualFormat,
  ts: number,
): Promise<ExportedImage> {
  const size = FORMAT_SIZES[format];
  const height = typeof size.h === "number" ? size.h : undefined;
  return await exportImage(element, size.w, height, productVisualFilename(format, ts));
}
