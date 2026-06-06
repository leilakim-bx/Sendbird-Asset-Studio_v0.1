import Link from "next/link";
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

  // Infographic editor lands in a later step — temporary placeholder for now.
  if (template.kind === "infographic") {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 bg-studio-bg text-center">
        <p className="text-sm font-medium text-studio-text">
          Infographic editor — coming soon in step 2
        </p>
        <Link
          href="/"
          className="text-xs text-studio-muted underline underline-offset-4 hover:text-studio-text"
        >
          Back to templates
        </Link>
      </div>
    );
  }

  // template is narrowed to ChatTemplate here
  return <EditorShell template={template} />;
}
