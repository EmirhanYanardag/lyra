"use client";

import { useEffect, useState } from "react";
import { AgentCard } from "@/components/agents/agent-card";
import { DnaCapsuleViewer } from "@/components/agents/dna-capsule-viewer";
import { EvolutionTimeline } from "@/components/agents/evolution-timeline";
import {
  PublishTo0GButton,
  type PublishResult,
} from "@/components/agents/publish-to-0g-button";
import { LinkButton } from "@/components/ui/button";
import { useSupabaseUser } from "@/hooks/use-supabase-user";
import { get0gTxExplorerUrl, shortenHash } from "@/lib/0g/links";
import { formatSupabaseClientError } from "@/lib/lyra/client-agents";
import {
  getAgentLineageRowsClient,
  getVisibleAgentByIdClient,
} from "@/lib/lyra/client-network";
import { getAgentMemoryProfile } from "@/lib/lyra/memory";
import type { Agent, AgentLineage, OgProvenanceVersion, UserProfile } from "@/types";

export function AgentDetail({ agentId }: { agentId: string }) {
  const { user, loading, supabase } = useSupabaseUser();
  const [agent, setAgent] = useState<Agent | null>(null);
  const [lineageRows, setLineageRows] = useState<AgentLineage[]>([]);
  const [parents, setParents] = useState<Record<string, Agent | null>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [storageCopied, setStorageCopied] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function loadDetail() {
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

        const nextLineage = await getAgentLineageRowsClient({
          supabase,
          agentId: nextAgent.id,
        });
        const parentIds = Array.from(
          new Set(
            [
              nextAgent.sourceAgentId,
              nextAgent.avatarConfig.parentA,
              nextAgent.avatarConfig.parentB,
              ...nextLineage.map((row) => row.parentAgentId),
            ].filter(Boolean) as string[],
          ),
        );
        const parentEntries = await Promise.all(
          parentIds.map(async (parentId) => [
            parentId,
            await getVisibleAgentByIdClient({
              supabase,
              agentId: parentId,
              userId: user?.id,
            }),
          ]),
        );

        if (isMounted) {
          setAgent(nextAgent);
          setLineageRows(nextLineage);
          setParents(Object.fromEntries(parentEntries));
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

    void loadDetail();

    return () => {
      isMounted = false;
    };
  }, [agentId, loading, supabase, user?.id]);

  if (loading || isLoading) {
    return <StateCard title="Loading agent..." body="Opening agent identity and lineage." />;
  }

  if (error) {
    return <StateCard title="Agent could not load." body={error} />;
  }

  if (!agent) {
    return (
      <StateCard
        title="This agent is not available."
        body="It may be private, deleted, or not owned by your current account."
      />
    );
  }
  const parentAgents = Object.values(parents).filter(
    (parent): parent is Agent => Boolean(parent),
  );
  const ownerProfile = createOwnerProfile(agent);

  return (
    <>
      <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
        <AgentCard agent={agent} showChatButton />
        <section className="glass-card rounded-2xl p-6">
          <p className="lyra-label text-sm">
            Agent Detail
          </p>
          <h1 className="mt-4 text-4xl font-semibold text-white">
            {agent.name}
          </h1>
          <p className="mt-4 leading-7 text-slate-300">{agent.summary}</p>
          <div className="mt-6">
            <StorageInfo
              hash={agent.storageHash}
              copied={storageCopied}
              onCopy={() => {
                if (!agent.storageHash) {
                  return;
                }

                void copyText(agent.storageHash).then(() => {
                  setStorageCopied(true);
                  window.setTimeout(() => setStorageCopied(false), 1200);
                });
              }}
            />
          </div>
          <div className="mt-6 flex flex-wrap gap-3">
            <LinkButton href={`/agents/${agent.id}/chat`} className="lyra-accent-button">
              Chat
            </LinkButton>
            <LinkButton href="/agents" variant="secondary">
              Back to My Agents
            </LinkButton>
          </div>
        </section>
      </div>
      <ZeroGProvenanceSection
        agent={agent}
        lineageRows={lineageRows}
        parentAgents={parentAgents}
        ownerProfile={ownerProfile}
        onPublished={(result) => {
          const existingVersions = agent.avatarConfig.ogProvenance?.versions ?? [];
          const version =
            result.version ??
            existingVersions.reduce(
              (maxVersion, entry) => Math.max(maxVersion, entry.version),
              0,
            ) +
              1;
          const nextVersion: OgProvenanceVersion = {
            version,
            rootHash: result.rootHash,
            txHash: result.txHash,
            mode: result.mode,
            sizeBytes: result.sizeBytes,
            publishedAt: result.publishedAt ?? new Date().toISOString(),
            capsuleType: "agent_dna",
            summary: `Agent DNA Capsule v${version} for ${agent.name}`,
          };
          setAgent({
            ...agent,
            storageHash: result.rootHash,
            avatarConfig: {
              ...agent.avatarConfig,
              ogProvenance: {
                mode: result.mode,
                rootHash: result.rootHash,
                txHash: result.txHash,
                publishedAt: result.publishedAt ?? new Date().toISOString(),
                sizeBytes: result.sizeBytes,
                error: result.error,
                versions: [...existingVersions, nextVersion],
              },
            },
          });
        }}
      />
      <NetworkImpactSection agent={agent} />
      <EvolutionMemorySection agent={agent} />
      <EvolutionTimeline
        agent={agent}
        lineageRows={lineageRows}
        ogProvenance={agent.avatarConfig.ogProvenance}
      />
    </>
  );
}

