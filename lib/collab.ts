"use client";

import { create } from "zustand";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { getSupabase } from "./supabase";
import { toast } from "./toast";

export type MemberSource = "github" | "profile" | "guest";

export interface Member {
  /** Stable presence key for this browser tab. */
  key: string;
  /** GitHub login (or chosen handle) when identified, else a guest label. */
  handle: string;
  name: string;
  avatar: string | null;
  color: string;
  source: MemberSource;
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
  /** Zero-setup identity: join with a display name + optional GitHub handle. */
  setProfile: (name: string, handle?: string) => void;
  clearProfile: () => Promise<void>;
}

const GUEST_KEY = "patchpilot.guest.v1";
const PROFILE_KEY = "patchpilot.profile.v1";

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

interface Profile {
  name: string;
  handle: string;
}

function readProfile(): Profile | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(PROFILE_KEY);
    return raw ? (JSON.parse(raw) as Profile) : null;
  } catch {
    return null;
  }
}

function cleanHandle(handle?: string): string {
  return (handle ?? "").trim().replace(/^@/, "").replace(/[^a-zA-Z0-9-]/g, "");
}

function guestMember(): Member {
  const key = guestKey();
  return {
    key,
    handle: "guest",
    name: `Guest ${key.slice(0, 4)}`,
    avatar: null,
    color: colorFor(key),
    source: "guest",
    signedIn: false
  };
}

function memberFromProfile(p: Profile): Member {
  const key = guestKey();
  const handle = cleanHandle(p.handle);
  const name = p.name.trim() || handle || "Anon";
  return {
    key,
    handle: handle || name.toLowerCase().replace(/\s+/g, "-"),
    name,
    avatar: handle ? `https://github.com/${handle}.png?size=96` : null,
    color: colorFor(handle || name),
    source: "profile",
    signedIn: true
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
    source: "github",
    signedIn: true
  };
}

/** Resolve the local identity: saved profile if present, else a guest. */
function localMember(): Member {
  const p = readProfile();
  return p ? memberFromProfile(p) : guestMember();
}

let channel: RealtimeChannel | null = null;
let started = false;

async function trackMe() {
  if (channel) await channel.track(useCollab.getState().me ?? guestMember());
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
        "Use Quick join, or enable the GitHub provider in Supabase."
      );
    }
  },

  signOut: async () => {
    const supabase = getSupabase();
    await supabase?.auth.signOut();
    toast.info("Signed out");
  },

  setProfile: (name, handle) => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(
        PROFILE_KEY,
        JSON.stringify({ name: name.trim(), handle: cleanHandle(handle) })
      );
    }
    const me = memberFromProfile({ name, handle: handle ?? "" });
    set({ me });
    void trackMe();
    toast.success("You’re in", `Joined as ${me.name}.`);
  },

  clearProfile: async () => {
    if (typeof window !== "undefined") {
      window.localStorage.removeItem(PROFILE_KEY);
    }
    set({ me: guestMember() });
    await trackMe();
    toast.info("Left the room");
  }
}));

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
 * Boots the collaboration layer: resolves identity (GitHub session, saved
 * profile, or guest), joins a realtime presence room, and keeps the store in
 * sync. Safe no-op when Supabase isn't configured. Returns a cleanup function.
 */
export function initCollab(): () => void {
  const store = useCollab.getState();
  const supabase = getSupabase();

  if (!supabase) {
    store.setMe(localMember());
    store.setReady(true);
    return () => {};
  }
  if (started) return () => {};
  started = true;

  async function boot() {
    const { data } = await supabase!.auth.getSession();
    const me = data.session?.user
      ? memberFromUser(data.session.user)
      : localMember();
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
        if (status === "SUBSCRIBED") await trackMe();
      });
  }

  boot();

  const { data: sub } = supabase.auth.onAuthStateChange(async (_event, session) => {
    const me = session?.user ? memberFromUser(session.user) : localMember();
    useCollab.getState().setMe(me);
    await trackMe();
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
