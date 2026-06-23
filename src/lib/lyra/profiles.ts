import "server-only";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { UserProfile } from "@/types";

type ProfileRow = {
  id: string;
  username: string | null;
  display_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  created_at: string | null;
  updated_at: string | null;
};

export async function getCurrentProfile() {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return null;
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const { data } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle<ProfileRow>();

  return data ? mapProfile(data) : null;
}

export async function getProfileByUsername(username: string) {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return null;
  }

  const { data } = await supabase
    .from("profiles")
    .select("*")
    .eq("username", username)
    .maybeSingle<ProfileRow>();

  return data ? mapProfile(data) : null;
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
