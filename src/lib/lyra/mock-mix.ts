import { getAgentMemoryProfile } from "@/lib/lyra/memory";
import type { Agent, HybridIdentity } from "@/types";

export function generateMockHybridIdentity(
  parentA: Agent,
  parentB: Agent,
): HybridIdentity {
  const memoryA = getAgentMemoryProfile(parentA);
  const memoryB = getAgentMemoryProfile(parentB);
  const keywords = unique([
    ...parentA.keywords,
    ...parentB.keywords,
    ...memoryA.interests,
    ...memoryB.interests,
  ]).slice(0, 8);
  const traits = unique([
    "synthesizing",
    "strategic",
    ...parentA.personalityTraits,
    ...parentB.personalityTraits,
    ...memoryA.behavioralTraits,
    ...memoryB.behavioralTraits,
  ]).slice(0, 6);
  const name = createHybridName(parentA, parentB);
  const worldview = `Creates bridges between ${parentA.topic} and ${parentB.topic}, treating culture, execution, and identity as one coherent system.`;

  return {
    name,
    summary: `${name} is a new LYRA identity inspired by ${parentA.name} and ${parentB.name}. It combines ${parentA.topic} with ${parentB.topic} to form an independent perspective for creative strategy, judgment, and synthesis.`,
    keywords,
    personality_traits: traits,
    worldview,
    memory_profile: {
      originTopic: `${parentA.topic} x ${parentB.topic}`,
      identitySummary: `${name} is an independent hybrid identity, not a clone of either parent.`,
      worldview,
      interests: unique([
        ...memoryA.interests,
        ...memoryB.interests,
        parentA.topic,
        parentB.topic,
      ]).slice(0, 12),
      learnedTopics: unique([
        ...memoryA.learnedTopics,
        ...memoryB.learnedTopics,
        ...keywords,
      ]).slice(0, 16),
      behavioralTraits: traits,
      communicationStyle: "synthesizing, confident, and practical",
      recentInfluences: [
        `Parent A: ${parentA.name}`,
        `Parent B: ${parentB.name}`,
      ],
      evolutionLog: [
        `Hybrid identity synthesized from ${parentA.name} and ${parentB.name}.`,
      ],
    },
  };
}

function createHybridName(parentA: Agent, parentB: Agent) {
  const pool = [
    "Visionary Creator",
    "Culture Architect",
    "Product Artist",
    "Signal Composer",
    "Identity Strategist",
    "Creative Operator",
  ];
  const index = (parentA.name.length + parentB.name.length) % pool.length;
  return pool[index];
}

function unique(values: string[]) {
  return Array.from(
    new Set(
      values
        .map((value) => value.trim())
        .filter(Boolean)
        .map((value) => value.toLowerCase()),
    ),
  );
}
