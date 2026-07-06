import { type NextRequest } from "next/server";
import {
  hasAssetImageBlobCredentials,
  uploadAssetImageToBlob,
  validateAssetImageFile,
  type AssetImagePurpose,
} from "@/lib/server/asset-image-storage";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const PURPOSES = new Set<AssetImagePurpose>(["product-visual-screenshot", "custom-background"]);

function parsePurpose(value: FormDataEntryValue | null): AssetImagePurpose {
  return typeof value === "string" && PURPOSES.has(value as AssetImagePurpose)
    ? value as AssetImagePurpose
    : "product-visual-screenshot";
}

export async function POST(request: NextRequest) {
  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return Response.json({ error: "Invalid form data." }, { status: 400 });
  }

  const file = formData.get("file");
  if (!(file instanceof File)) {
    return Response.json({ error: "No file provided." }, { status: 400 });
  }

  const validationError = validateAssetImageFile(file);
  if (validationError) {
    return Response.json({ error: validationError }, { status: 400 });
  }

  if (!hasAssetImageBlobCredentials()) {
    return Response.json({ enabled: false, uploaded: false });
  }

  try {
    const purpose = parsePurpose(formData.get("purpose"));
    const blob = await uploadAssetImageToBlob(file, purpose);
    return Response.json({
      enabled: true,
      uploaded: true,
      url: blob.url,
      pathname: blob.pathname,
      contentType: blob.contentType,
    });
  } catch {
    return Response.json({ error: "Could not upload the image." }, { status: 500 });
  }
}

