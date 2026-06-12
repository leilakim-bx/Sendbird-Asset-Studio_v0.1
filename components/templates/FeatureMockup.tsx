"use client";

import { useRef, useEffect, memo } from "react";
import type { ChatMessage, TextBlock, ActionsBlock, ProductsBlock, ProductItem, ChecklistBlock, StatusBlock, VoiceBlock, ItineraryBlock } from "@/lib/store";
import { computeCapacity } from "@/lib/canvas-capacity";
import { EXPORT_SIZES } from "@/lib/template-registry";
import { brand, brandPx } from "@/lib/tokens/brand";
import { ChecklistStatusIcon } from "./checklist-status-icon";
import { itineraryIcon } from "./itinerary-icons";

// ── Props ─────────────────────────────────────────────────

export type FeatureMockupProps = {
  layout: "center" | "split";
  exportSize: "desktop" | "mobile";
  backgroundUrl: string;
  appName: string;
  messages: ChatMessage[];
  width?: number;
  height?: number;
  onOverflowChange?: (isOverflowing: boolean) => void;
  /** Preview 전용: 캔버스 포화 여부 콜백 (off-screen export 인스턴스에는 전달 안 함) */
  onCapacityChange?: (isFull: boolean) => void;
  /** Global user profile — overrides per-message sender / avatar */
  userName?: string;
  userAvatarUrl?: string;
};

// ── Canvas dimensions ─────────────────────────────────────
// 단일 소스: lib/template-registry 의 EXPORT_SIZES (preview/export 치수 불일치 방지)
const SIZES = EXPORT_SIZES;
const CHAT = brand.color.chat;
const BRAND = brand.color;
const RADIUS = brand.radius;
const ELEVATION = brand.elevation;
const FONT = brand.font;
const TYPE = brand.typography.size;
const LINE = brand.typography.lineHeight;
const SPACE = brand.spacing;
const STROKE = brand.stroke;
const cssPx = brandPx;

// ── ActionPills — shared button column ───────────────────
// Used by BOTH the bot text bubble (TextBlock.buttons add-on) and the
// standalone ActionButtons card, so the two never visually diverge.
function ActionPills({ buttons, scale, mt = 0 }: { buttons: string[]; scale: number; mt?: number }) {
  const fs = Math.min(1, scale);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: Math.round(6 * scale), marginTop: mt }}>
      {buttons.map((btn, i) => (
        <div key={i} style={{
          borderRadius: RADIUS[12],
          padding: `${cssPx(Math.round(11 * scale))} ${cssPx(Math.round(16 * scale))}`,
          textAlign: "center",
          fontSize: TYPE[14] * fs,
          color: CHAT.actionText,
          background: CHAT.actionBg,
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
        }}>{btn}</div>
      ))}
    </div>
  );
}

// ── ChatBubble — user 오른쪽 / ai 왼쪽 ───────────────────

