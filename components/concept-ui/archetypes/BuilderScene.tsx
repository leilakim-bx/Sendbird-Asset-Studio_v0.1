"use client";

import { Bot, CheckCircle2, GitBranch, PlayCircle, Zap } from "lucide-react";
import type { BuilderSceneSpec } from "@/lib/concept-ui/scene-spec";
import { conceptSceneTokens as t } from "@/lib/concept-ui/scene-tokens";
import { hasReusableBlocks, ReusableBlockStack } from "../blocks/ReusableBlockCards";
import { Card, DelightMark, EllipsisText, Pill, Slot } from "../primitives";

type Props = {
  spec: BuilderSceneSpec;
};

const STAGE_W = 700;
const STAGE_H = 560;
const NODE_W = 150;
const NODE_H = 92;

function typeIcon(type: BuilderSceneSpec["content"]["canvas"]["nodes"][number]["type"], size = 18) {
  if (type === "trigger") return <PlayCircle size={size} />;
  if (type === "condition") return <GitBranch size={size} />;
  if (type === "ai") return <Bot size={size} />;
  return <Zap size={size} />;
}

function nodePosition(node: BuilderSceneSpec["content"]["canvas"]["nodes"][number]) {
  return {
    left: (node.x / 1000) * (STAGE_W - NODE_W),
    top: (node.y / 640) * (STAGE_H - NODE_H),
  };
}

function edgePath(
  from: BuilderSceneSpec["content"]["canvas"]["nodes"][number],
  to: BuilderSceneSpec["content"]["canvas"]["nodes"][number],
) {
  const a = nodePosition(from);
  const b = nodePosition(to);
  const sx = a.left + NODE_W;
  const sy = a.top + NODE_H / 2;
  const ex = b.left;
  const ey = b.top + NODE_H / 2;
  const midX = sx + Math.max(60, (ex - sx) * 0.52);
  return `M ${sx} ${sy} C ${midX} ${sy}, ${midX} ${ey}, ${ex} ${ey}`;
}

