"use client";

import { useRef, useEffect, memo } from "react";
import type { ChatMessage, TextBlock, ActionsBlock, ProductsBlock, ChecklistBlock, StatusBlock } from "@/lib/store";

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
  inlineButtons,
}: {
  msg: ChatMessage;   // caller guarantees block.type === "text"
  appName: string;
  userName?: string;
  userAvatarUrl?: string;
  scale: number;
  inlineButtons?: string[];  // bot 버블에 합쳐질 action buttons
}) {
  const isUser = msg.role === "user";
  const text = (msg.block as TextBlock).text;
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
        // 버튼 포함 시 전체 너비 사용, 텍스트만이면 75% 캡
        ...(inlineButtons ? { width: "100%" } : { maxWidth: "75%" }),
        borderRadius: Math.round(18 * scale),
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
          <span style={{ fontSize: 12 * fs, color: "#999", lineHeight: 1 }}>
            {displayName}
          </span>
        </div>
        {/* Text */}
        <p style={{ fontSize: 15 * fs, lineHeight: 1.4, color: "#1a1a1a", margin: 0 }}>
          {text}
        </p>
        {/* Inline action buttons (bot 전용) */}
        {inlineButtons && (
          <div style={{ display: "flex", flexDirection: "column", gap: Math.round(6 * scale), marginTop: Math.round(10 * scale) }}>
            {inlineButtons.map((btn, i) => (
              <div key={i} style={{
                borderRadius: 12,
                padding: `${Math.round(11 * scale)}px ${Math.round(16 * scale)}px`,
                textAlign: "center",
                fontSize: 14 * fs,
                color: "#374151",
                background: "#F3F4F6",
              }}>{btn}</div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
});

// ── ActionButtons ─────────────────────────────────────────

const ActionButtons = memo(function ActionButtons({ msg, scale, appName }: { msg: ChatMessage; scale: number; appName: string }) {
  const { buttons } = msg.block as ActionsBlock;
  const fs = Math.min(1, scale);
  return (
    <div style={{
      display: "flex",
      justifyContent: "flex-start",
      padding: `0 ${Math.round(14 * scale)}px`,
    }}>
      <div style={{
        width: "100%",
        borderRadius: Math.round(18 * scale),
        padding: `${Math.round(10 * scale)}px ${Math.round(12 * scale)}px ${Math.round(12 * scale)}px`,
        background: "#ffffff",
        boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
      }}>
        {/* Bot dot + name */}
        <div style={{ display: "flex", alignItems: "center", gap: Math.round(6 * scale), marginBottom: Math.round(8 * scale) }}>
          <div style={{ width: Math.round(10 * scale), height: Math.round(10 * scale), borderRadius: "50%", background: "#111", flexShrink: 0 }} />
          <span style={{ fontSize: 12 * fs, color: "#999", lineHeight: 1 }}>{appName}</span>
        </div>
        {/* Buttons */}
        <div style={{ display: "flex", flexDirection: "column", gap: Math.round(6 * scale) }}>
          {buttons.map((btn, i) => (
            <div key={i} style={{
              borderRadius: 12,
              padding: `${Math.round(11 * scale)}px ${Math.round(16 * scale)}px`,
              textAlign: "center",
              fontSize: 14 * fs,
              color: "#374151",
              background: "#F3F4F6",
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

const ProductCards = memo(function ProductCards({ msg, scale }: { msg: ChatMessage; scale: number }) {
  const { items } = msg.block as ProductsBlock;
  const fs = Math.min(1, scale);
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: Math.round(8 * scale), padding: `0 ${Math.round(16 * scale)}px` }}>
      {items.map((item, i) => (
        <div key={i} style={{
          borderRadius: 12,
          overflow: "hidden",
          background: "#ffffff",
          boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
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
          <div style={{ padding: `6px ${Math.round(10 * scale)}px 6px` }}>
            <p style={{
              fontSize: 14 * fs, fontWeight: 700, color: "#111",
              lineHeight: 1.3, margin: `0 0 ${Math.round(3 * scale)}px`,
              overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
            }}>{item.name}</p>
            <p style={{
              fontSize: 12 * fs, color: "#6B7280",
              margin: "0 0 4px",
              overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
            }}>{item.sub}</p>
            {/* CTA — gray fill, no border */}
            <div style={{
              fontSize: 13 * fs, fontWeight: 600, color: "#374151",
              background: "#F3F4F6", borderRadius: 8,
              padding: "4px 0", textAlign: "center",
            }}>{item.cta}</div>
          </div>
        </div>
      ))}
    </div>
  );
});

// ── ChecklistItems ────────────────────────────────────────

const ChecklistItems = memo(function ChecklistItems({ msg, scale }: { msg: ChatMessage; scale: number }) {
  const { items } = msg.block as ChecklistBlock;
  const fs = Math.min(1, scale);
  const sz = Math.round(16 * scale);   // icon circle size
  const gap = Math.round(8 * scale);

  return (
    <div style={{ padding: `0 ${Math.round(14 * scale)}px` }}>
      <div style={{
        borderRadius: Math.round(18 * scale),
        padding: `${Math.round(10 * scale)}px ${Math.round(14 * scale)}px ${Math.round(12 * scale)}px`,
        background: "#ffffff",
        boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
      }}>
        <div style={{ display: "flex", flexDirection: "column", gap }}>
          {items.map((item) => (
            <div key={item.id} style={{ display: "flex", alignItems: "center", gap: Math.round(8 * scale) }}>

              {/* Status icon */}
              {item.status === "done" && (
                <div style={{
                  width: sz, height: sz, borderRadius: "50%",
                  background: "#111", flexShrink: 0,
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  {/* white checkmark */}
                  <svg width={Math.round(9 * scale)} height={Math.round(9 * scale)} viewBox="0 0 9 7" fill="none">
                    <path d="M1 3.5L3.5 6L8 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
              )}
              {item.status === "in-progress" && (
                <div style={{
                  width: sz, height: sz, borderRadius: "50%",
                  border: `${Math.max(1, Math.round(1.5 * scale))}px dashed #9CA3AF`,
                  flexShrink: 0,
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  {/* partial arc suggests motion */}
                  <div style={{
                    width: Math.round(6 * scale), height: Math.round(6 * scale),
                    borderRadius: "50%",
                    border: `${Math.max(1, Math.round(1.5 * scale))}px solid transparent`,
                    borderTopColor: "#9CA3AF",
                  }} />
                </div>
              )}
              {item.status === "pending" && (
                <div style={{
                  width: sz, height: sz, borderRadius: "50%",
                  border: `${Math.max(1, Math.round(1.5 * scale))}px solid #D1D5DB`,
                  flexShrink: 0,
                }} />
              )}

              {/* Label */}
              <span style={{
                fontSize: 13 * fs,
                color: item.status === "done" ? "#9CA3AF" : "#1a1a1a",
                textDecoration: item.status === "done" ? "line-through" : "none",
                lineHeight: 1.35,
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
  success: { bg: "#F2FF66", icon: "✓", iconColor: "#111111", textColor: "#111111" },
  warning: { bg: "#2D1A00", icon: "!", iconColor: "#FBBF24", textColor: "#F9FAFB" },
} as const;

const StatusPill = memo(function StatusPill({ msg, scale }: { msg: ChatMessage; scale: number }) {
  const { label, variant } = msg.block as StatusBlock;
  const fs = Math.min(1, scale);
  const { bg, icon, iconColor, textColor } = STATUS_PILL_STYLES[variant];

  return (
    <div style={{ padding: `0 ${Math.round(14 * scale)}px` }}>
      <div style={{
        display: "inline-flex",
        alignItems: "center",
        gap: Math.round(6 * scale),
        background: bg,
        borderRadius: 999,
        padding: `${Math.round(7 * scale)}px ${Math.round(14 * scale)}px`,
      }}>
        {/* Icon badge */}
        <div style={{
          width: Math.round(14 * scale), height: Math.round(14 * scale),
          borderRadius: "50%",
          border: `1px solid ${iconColor}`,
          display: "flex", alignItems: "center", justifyContent: "center",
          flexShrink: 0,
        }}>
          <span style={{ fontSize: 9 * fs, color: iconColor, lineHeight: 1, fontWeight: 700 }}>
            {icon}
          </span>
        </div>
        {/* Label */}
        <span style={{ fontSize: 12 * fs, color: textColor, fontWeight: 500, whiteSpace: "nowrap" }}>
          {label}
        </span>
      </div>
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
  userName,
  userAvatarUrl,
}: {
  appName: string;
  messages: ChatMessage[];
  width: number;
  maxHeight?: number;          // undefined = 모바일 가변 높이 (제약 없음)
  onOverflowChange?: (isOverflowing: boolean) => void;
  userName?: string;
  userAvatarUrl?: string;
}) {
  // maxHeight가 없으면(모바일 가변) 너비 비율만 적용
  // 1.08 캡: frameW/ratio 확대분만큼 scale이 소폭 올라갈 수 있게 허용
  const scale = maxHeight !== undefined
    ? Math.min(1.08, width / 329, maxHeight / 500)
    : Math.min(1.08, width / 329);

  const frameRef = useRef<HTMLDivElement>(null);
  // Keep a ref to the callback so the effect never needs to re-run for it.
  const onOverflowChangeRef = useRef(onOverflowChange);
  onOverflowChangeRef.current = onOverflowChange;

  useEffect(() => {
    const el = frameRef.current;
    if (!el) return;
    const check = () => {
      // 12px 여백이 사라지기 직전에 감지 — strict (+ 여유 없음)
      const overflows = el.scrollHeight > el.clientHeight;
      onOverflowChangeRef.current?.(overflows);
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
        borderRadius: 32,
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

          // bot text 뒤에 오는 actions → 앞 버블에 합쳐졌으므로 skip
          if (type === "actions") {
            const prev = messages[idx - 1];
            if (prev?.role === "bot" && prev.block?.type === "text") return null;
          }

          if (type === "text") {
            // bot text 뒤에 actions가 있으면 inlineButtons로 전달
            const next = messages[idx + 1];
            const inlineButtons =
              msg.role === "bot" && next?.block?.type === "actions"
                ? (next.block as ActionsBlock).buttons
                : undefined;
            return <ChatBubble key={msg.id} msg={msg} appName={appName} userName={userName} userAvatarUrl={userAvatarUrl} scale={scale} inlineButtons={inlineButtons} />;
          }
          if (type === "actions")   return <ActionButtons  key={msg.id} msg={msg} scale={scale} appName={appName} />;
          if (type === "products")  return <ProductCards   key={msg.id} msg={msg} scale={scale} />;
          if (type === "checklist") return <ChecklistItems key={msg.id} msg={msg} scale={scale} />;
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
  userName,
  userAvatarUrl,
}: FeatureMockupProps) {
  const size   = SIZES[exportSize];
  const canvasW = width  ?? size.width;
  const canvasH = height ?? size.height;
  const isMobile = exportSize === "mobile";
  const isCenter = layout === "center";

  const isSplit = !isMobile && !isCenter;

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

  const justifyContent = isSplit ? "flex-start" : "center";
  // 모바일은 가변 높이 — maxFrameH 제약 없음
  const maxFrameH = isMobile ? undefined : canvasH - vPad * 2;

  // 패딩 문자열 (공통)
  // split: 좌하단 기준 80px 여백 (top/right 0 — 클리핑으로 처리)
  const framePadding = isSplit
    ? `0 0 ${MIN_PAD}px ${hPadL}px`
    : `${vPad}px ${hPadL}px`;

  return (
    // 모바일: min-height + overflow visible (가변 확장)
    // 데스크탑: 고정 height + overflow hidden (클리핑)
    <div style={{
      width: canvasW,
      position: "relative",
      ...(isMobile
        ? { minHeight: canvasH }
        : { height: canvasH, overflow: "hidden" }),
    }}>

      {/* Background photo */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={backgroundUrl}
        alt=""
        style={{
          position: "absolute", inset: 0,
          width: "100%", height: "100%",
          objectFit: "cover",
          objectPosition: isSplit ? "right center" : "center",
        }}
      />

      {/* Subtle gradient veil */}
      <div style={{
        position: "absolute", inset: 0,
        background: isSplit
          ? "linear-gradient(to right, rgba(255,255,255,0.1) 0%, transparent 55%)"
          : "rgba(255,255,255,0.02)",
      }} />

      {/* Phone frame container
          모바일: normal flow (부모가 콘텐츠 높이만큼 늘어남) + zIndex로 배경 위에
          데스크탑: absolute + inset 0 (고정 캔버스 내 배치) */}
      <div style={{
        ...(isMobile
          ? { position: "relative", zIndex: 1, minHeight: canvasH, boxSizing: "border-box" as const }
          : { position: "absolute", inset: 0 }),
        display: "flex",
        alignItems: isSplit ? "flex-end" : "center",
        justifyContent,
        padding: framePadding,
      }}>
        <PhoneFrame
          appName={appName}
          messages={messages}
          width={frameW}
          maxHeight={maxFrameH}
          onOverflowChange={onOverflowChange}
          userName={userName}
          userAvatarUrl={userAvatarUrl}
        />
      </div>

    </div>
  );
});
