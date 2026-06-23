"use client";

import type { PostgrestError, SupabaseClient, User } from "@supabase/supabase-js";
import {
  formatSupabaseClientError,
  SupabaseClientDataError,
} from "@/lib/lyra/client-agents";
import type { Agent, AvatarConfig, HybridIdentity } from "@/types";

type MixedAgentRow = {
  id: string;
};

export async function generateHybridIdentityClient({
  parentA,
  parentB,
}: {
  parentA: Agent;
  parentB: Agent;
}) {
  const response = await fetch("/api/mix", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ parentA, parentB }),
  });

  if (!response.ok) {
    throw new Error(`Mix API failed with ${response.status}`);
  }

  const data = (await response.json()) as {
    identity?: HybridIdentity | null;
    source?: string;
    error?: string;
  };

  if (!data.identity) {
    throw new Error(data.error ?? "Hybrid identity could not be generated.");
  }

  return {
    identity: data.identity,
    source: data.source ?? "mock",
  };
}

export async function createHybridAgentClient({
  supabase,
  user,
  parentA,
  parentB,
  identity,
}: {
  supabase: SupabaseClient;
  user: User;
  parentA: Agent;
  parentB: Agent;
  identity: HybridIdentity;
}) {
  const now = new Date().toISOString();
  const avatarConfig: AvatarConfig = {
    palette: blendPalette(parentA.avatarConfig.palette, parentB.avatarConfig.palette),
    source: "mix",
    parentA: parentA.id,
    parentB: parentB.id,
    generatedWorldview: identity.worldview,
    memoryProfile: identity.memory_profile,
    mixedAt: now,
  } as AvatarConfig;

  const { data, error } = await supabase
    .from("agents")
    .insert({
      owner_id: user.id,
      name: identity.name,
      type: "mixed",
      topic: identity.memory_profile.originTopic,
      topic_summary: identity.summary.slice(0, 180),
      summary: identity.summary,
      keywords: identity.keywords,
      personality_traits: identity.personality_traits,
      avatar_config: avatarConfig,
      system_prompt: `You are ${identity.name}, an independent hybrid LYRA identity synthesized from two parent agents. Answer broadly and evolve through conversation.`,
      source_agent_id: null,
      storage_hash: null,
      visibility: "private",
    })
    .select("id")
    .single<MixedAgentRow>();

  if (error) {
    throwMixError(error, "Hybrid agent insert failed.");
  }

  const { error: lineageError } = await supabase.from("agent_lineage").insert([
    {
      child_agent_id: data.id,
      parent_agent_id: parentA.id,
      percentage: 50,
      relation_type: "mix",
      parent_snapshot_name: parentA.name,
      parent_snapshot_summary: parentA.summary,
    },
    {
      child_agent_id: data.id,
      parent_agent_id: parentB.id,
      percentage: 50,
      relation_type: "mix",
      parent_snapshot_name: parentB.name,
      parent_snapshot_summary: parentB.summary,
    },
  ]);

  if (lineageError) {
    throwMixError(lineageError, "Hybrid lineage insert failed.");
  }

  return data.id;
}

export function formatMixError(error: unknown) {
  return formatSupabaseClientError(error);
}

function blendPalette(parentA: string[], parentB: string[]) {
  const palette = [...parentA, ...parentB].filter(Boolean);

  return palette.length > 0
    ? Array.from(new Set(palette)).slice(0, 3)
    : ["#8b5cf6", "#38bdf8", "#e5e7eb"];
}

function throwMixError(error: PostgrestError, fallbackMessage: string): never {
  const message =
    error.code === "42501" || error.message.toLowerCase().includes("permission denied")
      ? `${fallbackMessage} Supabase RLS may be blocking mix creation. Run supabase/mix-rls-fix.sql in SQL Editor.`
      : fallbackMessage;

  throw new SupabaseClientDataError(message, error);
}
