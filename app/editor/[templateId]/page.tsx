import { EditorShell } from "@/components/editor/EditorShell";
import { InfographicShell } from "@/components/infographic/InfographicShell";
import { ProductUiShell } from "@/components/product-ui/ProductUiShell";
import { getTemplate } from "@/lib/template-registry";
import { notFound } from "next/navigation";

export default async function EditorPage({
  params,
}: {
  params: Promise<{ templateId: string }>;
}) {
  const { templateId } = await params;
  const template = getTemplate(templateId);
  if (!template) notFound();

  if (template.kind === "infographic") {
    return <InfographicShell template={template} />;
  }

  if (template.kind === "product-ui") {
    return <ProductUiShell template={template} />;
  }

  // template is narrowed to ChatTemplate here
  return <EditorShell template={template} />;
}
