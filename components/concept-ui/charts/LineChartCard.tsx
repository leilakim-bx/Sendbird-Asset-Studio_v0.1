"use client";

import type { DashboardSceneSpec } from "@/lib/concept-ui/scene-spec";
import { conceptSceneTokens as t } from "@/lib/concept-ui/scene-tokens";
import { EllipsisText } from "../primitives";

type LineChart = DashboardSceneSpec["content"]["lineChart"];

function pointPath(points: LineChart["points"], width: number, height: number, pad: number): string {
  const max = Math.max(...points.map((point) => point.value), 1);
  const min = Math.min(...points.map((point) => point.value), 0);
  const spread = Math.max(max - min, 1);
  const step = points.length > 1 ? (width - pad * 2) / (points.length - 1) : 0;
  return points
    .map((point, index) => {
      const x = pad + step * index;
      const y = pad + (1 - (point.value - min) / spread) * (height - pad * 2);
      return `${index === 0 ? "M" : "L"} ${x.toFixed(2)} ${y.toFixed(2)}`;
    })
    .join(" ");
}

export function LineChartCard({ chart }: { chart: LineChart }) {
  const width = 590;
  const height = 250;
  const pad = 34;
  const path = pointPath(chart.points, width, height, pad);
  const last = chart.points[chart.points.length - 1];

  return (
    <div style={{ padding: 28 }}>
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 18 }}>
        <div>
          <EllipsisText style={{ fontSize: 25, fontWeight: 800, color: t.color.text }}>
            {chart.title}
          </EllipsisText>
          <EllipsisText style={{ marginTop: 6, fontSize: 16, color: t.color.muted }}>
            {chart.seriesName}
          </EllipsisText>
        </div>
        <span style={{ fontSize: 31, fontWeight: 800, color: t.color.text }}>
          {last ? last.value : 0}
        </span>
      </div>
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={{ marginTop: 18, display: "block" }}>
        {[0, 1, 2, 3].map((line) => {
          const y = pad + ((height - pad * 2) / 3) * line;
          return <line key={line} x1={pad} x2={width - pad} y1={y} y2={y} stroke={t.color.border} strokeWidth={2} />;
        })}
        <path d={path} fill="none" stroke={t.color.ink} strokeWidth={5} strokeLinecap="round" strokeLinejoin="round" />
        {chart.points.map((point, index) => {
          const max = Math.max(...chart.points.map((p) => p.value), 1);
          const min = Math.min(...chart.points.map((p) => p.value), 0);
          const spread = Math.max(max - min, 1);
          const x = pad + ((width - pad * 2) / (chart.points.length - 1)) * index;
          const y = pad + (1 - (point.value - min) / spread) * (height - pad * 2);
          return (
            <g key={`${index}-${point.label}`}>
              <circle cx={x} cy={y} r={8} fill={t.color.app} stroke={t.color.ink} strokeWidth={4} />
              <text x={x} y={height - 7} textAnchor="middle" fontSize={14} fontWeight={700} fill={t.color.faint}>
                {point.label}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
