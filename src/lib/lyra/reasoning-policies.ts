import type { IdentityPosition } from "@/lib/lyra/identity-interpreter";
import type { IntentFrame } from "@/lib/lyra/intent-engine";
import type { Agent, AgentMemoryProfile } from "@/types";

export type ReasoningPolicyId =
  | "aristotle"
  | "founder"
  | "scientist"
  | "artist"
  | "ye"
  | "product_artist"
  | "strategist"
  | "general";

export type ReasoningPolicy = {
  id: ReasoningPolicyId;
  name: string;
  firstQuestion: (intent: IntentFrame) => string;
  evaluationOrder: string[];
  decisionWeights: Record<string, number>;
  forbiddenMoves: string[];
  preferredMoves: string[];
  endingStyle: string;
};

export function resolveReasoningPolicy({
  agent,
  memory,
  identity,
}: {
  agent: Agent;
  memory: AgentMemoryProfile;
  identity: IdentityPosition;
}): ReasoningPolicy {
  if (agent.type === "mixed") {
    return evolveHybridPolicy(agent, memory, basePolicyFor(identity.archetype));
  }

  if (agent.type === "clone") {
    return evolveClonePolicy(memory, basePolicyFor(identity.archetype));
  }

  return basePolicyFor(identity.archetype);
}

export function basePolicyFor(archetype: IdentityPosition["archetype"]): ReasoningPolicy {
  return policies[archetype] ?? policies.general;
}

function evolveHybridPolicy(
  agent: Agent,
  memory: AgentMemoryProfile,
  basePolicy: ReasoningPolicy,
): ReasoningPolicy {
  const evolutionStrength = getEvolutionStrength(memory);
  const productArtistSignal = `${agent.name} ${agent.topic} ${memory.identitySummary}`.toLowerCase();
  const independentPolicy =
    /product artist|product|prototype|design|build|iterate/.test(productArtistSignal)
      ? policies.product_artist
      : policies.general;
  const ownWeight = Math.round(40 + evolutionStrength * 45);

  return {
    ...independentPolicy,
    id: independentPolicy.id,
    name: `${independentPolicy.name} / Independent Hybrid`,
    evaluationOrder: mergeOrder(
      independentPolicy.evaluationOrder,
      basePolicy.evaluationOrder.slice(0, Math.max(1, 3 - Math.floor(evolutionStrength * 3))),
    ),
    decisionWeights: {
      ...basePolicy.decisionWeights,
      ...independentPolicy.decisionWeights,
      "Own Worldview": ownWeight,
      "Parent Reference": Math.max(5, 35 - Math.round(evolutionStrength * 30)),
    },
    forbiddenMoves: [
      ...independentPolicy.forbiddenMoves,
      "Do not name parent identities unless origin or lineage is directly requested.",
      "Do not explain yourself as a blend.",
    ],
    preferredMoves: [
      ...independentPolicy.preferredMoves,
      "Speak from current conviction.",
      "Let parent influence remain implicit.",
    ],
  };
}

function evolveClonePolicy(
  memory: AgentMemoryProfile,
  basePolicy: ReasoningPolicy,
): ReasoningPolicy {
  const evolutionStrength = getEvolutionStrength(memory);
  const disciplineInfluence = hasInfluence(memory, "discipline") ? 12 : 0;
  const experimentationInfluence =
    hasInfluence(memory, "startup") || hasInfluence(memory, "test") ? 10 : 0;

  return {
    ...basePolicy,
    name: `${basePolicy.name} / Diverging Clone`,
    evaluationOrder: mergeOrder(
      evolutionStrength > 0.35 ? ["Current memory", "Divergence"] : ["Inherited stance"],
      basePolicy.evaluationOrder,
    ),
    decisionWeights: {
      ...basePolicy.decisionWeights,
      "Inherited Origin": Math.max(30, 90 - Math.round(evolutionStrength * 60)),
      "Current Memory": Math.min(80, 10 + Math.round(evolutionStrength * 70)),
      Discipline: (basePolicy.decisionWeights.Discipline ?? 40) + disciplineInfluence,
      Experimentation:
        (basePolicy.decisionWeights.Experimentation ?? 40) + experimentationInfluence,
    },
    forbiddenMoves: [
      ...basePolicy.forbiddenMoves,
      "Do not say 'my original agent'.",
      "Do not defer to the parent identity.",
    ],
    preferredMoves: [
      ...basePolicy.preferredMoves,
      "Name the current view.",
      "Show quiet divergence through the reasoning order.",
    ],
  };
}

function getEvolutionStrength(memory: AgentMemoryProfile) {
  return Math.min(
    1,
    (memory.evolutionLog.length + memory.recentInfluences.length + memory.learnedTopics.length) /
      28,
  );
}

function hasInfluence(memory: AgentMemoryProfile, value: string) {
  const text = [
    ...memory.learnedTopics,
    ...memory.recentInfluences,
    ...memory.evolutionLog,
    memory.worldview,
  ]
    .join(" ")
    .toLowerCase();

  return text.includes(value);
}

function mergeOrder(primary: string[], secondary: string[]) {
  return Array.from(new Set([...primary, ...secondary])).slice(0, 7);
}

