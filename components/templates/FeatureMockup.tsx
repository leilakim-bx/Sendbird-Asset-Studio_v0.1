import type { ChatMessage, ProductsMessage, ActionsMessage, TextMessage } from "@/lib/store";

// ── Props ─────────────────────────────────────────────────

export type FeatureMockupProps = {
  layout: "center" | "split";
  exportSize: "desktop" | "mobile";
  backgroundUrl: string;
  appName: string;
  messages: ChatMessage[];
  width?: number;
  height?: number;
};

// ── Canvas dimensions ─────────────────────────────────────

const SIZES = {
  desktop: { width: 864, height: 640 },
  mobile:  { width: 430, height: 540 },
};

// ── Chat bubble (unified user + bot) ─────────────────────

function ChatBubble({ msg, appName }: { msg: TextMessage; appName: string }) {
  const isUser = msg.role === "user";
  return (
    <div style={{
      margin: "0 14px",
      borderRadius: 18,
      padding: "10px 14px 12px",
      background: "rgba(242,242,242,0.95)",
      boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
    }}>
      {/* Avatar + name */}
      <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 6 }}>
        {isUser ? (
          msg.avatar
            ? /* eslint-disable-next-line @next/next/no-img-element */
              <img src={msg.avatar} alt={msg.sender}
                style={{ width: 18, height: 18, borderRadius: "50%", objectFit: "cover", flexShrink: 0 }} />
            : <div style={{ width: 18, height: 18, borderRadius: "50%", background: "#CBD5E1", flexShrink: 0 }} />
        ) : (
          <div style={{ width: 18, height: 18, borderRadius: "50%", background: "#111", flexShrink: 0 }} />
        )}
        <span style={{ fontSize: 10, fontWeight: 500, color: "#9CA3AF" }}>
          {isUser ? msg.sender : appName}
        </span>
      </div>
      {/* Text */}
      <p style={{ fontSize: 11, lineHeight: 1.55, color: "#1A1A1A", margin: 0 }}>
        {msg.text}
      </p>
    </div>
  );
}

function ActionButtons({ msg }: { msg: ActionsMessage }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6, margin: "0 14px" }}>
      {msg.buttons.map((btn, i) => (
        <div key={i} style={{
          borderRadius: 999,
          padding: "7px 16px",
          textAlign: "center",
          fontSize: 10,
          fontWeight: 500,
          color: "#374151",
          background: "rgba(242,242,242,0.95)",
          boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
        }}>
          {btn}
        </div>
      ))}
    </div>
  );
}

function ProductCards({ msg }: { msg: ProductsMessage }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, margin: "0 14px" }}>
      {msg.items.map((item, i) => (
        <div key={i} style={{
          borderRadius: 14,
          overflow: "hidden",
          background: "rgba(242,242,242,0.95)",
          boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
        }}>
          {item.img
            ? /* eslint-disable-next-line @next/next/no-img-element */
              <img src={item.img} alt={item.name} style={{ width: "100%", height: 72, objectFit: "cover", display: "block" }} />
            : <div style={{ width: "100%", height: 72, background: "#E5E7EB", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <span style={{ fontSize: 9, color: "#9CA3AF" }}>Image</span>
              </div>
          }
          <div style={{ padding: "7px 8px 8px" }}>
            <p style={{ fontSize: 10, fontWeight: 600, color: "#111", lineHeight: 1.3, margin: "0 0 3px" }}>{item.name}</p>
            <p style={{ fontSize: 9, color: "#6B7280", margin: "0 0 6px" }}>{item.sub}</p>
            <div style={{
              fontSize: 9, fontWeight: 500, color: "#374151",
              border: "1px solid #D1D5DB", borderRadius: 4,
              padding: "3px 0", textAlign: "center",
            }}>{item.cta}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Phone frame (matches the provided mockup design) ──────

function PhoneFrame({
  appName,
  messages,
  width,
}: {
  appName: string;
  messages: ChatMessage[];
  width: number;
}) {
  return (
    <div style={{
      width,
      borderRadius: 32,
      overflow: "hidden",
      background: "rgba(255,255,255,0.82)",
      backdropFilter: "blur(20px)",
      WebkitBackdropFilter: "blur(20px)",
      boxShadow: "0 12px 48px rgba(0,0,0,0.14), 0 1px 0 rgba(255,255,255,0.7) inset",
      display: "flex",
      flexDirection: "column",
    }}>
      {/* Header — centered app name, dots on right */}
      <div style={{
        position: "relative",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "14px 16px 12px",
        borderBottom: "1px solid rgba(209,213,219,0.45)",
      }}>
        <span style={{ fontSize: 15, fontWeight: 700, color: "#111", letterSpacing: "-0.01em" }}>
          {appName}
        </span>
        <span style={{
          position: "absolute",
          right: 16,
          fontSize: 14,
          color: "#9CA3AF",
          letterSpacing: "0.12em",
          lineHeight: 1,
        }}>
          ···
        </span>
      </div>

      {/* Message list */}
      <div style={{ display: "flex", flexDirection: "column", gap: 10, padding: "12px 0 14px" }}>
        {messages.map((msg) => {
          if (msg.type === "text")    return <ChatBubble    key={msg.id} msg={msg} appName={appName} />;
          if (msg.type === "actions") return <ActionButtons key={msg.id} msg={msg} />;
          if (msg.type === "products") return <ProductCards key={msg.id} msg={msg} />;
          return null;
        })}
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────

export function FeatureMockup({
  layout,
  exportSize,
  backgroundUrl,
  appName,
  messages,
  width,
  height,
}: FeatureMockupProps) {
  const size = SIZES[exportSize];
  const canvasW = width  ?? size.width;
  const canvasH = height ?? size.height;
  const isMobile = exportSize === "mobile";
  const isCenter = layout === "center";

  // Phone frame width: narrower when split, wider when center
  const frameW = isMobile
    ? Math.round(canvasW * 0.72)          // mobile canvas is already narrow
    : isCenter
      ? Math.round(canvasW * 0.38)        // desktop center
      : Math.round(canvasW * 0.36);       // desktop split

  const justifyContent = (!isMobile && !isCenter) ? "flex-start" : "center";
  const paddingLeft    = (!isMobile && !isCenter) ? canvasW * 0.05 : 0;

  return (
    <div style={{ width: canvasW, height: canvasH, position: "relative", overflow: "hidden" }}>

      {/* Background photo */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={backgroundUrl}
        alt=""
        style={{
          position: "absolute", inset: 0,
          width: "100%", height: "100%",
          objectFit: "cover",
          objectPosition: (!isMobile && !isCenter) ? "right center" : "center",
        }}
      />

      {/* Gradient veil */}
      <div style={{
        position: "absolute", inset: 0,
        background: (!isMobile && !isCenter)
          ? "linear-gradient(to right, rgba(255,255,255,0.15) 0%, transparent 55%)"
          : "rgba(255,255,255,0.04)",
      }} />

      {/* Phone frame */}
      <div style={{
        position: "absolute", inset: 0,
        display: "flex",
        alignItems: "center",
        justifyContent,
        paddingLeft,
        padding: isMobile
          ? `${canvasH * 0.05}px ${canvasW * 0.05}px`
          : (!isCenter)
            ? `${canvasH * 0.08}px 0 ${canvasH * 0.08}px ${paddingLeft}px`
            : `${canvasH * 0.08}px`,
      }}>
        <PhoneFrame
          appName={appName}
          messages={messages}
          width={frameW}
        />
      </div>

    </div>
  );
}
