import type { CSSProperties, ReactNode } from "react";
import { getBackground } from "@/lib/backgrounds";
import {
  PRODUCT_UI_STATUS_LABELS,
  PRODUCT_UI_STATUS_STYLES,
  type ProductUiContent,
  type ProductUiItem,
  type ProductUiStatus,
} from "@/lib/types/product-ui";

type Props = {
  content: ProductUiContent;
  exportMode?: boolean;
};

export const PRODUCT_UI_SIZES = {
  "feature-desktop": { width: 866, height: 660, label: "Feature · Desktop", detail: "866×660" },
  "feature-mobile": { width: 343, height: 660, label: "Feature · Mobile", detail: "mobile crop" },
  release: { width: 866, height: 660, label: "Release image", detail: "thumbnail / inline" },
} as const;

const COLORS = {
  bg: "#FFFFFF",
  bgSubtle: "#F7F5F0",
  surface: "#FFFFFF",
  surface2: "#F7F5F0",
  border: "#D9D6D2",
  borderLight: "#E5E3DF",
  text: "#292016",
  textMuted: "#66625E",
  textDim: "#8C867E",
  disabled: "#C4C0B9",
  lime: "#F2FF66",
  limeBorder: "#D9E64D",
  ctaDark: "#18140F",
  red500: "#FF5E69",
  red100: "#FFE3E5",
  blue500: "#27A6F7",
  blue100: "#D8F0FF",
  green500: "#25BD85",
  green100: "#D0F3E6",
} as const;

// SF Pro is available as the Apple system font; -apple-system is the reliable
// browser alias used for export when the named SF families are not exposed.
const FONT = '"SF Pro Text", "SF Pro Display", -apple-system, BlinkMacSystemFont, "Helvetica Neue", Arial, sans-serif';
const INK = COLORS.text;
const MUTED = COLORS.textMuted;
const DIM = COLORS.textDim;
const BORDER = COLORS.border;
const BORDER_LIGHT = COLORS.borderLight;
const SURFACE = COLORS.surface;
const STAGE = COLORS.bgSubtle;
const LIME = COLORS.lime;

function statusStyle(status: ProductUiStatus = "neutral") {
  return PRODUCT_UI_STATUS_STYLES[status];
}

function truncate(value: string, max = 82) {
  if (value.length <= max) return value;
  return `${value.slice(0, max - 1)}…`;
}

function Surface({
  children,
  style,
  muted = false,
}: {
  children: ReactNode;
  style?: CSSProperties;
  muted?: boolean;
}) {
  return (
    <div
      style={{
        boxSizing: "border-box",
        background: muted ? "rgba(255,255,255,0.92)" : SURFACE,
        border: `1px solid ${BORDER}`,
        borderRadius: 14,
        boxShadow: "0 18px 38px rgba(41, 32, 22, 0.12)",
        color: INK,
        overflow: "hidden",
        ...style,
      }}
    >
      {children}
    </div>
  );
}

function Pill({
  children,
  status = "neutral",
  compact = false,
}: {
  children: ReactNode;
  status?: ProductUiStatus;
  compact?: boolean;
}) {
  const colors = statusStyle(status);
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        whiteSpace: "nowrap",
        borderRadius: 999,
        border: `1px solid ${colors.border}`,
        background: colors.bg,
        color: colors.fg,
        fontSize: compact ? 8 : 10,
        lineHeight: 1,
        fontWeight: 700,
        padding: compact ? "4px 7px" : "5px 9px",
      }}
    >
      {children}
    </span>
  );
}

function TinyButton({ children, dark = false }: { children: ReactNode; dark?: boolean }) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        height: 28,
        padding: "0 12px",
        borderRadius: 7,
        background: dark ? COLORS.ctaDark : COLORS.surface2,
        color: dark ? COLORS.bg : INK,
        border: dark ? `1px solid ${COLORS.ctaDark}` : `1px solid ${BORDER_LIGHT}`,
        fontSize: 10,
        fontWeight: 700,
      }}
    >
      {children}
    </span>
  );
}

