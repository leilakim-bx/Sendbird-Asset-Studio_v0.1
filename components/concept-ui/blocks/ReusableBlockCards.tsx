"use client";

import {
  Activity,
  BookOpenCheck,
  CheckCircle2,
  CirclePause,
  FileText,
  Gauge,
  ListChecks,
  MessagesSquare,
  PlugZap,
  RefreshCw,
  Route,
  ShieldCheck,
  SlidersHorizontal,
  Terminal,
} from "lucide-react";
import type { CSSProperties, ReactNode } from "react";
import type {
  ActionTrailSpec,
  AutonomyMatrixSpec,
  ChannelMatrixSpec,
  ControlPanelSpec,
  EvaluationScorecardSpec,
  ImprovementSignalSpec,
  InstructionSectionSpec,
  IntegrationHealthSpec,
  KnowledgeCoverageSpec,
  LogicBlockSpec,
  ReviewQueueSpec,
  SceneSpec,
  ToolCallListSpec,
  ValidationLoopSpec,
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
  actionTrails?: ActionTrailSpec[];
  improvementSignals?: ImprovementSignalSpec[];
  validationLoops?: ValidationLoopSpec[];
  controlPanels?: ControlPanelSpec[];
  autonomyMatrices?: AutonomyMatrixSpec[];
  knowledgeCoverages?: KnowledgeCoverageSpec[];
  evaluationScorecards?: EvaluationScorecardSpec[];
  integrationHealths?: IntegrationHealthSpec[];
  channelMatrices?: ChannelMatrixSpec[];
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
        <EllipsisText style={{ minWidth: 0, fontSize: compact ? 16 : 20, fontWeight: t.font.weight.semibold, color: t.color.text }}>
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
              <EllipsisText style={{ fontSize: compact ? 13 : 15, fontWeight: t.font.weight.semibold, color: t.color.text }}>
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
              <EllipsisText style={{ minWidth: 0, fontSize: compact ? 13 : 15, fontWeight: t.font.weight.semibold, color: t.color.text }}>
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

export function ActionTrailCard({ block, callout, cursor, compact = false, popover = "top", style }: CardProps<ActionTrailSpec>) {
  return (
    <BlockShell
      slotId={block.slotId}
      title={block.title}
      icon={<Route size={compact ? 15 : 18} />}
      callout={callout}
      cursor={cursor}
      compact={compact}
      popover={popover}
      style={style}
    >
      {block.summary ? (
        <EllipsisText lines={compact ? 1 : 2} style={{ marginTop: compact ? 8 : 12, fontSize: compact ? 11 : 14, lineHeight: 1.35, color: t.color.muted }}>
          {block.summary}
        </EllipsisText>
      ) : null}
      <div style={{ marginTop: compact ? 8 : 14, display: "grid", gap: compact ? 6 : 9 }}>
        {block.steps.map((step, index) => {
          const isGate = step.tone === "warn" || /gate|pause|approval|승인/i.test(`${step.status} ${step.label}`);
          return (
            <div
              key={`${index}-${step.label}`}
              style={{
                display: "grid",
                gridTemplateColumns: "auto minmax(0, 1fr) auto",
                gap: compact ? 9 : 11,
                alignItems: "center",
                borderRadius: compact ? 14 : 16,
                background: t.color.surface,
                border: `1px solid ${t.color.border}`,
                padding: compact ? "8px 10px" : "11px 12px",
                minWidth: 0,
              }}
            >
              <span
                aria-hidden
                style={{
                  width: compact ? 22 : 25,
                  height: compact ? 22 : 25,
                  borderRadius: 999,
                  background: isGate ? t.color.warnSoft : t.color.goodSoft,
                  color: isGate ? t.color.warnText : t.color.goodText,
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flex: "0 0 auto",
                }}
              >
                {isGate ? <CirclePause size={compact ? 13 : 15} /> : <CheckCircle2 size={compact ? 13 : 15} />}
              </span>
              <div style={{ minWidth: 0 }}>
                <EllipsisText style={{ fontSize: compact ? 12 : 14, fontWeight: t.font.weight.semibold, color: t.color.text }}>
                  {step.label}
                </EllipsisText>
                {!compact && step.detail ? (
                  <EllipsisText lines={1} style={{ marginTop: 3, fontSize: compact ? 10 : 11, color: t.color.muted }}>
                    {step.detail}
                  </EllipsisText>
                ) : null}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 6, minWidth: 0 }}>
                {step.duration ? (
                  <EllipsisText style={{ fontSize: compact ? 10 : 11, fontWeight: t.font.weight.medium, color: t.color.faint }}>
                    {step.duration}
                  </EllipsisText>
                ) : null}
                <Pill tone={tone(step.tone)} style={{ minHeight: compact ? 21 : 23, fontSize: compact ? 9 : 10 }}>
                  {step.status}
                </Pill>
              </div>
            </div>
          );
        })}
      </div>
      {block.gate ? (
        <div
          style={{
            marginTop: compact ? 8 : 14,
            display: "grid",
            gridTemplateColumns: "minmax(0, 1fr) auto auto",
            gap: compact ? 8 : 10,
            alignItems: "center",
            borderRadius: compact ? 15 : 17,
            background: t.color.surfaceStrong,
            border: `1px solid ${t.color.border}`,
            padding: compact ? "9px 12px" : "13px 14px",
            minWidth: 0,
          }}
        >
          <div style={{ minWidth: 0 }}>
            <EllipsisText style={{ fontSize: compact ? 13 : 16, fontWeight: t.font.weight.semibold, color: t.color.text }}>
              {block.gate.title}
            </EllipsisText>
            <EllipsisText lines={1} style={{ marginTop: 3, fontSize: compact ? 10 : 12, color: t.color.muted }}>
              {block.gate.detail}
            </EllipsisText>
          </div>
          <button
            type="button"
            style={{
              border: 0,
              borderRadius: compact ? 11 : 13,
              background: t.color.ink,
              color: t.color.inverse,
              minHeight: compact ? 30 : 36,
              padding: compact ? "0 12px" : "0 15px",
              fontSize: compact ? 11 : 13,
              fontWeight: t.font.weight.semibold,
            }}
          >
            {block.gate.primaryAction}
          </button>
          <button
            type="button"
            style={{
              border: `1px solid ${t.color.border}`,
              borderRadius: compact ? 11 : 13,
              background: t.color.app,
              color: t.color.text,
              minHeight: compact ? 30 : 36,
              padding: compact ? "0 12px" : "0 15px",
              fontSize: compact ? 11 : 13,
              fontWeight: t.font.weight.semibold,
            }}
          >
            {block.gate.secondaryAction}
          </button>
        </div>
      ) : null}
    </BlockShell>
  );
}

