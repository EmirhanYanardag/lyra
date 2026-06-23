"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AgentCard } from "@/components/agents/agent-card";
import { CloneAgentButton } from "@/components/agents/clone-agent-button";
import { useSupabaseUser } from "@/hooks/use-supabase-user";
import { formatSupabaseClientError } from "@/lib/lyra/client-agents";
import {
  getProfileByUsernameClient,
  getPublicAgentsByProfileClient,
} from "@/lib/lyra/client-network";
import type { Agent, UserProfile } from "@/types";

export function ProfileView({ username }: { username: string }) {
  const router = useRouter();
  const { user, supabase } = useSupabaseUser();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [isEditingUsername, setIsEditingUsername] = useState(false);
  const [isSavingUsername, setIsSavingUsername] = useState(false);
  const [usernameDraft, setUsernameDraft] = useState("");
  const [usernameError, setUsernameError] = useState<string | null>(null);
  const [usernameSaved, setUsernameSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [avatarError, setAvatarError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadProfile() {
      setIsLoading(true);
      setError(null);

      try {
        const nextProfile = await getProfileByUsernameClient(supabase, username);

        if (!nextProfile) {
          if (isMounted) {
            setProfile(null);
            setAgents([]);
          }
          return;
        }

        const nextAgents = await getPublicAgentsByProfileClient(
          supabase,
          nextProfile.id,
          nextProfile.username,
        );

        if (isMounted) {
          setProfile(nextProfile);
          setAgents(nextAgents);
        }
      } catch (caughtError) {
        if (isMounted) {
          setError(formatSupabaseClientError(caughtError));
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    void loadProfile();

    return () => {
      isMounted = false;
    };
  }, [supabase, username]);

  if (isLoading) {
    return (
      <StateCard
        title="Loading profile..."
        body="Fetching public identity and agents."
      />
    );
  }

  if (error) {
    return <StateCard title="Profile could not load." body={error} />;
  }

  if (!profile) {
    return (
      <StateCard
        title="Profile not found."
        body="This public profile is not available yet."
      />
    );
  }

  const isOwnProfile = user?.id === profile.id;

  function startUsernameEdit() {
    if (!profile) {
      return;
    }

    setUsernameDraft(profile.username);
    setUsernameError(null);
    setUsernameSaved(false);
    setIsEditingUsername(true);
  }

  function cancelUsernameEdit() {
    if (!profile) {
      return;
    }

    setUsernameDraft(profile.username);
    setUsernameError(null);
    setIsEditingUsername(false);
  }

  async function saveUsername() {
    if (!user || !profile || isSavingUsername) {
      return;
    }

    const nextUsername = usernameDraft.trim().toLowerCase();

    if (nextUsername.length < 3 || nextUsername.length > 24) {
      setUsernameError("Username must be 3-24 characters.");
      return;
    }

    if (!/^[a-z0-9_]+$/.test(nextUsername)) {
      setUsernameError("Use only letters, numbers, and underscore.");
      return;
    }

    if (nextUsername === profile.username) {
      setIsEditingUsername(false);
      return;
    }

    setIsSavingUsername(true);
    setUsernameError(null);
    setUsernameSaved(false);

    try {
      const { data: existingProfile, error: duplicateError } = await supabase
        .from("profiles")
        .select("id")
        .eq("username", nextUsername)
        .maybeSingle();

      if (duplicateError) {
        throw duplicateError;
      }

      if (
        existingProfile &&
        "id" in existingProfile &&
        existingProfile.id !== profile.id
      ) {
        setUsernameError("Username already taken.");
        return;
      }

      const { error: updateError } = await supabase
        .from("profiles")
        .update({
          username: nextUsername,
          display_name: nextUsername,
        })
        .eq("id", profile.id);

      if (updateError) {
        throw updateError;
      }

      const { error: metadataError } = await supabase.auth.updateUser({
        data: { username: nextUsername },
      });

      if (metadataError) {
        throw metadataError;
      }

      setProfile({
        ...profile,
        username: nextUsername,
        displayName: nextUsername,
      });
      setUsernameSaved(true);
      setIsEditingUsername(false);
      router.replace(`/profile/${nextUsername}`);
      router.refresh();
    } catch (caughtError) {
      setUsernameError(
        caughtError instanceof Error
          ? caughtError.message
          : "Username could not be updated.",
      );
    } finally {
      setIsSavingUsername(false);
    }
  }

  function handleUsernameKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Escape") {
      cancelUsernameEdit();
    }

    if (event.key === "Enter") {
      event.preventDefault();
      void saveUsername();
    }
  }

  async function handleAvatarUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file || !user || !profile) {
      return;
    }

    if (!file.type.startsWith("image/")) {
      setAvatarError("Please choose an image file.");
      event.target.value = "";
      return;
    }

    const previewUrl = URL.createObjectURL(file);
    setProfile({ ...profile, avatarUrl: previewUrl });
    setIsUploadingAvatar(true);
    setAvatarError(null);

    try {
      const extension = getImageExtension(file);
      const path = `${user.id}/avatar-${file.lastModified}.${extension}`;
      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(path, file, { upsert: true });

      if (uploadError) {
        const dataUrl = await readFileAsDataUrl(file);
        await updateProfileAvatar(dataUrl);
        URL.revokeObjectURL(previewUrl);
        return;
      }

      const { data } = supabase.storage.from("avatars").getPublicUrl(path);
      await updateProfileAvatar(data.publicUrl);
      URL.revokeObjectURL(previewUrl);
    } catch (caughtError) {
      setProfile({ ...profile, avatarUrl: profile.avatarUrl });
      setAvatarError(
        caughtError instanceof Error
          ? caughtError.message
          : "Avatar could not be updated.",
      );
    } finally {
      setIsUploadingAvatar(false);
      event.target.value = "";
    }
  }

  async function updateProfileAvatar(avatarUrl: string) {
    if (!user || !profile) {
      return;
    }

    const { error: updateError } = await supabase
      .from("profiles")
      .update({ avatar_url: avatarUrl })
      .eq("id", user.id);

    if (updateError) {
      throw updateError;
    }

    setProfile({ ...profile, avatarUrl });
  }

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.refresh();
    router.push("/auth?mode=signin");
  }

  return (
    <>
      <section className="glass-card rounded-2xl p-6">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
          <div className="flex flex-col items-start gap-3">
            <div className="grid size-24 place-items-center overflow-hidden rounded-full border border-[var(--lyra-chip-border)] bg-[var(--lyra-chip-bg)] text-2xl font-semibold text-[var(--lyra-chip-text)]">
              {profile.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={profile.avatarUrl}
                  alt={`${profile.displayName} avatar`}
                  className="h-full w-full object-cover"
                />
              ) : (
                profile.displayName.slice(0, 1)
              )}
            </div>
            {isOwnProfile ? (
              <label className="cursor-pointer rounded-full border border-[var(--lyra-button-border)] bg-white/[0.045] px-4 py-2 text-sm text-[var(--lyra-button-text)] transition hover:border-[var(--lyra-button-hover-border)] hover:bg-[var(--lyra-button-hover-bg)]">
                {isUploadingAvatar ? "Uploading..." : "Upload avatar"}
                <input
                  type="file"
                  accept="image/*"
                  className="sr-only"
                  disabled={isUploadingAvatar}
                  onChange={handleAvatarUpload}
                />
              </label>
            ) : null}
          </div>
          <div className="min-w-0 flex-1">
            {isEditingUsername ? (
              <div className="mt-1 flex max-w-xl animate-[fadeIn_180ms_ease-out] flex-col gap-3 sm:flex-row sm:items-center">
                <input
                  value={usernameDraft}
                  onChange={(event) => {
                    setUsernameDraft(event.target.value);
                    setUsernameError(null);
                    setUsernameSaved(false);
                  }}
                  onKeyDown={handleUsernameKeyDown}
                  minLength={3}
                  maxLength={24}
                  autoFocus
                  className="lyra-input h-12 min-w-0 flex-1 rounded-xl px-4 text-xl font-semibold outline-none transition-all duration-200 sm:text-2xl"
                />
                <button
                  type="button"
                  onClick={() => void saveUsername()}
                  disabled={isSavingUsername}
                  className="h-12 rounded-full border border-[var(--lyra-button-border)] bg-white/[0.045] px-5 text-sm text-[var(--lyra-button-text)] transition hover:border-[var(--lyra-button-hover-border)] hover:bg-[var(--lyra-button-hover-bg)] disabled:opacity-60"
                >
                  {isSavingUsername ? "Saving..." : "Save"}
                </button>
              </div>
            ) : (
              <div className="mt-1 flex flex-wrap items-center gap-3">
                <h1 className="text-4xl font-semibold text-white">
                  {profile.username}
                </h1>
                {isOwnProfile ? (
                  <button
                    type="button"
                    onClick={startUsernameEdit}
                    className="rounded-full border border-[var(--lyra-button-border)] bg-white/[0.045] px-3 py-1.5 text-xs text-[var(--lyra-button-text)] transition hover:border-[var(--lyra-button-hover-border)] hover:bg-[var(--lyra-button-hover-bg)]"
                  >
                    Edit Username
                  </button>
                ) : null}
              </div>
            )}
            {usernameError ? (
              <p className="mt-3 text-sm text-red-200">{usernameError}</p>
            ) : null}
            {usernameSaved ? (
              <p className="mt-3 animate-[fadeIn_180ms_ease-out] text-sm text-[var(--lyra-chip-text)]">
                Username saved.
              </p>
            ) : null}
            {avatarError ? (
              <p className="mt-3 text-sm text-red-200">{avatarError}</p>
            ) : null}
            {isOwnProfile ? (
              <button
                type="button"
                onClick={handleSignOut}
                className="mt-4 rounded-full border border-[var(--lyra-button-border)] bg-white/[0.045] px-4 py-2 text-sm text-[var(--lyra-button-text)] transition hover:border-[var(--lyra-button-hover-border)] hover:bg-[var(--lyra-button-hover-bg)]"
              >
                Sign out
              </button>
            ) : null}
          </div>
        </div>
        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          <CountPill label="Originals" value={countByType(agents, "original")} />
          <CountPill label="Clones" value={countByType(agents, "clone")} />
          <CountPill label="Hybrids" value={countByType(agents, "mixed")} />
        </div>
      </section>
      <section className="mt-8 grid gap-5 lg:grid-cols-2">
        {agents.length > 0 ? (
          agents.map((agent) => (
            <AgentCard
              key={agent.id}
              agent={agent}
              showViewButton
              cloneNode={
                <CloneAgentButton
                  sourceAgentId={agent.id}
                  currentUserId={user?.id}
                />
              }
            />
          ))
        ) : (
          <div className="glass-card rounded-2xl p-6">
            <p className="text-slate-300">
              This profile has no public agents yet.
            </p>
          </div>
        )}
      </section>
    </>
  );
}

function getImageExtension(file: File) {
  const extension = file.name.split(".").pop()?.toLowerCase();

  if (extension && ["png", "jpg", "jpeg", "webp", "gif"].includes(extension)) {
    return extension === "jpeg" ? "jpg" : extension;
  }

  return file.type.split("/")[1]?.replace("jpeg", "jpg") || "png";
}

function readFileAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Avatar file could not be read."));
    reader.readAsDataURL(file);
  });
}

function CountPill({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
      <p className="lyra-label text-xs">
        {label}
      </p>
      <p className="mt-1 text-2xl font-semibold text-white">{value}</p>
    </div>
  );
}

function countByType(agents: Agent[], type: Agent["type"]) {
  return agents.filter((agent) => agent.type === type).length;
}

function StateCard({ title, body }: { title: string; body: string }) {
  return (
    <section className="glass-card rounded-2xl p-8">
      <h1 className="text-4xl font-semibold text-white">{title}</h1>
      <p className="mt-3 text-slate-300">{body}</p>
    </section>
  );
}
