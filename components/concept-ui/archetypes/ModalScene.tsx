"use client";

import { Bot, CheckCircle2, Layers3, Sparkles } from "lucide-react";
import type { ModalSceneSpec } from "@/lib/concept-ui/scene-spec";
import { conceptSceneTokens as t } from "@/lib/concept-ui/scene-tokens";
import { Card, EllipsisText, Pill, Slot } from "../primitives";

type Props = {
  spec: ModalSceneSpec;
};

function backgroundLabel(type: ModalSceneSpec["content"]["background"]["type"]): string {
  if (type === "builder") return "Workflow canvas";
  if (type === "dashboard") return "Metric dashboard";
  if (type === "table") return "Data grid";
  return "Inbox workspace";
}

export function ModalScene({ spec }: Props) {
  const { content } = spec;
  const callout = spec.modifiers.aiCallout;
  const cursor = spec.modifiers.cursor;

  return (
    <div
      style={{
        position: "relative",
        width: 1370,
        height: 790,
        borderRadius: t.radius.lg,
        overflow: "hidden",
        background: t.color.surface,
        border: `1px solid ${t.color.border}`,
        boxShadow: t.shadow.card,
      }}
    >
      <div
        aria-hidden
        style={{
          position: "absolute",
          inset: 0,
          padding: 34,
          filter: "blur(4px)",
          opacity: 0.22,
          transform: "scale(1.02)",
        }}
      >
        <div
          style={{
            height: 72,
            borderRadius: 20,
            background: t.color.app,
            border: `1px solid ${t.color.border}`,
            display: "flex",
            alignItems: "center",
            padding: "0 24px",
            gap: 12,
          }}
        >
          <Layers3 size={22} color={t.color.text} />
          <EllipsisText style={{ fontSize: 23, fontWeight: 800, color: t.color.text }}>
            {content.background.title}
          </EllipsisText>
          <Pill tone="neutral" style={{ marginLeft: "auto" }}>{backgroundLabel(content.background.type)}</Pill>
        </div>
        <div
          style={{
            marginTop: 24,
            display: "grid",
            gridTemplateColumns: content.background.type === "dashboard" ? "repeat(2, 1fr)" : "1fr 1fr 1fr",
            gap: 18,
          }}
        >
          {content.background.items.map((item, index) => (
            <div
              key={`${index}-${item}`}
              style={{
                minHeight: content.background.type === "dashboard" ? 170 : 230,
                borderRadius: 24,
                background: t.color.app,
                border: `1px solid ${t.color.border}`,
                padding: 24,
              }}
            >
              <div
                style={{
                  width: 42,
                  height: 42,
                  borderRadius: 14,
                  background: index === 0 ? t.color.aiSoft : t.color.surface,
                }}
              />
              <EllipsisText lines={2} style={{ marginTop: 18, fontSize: 22, fontWeight: 800, color: t.color.text }}>
                {item}
              </EllipsisText>
              <div style={{ marginTop: 20, height: 12, width: "70%", borderRadius: 999, background: t.color.border }} />
              <div style={{ marginTop: 12, height: 12, width: "48%", borderRadius: 999, background: t.color.border }} />
            </div>
          ))}
        </div>
      </div>

      <div
        aria-hidden
        style={{
          position: "absolute",
          inset: 0,
          background: t.overlay.modal,
        }}
      />

      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 60,
        }}
      >
        <Card
          primaryPanel
          style={{
            width: 820,
            minHeight: 520,
            borderRadius: 30,
            boxShadow: t.shadow.modal,
            overflow: "visible",
          }}
        >
          <Slot
            id={content.modal.slotId}
            callout={callout}
            cursor={cursor}
            popover="right"
            style={{ padding: 34, borderRadius: 30 }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 18 }}>
              <Pill tone={content.modal.kind === "ai-result" ? "ai" : "neutral"}>{content.modal.eyebrow}</Pill>
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 14,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  background: content.modal.kind === "ai-result" ? t.color.aiSoft : t.color.surface,
                  color: t.color.ink,
                }}
              >
                {content.modal.kind === "confirmation" ? <CheckCircle2 size={22} /> : <Sparkles size={22} />}
              </div>
            </div>
            <EllipsisText style={{ marginTop: 22, fontSize: 36, fontWeight: 850, color: t.color.text }}>
              {content.modal.title}
            </EllipsisText>
            <EllipsisText lines={3} style={{ marginTop: 13, fontSize: 20, lineHeight: 1.42, color: t.color.muted }}>
              {content.modal.description}
            </EllipsisText>

            <div style={{ marginTop: 28, display: "flex", flexDirection: "column", gap: 13 }}>
              {content.modal.fields.map((field) => (
                <Slot
                  key={field.slotId}
                  id={field.slotId}
                  callout={callout}
                  cursor={cursor}
                  popover="left"
                  style={{
                    display: "grid",
                    gridTemplateColumns: "145px 1fr",
                    gap: 18,
                    alignItems: "center",
                    borderRadius: 16,
                    background: t.color.surface,
                    border: `1px solid ${t.color.border}`,
                    padding: "15px 18px",
                  }}
                >
                  <EllipsisText style={{ fontSize: 14, fontWeight: 800, color: t.color.faint }}>
                    {field.label}
                  </EllipsisText>
                  <EllipsisText style={{ fontSize: 17, fontWeight: 800, color: t.color.text }}>
                    {field.value}
                  </EllipsisText>
                </Slot>
              ))}
            </div>

            <div style={{ marginTop: 30, display: "flex", justifyContent: "flex-end", gap: 12 }}>
              {content.modal.actions.map((action, index) => (
                <button
                  key={`${index}-${action.label}`}
                  type="button"
                  style={{
                    border: action.tone === "primary" ? 0 : `1px solid ${t.color.border}`,
                    borderRadius: 16,
                    background: action.tone === "primary" ? t.color.ink : t.color.surface,
                    color: action.tone === "primary" ? t.color.inverse : t.color.text,
                    minWidth: 132,
                    minHeight: 48,
                    padding: "0 18px",
                    fontSize: 16,
                    fontWeight: 850,
                  }}
                >
                  {action.label}
                </button>
              ))}
            </div>

            <div style={{ marginTop: 20, display: "flex", alignItems: "center", gap: 8, color: t.color.muted, fontSize: 14 }}>
              <Bot size={16} />
              {content.subtitle}
            </div>
          </Slot>
        </Card>
      </div>
    </div>
  );
}
