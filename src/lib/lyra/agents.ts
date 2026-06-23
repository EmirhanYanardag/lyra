import "server-only";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/lyra/profiles";
import { createInitialMemoryProfile } from "@/lib/lyra/memory";
import type { Agent, AgentType, AvatarConfig, CreateAgentInput, Visibility } from "@/types";

type AgentRow = {
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
  profiles?: { username: string | null } | null;
};

type LineageRow = {
  id: string;
  child_agent_id: string;
  parent_agent_id: string | null;
  percentage: number | null;
  relation_type: "clone" | "mix" | "original";
  parent_snapshot_name: string | null;
  parent_snapshot_summary: string | null;
  created_at: string | null;
};

type CreateAgentPayload = {
  owner_id: string;
  name: string;
  type: AgentType;
  topic: string;
  topic_summary: string;
  summary: string;
  keywords: string[];
  personality_traits: string[];
  avatar_config: AvatarConfig;
  system_prompt: string;
  visibility: Visibility;
};

export async function getMyAgents() {
  const supabase = await createSupabaseServerClient();
  const profile = await getCurrentProfile();

  if (!supabase || !profile) {
    return [];
  }

  const { data } = await supabase
    .from("agents")
    .select("*, profiles:owner_id(username)")
    .eq("owner_id", profile.id)
    .order("created_at", { ascending: false })
    .returns<AgentRow[]>();

  return (data ?? []).map((row) => mapAgent(row, profile.username));
}

export async function getPublicAgents() {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return [];
  }

  const { data } = await supabase
    .from("agents")
    .select("*, profiles:owner_id(username)")
    .eq("visibility", "public")
    .order("created_at", { ascending: false })
    .returns<AgentRow[]>();

  return (data ?? []).map((row) => mapAgent(row));
}

export async function getAgentsByProfileId(profileId: string) {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return [];
  }

  const { data } = await supabase
    .from("agents")
    .select("*, profiles:owner_id(username)")
    .eq("owner_id", profileId)
    .eq("visibility", "public")
    .order("created_at", { ascending: false })
    .returns<AgentRow[]>();

  return (data ?? []).map((row) => mapAgent(row));
}

export async function getAgentById(id: string) {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return null;
  }

  const { data } = await supabase
    .from("agents")
    .select("*, profiles:owner_id(username)")
    .eq("id", id)
    .maybeSingle<AgentRow>();

  return data ? mapAgent(data) : null;
}

export async function getAgentLineage(agentId: string) {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return null;
  }

  const { data } = await supabase
    .from("agent_lineage")
    .select("*")
    .eq("child_agent_id", agentId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle<LineageRow>();

  return data
    ? {
        id: data.id,
        childAgentId: data.child_agent_id,
        parentAgentId: data.parent_agent_id ?? undefined,
        percentage: Number(data.percentage ?? 100),
        relationType: data.relation_type,
        parentSnapshotName: data.parent_snapshot_name ?? undefined,
        parentSnapshotSummary: data.parent_snapshot_summary ?? undefined,
        createdAt: data.created_at ?? new Date().toISOString(),
      }
    : null;
}

export async function getAgentLineageRows(agentId: string) {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return [];
  }

  const { data } = await supabase
    .from("agent_lineage")
    .select("*")
    .eq("child_agent_id", agentId)
    .order("created_at", { ascending: true })
    .returns<LineageRow[]>();

  return (data ?? []).map((row) => ({
    id: row.id,
    childAgentId: row.child_agent_id,
    parentAgentId: row.parent_agent_id ?? undefined,
    percentage: Number(row.percentage ?? 100),
    relationType: row.relation_type,
    parentSnapshotName: row.parent_snapshot_name ?? undefined,
    parentSnapshotSummary: row.parent_snapshot_summary ?? undefined,
    createdAt: row.created_at ?? new Date().toISOString(),
  }));
}

