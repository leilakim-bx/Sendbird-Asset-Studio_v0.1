import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { Background } from "@/lib/backgrounds";
import { getRandomUserProfile, getAvatarForName } from "@/lib/avatar";
import type {
  InfographicContent,
  InfographicFormat,
  InfographicBg,
  InfographicAccent,
  InfographicBlock,
} from "@/lib/types/infographic";

// ── Block types (콘텐츠 페이로드) ─────────────────────────

export type TextBlock    = {
  type: "text";
  text: string;
  /**
   * Optional internal AI activity / verification lines, rendered inside the
   * bot bubble as a footer ("AI agent activity log"). Bot messages only.
   */
  verifications?: string[];
  /**
   * Optional action buttons, rendered below the text inside the bot bubble
   * (an add-on, like `verifications`). Bot messages only — by convention, not
   * type: a user message carrying `buttons` simply doesn't render them.
   */
  buttons?: string[];
};
/** Standalone action buttons (buttons-only). For text + buttons in one bubble,
 *  use TextBlock.buttons instead. */
export type ActionsBlock = { type: "actions";  buttons: string[] };
export type ProductsBlock = { type: "products"; items: ProductItem[] };

export type ChecklistItem = {
  id: string;
  label: string;
  status: "done" | "in-progress" | "pending";
  /** Optional short channel tag shown as a pill, e.g. "API", "SMS" */
  badge?: string;
};
export type ChecklistBlock = { type: "checklist"; items: ChecklistItem[] };

export type StatusBlock = {
  type: "status";
  label: string;
  variant: "success" | "warning";
};

export type VoiceBlock = {
  type: "voice";
  /** Visual layout of the voice card */
  style: "quote" | "player";
  /** The spoken line / transcript */
  transcript: string;
  /** Small caption under the transcript (quote style) */
  caption?: string;
  /** Bold eyebrow label above the transcript (player style) */
  eyebrow?: string;
};

/** Curated icon keys for itinerary rows. UI maps these to lucide icons in
 *  components/templates/itinerary-icons.tsx. */
export type ItineraryIcon =
  | "lodging" | "dining" | "activity" | "sightseeing"
  | "flight" | "transport" | "place" | "time";

export type ItineraryItem = {
  id: string;
  icon: ItineraryIcon;
  title: string;
  /** Optional second line, e.g. place / time */
  sub?: string;
};
export type ItineraryGroup = {
  id: string;
  /** Free-text section header, e.g. "MON", "Day 1", "Morning" */
  label: string;
  items: ItineraryItem[];
};
/** A grouped schedule card (day-grouped rows + optional footer CTA). Distinct
 *  from checklist (task progress): this is an agenda/itinerary. Bot only. */
export type ItineraryBlock = {
  type: "itinerary";
  groups: ItineraryGroup[];
  /** Optional footer button label (rendered black, inside the card). */
  cta?: string;
};

export type Block = TextBlock | ActionsBlock | ProductsBlock | ChecklistBlock | StatusBlock | VoiceBlock | ItineraryBlock;

// ── Product item ──────────────────────────────────────────

export type ProductItem = {
  img: string;
  name: string;
  sub: string;
  cta: string;
  imageQuery?: string; // Pexels search term (separate from display name)
};

// ── Unified message types ─────────────────────────────────

/** User는 텍스트 블록만 전송 가능 */
export type UserMessage = {
  id: string;
  role: "user";
  sender: string;
  avatar?: string;
  block: TextBlock;
};

/** Bot은 모든 블록 타입 전송 가능 */
export type BotMessage = {
  id: string;
  role: "bot";
  sender: string;
  avatar?: string;
  block: Block;
};

export type ChatMessage = UserMessage | BotMessage;

