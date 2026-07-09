import type { ReactNode } from "react";

type Tone = "brand" | "green" | "amber" | "red" | "slate";

const TONES: Record<Tone, { wrap: string; dot: string }> = {
  brand: { wrap: "bg-iris-50 text-iris-700 ring-iris-100", dot: "bg-iris-500" },
  green: {
    wrap: "bg-emerald-50 text-emerald-700 ring-emerald-100",
    dot: "bg-emerald-500"
  },
  amber: { wrap: "bg-amber-50 text-amber-700 ring-amber-100", dot: "bg-amber-500" },
  red: { wrap: "bg-rose-50 text-rose-700 ring-rose-100", dot: "bg-rose-500" },
  slate: { wrap: "bg-ink-100 text-ink-600 ring-ink-200", dot: "bg-ink-400" }
};

export default function Badge({
  children,
  tone = "slate",
  dot = true
}: {
  children: ReactNode;
  tone?: Tone;
  dot?: boolean;
}) {
  const t = TONES[tone];
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ring-1 ring-inset ${t.wrap}`}
    >
      {dot && <span className={`h-1.5 w-1.5 rounded-full ${t.dot}`} />}
      {children}
    </span>
  );
}
