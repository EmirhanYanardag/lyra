"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AgentCard } from "@/components/agents/agent-card";
import { Button } from "@/components/ui/button";
import { useSupabaseUser } from "@/hooks/use-supabase-user";
import { formatSupabaseClientError, getMyAgentsClient } from "@/lib/lyra/client-agents";
import {
  createHybridAgentClient,
  formatMixError,
  generateHybridIdentityClient,
} from "@/lib/lyra/client-mix";
import type { Agent } from "@/types";

export function MixStudio() {
  const router = useRouter();
  const { user, loading, error: authError, supabase } = useSupabaseUser();
  const [agents, setAgents] = useState<Agent[]>([]);
  const [parentAId, setParentAId] = useState("");
  const [parentBId, setParentBId] = useState("");
  const [isLoadingAgents, setIsLoadingAgents] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadAgents() {
      if (!user) {
        setAgents([]);
        return;
      }

      setIsLoadingAgents(true);
      setError(null);

      try {
        const nextAgents = await getMyAgentsClient(supabase, user.id);

        if (isMounted) {
          setAgents(nextAgents);
          setParentAId(nextAgents[0]?.id ?? "");
          setParentBId(nextAgents[1]?.id ?? "");
        }
      } catch (caughtError) {
        if (isMounted) {
          setError(formatSupabaseClientError(caughtError));
        }
      } finally {
        if (isMounted) {
          setIsLoadingAgents(false);
        }
      }
    }

    void loadAgents();

    return () => {
      isMounted = false;
    };
  }, [supabase, user]);

  const parentA = useMemo(
    () => agents.find((agent) => agent.id === parentAId) ?? null,
    [agents, parentAId],
  );
  const parentB = useMemo(
    () => agents.find((agent) => agent.id === parentBId) ?? null,
    [agents, parentBId],
  );
  const canGenerate = Boolean(parentA && parentB && parentA.id !== parentB.id);

  async function handleCreateHybridAgent() {
    if (!user || !parentA || !parentB || parentA.id === parentB.id) {
      setError("Choose two different parent agents.");
      return;
    }

    setIsGenerating(true);
    setIsCreating(false);
    setError(null);

    try {
      const result = await generateHybridIdentityClient({ parentA, parentB });
      setIsGenerating(false);
      setIsCreating(true);
      const agentId = await createHybridAgentClient({
        supabase,
        user,
        parentA,
        parentB,
        identity: result.identity,
      });
      router.push(`/agents/${agentId}`);
      router.refresh();
    } catch (caughtError) {
      setError(formatMixError(caughtError));
    } finally {
      setIsGenerating(false);
      setIsCreating(false);
    }
  }

  if (loading || isLoadingAgents) {
    return <StateCard title="Opening Mix Studio..." body="Loading your agents for identity synthesis." />;
  }

  if (!user) {
    return (
      <StateCard
        title="Sign in to mix agents."
        body="Hybrid identities belong to your account and preserve ancestry."
      />
    );
  }

  if (authError || error) {
    return <StateCard title="Mix Studio needs attention." body={authError ?? error ?? "Something went wrong."} />;
  }

  return (
    <>
      <h1 className="text-4xl font-semibold text-white">
        Synthesize a hybrid identity
      </h1>
      <p className="mt-3 max-w-2xl text-slate-300">
        Select two parent agents. LYRA will generate a brand-new identity that
        can chat, evolve, and preserve both branches of lineage.
      </p>

      {agents.length < 2 ? (
        <StateCard
          title="Create at least two agents first."
          body="Mix Engine V1 needs exactly two parent identities. Create Agent A and Agent B, then return here."
        />
      ) : (
        <>
          <section className="mt-8 grid items-start gap-5 xl:grid-cols-2">
            <ParentPicker
              agents={agents}
              selectedId={parentAId}
              onSelect={(id) => {
                setParentAId(id);
              }}
              selectedAgent={parentA}
            />
            <ParentPicker
              agents={agents}
              selectedId={parentBId}
              onSelect={(id) => {
                setParentBId(id);
              }}
              selectedAgent={parentB}
            />
          </section>

          <div className="mt-6 flex justify-center">
            <Button
              onClick={handleCreateHybridAgent}
              disabled={!canGenerate || isGenerating || isCreating}
            >
              {isGenerating
                ? "Synthesizing..."
                : isCreating
                  ? "Creating..."
                  : "Create Hybrid Agent"}
            </Button>
          </div>
        </>
      )}
    </>
  );
}

function ParentPicker({
  agents,
  selectedId,
  onSelect,
  selectedAgent,
}: {
  agents: Agent[];
  selectedId: string;
  onSelect: (id: string) => void;
  selectedAgent: Agent | null;
}) {
  return (
    <section>
      <div className="glass-card rounded-2xl p-4">
        <select
          value={selectedId}
          onChange={(event) => onSelect(event.target.value)}
          className="lyra-input h-12 w-full rounded-xl px-3 text-sm outline-none"
        >
          {agents.map((agent) => (
            <option key={agent.id} value={agent.id}>
              {agent.name}
            </option>
          ))}
        </select>
      </div>
      {selectedAgent && <AgentCard agent={selectedAgent} className="mt-4" />}
    </section>
  );
}

function StateCard({ title, body }: { title: string; body: string }) {
  return (
    <section className="glass-card mt-8 rounded-2xl p-8">
      <h2 className="text-2xl font-semibold text-white">{title}</h2>
      <p className="mt-3 max-w-2xl text-slate-300">{body}</p>
    </section>
  );
}
