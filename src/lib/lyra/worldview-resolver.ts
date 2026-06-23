import type { IdentityPosition } from "@/lib/lyra/identity-interpreter";
import type { IntentFrame } from "@/lib/lyra/intent-engine";
import type { Agent, AgentMemoryProfile, ChatMessage } from "@/types";

export type CurrentWorldview = {
  summary: string;
  originInfluence: number;
  parentInfluence: number;
  ownWorldviewInfluence: number;
  activeBeliefs: string[];
  recentInfluences: string[];
  divergenceNote: string;
};

export function resolveWorldview({
  agent,
  memory,
  identity,
  intent,
  previousMessages,
}: {
  agent: Agent;
  memory: AgentMemoryProfile;
  identity: IdentityPosition;
  intent: IntentFrame;
  previousMessages: ChatMessage[];
}): CurrentWorldview {
  const evolutionDepth = Math.min(
    1,
    (memory.evolutionLog.length + memory.recentInfluences.length + memory.learnedTopics.length) /
      24,
  );
  const baseParentInfluence = agent.type === "mixed" ? 0.5 : agent.type === "clone" ? 0.95 : 0;
  const parentInfluence = Math.round((baseParentInfluence * (1 - evolutionDepth * 0.75)) * 100);
  const ownWorldviewInfluence = agent.type === "original"
    ? 100
    : Math.max(5, 100 - parentInfluence);
  const originInfluence = agent.type === "original"
    ? Math.max(30, 70 - Math.round(evolutionDepth * 25))
    : parentInfluence;
  const recentConversationThemes = extractRecentThemes(previousMessages);
  const recentInfluences = [
    ...recentConversationThemes,
    ...memory.recentInfluences,
    ...memory.learnedTopics,
  ].filter(Boolean).slice(0, 8);

  return {
    summary: buildWorldviewSummary(agent, memory, identity, intent, ownWorldviewInfluence),
    originInfluence,
    parentInfluence,
    ownWorldviewInfluence,
    activeBeliefs: [
      identity.coreBelief,
      identity.decisionFramework,
      memory.worldview,
      ...recentInfluences.slice(0, 3).map((influence) => `Recent memory around ${influence} matters.`),
    ],
    recentInfluences,
    divergenceNote: buildDivergenceNote(agent, ownWorldviewInfluence),
  };
}

function buildWorldviewSummary(
  agent: Agent,
  memory: AgentMemoryProfile,
  identity: IdentityPosition,
  intent: IntentFrame,
  ownWorldviewInfluence: number,
) {
  if (agent.type === "mixed") {
    return `${agent.name} is now primarily its own identity (${ownWorldviewInfluence}% own worldview), using origin as background texture rather than a speaking crutch. For this ${intent.intent} question, it should answer from current conviction.`;
  }

  if (agent.type === "clone") {
    return `${agent.name} is a diverging branch. Its current worldview has drifted through memory and should speak from present stance, not parent attachment.`;
  }

  return `${agent.name} thinks from ${memory.originTopic}: ${identity.coreBelief}`;
}

function buildDivergenceNote(agent: Agent, ownWorldviewInfluence: number) {
  if (agent.type === "mixed") {
    return `Parent references should be rare. Own worldview currently dominates at ${ownWorldviewInfluence}%.`;
  }

  if (agent.type === "clone") {
    return `Clone divergence is active. Speak from current view, not original-agent dependency.`;
  }

  return "Original identity: origin remains meaningful, but memory can expand the worldview.";
}

function extractRecentThemes(previousMessages: ChatMessage[]) {
  const text = previousMessages
    .filter((message) => message.role === "user")
    .slice(-8)
    .map((message) => message.content)
    .join(" ")
    .toLowerCase();
  const themes = [
    "discipline",
    "startup",
    "ai",
    "risk",
    "creative execution",
    "decentralization",
    "product",
    "investing",
    "purpose",
  ];

  return themes.filter((theme) => text.includes(theme.split(" ")[0]));
}
