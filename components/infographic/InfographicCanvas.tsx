import type { CSSProperties } from "react";
import type { InfographicContent } from "@/lib/types/infographic";
import {
  INFOGRAPHIC_BG_HEX,
  INFOGRAPHIC_ACCENT_HEX,
  INFOGRAPHIC_INK,
  INFOGRAPHIC_INK_MUTED,
  INFOGRAPHIC_SANS,
} from "@/lib/types/infographic";
import { BlockRenderer } from "./blocks/BlockRenderer";

type Props = {
  content: InfographicContent;
  className?: string;
  /** For export: rendered at absolute pixel size (no transform:scale applied here). */
  exportMode?: boolean;
};

const PRODUCT = { width: 866, height: 660 };
const PRODUCT_SAFE_Y = 60;
const PRODUCT_FOOTNOTE_HEIGHT = 14 * 1.5;
const BLOCK_GAP = 28;
// Blog height is free, so keep the minimum modest — short content (e.g. a lone
// stat with no title/footnote) shouldn't get padded out to a tall box.
const BLOG = { width: 664, minHeight: 360 };
const HUB_ORBIT_DEFAULT_FOOTNOTE = "Channels orbit the agent";

/**
 * Flat/branded infographic canvas. Always renders at full pixel size — the
 * editor shell applies transform:scale to the preview wrapper. Background and
 * accent are written as resolved hex (and `--ig-accent` custom property) so the
 * html-to-image export clone never depends on :root CSS variables resolving.
 */
export function InfographicCanvas({ content, className, exportMode }: Props) {
  const { format, bg, accent, title, footnote, blocks } = content;
  const isProduct = format === "product";
  // Product format always uses the fixed warm background token,
  // regardless of the stored bg (which only applies to the blog format).
  const effectiveBg = isProduct ? "warmgray" : bg;
  // Stat and process-loop blocks carry their own internal heading/caption, so
  // the content-level title/footnote chrome stays off for both formats.
  const primaryBlock = blocks[0];
  const isStat = primaryBlock?.type === "stat";
  const isProcessLoop = primaryBlock?.type === "process-loop";
  const suppressContentChrome = isStat || isProcessLoop;
  const isHubOrbit = primaryBlock?.type === "orbit" && primaryBlock.variant === "hub-spoke";
  const renderedFootnote = footnote?.trim() || (isHubOrbit ? HUB_ORBIT_DEFAULT_FOOTNOTE : "");
  // Product format keeps title hidden, but may carry a compact footnote.
  // Blog format can show both title and footnote when the section is enabled.
  const showBlogHeader = !isProduct && content.showTitle !== false && !suppressContentChrome;
  const showTitle = showBlogHeader && !!title;
  const showFootnote = !!renderedFootnote && !suppressContentChrome && (isProduct || showBlogHeader);
  const blockCount = Math.max(blocks.length, 1);
  const productAvailableBlockHeight = isProduct
    ? Math.max(
        0,
        (
          PRODUCT.height -
          PRODUCT_SAFE_Y * 2 -
          (showTitle ? 26 * 1.1 + 32 : 0) -
          (showFootnote ? PRODUCT_FOOTNOTE_HEIGHT + 24 : 0) -
          Math.max(0, blocks.length - 1) * BLOCK_GAP
        ) / blockCount,
      )
    : undefined;

  const rootStyle = {
    boxSizing: "border-box",
    width: isProduct ? PRODUCT.width : BLOG.width,
    ...(isProduct ? { height: PRODUCT.height } : { minHeight: BLOG.minHeight }),
    background: INFOGRAPHIC_BG_HEX[effectiveBg],
    color: INFOGRAPHIC_INK,
    // Blog format trims vertical padding (free height) so short content sits tighter.
    paddingLeft: 56,
    paddingRight: 56,
    paddingTop: isProduct ? PRODUCT_SAFE_Y : 40,
    paddingBottom: isProduct ? PRODUCT_SAFE_Y : 40,
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
    fontFamily: INFOGRAPHIC_SANS,
    // Resolved accent hex exposed to child blocks via custom property.
    "--ig-accent": INFOGRAPHIC_ACCENT_HEX[accent],
  } as unknown as CSSProperties;

  return (
    <div className={className} style={rootStyle} data-export={exportMode ? "1" : undefined}>
      {showTitle && (
        <h1
          style={{
            fontFamily: INFOGRAPHIC_SANS,
            // Blog title is 2px smaller than product.
            fontSize: isProduct ? 26 : 24,
            lineHeight: 1.1,
            // 500/Medium: the brand "Helvetica Now Text" isn't loaded (no
            // @font-face), so this falls back to system Helvetica — where 600
            // snaps up to Bold(700). 500 maps to Medium for a true semibold look.
            fontWeight: 500,
            letterSpacing: "-0.01em",
            color: INFOGRAPHIC_INK,
            margin: 0,
            maxWidth: 560,
            alignSelf: "center",
            textAlign: "center",
            // max 2 lines, ellipsis on overflow
            display: "-webkit-box",
            WebkitBoxOrient: "vertical",
            WebkitLineClamp: 2,
            overflow: "hidden",
          }}
        >
          {title}
        </h1>
      )}

      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          gap: BLOCK_GAP,
          paddingTop: showTitle ? 32 : 0,
          paddingBottom: showFootnote ? 24 : 0,
        }}
      >
        {blocks.map((block) => (
          <BlockRenderer
            key={block.id}
            block={block}
            scale={isProduct ? 1.15 : 1}
            maxHeight={productAvailableBlockHeight}
            format={format}
          />
        ))}
      </div>

      {showFootnote && (
        <p
          style={{
            fontFamily: INFOGRAPHIC_SANS,
            margin: 0,
            marginTop: "auto",
            fontSize: isProduct ? 14 : 12,
            lineHeight: 1.5,
            color: isProduct ? INFOGRAPHIC_INK : INFOGRAPHIC_INK_MUTED,
            maxWidth: 560,
            alignSelf: "center",
            textAlign: "center",
            // max 1 line, ellipsis on overflow
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {renderedFootnote}
        </p>
      )}
    </div>
  );
}
