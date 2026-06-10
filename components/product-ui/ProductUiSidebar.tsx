"use client";

import { useState, type ReactNode } from "react";
import {
  Bot,
  ChevronDown,
  GitBranch,
  History,
  Info,
  ListChecks,
  MessageSquareText,
  Plus,
  Sparkles,
  Split,
  Table2,
  Workflow,
  X,
  type LucideIcon,
} from "lucide-react";
import { Menu } from "@base-ui/react/menu";
import { useEditorStore } from "@/lib/store";
import { BACKGROUNDS } from "@/lib/backgrounds";
import {
  PRODUCT_UI_BLOG_BACKGROUND_COLORS,
  PRODUCT_UI_SCENE_LABELS,
  PRODUCT_UI_STATUS_LABELS,
  type ProductUiContent,
  type ProductUiFormat,
  type ProductUiItem,
  type ProductUiNode,
  type ProductUiReleasePurpose,
  type ProductUiScene,
  type ProductUiStatus,
} from "@/lib/types/product-ui";
import { PRODUCT_UI_PRESETS, cloneProductUiContent, getProductUiPreset } from "@/lib/product-ui-presets";
import { draftProductUiFromText } from "@/lib/product-ui-draft";
import { Section } from "@/components/infographic/sidebar/Section";
import { AiMagicButton } from "@/components/ui/ai-magic-button";
import { BackgroundPickerModal } from "@/components/editor/BackgroundPickerModal";

const inputCls =
  "h-8 w-full rounded-lg border border-studio-border bg-studio-sidebar px-2.5 py-1 text-xs text-studio-text placeholder:text-studio-muted outline-none transition-colors focus:border-studio-accent focus:ring-1 focus:ring-studio-accent";

const sceneIcons: Record<ProductUiScene, LucideIcon> = {
  "ai-response": MessageSquareText,
  "review-queue": Table2,
  "test-results": ListChecks,
  "traffic-allocation": Split,
  workflow: Workflow,
  "version-history": History,
  "steward-detail": Bot,
  "ab-test": GitBranch,
};

const statusOptions: ProductUiStatus[] = ["success", "warning", "danger", "neutral", "accent", "live"];

const FORMAT_OPTIONS: Array<{ id: ProductUiFormat; label: string; detail: string }> = [
  { id: "feature", label: "Product feature", detail: "Desktop + mobile" },
  { id: "release", label: "Product release", detail: "Thumbnail / insert" },
  { id: "blog", label: "Blog", detail: "664px wide" },
];

const RELEASE_PURPOSE_OPTIONS: Array<{ id: ProductUiReleasePurpose; label: string }> = [
  { id: "thumbnail", label: "Thumbnail" },
  { id: "insert", label: "Insert image" },
];

const BLOG_BACKGROUND_LABELS: Record<(typeof PRODUCT_UI_BLOG_BACKGROUND_COLORS)[number], string> = {
  "#D9D6D2": "Stone",
  "#F7F5F0": "Warm gray",
};

const SCENE_TYPE_LABELS: Record<ProductUiScene, string> = {
  "ai-response": "response",
  "review-queue": "queue",
  "test-results": "testing",
  "traffic-allocation": "rollout",
  workflow: "flow",
  "version-history": "history",
  "steward-detail": "steward",
  "ab-test": "test",
};

function InfoTooltip({ text }: { text: string }) {
  return (
    <span className="group relative inline-flex items-center">
      <Info size={13} className="text-studio-muted hover:text-studio-text cursor-help transition-colors" />
      <span className="pointer-events-none absolute left-0 top-full z-50 mt-1.5 w-60 rounded-md border border-studio-border bg-studio-bg px-2.5 py-2 text-[11px] font-normal normal-case leading-snug tracking-normal text-studio-text opacity-0 shadow-xl transition-opacity duration-150 group-hover:opacity-100">
        {text}
      </span>
    </span>
  );
}

function nextId(prefix: string) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
}

