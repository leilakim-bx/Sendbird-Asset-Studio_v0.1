import type { ProductVisualContent } from "@/lib/types/product-visual";
import {
  FORMAT_SIZES,
  FORMAT_MIN_HEIGHT,
  PRODUCT_VISUAL_BG_HEX,
  FORMAT_FIXED_BG,
  PRODUCT_VISUAL_REFERENCE_REBUILD_ARCHIVED,
  PRODUCT_VISUAL_EXAMPLE_SCREENSHOT,
  isImageBgFormat,
  PRODUCT_VISUAL_SANS,
} from "@/lib/types/product-visual";
import { SceneRenderer } from "@/components/concept-ui/SceneRenderer";
import {
  CONCEPT_UI_CANVAS_HEIGHT,
  CONCEPT_UI_CANVAS_WIDTH,
} from "@/lib/concept-ui/scene-tokens";
import type { SceneSpec } from "@/lib/concept-ui/scene-spec";
import { ScreenshotDisplay } from "./ScreenshotDisplay";
import { brand, brandPx } from "@/lib/tokens/brand";

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

function verticalPaddingFor(format: ProductVisualContent["format"], horizontalPadding: number): number {
  if (format === "blog") return brand.spacing[60];
  return horizontalPadding;
}

function screenshotForFormat(content: ProductVisualContent): ProductVisualContent["screenshot"] {
  const { screenshot } = content;
  if (!screenshot) return undefined;
  if (isImageBgFormat(content.format) && screenshot.displayMode === "highlight") {
    return { ...screenshot, displayMode: "crop" };
  }
  return screenshot;
}

function screenshotAspect(content: ProductVisualContent): number | null {
  const screenshot = screenshotForFormat(content);
  if (!screenshot?.url || !screenshot.naturalWidth || !screenshot.naturalHeight) return null;
  if (
    screenshot.crop &&
    screenshot.crop.width > 0 &&
    screenshot.crop.height > 0 &&
    screenshot.displayMode === "crop"
  ) {
    return (screenshot.crop.width * screenshot.naturalWidth) / (screenshot.crop.height * screenshot.naturalHeight);
  }
  return screenshot.naturalWidth / screenshot.naturalHeight;
}

function screenshotDisplayHeight(content: ProductVisualContent, maxWidth: number): number | null {
  const { screenshot } = content;
  const aspect = screenshotAspect(content);
  if (!screenshot?.url || !aspect || !screenshot.naturalWidth || !screenshot.naturalHeight) return null;
  if (
    screenshot.crop &&
    screenshot.crop.width > 0 &&
    screenshot.crop.height > 0 &&
    screenshot.displayMode === "crop"
  ) {
    return maxWidth / aspect;
  }
  return Math.min(maxWidth, screenshot.naturalWidth) / aspect;
}

function isResponseCardConcept(spec: SceneSpec | undefined): boolean {
  return spec?.archetype === "modal" && spec.content.modal.slotId === "moment-ai-response";
}

function isDetailsPanelConcept(spec: SceneSpec | undefined): boolean {
  return spec?.archetype === "modal" && spec.content.modal.slotId === "moment-approval";
}

function responseCardMaxWidth(innerW: number): number {
  return Math.min(innerW, Math.max(brand.spacing[170] * 2, innerW - brand.spacing[80] * 2));
}

function ConceptSceneDisplay({
  spec,
  maxWidth,
  maxHeight,
}: {
  spec: SceneSpec;
  maxWidth: number;
  maxHeight: number;
}) {
  const scale = Math.min(maxWidth / CONCEPT_UI_CANVAS_WIDTH, maxHeight / CONCEPT_UI_CANVAS_HEIGHT);
  const width = Math.round(CONCEPT_UI_CANVAS_WIDTH * scale);
  const height = Math.round(CONCEPT_UI_CANVAS_HEIGHT * scale);

  return (
    <div
      style={{
        width,
        height,
        overflow: "hidden",
        borderRadius: brand.radius[10],
        boxShadow: brand.elevation.none,
      }}
    >
      <div
        style={{
          width: CONCEPT_UI_CANVAS_WIDTH,
          height: CONCEPT_UI_CANVAS_HEIGHT,
          transform: `scale(${scale})`,
          transformOrigin: "top left",
        }}
      >
        <SceneRenderer spec={spec} />
      </div>
    </div>
  );
}

/**
 * Product Visual canvas — a background with the polished screenshot centered on
 * top. No title/subtitle/layout: every format is just screenshot-on-background.
 * The background is a photo (Product Feature), a fixed hex (release-insert), or
 * a solid swatch color (other formats). Backgrounds resolve to literal hex /
 * <img> so the html-to-image export clone never depends on CSS variables and
 * always inlines correctly.
 */
