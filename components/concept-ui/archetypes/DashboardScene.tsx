"use client";

import { ChevronDown, Filter, MoreHorizontal, Search } from "lucide-react";
import type { DashboardSceneSpec } from "@/lib/concept-ui/scene-spec";
import { conceptSceneTokens as t } from "@/lib/concept-ui/scene-tokens";
import { BarChartCard } from "../charts/BarChartCard";
import { LineChartCard } from "../charts/LineChartCard";
import { Card, EllipsisText, Pill, Slot } from "../primitives";

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

  return (
    <Card
      primaryPanel
      style={{
        width: 1370,
        height: 790,
        overflow: "visible",
        display: "grid",
        gridTemplateRows: "92px 82px 1fr",
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
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/preview/delight_logo_dashboard.svg"
            alt=""
            width={45}
            height={45}
            style={{ display: "block", width: 45, height: 45 }}
          />
          <div>
            <EllipsisText style={{ fontSize: 30, fontWeight: 800, color: t.color.text }}>{content.title}</EllipsisText>
            <EllipsisText style={{ marginTop: 4, fontSize: 15, color: t.color.muted }}>{content.productName}</EllipsisText>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <button
            type="button"
            style={{
              border: `1px solid ${t.color.border}`,
              borderRadius: 15,
              background: t.color.app,
              padding: "12px 16px",
              display: "flex",
              gap: 8,
              alignItems: "center",
              color: t.color.text,
              fontSize: 16,
              fontWeight: 800,
            }}
          >
            Export
          </button>
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 14,
              background: t.color.surface,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <MoreHorizontal size={24} />
          </div>
        </div>
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          padding: "0 34px",
          borderBottom: `1px solid ${t.color.border}`,
        }}
      >
        <div
          style={{
            height: 44,
            borderRadius: 14,
            background: t.color.surface,
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: "0 14px",
            color: t.color.muted,
            fontSize: 15,
            minWidth: 230,
          }}
        >
          <Search size={17} />
          Search metrics
        </div>
        {content.filters.map((filter, index) => (
          <Pill key={`${index}-${filter}`} tone="neutral" style={{ minHeight: 34, fontSize: 14 }}>
            {filter}
          </Pill>
        ))}
        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 8, color: t.color.muted, fontSize: 15 }}>
          <Filter size={17} />
          Add filter
          <ChevronDown size={17} />
        </div>
      </div>

      <div style={{ padding: 30, background: t.color.surface, minHeight: 0 }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", gap: 18 }}>
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
                padding: 22,
                minHeight: 126,
              }}
            >
              <EllipsisText style={{ fontSize: 16, fontWeight: 800, color: t.color.muted }}>{kpi.label}</EllipsisText>
              <div style={{ display: "flex", alignItems: "end", gap: 12, marginTop: 18 }}>
                <EllipsisText style={{ fontSize: 43, fontWeight: 800, color: t.color.text }}>{kpi.value}</EllipsisText>
                {kpi.delta ? (
                  <Pill tone={kpiTone(kpi.tone)} style={{ marginBottom: 6, minHeight: 28, fontSize: 13 }}>
                    {kpi.delta}
                  </Pill>
                ) : null}
              </div>
            </Slot>
          ))}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18, marginTop: 18 }}>
          <Slot
            id={content.lineChart.slotId}
            callout={callout}
            cursor={cursor}
            popover="right"
            style={{
              borderRadius: 22,
              border: `1px solid ${t.color.border}`,
              background: t.color.app,
              minHeight: 350,
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
              minHeight: 350,
            }}
          >
            <BarChartCard chart={content.barChart} />
          </Slot>
        </div>

        <Slot
          id={content.table.slotId}
          callout={callout}
          cursor={cursor}
          popover="top"
          style={{
            marginTop: 18,
            borderRadius: 22,
            border: `1px solid ${t.color.border}`,
            background: t.color.app,
            overflow: "visible",
          }}
        >
          <div style={{ padding: "22px 26px 10px" }}>
            <EllipsisText style={{ fontSize: 25, fontWeight: 800, color: t.color.text }}>
              {content.table.title}
            </EllipsisText>
          </div>
          <div style={{ padding: "0 26px 20px" }}>
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
                  gap: 18,
                  minHeight: 55,
                  borderTop: index === 0 ? undefined : `1px solid ${t.color.border}`,
                }}
              >
                <EllipsisText style={{ fontSize: 17, fontWeight: 800, color: t.color.text }}>{row.name}</EllipsisText>
                <EllipsisText style={{ fontSize: 16, color: t.color.muted }}>{row.volume}</EllipsisText>
                <Pill tone={row.status.toLowerCase().includes("review") || row.status.includes("검토") ? "warn" : "good"} style={{ justifySelf: "start", minHeight: 27, fontSize: 12 }}>
                  {row.status}
                </Pill>
                <EllipsisText style={{ fontSize: 16, fontWeight: 800, color: t.color.text }}>{row.trend}</EllipsisText>
              </Slot>
            ))}
          </div>
        </Slot>
      </div>
    </Card>
  );
}
