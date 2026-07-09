"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Database, HardDrive, Plus } from "lucide-react";
import { storageMode } from "@/lib/db";
import Logo from "./Logo";

export default function TopNav() {
  const pathname = usePathname();
  const onDashboard = pathname === "/";

  return (
    <header className="sticky top-0 z-30 border-b border-ink-200/70 bg-ink-50/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center gap-4 px-4 sm:px-6">
        <Link href="/" className="group flex items-center gap-2.5">
          <Logo size={34} className="transition-transform group-hover:-translate-y-0.5" />
          <span className="leading-tight">
            <span className="block text-[15px] font-semibold tracking-tight text-ink-900">
              PatchPilot
            </span>
            <span className="block text-[11px] text-ink-400">
              Triage · patch · review
            </span>
          </span>
        </Link>

        <nav className="ml-4 hidden items-center gap-1 sm:flex">
          <Link
            href="/"
            className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
              onDashboard
                ? "bg-ink-900 text-white"
                : "text-ink-500 hover:bg-ink-100 hover:text-ink-800"
            }`}
          >
            Dashboard
          </Link>
        </nav>

        <div className="ml-auto flex items-center gap-2.5">
          <span
            className="hidden items-center gap-1.5 rounded-full border border-ink-200 bg-white px-2.5 py-1 text-[11px] font-medium text-ink-500 shadow-card sm:inline-flex"
            title={
              storageMode === "supabase"
                ? "Connected to Supabase"
                : "Using local storage — set Supabase env vars to sync"
            }
          >
            {storageMode === "supabase" ? (
              <Database size={13} className="text-emerald-500" />
            ) : (
              <HardDrive size={13} className="text-amber-500" />
            )}
            {storageMode === "supabase" ? "Supabase" : "Local"}
            <span
              className={`h-1.5 w-1.5 rounded-full ${
                storageMode === "supabase"
                  ? "bg-emerald-500 shadow-[0_0_0_3px_rgba(16,185,129,0.15)]"
                  : "bg-amber-400"
              }`}
            />
          </span>
          <Link
            href="/intake"
            className="inline-flex items-center gap-1.5 rounded-xl bg-ink-900 px-3.5 py-2 text-sm font-semibold text-white shadow-card transition hover:bg-ink-800 active:scale-[0.98]"
          >
            <Plus size={16} />
            New report
          </Link>
        </div>
      </div>
    </header>
  );
}
