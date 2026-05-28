import type { ChatMessage, ProductsMessage, ActionsMessage, TextMessage } from "@/lib/store";

// ── Props ─────────────────────────────────────────────────

export type FeatureMockupProps = {
  layout: "center" | "split";
  exportSize: "desktop" | "mobile";
  backgroundUrl: string;
  appName: string;
  messages: ChatMessage[];
  /** When used for actual PNG export, pass explicit px dimensions */
  width?: number;
  height?: number;
};

// ── Canvas dimensions ─────────────────────────────────────

const SIZES = {
  desktop: { width: 864, height: 640 },
  mobile:  { width: 430, height: 540 },
};

// ── Sub-components ────────────────────────────────────────

function UserBubble({ msg }: { msg: TextMessage }) {
  return (
    <div className="flex flex-col items-end gap-1 px-3">
      <div className="flex items-center gap-1.5">
        {msg.avatar && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={msg.avatar} alt={msg.sender} className="w-5 h-5 rounded-full object-cover" />
        )}
        <span className="text-[10px] text-gray-400">{msg.sender}</span>
      </div>
      <div className="bg-white rounded-2xl rounded-tr-sm px-3 py-2 shadow-sm max-w-[80%]">
        <p className="text-xs text-gray-800 leading-relaxed">{msg.text}</p>
      </div>
    </div>
  );
}

function BotBubble({ msg, appName }: { msg: TextMessage; appName: string }) {
  return (
    <div className="flex flex-col items-start gap-1 px-3">
      <div className="flex items-center gap-1.5">
        <span className="w-2 h-2 rounded-full bg-gray-900 inline-block" />
        <span className="text-[10px] text-gray-400">{appName}</span>
      </div>
      <div className="bg-white rounded-2xl rounded-tl-sm px-3 py-2 shadow-sm max-w-[90%]">
        <p className="text-xs text-gray-800 leading-relaxed">{msg.text}</p>
      </div>
    </div>
  );
}

function ActionButtons({ msg }: { msg: ActionsMessage }) {
  return (
    <div className="flex flex-col gap-1.5 px-3">
      {msg.buttons.map((btn, i) => (
        <div
          key={i}
          className="bg-gray-100 rounded-full text-center text-xs py-2 px-4 text-gray-700"
        >
          {btn}
        </div>
      ))}
    </div>
  );
}

function ProductCards({ msg }: { msg: ProductsMessage }) {
  return (
    <div className="grid grid-cols-2 gap-2 px-3">
      {msg.items.map((item, i) => (
        <div key={i} className="bg-white rounded-xl overflow-hidden shadow-sm">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={item.img}
            alt={item.name}
            className="w-full h-24 object-cover"
          />
          <div className="p-2">
            <p className="text-[10px] font-medium text-gray-800 leading-tight line-clamp-2">
              {item.name}
            </p>
            <p className="text-[10px] text-gray-500 mt-0.5">{item.sub}</p>
            <button className="mt-1.5 w-full border border-gray-300 rounded text-[10px] py-1 text-gray-700">
              {item.cta}
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Glass Mockup ──────────────────────────────────────────

function GlassMockup({
  appName,
  messages,
  compact,
}: {
  appName: string;
  messages: ChatMessage[];
  compact: boolean;
}) {
  return (
    <div
      className="bg-white/75 backdrop-blur-md rounded-2xl shadow-xl overflow-hidden flex flex-col"
      style={{ width: compact ? 270 : 320 }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-gray-200/60">
        <span className="text-xs font-medium text-gray-700">{appName}</span>
        <span className="text-gray-400 text-sm tracking-widest">···</span>
      </div>

      {/* Messages */}
      <div className="flex flex-col gap-3 py-3 overflow-hidden">
        {messages.map((msg) => {
          if (msg.type === "text" && msg.role === "user")
            return <UserBubble key={msg.id} msg={msg} />;
          if (msg.type === "text" && msg.role === "bot")
            return <BotBubble key={msg.id} msg={msg} appName={appName} />;
          if (msg.type === "actions")
            return <ActionButtons key={msg.id} msg={msg} />;
          if (msg.type === "products")
            return <ProductCards key={msg.id} msg={msg} />;
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
  const compact  = isMobile || layout === "split";

  return (
    <div
      style={{ width: canvasW, height: canvasH, position: "relative", overflow: "hidden" }}
    >
      {/* Background layer */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={backgroundUrl}
        alt=""
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          objectFit: "cover",
          objectPosition: layout === "split" && !isMobile ? "right center" : "center",
        }}
      />

      {/* Slight gradient overlay for contrast */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            layout === "split" && !isMobile
              ? "linear-gradient(to right, rgba(255,255,255,0.15) 0%, transparent 60%)"
              : "rgba(255,255,255,0.05)",
        }}
      />

      {/* Mockup layer */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          alignItems: "center",
          justifyContent:
            layout === "split" && !isMobile ? "flex-start" : "center",
          padding:
            layout === "split" && !isMobile
              ? `${canvasH * 0.08}px 0 ${canvasH * 0.08}px ${canvasW * 0.04}px`
              : `${canvasH * 0.06}px`,
        }}
      >
        <GlassMockup
          appName={appName}
          messages={messages}
          compact={compact}
        />
      </div>
    </div>
  );
}