function Dots() {
  return (
    <span style={{ display: "inline-flex", gap: 5 }}>
      <span style={{ width: 6, height: 6, borderRadius: 999, background: BORDER_LIGHT }} />
      <span style={{ width: 6, height: 6, borderRadius: 999, background: BORDER_LIGHT }} />
      <span style={{ width: 6, height: 6, borderRadius: 999, background: BORDER_LIGHT }} />
    </span>
  );
}

function WindowHeader({ title, right }: { title: string; right?: ReactNode }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        height: 42,
        padding: "0 18px",
        borderBottom: `1px solid ${BORDER}`,
        fontSize: 13,
        fontWeight: 700,
      }}
    >
      <Dots />
      <span style={{ flex: 1 }}>{title}</span>
      {right}
    </div>
  );
}

function ItemRow({ item, dense = false }: { item: ProductUiItem; dense?: boolean }) {
  const status = item.status ?? "neutral";
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        minHeight: dense ? 42 : 50,
        padding: dense ? "8px 10px" : "10px 12px",
        borderRadius: 10,
        background: COLORS.surface2,
        border: `1px solid ${BORDER_LIGHT}`,
      }}
    >
      <span
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: dense ? 22 : 26,
          height: dense ? 22 : 26,
          borderRadius: 7,
          background: statusStyle(status).bg,
          color: statusStyle(status).fg,
          fontSize: 11,
          fontWeight: 800,
          flex: "0 0 auto",
        }}
      >
        {item.label.slice(0, 1)}
      </span>
      <span style={{ flex: 1, minWidth: 0 }}>
        <span
          style={{
            display: "block",
            fontSize: dense ? 10 : 12,
            fontWeight: 750,
            lineHeight: 1.15,
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {item.label}
        </span>
        {item.detail && (
          <span
            style={{
              display: "block",
              marginTop: 3,
              fontSize: dense ? 8 : 9,
              color: DIM,
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {item.detail}
          </span>
        )}
      </span>
      {item.value ? <Pill status={status} compact={dense}>{item.value}</Pill> : <Pill status={status} compact={dense}>{PRODUCT_UI_STATUS_LABELS[status]}</Pill>}
    </div>
  );
}

function AiResponseScene({ content, compact }: { content: ProductUiContent; compact: boolean }) {
  const items = content.items.slice(0, 3);
  return (
    <Surface style={{ width: compact ? 360 : 390 }}>
      <WindowHeader title={content.title} right={<span style={{ fontSize: 16, color: MUTED }}>×</span>} />
      <div style={{ padding: compact ? 18 : 22 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
          <span style={{ color: MUTED, fontSize: 11 }}>{content.eyebrow ?? "Reviewer"}</span>
          <span style={{ width: 22, height: 22, borderRadius: 999, background: COLORS.disabled }} />
          <strong style={{ fontSize: 11 }}>{content.secondaryText ?? "Emily Choi"}</strong>
        </div>
        <div
          style={{
            border: `1px solid ${BORDER}`,
            borderRadius: 12,
            padding: 14,
            fontSize: 13,
            lineHeight: 1.45,
            minHeight: 96,
          }}
        >
          {truncate(content.primaryText ?? "", compact ? 155 : 210)}
        </div>
        <div style={{ marginTop: 16, borderTop: `1px solid ${BORDER}`, paddingTop: 12 }}>
          <div style={{ fontSize: 10, fontWeight: 800, marginBottom: 8 }}>Knowledge sources used</div>
          <div style={{ display: "grid", gap: 6 }}>
            {items.map((item) => (
              <div key={item.id} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 10 }}>
                <span style={{ color: MUTED }}>▣</span>
                <span style={{ flex: 1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{item.label}</span>
                <span style={{ color: COLORS.green500, fontWeight: 800 }}>{item.value}</span>
              </div>
            ))}
          </div>
        </div>
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 18 }}>
          <TinyButton>Edit first</TinyButton>
          <TinyButton dark>{content.metricB ?? "Send as-is"}</TinyButton>
        </div>
      </div>
    </Surface>
  );
}

function ReviewQueueScene({ content, compact }: { content: ProductUiContent; compact: boolean }) {
  return (
    <Surface style={{ width: compact ? 430 : 470 }}>
      <div style={{ padding: "22px 24px 18px" }}>
        <h3 style={{ margin: 0, fontSize: 18, lineHeight: 1.1 }}>{content.title}</h3>
        <div style={{ display: "flex", gap: 18, marginTop: 16, paddingBottom: 10, borderBottom: `1px solid ${BORDER}` }}>
          {["Response review", "Hallucinations", "Access"].map((tab, index) => (
            <span key={tab} style={{ fontSize: 10, fontWeight: 800, color: index === 0 ? INK : MUTED }}>{tab}</span>
          ))}
        </div>
        <div style={{ display: "grid", gap: 9, marginTop: 14 }}>
          {content.items.slice(0, compact ? 3 : 4).map((item) => <ItemRow key={item.id} item={item} dense />)}
        </div>
        <div
          style={{
            marginTop: 14,
            padding: "11px 12px",
            borderRadius: 12,
            background: COLORS.surface2,
            display: "flex",
            alignItems: "center",
            gap: 12,
            fontSize: 12,
          }}
        >
          <strong style={{ color: COLORS.green500 }}>{content.primaryText ?? "94% on policy"}</strong>
          <span style={{ color: MUTED, flex: 1 }}>{content.secondaryText ?? "12 flagged today"}</span>
          <TinyButton dark>{content.metricB ?? "Kill switch"}</TinyButton>
        </div>
      </div>
    </Surface>
  );
}

function TestResultsScene({ content, compact }: { content: ProductUiContent; compact: boolean }) {
  return (
    <div style={{ position: "relative", width: compact ? 540 : 760, height: compact ? 410 : 360 }}>
      <Surface style={{ position: "absolute", left: 0, top: 0, width: compact ? 400 : 430, padding: 22 }}>
        <h3 style={{ margin: 0, fontSize: 18 }}>{content.title}</h3>
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 18, fontSize: 11, fontWeight: 800 }}>
          <span>{content.eyebrow ?? "Results"}</span>
          <span style={{ color: COLORS.green500 }}>{content.metricA}</span>
          <span style={{ color: COLORS.red500 }}>{content.metricB}</span>
        </div>
        <div style={{ display: "grid", gap: 9, marginTop: 12 }}>
          {content.items.slice(0, compact ? 4 : 5).map((item) => <ItemRow key={item.id} item={item} dense />)}
        </div>
      </Surface>
      <div
        style={{
          position: "absolute",
          left: compact ? 330 : 372,
          top: compact ? 110 : 105,
          width: compact ? 220 : 330,
          display: "grid",
          gap: 16,
        }}
      >
        {content.nodes.slice(0, 2).map((node) => (
          <Surface key={node.id} style={{ padding: 16, background: node.status === "warning" ? COLORS.red100 : COLORS.blue100 }}>
            <div style={{ fontSize: 11, fontWeight: 800, marginBottom: 7 }}>{content.secondaryText ?? "AI agent's answer"}</div>
            <div style={{ fontSize: 12, lineHeight: 1.35 }}>{truncate(node.title, compact ? 76 : 120)}</div>
            <div style={{ marginTop: 8, color: MUTED, fontSize: 10 }}>{node.detail}</div>
          </Surface>
        ))}
      </div>
    </div>
  );
}

