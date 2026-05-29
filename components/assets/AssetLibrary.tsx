"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { LayoutList, LayoutGrid, Search, Trash2, Pencil } from "lucide-react";
import { useEditorStore } from "@/lib/store";
import type { SavedAsset } from "@/lib/store";

// ── Helpers ───────────────────────────────────────────────

export function timeAgo(ts: number): string {
  const diff = Date.now() - ts;
  const m = Math.floor(diff / 60000);
  const h = Math.floor(diff / 3600000);
  const d = Math.floor(diff / 86400000);
  if (m < 1)  return "Just now";
  if (m < 60) return `${m}m ago`;
  if (h < 24) return `${h}h ago`;
  if (d < 30) return `${d}d ago`;
  return new Date(ts).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

// ── Inline name editor ────────────────────────────────────

function EditableName({ value, onSave }: { value: string; onSave: (v: string) => void }) {
  const [editing, setEditing] = useState(false);
  const [draft,   setDraft]   = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);

  function start() { setDraft(value); setEditing(true); setTimeout(() => inputRef.current?.select(), 0); }
  function commit() { const v = draft.trim(); if (v) onSave(v); setEditing(false); }

  if (editing) {
    return (
      <input
        ref={inputRef}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => { if (e.key === "Enter") commit(); if (e.key === "Escape") setEditing(false); }}
        className="w-full px-2 py-0.5 rounded-md border border-studio-border bg-studio-hover outline-none text-studio-text text-sm"
      />
    );
  }
  return (
    <span
      onClick={start}
      title="Click to rename"
      className="cursor-text text-sm text-studio-muted hover:text-studio-text transition-colors truncate block"
    >
      {value}
    </span>
  );
}

// ── Row (list view) ───────────────────────────────────────

function AssetRow({ asset, onDelete, onRename, onEdit }: { asset: SavedAsset; onDelete: () => void; onRename: (v: string) => void; onEdit: () => void }) {
  return (
    <tr className="border-b border-studio-border">
      <td className="py-3 pr-4 w-[40%]">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-20 rounded-lg overflow-hidden shrink-0 bg-studio-hover" style={{ height: 52 }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={asset.previewDataUrl} alt={asset.name ?? asset.appName} className="w-full h-full object-cover" />
          </div>
          <div className="min-w-0 flex-1 overflow-hidden">
            <EditableName value={asset.name ?? asset.appName} onSave={onRename} />
          </div>
        </div>
      </td>
      <td className="py-3 pr-4 text-studio-muted text-sm">—</td>
      <td className="py-3 pr-4 text-studio-muted text-sm">{timeAgo(asset.savedAt)}</td>
      <td className="py-3 text-studio-muted text-sm">
        <div className="flex items-center justify-between gap-3">
          <span>{timeAgo(asset.savedAt)}</span>
          <div className="flex items-center gap-2">
            <button
              onClick={onEdit}
              title="Open in editor"
              className="p-1 rounded hover:bg-studio-hover text-studio-muted hover:text-studio-text transition-colors"
            >
              <Pencil size={13} />
            </button>
            <button
              onClick={onDelete}
              title="Delete"
              className="p-1 rounded hover:bg-studio-hover text-studio-muted hover:text-studio-text transition-colors"
            >
              <Trash2 size={13} />
            </button>
          </div>
        </div>
      </td>
    </tr>
  );
}

// ── Card (grid view) ──────────────────────────────────────

