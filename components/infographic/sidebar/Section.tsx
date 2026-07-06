"use client";

import { type ReactNode } from "react";

/** Static sidebar section (dark studio tone) — always expanded.
 *  Collapsing was removed to keep asset creation friction-free. */
export function Section({
  title,
  badge,
  info,
  action,
  disabled = false,
  children,
}: {
  title: string;
  /** Optional pill next to the title (e.g. "Soon"). */
  badge?: string;
  /** Optional element right after the title (e.g. an info tooltip icon). */
  info?: ReactNode;
  /** Optional control rendered at the header's right edge (e.g. a toggle). */
  action?: ReactNode;
  /** Dim + block interaction with the section body (feature not ready yet). */
  disabled?: boolean;
  /** Kept for call-site compatibility; no longer collapses. */
  defaultCollapsed?: boolean;
  children: ReactNode;
}) {
  return (
    <div className="border-b border-studio-border">
      <div className="flex items-center gap-2 px-[18px] py-3.5">
        <span className="text-[10px] font-semibold tracking-[0.12em] uppercase text-studio-muted">{title}</span>
        {info}
        {badge && (
          <span className="text-[9px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded-full bg-studio-accent/[0.12] border border-studio-accent/30 text-studio-accent">
            {badge}
          </span>
        )}
        {action && <span className="ml-auto flex items-center">{action}</span>}
      </div>
      <div
        className={["px-[18px] pb-4", disabled ? "opacity-50 pointer-events-none select-none" : ""].join(" ")}
        inert={disabled || undefined}
      >
        {children}
      </div>
    </div>
  );
}