export function ImprovementSignalCard({ block, callout, cursor, compact = false, popover = "top", style }: CardProps<ImprovementSignalSpec>) {
  return (
    <BlockShell
      slotId={block.slotId}
      title={block.title}
      icon={<Activity size={compact ? 15 : 18} />}
      callout={callout}
      cursor={cursor}
      compact={compact}
      popover={popover}
      style={style}
    >
      <div style={{ marginTop: compact ? 10 : 14, display: "grid", gap: compact ? 8 : 10 }}>
        <div
          style={{
            borderRadius: compact ? 14 : 16,
            background: t.color.aiSoft,
            border: `1px solid ${t.color.border}`,
            padding: compact ? "10px 11px" : "12px 13px",
            minWidth: 0,
          }}
        >
          <Pill tone={tone(block.tone)} style={{ minHeight: compact ? 22 : 24, fontSize: compact ? 10 : 11 }}>
            {block.status}
          </Pill>
          <EllipsisText lines={2} style={{ marginTop: 7, fontSize: compact ? 13 : 15, fontWeight: t.font.weight.semibold, lineHeight: 1.3, color: t.color.text }}>
            {block.signal}
          </EllipsisText>
        </div>
        <div
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
            <EllipsisText style={{ fontSize: compact ? 11 : 12, fontWeight: t.font.weight.semibold, color: t.color.faint }}>
              Proposed update
            </EllipsisText>
            <EllipsisText lines={2} style={{ marginTop: 5, fontSize: compact ? 12 : 13, lineHeight: 1.35, color: t.color.text }}>
              {block.proposal}
            </EllipsisText>
          </div>
          <Pill tone="neutral" style={{ minHeight: compact ? 22 : 24, fontSize: compact ? 10 : 11 }}>
            {block.confidence}
          </Pill>
        </div>
        <EllipsisText lines={2} style={{ fontSize: compact ? 11 : 12, lineHeight: 1.35, color: t.color.muted }}>
          {block.impact}
        </EllipsisText>
      </div>
    </BlockShell>
  );
}

