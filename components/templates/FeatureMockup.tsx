"use client";

import { useRef, useEffect, memo } from "react";
import type { ChatMessage, TextBlock, ActionsBlock, ProductsBlock, ProductItem, ChecklistBlock, StatusBlock, VoiceBlock } from "@/lib/store";
import { computeCapacity } from "@/lib/canvas-capacity";
import { ChecklistStatusIcon } from "./checklist-status-icon";

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

const SIZES = {
  desktop: { width: 866, height: 660 },
  mobile:  { width: 344, height: 385 },
};

// ── ChatBubble — user 오른쪽 / ai 왼쪽 ───────────────────

const ChatBubble = memo(function ChatBubble({
  msg,
  appName,
  userName,
  userAvatarUrl,
  scale,
  br = 18,
  inlineButtons,
}: {
  msg: ChatMessage;   // caller guarantees block.type === "text"
  appName: string;
  userName?: string;
  userAvatarUrl?: string;
  scale: number;
  /** bubble border-radius factor (default 18; pass 14 for mobile) */
  br?: number;
  inlineButtons?: string[];  // bot 버블에 합쳐질 action buttons
}) {
  const isUser = msg.role === "user";
  const text = (msg.block as TextBlock).text;
  // Internal AI activity log — bot bubbles only
  const verifications = !isUser ? (msg.block as TextBlock).verifications : undefined;
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
      padding: `0 ${Math.round(14 * scale)}px`,
    }}>
      <div style={{
        maxWidth: "75%",
        borderRadius: Math.round(br * scale),
        padding: `${Math.round(10 * scale)}px ${Math.round(14 * scale)}px ${Math.round(12 * scale)}px`,
        background: "#ffffff",
        boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
      }}>
        {/* Avatar + sender name */}
        <div style={{ display: "flex", alignItems: "center", gap: Math.round(6 * scale), marginBottom: Math.round(5 * scale) }}>
          {isUser ? (
            displayAvatar
              ? /* eslint-disable-next-line @next/next/no-img-element */
                <img src={displayAvatar} alt={displayName}
                  style={{ width: av, height: av, borderRadius: "50%", objectFit: "cover", flexShrink: 0 }} />
              : <div style={{ width: av, height: av, borderRadius: "50%", background: "#CBD5E1", flexShrink: 0 }} />
          ) : (
            <div style={{ width: Math.round(10 * scale), height: Math.round(10 * scale), borderRadius: "50%", background: "#111", flexShrink: 0 }} />
          )}
          <span style={{ fontSize: 12 * fs, color: "#8C867E", lineHeight: 1 }}>
            {displayName}
          </span>
        </div>
        {/* Text */}
        <p style={{ fontSize: 15 * fs, lineHeight: 1.4, color: "#1a1a1a", margin: 0, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 15, WebkitBoxOrient: "vertical", overflowWrap: "anywhere", wordBreak: "break-word" }}>
          {text}
        </p>
        {/* Internal AI activity log footer (bot 전용) */}
        {verifications && verifications.length > 0 && (
          <div style={{ marginTop: Math.round(10 * scale) }}>
            <div style={{ borderTop: "1px solid #E5E7EB", marginBottom: Math.round(8 * scale) }} />
            <div style={{
              fontSize: 10.5 * fs, fontWeight: 600, letterSpacing: "0.03em",
              color: "#111111", textTransform: "uppercase", marginBottom: Math.round(6 * scale),
            }}>
              AI agent activity log
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: Math.round(5 * scale) }}>
              {verifications.map((v, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: Math.round(7 * scale), fontSize: 12 * fs, color: "#736E68", lineHeight: 1.35 }}>
                  <div style={{ width: Math.round(7 * scale), height: Math.round(7 * scale), borderRadius: "50%", background: "#A8A39B", flexShrink: 0 }} />
                  <span style={{ minWidth: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{v}</span>
                </div>
              ))}
            </div>
          </div>
        )}
        {/* Inline action buttons (bot 전용) */}
        {inlineButtons && (
          <div style={{ display: "flex", flexDirection: "column", gap: Math.round(6 * scale), marginTop: Math.round(10 * scale) }}>
            {inlineButtons.map((btn, i) => (
              <div key={i} style={{
                borderRadius: 12,
                padding: `${Math.round(11 * scale)}px ${Math.round(16 * scale)}px`,
                textAlign: "center",
                fontSize: 14 * fs,
                color: "#3B3530",
                background: "#E5E3DF",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}>{btn}</div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
});

// ── ActionButtons ─────────────────────────────────────────

const ActionButtons = memo(function ActionButtons({ msg, scale, appName, br = 18 }: { msg: ChatMessage; scale: number; appName: string; br?: number }) {
  const { buttons, text } = msg.block as ActionsBlock;
  const fs = Math.min(1, scale);
  return (
    <div style={{
      display: "flex",
      justifyContent: "flex-start",
      padding: `0 ${Math.round(14 * scale)}px`,
    }}>
      <div style={{
        width: "75%",
        minWidth: "75%",
        maxWidth: "75%",
        borderRadius: Math.round(br * scale),
        padding: `${Math.round(10 * scale)}px ${Math.round(14 * scale)}px ${Math.round(12 * scale)}px`,
        background: "#ffffff",
        boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
      }}>
        {/* Bot dot + name */}
        <div style={{ display: "flex", alignItems: "center", gap: Math.round(6 * scale), marginBottom: Math.round(6 * scale) }}>
          <div style={{ width: Math.round(10 * scale), height: Math.round(10 * scale), borderRadius: "50%", background: "#111", flexShrink: 0 }} />
          <span style={{ fontSize: 12 * fs, color: "#8C867E", lineHeight: 1 }}>{appName}</span>
        </div>
        {/* Text (optional) */}
        {text && (
          <p style={{ fontSize: 15 * fs, lineHeight: 1.4, color: "#1a1a1a", margin: `0 0 ${Math.round(8 * scale)}px`, overflowWrap: "anywhere", wordBreak: "break-word" }}>
            {text}
          </p>
        )}
        {/* Buttons */}
        <div style={{ display: "flex", flexDirection: "column", gap: Math.round(6 * scale) }}>
          {buttons.map((btn, i) => (
            <div key={i} style={{
              borderRadius: 12,
              padding: `${Math.round(11 * scale)}px ${Math.round(16 * scale)}px`,
              textAlign: "center",
              fontSize: 14 * fs,
              color: "#3B3530",
              background: "#E5E3DF",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}>
              {btn}
            </div>
          ))}
        </div>
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
      borderRadius: 12,
      overflow: "hidden",
      background: "#ffffff",
      boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
      flexShrink: 0,
      ...(cardWidth ? { width: cardWidth } : {}),
    }}>
      {item.img
        ? /* eslint-disable-next-line @next/next/no-img-element */
          <img src={item.img} alt={item.name}
            style={{ width: "100%", aspectRatio: "2/1", objectFit: "cover", display: "block" }} />
        : <div style={{
            width: "100%", aspectRatio: "2/1",
            background: "#E5E7EB",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <span style={{ fontSize: 11 * fs, color: "#9CA3AF" }}>Image</span>
          </div>
      }
      <div style={{ padding: `6px ${Math.round(10 * scale)}px 8px` }}>
        <p style={{
          fontSize: 14 * fs, fontWeight: 700, color: "#111",
          lineHeight: 1.3, margin: `0 0 ${Math.round(3 * scale)}px`,
          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
        }}>{item.name}</p>
        <p style={{
          fontSize: 12 * fs, color: "#8C867E",
          margin: "0 0 4px",
          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
        }}>{item.sub}</p>
        {/* CTA — gray fill, no border. 라벨이 비면 버튼 자체를 숨김 */}
        {item.cta.trim() && (
          <div style={{
            fontSize: 13 * fs, fontWeight: 600, color: "#3B3530",
            background: "#E5E3DF", borderRadius: 8,
            padding: "6px 0", textAlign: "center",
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
      <div style={{ padding: `0 ${px}px` }}>
        <div style={{
          borderRadius: Math.round(br * scale),
          overflow: "hidden",
          background: "#ffffff",
          boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
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
                  background: "#E5E7EB",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <span style={{ fontSize: 11 * fs, color: "#9CA3AF" }}>Image</span>
                </div>
            }
          </div>
          {/* Content — right */}
          <div style={{
            flex: 1,
            padding: `${Math.round(10 * scale)}px ${Math.round(12 * scale)}px`,
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            gap: Math.round(8 * scale),
          }}>
            <div>
              <p style={{
                fontSize: 14 * fs, fontWeight: 700, color: "#111",
                lineHeight: 1.3, margin: `0 0 ${Math.round(3 * scale)}px`,
                overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
              }}>{item.name}</p>
              <p style={{
                fontSize: 12 * fs, color: "#8C867E", margin: 0,
                overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
              }}>{item.sub}</p>
            </div>
            <div style={{
              fontSize: 13 * fs, fontWeight: 600, color: "#3B3530",
              background: "#E5E3DF", borderRadius: 8,
              padding: `${Math.round(6 * scale)}px 0`, textAlign: "center",
            }}>{item.cta}</div>
          </div>
        </div>
      </div>
    );
  }

  // ── 2 items → 2-column grid ─────────────────────────────
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap, padding: `0 ${px}px` }}>
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
    <div style={{ display: "flex", justifyContent: "flex-start", padding: `0 ${Math.round(14 * scale)}px` }}>
      <div style={{
        maxWidth: "90%",
        borderRadius: Math.round(br * scale),
        padding: `${Math.round(10 * scale)}px ${Math.round(14 * scale)}px ${Math.round(12 * scale)}px`,
        background: "#ffffff",
        boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
      }}>
        <div style={{ display: "flex", flexDirection: "column", gap }}>
          {items.map((item) => (
            <div key={item.id} style={{ display: "flex", alignItems: "center", gap: Math.round(8 * scale) }}>

              {/* Status icon */}
              <ChecklistStatusIcon status={item.status} size={sz} />

              {/* Channel badge (optional) */}
              {item.badge && (
                <span style={{
                  fontSize: 10 * fs, fontWeight: 600, color: "#3B3530",
                  background: "#E5E3DF", borderRadius: Math.round(6 * scale),
                  padding: `${Math.round(3 * scale)}px ${Math.round(7 * scale)}px`,
                  letterSpacing: "0.03em", textTransform: "uppercase",
                  lineHeight: 1, flexShrink: 0,
                }}>
                  {item.badge}
                </span>
              )}

              {/* Label */}
              <span style={{
                fontSize: 13 * fs,
                color: item.status === "done" ? "#736E68" : "#1a1a1a",
                textDecoration: item.status === "done" ? "line-through" : "none",
                lineHeight: 1.35,
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
  success: { bg: "#F2FF66", textColor: "#111111" },
  warning: { bg: "#FF5E69", textColor: "#FFFFFF" },
} as const;

const StatusPill = memo(function StatusPill({ msg, scale }: { msg: ChatMessage; scale: number }) {
  const { label, variant } = msg.block as StatusBlock;
  const fs = Math.min(1, scale);
  const { bg, textColor } = STATUS_PILL_STYLES[variant];
  const iconSize = Math.round(14 * scale);

  return (
    <div style={{ display: "flex", justifyContent: "flex-start", padding: `0 ${Math.round(14 * scale)}px` }}>
      <div style={{
        display: "inline-flex",
        alignItems: "flex-start",
        gap: Math.round(6 * scale),
        maxWidth: "75%",
        background: bg,
        borderRadius: Math.round(18 * scale),
        padding: `${Math.round(7 * scale)}px ${Math.round(14 * scale)}px`,
      }}>
        {/* Icon — 체크리스트 done 아이콘과 동일 (채워진 검은 원 + 흰 글리프) */}
        <div style={{ marginTop: Math.round(1 * scale), flexShrink: 0 }}>
          {variant === "success" ? (
            <ChecklistStatusIcon status="done" size={iconSize} />
          ) : (
            <div style={{
              width: iconSize, height: iconSize, borderRadius: "50%", background: "#ffffff",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <span style={{ fontSize: iconSize * 0.62, color: "#FF5E69", lineHeight: 1, fontWeight: 700 }}>!</span>
            </div>
          )}
        </div>
        {/* Label */}
        <span style={{
          fontSize: 12 * fs, color: textColor, fontWeight: 500,
          minWidth: 0, overflowWrap: "anywhere", lineHeight: 1.35,
          display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden",
        }}>
          {label}
        </span>
      </div>
    </div>
  );
});

// ── VoiceCard — voice AI mockup ───────────────────────────

const VoiceCard = memo(function VoiceCard({ block, width }: { block: VoiceBlock; width: number }) {
  const scale = Math.min(1.1, width / 520);
  const fs = Math.min(1, scale);

  const cardBase = {
    width,
    borderRadius: Math.round(28 * scale),
    background: "rgba(255,255,255,0.30)",
    backdropFilter: "blur(20px)",
    WebkitBackdropFilter: "blur(20px)",
    border: "1px solid rgba(255,255,255,0.50)",
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
        <div style={{ display: "flex", flexDirection: "column", gap: Math.round(12 * scale), padding: `${Math.round(4 * scale)}px ${Math.round(16 * scale)}px ${Math.round(8 * scale)}px` }}>
          {block.eyebrow && (
            <span style={{ fontSize: 24 * fs, fontWeight: 500, color: "#292016", lineHeight: 1.4, letterSpacing: "-0.01em", display: "block", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{block.eyebrow}</span>
          )}
          <span style={{
            fontSize: 24 * fs, fontWeight: 400, color: "#292016", lineHeight: 1.4, letterSpacing: "-0.01em",
            overflowWrap: "anywhere", wordBreak: "break-word",
            display: "-webkit-box", WebkitBoxOrient: "vertical", WebkitLineClamp: 8, overflow: "hidden",
          }}>{block.transcript}</span>
        </div>
      </div>
    );
  }

  // quote style
  return (
    <div style={{ ...cardBase, padding: `${Math.round(44 * scale)}px ${Math.round(40 * scale)}px`, display: "flex", flexDirection: "column", alignItems: "center", gap: Math.round(24 * scale) }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/preview/voice_icon.png" alt="" width={Math.round(56 * scale)} height={Math.round(56 * scale)} style={{ borderRadius: "50%", display: "block" }} />
      <span style={{
        fontFamily: '"Serrif", Georgia, "Times New Roman", serif',
        fontSize: 24 * fs, fontWeight: 500, color: "#292016", lineHeight: 1.45, textAlign: "center", letterSpacing: "-0.01em",
        maxWidth: "100%", overflowWrap: "anywhere", wordBreak: "break-word",
        display: "-webkit-box", WebkitBoxOrient: "vertical", WebkitLineClamp: 8, overflow: "hidden",
      }}>
        {"“" + block.transcript + "”"}
      </span>
      {block.caption && (
        <span style={{ fontSize: 15 * fs, color: "#4a4a4a", textAlign: "center" }}>{block.caption}</span>
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
  const bubbleR = isMobileFrame ? 14 : 18;
  const frameR  = isMobileFrame ? 26 : 32;

  const frameRef = useRef<HTMLDivElement>(null);
  // Keep refs to callbacks so the effect never needs to re-run for them.
  const onOverflowChangeRef  = useRef(onOverflowChange);
  const onCapacityChangeRef  = useRef(onCapacityChange);
  const canvasHeightRef      = useRef(canvasHeight);
  onOverflowChangeRef.current = onOverflowChange;
  onCapacityChangeRef.current = onCapacityChange;
  canvasHeightRef.current     = canvasHeight;

  useEffect(() => {
    const el = frameRef.current;
    if (!el) return;
    const check = () => {
      // 12px 여백이 사라지기 직전에 감지 — strict (+ 여유 없음)
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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // mount-only: DOM size changes handled by ResizeObserver

  return (
    <div
      ref={frameRef}
      style={{
        width,
        ...(maxHeight !== undefined ? { maxHeight, overflow: "hidden" } : {}),
        borderRadius: frameR,
        background: "rgba(255,255,255,0.25)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        border: "1px solid rgba(255,255,255,0.3)",
        boxShadow: "0 8px 32px rgba(0,0,0,0.08)",
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
          padding: `${Math.round(16 * scale)}px ${Math.round(16 * scale)}px ${Math.round(14 * scale)}px`,
          borderBottom: "1px solid rgba(255,255,255,0.3)",
          flexShrink: 0,
        }}>
          <span style={{ fontSize: 17 * Math.min(1, scale), fontWeight: 500, color: "#111", letterSpacing: "-0.02em" }}>
            {appName}
          </span>
          <span style={{
            position: "absolute",
            right: 16,
            fontSize: 16 * Math.min(1, scale),
            color: "#6B7280",
            letterSpacing: "0.15em",
            lineHeight: 1,
          }}>
            ···
          </span>
        </div>
      )}

      {/* Message list */}
      {/* padding-bottom 12px 고정: scale에 무관하게 항상 12px 여백 보장 */}
      <div style={{ display: "flex", flexDirection: "column", gap: Math.round(8 * scale), padding: `${Math.round(14 * scale)}px 0 12px` }}>
        {messages.map((msg, idx) => {
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
          return null;
        })}
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

  // 최소 여백: 데스크탑 70px 고정, 모바일은 캔버스 비율 기반(~8%)
  const MIN_PAD = isMobile ? 24 : 70;
  const vPad    = Math.max(MIN_PAD, Math.round(canvasH * 0.08)); // 상단/하단
  const hPadL   = isSplit
    ? Math.max(MIN_PAD, Math.round(canvasW * 0.05))              // split 왼쪽
    : MIN_PAD;                                                   // center/mobile

  // 프레임 너비
  const maxFrameW = canvasW - hPadL - MIN_PAD;
  const frameW = Math.min(
    isMobile
      ? Math.round(canvasW * 0.72)
      : isCenter
        ? Math.round(canvasW * 0.42)
        : Math.round(canvasW * 0.39),
    maxFrameW,
  );

  // 보이스 카드는 고정 width 530, 항상 중앙 정렬 (캔버스를 넘지 않게 cap)
  const voiceFrameW = Math.min(530, canvasW - MIN_PAD * 2);

  const justifyContent = isVoice ? "center" : isSplit ? "flex-start" : "center";
  // 모바일은 가변 높이 — maxFrameH 제약 없음
  const maxFrameH = isMobile ? undefined : canvasH - vPad * 2;

  // 패딩 문자열 (공통)
  // split: 좌하단 기준 80px 여백 (top/right 0 — 클리핑으로 처리)
  const framePadding = isSplit
    ? `0 0 ${MIN_PAD}px ${hPadL}px`
    : `${vPad}px ${hPadL}px`;

  // 모바일: paddingBottom 최소 48px (배경이 마지막 버블 아래 48px까지 채워지도록)
  const contentPadding = isMobile ? `${vPad}px ${hPadL}px 48px` : framePadding;

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
          ? "linear-gradient(to right, rgba(255,255,255,0.1) 0%, transparent 55%)"
          : "rgba(255,255,255,0.02)",
      }} />

      {/* Phone frame container
          모바일: gridArea 1/1 — 콘텐츠 높이가 그리드 셀을 결정, 배경이 따라 늘어남
          데스크탑: absolute + inset 0 (고정 캔버스 내 배치) */}
      <div style={{
        ...(isMobile
          ? { gridArea: "1/1", position: "relative", zIndex: 1, minHeight: canvasH, boxSizing: "border-box" as const }
          : { position: "absolute", inset: 0 }),
        display: "flex",
        alignItems: isVoice ? "center" : isSplit ? "flex-end" : "center",
        justifyContent,
        padding: contentPadding,
      }}>
        {voice ? (
          <VoiceCard block={voice} width={voiceFrameW} />
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
