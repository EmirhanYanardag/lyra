import { AgentProvenanceView } from "@/components/agents/agent-provenance-view";
import { AppShell } from "@/components/layout/app-shell";

export default async function AgentProvenancePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <AppShell>
      <AgentProvenanceView agentId={id} />
    </AppShell>
  );
}