export function ValidationLoopCard({ block, callout, cursor, compact = false, popover = "top", style }: CardProps<ValidationLoopSpec>) {
  return (
    <BlockShell
      slotId={block.slotId}
      title={block.title}
      icon={<RefreshCw size={compact ? 15 : 18} />}
      callout={callout}
      cursor={cursor}
      compact={compact}
      popover={popover}
      style={style}
    >
      <EllipsisText lines={2} style={{ marginTop: compact ? 9 : 12, fontSize: compact ? 12 : 14, lineHeight: 1.35, color: t.color.muted }}>
        {block.summary}
      </EllipsisText>
      <div style={{ marginTop: compact ? 10 : 14, display: "grid", gridTemplateColumns: "1fr 1fr auto", gap: compact ? 7 : 9 }}>
        <Pill tone="neutral" style={{ justifyContent: "center", minHeight: compact ? 24 : 28, fontSize: compact ? 10 : 11 }}>
          {block.iterationCount}
        </Pill>
        <Pill tone="good" style={{ justifyContent: "center", minHeight: compact ? 24 : 28, fontSize: compact ? 10 : 11 }}>
          {block.passRate}
        </Pill>
        <Pill tone="ai" style={{ justifyContent: "center", minHeight: compact ? 24 : 28, fontSize: compact ? 10 : 11 }}>
          {block.status}
        </Pill>
      </div>
      <div style={{ marginTop: compact ? 10 : 14, display: "grid", gap: compact ? 7 : 9 }}>
        {block.steps.map((step, index) => (
          <div
            key={`${index}-${step.label}`}
            style={{
              display: "grid",
              gridTemplateColumns: "auto 1fr auto",
              gap: 9,
              alignItems: "center",
              borderRadius: compact ? 13 : 15,
              background: t.color.surface,
              border: `1px solid ${t.color.border}`,
              padding: compact ? "9px 10px" : "11px 12px",
              minWidth: 0,
            }}
          >
            <span
              aria-hidden
              style={{
                width: compact ? 20 : 23,
                height: compact ? 20 : 23,
                borderRadius: 999,
                background: step.tone === "good" ? t.color.ai : t.color.app,
                border: `1px solid ${t.color.border}`,
                color: t.color.text,
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: compact ? 10 : 11,
                fontWeight: t.font.weight.semibold,
              }}
            >
              {index + 1}
            </span>
            <div style={{ minWidth: 0 }}>
              <EllipsisText style={{ fontSize: compact ? 12 : 13, fontWeight: t.font.weight.semibold, color: t.color.text }}>
                {step.label}
              </EllipsisText>
              <EllipsisText lines={1} style={{ marginTop: 3, fontSize: compact ? 10 : 11, color: t.color.muted }}>
                {step.detail}
              </EllipsisText>
            </div>
            <Pill tone={tone(step.tone)} style={{ minHeight: compact ? 21 : 23, fontSize: compact ? 9 : 10 }}>
              {step.status}
            </Pill>
          </div>
        ))}
      </div>
    </BlockShell>
  );
}

