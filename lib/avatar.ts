import names from "@/data/random-names.json";

// pravatar.cc provides img=1..70 (70 distinct portraits)
const AVATAR_COUNT = 70;

function toAvatarUrl(n: number): string {
  const idx = (n % AVATAR_COUNT) + 1;
  return `/api/proxy-image?url=${encodeURIComponent(
    `https://i.pravatar.cc/48?img=${idx}`,
  )}`;
}

/** djb2 string hash → positive integer */
function hashStr(s: string): number {
  let h = 5381;
  for (let i = 0; i < s.length; i++)
    h = ((h << 5) + h) ^ s.charCodeAt(i);
  return Math.abs(h);
}

/**
 * Returns a random name + avatar URL pair.
 * Pass `seed` for deterministic output (e.g. restoring a saved asset).
 */
export function getRandomUserProfile(seed?: number): {
  name: string;
  avatarUrl: string;
} {
  const i = seed ?? Math.floor(Math.random() * 10_000);
  return {
    name:      names[i % names.length],
    avatarUrl: toAvatarUrl(i),
  };
}

/**
 * Derives a stable avatar for a manually entered name.
 * Same name always produces the same avatar (hash-based).
 */
export function getAvatarForName(name: string): string {
  return toAvatarUrl(hashStr(name.trim().toLowerCase()));
}
