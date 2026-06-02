"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

export default function LoginPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error,    setError]    = useState("");
  const [loading,  setLoading]  = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await fetch("/api/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });

    if (res.ok) {
      router.push("/");
      router.refresh();
    } else {
      setError("Incorrect password. Please try again.");
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen w-full bg-studio-bg flex items-center justify-center p-6">
      <div className="w-full max-w-sm">

        {/* Logo */}
        <div className="flex items-center gap-3 mb-8 justify-center">
          <Image src="/Logo_Das.svg" alt="Sendbird Asset Studio" width={36} height={36} />
          <div>
            <p className="text-studio-text font-semibold text-sm leading-tight">Sendbird Asset Studio</p>
            <p className="text-studio-muted text-xs mt-0.5">Internal tool</p>
          </div>
        </div>

        {/* Card */}
        <div className="bg-studio-sidebar border border-studio-border rounded-2xl p-6">
          <h1 className="text-studio-text font-semibold text-sm mb-1">Enter password</h1>
          <p className="text-studio-muted text-xs mb-5">This tool is for Sendbird internal use only.</p>

          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              autoFocus
              className="h-9 px-3 rounded-lg bg-studio-bg border border-studio-border text-studio-text text-sm placeholder:text-studio-muted outline-none focus:border-studio-accent transition-colors"
            />
            {error && (
              <p className="text-red-400 text-xs">{error}</p>
            )}
            <button
              type="submit"
              disabled={loading || !password}
              className="h-9 rounded-lg bg-studio-accent text-studio-accent-fg font-semibold text-sm hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {loading ? "Checking…" : "Continue →"}
            </button>
          </form>
        </div>

      </div>
    </div>
  );
}
