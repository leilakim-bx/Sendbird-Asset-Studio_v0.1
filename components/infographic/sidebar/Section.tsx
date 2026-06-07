"use client";

import { type ReactNode } from "react";

/** Static sidebar section (dark studio tone) — always expanded.
 *  Collapsing was removed to keep asset creation friction-free. */
export function Section({
  title,
  children,
}: {
  title: string;
  /** Kept for call-site compatibility; no longer collapses. */
  defaultCollapsed?: boolean;
  children: ReactNode;
}) {
  return (
    <div className="border-b border-studio-border">
      <div className="flex items-center gap-2 px-[18px] py-3.5">
        <span className="text-[10px] font-semibold tracking-[0.12em] uppercase text-studio-muted">{title}</span>
      </div>
      <div className="px-[18px] pb-4">{children}</div>
    </div>
  );
}
