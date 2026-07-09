"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Check,
  CircleCheck,
  GitMerge,
  GitPullRequest,
  ShieldCheck,
  ThumbsDown,
  ThumbsUp,
  ExternalLink,
  Plus,
  Cpu
} from "lucide-react";
import { usePatchPilot } from "@/lib/store";
import { useCollab } from "@/lib/collab";
import { toast } from "@/lib/toast";
import Card from "@/components/Card";
import Badge from "@/components/Badge";
import BottomBar from "@/components/BottomBar";
import SafetyGate from "@/components/SafetyGate";
import Confetti from "@/components/Confetti";

export default function ReviewPage() {
  const router = useRouter();
  const { brief, run, review, toggleCheck, setDecision, setReviewNote, mergeRun, reset } =
    usePatchPilot();
  const me = useCollab((s) => s.me);
  const myHandle = me?.signedIn ? me.handle : null;

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
  const hasDiff = run.diffFiles.length > 0;
  const isReal = run.mode === "real";

  function startOver() {
    reset();
    router.push("/intake");
  }

  async function handleDecision(decision: "approved" | "changes-requested") {
    setDecision(decision, myHandle);
    await usePatchPilot.getState().persist();
    if (decision === "approved") {
      toast.success("Approved", "Safety gate cleared — ready to merge.");
    } else {
      toast.info("Changes requested", "Merge is blocked until resolved.");
    }
  }

  async function handleMerge() {
    mergeRun(myHandle);
    await usePatchPilot.getState().persist("merged");
    toast.success("Patch merged", "The reviewed patch is on its way.");
  }

  if (merged) {
    return (
      <div className="mx-auto max-w-2xl animate-slideUp">
        <div className="relative overflow-hidden rounded-3xl border border-emerald-200 bg-white p-10 text-center shadow-card">
          <Confetti />
          <div className="pointer-events-none absolute -top-16 left-1/2 h-48 w-48 -translate-x-1/2 rounded-full bg-emerald-300/25 blur-3xl" />
          <div className="relative flex flex-col items-center gap-4">
            <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-500 text-white shadow-[0_10px_30px_-8px_rgba(16,185,129,0.6)]">
              <GitMerge size={30} />
            </span>
            <div>
              <h2 className="text-2xl font-semibold tracking-tight text-ink-900">
                Patch merged
              </h2>
              <p className="mt-1 text-sm text-ink-500">
                <span className="font-mono text-ink-700">{run.branch}</span> was
                approved and merged
                {review.mergedBy ? (
                  <>
                    {" "}
                    by <span className="font-semibold text-ink-700">@{review.mergedBy}</span>
                  </>
                ) : null}
                .
              </p>
            </div>
            <div className="mt-1 flex flex-wrap items-center justify-center gap-3">
              <a
                href={run.prUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-xl border border-ink-200 bg-white px-4 py-2.5 text-sm font-semibold text-ink-700 shadow-card transition hover:bg-ink-50"
              >
                <ExternalLink size={16} />
                View pull request
              </a>
              <button
                type="button"
                onClick={startOver}
                className="inline-flex items-center gap-2 rounded-xl bg-iris-500 px-4 py-2.5 text-sm font-semibold text-white shadow-[0_6px_16px_-6px_rgba(108,94,245,0.6)] transition hover:bg-iris-600"
              >
                <Plus size={16} />
                New report
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <div className="flex animate-slideUp items-start justify-between gap-3">
        <div>
          <p className="eyebrow">Step 4 · Review</p>
          <h2 className="mt-1 text-2xl font-semibold tracking-tight text-ink-900">
            Human review
          </h2>
          <p className="mt-1 text-sm text-ink-500">
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

      <SafetyGate
        checklist={review.checklist}
        decision={review.decision}
        risk={brief.risk}
      />

      <Card title="Change summary" icon={<GitPullRequest size={13} />}>
        <p className="text-[15px] font-semibold text-ink-900">{brief.title}</p>
        <div className="mt-2 flex items-center gap-3 text-xs font-semibold">
          {hasDiff ? (
            <>
              <span className="font-mono text-emerald-600">+{totalAdditions}</span>
              <span className="font-mono text-rose-500">−{totalDeletions}</span>
              <span className="text-ink-400">{run.diffFiles.length} files</span>
            </>
          ) : (
            <span className="inline-flex items-center gap-1.5 text-ink-500">
              {isReal && <Cpu size={12} className="text-iris-500" />}
              {run.branch ? (
                <span className="font-mono text-ink-700">{run.branch}</span>
              ) : (
                "Dispatched to Cursor agent"
              )}
            </span>
          )}
          {run.prUrl && (
            <a
              href={run.prUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="ml-auto inline-flex items-center gap-1 font-semibold text-iris-600 hover:text-iris-700"
            >
              PR <ExternalLink size={12} />
            </a>
          )}
        </div>
        {hasDiff ? (
          <ul className="mt-3 space-y-1.5">
            {run.diffFiles.map((f) => (
              <li
                key={f.path}
                className="flex items-center justify-between gap-2 rounded-lg border border-ink-200/70 bg-ink-50 px-3 py-2"
              >
                <span className="truncate font-mono text-[12px] text-ink-700">
                  {f.path}
                </span>
                <span className="shrink-0 font-mono text-[11px]">
                  <span className="text-emerald-600">+{f.additions}</span>{" "}
                  <span className="text-rose-500">−{f.deletions}</span>
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-3 rounded-lg border border-ink-200/70 bg-ink-50 px-3 py-2.5 text-xs text-ink-500">
            This patch was produced by a live Cursor agent. Open the pull request to
            review the full file-level diff before approving.
          </p>
        )}
      </Card>

      <Card
        title="Safety checklist"
        icon={<ShieldCheck size={13} />}
        action={
          <span className="rounded-full bg-ink-100 px-2 py-0.5 text-[11px] font-semibold text-ink-500">
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
                    ? "border-emerald-200 bg-emerald-50/60"
                    : "border-ink-200 bg-white hover:border-ink-300"
                ].join(" ")}
              >
                <span
                  className={[
                    "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition",
                    item.checked
                      ? "border-emerald-500 bg-emerald-500 text-white"
                      : "border-ink-300 bg-white text-transparent"
                  ].join(" ")}
                >
                  <Check size={13} strokeWidth={3} />
                </span>
                <span className="min-w-0">
                  <span className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-ink-800">
                      {item.label}
                    </span>
                    {item.required && (
                      <span className="rounded bg-rose-50 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-rose-500">
                        required
                      </span>
                    )}
                  </span>
                  <span className="mt-0.5 block text-xs text-ink-400">
                    {item.hint}
                  </span>
                </span>
              </button>
            </li>
          ))}
        </ul>
        {!requiredDone && (
          <p className="mt-2 flex items-center gap-1.5 text-[11px] text-rose-500">
            <CircleCheck size={12} />
            Confirm all required checks to enable merge.
          </p>
        )}
      </Card>

      <Card title="Reviewer note">
        <textarea
          value={review.note}
          onChange={(e) => setReviewNote(e.target.value)}
          rows={2}
          placeholder="Optional note for the author…"
          className="field resize-none"
        />
        <div className="mt-3 grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => handleDecision("changes-requested")}
            className={[
              "inline-flex items-center justify-center gap-2 rounded-xl border px-3 py-2.5 text-sm font-semibold transition active:scale-[0.98]",
              review.decision === "changes-requested"
                ? "border-rose-300 bg-rose-50 text-rose-700"
                : "border-ink-200 bg-white text-ink-600 hover:border-ink-300"
            ].join(" ")}
          >
            <ThumbsDown size={15} />
            Request changes
          </button>
          <button
            type="button"
            onClick={() => handleDecision("approved")}
            disabled={!requiredDone}
            className={[
              "inline-flex items-center justify-center gap-2 rounded-xl border px-3 py-2.5 text-sm font-semibold transition active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50",
              review.decision === "approved"
                ? "border-emerald-300 bg-emerald-50 text-emerald-700"
                : "border-ink-200 bg-white text-ink-600 hover:border-ink-300"
            ].join(" ")}
          >
            <ThumbsUp size={15} />
            Approve
          </button>
        </div>
        {review.decision !== "pending" && review.reviewedBy && (
          <p className="mt-2.5 text-xs text-ink-400">
            {review.decision === "approved" ? "Approved" : "Changes requested"} by{" "}
            <span className="font-semibold text-ink-600">@{review.reviewedBy}</span>
          </p>
        )}
      </Card>

      <BottomBar
        primaryLabel="Merge patch"
        primaryIcon={<GitMerge size={16} />}
        onPrimary={handleMerge}
        primaryDisabled={!canMerge}
        secondaryLabel="Back"
        onSecondary={() => router.push("/run")}
        helper={
          review.decision === "changes-requested"
            ? "Changes requested — merge is blocked"
            : canMerge
              ? undefined
              : "Approve with all required checks to merge"
        }
      />
    </div>
  );
}
