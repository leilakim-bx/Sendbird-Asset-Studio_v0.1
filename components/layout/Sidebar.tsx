"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { X, MessageSquare, GitBranch, LayoutDashboard } from "lucide-react";

// ── Nav ───────────────────────────────────────────────────

const NAV_ITEMS = [
  { label: "Home",          href: "/" },
  { label: "Recent Assets", href: "/recent" },
];

const FINDER_ITEMS = [
  { label: "Mobile Chat Finder", href: "/finder/mobile-chat" },
  { label: "Diagram Finder",     href: "/finder/diagram" },
  { label: "Dashboard Finder",   href: "/finder/dashboard" },
];

function NavItem({ label, href }: { label: string; href: string }) {
  const pathname = usePathname();
  const active = pathname === href;
  return (
    <Link
      href={href}
      className={[
        "block px-3 py-1.5 rounded-md text-sm transition-colors",
        active
          ? "text-studio-text bg-studio-hover"
          : "text-studio-muted hover:text-studio-text hover:bg-studio-hover",
      ].join(" ")}
    >
      {label}
    </Link>
  );
}

// ── New Asset Modal ───────────────────────────────────────

const ASSET_TYPES = [
  {
    id: "feature-mockup",
    icon: MessageSquare,
    title: "Feature Mockup",
    description: "Floating glass chat UI over atmospheric scene photos. Perfect for product landing pages and feature sections.",
    ready: true,
  },
  {
    id: "overview-diagram",
    icon: GitBranch,
    title: "Overview Diagram",
    description: "Architecture and flow diagrams for technical documentation and product overview sections.",
    ready: false,
  },
  {
    id: "dashboard-snippet",
    icon: LayoutDashboard,
    title: "Dashboard Snippet",
    description: "Dashboard and analytics UI snippets for showcasing data-driven product features.",
    ready: false,
  },
];

function NewAssetModal({ onClose }: { onClose: () => void }) {
  const router = useRouter();

  return (
    /* Backdrop */
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-6"
      style={{ backgroundColor: "rgba(0,0,0,0.7)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      {/* Panel */}
      <div className="bg-studio-sidebar border border-studio-border rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-studio-border">
          <div>
            <p className="text-studio-text font-semibold text-sm">New Asset</p>
            <p className="text-studio-muted text-xs mt-0.5">Choose a template to get started</p>
          </div>
          <button
            onClick={onClose}
            className="text-studio-muted hover:text-studio-text transition-colors p-1 rounded-md hover:bg-studio-hover"
          >
            <X size={16} />
          </button>
        </div>

        {/* Template list */}
        <div className="p-4 flex flex-col gap-3">
          {ASSET_TYPES.map((type) => {
            const Icon = type.icon;
            return (
              <div
                key={type.id}
                className={[
                  "flex items-start gap-4 p-4 rounded-xl border transition-colors",
                  type.ready
                    ? "border-studio-border bg-studio-hover hover:border-studio-muted cursor-pointer"
                    : "border-studio-border opacity-50 cursor-not-allowed",
                ].join(" ")}
                onClick={() => {
                  if (!type.ready) return;
                  onClose();
                  router.push(`/editor/${type.id}`);
                }}
              >
                {/* Icon */}
                <div className="w-9 h-9 rounded-lg bg-studio-bg border border-studio-border flex items-center justify-center shrink-0">
                  <Icon size={16} className="text-studio-muted" />
                </div>

                {/* Text */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-studio-text text-sm font-medium">{type.title}</p>
                    {!type.ready && (
                      <span className="text-[10px] text-studio-muted border border-studio-border rounded-full px-2 py-0.5">
                        Soon
                      </span>
                    )}
                    {type.ready && (
                      <span className="text-[10px] bg-studio-accent text-studio-accent-fg rounded-full px-2 py-0.5 font-medium">
                        Ready
                      </span>
                    )}
                  </div>
                  <p className="text-studio-muted text-xs leading-relaxed">{type.description}</p>
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </div>
  );
}

// ── Sidebar ───────────────────────────────────────────────

export function Sidebar() {
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <>
      <aside className="w-[260px] shrink-0 flex flex-col h-screen bg-studio-sidebar border-r border-studio-border">
        {/* Logo */}
        <div className="px-4 pt-8 pb-5">
          <div className="flex items-center gap-3">
            <Image
              src="/Logo_Das.svg"
              alt="Sendbird Asset Studio"
              width={36}
              height={36}
              className="shrink-0"
            />
            <div className="min-w-0">
              <p className="text-studio-text font-semibold text-sm leading-tight truncate">
                Sendbird Asset Studio
              </p>
              <p className="text-studio-muted text-xs mt-0.5">v1.0.0</p>
            </div>
          </div>
        </div>

        <div className="border-t border-studio-border" />

        {/* Main nav */}
        <nav className="px-3 py-4 flex flex-col gap-0.5">
          {NAV_ITEMS.map((item) => (
            <NavItem key={item.href} {...item} />
          ))}
        </nav>

        <div className="border-t border-studio-border" />

        {/* Finders */}
        <nav className="px-3 py-4 flex flex-col gap-0.5">
          {FINDER_ITEMS.map((item) => (
            <NavItem key={item.href} {...item} />
          ))}
        </nav>

        <div className="border-t border-studio-border" />

        {/* New Asset CTA */}
        <div className="px-4 py-5">
          <button
            onClick={() => setModalOpen(true)}
            className="block w-full py-3 rounded-xl bg-studio-accent text-studio-accent-fg font-bold text-sm text-center hover:opacity-90 transition-opacity"
          >
            New Asset
          </button>
        </div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Guides */}
        <div className="px-4 pb-6">
          <Link
            href="/guides"
            className="block w-full py-2.5 rounded-xl border border-studio-border text-studio-muted text-sm text-center hover:text-studio-text hover:border-studio-muted transition-colors"
          >
            Guides
          </Link>
        </div>
      </aside>

      {modalOpen && <NewAssetModal onClose={() => setModalOpen(false)} />}
    </>
  );
}
