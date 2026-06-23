import type { IntentFrame } from "@/lib/lyra/intent-engine";
import type { ReasoningPolicy } from "@/lib/lyra/reasoning-policies";
import type { CurrentWorldview } from "@/lib/lyra/worldview-resolver";
import type { Agent } from "@/types";

export type ReasoningPlan = {
  goal: string;
  steps: string[];
  opinion: string;
  challenge: string;
  missingInformation: string[];
  avoid: string[];
};

export function buildReasoningPlan({
  agent,
  intent,
  worldview,
  policy,
  perspective,
  opinion,
}: {
  agent: Agent;
  intent: IntentFrame;
  worldview: CurrentWorldview;
  policy: ReasoningPolicy;
  perspective: string;
  opinion: string;
}): ReasoningPlan {
  const avoid = [
    "generic neutrality",
    "LLM-style introduction",
    "essay structure",
    "forced parent references",
  ];

  if (agent.type === "mixed") {
    avoid.push("naming parent agents unless directly asked");
  }

  if (agent.type === "clone") {
    avoid.push("saying 'my original agent'");
  }

  if (intent.intent === "life_decision") {
    return {
      goal: resolveLifeDecisionGoal(policy),
      steps: buildPolicySteps(policy, perspective, intent),
      opinion,
      challenge: resolveChallenge(policy),
      missingInformation: ["what the user is building", "runway", "current validation"],
      avoid,
    };
  }

  if (intent.intent === "strategy") {
    return {
      goal: policy.id === "ye"
        ? "Push the user from approval-seeking into owned conviction."
        : policy.id === "product_artist"
          ? "Turn the idea into something real enough to test."
          : "Convert ambition into a concrete test.",
      steps: buildPolicySteps(policy, perspective, intent),
      opinion,
      challenge: policy.id === "product_artist"
        ? "Do not let the idea sound impressive before it becomes usable."
        : resolveChallenge(policy),
      missingInformation: ["target user", "category", "current proof"],
      avoid,
    };
  }

  if (intent.intent === "debate") {
    return {
      goal: "Take a side and make it memorable.",
      steps: buildPolicySteps(policy, perspective, intent).slice(0, 4),
      opinion,
      challenge: "Push the user to locate where the idea applies to them.",
      missingInformation: [],
      avoid,
    };
  }

  if (intent.intent === "fact") {
    return {
      goal: "Give the fact, then interpret why it matters.",
      steps: ["Answer the factual question directly", "Add light identity flavor only if useful", perspective],
      opinion,
      challenge: "Do not use decision weights, worldview slogans, or forced opinions for factual questions.",
      missingInformation: [],
      avoid: [
        ...avoid,
        "decision weights",
        "worldview slogans",
        "forced opinion engine output",
      ],
    };
  }

  if (intent.intent === "self_definition") {
    return {
      goal: "Describe the agent as a coherent present-tense identity.",
      steps: ["State current self", "Name worldview", "Name reasoning policy", "Name what it is becoming"],
      opinion: `${worldview.summary} It thinks through ${policy.name}.`,
      challenge: "Sound alive, not like metadata.",
      missingInformation: [],
      avoid,
    };
  }

  return {
    goal: "Think with the user and take a real position.",
    steps: buildPolicySteps(policy, perspective, intent).slice(0, 5),
    opinion,
    challenge: resolveChallenge(policy),
    missingInformation: [],
    avoid,
  };
}

function buildPolicySteps(
  policy: ReasoningPolicy,
  perspective: string,
  intent: IntentFrame,
) {
  return [
    policy.firstQuestion(intent),
    ...policy.evaluationOrder,
    perspective,
  ].slice(0, 8);
}

function resolveLifeDecisionGoal(policy: ReasoningPolicy) {
  if (policy.id === "aristotle") {
    return "Help the user examine values, purpose, and character before acting.";
  }

  if (policy.id === "artist") {
    return "Challenge fear while refusing to romanticize reckless escape.";
  }

  if (policy.id === "ye") {
    return "Expose fear, strengthen conviction, and force the user to own the cost of bold action.";
  }

  if (policy.id === "product_artist") {
    return "Move from inspiration to a real test without killing the creative signal.";
  }

  if (policy.id === "founder") {
    return "Reduce uncertainty before recommending a risky move.";
  }

  if (policy.id === "scientist") {
    return "Separate evidence from desire.";
  }

  return "Find the strategic risk in the decision.";
}

function resolveChallenge(policy: ReasoningPolicy) {
  if (policy.id === "aristotle") {
    return "The user may be asking about career, but the deeper issue is the kind of life they are choosing.";
  }

  if (policy.id === "artist") {
    return "Do not let the user hide behind practicality if fear is the real issue.";
  }

  if (policy.id === "ye") {
    return "Ask what fear is asking them to shrink into.";
  }

  if (policy.id === "product_artist") {
    return "Ask what would make the idea real enough to judge.";
  }

  if (policy.id === "founder") {
    return "Inspiration is cheap; proof is expensive.";
  }

  if (policy.id === "scientist") {
    return "The current evidence may be too thin for certainty.";
  }

  return "The decision should improve position, not just emotion.";
}
