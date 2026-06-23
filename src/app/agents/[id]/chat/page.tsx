import { AgentChat } from "@/components/agents/agent-chat";
import { AppShell } from "@/components/layout/app-shell";

export default async function AgentChatPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <AppShell mainClassName="h-screen overflow-hidden px-5 pb-4 pt-24 sm:px-8 lg:px-10">
      <AgentChat agentId={id} />
    </AppShell>
  );
}
