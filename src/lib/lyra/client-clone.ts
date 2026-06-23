"use client";

import type { PostgrestError, SupabaseClient } from "@supabase/supabase-js";
import {
  ensureClientProfile,
  SupabaseClientDataError,
} from "@/lib/lyra/client-agents";
import type { AgentType, AvatarConfig, UserProfile, Visibility } from "@/types";

type SourceAgentRow = {
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
  visibility: Visibility;
  profiles?: {
    username: string | null;
    display_name: string | null;
  } | null;
};

type ClonedAgentRow = {
  id: string;
};

export async function cloneAgent({
  supabase,
  sourceAgentId,
  currentUserId,
  currentUserEmail,
}: {
  supabase: SupabaseClient;
  sourceAgentId: string;
  currentUserId?: string | null;
  currentUserEmail?: string | null;
}) {
  if (!currentUserId) {
    throw new Error("Sign in before cloning an agent.");
  }

  const { data: sourceAgent, error: sourceError } = await supabase
    .from("agents")
    .select("*, profiles:owner_id(username, display_name)")
    .eq("id", sourceAgentId)
    .maybeSingle<SourceAgentRow>();

  if (sourceError) {
    throwCloneError(sourceError, "Source agent could not be loaded.");
  }

  if (!sourceAgent) {
    throw new Error("Source agent not found.");
  }

  if (sourceAgent.visibility !== "public" && sourceAgent.owner_id !== currentUserId) {
    throw new Error("This agent is private and cannot be cloned.");
  }

  const profile = await ensureClientProfile(supabase, {
    id: currentUserId,
    email: currentUserEmail ?? undefined,
  } as Parameters<typeof ensureClientProfile>[1]);
  const now = new Date().toISOString();
  const previousDepth = Number(sourceAgent.avatar_config?.cloneDepth ?? 0);
  const sourceSummary =
    sourceAgent.summary ?? sourceAgent.topic_summary ?? sourceAgent.topic;
  const sourceOwner = formatOwner(sourceAgent.profiles);
  const clonedAvatarConfig: AvatarConfig = {
    ...(sourceAgent.avatar_config ?? { palette: ["#8b5cf6", "#38bdf8", "#e5e7eb"] }),
    cloneOf: sourceAgent.id,
    cloneDepth: previousDepth + 1,
    clonedAt: now,
    originalCreator: sourceOwner,
  } as AvatarConfig;

  const { data: clone, error: cloneError } = await supabase
    .from("agents")
    .insert({
      owner_id: currentUserId,
      name:
        sourceAgent.owner_id === currentUserId
          ? `${sourceAgent.name} Copy`
          : `${sourceAgent.name} Clone`,
      type: "clone",
      topic: sourceAgent.topic,
      topic_summary: sourceAgent.topic_summary,
      summary: sourceSummary,
      keywords: sourceAgent.keywords ?? [],
      personality_traits: sourceAgent.personality_traits ?? [],
      avatar_config: clonedAvatarConfig,
      system_prompt: sourceAgent.system_prompt,
      source_agent_id: sourceAgent.id,
      storage_hash: null,
      visibility: "public",
    })
    .select("id")
    .single<ClonedAgentRow>();

  if (cloneError) {
    throwCloneError(cloneError, "Clone insert failed.");
  }

  const { error: lineageError } = await supabase.from("agent_lineage").insert({
    child_agent_id: clone.id,
    parent_agent_id: sourceAgent.id,
    percentage: 100,
    relation_type: "clone",
    parent_snapshot_name: sourceAgent.name,
    parent_snapshot_summary: sourceSummary,
  });

  if (lineageError) {
    throwCloneError(lineageError, "Lineage insert failed.");
  }

  return {
    clonedAgentId: clone.id,
    profile: profile as UserProfile,
  };
}

function formatOwner(profile: SourceAgentRow["profiles"]) {
  return profile?.display_name || profile?.username || "Unknown creator";
}

function throwCloneError(error: PostgrestError, fallbackMessage: string): never {
  const message =
    error.code === "42501" || error.message.toLowerCase().includes("permission denied")
      ? `${fallbackMessage} Supabase RLS may be blocking clone creation. Run supabase/clone-rls-fix.sql in SQL Editor.`
      : fallbackMessage;

  throw new SupabaseClientDataError(message, error);
}
