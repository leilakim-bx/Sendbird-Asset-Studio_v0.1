"use client";

import { useRef, useState } from "react";
import { UserRound, Bot, Sparkles, GripVertical } from "lucide-react";
import { SCENARIOS } from "@/lib/scenarios";
import { useEditorStore } from "@/lib/store";
import type { ChatMessage, ProductsMessage } from "@/lib/store";
import { BACKGROUNDS } from "@/lib/backgrounds";
import { BackgroundPickerModal } from "./BackgroundPickerModal";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

let idCounter = 100;
const uid = () => `m${++idCounter}`;

/** Search Pexels for a product photo matching the keyword.
 *  Returns a proxy-wrapped image URL, or empty string on failure. */
async function fetchProductImage(keyword: string): Promise<string> {
  const res = await fetch(`/api/product-image?q=${encodeURIComponent(keyword.trim())}`);
  if (!res.ok) return "";
  const { url } = await res.json() as { url: string | null };
  if (!url) return "";
  return `/api/proxy-image?url=${encodeURIComponent(url)}`;
}


// ── Product item row ──────────────────────────────────────

type ProductItemRowProps = {
  item: ProductsMessage["items"][number];
  onUpdate: (patch: Partial<ProductsMessage["items"][number]>) => void;
};

function ProductItemRow({ item, onUpdate }: ProductItemRowProps) {
  const [name, setName] = useState(item.name);
  const [loading, setLoading] = useState(false);

  async function applyImage(value: string) {
    const trimmed = value.trim();
    if (!trimmed) return;
    onUpdate({ name: trimmed });
    setLoading(true);
    try {
      const img = await fetchProductImage(trimmed);
      if (img) onUpdate({ img });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-1.5">
      {/* Name input */}
      <Input
        value={name}
        onChange={(e) => setName(e.target.value)}
        onKeyDown={(e) => { if (e.key === "Enter") applyImage(name); }}
        placeholder="Product name"
        className="h-7 text-xs bg-studio-sidebar border-studio-border text-studio-text placeholder:text-studio-muted"
      />
      {/* Apply + Refresh */}
      <div className="flex gap-1">
        <button
          onClick={() => applyImage(name)}
          disabled={loading}
          className="flex-1 h-7 rounded-md bg-[#D0F3E6] text-[#1A1A1A] hover:opacity-90 transition-opacity text-[11px] font-semibold disabled:opacity-50"
        >
          {loading ? "Loading…" : "Apply Image"}
        </button>
        <button
          onClick={() => applyImage(name)}
          disabled={loading}
          title="Load a different image"
          className="h-7 px-2.5 rounded-md bg-studio-hover text-studio-text hover:bg-studio-border transition-colors text-xs shrink-0 disabled:opacity-50"
        >
          ↺
        </button>
      </div>
      <Input
        value={item.sub}
        onChange={(e) => onUpdate({ sub: e.target.value })}
        placeholder="Price or subtitle"
        className="h-7 text-xs bg-studio-sidebar border-studio-border text-studio-text placeholder:text-studio-muted"
      />
    </div>
  );
}

// ── Section wrapper ───────────────────────────────────────

function Section({
  title,
  action,
  children,
}: {
  title: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="border-b border-studio-border pb-5 mb-5">
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-semibold text-studio-muted uppercase tracking-wider">
          {title}
        </p>
        {action}
      </div>
      {children}
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────

export function FormPanel() {
  const {
    layout, setLayout,
    exportSize, setExportSize,
    backgroundId, setBackgroundId,
    appName, setAppName,
    messages, addMessage, updateMessage, removeMessage, setMessages,
    customBackgrounds, addCustomBackground,
  } = useEditorStore();

  const [showBgModal, setShowBgModal] = useState(false);

  // ── Scenario ───────────────────────────────────────────
  const [activeScenario, setActiveScenario] = useState<string | null>(null);
  const [genPrompt,  setGenPrompt]  = useState("");
  const [genLoading, setGenLoading] = useState(false);
  const [genError,   setGenError]   = useState<string | null>(null);

  function applyScenario(id: string) {
    const s = SCENARIOS.find((s) => s.id === id);
    if (!s) return;
    setActiveScenario(id);
    setMessages(s.messages);
  }

  async function handleGenerate() {
    const prompt = genPrompt.trim();
    if (!prompt || genLoading) return;
    setGenLoading(true);
    setGenError(null);
    setActiveScenario(null);
    try {
      const res = await fetch("/api/generate-scenario", {
        method:  "POST",
        headers: { "content-type": "application/json" },
        body:    JSON.stringify({ prompt }),
      });
      const data = await res.json() as { messages?: unknown[]; error?: string };
      if (!res.ok) { setGenError(data.error ?? "Generation failed"); return; }
      setMessages(data.messages as Parameters<typeof setMessages>[0]);
    } catch {
      setGenError("Network error — please try again");
    } finally {
      setGenLoading(false);
    }
  }

  // ── Drag-to-reorder ────────────────────────────────────
  const dragIndex    = useRef<number | null>(null);
  const [dragOver,  setDragOver]  = useState<number | null>(null);

  function handleDragStart(i: number) { dragIndex.current = i; }
  function handleDragOver(e: React.DragEvent, i: number) {
    e.preventDefault();
    if (dragIndex.current !== i) setDragOver(i);
  }
  function handleDrop(i: number) {
    const from = dragIndex.current;
    if (from === null || from === i) { setDragOver(null); return; }
    const next = [...messages];
    const [moved] = next.splice(from, 1);
    next.splice(i, 0, moved);
    setMessages(next);
    dragIndex.current = null;
    setDragOver(null);
  }
  function handleDragEnd() { dragIndex.current = null; setDragOver(null); }

  // ── Layout & Size ──────────────────────────────────────

  function ToggleGroup<T extends string>({
    value,
    options,
    onChange,
  }: {
    value: T;
    options: { value: T; label: string }[];
    onChange: (v: T) => void;
  }) {
    return (
      <div className="flex gap-1 p-0.5 bg-studio-hover rounded-lg">
        {options.map((opt) => (
          <button
            key={opt.value}
            onClick={() => onChange(opt.value)}
            className={[
              "flex-1 text-xs py-1.5 rounded-md transition-colors",
              value === opt.value
                ? "bg-studio-sidebar text-studio-text"
                : "text-studio-muted hover:text-studio-text",
            ].join(" ")}
          >
            {opt.label}
          </button>
        ))}
      </div>
    );
  }

  // ── Message item ───────────────────────────────────────

  function MessageItem({ msg, index }: { msg: ChatMessage; index: number }) {
    const isOver = dragOver === index;

    const dragHandleProps = {
      draggable: true as const,
      onDragStart: () => handleDragStart(index),
      onDragOver:  (e: React.DragEvent) => handleDragOver(e, index),
      onDrop:      () => handleDrop(index),
      onDragEnd:   handleDragEnd,
    };

    const Grip = () => (
      <GripVertical
        size={13}
        className="shrink-0 text-studio-muted cursor-grab active:cursor-grabbing"
      />
    );

    const wrapCls = [
      "bg-studio-hover rounded-lg p-3 flex flex-col gap-2 transition-opacity",
      dragIndex.current === index ? "opacity-40" : "",
      isOver ? "ring-1 ring-studio-accent" : "",
    ].join(" ");

    if (msg.type === "text") {
      return (
        <div {...dragHandleProps} className={wrapCls}>
          <div className="flex items-center justify-between gap-2">
            <Grip />
            {/* Icon toggle: User / Bot */}
            <div className="flex items-center gap-0.5 bg-studio-bg border border-studio-border rounded-lg p-0.5">
              {([
                { role: "user" as const, Icon: UserRound, label: "User" },
                { role: "bot"  as const, Icon: Bot,       label: "delight.ai" },
              ]).map(({ role, Icon, label }) => (
                <div key={role} className="relative group/tip">
                  <button
                    onClick={() => updateMessage(msg.id, { role })}
                    className={[
                      "w-7 h-7 rounded-md flex items-center justify-center transition-colors",
                      msg.role === role
                        ? "bg-studio-sidebar text-studio-text"
                        : "text-studio-muted hover:text-studio-text",
                    ].join(" ")}
                  >
                    <Icon size={14} />
                  </button>
                  <span className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 px-1.5 py-0.5 rounded bg-studio-bg border border-studio-border text-studio-text text-[10px] whitespace-nowrap opacity-0 group-hover/tip:opacity-100 transition-opacity">
                    {label}
                  </span>
                </div>
              ))}
            </div>
            <button
              onClick={() => removeMessage(msg.id)}
              className="ml-auto text-studio-muted hover:text-studio-text hover:bg-studio-border rounded-[4px] w-5 h-5 flex items-center justify-center text-xs transition-colors"
            >
              ✕
            </button>
          </div>
          <Input
            value={msg.sender}
            onChange={(e) => updateMessage(msg.id, { sender: e.target.value })}
            placeholder="Sender name"
            className="h-7 text-xs bg-studio-sidebar border-studio-border text-studio-text placeholder:text-studio-muted"
          />
          <textarea
            value={msg.text}
            onChange={(e) => updateMessage(msg.id, { text: e.target.value })}
            placeholder="Message text"
            rows={2}
            className="w-full text-xs bg-studio-sidebar border border-studio-border rounded-md px-3 py-2 text-studio-text placeholder:text-studio-muted resize-none focus:outline-none focus:ring-1 focus:ring-studio-accent"
          />
        </div>
      );
    }

    if (msg.type === "actions") {
      return (
        <div {...dragHandleProps} className={wrapCls}>
          <div className="flex items-center gap-2">
            <Grip />
            <span className="text-xs text-studio-muted flex-1">Action Buttons</span>
            <button onClick={() => removeMessage(msg.id)} className="text-studio-muted hover:text-studio-text hover:bg-studio-border rounded-[4px] w-5 h-5 flex items-center justify-center text-xs transition-colors">✕</button>
          </div>
          {msg.buttons.map((btn, i) => (
            <Input
              key={i}
              value={btn}
              onChange={(e) => {
                const buttons = [...msg.buttons];
                buttons[i] = e.target.value;
                updateMessage(msg.id, { buttons });
              }}
              placeholder={`Button ${i + 1}`}
              className="h-7 text-xs bg-studio-sidebar border-studio-border text-studio-text placeholder:text-studio-muted"
            />
          ))}
        </div>
      );
    }

    if (msg.type === "products") {
      return (
        <div {...dragHandleProps} className={wrapCls}>
          <div className="flex items-center gap-2">
            <Grip />
            <span className="text-xs text-studio-muted flex-1">Product Cards</span>
            <button onClick={() => removeMessage(msg.id)} className="text-studio-muted hover:text-studio-text hover:bg-studio-border rounded-[4px] w-5 h-5 flex items-center justify-center text-xs transition-colors">✕</button>
          </div>
          {msg.items.map((item, i) => (
            <div key={i} className="border-t border-studio-border pt-2">
              <ProductItemRow
                item={item}
                onUpdate={(patch) => {
                  const items = [...msg.items];
                  items[i] = { ...items[i], ...patch };
                  updateMessage(msg.id, { items });
                }}
              />
            </div>
          ))}
        </div>
      );
    }

    return null;
  }

  // ── Render ─────────────────────────────────────────────

  return (
    <div className="w-72 shrink-0 h-full overflow-y-auto bg-studio-sidebar border-r border-studio-border p-5">

      <Section title="Layout">
        <ToggleGroup
          value={layout}
          options={[{ value: "split", label: "Split" }, { value: "center", label: "Center" }]}
          onChange={setLayout}
        />
      </Section>

      <Section title="Export Size">
        <ToggleGroup
          value={exportSize}
          options={[{ value: "desktop", label: "Desktop 4:3" }, { value: "mobile", label: "Mobile 4:5" }]}
          onChange={setExportSize}
        />
      </Section>

      <Section title="App Name">
        <Input
          value={appName}
          onChange={(e) => setAppName(e.target.value)}
          placeholder="e.g. sendbird.ai"
          className="h-8 text-sm bg-studio-hover border-studio-border text-studio-text placeholder:text-studio-muted"
        />
      </Section>

      <Section
        title="Background"
        action={
          <button
            onClick={() => setShowBgModal(true)}
            title="Browse or upload backgrounds"
            className="w-5 h-5 rounded flex items-center justify-center text-xs font-semibold text-studio-muted hover:text-studio-text hover:bg-studio-hover border border-studio-border transition-colors leading-none"
          >
            +
          </button>
        }
      >
        <div className="grid grid-cols-3 gap-2">
          {[...BACKGROUNDS, ...customBackgrounds].map((bg) => (
            <button
              key={bg.id}
              onClick={() => setBackgroundId(bg.id)}
              className={[
                "relative rounded-lg overflow-hidden aspect-video border-2 transition-colors",
                backgroundId === bg.id
                  ? "border-studio-accent"
                  : "border-transparent hover:border-studio-muted",
              ].join(" ")}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={bg.url} alt={bg.label} className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      </Section>

      {showBgModal && (
        <BackgroundPickerModal
          currentId={backgroundId}
          customBackgrounds={customBackgrounds}
          onSelect={(bg) => setBackgroundId(bg.id)}
          onUpload={(bg) => addCustomBackground(bg)}
          onClose={() => setShowBgModal(false)}
        />
      )}

      <Section title="Scenario">
        {/* Preset list */}
        <div className="flex flex-col gap-0.5 mb-3">
          {SCENARIOS.map((s) => (
            <button
              key={s.id}
              onClick={() => applyScenario(s.id)}
              className={[
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-left w-full transition-colors",
                activeScenario === s.id
                  ? "bg-studio-hover"
                  : "hover:bg-studio-hover/60",
              ].join(" ")}
            >
              <span className={[
                "w-2 h-2 rounded-full shrink-0 transition-colors",
                activeScenario === s.id ? "bg-studio-accent" : "bg-studio-border",
              ].join(" ")} />
              <div className="min-w-0">
                <p className="text-xs font-semibold text-studio-text truncate">{s.title}</p>
                <p className="text-[11px] text-studio-muted truncate">{s.subtitle}</p>
              </div>
            </button>
          ))}
        </div>

        {/* AI generate */}
        <div className="border-t border-studio-border pt-3 flex flex-col gap-2">
          <textarea
            value={genPrompt}
            onChange={(e) => setGenPrompt(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleGenerate(); } }}
            placeholder={"Describe a scenario…\ne.g. Agent books hotel and flight at once"}
            rows={2}
            className="w-full text-xs bg-studio-sidebar border border-studio-border rounded-md px-3 py-2 text-studio-text placeholder:text-studio-muted resize-none focus:outline-none focus:ring-1 focus:ring-studio-accent"
          />
          <button
            onClick={handleGenerate}
            disabled={genLoading || !genPrompt.trim()}
            className="flex items-center justify-center gap-1.5 w-full h-8 rounded-md bg-studio-hover border border-studio-border text-studio-text text-xs font-medium hover:border-studio-muted transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Sparkles size={12} />
            {genLoading ? "Generating…" : "Generate with AI"}
          </button>
          {genError && (
            <p className="text-xs text-red-400">{genError}</p>
          )}
          {!genError && !process.env.ANTHROPIC_API_KEY && (
            <p className="text-[11px] text-studio-muted leading-relaxed">
              Add <code className="text-studio-text">ANTHROPIC_API_KEY</code> to{" "}
              <code className="text-studio-text">.env.local</code> to enable AI generation.
            </p>
          )}
        </div>
      </Section>

      <Section title="Messages">
        <div className="flex flex-col gap-2 mb-3">
          {messages.map((msg, i) => (
            <MessageItem key={msg.id} msg={msg} index={i} />
          ))}
        </div>

        <div className="flex flex-col gap-1.5">
          <Button
            variant="outline"
            size="sm"
            className="w-full text-xs border-studio-border text-studio-muted hover:text-studio-text hover:bg-studio-hover"
            onClick={() =>
              addMessage({ id: uid(), type: "text", role: "user", sender: "User", text: "" })
            }
          >
            + Add Text Message
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="w-full text-xs border-studio-border text-studio-muted hover:text-studio-text hover:bg-studio-hover"
            onClick={() =>
              addMessage({ id: uid(), type: "actions", buttons: ["Option A", "Option B"] })
            }
          >
            + Add Action Buttons
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="w-full text-xs border-studio-border text-studio-muted hover:text-studio-text hover:bg-studio-hover"
            onClick={() =>
              addMessage({
                id: uid(),
                type: "products",
                items: [
                  { img: "", name: "Product A", sub: "$0.00", cta: "View" },
                  { img: "", name: "Product B", sub: "$0.00", cta: "View" },
                ],
              })
            }
          >
            + Add Product Cards
          </Button>
        </div>
      </Section>

    </div>
  );
}
