"use client";

import { FileText, ListChecks, Terminal } from "lucide-react";
import type { CSSProperties, ReactNode } from "react";
import type {
  InstructionSectionSpec,
  LogicBlockSpec,
  ReviewQueueSpec,
  SceneSpec,
  ToolCallListSpec,
} from "@/lib/concept-ui/scene-spec";
import { conceptSceneTokens as t } from "@/lib/concept-ui/scene-tokens";
import { EllipsisText, Pill, Slot, type SlotPopover } from "../primitives";
import { LogicBlockCard } from "./LogicBlockCard";

type AiCallout = NonNullable<SceneSpec["modifiers"]["aiCallout"]>;
type CursorModifier = NonNullable<SceneSpec["modifiers"]["cursor"]>;

export type ReusableBlocks = {
  logicBlocks?: LogicBlockSpec[];
  instructionSections?: InstructionSectionSpec[];
  reviewQueues?: ReviewQueueSpec[];
  toolCallLists?: ToolCallListSpec[];
};

type CardProps<T> = {
  block: T;
  callout?: AiCallout;
  cursor?: CursorModifier;
  compact?: boolean;
  popover?: SlotPopover;
  style?: CSSProperties;
};

type StackProps = ReusableBlocks & {
  callout?: AiCallout;
  cursor?: CursorModifier;
  compact?: boolean;
  max?: number;
  popover?: SlotPopover;
  style?: CSSProperties;
};

function tone(value: "neutral" | "good" | "warn" | "ai"): "neutral" | "good" | "warn" | "ai" {
  return value;
}

