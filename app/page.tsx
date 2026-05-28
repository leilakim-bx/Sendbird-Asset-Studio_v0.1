const TEMPLATES = [
  {
    id: "feature-mockup",
    title: "Feature Mockup",
    description: "Floating glass chat UI with delight.ai-style atmospheric backgrounds",
    ready: true,
  },
  {
    id: "overview-diagram",
    title: "Overview Diagram",
    description: "Architecture overview diagram",
    ready: false,
  },
  {
    id: "dashboard-snippet",
    title: "Dashboard Snippet",
    description: "Dashboard UI snippet",
    ready: false,
  },
];

export default function Home() {
  return (
    <div className="p-8">
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-studio-text mb-1">Home</h2>
        <p className="text-sm text-studio-muted">Select a template to create your marketing asset.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {TEMPLATES.map((template) => (
          <div
            key={template.id}
            className="rounded-xl border border-studio-border bg-studio-sidebar p-5 flex flex-col gap-3"
          >
            <div className="h-36 rounded-lg bg-studio-hover flex items-center justify-center">
              <span className="text-studio-muted text-sm">Preview coming soon</span>
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <p className="text-studio-text font-medium text-sm">{template.title}</p>
                {!template.ready && (
                  <span className="text-[11px] text-studio-muted border border-studio-border rounded-full px-2 py-0.5">
                    Soon
                  </span>
                )}
              </div>
              <p className="text-studio-muted text-xs">{template.description}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
