"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { usePatchPilot } from "@/lib/store";
import Card from "@/components/Card";
import Badge from "@/components/Badge";
import BottomBar from "@/components/BottomBar";

export default function ReviewPage() {
  const router = useRouter();
  const { brief, run, review, toggleCheck, setDecision, setReviewNote, mergeRun, reset } =
    usePatchPilot();

  useEffect(() => {
    if (!brief) router.replace("/intake");
  }, [brief, router]);

  if (!brief) return null;

  const requiredDone = review.checklist
    .filter((c) => c.required)
    .every((c) => c.checked);
  const checkedCount = review.checklist.filter((c) => c.checked).length;
  const merged = run.status === "merged";
  const canMerge = requiredDone && review.decision === "approved" && !merged;

  const totalAdditions = run.diffFiles.reduce((a, f) => a + f.additions, 0);
  const totalDeletions = run.diffFiles.reduce((a, f) => a + f.deletions, 0);

  function startOver() {
    reset();
    router.push("/intake");
  }

  if (merged) {
    return (
      <div className="flex min-h-[60vh] animate-slideUp flex-col items-center justify-center space-y-4 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-3xl">
          ✅
        </div>
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900">
            Merged
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            {run.branch} was approved and merged.
          </p>
        </div>
        <a
          href={run.prUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-brand-700"
        >
          View pull request →
        </a>
        <BottomBar primaryLabel="Start a new report" onPrimary={startOver} />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex animate-slideUp items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold tracking-tight text-slate-900">
            Human review
          </h2>
          <p className="mt-0.5 text-sm text-slate-500">
            Verify the patch before it merges.
          </p>
        </div>
        <Badge
          tone={
            review.decision === "approved"
              ? "green"
              : review.decision === "changes-requested"
                ? "red"
                : "slate"
          }
        >
          {review.decision === "pending" ? "not reviewed" : review.decision}
        </Badge>
      </div>

      <Card title="Change summary">
        <p className="text-sm font-semibold text-slate-800">{brief.title}</p>
        <div className="mt-2 flex items-center gap-3 text-xs font-semibold">
          <span className="text-emerald-600">+{totalAdditions}</span>
          <span className="text-rose-600">-{totalDeletions}</span>
          <span className="text-slate-400">{run.diffFiles.length} files</span>
          <a
            href={run.prUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="ml-auto font-semibold text-brand-600"
          >
            PR ↗
          </a>
        </div>
        <ul className="mt-3 space-y-1.5">
          {run.diffFiles.map((f) => (
            <li
              key={f.path}
              className="flex items-center justify-between gap-2 rounded-lg bg-slate-50 px-3 py-2"
            >
              <span className="truncate font-mono text-[12px] text-slate-700">
                {f.path}
              </span>
              <span className="shrink-0 font-mono text-[11px]">
                <span className="text-emerald-600">+{f.additions}</span>{" "}
                <span className="text-rose-600">-{f.deletions}</span>
              </span>
            </li>
          ))}
        </ul>
      </Card>

      <Card
        title="Safety checklist"
        action={
          <span className="text-[11px] font-semibold text-slate-400">
            {checkedCount}/{review.checklist.length}
          </span>
        }
      >
        <ul className="space-y-2">
          {review.checklist.map((item) => (
            <li key={item.key}>
              <button
                type="button"
                onClick={() => toggleCheck(item.key)}
                className={[
                  "flex w-full items-start gap-3 rounded-xl border p-3 text-left transition active:scale-[0.99]",
                  item.checked
                    ? "border-emerald-300 bg-emerald-50"
                    : "border-slate-200 bg-white"
                ].join(" ")}
              >
                <span
                  className={[
                    "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border text-[11px] font-bold",
                    item.checked
                      ? "border-emerald-500 bg-emerald-500 text-white"
                      : "border-slate-300 bg-white text-transparent"
                  ].join(" ")}
                >
                  ✓
                </span>
                <span className="min-w-0">
                  <span className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-slate-800">
                      {item.label}
                    </span>
                    {item.required && (
                      <span className="text-[10px] font-bold uppercase text-rose-500">
                        required
                      </span>
                    )}
                  </span>
                  <span className="mt-0.5 block text-xs text-slate-500">
                    {item.hint}
                  </span>
                </span>
              </button>
            </li>
          ))}
        </ul>
        {!requiredDone && (
          <p className="mt-2 text-[11px] text-rose-500">
            Confirm all required checks to enable merge.
          </p>
        )}
      </Card>

      <Card title="Reviewer note">
        <textarea
          value={review.note}
          onChange={(e) => setReviewNote(e.target.value)}
          rows={2}
          placeholder="Optional note for the author..."
          className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-800 outline-none transition focus:border-brand-400 focus:bg-white focus:ring-2 focus:ring-brand-100"
        />
        <div className="mt-3 grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setDecision("changes-requested")}
            className={[
              "rounded-xl border px-3 py-2.5 text-sm font-semibold transition active:scale-[0.98]",
              review.decision === "changes-requested"
                ? "border-rose-400 bg-rose-50 text-rose-700"
                : "border-slate-200 bg-white text-slate-600"
            ].join(" ")}
          >
            Request changes
          </button>
          <button
            type="button"
            onClick={() => setDecision("approved")}
            disabled={!requiredDone}
            className={[
              "rounded-xl border px-3 py-2.5 text-sm font-semibold transition active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50",
              review.decision === "approved"
                ? "border-emerald-400 bg-emerald-50 text-emerald-700"
                : "border-slate-200 bg-white text-slate-600"
            ].join(" ")}
          >
            Approve
          </button>
        </div>
      </Card>

      <BottomBar
        primaryLabel="Merge patch"
        onPrimary={mergeRun}
        primaryDisabled={!canMerge}
        secondaryLabel="Back"
        onSecondary={() => router.push("/run")}
        helper={
          review.decision === "changes-requested"
            ? "Changes requested - merge is blocked"
            : canMerge
              ? undefined
              : "Approve with all required checks to merge"
        }
      />
    </div>
  );
}
