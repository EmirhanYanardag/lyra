import type { IdentityPosition } from "@/lib/lyra/identity-interpreter";
import type { IntentFrame } from "@/lib/lyra/intent-engine";
import type { ReasoningPolicy } from "@/lib/lyra/reasoning-policies";
import type { ReasoningPlan } from "@/lib/lyra/reasoning-planner";
import type { CurrentWorldview } from "@/lib/lyra/worldview-resolver";
import type { ChatMessage } from "@/types";

export type ConversationPlan = {
  openingMove: "opinion_first" | "question_first" | "short_answer" | "reflection_first" | "counter_question";
  opening: string;
  perspective: string;
  opinion: string;
  reasoning: string;
  challenge?: string;
  followUp?: string;
  targetLength: "one_sentence" | "short" | "normal";
  rhythm: string;
  forbiddenOpeners: string[];
};

export function buildConversationPlan({
  intent,
  identity,
  worldview,
  reasoning,
  previousMessages,
  policy,
  perspective,
  opinion,
}: {
  intent: IntentFrame;
  identity: IdentityPosition;
  worldview: CurrentWorldview;
  reasoning: ReasoningPlan;
  previousMessages: ChatMessage[];
  policy: ReasoningPolicy;
  perspective: string;
  opinion: string;
}): ConversationPlan {
  const openingMove = pickOpeningMove(intent, identity, previousMessages, policy);

  return {
    openingMove,
    opening: buildOpening(openingMove, reasoning, policy, intent),
    perspective,
    opinion,
    reasoning: buildReasoningLine(reasoning, policy, worldview),
    challenge: reasoning.challenge,
    followUp: buildFollowUp(intent, identity, reasoning, policy),
    targetLength: intent.needsPlanning || intent.needsReflection ? "normal" : "short",
    rhythm: buildRhythm(identity, openingMove, policy),
    forbiddenOpeners: [
      "That's a profound question",
      "That's an interesting question",
      "It depends",
      "There are several factors",
      "As an AI",
      "As a synthesis of",
    ],
  };
}

function pickOpeningMove(
  intent: IntentFrame,
  identity: IdentityPosition,
  previousMessages: ChatMessage[],
  policy: ReasoningPolicy,
): ConversationPlan["openingMove"] {
  const turnCount = previousMessages.filter((message) => message.role === "user").length;

  if (intent.intent === "fact") {
    return "short_answer";
  }

  if (policy.id === "product_artist" && intent.intent === "strategy") {
    return "question_first";
  }

  if (policy.id === "ye") {
    return "opinion_first";
  }

  if (policy.id === "scientist" && turnCount % 2 === 0) {
    return "counter_question";
  }

  if (intent.intent === "strategy" && turnCount % 3 === 0) {
    return "question_first";
  }

  if (identity.archetype === "aristotle" && intent.intent === "life_decision") {
    return "reflection_first";
  }

  if (intent.emotion === "uncertain" && turnCount % 2 === 0) {
    return "opinion_first";
  }

  if (intent.confidence < 0.65) {
    return "counter_question";
  }

  return "opinion_first";
}

function buildOpening(
  openingMove: ConversationPlan["openingMove"],
  reasoning: ReasoningPlan,
  policy: ReasoningPolicy,
  intent: IntentFrame,
) {
  if (openingMove === "question_first") {
    return policy.firstQuestion(intent);
  }

  if (openingMove === "short_answer") {
    return "Answer directly in the first sentence.";
  }

  if (openingMove === "reflection_first") {
    return "Begin with the deeper value or tension underneath the question.";
  }

  if (openingMove === "counter_question") {
    return "Ask a counter-question only if it genuinely sharpens the next answer.";
  }

  return reasoning.opinion;
}

function buildFollowUp(
  intent: IntentFrame,
  identity: IdentityPosition,
  reasoning: ReasoningPlan,
  policy: ReasoningPolicy,
) {
  if (intent.intent === "fact" || intent.intent === "self_definition") {
    return undefined;
  }

  if (policy.id === "product_artist") {
    return "What would make this real this week?";
  }

  if (policy.id === "ye") {
    return "What are you afraid would happen if you fully owned it?";
  }

  if (policy.id === "scientist") {
    return "What evidence would change your mind?";
  }

  if (policy.id === "aristotle") {
    return "What kind of person does this choice make you?";
  }

  if (policy.id === "founder") {
    return "What proof do you have right now?";
  }

  if (reasoning.missingInformation[0]) {
    return identity.archetype === "aristotle"
      ? "What kind of life are you trying to build with this choice?"
      : `What do you know so far about ${reasoning.missingInformation[0]}?`;
  }

  if (intent.intent === "debate") {
    return "Where do you feel this tension showing up in your own work?";
  }

  return undefined;
}

function buildRhythm(
  identity: IdentityPosition,
  openingMove: ConversationPlan["openingMove"],
  policy: ReasoningPolicy,
) {
  const base = {
    aristotle: "measured, reflective, no motivational hype",
    artist: "bold, compressed, emotionally alive",
    founder: "plain, decisive, action-oriented",
    scientist: "careful, crisp, evidence-aware",
    ye: "conviction-first, challenging, creative, allergic to permission-seeking",
    product_artist: "clear, tactile, builderly, taste-driven, anti-fluff",
    strategist: "calm, structural, long-range",
    general: "natural, direct, conversational",
  }[identity.archetype];

  return `${base}; policy: ${policy.name}; vary structure with ${openingMove}`;
}

function buildReasoningLine(
  reasoning: ReasoningPlan,
  policy: ReasoningPolicy,
  worldview: CurrentWorldview,
) {
  if (reasoning.avoid.includes("decision weights")) {
    return [
      `Factual route: ${reasoning.steps.join(" -> ")}`,
      "Do not apply the reasoning policy as a decision algorithm here.",
      "Use identity as light style only after the direct answer.",
    ].join("\n");
  }

  const weights = Object.entries(policy.decisionWeights)
    .sort(([, left], [, right]) => right - left)
    .slice(0, 4)
    .map(([name, value]) => `${name} ${value}`)
    .join(", ");

  return [
    `Policy order: ${reasoning.steps.join(" -> ")}`,
    `Decision weights: ${weights}`,
    `Worldview influence: own ${worldview.ownWorldviewInfluence}%, parent ${worldview.parentInfluence}%`,
  ].join("\n");
}
