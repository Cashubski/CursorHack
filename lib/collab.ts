"use client";

import { create } from "zustand";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { getSupabase } from "./supabase";
import { toast } from "./toast";

export interface Member {
  /** Stable presence key for this browser tab. */
  key: string;
  /** GitHub login when signed in, otherwise a guest label. */
  handle: string;
  name: string;
  avatar: string | null;
  color: string;
  signedIn: boolean;
}

interface CollabState {
  me: Member | null;
  online: Member[];
  ready: boolean;
  setMe: (me: Member | null) => void;
  setOnline: (online: Member[]) => void;
  setReady: (ready: boolean) => void;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
}

const GUEST_KEY = "patchpilot.guest.v1";

const COLORS = [
  "#6c5ef5",
  "#10b981",
  "#f59e0b",
  "#ef4444",
  "#0ea5e9",
  "#ec4899",
  "#8b5cf6",
  "#14b8a6"
];

function colorFor(seed: string): string {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return COLORS[h % COLORS.length];
}

function guestKey(): string {
  if (typeof window === "undefined") return "guest";
  let k = window.localStorage.getItem(GUEST_KEY);
  if (!k) {
    k =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `g_${Math.random().toString(36).slice(2, 10)}`;
    window.localStorage.setItem(GUEST_KEY, k);
  }
  return k;
}

function guestMember(): Member {
  const key = guestKey();
  return {
    key,
    handle: "guest",
    name: `Guest ${key.slice(0, 4)}`,
    avatar: null,
    color: colorFor(key),
    signedIn: false
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function memberFromUser(user: any): Member {
  const key = guestKey();
  const meta = user?.user_metadata ?? {};
  const handle: string = meta.user_name || meta.preferred_username || "user";
  return {
    key,
    handle,
    name: meta.full_name || meta.name || handle,
    avatar: meta.avatar_url || null,
    color: colorFor(handle),
    signedIn: true
  };
}

export const useCollab = create<CollabState>((set) => ({
  me: null,
  online: [],
  ready: false,
  setMe: (me) => set({ me }),
  setOnline: (online) => set({ online }),
  setReady: (ready) => set({ ready }),

  signIn: async () => {
    const supabase = getSupabase();
    if (!supabase) {
      toast.error("Sign-in unavailable", "Connect Supabase to enable accounts.");
      return;
    }
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "github",
      options: { redirectTo: window.location.origin }
    });
    if (error) {
      toast.error(
        "GitHub sign-in isn’t enabled yet",
        "Enable the GitHub provider in Supabase Auth."
      );
    }
  },

  signOut: async () => {
    const supabase = getSupabase();
    await supabase?.auth.signOut();
    toast.info("Signed out");
  }
}));

let channel: RealtimeChannel | null = null;
let started = false;

function computeOnline(): Member[] {
  if (!channel) return [];
  const state = channel.presenceState<Member>();
  const seen = new Set<string>();
  const out: Member[] = [];
  for (const entries of Object.values(state)) {
    for (const m of entries) {
      if (m && m.key && !seen.has(m.key)) {
        seen.add(m.key);
        out.push(m);
      }
    }
  }
  return out.sort((a, b) => Number(b.signedIn) - Number(a.signedIn));
}

/**
 * Boots the collaboration layer: resolves the current identity (GitHub session
 * or guest), joins a realtime presence room, and keeps the store in sync. Safe
 * no-op when Supabase isn't configured. Returns a cleanup function.
 */
export function initCollab(): () => void {
  const store = useCollab.getState();
  const supabase = getSupabase();

  if (!supabase) {
    store.setReady(true);
    return () => {};
  }
  if (started) return () => {};
  started = true;

  async function boot() {
    const { data } = await supabase!.auth.getSession();
    const me = data.session?.user
      ? memberFromUser(data.session.user)
      : guestMember();
    useCollab.getState().setMe(me);
    useCollab.getState().setReady(true);

    channel = supabase!.channel("presence:lobby", {
      config: { presence: { key: me.key } }
    });
    channel
      .on("presence", { event: "sync" }, () => {
        useCollab.getState().setOnline(computeOnline());
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED" && channel) {
          await channel.track(useCollab.getState().me ?? me);
        }
      });
  }

  boot();

  const { data: sub } = supabase.auth.onAuthStateChange(async (_event, session) => {
    const me = session?.user ? memberFromUser(session.user) : guestMember();
    useCollab.getState().setMe(me);
    if (channel) await channel.track(me);
    if (session?.user) {
      toast.success("Signed in", `Welcome, ${me.name}.`);
    }
  });

  return () => {
    sub.subscription.unsubscribe();
    if (channel) {
      supabase.removeChannel(channel);
      channel = null;
    }
    started = false;
  };
}
