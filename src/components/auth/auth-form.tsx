"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

type AuthMode = "sign-in" | "sign-up";

export function AuthForm({ initialMode = "sign-in" }: { initialMode?: AuthMode }) {
  const router = useRouter();
  const [mode, setMode] = useState<AuthMode>(initialMode);
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSuccessMessage(null);
    setIsLoading(true);

    try {
      const supabase = createSupabaseBrowserClient();
      const cleanUsername = sanitizeUsername(username);

      if (mode === "sign-up") {
        if (!cleanUsername) {
          setError("Username is required.");
          return;
        }

        if (password !== confirmPassword) {
          setError("Passwords do not match.");
          return;
        }
      }

      const result =
        mode === "sign-up"
          ? await supabase.auth.signUp({
              email,
              password,
              options: {
                data: {
                  username: cleanUsername,
                },
              },
            })
          : await supabase.auth.signInWithPassword({ email, password });

      if (result.error) {
        setError(result.error.message);
        return;
      }

      if (mode === "sign-up" && result.data.user) {
        await supabase.from("profiles").upsert({
          id: result.data.user.id,
          username: cleanUsername,
          display_name: cleanUsername,
          bio: "",
        });
      }

      setSuccessMessage("Authenticated. Opening your studio...");
      router.refresh();
      await Promise.resolve();
      router.push("/agents");

      window.location.href = "/agents";
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Unable to authenticate right now.",
      );
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="glass-card mt-8 rounded-2xl p-6">
      <div className="grid grid-cols-2 rounded-full border border-white/10 bg-black/30 p-1">
        <button
          type="button"
          onClick={() => {
            setMode("sign-in");
            setError(null);
          }}
          className={`rounded-full border border-transparent px-4 py-2 text-sm transition ${
            mode === "sign-in"
              ? "border border-[var(--lyra-selected-border)] bg-[var(--lyra-selected-bg)] text-[var(--lyra-text-main)]"
              : "text-[var(--lyra-text-muted)] hover:text-[var(--lyra-text-main)]"
          }`}
        >
          Sign in
        </button>
        <button
          type="button"
          onClick={() => {
            setMode("sign-up");
            setError(null);
          }}
          className={`rounded-full border border-transparent px-4 py-2 text-sm transition ${
            mode === "sign-up"
              ? "border border-[var(--lyra-selected-border)] bg-[var(--lyra-selected-bg)] text-[var(--lyra-text-main)]"
              : "text-[var(--lyra-text-muted)] hover:text-[var(--lyra-text-main)]"
          }`}
        >
          Create account
        </button>
      </div>

      {mode === "sign-up" ? (
        <>
          <label className="mt-6 block text-sm text-slate-400" htmlFor="username">
            Username
          </label>
          <input
            id="username"
            type="text"
            required
            minLength={3}
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            placeholder="lyra_builder"
            className="lyra-input mt-2 h-12 w-full rounded-xl px-4 outline-none"
          />
        </>
      ) : null}

      <label className="mt-6 block text-sm text-slate-400" htmlFor="email">
        Email
      </label>
      <input
        id="email"
        type="email"
        required
        value={email}
        onChange={(event) => setEmail(event.target.value)}
        placeholder="founder@lyra.ai"
        className="lyra-input mt-2 h-12 w-full rounded-xl px-4 outline-none"
      />

      <label className="mt-4 block text-sm text-slate-400" htmlFor="password">
        Password
      </label>
      <input
        id="password"
        type="password"
        required
        minLength={6}
        value={password}
        onChange={(event) => setPassword(event.target.value)}
        placeholder="Minimum 6 characters"
        className="lyra-input mt-2 h-12 w-full rounded-xl px-4 outline-none"
      />

      {mode === "sign-up" ? (
        <>
          <label
            className="mt-4 block text-sm text-slate-400"
            htmlFor="confirm-password"
          >
            Confirm password
          </label>
          <input
            id="confirm-password"
            type="password"
            required
            minLength={6}
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            placeholder="Repeat password"
            className="lyra-input mt-2 h-12 w-full rounded-xl px-4 outline-none"
          />
        </>
      ) : null}

      {error && (
        <div className="mt-4 rounded-xl border border-red-300/20 bg-red-400/10 px-4 py-3 text-sm text-red-100">
          {error}
        </div>
      )}

      {successMessage && (
        <div className="mt-4 rounded-xl border border-[var(--lyra-chip-border)] bg-[var(--lyra-chip-bg)] px-4 py-3 text-sm text-[var(--lyra-chip-text)]">
          {successMessage}
        </div>
      )}

      <Button type="submit" disabled={isLoading} className="mt-5 w-full">
        {isLoading
          ? successMessage
            ? "Opening studio..."
            : "Working..."
          : mode === "sign-up"
            ? "Create account"
            : "Sign in"}
      </Button>
    </form>
  );
}

function sanitizeUsername(value: string) {
  return value.trim().toLowerCase().replace(/[^a-z0-9_]+/g, "_").replace(/^_+|_+$/g, "");
}
