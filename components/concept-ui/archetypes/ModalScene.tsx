"use client";

import { Bot, CheckCircle2, Sparkles } from "lucide-react";
import type { ModalSceneSpec } from "@/lib/concept-ui/scene-spec";
import { conceptSceneTokens as t } from "@/lib/concept-ui/scene-tokens";
import { hasReusableBlocks, ReusableBlockStack } from "../blocks/ReusableBlockCards";
import { Card, EllipsisText, Pill, Slot } from "../primitives";

type Props = {
  spec: ModalSceneSpec;
};

function productEyebrow(value: string): string {
  if (/pre[-\s]?filled/i.test(value)) return "Ready to review";
  return value;
}

function productCallout(callout: ModalSceneSpec["modifiers"]["aiCallout"]) {
  if (!callout) return undefined;
  return {
    ...callout,
    label: /pre[-\s]?filled/i.test(callout.label) ? "Generated draft" : callout.label,
  };
}

export function ModalScene({ spec }: Props) {
  const { content } = spec;
  const callout = productCallout(spec.modifiers.aiCallout);
  const cursor = spec.modifiers.cursor;
  const hasBlocks = hasReusableBlocks(content);
  const calloutOnModal = callout?.targetSlotId === content.modal.slotId;

  return (
    <div
      style={{
        position: "relative",
        width: 1370,
        height: 790,
        borderRadius: t.radius.md,
        overflow: "hidden",
        background: t.color.page,
      }}
    >
      <div
        aria-hidden
        style={{
          position: "absolute",
          inset: 0,
          overflow: "hidden",
          background: t.color.surface,
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 58,
            filter: "blur(7px)",
            opacity: 0.12,
            transform: "scale(1.02)",
          }}
        >
          <div
            style={{
              height: 54,
              display: "flex",
              alignItems: "center",
              gap: 12,
              padding: "0 10px",
            }}
          >
            <div style={{ width: 36, height: 36, borderRadius: t.radius.sm, background: t.color.border }} />
            <div style={{ width: 240, height: 18, borderRadius: t.radius.sm, background: t.color.border }} />
            <div style={{ marginLeft: "auto", width: 120, height: 30, borderRadius: t.radius.sm, background: t.color.border }} />
          </div>
          <div style={{ marginTop: 42, display: "grid", gridTemplateColumns: "260px 1fr", gap: 36, minHeight: 0 }}>
            <div
              style={{
                minHeight: 540,
                padding: 10,
                display: "flex",
                flexDirection: "column",
                gap: 16,
              }}
            >
              {content.background.items.slice(0, 5).map((item, index) => (
                <div key={`${index}-${item}`} style={{ height: 54, borderRadius: t.radius.md, background: index === 0 ? t.color.aiSoft : t.color.app }} />
              ))}
            </div>
            <div style={{ padding: 10, display: "grid", gridTemplateRows: "repeat(4, 86px)", gap: 18 }}>
              {content.background.items.slice(0, 4).map((item, index) => (
                <div key={`${index}-${item}`} style={{ borderRadius: t.radius.md, background: t.color.app }} />
              ))}
            </div>
          </div>
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
            width: calloutOnModal ? 980 : 820,
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
            popover={calloutOnModal ? "inside-right" : "right"}
            style={{ padding: 34, paddingRight: calloutOnModal ? 360 : 34, borderRadius: 30 }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 18 }}>
              <Pill tone={content.modal.kind === "ai-result" ? "ai" : "neutral"}>{productEyebrow(content.modal.eyebrow)}</Pill>
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

            {hasBlocks ? (
              <ReusableBlockStack
                {...content}
                callout={callout}
                cursor={cursor}
                compact
                max={1}
                style={{ marginTop: 24, boxShadow: t.shadow.none }}
              />
            ) : (
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
            )}

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
