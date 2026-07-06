import type { CSSProperties, ReactNode } from "react";
import { ArrowLeft, ChartLine, Home, Send, Sparkles, SquarePen, type LucideIcon } from "lucide-react";
import type { ProductVisualConcept, ProductVisualTone } from "@/lib/types/product-visual";
import { brand } from "@/lib/tokens/brand";

type Props = {
  concept: ProductVisualConcept | undefined;
  maxWidth: number;
  maxHeight: number;
};

const PV = brand.color.productVisual;
const SHADOW = brand.elevation.productLegacyCard;
const INK = brand.color.ink;
const MUTED = brand.color.inkMuted;
const LINE = PV.line;
const PAPER = brand.color.white;
const CREAM = PV.cream;
const SECTION = PV.section;
const ACTIVE = brand.color.ink;
const ACCENT = brand.color.positive;
const GREEN = brand.color.positive;
const RED = brand.color.negative;
const WARNING = brand.color.warning;
const POSITIVE_BG = PV.positiveBg;
const WARNING_BG = PV.warningBg;
const NEGATIVE_BG = PV.negativeBg;
const CHIP_NEUTRAL = PV.chipNeutral;
const CHIP_IF = PV.chipIf;
const CHIP_ACCENT = PV.chipAccent;
const MUTED_LINE = PV.mutedLine;

function chipPalette(tone: ProductVisualTone | undefined): { background: string; color: string } {
  if (tone === "good") return { background: POSITIVE_BG, color: GREEN };
  if (tone === "warn") return { background: WARNING_BG, color: WARNING };
  if (tone === "accent") return { background: CHIP_ACCENT, color: INK };
  return { background: CHIP_NEUTRAL, color: MUTED };
}

function toneColor(tone: ProductVisualTone | undefined): string {
  if (tone === "good") return GREEN;
  if (tone === "warn") return RED;
  if (tone === "accent") return WARNING;
  return MUTED;
}

function chipStyle(tone: ProductVisualTone | undefined): CSSProperties {
  const color = chipPalette(tone);
  return {
    display: "inline-flex",
    alignItems: "center",
    gap: 5,
    borderRadius: 8,
    background: color.background,
    color: color.color,
    padding: "6px 12px",
    fontSize: 11,
    fontWeight: 760,
    lineHeight: 1,
    whiteSpace: "nowrap",
  };
}

function Sparkline({ color = PV.sparkline }: { color?: string }) {
  return (
    <div style={{ display: "flex", alignItems: "end", gap: 3, height: 34, width: 86 }}>
      {[14, 22, 17, 25, 20, 18, 27, 12].map((h, index) => (
        <span
          key={index}
          style={{
            width: 8,
            height: h,
            borderRadius: 4,
            background: index === 6 ? color : PV.sparklineBar,
            display: "block",
          }}
        />
      ))}
    </div>
  );
}

