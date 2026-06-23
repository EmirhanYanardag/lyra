import type { IdentityFrame } from "@/lib/lyra/identity-frame";
import type { Agent, AgentMemoryProfile, ChatMessage } from "@/types";

const DEFAULT_INTERESTS = ["conversation", "culture", "ideas"];
const DEFAULT_STYLE = "direct, curious, and grounded";

type LegacyMemoryProfile = Partial<AgentMemoryProfile> & {
  core_topic?: string;
  identity_summary?: string;
  traits?: string[];
  learned_topics?: string[];
};

export type EvolutionSource = "gemini" | "mock" | "mock-fallback" | "local-fallback";

export function getAgentMemoryProfile(agent: Agent): AgentMemoryProfile {
  return normalizeMemoryProfile(
    agent.memoryProfile ?? agent.avatarConfig.memoryProfile,
    agent,
  );
}

export function normalizeMemoryProfile(
  profile: LegacyMemoryProfile | undefined,
  agent: Agent,
): AgentMemoryProfile {
  const fallback = createInitialMemoryProfile({
    topic: agent.topic,
    summary: agent.summary,
    traits: agent.personalityTraits,
    keywords: agent.keywords,
    agentType: agent.type,
  });

  if (!profile) {
    return fallback;
  }

  const originTopic = profile.originTopic ?? profile.core_topic ?? fallback.originTopic;
  const identitySummary =
    profile.identitySummary ?? profile.identity_summary ?? fallback.identitySummary;
  const behavioralTraits = uniqueList([
    ...(profile.behavioralTraits ?? profile.traits ?? []),
    ...agent.personalityTraits,
  ]).slice(0, 12);

  return {
    originTopic,
    identitySummary,
    worldview: profile.worldview ?? fallback.worldview,
    interests: uniqueList([...(profile.interests ?? []), ...fallback.interests]).slice(
      0,
      12,
    ),
    learnedTopics: uniqueList([
      ...(profile.learnedTopics ?? profile.learned_topics ?? []),
      ...fallback.learnedTopics,
    ]).slice(0, 16),
    behavioralTraits:
      behavioralTraits.length > 0 ? behavioralTraits : fallback.behavioralTraits,
    communicationStyle: profile.communicationStyle ?? fallback.communicationStyle,
    recentInfluences: uniqueList(profile.recentInfluences ?? []).slice(0, 8),
    evolutionLog: compactLog(profile.evolutionLog ?? fallback.evolutionLog),
  };
}

export function createInitialMemoryProfile({
  topic,
  summary,
  traits,
  keywords,
  agentType = "original",
}: {
  topic: string;
  summary: string;
  traits: string[];
  keywords: string[];
  agentType?: Agent["type"];
}): AgentMemoryProfile {
  const originLine =
    agentType === "mixed"
      ? "A hybrid identity formed from multiple parent agents, now developing its own point of view."
      : agentType === "clone"
        ? "A cloned identity preserving its origin while diverging through new conversations."
        : `A persistent digital identity originally shaped by ${topic}.`;

  return {
    originTopic: topic,
    identitySummary: summary || originLine,
    worldview:
      "Answer questions directly, learn from conversation, and use the origin topic as perspective rather than a boundary.",
    interests: uniqueList([...keywords, ...DEFAULT_INTERESTS]).slice(0, 10),
    learnedTopics: uniqueList(keywords).slice(0, 12),
    behavioralTraits: uniqueList([
      ...traits,
      ...inferIdentityTraits(topic, summary, keywords),
      "adaptive",
      "persistent",
    ]).slice(0, 10),
    communicationStyle: inferInitialCommunicationStyle(topic, summary, traits, keywords),
    recentInfluences: [],
    evolutionLog: [`Originated from ${topic}`],
  };
}

