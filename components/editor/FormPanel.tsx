"use client";

import { useRef, useState, useEffect, useCallback, memo } from "react";
import { UserRound, Bot, Sparkles, GripVertical, Search, RotateCcw, ChevronDown, Copy, Trash2, MessageSquare, ShoppingBag, MousePointerClick, ListChecks, Tag, AudioLines, Circle } from "lucide-react";
import { SCENARIOS } from "@/lib/scenarios";
import { useEditorStore } from "@/lib/store";
import type { ChatMessage, MessagePatch, TextBlock, ActionsBlock, ProductsBlock, ProductItem, ChecklistBlock, ChecklistItem, StatusBlock, VoiceBlock } from "@/lib/store";
import { BACKGROUNDS } from "@/lib/backgrounds";
import { BackgroundPickerModal } from "./BackgroundPickerModal";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Menu } from "@base-ui/react/menu";

const uid = () => `m${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;

const SCENARIO_PLACEHOLDERS = [
  "e.g. AI suggests 3 hotels, user picks one, agent confirms booking instantly",
  "e.g. Agent checks flight prices and books the cheapest option",
  "e.g. User asks for today's weather, AI replies with outfit suggestion",
  "e.g. AI greets new user, asks 3 questions, then shows a personalized plan",
  "e.g. Support agent detects an issue and proactively offers a refund",
  "e.g. AI recommends a product, user taps to buy in one step",
];

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

const SectionLabel = ({ children, required }: { children: React.ReactNode; required?: boolean }) => (
  <p className="text-[10px] font-semibold text-studio-muted uppercase tracking-wider mb-1">
    {children}{required && <span className="text-red-400 ml-0.5">*</span>}
  </p>
);

type ProductItemRowProps = {
  item: ProductItem;
  index: number;
  onUpdate: (patch: Partial<ProductItem>) => void;
  onRemove: () => void;
  onDuplicate: () => void;
};

function ProductItemRow({ item, index, onUpdate, onRemove, onDuplicate }: ProductItemRowProps) {
  const [loading, setLoading] = useState(false);
  const [imageQuery, setImageQuery] = useState(item.imageQuery || item.name);

  async function applyImage() {
    const q = imageQuery.trim();
    if (!q) return;
    onUpdate({ imageQuery: q });
    setLoading(true);
    try {
      const img = await fetchProductImage(q);
      if (img) onUpdate({ img });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-studio-bg border border-studio-border rounded-lg overflow-hidden">
      {/* Card header */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-studio-border">
        <GripVertical size={13} className="shrink-0 text-studio-muted cursor-grab" />
        <span className="text-xs font-medium text-studio-text flex-1">Product {index + 1}</span>
        <button onClick={onDuplicate} title="Duplicate" className="w-6 h-6 flex items-center justify-center rounded text-studio-muted hover:text-studio-text hover:bg-studio-hover transition-colors">
          <Copy size={12} />
        </button>
        <button onClick={onRemove} title="Delete" className="w-6 h-6 flex items-center justify-center rounded text-studio-muted hover:text-red-400 hover:bg-studio-hover transition-colors">
          <Trash2 size={12} />
        </button>
      </div>

      <div className="flex flex-col gap-3 p-3">
        {/* IMAGE section */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <SectionLabel>Image</SectionLabel>
            <button onClick={applyImage} disabled={loading} title="Try another image"
              className="flex items-center justify-center w-5 h-5 rounded text-studio-muted hover:text-studio-text hover:bg-studio-hover transition-colors disabled:opacity-50">
              <RotateCcw size={11} />
            </button>
          </div>
          <div className="flex items-start gap-3">
            {/* Thumbnail */}
            {item.img ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={item.img} alt={item.name}
                className="w-16 h-16 rounded-md object-cover border border-studio-border shrink-0" />
            ) : (
              <div className="w-16 h-16 rounded-md bg-studio-hover border border-studio-border flex items-center justify-center shrink-0">
                <Search size={16} className="text-studio-muted opacity-40" />
              </div>
            )}
            {/* Query + remove */}
            <div className="flex flex-col gap-1.5 flex-1 min-w-0">
              <div className="relative">
                <Search size={11} className="absolute left-2 top-1/2 -translate-y-1/2 text-studio-muted pointer-events-none" />
                <Input
                  value={imageQuery}
                  onChange={(e) => setImageQuery(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") applyImage(); }}
                  placeholder="e.g. white sneakers"
                  className="h-7 text-xs pl-6 bg-studio-sidebar border-studio-border text-studio-text placeholder:text-studio-muted"
                />
              </div>
              <button
                onClick={applyImage}
                disabled={loading}
                className="w-full h-7 rounded-md bg-studio-muted/20 text-studio-text hover:bg-studio-muted/30 transition-colors text-[11px] font-semibold disabled:opacity-50"
              >
                {loading ? "Loading…" : "Apply Image"}
              </button>
              {item.img && (
                <button onClick={() => onUpdate({ img: "" })}
                  className="text-[11px] text-studio-muted hover:text-red-400 transition-colors text-left">
                  Remove
                </button>
              )}
            </div>
          </div>
        </div>

        {/* TITLE section */}
        <div>
          <SectionLabel>Title</SectionLabel>
          <Input
            value={item.name}
            onChange={(e) => onUpdate({ name: e.target.value })}
            placeholder="Product name"
            className="h-7 text-xs bg-studio-sidebar border-studio-border text-studio-text placeholder:text-studio-muted"
          />
        </div>

        {/* PRICE + BUTTON LABEL side by side */}
        <div className="grid grid-cols-2 gap-2">
          <div>
            <SectionLabel>Price</SectionLabel>
            <Input
              value={item.sub}
              onChange={(e) => onUpdate({ sub: e.target.value })}
              placeholder="$0.00"
              className="h-7 text-xs bg-studio-sidebar border-studio-border text-studio-text placeholder:text-studio-muted"
            />
          </div>
          <div>
            <SectionLabel>Button label</SectionLabel>
            <Input
              value={item.cta}
              onChange={(e) => onUpdate({ cta: e.target.value })}
              placeholder="Buy now"
              maxLength={15}
              className="h-7 text-xs bg-studio-sidebar border-studio-border text-studio-text placeholder:text-studio-muted"
            />
          </div>
        </div>
      </div>
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
  const canvasIsFull = useEditorStore((s) => s.canvasIsFull);
  // ── Local text state with 300 ms debounce ──────────────
  // Keeps every keystroke instant: local state updates immediately,
  // the Zustand store is only mutated 300 ms after the user stops typing.
  const storeText = msg.block?.type === "text" ? (msg.block as TextBlock).text : "";
  const [localText, setLocalText] = useState(storeText);
  // 버블 너비(~264px)에서 15px 폰트 기준 약 33자/줄로 추정
  const estimatedLines = localText.split("\n").reduce((acc, line) => acc + Math.max(1, Math.ceil((line.length || 1) / 33)), 0);
  const isOverMaxLines = estimatedLines > 7;
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
        <div className="flex items-center gap-1.5">
          <Grip />
          <span className="text-xs text-studio-muted">Text</span>
          {/* Sender toggle: User / Bot */}
          {([
            { role: "user" as const, Icon: UserRound, label: "User" },
            { role: "bot"  as const, Icon: Bot,       label: "delight.ai" },
          ]).map(({ role, Icon, label }) => (
            <div key={role} className="relative group/tip">
              <button
                onClick={() => onUpdate(msg.id, { role })}
                className={[
                  "w-6 h-6 rounded-md flex items-center justify-center transition-colors",
                  msg.role === role
                    ? "bg-studio-muted/20 text-studio-text hover:bg-studio-muted/30"
                    : "text-studio-muted hover:text-studio-text",
                ].join(" ")}
              >
                <Icon size={13} />
              </button>
              <span className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 px-1.5 py-0.5 rounded bg-studio-bg border border-studio-border text-studio-text text-[10px] whitespace-nowrap opacity-0 group-hover/tip:opacity-100 transition-opacity">
                {label}
              </span>
            </div>
          ))}
          <div className="flex-1" />
          <button
            onClick={() => onRemove(msg.id)}
            className="text-studio-muted hover:text-studio-text hover:bg-studio-border rounded-[4px] w-5 h-5 flex items-center justify-center text-xs transition-colors"
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
        {isOverMaxLines && (
          <p className="text-[10px] text-red-400 leading-none">
            Text exceeds 7-line limit and will be clipped
          </p>
        )}
      </div>
    );
  }

  // ── Action buttons ─────────────────────────────────────
  if (msg.block.type === "actions") {
    const actionsBlock = msg.block as ActionsBlock;
    return (
      <div {...dragProps} className={wrapCls}>
        <div className="flex items-center gap-1.5">
          <Grip />
          <span className="text-xs text-studio-muted">Action Buttons</span>
          <Bot size={13} className="shrink-0 text-studio-muted" />
          <div className="flex-1" />
          <button onClick={() => onRemove(msg.id)} className="text-studio-muted hover:text-studio-text hover:bg-studio-border rounded-[4px] w-5 h-5 flex items-center justify-center text-xs transition-colors">✕</button>
        </div>
        <textarea
          value={actionsBlock.text ?? ""}
          onChange={(e) => onUpdate(msg.id, { block: { ...actionsBlock, text: e.target.value } })}
          placeholder="Message text"
          rows={2}
          className="w-full text-xs bg-studio-sidebar border border-studio-border rounded-md px-3 py-2 text-studio-text placeholder:text-studio-muted resize-none focus:outline-none focus:ring-1 focus:ring-studio-accent"
        />
        {actionsBlock.buttons.map((btn, i) => (
          <Input
            key={i}
            value={btn}
            onChange={(e) => {
              const buttons = [...actionsBlock.buttons];
              buttons[i] = e.target.value;
              onUpdate(msg.id, { block: { ...actionsBlock, buttons } });
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
    const count = productsBlock.items.length;
    return (
      <div {...dragProps} className={wrapCls}>
        {/* Block header */}
        <div className="flex items-center gap-1.5">
          <Grip />
          <span className="text-xs text-studio-muted">Product Cards</span>
          <Bot size={13} className="shrink-0 text-studio-muted" />
          <div className="flex-1" />
          {/* Count badge */}
          <span className="text-[10px] font-semibold text-studio-muted bg-studio-hover border border-studio-border rounded px-1.5 py-0.5 leading-none">
            {count}
          </span>
          <button onClick={() => onRemove(msg.id)} className="text-studio-muted hover:text-studio-text hover:bg-studio-border rounded-[4px] w-5 h-5 flex items-center justify-center text-xs transition-colors">✕</button>
        </div>

        {/* Per-card rows */}
        <div className="flex flex-col gap-3 mt-2">
          {productsBlock.items.map((item, i) => (
            <ProductItemRow
              key={item.imageQuery ? `${item.imageQuery}-${i}` : i}
              item={item}
              index={i}
              onUpdate={(patch) => {
                const items = [...productsBlock.items];
                items[i] = { ...items[i], ...patch };
                onUpdate(msg.id, { block: { type: "products", items } });
              }}
              onRemove={() => {
                const items = productsBlock.items.filter((_, idx) => idx !== i);
                onUpdate(msg.id, { block: { type: "products", items } });
              }}
              onDuplicate={() => {
                const items = [...productsBlock.items];
                items.splice(i + 1, 0, { ...item });
                onUpdate(msg.id, { block: { type: "products", items } });
              }}
            />
          ))}
        </div>

        {/* Add product button — 3개 이상이면 비활성화 (캐러셀 max) */}
        <button
          disabled={count >= 3 || canvasIsFull}
          title={count >= 3 ? "Max 3 cards supported" : undefined}
          onClick={() => {
            const items = [
              ...productsBlock.items,
              { img: "", name: "Product", sub: "$0.00", cta: "Buy now", imageQuery: "" },
            ];
            onUpdate(msg.id, { block: { type: "products", items } });
          }}
          className="mt-2 w-full h-7 rounded-md border border-dashed border-studio-border text-studio-muted hover:text-studio-text hover:border-studio-muted text-xs transition-colors disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:text-studio-muted disabled:hover:border-studio-border"
        >
          + Add product
        </button>
        {canvasIsFull && count < 3 && (
          <p className="text-[10px] text-red-400 leading-none flex items-center gap-1">
            ⚠️ Max items — Remove an item to add more
          </p>
        )}
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
        <div className="flex items-center gap-1.5">
          <Grip />
          <span className="text-xs text-studio-muted">Checklist</span>
          <Bot size={13} className="shrink-0 text-studio-muted" />
          <div className="flex-1" />
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
          disabled={canvasIsFull}
          onClick={() => {
            const items = [
              ...checklistBlock.items,
              { id: uid(), label: "", status: "pending" as const },
            ];
            onUpdate(msg.id, { block: { type: "checklist", items } });
          }}
          className="text-[11px] text-studio-muted hover:text-studio-text transition-colors text-left disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:text-studio-muted"
        >
          + Add item
        </button>
        {canvasIsFull && (
          <p className="text-[10px] text-red-400 leading-none flex items-center gap-1">
            ⚠️ Max items — Remove an item to add more
          </p>
        )}
      </div>
    );
  }

  // ── Status pill ────────────────────────────────────────
  if (msg.block.type === "status") {
    const statusBlock = msg.block as StatusBlock;
    const VARIANTS: StatusBlock["variant"][] = ["success", "warning"];
    const VARIANT_LABEL: Record<StatusBlock["variant"], string> = {
      success: "Success",
      warning: "Warning",
    };

    return (
      <div {...dragProps} className={wrapCls}>
        <div className="flex items-center gap-1.5">
          <Grip />
          <span className="text-xs text-studio-muted">Status</span>
          <Bot size={13} className="shrink-0 text-studio-muted" />
          <div className="flex-1" />
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
                  ? "bg-studio-muted/20 text-studio-text"
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

  // ── Voice card ─────────────────────────────────────────
  if (msg.block.type === "voice") {
    const voiceBlock = msg.block as VoiceBlock;
    const STYLE_OPTIONS: { style: VoiceBlock["style"]; Icon: typeof Circle; label: string }[] = [
      { style: "quote",  Icon: Circle,     label: "Spotlight" },
      { style: "player", Icon: AudioLines, label: "Player bar" },
    ];
    const patch = (p: Partial<VoiceBlock>) => onUpdate(msg.id, { block: { ...voiceBlock, ...p } });

    return (
      <div {...dragProps} className={wrapCls}>
        <div className="flex items-center gap-1.5">
          <Grip />
          <span className="text-xs text-studio-muted">Voice</span>
          <Bot size={13} className="shrink-0 text-studio-muted" />
          {/* Style toggle */}
          {STYLE_OPTIONS.map(({ style, Icon, label }) => (
            <div key={style} className="relative group/tip">
              <button
                onClick={() => patch({ style })}
                className={[
                  "w-6 h-6 rounded-md flex items-center justify-center transition-colors",
                  voiceBlock.style === style
                    ? "bg-studio-muted/20 text-studio-text hover:bg-studio-muted/30"
                    : "text-studio-muted hover:text-studio-text",
                ].join(" ")}
              >
                <Icon size={13} />
              </button>
              <span className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 px-1.5 py-0.5 rounded bg-studio-bg border border-studio-border text-studio-text text-[10px] whitespace-nowrap opacity-0 group-hover/tip:opacity-100 transition-opacity">
                {label}
              </span>
            </div>
          ))}
          <div className="flex-1" />
          <button onClick={() => onRemove(msg.id)} className="text-studio-muted hover:text-studio-text hover:bg-studio-border rounded-[4px] w-5 h-5 flex items-center justify-center text-xs transition-colors">✕</button>
        </div>

        {/* Transcript */}
        <textarea
          value={voiceBlock.transcript}
          onChange={(e) => patch({ transcript: e.target.value })}
          placeholder="Spoken line / transcript"
          rows={3}
          className="w-full text-xs bg-studio-sidebar border border-studio-border rounded-md px-3 py-2 text-studio-text placeholder:text-studio-muted resize-none focus:outline-none focus:ring-1 focus:ring-studio-accent"
        />

        {/* Style-specific field */}
        {voiceBlock.style === "quote" ? (
          <div>
            <SectionLabel>Caption</SectionLabel>
            <Input
              value={voiceBlock.caption ?? ""}
              onChange={(e) => patch({ caption: e.target.value })}
              placeholder="Order notification"
              maxLength={43}
              className="h-7 text-xs bg-studio-sidebar border-studio-border text-studio-text placeholder:text-studio-muted"
            />
          </div>
        ) : (
          <div>
            <SectionLabel>Eyebrow</SectionLabel>
            <Input
              value={voiceBlock.eyebrow ?? ""}
              onChange={(e) => patch({ eyebrow: e.target.value })}
              placeholder="Voice AI agents:"
              className="h-7 text-xs bg-studio-sidebar border-studio-border text-studio-text placeholder:text-studio-muted"
            />
          </div>
        )}
      </div>
    );
  }

  return null;
});

// ── Main ──────────────────────────────────────────────────

export function FormPanel({ isOverflowing }: { isOverflowing: boolean }) {
  const [avatarLoadError, setAvatarLoadError] = useState(false);
  const {
    layout, setLayout,
    exportSize, setExportSize,
    backgroundId, setBackgroundId,
    appName, setAppName,
    messages, addMessage, updateMessage, removeMessage, setMessages,
    customBackgrounds, addCustomBackground,
    userName, userAvatarUrl, setUserName, shuffleUserProfile,
    setActiveScenarioId,
    canvasIsFull,
  } = useEditorStore();

  const [showBgModal, setShowBgModal] = useState(false);

  // ── Scenario ───────────────────────────────────────────
  // Default: first scenario pre-selected (matches EditorShell's seed on fresh load)
  const [activeScenario,    setActiveScenario]    = useState<string | null>(SCENARIOS[0].id);
  const [pendingScenarioId, setPendingScenarioId] = useState<string | null>(null);
  const [genPrompt,  setGenPrompt]  = useState("");
  const [genLoading, setGenLoading] = useState(false);
  const [genError,   setGenError]   = useState<string | null>(null);

  // ── Rotating placeholder ───────────────────────────────
  const [phIdx,     setPhIdx]     = useState(0);
  const [phOpacity, setPhOpacity] = useState(1);
  const [phFocused, setPhFocused] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setPhOpacity(0);
      setTimeout(() => {
        setPhIdx((i) => (i + 1) % SCENARIO_PLACEHOLDERS.length);
        setPhOpacity(1);
      }, 300);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  /** product cards 중 imageQuery 있고 img 없는 항목 자동 fetch */
  function autoFetchImages(msgs: ChatMessage[]) {
    msgs.forEach((msg) => {
      if (msg.block.type !== "products") return;
      const items = (msg.block as ProductsBlock).items;
      items.forEach((item, i) => {
        if (!item.imageQuery || item.img) return;
        fetchProductImage(item.imageQuery).then((img) => {
          if (!img) return;
          // fetch 완료 시 최신 상태 기준으로 업데이트
          const state = useEditorStore.getState();
          const cur = state.messages.find((m) => m.id === msg.id);
          if (!cur || cur.block.type !== "products") return;
          const curItems = (cur.block as ProductsBlock).items;
          state.updateMessage(msg.id, {
            block: { type: "products", items: curItems.map((it, idx) => idx === i ? { ...it, img } : it) },
          });
        });
      });
    });
  }

  function applyScenario(id: string) {
    const s = SCENARIOS.find((s) => s.id === id);
    if (!s) return;
    setActiveScenario(id);
    setActiveScenarioId(id);
    setMessages(s.messages);
    autoFetchImages(s.messages);
  }

  // 초기 로드 시 기본 시나리오(Memory Recall) 이미지 자동 fetch
  const didInitFetch = useRef(false);
  useEffect(() => {
    if (didInitFetch.current) return;
    didInitFetch.current = true;
    autoFetchImages(messages);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
    setActiveScenarioId(null);
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
    options: { value: T; label: string; tooltip?: string }[];
    onChange: (v: T) => void;
  }) {
    return (
      <div className="flex gap-1 p-0.5 bg-studio-hover rounded-lg">
        {options.map((opt, i) => {
          const isFirst = i === 0;
          const isLast  = i === options.length - 1;
          return (
            <div key={opt.value} className="relative flex-1 group/tip">
              <button
                onClick={() => onChange(opt.value)}
                className={[
                  "w-full text-xs py-1.5 rounded-md transition-colors",
                  value === opt.value
                    ? "bg-studio-sidebar text-studio-text"
                    : "text-studio-muted hover:text-studio-text",
                ].join(" ")}
              >
                {opt.label}
              </button>
              {opt.tooltip && (
                <span
                  className={[
                    "pointer-events-none absolute bottom-full mb-1.5 z-20 w-44 px-2 py-1 rounded-md",
                    "bg-studio-bg border border-studio-border text-studio-text text-[10px] leading-snug text-center",
                    "opacity-0 group-hover/tip:opacity-100 transition-opacity",
                    isFirst ? "left-0" : isLast ? "right-0" : "left-1/2 -translate-x-1/2",
                  ].join(" ")}
                >
                  {opt.tooltip}
                </span>
              )}
            </div>
          );
        })}
      </div>
    );
  }

  // ── Panel resize ───────────────────────────────────────

  const [panelWidth, setPanelWidth] = useState(288); // 기본 w-72
  const MIN_PANEL_W = 240;
  const MAX_PANEL_W = 520;

  function handleResizeStart(e: React.MouseEvent) {
    e.preventDefault();
    const startX = e.clientX;
    const startW = panelWidth;
    function onMove(ev: MouseEvent) {
      // 패널이 오른쪽에 있으므로 왼쪽으로 드래그할수록 넓어짐
      const delta = startX - ev.clientX;
      setPanelWidth(Math.min(MAX_PANEL_W, Math.max(MIN_PANEL_W, startW + delta)));
    }
    function onUp() {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    }
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  }

  // ── Render ─────────────────────────────────────────────

  return (
    <div
      style={{ width: panelWidth }}
      className="relative shrink-0 h-full flex flex-col bg-studio-sidebar border-l border-studio-border"
    >
      {/* Resize handle — left edge (outside scroll container so h-full is always full panel height) */}
      <div
        onMouseDown={handleResizeStart}
        className="absolute left-0 top-0 h-full w-px cursor-ew-resize z-10 bg-transparent hover:[background:#F2FF66] transition-colors"
        title="Drag to resize panel"
      />

      <div className="flex-1 overflow-y-auto p-5">

      <Section title="Export Size">
        <ToggleGroup
          value={exportSize}
          options={[{ value: "desktop", label: "Desktop" }, { value: "mobile", label: "Mobile" }]}
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
            className="w-5 h-5 rounded flex items-center justify-center text-xs font-semibold bg-studio-accent text-studio-accent-fg hover:opacity-90 transition-opacity leading-none"
          >
            +
          </button>
        }
      >
        <div className="grid grid-cols-3 gap-2">
          {[...BACKGROUNDS, ...customBackgrounds].slice(0, 6).map((bg) => (
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

      <Section title="Layout">
        <ToggleGroup
          value={layout}
          options={[
            { value: "split",  label: "Split",  tooltip: "Keeps the chat UI off a person's face — best for photos with people." },
            { value: "center", label: "Center", tooltip: "Best for nature or general backgrounds." },
          ]}
          onChange={setLayout}
        />
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
          <SelectContent className="bg-studio-sidebar border border-studio-border shadow-lg rounded-lg py-1">
            {SCENARIOS.map((s) => (
              <SelectItem
                key={s.id}
                value={s.id}
                className="text-xs text-studio-text rounded-none px-3 py-1.5 cursor-default focus:bg-studio-hover focus:text-white! focus:**:text-white! data-[highlighted]:bg-studio-hover data-[highlighted]:text-white! data-[highlighted]:**:text-white!"
              >
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
          <div className="relative">
            <textarea
              value={genPrompt}
              onChange={(e) => setGenPrompt(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleGenerate(); } }}
              onFocus={() => setPhFocused(true)}
              onBlur={() => setPhFocused(false)}
              placeholder=""
              rows={4}
              disabled
              className="w-full text-xs bg-studio-sidebar border border-studio-border rounded-md px-3 py-2 text-studio-text resize-none focus:outline-none focus:ring-1 focus:ring-studio-accent opacity-50 cursor-not-allowed"
            />
            {/* Rotating placeholder overlay — hidden when typing or focused */}
            {!genPrompt && !phFocused && (
              <p
                style={{ opacity: phOpacity, transition: "opacity 300ms" }}
                className="absolute inset-0 px-3 py-2 text-xs text-studio-muted pointer-events-none leading-relaxed"
              >
                {SCENARIO_PLACEHOLDERS[phIdx]}
              </p>
            )}
          </div>
          {/* Generate with AI — coming soon */}
          <button
            onClick={handleGenerate}
            disabled
            className="flex items-center justify-center gap-1.5 w-full h-8 rounded-md bg-studio-hover border border-studio-border text-studio-text text-xs font-medium opacity-50 cursor-not-allowed transition-colors"
          >
            <Sparkles size={12} />
            {genLoading ? "Generating…" : "Generate with AI"}
            <span className="text-[10px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded-full bg-studio-accent/20 text-studio-accent">
              Soon
            </span>
          </button>
          {genError && (
            <p className="text-xs text-red-400">{genError}</p>
          )}
        </div>
      </Section>

      <Section title="User Profile">
        <div className="flex items-center gap-2">
          {/* Avatar preview */}
          {userAvatarUrl && !avatarLoadError ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={userAvatarUrl}
              src={userAvatarUrl}
              alt={userName}
              className="w-8 h-8 rounded-full object-cover shrink-0 border border-studio-border"
              onError={() => setAvatarLoadError(true)}
              onLoad={() => setAvatarLoadError(false)}
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
              <RotateCcw size={13} />
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

        {/* Add message dropdown */}
        <Menu.Root>
          <Menu.Trigger
            disabled={isOverflowing || canvasIsFull}
            className="flex items-center justify-center gap-1.5 w-full h-8 rounded-md bg-studio-accent text-studio-accent-fg font-semibold text-xs hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
          >
            + Add message
            <ChevronDown size={11} />
          </Menu.Trigger>
          {canvasIsFull && (
            <p className="text-[10px] text-red-400 leading-none flex items-center gap-1 mt-1">
              ⚠️ Canvas is full — Remove or shorten a message to add more
            </p>
          )}
          <Menu.Portal>
            <Menu.Positioner side="top" align="center" sideOffset={6}>
              <Menu.Popup className="z-50 min-w-[220px] rounded-xl border border-studio-border bg-studio-sidebar shadow-xl py-2 outline-none origin-bottom data-[ending-style]:animate-out data-[ending-style]:fade-out-0 data-[ending-style]:zoom-out-95 data-[starting-style]:animate-in data-[starting-style]:fade-in-0 data-[starting-style]:zoom-in-95 duration-100">
                {([
                  { Icon: MessageSquare,     label: "Text message",    add: () => {
                    const lastRole = messages.at(-1)?.role ?? "bot";
                    const role = lastRole === "bot" ? "user" : "bot";
                    addMessage({ id: uid(), role, sender: role === "user" ? (userName || "User") : "bot", block: { type: "text", text: "" } });
                  }},
                  { Icon: ShoppingBag,       label: "Product cards",   add: () => addMessage({ id: uid(), role: "bot", sender: "bot", block: { type: "products", items: [
                    { img: "", name: "Product A", sub: "$0.00", cta: "Buy now", imageQuery: "" },
                    { img: "", name: "Product B", sub: "$0.00", cta: "Buy now", imageQuery: "" },
                  ]}})},
                  { Icon: MousePointerClick, label: "Action buttons",  add: () => addMessage({ id: uid(), role: "bot", sender: "bot", block: { type: "actions", buttons: ["Option A", "Option B"] } }) },
                  { Icon: ListChecks,        label: "Checklist",       add: () => addMessage({ id: uid(), role: "bot", sender: "bot", block: { type: "checklist", items: [
                    { id: uid(), label: "Task one",   status: "done" },
                    { id: uid(), label: "Task two",   status: "in-progress" },
                    { id: uid(), label: "Task three", status: "pending" },
                  ]}})},
                  { Icon: Tag,               label: "Status",          add: () => addMessage({ id: uid(), role: "bot", sender: "bot", block: { type: "status", label: "Status label", variant: "success" } }) },
                ] as const).map(({ Icon, label, add }) => (
                  <Menu.Item
                    key={label}
                    onClick={add}
                    className="flex items-center gap-3 px-3 py-2.5 text-sm text-studio-text hover:bg-studio-hover cursor-default outline-none mx-1 rounded-lg"
                  >
                    <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-studio-muted/20 shrink-0">
                      <Icon size={16} className="text-studio-text" />
                    </span>
                    {label}
                  </Menu.Item>
                ))}
              </Menu.Popup>
            </Menu.Positioner>
          </Menu.Portal>
        </Menu.Root>
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

      </div> {/* /p-5 */}
    </div>
  );
}