/** updateMessage에 전달하는 부분 업데이트 타입 */
export type MessagePatch = {
  role?: "user" | "bot";
  sender?: string;
  avatar?: string;
  block?: Block;
};

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
  /** User profile snapshot — present for assets saved after v1.2 */
  userName?: string;
  userAvatarUrl?: string;
  /** Infographic content snapshot — present for infographic assets (v1.3+) */
  infographic?: InfographicContent;
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
  /** Saved assets shown in the library */
  savedAssets: SavedAsset[];

  // Actions
  setTemplateId: (id: string) => void;
  setLayout: (layout: "center" | "split") => void;
  setExportSize: (size: "desktop" | "mobile") => void;
  setBackgroundId: (id: string) => void;
  setAppName: (name: string) => void;
  addMessage: (msg: ChatMessage) => void;
  updateMessage: (id: string, patch: MessagePatch) => void;
  removeMessage: (id: string) => void;
  setMessages: (msgs: ChatMessage[]) => void;
  addCustomBackground: (bg: Background) => void;
  saveAsset: (asset: SavedAsset) => void;
  deleteSavedAsset: (id: string) => void;
  renameSavedAsset: (id: string, name: string) => void;
  /** Transient — set before navigating to editor to restore a saved asset */
  pendingAssetRestore: SavedAsset | null;
  setPendingAssetRestore: (asset: SavedAsset | null) => void;

  // ── User profile (randomised per session) ───────────────
  userName: string;
  userAvatarUrl: string;
  userProfileSeed: number;
  setUserName: (name: string) => void;
  shuffleUserProfile: () => void;

  // ── Active scenario (non-persisted) ─────────────────────
  /** FormPanel에서 선택된 시나리오 ID — export 파일명에 사용 */
  activeScenarioId: string | null;
  setActiveScenarioId: (id: string | null) => void;

  // ── Migration warning (non-persisted) ───────────────────
  /** 마이그레이션 중 skip된 에셋 수. >0 이면 앱 진입 시 토스트 표시 */
  migrationSkipCount: number;
  clearMigrationWarning: () => void;

  // ── Canvas capacity (non-persisted) ─────────────────────
  /** 모바일 캔버스 하단 48px 여백 기준, 콘텐츠가 꽉 찼는지 여부 */
  canvasIsFull: boolean;
  setCanvasIsFull: (isFull: boolean) => void;

  // ── Infographic template (non-persisted session state) ──
  /** Seeded from the infographic template's defaultContent on editor mount. */
  infographicContent: InfographicContent | null;
  setInfographicContent: (content: InfographicContent) => void;
  setInfographicFormat: (format: InfographicFormat) => void;
  setInfographicBg: (bg: InfographicBg) => void;
  setInfographicAccent: (accent: InfographicAccent) => void;
  setInfographicTitle: (title: string) => void;
  setInfographicFootnote: (footnote: string) => void;
  setInfographicShowTitle: (show: boolean) => void;
  addInfographicBlock: (block: InfographicBlock) => void;
  updateInfographicBlock: (id: string, block: InfographicBlock) => void;
  removeInfographicBlock: (id: string) => void;
};

// ── v0 → v1 마이그레이션 ──────────────────────────────────

/** migrate() 실행 중 skip 수를 onRehydrateStorage로 전달하기 위한 임시 변수 */
let _migrationSkips = 0;

