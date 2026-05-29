import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { Background } from "@/lib/backgrounds";

// ── Message Types ─────────────────────────────────────────

export type TextMessage = {
  id: string;
  type: "text";
  role: "user" | "bot";
  sender: string;
  text: string;
  avatar?: string;
};

export type ActionsMessage = {
  id: string;
  type: "actions";
  buttons: string[];
};

export type ProductItem = {
  img: string;
  name: string;
  sub: string;
  cta: string;
};

export type ProductsMessage = {
  id: string;
  type: "products";
  items: ProductItem[];
};

export type ChatMessage = TextMessage | ActionsMessage | ProductsMessage;

// ── Saved Asset ───────────────────────────────────────────

export type SavedAsset = {
  id: string;
  templateId: string;
  /** Display name shown in the library (derived from appName at save time) */
  appName: string;
  /** User-editable file name */
  name: string;
  /** Small JPEG data URL thumbnail (~20–50 KB) */
  previewDataUrl: string;
  savedAt: number;
  /** Full editor snapshot — present for assets saved after v1.1 */
  messages?: ChatMessage[];
  backgroundId?: string;
  layout?: "center" | "split";
  exportSize?: "desktop" | "mobile";
};

// ── Editor State ──────────────────────────────────────────

export type EditorState = {
  templateId: string;
  layout: "center" | "split";
  exportSize: "desktop" | "mobile";
  backgroundId: string;
  appName: string;
  messages: ChatMessage[];

  /** Backgrounds uploaded by the designer — persisted to localStorage */
  customBackgrounds: Background[];
  /** Saved assets shown in the Mobile Chat Finder library */
  savedAssets: SavedAsset[];

  // Actions
  setTemplateId: (id: string) => void;
  setLayout: (layout: "center" | "split") => void;
  setExportSize: (size: "desktop" | "mobile") => void;
  setBackgroundId: (id: string) => void;
  setAppName: (name: string) => void;
  addMessage: (msg: ChatMessage) => void;
  updateMessage: (id: string, msg: Partial<ChatMessage>) => void;
  removeMessage: (id: string) => void;
  setMessages: (msgs: ChatMessage[]) => void;
  addCustomBackground: (bg: Background) => void;
  saveAsset: (asset: SavedAsset) => void;
  deleteSavedAsset: (id: string) => void;
  renameSavedAsset: (id: string, name: string) => void;
  /** Transient — set before navigating to editor to restore a saved asset */
  pendingAssetRestore: SavedAsset | null;
  setPendingAssetRestore: (asset: SavedAsset | null) => void;
};

// ── Store ─────────────────────────────────────────────────

export const useEditorStore = create<EditorState>()(
  persist(
    (set) => ({
      templateId:        "feature-mockup",
      layout:            "center",
      exportSize:        "desktop",
      backgroundId:      "bg-1",
      appName:           "sendbird.ai",
      messages:          [],
      customBackgrounds:    [],
      savedAssets:          [],
      pendingAssetRestore:  null,

      setTemplateId:   (templateId)   => set({ templateId }),
      setLayout:       (layout)       => set({ layout }),
      setExportSize:   (exportSize)   => set({ exportSize }),
      setBackgroundId: (backgroundId) => set({ backgroundId }),
      setAppName:      (appName)      => set({ appName }),

      addMessage: (msg) =>
        set((s) => ({ messages: [...s.messages, msg] })),

      updateMessage: (id, partial) =>
        set((s) => ({
          messages: s.messages.map((m) =>
            m.id === id ? ({ ...m, ...partial } as ChatMessage) : m
          ),
        })),

      removeMessage: (id) =>
        set((s) => ({ messages: s.messages.filter((m) => m.id !== id) })),

      setMessages: (messages) => set({ messages }),

      addCustomBackground: (bg) =>
        set((s) => ({ customBackgrounds: [...s.customBackgrounds, bg] })),

      saveAsset: (asset) =>
        set((s) => ({ savedAssets: [asset, ...s.savedAssets] })),

      deleteSavedAsset: (id) =>
        set((s) => ({ savedAssets: s.savedAssets.filter((a) => a.id !== id) })),

      renameSavedAsset: (id, name) =>
        set((s) => ({
          savedAssets: s.savedAssets.map((a) => a.id === id ? { ...a, name } : a),
        })),

      setPendingAssetRestore: (pendingAssetRestore) => set({ pendingAssetRestore }),
    }),
    {
      name:    "sendbird-editor-v1",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        customBackgrounds: state.customBackgrounds,
        savedAssets:       state.savedAssets,
      }),
    },
  ),
);
