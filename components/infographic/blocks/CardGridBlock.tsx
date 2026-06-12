import type { InfographicBlock, InfographicFormat } from "@/lib/types/infographic";
import { INFOGRAPHIC_INK, INFOGRAPHIC_INK_MUTED, INFOGRAPHIC_SERIF } from "@/lib/types/infographic";
import { brand } from "@/lib/tokens/brand";

type Props = {
  block: Extract<InfographicBlock, { type: "card-grid" }>;
  scale?: number;
  maxHeight?: number;
  format?: InfographicFormat;
};

const CARD_BG = brand.color.infographic.paper;
const HAIRLINE = brand.color.infographic.grid;
const BADGE_BG = brand.color.infographic.badge;
const MAX_CARDS = 4;

export function CardGridBlock({ block, scale = 1, maxHeight, format }: Props) {
  const rawCards = block.cards.slice(0, MAX_CARDS);
  const showBadges = rawCards.some((card) => !!card.badge?.trim());
  const cards = rawCards.map((card, i) => ({
    ...card,
    badge: showBadges ? card.badge?.trim() || `Panel ${i + 1}` : "",
  }));
  const fs = (n: number) => Math.round(n * scale);
  const isSingleCard = cards.length === 1;
  const isProduct = format === "product";
  const isProductSingleCard = isSingleCard && isProduct;
  const columns = cards.length === 1 ? "minmax(0, 1fr)" : cards.length === 3 ? "repeat(3, minmax(0, 1fr))" : "repeat(2, minmax(0, 1fr))";
  const maxWidth = cards.length === 3 ? 700 : cards.length === 1 ? (isProduct ? 560 : 500) : 700;
  const bodyFontSize = fs(cards.length === 3 ? 11 : 12);
  const bodyLineHeight = bodyFontSize * 1.38;
  const productSingleCardClamp = maxHeight
    ? Math.min(
        12,
        Math.max(
          5,
          Math.floor(
            (maxHeight - 52 - (showBadges ? 28 : 0) - fs(18) * 1.12 * 2 - 23) /
              bodyLineHeight,
          ),
        ),
      )
    : 8;
  const bodyLineClamp = isSingleCard
    ? (isProduct ? productSingleCardClamp : 8)
    : 4;

  return (
    <div
      style={{
        width: `min(100%, ${maxWidth}px)`,
        margin: "0 auto",
        display: "grid",
        gridTemplateColumns: columns,
        gap: 16,
        alignItems: "stretch",
      }}
    >
      {cards.map((card, i) => (
        <div
          key={i}
          style={{
            minHeight: isSingleCard ? (isProduct ? 210 : 176) : 136,
            background: CARD_BG,
            borderRadius: 10,
            padding: cards.length === 3 ? "24px" : isProductSingleCard ? "30px 34px" : "26px 28px",
            boxSizing: "border-box",
            display: "flex",
            flexDirection: "column",
            maxHeight: isProductSingleCard && maxHeight ? maxHeight : undefined,
            overflow: "hidden",
          }}
        >
          {card.badge && (
            <span
              style={{
                alignSelf: "flex-start",
                marginBottom: 10,
                padding: "5px 9px",
                borderRadius: 5,
                background: BADGE_BG,
                color: INFOGRAPHIC_INK,
                fontSize: fs(10),
                lineHeight: 1,
                fontWeight: 600,
                letterSpacing: "0.04em",
                textTransform: "uppercase",
                whiteSpace: "nowrap",
                maxWidth: "100%",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {card.badge}
            </span>
          )}
          <h2
            style={{
              fontFamily: INFOGRAPHIC_SERIF,
              margin: 0,
              color: brand.color.black,
              fontSize: fs(18),
              lineHeight: 1.12,
              fontWeight: 600,
              display: "-webkit-box",
              WebkitBoxOrient: "vertical",
              WebkitLineClamp: 2,
              overflow: "hidden",
            }}
          >
            {card.title}
          </h2>
          <div style={{ height: 1, background: HAIRLINE, margin: "10px 0 11px" }} />
          <p
            style={{
              margin: 0,
              color: INFOGRAPHIC_INK_MUTED,
              fontSize: bodyFontSize,
              lineHeight: 1.38,
              display: "-webkit-box",
              WebkitBoxOrient: "vertical",
              WebkitLineClamp: bodyLineClamp,
              overflow: "hidden",
            }}
          >
            {card.body}
          </p>
        </div>
      ))}
    </div>
  );
}
