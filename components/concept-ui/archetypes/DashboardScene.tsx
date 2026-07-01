"use client";

import { ChevronDown, Filter, MoreHorizontal, Search } from "lucide-react";
import type { DashboardSceneSpec } from "@/lib/concept-ui/scene-spec";
import { conceptSceneTokens as t } from "@/lib/concept-ui/scene-tokens";
import { hasReusableBlocks, ReusableBlockStack } from "../blocks/ReusableBlockCards";
import { BarChartCard } from "../charts/BarChartCard";
import { LineChartCard } from "../charts/LineChartCard";
import { Card, DelightMark, EllipsisText, Pill, Slot } from "../primitives";

type Props = {
  spec: DashboardSceneSpec;
};

function kpiTone(tone: DashboardSceneSpec["content"]["kpis"][number]["tone"]): "neutral" | "good" | "warn" {
  if (tone === "good") return "good";
  if (tone === "warn") return "warn";
  return "neutral";
}

export function DashboardScene({ spec }: Props) {
  const { content } = spec;
  const callout = spec.modifiers.aiCallout;
  const cursor = spec.modifiers.cursor;
  const hasBlocks = hasReusableBlocks(content);

  return (
    <Card
      primaryPanel
      style={{
        width: "100%",
        height: "100%",
        overflow: "hidden",
        borderWidth: t.borderWidth.none,
        borderRadius: t.radius.sm,
        boxShadow: t.shadow.none,
        display: "grid",
        gridTemplateRows: "76px 60px 1fr",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 28px",
          borderBottom: `1px solid ${t.color.border}`,
          borderTopLeftRadius: t.radius.sm,
          borderTopRightRadius: t.radius.sm,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <DelightMark size={38} />
          <div>
            <EllipsisText style={{ fontSize: 26, fontWeight: t.font.weight.semibold, color: t.color.text }}>{content.title}</EllipsisText>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <button
            type="button"
            style={{
              border: `1px solid ${t.color.border}`,
              borderRadius: 15,
              background: t.color.app,
              padding: "9px 14px",
              display: "flex",
              gap: 8,
              alignItems: "center",
              color: t.color.text,
              fontSize: 14,
              fontWeight: t.font.weight.semibold,
            }}
          >
            Export
          </button>
          <div
            style={{
              width: 38,
              height: 38,
              borderRadius: 14,
              background: t.color.surface,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <MoreHorizontal size={21} />
          </div>
        </div>
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          padding: "0 28px",
          borderBottom: `1px solid ${t.color.border}`,
        }}
      >
        <div
          style={{
            height: 38,
            borderRadius: 14,
            background: t.color.surface,
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: "0 14px",
            color: t.color.muted,
            fontSize: 13,
            minWidth: 210,
          }}
        >
          <Search size={17} />
          Search metrics
        </div>
        {content.filters.map((filter, index) => (
          <Pill key={`${index}-${filter}`} tone="neutral" style={{ minHeight: 30, fontSize: 13 }}>
            {filter}
          </Pill>
        ))}
        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 8, color: t.color.muted, fontSize: 13 }}>
          <Filter size={17} />
          Add filter
          <ChevronDown size={17} />
        </div>
      </div>

      <div
        style={{
          padding: 18,
          background: t.color.app,
          minHeight: 0,
          borderBottomLeftRadius: t.radius.sm,
          borderBottomRightRadius: t.radius.sm,
        }}
      >
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", gap: 12 }}>
          {content.kpis.map((kpi) => (
            <Slot
              key={kpi.slotId}
              id={kpi.slotId}
              callout={callout}
              cursor={cursor}
              popover="top"
              style={{
                borderRadius: 22,
                border: `1px solid ${t.color.border}`,
                background: t.color.app,
                padding: 16,
                minHeight: 88,
              }}
            >
              <EllipsisText style={{ fontSize: 13, fontWeight: t.font.weight.semibold, color: t.color.muted }}>{kpi.label}</EllipsisText>
              <div style={{ display: "flex", alignItems: "end", gap: 10, marginTop: 12 }}>
                <EllipsisText style={{ fontSize: 31, fontWeight: t.font.weight.semibold, color: t.color.text }}>{kpi.value}</EllipsisText>
                {kpi.delta ? (
                  <Pill tone={kpiTone(kpi.tone)} style={{ marginBottom: 4, minHeight: 24, fontSize: 12 }}>
                    {kpi.delta}
                  </Pill>
                ) : null}
              </div>
            </Slot>
          ))}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 12 }}>
          <Slot
            id={content.lineChart.slotId}
            callout={callout}
            cursor={cursor}
            popover="right"
            style={{
              borderRadius: 22,
              border: `1px solid ${t.color.border}`,
              background: t.color.app,
              minHeight: 230,
            }}
          >
            <LineChartCard chart={content.lineChart} />
          </Slot>
          <Slot
            id={content.barChart.slotId}
            callout={callout}
            cursor={cursor}
            popover="left"
            style={{
              borderRadius: 22,
              border: `1px solid ${t.color.border}`,
              background: t.color.app,
              minHeight: 230,
            }}
          >
            <BarChartCard chart={content.barChart} />
          </Slot>
        </div>

        {hasBlocks ? (
          <ReusableBlockStack
            {...content}
            callout={callout}
            cursor={cursor}
            compact
            max={1}
            style={{ marginTop: 12, boxShadow: t.shadow.none }}
          />
        ) : (
          <Slot
            id={content.table.slotId}
            callout={callout}
            cursor={cursor}
            popover="top"
            style={{
              marginTop: 12,
              borderRadius: 22,
              border: `1px solid ${t.color.border}`,
              background: t.color.app,
              overflow: "visible",
            }}
          >
            <div style={{ padding: "14px 22px 6px" }}>
              <EllipsisText style={{ fontSize: 20, fontWeight: t.font.weight.semibold, color: t.color.text }}>
                {content.table.title}
              </EllipsisText>
            </div>
            <div style={{ padding: "0 22px 12px" }}>
              {content.table.rows.map((row, index) => (
                <Slot
                  key={row.slotId}
                  id={row.slotId}
                  callout={callout}
                  cursor={cursor}
                  popover="top"
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 130px 150px 90px",
                    alignItems: "center",
                    gap: 14,
                    minHeight: 36,
                    borderTop: index === 0 ? undefined : `1px solid ${t.color.border}`,
                  }}
                >
                  <EllipsisText style={{ fontSize: 14, fontWeight: t.font.weight.semibold, color: t.color.text }}>{row.name}</EllipsisText>
                  <EllipsisText style={{ fontSize: 13, color: t.color.muted }}>{row.volume}</EllipsisText>
                  <Pill tone={row.status.toLowerCase().includes("review") || row.status.includes("검토") ? "warn" : "good"} style={{ justifySelf: "start", minHeight: 24, fontSize: 11 }}>
                    {row.status}
                  </Pill>
                  <EllipsisText style={{ fontSize: 13, fontWeight: t.font.weight.semibold, color: t.color.text }}>{row.trend}</EllipsisText>
                </Slot>
              ))}
            </div>
          </Slot>
        )}
      </div>
    </Card>
  );
}