/** 구/신 포맷 메시지를 모두 ChatMessage로 변환. 알 수 없는 포맷은 null 반환 */
function convertMessage(raw: unknown): ChatMessage | null {
  if (typeof raw !== "object" || raw === null) return null;
  const m = raw as Record<string, unknown>;
  if (typeof m.id !== "string") return null;

  // ── 이미 새 포맷 (block 필드 존재) ──────────────────────
  if (typeof m.block === "object" && m.block !== null) {
    const blk = m.block as { type?: string };
    // 이전에 user + products/actions 잘못 저장된 케이스 → role을 bot으로 교정
    if (m.role === "user" && blk.type !== "text") {
      return { ...(m as object), role: "bot" } as BotMessage;
    }
    return raw as ChatMessage;
  }

  // ── 구 포맷 (type 필드가 최상위에 존재) ─────────────────
  const id     = m.id as string;
  const sender = typeof m.sender === "string" ? m.sender : "bot";
  const avatar = typeof m.avatar === "string" ? m.avatar : undefined;
  const base   = { id, sender, ...(avatar && { avatar }) };

  if (m.type === "text" && typeof m.text === "string") {
    const role: "user" | "bot" = m.role === "user" ? "user" : "bot";
    return { ...base, role, block: { type: "text", text: m.text } } as ChatMessage;
  }
  if (m.type === "actions" && Array.isArray(m.buttons)) {
    return {
      ...base, role: "bot",
      block: { type: "actions", buttons: m.buttons as string[] },
    };
  }
  if (m.type === "products" && Array.isArray(m.items)) {
    return {
      ...base, role: "bot",
      block: { type: "products", items: m.items as ProductItem[] },
    };
  }

  return null; // 알 수 없는 포맷 → skip
}

type PersistedV1 = { customBackgrounds: Background[]; savedAssets: SavedAsset[] };

function migrateV0toV1(raw: unknown): PersistedV1 {
  const state = (raw ?? {}) as Record<string, unknown>;

  // 1. 원본 데이터를 별도 키에 백업
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem("sendbird-editor-v1-backup", JSON.stringify(state));
    } catch {
      // localStorage 쿼터 초과 시 조용히 무시
    }
  }

  _migrationSkips = 0;
  const savedAssets: SavedAsset[] = [];

  for (const a of (Array.isArray(state.savedAssets) ? state.savedAssets : [])) {
    try {
      if (typeof a !== "object" || a === null ||
          typeof (a as Record<string, unknown>).id !== "string") {
        console.warn("[migrate v0→v1] 에셋 구조 불명 — skip:", a);
        _migrationSkips++;
        continue;
      }
      const asset = a as Record<string, unknown>;

      // messages 배열이 있으면 각 메시지 변환
      const messages = Array.isArray(asset.messages)
        ? asset.messages.reduce<ChatMessage[]>((acc, msg) => {
            const converted = convertMessage(msg);
            if (!converted) {
              console.warn("[migrate v0→v1] 메시지 형식 불명 — skip:", msg);
            } else {
              acc.push(converted);
            }
            return acc;
          }, [])
        : undefined;

      savedAssets.push({
        ...(asset as SavedAsset),
        ...(messages !== undefined && { messages }),
      });
    } catch (err) {
      console.warn("[migrate v0→v1] 에셋 처리 중 오류 — skip:", err);
      _migrationSkips++;
    }
  }

  return {
    customBackgrounds: Array.isArray(state.customBackgrounds)
      ? (state.customBackgrounds as Background[])
      : [],
    savedAssets,
  };
}

// ── Store ─────────────────────────────────────────────────

