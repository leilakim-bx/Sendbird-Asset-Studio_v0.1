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
};

// ── Store ─────────────────────────────────────────────────

export const useEditorStore = create<EditorState>()(
  persist(
    (set) => ({
      templateId:        "feature-mockup",
      layout:            "split",
      exportSize:        "desktop",
      backgroundId:      "bg-1",
      appName:           "sendbird.ai",
      messages:          [],
      customBackgrounds: [],

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
    }),
    {
      name:    "sendbird-editor-v1",
      storage: createJSONStorage(() => localStorage),
      // Only persist custom backgrounds — all other state is re-seeded
      // from template defaults on mount (see EditorShell useEffect).
      partialize: (state) => ({ customBackgrounds: state.customBackgrounds }),
    },
  ),
);
