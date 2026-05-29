"use client";

import { useRef, useEffect } from "react";
import type { ChatMessage, TextBlock, ActionsBlock, ProductsBlock } from "@/lib/store";

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
  mobile:  { width: 430, height: 660 },
};

// ── ChatBubble — user 오른쪽 / ai 왼쪽 ───────────────────

function ChatBubble({
  msg,
  appName,
  userName,
  userAvatarUrl,
}: {
  msg: ChatMessage;   // caller guarantees block.type === "text"
  appName: string;
  userName?: string;
  userAvatarUrl?: string;
}) {
  const isUser = msg.role === "user";
  const text = (msg.block as TextBlock).text;
  // Global profile takes priority; fall back to per-message values
  const displayName   = isUser ? (userName   || msg.sender) : appName;
  const displayAvatar = isUser ? (userAvatarUrl || msg.avatar) : undefined;

  return (
    <div style={{
      display: "flex",
      justifyContent: isUser ? "flex-end" : "flex-start",
      padding: "0 14px",
    }}>
      <div style={{
        maxWidth: "75%",
        borderRadius: 18,
        padding: "10px 14px 12px",
        background: "#ffffff",
        boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
      }}>
        {/* Avatar + sender name */}
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 5 }}>
          {isUser ? (
            displayAvatar
              ? /* eslint-disable-next-line @next/next/no-img-element */
                <img src={displayAvatar} alt={displayName}
                  style={{ width: 22, height: 22, borderRadius: "50%", objectFit: "cover", flexShrink: 0 }} />
              : <div style={{ width: 22, height: 22, borderRadius: "50%", background: "#CBD5E1", flexShrink: 0 }} />
          ) : (
            <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#111", flexShrink: 0 }} />
          )}
          <span style={{ fontSize: 12, color: "#999", lineHeight: 1 }}>
            {displayName}
          </span>
        </div>
        {/* Text */}
        <p style={{ fontSize: 15, lineHeight: 1.4, color: "#1a1a1a", margin: 0 }}>
          {text}
        </p>
      </div>
    </div>
  );
}

// ── ActionButtons ─────────────────────────────────────────

function ActionButtons({ msg }: { msg: ChatMessage }) {
  const { buttons } = msg.block as ActionsBlock;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6, padding: "0 14px" }}>
      {buttons.map((btn, i) => (
        <div key={i} style={{
          borderRadius: 12,
          padding: "11px 16px",
          textAlign: "center",
          fontSize: 14,
          color: "#374151",
          background: "#F3F4F6",
        }}>
          {btn}
        </div>
      ))}
    </div>
  );
}

// ── ProductCards ──────────────────────────────────────────

function ProductCards({ msg }: { msg: ChatMessage }) {
  const { items } = msg.block as ProductsBlock;
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, padding: "0 16px" }}>
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
                style={{ width: "100%", aspectRatio: "3/2", objectFit: "cover", display: "block" }} />
            : <div style={{
                width: "100%", aspectRatio: "3/2",
                background: "#E5E7EB",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <span style={{ fontSize: 11, color: "#9CA3AF" }}>Image</span>
              </div>
          }
          <div style={{ padding: "8px 10px 10px" }}>
            <p style={{
              fontSize: 14, fontWeight: 700, color: "#111",
              lineHeight: 1.3, margin: "0 0 3px",
              overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
            }}>{item.name}</p>
            <p style={{
              fontSize: 12, color: "#6B7280",
              margin: "0 0 8px",
              overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
            }}>{item.sub}</p>
            {/* View Details — gray fill, no border */}
            <div style={{
              fontSize: 13, fontWeight: 600, color: "#374151",
              background: "#F3F4F6", borderRadius: 8,
              padding: "6px 0", textAlign: "center",
            }}>{item.cta}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ── PhoneFrame — glassmorphism ────────────────────────────

function PhoneFrame({
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
  maxHeight: number;
  onOverflowChange?: (isOverflowing: boolean) => void;
  userName?: string;
  userAvatarUrl?: string;
}) {
  const frameRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = frameRef.current;
    if (!el) return;
    const check = () => {
      const overflows = el.scrollHeight > el.clientHeight + 1;
      onOverflowChange?.(overflows);
    };
    check();
    const ro = new ResizeObserver(check);
    ro.observe(el);
    return () => ro.disconnect();
  // onOverflowChange는 EditorShell의 setState — 안정적이므로 deps 생략
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages]);

  return (
    <div
      ref={frameRef}
      style={{
        width,
        maxHeight,
        borderRadius: 32,
        overflow: "hidden",
        background: "rgba(255,255,255,0.25)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        border: "1px solid rgba(255,255,255,0.3)",
        boxShadow: "0 8px 32px rgba(0,0,0,0.08)",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Header */}
      <div style={{
        position: "relative",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "16px 16px 14px",
        borderBottom: "1px solid rgba(255,255,255,0.3)",
        flexShrink: 0,
      }}>
        <span style={{ fontSize: 17, fontWeight: 700, color: "#111", letterSpacing: "-0.02em" }}>
          {appName}
        </span>
        <span style={{
          position: "absolute",
          right: 16,
          fontSize: 16,
          color: "#6B7280",
          letterSpacing: "0.15em",
          lineHeight: 1,
        }}>
          ···
        </span>
      </div>

      {/* Message list */}
      <div style={{ display: "flex", flexDirection: "column", gap: 12, padding: "14px 0 16px" }}>
        {messages.map((msg) => {
          if (msg.block.type === "text")     return <ChatBubble    key={msg.id} msg={msg} appName={appName} userName={userName} userAvatarUrl={userAvatarUrl} />;
          if (msg.block.type === "actions")  return <ActionButtons key={msg.id} msg={msg} />;
          if (msg.block.type === "products") return <ProductCards  key={msg.id} msg={msg} />;
          return null;
        })}
      </div>

    </div>
  );
}

// ── Main Component ────────────────────────────────────────

export function FeatureMockup({
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

  // 최소 여백 80px 보장
  const MIN_PAD = 80;
  const vPad    = Math.max(MIN_PAD, Math.round(canvasH * 0.08)); // 상단/하단
  const hPadL   = isSplit
    ? Math.max(MIN_PAD, Math.round(canvasW * 0.05))              // split 왼쪽
    : MIN_PAD;                                                   // center/mobile

  // 프레임 너비: 좌우 여백 80px 이상 확보 후 남은 공간에서 설정
  const maxFrameW = canvasW - hPadL - MIN_PAD;
  const frameW = Math.min(
    isMobile
      ? Math.round(canvasW * 0.72)
      : isCenter
        ? Math.round(canvasW * 0.38)
        : Math.round(canvasW * 0.36),
    maxFrameW,
  );

  const justifyContent = isSplit ? "flex-start" : "center";
  const maxFrameH = canvasH - vPad * 2;

  return (
    <div style={{ width: canvasW, height: canvasH, position: "relative", overflow: "hidden" }}>

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

      {/* Phone frame */}
      <div style={{
        position: "absolute", inset: 0,
        display: "flex",
        alignItems: "center",
        justifyContent,
        padding: isSplit
          ? `${vPad}px ${MIN_PAD}px ${vPad}px ${hPadL}px`
          : `${vPad}px ${hPadL}px`,
      }}>
        <PhoneFrame appName={appName} messages={messages} width={frameW} maxHeight={maxFrameH} onOverflowChange={onOverflowChange} userName={userName} userAvatarUrl={userAvatarUrl} />
      </div>

    </div>
  );
}
