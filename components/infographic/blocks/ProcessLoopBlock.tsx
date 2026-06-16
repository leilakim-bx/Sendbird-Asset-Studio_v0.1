import type { InfographicBlock, InfographicFormat } from "@/lib/types/infographic";
import { INFOGRAPHIC_INK, INFOGRAPHIC_INK_MUTED } from "@/lib/types/infographic";
import { processLoopMaxSteps } from "@/lib/infographic-block-limits";
import { brand, brandPx } from "@/lib/tokens/brand";

type Props = {
  block: Extract<InfographicBlock, { type: "process-loop" }>;
  scale?: number;
  format?: InfographicFormat;
  maxHeight?: number;
};

const DEFAULT_LOOP_LABEL = "Feedback loop: failures feed back into research";
const DEFAULT_STEPS = [
  { label: "Research" },
  { label: "Hypothesize" },
  { label: "Human Steer" },
  { label: "Test" },
  { label: "Deploy" },
];

function clampIndex(index: number | undefined, max: number) {
  if (max <= 0) return 0;
  if (typeof index !== "number" || !Number.isFinite(index)) return 0;
  return Math.min(Math.max(Math.round(index), 0), max - 1);
}

/** Horizontal process with one emphasized step and a dotted feedback loop. */
export function ProcessLoopBlock({ block, scale = 1, format = "blog", maxHeight }: Props) {
  const isProduct = format === "product";
  const rawSteps = block.steps.length > 0 ? block.steps : DEFAULT_STEPS;
  const steps = rawSteps.slice(0, processLoopMaxSteps(format));
  const activeStepIndex = clampIndex(block.activeStepIndex, steps.length);
  const fs = (n: number) => Math.round(n * scale);
  const labelScale = Math.min(scale, 1);
  const labelFs = (n: number) => Math.round(n * labelScale);
  const title = block.title?.trim();
  const loopLabel = block.loopLabel?.trim() || DEFAULT_LOOP_LABEL;
  const panelMaxWidth = isProduct ? 760 : 560;
  const panelPaddingX = isProduct ? brand.spacing[24] : brand.spacing[18];
  const panelPaddingY = isProduct ? brand.spacing[14] : brand.spacing[12];
  const compactProductSteps = isProduct && steps.length >= 5;
  const stepPaddingX = compactProductSteps ? brand.spacing[12] : isProduct ? brand.spacing[16] : brand.spacing[12];
  const stepPaddingY = isProduct ? brand.spacing[12] : brand.spacing[10];
  const stepMinWidth = compactProductSteps ? brand.spacing[92] : isProduct ? brand.spacing[100] : brand.spacing[72];
  const stepMaxWidth = compactProductSteps ? brand.spacing[170] : isProduct ? brand.spacing[152] : brand.spacing[130];

  return (
    <div
      style={{
        width: "100%",
        maxHeight,
        boxSizing: "border-box",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: brandPx(isProduct ? brand.spacing[26] : brand.spacing[18]),
        overflow: "hidden",
        color: INFOGRAPHIC_INK,
        fontFamily: brand.font.sans,
      }}
    >
      {title && (
        <div
          style={{
            maxWidth: brandPx(panelMaxWidth),
            color: INFOGRAPHIC_INK,
            fontSize: fs(isProduct ? brand.typography.size[26] : brand.typography.size[22]),
            lineHeight: brand.typography.lineHeight.compact,
            fontWeight: brand.font.weight.semibold,
            textAlign: "center",
            overflowWrap: "anywhere",
          }}
        >
          {title}
        </div>
      )}
      <div
        style={{
          width: "100%",
          maxWidth: brandPx(panelMaxWidth),
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: brandPx(brand.spacing[8]),
        }}
      >
        <div
          style={{
            width: "100%",
            boxSizing: "border-box",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: brandPx(compactProductSteps ? brand.spacing[5] : isProduct ? brand.spacing[7] : brand.spacing[6]),
            padding: `${brandPx(panelPaddingY)} ${brandPx(panelPaddingX)}`,
            borderRadius: brand.radius[14],
            background: brand.color.infographic.paper,
            overflow: "hidden",
          }}
        >
          {steps.map((step, index) => {
            const active = index === activeStepIndex;
            return (
              <div
                key={`${step.label}-${index}`}
                style={{
                  display: "contents",
                }}
              >
                <div
                  style={{
                    boxSizing: "border-box",
                    minWidth: brandPx(stepMinWidth),
                    flex: "0 1 auto",
                    maxWidth: brandPx(stepMaxWidth),
                    padding: `${brandPx(stepPaddingY)} ${brandPx(stepPaddingX)}`,
                    borderRadius: brand.radius[12],
                    background: active ? brand.color.infographic.bar : brand.color.surface[1],
                    color: active ? brand.color.white : INFOGRAPHIC_INK,
                    fontSize: labelFs(isProduct ? brand.typography.size[16] : brand.typography.size[14]),
                    lineHeight: brand.typography.lineHeight.compact,
                    fontWeight: brand.font.weight.semibold,
                    textAlign: "center",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {step.label}
                </div>
                {index < steps.length - 1 && (
                  <div
                    aria-hidden="true"
                    style={{
                      flex: "0 0 auto",
                      color: INFOGRAPHIC_INK,
                      fontSize: labelFs(isProduct ? brand.typography.size[20] : brand.typography.size[16]),
                      lineHeight: brand.typography.lineHeight.tight,
                      fontWeight: brand.font.weight.bold,
                    }}
                  >
                    →
                  </div>
                )}
              </div>
            );
          })}
        </div>
        {steps.length > 1 && (
          <div
            style={{
              width: `calc(100% - ${brandPx(isProduct ? brand.spacing[92] : brand.spacing[64])})`,
              maxWidth: brandPx(panelMaxWidth - (isProduct ? brand.spacing[92] : brand.spacing[64])),
              minWidth: brandPx(brand.spacing[170]),
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: brandPx(brand.spacing[4]),
            }}
          >
            <svg
              viewBox="0 0 560 34"
              width="100%"
              height={isProduct ? 30 : 24}
              preserveAspectRatio="none"
              aria-hidden="true"
            >
              <path
                d="M 520 0 V 12 Q 520 26 506 26 H 54 Q 40 26 40 12 V 0"
                fill="none"
                stroke={brand.color.infographic.connector}
                strokeWidth="1.4"
                strokeDasharray="3 4"
                strokeLinecap="round"
              />
              <path
                d="M 34 7 L 40 0 L 46 7"
                fill="none"
                stroke={brand.color.infographic.connector}
                strokeWidth="1.4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <div
              style={{
                maxWidth: "100%",
                color: INFOGRAPHIC_INK_MUTED,
                fontSize: fs(isProduct ? brand.typography.size[14] : brand.typography.size[12]),
                lineHeight: brand.typography.lineHeight.normal,
                textAlign: "center",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {loopLabel}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
