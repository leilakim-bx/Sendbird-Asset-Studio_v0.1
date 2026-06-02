"use client";

import { usePathname } from "next/navigation";
import { Sidebar } from "./Sidebar";

export function LayoutShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isEditor = pathname.startsWith("/editor");
  const isLogin  = pathname === "/login";

  return (
    <>
      {!isEditor && !isLogin && <Sidebar />}
      <main className={["flex-1 min-w-0", isEditor || isLogin ? "overflow-hidden" : "overflow-y-auto"].join(" ")}>
        {children}
      </main>
    </>
  );
}
