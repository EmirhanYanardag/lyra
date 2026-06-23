"use client";

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Agent } from "@/types";

type LineageImpactRow = {
  parent_agent_id: string | null;
  relation_type: string;
};

type ImpactCount = {
  cloneCount: number;
  hybridCount: number;
};

export async function withNetworkImpactCounts(
  supabase: SupabaseClient,
  agents: Agent[],
) {
  if (agents.length === 0) {
    return agents;
  }

  const counts = await getNetworkImpactCountsClient(
    supabase,
    agents.map((agent) => agent.id),
  );

  return agents.map((agent) => ({
    ...agent,
    cloneCount: counts[agent.id]?.cloneCount ?? 0,
    hybridCount: counts[agent.id]?.hybridCount ?? 0,
  }));
}

export async function getNetworkImpactCountsClient(
  supabase: SupabaseClient,
  agentIds: string[],
) {
  const uniqueIds = Array.from(new Set(agentIds));

  if (uniqueIds.length === 0) {
    return {};
  }

  const { data, error } = await supabase
    .from("agent_lineage")
    .select("parent_agent_id, relation_type")
    .in("parent_agent_id", uniqueIds)
    .returns<LineageImpactRow[]>();

  if (error) {
    throw error;
  }

  return (data ?? []).reduce<Record<string, ImpactCount>>((acc, row) => {
    if (!row.parent_agent_id) {
      return acc;
    }

    const current = acc[row.parent_agent_id] ?? {
      cloneCount: 0,
      hybridCount: 0,
    };

    const relationType = row.relation_type.toLowerCase();

    if (relationType === "clone" || relationType === "cloned") {
      current.cloneCount += 1;
    }

    if (relationType === "mix" || relationType === "mixed") {
      current.hybridCount += 1;
    }

    acc[row.parent_agent_id] = current;
    return acc;
  }, {});
}
