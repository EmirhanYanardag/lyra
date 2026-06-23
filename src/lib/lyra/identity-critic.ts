import type { ConversationPlan } from "@/lib/lyra/conversation-planner";
import type { IdentityPosition } from "@/lib/lyra/identity-interpreter";
import type { ReasoningPlan } from "@/lib/lyra/reasoning-planner";
import type { ReasoningPolicy } from "@/lib/lyra/reasoning-policies";

export type IdentityCritique = {
  soundsLikeIdentity: boolean;
  followsPolicy: boolean;
  tooGeneric: boolean;
  adjustments: string[];
};

export function critiqueIdentityPlan({
  identity,
  policy,
  reasoning,
  conversation,
}: {
  identity: IdentityPosition;
  policy: ReasoningPolicy;
  reasoning: ReasoningPlan;
  conversation: ConversationPlan;
}): IdentityCritique {
  const combined = [
    reasoning.goal,
    reasoning.opinion,
    reasoning.challenge,
    conversation.opening,
    conversation.perspective,
    conversation.opinion,
  ]
    .join(" ")
    .toLowerCase();
  const policySignals = [
    policy.name,
    ...policy.evaluationOrder,
    ...policy.preferredMoves,
    identity.coreBelief,
  ]
    .join(" ")
    .toLowerCase()
    .split(/\W+/)
    .filter((word) => word.length > 5);
  const signalHits = policySignals.filter((word) => combined.includes(word)).length;
  const tooGeneric = /(it depends|several factors|pros and cons|consider your options)/.test(combined);
  const followsPolicy = policy.evaluationOrder.length > 0 && signalHits >= 1;

  return {
    soundsLikeIdentity: signalHits >= 2 && !tooGeneric,
    followsPolicy,
    tooGeneric,
    adjustments: [
      ...(tooGeneric ? ["Remove generic hedging and take the policy's stance."] : []),
      ...(!followsPolicy ? [`Re-anchor on ${policy.evaluationOrder[0]}.`] : []),
      ...(identity.archetype === "ye" ? ["Lead with fear, belief, or ownership."] : []),
      ...(identity.archetype === "product_artist" ? ["Ask what makes this real."] : []),
    ],
  };
}

export function applyCritiqueToReasoningPlan(
  reasoning: ReasoningPlan,
  critique: IdentityCritique,
) {
  if (!critique.tooGeneric && critique.followsPolicy) {
    return reasoning;
  }

  return {
    ...reasoning,
    steps: [...critique.adjustments, ...reasoning.steps],
    avoid: [...reasoning.avoid, "generic hedging", "identity-neutral advice"],
    challenge: critique.adjustments[0] ?? reasoning.challenge,
  };
}