export function ControlPanelCard({ block, callout, cursor, compact = false, popover = "top", style }: CardProps<ControlPanelSpec>) {
  return (
    <BlockShell
      slotId={block.slotId}
      title={block.title}
      icon={<SlidersHorizontal size={compact ? 15 : 18} />}
      callout={callout}
      cursor={cursor}
      compact={compact}
      popover={popover}
      style={style}
    >
      <EllipsisText lines={2} style={{ marginTop: compact ? 9 : 12, fontSize: compact ? 12 : 14, lineHeight: 1.35, color: t.color.muted }}>
        {block.summary}
      </EllipsisText>
      <div style={{ marginTop: compact ? 10 : 14, display: "grid", gap: compact ? 7 : 9 }}>
        {block.items.map((item, index) => (
          <div
            key={`${index}-${item.label}`}
            style={{
              display: "grid",
              gridTemplateColumns: compact ? "minmax(0, 1fr) auto" : "minmax(0, 0.8fr) minmax(0, 1fr) auto",
              gap: compact ? 8 : 10,
              alignItems: "center",
              borderRadius: compact ? 13 : 15,
              background: item.tone === "ai" ? t.color.aiSoft : t.color.surface,
              border: `1px solid ${t.color.border}`,
              padding: compact ? "9px 10px" : "11px 12px",
              minWidth: 0,
            }}
          >
            <div style={{ minWidth: 0 }}>
              <EllipsisText style={{ fontSize: compact ? 10 : 11, fontWeight: t.font.weight.semibold, color: t.color.faint }}>
                {item.label}
              </EllipsisText>
              <EllipsisText style={{ marginTop: 3, fontSize: compact ? 12 : 14, fontWeight: t.font.weight.semibold, color: t.color.text }}>
                {item.value}
              </EllipsisText>
            </div>
            <Pill tone={tone(item.tone)} style={{ minHeight: compact ? 21 : 23, fontSize: compact ? 9 : 10 }}>
              {item.status}
            </Pill>
            <EllipsisText
              lines={compact ? 1 : 2}
              style={{
                gridColumn: compact ? "1 / -1" : "auto",
                minWidth: 0,
                fontSize: compact ? 10 : 12,
                lineHeight: 1.3,
                color: t.color.muted,
              }}
            >
              {item.detail}
            </EllipsisText>
          </div>
        ))}
      </div>
      {block.footer ? (
        <EllipsisText lines={2} style={{ marginTop: compact ? 9 : 12, fontSize: compact ? 11 : 12, lineHeight: 1.35, color: t.color.muted }}>
          {block.footer}
        </EllipsisText>
      ) : null}
    </BlockShell>
  );
}

export function AutonomyMatrixCard({ block, callout, cursor, compact = false, popover = "top", style }: CardProps<AutonomyMatrixSpec>) {
  return (
    <BlockShell
      slotId={block.slotId}
      title={block.title}
      icon={<ShieldCheck size={compact ? 15 : 18} />}
      callout={callout}
      cursor={cursor}
      compact={compact}
      popover={popover}
      style={style}
    >
      <EllipsisText lines={2} style={{ marginTop: compact ? 9 : 12, fontSize: compact ? 12 : 14, lineHeight: 1.35, color: t.color.muted }}>
        {block.summary}
      </EllipsisText>
      <div style={{ marginTop: compact ? 10 : 14, display: "grid", gap: compact ? 7 : 9 }}>
        {block.levels.map((level, index) => (
          <div
            key={`${index}-${level.label}`}
            style={{
              display: "grid",
              gridTemplateColumns: "auto minmax(0, 1fr) auto",
              gap: compact ? 8 : 10,
              alignItems: "center",
              borderRadius: compact ? 13 : 15,
              background: level.tone === "ai" ? t.color.aiSoft : t.color.surface,
              border: `1px solid ${t.color.border}`,
              padding: compact ? "9px 10px" : "11px 12px",
              minWidth: 0,
            }}
          >
            <span
              aria-hidden
              style={{
                width: compact ? 21 : 24,
                height: compact ? 21 : 24,
                borderRadius: 999,
                background: level.tone === "good" ? t.color.goodSoft : t.color.app,
                border: `1px solid ${t.color.border}`,
                color: t.color.text,
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: compact ? 10 : 11,
                fontWeight: t.font.weight.semibold,
              }}
            >
              {index + 1}
            </span>
            <div style={{ minWidth: 0 }}>
              <EllipsisText style={{ fontSize: compact ? 12 : 14, fontWeight: t.font.weight.semibold, color: t.color.text }}>
                {level.label}
              </EllipsisText>
              <EllipsisText lines={1} style={{ marginTop: 3, fontSize: compact ? 10 : 11, color: t.color.muted }}>
                {level.scope}
              </EllipsisText>
            </div>
            <Pill tone={tone(level.tone)} style={{ minHeight: compact ? 21 : 23, fontSize: compact ? 9 : 10 }}>
              {level.status}
            </Pill>
            <EllipsisText lines={1} style={{ gridColumn: "2 / -1", fontSize: compact ? 10 : 11, color: t.color.muted }}>
              {level.detail}
            </EllipsisText>
          </div>
        ))}
      </div>
      {block.guardrail ? (
        <EllipsisText lines={2} style={{ marginTop: compact ? 9 : 12, fontSize: compact ? 11 : 12, lineHeight: 1.35, color: t.color.muted }}>
          {block.guardrail}
        </EllipsisText>
      ) : null}
    </BlockShell>
  );
}