export const useEditorStore = create<EditorState>()(
  persist(
    (set) => ({
      templateId:        "feature-mockup",
      layout:            "center",
      exportSize:        "desktop",
      backgroundId:      "bg-200",
      appName:           "delight.ai",
      messages:          [],
      customBackgrounds: [],
      savedAssets:       [],
      pendingAssetRestore: null,

      // User profile — populated by EditorShell on mount
      userName:        "",
      userAvatarUrl:   "",
      userProfileSeed: 0,

      // Active scenario — transient, never persisted.
      // Default scenario id (kept in sync with scenarios.ts DEFAULT_SCENARIO_ID;
      // hardcoded here to avoid a store↔scenarios circular import).
      activeScenarioId:    "omnichannel-pickup",
      setActiveScenarioId: (id) => set({ activeScenarioId: id }),

      // Migration warning — set by onRehydrateStorage, never persisted
      migrationSkipCount:    0,
      clearMigrationWarning: () => set({ migrationSkipCount: 0 }),

      // Canvas capacity — transient, never persisted
      canvasIsFull:    false,
      setCanvasIsFull: (isFull) => set({ canvasIsFull: isFull }),

      // Infographic content — transient session state, never persisted
      infographicContent:    null,
      setInfographicContent: (infographicContent) => set({ infographicContent }),
      setInfographicFormat:  (format) =>
        set((s) =>
          s.infographicContent
            ? { infographicContent: { ...s.infographicContent, format } }
            : s,
        ),
      setInfographicBg: (bg) =>
        set((s) => (s.infographicContent ? { infographicContent: { ...s.infographicContent, bg } } : s)),
      setInfographicAccent: (accent) =>
        set((s) => (s.infographicContent ? { infographicContent: { ...s.infographicContent, accent } } : s)),
      setInfographicTitle: (title) =>
        set((s) => (s.infographicContent ? { infographicContent: { ...s.infographicContent, title } } : s)),
      setInfographicFootnote: (footnote) =>
        set((s) => (s.infographicContent ? { infographicContent: { ...s.infographicContent, footnote } } : s)),
      setInfographicShowTitle: (showTitle) =>
        set((s) => (s.infographicContent ? { infographicContent: { ...s.infographicContent, showTitle } } : s)),
      addInfographicBlock: (block) =>
        set((s) =>
          s.infographicContent
            ? { infographicContent: { ...s.infographicContent, blocks: [...s.infographicContent.blocks, block] } }
            : s,
        ),
      updateInfographicBlock: (id, block) =>
        set((s) =>
          s.infographicContent
            ? {
                infographicContent: {
                  ...s.infographicContent,
                  blocks: s.infographicContent.blocks.map((b) => (b.id === id ? block : b)),
                },
              }
            : s,
        ),
      removeInfographicBlock: (id) =>
        set((s) =>
          s.infographicContent
            ? {
                infographicContent: {
                  ...s.infographicContent,
                  blocks: s.infographicContent.blocks.filter((b) => b.id !== id),
                },
              }
            : s,
        ),

      setTemplateId:   (templateId)   => set({ templateId }),
      setLayout:       (layout)       => set({ layout }),
      setExportSize:   (exportSize)   => set({ exportSize }),
      setBackgroundId: (backgroundId) => set({ backgroundId }),
      setAppName:      (appName)      => set({ appName }),

      addMessage: (msg) =>
        set((s) => ({ messages: [...s.messages, msg] })),

      updateMessage: (id, patch) =>
        set((s) => ({
          messages: s.messages.map((m) => {
            if (m.id !== id) return m;
            const next = { ...m, ...patch };
            // 타입 제약 강제: user 메시지에 TextBlock 외 블록이 오면 role을 bot으로 자동 전환
            if (next.role === "user" && next.block.type !== "text") {
              return { ...next, role: "bot" } as BotMessage;
            }
            return next as ChatMessage;
          }),
        })),

      removeMessage: (id) =>
        set((s) => ({
          messages: s.messages.filter((m) => m.id !== id),
          canvasIsFull: false, // ResizeObserver가 재계산 후 필요 시 다시 true로 설정
        })),

      setMessages: (messages) => set({ messages, canvasIsFull: false }),

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

      setUserName: (name) =>
        set({ userName: name, userAvatarUrl: getAvatarForName(name) }),

      shuffleUserProfile: () => {
        const seed = Math.floor(Math.random() * 10_000);
        const { name, avatarUrl } = getRandomUserProfile(seed);
        set({ userName: name, userAvatarUrl: avatarUrl, userProfileSeed: seed });
      },
    }),
    {
      name:    "sendbird-editor-v1",
      version: 1,
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        customBackgrounds: state.customBackgrounds,
        savedAssets:       state.savedAssets,
      }),
      migrate: (persistedState, version) => {
        if (version < 1) return migrateV0toV1(persistedState);
        return persistedState as PersistedV1;
      },
      onRehydrateStorage: () => (state) => {
        if (state && _migrationSkips > 0) {
          state.migrationSkipCount = _migrationSkips;
          _migrationSkips = 0;
        }
      },
    },
  ),
);
