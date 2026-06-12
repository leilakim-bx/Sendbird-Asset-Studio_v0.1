"use client";

import { Bot, CheckSquare2, Database, Search, SlidersHorizontal, Square } from "lucide-react";
import type { CSSProperties } from "react";
import type { TableSceneSpec } from "@/lib/concept-ui/scene-spec";
import { conceptSceneTokens as t } from "@/lib/concept-ui/scene-tokens";
import { AvatarInitials, Card, EllipsisText, Pill, Slot } from "../primitives";

type Props = {
  spec: TableSceneSpec;
};

function renderCell(cell: TableSceneSpec["content"]["rows"][number]["cells"][number]) {
  if (cell.kind === "person") {
    return (
      <div style={{ display: "flex", alignItems: "center", gap: 11, minWidth: 0 }}>
        <AvatarInitials name={cell.name} size={34} />
        <div style={{ minWidth: 0 }}>
          <EllipsisText style={{ fontSize: 15, fontWeight: 800, color: t.color.text }}>
            {cell.name}
          </EllipsisText>
          {cell.detail ? (
            <EllipsisText style={{ marginTop: 3, fontSize: 12, color: t.color.faint }}>
              {cell.detail}
            </EllipsisText>
          ) : null}
        </div>
      </div>
    );
  }

  if (cell.kind === "badge") {
    return <Pill tone={cell.tone} style={{ minHeight: 27, fontSize: 12 }}>{cell.value}</Pill>;
  }

  if (cell.kind === "number") {
    const deltaColor: CSSProperties["color"] =
      cell.tone === "good" ? t.color.goodText : cell.tone === "warn" ? t.color.warnText : t.color.muted;
    return (
      <div style={{ minWidth: 0 }}>
        <EllipsisText style={{ fontSize: 17, fontWeight: 800, color: t.color.text }}>
          {cell.value}
        </EllipsisText>
        {cell.delta ? (
          <EllipsisText style={{ marginTop: 3, fontSize: 12, color: deltaColor }}>
            {cell.delta}
          </EllipsisText>
        ) : null}
      </div>
    );
  }

  if (cell.kind === "date") {
    return <EllipsisText style={{ fontSize: 14, fontWeight: 700, color: t.color.muted }}>{cell.value}</EllipsisText>;
  }

  return <EllipsisText style={{ fontSize: 16, fontWeight: 800, color: t.color.text }}>{cell.value}</EllipsisText>;
}

export function TableScene({ spec }: Props) {
  const { content } = spec;
  const callout = spec.modifiers.aiCallout;
  const cursor = spec.modifiers.cursor;
  const highlightedSlotId = spec.modifiers.highlightedSlotId;
  const gridColumns = `${content.toolbar.bulkSelect ? "48px " : ""}${content.columns
    .map((column) => `${column.width ?? 160}px`)
    .join(" ")}`;

  return (
    <Card
      primaryPanel
      style={{
        width: 1370,
        height: 790,
        overflow: "hidden",
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
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
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
            <Database size={24} strokeWidth={2.4} />
          </div>
          <div>
            <EllipsisText style={{ fontSize: 29, fontWeight: 800, color: t.color.text }}>
              {content.title}
            </EllipsisText>
            <EllipsisText style={{ marginTop: 4, fontSize: 15, color: t.color.muted }}>
              {content.productName}
            </EllipsisText>
          </div>
        </div>
        <Pill tone="ai">Structured records</Pill>
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          padding: "0 34px",
          borderBottom: `1px solid ${t.color.border}`,
          background: t.color.app,
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
            minWidth: 260,
          }}
        >
          <Search size={17} />
          {content.toolbar.searchPlaceholder}
        </div>
        {content.toolbar.filters.map((filter, index) => (
          <Pill key={`${index}-${filter}`} tone="neutral" style={{ minHeight: 34, fontSize: 14 }}>
            {filter}
          </Pill>
        ))}
        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 8, color: t.color.muted, fontSize: 15 }}>
          <SlidersHorizontal size={17} />
          Filters
        </div>
      </div>

      <div style={{ padding: 30, background: t.color.surface, minHeight: 0 }}>
        <div
          style={{
            borderRadius: 24,
            border: `1px solid ${t.color.border}`,
            background: t.color.app,
            overflow: "hidden",
          }}
        >
          <div
            style={{
              display: "grid",
              gridTemplateColumns: gridColumns,
              alignItems: "center",
              gap: 18,
              minHeight: 52,
              padding: "0 24px",
              borderBottom: `1px solid ${t.color.border}`,
              color: t.color.faint,
              fontSize: 12,
              fontWeight: 800,
              textTransform: "uppercase",
            }}
          >
            {content.toolbar.bulkSelect ? <CheckSquare2 size={17} /> : null}
            {content.columns.map((column, index) => (
              <EllipsisText key={`${index}-${column.key}`} style={{ color: t.color.faint }}>{column.label}</EllipsisText>
            ))}
          </div>

          {content.rows.map((row, index) => {
            const highlighted = row.slotId === highlightedSlotId;
            return (
              <Slot
                key={row.slotId}
                id={row.slotId}
                callout={callout}
                cursor={cursor}
                highlighted={highlighted}
                popover={index < 3 ? "top" : "left"}
                style={{
                  display: "grid",
                  gridTemplateColumns: gridColumns,
                  alignItems: "center",
                  gap: 18,
                  minHeight: 76,
                  padding: "0 24px",
                  borderTop: index === 0 ? undefined : `1px solid ${t.color.border}`,
                  background: highlighted ? t.color.aiSoft : t.color.app,
                }}
              >
                {content.toolbar.bulkSelect ? <Square size={17} color={t.color.faint} /> : null}
                {content.columns.map((column, cellIndex) => (
                  <div key={`${row.slotId}-${column.key}`} style={{ minWidth: 0 }}>
                    {row.cells[cellIndex] ? renderCell(row.cells[cellIndex]) : null}
                  </div>
                ))}
              </Slot>
            );
          })}
        </div>

        <div style={{ marginTop: 18, display: "flex", alignItems: "center", gap: 9, color: t.color.muted, fontSize: 15 }}>
          <Bot size={17} />
          {content.subtitle}
        </div>
      </div>
    </Card>
  );
}