function AssetCard({ asset, onDelete, onRename, onEdit }: { asset: SavedAsset; onDelete: () => void; onRename: (v: string) => void; onEdit: () => void }) {
  const [hover, setHover] = useState(false);
  return (
    <div
      className="flex flex-col gap-2"
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      <div className="relative aspect-square rounded-lg overflow-hidden bg-studio-hover">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={asset.previewDataUrl} alt={asset.name ?? asset.appName} className="w-full h-full object-cover" />
        {hover && (
          <div className="absolute top-2 right-2 flex items-center gap-1">
            <button
              onClick={onEdit}
              title="Open in editor"
              className="w-7 h-7 rounded-lg bg-black/60 hover:bg-black/80 flex items-center justify-center transition-colors"
            >
              <Pencil size={13} className="text-white" />
            </button>
            <button
              onClick={onDelete}
              title="Delete"
              className="w-7 h-7 rounded-lg bg-black/60 hover:bg-black/80 flex items-center justify-center transition-colors"
            >
              <Trash2 size={13} className="text-white" />
            </button>
          </div>
        )}
      </div>
      <div>
        <p className="text-studio-text text-xs font-medium">
          <EditableName value={asset.name ?? asset.appName} onSave={onRename} />
        </p>
        <p className="text-studio-muted text-[11px] mt-0.5">{timeAgo(asset.savedAt)}</p>
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────

type Props = {
  title: string;
  mounted: boolean;
};

export function AssetLibrary({ title, mounted }: Props) {
  const { savedAssets, deleteSavedAsset, renameSavedAsset, setPendingAssetRestore } = useEditorStore();
  const router = useRouter();

  const [query,    setQuery]    = useState("");
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");

  function handleEdit(asset: SavedAsset) {
    setPendingAssetRestore(asset);
    router.push(`/editor/${asset.templateId}`);
  }

  const filtered = savedAssets.filter((a) =>
    a.appName.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="flex-1 flex flex-col min-h-0">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-studio-text font-semibold text-sm">{title}</h2>
        <div className="flex items-center gap-2">
          {/* Search */}
          <div className="flex items-center gap-2 px-3 h-8 rounded-lg border border-studio-border bg-studio-hover text-studio-muted text-xs">
            <Search size={13} />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search"
              className="bg-transparent outline-none text-studio-text placeholder:text-studio-muted w-32"
            />
          </div>
          {/* View toggle */}
          <div className="flex items-center gap-0.5 p-0.5 rounded-lg border border-studio-border bg-studio-hover">
            <button
              onClick={() => setViewMode("list")}
              className={["p-1.5 rounded-md transition-colors", viewMode === "list" ? "bg-studio-sidebar text-studio-text" : "text-studio-muted hover:text-studio-text"].join(" ")}
            >
              <LayoutList size={14} />
            </button>
            <button
              onClick={() => setViewMode("grid")}
              className={["p-1.5 rounded-md transition-colors", viewMode === "grid" ? "bg-studio-sidebar text-studio-text" : "text-studio-muted hover:text-studio-text"].join(" ")}
            >
              <LayoutGrid size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* Body */}
      {!mounted ? null : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center flex-1 gap-3 text-center py-20">
          <p className="text-studio-text text-sm font-medium">No saved files yet</p>
          <p className="text-studio-muted text-xs">Open a template and hit Save to add it here.</p>
        </div>
      ) : viewMode === "list" ? (
        <div className="overflow-y-auto flex-1">
          <table className="w-full table-fixed">
            <thead>
              <tr className="border-b border-studio-border">
                <th className="text-left text-xs text-studio-muted font-medium pb-2 pr-4 w-[58%]">Name</th>
                <th className="text-left text-xs text-studio-muted font-medium pb-2 pr-4 w-[8%]">Files</th>
                <th className="text-left text-xs text-studio-muted font-medium pb-2 pr-4 w-[14%]">Last modified</th>
                <th className="text-left text-xs text-studio-muted font-medium pb-2 w-[20%]">Created at</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((asset) => (
                <AssetRow key={asset.id} asset={asset} onDelete={() => deleteSavedAsset(asset.id)} onRename={(v) => renameSavedAsset(asset.id, v)} onEdit={() => handleEdit(asset)} />
              ))}
            </tbody>
          </table>
          <p className="text-studio-muted text-xs mt-4 text-right">
            1–{filtered.length} of {filtered.length}
          </p>
        </div>
      ) : (
        <div className="overflow-y-auto flex-1">
          <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-x-4 gap-y-6">
            {filtered.map((asset) => (
              <AssetCard key={asset.id} asset={asset} onDelete={() => deleteSavedAsset(asset.id)} onRename={(v) => renameSavedAsset(asset.id, v)} onEdit={() => handleEdit(asset)} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
