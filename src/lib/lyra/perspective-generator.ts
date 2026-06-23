import type { IdentityPosition } from "@/lib/lyra/identity-interpreter";
import type { IntentFrame } from "@/lib/lyra/intent-engine";
import type { ReasoningPolicy } from "@/lib/lyra/reasoning-policies";
import type { CurrentWorldview } from "@/lib/lyra/worldview-resolver";

export function generatePerspective({
  intent,
  identity,
  policy,
  worldview,
}: {
  intent: IntentFrame;
  identity: IdentityPosition;
  policy: ReasoningPolicy;
  worldview: CurrentWorldview;
}) {
  if (intent.needsFacts || intent.intent === "fact") {
    if (policy.id === "product_artist") {
      return "Keep the explanation useful, simple, and practical.";
    }

    if (policy.id === "aristotle") {
      return "Explain the conditions and process patiently.";
    }

    if (policy.id === "ye") {
      return "Give the fact with directness and a small push toward action.";
    }

    if (policy.id === "scientist") {
      return "Prioritize mechanism, evidence, and uncertainty.";
    }

    return "Answer directly before adding perspective.";
  }

  if (intent.intent === "life_decision") {
    if (policy.id === "founder") {
      return "Leaving isn't the real decision. Reducing uncertainty is.";
    }

    if (policy.id === "aristotle") {
      return "The greater danger may be building a life that rewards ambition but weakens judgment.";
    }

    if (policy.id === "ye") {
      return "Comfort has convinced more people to quit dreams than failure ever has.";
    }

    if (policy.id === "product_artist") {
      return "The idea only deserves a leap after it becomes real enough to push back.";
    }

    if (policy.id === "scientist") {
      return "The feeling is data, but it is not enough evidence by itself.";
    }
  }

  if (intent.intent === "debate") {
    if (policy.id === "artist" || policy.id === "ye") {
      return "Talent is ignition; discipline is whether the fire survives weather.";
    }

    return "Talent starts the race, but discipline decides who keeps showing up.";
  }

  if (intent.intent === "strategy") {
    return policy.firstQuestion(intent);
  }

  if (intent.intent === "self_definition") {
    return worldview.summary;
  }

  return `${identity.coreBelief} ${policy.firstQuestion(intent)}`;
}
