"use client";

import type { CSSProperties, ReactNode } from "react";
import type { SceneSpec } from "@/lib/concept-ui/scene-spec";
import { avatarPalette, conceptSceneTokens as t } from "@/lib/concept-ui/scene-tokens";

type AiCallout = NonNullable<SceneSpec["modifiers"]["aiCallout"]>;
type CursorModifier = NonNullable<SceneSpec["modifiers"]["cursor"]>;
export type SlotPopover = "right" | "left" | "top" | "bottom" | "inside-right" | "inline";

export function truncate(value: string, max = 80): string {
  if (value.length <= max) return value;
  return `${value.slice(0, Math.max(0, max - 1))}…`;
}

export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "AI";
  if (/^[A-Za-z]/.test(parts[0])) {
    return parts.slice(0, 2).map((part) => part[0]?.toUpperCase()).join("");
  }
  return parts[0].slice(0, 2);
}

function hashString(value: string): number {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash * 31 + value.charCodeAt(i)) >>> 0;
  }
  return hash;
}

export function avatarTone(name: string): (typeof avatarPalette)[number] {
  return avatarPalette[hashString(name) % avatarPalette.length];
}

export function EllipsisText({
  children,
  lines = 1,
  style,
}: {
  children: string;
  lines?: 1 | 2 | 3;
  style?: CSSProperties;
}) {
  return (
    <span
      title={children}
      style={{
        display: "-webkit-box",
        WebkitBoxOrient: "vertical",
        WebkitLineClamp: lines,
        overflow: "hidden",
        textOverflow: "ellipsis",
        ...style,
      }}
    >
      {children}
    </span>
  );
}

export function AvatarInitials({ name, size = 44 }: { name: string; size?: number }) {
  const tone = avatarTone(name);
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: size >= 40 ? 14 : 10,
        background: tone.background,
        color: tone.color,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: Math.round(size * 0.38),
        fontWeight: 700,
        flex: "0 0 auto",
      }}
    >
      {initials(name)}
    </div>
  );
}

export function DelightMark({ size = 46 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      aria-label="delight.ai"
      role="img"
      style={{ display: "block", width: size, height: size, flexShrink: 0 }}
    >
      <rect width="32" height="32" rx="16" fill={t.color.text} />
      <path
        d="M17.2861 14.6869H23.5V16.8328H18.8089L22.4552 20.4791L20.9343 22L17.2861 18.3518V23.5H15.1403V18.3777L11.5177 22.0002L9.99687 20.4794L9.99745 20.4788L9.99687 20.4782L13.6423 16.8328H8.5V14.6869H13.6213L9.99687 11.0625L11.5177 9.54163L15.1403 13.1642V8.5H17.2861V14.6869Z"
        fill={t.color.inverse}
      />
      <path
        d="M20.8144 9.7085C21.6198 9.70851 22.2728 10.3614 22.2728 11.1668C22.2728 11.9723 21.6198 12.6252 20.8144 12.6252C20.009 12.6252 19.3561 11.9723 19.3561 11.1668C19.3561 10.3614 20.009 9.7085 20.8144 9.7085Z"
        fill={t.color.inverse}
      />
    </svg>
  );
}

