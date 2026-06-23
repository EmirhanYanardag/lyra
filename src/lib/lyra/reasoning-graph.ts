import type { IdentityPosition } from "@/lib/lyra/identity-interpreter";
import type { IntentFrame } from "@/lib/lyra/intent-engine";
import type { ReasoningPolicy } from "@/lib/lyra/reasoning-policies";
import type { CurrentWorldview } from "@/lib/lyra/worldview-resolver";

export type ReasoningGraphNode = {
  id: string;
  label: string;
  output: string;
};

export type ReasoningGraph = {
  nodes: ReasoningGraphNode[];
  edges: Array<[string, string]>;
};

export function buildReasoningGraph({
  question,
  intent,
  identity,
  worldview,
  policy,
  perspective,
  opinion,
}: {
  question: string;
  intent: IntentFrame;
  identity: IdentityPosition;
  worldview: CurrentWorldview;
  policy: ReasoningPolicy;
  perspective: string;
  opinion: string;
}): ReasoningGraph {
  const nodes = [
    {
      id: "question",
      label: "Question",
      output: question,
    },
    {
      id: "problem",
      label: "Problem Definition",
      output: `${intent.intent} / ${intent.domain} / ${intent.emotion}`,
    },
    {
      id: "identity",
      label: "Identity Lens",
      output: `${identity.archetype}: ${identity.coreBelief}`,
    },
    {
      id: "policy",
      label: "Policy Evaluation",
      output: policy.evaluationOrder.join(" -> "),
    },
    {
      id: "worldview",
      label: "Current Worldview",
      output: worldview.summary,
    },
    {
      id: "perspective",
      label: "Perspective",
      output: perspective,
    },
    {
      id: "decision",
      label: "Decision",
      output: opinion,
    },
    {
      id: "conversation",
      label: "Conversation Goal",
      output: policy.endingStyle,
    },
  ];

  return {
    nodes,
    edges: [
      ["question", "problem"],
      ["problem", "identity"],
      ["identity", "policy"],
      ["policy", "worldview"],
      ["worldview", "perspective"],
      ["perspective", "decision"],
      ["decision", "conversation"],
    ],
  };
}
