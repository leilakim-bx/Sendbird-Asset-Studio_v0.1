import { OpenAssetClient, type OpenAssetTabId } from "@/components/assets/OpenAssetClient";

type OpenAssetSearchParams = Promise<{
  type?: string | string[] | undefined;
}>;

const VALID_TABS: OpenAssetTabId[] = ["chat", "infographic", "product-visual"];

function parseTab(value: string | string[] | undefined): OpenAssetTabId {
  const raw = Array.isArray(value) ? value[0] : value;
  return VALID_TABS.includes(raw as OpenAssetTabId) ? (raw as OpenAssetTabId) : "chat";
}

export default async function OpenAssetPage({
  searchParams,
}: {
  searchParams: OpenAssetSearchParams;
}) {
  const params = await searchParams;
  return <OpenAssetClient initialTab={parseTab(params.type)} />;
}
