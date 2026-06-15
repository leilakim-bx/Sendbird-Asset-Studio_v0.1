"use client";

import { ArrowLeft, Check, ChevronDown, Code2, Link2, MoreHorizontal, Send, Strikethrough, Underline } from "lucide-react";
import type { ReactNode } from "react";
import type { WorkspaceSceneSpec } from "@/lib/concept-ui/scene-spec";
import { conceptSceneTokens as t } from "@/lib/concept-ui/scene-tokens";
import { hasReusableBlocks, ReusableBlockStack } from "../blocks/ReusableBlockCards";
import { Card, DelightMark, EllipsisText, Pill, Slot } from "../primitives";

type Props = {
  spec: WorkspaceSceneSpec;
};

function ToolButton({ children, wide = false }: { children: ReactNode; wide?: boolean }) {
  return (
    <span
      style={{
        minWidth: wide ? "auto" : t.control.toolbarButton.minWidth,
        height: t.control.toolbarButton.height,
        borderRadius: t.control.toolbarButton.radius,
        padding: `0 ${wide ? t.control.toolbarButton.widePaddingX : t.control.toolbarButton.paddingX}px`,
        background: t.color.surface,
        border: `1px solid ${t.color.border}`,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        color: t.color.muted,
        fontSize: t.control.toolbarButton.fontSize,
        fontWeight: 800,
        boxSizing: "border-box",
      }}
    >
      {children}
    </span>
  );
}

