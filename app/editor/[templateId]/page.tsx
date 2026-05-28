import { EditorShell } from "@/components/editor/EditorShell";
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

  return <EditorShell template={template} />;
}
