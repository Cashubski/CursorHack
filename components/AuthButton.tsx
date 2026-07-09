"use client";

import { useEffect, useRef, useState } from "react";
import { LogOut, ChevronDown, ArrowRight } from "lucide-react";
import { useCollab } from "@/lib/collab";
import { storageMode } from "@/lib/db";
import Avatar from "./Avatar";

function GithubMark({ size = 15 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M12 .5A11.5 11.5 0 0 0 .5 12a11.5 11.5 0 0 0 7.86 10.92c.58.1.79-.25.79-.56v-2c-3.2.7-3.88-1.37-3.88-1.37-.53-1.34-1.29-1.7-1.29-1.7-1.05-.72.08-.7.08-.7 1.16.08 1.77 1.2 1.77 1.2 1.03 1.77 2.7 1.26 3.36.96.1-.75.4-1.26.73-1.55-2.56-.29-5.25-1.28-5.25-5.7 0-1.26.45-2.29 1.19-3.1-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.18 1.18a11 11 0 0 1 5.79 0c2.2-1.49 3.17-1.18 3.17-1.18.63 1.59.24 2.76.12 3.05.74.81 1.18 1.84 1.18 3.1 0 4.43-2.69 5.4-5.26 5.69.41.35.78 1.05.78 2.12v3.14c0 .31.21.67.8.56A11.5 11.5 0 0 0 23.5 12 11.5 11.5 0 0 0 12 .5Z" />
    </svg>
  );
}

export default function AuthButton() {
  const me = useCollab((s) => s.me);
  const ready = useCollab((s) => s.ready);
  const signIn = useCollab((s) => s.signIn);
  const signOut = useCollab((s) => s.signOut);
  const setProfile = useCollab((s) => s.setProfile);
  const clearProfile = useCollab((s) => s.clearProfile);

  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [handle, setHandle] = useState("");
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  if (storageMode !== "supabase" || !ready) return null;

  const identified = me?.signedIn;

  function join() {
    if (!name.trim() && !handle.trim()) return;
    setProfile(name || handle, handle);
    setOpen(false);
    setName("");
    setHandle("");
  }

  return (
    <div className="relative" ref={menuRef}>
      {identified ? (
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="flex items-center gap-1.5 rounded-full border border-ink-200 bg-white py-1 pl-1 pr-2 shadow-card transition hover:bg-ink-50"
        >
          <Avatar member={me!} size={26} ring="ring-white" />
          <ChevronDown size={14} className="text-ink-400" />
        </button>
      ) : (
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="inline-flex items-center gap-1.5 rounded-xl border border-ink-200 bg-white px-3 py-2 text-sm font-semibold text-ink-700 shadow-card transition hover:bg-ink-50 active:scale-[0.98]"
        >
          <GithubMark size={15} />
          <span className="hidden sm:inline">Sign in</span>
        </button>
      )}

      {open && (
        <div className="absolute right-0 top-full z-40 mt-2 w-72 animate-slideUp overflow-hidden rounded-xl border border-ink-200 bg-white p-1 shadow-pop">
          {identified ? (
            <>
              <div className="flex items-center gap-2.5 px-3 py-2.5">
                <Avatar member={me!} size={34} ring="ring-ink-100" />
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-ink-900">
                    {me!.name}
                  </p>
                  <p className="truncate text-xs text-ink-400">
                    @{me!.handle}
                    {me!.source === "profile" && " · quick join"}
                  </p>
                </div>
              </div>
              <div className="my-1 h-px bg-ink-100" />
              <button
                type="button"
                onClick={() => {
                  setOpen(false);
                  if (me!.source === "github") signOut();
                  else clearProfile();
                }}
                className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-ink-600 transition hover:bg-ink-50"
              >
                <LogOut size={15} />
                Sign out
              </button>
            </>
          ) : (
            <div className="p-2">
              <button
                type="button"
                onClick={() => {
                  setOpen(false);
                  signIn();
                }}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-ink-900 px-3 py-2.5 text-sm font-semibold text-white transition hover:bg-ink-800"
              >
                <GithubMark size={15} />
                Continue with GitHub
              </button>

              <div className="my-3 flex items-center gap-2">
                <span className="h-px flex-1 bg-ink-100" />
                <span className="text-[10px] font-semibold uppercase tracking-wide text-ink-400">
                  or quick join
                </span>
                <span className="h-px flex-1 bg-ink-100" />
              </div>

              <div className="space-y-2">
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Display name"
                  className="field !py-2"
                />
                <input
                  type="text"
                  value={handle}
                  onChange={(e) => setHandle(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && join()}
                  placeholder="GitHub username (optional)"
                  className="field !py-2"
                />
                <button
                  type="button"
                  onClick={join}
                  disabled={!name.trim() && !handle.trim()}
                  className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-iris-500 px-3 py-2.5 text-sm font-semibold text-white transition hover:bg-iris-600 disabled:cursor-not-allowed disabled:bg-ink-200 disabled:text-ink-400"
                >
                  Join
                  <ArrowRight size={15} />
                </button>
                <p className="px-1 pt-0.5 text-[11px] leading-snug text-ink-400">
                  Adding a GitHub username pulls your real avatar — no login
                  needed.
                </p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