function BlockShell({
  slotId,
  title,
  icon,
  children,
  callout,
  cursor,
  compact = false,
  popover = "top",
  style,
}: {
  slotId: string;
  title: string;
  icon: ReactNode;
  children: ReactNode;
  callout?: AiCallout;
  cursor?: CursorModifier;
  compact?: boolean;
  popover?: SlotPopover;
  style?: CSSProperties;
}) {
  return (
    <Slot
      id={slotId}
      callout={callout}
      cursor={cursor}
      popover={popover}
      style={{
        borderRadius: compact ? 18 : 22,
        border: `1px solid ${t.color.border}`,
        background: t.color.app,
        padding: compact ? 14 : 18,
        boxSizing: "border-box",
        maxWidth: "100%",
        boxShadow: compact ? t.shadow.none : t.shadow.card,
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
          {icon}
        </span>
        <EllipsisText style={{ minWidth: 0, fontSize: compact ? 16 : 20, fontWeight: 850, color: t.color.text }}>
          {title}
        </EllipsisText>
      </div>
      {children}
    </Slot>
  );
}

export function InstructionSectionCard({ block, callout, cursor, compact = false, popover = "top", style }: CardProps<InstructionSectionSpec>) {
  return (
    <BlockShell
      slotId={block.slotId}
      title={block.title}
      icon={<FileText size={compact ? 15 : 18} />}
      callout={callout}
      cursor={cursor}
      compact={compact}
      popover={popover}
      style={style}
    >
      {block.eyebrow ? (
        <Pill tone="neutral" style={{ marginTop: compact ? 10 : 13, minHeight: compact ? 23 : 26, fontSize: compact ? 11 : 12 }}>
          {block.eyebrow}
        </Pill>
      ) : null}
      <EllipsisText lines={compact ? 2 : 3} style={{ marginTop: 9, fontSize: compact ? 12 : 14, lineHeight: 1.35, color: t.color.muted }}>
        {block.body}
      </EllipsisText>
      <div style={{ marginTop: compact ? 10 : 14, display: "grid", gap: compact ? 7 : 9 }}>
        {block.items.map((item, index) => (
          <div
            key={`${index}-${item.label}`}
            style={{
              borderRadius: compact ? 13 : 15,
              background: t.color.surface,
              border: `1px solid ${t.color.border}`,
              padding: compact ? "9px 10px" : "11px 12px",
              minWidth: 0,
            }}
          >
            <Pill tone={tone(item.tone)} style={{ minHeight: compact ? 22 : 24, fontSize: compact ? 10 : 11 }}>
              {item.label}
            </Pill>
            <EllipsisText lines={2} style={{ marginTop: 7, fontSize: compact ? 12 : 13, lineHeight: 1.35, color: t.color.text }}>
              {item.text}
            </EllipsisText>
          </div>
        ))}
      </div>
      {block.tags ? (
        <div style={{ marginTop: compact ? 9 : 12, display: "flex", gap: 6, flexWrap: "wrap" }}>
          {block.tags.map((tag, index) => (
            <Pill key={`${index}-${tag}`} tone={index === 0 ? "ai" : "neutral"} style={{ minHeight: 22, fontSize: 10 }}>
              {tag}
            </Pill>
          ))}
        </div>
      ) : null}
    </BlockShell>
  );
}

export function ReviewQueueCard({ block, callout, cursor, compact = false, popover = "top", style }: CardProps<ReviewQueueSpec>) {
  return (
    <BlockShell
      slotId={block.slotId}
      title={block.title}
      icon={<ListChecks size={compact ? 15 : 18} />}
      callout={callout}
      cursor={cursor}
      compact={compact}
      popover={popover}
      style={style}
    >
      <EllipsisText lines={2} style={{ marginTop: compact ? 9 : 12, fontSize: compact ? 12 : 14, lineHeight: 1.35, color: t.color.muted }}>
        {block.summary}
      </EllipsisText>
      <div style={{ marginTop: compact ? 10 : 14, display: "grid", gap: compact ? 8 : 10 }}>
        {block.items.map((item, index) => (
          <div
            key={`${index}-${item.label}`}
            style={{
              display: "grid",
              gridTemplateColumns: "1fr auto",
              gap: 10,
              alignItems: "center",
              borderRadius: compact ? 14 : 16,
              background: t.color.surface,
              border: `1px solid ${t.color.border}`,
              padding: compact ? "10px 11px" : "12px 13px",
              minWidth: 0,
            }}
          >
            <div style={{ minWidth: 0 }}>
              <EllipsisText style={{ fontSize: compact ? 13 : 15, fontWeight: 850, color: t.color.text }}>
                {item.label}
              </EllipsisText>
              <EllipsisText lines={2} style={{ marginTop: 4, fontSize: compact ? 11 : 12, lineHeight: 1.35, color: t.color.muted }}>
                {item.detail}
              </EllipsisText>
            </div>
            <Pill tone={tone(item.tone)} style={{ minHeight: compact ? 23 : 26, fontSize: compact ? 10 : 11 }}>
              {item.status}
            </Pill>
          </div>
        ))}
      </div>
    </BlockShell>
  );
}

export function ToolCallListCard({ block, callout, cursor, compact = false, popover = "top", style }: CardProps<ToolCallListSpec>) {
  return (
    <BlockShell
      slotId={block.slotId}
      title={block.title}
      icon={<Terminal size={compact ? 15 : 18} />}
      callout={callout}
      cursor={cursor}
      compact={compact}
      popover={popover}
      style={style}
    >
      {block.summary ? (
        <EllipsisText lines={2} style={{ marginTop: compact ? 9 : 12, fontSize: compact ? 12 : 14, lineHeight: 1.35, color: t.color.muted }}>
          {block.summary}
        </EllipsisText>
      ) : null}
      <div style={{ marginTop: compact ? 10 : 14, display: "grid", gap: compact ? 8 : 10 }}>
        {block.calls.map((call, index) => (
          <div
            key={`${index}-${call.name}`}
            style={{
              borderRadius: compact ? 14 : 16,
              background: call.tone === "ai" ? t.color.aiSoft : t.color.surface,
              border: `1px solid ${t.color.border}`,
              padding: compact ? "10px 11px" : "12px 13px",
              minWidth: 0,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
              <EllipsisText style={{ minWidth: 0, fontSize: compact ? 13 : 15, fontWeight: 850, color: t.color.text }}>
                {call.name}
              </EllipsisText>
              <Pill tone={tone(call.tone)} style={{ marginLeft: "auto", minHeight: compact ? 22 : 24, fontSize: compact ? 10 : 11 }}>
                {call.status}
              </Pill>
            </div>
            <EllipsisText lines={2} style={{ marginTop: 7, fontSize: compact ? 11 : 12, lineHeight: 1.35, color: t.color.muted }}>
              {call.detail}
            </EllipsisText>
          </div>
        ))}
      </div>
    </BlockShell>
  );
}

export function hasReusableBlocks(blocks: ReusableBlocks): boolean {
  return Boolean(
    blocks.logicBlocks?.length ||
    blocks.instructionSections?.length ||
    blocks.reviewQueues?.length ||
    blocks.toolCallLists?.length,
  );
}

export function ReusableBlockStack({
  logicBlocks,
  instructionSections,
  reviewQueues,
  toolCallLists,
  callout,
  cursor,
  compact = true,
  max = 1,
  popover = "top",
  style,
}: StackProps) {
  const items = [
    ...(logicBlocks ?? []).map((block) => ({
      key: `logic-${block.slotId}`,
      node: <LogicBlockCard block={block} callout={callout} cursor={cursor} compact={compact} popover={popover} />,
    })),
    ...(reviewQueues ?? []).map((block) => ({
      key: `review-${block.slotId}`,
      node: <ReviewQueueCard block={block} callout={callout} cursor={cursor} compact={compact} popover={popover} />,
    })),
    ...(toolCallLists ?? []).map((block) => ({
      key: `tool-${block.slotId}`,
      node: <ToolCallListCard block={block} callout={callout} cursor={cursor} compact={compact} popover={popover} />,
    })),
    ...(instructionSections ?? []).map((block) => ({
      key: `instruction-${block.slotId}`,
      node: <InstructionSectionCard block={block} callout={callout} cursor={cursor} compact={compact} popover={popover} />,
    })),
  ].slice(0, max);

  if (items.length === 0) return null;

  return (
    <div style={{ display: "grid", gap: compact ? 10 : 12, ...style }}>
      {items.map((item) => (
        <div key={item.key} style={{ minWidth: 0 }}>
          {item.node}
        </div>
      ))}
    </div>
  );
}
