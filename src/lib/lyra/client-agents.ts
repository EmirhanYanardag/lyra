"use client";

import type { PostgrestError, SupabaseClient, User } from "@supabase/supabase-js";
import { createInitialMemoryProfile } from "@/lib/lyra/memory";
import { withNetworkImpactCounts } from "@/lib/lyra/client-network-impact";
import type { Agent, AgentType, AvatarConfig, CreateAgentInput, UserProfile, Visibility } from "@/types";

type ProfileRow = {
  id: string;
  username: string | null;
  display_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  created_at: string | null;
  updated_at: string | null;
};

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

export async function getClientProfile(
  supabase: SupabaseClient,
  userId: string,
) {
  logProfileDebug("Querying profile", { userId });

  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .maybeSingle<ProfileRow>();

  if (error) {
    logProfileDebug("Profile query failed", {
      userId,
      code: error.code,
      message: error.message,
      details: error.details,
      hint: error.hint,
    });
    throwClientDataError(error);
  }

  return data ? mapProfile(data) : null;
}

export async function ensureClientProfile(
  supabase: SupabaseClient,
  user: User,
) {
  const existingProfile = await getClientProfile(supabase, user.id);

  if (existingProfile) {
    return existingProfile;
  }

  const emailPrefix = sanitizeUsername(user.email?.split("@")[0] ?? "lyra_user");
  const username = `${emailPrefix}_${user.id.slice(0, 6)}`;

  const { data, error } = await supabase
    .from("profiles")
    .insert({
      id: user.id,
      username,
      display_name: user.email?.split("@")[0] ?? "LYRA User",
      bio: "",
    })
    .select("*")
    .single<ProfileRow>();

  if (error) {
    throwClientDataError(error);
  }

  return mapProfile(data);
}

export async function getMyAgentsClient(
  supabase: SupabaseClient,
  userId: string,
  ownerUsername = "you",
) {
  const { data, error } = await supabase
    .from("agents")
    .select("*")
    .eq("owner_id", userId)
    .order("created_at", { ascending: false })
    .returns<AgentRow[]>();

  if (error) {
    throwClientDataError(error);
  }

  return withNetworkImpactCounts(
    supabase,
    (data ?? []).map((agent) => mapAgent(agent, ownerUsername)),
  );
}

export async function createAgentClient({
  supabase,
  user,
  input,
}: {
  supabase: SupabaseClient;
  user: User;
  input: CreateAgentInput;
}) {
  const profile = await ensureClientProfile(supabase, user);
  const name = input.name.trim();
  const topic = input.topic.trim();

  if (!name) {
    throw new Error("Agent name is required.");
  }

  if (topic.length < 10) {
    throw new Error("Topic must be at least 10 characters.");
  }

  const payload = {
    owner_id: user.id,
    name,
    type: "original" satisfies AgentType,
    topic,
    topic_summary: topic.slice(0, 180),
    summary: `An agent shaped by ${topic}`,
    keywords: deriveKeywords(topic),
    personality_traits: ["curious", "adaptive", "topic-shaped"],
    avatar_config: createAvatarConfig({
      name,
      topic,
      summary: `An agent shaped by ${topic}`,
      keywords: deriveKeywords(topic),
      traits: ["curious", "adaptive", "topic-shaped"],
    }),
    system_prompt: `You are ${name}, a persistent LYRA identity originally shaped by this topic: ${topic}. Answer broadly and use the topic as perspective, not restriction.`,
    visibility: input.visibility ?? "public",
  };

  const { data, error } = await supabase
    .from("agents")
    .insert(payload)
    .select("*")
    .single<AgentRow>();

  if (error) {
    throwClientDataError(error);
  }

  return mapAgent(data, profile.username);
}

function mapProfile(row: ProfileRow): UserProfile {
  return {
    id: row.id,
    username: row.username ?? "lyra_user",
    displayName: row.display_name ?? "LYRA User",
    avatarUrl: row.avatar_url ?? undefined,
    bio: row.bio ?? "",
    createdAt: row.created_at ?? new Date().toISOString(),
    updatedAt: row.updated_at ?? undefined,
  };
}

function mapAgent(row: AgentRow, ownerUsername: string): Agent {
  return {
    id: row.id,
    ownerId: row.owner_id,
    ownerUsername,
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

function createAvatarConfig({
  name,
  topic,
  summary,
  keywords,
  traits,
}: {
  name: string;
  topic: string;
  summary: string;
  keywords: string[];
  traits: string[];
}): AvatarConfig {
  const palettes = [
    ["#8b5cf6", "#38bdf8", "#e5e7eb"],
    ["#60a5fa", "#c4b5fd", "#f8fafc"],
    ["#a78bfa", "#93c5fd", "#d1d5db"],
  ];
  const palette = palettes[Math.floor(Math.random() * palettes.length)];

  return {
    seed: `${name}-${Date.now()}`,
    palette,
    head: "angular",
    eyes: "glow",
    body: "glass",
    accessory: "signal-ring",
    background: "near-black-gradient",
    memoryProfile: createInitialMemoryProfile({
      topic,
      summary,
      traits,
      keywords,
    }),
  };
}

function sanitizeUsername(value: string) {
  const username = value.toLowerCase().replace(/[^a-z0-9_]+/g, "");
  return username.length >= 3 ? username : "lyra_user";
}

function throwClientDataError(error: PostgrestError): never {
  if (isPermissionDenied(error)) {
    throw new SupabaseClientDataError(
      "Profile access is blocked by Supabase RLS or table grants. Run supabase/dev-open-profiles.sql in SQL Editor.",
      error,
    );
  }

  throw new SupabaseClientDataError(error.message, error);
}

function isPermissionDenied(error: PostgrestError) {
  return (
    error.code === "42501" ||
    error.message.toLowerCase().includes("permission denied")
  );
}

export class SupabaseClientDataError extends Error {
  code: string;
  details: string | null;
  hint: string | null;
  supabaseMessage: string;

  constructor(message: string, error: PostgrestError) {
    super(message);
    this.name = "SupabaseClientDataError";
    this.code = error.code;
    this.details = error.details;
    this.hint = error.hint;
    this.supabaseMessage = error.message;
  }
}

export function formatSupabaseClientError(error: unknown) {
  if (error instanceof SupabaseClientDataError) {
    return [
      error.message,
      `code: ${error.code}`,
      `message: ${error.supabaseMessage}`,
      error.details ? `details: ${error.details}` : null,
      error.hint ? `hint: ${error.hint}` : null,
    ]
      .filter(Boolean)
      .join(" | ");
  }

  return error instanceof Error ? error.message : "Unable to load data.";
}

function logProfileDebug(
  message: string,
  payload: Record<string, string | null>,
) {
  if (process.env.NODE_ENV !== "development") {
    return;
  }

  console.info(`[LYRA profiles] ${message}`, payload);
}
