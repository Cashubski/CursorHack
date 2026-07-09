// Seed the PatchPilot `tasks` table with a few realistic demo rows so the
// dashboard looks populated for a demo. Safe to re-run: it clears prior
// seed rows (reporter starting with "demo:") before inserting.
//
// Usage:
//   NEXT_PUBLIC_SUPABASE_URL=... NEXT_PUBLIC_SUPABASE_ANON_KEY=... node scripts/seed.mjs
// or place the vars in .env.local and run `npm run seed`.

import { readFileSync } from "node:fs";

function loadEnvLocal() {
  try {
    const raw = readFileSync(new URL("../.env.local", import.meta.url), "utf8");
    for (const line of raw.split("\n")) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
      if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
    }
  } catch {
    // no .env.local, rely on process env
  }
}

loadEnvLocal();

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!url || !key) {
  console.error(
    "Missing NEXT_PUBLIC_SUPABASE_URL and/or a Supabase key. Set them in the environment or .env.local."
  );
  process.exit(1);
}

const headers = {
  apikey: key,
  Authorization: `Bearer ${key}`,
  "Content-Type": "application/json"
};

function diff(files) {
  return files;
}

const now = Date.now();
const iso = (minsAgo) => new Date(now - minsAgo * 60000).toISOString();

const rows = [
  {
    created_at: iso(240),
    title: "Notes silently dropped after offline sync",
    reporter: "demo:beta-user-1042",
    severity: "high",
    area: "Sync",
    status: "merged",
    issue: {
      rawReport:
        "the app keeps losing my notes after I've been offline. add notes with wifi off, turn wifi on, one note goes blank.",
      reporter: "demo:beta-user-1042",
      severity: "high",
      area: "Sync"
    },
    brief: {
      title: "Notes silently dropped after offline sync",
      summary:
        "HIGH severity Sync issue. Offline edits are lost when the sync engine resolves conflicts. Scope the fix narrowly and add a regression test.",
      reproSteps: [
        "Open the app with connectivity disabled",
        "Create two notes",
        "Re-enable connectivity and let it sync",
        "Observe one note is blank / missing"
      ],
      affectedArea: "Sync module",
      proposedApproach:
        "Trace the conflict resolver, reproduce the loss with a focused test, and prefer local edits on last-write-wins ties.",
      acceptanceCriteria: [
        "Offline edits survive a sync round-trip",
        "A regression test covers the conflict path",
        "No new lint or type errors",
        "Change stays scoped to the Sync module"
      ],
      likelyFiles: [
        "src/sync/engine.ts",
        "src/sync/conflictResolver.ts",
        "src/db/offlineCache.ts"
      ],
      risk: "medium",
      source: "template"
    },
    run: {
      status: "merged",
      steps: [],
      logs: [],
      diffFiles: diff([
        { path: "src/sync/conflictResolver.ts", additions: 21, deletions: 6 },
        { path: "src/sync/engine.ts", additions: 12, deletions: 3 },
        { path: "src/sync/__tests__/conflictResolver.test.ts", additions: 34, deletions: 0 }
      ]),
      branch: "patchpilot/notes-silently-dropped-after-offli",
      prUrl: "https://github.com/acme/app/pull/1427",
      startedAt: now - 240 * 60000
    },
    review: {
      checklist: [],
      decision: "approved",
      note: "Confirmed offline edits persist. Clean, scoped fix."
    }
  },
  {
    created_at: iso(65),
    title: "Checkout hangs on the payment confirmation screen",
    reporter: "demo:qa-team",
    severity: "critical",
    area: "Payments",
    status: "review",
    issue: {
      rawReport:
        "tapping Pay just spins forever on the confirm screen. card gets charged but the app never confirms.",
      reporter: "demo:qa-team",
      severity: "critical",
      area: "Payments"
    },
    brief: {
      title: "Checkout hangs on the payment confirmation screen",
      summary:
        "CRITICAL severity Payments issue. The confirm screen never resolves after a successful charge. Add idempotent confirmation handling.",
      reproSteps: [
        "Add an item and go to checkout",
        "Tap Pay",
        "Observe the spinner never resolves though the charge succeeds"
      ],
      affectedArea: "Payments module",
      proposedApproach:
        "Make the confirmation poll idempotent and time-bounded; reconcile against the webhook result.",
      acceptanceCriteria: [
        "Confirmation resolves within 5s of a successful charge",
        "Double-charge is impossible on retry",
        "Regression test covers the webhook race",
        "Change stays scoped to Payments"
      ],
      likelyFiles: [
        "src/payments/checkout.ts",
        "src/payments/webhooks.ts",
        "src/lib/stripe.ts"
      ],
      risk: "high",
      source: "template"
    },
    run: {
      status: "awaiting-review",
      steps: [],
      logs: [],
      diffFiles: diff([
        { path: "src/payments/checkout.ts", additions: 28, deletions: 9 },
        { path: "src/payments/webhooks.ts", additions: 17, deletions: 4 },
        { path: "src/payments/__tests__/checkout.test.ts", additions: 41, deletions: 0 }
      ]),
      branch: "patchpilot/checkout-hangs-on-payment-confirm",
      prUrl: "https://github.com/acme/app/pull/1431",
      startedAt: now - 60 * 60000
    },
    review: null
  },
  {
    created_at: iso(12),
    title: "Push notifications duplicated on Android",
    reporter: "demo:support",
    severity: "medium",
    area: "Notifications",
    status: "running",
    issue: {
      rawReport:
        "android users are getting the same push notification 2-3 times within a few seconds.",
      reporter: "demo:support",
      severity: "medium",
      area: "Notifications"
    },
    brief: {
      title: "Push notifications duplicated on Android",
      summary:
        "MEDIUM severity Notifications issue. The delivery queue re-enqueues on ack timeout. De-duplicate by message id.",
      reproSteps: [
        "Trigger a push to an Android device",
        "Observe 2-3 duplicate deliveries within seconds"
      ],
      affectedArea: "Notifications module",
      proposedApproach:
        "Add a message-id dedupe window in the queue and confirm acks before re-enqueue.",
      acceptanceCriteria: [
        "A single logical push delivers exactly once",
        "Regression test covers the ack-timeout path",
        "No new lint or type errors",
        "Change stays scoped to Notifications"
      ],
      likelyFiles: ["src/notifications/queue.ts", "src/notifications/push.ts"],
      risk: "low",
      source: "template"
    },
    run: null,
    review: null
  },
  {
    created_at: iso(3),
    title: "Search returns stale results after filter change",
    reporter: "demo:pm",
    severity: "low",
    area: "Search",
    status: "briefed",
    issue: {
      rawReport:
        "when I change a filter the search list shows the previous results for a second before updating.",
      reporter: "demo:pm",
      severity: "low",
      area: "Search"
    },
    brief: {
      title: "Search returns stale results after filter change",
      summary:
        "LOW severity Search issue. A race between filter changes shows stale results. Cancel in-flight queries on change.",
      reproSteps: [
        "Run a search",
        "Change a filter quickly",
        "Observe the old results flash before the new ones load"
      ],
      affectedArea: "Search module",
      proposedApproach:
        "Cancel superseded queries and key results by the active filter signature.",
      acceptanceCriteria: [
        "Stale results never render after a filter change",
        "Regression test covers rapid filter switching",
        "No new lint or type errors",
        "Change stays scoped to Search"
      ],
      likelyFiles: ["src/search/index.ts", "src/search/ranking.ts"],
      risk: "low",
      source: "template"
    },
    run: null,
    review: null
  }
];

async function main() {
  // Clear prior seed rows.
  const del = await fetch(`${url}/rest/v1/tasks?reporter=like.demo:*`, {
    method: "DELETE",
    headers
  });
  if (!del.ok && del.status !== 204) {
    console.error("Failed to clear old seed rows:", del.status, await del.text());
  }

  const res = await fetch(`${url}/rest/v1/tasks`, {
    method: "POST",
    headers: { ...headers, Prefer: "return=representation" },
    body: JSON.stringify(rows)
  });

  if (!res.ok) {
    console.error("Seed failed:", res.status, await res.text());
    process.exit(1);
  }

  const data = await res.json();
  console.log(`Seeded ${data.length} demo tasks into ${url}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