function FieldLabel({ children }: { children: ReactNode }) {
  return (
    <span className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-studio-muted">
      {children}
    </span>
  );
}

function FormatDropdown({
  value,
  onChange,
}: {
  value: ProductUiFormat;
  onChange: (format: ProductUiFormat) => void;
}) {
  const current = FORMAT_OPTIONS.find((format) => format.id === value) ?? FORMAT_OPTIONS[0];

  return (
    <Menu.Root>
      <Menu.Trigger className="flex w-full items-center gap-3 rounded-lg border border-studio-border bg-studio-hover px-3 py-2.5 text-left outline-none transition-colors hover:bg-white/[0.06] focus-visible:border-studio-accent focus-visible:ring-1 focus-visible:ring-studio-accent">
        <span className="flex-1 min-w-0">
          <span className="block truncate text-sm font-semibold text-studio-text">{current.label}</span>
          <span className="mt-0.5 block truncate text-[11px] font-medium text-studio-muted">
            {current.detail}
          </span>
        </span>
        <ChevronDown size={15} className="shrink-0 text-studio-muted" />
      </Menu.Trigger>
      <Menu.Portal>
        <Menu.Positioner side="bottom" align="start" sideOffset={6}>
          <Menu.Popup className="z-50 w-(--anchor-width) rounded-lg border border-studio-border bg-studio-sidebar py-1 shadow-lg outline-none origin-top data-[ending-style]:animate-out data-[ending-style]:fade-out-0 data-[ending-style]:zoom-out-95 data-[starting-style]:animate-in data-[starting-style]:fade-in-0 data-[starting-style]:zoom-in-95 duration-100">
            {FORMAT_OPTIONS.map((format) => (
              <Menu.Item
                key={format.id}
                onClick={() => onChange(format.id)}
                className="text-xs text-studio-text px-3 py-1.5 cursor-default outline-none transition-colors data-[highlighted]:bg-studio-hover data-[highlighted]:text-white"
              >
                {format.label}
              </Menu.Item>
            ))}
          </Menu.Popup>
        </Menu.Positioner>
      </Menu.Portal>
    </Menu.Root>
  );
}

