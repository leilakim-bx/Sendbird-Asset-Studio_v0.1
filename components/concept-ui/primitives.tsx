"use client";

import type { CSSProperties, ReactNode } from "react";
import type { SceneSpec } from "@/lib/concept-ui/scene-spec";
import { avatarPalette, conceptSceneTokens as t } from "@/lib/concept-ui/scene-tokens";

type AiCallout = NonNullable<SceneSpec["modifiers"]["aiCallout"]>;
type CursorModifier = NonNullable<SceneSpec["modifiers"]["cursor"]>;

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
    ai: { background: t.color.aiSoft, color: t.color.ink },
  }[tone];
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        minHeight: 30,
        maxWidth: "100%",
        borderRadius: 9,
        padding: "5px 10px",
        background: palette.background,
        color: palette.color,
        fontSize: 15,
        fontWeight: 700,
        lineHeight: 1,
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
  popover?: "right" | "left" | "top";
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

function AiPopover({ callout, popover }: { callout: AiCallout; popover: "right" | "left" | "top" }) {
  const placement: CSSProperties =
    popover === "left"
      ? { right: "calc(100% + 18px)", top: 18 }
      : popover === "top"
        ? { left: 22, bottom: "calc(100% + 18px)" }
        : { left: "calc(100% + 18px)", top: 18 };

  return (
    <div
      style={{
        position: "absolute",
        zIndex: 20,
        width: 330,
        borderRadius: 20,
        border: `1px solid ${t.color.borderStrong}`,
        background: t.color.app,
        boxShadow: t.shadow.float,
        padding: 18,
        ...placement,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            width: 28,
            height: 22,
            borderRadius: 7,
            background: t.color.ink,
            color: t.color.inverse,
            fontSize: 13,
            fontWeight: 800,
            letterSpacing: 0,
          }}
        >
          AI
        </span>
        <EllipsisText style={{ fontSize: 24, fontWeight: 800, color: t.color.text }}>
          {callout.label}
        </EllipsisText>
      </div>
      <EllipsisText
        lines={3}
        style={{
          marginTop: 10,
          fontSize: 20,
          lineHeight: 1.35,
          color: t.color.muted,
        }}
      >
        {callout.description}
      </EllipsisText>
    </div>
  );
}
