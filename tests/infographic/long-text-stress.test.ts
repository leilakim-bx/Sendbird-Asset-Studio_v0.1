import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { BlockRenderer } from "@/components/infographic/blocks/BlockRenderer";
import { InfographicCanvas } from "@/components/infographic/InfographicCanvas";
import {
  compareMaxRows,
  INFOGRAPHIC_BLOCK_LIMITS,
  stackMaxLayers,
  stepMaxItems,
  stackedBarMaxRows,
} from "@/lib/infographic-block-limits";
import type { InfographicBlock, InfographicContent, InfographicFormat, OrbitIconKey } from "@/lib/types/infographic";
import { WORK_DATA_SCHEMA_VERSION } from "@/lib/work-data-schema";

const LONG_KO =
  "고객 대화에서 발견한 예외 상황과 정책 변경을 운영팀이 즉시 반영해 AI 응답 품질을 안정적으로 개선하는 긴 설명 문구";

function longText(prefix: string) {
  return `${prefix}: ${LONG_KO} ${LONG_KO}`;
}

function renderBlock(block: InfographicBlock, format: InfographicFormat = "product") {
  return renderToStaticMarkup(
    React.createElement(BlockRenderer, {
      block,
      format,
      scale: 1.15,
      maxHeight: 540,
    }),
  );
}

function renderProductCanvas(block: InfographicBlock) {
  const content: InfographicContent = {
    schemaVersion: WORK_DATA_SCHEMA_VERSION,
    format: "product",
    bg: "warmgray",
    accent: "lime",
    title: longText("긴 제목"),
    footnote: longText("긴 풋노트"),
    showTitle: true,
    blocks: [block],
  };

  return renderToStaticMarkup(React.createElement(InfographicCanvas, { content, exportMode: true }));
}

function expectStableMarkup(html: string) {
  expect(html).not.toContain("NaN");
  expect(html).not.toContain("Infinity");
  expect(html).not.toContain("undefined");
}

function productStressFixtures(): Array<[string, InfographicBlock]> {
  const orbitKeys: OrbitIconKey[] = ["mobile", "chat", "web", "slack", "voice", "audio", "email", "site"];

  return [
    [
      "stat",
      {
        id: "stress-stat",
        type: "stat",
        eyebrow: longText("긴 보조 라벨"),
        number: "123456789%",
        highlightNumber: true,
        label: longText("긴 설명"),
      },
    ],
    [
      "kpi-group",
      {
        id: "stress-kpi",
        type: "kpi-group",
        items: Array.from({ length: INFOGRAPHIC_BLOCK_LIMITS.kpiItems }, (_, index) => ({
          number: `${index + 1}23456789%`,
          label: longText(`KPI ${index + 1}`),
        })),
      },
    ],
    [
      "card-grid",
      {
        id: "stress-cards",
        type: "card-grid",
        cards: Array.from({ length: INFOGRAPHIC_BLOCK_LIMITS.cardGridCards }, (_, index) => ({
          badge: `긴 배지 ${index + 1}`,
          title: longText(`카드 제목 ${index + 1}`),
          body: longText(`카드 본문 ${index + 1}`),
        })),
      },
    ],
    [
      "column chart",
      {
        id: "stress-columns",
        type: "bar-group",
        variant: "columns",
        items: Array.from({ length: INFOGRAPHIC_BLOCK_LIMITS.barColumnsItems }, (_, index) => ({
          heading: `Lv.${index + 1}`,
          label: longText(`컬럼 ${index + 1}`),
          tag: `단계 ${index + 1}`,
          valueA: index + 1,
          desc: longText(`컬럼 설명 ${index + 1}`),
          highlight: index === INFOGRAPHIC_BLOCK_LIMITS.barColumnsItems - 1,
        })),
      },
    ],
    [
      "steps",
      {
        id: "stress-steps",
        type: "step",
        items: Array.from({ length: stepMaxItems("product") }, (_, index) => ({
          title: longText(`단계 ${index + 1}`),
          desc: longText(`단계 설명 ${index + 1}`),
          badge: `배지 ${index + 1}`,
        })),
      },
    ],
    [
      "layer diagram",
      {
        id: "stress-stack",
        type: "stack",
        layers: Array.from({ length: stackMaxLayers("product") }, (_, layerIndex) => ({
          title: longText(`레이어 ${layerIndex + 1}`),
          caption: longText(`레이어 설명 ${layerIndex + 1}`),
          highlight: layerIndex === 1,
          cells: Array.from({ length: INFOGRAPHIC_BLOCK_LIMITS.stackCellsPerLayer }, (_, cellIndex) => ({
            title: longText(`셀 ${layerIndex + 1}-${cellIndex + 1}`),
            desc: longText(`셀 설명 ${layerIndex + 1}-${cellIndex + 1}`),
          })),
        })),
      },
    ],
    [
      "hub map",
      {
        id: "stress-node-list",
        type: "node-list",
        hubTitle: longText("허브 제목"),
        hubSub: longText("허브 설명"),
        items: Array.from({ length: INFOGRAPHIC_BLOCK_LIMITS.nodeListItems }, (_, index) => ({
          label: longText(`노드 ${index + 1}`),
          tag: `태그 ${index + 1}`,
          desc: longText(`노드 설명 ${index + 1}`),
        })),
      },
    ],
    [
      "comparison",
      {
        id: "stress-compare",
        type: "compare",
        layout: "table",
        columnA: longText("이전"),
        columnB: longText("이후"),
        highlightB: true,
        rows: Array.from({ length: compareMaxRows("product") }, (_, index) => ({
          label: longText(`비교 항목 ${index + 1}`),
          a: longText(`이전 값 ${index + 1}`),
          b: longText(`이후 값 ${index + 1}`),
        })),
      },
    ],
    [
      "multi-series bar",
      {
        id: "stress-stacked",
        type: "stacked-bar",
        layout: "grouped",
        series: Array.from({ length: INFOGRAPHIC_BLOCK_LIMITS.stackedBarSeries }, (_, index) => longText(`시리즈 ${index + 1}`)),
        rows: Array.from({ length: stackedBarMaxRows("product") }, (_, rowIndex) => ({
          label: longText(`행 ${rowIndex + 1}`),
          values: Array.from({ length: INFOGRAPHIC_BLOCK_LIMITS.stackedBarSeries }, (_, seriesIndex) => 10 + rowIndex * 6 + seriesIndex),
        })),
      },
    ],
    [
      "trend",
      {
        id: "stress-line",
        type: "line-chart",
        xLabels: Array.from({ length: INFOGRAPHIC_BLOCK_LIMITS.lineChartPoints }, (_, index) => longText(`긴 축 라벨 ${index + 1}`)),
        seriesA: {
          label: longText("자동화 성공률"),
          values: Array.from({ length: INFOGRAPHIC_BLOCK_LIMITS.lineChartPoints }, (_, index) => 24 + index * 7),
        },
        seriesB: {
          label: longText("수동 처리율"),
          values: Array.from({ length: INFOGRAPHIC_BLOCK_LIMITS.lineChartPoints }, (_, index) => 72 - index * 5),
        },
      },
    ],
    [
      "orbit cycle",
      {
        id: "stress-orbit-cycle",
        type: "orbit",
        variant: "cycle",
        nodes: Array.from({ length: INFOGRAPHIC_BLOCK_LIMITS.orbitNodes }, (_, index) => ({
          label: longText(`순환 단계 ${index + 1}`),
          highlight: index >= 4,
        })),
      },
    ],
    [
      "orbit hub",
      {
        id: "stress-orbit-hub",
        type: "orbit",
        variant: "hub-spoke",
        satellites: orbitKeys.map((key) => ({ key })),
      },
    ],
  ];
}

