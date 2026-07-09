"use client";

import { useCollab } from "@/lib/collab";
import Avatar from "./Avatar";

/** Live stack of avatars for everyone currently in the app. */
export default function PresenceBar({ max = 4 }: { max?: number }) {
  const online = useCollab((s) => s.online);
  const ready = useCollab((s) => s.ready);

  if (!ready || online.length === 0) return null;

  const shown = online.slice(0, max);
  const extra = online.length - shown.length;

  return (
    <div
      className="hidden items-center gap-2 rounded-full border border-ink-200 bg-white py-1 pl-2 pr-3 shadow-card sm:inline-flex"
      title={`${online.length} online: ${online.map((m) => m.name).join(", ")}`}
    >
      <span className="flex -space-x-2">
        {shown.map((m) => (
          <Avatar key={m.key} member={m} size={22} />
        ))}
        {extra > 0 && (
          <span className="flex h-[22px] w-[22px] items-center justify-center rounded-full bg-ink-100 text-[9px] font-bold text-ink-500 ring-2 ring-white">
            +{extra}
          </span>
        )}
      </span>
      <span className="flex items-center gap-1 text-[11px] font-semibold text-ink-500">
        <span className="relative flex h-1.5 w-1.5">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
        </span>
        {online.length} online
      </span>
    </div>
  );
}
