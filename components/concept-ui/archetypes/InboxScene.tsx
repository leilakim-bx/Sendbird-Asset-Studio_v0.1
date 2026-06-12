"use client";

import { Bot, CheckCircle2, ChevronRight, Clock, Menu, MoreHorizontal, Search, Send } from "lucide-react";
import type { InboxSceneSpec } from "@/lib/concept-ui/scene-spec";
import { conceptSceneTokens as t } from "@/lib/concept-ui/scene-tokens";
import { AvatarInitials, Card, EllipsisText, Pill, Slot } from "../primitives";

type Props = {
  spec: InboxSceneSpec;
};

export function InboxScene({ spec }: Props) {
  const { content } = spec;
  const callout = spec.modifiers.aiCallout;
  const cursor = spec.modifiers.cursor;

  return (
    <Card
      primaryPanel
      style={{
        width: 1370,
        height: 790,
        overflow: "visible",
        display: "grid",
        gridTemplateRows: "88px 1fr",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 34px",
          borderBottom: `1px solid ${t.color.border}`,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          <div
            style={{
              width: 46,
              height: 46,
              borderRadius: 15,
              background: t.color.ink,
              color: t.color.inverse,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Bot size={25} strokeWidth={2.5} />
          </div>
          <div>
            <EllipsisText style={{ fontSize: 28, fontWeight: 800, color: t.color.text }}>{content.title}</EllipsisText>
            <EllipsisText style={{ marginTop: 4, fontSize: 15, color: t.color.muted }}>{content.productName}</EllipsisText>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 13 }}>
          <Pill tone="ai">AI live</Pill>
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 14,
              border: `1px solid ${t.color.border}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <MoreHorizontal size={24} />
          </div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "360px 1fr 340px", minHeight: 0 }}>
        <aside style={{ borderRight: `1px solid ${t.color.border}`, padding: 24, minWidth: 0 }}>
          <div
            style={{
              height: 46,
              borderRadius: 14,
              background: t.color.surface,
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "0 15px",
              color: t.color.muted,
              fontSize: 16,
            }}
          >
            <Search size={18} />
            Search conversations
          </div>
          <div style={{ marginTop: 22, display: "flex", flexDirection: "column", gap: 12 }}>
            {content.conversations.map((conversation, index) => (
              <Slot
                key={conversation.slotId}
                id={conversation.slotId}
                callout={callout}
                cursor={cursor}
                popover="right"
                style={{
                  borderRadius: 20,
                  background: index === 0 ? t.color.surface : t.color.app,
                  border: `1px solid ${index === 0 ? t.color.borderStrong : t.color.border}`,
                  padding: 18,
                }}
              >
                <div style={{ display: "flex", gap: 13, minWidth: 0 }}>
                  <AvatarInitials name={conversation.customer} size={42} />
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <EllipsisText style={{ fontSize: 18, fontWeight: 800, color: t.color.text }}>
                        {conversation.title}
                      </EllipsisText>
                      <span style={{ marginLeft: "auto", fontSize: 13, color: t.color.faint }}>{conversation.time}</span>
                    </div>
                    <EllipsisText style={{ marginTop: 6, fontSize: 15, lineHeight: 1.35, color: t.color.muted }} lines={2}>
                      {conversation.preview}
                    </EllipsisText>
                    <div style={{ marginTop: 11, display: "flex", alignItems: "center", gap: 8 }}>
                      <Pill tone={index === 0 ? "warn" : "neutral"} style={{ minHeight: 24, padding: "4px 8px", fontSize: 12 }}>
                        {conversation.status}
                      </Pill>
                      {conversation.score ? (
                        <span style={{ fontSize: 13, color: t.color.faint }}>{conversation.score}</span>
                      ) : null}
                    </div>
                  </div>
                </div>
              </Slot>
            ))}
          </div>
        </aside>

        <main style={{ padding: 30, minWidth: 0, background: t.color.surface }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 18 }}>
            <div>
              <EllipsisText style={{ fontSize: 30, fontWeight: 800, color: t.color.text }}>
                {content.thread.customerName}
              </EllipsisText>
              <div style={{ display: "flex", alignItems: "center", gap: 9, marginTop: 8, color: t.color.muted, fontSize: 16 }}>
                <CheckCircle2 size={17} color={t.color.success} />
                {content.thread.statusLabel}
              </div>
            </div>
            <button
              type="button"
              style={{
                border: 0,
                borderRadius: 16,
                background: t.color.ink,
                color: t.color.inverse,
                padding: "13px 20px",
                fontSize: 17,
                fontWeight: 800,
              }}
            >
              Approve reply
            </button>
          </div>

          <div style={{ marginTop: 26, display: "flex", flexDirection: "column", gap: 18 }}>
            {content.thread.messages.map((message, index) => {
              const isCustomer = message.author === "customer";
              const isAi = message.author === "ai";
              return (
                <Slot
                  key={message.slotId ?? `${message.author}-${message.timestamp}-${index}`}
                  id={message.slotId ?? `${message.author}-${message.timestamp}`}
                  callout={callout}
                  cursor={cursor}
                  popover="right"
                  style={{
                    marginLeft: isCustomer ? 0 : 62,
                    marginRight: isCustomer ? 62 : 0,
                    borderRadius: 24,
                    background: isAi ? t.color.aiSoft : t.color.app,
                    border: `1px solid ${isAi ? t.color.ai : t.color.border}`,
                    padding: 22,
                  }}
                >
                  <div style={{ display: "flex", gap: 14 }}>
                    {isCustomer ? <AvatarInitials name={message.name} size={42} /> : null}
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 9, color: t.color.muted }}>
                        {isAi ? <Bot size={18} color={t.color.ink} /> : null}
                        <EllipsisText style={{ fontSize: 15, fontWeight: 800, color: t.color.text }}>
                          {message.name}
                        </EllipsisText>
                        <span style={{ fontSize: 13, color: t.color.faint }}>{message.timestamp}</span>
                      </div>
                      <EllipsisText lines={3} style={{ marginTop: 10, fontSize: 20, lineHeight: 1.4, color: t.color.text }}>
                        {message.text}
                      </EllipsisText>
                    </div>
                  </div>
                </Slot>
              );
            })}
          </div>

          <div
            style={{
              marginTop: 26,
              height: 62,
              borderRadius: 19,
              background: t.color.app,
              border: `1px solid ${t.color.border}`,
              display: "flex",
              alignItems: "center",
              padding: "0 18px",
              gap: 12,
              color: t.color.faint,
              fontSize: 17,
            }}
          >
            <Menu size={20} />
            Write a response
            <Send size={20} style={{ marginLeft: "auto", color: t.color.ink }} />
          </div>
        </main>

        <aside style={{ borderLeft: `1px solid ${t.color.border}`, padding: 24, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 13 }}>
            <AvatarInitials name={content.context.customerName} size={48} />
            <div style={{ minWidth: 0 }}>
              <EllipsisText style={{ fontSize: 23, fontWeight: 800, color: t.color.text }}>
                {content.context.customerName}
              </EllipsisText>
              <EllipsisText style={{ marginTop: 5, fontSize: 15, color: t.color.muted }}>
                Customer context
              </EllipsisText>
            </div>
          </div>
          <EllipsisText lines={3} style={{ marginTop: 18, fontSize: 18, lineHeight: 1.38, color: t.color.muted }}>
            {content.context.summary}
          </EllipsisText>
          <div style={{ marginTop: 24, display: "flex", flexDirection: "column", gap: 15 }}>
            {content.context.sections.map((section) => (
              <Slot
                key={section.slotId}
                id={section.slotId}
                callout={callout}
                cursor={cursor}
                popover="left"
                style={{
                  borderRadius: 20,
                  border: `1px solid ${t.color.border}`,
                  background: t.color.surface,
                  padding: 18,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <EllipsisText style={{ fontSize: 18, fontWeight: 800, color: t.color.text }}>{section.title}</EllipsisText>
                  <ChevronRight size={17} color={t.color.faint} style={{ marginLeft: "auto" }} />
                </div>
                <div style={{ marginTop: 14, display: "flex", flexDirection: "column", gap: 12 }}>
                  {section.items.map((item, index) => (
                    <div key={`${section.slotId}-${index}`} style={{ display: "grid", gridTemplateColumns: "96px 1fr", gap: 10 }}>
                      <EllipsisText style={{ fontSize: 14, color: t.color.faint }}>{item.label}</EllipsisText>
                      <EllipsisText style={{ fontSize: 15, fontWeight: 700, color: t.color.text }}>{item.value}</EllipsisText>
                    </div>
                  ))}
                </div>
              </Slot>
            ))}
          </div>
          <div
            style={{
              marginTop: 20,
              display: "flex",
              alignItems: "center",
              gap: 9,
              color: t.color.muted,
              fontSize: 15,
            }}
          >
            <Clock size={17} />
            Synced from recent conversations
          </div>
        </aside>
      </div>
    </Card>
  );
}
