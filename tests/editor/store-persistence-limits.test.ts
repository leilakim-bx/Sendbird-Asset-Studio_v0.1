import { beforeEach, describe, expect, it } from "vitest";
import type { Background } from "@/lib/backgrounds";
import {
  PERSISTED_COLLECTION_LIMITS,
  type SavedAsset,
  trimPersistedCollections,
  useEditorStore,
} from "@/lib/store";
import { WORK_DATA_SCHEMA_VERSION } from "@/lib/work-data-schema";

function makeAsset(index: number): SavedAsset {
  return {
    schemaVersion: WORK_DATA_SCHEMA_VERSION,
    id:             `asset-${index}`,
    templateId:     "infographic",
    appName:        "delight.ai",
    name:           `Asset ${index}`,
    previewDataUrl: `data:image/jpeg;base64,${index}`,
    savedAt:        index,
  };
}

function makeBackground(index: number): Background {
  return {
    id:       `bg-custom-${index}`,
    label:    `Background ${index}`,
    url:      `/background/custom-${index}.png`,
    category: "custom",
  };
}

describe("store persistence limits", () => {
  beforeEach(() => {
    useEditorStore.setState({
      customBackgrounds: [],
      savedAssets:       [],
    });
  });

  it("trims migrated persisted collections to bounded sizes", () => {
    const savedAssets = Array.from({ length: 40 }, (_, index) => makeAsset(index));
    const customBackgrounds = Array.from({ length: 35 }, (_, index) => makeBackground(index));

    const trimmed = trimPersistedCollections({ savedAssets, customBackgrounds });

    expect(trimmed.savedAssets).toHaveLength(PERSISTED_COLLECTION_LIMITS.savedAssets);
    expect(trimmed.savedAssets[0]?.id).toBe("asset-0");
    expect(trimmed.savedAssets.at(-1)?.id).toBe("asset-23");

    expect(trimmed.customBackgrounds).toHaveLength(PERSISTED_COLLECTION_LIMITS.customBackgrounds);
    expect(trimmed.customBackgrounds[0]?.id).toBe("bg-custom-15");
    expect(trimmed.customBackgrounds.at(-1)?.id).toBe("bg-custom-34");
  });

  it("keeps future saves within localStorage-safe limits", () => {
    for (let index = 0; index < 40; index += 1) {
      useEditorStore.getState().saveAsset(makeAsset(index));
      useEditorStore.getState().addCustomBackground(makeBackground(index));
    }

    const state = useEditorStore.getState();

    expect(state.savedAssets).toHaveLength(PERSISTED_COLLECTION_LIMITS.savedAssets);
    expect(state.savedAssets[0]?.id).toBe("asset-39");
    expect(state.savedAssets.at(-1)?.id).toBe("asset-16");

    expect(state.customBackgrounds).toHaveLength(PERSISTED_COLLECTION_LIMITS.customBackgrounds);
    expect(state.customBackgrounds[0]?.id).toBe("bg-custom-20");
    expect(state.customBackgrounds.at(-1)?.id).toBe("bg-custom-39");
  });
});
