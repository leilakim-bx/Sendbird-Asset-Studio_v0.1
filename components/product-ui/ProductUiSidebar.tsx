"use client";

import { useState } from "react";
import {
  Bot,
  GitBranch,
  History,
  ListChecks,
  MessageSquareText,
  Sparkles,
  Split,
  Table2,
  Workflow,
  type LucideIcon,
} from "lucide-react";
import { useEditorStore } from "@/lib/store";
import { BACKGROUNDS } from "@/lib/backgrounds";
import {
  PRODUCT_UI_SCENE_LABELS,
  PRODUCT_UI_STATUS_LABELS,
  type ProductUiContent,
  type ProductUiItem,
  type ProductUiNode,
  type ProductUiScene,
  type ProductUiStatus,
} from "@/lib/types/product-ui";
import { PRODUCT_UI_PRESETS, cloneProductUiContent, getProductUiPreset } from "@/lib/product-ui-presets";
import { Section } from "@/components/infographic/sidebar/Section";
import { AiMagicButton } from "@/components/ui/ai-magic-button";

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

function draftFromPrompt(prompt: string, current: ProductUiContent): ProductUiContent {
  const lower = prompt.toLowerCase();
  let scene: ProductUiScene = current.scene;
  if (lower.includes("review") || lower.includes("oversight") || lower.includes("policy")) scene = "review-queue";
  else if (lower.includes("test") || lower.includes("evaluate") || lower.includes("validation")) scene = "test-results";
  else if (lower.includes("traffic") || lower.includes("rollout")) scene = "traffic-allocation";
  else if (lower.includes("workflow") || lower.includes("proactive") || lower.includes("trigger")) scene = "workflow";
  else if (lower.includes("version") || lower.includes("prompt")) scene = "version-history";
  else if (lower.includes("steward") || lower.includes("approval")) scene = "steward-detail";
  else if (lower.includes("a/b") || lower.includes("ab test") || lower.includes("experiment")) scene = "ab-test";
  else if (lower.includes("response") || lower.includes("source") || lower.includes("reply")) scene = "ai-response";

  const preset = cloneProductUiContent(getProductUiPreset(scene).content);
  const clean = prompt.trim().replace(/\s+/g, " ");
  if (!clean) return preset;

  return {
    ...preset,
    title: preset.title,
    primaryText:
      scene === "ai-response"
        ? `Hi, I've checked the policy and prepared the safest response: ${clean.slice(0, 140)}`
        : preset.primaryText,
    secondaryText:
      scene === "review-queue" || scene === "test-results"
        ? "Generated from launch note"
        : preset.secondaryText,
  };
}

export function ProductUiSidebar() {
  const { productUiContent: content, setProductUiContent } = useEditorStore();
  const [prompt, setPrompt] = useState("");
  const [notice, setNotice] = useState<string | null>(null);

  if (!content) return null;
  const activeContent = content;

  function update(patch: Partial<ProductUiContent>) {
    setProductUiContent({ ...activeContent, ...patch } as ProductUiContent);
  }

  function loadScene(scene: ProductUiScene) {
    setProductUiContent(cloneProductUiContent(getProductUiPreset(scene).content));
    setNotice(null);
  }

  function applyDraft() {
    const drafted = draftFromPrompt(prompt, activeContent);
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
      <div className="m-4 rounded-xl p-3.5 border border-studio-border bg-white/[0.02]">
        <div className="flex items-center gap-1.5 mb-2.5">
          <span className="w-6 h-6 rounded-md shrink-0 flex items-center justify-center bg-studio-hover">
            <Sparkles size={13} className="text-studio-text" fill="currentColor" />
          </span>
          <span className="text-xs font-semibold text-studio-text tracking-tight">Create with AI</span>
        </div>
        <textarea
          value={prompt}
          onChange={(event) => setPrompt(event.target.value)}
          placeholder="Describe the product moment..."
          rows={4}
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

      <Section title="Format">
        <div className="flex items-center gap-1 p-1 rounded-lg bg-[#0E0E0E]">
          {[
            { id: "product" as const, label: "Product feature", size: "866×660" },
          ].map((format) => (
            <button
              key={format.id}
              onClick={() => update({ format: format.id })}
              aria-pressed={content.format === format.id}
              className={[
                "flex-1 flex items-center justify-center gap-2 px-2 py-1.5 rounded-md text-[11px] font-medium transition-colors",
                content.format === format.id ? "bg-studio-hover text-studio-text" : "text-studio-muted hover:text-studio-text",
              ].join(" ")}
            >
              <span>{format.label}</span>
              <span className="text-[10px] text-studio-muted tabular-nums">{format.size}</span>
            </button>
          ))}
        </div>
      </Section>

      <Section title="Composition">
        <div className="grid grid-cols-3 gap-1.5">
          {[
            { id: "photo-card" as const, label: "Photo" },
            { id: "plain-stage" as const, label: "Stage" },
            { id: "wide-system" as const, label: "System" },
          ].map((composition) => (
            <button
              key={composition.id}
              onClick={() => update({ composition: composition.id })}
              aria-pressed={content.composition === composition.id}
              className={[
                "rounded-lg border px-2 py-2 text-[10px] font-medium transition-colors",
                content.composition === composition.id
                  ? "border-studio-accent text-studio-text"
                  : "border-studio-border text-studio-muted hover:border-studio-muted hover:text-studio-text",
              ].join(" ")}
            >
              {composition.label}
            </button>
          ))}
        </div>
      </Section>

      <Section title="Background">
        <div className="grid grid-cols-5 gap-1.5">
          {BACKGROUNDS.slice(0, 15).map((background) => (
            <button
              key={background.id}
              onClick={() => update({ backgroundId: background.id })}
              title={background.label}
              className={[
                "h-9 rounded-md border-2 overflow-hidden transition-transform hover:scale-105",
                content.backgroundId === background.id ? "border-studio-accent" : "border-transparent",
              ].join(" ")}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={background.url} alt="" className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      </Section>

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
