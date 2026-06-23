import { AppShell } from "@/components/layout/app-shell";
import { AuthForm } from "@/components/auth/auth-form";

type AuthPageProps = {
  searchParams: Promise<{
    mode?: string;
  }>;
};

export default async function AuthPage({ searchParams }: AuthPageProps) {
  const { mode } = await searchParams;
  const initialMode = mode === "signup" ? "sign-up" : "sign-in";

  return (
    <AppShell>
      <section className="mx-auto max-w-3xl">
        <p className="lyra-label text-sm">
          Access
        </p>
        <h1 className="mt-4 text-4xl font-semibold text-white">
          Enter your agent studio
        </h1>
        <p className="mt-4 text-lg leading-8 text-slate-300">
          Sign in or create an account to build a real Supabase-backed agent
          library.
        </p>
        <AuthForm initialMode={initialMode} />
      </section>
    </AppShell>
  );
}
