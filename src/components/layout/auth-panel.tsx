"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSupabaseUser } from "@/hooks/use-supabase-user";

export function AuthPanel() {
  const router = useRouter();
  const { user, loading, supabase } = useSupabaseUser();
  const username = user?.email?.split("@")[0] ?? "studio";

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.refresh();
    router.push("/auth");
  }

  return (
    <div className="glass-card mt-8 hidden rounded-2xl p-4 lg:block">
      <p className="lyra-label text-xs">
        {loading ? "Checking session" : user ? `@${username}` : "MVP Mode"}
      </p>
      <p className="mt-3 text-sm leading-6 text-slate-300">
        {user
          ? "Your browser session is active. Create, inspect, and remix agents from here."
          : "Sign in to create and remix real agents backed by Supabase."}
      </p>
      {user ? (
        <button
          type="button"
          onClick={handleSignOut}
          className="mt-4 rounded-full border border-[var(--lyra-button-border)] bg-white/[0.045] px-4 py-2 text-sm text-[var(--lyra-button-text)] transition hover:border-[var(--lyra-button-hover-border)] hover:bg-[var(--lyra-button-hover-bg)]"
        >
          Sign out
        </button>
      ) : (
        <Link
          href="/auth"
          className="mt-4 inline-flex rounded-full border border-[var(--lyra-button-border)] bg-white/[0.045] px-4 py-2 text-sm text-[var(--lyra-button-text)] transition hover:border-[var(--lyra-button-hover-border)] hover:bg-[var(--lyra-button-hover-bg)]"
        >
          Sign in
        </Link>
      )}
    </div>
  );
}