function TrafficScene({ content }: { content: ProductUiContent }) {
  const a = Number.parseFloat(content.metricA ?? "70") || 70;
  const b = Number.parseFloat(content.metricB ?? "30") || 30;
  return (
    <Surface style={{ width: 382, padding: 24 }}>
      <h3 style={{ margin: 0, fontSize: 15 }}>{content.title}</h3>
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 18, fontSize: 10, fontWeight: 800 }}>
        <span>{content.primaryText ?? "Version B"}</span>
        <span>{content.secondaryText ?? "Version B (Candidate)"}</span>
      </div>
      <div style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 9 }}>
        <div style={{ height: 13, width: `${Math.max(12, a)}%`, background: COLORS.blue500, borderRadius: 4 }} />
        <div style={{ height: 30, width: 3, background: COLORS.ctaDark, borderRadius: 999 }} />
        <div style={{ height: 13, flex: 1, background: COLORS.lime, borderRadius: 4, border: `1px solid ${COLORS.limeBorder}` }} />
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 15 }}>
        <TinyButton>{content.metricA ?? "70%"}</TinyButton>
        <TinyButton>{content.metricB ?? "30%"}</TinyButton>
      </div>
      <span style={{ display: "none" }}>{b}</span>
    </Surface>
  );
}

function WorkflowScene({ content }: { content: ProductUiContent }) {
  const first = content.items[0];
  return (
    <div style={{ position: "relative", width: 520, height: 250 }}>
      <Surface style={{ position: "absolute", left: 20, top: 42, width: 180, padding: 12 }}>
        <TinyButton dark>{content.eyebrow ?? "Start proactive chat"}</TinyButton>
        <div style={{ marginTop: 14, color: MUTED, fontSize: 10 }}>{content.primaryText ?? first?.label ?? "Messenger"}</div>
        <div style={{ marginTop: 5, padding: "8px 10px", background: LIME, borderRadius: 5, fontSize: 12, fontWeight: 800 }}>
          {content.metricA ?? first?.value ?? "Email"}
        </div>
      </Surface>
      <div
        style={{
          position: "absolute",
          left: 190,
          top: 88,
          width: 88,
          height: 60,
          borderTop: `2px solid ${COLORS.ctaDark}`,
          borderRight: `2px solid ${COLORS.ctaDark}`,
          transform: "skewX(-24deg)",
        }}
      />
      <Surface style={{ position: "absolute", right: 18, top: 54, width: 265 }}>
        <WindowHeader title={content.title} right={<span style={{ color: MUTED }}>×</span>} />
        <div style={{ padding: 14, display: "grid", gap: 8 }}>
          <div style={{ height: 30, border: `1px solid ${BORDER}`, borderRadius: 6, color: MUTED, fontSize: 10, padding: "8px 10px" }}>
            Enter an email title
          </div>
          <div style={{ height: 54, border: `1px solid ${BORDER}`, borderRadius: 6, color: MUTED, fontSize: 10, padding: "8px 10px" }}>
            {content.secondaryText ?? "Enter message"}
          </div>
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 4 }}>
            <TinyButton>Cancel</TinyButton>
            <TinyButton dark>{content.metricB ?? "Send"}</TinyButton>
          </div>
        </div>
      </Surface>
    </div>
  );
}

