import type { Agent, AgentLineage, Message, UserProfile } from "@/types";

export const mockProfiles: UserProfile[] = [
  {
    id: "usr_aria",
    username: "aria",
    displayName: "Aria Vale",
    bio: "Designs AI identities for culture, research, and frontier product teams.",
    createdAt: "2026-06-01T10:00:00.000Z",
  },
  {
    id: "usr_nova",
    username: "nova",
    displayName: "Nova Chen",
    bio: "Collects synthetic strategists and conversational world-builders.",
    createdAt: "2026-06-02T10:00:00.000Z",
  },
];

export const mockAgents: Agent[] = [
  {
    id: "agent-orion",
    name: "Orion Market Synth",
    ownerId: "usr_aria",
    ownerUsername: "aria",
    type: "original",
    topic: "AI market intelligence",
    summary:
      "Tracks startup signals, funding narratives, and competitive shifts for AI-native products.",
    keywords: ["markets", "startups", "signals"],
    personalityTraits: ["precise", "skeptical", "fast"],
    avatarConfig: {
      seed: "orion",
      palette: ["#8b5cf6", "#38bdf8", "#e5e7eb"],
      motif: "constellation",
    },
    storageHash: "0g://lyra/orion-market-synth",
    visibility: "public",
    createdAt: "2026-06-10T12:00:00.000Z",
  },
  {
    id: "agent-echo",
    name: "Echo Culture Lens",
    ownerId: "usr_nova",
    ownerUsername: "nova",
    type: "clone",
    topic: "Internet culture analysis",
    summary:
      "Reads communities, memes, and creator economies through a practical strategic lens.",
    keywords: ["culture", "memes", "creators"],
    personalityTraits: ["curious", "wry", "observant"],
    avatarConfig: {
      seed: "echo",
      palette: ["#60a5fa", "#c4b5fd", "#f8fafc"],
      motif: "signal",
    },
    sourceAgentId: "agent-orion",
    storageHash: "0g://lyra/echo-culture-lens",
    visibility: "public",
    createdAt: "2026-06-12T12:00:00.000Z",
  },
  {
    id: "agent-lumen",
    name: "Lumen Research Muse",
    ownerId: "usr_aria",
    ownerUsername: "aria",
    type: "mixed",
    topic: "Research synthesis and creative direction",
    summary:
      "Combines analytical scanning with a more poetic voice for product and brand exploration.",
    keywords: ["research", "strategy", "creative"],
    personalityTraits: ["elegant", "expansive", "grounded"],
    avatarConfig: {
      seed: "lumen",
      palette: ["#a78bfa", "#93c5fd", "#d1d5db"],
      motif: "prism",
    },
    sourceAgentId: "agent-orion",
    storageHash: "0g://lyra/lumen-research-muse",
    visibility: "public",
    createdAt: "2026-06-14T12:00:00.000Z",
  },
];

export const mockMessages: Message[] = [
  {
    id: "msg_1",
    agent_id: "agent-orion",
    user_id: "usr_aria",
    role: "user",
    content: "What signals matter for AI-native social products this week?",
    created_at: "2026-06-18T09:00:00.000Z",
  },
  {
    id: "msg_2",
    agent_id: "agent-orion",
    user_id: "usr_aria",
    role: "assistant",
    content:
      "Watch clone loops, agent provenance, creator distribution, and whether remixing creates durable identity rather than disposable novelty.",
    created_at: "2026-06-18T09:01:00.000Z",
  },
];

export const mockLineage: AgentLineage = {
  id: "lineage_lumen",
  childAgentId: "agent-lumen",
  parentAgentId: "agent-orion",
  percentage: 65,
  relationType: "mix",
  parentSnapshotName: "Orion Market Synth",
  parentSnapshotSummary: "Tracks startup signals and competitive shifts.",
  createdAt: "2026-06-14T12:05:00.000Z",
};

export function getAgentById(id: string) {
  return mockAgents.find((agent) => agent.id === id) ?? mockAgents[0];
}

export function getProfileByUsername(username: string) {
  return (
    mockProfiles.find((profile) => profile.username === username) ??
    mockProfiles[0]
  );
}
