import { type NextRequest } from "next/server";

/**
 * Pexels-only image proxy.
 * Streams Pexels image CDN URLs back as same-origin so html-to-image can embed
 * them in a canvas without CORS/SecurityError.
 *
 * Usage: /api/proxy-image?url=https://images.pexels.com/...
 */
export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get("url");

  if (!url) {
    return new Response("Missing url parameter", { status: 400 });
  }

  let targetUrl: string;
  try {
    targetUrl = decodeURIComponent(url);
    new URL(targetUrl); // validate
  } catch {
    return new Response("Invalid url parameter", { status: 400 });
  }

  if (!isAllowedPexelsImage(targetUrl)) {
    return new Response("Only Pexels image URLs are allowed", { status: 403 });
  }

  try {
    const upstream = await fetch(targetUrl, {
      headers: { "User-Agent": "Mozilla/5.0" },
      next: { revalidate: 86400 },
    });

    if (!upstream.ok) {
      return new Response("Upstream fetch failed", { status: upstream.status });
    }

    const contentType = upstream.headers.get("content-type") ?? "image/jpeg";
    const buffer = await upstream.arrayBuffer();

    return new Response(buffer, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=86400, immutable",
      },
    });
  } catch {
    return new Response("Failed to proxy image", { status: 502 });
  }
}

function isAllowedPexelsImage(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "https:" && url.hostname === "images.pexels.com";
  } catch {
    return false;
  }
}