function VersionHistoryScene({ content, compact }: { content: ProductUiContent; compact: boolean }) {
  const items = content.items.slice(0, 2);
  return (
    <div style={{ position: "relative", width: compact ? 430 : 520, height: compact ? 360 : 330 }}>
      <Surface style={{ position: "absolute", left: compact ? 16 : 0, top: 0, width: compact ? 390 : 500, zIndex: 2 }}>
        <WindowHeader title={content.title} right={<span style={{ color: MUTED }}>×</span>} />
        <div style={{ padding: 18 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <Pill status="live">{content.eyebrow ?? "Current version"}</Pill>
            <span style={{ color: MUTED, fontSize: 10 }}>{content.metricB}</span>
          </div>
          <div style={{ marginTop: 12, fontSize: 11, color: MUTED }}>{content.metricA}</div>
          {items.map((item) => (
            <div key={item.id} style={{ marginTop: 12, padding: 13, borderRadius: 8, background: COLORS.surface2 }}>
              <strong style={{ display: "block", fontSize: 11 }}>{item.label}</strong>
              <span style={{ display: "block", marginTop: 6, color: MUTED, fontSize: 11, lineHeight: 1.35 }}>
                {item.detail}
              </span>
            </div>
          ))}
        </div>
      </Surface>
      <Surface
        style={{
          position: "absolute",
          left: compact ? 55 : 42,
          top: compact ? 215 : 205,
          width: compact ? 330 : 420,
          height: 128,
          opacity: 0.86,
          zIndex: 1,
        }}
      >
        <div style={{ padding: 15 }}>
          <Pill status="neutral" compact>Older version</Pill>
          <div style={{ marginTop: 12, height: 18, borderRadius: 5, background: COLORS.surface2 }} />
          <div style={{ marginTop: 8, height: 36, borderRadius: 5, background: COLORS.surface2 }} />
        </div>
      </Surface>
    </div>
  );
}

function StewardDetailScene({ content, compact }: { content: ProductUiContent; compact: boolean }) {
  return (
    <Surface style={{ width: compact ? 360 : 390 }}>
      <WindowHeader title={content.title} right={<span style={{ color: MUTED }}>×</span>} />
      <div style={{ padding: 22 }}>
        <h4 style={{ margin: 0, fontSize: 12 }}>{content.eyebrow ?? "Information"}</h4>
        <div style={{ display: "grid", gap: 9, marginTop: 14 }}>
          {content.items.slice(0, 5).map((item) => (
            <div key={item.id} style={{ display: "grid", gridTemplateColumns: "120px 1fr", gap: 10, fontSize: 11 }}>
              <span style={{ color: MUTED }}>{item.label}</span>
              <strong style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {item.status ? <Pill status={item.status} compact>{item.value}</Pill> : item.value}
              </strong>
            </div>
          ))}
        </div>
        <h4 style={{ margin: "28px 0 0", fontSize: 12 }}>Activity</h4>
        <div style={{ marginTop: 14, borderLeft: `1px dashed ${BORDER}`, paddingLeft: 18, display: "grid", gap: 22 }}>
          {content.nodes.slice(0, compact ? 1 : 2).map((node) => (
            <div key={node.id} style={{ position: "relative" }}>
              <span style={{ position: "absolute", left: -23, top: 3, width: 8, height: 8, borderRadius: 999, background: INK }} />
              <div style={{ fontSize: 11, fontWeight: 800 }}>{node.title}</div>
              <div style={{ marginTop: 5, fontSize: 11 }}>{node.detail}</div>
            </div>
          ))}
        </div>
      </div>
    </Surface>
  );
}

function AbTestScene({ content, compact }: { content: ProductUiContent; compact: boolean }) {
  const items = content.items.slice(0, 3);
  const nodes = content.nodes.slice(0, 2);
  return (
    <div style={{ position: "relative", width: compact ? 590 : 760, height: compact ? 300 : 240 }}>
      <Surface style={{ position: "absolute", left: 0, top: compact ? 35 : 38, width: compact ? 360 : 420, padding: 18, background: "rgba(255,255,255,0.68)" }}>
        <h3 style={{ margin: 0, fontSize: 14 }}>{content.eyebrow ?? "AI Concierge Environments"}</h3>
        <div style={{ display: "grid", gridTemplateColumns: `repeat(${items.length}, 1fr)`, gap: 10, marginTop: 16 }}>
          {items.map((item) => (
            <div key={item.id} style={{ padding: 13, borderRadius: 10, background: SURFACE }}>
              <div style={{ color: MUTED, fontSize: 9, fontWeight: 800 }}>{item.label}</div>
              <div style={{ marginTop: 8, fontSize: 18, fontWeight: 850 }}>{item.value}</div>
            </div>
          ))}
        </div>
      </Surface>
      <div style={{ position: "absolute", left: compact ? 350 : 410, top: compact ? 145 : 122, width: compact ? 72 : 94, height: 2, background: "rgba(255,255,255,0.8)" }} />
      <Surface style={{ position: "absolute", right: 0, top: compact ? 20 : 18, width: compact ? 260 : 300, padding: 18, background: "rgba(255,255,255,0.78)" }}>
        <h3 style={{ margin: 0, fontSize: 14 }}>{content.title}</h3>
        <Pill status="success" compact>WINNER</Pill>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 12 }}>
          {nodes.map((node) => (
            <div key={node.id} style={{ padding: 12, borderRadius: 9, background: SURFACE, textAlign: "center" }}>
              <Pill status={node.status ?? "neutral"} compact>{node.title}</Pill>
              <div style={{ marginTop: 10, fontSize: 30, fontWeight: 850 }}>{node.value}</div>
              <div style={{ color: MUTED, fontSize: 9 }}>{node.detail}</div>
            </div>
          ))}
        </div>
      </Surface>
    </div>
  );
}