export function KnowledgeCoverageCard({ block, callout, cursor, compact = false, popover = "top", style }: CardProps<KnowledgeCoverageSpec>) {
  return (
    <BlockShell
      slotId={block.slotId}
      title={block.title}
      icon={<BookOpenCheck size={compact ? 15 : 18} />}
      callout={callout}
      cursor={cursor}
      compact={compact}
      popover={popover}
      style={style}
    >
      <EllipsisText lines={2} style={{ marginTop: compact ? 9 : 12, fontSize: compact ? 12 : 14, lineHeight: 1.35, color: t.color.muted }}>
        {block.summary}
      </EllipsisText>
      <div style={{ marginTop: compact ? 10 : 14, display: "grid", gap: compact ? 7 : 9 }}>
        {block.topics.map((topic, index) => (
          <div
            key={`${index}-${topic.label}`}
            style={{
              display: "grid",
              gridTemplateColumns: "minmax(0, 1fr) auto auto",
              gap: compact ? 7 : 9,
              alignItems: "center",
              borderRadius: compact ? 13 : 15,
              background: topic.tone === "ai" ? t.color.aiSoft : t.color.surface,
              border: `1px solid ${t.color.border}`,
              padding: compact ? "9px 10px" : "11px 12px",
              minWidth: 0,
            }}
          >
            <div style={{ minWidth: 0 }}>
              <EllipsisText style={{ fontSize: compact ? 12 : 14, fontWeight: t.font.weight.semibold, color: t.color.text }}>
                {topic.label}
              </EllipsisText>
              <EllipsisText lines={1} style={{ marginTop: 3, fontSize: compact ? 10 : 11, color: t.color.muted }}>
                {topic.detail}
              </EllipsisText>
            </div>
            <Pill tone="neutral" style={{ minHeight: compact ? 21 : 23, fontSize: compact ? 9 : 10 }}>
              {topic.coverage}
            </Pill>
            <Pill tone={tone(topic.tone)} style={{ minHeight: compact ? 21 : 23, fontSize: compact ? 9 : 10 }}>
              {topic.status}
            </Pill>
          </div>
        ))}
      </div>
      {block.freshness ? (
        <EllipsisText lines={2} style={{ marginTop: compact ? 9 : 12, fontSize: compact ? 11 : 12, lineHeight: 1.35, color: t.color.muted }}>
          {block.freshness}
        </EllipsisText>
      ) : null}
    </BlockShell>
  );
}

export function EvaluationScorecardCard({ block, callout, cursor, compact = false, popover = "top", style }: CardProps<EvaluationScorecardSpec>) {
  return (
    <BlockShell
      slotId={block.slotId}
      title={block.title}
      icon={<Gauge size={compact ? 15 : 18} />}
      callout={callout}
      cursor={cursor}
      compact={compact}
      popover={popover}
      style={style}
    >
      <EllipsisText lines={2} style={{ marginTop: compact ? 9 : 12, fontSize: compact ? 12 : 14, lineHeight: 1.35, color: t.color.muted }}>
        {block.summary}
      </EllipsisText>
      <div style={{ marginTop: compact ? 10 : 14, display: "grid", gap: compact ? 7 : 9 }}>
        {block.checks.map((check, index) => (
          <div
            key={`${index}-${check.label}`}
            style={{
              display: "grid",
              gridTemplateColumns: "minmax(0, 1fr) auto auto",
              gap: compact ? 7 : 9,
              alignItems: "center",
              borderRadius: compact ? 13 : 15,
              background: check.tone === "ai" ? t.color.aiSoft : t.color.surface,
              border: `1px solid ${t.color.border}`,
              padding: compact ? "9px 10px" : "11px 12px",
              minWidth: 0,
            }}
          >
            <div style={{ minWidth: 0 }}>
              <EllipsisText style={{ fontSize: compact ? 12 : 14, fontWeight: t.font.weight.semibold, color: t.color.text }}>
                {check.label}
              </EllipsisText>
              <EllipsisText lines={1} style={{ marginTop: 3, fontSize: compact ? 10 : 11, color: t.color.muted }}>
                {check.detail}
              </EllipsisText>
            </div>
            <Pill tone="neutral" style={{ minHeight: compact ? 21 : 23, fontSize: compact ? 9 : 10 }}>
              {check.score}
            </Pill>
            <Pill tone={tone(check.tone)} style={{ minHeight: compact ? 21 : 23, fontSize: compact ? 9 : 10 }}>
              {check.status}
            </Pill>
          </div>
        ))}
      </div>
      {block.verdict ? (
        <EllipsisText lines={2} style={{ marginTop: compact ? 9 : 12, fontSize: compact ? 11 : 12, lineHeight: 1.35, color: t.color.muted }}>
          {block.verdict}
        </EllipsisText>
      ) : null}
    </BlockShell>
  );
}