describe("infographic long text and max item stress", () => {
  it.each(productStressFixtures())("renders the %s product fixture with long text at max item count", (_name, block) => {
    const html = renderProductCanvas(block);

    expectStableMarkup(html);
    expect(html).toContain("width:866px");
    expect(html).toContain("height:660px");
    expect(html).toContain("overflow:hidden");
  });

  it("defensively limits every capped product collection when saved data is over the limit", () => {
    const overLimitBlocks: Array<[InfographicBlock, string, string]> = [
      [
        {
          id: "over-kpi",
          type: "kpi-group",
          items: Array.from({ length: INFOGRAPHIC_BLOCK_LIMITS.kpiItems + 2 }, (_, index) => ({
            number: `${index + 1}`,
            label: `KPI ${index + 1}`,
          })),
        },
        "KPI 4",
        "KPI 5",
      ],
      [
        {
          id: "over-stack-cells",
          type: "stack",
          layers: [
            {
              title: "Layer",
              cells: Array.from({ length: INFOGRAPHIC_BLOCK_LIMITS.stackCellsPerLayer + 2 }, (_, index) => ({
                title: `Cell ${index + 1}`,
              })),
            },
          ],
        },
        "Cell 3",
        "Cell 4",
      ],
      [
        {
          id: "over-node-list",
          type: "node-list",
          hubTitle: "Hub",
          items: Array.from({ length: INFOGRAPHIC_BLOCK_LIMITS.nodeListItems + 2 }, (_, index) => ({
            label: `Node ${index + 1}`,
          })),
        },
        "Node 5",
        "Node 6",
      ],
      [
        {
          id: "over-orbit",
          type: "orbit",
          variant: "cycle",
          nodes: Array.from({ length: INFOGRAPHIC_BLOCK_LIMITS.orbitNodes + 2 }, (_, index) => ({
            label: `Orbit ${index + 1}`,
          })),
        },
        "Orbit 8",
        "Orbit 9",
      ],
      [
        {
          id: "over-compare",
          type: "compare",
          layout: "table",
          columnA: "Before",
          columnB: "After",
          rows: Array.from({ length: compareMaxRows("product") + 2 }, (_, index) => ({
            label: `Row ${index + 1}`,
            a: "Before",
            b: "After",
          })),
        },
        "Row 6",
        "Row 7",
      ],
      [
        {
          id: "over-line",
          type: "line-chart",
          xLabels: Array.from({ length: INFOGRAPHIC_BLOCK_LIMITS.lineChartPoints + 2 }, (_, index) => `Point ${index + 1}`),
          seriesA: {
            label: "Series A",
            values: Array.from({ length: INFOGRAPHIC_BLOCK_LIMITS.lineChartPoints + 2 }, (_, index) => index + 1),
          },
        },
        "Point 8",
        "Point 9",
      ],
    ];

    for (const [block, renderedText, hiddenText] of overLimitBlocks) {
      const html = renderBlock(block, "product");

      expectStableMarkup(html);
      expect(html).toContain(renderedText);
      expect(html).not.toContain(hiddenText);
    }
  });
});
