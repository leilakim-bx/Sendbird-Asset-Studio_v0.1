import { LayoutDashboard } from "lucide-react";

export default function DashboardFinderPage() {
  return (
    <div className="flex items-center justify-center h-full min-h-[480px] p-8">
      <div className="flex flex-col items-center text-center max-w-xs">
        <div className="w-14 h-14 rounded-2xl bg-studio-sidebar border border-studio-border flex items-center justify-center mb-5">
          <LayoutDashboard size={22} className="text-studio-muted" />
        </div>
        <h2 className="text-studio-text font-semibold text-base mb-2">Dashboard Finder</h2>
        <p className="text-studio-muted text-sm leading-relaxed">
          Dashboard and analytics UI snippets are in the works.
          Export data-driven product visuals will be available here soon.
        </p>
        <span className="mt-5 inline-block text-[11px] text-studio-muted border border-studio-border rounded-full px-3 py-1">
          Coming soon
        </span>
      </div>
    </div>
  );
}