export function IntegrationHealthCard({ block, callout, cursor, compact = false, popover = "top", style }: CardProps<IntegrationHealthSpec>) {
  return (
    <BlockShell
      slotId={block.slotId}
      title={block.title}
      icon={<PlugZap size={compact ? 15 : 18} />}
      callout={callout}
      cursor={cursor}
      compact={compact}
      popover={popover}
      style={style}
    >
      <EllipsisText lines={2} style={{ marginTop: compact ? 9 : 12, fontSize: compact ? 12 : 14, lineHeight: 1.35, color: t.color.muted }}>
        {block.summary}
      </EllipsisText>
      <div style={{ marginTop: compact ? 10 : 14, display: "grid", gap: compact ? 7 : 9 }}>
        {block.systems.map((system, index) => (
          <div
            key={`${index}-${system.name}`}
            style={{
              display: "grid",
              gridTemplateColumns: "minmax(0, 1fr) auto auto",
              gap: compact ? 7 : 9,
              alignItems: "center",
              borderRadius: compact ? 13 : 15,
              background: system.tone === "ai" ? t.color.aiSoft : t.color.surface,
              border: `1px solid ${t.color.border}`,
              padding: compact ? "9px 10px" : "11px 12px",
              minWidth: 0,
            }}
          >
            <div style={{ minWidth: 0 }}>
              <EllipsisText style={{ fontSize: compact ? 12 : 14, fontWeight: t.font.weight.semibold, color: t.color.text }}>
                {system.name}
              </EllipsisText>
              <EllipsisText lines={1} style={{ marginTop: 3, fontSize: compact ? 10 : 11, color: t.color.muted }}>
                {system.detail}
              </EllipsisText>
            </div>
            <EllipsisText style={{ fontSize: compact ? 10 : 11, fontWeight: t.font.weight.semibold, color: t.color.faint }}>
              {system.metric}
            </EllipsisText>
            <Pill tone={tone(system.tone)} style={{ minHeight: compact ? 21 : 23, fontSize: compact ? 9 : 10 }}>
              {system.status}
            </Pill>
          </div>
        ))}
      </div>
      {block.lastSync ? (
        <Pill tone="neutral" style={{ marginTop: compact ? 9 : 12, minHeight: compact ? 22 : 24, fontSize: compact ? 10 : 11 }}>
          {block.lastSync}
        </Pill>
      ) : null}
    </BlockShell>
  );
}

