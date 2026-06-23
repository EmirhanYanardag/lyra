import { AppShell } from "@/components/layout/app-shell";
import { NewAgentForm } from "@/components/agents/new-agent-form";

export default function NewAgentPage() {
  return (
    <AppShell>
      <section className="max-w-4xl">
        <p className="lyra-label text-sm">
          Create
        </p>
        <h1 className="mt-4 text-4xl font-semibold text-white">
          Shape a new AI identity
        </h1>
        <p className="mt-3 text-slate-300">
          Create a real Supabase-backed original agent. AI generation, cloning,
          and remixing will plug into this structure next.
        </p>

        <NewAgentForm />
      </section>
    </AppShell>
  );
}
