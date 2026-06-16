"use client";

import { Bot, CheckSquare2, Search, SlidersHorizontal, Square } from "lucide-react";
import type { CSSProperties } from "react";
import type { TableSceneSpec } from "@/lib/concept-ui/scene-spec";
import { conceptSceneTokens as t } from "@/lib/concept-ui/scene-tokens";
import { AvatarInitials, Card, DelightMark, EllipsisText, Pill, Slot } from "../primitives";

type Props = {
  spec: TableSceneSpec;
};

const PANEL_W = 1370;
const BODY_PAD_X = 30;
const TABLE_PAD_X = 24;
const TABLE_GRID_GAP = 18;
const BULK_SELECT_W = 48;
const MIN_COLUMN_W = 90;

function renderCell(cell: TableSceneSpec["content"]["rows"][number]["cells"][number]) {
  if (cell.kind === "person") {
    return (
      <div style={{ display: "flex", alignItems: "center", gap: 11, minWidth: 0 }}>
        <AvatarInitials name={cell.name} size={34} />
        <div style={{ minWidth: 0 }}>
          <EllipsisText style={{ fontSize: 15, fontWeight: 600, color: t.color.text }}>
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
        <EllipsisText style={{ fontSize: 17, fontWeight: t.font.weight.semibold, color: t.color.text }}>
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
    return <EllipsisText style={{ fontSize: 14, fontWeight: 600, color: t.color.muted }}>{cell.value}</EllipsisText>;
  }

  return <EllipsisText style={{ fontSize: 16, fontWeight: t.font.weight.semibold, color: t.color.text }}>{cell.value}</EllipsisText>;
}

function isConversationSearchSpec(spec: TableSceneSpec): boolean {
  return /conversation search|delight\.ai search/i.test(`${spec.content.productName} ${spec.content.title}`);
}

function cellText(cell: TableSceneSpec["content"]["rows"][number]["cells"][number] | undefined): string {
  if (!cell) return "";
  if (cell.kind === "person") return cell.name;
  if (cell.kind === "number") return cell.value;
  return cell.value;
}

function cellDetail(cell: TableSceneSpec["content"]["rows"][number]["cells"][number] | undefined): string {
  if (!cell) return "";
  if (cell.kind === "person") return cell.detail ?? "";
  if (cell.kind === "number") return cell.delta ?? "";
  return "";
}

function CompactSearchCard({ spec }: Props) {
  const { content } = spec;
  const rows = content.rows.slice(0, 3);
  const filters = content.toolbar.filters.slice(0, 3);
  const cursor = spec.modifiers.cursor;
  const highlightedSlotId = spec.modifiers.highlightedSlotId;

  return (
    <Card
      primaryPanel
      style={{
        width: 900,
        borderRadius: 34,
        overflow: "hidden",
        boxShadow: t.shadow.float,
      }}
    >
      <div style={{ padding: "34px 38px 32px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <DelightMark size={38} />
          <div style={{ minWidth: 0 }}>
            <EllipsisText style={{ fontSize: 31, fontWeight: t.font.weight.semibold, color: t.color.text }}>
              {content.title}
            </EllipsisText>
            <EllipsisText style={{ marginTop: 5, fontSize: 14, color: t.color.muted }}>
              {content.productName}
            </EllipsisText>
          </div>
          <Pill tone="ai" style={{ marginLeft: "auto", minHeight: 30, fontSize: 12 }}>
            Matched
          </Pill>
        </div>

        <div
          style={{
            marginTop: 28,
            minHeight: 60,
            borderRadius: 18,
            border: `1px solid ${t.color.borderStrong}`,
            background: t.color.app,
            display: "flex",
            alignItems: "center",
            gap: 12,
            padding: "0 18px",
            color: t.color.text,
            fontSize: 18,
            fontWeight: t.font.weight.medium,
          }}
        >
          <Search size={21} color={t.color.muted} />
          <EllipsisText>{content.toolbar.searchPlaceholder}</EllipsisText>
        </div>

        <div style={{ marginTop: 14, display: "flex", gap: 8, flexWrap: "wrap" }}>
          {filters.map((filter, index) => (
            <Pill key={`${index}-${filter}`} tone={index === 0 ? "ai" : "neutral"} style={{ minHeight: 31, fontSize: 12 }}>
              {filter}
            </Pill>
          ))}
        </div>

        <div style={{ marginTop: 24, display: "grid", gap: 10 }}>
          {rows.map((row, index) => {
            const highlighted = row.slotId === highlightedSlotId || index === 0;
            return (
              <Slot
                key={row.slotId}
                id={row.slotId}
                cursor={cursor}
                highlighted={highlighted}
                popover="right"
                style={{
                  display: "grid",
                  gridTemplateColumns: "minmax(0, 1fr) auto",
                  gap: 16,
                  alignItems: "center",
                  borderRadius: 18,
                  border: `1px solid ${highlighted ? t.color.borderStrong : t.color.border}`,
                  background: highlighted ? t.color.aiSoft : t.color.surface,
                  padding: "15px 16px",
                  minWidth: 0,
                }}
              >
                <div style={{ minWidth: 0 }}>
                  <EllipsisText style={{ fontSize: 17, fontWeight: t.font.weight.semibold, color: t.color.text }}>
                    {cellText(row.cells[0])}
                  </EllipsisText>
                  <EllipsisText style={{ marginTop: 5, fontSize: 13, color: t.color.muted }}>
                    {[cellText(row.cells[1]), cellDetail(row.cells[1])].filter(Boolean).join(" · ")}
                  </EllipsisText>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
                  {row.cells[2]?.kind === "badge" ? (
                    <Pill tone={row.cells[2].tone} style={{ minHeight: 27, fontSize: 11 }}>
                      {row.cells[2].value}
                    </Pill>
                  ) : null}
                  <EllipsisText style={{ maxWidth: 170, fontSize: 13, fontWeight: t.font.weight.medium, color: t.color.muted }}>
                    {cellText(row.cells[3])}
                  </EllipsisText>
                </div>
              </Slot>
            );
          })}
        </div>

        <div style={{ marginTop: 18, display: "flex", alignItems: "center", gap: 9, color: t.color.muted, fontSize: 14 }}>
          <SlidersHorizontal size={16} />
          <EllipsisText>{content.subtitle}</EllipsisText>
        </div>
      </div>
    </Card>
  );
}

export function TableScene({ spec }: Props) {
  if (isConversationSearchSpec(spec)) return <CompactSearchCard spec={spec} />;

  const { content } = spec;
  const callout = spec.modifiers.aiCallout;
  const cursor = spec.modifiers.cursor;
  const highlightedSlotId = spec.modifiers.highlightedSlotId;
  const gridTrackCount = content.columns.length + (content.toolbar.bulkSelect ? 1 : 0);
  const gapTotal = Math.max(0, gridTrackCount - 1) * TABLE_GRID_GAP;
  const availableColumnWidth = PANEL_W - BODY_PAD_X * 2 - TABLE_PAD_X * 2 - gapTotal - (content.toolbar.bulkSelect ? BULK_SELECT_W : 0);
  const requestedWidths = content.columns.map((column) => column.width ?? 160);
  const requestedTotal = requestedWidths.reduce((sum, width) => sum + width, 0);
  const widthScale = requestedTotal > availableColumnWidth ? availableColumnWidth / requestedTotal : 1;
  const resolvedWidths = requestedWidths.map((width) => Math.max(MIN_COLUMN_W, Math.floor(width * widthScale)));
  const gridColumns = `${content.toolbar.bulkSelect ? `${BULK_SELECT_W}px ` : ""}${resolvedWidths
    .map((width) => `${width}px`)
    .join(" ")}`;

  return (
    <Card
      primaryPanel
      style={{
        width: PANEL_W,
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
          <DelightMark size={46} />
          <div>
            <EllipsisText style={{ fontSize: 29, fontWeight: t.font.weight.semibold, color: t.color.text }}>
              {content.title}
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
          <Pill key={`${index}-${filter}`} tone="neutral" style={{ minHeight: 34, fontSize: 14, fontWeight: 600 }}>
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
            overflow: "visible",
            position: "relative",
          }}
        >
          <div
            style={{
              display: "grid",
              gridTemplateColumns: gridColumns,
              alignItems: "center",
              gap: TABLE_GRID_GAP,
              minHeight: 52,
              padding: `0 ${TABLE_PAD_X}px`,
              borderBottom: `1px solid ${t.color.border}`,
              color: t.color.faint,
              fontSize: 12,
              fontWeight: 600,
              textTransform: "uppercase",
            }}
          >
            {content.toolbar.bulkSelect ? <CheckSquare2 size={17} /> : null}
            {content.columns.map((column, index) => (
              <EllipsisText key={`${index}-${column.key}`} style={{ color: t.color.faint, fontWeight: 600 }}>{column.label}</EllipsisText>
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
                popover="top"
                style={{
                  display: "grid",
                  gridTemplateColumns: gridColumns,
                  alignItems: "center",
                  gap: TABLE_GRID_GAP,
                  minHeight: 76,
                  padding: `0 ${TABLE_PAD_X}px`,
                  borderRadius: 0,
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
