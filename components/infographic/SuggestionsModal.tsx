"use client";

import { useMemo, useState } from "react";
import { Sparkles, X, Check } from "lucide-react";
import {
  INFOGRAPHIC_BG_HEX,
  type InfographicBg,
  type InfographicAccent,
  type InfographicContent,
} from "@/lib/types/infographic";
import { type Suggestion, suggestionToBlock } from "@/lib/ai/validate-suggestions";
import { WORK_DATA_SCHEMA_VERSION } from "@/lib/work-data-schema";
import { InfographicCanvas } from "./InfographicCanvas";

const THUMB_W = 140;
const CANVAS_W = 866;
const THUMB_SCALE = THUMB_W / CANVAS_W;

const TYPE_LABEL: Record<Suggestion["blockType"], string> = {
  stat: "Stat",
  "kpi-group": "KPI group",
  "bar-group": "Bar comparison",
  step: "Steps",
  "node-list": "Node list",
};

type Props = {
  open: boolean;
  suggestions: Suggestion[];
  bg: InfographicBg;
  accent: InfographicAccent;
  onClose: () => void;
  /** Called with the selected suggestions (in original order) on "Create". */
  onCreate: (selected: Suggestion[]) => void;
};

export function SuggestionsModal({ open, suggestions, bg, accent, onClose, onCreate }: Props) {
  const [selected, setSelected] = useState<boolean[]>(() => suggestions.map(() => true));

  // Reset selection to "all selected" when a new result set arrives — done
  // during render (not in an effect) by comparing the previous suggestions ref.
  const [seen, setSeen] = useState(suggestions);
  if (seen !== suggestions) {
    setSeen(suggestions);
    setSelected(suggestions.map(() => true));
  }

  // Build a thumbnail content per suggestion once (stable block ids for keys).
  const thumbs = useMemo<InfographicContent[]>(
    () =>
      suggestions.map((s) => ({
        schemaVersion: WORK_DATA_SCHEMA_VERSION,
        format: "product",
        bg,
        accent,
        title: s.suggestedTitle,
        blocks: [suggestionToBlock(s)],
      })),
    [suggestions, bg, accent],
  );

  if (!open) return null;

  const empty = suggestions.length === 0;
  const selectedCount = selected.filter(Boolean).length;

  function toggle(i: number) {
    setSelected((prev) => prev.map((v, j) => (j === i ? !v : v)));
  }

  function handleCreate() {
    const picked = suggestions.filter((_, i) => selected[i]);
    if (picked.length === 0) return;
    onCreate(picked);
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/65 p-10"
      onClick={onClose}
    >
      <div
        className="flex w-full max-w-[720px] max-h-[90vh] flex-col overflow-hidden rounded-2xl border border-studio-border bg-studio-sidebar"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center gap-2 border-b border-studio-border px-[22px] py-[18px]">
          <Sparkles size={18} className="text-studio-accent shrink-0" />
          <h2
            className="flex-1 text-xl font-medium text-studio-text"
          >
            {empty
              ? "No infographics found"
              : `AI found ${suggestions.length} infographic${suggestions.length === 1 ? "" : "s"} in your article`}
          </h2>
          <button
            onClick={onClose}
            className="flex h-[30px] w-[30px] items-center justify-center rounded-md text-studio-muted hover:bg-studio-hover hover:text-studio-text transition-colors"
            title="Close"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-[22px] py-4">
          {empty ? (
            <p className="text-sm text-studio-muted leading-relaxed py-6 text-center">
              AI couldn&apos;t find clear data points in this article.
              <br />
              Try editing manually with presets instead.
            </p>
          ) : (
            <>
              <p className="mb-3.5 text-xs text-studio-muted leading-relaxed">
                Select which infographics to create. Each is based on a specific part of your
                article — you can edit them after.
              </p>

              {suggestions.map((s, i) => {
                const isSel = selected[i];
                return (
                  <div
                    key={i}
                    onClick={() => toggle(i)}
                    className={[
                      "mb-2 grid cursor-pointer items-start gap-3.5 rounded-[10px] border p-3.5 transition-colors",
                      isSel
                        ? "border-studio-accent bg-studio-accent/[0.04]"
                        : "border-studio-border hover:border-studio-muted",
                    ].join(" ")}
                    style={{ gridTemplateColumns: "18px 140px 1fr" }}
                  >
                    {/* Checkbox */}
                    <div
                      className={[
                        "mt-0.5 flex h-[18px] w-[18px] items-center justify-center rounded-[5px] border",
                        isSel
                          ? "border-studio-accent bg-studio-accent text-black"
                          : "border-studio-border text-transparent",
                      ].join(" ")}
                    >
                      <Check size={12} strokeWidth={3} />
                    </div>

                    {/* Thumbnail — real canvas, scaled down */}
                    <div
                      className="overflow-hidden rounded-[5px]"
                      style={{
                        width: THUMB_W,
                        aspectRatio: `${CANVAS_W} / 660`,
                        background: INFOGRAPHIC_BG_HEX[bg],
                      }}
                    >
                      <div style={{ width: CANVAS_W, height: 660, transform: `scale(${THUMB_SCALE})`, transformOrigin: "top left" }}>
                        <InfographicCanvas content={thumbs[i]} />
                      </div>
                    </div>

                    {/* Info */}
                    <div className="min-w-0 text-xs text-studio-text">
                      <div className="mb-1 text-[13px] font-semibold text-studio-text truncate">
                        {s.suggestedTitle || TYPE_LABEL[s.blockType]}
                      </div>
                      <div className="mb-1.5 inline-block rounded bg-white/5 px-1.5 py-0.5 text-[9px] uppercase tracking-wider text-studio-muted">
                        {TYPE_LABEL[s.blockType]}
                      </div>
                      <div className="border-l-2 border-studio-border pl-2 text-[10.5px] italic leading-snug text-studio-muted">
                        {s.sourceQuote}
                      </div>
                    </div>
                  </div>
                );
              })}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center gap-2.5 border-t border-studio-border px-[22px] py-3.5">
          <div className="flex-1 text-xs text-studio-muted">
            {!empty && `${selectedCount} of ${suggestions.length} selected`}
          </div>
          <button
            onClick={onClose}
            className="rounded-full border border-studio-border bg-studio-sidebar px-5 py-2 text-[13px] font-medium text-studio-text hover:bg-studio-hover transition-colors"
          >
            {empty ? "Close" : "Cancel"}
          </button>
          {!empty && (
            <button
              onClick={handleCreate}
              disabled={selectedCount === 0}
              className="flex items-center gap-1.5 rounded-full bg-studio-accent px-5 py-2 text-[13px] font-semibold text-studio-accent-fg hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Sparkles size={13} />
              Create {selectedCount > 0 ? selectedCount : ""} selected
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
