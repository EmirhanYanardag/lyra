"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useSupabaseUser } from "@/hooks/use-supabase-user";
import { cloneAgent } from "@/lib/lyra/client-clone";
import { formatSupabaseClientError } from "@/lib/lyra/client-agents";
import { cn } from "@/lib/utils/cn";

type CloneAgentButtonProps = {
  sourceAgentId: string;
  currentUserId?: string | null;
  className?: string;
  onCloned?: (clonedAgentId: string) => void;
};

export function CloneAgentButton({
  sourceAgentId,
  currentUserId,
  className,
  onCloned,
}: CloneAgentButtonProps) {
  const router = useRouter();
  const { user, supabase } = useSupabaseUser();
  const [isCloning, setIsCloning] = useState(false);
  const [clonedAgentId, setClonedAgentId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const activeUserId = currentUserId ?? user?.id;

  if (!activeUserId) {
    return (
      <Link
        href="/auth"
        className={cn(
          "lyra-accent-button rounded-full px-4 py-2 text-sm",
          className,
        )}
      >
        Sign in to clone
      </Link>
    );
  }

  async function handleClone() {
    if (isCloning || clonedAgentId) {
      return;
    }

    setIsCloning(true);
    setError(null);

    try {
      const result = await cloneAgent({
        supabase,
        sourceAgentId,
        currentUserId: activeUserId,
        currentUserEmail: user?.email,
      });
      setClonedAgentId(result.clonedAgentId);
      onCloned?.(result.clonedAgentId);
      router.push(`/agents/${result.clonedAgentId}`);
      router.refresh();
    } catch (caughtError) {
      setError(formatSupabaseClientError(caughtError));
    } finally {
      setIsCloning(false);
    }
  }

  return (
    <span className="inline-flex flex-col gap-2">
      {clonedAgentId ? (
        <Link
          href={`/agents/${clonedAgentId}`}
          className={cn(
            "lyra-accent-button rounded-full px-4 py-2 text-sm",
            className,
          )}
        >
          Open Clone
        </Link>
      ) : (
        <button
          type="button"
          onClick={handleClone}
          disabled={isCloning}
          className={cn(
            "lyra-accent-button rounded-full px-4 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-60",
            className,
          )}
        >
          {isCloning ? "Cloning..." : "Clone"}
        </button>
      )}
      {error && <span className="max-w-xs text-xs text-red-200">{error}</span>}
    </span>
  );
}
