"use client";

import { ArrowDown, GitBranch } from "lucide-react";
import type { CSSProperties } from "react";
import type { LogicBlockSpec, SceneSpec } from "@/lib/concept-ui/scene-spec";
import { conceptSceneTokens as t } from "@/lib/concept-ui/scene-tokens";
import { EllipsisText, Pill, Slot, type SlotPopover } from "../primitives";

type AiCallout = NonNullable<SceneSpec["modifiers"]["aiCallout"]>;
type CursorModifier = NonNullable<SceneSpec["modifiers"]["cursor"]>;

type Props = {
  block: LogicBlockSpec;
  callout?: AiCallout;
  cursor?: CursorModifier;
  compact?: boolean;
  popover?: SlotPopover;
  style?: CSSProperties;
};

function outcomeTone(tone: LogicBlockSpec["outcomes"][number]["tone"]): "neutral" | "good" | "warn" | "ai" {
  if (tone === "good") return "good";
  if (tone === "warn") return "warn";
  if (tone === "ai") return "ai";
  return "neutral";
}

export function LogicBlockCard({ block, callout, cursor, compact = false, popover = "top", style }: Props) {
  const gap = compact ? 8 : 10;
  const pad = compact ? 14 : 18;
  const titleSize = compact ? 16 : 20;
  const bodySize = compact ? 12 : 14;

  return (
    <Slot
      id={block.slotId}
      callout={callout}
      cursor={cursor}
      popover={popover}
      style={{
        borderRadius: compact ? 18 : 22,
        border: `1px solid ${t.color.border}`,
        background: t.color.app,
        padding: pad,
        boxShadow: compact ? t.shadow.none : t.shadow.card,
        boxSizing: "border-box",
        maxWidth: "100%",
        ...style,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
        <span
          aria-hidden
          style={{
            width: compact ? 28 : 34,
            height: compact ? 28 : 34,
            borderRadius: compact ? 9 : 11,
            background: t.color.ink,
            color: t.color.inverse,
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            flex: "0 0 auto",
          }}
        >
          <GitBranch size={compact ? 15 : 18} />
        </span>
        <div style={{ minWidth: 0 }}>
          <EllipsisText style={{ fontSize: titleSize, fontWeight: t.font.weight.semibold, color: t.color.text }}>
            {block.title}
          </EllipsisText>
          {block.description ? (
            <EllipsisText lines={2} style={{ marginTop: 3, fontSize: bodySize, lineHeight: 1.35, color: t.color.muted }}>
              {block.description}
            </EllipsisText>
          ) : null}
        </div>
      </div>

      <div
        style={{
          marginTop: compact ? 12 : 16,
          borderRadius: compact ? 15 : 18,
          background: t.color.surface,
          border: `1px solid ${t.color.border}`,
          padding: compact ? "9px 12px" : "12px 15px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
          <Pill tone="neutral" style={{ minHeight: compact ? t.control.pill.compactMinHeight : t.control.pill.denseMinHeight, fontSize: compact ? t.control.pill.compactFontSize : 12 }}>
            {block.conditionLabel}
          </Pill>
          <EllipsisText lines={2} style={{ minWidth: 0, fontSize: compact ? 13 : 15, fontWeight: t.font.weight.semibold, color: t.color.text }}>
            {block.condition}
          </EllipsisText>
        </div>
      </div>

      <div style={{ display: "flex", justifyContent: "center", height: compact ? 16 : 20, color: t.color.faint }}>
        <ArrowDown size={compact ? 15 : 17} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: compact ? "1fr" : "repeat(2, minmax(0, 1fr))", gap }}>
        {block.outcomes.map((outcome, index) => (
          <div
            key={`${index}-${outcome.label}`}
            style={{
              minWidth: 0,
              borderRadius: compact ? 15 : 17,
              border: `1px solid ${t.color.border}`,
              background: outcome.tone === "ai" ? t.color.aiSoft : t.color.surface,
              padding: compact ? 10 : 13,
            }}
          >
            <Pill tone={outcomeTone(outcome.tone)} style={{ minHeight: compact ? t.control.pill.compactMinHeight : t.control.pill.denseMinHeight, fontSize: compact ? t.control.pill.compactFontSize : 12 }}>
              {outcome.label}
            </Pill>
            <EllipsisText lines={3} style={{ marginTop: 8, fontSize: bodySize, lineHeight: 1.35, color: t.color.text }}>
              {outcome.action}
            </EllipsisText>
          </div>
        ))}
      </div>
    </Slot>
  );
}