export function Card({
  children,
  style,
  primaryPanel,
}: {
  children: ReactNode;
  style?: CSSProperties;
  primaryPanel?: boolean;
}) {
  return (
    <div
      data-concept-primary-panel={primaryPanel ? "true" : undefined}
      style={{
        background: t.color.app,
        border: `1px solid ${t.color.border}`,
        borderRadius: t.radius.lg,
        boxShadow: t.shadow.card,
        fontFamily: t.font.sans,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

export function Pill({
  children,
  tone = "neutral",
  style,
}: {
  children: ReactNode;
  tone?: "neutral" | "good" | "warn" | "ai";
  style?: CSSProperties;
}) {
  const palette = {
    neutral: { background: t.color.surfaceStrong, color: t.color.muted },
    good: { background: t.color.goodSoft, color: t.color.goodText },
    warn: { background: t.color.warnSoft, color: t.color.warnText },
    ai: { background: t.color.ai, color: t.color.ink },
  }[tone];
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        minHeight: t.control.pill.minHeight,
        maxWidth: "100%",
        borderRadius: t.control.pill.radius,
        padding: `${t.control.pill.paddingY}px ${t.control.pill.paddingX}px`,
        background: palette.background,
        color: palette.color,
        fontSize: t.control.pill.fontSize,
        fontWeight: 700,
        lineHeight: t.control.pill.lineHeight,
        whiteSpace: "nowrap",
        ...style,
      }}
    >
      {children}
    </span>
  );
}

export function Slot({
  id,
  callout,
  cursor,
  highlighted,
  children,
  style,
  popover = "right",
}: {
  id: string;
  callout?: AiCallout;
  cursor?: CursorModifier;
  highlighted?: boolean;
  children: ReactNode;
  style?: CSSProperties;
  popover?: SlotPopover;
}) {
  const active = callout?.targetSlotId === id;
  const cursorActive = cursor?.targetSlotId === id;
  return (
    <div
      data-slot-id={id}
      style={{
        position: "relative",
        borderRadius: active ? t.radius.md : undefined,
        boxShadow: active
          ? t.shadow.active
          : highlighted
            ? t.shadow.highlighted
            : undefined,
        ...style,
      }}
    >
      {children}
      {active ? <AiPopover callout={callout} popover={popover} /> : null}
      {cursorActive ? <CursorOverlay /> : null}
    </div>
  );
}

function CursorOverlay() {
  return (
    <svg
      width="54"
      height="62"
      viewBox="0 0 54 62"
      aria-hidden
      style={{
        position: "absolute",
        zIndex: 25,
        right: 18,
        bottom: 12,
        filter: t.shadow.cursor,
      }}
    >
      <path
        d="M8 5 L45 34 L29 38 L22 56 L8 5 Z"
        fill={t.color.ink}
        stroke={t.color.inverse}
        strokeWidth="4"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function AiPopover({ callout, popover }: { callout: AiCallout; popover: SlotPopover }) {
  const inline = popover === "inline";
  const placement: CSSProperties =
    popover === "left"
      ? { right: "calc(100% + 18px)", top: 18 }
      : popover === "inside-right"
        ? { right: 20, top: 20 }
      : popover === "bottom"
        ? { left: 22, top: "calc(100% + 18px)" }
      : popover === "inline"
        ? {}
      : popover === "top"
        ? { left: 22, bottom: "calc(100% + 18px)" }
        : { left: "calc(100% + 18px)", top: 18 };

  return (
    <div
      data-concept-ai-popover="true"
      style={{
        position: inline ? "relative" : "absolute",
        zIndex: 20,
        width: inline ? "auto" : popover === "inside-right" ? 300 : 330,
        maxWidth: "100%",
        marginTop: inline ? 12 : undefined,
        borderRadius: inline ? 16 : 20,
        border: `1px solid ${t.color.borderStrong}`,
        background: t.color.app,
        boxShadow: inline ? t.shadow.none : t.shadow.float,
        padding: inline ? 14 : 18,
        ...placement,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            width: inline ? 22 : 28,
            height: inline ? 18 : 22,
            borderRadius: 7,
            background: t.color.ink,
            color: t.color.inverse,
            fontSize: inline ? 10 : 13,
            fontWeight: 800,
            letterSpacing: 0,
            flex: "0 0 auto",
          }}
        >
          AI
        </span>
        <EllipsisText style={{ minWidth: 0, fontSize: inline ? 16 : 24, fontWeight: 800, color: t.color.text }}>
          {callout.label}
        </EllipsisText>
      </div>
      <EllipsisText
        lines={3}
        style={{
          marginTop: inline ? 8 : 10,
          fontSize: inline ? 13 : 20,
          lineHeight: 1.35,
          color: t.color.muted,
        }}
      >
        {callout.description}
      </EllipsisText>
    </div>
  );
}