function NetworkImpactSection({ agent }: { agent: Agent }) {
  const cloneCount = agent.cloneCount ?? 0;
  const hybridCount = agent.hybridCount ?? 0;
  const totalDescendants = cloneCount + hybridCount;

  return (
    <section className="glass-card mt-6 rounded-2xl p-6">
      <p className="lyra-label text-sm">
        Network Impact
      </p>
      <p className="mt-3 max-w-2xl text-slate-300">
        This identity&apos;s influence across clones and hybrid descendants.
      </p>
      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        <Info label="Clones Created" value={`${cloneCount} clones created`} />
        <Info label="Hybrid Descendants" value={`${hybridCount} hybrid descendants`} />
        <Info label="Total Descendants" value={`${totalDescendants} total descendants`} />
      </div>
    </section>
  );
}

function ZeroGProvenanceSection({
  agent,
  lineageRows,
  parentAgents,
  ownerProfile,
  onPublished,
}: {
  agent: Agent;
  lineageRows: AgentLineage[];
  parentAgents: Agent[];
  ownerProfile: UserProfile;
  onPublished: (result: PublishResult) => void;
}) {
  const provenance = agent.avatarConfig.ogProvenance;
  const rootHash = provenance?.rootHash ?? agent.storageHash;
  const versions = provenance?.versions ?? [];
  const explorerUrl = provenance?.txHash
    ? get0gTxExplorerUrl(provenance.txHash)
    : null;

  return (
    <section className="glass-card mt-6 rounded-2xl p-6">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
        <div className="max-w-2xl">
          <div className="flex flex-wrap items-center gap-2">
            <p className="lyra-label text-sm">
              0G Provenance
            </p>
            <span className="lyra-chip rounded-full px-2.5 py-1 text-xs">
              {rootHash ? "Published" : "Not Published"}
            </span>
            {provenance?.mode && (
              <span className="lyra-chip rounded-full px-2.5 py-1 text-xs">
                {capitalize(provenance.mode)}
              </span>
            )}
          </div>
          <h2 className="mt-3 text-2xl font-semibold text-white">
            Agent DNA stored on 0G
          </h2>
          <p className="mt-3 leading-7 text-slate-300">
            Agent DNA, memory profile, and lineage history are preserved as a
            0G Storage capsule.
          </p>
        </div>
        <PublishTo0GButton
          agentId={agent.id}
          existingHash={rootHash}
          onPublished={onPublished}
        />
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <Info label="Status" value={rootHash ? "Published" : "Pending"} />
        <Info label="DNA Capsule" value="Agent identity + memory + lineage" />
        <Info label="Root Hash" value={rootHash ? shortenHash(rootHash) : "Not published yet"} />
        <Info label="TX Hash" value={provenance?.txHash ? shortenHash(provenance.txHash) : "pending"} />
        <Info
          label="Size"
          value={provenance?.sizeBytes ? formatBytes(provenance.sizeBytes) : "pending"}
        />
        <Info label="Network" value="0G Galileo / 16602" />
      </div>

      <div className="mt-5 flex flex-wrap gap-3">
        <DnaCapsuleViewer
          agent={agent}
          lineageRows={lineageRows}
          parentAgents={parentAgents}
          ownerProfile={ownerProfile}
          provenance={provenance}
        />
        {explorerUrl && (
          <a
            href={explorerUrl}
            target="_blank"
            rel="noreferrer"
            className="lyra-accent-button rounded-full px-4 py-2 text-sm"
          >
            Open TX
          </a>
        )}
      </div>

      {versions.length > 0 && <VersionHistory versions={versions} />}

      {provenance?.mode === "mock" && (
        <p className="mt-4 rounded-2xl border border-[var(--lyra-chip-border)] bg-[var(--lyra-chip-bg)] px-4 py-3 text-sm text-[var(--lyra-chip-text)]">
          Mock mode active. Configure 0G env vars for real storage.
        </p>
      )}
      {provenance?.mode === "real" && (
        <p className="mt-4 rounded-2xl border border-[var(--lyra-chip-border)] bg-[var(--lyra-chip-bg)] px-4 py-3 text-sm text-[var(--lyra-chip-text)]">
          Stored on 0G Galileo Testnet. Root hash can be used with 0G
          Storage retrieval tools.
        </p>
      )}
      {!rootHash && (
        <p className="mt-4 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-300">
          Not published yet.
        </p>
      )}
    </section>
  );
}

