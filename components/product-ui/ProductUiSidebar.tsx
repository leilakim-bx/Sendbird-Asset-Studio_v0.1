"use client";

import { useState } from "react";
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
  type LucideIcon,
} from "lucide-react";
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
  "w-full bg-studio-sidebar border border-studio-border rounded-md px-2.5 py-1.5 text-xs text-studio-text placeholder:text-studio-muted focus:outline-none focus:ring-1 focus:ring-studio-accent transition-colors";

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

const FORMAT_OPTIONS: Array<{ id: ProductUiFormat; label: string }> = [
  { id: "feature", label: "Product feature" },
  { id: "release", label: "Product release" },
  { id: "blog", label: "Blog" },
];

const RELEASE_PURPOSE_OPTIONS: Array<{ id: ProductUiReleasePurpose; label: string }> = [
  { id: "thumbnail", label: "Thumbnail" },
  { id: "insert", label: "Insert image" },
];

const BLOG_BACKGROUND_LABELS: Record<(typeof PRODUCT_UI_BLOG_BACKGROUND_COLORS)[number], string> = {
  "#D9D6D2": "Stone",
  "#F7F5F0": "Warm gray",
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
      <span className="block text-[10px] text-studio-muted mb-1">{label}</span>
      {multiline ? (
        <textarea
          value={value}
          onChange={(event) => onChange(event.target.value)}
          rows={3}
          className={`${inputCls} resize-none min-h-16`}
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
    <div className="rounded-lg bg-studio-hover p-2.5 mb-2">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-[10px] text-studio-muted flex-1">Row</span>
        <button
          onClick={onRemove}
          className="w-5 h-5 rounded text-studio-muted hover:text-studio-text hover:bg-studio-border transition-colors"
          aria-label="Remove row"
          title="Remove row"
        >
          ×
        </button>
      </div>
      <Field label="Label" value={item.label} onChange={(label) => onChange({ ...item, label })} />
      <Field label="Detail" value={item.detail ?? ""} onChange={(detail) => onChange({ ...item, detail })} />
      <div className="grid grid-cols-2 gap-2">
        <label className="block">
          <span className="block text-[10px] text-studio-muted mb-1">Status</span>
          <select
            value={item.status ?? "neutral"}
            onChange={(event) => onChange({ ...item, status: event.target.value as ProductUiStatus })}
            className={inputCls}
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
    <div className="rounded-lg bg-studio-hover p-2.5 mb-2">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-[10px] text-studio-muted flex-1">Node</span>
        <button
          onClick={onRemove}
          className="w-5 h-5 rounded text-studio-muted hover:text-studio-text hover:bg-studio-border transition-colors"
          aria-label="Remove node"
          title="Remove node"
        >
          ×
        </button>
      </div>
      <Field label="Title" value={node.title} onChange={(title) => onChange({ ...node, title })} />
      <Field label="Detail" value={node.detail ?? ""} onChange={(detail) => onChange({ ...node, detail })} />
      <div className="grid grid-cols-2 gap-2">
        <label className="block">
          <span className="block text-[10px] text-studio-muted mb-1">Status</span>
          <select
            value={node.status ?? "neutral"}
            onChange={(event) => onChange({ ...node, status: event.target.value as ProductUiStatus })}
            className={inputCls}
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
    <div className="w-80 shrink-0 border-l border-studio-border bg-studio-sidebar overflow-y-auto">
      <Section
        title="Format"
        info={
          <InfoTooltip text="Product feature images are used on general product pages, such as product capabilities or industry pages." />
        }
      >
        <label className="relative block">
          <select
            value={content.format}
            onChange={(event) => update({ format: event.target.value as ProductUiFormat })}
            className="w-full appearance-none rounded-lg border border-studio-border bg-studio-hover px-3 py-2.5 pr-9 text-sm font-medium text-studio-text outline-none transition-colors hover:border-studio-muted focus:border-studio-accent focus:ring-1 focus:ring-studio-accent"
          >
            {FORMAT_OPTIONS.map((format) => (
              <option key={format.id} value={format.id}>
                {format.label}
              </option>
            ))}
          </select>
          <ChevronDown
            size={15}
            className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-studio-muted"
          />
        </label>
      </Section>

      {content.format === "release" && (
        <Section title="Release use">
          <div className="flex gap-1 p-0.5 bg-studio-hover rounded-lg">
            {RELEASE_PURPOSE_OPTIONS.map((purpose) => (
              <button
                key={purpose.id}
                onClick={() => update({ releasePurpose: purpose.id })}
                aria-pressed={(content.releasePurpose ?? "thumbnail") === purpose.id}
                className={[
                  "flex-1 text-xs py-1.5 rounded-md transition-colors",
                  (content.releasePurpose ?? "thumbnail") === purpose.id
                    ? "bg-studio-sidebar text-studio-text"
                    : "text-studio-muted hover:text-studio-text",
                ].join(" ")}
              >
                {purpose.label}
              </button>
            ))}
          </div>
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
        <div className="grid grid-cols-2 gap-1.5">
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
                  "flex items-center gap-2 rounded-lg border px-2.5 py-2 text-left transition-colors",
                  active
                    ? "border-studio-accent text-studio-text"
                    : "border-studio-border text-studio-muted hover:border-studio-muted hover:text-studio-text",
                ].join(" ")}
              >
                <Icon size={14} className="shrink-0" />
                <span className="min-w-0 text-[10px] font-medium leading-tight">{preset.name}</span>
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
          <p className="text-[11px] text-studio-muted leading-relaxed">
            Fixed to #E5E3DF for release images.
          </p>
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
            className="w-full py-1.5 rounded-md border border-dashed border-studio-border text-[11px] text-studio-muted hover:text-studio-accent hover:border-studio-accent transition-colors"
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
            className="w-full py-1.5 rounded-md border border-dashed border-studio-border text-[11px] text-studio-muted hover:text-studio-accent hover:border-studio-accent transition-colors"
          >
            Add node
          </button>
        )}
      </Section>
    </div>
  );
}
