"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { DnaCapsuleViewer } from "@/components/agents/dna-capsule-viewer";
import { EvolutionTimeline } from "@/components/agents/evolution-timeline";
import { LinkButton } from "@/components/ui/button";
import { useSupabaseUser } from "@/hooks/use-supabase-user";
import { get0gTxExplorerUrl, shortenHash } from "@/lib/0g/links";
import { formatSupabaseClientError } from "@/lib/lyra/client-agents";
import {
  getAgentLineageRowsClient,
  getVisibleAgentByIdClient,
} from "@/lib/lyra/client-network";
import { getAgentMemoryProfile } from "@/lib/lyra/memory";
import type { Agent, AgentLineage, UserProfile } from "@/types";

export function AgentProvenanceView({ agentId }: { agentId: string }) {
  const { user, loading, supabase } = useSupabaseUser();
  const [agent, setAgent] = useState<Agent | null>(null);
  const [lineageRows, setLineageRows] = useState<AgentLineage[]>([]);
  const [parents, setParents] = useState<Agent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadProvenance() {
      if (loading) {
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const nextAgent = await getVisibleAgentByIdClient({
          supabase,
          agentId,
          userId: user?.id,
        });

        if (!nextAgent) {
          if (isMounted) {
            setAgent(null);
          }
          return;
        }

        const nextLineageRows = await getAgentLineageRowsClient({
          supabase,
          agentId: nextAgent.id,
        });
        const parentIds = Array.from(
          new Set(
            [
              nextAgent.sourceAgentId,
              nextAgent.avatarConfig.parentA,
              nextAgent.avatarConfig.parentB,
              ...nextLineageRows.map((row) => row.parentAgentId),
            ].filter(Boolean) as string[],
          ),
        );
        const nextParents = (
          await Promise.all(
            parentIds.map((parentId) =>
              getVisibleAgentByIdClient({
                supabase,
                agentId: parentId,
                userId: user?.id,
              }),
            ),
          )
        ).filter((parent): parent is Agent => Boolean(parent));

        if (isMounted) {
          setAgent(nextAgent);
          setLineageRows(nextLineageRows);
          setParents(nextParents);
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

    void loadProvenance();

    return () => {
      isMounted = false;
    };
  }, [agentId, loading, supabase, user?.id]);

  if (loading || isLoading) {
    return <StateCard title="Loading provenance..." body="Opening the Agent DNA record." />;
  }

  if (error) {
    return <StateCard title="Provenance could not load." body={error} />;
  }

  if (!agent) {
    return (
      <StateCard
        title="This agent provenance is private."
        body="Public provenance is available for public agents. Owners can sign in to preview private provenance."
      />
    );
  }

  const memory = getAgentMemoryProfile(agent);
  const provenance = agent.avatarConfig.ogProvenance;
  const ownerProfile = createOwnerProfile(agent);
  const versions = provenance?.versions ?? [];

  return (
    <div className="space-y-6">
      <section className="glass-card rounded-2xl p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <p className="lyra-label text-sm">
                Agent DNA Capsule
              </p>
              <span className="lyra-chip rounded-full px-2.5 py-1 text-xs">
                {agent.type === "mixed" ? "Hybrid" : agent.type}
              </span>
              {provenance?.mode === "real" && (
                <span className="lyra-chip rounded-full px-2.5 py-1 text-xs">
                  Stored on 0G
                </span>
              )}
            </div>
            <h1 className="mt-4 text-4xl font-semibold text-white">
              {agent.name}
            </h1>
            <p className="mt-4 max-w-3xl leading-7 text-slate-300">
              {agent.summary}
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <DnaCapsuleViewer
              agent={agent}
              lineageRows={lineageRows}
              parentAgents={parents}
              ownerProfile={ownerProfile}
              provenance={provenance}
            />
            <LinkButton href={`/agents/${agent.id}`} variant="secondary">
              Agent Detail
            </LinkButton>
          </div>
        </div>
      </section>

      <section className="glass-card rounded-2xl p-6">
        <p className="lyra-label text-sm">
          0G Provenance
        </p>
        <p className="mt-3 max-w-3xl text-slate-300">
          Every LYRA agent can publish its identity, memory profile, lineage,
          and evolution history to 0G Storage as a persistent Agent DNA Capsule.
        </p>
        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <Metric label="Status" value={agent.storageHash ? "Published" : "Pending"} />
          <Metric label="Storage" value="0G Storage" />
          <Metric label="Network" value="0G Galileo / 16602" />
          <Metric label="Root Hash" value={agent.storageHash ? shortenHash(agent.storageHash) : "pending"} />
          <Metric label="TX Hash" value={provenance?.txHash ? shortenHash(provenance.txHash) : "pending"} />
          <Metric label="Versions" value={String(versions.length || (agent.storageHash ? 1 : 0))} />
        </div>
        {provenance?.txHash && (
          <Link
            href={get0gTxExplorerUrl(provenance.txHash)}
            target="_blank"
            rel="noreferrer"
            className="lyra-accent-button mt-5 inline-flex rounded-full px-4 py-2 text-sm"
          >
            Open TX in Explorer
          </Link>
        )}
      </section>

      <section className="glass-card rounded-2xl p-6">
        <p className="lyra-label text-sm">
          Memory Evolution Record
        </p>
        <div className="mt-4 grid gap-3 lg:grid-cols-2">
          <Metric label="Identity Summary" value={memory.identitySummary} />
          <Metric label="Communication Style" value={memory.communicationStyle} />
          <Metric label="Worldview" value={memory.worldview} />
          <Metric
            label="Learned Topics"
            value={memory.learnedTopics.join(", ") || "none yet"}
          />
        </div>
      </section>

      <EvolutionTimeline
        agent={agent}
        lineageRows={lineageRows}
        ogProvenance={provenance}
      />

      {versions.length > 0 && (
        <section className="glass-card rounded-2xl p-6">
          <p className="lyra-label text-sm">
            Version History
          </p>
          <div className="mt-4 grid gap-3">
            {versions.map((version) => (
              <Metric
                key={`${version.version}-${version.rootHash}`}
                label={`v${version.version} / ${version.mode}`}
                value={`${shortenHash(version.rootHash)} / ${formatDate(version.publishedAt)}`}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
      <p className="lyra-label text-xs">
        {label}
      </p>
      <p className="mt-2 break-words text-sm leading-6 text-slate-100">{value}</p>
    </div>
  );
}

function StateCard({ title, body }: { title: string; body: string }) {
  return (
    <section className="glass-card rounded-2xl p-8">
      <h1 className="text-4xl font-semibold text-white">{title}</h1>
      <p className="mt-3 max-w-2xl text-slate-300">{body}</p>
      <LinkButton href="/explore" className="mt-6">
        Explore Agents
      </LinkButton>
    </section>
  );
}

function createOwnerProfile(agent: Agent): UserProfile {
  return {
    id: agent.ownerId,
    username: agent.ownerUsername,
    displayName: agent.ownerUsername,
    bio: "",
    createdAt: agent.createdAt,
  };
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}
