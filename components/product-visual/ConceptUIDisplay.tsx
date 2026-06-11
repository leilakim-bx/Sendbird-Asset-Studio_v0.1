import type { CSSProperties, ReactNode } from "react";
import type { ProductVisualConcept, ProductVisualTone } from "@/lib/types/product-visual";

type Props = {
  concept: ProductVisualConcept | undefined;
  maxWidth: number;
  maxHeight: number;
};

const SHADOW = "0 6px 18px rgba(0,0,0,0.06)";
const INK = "#2C241C";
const MUTED = "#77716A";
const LINE = "#DEDAD4";
const PAPER = "#FFFFFF";
const CREAM = "#F7F5F0";
const ACTIVE = "#2A2118";
const ACCENT = "#6D3CFF";
const GREEN = "#00A878";
const RED = "#FF5E69";

function chipPalette(tone: ProductVisualTone | undefined): { background: string; color: string } {
  if (tone === "good") return { background: "#DDF5EB", color: "#009B72" };
  if (tone === "warn") return { background: "#FFE2E6", color: "#D94D5C" };
  if (tone === "accent") return { background: "#DED7FF", color: "#4A28BF" };
  return { background: "#EDE9E2", color: "#706A63" };
}

function toneColor(tone: ProductVisualTone | undefined): string {
  if (tone === "good") return GREEN;
  if (tone === "warn") return RED;
  if (tone === "accent") return ACCENT;
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

function Sparkline({ color = "#CFCAC3" }: { color?: string }) {
  return (
    <div style={{ display: "flex", alignItems: "end", gap: 3, height: 34, width: 86 }}>
      {[14, 22, 17, 25, 20, 18, 27, 12].map((h, index) => (
        <span
          key={index}
          style={{
            width: 8,
            height: h,
            borderRadius: 4,
            background: index === 6 ? color : "#E4E0DA",
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

function SolidIconSvg({ size, children }: { size: number; children: ReactNode }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden style={{ display: "block", fill: "currentColor" }}>
      {children}
    </svg>
  );
}

function SolidHome({ size }: { size: number }) {
  return (
    <SolidIconSvg size={size}>
      <path d="M12 3.1 3.5 10.2c-.8.7-.4 2.1.7 2.1h1.2v6.5c0 1.2.8 2 2 2h3v-5.4h3.2v5.4h3c1.2 0 2-.8 2-2v-6.5h1.2c1.1 0 1.5-1.4.7-2.1L12 3.1Z" />
    </SolidIconSvg>
  );
}

function SolidSparkles({ size }: { size: number }) {
  return (
    <SolidIconSvg size={size}>
      <path d="M9.2 2.7a1 1 0 0 1 1.9 0l.8 3.1a2.7 2.7 0 0 0 1.9 1.9l3.1.8a1 1 0 0 1 0 1.9l-3.1.8a2.7 2.7 0 0 0-1.9 1.9l-.8 3.1a1 1 0 0 1-1.9 0l-.8-3.1a2.7 2.7 0 0 0-1.9-1.9l-3.1-.8a1 1 0 0 1 0-1.9l3.1-.8a2.7 2.7 0 0 0 1.9-1.9l.8-3.1Z" />
      <path d="M18.3 14.3a.8.8 0 0 1 1.4 0l.4 1.4c.2.6.6 1 1.2 1.2l1.4.4a.8.8 0 0 1 0 1.4l-1.4.4c-.6.2-1 .6-1.2 1.2l-.4 1.4a.8.8 0 0 1-1.4 0l-.4-1.4c-.2-.6-.6-1-1.2-1.2l-1.4-.4a.8.8 0 0 1 0-1.4l1.4-.4c.6-.2 1-.6 1.2-1.2l.4-1.4Z" />
    </SolidIconSvg>
  );
}

function SolidEdit({ size }: { size: number }) {
  return (
    <SolidIconSvg size={size}>
      <path d="M6.5 4h7.1l-2.1 2.1H7.1a1 1 0 0 0-1 1v9.8a1 1 0 0 0 1 1h9.8a1 1 0 0 0 1-1v-4.4l2.1-2.1v7.1a2.5 2.5 0 0 1-2.5 2.5h-11A2.5 2.5 0 0 1 4 17.5v-11A2.5 2.5 0 0 1 6.5 4Z" />
      <path d="M13 11.8 18.8 6a1.7 1.7 0 0 1 2.4 2.4l-5.8 5.8-3.5.9 1.1-3.3Z" />
    </SolidIconSvg>
  );
}

function SolidAnalytics({ size }: { size: number }) {
  return (
    <SolidIconSvg size={size}>
      <path d="M5.6 4.2a1.1 1.1 0 0 1 1.1 1.1v12h12a1.1 1.1 0 1 1 0 2.2H5.6a1.1 1.1 0 0 1-1.1-1.1V5.3a1.1 1.1 0 0 1 1.1-1.1Z" />
      <path d="M8.6 14.4v-2.2l2.7-2.4 2.4 2 4.2-5a1.1 1.1 0 0 1 1.7 1.4l-4.9 5.9a1.1 1.1 0 0 1-1.6.1l-1.8-1.5-2.7 1.7Z" />
    </SolidIconSvg>
  );
}

function SolidSend({ size }: { size: number }) {
  return (
    <SolidIconSvg size={size}>
      <path d="M20.9 3.2 3.7 10.1a1.2 1.2 0 0 0 .1 2.3l6.5 2.1 2.1 6.5a1.2 1.2 0 0 0 2.3.1l6.9-17.2a.6.6 0 0 0-.7-.7ZM11.4 13.1l-4.2-1.4 9.1-3.7-4.9 5.1Z" />
    </SolidIconSvg>
  );
}

function Sidebar({ compact, activeKind }: { compact: boolean; activeKind: ProductVisualConcept["kind"] }) {
  const items: { id: string; icon: (props: { size: number }) => ReactNode }[] = [
    { id: "home", icon: SolidHome },
    { id: "build", icon: SolidSparkles },
    { id: "edit", icon: SolidEdit },
    { id: "analytics", icon: SolidAnalytics },
    { id: "network", icon: SolidSend },
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
              background: active ? "#E7E3DC" : "transparent",
              color: active ? ACTIVE : "#50504F",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Icon size={compact ? 15 : 19} />
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
	            background: "#FAF9F6",
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
	            background: "#F6F1FF",
	            padding: compact ? 11 : 14,
	          }}
	        >
          <div style={{ fontSize: compact ? 11 : 13, color: ACCENT, fontWeight: 760 }}>{concept.primaryLabel}</div>
          <div style={{ marginTop: 6, display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: compact ? 28 : 42, color: ACCENT, fontWeight: 760, lineHeight: 1 }}>{concept.primaryValue}</span>
            <span style={{ height: 8, flex: 1, borderRadius: 999, background: "#DAD0FF", overflow: "hidden" }}>
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
    { align: "left", width: "48%", background: "#EEEAE4" },
    { align: "right", width: "52%", background: ACTIVE },
    { align: "left", width: "34%", background: "#EEEAE4" },
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
                  background: index === 0 ? "#EEEAE4" : "#DEDAD4",
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

function SettingsScene({ concept, compact }: { concept: ProductVisualConcept; compact: boolean }) {
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
	          <div style={{ borderRadius: 12, background: "#EEEAE4", padding: 10, display: "grid", gap: 7 }}>
	            <span style={{ width: "82%", height: 12, borderRadius: 999, background: "#DEDAD4", display: "block" }} />
	            <span style={{ width: "56%", height: 12, borderRadius: 999, background: "#DEDAD4", display: "block" }} />
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