function edgeLabelPosition(
  from: BuilderSceneSpec["content"]["canvas"]["nodes"][number],
  to: BuilderSceneSpec["content"]["canvas"]["nodes"][number],
  label: string,
  nodes: BuilderSceneSpec["content"]["canvas"]["nodes"],
) {
  const a = nodePosition(from);
  const b = nodePosition(to);
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
    const pos = nodePosition(node);
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

function nodePopover(node: BuilderSceneSpec["content"]["canvas"]["nodes"][number]) {
  const pos = nodePosition(node);
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

  return (
    <Card
      primaryPanel
      style={{
        width: 1370,
        height: 790,
        overflow: "hidden",
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
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <DelightMark size={46} />
          <div>
            <EllipsisText style={{ fontSize: 29, fontWeight: 800, color: t.color.text }}>
              {content.title}
            </EllipsisText>
          </div>
        </div>
        <Pill tone="ai">Workflow live</Pill>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "280px 1fr 320px", minHeight: 0 }}>
        <aside style={{ borderRight: `1px solid ${t.color.border}`, padding: 24 }}>
          <EllipsisText style={{ fontSize: 22, fontWeight: 800, color: t.color.text }}>
            {content.paletteTitle}
          </EllipsisText>
          <div style={{ marginTop: 20, display: "flex", flexDirection: "column", gap: 12 }}>
            {content.paletteItems.map((item, index) => (
              <div
                key={`${index}-${item.type}`}
                style={{
                  borderRadius: 18,
                  border: `1px solid ${t.color.border}`,
                  background: t.color.surface,
                  padding: 15,
                  display: "flex",
                  gap: 12,
                }}
              >
                <div
                  style={{
                    width: 34,
                    height: 34,
                    borderRadius: 11,
                    background: item.type === "ai" ? t.color.aiSoft : t.color.app,
                    color: item.type === "ai" ? t.color.ink : t.color.text,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flex: "0 0 auto",
                  }}
                >
                  {typeIcon(item.type, 18)}
                </div>
                <div style={{ minWidth: 0 }}>
                  <EllipsisText style={{ fontSize: 16, fontWeight: 800, color: t.color.text }}>
                    {item.label}
                  </EllipsisText>
                  <EllipsisText lines={2} style={{ marginTop: 5, fontSize: 13, lineHeight: 1.35, color: t.color.muted }}>
                    {item.description}
                  </EllipsisText>
                </div>
              </div>
            ))}
          </div>
        </aside>

        <main style={{ padding: 28, background: t.color.surface, minWidth: 0 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <EllipsisText style={{ fontSize: 22, fontWeight: 800, color: t.color.text }}>
              {content.canvas.title}
            </EllipsisText>
            <Pill tone="neutral">Deterministic layout</Pill>
          </div>
          <div
            style={{
              position: "relative",
              marginTop: 18,
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
                const labelPos = edge.label ? edgeLabelPosition(from, to, edge.label, content.canvas.nodes) : null;
                return (
                  <g key={`${edge.from}-${edge.to}-${index}`}>
                    <path
                      d={edgePath(from, to)}
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
              const pos = nodePosition(node);
              const isSelected = node.id === selected?.id;
              return (
                <Slot
                  key={node.id}
                  id={node.slotId}
                  highlighted={callout?.targetSlotId === node.slotId || spec.modifiers.highlightedSlotId === node.slotId}
                  cursor={cursor}
                  popover={nodePopover(node)}
                  style={{
                    position: "absolute",
                    left: pos.left,
                    top: pos.top,
                    width: NODE_W,
                    minHeight: NODE_H,
                    borderRadius: 20,
                    border: `2px solid ${isSelected ? t.color.ink : t.color.border}`,
                    background: t.color.app,
                    padding: 14,
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: 10,
                        background: node.type === "ai" ? t.color.aiSoft : t.color.surface,
                        color: node.type === "ai" ? t.color.ink : t.color.text,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flex: "0 0 auto",
                      }}
                    >
                      {typeIcon(node.type, 17)}
                    </div>
                    <EllipsisText style={{ fontSize: 16, fontWeight: 800, color: t.color.text }}>
                      {node.title}
                    </EllipsisText>
                  </div>
                  <EllipsisText lines={2} style={{ marginTop: 9, fontSize: 13, lineHeight: 1.35, color: t.color.muted }}>
                    {node.description}
                  </EllipsisText>
                  <Pill tone={node.type === "ai" ? "ai" : "neutral"} style={{ marginTop: 10, minHeight: 24, fontSize: 12 }}>
                    {node.status}
                  </Pill>
                </Slot>
              );
            })}
          </div>
        </main>

        <aside style={{ borderLeft: `1px solid ${t.color.border}`, padding: 24 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: 13,
                background: t.color.ink,
                color: t.color.inverse,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <CheckCircle2 size={20} />
            </div>
            <div style={{ minWidth: 0 }}>
              <EllipsisText style={{ fontSize: 22, fontWeight: 800, color: t.color.text }}>
                {content.selectedNode.panelTitle}
              </EllipsisText>
              <EllipsisText style={{ marginTop: 4, fontSize: 14, color: t.color.muted }}>
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
              style={{ marginTop: 20, boxShadow: t.shadow.none }}
            />
          ) : (
            <>
              {nodeCallout ? (
                <div
                  style={{
                    marginTop: 20,
                    borderRadius: 17,
                    background: t.color.app,
                    border: `1px solid ${t.color.borderStrong}`,
                    padding: 15,
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
                    <EllipsisText style={{ minWidth: 0, fontSize: 16, fontWeight: 800, color: t.color.text }}>
                      {nodeCallout.label}
                    </EllipsisText>
                  </div>
                  <EllipsisText lines={3} style={{ marginTop: 8, fontSize: 13, lineHeight: 1.35, color: t.color.muted }}>
                    {nodeCallout.description}
                  </EllipsisText>
                </div>
              ) : null}
              <div style={{ marginTop: 22, display: "flex", flexDirection: "column", gap: 13 }}>
                {content.selectedNode.fields.map((field, index) => (
                  <div
                    key={`${index}-${field.label}`}
                    style={{
                      borderRadius: 17,
                      background: t.color.surface,
                      border: `1px solid ${t.color.border}`,
                      padding: 15,
                    }}
                  >
                    <EllipsisText style={{ fontSize: 13, fontWeight: 800, color: t.color.faint }}>
                      {field.label}
                    </EllipsisText>
                    <EllipsisText lines={2} style={{ marginTop: 7, fontSize: 15, lineHeight: 1.35, color: t.color.text }}>
                      {field.value}
                    </EllipsisText>
                  </div>
                ))}
              </div>
            </>
          )}

          <div style={{ marginTop: 22, display: "flex", gap: 10 }}>
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
                  minHeight: 44,
                  fontSize: 15,
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