const ChatBubble = memo(function ChatBubble({
  msg,
  appName,
  userName,
  userAvatarUrl,
  scale,
  br = 18,
}: {
  msg: ChatMessage;   // caller guarantees block.type === "text"
  appName: string;
  userName?: string;
  userAvatarUrl?: string;
  scale: number;
  /** bubble border-radius factor (default 18; pass 14 for mobile) */
  br?: number;
}) {
  const isUser = msg.role === "user";
  const text = (msg.block as TextBlock).text;
  // Internal AI activity log — bot bubbles only
  const verifications = !isUser ? (msg.block as TextBlock).verifications : undefined;
  // Action buttons add-on — bot bubbles only
  const buttons = !isUser ? (msg.block as TextBlock).buttons : undefined;
  // Global profile takes priority; fall back to per-message values
  const displayName   = isUser ? (userName   || msg.sender) : appName;
  const displayAvatar = isUser ? (userAvatarUrl || msg.avatar) : undefined;
  const av = Math.round(22 * scale);
  // 폰트는 원래 크기(scale 1.0)에 캡 — 레이아웃만 scale 확대 적용
  const fs = Math.min(1, scale);

  return (
    <div style={{
      display: "flex",
      justifyContent: isUser ? "flex-end" : "flex-start",
      padding: `0 ${cssPx(Math.round(14 * scale))}`,
    }}>
      <div style={{
        maxWidth: "75%",
        // With buttons, match the standalone ActionButtons card's fixed 75% width
        // so "text + buttons" and a standalone buttons card read identically even
        // when the text is short.
        ...(buttons && buttons.length > 0 ? { width: "75%", minWidth: "75%" } : {}),
        borderRadius: Math.round(br * scale),
        padding: `${cssPx(Math.round(10 * scale))} ${cssPx(Math.round(14 * scale))} ${cssPx(Math.round(12 * scale))}`,
        background: CHAT.bubble,
        boxShadow: ELEVATION[2],
      }}>
        {/* Avatar + sender name */}
        <div style={{ display: "flex", alignItems: "center", gap: Math.round(6 * scale), marginBottom: Math.round(5 * scale) }}>
          {isUser ? (
            displayAvatar
              ? /* eslint-disable-next-line @next/next/no-img-element */
                <img src={displayAvatar} alt={displayName}
                  style={{ width: av, height: av, borderRadius: RADIUS.circle, objectFit: "cover", flexShrink: 0 }} />
              : <div style={{ width: av, height: av, borderRadius: RADIUS.circle, background: CHAT.avatarFallback, flexShrink: 0 }} />
          ) : (
            <div style={{ width: Math.round(10 * scale), height: Math.round(10 * scale), borderRadius: RADIUS.circle, background: CHAT.botIndicator, flexShrink: 0 }} />
          )}
          <span style={{ fontSize: TYPE[12] * fs, color: CHAT.bodyMuted, lineHeight: LINE.tight }}>
            {displayName}
          </span>
        </div>
        {/* Text */}
        <p style={{ fontSize: TYPE[15] * fs, lineHeight: LINE.copy, color: CHAT.body, margin: 0, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 15, WebkitBoxOrient: "vertical", overflowWrap: "anywhere", wordBreak: "break-word" }}>
          {text}
        </p>
        {/* Internal AI activity log footer (bot 전용) */}
        {verifications && verifications.length > 0 && (
          <div style={{ marginTop: Math.round(10 * scale) }}>
            <div style={{ borderTop: `${STROKE.hairline} solid ${BRAND.border.hairline}`, marginBottom: Math.round(8 * scale) }} />
            <div style={{
              fontSize: TYPE[10.5] * fs, fontWeight: FONT.weight.semibold, letterSpacing: "0.03em",
              color: CHAT.body, textTransform: "uppercase", marginBottom: Math.round(6 * scale),
            }}>
              AI agent activity log
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: Math.round(5 * scale) }}>
              {verifications.map((v, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: Math.round(7 * scale), fontSize: TYPE[12] * fs, color: CHAT.doneText, lineHeight: LINE.relaxed }}>
                  <div style={{ width: Math.round(7 * scale), height: Math.round(7 * scale), borderRadius: RADIUS.circle, background: CHAT.activityDot, flexShrink: 0 }} />
                  <span style={{ minWidth: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{v}</span>
                </div>
              ))}
            </div>
          </div>
        )}
        {/* Action buttons add-on (bot 전용) */}
        {buttons && buttons.length > 0 && (
          <ActionPills buttons={buttons} scale={scale} mt={Math.round(10 * scale)} />
        )}
      </div>
    </div>
  );
});

// ── ActionButtons ─────────────────────────────────────────

const ActionButtons = memo(function ActionButtons({ msg, scale, appName, br = 18 }: { msg: ChatMessage; scale: number; appName: string; br?: number }) {
  const { buttons } = msg.block as ActionsBlock;
  const fs = Math.min(1, scale);
  return (
    <div style={{
      display: "flex",
      justifyContent: "flex-start",
      padding: `0 ${cssPx(Math.round(14 * scale))}`,
    }}>
      <div style={{
        width: "75%",
        minWidth: "75%",
        maxWidth: "75%",
        borderRadius: Math.round(br * scale),
        padding: `${cssPx(Math.round(10 * scale))} ${cssPx(Math.round(14 * scale))} ${cssPx(Math.round(12 * scale))}`,
        background: CHAT.bubble,
        boxShadow: ELEVATION[2],
      }}>
        {/* Bot dot + name */}
        <div style={{ display: "flex", alignItems: "center", gap: Math.round(6 * scale), marginBottom: Math.round(6 * scale) }}>
          <div style={{ width: Math.round(10 * scale), height: Math.round(10 * scale), borderRadius: RADIUS.circle, background: CHAT.botIndicator, flexShrink: 0 }} />
          <span style={{ fontSize: TYPE[12] * fs, color: CHAT.bodyMuted, lineHeight: LINE.tight }}>{appName}</span>
        </div>
        {/* Buttons (shared with the bot text bubble's add-on) */}
        <ActionPills buttons={buttons} scale={scale} />
      </div>
    </div>
  );
});

// ── ProductCards ──────────────────────────────────────────