export async function createAgent(input: CreateAgentInput) {
  const supabase = await createSupabaseServerClient();
  const profile = await getCurrentProfile();

  if (!supabase || !profile) {
    return { agent: null, error: "Sign in before creating an agent." };
  }

  const name = input.name.trim();
  const topic = input.topic.trim();

  if (!name) {
    return { agent: null, error: "Agent name is required." };
  }

  if (topic.length < 10) {
    return { agent: null, error: "Topic must be at least 10 characters." };
  }

  const payload = buildAgentPayload({
    ownerId: profile.id,
    name,
    topic,
    visibility: input.visibility ?? "public",
  });

  const { data, error } = await supabase
    .from("agents")
    .insert(payload)
    .select("*, profiles:owner_id(username)")
    .single<AgentRow>();

  if (error) {
    return { agent: null, error: error.message };
  }

  return { agent: mapAgent(data, profile.username), error: null };
}

function buildAgentPayload({
  ownerId,
  name,
  topic,
  visibility,
}: {
  ownerId: string;
  name: string;
  topic: string;
  visibility: Visibility;
}): CreateAgentPayload {
  const keywords = deriveKeywords(topic);
  const traits = ["curious", "adaptive", "topic-shaped"];
  const summary = `An agent shaped by ${topic}`;
  const avatarConfig = createAvatarConfig(name);
  avatarConfig.memoryProfile = createInitialMemoryProfile({
    topic,
    summary,
    traits,
    keywords,
  });

  return {
    owner_id: ownerId,
    name,
    type: "original",
    topic,
    topic_summary: topic.slice(0, 180),
    summary,
    keywords,
    personality_traits: traits,
    avatar_config: avatarConfig,
    system_prompt: `You are ${name}, a persistent LYRA identity originally shaped by this topic: ${topic}. Answer broadly and use the topic as perspective, not restriction.`,
    visibility,
  };
}

function deriveKeywords(topic: string) {
  const ignored = new Set(["with", "from", "that", "this", "about", "into"]);

  return Array.from(
    new Set(
      topic
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, " ")
        .split(/\s+/)
        .filter((word) => word.length > 3 && !ignored.has(word)),
    ),
  ).slice(0, 5);
}

function createAvatarConfig(name: string): AvatarConfig {
  const palettes = [
    ["#8b5cf6", "#38bdf8", "#e5e7eb"],
    ["#60a5fa", "#c4b5fd", "#f8fafc"],
    ["#a78bfa", "#93c5fd", "#d1d5db"],
  ];
  const seed = `${name}-${Date.now()}`;
  const palette = palettes[Math.floor(Math.random() * palettes.length)];

  return {
    seed,
    palette,
    head: "angular",
    eyes: "glow",
    body: "glass",
    accessory: "signal-ring",
    background: "near-black-gradient",
  };
}

export function mapAgent(row: AgentRow, fallbackUsername = "lyra_user"): Agent {
  return {
    id: row.id,
    name: row.name,
    ownerId: row.owner_id,
    ownerUsername: row.profiles?.username ?? fallbackUsername,
    type: row.type,
    topic: row.topic,
    topicSummary: row.topic_summary ?? undefined,
    summary: row.summary ?? row.topic_summary ?? row.topic,
    keywords: row.keywords ?? [],
    personalityTraits: row.personality_traits ?? [],
    avatarConfig: normalizeAvatarConfig(row.avatar_config),
    memoryProfile: row.avatar_config?.memoryProfile,
    systemPrompt: row.system_prompt ?? undefined,
    sourceAgentId: row.source_agent_id ?? undefined,
    storageHash: row.storage_hash ?? undefined,
    visibility: row.visibility,
    createdAt: row.created_at ?? new Date().toISOString(),
    updatedAt: row.updated_at ?? undefined,
  };
}

function normalizeAvatarConfig(config: AvatarConfig | null): AvatarConfig {
  if (config?.palette?.length) {
    return config;
  }

  return {
    palette: ["#8b5cf6", "#38bdf8", "#e5e7eb"],
    motif: "signal",
  };
}
