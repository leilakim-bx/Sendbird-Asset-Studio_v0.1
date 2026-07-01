// Regenerates data/avatars.json from the files in public/preview/Avatar.
// Runs automatically via the `predev` / `prebuild` npm hooks, so dropping a
// new image into the folder makes it available without editing JSON by hand.
import { readdirSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const avatarDir = join(root, "public", "preview", "Avatar");
const manifestPath = join(root, "data", "avatars.json");

const IMAGE_RE = /\.(png|jpe?g|webp|gif|avif)$/i;

let files = [];
try {
  files = readdirSync(avatarDir)
    .filter((name) => IMAGE_RE.test(name))
    .sort(); // stable order → stable seed→index mapping for saved assets
} catch {
  console.warn(`[gen-avatars] ${avatarDir} not found — writing empty manifest`);
}

writeFileSync(manifestPath, JSON.stringify(files, null, 2) + "\n");
console.log(`[gen-avatars] wrote ${files.length} avatar(s) to data/avatars.json`);
