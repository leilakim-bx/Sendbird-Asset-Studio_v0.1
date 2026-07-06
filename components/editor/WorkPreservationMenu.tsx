"use client";

import { useMemo, useRef, useState } from "react";
import { Download, RotateCcw, Settings, Upload, X } from "lucide-react";
import { Menu } from "@base-ui/react/menu";
import type { WorkDataKind } from "@/lib/work-data-schema";
import {
  backupFilename,
  createBackupFilePayload,
  listWorkSnapshots,
  parseBackupFileText,
  preserveWorkSnapshot,
  type WorkSnapshot,
} from "@/lib/work-preservation";
import {
  listRemoteWorkSnapshots,
  saveRemoteWorkSnapshot,
} from "@/lib/work-remote-backup";

type WorkPreservationMenuProps<T extends object> = {
  kind: WorkDataKind;
  templateId: string;
  currentData: T;
  onRestore: (data: T) => void;
};

type RestorableSnapshot<T> = WorkSnapshot<T> & {
  source: "local" | "remote";
};

function formatSnapshotTime(createdAt: number) {
  return new Date(createdAt).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function WorkPreservationMenu<T extends object>({
  kind,
  templateId,
  currentData,
  onRestore,
}: WorkPreservationMenuProps<T>) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [restoreOpen, setRestoreOpen] = useState(false);
  const [snapshots, setSnapshots] = useState<RestorableSnapshot<T>[]>([]);
  const [loadingRemote, setLoadingRemote] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const newestSnapshotId = useMemo(() => snapshots[0]?.id ?? null, [snapshots]);

  function mergeSnapshots(
    localSnapshots: WorkSnapshot<T>[],
    remoteSnapshots: WorkSnapshot<T>[],
  ): RestorableSnapshot<T>[] {
    const byId = new Map<string, RestorableSnapshot<T>>();

    remoteSnapshots.forEach((snapshot) => {
      byId.set(snapshot.id, { ...snapshot, source: "remote" });
    });

    localSnapshots.forEach((snapshot) => {
      byId.set(snapshot.id, { ...snapshot, source: "local" });
    });

    return Array.from(byId.values()).sort((a, b) => b.createdAt - a.createdAt);
  }

  async function refreshSnapshots() {
    const localSnapshots = listWorkSnapshots<T>(kind, templateId);
    setSnapshots(mergeSnapshots(localSnapshots, []));
    setLoadingRemote(true);
    try {
      const remoteSnapshots = await listRemoteWorkSnapshots<T>(kind, templateId);
      setSnapshots(mergeSnapshots(localSnapshots, remoteSnapshots));
    } finally {
      setLoadingRemote(false);
    }
  }

  function openRestore() {
    void refreshSnapshots();
    setStatus(null);
    setError(null);
    setRestoreOpen(true);
  }

  function preserveCurrentVersion() {
    const snapshot = preserveWorkSnapshot(kind, templateId, currentData);
    if (snapshot) void saveRemoteWorkSnapshot(snapshot);
  }

  function handleSaveBackupFile() {
    setStatus(null);
    setError(null);
    try {
      const exportedAt = Date.now();
      const payload = createBackupFilePayload(kind, templateId, currentData, exportedAt);
      const blob = new Blob([JSON.stringify(payload, null, 2)], {
        type: "application/octet-stream",
      });
      const href = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = href;
      link.download = backupFilename(kind, exportedAt);
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(href);
      setStatus("Backup file saved.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save the backup file.");
    }
  }

  async function handleLoadBackupFile(file: File | undefined) {
    if (!file) return;
    setStatus(null);
    setError(null);
    try {
      const text = await file.text();
      const backup = parseBackupFileText<T>(kind, text);
      preserveCurrentVersion();
      onRestore(backup.data);
      void refreshSnapshots();
      setStatus("Backup loaded.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load the backup file.");
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  function handleRestore(snapshot: RestorableSnapshot<T>) {
    preserveCurrentVersion();
    onRestore(snapshot.data);
    void refreshSnapshots();
    setRestoreOpen(false);
    setStatus("Previous version restored.");
  }

  return (
    <>
      <Menu.Root>
        <Menu.Trigger
          title="Settings"
          className="p-1.5 rounded-md text-studio-muted hover:text-studio-text hover:bg-studio-hover transition-colors"
        >
          <Settings size={15} />
        </Menu.Trigger>
        <Menu.Portal>
          <Menu.Positioner side="bottom" align="end" sideOffset={8}>
            <Menu.Popup className="z-50 min-w-[230px] rounded-xl border border-studio-border bg-studio-sidebar shadow-xl py-2 outline-none origin-top data-[ending-style]:animate-out data-[ending-style]:fade-out-0 data-[ending-style]:zoom-out-95 data-[starting-style]:animate-in data-[starting-style]:fade-in-0 data-[starting-style]:zoom-in-95 duration-100">
              <div className="px-3 pb-2 pt-1 text-[11px] font-bold uppercase tracking-wider text-studio-muted">
                Settings
              </div>
              <Menu.Item
                onClick={openRestore}
                className="flex items-center gap-3 px-3 py-2.5 text-sm text-studio-text hover:bg-studio-hover cursor-default outline-none rounded-lg mx-1"
              >
                <RotateCcw size={15} className="text-studio-muted" />
                Restore previous version
              </Menu.Item>
              <Menu.Item
                onClick={handleSaveBackupFile}
                className="flex items-center gap-3 px-3 py-2.5 text-sm text-studio-text hover:bg-studio-hover cursor-default outline-none rounded-lg mx-1"
              >
                <Download size={15} className="text-studio-muted" />
                Save backup file
              </Menu.Item>
              <Menu.Item
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-3 px-3 py-2.5 text-sm text-studio-text hover:bg-studio-hover cursor-default outline-none rounded-lg mx-1"
              >
                <Upload size={15} className="text-studio-muted" />
                Load backup
              </Menu.Item>
            </Menu.Popup>
          </Menu.Positioner>
        </Menu.Portal>
      </Menu.Root>

      <input
        ref={fileInputRef}
        type="file"
        accept=".assetbackup,application/octet-stream,application/json"
        className="hidden"
        onChange={(event) => void handleLoadBackupFile(event.target.files?.[0])}
      />

      {(status || error) && !restoreOpen ? (
        <div className="fixed right-4 top-14 z-50 max-w-xs rounded-xl border border-studio-border bg-studio-sidebar px-3 py-2 text-xs shadow-xl">
          <p className={error ? "text-red-400" : "text-studio-text"}>{error ?? status}</p>
        </div>
      ) : null}

      {restoreOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl border border-studio-border bg-studio-sidebar shadow-xl">
            <div className="flex items-start justify-between gap-4 border-b border-studio-border px-5 py-4">
              <div>
                <h2 className="text-base font-semibold text-studio-text">Restore previous version</h2>
                <p className="mt-1 text-xs text-studio-muted">
                  Studio saves the current version before restoring.
                </p>
              </div>
              <button
                onClick={() => setRestoreOpen(false)}
                title="Close"
                className="rounded-md p-1 text-studio-muted hover:bg-studio-hover hover:text-studio-text"
              >
                <X size={16} />
              </button>
            </div>

            <div className="max-h-[360px] overflow-auto p-3">
              {snapshots.length === 0 ? (
                <div className="rounded-xl border border-dashed border-studio-border px-4 py-8 text-center text-sm text-studio-muted">
                  {loadingRemote ? "Checking cloud backups…" : "No previous versions yet."}
                </div>
              ) : (
                <div className="space-y-2">
                  {snapshots.map((snapshot) => (
                    <button
                      key={`${snapshot.source}-${snapshot.id}`}
                      onClick={() => handleRestore(snapshot)}
                      className="flex w-full items-center justify-between gap-3 rounded-xl border border-studio-border bg-studio-hover/30 px-3 py-3 text-left hover:bg-studio-hover"
                    >
                      <span>
                        <span className="block text-sm font-medium text-studio-text">
                          {formatSnapshotTime(snapshot.createdAt)}
                        </span>
                        {snapshot.id === newestSnapshotId ? (
                          <span className="text-xs text-studio-muted">Latest automatic backup</span>
                        ) : (
                          <span className="text-xs text-studio-muted">Automatic backup</span>
                        )}
                      </span>
                      <span className="rounded-md bg-studio-accent px-2 py-1 text-xs font-semibold text-studio-accent-fg">
                        Restore
                      </span>
                    </button>
                  ))}
                  {loadingRemote ? (
                    <div className="px-3 py-2 text-xs text-studio-muted">
                      Checking cloud backups…
                    </div>
                  ) : null}
                </div>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
