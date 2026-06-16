"use client";

import { Bot, CheckCircle2, GitBranch, PlayCircle, Zap } from "lucide-react";
import type { BuilderSceneSpec } from "@/lib/concept-ui/scene-spec";
import { conceptSceneTokens as t } from "@/lib/concept-ui/scene-tokens";
import { hasReusableBlocks, ReusableBlockStack } from "../blocks/ReusableBlockCards";
import { Card, DelightMark, EllipsisText, Pill, Slot } from "../primitives";

type Props = {
  spec: BuilderSceneSpec;
};

const BUILDER_PANEL_W = 1080;
const BUILDER_PANEL_H = 560;
const HEADER_H = 64;
const PALETTE_W = 190;
const MAIN_W = 630;
const INSPECTOR_W = 260;
const STAGE_W = 570;
const STAGE_H = 330;
const NODE_W = 120;
const NODE_H = 76;
const NODE_GAP_X = 20;

type BuilderNode = BuilderSceneSpec["content"]["canvas"]["nodes"][number];
type NodeLayout = { left: number; top: number };

function typeIcon(type: BuilderSceneSpec["content"]["canvas"]["nodes"][number]["type"], size = 18) {
  if (type === "trigger") return <PlayCircle size={size} />;
  if (type === "condition") return <GitBranch size={size} />;
  if (type === "ai") return <Bot size={size} />;
  return <Zap size={size} />;
}

function rawNodePosition(node: BuilderNode): NodeLayout {
  return {
    left: (node.x / 1000) * (STAGE_W - NODE_W),
    top: (node.y / 640) * (STAGE_H - NODE_H),
  };
}

function builderNodeLayouts(nodes: BuilderNode[]): Map<string, NodeLayout> {
  const raw = nodes.map((node) => ({ node, ...rawNodePosition(node) }));
  const rows: Array<typeof raw> = [];

  for (const item of raw.sort((a, b) => a.top - b.top || a.left - b.left)) {
    const row = rows.find((candidate) => {
      const avgTop = candidate.reduce((sum, entry) => sum + entry.top, 0) / candidate.length;
      return Math.abs(avgTop - item.top) < NODE_H * 0.72;
    });
    if (row) row.push(item);
    else rows.push([item]);
  }

  const out = new Map<string, NodeLayout>();
  for (const row of rows) {
    const sorted = row.sort((a, b) => a.left - b.left);
    const usableGap =
      sorted.length > 1
        ? Math.max(8, Math.min(NODE_GAP_X, (STAGE_W - sorted.length * NODE_W) / (sorted.length - 1)))
        : NODE_GAP_X;
    sorted.forEach((entry, index) => {
      const previous = index > 0 ? out.get(sorted[index - 1].node.id) : undefined;
      const minLeft = previous ? previous.left + NODE_W + usableGap : 0;
      const maxLeft = STAGE_W - NODE_W;
      out.set(entry.node.id, {
        left: Math.min(maxLeft, Math.max(entry.left, minLeft)),
        top: Math.min(STAGE_H - NODE_H, Math.max(0, entry.top)),
      });
    });
  }

  return out;
}

function nodePosition(node: BuilderNode, layouts: Map<string, NodeLayout>) {
  return layouts.get(node.id) ?? rawNodePosition(node);
}

function edgePath(
  from: BuilderNode,
  to: BuilderNode,
  layouts: Map<string, NodeLayout>,
) {
  const a = nodePosition(from, layouts);
  const b = nodePosition(to, layouts);
  const sx = a.left + NODE_W;
  const sy = a.top + NODE_H / 2;
  const ex = b.left;
  const ey = b.top + NODE_H / 2;
  const midX = sx + Math.max(60, (ex - sx) * 0.52);
  return `M ${sx} ${sy} C ${midX} ${sy}, ${midX} ${ey}, ${ex} ${ey}`;
}

