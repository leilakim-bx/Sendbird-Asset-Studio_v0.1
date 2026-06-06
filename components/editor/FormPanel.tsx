"use client";

import { useRef, useState, useEffect, useCallback, memo } from "react";
import { Sparkles, Search, RotateCcw, ChevronDown, Copy, Trash2, AudioLines, Circle, Info, CircleCheck, TriangleAlert, MessageSquare, MousePointerClick, ShoppingBag, ListChecks, Activity, Mic, UserRound, Bot, ShieldCheck, Plus, X } from "lucide-react";
import { SCENARIOS } from "@/lib/scenarios";
import { useEditorStore } from "@/lib/store";
import type { ChatMessage, MessagePatch, TextBlock, ActionsBlock, ProductsBlock, ProductItem, ChecklistBlock, ChecklistItem, StatusBlock, VoiceBlock } from "@/lib/store";
import { BACKGROUNDS } from "@/lib/backgrounds";
import { BackgroundPickerModal } from "./BackgroundPickerModal";
import { ChecklistStatusIcon } from "@/components/templates/checklist-status-icon";
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
        <span className="text-xs font-medium text-studio-text flex-1">Product {index + 1}</span>
        <button onClick={onDuplicate} title="Duplicate" className="w-6 h-6 flex items-center justify-center rounded text-studio-muted hover:text-studio-text hover:bg-studio-hover transition-colors">
          <Copy size={12} />
        </button>
        <button onClick={onRemove} title="Delete" className="w-6 h-6 flex items-center justify-center rounded text-studio-muted hover:text-red-400 hover:bg-studio-hover transition-colors">
          <Trash2 size={12} />
        </button>
      </div>

      <div className="flex flex-col gap-3 p-3">
        {/* TITLE section — 자주 만지는 것 우선 */}
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

        {/* IMAGE section — 컴팩트 한 줄: 썸네일 + 검색(Enter) + 재검색(↻) */}
        <div>
          <SectionLabel>Image</SectionLabel>
          <div className="flex items-center gap-2">
            {/* Thumbnail */}
            {item.img ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={item.img} alt={item.name}
                className="w-11 h-11 rounded-md object-cover border border-studio-border shrink-0" />
            ) : (
              <div className="w-11 h-11 rounded-md bg-studio-hover border border-studio-border flex items-center justify-center shrink-0">
                <Search size={14} className="text-studio-muted opacity-40" />
              </div>
            )}
            {/* Search query — Enter to fetch */}
            <div className="relative flex-1 min-w-0">
              <Search size={11} className="absolute left-2 top-1/2 -translate-y-1/2 text-studio-muted pointer-events-none" />
              <Input
                value={imageQuery}
                onChange={(e) => setImageQuery(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); applyImage(); } }}
                placeholder="Search image — press Enter"
                className="h-8 text-xs pl-6 bg-studio-sidebar border-studio-border text-studio-text placeholder:text-studio-muted"
              />
            </div>
            {/* Re-fetch another image */}
            <button
              onClick={applyImage}
              disabled={loading || !imageQuery.trim()}
              title="Try another image"
              aria-label="Try another image"
              className="shrink-0 w-8 h-8 flex items-center justify-center rounded-md border border-studio-border text-studio-muted hover:text-studio-text hover:bg-studio-hover transition-colors disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-studio-muted"
            >
              <RotateCcw size={13} className={loading ? "animate-spin" : ""} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Section wrapper ───────────────────────────────────────

// 섹션 접힘 상태 영속화 — 에디터 스토어와 분리된 별도 localStorage 키 (마이그레이션 불필요)
const SECTION_COLLAPSE_KEY = "sendbird-section-collapsed-v1";

function readCollapsedMap(): Record<string, boolean> {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(localStorage.getItem(SECTION_COLLAPSE_KEY) || "{}") as Record<string, boolean>;
  } catch {
    return {};
  }
}

function writeCollapsed(title: string, collapsed: boolean) {
  if (typeof window === "undefined") return;
  try {
    const map = readCollapsedMap();
    map[title] = collapsed;
    localStorage.setItem(SECTION_COLLAPSE_KEY, JSON.stringify(map));
  } catch {
    // 쿼터 초과 등은 조용히 무시
  }
}

