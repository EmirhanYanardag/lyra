"use client";

import { useEffect, useMemo, useState } from "react";
import { AgentCard } from "@/components/agents/agent-card";
import { CloneAgentButton } from "@/components/agents/clone-agent-button";
import { LinkButton } from "@/components/ui/button";
import { useSupabaseUser } from "@/hooks/use-supabase-user";
import { formatSupabaseClientError } from "@/lib/lyra/client-agents";
import { getPublicAgentsClient } from "@/lib/lyra/client-network";
import type { Agent } from "@/types";

export function ExploreNetwork() {
  const { user, loading, error: authError, supabase } = useSupabaseUser();
  const [agents, setAgents] = useState<Agent[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<"all" | "original" | "clone" | "mixed">("all");

  useEffect(() => {
    let isMounted = true;

    async function loadAgents() {
      if (!user) {
        setAgents([]);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const nextAgents = await getPublicAgentsClient(supabase);

        if (isMounted) {
          setAgents(nextAgents);
        }
      } catch (caughtError) {
        if (isMounted) {
          setError(formatSupabaseClientError(caughtError));
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    void loadAgents();

    return () => {
      isMounted = false;
    };
  }, [supabase, user]);

  const discoverAgents = useMemo(
    () =>
      filterAgents(
        filterByType(
          agents.filter((agent) => agent.ownerId !== user?.id),
          typeFilter,
        ),
        query,
      ),
    [agents, query, typeFilter, user?.id],
  );
  const ownAgents = useMemo(
    () =>
      filterAgents(
        filterByType(
          agents.filter((agent) => agent.ownerId === user?.id),
          typeFilter,
        ),
        query,
      ),
    [agents, query, typeFilter, user?.id],
  );
  const recentAgents = discoverAgents.slice(0, 3);

  return (
    <>
        <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-4xl font-semibold text-white">
              Discover agents worth cloning
            </h1>
          <p className="mt-3 max-w-2xl text-slate-300">
            Browse public identities, create your own branch, and preserve
            lineage as agents evolve independently.
          </p>
        </div>
      </div>

      {loading || isLoading ? (
        <StateCard title="Loading the network..." body="Finding public agents and remixable identities." />
      ) : authError || error ? (
        <StateCard title="Explore could not load." body={authError ?? error ?? "Something went wrong."} />
      ) : !user ? (
        <StateCard
          title="Sign in to explore public agents."
          body="Clone this agent, create your own branch, and preserve lineage once you are signed in."
          actionHref="/auth"
          actionLabel="Sign in"
        />
      ) : (
        <>
          <div className="glass-card mt-8 rounded-2xl p-4">
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search by name, topic, keyword, or owner..."
              className="lyra-input lyra-search-input h-12 w-full rounded-xl px-4 outline-none"
            />
            <div className="mt-3 flex flex-wrap gap-2">
              {[
                ["all", "All"],
                ["original", "Original"],
                ["clone", "Clone"],
                ["mixed", "Hybrid"],
              ].map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() =>
                    setTypeFilter(value as "all" | "original" | "clone" | "mixed")
                  }
                  className={`rounded-full border px-3 py-1.5 text-sm transition ${
                    typeFilter === value
                      ? "border-[var(--lyra-selected-border)] bg-[var(--lyra-selected-bg)] text-[var(--lyra-text-main)]"
                      : "border-[var(--lyra-chip-border)] bg-[var(--lyra-chip-bg)] text-[var(--lyra-chip-text)] hover:border-[var(--lyra-button-hover-border)] hover:bg-[var(--lyra-button-hover-bg)]"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <AgentSection title="Discover Agents" agents={discoverAgents} currentUserId={user.id} />

          {recentAgents.length > 0 && (
            <AgentSection
              title="Recently Created"
              agents={recentAgents}
              currentUserId={user.id}
              compact
            />
          )}

          {ownAgents.length > 0 && (
            <AgentSection
              title="Your Public Agents"
              agents={ownAgents}
              currentUserId={user.id}
              compact
            />
          )}

          {discoverAgents.length === 0 && ownAgents.length === 0 && (
            <StateCard
              title="No public agents yet."
              body="Create another test account or seed sample agents. Own-clone is allowed, so you can also publish and clone your own public agent for demo testing."
            />
          )}
        </>
      )}
    </>
  );
}

function AgentSection({
  title,
  agents,
  currentUserId,
  compact,
}: {
  title: string;
  agents: Agent[];
  currentUserId: string;
  compact?: boolean;
}) {
  if (agents.length === 0) {
    return null;
  }

  return (
    <section className="mt-8">
      <h2 className="text-2xl font-semibold text-white">{title}</h2>
      <div className={`mt-4 grid gap-5 ${compact ? "lg:grid-cols-3" : "lg:grid-cols-2"}`}>
        {agents.map((agent) => (
          <AgentCard
            key={agent.id}
            agent={agent}
            showViewButton
            cloneNode={
              <CloneAgentButton
                sourceAgentId={agent.id}
                currentUserId={currentUserId}
              />
            }
          />
        ))}
      </div>
    </section>
  );
}

function StateCard({
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

function filterAgents(agents: Agent[], query: string) {
  const normalizedQuery = query.trim().toLowerCase();

  if (!normalizedQuery) {
    return agents;
  }

  return agents.filter((agent) =>
    [
      agent.name,
      agent.topic,
      agent.summary,
      agent.ownerUsername,
      ...agent.keywords,
      ...agent.personalityTraits,
    ]
      .join(" ")
      .toLowerCase()
      .includes(normalizedQuery),
  );
}

function filterByType(
  agents: Agent[],
  type: "all" | "original" | "clone" | "mixed",
) {
  return type === "all" ? agents : agents.filter((agent) => agent.type === type);
}