/** Single product card (shared by grid + carousel layouts) */
function ProductCard({ item, scale, cardWidth }: { item: ProductItem; scale: number; cardWidth?: number }) {
  const fs = Math.min(1, scale);
  return (
    <div style={{
      borderRadius: RADIUS[12],
      overflow: "hidden",
      background: CHAT.bubble,
      boxShadow: ELEVATION[2],
      flexShrink: 0,
      ...(cardWidth ? { width: cardWidth } : {}),
    }}>
      {item.img
        ? /* eslint-disable-next-line @next/next/no-img-element */
          <img src={item.img} alt={item.name}
            style={{ width: "100%", aspectRatio: "2/1", objectFit: "cover", display: "block" }} />
        : <div style={{
            width: "100%", aspectRatio: "2/1",
            background: BRAND.border.hairline,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <span style={{ fontSize: TYPE[11] * fs, color: CHAT.placeholder }}>Image</span>
          </div>
      }
      <div style={{ padding: `${cssPx(SPACE[6])} ${cssPx(Math.round(10 * scale))} ${cssPx(SPACE[8])}` }}>
        <p style={{
          fontSize: TYPE[14] * fs, fontWeight: FONT.weight.bold, color: CHAT.body,
          lineHeight: LINE.body, margin: `0 0 ${cssPx(Math.round(3 * scale))}`,
          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
        }}>{item.name}</p>
        <p style={{
          fontSize: TYPE[12] * fs, color: CHAT.bodyMuted,
          margin: `0 0 ${cssPx(SPACE[4])}`,
          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
        }}>{item.sub}</p>
        {/* CTA — gray fill, no border. 라벨이 비면 버튼 자체를 숨김 */}
        {item.cta.trim() && (
          <div style={{
            fontSize: TYPE[13] * fs, fontWeight: FONT.weight.semibold, color: CHAT.actionText,
            background: CHAT.actionBg, borderRadius: RADIUS[8],
            // Scale follows the original desktop/mobile height tuning.
            padding: `${cssPx(Math.round(7 * scale))} 0`, textAlign: "center",
          }}>{item.cta}</div>
        )}
      </div>
    </div>
  );
}

const ProductCards = memo(function ProductCards({ msg, scale, br = 18 }: { msg: ChatMessage; scale: number; br?: number }) {
  const { items } = msg.block as ProductsBlock;
  const px = Math.round(16 * scale);
  const gap = Math.round(8 * scale);

  // ── 3+ items → horizontal carousel ──────────────────────
  if (items.length >= 3) {
    // Each card is ~55% of container width so the next card peeks
    const cardW = Math.round(130 * scale);
    const bubblePad = Math.round(14 * scale);
    return (
      // Outer wrapper carries the left offset — padding on overflow-x containers
      // is unreliable across browsers, so we separate layout from scroll.
      <div style={{ paddingLeft: bubblePad }}>
        <div style={{
          display: "flex",
          flexDirection: "row",
          gap,
          overflowX: "auto",
          scrollSnapType: "x mandatory",
          WebkitOverflowScrolling: "touch",
          scrollbarWidth: "none",
          msOverflowStyle: "none",
        }}>
          {items.map((item, i) => (
            <div key={i} style={{ scrollSnapAlign: "start", flexShrink: 0 }}>
              <ProductCard item={item} scale={scale} cardWidth={cardW} />
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ── 1 item → wide horizontal card ──────────────────────
  if (items.length === 1) {
    const item = items[0];
    const fs = Math.min(1, scale);
    return (
      <div style={{ padding: `0 ${cssPx(px)}` }}>
        <div style={{
          borderRadius: Math.round(br * scale),
          overflow: "hidden",
          background: CHAT.bubble,
          boxShadow: ELEVATION[2],
          display: "flex",
          flexDirection: "row",
          maxWidth: "82%",
        }}>
          {/* Image — left. absolute로 깔아 콘텐츠가 카드 높이를 결정하게 함
              (이미지 원본 비율이 카드 높이를 끌어올리는 것 방지) */}
          <div style={{ width: "42%", flexShrink: 0, alignSelf: "stretch", position: "relative", minHeight: Math.round(72 * scale) }}>
            {item.img
              ? /* eslint-disable-next-line @next/next/no-img-element */
                <img src={item.img} alt={item.name}
                  style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
              : <div style={{
                  position: "absolute", inset: 0,
                  background: BRAND.border.hairline,
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <span style={{ fontSize: TYPE[11] * fs, color: CHAT.placeholder }}>Image</span>
                </div>
            }
          </div>
          {/* Content — right */}
          <div style={{
            flex: 1,
            padding: `${cssPx(Math.round(10 * scale))} ${cssPx(Math.round(12 * scale))}`,
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            gap: Math.round(8 * scale),
          }}>
            <div>
              <p style={{
                fontSize: TYPE[14] * fs, fontWeight: FONT.weight.bold, color: CHAT.body,
                lineHeight: LINE.body, margin: `0 0 ${cssPx(Math.round(3 * scale))}`,
                overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
              }}>{item.name}</p>
              <p style={{
                fontSize: TYPE[12] * fs, color: CHAT.bodyMuted, margin: 0,
                overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
              }}>{item.sub}</p>
            </div>
            <div style={{
              fontSize: TYPE[13] * fs, fontWeight: FONT.weight.semibold, color: CHAT.actionText,
              background: CHAT.actionBg, borderRadius: RADIUS[8],
              // Scale follows the original desktop/mobile height tuning.
              padding: `${cssPx(Math.round(7 * scale))} 0`, textAlign: "center",
            }}>{item.cta}</div>
          </div>
        </div>
      </div>
    );
  }

  // ── 2 items → 2-column grid ─────────────────────────────
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap, padding: `0 ${cssPx(px)}` }}>
      {items.map((item, i) => (
        <ProductCard key={i} item={item} scale={scale} />
      ))}
    </div>
  );
});

// ── ChecklistItems ────────────────────────────────────────

const ChecklistItems = memo(function ChecklistItems({ msg, scale, br = 18 }: { msg: ChatMessage; scale: number; br?: number }) {
  const { items } = msg.block as ChecklistBlock;
  const fs = Math.min(1, scale);
  const sz = Math.round(16 * scale);   // icon circle size
  const gap = Math.round(8 * scale);

  return (
    <div style={{ display: "flex", justifyContent: "flex-start", padding: `0 ${cssPx(Math.round(14 * scale))}` }}>
      <div style={{
        maxWidth: "90%",
        borderRadius: Math.round(br * scale),
        padding: `${cssPx(Math.round(10 * scale))} ${cssPx(Math.round(14 * scale))} ${cssPx(Math.round(12 * scale))}`,
        background: CHAT.bubble,
        boxShadow: ELEVATION[2],
      }}>
        <div style={{ display: "flex", flexDirection: "column", gap }}>
          {items.map((item) => (
            <div key={item.id} style={{ display: "flex", alignItems: "center", gap: Math.round(8 * scale) }}>

              {/* Status icon */}
              <ChecklistStatusIcon
                status={item.status}
                size={sz}
                fill={CHAT.botIndicator}
                check={BRAND.white}
                arc={CHAT.body}
                border={CHAT.pending}
              />

              {/* Channel badge (optional) */}
              {item.badge && (
                <span style={{
                  fontSize: TYPE[10] * fs, fontWeight: FONT.weight.semibold, color: CHAT.actionText,
                  background: CHAT.actionBg, borderRadius: Math.round(6 * scale),
                  padding: `${cssPx(Math.round(3 * scale))} ${cssPx(Math.round(7 * scale))}`,
                  letterSpacing: "0.03em", textTransform: "uppercase",
                  lineHeight: LINE.tight, flexShrink: 0,
                }}>
                  {item.badge}
                </span>
              )}

              {/* Label */}
              <span style={{
                fontSize: TYPE[13] * fs,
                color: item.status === "done" ? CHAT.doneText : CHAT.body,
                textDecoration: item.status === "done" ? "line-through" : "none",
                lineHeight: LINE.relaxed,
                minWidth: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
              }}>
                {item.label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
});

// ── StatusPill ────────────────────────────────────────────

const STATUS_PILL_STYLES = {
  success: { bg: BRAND.accent, textColor: CHAT.body },
  warning: { bg: CHAT.statusWarningBg, textColor: BRAND.white },
} as const;

const StatusPill = memo(function StatusPill({ msg, scale }: { msg: ChatMessage; scale: number }) {
  const { label, variant } = msg.block as StatusBlock;
  const fs = Math.min(1, scale);
  const { bg, textColor } = STATUS_PILL_STYLES[variant];
  const iconSize = Math.round(14 * scale);

  return (
    <div style={{ display: "flex", justifyContent: "flex-start", padding: `0 ${cssPx(Math.round(14 * scale))}` }}>
      <div style={{
        display: "inline-flex",
        alignItems: "flex-start",
        gap: Math.round(6 * scale),
        maxWidth: "75%",
        background: bg,
        borderRadius: Math.round(18 * scale),
        padding: `${cssPx(Math.round(7 * scale))} ${cssPx(Math.round(14 * scale))}`,
      }}>
        {/* Icon — 체크리스트 done 아이콘과 동일 (채워진 검은 원 + 흰 글리프) */}
        <div style={{ marginTop: Math.round(1 * scale), flexShrink: 0 }}>
          {variant === "success" ? (
            <ChecklistStatusIcon status="done" size={iconSize} fill={CHAT.botIndicator} check={BRAND.white} />
          ) : (
            <div style={{
              width: iconSize, height: iconSize, borderRadius: RADIUS.circle, background: CHAT.bubble,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <span style={{ fontSize: iconSize * 0.62, color: CHAT.statusWarningBg, lineHeight: LINE.tight, fontWeight: FONT.weight.bold }}>!</span>
            </div>
          )}
        </div>
        {/* Label */}
        <span style={{
          fontSize: TYPE[12] * fs, color: textColor, fontWeight: FONT.weight.medium,
          minWidth: 0, overflowWrap: "anywhere", lineHeight: LINE.relaxed,
          display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden",
        }}>
          {label}
        </span>
      </div>
    </div>
  );
});

// ── ItineraryCard — grouped schedule ──────────────────────

const ItineraryCard = memo(function ItineraryCard({
  msg,
  scale,
  appName,
  br = 18,
  isMobile = false,
}: {
  msg: ChatMessage;
  scale: number;
  appName: string;
  br?: number;
  isMobile?: boolean;
}) {
  const { intro, groups, cta } = msg.block as ItineraryBlock;
  const fs = Math.min(1, scale);
  const iconSize = Math.round(24 * scale);

  return (
    <div style={{ display: "flex", justifyContent: "flex-start", padding: `0 ${cssPx(Math.round(14 * scale))}` }}>
      <div style={{
        width: "85%",
        borderRadius: Math.round(br * scale),
        padding: `${cssPx(Math.round(10 * scale))} ${cssPx(Math.round(14 * scale))} ${cssPx(Math.round(10 * scale))}`,
        background: CHAT.bubble,
        boxShadow: ELEVATION[2],
      }}>
        {/* Bot dot + name */}
        <div style={{ display: "flex", alignItems: "center", gap: Math.round(6 * scale), marginBottom: Math.round(8 * scale) }}>
          <div style={{ width: Math.round(10 * scale), height: Math.round(10 * scale), borderRadius: RADIUS.circle, background: CHAT.botIndicator, flexShrink: 0 }} />
          <span style={{ fontSize: TYPE[12] * fs, color: CHAT.bodyMuted, lineHeight: LINE.tight }}>
            {appName}
          </span>
        </div>

        {intro && intro.trim() && (
          <p style={{
            margin: `0 0 ${cssPx(Math.round(14 * scale))}`,
            fontSize: (isMobile ? TYPE[13] : TYPE[15]) * fs,
            lineHeight: LINE.copy,
            color: CHAT.body,
            overflow: "hidden",
            display: "-webkit-box",
            WebkitLineClamp: 3,
            WebkitBoxOrient: "vertical",
            overflowWrap: "anywhere",
            wordBreak: "break-word",
          }}>
            {intro}
          </p>
        )}

        {groups.map((g, gi) => {
          const last = gi === groups.length - 1;
          const groupLabel = g.label?.trim() ?? "";
          const hasGroupLabel = groupLabel.length > 0;
          const nextGroupLabel = groups[gi + 1]?.label?.trim() ?? "";
          const hasNextGroupLabel = nextGroupLabel.length > 0;
          const groupGap = !last && !hasGroupLabel && !hasNextGroupLabel
            ? Math.round(8 * scale)
            : Math.round(12 * scale);
          return (
            <div key={g.id} style={{ marginBottom: last ? Math.round(10 * scale) : groupGap }}>
              {/* Group header */}
              {hasGroupLabel && (
                <div style={{ fontSize: TYPE[13] * fs, fontWeight: FONT.weight.bold, color: CHAT.body, marginBottom: Math.round(7 * scale) }}>
                  {groupLabel}
                </div>
              )}
              {/* Rows */}
              <div style={{ display: "flex", flexDirection: "column", gap: Math.round(8 * scale) }}>
                {g.items.map((it) => {
                  const Icon = itineraryIcon(it.icon);
                  return (
                    <div key={it.id} style={{
                      display: "flex", alignItems: "center", gap: Math.round(13 * scale),
                      background: CHAT.rowBg, borderRadius: Math.round(12 * scale),
                      padding: `${cssPx(Math.round(10 * scale))} ${cssPx(Math.round(15 * scale))}`,
                    }}>
                      <Icon size={iconSize} strokeWidth={1.6} color={CHAT.iconMuted} style={{ flexShrink: 0 }} />
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <div style={{
                          fontSize: (isMobile ? TYPE[13] : TYPE[15]) * fs, fontWeight: FONT.weight.bold, color: CHAT.body, lineHeight: LINE.normal,
                          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                        }}>{it.title}</div>
                        {it.sub && (
                          <div style={{
                            fontSize: TYPE[13] * fs, color: CHAT.bodyMuted, lineHeight: LINE.body, marginTop: Math.round(2 * scale),
                            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                          }}>{it.sub}</div>
                        )}
                      </div>
                      {it.badge && it.badge.trim() && (
                        <div style={{
                          flexShrink: 0,
                          maxWidth: Math.round((isMobile ? 80 : 108) * scale),
                          borderRadius: Math.round(7 * scale),
                          padding: `${cssPx(Math.round(5 * scale))} ${cssPx(Math.round(9 * scale))}`,
                          background: it.badgeTone === "accent" ? BRAND.accent : CHAT.actionBg,
                          color: CHAT.body,
                          fontSize: (isMobile ? TYPE[10.5] : TYPE[12]) * fs,
                          fontWeight: FONT.weight.bold,
                          lineHeight: LINE.tight,
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}>
                          {it.badge}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}

        {/* Footer CTA — black, inside the card (itinerary only) */}
        {cta && cta.trim() && (
          <div style={{
            background: CHAT.body, color: BRAND.white,
            borderRadius: Math.round(10 * scale),
            padding: `${cssPx(Math.round((isMobile ? 10 : 12) * scale))} 0`, textAlign: "center",
            fontSize: isMobile ? TYPE[11] : TYPE[15] * fs, fontWeight: FONT.weight.bold,
            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
          }}>{cta}</div>
        )}
      </div>
    </div>
  );
});

// ── VoiceCard — voice AI mockup ───────────────────────────

const VoiceCard = memo(function VoiceCard({ block, width, isMobile }: { block: VoiceBlock; width: number; isMobile: boolean }) {
  const scale = Math.min(1.1, width / 520);
  const fs = Math.min(1, scale);

  // 텍스트 base 크기 — 모바일은 키운 값(28/18), 데스크탑은 원래 값(24/15). fs로 폭에 맞춰 추가 스케일.
  const tBase = isMobile ? TYPE[28] : TYPE[24]; // transcript / eyebrow
  const cBase = isMobile ? TYPE[18] : TYPE[15]; // caption

  const cardBase = {
    width,
    borderRadius: Math.round(28 * scale),
    background: CHAT.glassVoiceBg,
    backdropFilter: CHAT.glassBlur,
    WebkitBackdropFilter: CHAT.glassBlur,
    border: `${STROKE.hairline} solid ${CHAT.glassBorderStrong}`,
    boxSizing: "border-box" as const,
    // flex min-width:auto가 줄바꿈 불가 문자열의 min-content를 따라 카드를 늘리는 것 방지
    minWidth: 0,
    maxWidth: width,
  };

  if (block.style === "player") {
    return (
      <div style={{ ...cardBase, padding: Math.round(36 * scale), display: "flex", flexDirection: "column", gap: Math.round(26 * scale) }}>
        {/* Player bar — fixed image */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/preview/voice_playerbar.png" alt="" style={{ width: "100%", height: "auto", display: "block" }} />
        {/* Body */}
        <div style={{ display: "flex", flexDirection: "column", gap: Math.round(12 * scale), padding: `${cssPx(Math.round(4 * scale))} ${cssPx(Math.round(16 * scale))} ${cssPx(Math.round(8 * scale))}` }}>
          {block.eyebrow && (
            <span style={{ fontSize: tBase * fs, fontWeight: FONT.weight.medium, color: BRAND.ink, lineHeight: LINE.copy, letterSpacing: "-0.01em", display: "block", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{block.eyebrow}</span>
          )}
          <span style={{
            fontSize: tBase * fs, fontWeight: FONT.weight.regular, color: BRAND.ink, lineHeight: LINE.copy, letterSpacing: "-0.01em",
            overflowWrap: "anywhere", wordBreak: "break-word",
            display: "-webkit-box", WebkitBoxOrient: "vertical", WebkitLineClamp: 8, overflow: "hidden",
          }}>{block.transcript}</span>
        </div>
      </div>
    );
  }

  // quote style
  return (
    <div style={{ ...cardBase, padding: `${cssPx(Math.round(44 * scale))} ${cssPx(Math.round(40 * scale))}`, display: "flex", flexDirection: "column", alignItems: "center", gap: Math.round(24 * scale) }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/preview/voice_icon.png" alt="" width={Math.round(56 * scale)} height={Math.round(56 * scale)} style={{ borderRadius: RADIUS.circle, display: "block" }} />
      <span style={{
        fontFamily: FONT.serif,
        fontSize: tBase * fs, fontWeight: FONT.weight.medium, color: BRAND.ink, lineHeight: LINE.loose, textAlign: "center", letterSpacing: "-0.01em",
        maxWidth: "100%", overflowWrap: "anywhere", wordBreak: "break-word",
        display: "-webkit-box", WebkitBoxOrient: "vertical", WebkitLineClamp: 8, overflow: "hidden",
      }}>
        {"“" + block.transcript + "”"}
      </span>
      {block.caption && (
        <span style={{ fontSize: cBase * fs, color: CHAT.caption, textAlign: "center" }}>{block.caption}</span>
      )}
    </div>
  );
});

// ── PhoneFrame — glassmorphism ────────────────────────────

const PhoneFrame = memo(function PhoneFrame({
  appName,
  messages,
  width,
  maxHeight,
  onOverflowChange,
  onCapacityChange,
  canvasHeight,
  userName,
  userAvatarUrl,
}: {
  appName: string;
  messages: ChatMessage[];
  width: number;
  maxHeight?: number;          // undefined = 모바일 가변 높이 (제약 없음)
  onOverflowChange?: (isOverflowing: boolean) => void;
  /** Preview 전용: 캔버스 포화 여부 콜백 */
  onCapacityChange?: (isFull: boolean) => void;
  /** 포화 측정 기준 캔버스 높이 (px, 모바일 전용) */
  canvasHeight?: number;
  userName?: string;
  userAvatarUrl?: string;
}) {
  // maxHeight가 없으면(모바일 가변) 너비 비율만 적용
  // 1.08 캡: frameW/ratio 확대분만큼 scale이 소폭 올라갈 수 있게 허용
  const scale = maxHeight !== undefined
    ? Math.min(1.08, width / 329, maxHeight / 500)
    : Math.min(1.08, width / 329);
  // 모바일(가변 높이)은 살짝 작은 r값 사용
  const isMobileFrame = maxHeight === undefined;
  const bubbleR = isMobileFrame ? 17 : 18;
  const frameR  = isMobileFrame ? 26 : 32;

  const frameRef = useRef<HTMLDivElement>(null);
  // Keep refs to callbacks so the effect never needs to re-run for them.
  const onOverflowChangeRef  = useRef(onOverflowChange);
  const onCapacityChangeRef  = useRef(onCapacityChange);
  const canvasHeightRef      = useRef(canvasHeight);

  useEffect(() => {
    onOverflowChangeRef.current = onOverflowChange;
    onCapacityChangeRef.current = onCapacityChange;
    canvasHeightRef.current = canvasHeight;
  }, [onOverflowChange, onCapacityChange, canvasHeight]);

  useEffect(() => {
    const el = frameRef.current;
    if (!el) return;
    const check = () => {
      // Fixed bottom reserve disappears right before overflow.
      const overflows = el.scrollHeight > el.clientHeight;
      onOverflowChangeRef.current?.(overflows);

      // 캔버스 포화 측정 (모바일 preview 전용 — canvasHeight 전달 시에만 동작)
      const ch = canvasHeightRef.current;
      if (ch !== undefined && onCapacityChangeRef.current) {
        const { isFull } = computeCapacity(el.scrollHeight, ch);
        onCapacityChangeRef.current(isFull);
      }
    };
    check();
    // ResizeObserver fires whenever the content height changes (messages added/removed,
    // text wraps, images load) — no need to list `messages` as a dep here.
    const ro = new ResizeObserver(check);
    ro.observe(el);
    return () => ro.disconnect();
  }, []); // mount-only: DOM size changes handled by ResizeObserver

  return (
    // 클리핑 래퍼: border-radius + overflow:hidden 으로 자식(backdrop-filter 포함)을
    // 라운드 모서리에 맞춰 클리핑. element 자신의 backdrop-filter는 overflow로 못 막지만
    // (export 시 사각형으로 샘), 부모가 자식으로서 클리핑하면 제대로 잘린다.
    // box-shadow는 클립 밖에 그려져야 하므로 래퍼에 둔다.
    <div
      style={{
        width,
        borderRadius: frameR,
        overflow: "hidden",
        boxShadow: ELEVATION[3],
        ...(maxHeight !== undefined ? { maxHeight } : {}),
      }}
    >
    <div
      ref={frameRef}
      style={{
        width: "100%",
        ...(maxHeight !== undefined ? { maxHeight, overflow: "hidden" } : { overflow: "hidden" }),
        borderRadius: frameR,
        background: CHAT.glassBg,
        backdropFilter: CHAT.glassBlur,
        WebkitBackdropFilter: CHAT.glassBlur,
        border: `${STROKE.hairline} solid ${CHAT.glassBorder}`,
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Header — 데스크탑만 표시 */}
      {maxHeight !== undefined && (
        <div style={{
          position: "relative",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: `${cssPx(Math.round(16 * scale))} ${cssPx(Math.round(16 * scale))} ${cssPx(Math.round(14 * scale))}`,
          borderBottom: `${STROKE.hairline} solid ${CHAT.glassBorder}`,
          flexShrink: 0,
        }}>
          <span style={{ fontSize: TYPE[17] * Math.min(1, scale), fontWeight: FONT.weight.medium, color: CHAT.body, letterSpacing: "-0.02em" }}>
            {appName}
          </span>
          <span style={{
            position: "absolute",
            right: 16,
            fontSize: TYPE[16] * Math.min(1, scale),
            color: CHAT.neutralText,
            letterSpacing: "0.15em",
            lineHeight: 1,
          }}>
            ···
          </span>
        </div>
      )}

      {/* Message list */}
      {/* Bottom padding stays fixed regardless of scale. */}
      <div style={{ display: "flex", flexDirection: "column", gap: Math.round(8 * scale), padding: `${cssPx(Math.round(14 * scale))} 0 ${cssPx(SPACE[12])}` }}>
        {messages.map((msg) => {
          // Guard: localStorage에 저장된 구버전 메시지 등 block 없는 항목 방어
          if (!msg?.block) return null;
          const type = msg.block.type;

          if (type === "text") {
            return <ChatBubble key={msg.id} msg={msg} appName={appName} userName={userName} userAvatarUrl={userAvatarUrl} scale={scale} br={bubbleR} />;
          }
          if (type === "actions")   return <ActionButtons  key={msg.id} msg={msg} scale={scale} appName={appName} br={bubbleR} />;
          if (type === "products")  return <ProductCards   key={msg.id} msg={msg} scale={scale} br={bubbleR} />;
          if (type === "checklist") return <ChecklistItems key={msg.id} msg={msg} scale={scale} br={bubbleR} />;
          if (type === "status")    return <StatusPill     key={msg.id} msg={msg} scale={scale} />;
          if (type === "itinerary") return <ItineraryCard  key={msg.id} msg={msg} scale={scale} appName={appName} br={bubbleR} isMobile={isMobileFrame} />;
          return null;
        })}
      </div>

    </div>
    </div>
  );
});

// ── Main Component ────────────────────────────────────────

export const FeatureMockup = memo(function FeatureMockup({
  layout,
  exportSize,
  backgroundUrl,
  appName,
  messages,
  width,
  height,
  onOverflowChange,
  onCapacityChange,
  userName,
  userAvatarUrl,
}: FeatureMockupProps) {
  const size   = SIZES[exportSize];
  const canvasW = width  ?? size.width;
  const canvasH = height ?? size.height;
  const isMobile = exportSize === "mobile";
  const isCenter = layout === "center";

  const isSplit = !isMobile && !isCenter;

  // Voice AI: 단일 voice 블록이면 채팅 프레임 대신 보이스 카드를 렌더
  const voice = messages[0]?.block?.type === "voice" ? (messages[0].block as VoiceBlock) : null;
  const isVoice = voice !== null;
  // None: 메시지가 없으면 프레임 없이 배경만 렌더
  const isEmpty = !isVoice && messages.length === 0;

  // 보이스 카드 / 빈 상태는 overflow/capacity 측정 대상이 아님 — 전환 시 stale 경고 제거
  useEffect(() => {
    if (isVoice || isEmpty) {
      onOverflowChange?.(false);
      onCapacityChange?.(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isVoice, isEmpty]);

  // Minimum edge reserve: fixed on desktop, proportional on mobile.
  const MIN_PAD = isMobile ? 24 : 70;
  const vPad    = Math.max(MIN_PAD, Math.round(canvasH * 0.08)); // 상단/하단
  const hPadL   = isSplit
    ? Math.max(MIN_PAD, Math.round(canvasW * 0.05))              // split 왼쪽
    : MIN_PAD;                                                   // center/mobile

  // Frame width follows the original canvas ratios.
  const maxFrameW = canvasW - hPadL - MIN_PAD;
  const frameW = Math.min(
    isMobile
      ? Math.round(canvasW * 0.73)
      : isCenter
        ? Math.round(canvasW * 0.4273)
        : Math.round(canvasW * 0.39),
    maxFrameW,
  );

  // 보이스 카드 폭: 모바일은 270 고정, 데스크탑은 530 (캔버스를 넘지 않게 cap)
  const voiceFrameW = isMobile ? 270 : Math.min(530, canvasW - MIN_PAD * 2);

  // 정렬: split은 좌하단, 그 외(center/mobile)는 중앙. 보이스 카드도 다른 카드와 동일하게 따름.
  const justifyContent = isSplit ? "flex-start" : "center";
  // 모바일은 가변 높이 — maxFrameH 제약 없음
  const maxFrameH = isMobile ? undefined : canvasH - vPad * 2;

  // 패딩 문자열 (공통)
  // Split layout anchors to the bottom-left reserve.
  const framePadding = isSplit
    ? `0 0 ${cssPx(MIN_PAD)} ${cssPx(hPadL)}`
    : `${cssPx(vPad)} ${cssPx(hPadL)}`;

  // Mobile keeps extra bottom reserve below the last bubble.
  const contentPadding = isMobile ? `${cssPx(vPad)} ${cssPx(hPadL)} ${cssPx(SPACE[48])}` : framePadding;

  return (
    // 모바일: CSS Grid 겹침 → 배경이 콘텐츠 높이에 맞춰 자동으로 늘어남
    // 데스크탑: 고정 height + overflow hidden (클리핑)
    <div style={{
      width: canvasW,
      ...(isMobile
        ? { display: "grid" }
        : { position: "relative", height: canvasH, overflow: "hidden" }),
    }}>

      {/* Background photo */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={backgroundUrl}
        alt=""
        style={{
          ...(isMobile
            ? { gridArea: "1/1", width: "100%", height: "100%", display: "block" }
            : { position: "absolute", inset: 0, width: "100%", height: "100%" }),
          objectFit: "cover",
          objectPosition: isSplit ? "right center" : "center",
        }}
      />

      {/* Subtle gradient veil */}
      <div style={{
        ...(isMobile
          ? { gridArea: "1/1" }
          : { position: "absolute", inset: 0 }),
        background: isSplit
          ? CHAT.veilSplit
          : CHAT.veilCenter,
      }} />

      {/* Phone frame container
          모바일: gridArea 1/1 — 콘텐츠 높이가 그리드 셀을 결정, 배경이 따라 늘어남
          데스크탑: absolute + inset 0 (고정 캔버스 내 배치) */}
      <div style={{
        ...(isMobile
          ? { gridArea: "1/1", position: "relative", zIndex: 1, minHeight: canvasH, boxSizing: "border-box" as const }
          : { position: "absolute", inset: 0 }),
        display: "flex",
        alignItems: isSplit ? "flex-end" : "center",
        justifyContent,
        padding: contentPadding,
      }}>
        {voice ? (
          <VoiceCard block={voice} width={voiceFrameW} isMobile={isMobile} />
        ) : isEmpty ? null : (
          <PhoneFrame
            appName={appName}
            messages={messages}
            width={frameW}
            maxHeight={maxFrameH}
            onOverflowChange={onOverflowChange}
            onCapacityChange={isMobile ? onCapacityChange : undefined}
            canvasHeight={isMobile ? canvasH : undefined}
            userName={userName}
            userAvatarUrl={userAvatarUrl}
          />
        )}
      </div>

    </div>
  );
});
