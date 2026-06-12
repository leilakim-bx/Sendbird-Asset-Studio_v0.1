"use client";

import type { DashboardSceneSpec } from "@/lib/concept-ui/scene-spec";
import { conceptSceneTokens as t } from "@/lib/concept-ui/scene-tokens";
import { EllipsisText } from "../primitives";

type BarChart = DashboardSceneSpec["content"]["barChart"];

export function BarChartCard({ chart }: { chart: BarChart }) {
  const width = 590;
  const height = 250;
  const pad = 34;
  const max = Math.max(...chart.bars.map((bar) => bar.value), 1);
  const barW = (width - pad * 2) / chart.bars.length - 16;

  return (
    <div style={{ padding: 28 }}>
      <div>
        <EllipsisText style={{ fontSize: 25, fontWeight: 800, color: t.color.text }}>
          {chart.title}
        </EllipsisText>
        <EllipsisText style={{ marginTop: 6, fontSize: 16, color: t.color.muted }}>
          {chart.seriesName}
        </EllipsisText>
      </div>
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={{ marginTop: 18, display: "block" }}>
        {[0, 1, 2].map((line) => {
          const y = pad + ((height - pad * 2) / 2) * line;
          return <line key={line} x1={pad} x2={width - pad} y1={y} y2={y} stroke={t.color.border} strokeWidth={2} />;
        })}
        {chart.bars.map((bar, index) => {
          const availableH = height - pad * 2 - 18;
          const h = Math.max(18, (bar.value / max) * availableH);
          const x = pad + index * ((width - pad * 2) / chart.bars.length) + 8;
          const y = height - pad - h;
          return (
            <g key={`${index}-${bar.label}`}>
              <rect x={x} y={y} width={barW} height={h} rx={11} fill={index === 0 ? t.color.ink : t.color.surfaceStrong} />
              <text x={x + barW / 2} y={height - 7} textAnchor="middle" fontSize={14} fontWeight={700} fill={t.color.faint}>
                {bar.label}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
