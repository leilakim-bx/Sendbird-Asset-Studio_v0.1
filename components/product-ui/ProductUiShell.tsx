"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ChevronDown, Home } from "lucide-react";
import { Menu } from "@base-ui/react/menu";
import { useEditorStore, type SavedAsset } from "@/lib/store";
import { captureThumbnail, exportImage } from "@/lib/export";
import type { ProductUiTemplate } from "@/lib/template-registry";
import type { ProductUiFormat } from "@/lib/types/product-ui";
import { cloneProductUiContent } from "@/lib/product-ui-presets";
import { ProductUiCanvas, PRODUCT_UI_SIZES } from "./ProductUiCanvas";
import { ProductUiSidebar } from "./ProductUiSidebar";

const MAX_PREVIEW_W = 760;
const MAX_PREVIEW_H = 520;

export function ProductUiShell({ template }: { template: ProductUiTemplate }) {
  const {
    productUiContent,
    setProductUiContent,
    saveAsset,
    pendingAssetRestore,
    setPendingAssetRestore,
  } = useEditorStore();

  useEffect(() => {
    const pending = pendingAssetRestore;
    if (pending && pending.templateId === template.id && pending.productUi) {
      setProductUiContent(cloneProductUiContent(pending.productUi));
      setPendingAssetRestore(null);
    } else {
      setProductUiContent(cloneProductUiContent(template.defaultContent));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [template.id]);

  const content = productUiContent ?? template.defaultContent;
  const productRef = useRef<HTMLDivElement>(null);
  const currentRef = productRef;
  const currentSize = PRODUCT_UI_SIZES[content.format];

  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved">("idle");

  function filename(format: ProductUiFormat) {
    const slug = (content.title || "product-ui")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 42) || "product-ui";
    return `${slug}-${format}.png`;
  }

  async function handleSave() {
    const ref = currentRef.current;
    if (!ref || saveState !== "idle") return;
    setSaveState("saving");
    try {
      const previewDataUrl = await captureThumbnail(ref);
      const now = Date.now();
      const dateStr = new Date(now).toLocaleDateString("en-US", { month: "short", day: "numeric" });
      const asset: SavedAsset = {
        id: `asset-${now}`,
        templateId: template.id,
        appName: content.title || "Product UI",
        name: `${content.title || "Product UI"} · ${dateStr}`,
        previewDataUrl,
        savedAt: now,
        productUi: content,
      };
      saveAsset(asset);
      setSaveState("saved");
      setTimeout(() => setSaveState("idle"), 2000);
    } catch {
      setSaveState("idle");
    }
  }

  async function exportOne(format: ProductUiFormat) {
    const ref = productRef.current;
    if (!ref) return;
    const size = PRODUCT_UI_SIZES[format];
    await exportImage(ref, size.width, size.height, filename(format));
  }

  async function handleExport(format: ProductUiFormat) {
    setExporting(true);
    setExportError(null);
    try {
      await exportOne(format);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error("Export failed:", err);
      setExportError(`Export failed — ${msg || "unknown error"}`);
    } finally {
      setExporting(false);
    }
  }

  const scale = Math.min(1, MAX_PREVIEW_W / currentSize.width, MAX_PREVIEW_H / currentSize.height);

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-3 px-4 py-2.5 border-b border-studio-border bg-studio-sidebar shrink-0">
        <Link href="/" className="flex items-center gap-1.5 text-studio-muted hover:text-studio-text transition-colors">
          <Image src="/Logo_Das.svg" alt="Logo" width={20} height={20} />
          <Home size={14} />
        </Link>
        <span className="text-studio-border select-none">/</span>
        <span className="text-studio-text text-xs font-medium">{template.name}</span>
      </div>

      <div className="flex flex-1 min-h-0">
        <div className="flex-1 overflow-auto bg-studio-bg">
          <div className="min-h-full flex flex-col items-center justify-center gap-6 py-8">
            <p className="text-studio-muted text-xs uppercase tracking-wider">
              Preview — {currentSize.label} {currentSize.width}×{currentSize.height}
            </p>

            <div style={{ width: currentSize.width * scale, height: currentSize.height * scale }}>
              <div style={{ transform: `scale(${scale})`, transformOrigin: "top left" }}>
                <ProductUiCanvas content={content} />
              </div>
            </div>

            <div className="flex flex-col items-center gap-2">
              <div className="flex items-center gap-2">
                <button
                  onClick={handleSave}
                  disabled={saveState !== "idle"}
                  className="font-semibold text-sm px-5 py-2.5 rounded-[10px] border border-studio-border text-studio-muted hover:text-studio-text hover:bg-studio-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saveState === "saving" ? "Saving…" : saveState === "saved" ? "Saved ✓" : "Save"}
                </button>

                <Menu.Root>
                  <Menu.Trigger
                    disabled={exporting}
                    className="flex items-center gap-2 bg-studio-accent text-studio-accent-fg font-semibold text-sm px-5 py-2.5 rounded-[10px] hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {exporting ? "Exporting…" : "Export"}
                    <ChevronDown size={14} />
                  </Menu.Trigger>
                  <Menu.Portal>
                    <Menu.Positioner side="top" align="end" sideOffset={8}>
                      <Menu.Popup className="z-50 min-w-[240px] rounded-xl border border-studio-border bg-studio-sidebar shadow-xl py-2 outline-none origin-bottom data-[ending-style]:animate-out data-[ending-style]:fade-out-0 data-[ending-style]:zoom-out-95 data-[starting-style]:animate-in data-[starting-style]:fade-in-0 data-[starting-style]:zoom-in-95 duration-100">
                        <div className="flex items-center gap-1 px-3 pt-1 pb-2 text-[11px] font-bold uppercase tracking-wider text-studio-text select-none">
                          Export as PNG
                          <span className="text-studio-muted font-semibold">· @2x</span>
                        </div>
                        <Menu.Separator className="h-px bg-studio-border mx-1 my-1.5" />

                        <Menu.Item
                          onClick={() => handleExport("product")}
                          className="flex items-center gap-3 px-3 py-2.5 text-sm text-studio-text hover:bg-studio-hover cursor-default outline-none rounded-lg mx-1"
                        >
                          <span className="flex-1">Product feature</span>
                          <span className="text-[11px] text-studio-muted tabular-nums">
                            {PRODUCT_UI_SIZES.product.width}×{PRODUCT_UI_SIZES.product.height}
                          </span>
                        </Menu.Item>
                      </Menu.Popup>
                    </Menu.Positioner>
                  </Menu.Portal>
                </Menu.Root>
              </div>
              {exportError && <p className="text-red-400 text-xs">{exportError}</p>}
            </div>

            <div aria-hidden style={{ position: "fixed", left: "-9999px", top: 0, pointerEvents: "none" }}>
              <div ref={productRef}>
                <ProductUiCanvas content={{ ...content, format: "product" }} exportMode />
              </div>
            </div>
          </div>
        </div>

        <ProductUiSidebar />
      </div>
    </div>
  );
}
