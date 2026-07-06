import { describe, expect, it, vi } from "vitest";
import { uploadProductVisualScreenshot } from "@/lib/product-visual/upload-image";

function imageFile(size: number, type = "image/png") {
  return new File([new Uint8Array(size)], "dashboard.png", { type });
}

const measureNatural = vi.fn(async () => ({ w: 1200, h: 800 }));

describe("product visual screenshot upload", () => {
  it("rejects unsupported formats before any upload work", async () => {
    const fetcher = vi.fn();

    const result = await uploadProductVisualScreenshot(
      imageFile(128, "text/plain"),
      { fetcher, measureNatural },
    );

    expect(result).toEqual({
      ok: false,
      error: "Unsupported format — use PNG, JPG, or WebP.",
    });
    expect(fetcher).not.toHaveBeenCalled();
  });

  it("uses the Blob upload URL when cloud storage is enabled", async () => {
    let capturedInit: RequestInit | undefined;
    const fetcher = vi.fn(async (_input: string | URL, init?: RequestInit) => {
      capturedInit = init;
      return Response.json({
        enabled: true,
        uploaded: true,
        url: "https://blob.example.com/asset-images/product.png",
      });
    });

    const result = await uploadProductVisualScreenshot(
      imageFile(256),
      { fetcher, measureNatural },
    );

    expect(result).toEqual({
      ok: true,
      url: "https://blob.example.com/asset-images/product.png",
      naturalWidth: 1200,
      naturalHeight: 800,
    });
    expect(fetcher).toHaveBeenCalledOnce();
    expect(capturedInit?.method).toBe("POST");
    expect(capturedInit?.body).toBeInstanceOf(FormData);
  });

  it("falls back to a local data URL for small files when Blob is disabled", async () => {
    const fetcher = vi.fn(async () => Response.json({ enabled: false, uploaded: false }));
    const readAsDataUrl = vi.fn(async () => "data:image/png;base64,abc");

    const result = await uploadProductVisualScreenshot(
      imageFile(256),
      { fetcher, measureNatural, readAsDataUrl },
    );

    expect(result).toEqual({
      ok: true,
      url: "data:image/png;base64,abc",
      naturalWidth: 1200,
      naturalHeight: 800,
    });
  });

  it("does not store large screenshots as data URLs when Blob is unavailable", async () => {
    const fetcher = vi.fn(async () => Response.json({ enabled: false, uploaded: false }));
    const readAsDataUrl = vi.fn(async () => "data:image/png;base64,abc");

    const result = await uploadProductVisualScreenshot(
      imageFile(3 * 1024 * 1024),
      { fetcher, measureNatural, readAsDataUrl },
    );

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toContain("Cloud image storage is not available");
    }
    expect(readAsDataUrl).not.toHaveBeenCalled();
  });
});
