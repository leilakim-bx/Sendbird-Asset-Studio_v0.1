import { type NextRequest } from "next/server";

/**
 * GET /api/product-image?q=lace+dress
 *
 * Searches Pexels for a portrait-oriented photo matching the query,
 * picks one at random from the top results, and returns its URL.
 * The client then loads it through /api/proxy-image to stay same-origin.
 *
 * Requires PEXELS_API_KEY in .env.local (free at https://www.pexels.com/api/)
 */
export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get("q")?.trim() || "product";
  const apiKey = process.env.PEXELS_API_KEY;

  if (!apiKey || apiKey === "your_pexels_api_key_here") {
    return Response.json(
      { error: "PEXELS_API_KEY not configured in .env.local" },
      { status: 503 }
    );
  }

  const pexelsRes = await fetch(
    `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=15&orientation=portrait`,
    {
      headers: { Authorization: apiKey },
      next: { revalidate: 300 }, // cache 5 min per query
    }
  );

  if (!pexelsRes.ok) {
    return Response.json(
      { error: `Pexels API error: ${pexelsRes.status}` },
      { status: pexelsRes.status }
    );
  }

  const data = await pexelsRes.json() as { photos: { src: { medium: string } }[] };
  const photos = data.photos ?? [];

  if (photos.length === 0) {
    return Response.json({ url: null });
  }

  // Pick randomly from top results for variety
  const photo = photos[Math.floor(Math.random() * photos.length)];
  return Response.json({ url: photo.src.medium });
}