export function ProductVisualCanvas({ content, className, exportMode }: Props) {
  const { format, bg, bgImage } = content;

  const size = FORMAT_SIZES[format];
  const W = size.w;
  const fixedH = typeof size.h === "number" ? size.h : null;
  const minH = FORMAT_MIN_HEIGHT[format];

  const imageBg = isImageBgFormat(format);
  const rawSourceMode = content.sourceMode ?? (imageBg ? "concept" : "screenshot");
  const activeRawSourceMode =
    rawSourceMode === "reference" && PRODUCT_VISUAL_REFERENCE_REBUILD_ARCHIVED ? "concept" : rawSourceMode;
  const sourceMode = imageBg && activeRawSourceMode === "screenshot" ? "concept" : activeRawSourceMode;
  const sceneSourceMode = sourceMode === "concept" || sourceMode === "reference";
  const conceptRenderedScreenshot =
    sourceMode === "concept" && content.conceptScene && content.screenshot
      ? screenshotForFormat(content)
      : undefined;
  const conceptUiScreenshot = sceneSourceMode && !!conceptRenderedScreenshot;
  const displayedScreenshot =
    sourceMode === "screenshot"
      ? screenshotForFormat(content)
      : conceptRenderedScreenshot;
  const displayedConceptScene = sceneSourceMode ? content.conceptScene : undefined;
  const compactResponseCard =
    sceneSourceMode &&
    (isResponseCardConcept(displayedConceptScene) || (!displayedConceptScene && !conceptRenderedScreenshot));
  const compactDetailsPanel = sceneSourceMode && isDetailsPanelConcept(displayedConceptScene);
  const fixedBg = FORMAT_FIXED_BG[format];
  const bgHex = fixedBg ?? PRODUCT_VISUAL_BG_HEX[bg];

  // Screenshot release inserts can show full-dashboard captures nearly
  // full-bleed. Concept UI blocks stay framed like editorial cards so their
  // blog/insert exports keep enough breathing room.
  const hasValidCrop = !!(
    displayedScreenshot?.crop &&
    displayedScreenshot.crop.width > 0 &&
    displayedScreenshot.crop.height > 0 &&
    displayedScreenshot.naturalWidth &&
    displayedScreenshot.naturalHeight
  );
  const fullDashboard = !hasValidCrop || displayedScreenshot?.displayMode === "highlight";
  const fillMode = format === "release-insert" && !!displayedScreenshot?.url && fullDashboard && !conceptUiScreenshot;
  const conceptUiAutoFormat = conceptUiScreenshot && (format === "blog" || format === "release-insert");

  const padX = fillMode ? brand.spacing[12] : paddingFor(format);
  const padY = fillMode
    ? brand.spacing[12]
    : Math.max(verticalPaddingFor(format, padX), conceptUiAutoFormat ? brand.spacing[60] : brand.spacing[0]);
  const topOnlyConceptPadding = compactDetailsPanel && conceptUiAutoFormat;
  const padTop = topOnlyConceptPadding ? brand.spacing[60] : padY;
  const padBottom = topOnlyConceptPadding ? brand.spacing[0] : padY;
  const innerW = W - padX * 2;
  const screenshotMaxW = compactResponseCard ? responseCardMaxWidth(innerW) : innerW;
  const screenshotH = displayedScreenshot ? screenshotDisplayHeight(content, screenshotMaxW) : null;
  const imageDrivenH =
    (format === "feature-mobile" || format === "blog" || (format === "release-insert" && conceptUiScreenshot)) && screenshotH
      ? screenshotH + padTop + padBottom
      : null;
  const canvasH = fixedH ?? imageDrivenH ?? minH;
  // Vertical budget for the screenshot. Fill mode leaves it effectively
  // unbounded so the image fits to width and the auto-height canvas grows.
  const contentH = fillMode ? 100000 : canvasH - padTop - padBottom;

  return (
    <div
      className={className}
      style={{
        position: "relative",
        boxSizing: "border-box",
        width: W,
        ...(fixedH ? { height: fixedH } : { minHeight: canvasH }),
        background: imageBg ? undefined : bgHex,
        overflow: "hidden",
        fontFamily: PRODUCT_VISUAL_SANS,
        borderRadius: 0,
        boxShadow: exportMode ? undefined : brand.elevation.productCanvas,
      }}
      data-export={exportMode ? "1" : undefined}
    >
      {imageBg && bgImage ? (
        /* eslint-disable-next-line @next/next/no-img-element */
        <img
          src={bgImage}
          alt=""
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", display: "block" }}
        />
      ) : null}
      <div
        style={{
          position: "relative",
          zIndex: 1,
          minHeight: canvasH,
          display: "flex",
          alignItems: topOnlyConceptPadding ? "flex-start" : "center",
          justifyContent: "center",
          padding: `${brandPx(padTop)} ${brandPx(padX)} ${brandPx(padBottom)}`,
          boxSizing: "border-box",
        }}
      >
        {sceneSourceMode ? (
          sourceMode === "concept" && conceptRenderedScreenshot ? (
            <ScreenshotDisplay
              screenshot={conceptRenderedScreenshot}
              maxWidth={screenshotMaxW}
              maxHeight={contentH}
              polished={false}
              roundedCrop={hasValidCrop}
            />
          ) : displayedConceptScene ? (
            <ConceptSceneDisplay
              spec={displayedConceptScene}
              maxWidth={innerW}
              maxHeight={contentH}
            />
          ) : (
            <ScreenshotDisplay
              screenshot={PRODUCT_VISUAL_EXAMPLE_SCREENSHOT}
              maxWidth={screenshotMaxW}
              maxHeight={contentH}
              polished={false}
            />
          )
        ) : (
          <ScreenshotDisplay
            screenshot={displayedScreenshot}
            maxWidth={innerW}
            maxHeight={contentH}
          />
        )}
      </div>
    </div>
  );
}
