"use client";

import { useEffect, useState } from "react";
import { AssetLibrary } from "@/components/assets/AssetLibrary";

export default function RecentAssetsPage() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  return (
    <div className="p-8 flex flex-col h-full min-h-0">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-studio-text mb-1">Recent Assets</h2>
        <p className="text-sm text-studio-muted">All your saved mockups, sorted by most recent.</p>
      </div>
      <AssetLibrary title="My files" mounted={mounted} />
    </div>
  );
}