function renderScene(content: ProductUiContent, compact: boolean) {
  switch (content.scene) {
    case "ai-response":
      return <AiResponseScene content={content} compact={compact} />;
    case "review-queue":
      return <ReviewQueueScene content={content} compact={compact} />;
    case "test-results":
      return <TestResultsScene content={content} compact={compact} />;
    case "traffic-allocation":
      return <TrafficScene content={content} />;
    case "workflow":
      return <WorkflowScene content={content} />;
    case "version-history":
      return <VersionHistoryScene content={content} compact={compact} />;
    case "steward-detail":
      return <StewardDetailScene content={content} compact={compact} />;
    case "ab-test":
      return <AbTestScene content={content} compact={compact} />;
  }
}

function sceneSize(scene: ProductUiContent["scene"], compact: boolean) {
  if (compact) {
    switch (scene) {
      case "ai-response":
      case "steward-detail":
        return { width: 360, height: 330 };
      case "review-queue":
        return { width: 430, height: 410 };
      case "test-results":
        return { width: 540, height: 410 };
      case "traffic-allocation":
        return { width: 382, height: 190 };
      case "workflow":
        return { width: 520, height: 250 };
      case "version-history":
        return { width: 430, height: 360 };
      case "ab-test":
        return { width: 590, height: 300 };
    }
  }

  switch (scene) {
    case "ai-response":
    case "steward-detail":
      return { width: 390, height: 330 };
    case "review-queue":
      return { width: 470, height: 420 };
    case "test-results":
      return { width: 760, height: 360 };
    case "traffic-allocation":
      return { width: 382, height: 190 };
    case "workflow":
      return { width: 520, height: 250 };
    case "version-history":
      return { width: 520, height: 330 };
    case "ab-test":
      return { width: 760, height: 240 };
  }
}