function Section({
  title,
  info,
  action,
  defaultCollapsed = false,
  children,
}: {
  title: string;
  /** Optional hover hint shown via an ℹ️ icon next to the title */
  info?: string;
  action?: React.ReactNode;
  /** 첫 진입(저장값 없음) 시 접힘 여부. 정적 prop이라 SSR/CSR 초기 렌더 일치 → 하이드레이션 안전 */
  defaultCollapsed?: boolean;
  children: React.ReactNode;
}) {
  // 일회성 기본값: 저장값이 없으면 defaultCollapsed를 따르고, 사용자가 한 번이라도
  // 토글하면 그 값이 영속되어 기본값을 덮어쓴다.
  const [collapsed, setCollapsed] = useState(defaultCollapsed);
  useEffect(() => {
    const stored = readCollapsedMap()[title];
    if (stored !== undefined) setCollapsed(stored);
  }, [title]);

  const toggle = () =>
    setCollapsed((c) => {
      const next = !c;
      writeCollapsed(title, next);
      return next;
    });

  return (
    <div className="pb-5 mb-5">
      <div className={`flex items-center justify-between ${collapsed ? "" : "mb-3"}`}>
        <div className="flex items-center gap-1.5">
          {/* chevron+타이틀 영역만 토글 (info / action 버튼과 충돌 방지) */}
          <button
            type="button"
            onClick={toggle}
            aria-expanded={!collapsed}
            className="flex items-center gap-1.5 -ml-0.5 group/sec"
          >
            <ChevronDown
              size={13}
              className={`shrink-0 text-studio-muted transition-transform group-hover/sec:text-studio-text ${collapsed ? "-rotate-90" : ""}`}
            />
            <p className="text-xs font-semibold text-studio-muted uppercase tracking-wider group-hover/sec:text-studio-text transition-colors">
              {title}
            </p>
          </button>
          {info && (
            <span className="relative group/tip flex items-center">
              <Info size={14} className="text-studio-muted cursor-help" />
              <span className="pointer-events-none absolute top-full left-0 mt-1.5 z-20 w-52 px-2 py-1 rounded bg-studio-bg border border-studio-border text-studio-text text-[10px] leading-snug normal-case tracking-normal font-normal opacity-0 group-hover/tip:opacity-100 transition-opacity">
                {info}
              </span>
            </span>
          )}
        </div>
        {action}
      </div>
      {!collapsed && children}
    </div>
  );
}

