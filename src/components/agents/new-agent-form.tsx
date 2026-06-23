"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useSupabaseUser } from "@/hooks/use-supabase-user";
import {
  createAgentClient,
  formatSupabaseClientError,
} from "@/lib/lyra/client-agents";

const traits = ["curious", "adaptive", "topic-shaped"];

export function NewAgentForm() {
  const router = useRouter();
  const { user, loading, error: authError, supabase } = useSupabaseUser();
  const [name, setName] = useState("");
  const [topic, setTopic] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/auth");
    }
  }, [loading, router, user]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSuccessMessage(null);

    if (!user) {
      setError("Sign in before creating an agent.");
      return;
    }

    if (!name.trim()) {
      setError("Agent name is required.");
      return;
    }

    if (topic.trim().length < 10) {
      setError("Topic must be at least 10 characters.");
      return;
    }

    setIsSubmitting(true);

    try {
      const agent = await createAgentClient({
        supabase,
        user,
        input: {
          name,
          topic,
          visibility: "public",
        },
      });

      setSuccessMessage("Agent created. Opening detail view...");
      router.push(`/agents/${agent.id}`);
      router.refresh();
    } catch (caughtError) {
      setError(formatSupabaseClientError(caughtError));
    } finally {
      setIsSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="glass-card mt-8 rounded-2xl p-8">
        <h2 className="text-2xl font-semibold text-white">
          Checking your session...
        </h2>
        <p className="mt-3 text-slate-300">
          LYRA is reading the active browser session before opening creation.
        </p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="glass-card mt-8 rounded-2xl p-8">
        <h2 className="text-2xl font-semibold text-white">
          Redirecting to auth...
        </h2>
        <p className="mt-3 text-slate-300">
          You need an active browser session before creating an agent.
        </p>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="glass-card mt-8 grid gap-5 rounded-2xl p-6"
    >
      <div>
        <label className="text-sm text-slate-400" htmlFor="name">
          Agent name
        </label>
        <input
          id="name"
          name="name"
          required
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="Orion Market Synth"
          className="lyra-input mt-2 h-12 w-full rounded-xl px-4 outline-none"
        />
      </div>

      <div>
        <label className="text-sm text-slate-400" htmlFor="topic">
          Main topic / prompt
        </label>
        <textarea
          id="topic"
          name="topic"
          required
          minLength={10}
          value={topic}
          onChange={(event) => setTopic(event.target.value)}
          placeholder="Track emerging AI product categories, creator behavior, and market signals..."
          className="lyra-input mt-2 min-h-36 w-full rounded-xl p-4 outline-none"
        />
      </div>

      <div className="flex flex-wrap gap-2">
        {traits.map((trait) => (
          <span
            key={trait}
            className="lyra-chip rounded-full px-3 py-1.5 text-sm"
          >
            {trait}
          </span>
        ))}
      </div>

      {(authError || error) && (
        <div className="rounded-xl border border-red-300/20 bg-red-400/10 px-4 py-3 text-sm text-red-100">
          {authError ?? error}
        </div>
      )}

      {successMessage && (
        <div className="rounded-xl border border-[var(--lyra-chip-border)] bg-[var(--lyra-chip-bg)] px-4 py-3 text-sm text-[var(--lyra-chip-text)]">
          {successMessage}
        </div>
      )}

      <Button
        type="submit"
        disabled={isSubmitting}
        className="w-full sm:w-fit"
      >
        {isSubmitting ? "Creating..." : "Create Agent"}
      </Button>
    </form>
  );
}