function edgeLabelPosition(
  from: BuilderNode,
  to: BuilderNode,
  label: string,
  nodes: BuilderNode[],
  layouts: Map<string, NodeLayout>,
) {
  const a = nodePosition(from, layouts);
  const b = nodePosition(to, layouts);
  const labelWidth = Math.min(170, Math.max(58, label.length * 7 + 20));
  const labelHeight = 24;
  const x = (a.left + b.left + NODE_W) / 2 - labelWidth / 2;
  const y = (a.top + b.top + NODE_H) / 2 - 32;
  const padded = {
    left: x - 10,
    right: x + labelWidth + 10,
    top: y - 8,
    bottom: y + labelHeight + 8,
  };
  const overlapsNode = nodes.some((node) => {
    const pos = nodePosition(node, layouts);
    return (
      padded.left < pos.left + NODE_W &&
      padded.right > pos.left &&
      padded.top < pos.top + NODE_H &&
      padded.bottom > pos.top
    );
  });
  if (overlapsNode) return null;
  return { x, y, width: labelWidth, height: labelHeight };
}

function nodePopover(node: BuilderNode, layouts: Map<string, NodeLayout>) {
  const pos = nodePosition(node, layouts);
  if (pos.left > STAGE_W - NODE_W - 260) return "left";
  if (pos.top < 165) return "bottom";
  return "top";
}