export function ProductUiCanvas({ content, exportMode }: Props) {
  const size = PRODUCT_UI_SIZES[content.format];
  const compact = content.format === "feature-mobile";
  const background = getBackground(content.backgroundId) ?? getBackground("bg-101");
  const hasPhoto = content.composition !== "plain-stage";
  const scene = renderScene(content, compact);
  const inset = compact ? 20 : content.composition === "wide-system" ? 66 : 58;
  const frameW = size.width - inset * 2;
  const frameH = size.height - inset * 2;
  const natural = sceneSize(content.scene, compact);
  const sceneScale = compact
    ? Math.min(1, frameW / natural.width, frameH / natural.height)
    : 1;

  return (
    <div
      data-export={exportMode ? "1" : undefined}
      style={{
        position: "relative",
        boxSizing: "border-box",
        width: size.width,
        height: size.height,
        overflow: "hidden",
        background: hasPhoto ? COLORS.blue100 : STAGE,
        fontFamily: FONT,
        color: INK,
      }}
    >
      {hasPhoto && background && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={background.url}
          alt=""
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover",
            filter: content.composition === "wide-system" ? "saturate(0.9)" : "blur(1.5px) saturate(0.9)",
            transform: content.composition === "wide-system" ? "scale(1.02)" : "scale(1.05)",
          }}
        />
      )}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: hasPhoto
            ? content.composition === "wide-system"
              ? "rgba(255,255,255,0.08)"
              : "rgba(255,255,255,0.16)"
            : "transparent",
        }}
      />
      <div
        style={{
          position: "absolute",
          inset,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            width: natural.width,
            height: natural.height,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transform: `scale(${sceneScale})`,
            transformOrigin: "center",
          }}
        >
          {scene}
        </div>
      </div>
    </div>
  );
}