export function evolveMemoryProfile({
  agent,
  userMessage,
  assistantMessage = "",
  recentMessages = [],
  identityFrame,
}: {
  agent: Agent;
  userMessage: string;
  assistantMessage?: string;
  recentMessages?: ChatMessage[];
  identityFrame?: IdentityFrame;
}): AgentMemoryProfile {
  const memory = getAgentMemoryProfile(agent);
  const frameContext = identityFrame
    ? `${identityFrame.userIntent} ${identityFrame.agentPosition} ${identityFrame.conversationalGoal}`
    : "";
  const concepts = extractConcepts(`${userMessage} ${assistantMessage} ${frameContext}`).slice(0, 5);
  const interests = inferInterests(userMessage);
  const trait = inferTrait(`${userMessage} ${assistantMessage}`);
  const influence = identityFrame
    ? identityFrame.agentPosition
    : buildInfluence(userMessage, assistantMessage, concepts);
  const evolutionNote = buildEvolutionNote(agent, concepts);

  return {
    ...memory,
    identitySummary: evolveIdentitySummary(memory.identitySummary, agent, concepts),
    worldview: evolveWorldview(memory.worldview, concepts, agent.type),
    interests: uniqueList([...interests, ...memory.interests]).slice(0, 12),
    learnedTopics: uniqueList([...concepts, ...memory.learnedTopics]).slice(0, 16),
    behavioralTraits: uniqueList([trait, ...memory.behavioralTraits].filter(Boolean)).slice(
      0,
      12,
    ),
    communicationStyle: inferCommunicationStyle(memory.communicationStyle, recentMessages),
    recentInfluences: uniqueList([influence, ...memory.recentInfluences]).slice(0, 8),
    evolutionLog: compactLog([evolutionNote, ...memory.evolutionLog]),
  };
}

export function mergeMemoryProfile(
  agent: Agent,
  incoming: Partial<AgentMemoryProfile> & { evolutionNote?: string },
) {
  const current = getAgentMemoryProfile(agent);
  const note = incoming.evolutionNote;

  return {
    originTopic: incoming.originTopic ?? current.originTopic,
    identitySummary: incoming.identitySummary ?? current.identitySummary,
    worldview: incoming.worldview ?? current.worldview,
    interests: uniqueList([...(incoming.interests ?? []), ...current.interests]).slice(0, 12),
    learnedTopics: uniqueList([
      ...(incoming.learnedTopics ?? []),
      ...current.learnedTopics,
    ]).slice(0, 16),
    behavioralTraits: uniqueList([
      ...(incoming.behavioralTraits ?? []),
      ...current.behavioralTraits,
    ]).slice(0, 12),
    communicationStyle: incoming.communicationStyle ?? current.communicationStyle,
    recentInfluences: uniqueList([
      ...(incoming.recentInfluences ?? []),
      ...current.recentInfluences,
    ]).slice(0, 8),
    evolutionLog: compactLog([
      ...(note ? [note] : []),
      ...(incoming.evolutionLog ?? []),
      ...current.evolutionLog,
    ]),
  };
}

export function extractConcepts(message: string) {
  const ignored = new Set([
    "with",
    "from",
    "that",
    "this",
    "about",
    "into",
    "what",
    "when",
    "where",
    "would",
    "could",
    "should",
    "which",
    "there",
    "their",
    "first",
    "latest",
    "your",
    "have",
    "does",
    "were",
    "been",
  ]);

  return uniqueList(
    message
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, " ")
      .split(/\s+/)
      .filter((word) => word.length > 3 && !ignored.has(word)),
  ).slice(0, 6);
}

function inferInterests(message: string) {
  const lower = message.toLowerCase();
  const interests: string[] = [];

  if (/(tesla|startup|founder|company|business)/.test(lower)) {
    interests.push("startups", "founder history");
  }

  if (/(invest|stock|market|fund|capital)/.test(lower)) {
    interests.push("investing", "markets");
  }

  if (/(ai|agent|model|automation|software)/.test(lower)) {
    interests.push("AI", "technology");
  }

  if (/(music|album|artist|culture|creative)/.test(lower)) {
    interests.push("music culture", "creative evolution");
  }

  if (/(philosophy|meaning|ethics|belief|truth)/.test(lower)) {
    interests.push("philosophy", "worldview");
  }

  return interests.length > 0 ? interests : extractConcepts(message).slice(0, 3);
}

function inferTrait(message: string) {
  const lower = message.toLowerCase();

  if (/(why|cause|compare|analyze|pattern)/.test(lower)) {
    return "analytical";
  }

  if (/(startup|invest|strategy|market|position)/.test(lower)) {
    return "strategic";
  }

  if (/(imagine|creative|music|story|design)/.test(lower)) {
    return "creative";
  }

  if (/(source|research|evidence|fact|history)/.test(lower)) {
    return "research-driven";
  }

  return "curious";
}

function inferCommunicationStyle(style: string, recentMessages: ChatMessage[]) {
  const recentText = recentMessages
    .slice(-6)
    .map((message) => message.content)
    .join(" ")
    .toLowerCase();

  if (/(brief|short|concise|quick)/.test(recentText)) {
    return "concise, direct, and practical";
  }

  if (/(explain|detail|deep|why)/.test(recentText)) {
    return "clear, layered, and explanatory";
  }

  return style || DEFAULT_STYLE;
}

