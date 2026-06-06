import type { CSSProperties } from "react";
import type { InfographicContent } from "@/lib/types/infographic";
import {
  INFOGRAPHIC_BG_HEX,
  INFOGRAPHIC_ACCENT_HEX,
  INFOGRAPHIC_INK,
  INFOGRAPHIC_INK_MUTED,
} from "@/lib/types/infographic";
import { BlockRenderer } from "./blocks/BlockRenderer";

type Props = {
  content: InfographicContent;
  className?: string;
  /** For export: rendered at absolute pixel size (no transform:scale applied here). */
  exportMode?: boolean;
};

const PRODUCT = { width: 866, height: 660 };
const BLOG = { width: 664, minHeight: 480 };

/**
 * Flat/branded infographic canvas. Always renders at full pixel size — the
 * editor shell applies transform:scale to the preview wrapper. Background and
 * accent are written as resolved hex (and `--ig-accent` custom property) so the
 * html-to-image export clone never depends on :root CSS variables resolving.
 */
export function InfographicCanvas({ content, className, exportMode }: Props) {
  const { format, bg, accent, title, footnote, blocks } = content;
  const isProduct = format === "product";

  const rootStyle = {
    boxSizing: "border-box",
    width: isProduct ? PRODUCT.width : BLOG.width,
    ...(isProduct ? { height: PRODUCT.height } : { minHeight: BLOG.minHeight }),
    background: INFOGRAPHIC_BG_HEX[bg],
    color: INFOGRAPHIC_INK,
    padding: 56,
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
    fontFamily: '"Helvetica Now Text", "Helvetica Neue", Helvetica, Arial, sans-serif',
    // Resolved accent hex exposed to child blocks via custom property.
    "--ig-accent": INFOGRAPHIC_ACCENT_HEX[accent],
  } as unknown as CSSProperties;

  return (
    <div className={className} style={rootStyle} data-export={exportMode ? "1" : undefined}>
      {title && (
        <h1
          style={{
            fontFamily: '"Serrif", Georgia, "Times New Roman", serif',
            fontSize: 36,
            lineHeight: 1.1,
            fontWeight: 500,
            letterSpacing: "-0.01em",
            color: INFOGRAPHIC_INK,
            margin: 0,
            maxWidth: 560,
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
          paddingTop: title ? 32 : 0,
          paddingBottom: footnote ? 24 : 0,
        }}
      >
        {blocks.map((block) => (
          <BlockRenderer key={block.id} block={block} />
        ))}
      </div>

      {footnote && (
        <p
          style={{
            margin: 0,
            marginTop: "auto",
            fontSize: 12,
            lineHeight: 1.5,
            color: INFOGRAPHIC_INK_MUTED,
            maxWidth: 560,
          }}
        >
          {footnote}
        </p>
      )}
    </div>
  );
}