export function ChannelMatrixCard({ block, callout, cursor, compact = false, popover = "top", style }: CardProps<ChannelMatrixSpec>) {
  return (
    <BlockShell
      slotId={block.slotId}
      title={block.title}
      icon={<MessagesSquare size={compact ? 15 : 18} />}
      callout={callout}
      cursor={cursor}
      compact={compact}
      popover={popover}
      style={style}
    >
      <EllipsisText lines={2} style={{ marginTop: compact ? 9 : 12, fontSize: compact ? 12 : 14, lineHeight: 1.35, color: t.color.muted }}>
        {block.summary}
      </EllipsisText>
      <div style={{ marginTop: compact ? 10 : 14, display: "grid", gap: compact ? 7 : 9 }}>
        {block.channels.map((channel, index) => (
          <div
            key={`${index}-${channel.channel}`}
            style={{
              display: "grid",
              gridTemplateColumns: "minmax(0, 1fr) auto auto",
              gap: compact ? 7 : 9,
              alignItems: "center",
              borderRadius: compact ? 13 : 15,
              background: channel.tone === "ai" ? t.color.aiSoft : t.color.surface,
              border: `1px solid ${t.color.border}`,
              padding: compact ? "9px 10px" : "11px 12px",
              minWidth: 0,
            }}
          >
            <div style={{ minWidth: 0 }}>
              <EllipsisText style={{ fontSize: compact ? 12 : 14, fontWeight: t.font.weight.semibold, color: t.color.text }}>
                {channel.channel}
              </EllipsisText>
              <EllipsisText lines={1} style={{ marginTop: 3, fontSize: compact ? 10 : 11, color: t.color.muted }}>
                {channel.volume}
              </EllipsisText>
            </div>
            <Pill tone={tone(channel.tone)} style={{ minHeight: compact ? 21 : 23, fontSize: compact ? 9 : 10 }}>
              {channel.resolution}
            </Pill>
            <EllipsisText style={{ fontSize: compact ? 10 : 11, fontWeight: t.font.weight.semibold, color: t.color.faint }}>
              {channel.latency}
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
    blocks.autonomyMatrices?.length ||
    blocks.controlPanels?.length ||
    blocks.knowledgeCoverages?.length ||
    blocks.evaluationScorecards?.length ||
    blocks.integrationHealths?.length ||
    blocks.channelMatrices?.length ||
    blocks.actionTrails?.length ||
    blocks.improvementSignals?.length ||
    blocks.validationLoops?.length ||
    blocks.instructionSections?.length ||
    blocks.reviewQueues?.length ||
    blocks.toolCallLists?.length,
  );
}

export function ReusableBlockStack({
  logicBlocks,
  autonomyMatrices,
  controlPanels,
  knowledgeCoverages,
  evaluationScorecards,
  integrationHealths,
  channelMatrices,
  actionTrails,
  improvementSignals,
  validationLoops,
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
    ...(autonomyMatrices ?? []).map((block) => ({
      key: `autonomy-${block.slotId}`,
      node: <AutonomyMatrixCard block={block} callout={callout} cursor={cursor} compact={compact} popover={popover} />,
    })),
    ...(controlPanels ?? []).map((block) => ({
      key: `control-${block.slotId}`,
      node: <ControlPanelCard block={block} callout={callout} cursor={cursor} compact={compact} popover={popover} />,
    })),
    ...(knowledgeCoverages ?? []).map((block) => ({
      key: `knowledge-${block.slotId}`,
      node: <KnowledgeCoverageCard block={block} callout={callout} cursor={cursor} compact={compact} popover={popover} />,
    })),
    ...(evaluationScorecards ?? []).map((block) => ({
      key: `evaluation-${block.slotId}`,
      node: <EvaluationScorecardCard block={block} callout={callout} cursor={cursor} compact={compact} popover={popover} />,
    })),
    ...(integrationHealths ?? []).map((block) => ({
      key: `integration-${block.slotId}`,
      node: <IntegrationHealthCard block={block} callout={callout} cursor={cursor} compact={compact} popover={popover} />,
    })),
    ...(channelMatrices ?? []).map((block) => ({
      key: `channel-${block.slotId}`,
      node: <ChannelMatrixCard block={block} callout={callout} cursor={cursor} compact={compact} popover={popover} />,
    })),
    ...(actionTrails ?? []).map((block) => ({
      key: `action-trail-${block.slotId}`,
      node: <ActionTrailCard block={block} callout={callout} cursor={cursor} compact={compact} popover={popover} />,
    })),
    ...(improvementSignals ?? []).map((block) => ({
      key: `improvement-${block.slotId}`,
      node: <ImprovementSignalCard block={block} callout={callout} cursor={cursor} compact={compact} popover={popover} />,
    })),
    ...(validationLoops ?? []).map((block) => ({
      key: `validation-${block.slotId}`,
      node: <ValidationLoopCard block={block} callout={callout} cursor={cursor} compact={compact} popover={popover} />,
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