function Header({ compact }: { compact: boolean }) {
  return (
    <div
      style={{
        height: compact ? 36 : 44,
        background: CREAM,
        borderBottom: `1px solid ${LINE}`,
        display: "flex",
        alignItems: "center",
        padding: compact ? "0 10px" : "0 16px",
        boxSizing: "border-box",
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/preview/logo_delight_2.svg"
        alt="delight.ai"
        style={{
          width: "auto",
          height: compact ? 15 : 18,
          display: "block",
        }}
      />
    </div>
  );
}

function LogoMark({ size }: { size: number }) {
  return (
    /* eslint-disable-next-line @next/next/no-img-element */
    <img
      src="/preview/delight_logo.png"
      alt=""
      style={{
        width: size,
        height: size,
        display: "block",
        borderRadius: 999,
        flexShrink: 0,
      }}
    />
  );
}

function Sidebar({ compact, activeKind }: { compact: boolean; activeKind: ProductVisualConcept["kind"] }) {
  const items: { id: string; icon: LucideIcon }[] = [
    { id: "home", icon: Home },
    { id: "build", icon: Sparkles },
    { id: "edit", icon: SquarePen },
    { id: "analytics", icon: ChartLine },
    { id: "network", icon: Send },
  ];
  const activeId =
    activeKind === "analytics" || activeKind === "evaluation"
      ? "analytics"
      : activeKind === "conversation" || activeKind === "settings"
        ? "edit"
        : activeKind === "workspace"
          ? "network"
          : "build";
  return (
    <div
      style={{
        width: compact ? 44 : 66,
        background: CREAM,
        borderRight: `1px solid ${LINE}`,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: compact ? 8 : 11,
        paddingTop: compact ? 11 : 16,
        boxSizing: "border-box",
      }}
    >
      {items.map((item) => {
        const Icon = item.icon;
        const active = item.id === activeId;
        return (
          <span
            key={item.id}
            style={{
              width: compact ? 26 : 34,
              height: compact ? 26 : 34,
              borderRadius: compact ? 8 : 10,
              background: active ? PV.navActive : "transparent",
              color: brand.color.black,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Icon size={compact ? 15 : 19} strokeWidth={2.5} />
          </span>
        );
      })}
    </div>
  );
}

function MetricCard({
  label,
  value,
  delta,
  tone,
  compact,
}: ProductVisualConcept["metrics"][number] & { compact: boolean }) {
  return (
	    <div
	      style={{
	        minWidth: 0,
	        borderRadius: 8,
	        background: PAPER,
	        padding: compact ? 10 : 14,
        boxSizing: "border-box",
      }}
    >
      <div style={{ fontSize: compact ? 10 : 12, color: MUTED, fontWeight: 650, marginBottom: 7 }}>{label}</div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "end", gap: 8 }}>
        <span style={{ fontSize: compact ? 22 : 32, lineHeight: 1, color: INK, fontWeight: 520 }}>{value}</span>
        {!compact && <Sparkline color={toneColor(tone)} />}
      </div>
      {delta && <div style={{ marginTop: 7, fontSize: 11, color: toneColor(tone), fontWeight: 650 }}>{delta}</div>}
    </div>
  );
}

function SummaryRows({ concept, compact }: { concept: ProductVisualConcept; compact: boolean }) {
  return (
    <div style={{ display: "grid", gap: compact ? 6 : 8 }}>
      {concept.rows.map((row) => (
        <div
          key={row.label}
          style={{
            display: "flex",
	            alignItems: "center",
	            justifyContent: "space-between",
	            gap: 12,
	            background: PV.panel,
	            borderRadius: 8,
	            padding: compact ? "7px 9px" : "9px 11px",
            fontSize: compact ? 10 : 12,
          }}
        >
          <span style={{ color: MUTED, fontWeight: 620 }}>{row.label}</span>
          <span style={{ color: toneColor(row.tone), fontWeight: 760, textAlign: "right" }}>{row.value}</span>
        </div>
      ))}
    </div>
  );
}

function DeploymentScene({ concept, compact }: { concept: ProductVisualConcept; compact: boolean }) {
  return (
	    <div style={{ display: "grid", gridTemplateColumns: compact ? "1fr" : "1fr 0.78fr", gap: compact ? 10 : 14 }}>
	      <div
	        style={{
	          borderRadius: 10,
	          background: PAPER,
	          padding: compact ? 12 : 16,
	        }}
	      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", gap: 12 }}>
          <div>
            <div style={{ fontSize: compact ? 14 : 18, color: INK, fontWeight: 780 }}>{concept.title}</div>
            <div style={{ marginTop: 5, fontSize: compact ? 10 : 12, color: MUTED, lineHeight: 1.35 }}>{concept.subtitle}</div>
          </div>
          <span style={chipStyle("accent")}>{concept.badge}</span>
        </div>
        <div
	          style={{
	            marginTop: compact ? 12 : 18,
	            borderRadius: 10,
	            background: PV.purpleSoft,
	            padding: compact ? 11 : 14,
	          }}
	        >
          <div style={{ fontSize: compact ? 11 : 13, color: ACCENT, fontWeight: 760 }}>{concept.primaryLabel}</div>
          <div style={{ marginTop: 6, display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: compact ? 28 : 42, color: ACCENT, fontWeight: 760, lineHeight: 1 }}>{concept.primaryValue}</span>
            <span style={{ height: 8, flex: 1, borderRadius: 999, background: PV.purpleBar, overflow: "hidden" }}>
              <span style={{ display: "block", width: "80%", height: "100%", background: ACCENT }} />
            </span>
          </div>
        </div>
        <div style={{ marginTop: compact ? 10 : 14, display: "flex", gap: 7, flexWrap: "wrap" }}>
          {concept.chips.map((chip) => <span key={chip.label} style={chipStyle(chip.tone)}>{chip.label}</span>)}
        </div>
      </div>
      {!compact && <SummaryRows concept={concept} compact={compact} />}
    </div>
  );
}

function ConversationScene({ concept, compact }: { concept: ProductVisualConcept; compact: boolean }) {
  const conversationBars = [
    { align: "left", width: "48%", background: CREAM },
    { align: "right", width: "52%", background: ACTIVE },
    { align: "left", width: "34%", background: CREAM },
  ] as const;

  return (
    <div style={{ display: "grid", gridTemplateColumns: compact ? "1fr" : "1fr 190px", gap: compact ? 10 : 14 }}>
	      <div style={{ borderRadius: 10, background: PAPER, padding: compact ? 12 : 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
          <LogoMark size={28} />
          <div>
            <div style={{ fontSize: compact ? 14 : 17, color: INK, fontWeight: 780 }}>{concept.title}</div>
            <div style={{ fontSize: 11, color: MUTED }}>{concept.badge}</div>
          </div>
        </div>
        {conversationBars.map((bar, index) => (
          <div
            key={`${bar.align}-${index}`}
            style={{
              marginLeft: bar.align === "right" ? "auto" : 0,
              marginBottom: compact ? 7 : 9,
              width: bar.width,
              height: compact ? 18 : 24,
              borderRadius: 999,
              background: bar.background,
            }}
          />
        ))}
      </div>
      {!compact && (
	        <div style={{ borderRadius: 10, background: CREAM, padding: 14 }}>
          <div style={{ fontSize: 13, color: INK, fontWeight: 760, marginBottom: 12 }}>{concept.primaryLabel}</div>
          <div style={{ fontSize: 28, color: INK, fontWeight: 540, marginBottom: 12 }}>{concept.primaryValue}</div>
          <div style={{ display: "grid", gap: 8 }}>
            {[68, 46, 58].map((width, index) => (
              <span
                key={width}
                style={{
                  width: `${width}%`,
                  height: index === 0 ? 18 : 12,
                  borderRadius: 999,
                  background: index === 0 ? CREAM : brand.color.surface[3],
                  display: "block",
                }}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function EvaluationScene({ concept, compact }: { concept: ProductVisualConcept; compact: boolean }) {
  if (isOversightConcept(concept)) {
    return <OversightReviewScene compact={compact} />;
  }

  return (
    <div style={{ display: "grid", gridTemplateColumns: compact ? "1fr" : "1fr 210px", gap: compact ? 10 : 14 }}>
	      <div style={{ borderRadius: 10, background: PAPER, padding: compact ? 12 : 16 }}>
        <div style={{ fontSize: compact ? 14 : 18, color: INK, fontWeight: 780 }}>{concept.title}</div>
        <div style={{ marginTop: 5, fontSize: compact ? 10 : 12, color: MUTED }}>{concept.subtitle}</div>
        <div style={{ marginTop: 14, display: "grid", gap: 8 }}>
          {concept.metrics.map((metric) => (
            <div
              key={metric.label}
              style={{
                display: "grid",
                gridTemplateColumns: "1fr auto auto",
                alignItems: "center",
                gap: 8,
                borderBottom: `1px solid ${LINE}`,
                paddingBottom: 8,
                fontSize: compact ? 10 : 12,
              }}
            >
              <span style={{ color: INK, fontWeight: 650 }}>{metric.label}</span>
              <span style={chipStyle(metric.tone)}>{metric.value}</span>
              <span style={chipStyle(metric.tone === "warn" ? "warn" : "good")}>{metric.tone === "warn" ? "Poor" : "Good"}</span>
            </div>
          ))}
        </div>
      </div>
      {!compact && (
	        <div style={{ borderRadius: 10, background: CREAM, padding: 14 }}>
          <span style={chipStyle("accent")}>{concept.badge}</span>
          <div style={{ marginTop: 14, fontSize: 12, color: MUTED, fontWeight: 650 }}>{concept.primaryLabel}</div>
          <div style={{ marginTop: 4, fontSize: 34, color: INK, fontWeight: 540 }}>{concept.primaryValue}</div>
          <div style={{ marginTop: 14 }}>
            <SummaryRows concept={concept} compact />
          </div>
        </div>
      )}
    </div>
  );
}

function isActionbookConcept(concept: ProductVisualConcept): boolean {
  const text = [
    concept.prompt,
    concept.title,
    concept.subtitle,
    concept.badge,
    concept.primaryLabel,
    ...concept.chips.map((chip) => chip.label),
  ]
    .join(" ")
    .toLowerCase();

  return (
    text.includes("actionbook") ||
    text.includes("action book") ||
    text.includes("refund") ||
    text.includes("eligibility") ||
    text.includes("conditional") ||
    text.includes("condition")
  );
}

function isOversightConcept(concept: ProductVisualConcept): boolean {
  const text = [
    concept.prompt,
    concept.title,
    concept.subtitle,
    concept.badge,
    ...concept.chips.map((chip) => chip.label),
  ]
    .join(" ")
    .toLowerCase();

  return (
    text.includes("oversight") ||
    text.includes("concierge") ||
    text.includes("hallucination") ||
    text.includes("policy") ||
    text.includes("flagged") ||
    text.includes("access")
  );
}

type PillTone = "neutral" | "positive" | "warning" | "negative" | "dark";

function Pill({
  children,
  tone = "neutral",
}: {
  children: ReactNode;
  tone?: PillTone;
}) {
  const styles: Record<PillTone, CSSProperties> = {
    neutral: { background: CHIP_NEUTRAL, color: MUTED },
    positive: { background: POSITIVE_BG, color: GREEN },
    warning: { background: WARNING_BG, color: WARNING },
    negative: { background: NEGATIVE_BG, color: RED },
    dark: { background: ACTIVE, color: PAPER },
  };

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        borderRadius: 999,
        padding: "6px 12px",
        fontSize: 12,
        lineHeight: 1,
        fontWeight: 650,
        whiteSpace: "nowrap",
        ...styles[tone],
      }}
    >
      {children}
    </span>
  );
}

function GradeBadge({ grade, tone, compact }: { grade: string; tone: "positive" | "warning" | "negative"; compact: boolean }) {
  const palette = {
    positive: { background: POSITIVE_BG, color: GREEN },
    warning: { background: WARNING_BG, color: WARNING },
    negative: { background: NEGATIVE_BG, color: RED },
  }[tone];

  return (
    <span
      style={{
        width: compact ? 34 : 44,
        height: compact ? 34 : 44,
        borderRadius: 10,
        background: palette.background,
        color: palette.color,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: compact ? 15 : 20,
        fontWeight: 700,
        flexShrink: 0,
      }}
    >
      {grade}
    </span>
  );
}

function ReviewRow({
  grade,
  gradeTone,
  title,
  meta,
  status,
  statusTone,
  compact,
}: {
  grade: string;
  gradeTone: "positive" | "warning" | "negative";
  title: string;
  meta: string;
  status: string;
  statusTone: PillTone;
  compact: boolean;
}) {
  return (
    <div
      style={{
        minHeight: compact ? 58 : 74,
        borderBottom: `1px solid ${LINE}`,
        display: "grid",
        gridTemplateColumns: "auto minmax(0, 1fr) auto",
        alignItems: "center",
        gap: compact ? 10 : 16,
      }}
    >
      <GradeBadge grade={grade} tone={gradeTone} compact={compact} />
      <div style={{ minWidth: 0 }}>
        <div
          style={{
            color: INK,
            fontSize: compact ? 14 : 20,
            lineHeight: 1.15,
            fontWeight: 700,
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {title}
        </div>
        <div style={{ marginTop: 4, color: MUTED, fontSize: compact ? 11 : 15, lineHeight: 1.1, fontWeight: 500 }}>
          {meta}
        </div>
      </div>
      {!compact && <Pill tone={statusTone}>{status}</Pill>}
    </div>
  );
}

function OversightReviewScene({ compact }: { compact: boolean }) {
  const rows = [
    {
      grade: "A",
      gradeTone: "positive",
      title: "Refund on lost package?",
      meta: "CSAT 4.8 · 1m 12s",
      status: "On policy",
      statusTone: "positive",
    },
    {
      grade: "C",
      gradeTone: "warning",
      title: "Cancel after shipment",
      meta: "CSAT 2.1 · 4m 39s",
      status: "Review",
      statusTone: "warning",
    },
    {
      grade: "F",
      gradeTone: "negative",
      title: "Account balance inquiry",
      meta: "CSAT 1.0 · 0m 48s",
      status: "Flagged",
      statusTone: "negative",
    },
    {
      grade: "A",
      gradeTone: "positive",
      title: "Loyalty points redemption",
      meta: "CSAT 4.9 · 0m 52s",
      status: "On policy",
      statusTone: "positive",
    },
  ] as const;

  return (
    <div
      style={{
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: compact ? "100%" : 610,
          borderRadius: 20,
          background: PAPER,
          boxShadow: brand.elevation.productLegacyPanelStrong,
          padding: compact ? 16 : 28,
          boxSizing: "border-box",
          overflow: "hidden",
        }}
      >
        <div style={{ color: INK, fontSize: compact ? 20 : 28, lineHeight: 1, fontWeight: 700 }}>
          Oversight AI Concierge
        </div>
        <div
          style={{
            marginTop: compact ? 16 : 26,
            display: "flex",
            alignItems: "center",
            gap: compact ? 14 : 24,
            borderBottom: `1px solid ${LINE}`,
          }}
        >
          {["Response review", "Hallucinations", "Access"].map((tab, index) => (
            <span
              key={tab}
              style={{
                color: INK,
                fontSize: compact ? 12 : 15,
                fontWeight: 650,
                paddingBottom: compact ? 10 : 13,
                borderBottom: index === 0 ? `3px solid ${INK}` : "3px solid transparent",
                marginBottom: -1,
                whiteSpace: "nowrap",
              }}
            >
              {tab}
            </span>
          ))}
        </div>
        <div>
          {rows.map((row) => (
            <ReviewRow key={row.title} {...row} compact={compact} />
          ))}
        </div>
        <div
          style={{
            marginTop: compact ? 14 : 18,
            borderRadius: 16,
            background: SECTION,
            padding: compact ? "12px 14px" : "17px 20px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 16,
          }}
        >
          <div style={{ color: INK, fontSize: compact ? 14 : 20, lineHeight: 1, fontWeight: 500 }}>
            <span style={{ color: GREEN, fontWeight: 700 }}>94%</span> on policy
            {!compact && (
              <>
                <span style={{ display: "inline-block", width: 16 }} />
                <span style={{ color: WARNING, fontWeight: 700 }}>12</span> flagged today
              </>
            )}
          </div>
          <Pill tone="dark">Kill switch</Pill>
        </div>
      </div>
    </div>
  );
}

function SectionBox({
  title,
  badge,
  children,
  compact,
}: {
  title: string;
  badge?: string;
  children: ReactNode;
  compact: boolean;
}) {
  return (
    <section
      style={{
        borderRadius: 12,
        background: SECTION,
        padding: compact ? 11 : 14,
        display: "grid",
        gap: compact ? 7 : 9,
        minWidth: 0,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 7, minWidth: 0 }}>
        <span style={{ fontSize: compact ? 11 : 14, color: INK, fontWeight: 700 }}>{title}</span>
        {badge && (
          <span
            style={{
              borderRadius: 6,
              background: CHIP_NEUTRAL,
              color: MUTED,
              padding: compact ? "3px 6px" : "5px 8px",
              fontSize: compact ? 8 : 10,
              lineHeight: 1,
              fontWeight: 600,
              letterSpacing: 0,
              whiteSpace: "nowrap",
            }}
          >
            {badge}
          </span>
        )}
      </div>
      {children}
    </section>
  );
}

function ConditionBlock({ compact }: { compact: boolean }) {
  return (
    <div
      style={{
        borderRadius: 12,
        background: SECTION,
        padding: compact ? 12 : 16,
        display: "grid",
        gap: compact ? 8 : 10,
        minWidth: 0,
      }}
    >
      <div
        style={{
          color: RED,
          fontSize: compact ? 11 : 14,
          lineHeight: 1.1,
          textDecoration: "line-through",
          textDecorationThickness: 2,
        }}
      >
        Process refund via process_refund
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: compact ? 8 : 12, minWidth: 0 }}>
        <span
          style={{
            borderRadius: 6,
            background: CHIP_IF,
            border: `1px solid ${PV.infoBorder}`,
            color: INK,
            padding: compact ? "7px 8px" : "9px 11px",
            fontSize: compact ? 10 : 14,
            lineHeight: 1,
            fontWeight: 500,
          }}
        >
          IF
        </span>
        <span
          style={{
            minWidth: 0,
            color: INK,
            fontSize: compact ? 11 : 15,
            lineHeight: 1.25,
            fontWeight: 560,
            letterSpacing: 0.2,
            whiteSpace: compact ? "normal" : "nowrap",
          }}
        >
          AMOUNT &gt; $1,000: VERIFY ELIGIBILITY FIRST
        </span>
      </div>
      <div
        style={{
          marginLeft: compact ? 38 : 58,
          borderLeft: `2px solid ${LINE}`,
          paddingLeft: compact ? 10 : 14,
          display: "grid",
          gap: compact ? 4 : 6,
          fontSize: compact ? 11 : 15,
          lineHeight: 1.25,
          fontWeight: 560,
        }}
      >
        <span style={{ color: GREEN }}>Not eligible -&gt; escalate to supervisor</span>
        <span style={{ color: GREEN }}>Eligible -&gt; process refund</span>
        <span style={{ color: MUTED_LINE }}>Else: Auto-approve</span>
      </div>
    </div>
  );
}

function OutlinePanel({ compact }: { compact: boolean }) {
  const rows = [
    { label: "When to use", depth: 0 },
    { label: "Key Points", depth: 0 },
    { label: "Global Actions", depth: 0, active: true },
    { label: "Order_Identification", depth: 1, tag: true },
    { label: "Intent Clarification", depth: 0 },
    { label: "Jinja if", depth: 1 },
    { label: "context.status == error", depth: 2 },
    { label: "End conversation", depth: 3 },
    { label: "Handoff", depth: 3 },
  ];

  return (
    <aside
      style={{
        borderLeft: `1px solid ${LINE}`,
        padding: compact ? "10px 0 10px 12px" : "14px 0 14px 18px",
        display: "grid",
        alignContent: "start",
        gap: compact ? 7 : 10,
        overflow: "hidden",
      }}
    >
      {rows.map((row) => (
        <div
          key={`${row.depth}-${row.label}`}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 7,
            marginLeft: row.depth * (compact ? 10 : 14),
            color: row.active ? INK : MUTED,
            fontSize: compact ? 8 : 10,
            lineHeight: 1,
            fontWeight: row.active ? 650 : 500,
            whiteSpace: "nowrap",
          }}
        >
          <span
            style={{
              width: row.depth === 0 ? 8 : 5,
              height: row.depth === 0 ? 8 : 5,
              borderRadius: row.depth === 0 ? 999 : 2,
              background: row.active ? CHIP_ACCENT : "transparent",
              border: `1px solid ${row.active ? PV.warningBorder : LINE}`,
              flexShrink: 0,
            }}
          />
          <span>{row.label}</span>
          {row.tag && <span style={{ ...chipStyle("accent"), padding: "3px 5px", fontSize: 8 }}>H1</span>}
        </div>
      ))}
    </aside>
  );
}

function ActionbookEditorScene({ compact }: { compact: boolean }) {
  const sectionTextStyle: CSSProperties = {
    color: INK,
    fontSize: compact ? 10 : 12,
    lineHeight: 1.45,
    fontWeight: 500,
  };

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        maxWidth: compact ? "100%" : 650,
        maxHeight: "100%",
        margin: "0 auto",
        borderRadius: 20,
        background: PAPER,
        border: `1px solid ${LINE}`,
        boxShadow: brand.elevation.productLegacyPanel,
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <div
        style={{
          minHeight: compact ? 40 : 54,
          borderBottom: `1px solid ${LINE}`,
          padding: compact ? "0 13px" : "0 18px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
          boxSizing: "border-box",
        }}
      >
        <div style={{ minWidth: 0 }}>
          <div
            style={{
              color: INK,
              fontSize: compact ? 12 : 17,
              lineHeight: 1.1,
              fontWeight: 650,
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
              display: "flex",
              alignItems: "center",
              gap: compact ? 6 : 8,
            }}
          >
            <ArrowLeft size={compact ? 14 : 18} strokeWidth={2.2} />
            <span>Refund processing v2</span>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {!compact && (
            <span
              style={{
                borderRadius: 8,
                border: `1px solid ${LINE}`,
                padding: "7px 12px",
                color: INK,
                fontSize: 11,
                fontWeight: 600,
              }}
            >
              Cancel
            </span>
          )}
          <span
            style={{
              borderRadius: 8,
              background: ACTIVE,
              color: PAPER,
              padding: compact ? "7px 10px" : "8px 14px",
              fontSize: compact ? 10 : 11,
              fontWeight: 650,
              lineHeight: 1,
            }}
          >
            Save
          </span>
        </div>
      </div>
      <div
        style={{
          flex: 1,
          minHeight: 0,
          display: "grid",
          gridTemplateColumns: compact ? "1fr" : "minmax(0, 1fr) 220px",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            minWidth: 0,
            padding: compact ? 10 : 14,
            overflow: "hidden",
            display: "grid",
            alignContent: "start",
            gap: compact ? 8 : 10,
          }}
        >
          <SectionBox title="When to use" compact={compact}>
            <span style={{ ...chipStyle("neutral"), justifySelf: "start", padding: compact ? "5px 8px" : "6px 9px" }}>
              Always
            </span>
          </SectionBox>

          <SectionBox title="Key points" badge="System Prompt" compact={compact}>
            <div style={sectionTextStyle}>If refund &gt; $500 -&gt; supervisor approval required</div>
          </SectionBox>

          <SectionBox title="Global Actions" compact={compact}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
              <span style={{ ...chipStyle("accent"), padding: compact ? "5px 7px" : "6px 8px" }}>
                Order_Identification
              </span>
              <span
                style={{
                  color: INK,
                  fontSize: compact ? 10 : 12,
                  lineHeight: 1.35,
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                Always apply STT correction guide...
              </span>
            </div>
          </SectionBox>

          <SectionBox title="Intent Clarification" compact={compact}>
            <ConditionBlock compact={compact} />
          </SectionBox>
        </div>

        {!compact && <OutlinePanel compact={compact} />}
      </div>
    </div>
  );
}

function SettingsScene({ concept, compact }: { concept: ProductVisualConcept; compact: boolean }) {
  if (isActionbookConcept(concept)) {
    return <ActionbookEditorScene compact={compact} />;
  }

  return (
    <div style={{ display: "grid", gridTemplateColumns: compact ? "1fr" : "1fr 190px", gap: compact ? 10 : 14 }}>
	      <div style={{ borderRadius: 10, background: PAPER, padding: compact ? 12 : 16 }}>
        <div style={{ fontSize: compact ? 14 : 18, color: INK, fontWeight: 780 }}>{concept.title}</div>
        <div style={{ marginTop: 12, display: "grid", gap: 9 }}>
          {concept.metrics.map((metric) => (
            <div key={metric.label} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: compact ? 10 : 12 }}>
              <span style={{ color: INK, fontWeight: 650 }}>{metric.label}</span>
              <span style={chipStyle(metric.tone)}>{metric.value}</span>
            </div>
          ))}
        </div>
	        <div style={{ marginTop: 14, borderRadius: 8, background: CREAM, padding: compact ? 10 : 12 }}>
          <div style={{ fontSize: 11, color: MUTED, fontWeight: 700, marginBottom: 7 }}>Instructions for AI</div>
          <div style={{ fontSize: compact ? 10 : 12, color: INK, lineHeight: 1.45 }}>{concept.subtitle}</div>
        </div>
      </div>
	      {!compact && (
	        <div style={{ borderRadius: 18, background: PAPER, padding: 14 }}>
	          <div style={{ fontSize: 14, color: INK, fontWeight: 780, marginBottom: 16 }}>Tester</div>
	          <div style={{ borderRadius: 12, background: CREAM, padding: 10, display: "grid", gap: 7 }}>
	            <span style={{ width: "82%", height: 12, borderRadius: 999, background: brand.color.surface[3], display: "block" }} />
	            <span style={{ width: "56%", height: 12, borderRadius: 999, background: brand.color.surface[3], display: "block" }} />
	          </div>
	          <div style={{ marginTop: 10, display: "flex", justifyContent: "end" }}>
	            <span style={chipStyle("neutral")}>Suggested reply</span>
          </div>
        </div>
      )}
    </div>
  );
}

function AnalyticsScene({ concept, compact }: { concept: ProductVisualConcept; compact: boolean }) {
  return (
    <div style={{ display: "grid", gap: compact ? 10 : 14 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
        <div>
          <div style={{ fontSize: compact ? 15 : 20, color: INK, fontWeight: 780 }}>{concept.title}</div>
          <div style={{ marginTop: 4, fontSize: compact ? 10 : 12, color: MUTED }}>{concept.subtitle}</div>
        </div>
        {!compact && <span style={chipStyle("accent")}>{concept.badge}</span>}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: compact ? "1fr" : "repeat(3, minmax(0, 1fr))", gap: compact ? 8 : 12 }}>
        {concept.metrics.map((metric) => <MetricCard key={metric.label} {...metric} compact={compact} />)}
      </div>
      {!compact && <SummaryRows concept={concept} compact />}
    </div>
  );
}

function WorkspaceScene({ concept, compact }: { concept: ProductVisualConcept; compact: boolean }) {
  return (
    <div style={{ display: "grid", gap: compact ? 10 : 14 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <div style={{ fontSize: compact ? 15 : 20, color: INK, fontWeight: 780 }}>{concept.title}</div>
          <div style={{ marginTop: 4, fontSize: compact ? 10 : 12, color: MUTED }}>{concept.subtitle}</div>
        </div>
        <span style={chipStyle("neutral")}>{concept.primaryValue}</span>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: compact ? "1fr" : "repeat(3, minmax(0, 1fr))", gap: compact ? 8 : 12 }}>
        {concept.metrics.map((metric) => (
	          <div key={metric.label} style={{ borderRadius: 9, background: PAPER, padding: compact ? 10 : 14 }}>
            <div style={{ fontSize: compact ? 11 : 13, color: INK, fontWeight: 760 }}>{metric.label}</div>
            <div style={{ marginTop: 18, fontSize: compact ? 10 : 12, color: toneColor(metric.tone), fontWeight: 700 }}>{metric.value}</div>
          </div>
        ))}
      </div>
      {!compact && <SummaryRows concept={concept} compact />}
    </div>
  );
}

export function ConceptUIDisplay({ concept, maxWidth, maxHeight }: Props) {
  if (!concept) return null;

  const compact = maxWidth < 460 || maxHeight < 300;
  const standaloneScene = isActionbookConcept(concept) || isOversightConcept(concept);

  if (standaloneScene) {
    const pad = compact ? 12 : 24;

    return (
      <div
        style={{
          width: maxWidth,
          height: maxHeight,
          borderRadius: 12,
          overflow: "hidden",
          background: CREAM,
          color: INK,
          padding: pad,
          boxSizing: "border-box",
        }}
      >
        {isActionbookConcept(concept) ? (
          <ActionbookEditorScene compact={compact} />
        ) : (
          <OversightReviewScene compact={compact} />
        )}
      </div>
    );
  }

  const bodyPad = compact ? 12 : 18;
  const sidebarW = compact ? 44 : 66;
  const headerH = compact ? 36 : 44;
  const bodyH = Math.max(0, maxHeight - headerH);
  const contentW = Math.max(0, maxWidth - sidebarW);

  return (
    <div
      style={{
        width: maxWidth,
        height: maxHeight,
        borderRadius: 12,
        overflow: "hidden",
        background: CREAM,
        boxShadow: SHADOW,
        border: `1px solid ${LINE}`,
        color: INK,
      }}
    >
      <Header compact={compact} />
      <div style={{ display: "flex", width: maxWidth, height: bodyH }}>
        <Sidebar compact={compact} activeKind={concept.kind} />
        <main
          style={{
            width: contentW,
            height: bodyH,
            padding: bodyPad,
            boxSizing: "border-box",
            overflow: "hidden",
          }}
        >
          {concept.kind === "deployment" ? (
            <DeploymentScene concept={concept} compact={compact} />
          ) : concept.kind === "conversation" ? (
            <ConversationScene concept={concept} compact={compact} />
          ) : concept.kind === "evaluation" ? (
            <EvaluationScene concept={concept} compact={compact} />
          ) : concept.kind === "settings" ? (
            <SettingsScene concept={concept} compact={compact} />
          ) : concept.kind === "workspace" ? (
            <WorkspaceScene concept={concept} compact={compact} />
          ) : (
            <AnalyticsScene concept={concept} compact={compact} />
          )}
        </main>
      </div>
    </div>
  );
}