function SegmentedControl<T extends string>({
  value,
  options,
  onChange,
}: {
  value: T;
  options: { id: T; label: string }[];
  onChange: (value: T) => void;
}) {
  return (
    <div className="flex gap-1 rounded-lg bg-studio-hover p-0.5">
      {options.map((option) => (
        <button
          key={option.id}
          onClick={() => onChange(option.id)}
          aria-pressed={value === option.id}
          className={[
            "flex-1 rounded-md px-2 py-1.5 text-xs font-medium transition-colors",
            value === option.id
              ? "bg-studio-sidebar text-studio-text"
              : "text-studio-muted hover:text-studio-text",
          ].join(" ")}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  multiline = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  multiline?: boolean;
}) {
  return (
    <label className="block mb-2.5">
      <FieldLabel>{label}</FieldLabel>
      {multiline ? (
        <textarea
          value={value}
          onChange={(event) => onChange(event.target.value)}
          rows={3}
          className={`${inputCls} min-h-20 resize-none py-2 leading-snug`}
        />
      ) : (
        <input value={value} onChange={(event) => onChange(event.target.value)} className={inputCls} />
      )}
    </label>
  );
}

function ItemEditor({
  item,
  onChange,
  onRemove,
}: {
  item: ProductUiItem;
  onChange: (item: ProductUiItem) => void;
  onRemove: () => void;
}) {
  return (
    <div className="mb-2 rounded-lg bg-studio-hover p-2.5">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-xs font-medium text-studio-muted flex-1">Row</span>
        <button
          onClick={onRemove}
          className="flex h-5 w-5 items-center justify-center rounded-[4px] text-studio-muted transition-colors hover:bg-studio-border hover:text-studio-text"
          aria-label="Remove row"
          title="Remove row"
        >
          <X size={12} />
        </button>
      </div>
      <Field label="Label" value={item.label} onChange={(label) => onChange({ ...item, label })} />
      <Field label="Detail" value={item.detail ?? ""} onChange={(detail) => onChange({ ...item, detail })} />
      <div className="grid grid-cols-2 gap-2">
        <label className="block">
          <FieldLabel>Status</FieldLabel>
          <select
            value={item.status ?? "neutral"}
            onChange={(event) => onChange({ ...item, status: event.target.value as ProductUiStatus })}
            className={`${inputCls} appearance-none`}
          >
            {statusOptions.map((status) => (
              <option key={status} value={status}>{PRODUCT_UI_STATUS_LABELS[status]}</option>
            ))}
          </select>
        </label>
        <Field label="Value" value={item.value ?? ""} onChange={(value) => onChange({ ...item, value })} />
      </div>
    </div>
  );
}

function NodeEditor({
  node,
  onChange,
  onRemove,
}: {
  node: ProductUiNode;
  onChange: (node: ProductUiNode) => void;
  onRemove: () => void;
}) {
  return (
    <div className="mb-2 rounded-lg bg-studio-hover p-2.5">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-xs font-medium text-studio-muted flex-1">Node</span>
        <button
          onClick={onRemove}
          className="flex h-5 w-5 items-center justify-center rounded-[4px] text-studio-muted transition-colors hover:bg-studio-border hover:text-studio-text"
          aria-label="Remove node"
          title="Remove node"
        >
          <X size={12} />
        </button>
      </div>
      <Field label="Title" value={node.title} onChange={(title) => onChange({ ...node, title })} />
      <Field label="Detail" value={node.detail ?? ""} onChange={(detail) => onChange({ ...node, detail })} />
      <div className="grid grid-cols-2 gap-2">
        <label className="block">
          <FieldLabel>Status</FieldLabel>
          <select
            value={node.status ?? "neutral"}
            onChange={(event) => onChange({ ...node, status: event.target.value as ProductUiStatus })}
            className={`${inputCls} appearance-none`}
          >
            {statusOptions.map((status) => (
              <option key={status} value={status}>{PRODUCT_UI_STATUS_LABELS[status]}</option>
            ))}
          </select>
        </label>
        <Field label="Value" value={node.value ?? ""} onChange={(value) => onChange({ ...node, value })} />
      </div>
    </div>
  );
}

export function ProductUiSidebar() {
  const {
    productUiContent: content,
    setProductUiContent,
    customBackgrounds,
    addCustomBackground,
  } = useEditorStore();
  const [prompt, setPrompt] = useState("");
  const [notice, setNotice] = useState<string | null>(null);
  const [showBgModal, setShowBgModal] = useState(false);

  if (!content) return null;
  const activeContent = content;

  function update(patch: Partial<ProductUiContent>) {
    setProductUiContent({ ...activeContent, ...patch } as ProductUiContent);
  }

  function loadScene(scene: ProductUiScene) {
    const next = cloneProductUiContent(getProductUiPreset(scene).content);
    setProductUiContent({
      ...next,
      format: activeContent.format,
      releasePurpose: activeContent.releasePurpose ?? "thumbnail",
    });
    setNotice(null);
  }

  function applyDraft() {
    const drafted = draftProductUiFromText(prompt, activeContent);
    setProductUiContent(drafted);
    setNotice(`Drafted ${PRODUCT_UI_SCENE_LABELS[drafted.scene]}.`);
  }

  function updateItem(id: string, next: ProductUiItem) {
    update({ items: activeContent.items.map((item) => (item.id === id ? next : item)) });
  }

  function updateNode(id: string, next: ProductUiNode) {
    update({ nodes: activeContent.nodes.map((node) => (node.id === id ? next : node)) });
  }

  return (
    <div className="relative h-full w-80 shrink-0 border-l border-studio-border bg-studio-sidebar">
      <div className="h-full overflow-y-auto">
      <Section
        title="Format"
        info={
          <InfoTooltip text="Product feature images are used on general product pages, such as product capabilities or industry pages." />
        }
      >
        <FormatDropdown value={content.format} onChange={(format) => update({ format })} />
      </Section>

      {content.format === "release" && (
        <Section title="Release use">
          <SegmentedControl
            value={content.releasePurpose ?? "thumbnail"}
            options={RELEASE_PURPOSE_OPTIONS}
            onChange={(releasePurpose) => update({ releasePurpose })}
          />
        </Section>
      )}

      <div className="m-4 rounded-xl p-3.5 border border-studio-border bg-white/[0.02]">
        <div className="flex items-center gap-1.5 mb-2.5">
          <span className="w-6 h-6 rounded-md shrink-0 flex items-center justify-center bg-studio-hover">
            <Sparkles size={13} className="text-studio-text" fill="currentColor" />
          </span>
          <span className="text-xs font-semibold text-studio-text tracking-tight">Draft from release text</span>
        </div>
        <textarea
          value={prompt}
          onChange={(event) => setPrompt(event.target.value)}
          placeholder="Paste a release note, PRD snippet, or launch announcement..."
          rows={5}
          className="w-full bg-transparent border-0 outline-none resize-none text-xs text-studio-text leading-snug placeholder:text-[#555] min-h-[84px]"
        />
        <div className="flex justify-end">
          <AiMagicButton label="Draft" loading={false} disabled={!prompt.trim()} onClick={applyDraft} />
        </div>
        {notice && <p className="mt-1.5 text-[10px] text-studio-muted leading-snug">{notice}</p>}
      </div>

      <Section title="Scene recipe">
        <div className="flex flex-col gap-1">
          {PRODUCT_UI_PRESETS.map((preset) => {
            const Icon = sceneIcons[preset.id];
            const active = preset.id === content.scene;
            return (
              <button
                key={preset.id}
                onClick={() => loadScene(preset.id)}
                aria-pressed={active}
                title={preset.description}
                className={[
                  "flex items-center gap-2.5 rounded-lg border px-2.5 py-2 text-left transition-colors hover:bg-white/[0.06]",
                  active
                    ? "border-studio-accent"
                    : "border-transparent",
                ].join(" ")}
              >
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-studio-hover text-studio-text">
                  <Icon size={14} />
                </span>
                <span className="min-w-0 flex-1 text-[11.5px] font-medium leading-tight text-studio-text">
                  {preset.name}
                </span>
                <span className="rounded-full bg-white/[0.04] px-1.5 py-0.5 text-[9px] uppercase tracking-wide text-studio-muted">
                  {SCENE_TYPE_LABELS[preset.id]}
                </span>
              </button>
            );
          })}
        </div>
      </Section>

      <Section
        title="Background"
        action={
          content.format === "feature" ? (
            <button
              onClick={() => setShowBgModal(true)}
              title="Background Library"
              aria-label="Background Library"
              className="flex items-center justify-center w-6 h-6 rounded-md text-studio-muted hover:text-studio-text hover:bg-white/[0.06] transition-colors"
            >
              <Plus size={15} />
            </button>
          ) : undefined
        }
      >
        {content.format === "release" ? (
          <div className="flex items-center gap-2.5 rounded-lg bg-studio-hover px-2.5 py-2">
            <span className="h-8 w-8 rounded-md border-2 border-transparent bg-[#E5E3DF]" />
            <span className="min-w-0">
              <span className="block text-[11.5px] font-medium text-studio-text">Release gray</span>
              <span className="block text-[10px] text-studio-muted">#E5E3DF · fixed</span>
            </span>
          </div>
        ) : content.format === "blog" ? (
          <div className="flex gap-1.5 flex-wrap">
            {PRODUCT_UI_BLOG_BACKGROUND_COLORS.map((color) => {
              const active = (content.blogBackgroundColor ?? PRODUCT_UI_BLOG_BACKGROUND_COLORS[0]) === color;
              return (
                <button
                  key={color}
                  onClick={() => update({ blogBackgroundColor: color })}
                  aria-pressed={active}
                  title={`${BLOG_BACKGROUND_LABELS[color]} · ${color}`}
                  className={[
                    "w-8 h-8 rounded-md border-2 transition-transform hover:scale-110",
                    active ? "border-studio-accent" : "border-transparent",
                  ].join(" ")}
                  style={{
                    background: color,
                    boxShadow: active ? "0 0 0 1px var(--studio-sidebar)" : undefined,
                  }}
                />
              );
            })}
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-2">
            {[...BACKGROUNDS, ...customBackgrounds].slice(0, 6).map((background) => (
              <button
                key={background.id}
                onClick={() => update({ backgroundId: background.id })}
                title={background.label}
                className={[
                  "relative rounded-lg overflow-hidden aspect-video border-2 transition-colors",
                  content.backgroundId === background.id
                    ? "border-studio-accent"
                    : "border-transparent hover:border-studio-muted",
                ].join(" ")}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={background.url} alt="" className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        )}
      </Section>

      {showBgModal && content.format === "feature" && (
        <BackgroundPickerModal
          currentId={content.backgroundId}
          customBackgrounds={customBackgrounds}
          hiddenGroups={["industry"]}
          onSelect={(background) => update({ backgroundId: background.id })}
          onUpload={(background) => addCustomBackground(background)}
          onClose={() => setShowBgModal(false)}
        />
      )}

      <Section title="Copy">
        <Field label="Title" value={content.title} onChange={(title) => update({ title })} />
        <Field label="Eyebrow" value={content.eyebrow ?? ""} onChange={(eyebrow) => update({ eyebrow })} />
        <Field label="Primary text" value={content.primaryText ?? ""} onChange={(primaryText) => update({ primaryText })} multiline />
        <Field label="Secondary text" value={content.secondaryText ?? ""} onChange={(secondaryText) => update({ secondaryText })} />
        <div className="grid grid-cols-2 gap-2">
          <Field label="Metric A" value={content.metricA ?? ""} onChange={(metricA) => update({ metricA })} />
          <Field label="Metric B" value={content.metricB ?? ""} onChange={(metricB) => update({ metricB })} />
        </div>
      </Section>

      <Section title="Rows">
        {content.items.map((item) => (
          <ItemEditor
            key={item.id}
            item={item}
            onChange={(next) => updateItem(item.id, next)}
            onRemove={() => update({ items: content.items.filter((candidate) => candidate.id !== item.id) })}
          />
        ))}
        {content.items.length < 6 && (
          <button
            onClick={() =>
              update({
                items: [
                  ...content.items,
                  { id: nextId("row"), label: "New row", detail: "Optional detail", status: "neutral", value: "Queued" },
                ],
              })
            }
            className="inline-flex h-8 w-full items-center justify-center gap-1 rounded-md border border-dashed border-studio-border text-[11px] text-studio-muted transition-colors hover:border-studio-accent hover:text-studio-accent"
          >
            Add row
          </button>
        )}
      </Section>

      <Section title="Nodes">
        {content.nodes.map((node) => (
          <NodeEditor
            key={node.id}
            node={node}
            onChange={(next) => updateNode(node.id, next)}
            onRemove={() => update({ nodes: content.nodes.filter((candidate) => candidate.id !== node.id) })}
          />
        ))}
        {content.nodes.length < 4 && (
          <button
            onClick={() =>
              update({
                nodes: [
                  ...content.nodes,
                  { id: nextId("node"), title: "New node", detail: "Optional detail", status: "neutral", value: "" },
                ],
              })
            }
            className="inline-flex h-8 w-full items-center justify-center gap-1 rounded-md border border-dashed border-studio-border text-[11px] text-studio-muted transition-colors hover:border-studio-accent hover:text-studio-accent"
          >
            Add node
          </button>
        )}
      </Section>
      </div>
    </div>
  );
}
