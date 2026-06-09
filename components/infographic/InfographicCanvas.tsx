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
// Blog height is free, so keep the minimum modest — short content (e.g. a lone
// stat with no title/footnote) shouldn't get padded out to a tall box.
const BLOG = { width: 664, minHeight: 360 };

/**
 * Flat/branded infographic canvas. Always renders at full pixel size — the
 * editor shell applies transform:scale to the preview wrapper. Background and
 * accent are written as resolved hex (and `--ig-accent` custom property) so the
 * html-to-image export clone never depends on :root CSS variables resolving.
 */
export function InfographicCanvas({ content, className, exportMode }: Props) {
  const { format, bg, accent, title, footnote, blocks } = content;
  const isProduct = format === "product";
  // Product format always uses the fixed warm-gray background (#F7F5F0),
  // regardless of the stored bg (which only applies to the blog format).
  const effectiveBg = isProduct ? "warmgray" : bg;
  // Stat is a centered standalone number — it never carries a title/footnote.
  const isStat = blocks[0]?.type === "stat";
  // Title & footnote section toggle (undefined/true = shown)
  const showHeader = content.showTitle !== false && !isStat;
  const showTitle = showHeader && !!title;
  const showFootnote = showHeader && !!footnote;

  const rootStyle = {
    boxSizing: "border-box",
    width: isProduct ? PRODUCT.width : BLOG.width,
    ...(isProduct ? { height: PRODUCT.height } : { minHeight: BLOG.minHeight }),
    background: INFOGRAPHIC_BG_HEX[effectiveBg],
    color: INFOGRAPHIC_INK,
    // Blog format trims vertical padding (free height) so short content sits tighter.
    paddingLeft: 56,
    paddingRight: 56,
    paddingTop: isProduct ? 56 : 40,
    paddingBottom: isProduct ? 56 : 40,
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
            color: "#0E1017",
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
          gap: 28,
          paddingTop: showTitle ? 32 : 0,
          paddingBottom: showFootnote ? 24 : 0,
        }}
      >
        {blocks.map((block) => (
          <BlockRenderer key={block.id} block={block} scale={isProduct ? 1.15 : 1} />
        ))}
      </div>

      {showFootnote && (
        <p
          style={{
            fontFamily: INFOGRAPHIC_SANS,
            margin: 0,
            marginTop: "auto",
            fontSize: 12,
            lineHeight: 1.5,
            color: INFOGRAPHIC_INK_MUTED,
            maxWidth: 560,
            alignSelf: "center",
            textAlign: "center",
            // max 1 line, ellipsis on overflow
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {footnote}
        </p>
      )}
    </div>
  );
}
