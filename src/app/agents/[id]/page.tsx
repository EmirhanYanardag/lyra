import { AgentDetail } from "@/components/agents/agent-detail";
import { AppShell } from "@/components/layout/app-shell";

export default async function AgentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <AppShell>
      <AgentDetail agentId={id} />
    </AppShell>
  );
}
