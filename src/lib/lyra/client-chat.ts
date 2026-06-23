"use client";

import type { PostgrestError, SupabaseClient, User } from "@supabase/supabase-js";
import {
  formatSupabaseClientError,
  SupabaseClientDataError,
} from "@/lib/lyra/client-agents";
import {
  evolveMemoryProfile,
  extractConcepts,
  type EvolutionSource,
} from "@/lib/lyra/memory";
import type { IdentityFrame } from "@/lib/lyra/identity-frame";
import type {
  Agent,
  AgentMemoryProfile,
  AgentType,
  AvatarConfig,
  ChatMessage,
  Visibility,
} from "@/types";

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
};

type MessageRow = {
  id: string;
  agent_id: string;
  user_id: string;
  role: "user" | "assistant" | "system";
  content: string;
  created_at: string | null;
};

export async function getOwnedAgentClient({
  supabase,
  agentId,
  userId,
}: {
  supabase: SupabaseClient;
  agentId: string;
  userId: string;
}) {
  const { data, error } = await supabase
    .from("agents")
    .select("*")
    .eq("id", agentId)
    .eq("owner_id", userId)
    .maybeSingle<AgentRow>();

  if (error) {
    throwChatError(error, "Unable to load this agent.");
  }

  return data ? mapAgent(data) : null;
}

export async function getAgentMessagesClient({
  supabase,
  agentId,
}: {
  supabase: SupabaseClient;
  agentId: string;
}) {
  const { data, error } = await supabase
    .from("messages")
    .select("*")
    .eq("agent_id", agentId)
    .order("created_at", { ascending: true })
    .returns<MessageRow[]>();

  if (error) {
    throwChatError(error, "Unable to load messages.");
  }

  return (data ?? []).map(mapMessage);
}

export async function insertChatMessageClient({
  supabase,
  user,
  agentId,
  role,
  content,
}: {
  supabase: SupabaseClient;
  user: User;
  agentId: string;
  role: "user" | "assistant" | "system";
  content: string;
}) {
  const { data, error } = await supabase
    .from("messages")
    .insert({
      agent_id: agentId,
      user_id: user.id,
      role,
      content,
    })
    .select("*")
    .single<MessageRow>();

  if (error) {
    throwChatError(
      error,
      role === "assistant"
        ? "Assistant reply insert failed."
        : "Message insert failed.",
    );
  }

  return mapMessage(data);
}

export async function evolveAgentAfterUserMessageClient({
  supabase,
  agent,
  userMessage,
  latestAssistantMessage,
  recentMessages,
  identityFrame,
}: {
  supabase: SupabaseClient;
  agent: Agent;
  userMessage: string;
  latestAssistantMessage: string;
  recentMessages: ChatMessage[];
  identityFrame?: IdentityFrame;
}) {
  const { memoryProfile, source } = await generateMemoryEvolution({
    agent,
    userMessage,
    latestAssistantMessage,
    recentMessages,
    identityFrame,
  });
  const keywords = mergeKeywords(
    agent.keywords,
    extractConcepts(`${userMessage} ${latestAssistantMessage}`).concat(
      memoryProfile.learnedTopics,
    ),
  );
  const traits = mergeTraits(
    agent.personalityTraits,
    memoryProfile.behavioralTraits,
  );
  const summary = memoryProfile.identitySummary || agent.summary;
  const avatarConfig = {
    ...agent.avatarConfig,
    memoryProfile,
  };

  const { error } = await supabase
    .from("agents")
    .update({
      keywords,
      personality_traits: traits,
      summary,
      avatar_config: avatarConfig,
      updated_at: new Date().toISOString(),
    })
    .eq("id", agent.id)
    .eq("owner_id", agent.ownerId);

  if (error) {
    throwChatError(error, "Agent evolution update failed.");
  }

  return {
    agent: {
      ...agent,
      summary,
      keywords,
      personalityTraits: traits,
      avatarConfig,
      memoryProfile,
      updatedAt: new Date().toISOString(),
    },
    source,
  };
}

export function formatChatError(error: unknown) {
  return formatSupabaseClientError(error);
}

function mapAgent(row: AgentRow): Agent {
  return {
    id: row.id,
    ownerId: row.owner_id,
    ownerUsername: "you",
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

function mapMessage(row: MessageRow): ChatMessage {
  return {
    id: row.id,
    agentId: row.agent_id,
    userId: row.user_id,
    role: row.role,
    content: row.content,
    createdAt: row.created_at ?? new Date().toISOString(),
  };
}

function mergeKeywords(existing: string[], incoming: string[]) {
  return Array.from(new Set([...incoming, ...existing])).slice(0, 8);
}

async function generateMemoryEvolution({
  agent,
  userMessage,
  latestAssistantMessage,
  recentMessages,
  identityFrame,
}: {
  agent: Agent;
  userMessage: string;
  latestAssistantMessage: string;
  recentMessages: ChatMessage[];
  identityFrame?: IdentityFrame;
}): Promise<{ memoryProfile: AgentMemoryProfile; source: EvolutionSource }> {
  try {
    const response = await fetch("/api/evolve", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        agent,
        latestUserMessage: userMessage,
        latestAssistantMessage,
        recentMessages,
        identityFrame,
      }),
    });

    if (!response.ok) {
      throw new Error(`Evolution API failed with ${response.status}`);
    }

    const data = (await response.json()) as {
      memoryProfile?: AgentMemoryProfile;
      source?: EvolutionSource;
    };

    if (!data.memoryProfile) {
      throw new Error("Evolution API returned no memory profile.");
    }

    return {
      memoryProfile: data.memoryProfile,
      source: data.source ?? "gemini",
    };
  } catch {
    return {
      memoryProfile: evolveMemoryProfile({
        agent,
        userMessage,
        assistantMessage: latestAssistantMessage,
        recentMessages,
        identityFrame,
      }),
      source: "local-fallback",
    };
  }
}

function mergeTraits(existing: string[], incoming: string[]) {
  if (incoming.length === 0) {
    return existing.slice(0, 8);
  }

  return Array.from(new Set([...incoming, ...existing])).slice(0, 8);
}

function throwChatError(error: PostgrestError, fallbackMessage: string): never {
  const message =
    error.code === "42501" || error.message.toLowerCase().includes("permission denied")
      ? `${fallbackMessage} Supabase RLS may be blocking messages. Run supabase/messages-rls-fix.sql in SQL Editor.`
      : fallbackMessage;

  throw new SupabaseClientDataError(message, error);
}