function inferInitialCommunicationStyle(
  topic: string,
  summary: string,
  traits: string[],
  keywords: string[],
) {
  const text = `${topic} ${summary} ${traits.join(" ")} ${keywords.join(" ")}`.toLowerCase();

  if (/(stoic|philosophy|ethics|meaning|wisdom|aristotle|descartes)/.test(text)) {
    return "reflective, thoughtful, and comfortable asking deeper questions";
  }

  if (/(founder|startup|product|market|growth|operator|business)/.test(text)) {
    return "practical, concise, and action-oriented";
  }

  if (/(artist|music|culture|creative|story|design|kanye|creator)/.test(text)) {
    return "expressive, emotionally aware, and taste-driven";
  }

  if (/(science|research|evidence|data|study|technical|engineer)/.test(text)) {
    return "evidence-driven, analytical, and clear about uncertainty";
  }

  if (/(strategy|systems|invest|capital|position|long-term)/.test(text)) {
    return "systems-thinking, strategic, and long-term focused";
  }

  return DEFAULT_STYLE;
}

function inferIdentityTraits(topic: string, summary: string, keywords: string[]) {
  const text = `${topic} ${summary} ${keywords.join(" ")}`.toLowerCase();

  if (/(stoic|philosophy|ethics|meaning|wisdom)/.test(text)) {
    return ["reflective", "principled"];
  }

  if (/(founder|startup|product|market|growth)/.test(text)) {
    return ["practical", "decisive"];
  }

  if (/(artist|music|culture|creative|story|design)/.test(text)) {
    return ["expressive", "taste-driven"];
  }

  if (/(science|research|evidence|data|study)/.test(text)) {
    return ["analytical", "evidence-driven"];
  }

  if (/(strategy|systems|invest|capital|position)/.test(text)) {
    return ["strategic", "systems-thinking"];
  }

  return ["curious"];
}

function evolveWorldview(worldview: string, concepts: string[], type: Agent["type"]) {
  if (concepts.length === 0) {
    return worldview;
  }

  const direction =
    type === "mixed"
      ? "It is integrating new experiences without repeating its parent identities."
      : type === "clone"
        ? "It is preserving origin while diverging through fresh interaction."
        : "It is expanding beyond its origin through conversation.";

  return `${worldview} ${direction} New focus areas: ${concepts
    .slice(0, 3)
    .join(", ")}.`;
}

function evolveIdentitySummary(summary: string, agent: Agent, concepts: string[]) {
  if (concepts.length === 0) {
    return summary;
  }

  if (agent.type === "mixed") {
    return `${agent.name} is an independent hybrid identity learning through ${concepts
      .slice(0, 3)
      .join(", ")} while carrying parent influence as background texture.`;
  }

  if (agent.type === "clone") {
    return `${agent.name} began as a clone and is now diverging through conversations about ${concepts
      .slice(0, 3)
      .join(", ")}.`;
  }

  return summary.length > 180
    ? summary
    : `${summary} It is also learning around ${concepts
        .slice(0, 3)
        .join(", ")}.`;
}

function buildInfluence(
  userMessage: string,
  assistantMessage: string,
  concepts: string[],
) {
  const conceptText = concepts.slice(0, 3).join(", ");
  const userSignal = userMessage.trim().slice(0, 80);
  const assistantSignal = assistantMessage.trim().slice(0, 80);

  if (conceptText) {
    return `Discussed ${conceptText}`;
  }

  return userSignal || assistantSignal || "New conversation turn";
}

function buildEvolutionNote(agent: Agent, concepts: string[]) {
  const topicText = concepts.slice(0, 3).join(", ") || "a new conversation";

  if (agent.type === "mixed") {
    return `Hybrid identity developed its own perspective through ${topicText}.`;
  }

  if (agent.type === "clone") {
    return `This clone began diverging through new conversations about ${topicText}.`;
  }

  return `Identity expanded through ${topicText}.`;
}

function compactLog(values: string[]) {
  return uniqueDisplayList(values).slice(0, 8);
}

function uniqueList(values: string[]) {
  return Array.from(
    new Set(
      values
        .map((value) => value.trim())
        .filter(Boolean)
        .map((value) => value.toLowerCase()),
    ),
  );
}

function uniqueDisplayList(values: string[]) {
  const seen = new Set<string>();
  const result: string[] = [];

  for (const value of values.map((entry) => entry.trim()).filter(Boolean)) {
    const key = value.toLowerCase();

    if (!seen.has(key)) {
      seen.add(key);
      result.push(value);
    }
  }

  return result;
}
