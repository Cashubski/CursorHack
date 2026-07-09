import type { ReactNode } from "react";

type Tone = "brand" | "green" | "amber" | "red" | "slate";

const TONES: Record<Tone, string> = {
  brand: "bg-brand-100 text-brand-700",
  green: "bg-emerald-100 text-emerald-700",
  amber: "bg-amber-100 text-amber-700",
  red: "bg-rose-100 text-rose-700",
  slate: "bg-slate-200 text-slate-700"
};

export default function Badge({
  children,
  tone = "slate"
}: {
  children: ReactNode;
  tone?: Tone;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide ${TONES[tone]}`}
    >
      {children}
    </span>
  );
}