export function BuilderScene({ spec }: Props) {
  const { content } = spec;
  const callout = spec.modifiers.aiCallout;
  const cursor = spec.modifiers.cursor;
  const nodesById = new Map(content.canvas.nodes.map((node) => [node.id, node]));
  const nodeSlotIds = new Set(content.canvas.nodes.map((node) => node.slotId));
  const selected = nodesById.get(content.selectedNode.nodeId) ?? content.canvas.nodes[0];
  const hasBlocks = hasReusableBlocks(content);
  const nodeCallout = callout && nodeSlotIds.has(callout.targetSlotId) ? callout : undefined;
  const blockCallout = nodeCallout ? undefined : callout;
  const nodeLayouts = builderNodeLayouts(content.canvas.nodes);

  return (
    <Card
      primaryPanel
      style={{
        width: BUILDER_PANEL_W,
        height: BUILDER_PANEL_H,
        overflow: "hidden",
        display: "grid",
        gridTemplateRows: `${HEADER_H}px 1fr`,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 24px",
          borderBottom: `1px solid ${t.color.border}`,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <DelightMark size={34} />
          <div>
            <EllipsisText style={{ fontSize: 22, fontWeight: 800, color: t.color.text }}>
              {content.title}
            </EllipsisText>
          </div>
        </div>
        <Pill tone="ai">Workflow live</Pill>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: `${PALETTE_W}px ${MAIN_W}px ${INSPECTOR_W}px`,
          minHeight: 0,
        }}
      >
        <aside style={{ borderRight: `1px solid ${t.color.border}`, padding: 14 }}>
          <EllipsisText style={{ fontSize: 16, fontWeight: 800, color: t.color.text }}>
            {content.paletteTitle}
          </EllipsisText>
          <div style={{ marginTop: 14, display: "flex", flexDirection: "column", gap: 8 }}>
            {content.paletteItems.map((item, index) => (
              <div
                key={`${index}-${item.type}`}
                style={{
                  borderRadius: 14,
                  border: `1px solid ${t.color.border}`,
                  background: t.color.surface,
                  padding: 10,
                  display: "flex",
                  gap: 10,
                }}
              >
                <div
                  style={{
                    width: 26,
                    height: 26,
                    borderRadius: 11,
                    background: item.type === "ai" ? t.color.aiSoft : t.color.app,
                    color: item.type === "ai" ? t.color.ink : t.color.text,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flex: "0 0 auto",
                  }}
                >
                  {typeIcon(item.type, 15)}
                </div>
                <div style={{ minWidth: 0 }}>
                  <EllipsisText style={{ fontSize: 13, fontWeight: 800, color: t.color.text }}>
                    {item.label}
                  </EllipsisText>
                  <EllipsisText lines={2} style={{ marginTop: 4, fontSize: 10.5, lineHeight: 1.32, color: t.color.muted }}>
                    {item.description}
                  </EllipsisText>
                </div>
              </div>
            ))}
          </div>
        </aside>

        <main style={{ padding: 20, background: t.color.surface, minWidth: 0 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <EllipsisText style={{ fontSize: 16, fontWeight: 800, color: t.color.text }}>
              {content.canvas.title}
            </EllipsisText>
            <Pill tone="neutral">Deterministic layout</Pill>
          </div>
          <div
            style={{
              position: "relative",
              marginTop: 14,
              width: STAGE_W,
              height: STAGE_H,
              borderRadius: 24,
              border: `1px solid ${t.color.border}`,
              backgroundImage: t.background.gridDot,
              backgroundSize: "18px 18px",
              backgroundColor: t.color.app,
              overflow: "hidden",
            }}
          >
            <svg
              width={STAGE_W}
              height={STAGE_H}
              viewBox={`0 0 ${STAGE_W} ${STAGE_H}`}
              style={{ position: "absolute", inset: 0, pointerEvents: "none" }}
            >
              <defs>
                <marker id="builder-arrow" markerWidth="12" markerHeight="12" refX="10" refY="6" orient="auto">
                  <path d="M2 2 L10 6 L2 10 Z" fill={t.color.borderStrong} />
                </marker>
              </defs>
              {content.canvas.edges.map((edge, index) => {
                const from = nodesById.get(edge.from);
                const to = nodesById.get(edge.to);
                if (!from || !to) return null;
                const labelPos = edge.label ? edgeLabelPosition(from, to, edge.label, content.canvas.nodes, nodeLayouts) : null;
                return (
                  <g key={`${edge.from}-${edge.to}-${index}`}>
                    <path
                      d={edgePath(from, to, nodeLayouts)}
                      fill="none"
                      stroke={t.color.borderStrong}
                      strokeWidth={3}
                      markerEnd="url(#builder-arrow)"
                    />
                    {edge.label && labelPos ? (
                      <>
                        <rect
                          x={labelPos.x}
                          y={labelPos.y}
                          width={labelPos.width}
                          height={labelPos.height}
                          rx="10"
                          fill={t.color.app}
                          stroke={t.color.border}
                        />
                        <text
                          x={labelPos.x + 10}
                          y={labelPos.y + 16}
                          fill={t.color.muted}
                          fontSize="12"
                          fontWeight="700"
                        >
                          {edge.label}
                        </text>
                      </>
                    ) : null}
                  </g>
                );
              })}
            </svg>

            {content.canvas.nodes.map((node) => {
              const pos = nodePosition(node, nodeLayouts);
              const isSelected = node.id === selected?.id;
              return (
                <Slot
                  key={node.id}
                  id={node.slotId}
                  highlighted={callout?.targetSlotId === node.slotId || spec.modifiers.highlightedSlotId === node.slotId}
                  cursor={cursor}
                  popover={nodePopover(node, nodeLayouts)}
                  style={{
                    position: "absolute",
                    left: pos.left,
                    top: pos.top,
                    width: NODE_W,
                    minHeight: NODE_H,
                    borderRadius: 16,
                    border: `2px solid ${isSelected ? t.color.ink : t.color.border}`,
                    background: t.color.app,
                    padding: 11,
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div
                      style={{
                        width: 25,
                        height: 25,
                        borderRadius: 10,
                        background: node.type === "ai" ? t.color.aiSoft : t.color.surface,
                        color: node.type === "ai" ? t.color.ink : t.color.text,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flex: "0 0 auto",
                      }}
                    >
                      {typeIcon(node.type, 14)}
                    </div>
                    <EllipsisText style={{ fontSize: 13, fontWeight: 800, color: t.color.text }}>
                      {node.title}
                    </EllipsisText>
                  </div>
                  <EllipsisText lines={2} style={{ marginTop: 7, fontSize: 10.5, lineHeight: 1.3, color: t.color.muted }}>
                    {node.description}
                  </EllipsisText>
                  <Pill tone={node.type === "ai" ? "ai" : "neutral"} style={{ marginTop: 8, minHeight: 20, fontSize: 10 }}>
                    {node.status}
                  </Pill>
                </Slot>
              );
            })}
          </div>
        </main>

        <aside style={{ borderLeft: `1px solid ${t.color.border}`, padding: 16, alignSelf: "start" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div
              style={{
                width: 30,
                height: 30,
                borderRadius: 13,
                background: t.color.ink,
                color: t.color.inverse,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <CheckCircle2 size={16} />
            </div>
            <div style={{ minWidth: 0 }}>
              <EllipsisText style={{ fontSize: 16, fontWeight: 800, color: t.color.text }}>
                {content.selectedNode.panelTitle}
              </EllipsisText>
              <EllipsisText style={{ marginTop: 3, fontSize: 11, color: t.color.muted }}>
                Selected node
              </EllipsisText>
            </div>
          </div>

          {hasBlocks ? (
            <ReusableBlockStack
              {...content}
              callout={blockCallout}
              cursor={cursor}
              compact
              max={1}
              popover="inline"
              style={{ marginTop: 14, boxShadow: t.shadow.none }}
            />
          ) : (
            <>
              {nodeCallout ? (
                <div
                  style={{
                    marginTop: 14,
                    borderRadius: 14,
                    background: t.color.app,
                    border: `1px solid ${t.color.borderStrong}`,
                    padding: 12,
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
                    <span
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        width: 22,
                        height: 18,
                        borderRadius: 7,
                        background: t.color.ink,
                        color: t.color.inverse,
                        fontSize: 10,
                        fontWeight: 800,
                        flex: "0 0 auto",
                      }}
                    >
                      AI
                    </span>
                    <EllipsisText style={{ minWidth: 0, fontSize: 13, fontWeight: 800, color: t.color.text }}>
                      {nodeCallout.label}
                    </EllipsisText>
                  </div>
                  <EllipsisText lines={3} style={{ marginTop: 7, fontSize: 11, lineHeight: 1.32, color: t.color.muted }}>
                    {nodeCallout.description}
                  </EllipsisText>
                </div>
              ) : null}
              <div style={{ marginTop: 14, display: "flex", flexDirection: "column", gap: 9 }}>
                {content.selectedNode.fields.map((field, index) => (
                  <div
                    key={`${index}-${field.label}`}
                    style={{
                      borderRadius: 14,
                      background: t.color.surface,
                      border: `1px solid ${t.color.border}`,
                      padding: 12,
                    }}
                  >
                    <EllipsisText style={{ fontSize: 10.5, fontWeight: 800, color: t.color.faint }}>
                      {field.label}
                    </EllipsisText>
                    <EllipsisText lines={2} style={{ marginTop: 6, fontSize: 12.5, lineHeight: 1.32, color: t.color.text }}>
                      {field.value}
                    </EllipsisText>
                  </div>
                ))}
              </div>
            </>
          )}

          <div style={{ marginTop: 14, display: "flex", gap: 8 }}>
            {content.selectedNode.actions.map((action, index) => (
              <button
                key={`${index}-${action.label}`}
                type="button"
                style={{
                  flex: 1,
                  border: action.tone === "primary" ? 0 : `1px solid ${t.color.border}`,
                  borderRadius: 14,
                  background: action.tone === "primary" ? t.color.ink : t.color.app,
                  color: action.tone === "primary" ? t.color.inverse : t.color.text,
                  minHeight: 36,
                  fontSize: 12,
                  fontWeight: 800,
                }}
              >
                {action.label}
              </button>
            ))}
          </div>
        </aside>
      </div>
    </Card>
  );
}
