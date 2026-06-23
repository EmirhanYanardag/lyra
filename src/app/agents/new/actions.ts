"use server";

import { redirect } from "next/navigation";
import { createAgent } from "@/lib/lyra/agents";

export type CreateAgentFormState = {
  error: string | null;
};

export async function createAgentFormAction(
  _previousState: CreateAgentFormState,
  formData: FormData,
): Promise<CreateAgentFormState> {
  const name = String(formData.get("name") ?? "");
  const topic = String(formData.get("topic") ?? "");

  const { agent, error } = await createAgent({
    name,
    topic,
    visibility: "public",
  });

  if (error || !agent) {
    return { error: error ?? "Unable to create agent." };
  }

  redirect(`/agents/${agent.id}`);
}