export function WorkspaceScene({ spec }: Props) {
  const { content } = spec;
  const callout = spec.modifiers.aiCallout;
  const cursor = spec.modifiers.cursor;
  const hasBlocks = hasReusableBlocks(content);

  return (
    <Card
      primaryPanel
      style={{
        width: 1370,
        height: 790,
        overflow: "hidden",
        display: "grid",
        gridTemplateRows: "102px 86px 1fr",
        borderRadius: t.radius.md,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 40px",
          borderBottom: `1px solid ${t.color.border}`,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 17, minWidth: 0 }}>
          <DelightMark size={44} />
          <div style={{ minWidth: 0 }}>
            <EllipsisText style={{ fontSize: 29, fontWeight: 800, color: t.color.text }}>
              {content.title}
            </EllipsisText>
            <EllipsisText style={{ marginTop: 6, fontSize: 15, color: t.color.muted }}>
              {content.subtitle}
            </EllipsisText>
          </div>
        </div>
        <MoreHorizontal size={26} color={t.color.muted} />
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 16,
          padding: "0 40px",
          borderBottom: `1px solid ${t.color.border}`,
        }}
      >
        <ArrowLeft size={24} color={t.color.muted} />
        <EllipsisText style={{ fontSize: 24, fontWeight: 800, color: t.color.text }}>
          {content.editor.title}
        </EllipsisText>
        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 14 }}>
          {content.filters.map((filter, index) => (
            <Pill key={`${index}-${filter}`} tone={index === 0 ? "ai" : "neutral"} style={{ minHeight: t.control.pill.largeMinHeight, fontSize: t.control.pill.largeFontSize }}>
              {filter}
            </Pill>
          ))}
          <button
            type="button"
            style={{
              border: `1px solid ${t.color.border}`,
              borderRadius: 14,
              background: t.color.app,
              color: t.color.text,
              minHeight: t.control.actionButton.minHeight,
              padding: `0 ${t.control.actionButton.paddingX}px`,
              fontSize: 18,
              fontWeight: 800,
            }}
          >
            Save
          </button>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "600px 1fr 310px", minHeight: 0 }}>
        <Slot
          id={content.editor.slotId}
          callout={callout}
          cursor={cursor}
          popover="right"
          style={{
            minWidth: 0,
            padding: "0 40px 36px",
            borderRight: `1px solid ${t.color.border}`,
            overflow: "hidden",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 14, height: 72 }}>
            <ToolButton wide>
              Normal <ChevronDown size={16} />
            </ToolButton>
            <ToolButton>B</ToolButton>
            <ToolButton>
              <Underline size={18} />
            </ToolButton>
            <ToolButton>
              <Strikethrough size={18} />
            </ToolButton>
            <ToolButton>
              <Code2 size={18} />
            </ToolButton>
            <ToolButton>
              <Link2 size={18} />
            </ToolButton>
          </div>

          <div style={{ marginTop: 26 }}>
            <EllipsisText style={{ fontSize: 17, fontWeight: 850, letterSpacing: "0.12em", color: t.color.faint }}>
              {content.editor.eyebrow}
            </EllipsisText>
            <div
              style={{
                marginTop: 14,
                border: `1px solid ${t.color.border}`,
                borderRadius: 18,
                background: t.color.app,
                padding: 18,
              }}
            >
              <EllipsisText lines={2} style={{ fontSize: 19, lineHeight: 1.4, color: t.color.muted }}>
                {content.editor.body}
              </EllipsisText>
            </div>

            <div style={{ marginTop: 22, display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
              <EllipsisText style={{ fontSize: 24, fontWeight: 850, color: t.color.text }}>
                Key points
              </EllipsisText>
              {content.editor.tags.map((tag, index) => (
                <Pill key={`${index}-${tag}`} tone={index === 0 ? "neutral" : "ai"} style={{ fontSize: 12, minHeight: t.control.pill.denseMinHeight }}>
                  {tag}
                </Pill>
              ))}
            </div>
            <div style={{ marginTop: 14, display: "flex", flexDirection: "column", gap: 10 }}>
              {content.editor.keyPoints.slice(0, 2).map((point, index) => (
                <EllipsisText key={`${index}-${point}`} lines={2} style={{ fontSize: 17, lineHeight: 1.42, color: t.color.muted }}>
                  {point}
                </EllipsisText>
              ))}
            </div>
          </div>
        </Slot>

        <Slot
          id={content.preview.slotId}
          callout={callout}
          cursor={cursor}
          popover="top"
          style={{
            minWidth: 0,
            background: t.color.surface,
            borderRight: `1px solid ${t.color.border}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 34,
          }}
        >
          <div style={{ width: "100%", maxWidth: 340 }}>
            <EllipsisText style={{ textAlign: "center", fontSize: 23, fontWeight: 800, color: t.color.faint }}>
              {content.preview.emptyLabel}
            </EllipsisText>
            {hasBlocks ? (
              <ReusableBlockStack
                {...content}
                callout={callout}
                cursor={cursor}
                compact
                max={1}
                style={{ marginTop: 22, boxShadow: t.shadow.none }}
              />
            ) : (
              <div style={{ marginTop: 26, display: "grid", gap: 13 }}>
                {content.preview.cards.map((card, index) => (
                  <div
                    key={`${index}-${card}`}
                    style={{
                      borderRadius: 17,
                      border: `1px solid ${t.color.border}`,
                      background: t.color.app,
                      padding: 16,
                      color: t.color.muted,
                      fontSize: 15,
                      fontWeight: 700,
                    }}
                  >
                    <EllipsisText>{card}</EllipsisText>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Slot>

        <Slot
          id={content.tester.slotId}
          callout={callout}
          cursor={cursor}
          popover="left"
          style={{ minWidth: 0, padding: "26px 28px", overflow: "hidden" }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 14 }}>
            <EllipsisText style={{ fontSize: 20, fontWeight: 850, color: t.color.text }}>
              Tester
            </EllipsisText>
            <Pill tone="neutral" style={{ minHeight: t.control.pill.menuMinHeight, fontSize: t.control.pill.fontSize }}>
              {content.tester.status} <ChevronDown size={15} />
            </Pill>
          </div>

          <div style={{ marginTop: 28, display: "flex", alignItems: "center", gap: 12 }}>
            <span aria-hidden style={{ width: 36, height: 36, borderRadius: 999, background: t.color.ink, display: "inline-flex", alignItems: "center", justifyContent: "center", color: t.color.ai, fontWeight: 900 }}>
              <Check size={18} />
            </span>
            <EllipsisText style={{ fontSize: 18, fontWeight: 850, color: t.color.muted }}>
              {content.tester.agentName}
            </EllipsisText>
          </div>

          <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 8 }}>
            {content.tester.messages.slice(0, 2).map((message, index) => (
              <div
                key={`${index}-${message.text}`}
                style={{
                  height: 60,
                  borderRadius: 16,
                  background: message.author === "ai" ? t.color.surface : t.color.app,
                  border: message.author === "user" ? `1px solid ${t.color.border}` : undefined,
                  overflow: "hidden",
                  padding: "8px 12px",
                }}
              >
                <EllipsisText lines={2} style={{ fontSize: 14, lineHeight: 1.35, color: t.color.text }}>
                  {message.text}
                </EllipsisText>
              </div>
            ))}
          </div>

          <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 8 }}>
            {content.tester.replies.slice(0, 2).map((reply, index) => (
              <div
                key={`${index}-${reply}`}
                style={{
                  minHeight: 36,
                  borderRadius: 14,
                  border: `1px solid ${t.color.border}`,
                  display: "flex",
                  alignItems: "center",
                  padding: "0 14px",
                  color: t.color.muted,
                  fontSize: 14,
                  fontWeight: 800,
                }}
              >
                <EllipsisText>{reply}</EllipsisText>
              </div>
            ))}
          </div>

          <div
            style={{
              marginTop: 12,
              minHeight: 42,
              borderRadius: 17,
              border: `1px solid ${t.color.border}`,
              display: "flex",
              alignItems: "center",
              gap: 12,
              padding: "0 18px",
              color: t.color.faint,
              fontSize: 18,
            }}
          >
            Ask a question
            <Send size={22} style={{ marginLeft: "auto", color: t.color.ink }} />
          </div>
        </Slot>
      </div>
    </Card>
  );
}
