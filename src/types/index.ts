export type AgentType = "original" | "clone" | "mixed";

export type Visibility = "public" | "private";

export type AvatarConfig = {
  seed?: string;
  palette: string[];
  motif?: string;
  head?: string;
  eyes?: string;
  body?: string;
  accessory?: string;
  background?: string;
  memoryProfile?: AgentMemoryProfile;
  cloneOf?: string;
  cloneDepth?: number;
  clonedAt?: string;
  originalCreator?: string;
  source?: "mix" | "clone";
  parentA?: string;
  parentB?: string;
  generatedWorldview?: string;
  mixedAt?: string;
  ogProvenance?: OgProvenance;
};

export type OgProvenance = {
  mode: "real" | "mock";
  rootHash: string;
  txHash?: string;
  publishedAt: string;
  sizeBytes: number;
  error?: string;
  versions?: OgProvenanceVersion[];
};

export type OgProvenanceVersion = {
  version: number;
  rootHash: string;
  txHash?: string;
  mode: "real" | "mock";
  sizeBytes: number;
  publishedAt: string;
  capsuleType: "agent_dna";
  summary: string;
};

export type AgentMemoryProfile = {
  originTopic: string;
  identitySummary: string;
  worldview: string;
  interests: string[];
  learnedTopics: string[];
  behavioralTraits: string[];
  communicationStyle: string;
  recentInfluences: string[];
  evolutionLog: string[];
};

export type UserProfile = {
  id: string;
  username: string;
  displayName: string;
  bio: string;
  avatarUrl?: string;
  createdAt: string;
  updatedAt?: string;
};

export type Agent = {
  id: string;
  name: string;
  ownerId: string;
  ownerUsername: string;
  type: AgentType;
  topic: string;
  topicSummary?: string;
  summary: string;
  keywords: string[];
  personalityTraits: string[];
  avatarConfig: AvatarConfig;
  memoryProfile?: AgentMemoryProfile;
  systemPrompt?: string;
  sourceAgentId?: string;
  storageHash?: string;
  visibility: Visibility;
  cloneCount?: number;
  hybridCount?: number;
  createdAt: string;
  updatedAt?: string;
};

export type Message = {
  id: string;
  agent_id: string;
  user_id: string;
  role: "user" | "assistant" | "system";
  content: string;
  created_at: string;
};

export type ChatMessage = {
  id: string;
  agentId: string;
  userId: string;
  role: "user" | "assistant" | "system";
  content: string;
  createdAt: string;
};

export type AgentLineage = {
  id: string;
  childAgentId: string;
  parentAgentId?: string;
  percentage: number;
  relationType: "clone" | "mix" | "original";
  parentSnapshotName?: string;
  parentSnapshotSummary?: string;
  createdAt: string;
};

export type CreateAgentInput = {
  name: string;
  topic: string;
  visibility?: Visibility;
};

export type HybridIdentity = {
  name: string;
  summary: string;
  keywords: string[];
  personality_traits: string[];
  worldview: string;
  memory_profile: AgentMemoryProfile;
};
