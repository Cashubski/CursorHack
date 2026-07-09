"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { storageMode } from "@/lib/db";

export default function TopNav() {
  const pathname = usePathname();
  const onDashboard = pathname === "/";

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/80 backdrop-blur">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center gap-4 px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-600 text-lg text-white shadow-sm">
            🛩️
          </span>
          <span className="leading-tight">
            <span className="block text-sm font-bold tracking-tight text-slate-900">
              PatchPilot
            </span>
            <span className="block text-[11px] text-slate-500">
              Bug reports to reviewed patches
            </span>
          </span>
        </Link>

        <nav className="ml-6 hidden items-center gap-1 sm:flex">
          <Link
            href="/"
            className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
              onDashboard
                ? "bg-brand-50 text-brand-700"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            Dashboard
          </Link>
        </nav>

        <div className="ml-auto flex items-center gap-3">
          <span
            className="hidden items-center gap-1.5 rounded-full border border-slate-200 px-2.5 py-1 text-[11px] font-semibold text-slate-500 sm:inline-flex"
            title={
              storageMode === "supabase"
                ? "Connected to Supabase"
                : "Using local storage - set Supabase env vars to sync"
            }
          >
            <span
              className={`h-2 w-2 rounded-full ${
                storageMode === "supabase" ? "bg-emerald-500" : "bg-amber-400"
              }`}
            />
            {storageMode === "supabase" ? "Supabase" : "Local"}
          </span>
          <Link
            href="/intake"
            className="rounded-xl bg-brand-600 px-3.5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-700 active:scale-[0.98]"
          >
            + New report
          </Link>
        </div>
      </div>
    </header>
  );
}
