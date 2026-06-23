import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import type { SupabaseClient } from "@supabase/supabase-js";
import { publishJsonTo0G } from "@/lib/0g/storage";
import { buildAgentDnaCapsule } from "@/lib/lyra/dna-capsule";
import { get0GStorageEnv, getSupabaseEnv } from "@/lib/utils/env";
import type {
  Agent,
  AgentLineage,
  AgentType,
  AvatarConfig,
  UserProfile,
  OgProvenanceVersion,
  Visibility,
} from "@/types";

export const runtime = "nodejs";

type PublishRequestBody = {
  agentId?: string;
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

export async function POST(request: Request) {
  const env = getSupabaseEnv();
  const storageEnv = get0GStorageEnv();

  if (!env) {
    return NextResponse.json(
      { ok: false, error: "Supabase environment variables are missing." },
      { status: 500 },
    );
  }

  let body: PublishRequestBody;

  try {
    body = (await request.json()) as PublishRequestBody;
  } catch {
    return NextResponse.json(
      { ok: false, error: "Invalid JSON body." },
      { status: 400 },
    );
  }

  if (!body.agentId) {
    return NextResponse.json(
      { ok: false, error: "agentId is required." },
      { status: 400 },
    );
  }

  const token = getBearerToken(request);
  const supabase = createClient(env.supabaseUrl, env.supabaseAnonKey, {
    global: token
      ? {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      : undefined,
  });

  const {
    data: { user },
    error: authError,
  } = token ? await supabase.auth.getUser(token) : await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json(
      { ok: false, error: "Sign in before publishing agent DNA." },
      { status: 401 },
    );
  }

  const { data: agentRow, error: agentError } = await supabase
    .from("agents")
    .select("*, profiles:owner_id(username, display_name)")
    .eq("id", body.agentId)
    .eq("owner_id", user.id)
    .maybeSingle<AgentRow>();

  if (agentError) {
    return NextResponse.json(
      { ok: false, error: `Agent could not be loaded: ${agentError.message}` },
      { status: 500 },
    );
  }

  if (!agentRow) {
    return NextResponse.json(
      { ok: false, error: "Agent not found or not owned by you." },
      { status: 404 },
    );
  }

  const { data: profileRow, error: profileError } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle<ProfileRow>();

  if (profileError) {
    return NextResponse.json(
      { ok: false, error: `Owner profile could not be loaded: ${profileError.message}` },
      { status: 500 },
    );
  }

  const { data: lineageData, error: lineageError } = await supabase
    .from("agent_lineage")
    .select("*")
    .eq("child_agent_id", agentRow.id)
    .order("created_at", { ascending: true })
    .returns<LineageRow[]>();

  if (lineageError) {
    return NextResponse.json(
      { ok: false, error: `Lineage could not be loaded: ${lineageError.message}` },
      { status: 500 },
    );
  }

  const lineageRows = (lineageData ?? []).map(mapLineage);
  const parentIds = Array.from(
    new Set(
      lineageRows
        .map((row) => row.parentAgentId)
        .filter((id): id is string => Boolean(id)),
    ),
  );
  const parentAgents = await loadParentAgents(supabase, parentIds);
  const agent = mapAgent(agentRow);
  const ownerProfile = mapProfile(profileRow, user.id, agent.ownerUsername);
  const existingVersions = agent.avatarConfig.ogProvenance?.versions ?? [];
  const previousRootHash =
    agent.avatarConfig.ogProvenance?.rootHash ?? agent.storageHash;
  const version = getNextVersion(existingVersions);
  const publishedAt = new Date().toISOString();
  const capsule = buildAgentDnaCapsule({
    agent,
    ownerProfile,
    lineageRows,
    parentAgents,
    versionNumber: version,
    previousRootHash,
    versionHistory: existingVersions,
    storageMode: storageEnv.mode === "mock" ? "mock" : "real",
    publishedAt,
  });
  const publishResult = await publishJsonTo0G({
    filename: `lyra-agent-${agent.id}.json`,
    data: capsule,
  });

  const isFailedRealFallback =
    publishResult.mode === "mock" &&
    publishResult.error &&
    storageEnv.mode !== "mock";

  if (!publishResult.ok || !publishResult.rootHash || isFailedRealFallback) {
    return NextResponse.json(
      {
        ok: false,
        mode: publishResult.mode,
        error: publishResult.error ?? "0G publish failed.",
        sizeBytes: publishResult.sizeBytes,
        version,
        previousRootHash,
      },
      { status: 500 },
    );
  }

  const nextVersion: OgProvenanceVersion = {
    version,
    rootHash: publishResult.rootHash,
    txHash: publishResult.txHash,
    mode: publishResult.mode,
    sizeBytes: publishResult.sizeBytes,
    publishedAt,
    capsuleType: "agent_dna",
    summary: `Agent DNA Capsule v${version} for ${agent.name}`,
  };
  const ogProvenance = {
    mode: publishResult.mode,
    rootHash: publishResult.rootHash,
    txHash: publishResult.txHash,
    publishedAt,
    sizeBytes: publishResult.sizeBytes,
    error: publishResult.error,
    versions: [...existingVersions, nextVersion],
  };
  const avatarConfig: AvatarConfig = {
    ...agent.avatarConfig,
    ogProvenance,
  };
  const { error: updateError } = await supabase
    .from("agents")
    .update({
      storage_hash: publishResult.rootHash,
      avatar_config: avatarConfig,
      updated_at: publishedAt,
    })
    .eq("id", agent.id)
    .eq("owner_id", user.id);

  if (updateError) {
    return NextResponse.json(
      { ok: false, error: `0G hash could not be saved: ${updateError.message}` },
      { status: 500 },
    );
  }

  return NextResponse.json({
    ok: true,
    mode: publishResult.mode,
    rootHash: publishResult.rootHash,
    txHash: publishResult.txHash,
    sizeBytes: publishResult.sizeBytes,
    error: publishResult.error,
    version,
    previousRootHash,
    publishedAt,
  });
}

function getBearerToken(request: Request) {
  const header = request.headers.get("authorization");

  if (!header?.toLowerCase().startsWith("bearer ")) {
    return null;
  }

  return header.slice("bearer ".length).trim();
}

async function loadParentAgents(
  supabase: SupabaseClient,
  parentIds: string[],
) {
  if (parentIds.length === 0) {
    return [];
  }

  const { data, error } = await supabase
    .from("agents")
    .select("*, profiles:owner_id(username, display_name)")
    .in("id", parentIds)
    .returns<AgentRow[]>();

  if (error) {
    return [];
  }

  return (data ?? []).map(mapAgent);
}

function mapAgent(row: AgentRow): Agent {
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

function mapProfile(
  row: ProfileRow | null,
  userId: string,
  fallbackUsername: string,
): UserProfile {
  return {
    id: row?.id ?? userId,
    username: row?.username ?? fallbackUsername,
    displayName: row?.display_name ?? row?.username ?? fallbackUsername,
    avatarUrl: row?.avatar_url ?? undefined,
    bio: row?.bio ?? "",
    createdAt: row?.created_at ?? new Date().toISOString(),
    updatedAt: row?.updated_at ?? undefined,
  };
}

function mapLineage(row: LineageRow): AgentLineage {
  return {
    id: row.id,
    childAgentId: row.child_agent_id,
    parentAgentId: row.parent_agent_id ?? undefined,
    percentage: Number(row.percentage ?? 100),
    relationType: row.relation_type,
    parentSnapshotName: row.parent_snapshot_name ?? undefined,
    parentSnapshotSummary: row.parent_snapshot_summary ?? undefined,
    createdAt: row.created_at ?? new Date().toISOString(),
  };
}

function getNextVersion(versions: OgProvenanceVersion[]) {
  return (
    versions.reduce((maxVersion, entry) => Math.max(maxVersion, entry.version), 0) +
    1
  );
}
