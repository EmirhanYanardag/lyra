"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

type PublishTo0GButtonProps = {
  agentId: string;
  existingHash?: string;
  onPublished?: (result: PublishResult) => void;
};

export type PublishResult = {
  ok: boolean;
  mode: "real" | "mock";
  rootHash: string;
  txHash?: string;
  sizeBytes: number;
  publishedAt?: string;
  version?: number;
  previousRootHash?: string;
  error?: string;
};

export function PublishTo0GButton({
  agentId,
  existingHash,
  onPublished,
}: PublishTo0GButtonProps) {
  const [isPublishing, setIsPublishing] = useState(false);
  const [result, setResult] = useState<PublishResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const hash = result?.rootHash ?? existingHash;

  async function handlePublish() {
    if (isPublishing) {
      return;
    }

    setIsPublishing(true);
    setError(null);

    try {
      const supabase = createSupabaseBrowserClient();
      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token;

      if (!token) {
        throw new Error("Sign in before publishing agent DNA.");
      }

      const response = await fetch("/api/0g/publish-agent", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ agentId }),
      });
      const payload = (await response.json()) as Partial<PublishResult> & {
        error?: string;
      };

      if (!response.ok || !payload.ok || !payload.rootHash || !payload.mode) {
        throw new Error(payload.error ?? `Publish failed with ${response.status}`);
      }

      const nextResult: PublishResult = {
        ok: true,
        mode: payload.mode,
        rootHash: payload.rootHash,
        txHash: payload.txHash,
        sizeBytes: payload.sizeBytes ?? 0,
        publishedAt: payload.publishedAt,
        version: payload.version,
        previousRootHash: payload.previousRootHash,
        error: payload.error,
      };

      setResult(nextResult);
      onPublished?.(nextResult);
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Agent DNA could not be published.",
      );
    } finally {
      setIsPublishing(false);
    }
  }

  return (
    <div className="space-y-3">
      {hash && (
        <div className="lyra-chip rounded-2xl px-4 py-3">
          <p className="text-sm font-medium text-[var(--lyra-chip-text)]">Published to 0G</p>
          <p className="mt-1 font-mono text-xs text-[var(--lyra-text-soft)]">
            {shortenHash(hash)}
          </p>
        </div>
      )}
      <Button type="button" onClick={handlePublish} disabled={isPublishing}>
        {isPublishing
          ? "Publishing..."
          : hash
            ? "Republish"
            : "Publish DNA to 0G"}
      </Button>
      {result && (
        <p className="lyra-label text-xs">
          Published {result.mode === "real" ? "to 0G Storage" : "in mock mode"}.
        </p>
      )}
      {error && (
        <p className="rounded-xl border border-red-300/20 bg-red-400/10 px-3 py-2 text-sm text-red-100">
          {error}
        </p>
      )}
    </div>
  );
}

function shortenHash(hash: string) {
  if (hash.length <= 22) {
    return hash;
  }

  return `${hash.slice(0, 12)}...${hash.slice(-8)}`;
}
