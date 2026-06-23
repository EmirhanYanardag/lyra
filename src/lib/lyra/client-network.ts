"use client";

import type { PostgrestError, SupabaseClient } from "@supabase/supabase-js";
import { SupabaseClientDataError } from "@/lib/lyra/client-agents";
import { withNetworkImpactCounts } from "@/lib/lyra/client-network-impact";
import type { Agent, AgentType, AvatarConfig, UserProfile, Visibility } from "@/types";

type AgentWithProfileRow = {
  id: string;
  owner_id: string;
  name: string;
  type: AgentType;
  topic: string;
  topic_summary: string | null;
  summary: string | null;
  keywords: string[] | null;
  personality_traits: string[] | null;
  avatar_config: AvatarConfig | null;
  system_prompt: string | null;
  source_agent_id: string | null;
  storage_hash: string | null;
  visibility: Visibility;
  created_at: string | null;
  updated_at: string | null;
  profiles?: {
    username: string | null;
    display_name: string | null;
  } | null;
};

type ProfileRow = {
  id: string;
  username: string | null;
  display_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  created_at: string | null;
  updated_at: string | null;
};

export async function getPublicAgentsClient(supabase: SupabaseClient) {
  const { data, error } = await supabase
    .from("agents")
    .select("*, profiles:owner_id(username, display_name)")
    .eq("visibility", "public")
    .order("created_at", { ascending: false })
    .returns<AgentWithProfileRow[]>();

  if (error) {
    throwNetworkError(error, "Public agents could not be loaded.");
  }

  return withNetworkImpactCounts(supabase, (data ?? []).map(mapAgentWithProfile));
}

export async function getVisibleAgentByIdClient({
  supabase,
  agentId,
  userId,
}: {
  supabase: SupabaseClient;
  agentId: string;
  userId?: string;
}) {
  const { data, error } = await supabase
    .from("agents")
    .select("*, profiles:owner_id(username, display_name)")
    .eq("id", agentId)
    .maybeSingle<AgentWithProfileRow>();

  if (error) {
    throwNetworkError(error, "Agent could not be loaded.");
  }

  if (!data) {
    return null;
  }

  if (data.visibility !== "public" && data.owner_id !== userId) {
    return null;
  }

  const [agentWithCounts] = await withNetworkImpactCounts(supabase, [
    mapAgentWithProfile(data),
  ]);

  return agentWithCounts;
}

export async function getAgentLineageRowsClient({
  supabase,
  agentId,
}: {
  supabase: SupabaseClient;
  agentId: string;
}) {
  const { data, error } = await supabase
    .from("agent_lineage")
    .select("*")
    .eq("child_agent_id", agentId)
    .order("created_at", { ascending: true });

  if (error) {
    throwNetworkError(error, "Agent lineage could not be loaded.");
  }

  return (data ?? []).map((row) => ({
    id: row.id as string,
    childAgentId: row.child_agent_id as string,
    parentAgentId: (row.parent_agent_id as string | null) ?? undefined,
    percentage: Number(row.percentage ?? 100),
    relationType: row.relation_type as "clone" | "mix" | "original",
    parentSnapshotName: (row.parent_snapshot_name as string | null) ?? undefined,
    parentSnapshotSummary:
      (row.parent_snapshot_summary as string | null) ?? undefined,
    createdAt: (row.created_at as string | null) ?? new Date().toISOString(),
  }));
}

export async function getProfileByUsernameClient(
  supabase: SupabaseClient,
  username: string,
) {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("username", username)
    .maybeSingle<ProfileRow>();

  if (error) {
    throwNetworkError(error, "Profile could not be loaded.");
  }

  return data ? mapProfile(data) : null;
}

export async function getPublicAgentsByProfileClient(
  supabase: SupabaseClient,
  profileId: string,
  ownerUsername: string,
) {
  const { data, error } = await supabase
    .from("agents")
    .select("*, profiles:owner_id(username, display_name)")
    .eq("owner_id", profileId)
    .eq("visibility", "public")
    .order("created_at", { ascending: false })
    .returns<AgentWithProfileRow[]>();

  if (error) {
    throwNetworkError(error, "Profile agents could not be loaded.");
  }

  return withNetworkImpactCounts(
    supabase,
    (data ?? []).map((agent) =>
      mapAgentWithProfile({
        ...agent,
        profiles: agent.profiles ?? { username: ownerUsername, display_name: null },
      }),
    ),
  );
}

function mapAgentWithProfile(row: AgentWithProfileRow): Agent {
  return {
    id: row.id,
    ownerId: row.owner_id,
    ownerUsername: row.profiles?.username ?? "unknown",
    name: row.name,
    type: row.type,
    topic: row.topic,
    topicSummary: row.topic_summary ?? undefined,
    summary: row.summary ?? row.topic_summary ?? row.topic,
    keywords: row.keywords ?? [],
    personalityTraits: row.personality_traits ?? [],
    avatarConfig: row.avatar_config?.palette?.length
      ? row.avatar_config
      : { palette: ["#8b5cf6", "#38bdf8", "#e5e7eb"] },
    memoryProfile: row.avatar_config?.memoryProfile,
    systemPrompt: row.system_prompt ?? undefined,
    sourceAgentId: row.source_agent_id ?? undefined,
    storageHash: row.storage_hash ?? undefined,
    visibility: row.visibility,
    createdAt: row.created_at ?? new Date().toISOString(),
    updatedAt: row.updated_at ?? undefined,
  };
}

function mapProfile(row: ProfileRow): UserProfile {
  return {
    id: row.id,
    username: row.username ?? "lyra_user",
    displayName: row.display_name ?? row.username ?? "LYRA User",
    avatarUrl: row.avatar_url ?? undefined,
    bio: row.bio ?? "",
    createdAt: row.created_at ?? new Date().toISOString(),
    updatedAt: row.updated_at ?? undefined,
  };
}

function throwNetworkError(error: PostgrestError, fallbackMessage: string): never {
  const message =
    error.code === "42501" || error.message.toLowerCase().includes("permission denied")
      ? `${fallbackMessage} Supabase RLS may be blocking network reads. Run supabase/clone-rls-fix.sql in SQL Editor.`
      : fallbackMessage;

  throw new SupabaseClientDataError(message, error);
}
