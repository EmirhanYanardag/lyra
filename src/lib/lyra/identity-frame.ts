import {
  buildConversationPlan,
  type ConversationPlan,
} from "@/lib/lyra/conversation-planner";
import {
  interpretIdentity,
  type IdentityPosition,
} from "@/lib/lyra/identity-interpreter";
import {
  applyCritiqueToReasoningPlan,
  critiqueIdentityPlan,
  type IdentityCritique,
} from "@/lib/lyra/identity-critic";
import { buildIntentFrame, type IntentFrame } from "@/lib/lyra/intent-engine";
import { getAgentMemoryProfile } from "@/lib/lyra/memory";
import { generateOpinion } from "@/lib/lyra/opinion-generator";
import { generatePerspective } from "@/lib/lyra/perspective-generator";
import {
  resolveReasoningPolicy,
  type ReasoningPolicy,
} from "@/lib/lyra/reasoning-policies";
import {
  buildReasoningGraph,
  type ReasoningGraph,
} from "@/lib/lyra/reasoning-graph";
import {
  buildReasoningPlan,
  type ReasoningPlan,
} from "@/lib/lyra/reasoning-planner";
import {
  resolveWorldview,
  type CurrentWorldview,
} from "@/lib/lyra/worldview-resolver";
import type { Agent, ChatMessage } from "@/types";

export type IdentityFrame = {
  userIntent: string;
  emotionalContext: string;
  agentInterpretation: string;
  agentPosition: string;
  conversationalGoal: string;
  responseStyle: string;
  forbiddenPatterns: string[];
  followUpStrategy: string;
  intentFrame: IntentFrame;
  identityPosition: IdentityPosition;
  currentWorldview: CurrentWorldview;
  reasoningPolicy: ReasoningPolicy;
  perspective: string;
  opinion: string;
  reasoningGraph: ReasoningGraph;
  identityCritique: IdentityCritique;
  reasoningPlan: ReasoningPlan;
  conversationPlan: ConversationPlan;
};

export function buildIdentityFrame({
  agent,
  userMessage,
  previousMessages,
}: {
  agent: Agent;
  userMessage: string;
  previousMessages: ChatMessage[];
}): IdentityFrame {
  const memory = getAgentMemoryProfile(agent);
  const intentFrame = buildIntentFrame(userMessage);
  const identityPosition = interpretIdentity({
    agent,
    memory,
    intent: intentFrame,
  });
  const currentWorldview = resolveWorldview({
    agent,
    memory,
    identity: identityPosition,
    intent: intentFrame,
    previousMessages,
  });
  const reasoningPolicy = resolveReasoningPolicy({
    agent,
    memory,
    identity: identityPosition,
  });
  const perspective = generatePerspective({
    intent: intentFrame,
    identity: identityPosition,
    policy: reasoningPolicy,
    worldview: currentWorldview,
  });
  const opinion = generateOpinion({
    intent: intentFrame,
    identity: identityPosition,
    policy: reasoningPolicy,
  });
  const initialReasoningPlan = buildReasoningPlan({
    agent,
    intent: intentFrame,
    worldview: currentWorldview,
    policy: reasoningPolicy,
    perspective,
    opinion,
  });
  const initialConversationPlan = buildConversationPlan({
    intent: intentFrame,
    identity: identityPosition,
    worldview: currentWorldview,
    reasoning: initialReasoningPlan,
    previousMessages,
    policy: reasoningPolicy,
    perspective,
    opinion,
  });
  const identityCritique = critiqueIdentityPlan({
    identity: identityPosition,
    policy: reasoningPolicy,
    reasoning: initialReasoningPlan,
    conversation: initialConversationPlan,
  });
  const reasoningPlan = applyCritiqueToReasoningPlan(
    initialReasoningPlan,
    identityCritique,
  );
  const conversationPlan = buildConversationPlan({
    intent: intentFrame,
    identity: identityPosition,
    worldview: currentWorldview,
    reasoning: reasoningPlan,
    previousMessages,
    policy: reasoningPolicy,
    perspective,
    opinion,
  });
  const reasoningGraph = buildReasoningGraph({
    question: userMessage,
    intent: intentFrame,
    identity: identityPosition,
    worldview: currentWorldview,
    policy: reasoningPolicy,
    perspective,
    opinion,
  });

  return {
    userIntent: describeIntent(intentFrame),
    emotionalContext: describeEmotion(intentFrame),
    agentInterpretation: currentWorldview.summary,
    agentPosition: opinion,
    conversationalGoal: reasoningPlan.goal,
    responseStyle: conversationPlan.rhythm,
    forbiddenPatterns: [
      ...reasoningPlan.avoid.map((item) => `Avoid ${item}.`),
      ...conversationPlan.forbiddenOpeners.map((item) => `Do not open with "${item}".`),
      ...(agent.type === "mixed"
        ? [
            "Do not say 'as a synthesis of'.",
            "Do not name parent agents unless the user directly asks about origin, lineage, or comparison.",
          ]
        : []),
      ...(agent.type === "clone"
        ? [
            "Do not say 'my original agent'. Say 'I've drifted toward' or 'my current view is' if divergence matters.",
          ]
        : []),
      "Never say 'as an AI', 'based on my training', or 'according to my programming'.",
    ],
    followUpStrategy:
      conversationPlan.followUp ??
      "Ask at most one follow-up only if it makes the next turn sharper.",
    intentFrame,
    identityPosition,
    currentWorldview,
    reasoningPolicy,
    perspective,
    opinion,
    reasoningGraph,
    identityCritique,
    reasoningPlan,
    conversationPlan,
  };
}

function describeIntent(intent: IntentFrame) {
  return `${intent.intent} in ${intent.domain}; facts=${intent.needsFacts}, opinion=${intent.needsOpinion}, planning=${intent.needsPlanning}, reflection=${intent.needsReflection}`;
}

function describeEmotion(intent: IntentFrame) {
  return `emotion=${intent.emotion}; urgency=${intent.urgency}; decision=${intent.decisionType}`;
}
