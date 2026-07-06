import { EditorShell } from "@/components/editor/EditorShell";
import { InfographicShell } from "@/components/infographic/InfographicShell";
import { ProductVisualShell } from "@/components/product-visual/ProductVisualShell";
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

  if (template.kind === "product-visual") {
    return <ProductVisualShell template={template} />;
  }

  // template is narrowed to ChatTemplate here
  return <EditorShell template={template} />;
}
