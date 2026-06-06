"use client";

import { useEffect, useState, type ReactNode } from "react";
import { ChevronDown } from "lucide-react";

// Own localStorage key so this never touches the chat editor's collapse state.
const KEY = "sendbird-ig-section-collapsed-v1";

function readStore(): Record<string, boolean> {
  try {
    return JSON.parse(localStorage.getItem(KEY) || "{}");
  } catch {
    return {};
  }
}
function writeStore(map: Record<string, boolean>) {
  try {
    localStorage.setItem(KEY, JSON.stringify(map));
  } catch {
    /* quota — ignore */
  }
}

/** Collapsible sidebar section (dark studio tone). `defaultCollapsed` is a
 *  one-time default; the user's choice is then persisted per title. */
export function Section({
  title,
  defaultCollapsed = false,
  children,
}: {
  title: string;
  defaultCollapsed?: boolean;
  children: ReactNode;
}) {
  const [collapsed, setCollapsed] = useState(defaultCollapsed);

  useEffect(() => {
    const stored = readStore()[title];
    if (stored !== undefined) setCollapsed(stored);
  }, [title]);

  function toggle() {
    setCollapsed((c) => {
      const next = !c;
      const map = readStore();
      map[title] = next;
      writeStore(map);
      return next;
    });
  }

  return (
    <div className="border-b border-studio-border">
      <button
        onClick={toggle}
        className="w-full flex items-center gap-2 px-[18px] py-3.5 hover:bg-white/[0.02] transition-colors"
      >
        <ChevronDown
          size={12}
          className={["text-studio-muted transition-transform", collapsed ? "-rotate-90" : ""].join(" ")}
        />
        <span className="text-[10px] font-semibold tracking-[0.12em] uppercase text-studio-muted">{title}</span>
      </button>
      {!collapsed && <div className="px-[18px] pb-4">{children}</div>}
    </div>
  );
}