function VersionHistory({ versions }: { versions: OgProvenanceVersion[] }) {
  return (
    <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-4">
      <p className="lyra-label text-xs">
        Version History
      </p>
      <div className="mt-3 space-y-2">
        {versions.map((version) => (
          <div
            key={`${version.version}-${version.rootHash}`}
            className="flex flex-col gap-3 rounded-xl border border-white/10 bg-black/20 px-3 py-3 sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="min-w-0">
              <p className="break-all font-mono text-xs text-[var(--lyra-chip-text)]">
                {shortenHash(version.rootHash)}
              </p>
              <p className="mt-1 text-xs text-[var(--lyra-text-soft)]">
                {formatDate(version.publishedAt)} / {version.mode}
              </p>
            </div>
            <button
              type="button"
              onClick={() => void copyText(version.rootHash)}
              className="rounded-full border border-[var(--lyra-button-border)] bg-white/[0.045] px-3 py-1.5 text-xs text-[var(--lyra-button-text)] transition hover:border-[var(--lyra-button-hover-border)] hover:bg-[var(--lyra-button-hover-bg)]"
            >
              Copy
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
      <p className="lyra-label text-xs">
        {label}
      </p>
      <p className="mt-2 text-sm text-slate-100">{value}</p>
    </div>
  );
}

function StorageInfo({
  hash,
  copied,
  onCopy,
}: {
  hash?: string;
  copied: boolean;
  onCopy: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onCopy}
      disabled={!hash}
      className="w-full rounded-2xl border border-white/10 bg-white/5 p-4 text-left transition hover:border-[var(--lyra-button-hover-border)] hover:bg-[var(--lyra-button-hover-bg)] disabled:cursor-default disabled:hover:border-white/10 disabled:hover:bg-white/5"
      title={hash ? "Copy storage hash" : "Storage pending"}
    >
      <p className="lyra-label text-xs">
        Storage
      </p>
      <p className="mt-2 truncate font-mono text-sm text-slate-100">
        {hash ? shortenHash(hash) : "pending"}
      </p>
      {hash && (
        <p className="mt-2 text-xs text-[var(--lyra-chip-text)]">
          {copied ? "Copied" : "Click to copy"}
        </p>
      )}
    </button>
  );
}

function EvolutionMemorySection({ agent }: { agent: Agent }) {
  const memory = getAgentMemoryProfile(agent);

  return (
    <section className="glass-card mt-6 rounded-2xl p-6">
      <p className="lyra-label text-sm">
        Evolution Memory
      </p>
      <div className="mt-4 grid gap-3 lg:grid-cols-2">
        <Info label="Identity Summary" value={memory.identitySummary} />
        <Info label="Communication Style" value={memory.communicationStyle} />
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4 lg:col-span-2">
          <p className="lyra-label text-xs">
            Worldview
          </p>
          <p className="mt-2 text-sm leading-6 text-slate-100">
            {memory.worldview}
          </p>
        </div>
        <TagPanel label="Learned Topics" tags={memory.learnedTopics} />
        <TagPanel label="Recent Influences" tags={memory.recentInfluences} />
        <LogPanel entries={memory.evolutionLog} />
      </div>
    </section>
  );
}

function TagPanel({ label, tags }: { label: string; tags: string[] }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
      <p className="lyra-label text-xs">
        {label}
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        {tags.length > 0 ? (
          tags.slice(0, 10).map((tag) => (
            <span
              key={tag}
              className="lyra-chip rounded-full px-2.5 py-1 text-xs"
            >
              {tag}
            </span>
          ))
        ) : (
          <span className="text-sm text-[var(--lyra-text-soft)]">No memory yet</span>
        )}
      </div>
    </div>
  );
}

function LogPanel({ entries }: { entries: string[] }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4 lg:col-span-2">
      <p className="lyra-label text-xs">
        Evolution Log
      </p>
      <div className="mt-3 space-y-2">
        {entries.length > 0 ? (
          entries.map((entry) => (
            <p
              key={entry}
              className="rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm text-slate-200"
            >
              {entry}
            </p>
          ))
        ) : (
          <p className="text-sm text-[var(--lyra-text-soft)]">
            This identity has not recorded a change yet.
          </p>
        )}
      </div>
    </div>
  );
}

function StateCard({ title, body }: { title: string; body: string }) {
  return (
    <section className="glass-card rounded-2xl p-8">
      <h1 className="text-4xl font-semibold text-white">{title}</h1>
      <p className="mt-3 max-w-2xl text-slate-300">{body}</p>
      <LinkButton href="/agents" className="mt-6">
        Back to My Agents
      </LinkButton>
    </section>
  );
}

function capitalize(value: string) {
  return `${value.slice(0, 1).toUpperCase()}${value.slice(1)}`;
}

function formatBytes(bytes: number) {
  if (bytes < 1024) {
    return `${bytes} B`;
  }

  return `${(bytes / 1024).toFixed(1)} KB`;
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

async function copyText(value: string) {
  await navigator.clipboard.writeText(value);
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}
