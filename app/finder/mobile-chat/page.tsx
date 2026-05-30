"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useEditorStore } from "@/lib/store";
import type { SavedAsset } from "@/lib/store";
import { Pencil, Trash2 } from "lucide-react";

function shortDate(ts: number): string {
  return new Date(ts).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function EditableName({ value, onSave }: { value: string; onSave: (v: string) => void }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
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
        className="w-full px-2 py-0.5 rounded-md border border-studio-border bg-studio-hover outline-none text-studio-text text-xs"
      />
    );
  }
  return (
    <span
      onClick={start}
      title="Click to rename"
      className="cursor-text hover:text-studio-text transition-colors truncate block"
    >
      {value}
    </span>
  );
}

function AssetCard({ asset, onDelete, onRename, onEdit }: { asset: SavedAsset; onDelete: () => void; onRename: (v: string) => void; onEdit: () => void }) {
  const [hover, setHover] = useState(false);

  return (
    <div
      className="flex flex-col gap-2"
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      {/* Square thumbnail */}
      <div className="relative aspect-square rounded-lg overflow-hidden bg-studio-hover">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={asset.previewDataUrl}
          alt={asset.name}
          className="w-full h-full object-cover"
        />
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

      {/* Meta */}
      <div>
        <p className="text-studio-text text-xs font-medium truncate">
          <EditableName value={asset.name ?? asset.appName} onSave={onRename} />
        </p>
        <p className="text-studio-muted text-[11px] mt-0.5">{shortDate(asset.savedAt)}</p>
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-24 gap-3 text-center">
      <p className="text-studio-text text-sm font-medium">No saved assets yet</p>
      <p className="text-studio-muted text-xs leading-relaxed max-w-[220px]">
        Open a Feature Mockup and hit <strong className="text-studio-text font-medium">Save</strong> to add it here.
      </p>
    </div>
  );
}

export default function ChatUIFinderPage() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const router = useRouter();
  const { savedAssets, deleteSavedAsset, renameSavedAsset, setPendingAssetRestore } = useEditorStore();

  function handleEdit(asset: SavedAsset) {
    setPendingAssetRestore(asset);
    router.push(`/editor/${asset.templateId}`);
  }

  return (
    <div className="p-8">
      <h2 className="text-xl font-semibold text-studio-text mb-6">Chat UI Finder</h2>

      {!mounted ? null : savedAssets.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-x-4 gap-y-6">
          {savedAssets.map((asset) => (
            <AssetCard
              key={asset.id}
              asset={asset}
              onDelete={() => deleteSavedAsset(asset.id)}
              onRename={(v) => renameSavedAsset(asset.id, v)}
              onEdit={() => handleEdit(asset)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