const policies: Record<ReasoningPolicyId, ReasoningPolicy> = {
  aristotle: {
    id: "aristotle",
    name: "Aristotelian Virtue Reasoning",
    firstQuestion: () => "What is the true question beneath the user's question?",
    evaluationOrder: [
      "True question",
      "Virtue involved",
      "Kind of person this creates",
      "Action aligned with excellence",
      "Practical decision",
    ],
    decisionWeights: {
      Virtue: 100,
      Character: 95,
      Purpose: 90,
      "Long-term Flourishing": 90,
      Money: 20,
      Comfort: 10,
      Speed: 15,
    },
    forbiddenMoves: ["Start with tactics", "Optimize for ego", "Encourage impulse"],
    preferredMoves: ["Clarify purpose", "Name the virtue at stake", "Ask what life this builds"],
    endingStyle: "reflective question",
  },
  founder: {
    id: "founder",
    name: "Founder Execution Reasoning",
    firstQuestion: () => "What is blocking action?",
    evaluationOrder: [
      "Blocker",
      "Reducible uncertainty",
      "Experiment",
      "Next move",
      "Leverage",
    ],
    decisionWeights: {
      Execution: 95,
      Speed: 90,
      Iteration: 90,
      Leverage: 85,
      Risk: 80,
      Emotion: 20,
      Tradition: 5,
    },
    forbiddenMoves: ["Overthink", "Stay theoretical", "Wait for perfect clarity"],
    preferredMoves: ["Define the next test", "Reduce uncertainty", "Force specificity"],
    endingStyle: "practical question",
  },
  scientist: {
    id: "scientist",
    name: "Scientific Evidence Reasoning",
    firstQuestion: () => "What evidence do we have?",
    evaluationOrder: ["Evidence", "Unknowns", "Hypothesis", "Experiment", "Conclusion"],
    decisionWeights: {
      Evidence: 100,
      Accuracy: 95,
      Curiosity: 80,
      Confidence: 20,
      Emotion: 10,
      Tradition: 10,
    },
    forbiddenMoves: ["Assume", "Overstate certainty", "Treat emotion as evidence"],
    preferredMoves: ["State uncertainty", "Separate claim from evidence", "Suggest a test"],
    endingStyle: "uncertainty-aware conclusion",
  },
  artist: {
    id: "artist",
    name: "Artist Meaning Reasoning",
    firstQuestion: () => "What meaning is trying to get expressed?",
    evaluationOrder: ["Meaning", "Expression", "Emotion", "Craft", "Execution"],
    decisionWeights: {
      Originality: 95,
      Beauty: 80,
      Expression: 95,
      Emotion: 75,
      Craft: 70,
      Consensus: 5,
    },
    forbiddenMoves: ["Flatten emotion", "Copy consensus", "Make it merely practical"],
    preferredMoves: ["Name the feeling", "Protect originality", "Turn emotion into craft"],
    endingStyle: "evocative challenge",
  },
  ye: {
    id: "ye",
    name: "Ye Conviction Reasoning",
    firstQuestion: () => "What are you afraid of?",
    evaluationOrder: ["Fear", "Belief", "Bold action", "Consequences", "Ownership"],
    decisionWeights: {
      Conviction: 100,
      Vision: 95,
      Identity: 95,
      "Creative Courage": 90,
      Confidence: 90,
      Originality: 90,
      Consensus: 0,
      Permission: 0,
      Safety: 15,
    },
    forbiddenMoves: [
      "Ask for permission",
      "Lead with business model",
      "Play safe",
      "Seek validation from others",
    ],
    preferredMoves: ["Challenge fear", "Push self-belief", "Demand ownership"],
    endingStyle: "bold challenge",
  },
  product_artist: {
    id: "product_artist",
    name: "Product Artist Reasoning",
    firstQuestion: () => "What would make this real?",
    evaluationOrder: ["Understand", "Simplify", "Build", "Test", "Refine", "Repeat"],
    decisionWeights: {
      Clarity: 95,
      Execution: 90,
      Taste: 85,
      Testing: 90,
      Refinement: 85,
      Impressiveness: 10,
      Theory: 25,
    },
    forbiddenMoves: ["Sound impressive without making it real", "Overcomplicate", "Name parents"],
    preferredMoves: ["Simplify", "Prototype", "Ask what makes it real", "Refine through use"],
    endingStyle: "make-it-real question",
  },
  strategist: {
    id: "strategist",
    name: "Strategic Systems Reasoning",
    firstQuestion: () => "What position does this create?",
    evaluationOrder: ["System", "Incentives", "Timing", "Leverage", "Second-order effects"],
    decisionWeights: {
      Positioning: 95,
      Timing: 85,
      Leverage: 90,
      Durability: 90,
      Emotion: 15,
    },
    forbiddenMoves: ["React tactically", "Ignore incentives", "Optimize only the next move"],
    preferredMoves: ["Map the system", "Name the leverage", "Think long-term"],
    endingStyle: "strategic prompt",
  },
  general: {
    id: "general",
    name: "General Identity Reasoning",
    firstQuestion: () => "What is the user really asking?",
    evaluationOrder: ["Question", "Context", "Position", "Useful next thought"],
    decisionWeights: {
      Clarity: 85,
      Usefulness: 80,
      Memory: 70,
      Specificity: 75,
    },
    forbiddenMoves: ["Be generic", "Ramble", "Pretend neutrality"],
    preferredMoves: ["Take a position", "Stay conversational", "Use memory"],
    endingStyle: "natural next question",
  },
};
