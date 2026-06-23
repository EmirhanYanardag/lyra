"use client";

import { useEffect, useState } from "react";
import { AgentCard } from "@/components/agents/agent-card";
import { LinkButton } from "@/components/ui/button";
import { useSupabaseUser } from "@/hooks/use-supabase-user";
import {
  ensureClientProfile,
  formatSupabaseClientError,
  getMyAgentsClient,
} from "@/lib/lyra/client-agents";
import type { Agent, UserProfile } from "@/types";

export function AgentsStudio() {
  const { user, loading, error, supabase } = useSupabaseUser();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [dataLoading, setDataLoading] = useState(false);
  const [dataError, setDataError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadStudio() {
      if (!user) {
        setProfile(null);
        setAgents([]);
        return;
      }

      setDataLoading(true);
      setDataError(null);

      try {
        const nextProfile = await ensureClientProfile(supabase, user);
        const nextAgents = await getMyAgentsClient(
          supabase,
          user.id,
          nextProfile.username,
        );

        if (!isMounted) {
          return;
        }

        setProfile(nextProfile);
        setAgents(nextAgents);
      } catch (caughtError) {
        if (!isMounted) {
          return;
        }

        setDataError(formatSupabaseClientError(caughtError));
      } finally {
        if (isMounted) {
          setDataLoading(false);
        }
      }
    }

    void loadStudio();

    return () => {
      isMounted = false;
    };
  }, [supabase, user]);

  const isLoading = loading || dataLoading;
  const canCreateAgent = Boolean(user && profile && !dataError && !error);

  return (
    <>
        <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-4xl font-semibold text-white">
              Your remixable identities
            </h1>
          <p className="mt-3 max-w-2xl text-slate-300">
            Create real Supabase-backed agents now. Clone and mix flows stay
            staged for the next MVP pass.
          </p>
        </div>
        {canCreateAgent && <LinkButton href="/agents/new">New Agent</LinkButton>}
      </div>

      {isLoading ? (
        <StudioState
          title="Opening your studio..."
          body="Reading the active browser session and loading your agents."
        />
      ) : error || dataError ? (
        <StudioState
          title="Studio could not load."
          body={error ?? dataError ?? "Something went wrong."}
        />
      ) : !user ? (
        <StudioState
          title="Sign in to create and remix agents."
          body="Your private studio unlocks real agent creation, profile ownership, and future remix lineage."
          actionHref="/auth"
          actionLabel="Sign in"
        />
      ) : agents.length === 0 ? (
        <StudioState
          title={`Welcome${profile ? `, ${profile.displayName}` : ""}.`}
          body="No agents yet. Start with a name and a topic; LYRA will generate basic metadata locally for now."
          actionHref="/agents/new"
          actionLabel="Create your first agent"
        />
      ) : (
        <section className="mt-8 grid gap-5 lg:grid-cols-2">
          {agents.map((agent) => (
            <AgentCard
              key={agent.id}
              agent={agent}
              showViewButton
              showChatButton
            />
          ))}
        </section>
      )}
    </>
  );
}

function StudioState({
  title,
  body,
  actionHref,
  actionLabel,
}: {
  title: string;
  body: string;
  actionHref?: string;
  actionLabel?: string;
}) {
  return (
    <section className="glass-card mt-8 rounded-2xl p-8">
      <h2 className="text-2xl font-semibold text-white">{title}</h2>
      <p className="mt-3 max-w-2xl text-slate-300">{body}</p>
      {actionHref && actionLabel && (
        <LinkButton href={actionHref} className="mt-6">
          {actionLabel}
        </LinkButton>
      )}
    </section>
  );
}
