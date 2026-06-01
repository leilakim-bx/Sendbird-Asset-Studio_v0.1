"use client";

import { useRef, useState, useEffect, useCallback, memo } from "react";
import { UserRound, Bot, Sparkles, GripVertical, Shuffle } from "lucide-react";
import { SCENARIOS } from "@/lib/scenarios";
import { useEditorStore } from "@/lib/store";
import type { ChatMessage, MessagePatch, TextBlock, ActionsBlock, ProductsBlock, ProductItem, ChecklistBlock, ChecklistItem, StatusBlock } from "@/lib/store";
import { BACKGROUNDS } from "@/lib/backgrounds";
import { BackgroundPickerModal } from "./BackgroundPickerModal";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

const uid = () => `m${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;

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
  item: ProductItem;
  onUpdate: (patch: Partial<ProductItem>) => void;
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

// ── Message item ───────────────────────────────────────────
// Defined at MODULE LEVEL — required for React.memo to work correctly.
// If defined inside FormPanel, the function reference changes every parent
// render, causing React to unmount/remount the component and lose local state.

type MessageItemProps = {
  msg: ChatMessage;
  index: number;
  isDragOver: boolean;
  dragIndexRef: React.MutableRefObject<number | null>;
  onDragStart: (i: number) => void;
  onDragOverItem: (e: React.DragEvent, i: number) => void;
  onDrop: (i: number) => void;
  onDragEnd: () => void;
  onUpdate: (id: string, patch: MessagePatch) => void;
  onRemove: (id: string) => void;
};

const MessageItem = memo(function MessageItem({
  msg,
  index,
  isDragOver,
  dragIndexRef,
  onDragStart,
  onDragOverItem,
  onDrop,
  onDragEnd,
  onUpdate,
  onRemove,
}: MessageItemProps) {
  // ── Local text state with 300 ms debounce ──────────────
  // Keeps every keystroke instant: local state updates immediately,
  // the Zustand store is only mutated 300 ms after the user stops typing.
  const storeText = msg.block?.type === "text" ? (msg.block as TextBlock).text : "";
  const [localText, setLocalText] = useState(storeText);
  const debounceRef  = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const committedRef = useRef(storeText); // last value we wrote to the store

  // Sync when the store text changes from an EXTERNAL source
  // (scenario switch, AI generate) — but NOT after our own debounce commit.
  useEffect(() => {
    if (storeText !== committedRef.current) {
      setLocalText(storeText);
      committedRef.current = storeText;
    }
  }, [storeText]);

  // Flush & clean up on unmount
  useEffect(() => () => clearTimeout(debounceRef.current), []);

  function handleTextChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    const v = e.target.value;
    setLocalText(v);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      committedRef.current = v;
      onUpdate(msg.id, { block: { type: "text", text: v } });
    }, 300);
  }

  // ── Shared drag / style ────────────────────────────────
  const wrapCls = [
    "bg-studio-hover rounded-lg p-3 flex flex-col gap-2 transition-opacity",
    dragIndexRef.current === index ? "opacity-40" : "",
    isDragOver ? "ring-1 ring-studio-accent" : "",
  ].join(" ");

  const dragProps = {
    draggable: true as const,
    onDragStart: () => onDragStart(index),
    onDragOver:  (e: React.DragEvent) => onDragOverItem(e, index),
    onDrop:      () => onDrop(index),
    onDragEnd,
  };

  const Grip = () => (
    <GripVertical size={13} className="shrink-0 text-studio-muted cursor-grab active:cursor-grabbing" />
  );

  // ── Text message ───────────────────────────────────────
  if (msg.block.type === "text") {
    return (
      <div {...dragProps} className={wrapCls}>
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
                  onClick={() => onUpdate(msg.id, { role })}
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
            onClick={() => onRemove(msg.id)}
            className="ml-auto text-studio-muted hover:text-studio-text hover:bg-studio-border rounded-[4px] w-5 h-5 flex items-center justify-center text-xs transition-colors"
          >
            ✕
          </button>
        </div>
        <textarea
          value={localText}
          onChange={handleTextChange}
          placeholder="Message text"
          rows={2}
          className="w-full text-xs bg-studio-sidebar border border-studio-border rounded-md px-3 py-2 text-studio-text placeholder:text-studio-muted resize-none focus:outline-none focus:ring-1 focus:ring-studio-accent"
        />
      </div>
    );
  }

  // ── Action buttons ─────────────────────────────────────
  if (msg.block.type === "actions") {
    const actionsBlock = msg.block as ActionsBlock;
    return (
      <div {...dragProps} className={wrapCls}>
        <div className="flex items-center gap-2">
          <Grip />
          <span className="text-xs text-studio-muted flex-1">Action Buttons</span>
          <button onClick={() => onRemove(msg.id)} className="text-studio-muted hover:text-studio-text hover:bg-studio-border rounded-[4px] w-5 h-5 flex items-center justify-center text-xs transition-colors">✕</button>
        </div>
        {actionsBlock.buttons.map((btn, i) => (
          <Input
            key={i}
            value={btn}
            onChange={(e) => {
              const buttons = [...actionsBlock.buttons];
              buttons[i] = e.target.value;
              onUpdate(msg.id, { block: { type: "actions", buttons } });
            }}
            placeholder={`Button ${i + 1}`}
            className="h-7 text-xs bg-studio-sidebar border-studio-border text-studio-text placeholder:text-studio-muted"
          />
        ))}
      </div>
    );
  }

  // ── Product cards ──────────────────────────────────────
  if (msg.block.type === "products") {
    const productsBlock = msg.block as ProductsBlock;
    return (
      <div {...dragProps} className={wrapCls}>
        <div className="flex items-center gap-2">
          <Grip />
          <span className="text-xs text-studio-muted flex-1">Product Cards</span>
          <button onClick={() => onRemove(msg.id)} className="text-studio-muted hover:text-studio-text hover:bg-studio-border rounded-[4px] w-5 h-5 flex items-center justify-center text-xs transition-colors">✕</button>
        </div>
        {productsBlock.items.map((item, i) => (
          <div key={i} className="border-t border-studio-border pt-2">
            <ProductItemRow
              item={item}
              onUpdate={(patch) => {
                const items = [...productsBlock.items];
                items[i] = { ...items[i], ...patch };
                onUpdate(msg.id, { block: { type: "products", items } });
              }}
            />
          </div>
        ))}
      </div>
    );
  }

  // ── Checklist ──────────────────────────────────────────
  if (msg.block.type === "checklist") {
    const checklistBlock = msg.block as ChecklistBlock;
    const CYCLE: Record<ChecklistItem["status"], ChecklistItem["status"]> = {
      pending: "in-progress",
      "in-progress": "done",
      done: "pending",
    };
    const STATUS_ICON: Record<ChecklistItem["status"], string> = {
      pending: "○",
      "in-progress": "◑",
      done: "●",
    };
    const STATUS_COLOR: Record<ChecklistItem["status"], string> = {
      pending: "text-studio-muted",
      "in-progress": "text-amber-400",
      done: "text-studio-text",
    };

    return (
      <div {...dragProps} className={wrapCls}>
        <div className="flex items-center gap-2">
          <Grip />
          <span className="text-xs text-studio-muted flex-1">Checklist</span>
          <button onClick={() => onRemove(msg.id)} className="text-studio-muted hover:text-studio-text hover:bg-studio-border rounded-[4px] w-5 h-5 flex items-center justify-center text-xs transition-colors">✕</button>
        </div>
        <div className="flex flex-col gap-1.5">
          {checklistBlock.items.map((item, i) => (
            <div key={item.id} className="flex items-center gap-1.5">
              {/* Status toggle */}
              <button
                title={item.status}
                onClick={() => {
                  const items = checklistBlock.items.map((it, idx) =>
                    idx === i ? { ...it, status: CYCLE[it.status] } : it
                  );
                  onUpdate(msg.id, { block: { type: "checklist", items } });
                }}
                className={`shrink-0 w-5 h-5 flex items-center justify-center text-sm leading-none transition-colors ${STATUS_COLOR[item.status]}`}
              >
                {STATUS_ICON[item.status]}
              </button>
              {/* Label */}
              <Input
                value={item.label}
                onChange={(e) => {
                  const items = checklistBlock.items.map((it, idx) =>
                    idx === i ? { ...it, label: e.target.value } : it
                  );
                  onUpdate(msg.id, { block: { type: "checklist", items } });
                }}
                placeholder="Item label"
                className="flex-1 h-7 text-xs bg-studio-sidebar border-studio-border text-studio-text placeholder:text-studio-muted"
              />
              {/* Remove item */}
              <button
                onClick={() => {
                  const items = checklistBlock.items.filter((_, idx) => idx !== i);
                  onUpdate(msg.id, { block: { type: "checklist", items } });
                }}
                className="shrink-0 text-studio-muted hover:text-studio-text hover:bg-studio-border rounded-[4px] w-5 h-5 flex items-center justify-center text-xs transition-colors"
              >✕</button>
            </div>
          ))}
        </div>
        {/* Add item */}
        <button
          onClick={() => {
            const items = [
              ...checklistBlock.items,
              { id: uid(), label: "", status: "pending" as const },
            ];
            onUpdate(msg.id, { block: { type: "checklist", items } });
          }}
          className="text-[11px] text-studio-muted hover:text-studio-text transition-colors text-left"
        >
          + Add item
        </button>
      </div>
    );
  }

  // ── Status pill ────────────────────────────────────────
  if (msg.block.type === "status") {
    const statusBlock = msg.block as StatusBlock;
    const VARIANTS: StatusBlock["variant"][] = ["success", "warning"];
    const VARIANT_LABEL: Record<StatusBlock["variant"], string> = {
      success: "✓ Success",
      warning: "! Warning",
    };

    return (
      <div {...dragProps} className={wrapCls}>
        <div className="flex items-center gap-2">
          <Grip />
          <span className="text-xs text-studio-muted flex-1">Status</span>
          <button onClick={() => onRemove(msg.id)} className="text-studio-muted hover:text-studio-text hover:bg-studio-border rounded-[4px] w-5 h-5 flex items-center justify-center text-xs transition-colors">✕</button>
        </div>
        {/* Label input */}
        <Input
          value={statusBlock.label}
          onChange={(e) => onUpdate(msg.id, { block: { ...statusBlock, label: e.target.value } })}
          placeholder="Status label"
          className="h-7 text-xs bg-studio-sidebar border-studio-border text-studio-text placeholder:text-studio-muted"
        />
        {/* Variant selector */}
        <div className="flex gap-1">
          {VARIANTS.map((v) => (
            <button
              key={v}
              onClick={() => onUpdate(msg.id, { block: { ...statusBlock, variant: v } })}
              className={[
                "flex-1 h-6 rounded-md text-[10px] font-medium transition-colors",
                statusBlock.variant === v
                  ? "bg-studio-accent text-studio-accent-fg"
                  : "bg-studio-hover text-studio-muted hover:text-studio-text",
              ].join(" ")}
            >
              {VARIANT_LABEL[v]}
            </button>
          ))}
        </div>
      </div>
    );
  }

  return null;
});

// ── Main ──────────────────────────────────────────────────

export function FormPanel({ isOverflowing }: { isOverflowing: boolean }) {
  const {
    layout, setLayout,
    exportSize, setExportSize,
    backgroundId, setBackgroundId,
    appName, setAppName,
    messages, addMessage, updateMessage, removeMessage, setMessages,
    customBackgrounds, addCustomBackground,
    userName, userAvatarUrl, setUserName, shuffleUserProfile,
  } = useEditorStore();

  const [showBgModal, setShowBgModal] = useState(false);

  // ── Scenario ───────────────────────────────────────────
  // Default: first scenario pre-selected (matches EditorShell's seed on fresh load)
  const [activeScenario,    setActiveScenario]    = useState<string | null>(SCENARIOS[0].id);
  const [pendingScenarioId, setPendingScenarioId] = useState<string | null>(null);
  const [genPrompt,  setGenPrompt]  = useState("");
  const [genLoading, setGenLoading] = useState(false);
  const [genError,   setGenError]   = useState<string | null>(null);

  function applyScenario(id: string) {
    const s = SCENARIOS.find((s) => s.id === id);
    if (!s) return;
    setActiveScenario(id);
    setMessages(s.messages);
  }

  /** 드롭다운 변경 시 — 메시지가 있으면 confirm, 없으면 즉시 적용 */
  function handleScenarioChange(id: string) {
    if (messages.length > 0) {
      setPendingScenarioId(id);
    } else {
      applyScenario(id);
    }
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
  const dragIndex = useRef<number | null>(null);
  const [dragOver, setDragOver] = useState<number | null>(null);

  // Keep a stable ref to messages so handleDrop doesn't need it as a dep.
  // This avoids recreating the callback whenever messages change.
  const messagesRef = useRef(messages);
  useEffect(() => { messagesRef.current = messages; }, [messages]);

  const handleDragStart = useCallback((i: number) => {
    dragIndex.current = i;
  }, []);

  const handleDragOverItem = useCallback((e: React.DragEvent, i: number) => {
    e.preventDefault();
    if (dragIndex.current !== i) setDragOver(i);
  }, []);

  const handleDrop = useCallback((i: number) => {
    const from = dragIndex.current;
    if (from === null || from === i) { setDragOver(null); return; }
    const next = [...messagesRef.current];
    const [moved] = next.splice(from, 1);
    next.splice(i, 0, moved);
    setMessages(next);
    dragIndex.current = null;
    setDragOver(null);
  }, [setMessages]);

  const handleDragEnd = useCallback(() => {
    dragIndex.current = null;
    setDragOver(null);
  }, []);

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
        {/* Dropdown */}
        <Select
          value={activeScenario ?? ""}
          onValueChange={(val) => handleScenarioChange(String(val))}
        >
          <SelectTrigger className="w-full h-8 border-studio-border bg-studio-hover text-studio-text text-xs rounded-lg">
            <span className="flex-1 text-left truncate">
              {SCENARIOS.find((s) => s.id === activeScenario)?.name ?? "Select a scenario"}
            </span>
          </SelectTrigger>
          <SelectContent>
            {SCENARIOS.map((s) => (
              <SelectItem key={s.id} value={s.id} className="text-xs">
                {s.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Tagline */}
        {activeScenario && (() => {
          const s = SCENARIOS.find((s) => s.id === activeScenario);
          return s ? (
            <p className="text-[11px] text-studio-muted mt-1.5 leading-relaxed">
              &ldquo;{s.tagline}&rdquo;
            </p>
          ) : null;
        })()}

        {/* ─── or ─── */}
        <div className="flex items-center gap-2 my-3">
          <div className="flex-1 h-px bg-studio-border" />
          <span className="text-[10px] text-studio-muted uppercase tracking-widest">or</span>
          <div className="flex-1 h-px bg-studio-border" />
        </div>

        {/* AI generate */}
        <div className="flex flex-col gap-2">
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
        </div>
      </Section>

      <Section title="User Profile">
        <div className="flex items-center gap-2">
          {/* Avatar preview */}
          {userAvatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={userAvatarUrl}
              alt={userName}
              className="w-8 h-8 rounded-full object-cover shrink-0 border border-studio-border"
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-studio-hover border border-studio-border shrink-0" />
          )}
          {/* Name input */}
          <Input
            value={userName}
            onChange={(e) => setUserName(e.target.value)}
            placeholder="User name"
            className="h-8 text-sm flex-1 bg-studio-hover border-studio-border text-studio-text placeholder:text-studio-muted"
          />
          {/* Shuffle button */}
          <div className="relative group/tip shrink-0">
            <button
              onClick={shuffleUserProfile}
              className="w-8 h-8 flex items-center justify-center rounded-md border border-studio-border text-studio-muted hover:text-studio-text hover:bg-studio-hover transition-colors"
            >
              <Shuffle size={13} />
            </button>
            <span className="pointer-events-none absolute bottom-full right-0 mb-1.5 px-1.5 py-0.5 rounded bg-studio-bg border border-studio-border text-studio-text text-[10px] whitespace-nowrap opacity-0 group-hover/tip:opacity-100 transition-opacity">
              Shuffle name &amp; avatar
            </span>
          </div>
        </div>
      </Section>

      <Section title="Messages">
        <div className="flex flex-col gap-2 mb-3">
          {messages.map((msg, i) => (
            <MessageItem
              key={msg.id}
              msg={msg}
              index={i}
              isDragOver={dragOver === i}
              dragIndexRef={dragIndex}
              onDragStart={handleDragStart}
              onDragOverItem={handleDragOverItem}
              onDrop={handleDrop}
              onDragEnd={handleDragEnd}
              onUpdate={updateMessage}
              onRemove={removeMessage}
            />
          ))}
        </div>

        {isOverflowing && (
          <p className="flex items-center gap-1.5 text-xs text-red-500 mb-1">
            <span className="shrink-0">⚠</span>
            Frame is full — remove a message to add more.
          </p>
        )}

        <div className="flex flex-col gap-1.5">
          <Button
            variant="outline"
            size="sm"
            disabled={isOverflowing}
            className="w-full text-xs border-studio-border text-studio-muted hover:text-studio-text hover:bg-studio-hover disabled:opacity-40 disabled:cursor-not-allowed"
            onClick={() =>
              addMessage({ id: uid(), role: "user", sender: userName || "User", block: { type: "text", text: "" } })
            }
          >
            + Add Text Message
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={isOverflowing}
            className="w-full text-xs border-studio-border text-studio-muted hover:text-studio-text hover:bg-studio-hover disabled:opacity-40 disabled:cursor-not-allowed"
            onClick={() =>
              addMessage({ id: uid(), role: "bot", sender: "bot", block: { type: "actions", buttons: ["Option A", "Option B"] } })
            }
          >
            + Add Action Buttons
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={isOverflowing}
            className="w-full text-xs border-studio-border text-studio-muted hover:text-studio-text hover:bg-studio-hover disabled:opacity-40 disabled:cursor-not-allowed"
            onClick={() =>
              addMessage({
                id: uid(),
                role: "bot",
                sender: "bot",
                block: {
                  type: "products",
                  items: [
                    { img: "", name: "Product A", sub: "$0.00", cta: "View" },
                    { img: "", name: "Product B", sub: "$0.00", cta: "View" },
                  ],
                },
              })
            }
          >
            + Add Product Cards
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={isOverflowing}
            className="w-full text-xs border-studio-border text-studio-muted hover:text-studio-text hover:bg-studio-hover disabled:opacity-40 disabled:cursor-not-allowed"
            onClick={() =>
              addMessage({
                id: uid(),
                role: "bot",
                sender: "bot",
                block: {
                  type: "checklist",
                  items: [
                    { id: uid(), label: "Task one", status: "done" },
                    { id: uid(), label: "Task two", status: "in-progress" },
                    { id: uid(), label: "Task three", status: "pending" },
                  ],
                },
              })
            }
          >
            + Add Checklist
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={isOverflowing}
            className="w-full text-xs border-studio-border text-studio-muted hover:text-studio-text hover:bg-studio-hover disabled:opacity-40 disabled:cursor-not-allowed"
            onClick={() =>
              addMessage({
                id: uid(),
                role: "bot",
                sender: "bot",
                block: { type: "status", label: "Status label", variant: "success" },
              })
            }
          >
            + Add Status
          </Button>
        </div>
      </Section>

      {/* Bottom hint */}
      <p className="text-[11px] text-studio-muted leading-relaxed pb-2">
        Messages that exceed the frame height won&apos;t be added to the preview.
      </p>

      {/* Scenario switch confirm modal */}
      {pendingScenarioId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-studio-sidebar border border-studio-border rounded-2xl p-5 w-64 shadow-xl flex flex-col gap-3">
            <div>
              <p className="text-sm font-semibold text-studio-text mb-1">Replace current messages?</p>
              <p className="text-xs text-studio-muted">
                Switching to &ldquo;{SCENARIOS.find((s) => s.id === pendingScenarioId)?.name}&rdquo; will overwrite your current messages.
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setPendingScenarioId(null)}
                className="flex-1 h-8 rounded-lg border border-studio-border text-studio-muted text-xs hover:text-studio-text hover:bg-studio-hover transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  applyScenario(pendingScenarioId);
                  setPendingScenarioId(null);
                }}
                className="flex-1 h-8 rounded-lg bg-studio-accent text-studio-accent-fg text-xs font-semibold hover:opacity-90 transition-opacity"
              >
                Replace
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
