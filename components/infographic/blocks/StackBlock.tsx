import type { InfographicBlock, InfographicFormat } from "@/lib/types/infographic";
import type { CSSProperties } from "react";
import { INFOGRAPHIC_BLOCK_LIMITS, stackMaxLayers } from "@/lib/infographic-block-limits";
import { brand } from "@/lib/tokens/brand";

type Props = { block: Extract<InfographicBlock, { type: "stack" }>; scale?: number; format?: InfographicFormat };

/** Dark elements (pills, highlight bands, callout). */
const DARK = brand.color.ink;
/** Subtle band container grouping a non-highlight layer's cells (lightest gray). */
const BAND = brand.color.infographic.lightBand;
/** Cell fill on a light band. */
const CELL = brand.color.infographic.paper;
/** Cell fill inside a highlight (dark) band — one step lighter than DARK. */
const HL_CELL = brand.color.inkMutedStrong;
/** Muted text on a light background. */
const MUTED = brand.color.inkMutedStrong;
/** Muted text on a dark background. */
const LIGHT_ON_DARK = brand.color.infographic.lightOnDark;
/** Connector line — warm gray, same as the node-list connectors. */
const CONNECTOR = brand.color.infographic.connector;

/**
 * Layered stack / architecture diagram. Top-to-bottom bands, each with a dark
 * pill header (+ optional caption) and an optional row of white cells. A layer
 * can be highlighted (dark band + accent pill). Vertical connectors join the
 * bands; an optional dark callout sits below the whole stack.
 *
 * Covers architecture-style diagrams (e.g. AMP Architecture, Production Voice
 * Agent Architecture, The Agent Era Stack, the org-chart flow).
 */
export function StackBlock({ block, scale = 1, format }: Props) {
  const fs = (n: number) => Math.round(n * scale);
  const isProduct = format === "product";
  const clamp = (lines: number): CSSProperties =>
    isProduct
      ? {
          display: "-webkit-box",
          WebkitBoxOrient: "vertical",
          WebkitLineClamp: lines,
          overflow: "hidden",
          overflowWrap: "anywhere",
        }
      : { overflowWrap: "anywhere" };
  const maxLayers = stackMaxLayers(format ?? "blog");
  const layers = (block.layers ?? [])
    .slice(0, maxLayers)
    .map((layer) => ({
      ...layer,
      cells: layer.cells?.slice(0, INFOGRAPHIC_BLOCK_LIMITS.stackCellsPerLayer),
    }));
  const showConnectors = block.connectors !== false;

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "stretch" }}>
      {layers.map((layer, i) => {
        const cells = layer.cells ?? [];
        const hl = !!layer.highlight;
        return (
          <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "stretch" }}>
            {/* Connector above every band except the first. */}
            {i > 0 && showConnectors && (
              <div style={{ alignSelf: "center", width: 2, height: 18, background: CONNECTOR }} />
            )}

            {/* Band */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 12,
                padding: cells.length > 0 ? "18px 18px" : "14px 18px",
                borderRadius: 14,
                background: hl ? DARK : cells.length > 0 ? BAND : "transparent",
                boxSizing: "border-box",
                overflow: "hidden",
              }}
            >
              {/* Header pill */}
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4, maxWidth: "100%" }}>
                <span
                  style={{
                    maxWidth: "100%",
                    fontSize: fs(12),
                    fontWeight: 700,
                    letterSpacing: "0.06em",
                    textTransform: "uppercase",
                    color: hl ? DARK : brand.color.white,
                    background: hl ? "var(--ig-accent)" : DARK,
                    padding: "5px 14px",
                    borderRadius: 8,
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {layer.title}
                </span>
                {layer.caption && (
                  <span
                    style={{
                      fontSize: fs(12),
                      color: hl ? LIGHT_ON_DARK : MUTED,
                      textAlign: "center",
                      lineHeight: 1.4,
                      maxWidth: "100%",
                      ...clamp(2),
                    }}
                  >
                    {layer.caption}
                  </span>
                )}
              </div>

              {/* Cells row */}
              {cells.length > 0 && (
                <div style={{ display: "flex", gap: 12, width: "100%", alignItems: "stretch", minWidth: 0 }}>
                  {cells.map((cell, j) => (
                    <div
                      key={j}
                      style={{
                        flex: 1,
                        minWidth: 0,
                        background: hl ? HL_CELL : CELL,
                        borderRadius: 10,
                        padding: "12px 14px",
                        display: "flex",
                        flexDirection: "column",
                        gap: 3,
                        textAlign: "center",
                        alignItems: "center",
                        overflow: "hidden",
                      }}
                    >
                      <span
                        style={{
                          maxWidth: "100%",
                          fontSize: fs(14),
                          fontWeight: 600,
                          color: hl ? CELL : DARK,
                          lineHeight: 1.3,
                          ...clamp(2),
                        }}
                      >
                        {cell.title}
                      </span>
                      {cell.desc && (
                        <span
                          style={{
                            fontSize: fs(12),
                            color: hl ? LIGHT_ON_DARK : MUTED,
                            lineHeight: 1.4,
                            maxWidth: "100%",
                            ...clamp(2),
                          }}
                        >
                          {cell.desc}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        );
      })}

      {/* Optional dark callout below the stack. */}
      {block.callout && (
        <div
          style={{
            marginTop: 18,
            background: DARK,
            borderRadius: 12,
            padding: "14px 18px",
            color: CELL,
            fontSize: fs(13),
            lineHeight: 1.5,
            textAlign: "center",
          }}
        >
          {block.callout}
        </div>
      )}
    </div>
  );
}