// ── Icon segmented toggle ─────────────────────────────────
// 카드 헤더의 옵션 선택(아이콘 전용)을 세그먼트 토글로 통일 — Voice/Status/Text 공용
function IconSegmentToggle<T extends string>({
  options,
  value,
  onChange,
}: {
  options: readonly { value: T; Icon: typeof Circle; label: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div className="flex items-center gap-0.5 p-0.5 rounded-lg bg-studio-bg border border-studio-border">
      {options.map(({ value: v, Icon, label }) => (
        <div key={v} className="relative group/tip flex">
          <button
            type="button"
            onClick={() => onChange(v)}
            className={[
              "w-7 h-5 rounded-md flex items-center justify-center transition-colors",
              value === v
                ? "bg-white/10 text-studio-text"
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
  // 체크리스트 항목별 채널 태그 입력이 펼쳐졌는지 (값이 없을 때만 의미)
  const [tagOpen, setTagOpen] = useState<Record<string, boolean>>({});
  // 버블 너비(~264px)에서 15px 폰트 기준 약 33자/줄로 추정
  const estimatedLines = localText.split("\n").reduce((acc, line) => acc + Math.max(1, Math.ceil((line.length || 1) / 33)), 0);
  const isOverMaxLines = estimatedLines > 15;
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
  // 드래그 중 삽입 위치를 블록 사이 라임 라인으로 표시 (드래그 방향에 맞춰 위/아래)
  const dragFrom = dragIndexRef.current;
  const showLineAbove = isDragOver && dragFrom !== null && dragFrom > index;
  const showLineBelow = isDragOver && dragFrom !== null && dragFrom < index;
  const wrapCls = [
    "relative bg-studio-hover rounded-lg p-3 flex flex-col gap-2 transition-opacity",
    dragFrom === index ? "opacity-40" : "",
    showLineAbove ? "before:content-[''] before:absolute before:left-0 before:right-0 before:-top-1 before:h-0.5 before:bg-studio-accent before:rounded-full" : "",
    showLineBelow ? "after:content-[''] after:absolute after:left-0 after:right-0 after:-bottom-1 after:h-0.5 after:bg-studio-accent after:rounded-full" : "",
  ].join(" ");

  // 역할별 왼쪽 색 띠: User = 민트, Bot(delight.ai) = 브랜드 라임
  const roleColor = msg.role === "user" ? "#D0F3E6" : "#D4FF4D";
  const wrapStyle = { borderLeft: `3px solid ${roleColor}` };

  const dragProps = {
    draggable: true as const,
    onDragStart: () => onDragStart(index),
    onDragOver:  (e: React.DragEvent) => onDragOverItem(e, index),
    onDrop:      () => onDrop(index),
    onDragEnd,
  };

  // Text 카드 발신자 토글 — Voice/Status와 동일한 아이콘 세그먼트 토글 (👤 User / 🤖 delight.ai)
  const SenderToggle = () => (
    <IconSegmentToggle
      options={[
        { value: "user", Icon: UserRound, label: "User" },
        { value: "bot",  Icon: Bot,       label: "delight.ai" },
      ] as const}
      value={msg.role === "user" ? "user" : "bot"}
      onChange={(role) => onUpdate(msg.id, { role })}
    />
  );

  // 카드 헤더: 1줄 = 아이콘 + 타입 타이틀 + (우측 extra) + ✕, (선택) 2줄 = 발신자
  const CardHeader = ({ icon: Icon, title, extra, sender }: { icon: typeof MessageSquare; title: string; extra?: React.ReactNode; sender?: React.ReactNode }) => (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center gap-1.5">
        <Icon size={13} className="shrink-0 text-studio-muted" />
        <span className="text-xs text-studio-muted flex-1">{title}</span>
        {extra}
        <button
          onClick={() => onRemove(msg.id)}
          className="shrink-0 text-studio-muted hover:text-studio-text hover:bg-studio-border rounded-[4px] w-5 h-5 flex items-center justify-center text-xs transition-colors"
        >
          ✕
        </button>
      </div>
      {sender}
    </div>
  );

  // ── Text message ───────────────────────────────────────
  if (msg.block.type === "text") {
    const hasActivityLog = msg.role === "bot" && !!msg.block.verifications?.length;
    return (
      <div {...dragProps} className={wrapCls} style={wrapStyle}>
        <CardHeader
          icon={hasActivityLog ? ShieldCheck : MessageSquare}
          title={hasActivityLog ? "Text + Activity log" : "Text"}
          extra={hasActivityLog ? undefined : <SenderToggle />}
        />
        <textarea
          value={localText}
          onChange={handleTextChange}
          placeholder="Message text"
          rows={2}
          className="w-full text-xs bg-studio-sidebar border border-studio-border rounded-md px-3 py-2 text-studio-text placeholder:text-studio-muted resize-none focus:outline-none focus:ring-1 focus:ring-studio-accent"
        />
        {isOverMaxLines && (
          <p className="text-[10px] text-red-400 leading-none">
            Text exceeds 15-line limit and will be clipped
          </p>
        )}
        {msg.role === "bot" && (() => {
          const verifications = msg.block.verifications;
          const setVerifications = (next: string[]) =>
            onUpdate(msg.id, {
              block: { ...(msg.block as TextBlock), verifications: next.length ? next : undefined },
            });
          if (!verifications || verifications.length === 0) {
            return (
              <button
                onClick={() => setVerifications(["Verified"])}
                className="self-start mt-1 inline-flex items-center gap-1 text-[11px] text-studio-muted hover:text-studio-text transition-colors"
              >
                <ShieldCheck size={12} />
                Add AI activity log
              </button>
            );
          }
          return (
            <div className="mt-1 pt-2 border-t border-studio-border flex flex-col gap-1.5">
              <div className="text-[10px] font-semibold uppercase tracking-wide text-studio-muted">
                AI agent activity log
              </div>
              {verifications.map((v, i) => (
                <div key={i} className="flex items-center gap-1.5">
                  <Circle size={7} className="shrink-0 fill-studio-muted text-studio-muted" />
                  <Input
                    value={v}
                    onChange={(e) => {
                      const next = [...verifications];
                      next[i] = e.target.value;
                      setVerifications(next);
                    }}
                    placeholder={`Activity ${i + 1}`}
                    className="h-7 text-xs bg-studio-sidebar border-studio-border text-studio-text placeholder:text-studio-muted"
                  />
                  <button
                    onClick={() => setVerifications(verifications.filter((_, idx) => idx !== i))}
                    className="shrink-0 w-5 h-5 flex items-center justify-center rounded text-studio-muted hover:text-studio-text hover:bg-studio-hover transition-colors"
                    aria-label="Remove activity line"
                  >
                    <X size={12} />
                  </button>
                </div>
              ))}
              <button
                onClick={() => setVerifications([...verifications, ""])}
                className="self-start inline-flex items-center gap-1 text-[11px] text-studio-muted hover:text-studio-text transition-colors"
              >
                <Plus size={12} />
                Add line
              </button>
            </div>
          );
        })()}
      </div>
    );
  }

  // ── Action buttons ─────────────────────────────────────
  if (msg.block.type === "actions") {
    const actionsBlock = msg.block as ActionsBlock;
    return (
      <div {...dragProps} className={wrapCls} style={wrapStyle}>
        <CardHeader icon={MousePointerClick} title="Action Buttons" />
        <textarea
          value={actionsBlock.text ?? ""}
          onChange={(e) => onUpdate(msg.id, { block: { ...actionsBlock, text: e.target.value } })}
          placeholder="Message text"
          rows={2}
          className="w-full text-xs bg-studio-sidebar border border-studio-border rounded-md px-3 py-2 text-studio-text placeholder:text-studio-muted resize-none focus:outline-none focus:ring-1 focus:ring-studio-accent"
        />
        {actionsBlock.buttons.map((btn, i) => (
          <div key={i} className="flex items-center gap-1.5">
            <Input
              value={btn}
              onChange={(e) => {
                const buttons = [...actionsBlock.buttons];
                buttons[i] = e.target.value;
                onUpdate(msg.id, { block: { ...actionsBlock, buttons } });
              }}
              placeholder={`Button ${i + 1}`}
              className="h-7 text-xs bg-studio-sidebar border-studio-border text-studio-text placeholder:text-studio-muted"
            />
            <button
              onClick={() => {
                const buttons = actionsBlock.buttons.filter((_, idx) => idx !== i);
                onUpdate(msg.id, { block: { ...actionsBlock, buttons } });
              }}
              disabled={actionsBlock.buttons.length <= 1}
              aria-label="Remove button"
              className="shrink-0 w-5 h-5 flex items-center justify-center rounded text-studio-muted hover:text-studio-text hover:bg-studio-hover transition-colors disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent"
            >
              <X size={12} />
            </button>
          </div>
        ))}
        <button
          onClick={() => onUpdate(msg.id, { block: { ...actionsBlock, buttons: [...actionsBlock.buttons, `Option ${actionsBlock.buttons.length + 1}`] } })}
          disabled={actionsBlock.buttons.length >= 6}
          title={actionsBlock.buttons.length >= 6 ? "Max 6 buttons" : undefined}
          className="mt-1 w-full h-7 rounded-md bg-studio-muted/20 text-studio-text hover:bg-studio-muted/30 text-xs transition-colors disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-studio-muted/20"
        >
          + Add button
        </button>
      </div>
    );
  }

  // ── Product cards ──────────────────────────────────────
  if (msg.block.type === "products") {
    const productsBlock = msg.block as ProductsBlock;
    const count = productsBlock.items.length;
    return (
      <div {...dragProps} className={wrapCls} style={wrapStyle}>
        {/* Block header */}
        <CardHeader
          icon={ShoppingBag}
          title="Product Cards"
          extra={
            <span className="shrink-0 text-[10px] font-semibold text-studio-muted bg-studio-hover border border-studio-border rounded px-1.5 py-0.5 leading-none">
              {count}
            </span>
          }
        />

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
          className="mt-2 w-full h-7 rounded-md bg-studio-muted/20 text-studio-text hover:bg-studio-muted/30 text-xs transition-colors disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-studio-muted/20"
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
    const STATUS_LABEL: Record<ChecklistItem["status"], string> = {
      pending: "Pending",
      "in-progress": "In progress",
      done: "Done",
    };
    return (
      <div {...dragProps} className={wrapCls} style={wrapStyle}>
        <CardHeader icon={ListChecks} title="Checklist" />
        <div className="flex flex-col gap-1.5">
          {checklistBlock.items.map((item, i) => (
            <div key={item.id} className="flex items-center gap-1.5">
              {/* Status toggle */}
              <div className="relative group/tip shrink-0">
                <button
                  onClick={() => {
                    const items = checklistBlock.items.map((it, idx) =>
                      idx === i ? { ...it, status: CYCLE[it.status] } : it
                    );
                    onUpdate(msg.id, { block: { type: "checklist", items } });
                  }}
                  className="w-5 h-5 flex items-center justify-center transition-opacity hover:opacity-80"
                >
                  <ChecklistStatusIcon
                    status={item.status}
                    size={16}
                    fill="#F3F4F6"
                    check="#1a1a1a"
                    arc="#F3F4F6"
                    border="#6B7280"
                  />
                </button>
                <span className="pointer-events-none absolute bottom-full left-0 mb-1.5 px-1.5 py-0.5 rounded bg-studio-bg border border-studio-border text-studio-text text-[10px] whitespace-nowrap opacity-0 group-hover/tip:opacity-100 transition-opacity z-10">
                  {STATUS_LABEL[item.status]} · click to change
                </span>
              </div>
              {/* Channel badge (optional) — collapsed to "+ Tag" until used */}
              {(item.badge || tagOpen[item.id]) ? (
                <Input
                  value={item.badge ?? ""}
                  autoFocus={!item.badge && !!tagOpen[item.id]}
                  onChange={(e) => {
                    const badge = e.target.value.toUpperCase();
                    const items = checklistBlock.items.map((it, idx) =>
                      idx === i ? { ...it, badge } : it
                    );
                    onUpdate(msg.id, { block: { type: "checklist", items } });
                  }}
                  onFocus={() => setTagOpen((o) => ({ ...o, [item.id]: true }))}
                  onBlur={() => { if (!item.badge) setTagOpen((o) => ({ ...o, [item.id]: false })); }}
                  placeholder="Tag"
                  maxLength={6}
                  className="shrink-0 w-14 h-7 text-xs text-center uppercase bg-studio-sidebar border-studio-border text-studio-text placeholder:text-studio-muted placeholder:normal-case"
                />
              ) : (
                <button
                  onClick={() => setTagOpen((o) => ({ ...o, [item.id]: true }))}
                  className="shrink-0 h-7 px-2 rounded-md border border-dashed border-studio-border text-[10px] text-studio-muted hover:text-studio-text hover:border-studio-muted transition-colors"
                >
                  + Tag
                </button>
              )}
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

    return (
      <div {...dragProps} className={wrapCls} style={wrapStyle}>
        <CardHeader
          icon={Activity}
          title="Status"
          extra={
            <IconSegmentToggle
              options={[
                { value: "success", Icon: CircleCheck,   label: "Success" },
                { value: "warning", Icon: TriangleAlert, label: "Warning" },
              ] as const}
              value={statusBlock.variant}
              onChange={(variant) => onUpdate(msg.id, { block: { ...statusBlock, variant } })}
            />
          }
        />
        {/* Label input */}
        <Input
          value={statusBlock.label}
          onChange={(e) => onUpdate(msg.id, { block: { ...statusBlock, label: e.target.value } })}
          placeholder="Status label"
          className="h-7 text-xs bg-studio-sidebar border-studio-border text-studio-text placeholder:text-studio-muted"
        />
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
      <div {...dragProps} className={wrapCls} style={wrapStyle}>
        <CardHeader
          icon={Mic}
          title="Voice"
          extra={
            <IconSegmentToggle
              options={STYLE_OPTIONS.map(({ style, Icon, label }) => ({ value: style, Icon, label }))}
              value={voiceBlock.style}
              onChange={(style) => patch({ style })}
            />
          }
        />

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

      <Section title="Background" defaultCollapsed>
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
        {/* Browse / upload more — placed below the grid like "+ Add message" */}
        <button
          onClick={() => setShowBgModal(true)}
          className="mt-2 w-full h-7 rounded-md bg-studio-muted/20 text-studio-text hover:bg-studio-muted/30 text-xs transition-colors"
        >
          Background Library
        </button>
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

      <Section title="Layout" defaultCollapsed>
        <ToggleGroup
          value={layout}
          options={[
            { value: "split",  label: "Split",  tooltip: "Keeps the chat UI off a person's face — best for photos with people." },
            { value: "center", label: "Center", tooltip: "Best for nature or general backgrounds." },
          ]}
          onChange={setLayout}
        />
      </Section>

      <Section title="Scenario">
        {/* Dropdown */}
        <Select
          value={activeScenario ?? ""}
          onValueChange={(val) => handleScenarioChange(String(val))}
        >
          <SelectTrigger className="w-full h-8 border-studio-border bg-studio-hover text-studio-text text-sm rounded-lg">
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

      <Section title="Messages" info="Once the frame is full, you can't add more messages — remove or shorten one to make room.">
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
              <Menu.Popup className="z-50 w-(--anchor-width) rounded-lg border border-studio-border bg-studio-sidebar shadow-lg py-1 outline-none origin-bottom data-[ending-style]:animate-out data-[ending-style]:fade-out-0 data-[ending-style]:zoom-out-95 data-[starting-style]:animate-in data-[starting-style]:fade-in-0 data-[starting-style]:zoom-in-95 duration-100">
                {([
                  { label: "Text message",    add: () => {
                    const lastRole = messages.at(-1)?.role ?? "bot";
                    const role = lastRole === "bot" ? "user" : "bot";
                    addMessage({ id: uid(), role, sender: role === "user" ? (userName || "User") : "bot", block: { type: "text", text: "" } });
                  }},
                  { label: "Text + Activity log", add: () => addMessage({ id: uid(), role: "bot", sender: "bot", block: { type: "text", text: "", verifications: ["Identity verified", "Source: live data"] } }) },
                  { label: "Product cards",   add: () => addMessage({ id: uid(), role: "bot", sender: "bot", block: { type: "products", items: [
                    { img: "", name: "Product A", sub: "$0.00", cta: "Buy now", imageQuery: "" },
                    { img: "", name: "Product B", sub: "$0.00", cta: "Buy now", imageQuery: "" },
                  ]}})},
                  { label: "Action buttons",  add: () => addMessage({ id: uid(), role: "bot", sender: "bot", block: { type: "actions", buttons: ["Option A", "Option B"] } }) },
                  { label: "Checklist",       add: () => addMessage({ id: uid(), role: "bot", sender: "bot", block: { type: "checklist", items: [
                    { id: uid(), label: "Task one",   status: "done" },
                    { id: uid(), label: "Task two",   status: "in-progress" },
                    { id: uid(), label: "Task three", status: "pending" },
                  ]}})},
                  { label: "Status",          add: () => addMessage({ id: uid(), role: "bot", sender: "bot", block: { type: "status", label: "Status label", variant: "success" } }) },
                ] as const).map(({ label, add }) => (
                  <Menu.Item
                    key={label}
                    onClick={add}
                    className="text-xs text-studio-text px-3 py-1.5 cursor-default outline-none transition-colors data-[highlighted]:bg-studio-hover data-[highlighted]:text-white"
                  >
                    {label}
                  </Menu.Item>
                ))}
              </Menu.Popup>
            </Menu.Positioner>
          </Menu.Portal>
        </Menu.Root>
      </Section>

      <Section title="User Profile" defaultCollapsed>
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

      <Section title="App Name" defaultCollapsed>
        <Input
          value={appName}
          onChange={(e) => setAppName(e.target.value)}
          placeholder="e.g. sendbird.ai"
          className="h-8 text-sm bg-studio-hover border-studio-border text-studio-text placeholder:text-studio-muted"
        />
      </Section>

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
